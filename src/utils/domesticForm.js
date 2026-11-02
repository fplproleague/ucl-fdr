// Domestic league form: each club's last few league matches, from
// API-Football (scripts/build-domestic-form.mjs fetches them on a laptop
// and saves src/data/domesticForm.js). Pure JS, no network and no Node-only
// APIs: the script, the browser and the tests all go through this file.
//
// One game, as saved per player (oldest first):
//   { d: '2026-10-25', opp: 'Union Berlin', v: 'H', gc: 1, min: 90, g: 1, a: 0 }
//   d date · opp opponent · v his club at home (H) or away (A) · gc goals his
//   club conceded · min/g/a his minutes, goals and assists. Optional, left
//   out when zero: sv saves, yc/rc yellow/red cards, ps/pm penalties saved/missed.
// A game he didn't play in has min 0: the club's match still counts, so a
// benched regular shows up as not playing rather than as missing data.
import { slugifyName } from './parseGoalkeepersCsv.js'

// How many of each club's latest league matches count as "form".
export const DOMESTIC_MATCHES = 5

// UCL Fantasy's main scoring rules, applied to a domestic match so its form
// can sit next to (and be averaged with) UCL points per match. An estimate:
// balls recovered and Player of the Match aren't in the API, so a domestic
// match scores a little lower than the same game in the UCL would.
const GOAL_POINTS = { GK: 6, DEF: 6, MID: 5, FWD: 4 }
const CLEAN_SHEET_POINTS = { GK: 4, DEF: 4, MID: 1, FWD: 0 }

export function domesticPoints(game, position) {
  if (!(game.min > 0)) return 0
  const full = game.min >= 60
  let pts = full ? 2 : 1
  pts += (game.g ?? 0) * (GOAL_POINTS[position] ?? 4) + (game.a ?? 0) * 3
  if (full && game.gc === 0) pts += CLEAN_SHEET_POINTS[position] ?? 0
  // −1 per two conceded: only when he was on for most of it, since gc is
  // the club's total, not what went in while he was on.
  if (full && (position === 'GK' || position === 'DEF')) pts -= Math.floor((game.gc ?? 0) / 2)
  if (position === 'GK') pts += Math.floor((game.sv ?? 0) / 3) + 5 * (game.ps ?? 0)
  pts -= (game.yc ?? 0) + 3 * (game.rc ?? 0) + 2 * (game.pm ?? 0)
  return pts
}

// Totals over a player's saved games. `ga90` is left out (null) under 90
// minutes: one goal in a 20-minute cameo isn't 4.5 per 90.
export function domesticSummary(games, position) {
  if (!games?.length) return null
  const sum = (f) => games.reduce((s, g) => s + (g[f] ?? 0), 0)
  const minutes = sum('min')
  const goals = sum('g')
  const assists = sum('a')
  return {
    matches: games.length,
    apps: games.filter((g) => g.min > 0).length,
    minutes,
    goals,
    assists,
    ga90: minutes >= 90 ? ((goals + assists) / minutes) * 90 : null,
    points: games.reduce((s, g) => s + domesticPoints(g, position), 0),
  }
}

// --- Build-time helpers (used by scripts/build-domestic-form.mjs) ---------

// Club names the API spells differently from the site, after the generic
// clean-up below (API-Football → our abbreviation).
const TEAM_ALIASES = {
  'bayern-munich': 'BAY',
  'paris-saint-germain': 'PSG',
  'inter-milan': 'INT',
  internazionale: 'INT',
  sporting: 'SPO',
  porto: 'POR',
  roma: 'ROM',
  'psv-eindhoven': 'PSV',
  'slavia-prague': 'SLA',
  'bodo-glimt': 'BOD',
  'aek-athens': 'AEK',
  sabah: 'SAB',
}
// Words that come and go between sources ("FC Porto", "Club Brugge KV").
const NOISE = new Set(['fc', 'cf', 'ac', 'as', 'sc', 'sk', 'fk', 'kv', 'cp', 'rc', 'vfb', 'afc', 'fa', 'pfc', 'sv'])
const teamKey = (name) =>
  slugifyName(name)
    .split('-')
    .filter((t) => t && !NOISE.has(t))
    .join('-')

