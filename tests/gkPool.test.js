import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findStoredGoalkeeper, firstChoices, rankGoalkeepers } from '../src/utils/gkPool.js'

const players = [
  { id: 'p1', name: 'D. Raya', team: 'ARS', position: 'GK', minutes: 270, points: 15 },
  { id: 'p2', name: 'K. Arrizabalaga', team: 'ARS', position: 'GK', minutes: 0, points: 0 },
  { id: 'p3', name: 'A. Meret', team: 'NAP', position: 'GK', minutes: 135, points: 4 },
  { id: 'p4', name: 'V. Milinković-Savić', team: 'NAP', position: 'GK', minutes: 135, points: 3 },
  { id: 'p5', name: 'B. Saka', team: 'ARS', position: 'MID', minutes: 270, points: 30 },
]

test('goalkeepers only, most minutes first, then points', () => {
  assert.deepEqual(
    rankGoalkeepers(players).map((g) => g.id),
    ['p1', 'p3', 'p4', 'p2'],
  )
})

test('first choices: one per club, the one with the most minutes', () => {
  assert.deepEqual(
    firstChoices(rankGoalkeepers(players)).map((g) => g.id),
    ['p1', 'p3'],
  )
})

test('a pick saved under the old GK sheet still resolves', () => {
  const ranked = rankGoalkeepers(players)
  assert.equal(findStoredGoalkeeper('p3', ranked).id, 'p3')
  // Old slug ids: "raya" → "D. Raya".
  assert.equal(findStoredGoalkeeper('raya', ranked).id, 'p1')
  assert.equal(findStoredGoalkeeper('milinkovic-savic', ranked).id, 'p4')
  assert.equal(findStoredGoalkeeper('nobody', ranked), null)
  assert.equal(findStoredGoalkeeper(null, ranked), null)
})
