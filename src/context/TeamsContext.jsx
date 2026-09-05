import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { parseHash, writeHash, TAB_IDS } from '../utils/urlState.js'
import { availableDays } from '../utils/matchdaySplit.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'

const STORAGE_KEY = 'ucl-fdr:ratings:v1'
const VENUE_KEY = 'ucl-fdr:venue-adjust:v1'
const HIDDEN_KEY = 'ucl-fdr:hidden-teams:v1'
const MATCHDAY_SPLIT_KEY = 'ucl-fdr:matchday-split:v1'

const TeamsContext = createContext(null)

function readStoredOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function readStoredVenueAdjust() {
  try {
    return localStorage.getItem(VENUE_KEY) !== '0'
  } catch {
    return true
  }
}

function readStoredHidden() {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function readStoredMatchdaySplit() {
  try {
    return localStorage.getItem(MATCHDAY_SPLIT_KEY) === '1'
  } catch {
    return false
  }
}

// A link always beats local storage: someone opening a shared ticker should see
// the ticker they were sent, not the ratings they last set on their own phone.
function initialState() {
  const url = parseHash()
  const from = url.from ?? 1
  const to = url.to ?? TOTAL_MATCHDAYS
  return {
    tab: url.tab,
    from,
    to,
    // Only meaningful strictly inside the range — skipping an edge matchday
    // is just narrowing "from"/"to", so a stale value from an old link that
    // no longer sits inside the range is dropped rather than silently kept.
    skipMd: url.skip != null && url.skip > from && url.skip < to ? url.skip : null,
    compare: url.teams,
    overrides: url.ratings ?? readStoredOverrides(),
    venueAdjust: url.venueAdjust ?? readStoredVenueAdjust(),
    // Which teams to leave off the table/rankings — a per-device declutter
    // preference (e.g. teams already eliminated, or outside your league),
    // not something you'd want baked into a link you share, so this one
    // lives only in localStorage.
    hidden: readStoredHidden(),
    showMatchday: url.showMatchday ?? readStoredMatchdaySplit(),
    // Re-validated against the visible range right after mount (see the
    // effect below) — a link or a stale localStorage value might name a day
    // that isn't even played on this range's matchdays.
    dayFilter: url.dayFilter ?? 'ALL',
  }
}

export function TeamsProvider({ children }) {
  const [state, setState] = useState(initialState)
  const { tab, from, to, skipMd, compare, overrides, venueAdjust, hidden, showMatchday, dayFilter } = state

  // Whether the next hash write should create a history entry. Only tab
  // changes do, so the phone's back button steps through views instead of
  // being buried under one entry per rating tap.
  const pushNext = useRef(false)
  // Guards the popstate listener against reacting to our own writes.
  const selfWrite = useRef(false)

  // The URL is derived from state, written in an effect rather than inside a
  // state updater — updaters have to stay pure to be safe under StrictMode and
  // concurrent rendering.
  useEffect(() => {
    selfWrite.current = true
    writeHash(
      {
        tab,
        from,
        to,
        skip: skipMd,
        teams: tab === 'compare' ? compare : [],
        venueAdjust,
        showMatchday,
        dayFilter,
        ratings: overrides,
      },
      { push: pushNext.current },
    )
    pushNext.current = false
    const id = window.setTimeout(() => {
      selfWrite.current = false
    }, 0)
    return () => window.clearTimeout(id)
  }, [tab, from, to, skipMd, compare, overrides, venueAdjust, showMatchday, dayFilter])

  useEffect(() => {
    function onNav() {
      if (selfWrite.current) return
      const url = parseHash()
      setState((prev) => {
        const from = url.from ?? prev.from
        const to = url.to ?? prev.to
        return {
          ...prev,
          tab: url.tab,
          from,
          to,
          skipMd: url.skip != null && url.skip > from && url.skip < to ? url.skip : null,
          compare: url.teams,
          venueAdjust: url.venueAdjust ?? prev.venueAdjust,
          showMatchday: url.showMatchday ?? prev.showMatchday,
          dayFilter: url.dayFilter ?? prev.dayFilter,
          overrides: url.ratings ?? prev.overrides,
        }
      })
    }
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)
    return () => {
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
      localStorage.setItem(VENUE_KEY, venueAdjust ? '1' : '0')
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden))
      localStorage.setItem(MATCHDAY_SPLIT_KEY, showMatchday ? '1' : '0')
    } catch {
      // private mode or quota — the URL still carries the whole state
      // (hidden teams excepted: that one's local-only, see initialState)
    }
  }, [overrides, venueAdjust, hidden, showMatchday])

  const patch = useCallback((next, { push = false } = {}) => {
    pushNext.current = push
    setState((prev) => ({ ...prev, ...next }))
  }, [])

  // Which days (TUE/WED/THU) the day filter can even offer, given the
  // currently visible matchdays — recomputed on every range/skip change.
  const mds = useVisibleMds(from, to, skipMd)
  const availableDayOptions = useMemo(() => availableDays(mds), [mds])

  // A day filter can go stale the moment the range changes (e.g. it was set
  // to "Thursday" while viewing MD1, then the range moved to MD2-8, which
  // has no Thursday fixtures at all) — fall back to "All" rather than
  // silently filtering everything out.
  useEffect(() => {
    if (dayFilter !== 'ALL' && !availableDayOptions.includes(dayFilter)) {
      patch({ dayFilter: 'ALL' })
    }
  }, [dayFilter, availableDayOptions, patch])

  const hiddenSet = useMemo(() => new Set(hidden), [hidden])

  const teams = useMemo(
    () =>
      INITIAL_TEAMS.map((t) => ({
        ...t,
        rating: overrides[t.id] ?? t.rating,
        // Seed rating: a stable sort key so editing a team doesn't make its row
        // jump, and the value behind the "was 4" hint in the Strength tab.
        baseRating: t.rating,
        modified: overrides[t.id] != null && overrides[t.id] !== t.rating,
        hidden: hiddenSet.has(t.id),
      })),
    [overrides, hiddenSet],
  )

  // teamsByAbbr always carries all 36 — a hidden team's rating is still
  // needed to colour *other* teams' fixtures against them, it just doesn't
  // get its own row. visibleTeams is what the table/rankings/comparisons
  // actually iterate over.
  const teamsByAbbr = useMemo(() => Object.fromEntries(teams.map((t) => [t.abbr, t])), [teams])
  const visibleTeams = useMemo(() => teams.filter((t) => !t.hidden), [teams])
  const modifiedCount = useMemo(() => teams.filter((t) => t.modified).length, [teams])

  const value = useMemo(
    () => ({
      teams,
      teamsByAbbr,
      visibleTeams,
      hiddenCount: hidden.length,
      modifiedCount,
      venueAdjust,
      showMatchday,
      dayFilter,
      availableDayOptions,
      tab,
      from,
      to,
      skipMd,
      compare,
      setTab: (id) => patch({ tab: TAB_IDS.includes(id) ? id : 'table' }, { push: true }),
      setShowMatchday: (on) => patch({ showMatchday: on }),
      setDayFilter: (day) => patch({ dayFilter: day }),
      hideTeam: (id) =>
        setState((prev) => (prev.hidden.includes(id) ? prev : { ...prev, hidden: [...prev.hidden, id] })),
      showTeam: (id) => setState((prev) => ({ ...prev, hidden: prev.hidden.filter((x) => x !== id) })),
      resetHidden: () => patch({ hidden: [] }),
      setRange: (nextFrom, nextTo) => {
        const to = Math.max(nextFrom, nextTo)
        // A range change can strand the skipped matchday outside it (or right
        // on an edge, where "skip" and "narrow the range" mean the same
        // thing) — drop it rather than keep a skip that no longer applies.
        const stillInside = skipMd != null && skipMd > nextFrom && skipMd < to
        patch({ from: nextFrom, to, skipMd: stillInside ? skipMd : null })
      },
      setSkipMd: (md) => patch({ skipMd: md }),
      setCompare: (ids) => patch({ compare: ids }),
      setVenueAdjust: (on) => patch({ venueAdjust: on }),
      setRating: (id, rating) =>
        setState((prev) => ({ ...prev, overrides: { ...prev.overrides, [id]: rating } })),
      resetTeam: (id) =>
        setState((prev) => {
          const next = { ...prev.overrides }
          delete next[id]
          return { ...prev, overrides: next }
        }),
      resetRatings: () => patch({ overrides: {} }),
    }),
    [
      teams,
      teamsByAbbr,
      visibleTeams,
      hidden.length,
      modifiedCount,
      venueAdjust,
      showMatchday,
      dayFilter,
      availableDayOptions,
      tab,
      from,
      to,
      skipMd,
      compare,
      patch,
    ],
  )

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeams must be used within TeamsProvider')
  return ctx
}
