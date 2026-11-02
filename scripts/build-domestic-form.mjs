// Regenerates src/data/domesticForm.js: every sheet player's minutes, goals
// and assists in his club's last DOMESTIC_MATCHES league matches, from
// API-Football (api-sports.io). The site never calls the API itself, so the
// key stays out of the browser: this runs on a laptop (by hand, or as a
// Claude Cowork scheduled task), and the result is committed and pushed.
//
// Usage:
//   node scripts/build-domestic-form.mjs        key from a key file (below)
//   API_FOOTBALL_KEY=… node scripts/build-domestic-form.mjs
//   … --soft     never fails (no key, API down, over quota): keeps the saved file
//
// Optional environment:
//   API_FOOTBALL_KEY_FILE  a text file holding only the key, so it never has to be
//                          typed into a command or a chat. Without it the script looks
//                          for api-football-key.local in the repo root (git ignores
//                          *.local) and then ~/.ucl-fdr/api-football-key.
//   API_FOOTBALL_SEASON    the UCL season year (default: 2026 for 2026/27)
//   API_FOOTBALL_DELAY_MS  pause between requests (default 250, ≈240 a minute)
//   API_FOOTBALL_BASE      another API address (a local mock, for testing)
//
// Cost: about 3 requests per club plus one per league match fetched, so
// roughly 36 × 3 + 36 × 5 ≈ 290 per run (fewer when two clubs met).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import {
  DOMESTIC_MATCHES,
  buildTeamGames,
  gamesFor,
  matchApiTeam,
  matchSquadPlayer,
} from '../src/utils/domesticForm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../src/data/domesticForm.js')
const { INITIAL_TEAMS } = await import('../src/data/teams.js')

const BASE = process.env.API_FOOTBALL_BASE ?? 'https://v3.football.api-sports.io'
const UCL_LEAGUE_ID = 2
// When the name matching below can't place a club, put its API-Football team
// id here (the run's log lists any it missed): { SAB: 1234 }.
const TEAM_ID_OVERRIDES = {}

const soft = process.argv.includes('--soft')
const keyFiles = process.env.API_FOOTBALL_KEY_FILE
  ? [process.env.API_FOOTBALL_KEY_FILE]
  : [path.join(__dirname, '../api-football-key.local'), path.join(os.homedir(), '.ucl-fdr', 'api-football-key')]
const keyFile = keyFiles.find((f) => existsSync(f))
const key = process.env.API_FOOTBALL_KEY || (keyFile ? readFileSync(keyFile, 'utf8').trim() : '')
const delayMs = Number(process.env.API_FOOTBALL_DELAY_MS ?? 250)
const today = new Date()
const season = Number(
  process.env.API_FOOTBALL_SEASON ?? (today.getUTCMonth() >= 6 ? today.getUTCFullYear() : today.getUTCFullYear() - 1),
)

function bail(message) {
  if (soft) {
    console.warn(`Domestic form: ${message} — keeping the saved file`)
    process.exit(0)
  }
  console.error(`Domestic form: ${message}`)
  process.exit(1)
}

if (!key) bail(`no API_FOOTBALL_KEY set and no key file (${keyFiles.join(' or ')})`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let requests = 0
let remainingToday = null

// One GET. Retries a rate-limited or failed call twice, a minute apart; an
// error the API reports in its body (bad key, daily quota used up) stops
// the run, since retrying can't fix it.
async function api(endpoint, params) {
  const url = `${BASE}/${endpoint}?${new URLSearchParams(params)}`
  for (let attempt = 0; ; attempt++) {
    await sleep(delayMs)
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
    return body.response ?? []
  }
}

// The sheet players to look up: the live sheet, or its saved copy.
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
  console.warn('Domestic form: player sheet unreachable, using the saved copy (src/data/players.js)')
  return (await import('../src/data/players.js')).PLAYERS
}

