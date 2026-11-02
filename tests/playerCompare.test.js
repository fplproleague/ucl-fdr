import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bestOf, compareRows, per90, winCounts } from '../src/utils/playerCompare.js'
import { buildHash, parseHash } from '../src/utils/urlState.js'

const player = (over) => ({
  id: 'x',
  position: 'MID',
  price: 7,
  score: 50,
  valueScore: 50,
  rawPpm: 5,
  minutes: 270,
  minutesShare: 1,
  fixtureAvg: 3,
  stats: { goals: 1, assists: 1, cleanSheets: 1, ballsRecovered: 6, potm: 0 },
  ...over,
})

test('best value: highest or lowest, ties share it, all-equal or single values pick nobody', () => {
  assert.deepEqual([...bestOf([3, 5, 5, null], 'high')], [1, 2])
  assert.deepEqual([...bestOf([7.5, 6, 9], 'low')], [1])
  assert.deepEqual([...bestOf([4, 4], 'high')], [])
  assert.deepEqual([...bestOf([4, null], 'high')], [])
  assert.deepEqual([...bestOf([1, 2], null)], [])
})

test('per 90 only from 90 minutes up', () => {
  assert.equal(per90(2, 180), 1)
  assert.equal(per90(1, 20), null)
  assert.equal(per90(undefined, 300), null)
})

test('comparison rows: who is best where, per 90 rates, and rows nobody has are left out', () => {
  const a = player({
    id: 'a',
    score: 100,
    price: 9,
    stats: { goals: 3, assists: 0, cleanSheets: 2, ballsRecovered: 3, potm: 1 },
  })
  const b = player({
    id: 'b',
    position: 'FWD',
    score: 80,
    price: 6,
    minutes: 90,
    minutesShare: 0.33,
    stats: { goals: 2, assists: 1, cleanSheets: 0, ballsRecovered: 0, potm: 0 },
  })
  const rows = compareRows([a, b])
  const row = (label, group = 'Overview') => rows.find((r) => r.label === label && r.group === group)

  assert.deepEqual([...row('Score').best], [0])
  assert.deepEqual([...row('Price €m').best], [1]) // cheaper is better
  assert.equal(row('Price €m').bars, null) // no "longer = better" bar for price
  // 3 goals in 270' = 1.00 per 90; 2 in 90' = 2.00 per 90: the rate wins, not the total.
  const goals = row('Goals per 90', 'UCL')
  assert.deepEqual(goals.text, ['1.00', '2.00'])
  assert.deepEqual(goals.subs, ['3 total', '2 total'])
  assert.deepEqual([...goals.best], [1])
  assert.deepEqual(goals.bars, [50, 100])
  // Clean sheets don't count for a forward; saves only for a keeper (nobody here).
  assert.deepEqual(row('Clean sheets', 'UCL').values, [2, null])
  assert.equal(
    rows.some((r) => r.label === 'Saves per 90'),
    false,
  )
  // No domestic data for either: the league rows are left out entirely.
  assert.equal(
    rows.some((r) => r.group.startsWith('League')),
    false,
  )
  const wins = winCounts(rows, 2)
  assert.equal(wins.length, 2)
  assert.ok(wins[0] > 0 && wins[1] > 0)
})

test('league rows come from the domestic summary', () => {
  const dom = { matches: 5, apps: 5, minutes: 450, goals: 3, assists: 2, ga90: 1, points: 40 }
  const rows = compareRows([player({ id: 'a', dom }), player({ id: 'b' })], { domesticMatches: 5 })
  const ppm = rows.find((r) => r.group === 'League · last 5' && r.label === 'Points per match')
  assert.deepEqual(ppm.values, [8, null])
  assert.equal(rows.find((r) => r.group === 'League · last 5' && r.label === 'Minutes').subs[0], '450/450')
})

test('the comparison rides along in the Players link, capped at 5 and cleaned', () => {
  const hash = buildHash({ tab: 'players', players: ['p1', 'p2'] })
  assert.equal(hash, '#/players?cmp=p1%2Cp2')
  assert.deepEqual(parseHash(hash).players, ['p1', 'p2'])
  assert.deepEqual(parseHash('#/players?cmp=a,b,a,c,d,e,f').players, ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(parseHash('#/players?cmp=ok,<script>').players, ['ok'])
  // Only on the Players tab.
  assert.equal(buildHash({ tab: 'table', players: ['p1'] }), '#/table')
})
