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

test('league rows come from the domestic summary, and every one can be opened match by match', () => {
  const domestic = [
    { d: '2026-10-25', opp: 'Union Berlin', v: 'H', gc: 0, min: 90, g: 1, a: 1 },
    { d: '2026-11-01', opp: 'Mainz', v: 'A', gc: 2, min: 0, g: 0, a: 0 },
  ]
  const dom = { matches: 2, apps: 1, minutes: 90, goals: 1, assists: 1, ga90: 2, points: 13 }
  const rows = compareRows([player({ id: 'a', position: 'DEF', dom, domestic }), player({ id: 'b' })], {
    domesticMatches: 2,
  })
  const row = (label) => rows.find((r) => r.group === 'League · last 2' && r.label === label)
  // No league Fantasy points exist: no estimated points row in the comparison.
  assert.equal(row('Points per match'), undefined)
  assert.equal(row('Minutes').subs[0], '90/180')
  // Clean sheets: counted from the matches (60+ minutes, nothing conceded).
  assert.deepEqual(row('Clean sheets').values, [1, null])
  const cs = row('Clean sheets').breakdown[0]
  assert.deepEqual(
    cs.map((m) => [m.label, m.sub, m.value, m.hit]),
    [
      ['v Union Berlin', '90′', 'Clean sheet', true],
      ['@ Mainz', 'didn’t play', '–', false],
    ],
  )
  assert.equal(row('Clean sheets').breakdown[1], null)
  assert.deepEqual(
    row('G+A per 90').breakdown[0].map((m) => m.value),
    ['1G 1A', '–'],
  )
  // A file from before shots were fetched: no shots row at all, not zeros.
  assert.equal(row('Shots per 90'), undefined)
})

test('UCL rows open by matchday when the UCL matches are saved; season totals alone stay closed', () => {
  const uclGames = [
    { md: 1, d: '2026-09-09', opp: 'Arsenal', v: 'A', gc: 0, min: 90, g: 0, a: 1, sh: 3, kp: 2 },
    { md: 2, d: '2026-10-14', opp: 'PSV', v: 'H', gc: 1, min: 75, g: 2, a: 0, sh: 5, kp: 1 },
  ]
  const form = [
    { md: 1, points: 9 },
    { md: 2, points: 13 },
  ]
  const a = player({ id: 'a', minutes: 165, stats: { goals: 2, assists: 1, cleanSheets: 1 }, uclGames, form })
  const b = player({ id: 'b', form: [{ md: 1, points: 2 }] })
  const rows = compareRows([a, b])
  const row = (label) => rows.find((r) => r.group === 'UCL' && r.label === label)
  assert.deepEqual(
    row('Goals per 90').breakdown[0].map((m) => [m.label, m.value, m.hit]),
    [
      ['MD1 @ Arsenal', '–', false],
      ['MD2 v PSV', '2 goals', true],
    ],
  )
  assert.equal(row('Goals per 90').breakdown[1], null) // b: totals only
  assert.deepEqual(
    row('Fantasy pts per match').breakdown[0].map((m) => m.label),
    ['MD1 @ Arsenal', 'MD2 v PSV'],
  )
  assert.deepEqual(
    row('Fantasy pts per match').breakdown[1].map((m) => m.label),
    ['MD1'],
  )
  // Shots per 90 from the saved matches: 8 in 165'.
  assert.equal(row('Shots per 90').text[0], ((8 / 165) * 90).toFixed(1))
  assert.equal(row('Shots per 90').text[1], '–')
  // Balls recovered has no per-match data anywhere: never opens.
  assert.equal(row('Balls recovered per 90').breakdown, null)
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

test('the comparison has bookmaker odds rows when the players have odds', async () => {
  const { compareRows: rowsFor } = await import('../src/utils/playerCompare.js')
  const odds = (xg, xa, cs, estimated) => ({ xg, xa, xgi: xg + xa, cs, matches: [{ md: 5, opp: 'ARS', venue: 'H', xg, xa, cs, estimated }] })
  const a = { id: 'a', position: 'MID', price: 8, score: 60, valueScore: 50, odds: odds(0.5, 0.3, 0.3, false) }
  const b = { id: 'b', position: 'FWD', price: 9, score: 70, valueScore: 55, odds: odds(0.8, 0.1, 0.2, true) }
  const rows = rowsFor([a, b])
  const ga = rows.find((r) => r.label === 'Expected goals + assists')
  assert.deepEqual(ga.text, ['0.80', '0.90'])
  assert.deepEqual([...ga.best], [1])
  assert.equal(ga.breakdown[0][0].sub, 'odds')
  assert.equal(ga.breakdown[1][0].sub, 'estimate')
  // A forward has no clean-sheet row value.
  const cs = rows.find((r) => r.label === 'Expected clean sheets')
  assert.deepEqual(cs.text, ['0.3', '–'])
  // Without odds the rows disappear.
  assert.equal(rowsFor([{ ...a, odds: null }, { ...b, odds: null }]).some((r) => r.group === 'Bookmaker odds'), false)
})
