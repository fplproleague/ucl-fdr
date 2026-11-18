// Regenerates src/data/odds.js from API-Football's betting odds (and, for
// matches API-Football hasn't priced yet, The Odds API's): for every
// UCL match that bookmakers have priced, each team's expected goals,
// clean-sheet chance and win/draw/loss chances, and the prices of the sheet
// players the bookmakers price (anytime scorer, score or assist) (see src/utils/odds.js for the
// maths). The site never calls the API itself, so the key stays private:
// this runs on a laptop (by hand, or as a Claude Cowork scheduled task),
// and the result is committed and pushed.
//
// Usage:
//   node scripts/build-odds.mjs        key from the same key file as
//                                      scripts/build-domestic-form.mjs
//   … --refresh   also re-save matches that have kicked off (the API keeps
//                 their pre-match odds for about a week)
//
// Bookmakers price a match's 1X2 and over/under from about three weeks
// before it (team totals, clean sheets and players come later), and
// API-Football drops the odds about a week after it. So the file is an archive: every
// run adds or updates the matches priced right now and keeps the rest, and
// a match that has kicked off keeps the last odds saved before kick-off
// (its closing odds). Run it at least once in the days before every
// matchday — and again on the day itself, when the player markets are
// fullest. .github/workflows/odds.yml runs it every morning on GitHub.
//
// Second source (optional): The Odds API (the-odds-api.com, free tier 500
// credits a month; one run costs 4). Key in ODDS_API_KEY, odds-api-key.local
// in the repo folder or ~/.ucl-fdr/odds-api-key. Used only for matches
// API-Football has no odds for this run, so a match is priced as soon as any
// bookmaker lists it; API-Football's richer markets take over once it has them.
//
// Every match saved for the first time also keeps `est`: what the Odds tab
// estimated for it just before the odds came in, so
// scripts/odds-backtest.mjs can tell how close the estimates get.
//
// Cost: one request for the fixture list plus one per 10 priced matches
// (two or three a matchday).
//
// It also saves every club's Elo rating from clubelo.com (free, no key), the
// objective club strength the Odds tab estimates unpriced matches from (the
// site's 1–5 ratings are opinions and never feed the odds). Clubs it can't
// find are listed; ELO_NAMES fixes a name. If clubelo.com can't be reached
// it reads a download saved in the repo folder (see eloFile), and failing
// that keeps the Elo saved last time.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import { matchApiTeam, matchSquadPlayer, uclMatchday } from '../src/utils/domesticForm.js'
import { fromTheOddsApi, playerOdds, playerRates, teamNumbers } from '../src/utils/odds.js'
import { fitEstimator } from '../src/utils/oddsView.js'

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
// Our clubs → their names on clubelo.com (the first that exists wins).
const ELO_NAMES = {
  ARS: ['Arsenal'],
  BAY: ['Bayern München', 'Bayern'],
  BAR: ['Barcelona'],
  MCI: ['Man City'],
  PSG: ['Paris SG'],
  RMA: ['Real Madrid'],
  LIV: ['Liverpool'],
  INT: ['Internazionale', 'Inter'],
  ATM: ['Atlético', 'Atletico'],
  BVB: ['Dortmund'],
  MUN: ['Man United'],
  AVL: ['Aston Villa'],
  ROM: ['Roma'],
  SPO: ['Sporting'],
  POR: ['Porto'],
  NAP: ['Napoli'],
  RBL: ['RB Leipzig', 'Leipzig'],
  LIL: ['Lille'],
  VIL: ['Villarreal'],
  BET: ['Betis'],
  STU: ['Stuttgart'],
  CLU: ['Brugge', 'Club Brugge'],
  PSV: ['PSV'],
  LEN: ['Lens'],
  COM: ['Como'],
  SLA: ['Slavia Praha', 'Slavia Prague'],
  SHK: ['Shakhtar'],
  BOD: ['Bodoe/Glimt', 'Bodo/Glimt', 'Bodoe Glimt', 'Glimt'],
  FEN: ['Fenerbahce'],
  GAL: ['Galatasaray'],
  FEY: ['Feyenoord'],
  SAB: ['Sabah', 'Sabah FK'],
  VIK: ['Viking'],
  SLO: ['Slovan', 'Slovan Bratislava'],
  LAS: ['LASK'],
  AEK: ['AEK', 'AEK Athens'],
}
const PLAYER_NAME_OVERRIDES = {
  p250121533: 'Vinicius Jr.', // Vinícius Júnior (RMA)
  p250116683: 'Anastasios Douvikas', // T. (Tasos) Douvikas (COM)
}

