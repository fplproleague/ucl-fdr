import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_FIT, XG_CAP_FLOOR, XG_CAP_MARGIN, compareRows, fitEstimator, indexOdds, playerOddsRows, teamOddsRows } from '../src/utils/oddsView.js'
import { FIXTURES } from '../src/data/fixtures.js'

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`)

// Made-up odds that follow the model exactly: log xG = 0.4 + 0.15·venue +
// 0.2·(Elo gap / 100), clean sheets 10% above Poisson. Elo saved with them.
const ratings = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 3, G: 4, H: 2 }
const elo = Object.fromEntries(Object.entries(ratings).map(([t, r]) => [t, 1500 + 100 * r]))
const truth = (t, o, v) => Math.exp(0.4 + 0.15 * v + 0.2 * ((elo[t] - elo[o]) / 100))
const pairs = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['B', 'C'], ['D', 'E'], ['F', 'G'], ['H', 'A'], ['A', 'E'], ['C', 'G']]
const odds = {
  elo: { date: '2026-11-04', teams: elo },
  matches: Object.fromEntries(
    pairs.map(([h, a], i) => {
      const xg = [truth(h, a, 1), truth(a, h, -1)]
      return [String(i), { md: i + 1, home: h, away: a, xg, cs: [Math.exp(-xg[1]) * 1.1, Math.exp(-xg[0]) * 1.1], players: { p1: [2, 1.5] } }]
    }),
  ),
}

test('the estimate recovers the model the odds follow, from Elo', () => {
  const est = fitEstimator(odds)
  near(est.fit.base, 0.4, 1e-6, 'base')
  near(est.fit.home, 0.15, 1e-6, 'home')
  near(est.fit.elo, 0.2, 1e-6, 'elo')
  assert.equal(est.usesElo, true)
  near(est.csLift, 1.1, 1e-6, 'clean-sheet lift')
  const e = est.estimate('A', 'D', 'A')
  near(e.xgFor, truth('A', 'D', -1), 1e-6, 'xG for')
  near(e.xgAgainst, truth('D', 'A', 1), 1e-6, 'xG against')
  near(e.cs, Math.exp(-e.xgAgainst) * 1.1, 1e-6, 'clean sheet')
})

test('without Elo the odds alone tell the teams apart', () => {
  const noElo = { matches: odds.matches }
  const est = fitEstimator(noElo)
  assert.equal(est.usesElo, false)
  assert.equal(est.fit.elo, 0)
  // A (strongest) scores more than E (weakest) against the same opponent.
  assert.ok(est.estimate('A', 'C', 'H').xgFor > est.estimate('E', 'C', 'H').xgFor)
  assert.ok(est.strength('A') > est.strength('E'))
})

test('the 1–5 ratings play no part: the estimate only takes the odds', () => {
  assert.equal(fitEstimator.length, 1)
})

test('too few priced matches: the default fit', () => {
  const few = { matches: Object.fromEntries(Object.entries(odds.matches).slice(0, 3)) }
  assert.deepEqual(fitEstimator(few).fit, DEFAULT_FIT)
  assert.deepEqual(fitEstimator({ matches: {} }).fit, DEFAULT_FIT)
})

test('a team the odds rate above its Elo gets part of that, shrunk', () => {
  const boosted = structuredClone(odds)
  boosted.matches['0'].xg[0] *= Math.exp(0.8) // A scores far more than its Elo says
  const lift = Math.log(fitEstimator(boosted).estimate('A', 'C', 'H').xgFor / fitEstimator(odds).estimate('A', 'C', 'H').xgFor)
  assert.ok(lift > 0.05 && lift < 0.6, `lift ${lift}`)
})

test('both sides of a priced match are indexed', () => {
  const index = indexOdds(odds)
  assert.equal(index.get('1:A').opp, 'B')
  assert.equal(index.get('1:A').venue, 'H')
  assert.equal(index.get('1:B').venue, 'A')
  assert.equal(index.get('1:B').xgFor, odds.matches['0'].xg[1])
  assert.equal(index.get('1:B').cs, odds.matches['0'].cs[1])
})

test('team rows: priced where possible, estimated elsewhere, sorted by the metric', () => {
  const [ars, bay] = ['ARS', 'BAY']
  const md = FIXTURES[ars][0].gw
  const opp = FIXTURES[ars][0].opp
  const venue = FIXTURES[ars][0].venue
  const priced = { matches: { 1: { md, home: venue === 'H' ? ars : opp, away: venue === 'H' ? opp : ars, xg: [1.5, 1.5], cs: [0.3, 0.3] } } }
  const est = fitEstimator(priced)
  const teams = [{ abbr: ars, name: 'Arsenal' }, { abbr: bay, name: 'Bayern' }]
  const rows = teamOddsRows(teams, [md, md + 1], indexOdds(priced), est, 'cs')
  assert.equal(rows[0].cells[0].estimated, false)
  assert.equal(rows[0].cells[0].cs, 0.3)
  assert.equal(rows[0].cells[1].estimated, true)
  assert.equal(rows[1].cells[0].estimated, true)
  near(rows[0].avg, (0.3 + rows[0].cells[1].cs) / 2, 1e-9, 'average')
  const sorted = [...rows].sort(compareRows('xgAgainst'))
  assert.ok(sorted[0].avg <= sorted[1].avg)
})

test('player rows: priced where he has prices, else his share of the team estimate', () => {
  const index = indexOdds(odds)
  const est = fitEstimator(odds)
  // p1 is priced for every match in `odds`; FIXTURES decide which clubs
  // play which matchday, so use made-up clubs with no fixtures: no rows.
  assert.deepEqual(playerOddsRows([{ id: 'p1', team: 'A' }], [1, 2], index, est), [])
})

test('player rows over real fixtures: estimates follow the team, skipped when priced without him', () => {
  const ars = FIXTURES.ARS
  const [f1, f2, f3] = ars
  const side = (f, xg) => (f.venue === 'H' ? { home: 'ARS', away: f.opp, xg: [xg, 1] } : { home: f.opp, away: 'ARS', xg: [1, xg] })
  const archive = {
    matches: {
      1: { md: f1.gw, ...side(f1, 2), cs: [0.3, 0.3], players: { saka: [2, 1.5], other: [3, 2] } },
      // Priced with player markets, but without saka: the bookmakers don't expect him to play.
      2: { md: f2.gw, ...side(f2, 1.5), cs: [0.3, 0.3], players: { other: [3, 2] } },
    },
  }
  const index = indexOdds(archive)
  const est = fitEstimator(archive)
  const [row] = playerOddsRows([{ id: 'saka', team: 'ARS' }], [f1.gw, f2.gw, f3.gw], index, est)
  assert.deepEqual(row.matches.map((m) => m.md), [f1.gw, f3.gw])
  assert.equal(row.matches[0].estimated, false)
  assert.equal(row.matches[1].estimated, true)
  const priced = row.matches[0]
  const share = priced.xg / 2
  const team3 = est.estimate('ARS', f3.opp, f3.venue)
  near(row.matches[1].xg, share * team3.xgFor, 1e-9, 'estimated xG = share × team xG')
  near(row.xg, priced.xg + row.matches[1].xg, 1e-9, 'total')
  near(row.cs, 0.3 + team3.cs, 1e-9, 'expected clean sheets')
  assert.equal(row.estimated, true)
})

test('sorting on one matchday instead of the average', () => {
  const rows = [
    { team: { name: 'A' }, avg: 0.4, cells: [{ cs: 0.1 }, { cs: 0.7 }] },
    { team: { name: 'B' }, avg: 0.3, cells: [{ cs: 0.5 }, null] },
  ]
  assert.deepEqual([...rows].sort(compareRows('cs')).map((r) => r.team.name), ['A', 'B'])
  assert.deepEqual([...rows].sort(compareRows('cs', 0)).map((r) => r.team.name), ['B', 'A'])
  // No fixture that matchday: last.
  assert.deepEqual([...rows].sort(compareRows('cs', 1)).map((r) => r.team.name), ['A', 'B'])
  assert.deepEqual([...rows].sort(compareRows('xgAgainst', 0)).map((r) => r.team.name), ['A', 'B'])
})

test('implied ratings: teams ranked on the odds, in bands the size of the seeded ones', async () => {
  const { impliedRatings } = await import('../src/utils/oddsView.js')
  const imp = impliedRatings(odds, ratings)
  // The odds follow Elo, which follows the ratings: the bands come back.
  assert.equal(imp.A.rating, 5)
  assert.equal(imp.E.rating, 1)
  assert.deepEqual(
    Object.values(imp).map((v) => v.rating).sort(),
    Object.values(ratings).sort(),
  )
  assert.deepEqual(impliedRatings({ matches: {} }, ratings), {})
})

test('Elo gaps wider than the priced matches have shown are capped', () => {
  const wide = structuredClone(odds)
  wide.elo.teams = { ...wide.elo.teams, Z: 500 } // 1,500+ points below everyone
  const est = fitEstimator(wide)
  const capped = est.estimate('A', 'Z', 'H').xgFor
  // No wider than the widest priced gap (A–E, 400 points; at least 300).
  near(capped, est.estimate('A', 'Y', 'H').xgFor * Math.exp(est.fit.elo * 4), 1e-6, 'capped at the widest priced gap')
})

test('no estimate goes past the most the bookmakers have priced', () => {
  const lopsided = structuredClone(odds)
  lopsided.elo.teams = { ...lopsided.elo.teams, Z: 500 }
  const est = fitEstimator(lopsided)
  const top = Math.max(...Object.values(lopsided.matches).flatMap((m) => m.xg))
  near(est.xgCap, Math.max(XG_CAP_FLOOR, XG_CAP_MARGIN * top), 1e-9, 'cap')
  for (const t of Object.keys(lopsided.elo.teams))
    for (const u of Object.keys(lopsided.elo.teams))
      if (t !== u) assert.ok(est.estimate(t, u, 'H').xgFor <= est.xgCap + 1e-9, `${t}-${u}`)
})

test('the live data: Arsenal–Sabah stays within what the odds have shown', async () => {
  const { ODDS } = await import('../src/data/odds.js')
  const est = fitEstimator(ODDS)
  const top = Math.max(...Object.values(ODDS.matches).flatMap((m) => m.xg))
  assert.ok(est.estimate('ARS', 'SAB', 'H').xgFor <= Math.max(XG_CAP_FLOOR, XG_CAP_MARGIN * top) + 1e-9)
})
