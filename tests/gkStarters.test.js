import { test } from 'node:test'
import assert from 'node:assert/strict'
import { expectedStarters, rankGoalkeepers } from '../src/utils/gkPool.js'

const keepers = rankGoalkeepers([
  { id: 'neuer', name: 'M. Neuer', team: 'BAY', position: 'GK', minutes: 180, points: 8 },
  { id: 'urbig', name: 'J. Urbig', team: 'BAY', position: 'GK', minutes: 90, points: 1 },
  { id: 'bredlow', name: 'F. Bredlow', team: 'STU', position: 'GK', minutes: 180, points: 8 },
  { id: 'seimen', name: 'D. Seimen', team: 'STU', position: 'GK', minutes: 90, points: 2 },
  { id: 'raya', name: 'D. Raya', team: 'ARS', position: 'GK', minutes: 270, points: 15 },
  { id: 'kepa', name: 'Kepa', team: 'ARS', position: 'GK', minutes: 0, points: 0 },
])

const ucl = {
  neuer: [{ md: 1, min: 90 }, { md: 2, min: 0 }, { md: 3, min: 90 }],
  urbig: [{ md: 1, min: 0 }, { md: 2, min: 90 }, { md: 3, min: 0 }],
  bredlow: [{ md: 1, min: 90 }, { md: 2, min: 90 }, { md: 3, min: 0 }],
  seimen: [{ md: 3, min: 90 }],
}

test('the keeper of the club’s last UCL match is its starter, one per club', () => {
  const s = expectedStarters(keepers, ucl)
  // Seimen played MD3 though Bredlow has more minutes overall.
  assert.deepEqual([...s].sort(), ['neuer', 'raya', 'seimen'])
})

test('a keeper subbed off in the last match loses out to the one who finished it', () => {
  const s = expectedStarters(keepers, { ...ucl, neuer: [{ md: 3, min: 30 }], urbig: [{ md: 3, min: 60 }] })
  assert.ok(s.has('urbig') && !s.has('neuer'))
})

test('no match data: the keeper with the most UCL minutes', () => {
  const s = expectedStarters(keepers, {})
  assert.deepEqual([...s].sort(), ['bredlow', 'neuer', 'raya'])
})
