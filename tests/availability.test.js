import { test } from 'node:test'
import assert from 'node:assert/strict'
import { availabilityFromFeed, availabilityOf, feedMatchday } from '../src/utils/availability.js'

const feed = [
  { id: '1', pStatus: 'I', trained: 'Unlikely to start next game', mdId: '4' },
  { id: '2', pStatus: 'D', trained: 'In contention to start next game', mdId: '5' },
  { id: '3', pStatus: 'D', trained: 'Unlikely to start next game', mdId: '5' },
  { id: '4', pStatus: 'S', trained: '', mdId: '5' },
  { id: '5', pStatus: 'NIS', trained: '', mdId: '5' },
  { id: '6', pStatus: '', trained: 'Unlikely to start next game', mdId: '5' },
  { id: '7', pStatus: '', trained: 'In contention to start next game', mdId: '5' },
]

test('feed statuses map to one letter per flagged player, keyed like the sheet', () => {
  assert.deepEqual(availabilityFromFeed(feed), { p1: 'I', p2: 'D', p3: 'U', p4: 'S', p5: 'N' })
  assert.deepEqual(availabilityFromFeed(null), {})
})

test('the feed’s matchday is its highest mdId', () => {
  assert.equal(feedMatchday(feed), 5)
  assert.equal(feedMatchday([]), 0)
})

test('availabilityOf finds a player, duplicates included, and nothing for a fit one', () => {
  const data = { players: { p1: 'I', p3: 'U' } }
  assert.equal(availabilityOf('p1', data).label, 'Injured')
  assert.equal(availabilityOf('p1-2', data).code, 'I')
  assert.equal(availabilityOf('p3', data).tone, 'doubt')
  assert.equal(availabilityOf('p7', data), null)
  assert.equal(availabilityOf(undefined, data), null)
})
