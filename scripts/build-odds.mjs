// Regenerates src/data/odds.js from API-Football's betting odds: for every
// UCL match that bookmakers have priced, each team's expected goals,
// clean-sheet chance and win/draw/loss chances, and the expected goals and
// assists of the sheet players they price (see src/utils/odds.js for the
// maths). The site never calls the API itself, so the key stays private:
// this runs on a laptop (by hand, or as a Claude Cowork scheduled task),
// and the result is committed and pushed.
//
// Usage:
//   node scripts/build-odds.mjs        key from the same key file as
//                                      scripts/build-domestic-form.mjs
//
// Bookmakers price a match from about two weeks before it, and API-Football
// drops the odds about a week after it. So the file is an archive: every
// run adds or updates the matches priced right now and keeps the rest, and
// a match that has kicked off keeps the last odds saved before kick-off
// (its closing odds). Run it at least once in the days before every
// matchday — and again on the day itself, when the player markets are
// fullest.
//
// Cost: one request for the fixture list plus one per 10 priced matches
// (two or three a matchday).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import { matchApiTeam, matchSquadPlayer, uclMatchday } from '../src/utils/domesticForm.js'
import { playerNumbers, teamNumbers } from '../src/utils/odds.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../src/data/odds.js')
const { INITIAL_TEAMS } = await import('../src/data/teams.js')
const { ODDS: SAVED } = await import('../src/data/odds.js')

const BASE = process.env.API_FOOTBALL_BASE ?? 'https://v3.football.api-sports.io'
const UCL_LEAGUE_ID = 2
// When the name matching can't place a club: API-Football team name → our
// abbreviation, e.g. { 'Some FC': 'SFC' } (the run's log lists any it missed).
const TEAM_NAME_OVERRIDES = {}
// Sheet players the bookmakers spell too differently to match by name:
// sheet player id → the name in the bookmaker's player markets.
const PLAYER_NAME_OVERRIDES = {
  p250121533: 'Vinicius Jr.', // Vinícius Júnior (RMA)
  p250116683: 'Anastasios Douvikas', // T. (Tasos) Douvikas (COM)
}

const keyFiles = process.env.API_FOOTBALL_KEY_FILE
  ? [process.env.API_FOOTBALL_KEY_FILE]
  : [path.join(__dirname, '../api-football-key.local'), path.join(os.homedir(), '.ucl-fdr', 'api-football-key')]
const keyFile = keyFiles.find((f) => existsSync(f))
const key = process.env.API_FOOTBALL_KEY || (keyFile ? readFileSync(keyFile, 'utf8').trim() : '')
const now = new Date()
const season = Number(
  process.env.API_FOOTBALL_SEASON ?? (now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1),
)

function bail(message) {
  console.error(`Odds: ${message}`)
  process.exit(1)
}
if (!key) bail(`no API_FOOTBALL_KEY set and no key file (${keyFiles.join(' or ')})`)

