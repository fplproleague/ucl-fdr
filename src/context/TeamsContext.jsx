import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { parseHash, writeHash, TAB_IDS } from '../utils/urlState.js'

const STORAGE_KEY = 'ucl-fdr:ratings:v1'
const VENUE_KEY = 'ucl-fdr:venue-adjust:v1'

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

// A link always beats local storage: someone opening a shared ticker should see
// the ticker they were sent, not the ratings they last set on their own phone.
function initialState() {
  const url = parseHash()
  return {
    tab: url.tab,
    from: url.from ?? 1,
    to: url.to ?? TOTAL_MATCHDAYS,
    compare: url.teams,
    overrides: url.ratings ?? readStoredOverrides(),
    venueAdjust: url.venueAdjust ?? readStoredVenueAdjust(),
  }
}

export function TeamsProvider({ children }) {
  const [state, setState] = useState(initialState)
  const { tab, from, to, compare, overrides, venueAdjust } = state

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
        teams: tab === 'compare' ? compare : [],
        venueAdjust,
        ratings: overrides,
      },
      { push: pushNext.current },
    )
    pushNext.current = false
    const id = window.setTimeout(() => {
      selfWrite.current = false
    }, 0)
    return () => window.clearTimeout(id)
  }, [tab, from, to, compare, overrides, venueAdjust])

  useEffect(() => {
    function onNav() {
      if (selfWrite.current) return
      const url = parseHash()
      setState((prev) => ({
        ...prev,
        tab: url.tab,
        from: url.from ?? prev.from,
        to: url.to ?? prev.to,
        compare: url.teams,
        venueAdjust: url.venueAdjust ?? prev.venueAdjust,
        overrides: url.ratings ?? prev.overrides,
      }))
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
    } catch {
      // private mode or quota — the URL still carries the whole state
    }
  }, [overrides, venueAdjust])

  const patch = useCallback((next, { push = false } = {}) => {
    pushNext.current = push
    setState((prev) => ({ ...prev, ...next }))
  }, [])

  const teams = useMemo(
    () =>
      INITIAL_TEAMS.map((t) => ({
        ...t,
        rating: overrides[t.id] ?? t.rating,
        // Seed rating: a stable sort key so editing a team doesn't make its row
        // jump, and the value behind the "was 4" hint in the Strength tab.
        baseRating: t.rating,
        modified: overrides[t.id] != null && overrides[t.id] !== t.rating,
      })),
    [overrides],
  )

  const teamsByAbbr = useMemo(() => Object.fromEntries(teams.map((t) => [t.abbr, t])), [teams])
  const modifiedCount = useMemo(() => teams.filter((t) => t.modified).length, [teams])

  const value = useMemo(
    () => ({
      teams,
      teamsByAbbr,
      modifiedCount,
      venueAdjust,
      tab,
      from,
      to,
      compare,
      setTab: (id) => patch({ tab: TAB_IDS.includes(id) ? id : 'table' }, { push: true }),
      setRange: (nextFrom, nextTo) => patch({ from: nextFrom, to: Math.max(nextFrom, nextTo) }),
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
    [teams, teamsByAbbr, modifiedCount, venueAdjust, tab, from, to, compare, patch],
  )

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeams must be used within TeamsProvider')
  return ctx
}