async function run() {
  const players = await sheetPlayers()
  console.log(`Domestic form: ${players.length} sheet players, UCL season ${season}`)

  // Our 36 clubs → API team ids, from the UCL's own team list.
  const uclTeams = await api('teams', { league: UCL_LEAGUE_ID, season })
  const apiIds = { ...TEAM_ID_OVERRIDES }
  for (const { team } of uclTeams) {
    const abbr = matchApiTeam(team.name, INITIAL_TEAMS)
    if (abbr && apiIds[abbr] == null) apiIds[abbr] = team.id
  }
  const unplaced = INITIAL_TEAMS.filter((t) => apiIds[t.id] == null).map((t) => t.id)
  if (unplaced.length)
    console.warn(
      `Domestic form: no API team for ${unplaced.join(', ')} — add them to TEAM_ID_OVERRIDES. API names: ${uclTeams
        .map((t) => t.team.name)
        .join(', ')}`,
    )

  const out = {}
  const leagues = {}
  const statsByFixture = new Map()
  const unmatched = []

  for (const team of INITIAL_TEAMS) {
    const teamId = apiIds[team.id]
    if (teamId == null) continue
    // His club's league (type "league": the UCL itself is a cup), and the
    // season that league is in now (Norway runs on the calendar year).
    const [entry] = await api('leagues', { team: teamId, type: 'league', current: 'true' })
    if (!entry) {
      console.warn(`Domestic form: no current league for ${team.id}`)
      continue
    }
    const leagueSeason = entry.seasons?.[0]
    if (leagueSeason?.coverage?.fixtures?.statistics_players === false) {
      console.warn(`Domestic form: ${entry.league.name} has no player stats in the API — ${team.id} skipped`)
      continue
    }
    leagues[team.id] = entry.league.name

    const fixtures = await api('fixtures', {
      team: teamId,
      league: entry.league.id,
      season: leagueSeason?.year ?? season,
      status: 'FT-AET-PEN',
    })
    const latest = [...fixtures]
      .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
      .slice(0, DOMESTIC_MATCHES)
    for (const f of latest) {
      if (!statsByFixture.has(f.fixture.id))
        statsByFixture.set(f.fixture.id, await api('fixtures/players', { fixture: f.fixture.id }))
    }
    const games = buildTeamGames(teamId, latest, statsByFixture)

    // Everyone the club has registered, plus anyone who played in these
    // games but isn't in the squad list (a youngster, a late signing).
    const [squad] = await api('players/squads', { team: teamId })
    const pool = new Map((squad?.players ?? []).map((p) => [p.id, { id: p.id, name: p.name }]))
    for (const p of games.players.values()) if (!pool.has(p.id)) pool.set(p.id, { id: p.id, name: p.name })

    for (const player of players.filter((p) => p.team === team.id)) {
      const match = matchSquadPlayer(player, [...pool.values()])
      if (match) out[player.id] = gamesFor(games, match.id)
      else unmatched.push(`${player.name} (${team.id})`)
    }
  }

  const matched = Object.keys(out).length
  console.log(
    `Domestic form: ${matched} players matched, ${requests} requests` +
      (remainingToday != null ? `, ${remainingToday} left today` : ''),
  )
  if (unmatched.length)
    console.warn(
      `Domestic form: ${unmatched.length} not matched by name (add an "API ID" column to fix one): ${unmatched.join(', ')}`,
    )
  if (matched === 0) bail('nobody matched')
  return { out, leagues }
}

let result
try {
  result = await run()
} catch (err) {
  bail(err.message)
}

// The newest match in the data, not today's date: the file (and with it a
// commit and a deploy) only changes when there are new matches to show.
const latestGame = Object.values(result.out)
  .flat()
  .reduce((latest, g) => (g.d > latest ? g.d : latest), '')

const quote = (str) => `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
function toJs(value) {
  if (typeof value === 'string') return quote(value)
  if (Array.isArray(value)) return `[${value.map(toJs).join(', ')}]`
  if (value && typeof value === 'object')
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${toJs(v)}`)
      .join(', ')} }`
  return String(value)
}

writeFileSync(
  OUT,
  `// Domestic league form per player — each club's last league matches, from
// API-Football. Generated by scripts/build-domestic-form.mjs (see the
// README); empty until that has run, and the Players tab hides its
// UCL / Domestic / Both switch while it is.
export const DOMESTIC_FORM = {
  updated: ${quote(latestGame)},
  matches: ${DOMESTIC_MATCHES},
  leagues: ${toJs(result.leagues)},
  players: {
${Object.entries(result.out)
  .map(([id, games]) => `    ${toJs({ [id]: games }).slice(2, -2)},`)
  .join('\n')}
  },
}
`,
)
console.log('wrote src/data/domesticForm.js')
