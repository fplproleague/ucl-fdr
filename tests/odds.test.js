import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BET,
  devig,
  fitFromResult,
  lambdaFromOver,
  playerNumbers,
  poissonOver,
  teamNumbers,
} from '../src/utils/odds.js'

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`)

const ou = (pairs) =>
  pairs.flatMap(([line, over, under]) => [
    { value: `Over ${line}`, odd: String(over) },
    { value: `Under ${line}`, odd: String(under) },
  ])

// Bet365's prices for MD4's AEK – Real Madrid (from the odds probe).
const bet365 = {
  id: 8,
  name: 'Bet365',
  bets: [
    { id: BET.matchWinner, values: [{ value: 'Home', odd: '13.00' }, { value: 'Draw', odd: '7.50' }, { value: 'Away', odd: '1.18' }] },
    { id: BET.goalsOverUnder, values: ou([[1.5, 1.08, 8], [2.5, 1.28, 3.75], [3.5, 1.73, 2.1]]) },
    { id: BET.totalHome, values: ou([[0.5, 1.62, 2.2], [1.5, 4, 1.22], [2.5, 13, 1.04]]) },
    { id: BET.totalAway, values: ou([[0.5, 1.02, 17], [1.5, 1.18, 4.5], [2.5, 1.62, 2.2], [3.5, 2.62, 1.44], [4.5, 4.5, 1.18]]) },
    { id: BET.cleanSheetHome, values: [{ value: 'Yes', odd: '15.00' }, { value: 'No', odd: '1.03' }] },
    { id: BET.cleanSheetAway, values: [{ value: 'Yes', odd: '2.25' }, { value: 'No', odd: '1.57' }] },
    {
      id: BET.anytimeScorer,
      values: [
        { value: 'Kylian Mbappe', odd: '1.36' },
        { value: 'Arda Guler', odd: '3.25' },
        { value: 'Barnabas Varga', odd: '4.33' },
      ],
    },
    { id: BET.homeAnytimeScorer, values: [{ value: 'Barnabas Varga', odd: '4.33' }] },
    { id: BET.awayAnytimeScorer, values: [{ value: 'Kylian Mbappe', odd: '1.36' }, { value: 'Arda Guler', odd: '3.25' }] },
    {
      id: BET.scoreOrAssist,
      values: [
        { value: 'Kylian Mbappe', odd: '1.20' },
        { value: 'Arda Guler', odd: '1.57' },
        { value: 'Barnabas Varga', odd: '3.00' },
      ],
    },
  ],
}

test('devig scales implied chances to 100%', () => {
  const [over, under] = devig(['1.70', '2.10'])
  near(over + under, 1, 1e-9, 'sum')
  near(over, 0.5526, 0.001, 'over')
  assert.equal(devig(['1.70', undefined]), null)
})

test('Poisson over/under and its inverse agree', () => {
  near(poissonOver(1, 0.5), 1 - Math.exp(-1), 1e-9, 'P(X>0.5)')
  near(poissonOver(1.5, 2.5), 1 - Math.exp(-1.5) * (1 + 1.5 + 1.125), 1e-9, 'P(X>2.5)')
  near(lambdaFromOver(2.5, poissonOver(1.8, 2.5)), 1.8, 1e-6, 'inverse')
})

test('fitting goals from 1X2 recovers the means that made it', () => {
  // Chances made by Poisson means 1.6 and 0.9.
  const pmf = (l, k) => Math.exp(-l) * l ** k / [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][k]
  let win = 0
  let draw = 0
  for (let i = 0; i <= 10; i++)
    for (let j = 0; j <= 10; j++) {
      const p = pmf(1.6, i) * pmf(0.9, j)
      if (i > j) win += p
      else if (i === j) draw += p
    }
  const [h, a] = fitFromResult([win, draw, 1 - win - draw], poissonOver(2.5, 2.5))
  near(h, 1.6, 0.05, 'home')
  near(a, 0.9, 0.05, 'away')
})

test('team numbers from a real match: underdog at home to Real Madrid', () => {
  const t = teamNumbers({ bookmakers: [bet365] })
  assert.equal(t.source, 'totals')
  near(t.xg[0], 0.84, 0.08, 'home xG')
  near(t.xg[1], 3.0, 0.1, 'away xG') // Over 2.5 at 1.62 / Under at 2.20
  // Away clean sheet: Clean Sheet market (0.41) and home Under 0.5 (0.42).
  near(t.cs[1], 0.415, 0.02, 'away CS')
  near(t.cs[0], 0.06, 0.02, 'home CS')
  near(t.win[2], 0.79, 0.02, 'away win')
  assert.equal(t.bookmakers, 1)
})

test('team numbers fall back to 1X2 + over/under without team totals', () => {
  const plain = { ...bet365, bets: bet365.bets.filter((b) => b.id === BET.matchWinner || b.id === BET.goalsOverUnder) }
  const t = teamNumbers({ bookmakers: [plain] })
  assert.equal(t.source, 'result')
  assert.ok(t.xg[1] > t.xg[0] + 1, `${t.xg}`)
  near(t.cs[1], Math.exp(-t.xg[0]), 0.011, 'CS from Poisson')
})

test('the median over bookmakers ignores one odd price', () => {
  const odd = { ...bet365, id: 99, bets: bet365.bets.map((b) => (b.id === BET.totalHome ? { ...b, values: ou([[0.5, 1.1, 6], [1.5, 1.6, 2.2]]) } : b)) }
  const t = teamNumbers({ bookmakers: [bet365, bet365, odd] })
  near(t.xg[0], teamNumbers({ bookmakers: [bet365] }).xg[0], 1e-9, 'home xG')
})

test('player numbers: scaled to the team, assists from score-or-assist', () => {
  const team = teamNumbers({ bookmakers: [bet365] })
  const p = playerNumbers({ bookmakers: [bet365] }, team.xg)
  assert.equal(p['Kylian Mbappe'].side, 'away')
  assert.equal(p['Barnabas Varga'].side, 'home')
  // Mbappé alone: −ln(1 − 1/1.36) ≈ 1.33; with Güler the away side sums to
  // 1.33 + 0.36 = 1.69, under the team's 3.0, so no scaling.
  near(p['Kylian Mbappe'].xg, 1.33, 0.01, 'Mbappé xG')
  near(p['Kylian Mbappe'].xa, -Math.log(1 - 1 / 1.2) - 1.33, 0.02, 'Mbappé xA')
  near(p['Barnabas Varga'].xg, 0.26, 0.01, 'Varga xG')
  // A side whose priced players add up to more than its goals is scaled down to them.
  const tight = playerNumbers({ bookmakers: [bet365] }, [0.2, 1])
  near(tight['Barnabas Varga'].xg, 0.97 * 0.2, 0.01, 'Varga scaled')
  near(tight['Kylian Mbappe'].xg / tight['Arda Guler'].xg, 1.33 / 0.36, 0.1, 'shares kept')
  assert.ok(p['Barnabas Varga'].xa > 0)
})

test('no player markets, no player numbers', () => {
  const plain = { ...bet365, bets: bet365.bets.filter((b) => b.id === BET.matchWinner) }
  assert.deepEqual(playerNumbers({ bookmakers: [plain] }, [1, 1]), {})
})
