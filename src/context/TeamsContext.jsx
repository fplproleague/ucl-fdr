import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'

const STORAGE_KEY = 'ucl-fdr:ratings:v1'

const TeamsContext = createContext(null)

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function TeamsProvider({ children }) {
  const [overrides, setOverrides] = useState(loadOverrides)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }, [overrides])

  const teams = useMemo(
    () =>
      INITIAL_TEAMS.map((t) => ({
        ...t,
        rating: overrides[t.id] ?? t.rating,
        // Original seed rating — used as a stable sort key so editing a
        // team's live rating doesn't make it jump to a different spot.
        baseRating: t.rating,
      })),
    [overrides],
  )

  const teamsByAbbr = useMemo(() => Object.fromEntries(teams.map((t) => [t.abbr, t])), [teams])

  function setRating(id, rating) {
    setOverrides((prev) => ({ ...prev, [id]: rating }))
  }

  function resetRatings() {
    setOverrides({})
  }

  const value = { teams, teamsByAbbr, setRating, resetRatings }

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeams must be used within TeamsProvider')
  return ctx
}
