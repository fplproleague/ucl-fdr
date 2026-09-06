// The whole app state lives in the hash so every view is linkable:
//   #/table?from=1&to=8&va=1
//   #/table?from=1&to=8&skip=3
//   #/table?from=1&to=1&md=1&day=TUE
//   #/compare?from=3&to=6&teams=ARS,INT,BAY
//   #/runs?from=2&to=5&r=ARS4BVB2
//
// Tab changes push a history entry (so the phone's back button walks back
// through tabs instead of leaving the site); everything else replaces, so
// dragging a rating around doesn't bury the back button under 40 entries.

export const TAB_IDS = ['table', 'runs', 'compare', 'strength', 'gk']

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

export function buildHash({ tab, from, to, skip, teams, venueAdjust, showMatchday, dayFilter, ratings }) {
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
  const query = params.toString()
  return `#/${tab}${query ? `?${query}` : ''}`
}

export function writeHash(next, { push = false } = {}) {
  const hash = buildHash(next)
  if (hash === window.location.hash) return
  const url = `${window.location.pathname}${window.location.search}${hash}`
  if (push) window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}
