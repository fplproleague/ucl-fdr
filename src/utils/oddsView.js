// What the Odds tab shows, per team and matchday: expected goals for and
// against and the clean-sheet chance — from the bookmakers when they have
// priced the match (src/data/odds.js), otherwise estimated.
//
// The estimate is fitted to the bookmakers' own numbers in the archive, so
// it speaks the same language as the priced matches:
//
//   log(expected goals) = base + home·venue + strength·(own rating − opponent rating)
//                         + attack(team) + defence(opponent)
//
// venue is +1 at home and −1 away; the ratings are the site's 1–5 team
// ratings (with any overrides the user set). attack and defence are what
// the ratings miss — a team the bookmakers rate above its 1–5 band — shrunk
// towards 0 by SHRINK so one match only counts for a quarter. The clean-
// sheet chance is Poisson's chance of the opponent scoring nothing, lifted
// by how much the bookmakers' clean-sheet prices sit above Poisson.
import { FIXTURES } from '../data/fixtures.js'
import { median, playerRates } from './odds.js'

export const SHRINK = 3
// Before there is enough in the archive to fit: roughly what UCL odds say.
export const DEFAULT_FIT = { base: Math.log(1.55), home: 0.12, strength: 0.25 }
const MIN_FIT_MATCHES = 6

// Every priced match, by "md:team" for both sides.
export function indexOdds(odds) {
  const index = new Map()
  for (const m of Object.values(odds?.matches ?? {})) {
    if (m.md == null) continue
    const common = { md: m.md, date: m.date, bookmakers: m.bookmakers, updated: m.updated, players: m.players ?? {} }
    index.set(`${m.md}:${m.home}`, {
      ...common,
      team: m.home,
      opp: m.away,
      venue: 'H',
      xgFor: m.xg[0],
      xgAgainst: m.xg[1],
      cs: m.cs[0],
    })
    index.set(`${m.md}:${m.away}`, {
      ...common,
      team: m.away,
      opp: m.home,
      venue: 'A',
      xgFor: m.xg[1],
      xgAgainst: m.xg[0],
      cs: m.cs[1],
    })
  }
  return index
}

// Least squares for a small system: solves (XᵀX) b = Xᵀy.
function solve(rows, ys) {
  const n = rows[0].length
  const a = Array.from({ length: n }, (_, i) => [
    ...Array.from({ length: n }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
    rows.reduce((s, r, k) => s + r[i] * ys[k], 0),
  ])
  for (let col = 0; col < n; col++) {
    const pivot = a.slice(col).reduce((best, row, k) => (Math.abs(row[col]) > Math.abs(a[best][col]) ? col + k : best), col)
    if (Math.abs(a[pivot][col]) < 1e-9) return null
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = a[r][col] / a[col][col]
      for (let c = col; c <= n; c++) a[r][c] -= f * a[col][c]
    }
  }
  return a.map((row, i) => row[n] / row[i])
}