let requests = 0
let remainingToday = null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// One GET, returning the whole body (the odds come in pages). Retries a
// rate-limited or failed call twice, a minute apart.
async function api(endpoint, params) {
  const url = `${BASE}/${endpoint}?${new URLSearchParams(params)}`
  for (let attempt = 0; ; attempt++) {
    await sleep(250)
    requests++
    let res
    try {
      res = await fetch(url, { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(20000) })
    } catch (err) {
      if (attempt < 2) {
        await sleep(60000)
        continue
      }
      throw err
    }
    remainingToday = res.headers.get('x-ratelimit-requests-remaining') ?? remainingToday
    if (res.status === 429 && attempt < 2) {
      await sleep(60000)
      continue
    }
    if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`)
    const body = await res.json()
    const errors = Array.isArray(body.errors) ? body.errors : Object.values(body.errors ?? {})
    if (errors.length) {
      if (body.errors?.rateLimit && attempt < 2) {
        await sleep(60000)
        continue
      }
      throw new Error(`${endpoint}: ${errors.join('; ')}`)
    }
    return body
  }
}

// The sheet players: the live sheet, or its saved copy.
async function sheetPlayers() {
  const hookSrc = readFileSync(path.join(__dirname, '../src/utils/useLivePlayers.js'), 'utf8')
  const url = hookSrc.match(/PLAYERS_SHEET_URL\s*=\s*\n?\s*'([^']+)'/)?.[1]
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const { players } = parsePlayerRows(await res.text(), buildClubLookup(INITIAL_TEAMS))
        if (players.length) return players
      }
    } catch {
      // fall through to the saved copy
    }
  }
  console.warn('Odds: player sheet unreachable, using the saved copy (src/data/players.js)')
  return (await import('../src/data/players.js')).PLAYERS
}

async function run() {
  const players = await sheetPlayers()

  // Every UCL fixture this season (one request): id → teams, date, round.
  const fixtures = new Map(
    ((await api('fixtures', { league: UCL_LEAGUE_ID, season })).response ?? []).map((f) => [f.fixture.id, f]),
  )

  // Every fixture priced right now, page by page.
  const entries = []
  for (let page = 1; page <= 30; page++) {
    const body = await api('odds', { league: UCL_LEAGUE_ID, season, page })
    entries.push(...(body.response ?? []))
    if (!body.paging || body.paging.current >= body.paging.total) break
  }

  const matches = { ...(SAVED?.matches ?? {}) }
  const unplacedTeams = new Set()
  const unpriced = []
  const loose = []
  let added = 0
  let kept = 0
  let playersMatched = 0

  for (const entry of entries) {
    const id = String(entry.fixture?.id)
    const fixture = fixtures.get(entry.fixture?.id)
    if (!fixture) continue
    const place = (name) => TEAM_NAME_OVERRIDES[name] ?? matchApiTeam(name, INITIAL_TEAMS)
    const home = place(fixture.teams.home.name)
    const away = place(fixture.teams.away.name)
    if (!home) unplacedTeams.add(fixture.teams.home.name)
    if (!away) unplacedTeams.add(fixture.teams.away.name)
    if (!home || !away) continue // a qualifier against a club outside the 36

    // Kicked off and already saved: keep the closing odds.
    const kickoff = fixture.fixture.date
    if (matches[id] && new Date(kickoff) <= now) {
      kept++
      continue
    }

    const team = teamNumbers(entry)
    if (!team) continue

    // Bookmaker names → sheet players, per side.
    const priced = playerNumbers(entry, team.xg)
    const pool = (side) =>
      Object.entries(priced)
        .filter(([, p]) => p.side === side || p.side == null)
        .map(([name]) => ({ id: name, name }))
    const byPlayer = {}
    const used = new Set()
    for (const [abbr, side] of [
      [home, 'home'],
      [away, 'away'],
    ]) {
      const candidates = pool(side)
      for (const player of players.filter((p) => p.team === abbr)) {
        const info = {}
        const override = PLAYER_NAME_OVERRIDES[player.id]
        const match = override
          ? candidates.find((c) => c.name === override)
          : matchSquadPlayer({ ...player, apiId: null }, candidates, info)
        if (!match) continue
        const p = priced[match.name]
        byPlayer[player.id] = [p.xg, p.xa]
        used.add(match.name)
        playersMatched++
        if (info.loose) loose.push(`${player.name} = ${match.name} (${abbr})`)
      }
    }
    // Priced as likely scorers but not found in the sheet: worth a look.
    for (const [name, p] of Object.entries(priced))
      if (!used.has(name) && p.xg >= 0.15) unpriced.push(`${name} (${p.side === 'away' ? away : home}, xG ${p.xg})`)

    const md = uclMatchday(fixture)
    matches[id] = {
      ...(md != null ? { md } : {}),
      round: fixture.league?.round ?? '',
      date: kickoff,
      home,
      away,
      ...team,
      updated: entry.update ?? now.toISOString(),
      players: byPlayer,
    }
    added++
  }

  console.log(
    `Odds: ${entries.length} priced UCL fixtures, ${added} saved, ${kept} already kicked off (kept their closing odds), ` +
      `${playersMatched} player prices matched to the sheet, ${requests} requests` +
      (remainingToday != null ? `, ${remainingToday} left today` : ''),
  )
  if (unplacedTeams.size)
    console.log(`Odds: clubs outside the 36 or not recognised (TEAM_NAME_OVERRIDES): ${[...unplacedTeams].join(', ')}`)
  if (loose.length) console.log(`Odds: ${loose.length} loose name matches, check: ${loose.join(', ')}`)
  if (unpriced.length)
    console.log(
      `Odds: ${unpriced.length} likely scorers not matched to a sheet player (PLAYER_NAME_OVERRIDES, or not in the sheet): ${unpriced.join(', ')}`,
    )
  return matches
}

let matches
try {
  matches = await run()
} catch (err) {
  bail(err.message)
}

// The newest bookmaker update in the data, not the time of the run: the
// file (and with it a commit and a deploy) only changes when odds do.
const updated = Object.values(matches).reduce((latest, m) => (m.updated > latest ? m.updated : latest), '')

const quote = (str) => `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
function toJs(value) {
  if (typeof value === 'string') return quote(value)
  if (Array.isArray(value)) return `[${value.map(toJs).join(', ')}]`
  if (value && typeof value === 'object' && !Object.keys(value).length) return '{}'
  if (value && typeof value === 'object')
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${toJs(v)}`)
      .join(', ')} }`
  return String(value)
}
const sorted = Object.entries(matches).sort(([, a], [, b]) => a.date.localeCompare(b.date) || a.home.localeCompare(b.home))

writeFileSync(
  OUT,
  `// Betting-odds data per UCL match, from API-Football. Generated by
// scripts/build-odds.mjs (see the README) — an archive: each run adds the
// matches priced at the time and keeps the rest.
//
// Per match (keyed by API-Football fixture id): md (league-phase matchday),
// round, date (kick-off), home / away (club abbreviations), and
//   xg   [home, away] expected goals
//   cs   [home, away] clean-sheet chance
//   win  [home, draw, away] chances
//   bookmakers, source ('totals': team-total markets; 'result': fitted
//   from 1X2 + over/under), updated (the bookmakers' last update)
//   players  { sheet player id: [expected goals, expected assists] }
export const ODDS = {
  updated: ${quote(updated)},
  matches: {
${sorted.map(([id, m]) => `    ${quote(id)}: ${toJs(m)},`).join('\n')}
  },
}
`,
)
console.log('wrote src/data/odds.js')