// API team → our abbreviation, or null. Exact (cleaned-up) name first, then
// one name being the other plus extra words ("Bayern" / "Bayern München"),
// but only when that points at a single club.
export function matchApiTeam(apiName, teams) {
  const key = teamKey(apiName)
  if (TEAM_ALIASES[key]) return TEAM_ALIASES[key]
  const keysOf = (t) => [t.name, t.shortName, ...(t.aliases ?? [])].filter(Boolean).map(teamKey)
  const exact = teams.filter((t) => keysOf(t).includes(key))
  if (exact.length === 1) return exact[0].id
  const prefix = teams.filter((t) => keysOf(t).some((k) => key.startsWith(`${k}-`) || k.startsWith(`${key}-`)))
  return prefix.length === 1 ? prefix[0].id : null
}

// API-Football now and then sends a UTF-8 name read as Latin-1
// ("MaksimoviÄ" + U+0087 for "Maksimović"): undo that before comparing.
function repairMojibake(name) {
  const codes = [...name].map((ch) => ch.codePointAt(0))
  const broken = codes.some((c, i) => c >= 0xc2 && c <= 0xf4 && codes[i + 1] >= 0x80 && codes[i + 1] <= 0xbf)
  if (!broken || codes.some((c) => c > 0xff)) return name
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(codes))
  } catch {
    return name
  }
}

