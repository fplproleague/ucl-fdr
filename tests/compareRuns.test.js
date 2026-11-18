import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareRuns } from '../src/utils/difficulty.js'

const row = (name, avg, homes, hard) => ({ team: { name }, avg, homes, hard })

test('Best Runs: average, then home matches, then fewest hard fixtures, then name', () => {
  const rows = [
    row('Real Madrid', 2.75, 2, 1),
    row('Shakhtar', 2.75, 2, 0),
    row('Feyenoord', 2.75, 3, 2),
    row('Napoli', 2.5, 2, 1),
    row('RB Leipzig', 2.5, 2, 1),
    row('Villarreal', 2.38, 1, 2),
  ]
  assert.deepEqual(
    [...rows].sort(compareRuns).map((r) => r.team.name),
    // 2.38 first; 2.50 tied all the way, so A–Z; at 2.75 Feyenoord has the
    // most home matches, then Shakhtar beats Real Madrid on hard fixtures.
    ['Villarreal', 'Napoli', 'RB Leipzig', 'Feyenoord', 'Shakhtar', 'Real Madrid'],
  )
})

test('the order does not depend on the order the rows came in', () => {
  const rows = [row('B', 3, 1, 1), row('A', 3, 1, 1), row('C', 3, 2, 3), row('D', 3, 1, 0)]
  const once = [...rows].sort(compareRuns).map((r) => r.team.name)
  const reversed = [...rows].reverse().sort(compareRuns).map((r) => r.team.name)
  assert.deepEqual(once, reversed)
  assert.deepEqual(once, ['C', 'D', 'A', 'B'])
})
