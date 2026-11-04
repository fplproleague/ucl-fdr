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

export function compareRows(metric) {
  const sign = METRICS[metric].better === 'high' ? -1 : 1
  return (a, b) => (a.avg == null) - (b.avg == null) || sign * (a.avg - b.avg) || a.team.name.localeCompare(b.team.name)
}

// One row per sheet player per priced match in the matchdays shown:
// expected goals and assists if he plays, his chance of scoring, and his
// team's clean-sheet chance.
export function playerOddsRows(players, mds, index) {
  const rows = []
  for (const p of players) {
    for (const md of mds) {
      const match = index.get(`${md}:${p.team}`)
      const odds = match?.players[p.id]
      if (!odds) continue
      const { xg, xa } = playerRates(odds)
      if (xg == null) continue
      rows.push({
        player: p,
        md,
        opp: match.opp,
        venue: match.venue,
        xg,
        xa,
        xgi: xg + (xa ?? 0),
        pGoal: 1 - Math.exp(-xg),
        cs: match.cs,
      })
    }
  }
  return rows
}