const nameParts = (name) => {
  // "N'Dicka" and "Ndicka" are one name: apostrophes go before splitting.
  const tokens = slugifyName(repairMojibake(name).replace(/['’`]/g, '')).split('-').filter(Boolean)
  const initial = tokens.length > 1 ? tokens[0][0] : null
  return { slug: tokens.join('-'), tokens, initial, last: tokens[tokens.length - 1], compact: tokens.join('') }
}

// His name read starting from each word in turn, glued together:
// "Kim Min-Jae" → kimminjae, minjaekim, … (Korean names come surname-first
// in one source and surname-last in the other).
const rotations = (tokens) => tokens.map((_, i) => [...tokens.slice(i), ...tokens.slice(0, i)].join(''))

// True when a and b differ by at most one inserted, removed or changed letter.
function oneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

// A sheet player → one of his club's API players ({ id, name, names? }), or
// null. `names` holds other spellings of the same player (the squad list
// and the match sheets don't always agree: "Pedro Fernández" / "Dro
// Fernández"). In order: the sheet's API ID; the same name; the same
// surname with a matching initial ("Ronald Araújo" / "R. Araújo"); a
// one-word name that is the other's first word ("Gabriel" / "Gabriel
// Magalhães"); the same words in another order ("Minjae Kim" / "Kim
// Min-Jae"); his surname inside a longer name, with his initial on a word
// before it ("P. Barrios" / "Pablo Barrios Rivas", "J. Gadou" / "Kouakou
// Joane Gadou"); and a surname one letter off ("Matviyenko" / "Matvienko").
// Every step needs a single candidate: two "Silva"s at one club stay
// unmatched rather than guessed, and a later step only runs when the
// earlier ones found nobody at all. Pass `info` to learn which step matched:
// `info.loose` is true for the last three, worth a look by hand.
export const LOOSE_MATCH_STEP = 3
export function matchSquadPlayer(sheetPlayer, pool, info = {}) {
  info.step = null
  info.loose = false
  if (sheetPlayer.apiId != null) return pool.find((p) => String(p.id) === String(sheetPlayer.apiId)) ?? null
  const me = nameParts(sheetPlayer.name)
  const parts = pool.flatMap((p) =>
    [...new Set([p.name, ...(p.names ?? [])].filter(Boolean))].map((name) => ({ p, ...nameParts(name) })),
  )
  const one = (list) => (new Set(list.map((c) => c.p.id)).size === 1 ? list[0].p : null)
  const initialsFit = (c) => !c.initial || !me.initial || c.initial === me.initial
  const steps = [
    (c) => c.slug === me.slug,
    (c) => c.last === me.last && (c.tokens.length > 1 || me.tokens.length > 1) && initialsFit(c),
    (c) =>
      (me.tokens.length === 1 && c.tokens[0] === me.tokens[0]) ||
      (c.tokens.length === 1 && me.tokens[0] === c.tokens[0]),
    (c) =>
      me.tokens.length > 1 &&
      c.tokens.length > 1 &&
      (rotations(c.tokens).includes(me.compact) || rotations(me.tokens).includes(c.compact)),
    (c) => {
      if (me.tokens.length < 2) return false
      const at = c.tokens.indexOf(me.last)
      return at > 0 && c.tokens.slice(0, at).some((t) => t[0] === me.initial)
    },
    (c) =>
      me.last.length >= 6 &&
      me.tokens.length > 1 &&
      c.tokens.length > 1 &&
      initialsFit(c) &&
      oneEditApart(c.last, me.last),
  ]
  for (const [step, fits] of steps.entries()) {
    const found = parts.filter(fits)
    if (!found.length) continue
    const match = one(found)
    if (match) Object.assign(info, { step, loose: step >= LOOSE_MATCH_STEP })
    return match
  }
  return null
}

// A club's "current" leagues can hold a summer tournament next to the real
// one (Liverpool: "Premier League - Summer Series", season 2025, before
// "Premier League"). The domestic league: not an exhibition, in the club's
// own country, the newest season, and with player stats when there's a choice.
const EXHIBITION = /summer series|friendl|pre-?season/i
export function pickDomesticLeague(entries, country) {
  const rank = (e) => [
    EXHIBITION.test(e.league?.name ?? '') ? 0 : 1,
    !country || e.country?.name === country ? 1 : 0,
    e.seasons?.[0]?.year ?? 0,
    e.seasons?.[0]?.coverage?.fixtures?.statistics_players === false ? 0 : 1,
  ]
  const order = (a, b) => {
    const [ra, rb] = [rank(a), rank(b)]
    const i = ra.findIndex((v, k) => v !== rb[k])
    return i < 0 ? 0 : rb[i] - ra[i]
  }
  return [...(entries ?? [])].sort(order)[0] ?? null
}

// One club's league matches (API /fixtures rows) and the player stats for
// each (API /fixtures/players responses, by fixture id) → the club's last
// `count` games as a template, plus every player who appears in them.
export function buildTeamGames(apiTeamId, fixtures, statsByFixture, count = DOMESTIC_MATCHES) {
  const finished = fixtures
    .filter((f) => ['FT', 'AET', 'PEN'].includes(f.fixture?.status?.short))
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .slice(-count)

  const template = []
  const players = new Map() // api id → { id, name, lines: Map fixture id → stat line }
  for (const f of finished) {
    const home = f.teams.home.id === apiTeamId
    template.push({
      fid: f.fixture.id,
      d: f.fixture.date.slice(0, 10),
      opp: home ? f.teams.away.name : f.teams.home.name,
      v: home ? 'H' : 'A',
      gc: (home ? f.goals.away : f.goals.home) ?? 0,
    })
    const side = (statsByFixture.get(f.fixture.id) ?? []).find((t) => t.team?.id === apiTeamId)
    for (const entry of side?.players ?? []) {
      const s = entry.statistics?.[0] ?? {}
      const line = { min: s.games?.minutes ?? 0, g: s.goals?.total ?? 0, a: s.goals?.assists ?? 0 }
      const optional = {
        sv: s.goals?.saves,
        yc: s.cards?.yellow,
        rc: s.cards?.red,
        ps: s.penalty?.saved,
        pm: s.penalty?.missed,
      }
      for (const [k, v] of Object.entries(optional)) if (v > 0) line[k] = v
      const known = players.get(entry.player.id) ?? { id: entry.player.id, name: entry.player.name, lines: new Map() }
      known.lines.set(f.fixture.id, line)
      players.set(entry.player.id, known)
    }
  }
  return { template, players }
}

// His saved games: every game in the club's template, with his line in it
// (or 0 minutes when he isn't in that match's sheet at all).
export function gamesFor(team, apiPlayerId) {
  const lines = team.players.get(apiPlayerId)?.lines
  return team.template.map(({ fid, ...game }) => ({ ...game, ...(lines?.get(fid) ?? { min: 0, g: 0, a: 0 }) }))
}
