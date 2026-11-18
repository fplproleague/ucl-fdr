import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RAMP_INK, goodness, rampDomain, rampFill } from '../src/utils/oddsRamp.js'

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('the cell text clears 4.5:1 on every shade of the ramp', () => {
  for (let t = 0; t <= 1.0001; t += 0.05) assert.ok(contrast(RAMP_INK, rampFill(t)) >= 4.5, `t=${t.toFixed(2)}`)
})

test('better is lighter, step by step', () => {
  let prev = -1
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const l = lum(rampFill(t))
    assert.ok(l > prev)
    prev = l
  }
})

test('the ramp spreads the values on screen, and runs the right way for goals against', () => {
  const dom = rampDomain([0.37, 0.4, 0.47, 0.05], 0.1)
  assert.deepEqual(dom, [0.05, 0.47])
  assert.equal(goodness(0.47, dom), 1)
  assert.equal(goodness(0.05, dom), 0)
  assert.equal(goodness(0.47, dom, 'low'), 0)
  // A near-flat set isn't stretched into fake contrast.
  const flat = rampDomain([1.2, 1.25], 0.6)
  assert.ok(Math.abs(goodness(1.25, flat) - goodness(1.2, flat)) < 0.1)
})
