import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRatings, serializeRatings } from '../src/utils/urlState.js'

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