// The estimate, fitted to every priced match in the archive.
//   ratingOf(abbr) → the team's 1–5 rating
export function fitEstimator(odds, ratingOf) {
  const obs = []
  const lifts = []
  for (const m of Object.values(odds?.matches ?? {})) {
    if (!(m.xg?.[0] > 0 && m.xg?.[1] > 0)) continue
    obs.push({ team: m.home, opp: m.away, v: 1, y: Math.log(m.xg[0]) })
    obs.push({ team: m.away, opp: m.home, v: -1, y: Math.log(m.xg[1]) })
    if (m.cs?.[0] > 0) lifts.push(m.cs[0] / Math.exp(-m.xg[1]))
    if (m.cs?.[1] > 0) lifts.push(m.cs[1] / Math.exp(-m.xg[0]))
  }
  const diff = (o) => ratingOf(o.team) - ratingOf(o.opp)

  let fit = DEFAULT_FIT
  if (obs.length >= 2 * MIN_FIT_MATCHES) {
    const b = solve(
      obs.map((o) => [1, o.v, diff(o)]),
      obs.map((o) => o.y),
    )
    if (b && b.every(Number.isFinite)) fit = { base: b[0], home: b[1], strength: b[2] }
  }
  const baseLog = (o) => fit.base + fit.home * o.v + fit.strength * diff(o)

  const attack = {}
  const defence = {}
  const add = (bucket, key, e) => {
    const t = (bucket[key] ??= { sum: 0, n: 0 })
    t.sum += e
    t.n++
  }
  for (const o of obs) {
    const e = o.y - baseLog(o)
    add(attack, o.team, e)
    add(defence, o.opp, e)
  }
  const shrunk = (bucket, key) => (bucket[key] ? bucket[key].sum / (bucket[key].n + SHRINK) : 0)
  const csLift = Math.min(1.3, Math.max(1, median(lifts) ?? 1.05))

  const expectedGoals = (team, opp, v) =>
    Math.exp(baseLog({ team, opp, v }) + shrunk(attack, team) + shrunk(defence, opp))

  return {
    fit,
    csLift,
    matches: obs.length / 2,
    // One fixture from `team`'s side; venue 'H' or 'A'.
    estimate(team, opp, venue) {
      const v = venue === 'H' ? 1 : -1
      const xgFor = expectedGoals(team, opp, v)
      const xgAgainst = expectedGoals(opp, team, -v)
      return { xgFor, xgAgainst, cs: Math.min(0.9, Math.exp(-xgAgainst) * csLift) }
    },
  }
}

export const METRICS = {
  cs: { label: 'Clean sheet', short: 'CS', better: 'high', format: (x) => `${Math.round(x * 100)}%` },
  xgFor: { label: 'Goals for', short: 'xG for', better: 'high', format: (x) => x.toFixed(2) },
  xgAgainst: { label: 'Goals against', short: 'xG against', better: 'low', format: (x) => x.toFixed(2) },
}

// One row per team over the matchdays shown: a cell per matchday (priced
// or estimated, null without a fixture) and the average of the metric.
export function teamOddsRows(teams, mds, index, estimator, metric) {
  return teams.map((team) => {
    const cells = mds.map((md) => {
      const fixture = (FIXTURES[team.abbr] ?? []).find((f) => f.gw === md)
      if (!fixture) return null
      const priced = index.get(`${md}:${team.abbr}`)
      if (priced) return { ...priced, estimated: false }
      return { md, team: team.abbr, opp: fixture.opp, venue: fixture.venue, ...estimator.estimate(team.abbr, fixture.opp, fixture.venue), estimated: true }
    })
    const values = cells.filter(Boolean).map((c) => c[metric])
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
    return { team, cells, avg }
  })
}

// Best first for the metric: on the average over the matchdays shown, or
// on one matchday's cell (its index in the row) when one is picked.
export function compareRows(metric, cellIndex = null) {
  const sign = METRICS[metric].better === 'high' ? -1 : 1
  const value = (row) => (cellIndex == null ? row.avg : (row.cells[cellIndex]?.[metric] ?? null))
  return (a, b) => {
    const [va, vb] = [value(a), value(b)]
    return (va == null) - (vb == null) || sign * (va - vb) || a.team.name.localeCompare(b.team.name)
  }
}

// Each player's share of his team's expected goals, from every priced
// match he has prices in: expected goals and assists if he plays, divided
// by the team's expected goals. What his later matches are estimated from.
export function playerShares(index) {
  const sums = new Map()
  for (const match of index.values())
    for (const [id, odds] of Object.entries(match.players)) {
      const { xg, xa } = playerRates(odds)
      if (xg == null || !(match.xgFor > 0)) continue
      // Both sides' entries hold the match's players: each share is kept
      // with the side it was divided by, and playerOddsRows keeps only the
      // one for his club.
      const t = sums.get(id) ?? []
      t.push({ team: match.team, g: xg / match.xgFor, a: xa == null ? null : xa / match.xgFor })
      sums.set(id, t)
    }
  return sums
}

