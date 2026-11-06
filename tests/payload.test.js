import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Guards for the first-load budget (see the commit that added this file):
// the views other than the FDR table are loaded on demand, and the body
// text uses Archivo's 35 kB weight-only face, not the 90 kB two-axis one.

const SRC = new URL('../src/', import.meta.url).pathname
function sources(dir = SRC) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.(jsx?|css)$/.test(e.name) ? [join(dir, e.name)] : [],
  )
}
const files = sources().map((path) => ({ path: path.slice(SRC.length), text: readFileSync(path, 'utf8') }))

const LAZY_VIEWS = ['BestFixtureRuns', 'GkRotation', 'PlayerProjections', 'OddsView', 'TeamStrengthSettings']

test('no file imports a lazy view statically', () => {
  for (const view of LAZY_VIEWS) {
    const re = new RegExp(`(import|export)[^;'"]*from\\s*['"][./]*(components/)?${view}\\.jsx['"]`)
    const offenders = files.filter((f) => re.test(f.text)).map((f) => f.path)
    // GK Rotation once pulled the whole Players view in for its price slider.
    assert.deepEqual(offenders, [], `${view} is imported statically by ${offenders.join(', ')}`)
  }
})

test('the body face is the weight-only Archivo; the expanded one is a small subset', () => {
  const all = files.map((f) => f.text).join('\n')
  assert.ok(!all.includes('@fontsource-variable/archivo/wdth.css'), 'the 90 kB two-axis file is back')
  assert.ok(all.includes('@fontsource-variable/archivo/wght.css'))
  const fonts = new URL('../src/assets/fonts/', import.meta.url).pathname
  for (const name of readdirSync(fonts)) {
    const size = readFileSync(join(fonts, name)).length
    assert.ok(size < 25_000, `${name} is ${size} bytes`)
  }
})

test('nothing fetches every view up front', () => {
  const app = files.find((f) => f.path === 'App.jsx').text
  assert.ok(!/requestIdleCallback/.test(app), 'App prefetches on idle again')
})
