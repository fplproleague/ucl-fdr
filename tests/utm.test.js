import test from 'node:test'
import assert from 'node:assert/strict'
import { writeHash } from '../src/utils/urlState.js'
import { keepUtmParams } from '../src/utils/utm.js'

// A minimal window: just the location and history writeHash touches.
function fakeWindow(href) {
  const url = new URL(href)
  const calls = []
  const location = { pathname: url.pathname, search: url.search, hash: url.hash }
  const record = (method) => (_state, _title, next) => {
    calls.push({ method, url: next })
    const u = new URL(next, url.origin)
    location.pathname = u.pathname
    location.search = u.search
    location.hash = u.hash
  }
  globalThis.window = { location, history: { pushState: record('push'), replaceState: record('replace') } }
  return { location, calls }
}

test('rewriting the hash keeps a shared link’s ?utm_ query string', () => {
  const { location, calls } = fakeWindow('https://ucl-fdr.vercel.app/?utm_source=x&utm_medium=social#/table')
  writeHash({ tab: 'table', from: 5, to: 8 })
  assert.equal(calls.at(-1).url, '/?utm_source=x&utm_medium=social#/table?from=5&to=8')
  writeHash({ tab: 'compare', from: 5, to: 8, teams: ['ARS', 'INT'] }, { push: true })
  assert.equal(calls.at(-1).method, 'push')
  assert.equal(calls.at(-1).url, '/?utm_source=x&utm_medium=social#/compare?from=5&to=8&teams=ARS%2CINT')
  assert.equal(location.search, '?utm_source=x&utm_medium=social')
  delete globalThis.window
})

test('analytics events get the visit’s utm_ parameters', () => {
  const search = '?utm_source=reddit&utm_medium=social&utm_campaign=md5&ref=abc'
  assert.equal(
    keepUtmParams('https://ucl-fdr.vercel.app/table', search),
    'https://ucl-fdr.vercel.app/table?utm_source=reddit&utm_medium=social&utm_campaign=md5',
  )
  // Already there (the script kept the query itself): unchanged.
  const full = 'https://ucl-fdr.vercel.app/table?utm_source=reddit&utm_medium=social&utm_campaign=md5'
  assert.equal(keepUtmParams(full, search), full)
  // No UTM on the visit: unchanged.
  assert.equal(keepUtmParams('https://ucl-fdr.vercel.app/runs', '?ref=abc'), 'https://ucl-fdr.vercel.app/runs')
  // A relative URL resolves against the origin; garbage is passed through.
  assert.equal(keepUtmParams('/odds/teams', '?utm_source=x', 'https://ucl-fdr.vercel.app'), 'https://ucl-fdr.vercel.app/odds/teams?utm_source=x')
  assert.equal(keepUtmParams('/odds/teams', '?utm_source=x'), '/odds/teams')
})