// One row per sheet player over the matchdays shown: per match his
// expected goals and assists if he plays — priced, or estimated from his
// share of his team's goals times the team's expected goals there — and
// his team's clean-sheet chance; and the totals over those matches.
//   A priced match with player prices that leave him out is skipped: the
//   bookmakers don't expect him to play.
export function playerOddsRows(players, mds, index, estimator) {
  const shares = playerShares(index)
  const rows = []
  for (const p of players) {
    const mine = (shares.get(p.id) ?? []).filter((s) => s.team === p.team)
    if (!mine.length) continue
    const avg = (key) => {
      const xs = mine.map((s) => s[key]).filter((x) => x != null)
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
    }
    const share = { g: avg('g'), a: avg('a') }

    const matches = []
    for (const md of mds) {
      const fixture = (FIXTURES[p.team] ?? []).find((f) => f.gw === md)
      if (!fixture) continue
      const priced = index.get(`${md}:${p.team}`)
      const odds = priced?.players[p.id]
      if (odds) {
        const { xg, xa } = playerRates(odds)
        matches.push({ md, opp: priced.opp, venue: priced.venue, xg, xa, cs: priced.cs, estimated: false })
        continue
      }
      if (priced && Object.keys(priced.players).length) continue // priced without him
      const team = priced ?? estimator.estimate(p.team, fixture.opp, fixture.venue)
      matches.push({
        md,
        opp: fixture.opp,
        venue: fixture.venue,
        xg: share.g * team.xgFor,
        xa: share.a == null ? null : share.a * team.xgFor,
        cs: team.cs,
        estimated: true,
      })
    }
    if (!matches.length) continue
    const sum = (key) => matches.reduce((s, m) => s + (m[key] ?? 0), 0)
    const xg = sum('xg')
    const xa = matches.some((m) => m.xa != null) ? sum('xa') : null
    rows.push({
      player: p,
      matches,
      xg,
      xa,
      xgi: xg + (xa ?? 0),
      cs: sum('cs'),
      estimated: matches.some((m) => m.estimated),
    })
  }
  return rows
}

// The 1–5 rating each team's priced matches point to, under the same model
// the estimates use: every priced match says how far a team's goals for
// (and its opponents' goals against it) sit from what the ratings predict,
// and that gap, divided by what one rating step is worth, moves its rating.
// Only for teams with priced matches; noisy with few, so `matches` comes
// along. Uses the ratings as set (ratingOf), so it answers "should this
// rating go up or down?".
export const IMPLIED_SHRINK = 4
export function impliedRatings(odds, ratingOf) {
  const est = fitEstimator(odds, ratingOf)
  const { base, home, strength } = est.fit
  if (!(strength > 0.05)) return {}
  const sums = {}
  const add = (team, r) => {
    const t = (sums[team] ??= { sum: 0, n: 0 })
    t.sum += r
    t.n++
  }
  const matches = {}
  for (const m of Object.values(odds?.matches ?? {})) {
    if (!(m.xg?.[0] > 0 && m.xg?.[1] > 0)) continue
    for (const [team, opp, v, xg] of [
      [m.home, m.away, 1, m.xg[0]],
      [m.away, m.home, -1, m.xg[1]],
    ]) {
      const gap = (Math.log(xg) - base - home * v) / strength // = rating(team) − rating(opp)
      add(team, ratingOf(opp) + gap)
      add(opp, ratingOf(team) - gap)
    }
    matches[m.home] = (matches[m.home] ?? 0) + 1
    matches[m.away] = (matches[m.away] ?? 0) + 1
  }
  // Pulled towards the rating as set until the matches pile up: one match
  // (two readings) moves it a third of the way, four matches two thirds.
  return Object.fromEntries(
    Object.entries(sums).map(([team, t]) => {
      const raw = t.sum / t.n
      const r = ratingOf(team)
      const rating = r + ((raw - r) * t.n) / (t.n + IMPLIED_SHRINK)
      return [team, { rating: Math.min(5, Math.max(1, rating)), matches: matches[team] ?? 0 }]
    }),
  )
}
