// What the Odds tab shows, per team and matchday: expected goals for and
// against and the clean-sheet chance — from the bookmakers when they have
// priced the match (src/data/odds.js), otherwise estimated.
//
// The estimate never uses the site's 1–5 ratings (they're opinions, and
// anyone can change them). It is fitted to the bookmakers' own numbers in
// the archive, so it speaks the same language as the priced matches:
//
//   log(expected goals) = base + home·venue + elo·(own Elo − opponent Elo)/100
//                         + attack(team) + defence(opponent)
//
// venue is +1 at home and −1 away. Elo is each club's rating from
// clubelo.com, saved with the odds (when it isn't there, that term drops
// out). attack and defence are what Elo misses, or everything when there is
// no Elo: fitted to the priced matches together, so a team isn't marked
// down for having just played Bayern, and shrunk towards 0 (SHRINK) so one
// match only counts for half (a quarter without Elo). The clean-sheet chance is Poisson's chance of
// the opponent scoring nothing, lifted by how much the bookmakers' clean-
// sheet prices sit above Poisson.
import { FIXTURES } from '../data/fixtures.js'
import { median, playerRates } from './odds.js'

// How far one match moves a team's attack or defence: by half with Elo
// underneath, by a quarter without (one match is all the odds have to go on
// then, and an estimate that swings on it misleads more than a flat one).
export const SHRINK = 1
export const SHRINK_WITHOUT_ELO = 3
// Before there is enough in the archive to fit: roughly what UCL odds say
// (one Elo point is worth about as much in goals as it is in results).
export const DEFAULT_FIT = { base: Math.log(1.45), home: 0.12, elo: 0.17 }
const MIN_FIT_MATCHES = 6
const RIDGE_ROUNDS = 30

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

// Each club's Elo from the archive, or null without one.
const eloOf = (odds) => {
  const teams = odds?.elo?.teams ?? {}
  return (abbr) => (Number.isFinite(teams[abbr]) ? teams[abbr] : null)
}

