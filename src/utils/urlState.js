// The whole app state lives in the hash so every view is linkable:
//   #/table?from=1&to=8&va=1
//   #/table?from=1&to=8&skip=3
//   #/table?from=1&to=1&md=1&day=TUE
//   #/compare?from=3&to=6&teams=ARS,INT,BAY
//   #/runs?from=2&to=5&r=ARS4BVB2
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

export const TAB_IDS = ['table', 'runs', 'compare', 'strength', 'gk', 'players', 'odds']
// How many players the Players tab compares side by side.
export const MAX_COMPARE_PLAYERS = 5
export const ODDS_VIEWS = ['teams', 'players']
export const ODDS_METRICS = ['cs', 'xgFor', 'xgAgainst']

export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, '')
  const [path, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  const tab = TAB_IDS.includes(path) ? path : 'table'
  const num = (key) => {
    const v = Number(params.get(key))
    return Number.isInteger(v) && v > 0 ? v : null
  }
  const day = params.get('day')
  const demo = params.get('demo')
  const ov = params.get('ov')
  const om = params.get('om')
  return {
    tab,
    from: num('from'),
    to: num('to'),
    skip: num('skip'),
    teams: (params.get('teams') || '').split(',').filter(Boolean),
    venueAdjust: params.get('va') === null ? null : params.get('va') !== '0',
    showMatchday: params.get('md') === null ? null : params.get('md') === '1',
    dayFilter: ['TUE', 'WED', 'THU'].includes(day) ? day : null,
    ratings: parseRatings(params.get('r')),
    demo: demo || null,
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
export function parseRatings(str) {
  if (!str) return null
  const out = {}
  for (let i = 0; i + 4 <= str.length; i += 4) {
    const id = str.slice(i, i + 3).toUpperCase()
    const rating = Number(str[i + 3])
    if (/^[A-Z]{3}$/.test(id) && rating >= 1 && rating <= 5) out[id] = rating
  }
  return Object.keys(out).length ? out : null
}

export function serializeRatings(overrides) {
  return Object.entries(overrides)
    .filter(([, r]) => r >= 1 && r <= 5)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, r]) => `${id}${r}`)
    .join('')
}

export function buildHash({
  tab,
  from,
  to,
  skip,
  teams,
  venueAdjust,
  showMatchday,
  dayFilter,
  ratings,
  demo,
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
  if (venueAdjust === false) params.set('va', '0')
  if (showMatchday) params.set('md', '1')
  if (showMatchday && dayFilter && dayFilter !== 'ALL') params.set('day', dayFilter)
  const packed = ratings ? serializeRatings(ratings) : ''
  if (packed) params.set('r', packed)
  if (tab === 'players' && demo) params.set('demo', demo)
  if (tab === 'players' && players?.length) params.set('cmp', players.join(','))
  if (tab === 'odds' && oddsView && oddsView !== 'teams') params.set('ov', oddsView)
  if (tab === 'odds' && oddsMetric && oddsMetric !== 'cs') params.set('om', oddsMetric)
  if (tab === 'odds' && oddsSortMd) params.set('os', String(oddsSortMd))
  if ((tab === 'players' || tab === 'odds') && query?.trim()) params.set('q', query.trim())
  const search = params.toString()
  return `#/${tab}${search ? `?${search}` : ''}`
}

export function writeHash(next, { push = false } = {}) {
  const hash = buildHash(next)
  if (hash === window.location.hash) return
  const url = `${window.location.pathname}${window.location.search}${hash}`
  if (push) window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}
