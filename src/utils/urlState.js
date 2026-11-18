// The whole app state lives in the hash so every view is linkable:
//   #/table?from=1&to=8&va=1
//   #/table?from=1&to=8&skip=3
//   #/table?from=1&to=1&md=1&day=TUE
//   #/table?from=3&to=6&teams=ARS,INT,BAY  (the FDR table comparing three teams;
//                                           old #/compare links open this)
//   #/runs?from=2&to=5&r=ARS4BVB2
//   #/table?from=5&to=8&team=VIL (Villarreal's panel open over the table)
//   #/bracket?p=ARS---BAY       (bracket picks, see serializePicks)
//   #/bracket?demo=playoffs     (preview with made-up draws)
//   #/bracket?v=odds            (Bracket tab sub-view: odds, players or legs)
//   #/players?demo=1            (Players with made-up players, for previews)
//   #/players?cmp=p250016833,p250176450   (up to 5 players side by side)
//   #/odds?from=5&to=8          (bookmaker odds, apart from the ratings)
//   #/odds?ov=players&q=arsenal (its Players view, searched)
//   #/odds?om=xgFor&os=6        (goals for, sorted on MD6)
//   #/players?q=mbappe          (the Players tab, searched)
//
// Tab changes push a history entry (so the phone's back button walks back
// through tabs instead of leaving the site); everything else replaces, so
// dragging a rating around doesn't bury the back button under 40 entries.

import { parsePicks, serializePicks } from './bracket.js'
import { DEMO_STAGES } from '../data/knockoutDemo.js'

export const TAB_IDS = ['table', 'runs', 'strength', 'gk', 'players', 'odds', 'bracket']
// The tabs that can show a team's panel.
export const PANEL_TABS = ['table', 'runs', 'odds']
// How many players the Players tab compares side by side.
export const MAX_COMPARE_PLAYERS = 5
export const ODDS_VIEWS = ['teams', 'players']
export const ODDS_METRICS = ['cs', 'xgFor', 'xgAgainst']
// The Bracket tab's sub-views (?v=…): the bracket, its Outlook (knockout
// odds — not the Odds tab), its Players view and the leg planner.
export const KO_VIEWS = ['bracket', 'odds', 'players', 'legs']

export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, '')
  const [path, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  // Compare was a tab of its own; it is now a mode of the FDR table, so a
  // shared #/compare link lands there with its teams.
  const tab = TAB_IDS.includes(path) ? path : 'table'
  const num = (key) => {
    const v = Number(params.get(key))
    return Number.isInteger(v) && v > 0 ? v : null
  }
  const day = params.get('day')
  const demo = params.get('demo')
  const koView = params.get('v')
  const ov = params.get('ov')
  const om = params.get('om')
  return {
    tab,
    from: num('from'),
    to: num('to'),
    skip: num('skip'),
    teams: (params.get('teams') || '').split(',').filter(Boolean),
    // The team whose panel is open. Only a club code is kept.
    team: /^[A-Z]{3}$/.test(params.get('team') || '') ? params.get('team') : null,
    venueAdjust: params.get('va') === null ? null : params.get('va') !== '0',
    showMatchday: params.get('md') === null ? null : params.get('md') === '1',
    dayFilter: ['TUE', 'WED', 'THU'].includes(day) ? day : null,
    ratings: parseRatings(params.get('r')),
    picks: parsePicks(params.get('p')),
    // A knockout stage for the Bracket tab, or "1" for the Players tab.
    demo: DEMO_STAGES.includes(demo) || demo === '1' ? demo : null,
    koView: KO_VIEWS.includes(koView) ? koView : 'bracket',
    // Player ids are the sheet's ("p250016833", or a name slug): anything
    // else is dropped rather than trusted.
    // A search typed on the Players or Odds tab, so a link can carry it.
    query: (params.get('q') || '').slice(0, 60),
    oddsView: ODDS_VIEWS.includes(ov) ? ov : null,
    oddsMetric: ODDS_METRICS.includes(om) ? om : null,
    oddsSortMd: num('os'),
    players: [...new Set((params.get('cmp') || '').split(',').filter((id) => /^[\w-]{1,64}$/.test(id)))].slice(
      0,
      MAX_COMPARE_PLAYERS,
    ),
  }
}