const keyFiles = process.env.API_FOOTBALL_KEY_FILE
  ? [process.env.API_FOOTBALL_KEY_FILE]
  : [path.join(__dirname, '../api-football-key.local'), path.join(os.homedir(), '.ucl-fdr', 'api-football-key')]
const keyFile = keyFiles.find((f) => existsSync(f))
const key = process.env.API_FOOTBALL_KEY || (keyFile ? readFileSync(keyFile, 'utf8').trim() : '')
const oddsApiKeyFiles = [path.join(__dirname, '../odds-api-key.local'), path.join(os.homedir(), '.ucl-fdr', 'odds-api-key')]
const oddsApiKeyFile = oddsApiKeyFiles.find((f) => existsSync(f))
const oddsApiKey = process.env.ODDS_API_KEY || (oddsApiKeyFile ? readFileSync(oddsApiKeyFile, 'utf8').trim() : '')
const ODDS_API_SPORT = process.env.ODDS_API_SPORT ?? 'soccer_uefa_champs_league'
const ODDS_API_BASE = process.env.ODDS_API_BASE ?? 'https://api.the-odds-api.com'
const now = new Date()
const refresh = process.argv.includes('--refresh')
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

// Every club's Elo today from clubelo.com: { date, teams: { ARS: 2034, … } },
// or null when it can't be fetched.
// A clubelo.com download saved in the repo folder, for when the network the
// script runs on can't reach clubelo.com (a sandbox's allowlist): the
// newest file named clubelo*.csv, or named after a date the way a browser
// saves http://api.clubelo.com/2026-11-05 ("2026-11-05" / "2026-11-05.csv").
// Git ignores both. → { date, text } or null
function eloFile() {
  const root = path.join(__dirname, '..')
  const pick = process.env.CLUBELO_FILE
    ? [process.env.CLUBELO_FILE]
    : readdirSync(root)
        .filter((f) => /^clubelo.*\.csv$/i.test(f) || /^\d{4}-\d{2}-\d{2}(\.(csv|txt))?$/i.test(f))
        .map((f) => path.join(root, f))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  for (const file of pick) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    if (!/^\s*Rank,Club,Country,Level,Elo/i.test(text)) {
      console.log(`Odds: ${path.basename(file)} isn't a clubelo.com download (no "Rank,Club,Country,Level,Elo" header), skipped`)
      continue
    }
    const date = path.basename(file).match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date(statSync(file).mtimeMs).toISOString().slice(0, 10)
    return { date, text, file: path.basename(file) }
  }
  return null
}