// The estimate, fitted to every priced match in the archive (and the Elo
// saved with it).
export function fitEstimator(odds) {
  const elo = eloOf(odds)
  const rawGap = (team, opp) => (elo(team) != null && elo(opp) != null ? (elo(team) - elo(opp)) / 100 : null)
  // Elo gaps only as wide as the priced matches have shown (at least 300
  // points): past that the fit would be guessing, and a straight line
  // through log-goals runs away (Bayern–Sabah, 477 apart, came out at 5.8).
  const gapCap = Math.max(
    3,
    ...Object.values(odds?.matches ?? {}).map((m) => Math.abs(rawGap(m.home, m.away) ?? 0)),
  )
  const eloGap = (team, opp) => {
    const g = rawGap(team, opp)
    return g == null ? null : Math.max(-gapCap, Math.min(gapCap, g))
  }
  const obs = []
  const lifts = []
  for (const m of Object.values(odds?.matches ?? {})) {
    if (!(m.xg?.[0] > 0 && m.xg?.[1] > 0)) continue
    obs.push({ team: m.home, opp: m.away, v: 1, y: Math.log(m.xg[0]), e: eloGap(m.home, m.away) })
    obs.push({ team: m.away, opp: m.home, v: -1, y: Math.log(m.xg[1]), e: eloGap(m.away, m.home) })
    if (m.cs?.[0] > 0) lifts.push(m.cs[0] / Math.exp(-m.xg[1]))
    if (m.cs?.[1] > 0) lifts.push(m.cs[1] / Math.exp(-m.xg[0]))
  }

  // base, home and the Elo weight, by least squares; Elo only when most
  // matches have it for both sides.
  const withElo = obs.filter((o) => o.e != null)
  const useElo = withElo.length >= Math.max(2 * MIN_FIT_MATCHES, obs.length * 0.75)
  let fit = { ...DEFAULT_FIT, elo: useElo || obs.length < 2 * MIN_FIT_MATCHES ? DEFAULT_FIT.elo : 0 }
  if (obs.length >= 2 * MIN_FIT_MATCHES) {
    const b = useElo
      ? solve(
          withElo.map((o) => [1, o.v, o.e]),
          withElo.map((o) => o.y),
        )
      : solve(
          obs.map((o) => [1, o.v]),
          obs.map((o) => o.y),
        )
    if (b && b.every(Number.isFinite)) fit = { base: b[0], home: b[1], elo: useElo ? Math.max(0, b[2]) : 0 }
  }
  const baseLog = (team, opp, v) => fit.base + fit.home * v + fit.elo * (eloGap(team, opp) ?? 0)
  const shrink = fit.elo > 0 && withElo.length ? SHRINK : SHRINK_WITHOUT_ELO

  // attack and defence together (ridge regression, solved round by round):
  // each team's attack is what its goals say once its opponents' defences
  // are accounted for, and the other way round.
  const attack = {}
  const defence = {}
  for (let round = 0; round < RIDGE_ROUNDS; round++) {
    const sums = { a: {}, d: {} }
    const add = (bucket, key, x) => {
      const t = (bucket[key] ??= { sum: 0, n: 0 })
      t.sum += x
      t.n++
    }
    for (const o of obs) {
      const rest = o.y - baseLog(o.team, o.opp, o.v)
      add(sums.a, o.team, rest - (defence[o.opp] ?? 0))
      add(sums.d, o.opp, rest - (attack[o.team] ?? 0))
    }
    for (const [k, t] of Object.entries(sums.a)) attack[k] = t.sum / (t.n + shrink)
    for (const [k, t] of Object.entries(sums.d)) defence[k] = t.sum / (t.n + shrink)
  }
  const csLift = Math.min(1.3, Math.max(1, median(lifts) ?? 1.05))

  const expectedGoals = (team, opp, v) => Math.exp(baseLog(team, opp, v) + (attack[team] ?? 0) + (defence[opp] ?? 0))
  const meanElo = (() => {
    const xs = Object.values(odds?.elo?.teams ?? {}).filter(Number.isFinite)
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
  })()

  return {
    fit,
    csLift,
    matches: obs.length / 2,
    usesElo: fit.elo > 0 && Object.keys(odds?.elo?.teams ?? {}).length > 0,
    // One fixture from `team`'s side; venue 'H' or 'A'.
    estimate(team, opp, venue) {
      const v = venue === 'H' ? 1 : -1
      const xgFor = expectedGoals(team, opp, v)
      const xgAgainst = expectedGoals(opp, team, -v)
      return { xgFor, xgAgainst, cs: Math.min(0.9, Math.exp(-xgAgainst) * csLift) }
    },
    // How strong a team is overall, in log-goals: its attack, minus how
    // leaky its defence is, plus its Elo's worth at both ends.
    strength(team) {
      const e = elo(team) != null && meanElo != null ? (2 * fit.elo * (elo(team) - meanElo)) / 100 : 0
      return (attack[team] ?? 0) - (defence[team] ?? 0) + e
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

// Where the bookmakers (and Elo) would put each team on the 1–5 scale:
// teams ranked on the estimate's strength, then cut into bands of the same
// sizes as the seeded ratings (eight 5s, nine 4s, …). Ratings as anyone has
// set them play no part. Only once matches are priced.
//   seedRatings: the seeded 1–5 rating per team, for the band sizes only
export function impliedRatings(odds, seedRatings) {
  const est = fitEstimator(odds)
  if (!est.matches) return {}
  const teams = Object.keys(seedRatings)
  const bands = Object.values(seedRatings).sort((x, y) => y - x)
  const ranked = [...teams].sort((x, y) => est.strength(y) - est.strength(x))
  return Object.fromEntries(ranked.map((team, i) => [team, { rating: bands[i], matches: est.matches }]))
}
