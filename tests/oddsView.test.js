import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_FIT, compareRows, fitEstimator, indexOdds, playerOddsRows, teamOddsRows } from '../src/utils/oddsView.js'
import { FIXTURES } from '../src/data/fixtures.js'

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`)

// Made-up odds that follow the model exactly: log xG = 0.4 + 0.15·venue +
// 0.2·(rating difference), clean sheets 10% above Poisson.
const ratings = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 3, G: 4, H: 2 }
const truth = (t, o, v) => Math.exp(0.4 + 0.15 * v + 0.2 * (ratings[t] - ratings[o]))
const pairs = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['B', 'C'], ['D', 'E'], ['F', 'G'], ['H', 'A'], ['A', 'E'], ['C', 'G']]
const odds = {
  matches: Object.fromEntries(
    pairs.map(([h, a], i) => {
      const xg = [truth(h, a, 1), truth(a, h, -1)]
      return [String(i), { md: i + 1, home: h, away: a, xg, cs: [Math.exp(-xg[1]) * 1.1, Math.exp(-xg[0]) * 1.1], players: { p1: [2, 1.5] } }]
    }),
  ),
}

test('the estimate recovers the model the odds follow', () => {
  const est = fitEstimator(odds, (t) => ratings[t])
  near(est.fit.base, 0.4, 1e-6, 'base')
  near(est.fit.home, 0.15, 1e-6, 'home')
  near(est.fit.strength, 0.2, 1e-6, 'strength')
  near(est.csLift, 1.1, 1e-6, 'clean-sheet lift')
  const e = est.estimate('A', 'D', 'A')
  near(e.xgFor, truth('A', 'D', -1), 1e-6, 'xG for')
  near(e.xgAgainst, truth('D', 'A', 1), 1e-6, 'xG against')
  near(e.cs, Math.exp(-e.xgAgainst) * 1.1, 1e-6, 'clean sheet')
})

test('too few priced matches: the default fit', () => {
  const few = { matches: Object.fromEntries(Object.entries(odds.matches).slice(0, 3)) }
  assert.deepEqual(fitEstimator(few, (t) => ratings[t]).fit, DEFAULT_FIT)
  assert.deepEqual(fitEstimator({ matches: {} }, () => 3).fit, DEFAULT_FIT)
})

test('a team the odds rate above its band gets part of that, shrunk', () => {
  const boosted = structuredClone(odds)
  boosted.matches['0'].xg[0] *= Math.exp(0.8) // A scores far more than its rating says
  const est = fitEstimator(boosted, (t) => ratings[t])
  const plain = fitEstimator(odds, (t) => ratings[t])
  const lift = Math.log(est.estimate('A', 'C', 'H').xgFor / plain.estimate('A', 'C', 'H').xgFor)
  assert.ok(lift > 0.05 && lift < 0.4, `lift ${lift}`)
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
  const est = fitEstimator(priced, () => 3)
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

test('player rows come from the priced matches only', () => {
  const index = indexOdds(odds)
  const rows = playerOddsRows([{ id: 'p1', team: 'A' }, { id: 'p2', team: 'A' }], [1, 2], index)
  assert.equal(rows.length, 1) // A plays at md 1 (A–B); md 2 is C–D
  assert.equal(rows[0].md, 1)
  near(rows[0].pGoal, 1 - Math.exp(-rows[0].xg), 1e-9, 'goal chance')
})
