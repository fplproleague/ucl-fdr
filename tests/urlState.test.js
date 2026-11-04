import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHash, parseHash } from '../src/utils/urlState.js'

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
