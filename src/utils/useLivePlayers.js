import { useEffect, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'
import { PLAYERS as FALLBACK_PLAYERS } from '../data/players.js'
import { buildClubLookup } from './parseGoalkeepersCsv.js'
import { parsePlayerRows } from './parsePlayersCsv.js'

// The published player sheet (File → Share → Publish to web → CSV). Left
// null until it exists: the Players view then falls back to the bundled
// snapshot in src/data/players.js. scripts/build-players.mjs reads the same
// constant, so this is the one place to paste the link.
export const PLAYERS_SHEET_URL = null

const CLUB_LOOKUP = buildClubLookup(INITIAL_TEAMS)

// Same pattern as useLiveGoalkeepers: fetch the sheet in the browser so an
// edit shows up without a redeploy, and keep the bundled snapshot for
// anyone who can't reach Google (ad-blockers, privacy extensions, offline).
export function useLivePlayers() {
  const [state, setState] = useState({
    players: FALLBACK_PLAYERS,
    loading: PLAYERS_SHEET_URL != null,
    live: false,
  })

  useEffect(() => {
    if (!PLAYERS_SHEET_URL) return
    let cancelled = false
    fetch(PLAYERS_SHEET_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const { players, errors } = parsePlayerRows(text, CLUB_LOOKUP)
        if (errors.length) console.warn('Player sheet: skipped invalid rows —', errors)
        if (players.length === 0) throw new Error('Sheet had no valid rows')
        setState({ players, loading: false, live: true })
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('Player sheet: could not load live data, using the bundled fallback —', err)
        setState((s) => ({ ...s, loading: false, live: false }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