// Every club's Elo from clubelo.com — fetched, or from a saved download (see
// eloFile): { date, teams: { ARS: 2034, … } }, or null.
async function fetchElo() {
  let date = now.toISOString().slice(0, 10)
  let text = null
  let source = 'clubelo.com'
  const failures = []
  const bases = process.env.CLUBELO_BASE ? [process.env.CLUBELO_BASE] : ['https://api.clubelo.com', 'http://api.clubelo.com']
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/${date}`, { signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        text = await res.text()
        break
      }
      failures.push(`${base}: HTTP ${res.status}`)
    } catch (err) {
      failures.push(`${base}: ${err.cause?.code ?? err.cause?.message ?? err.message}`)
    }
  }
  if (!text) {
    // Why it failed, so a blocked network can be told from clubelo.com
    // being down — then the saved download, if there is one.
    console.log(`Odds: clubelo.com not reached — ${failures.join('; ')}`)
    const saved = eloFile()
    if (!saved) {
      console.log(
        'Odds: no clubelo download in the repo folder either: open http://api.clubelo.com/' +
          date +
          ' in a browser and save it in the repo folder (as clubelo.csv, or under the name the browser picks)',
      )
      return null
    }
    console.log(`Odds: Elo from ${saved.file} (${saved.date})`)
    ;({ date, text } = saved)
    source = `clubelo.com (${saved.file})`
  }
  // Rank,Club,Country,Level,Elo,From,To
  const key = (name) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  const byName = new Map()
  for (const line of text.trim().split('\n').slice(1)) {
    const [, club, , , elo] = line.split(',')
    if (club && Number.isFinite(Number(elo))) byName.set(key(club), Math.round(Number(elo)))
  }
  const teams = {}
  const missing = []
  for (const team of INITIAL_TEAMS) {
    const names = [...(ELO_NAMES[team.id] ?? []), team.name, team.shortName, ...(team.aliases ?? [])].filter(Boolean)
    const found = names.map(key).find((k) => byName.has(k))
    if (found) teams[team.id] = byName.get(found)
    else missing.push(team.id)
  }
  if (missing.length) console.log(`Odds: no Elo found on clubelo.com for ${missing.join(', ')} (ELO_NAMES)`)
  return Object.keys(teams).length ? { date, source, teams } : null
}

// The Odds API's UCL events with 1X2 and totals (one request, 4 credits),
// or [] without a key or when it fails: it's the second source, never a
// reason for the run to fail.
async function theOddsApiEvents() {
  if (!oddsApiKey) {
    console.log('Odds: no ODDS_API_KEY, only API-Football (see the README for the second source)')
    return []
  }
  const params = new URLSearchParams({ apiKey: oddsApiKey, regions: 'eu,uk', markets: 'h2h,totals', oddsFormat: 'decimal', dateFormat: 'iso' })
  try {
    const res = await fetch(`${ODDS_API_BASE}/v4/sports/${ODDS_API_SPORT}/odds?${params}`, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) {
      console.log(`Odds: The Odds API HTTP ${res.status} (${(await res.text()).slice(0, 200)})`)
      return []
    }
    const left = res.headers.get('x-requests-remaining')
    const events = await res.json()
    console.log(`Odds: The Odds API lists ${events.length} UCL matches` + (left != null ? ` (${left} credits left this month)` : ''))
    return Array.isArray(events) ? events : []
  } catch (err) {
    console.log(`Odds: The Odds API not reached — ${err.cause?.code ?? err.message}`)
    return []
  }
}

// What the Odds tab showed for a match before it was priced: the estimate
// fitted to the archive as it was, from the home side.
const estimator = fitEstimator(SAVED)
function estimateBefore(home, away) {
  const h = estimator.estimate(home, away, 'H')
  const a = estimator.estimate(away, home, 'A')
  const r = (x) => Math.round(x * 100) / 100
  return { xg: [r(h.xgFor), r(h.xgAgainst)], cs: [r(h.cs), r(a.cs)] }
}
// A match keeps the estimate from the first time it was saved.
const estFor = (id, home, away) => SAVED?.matches?.[id]?.est ?? (SAVED?.matches?.[id] ? undefined : estimateBefore(home, away))

async function run() {
  const players = await sheetPlayers()
  const place = (name) => TEAM_NAME_OVERRIDES[name] ?? matchApiTeam(name, INITIAL_TEAMS)

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
    const home = place(fixture.teams.home.name)
    const away = place(fixture.teams.away.name)
    if (!home) unplacedTeams.add(fixture.teams.home.name)
    if (!away) unplacedTeams.add(fixture.teams.away.name)
    if (!home || !away) continue // a qualifier against a club outside the 36

    // Kicked off and already saved: keep the closing odds (unless --refresh,
    // for re-saving a match while the API still has its odds).
    const kickoff = fixture.fixture.date
    if (matches[id] && new Date(kickoff) <= now && !refresh) {
      kept++
      continue
    }

    const team = teamNumbers(entry)
    if (!team) continue

    // Bookmaker names → sheet players, per side.
    const priced = playerOdds(entry)
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
        byPlayer[player.id] = priced[match.name].odds
        used.add(match.name)
        playersMatched++
        if (info.loose) loose.push(`${player.name} = ${match.name} (${abbr})`)
      }
    }
    // Priced as likely scorers but not found in the sheet: worth a look.
    for (const [name, p] of Object.entries(priced)) {
      const { xg } = playerRates(p.odds)
      if (!used.has(name) && xg >= 0.3) unpriced.push(`${name} (${p.side === 'away' ? away : home}, xG ${xg})`)
    }

    const md = uclMatchday(fixture)
    const est = estFor(id, home, away)
    matches[id] = {
      ...(md != null ? { md } : {}),
      round: fixture.league?.round ?? '',
      date: kickoff,
      home,
      away,
      ...team,
      updated: entry.update ?? now.toISOString(),
      players: byPlayer,
      ...(est ? { est } : {}),
    }
    added++
  }

  // The second source, for what API-Football hasn't priced: placed on
  // API-Football's fixture (same id, same matchday) by clubs and date.
  const pricedNow = new Set(entries.map((e) => String(e.fixture?.id)))
  const noFixture = []
  let addedSecond = 0
  for (const event of await theOddsApiEvents()) {
    const home = place(event.home_team)
    const away = place(event.away_team)
    if (!home) unplacedTeams.add(event.home_team)
    if (!away) unplacedTeams.add(event.away_team)
    if (!home || !away) continue
    const fixture = [...fixtures.values()].find(
      (f) =>
        place(f.teams.home.name) === home &&
        place(f.teams.away.name) === away &&
        Math.abs(Date.parse(f.fixture.date) - Date.parse(event.commence_time)) < 3 * 86400000,
    )
    if (!fixture) {
      noFixture.push(`${home}-${away}`)
      continue
    }
    const id = String(fixture.fixture.id)
    if (pricedNow.has(id)) continue // API-Football has it, with more markets
    const saved = matches[id]
    if (saved && saved.provider !== 'the-odds-api' && saved.source === 'totals') continue // a richer save
    const kickoff = fixture.fixture.date
    if (saved && new Date(kickoff) <= now && !refresh) continue // closing odds kept
    const entry = fromTheOddsApi(event)
    const team = teamNumbers(entry)
    if (!team) continue
    const md = uclMatchday(fixture)
    const est = estFor(id, home, away)
    matches[id] = {
      ...(md != null ? { md } : {}),
      round: fixture.league?.round ?? '',
      date: kickoff,
      home,
      away,
      ...team,
      provider: 'the-odds-api',
      updated: entry.update ?? now.toISOString(),
      players: saved?.players ?? {},
      ...(est ? { est } : {}),
    }
    addedSecond++
  }
  if (addedSecond) console.log(`Odds: ${addedSecond} matches priced from The Odds API (1X2 + over/under, not yet on API-Football)`)
  if (noFixture.length) console.log(`Odds: The Odds API matches without an API-Football fixture: ${noFixture.join(', ')}`)

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
const elo = (await fetchElo()) ?? SAVED?.elo ?? null
console.log(
  elo
    ? `Odds: Elo for ${Object.keys(elo.teams).length} of ${INITIAL_TEAMS.length} clubs (${elo.date})`
    : 'Odds: no Elo (clubelo.com unreachable and none saved) — estimates use the odds alone',
)

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
  `// Betting-odds data per UCL match, from API-Football (and The Odds API for
// matches it hasn't priced yet). Generated by
// scripts/build-odds.mjs (see the README) — an archive: each run adds the
// matches priced at the time and keeps the rest.
//
// Per match (keyed by API-Football fixture id): md (league-phase matchday),
// round, date (kick-off), home / away (club abbreviations), and
//   xg   [home, away] expected goals
//   cs   [home, away] clean-sheet chance
//   win  [home, draw, away] chances
//   bookmakers, source ('totals': team-total markets; 'result': fitted
//   from 1X2 + over/under), provider ('the-odds-api' when it came from the
//   second source), updated (the bookmakers' last update)
//   players  { sheet player id: [anytime-scorer odds, score-or-assist odds] }
//   est  { xg, cs } what the Odds tab estimated before the odds came in
//        (scripts/odds-backtest.mjs)
//
// elo: every club's Elo rating from clubelo.com on \`date\`, the objective
// club strength unpriced matches are estimated from.
//            (playerRates in src/utils/odds.js turns them into expected
//            goals and assists if he plays)
export const ODDS = {
  updated: ${quote(updated)},
  elo: ${elo ? toJs(elo) : 'null'},
  matches: {
${sorted.map(([id, m]) => `    ${quote(id)}: ${toJs(m)},`).join('\n')}
  },
}
`,
)
console.log('wrote src/data/odds.js')
