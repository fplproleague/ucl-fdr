// One-off check: which betting markets API-Football has for UCL matches, so
// we know what the odds-based data (projected goals, clean-sheet chances,
// player goals/assists) can be built from. Changes nothing in the site.
//
// Usage (same key file as scripts/build-domestic-form.mjs):
//   node scripts/probe-odds.mjs
//
// Prints a summary to paste into the chat, and saves the full answer to
// odds-probe.local (git ignores *.local) in case more detail is needed.
// Cost: a handful of requests (one per page of odds, plus a fallback of one
// per upcoming fixture when the league-wide call comes back empty).
//
// API-Football only has odds from about 14 days before a match until about
// 7 days after it, so run this while a matchday is close (or just played).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.API_FOOTBALL_BASE ?? 'https://v3.football.api-sports.io'
const UCL_LEAGUE_ID = 2
const OUT = path.join(__dirname, '../odds-probe.local')

const keyFiles = process.env.API_FOOTBALL_KEY_FILE
  ? [process.env.API_FOOTBALL_KEY_FILE]
  : [path.join(__dirname, '../api-football-key.local'), path.join(os.homedir(), '.ucl-fdr', 'api-football-key')]
const keyFile = keyFiles.find((f) => existsSync(f))
const key = process.env.API_FOOTBALL_KEY || (keyFile ? readFileSync(keyFile, 'utf8').trim() : '')
if (!key) {
  console.error(`Odds probe: no API_FOOTBALL_KEY set and no key file (${keyFiles.join(' or ')})`)
  process.exit(1)
}
const today = new Date()
const season = Number(
  process.env.API_FOOTBALL_SEASON ?? (today.getUTCMonth() >= 6 ? today.getUTCFullYear() : today.getUTCFullYear() - 1),
)

let requests = 0
let remaining = null
async function get(endpoint, params) {
  await new Promise((r) => setTimeout(r, 300))
  requests++
  const res = await fetch(`${BASE}/${endpoint}?${new URLSearchParams(params)}`, {
    headers: { 'x-apisports-key': key },
    signal: AbortSignal.timeout(20000),
  })
  remaining = res.headers.get('x-ratelimit-requests-remaining') ?? remaining
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`)
  const body = await res.json()
  const errors = Array.isArray(body.errors) ? body.errors : Object.values(body.errors ?? {})
  if (errors.length) throw new Error(`${endpoint}: ${errors.join('; ')}`)
  return body
}

// Every UCL fixture that has odds right now, page by page.
const entries = []
for (let page = 1; page <= 15; page++) {
  const body = await get('odds', { league: UCL_LEAGUE_ID, season, page })
  entries.push(...(body.response ?? []))
  if (!body.paging || body.paging.current >= body.paging.total) break
}

// Fallback: ask per fixture for the next few UCL matches.
if (!entries.length) {
  const next = (await get('fixtures', { league: UCL_LEAGUE_ID, season, next: 6 })).response ?? []
  console.log(`League-wide odds call was empty; trying the next ${next.length} fixtures one by one.`)
  for (const f of next) entries.push(...((await get('odds', { fixture: f.fixture.id })).response ?? []))
}

writeFileSync(OUT, JSON.stringify(entries, null, 2))

const lines = []
const say = (s = '') => lines.push(s)
say(`=== UCL odds probe — season ${season}, ${today.toISOString().slice(0, 16)} UTC ===`)
say(`Fixtures with odds: ${entries.length}`)
if (!entries.length) {
  say('No odds at all. Run this again within ~2 weeks before (or ~1 week after) a matchday.')
} else {
  const dates = entries.map((e) => e.fixture?.date?.slice(0, 10)).filter(Boolean).sort()
  say(`Match dates: ${dates[0]} … ${dates.at(-1)}`)

  const bookmakers = new Map()
  const bets = new Map()
  for (const e of entries)
    for (const b of e.bookmakers ?? []) {
      const bm = bookmakers.get(b.name) ?? { id: b.id, fixtures: 0 }
      bm.fixtures++
      bookmakers.set(b.name, bm)
      for (const bet of b.bets ?? []) {
        const t = bets.get(bet.name) ?? { id: bet.id, fixtures: new Set(), bookmakers: new Set(), maxValues: 0 }
        t.fixtures.add(e.fixture?.id)
        t.bookmakers.add(b.name)
        t.maxValues = Math.max(t.maxValues, bet.values?.length ?? 0)
        bets.set(bet.name, t)
      }
    }

  say()
  say(`Bookmakers (${bookmakers.size}) — name [id]: fixtures covered`)
  for (const [name, b] of [...bookmakers].sort((a, z) => z[1].fixtures - a[1].fixtures))
    say(`  ${name} [${b.id}]: ${b.fixtures}`)

  say()
  say(`Markets (${bets.size}) — name [id]: fixtures / bookmakers / most outcomes`)
  for (const [name, t] of [...bets].sort((a, z) => z[1].fixtures.size - a[1].fixtures.size || a[0].localeCompare(z[0])))
    say(`  ${name} [${t.id}]: ${t.fixtures.size} / ${t.bookmakers.size} / ${t.maxValues}`)

  // A sample of the markets the new data would be built from, for one match.
  const wanted =
    /^match winner$|over\/under|clean sheet|both teams score|exact score|team total|total - (home|away)|goalscorer|scorer|assist|shots/i
  const sample = entries[0]
  const sampleId = sample.fixture?.id
  say()
  say(`Sample — fixture ${sampleId} on ${sample.fixture?.date?.slice(0, 16)}, from the bookmaker with the most markets:`)
  const richest = [...(sample.bookmakers ?? [])].sort((a, z) => (z.bets?.length ?? 0) - (a.bets?.length ?? 0))[0]
  if (richest) {
    say(`  (${richest.name})`)
    for (const bet of richest.bets ?? []) {
      if (!wanted.test(bet.name)) continue
      const values = bet.values ?? []
      const shown = values.slice(0, 12).map((v) => `${v.value}=${v.odd}`)
      say(`  ${bet.name}: ${shown.join(', ')}${values.length > 12 ? `, … (+${values.length - 12})` : ''}`)
    }
  }
}
say()
say(`Requests used: ${requests}${remaining != null ? `, left today: ${remaining}` : ''}`)
say(`Full answer saved to ${path.relative(process.cwd(), OUT) || OUT}`)
console.log(lines.join('\n'))
