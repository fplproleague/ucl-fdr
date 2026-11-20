import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHash, parseHash, parseRatings, serializeRatings } from '../src/utils/urlState.js'

test('links made before half steps read exactly as before', () => {
  assert.deepEqual(parseRatings('ARS4BVB2'), { ARS: 4, BVB: 2 })
})

test('half-step ratings survive a round trip through the link', () => {
  const ratings = { ARS: 4.5, BVB: 2, INT: 1.5, LIV: 5, RMA: 3.5 }
  const str = serializeRatings(ratings)
  assert.equal(str, 'ARSdBVB2INTaLIV5RMAc')
  assert.deepEqual(parseRatings(str), ratings)
})

test('ratings that are not whole or half steps are dropped', () => {
  assert.equal(serializeRatings({ ARS: 4.25, BVB: 6, INT: 0.5 }), '')
  assert.equal(parseRatings('ARSeBVB9'), null)
})

test('bracket picks, sub-view and demo stage ride in a Bracket link only', () => {
  const hash = buildHash({ tab: 'bracket', picks: { PO1: 'ARS' }, koView: 'odds', demo: 'playoffs' })
  assert.equal(hash, '#/bracket?p=ARS&v=odds&demo=playoffs')
  const back = parseHash(hash)
  assert.equal(back.tab, 'bracket')
  assert.equal(back.koView, 'odds')
  assert.equal(back.demo, 'playoffs')
  assert.deepEqual(back.picks, { PO1: 'ARS' })
  assert.equal(buildHash({ tab: 'table', picks: { PO1: 'ARS' }, koView: 'odds' }), '#/table')
})
test('the Odds tab view, metric, sorted matchday and search ride in the link', () => {
  const hash = buildHash({ tab: 'odds', from: 5, to: 8, oddsView: 'players', oddsMetric: 'xgFor', oddsSortMd: 6, query: 'arsenal' })
  assert.equal(hash, '#/odds?from=5&to=8&ov=players&om=xgFor&os=6&q=arsenal')
  const back = parseHash(hash)
  assert.equal(back.tab, 'odds')
  assert.equal(back.oddsView, 'players')
  assert.equal(back.oddsMetric, 'xgFor')
  assert.equal(back.oddsSortMd, 6)
  assert.equal(back.query, 'arsenal')
})

test('defaults stay out of the link, and Odds settings stay off other tabs', () => {
  assert.equal(buildHash({ tab: 'odds', oddsView: 'teams', oddsMetric: 'cs', query: '  ' }), '#/odds')
  assert.equal(buildHash({ tab: 'table', oddsView: 'players', oddsSortMd: 6, query: 'x' }), '#/table')
  assert.equal(buildHash({ tab: 'players', query: 'Mbappé' }), '#/players?q=Mbapp%C3%A9')
})

test('unknown values in a link are dropped', () => {
  const p = parseHash('#/odds?ov=nope&om=evil&os=-2')
  assert.equal(p.oddsView, null)
  assert.equal(p.oddsMetric, null)
  assert.equal(p.oddsSortMd, null)
})

test('an open team panel rides in the link, on the views that have one', () => {
  assert.equal(buildHash({ tab: 'table', from: 5, to: 8, team: 'VIL' }), '#/table?from=5&to=8&team=VIL')
  assert.equal(parseHash('#/table?from=5&to=8&team=VIL').team, 'VIL')
  // Not a club code: dropped. Not a view with a panel: not written.
  assert.equal(parseHash('#/table?team=<x>').team, null)
  assert.equal(buildHash({ tab: 'players', team: 'VIL' }), '#/players')
})
