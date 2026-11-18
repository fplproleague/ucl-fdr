import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findBestWorstRuns } from '../src/utils/teamRuns.js'

const teamsByAbbr = { AAA: { rating: 1 }, BBB: { rating: 2 }, CCC: { rating: 3 }, DDD: { rating: 4 }, EEE: { rating: 5 } }
const opps = ['AAA', 'EEE', 'BBB', 'DDD', 'CCC', 'AAA', 'EEE', 'BBB']
const season = opps.map((opp, i) => ({ gw: i + 1, opp, venue: i % 2 ? 'A' : 'H' }))

test('best and worst are never the same run whenever both are shown', () => {
  // Every point of the league phase: MD1 onwards, MD2 onwards, … MD8 only.
  for (let from = 1; from <= 8; from++) {
    const left = season.filter((f) => f.gw >= from)
    for (const venueAdjust of [true, false]) {
      const { best, worst } = findBestWorstRuns(left, teamsByAbbr, venueAdjust)
      assert.equal(best == null, worst == null, 'both or neither')
      if (!best) continue
      assert.ok(best.avg < worst.avg, `MD${from}+: best ${best.avg} must beat worst ${worst.avg}`)
      assert.notDeepEqual([best.fromMd, best.toMd], [worst.fromMd, worst.toMd])
    }
  }
})

test('with four matchdays left the runs are three long, not the whole window', () => {
  const lastFour = ['AAA', 'BBB', 'EEE', 'EEE'].map((opp, i) => ({ gw: 5 + i, opp, venue: 'H' }))
  const r = findBestWorstRuns(lastFour, teamsByAbbr, true)
  assert.equal(r.length, 3)
  assert.deepEqual([r.best.fromMd, r.best.toMd], [5, 7])
  assert.deepEqual([r.worst.fromMd, r.worst.toMd], [6, 8])
})

test('a level schedule has nothing to tell apart: neither is shown', () => {
  const flat = [5, 6, 7, 8].map((gw) => ({ gw, opp: 'CCC', venue: 'H' }))
  assert.deepEqual(findBestWorstRuns(flat, teamsByAbbr, true), { best: null, worst: null, length: 3 })
  assert.equal(findBestWorstRuns([flat[0]], teamsByAbbr, true).best, null)
})