// Ratings are packed as fixed-width 4-character chunks — "ARS4BVB2" — so a
// shared link carrying a full custom ticker stays short enough to tweet.
// Half steps take a lowercase letter in the same one character (a = 1½,
// b = 2½, c = 3½, d = 4½), so every link made before half steps existed
// still reads exactly the same.
const HALF_CODES = 'abcd'

function decodeRating(ch) {
  if (/^[1-5]$/.test(ch)) return Number(ch)
  const half = HALF_CODES.indexOf(ch)
  return half >= 0 ? half + 1.5 : null
}

function encodeRating(r) {
  return Number.isInteger(r) ? String(r) : HALF_CODES[r - 1.5]
}

export function isValidRating(r) {
  return r >= 1 && r <= 5 && Number.isInteger(r * 2)
}

export function parseRatings(str) {
  if (!str) return null
  const out = {}
  for (let i = 0; i + 4 <= str.length; i += 4) {
    const id = str.slice(i, i + 3).toUpperCase()
    const rating = decodeRating(str[i + 3])
    if (/^[A-Z]{3}$/.test(id) && rating != null) out[id] = rating
  }
  return Object.keys(out).length ? out : null
}

export function serializeRatings(overrides) {
  return Object.entries(overrides)
    .filter(([, r]) => isValidRating(r))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, r]) => `${id}${encodeRating(r)}`)
    .join('')
}

export function buildHash({
  tab,
  from,
  to,
  skip,
  teams,
  team,
  venueAdjust,
  showMatchday,
  dayFilter,
  ratings,
  picks,
  demo,
  koView,
  players,
  query,
  oddsView,
  oddsMetric,
  oddsSortMd,
}) {
  const params = new URLSearchParams()
  if (from) params.set('from', String(from))
  if (to) params.set('to', String(to))
  if (skip) params.set('skip', String(skip))
  if (teams && teams.length) params.set('teams', teams.join(','))
  if (team && PANEL_TABS.includes(tab)) params.set('team', team)
  if (venueAdjust === false) params.set('va', '0')
  if (showMatchday) params.set('md', '1')
  if (showMatchday && dayFilter && dayFilter !== 'ALL') params.set('day', dayFilter)
  const packed = ratings ? serializeRatings(ratings) : ''
  if (packed) params.set('r', packed)
  // Bracket picks only ride along on the Bracket tab — they'd just be noise
  // in a link to the FDR table.
  const packedPicks = tab === 'bracket' && picks ? serializePicks(picks) : ''
  if (packedPicks) params.set('p', packedPicks)
  if (tab === 'bracket' && koView && koView !== 'bracket') params.set('v', koView)
  if ((tab === 'bracket' || tab === 'players') && demo) params.set('demo', demo)
  if (tab === 'players' && players?.length) params.set('cmp', players.join(','))
  if (tab === 'odds' && oddsView && oddsView !== 'teams') params.set('ov', oddsView)
  if (tab === 'odds' && oddsMetric && oddsMetric !== 'cs') params.set('om', oddsMetric)
  if (tab === 'odds' && oddsSortMd) params.set('os', String(oddsSortMd))
  if ((tab === 'players' || tab === 'odds') && query?.trim()) params.set('q', query.trim())
  const search = params.toString()
  return `#/${tab}${search ? `?${search}` : ''}`
}

// state: what to store with a new history entry (see the team panel in
// TeamsContext). A replace keeps whatever the current entry already holds,
// so changing the range under an open panel doesn't forget how it opened.
export function writeHash(next, { push = false, state = null } = {}) {
  const hash = buildHash(next)
  if (hash === window.location.hash) return
  const url = `${window.location.pathname}${window.location.search}${hash}`
  if (push) window.history.pushState(state, '', url)
  else window.history.replaceState(window.history.state, '', url)
}
