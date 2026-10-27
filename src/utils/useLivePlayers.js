import { useEffect, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'
import { buildClubLookup } from './parseGoalkeepersCsv.js'
import { parsePlayerRows } from './parsePlayersCsv.js'

// The published player sheet (File → Share → Publish to web → CSV).
// scripts/build-players.mjs reads the same constant, so this is the one
// place to change the link.
export const PLAYERS_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDHtvsAuMevNEK7EY2Qb9izLEbM4ur2bcg0mfglOeIB4B_3QO-sE99-v5s01nhCptSdMkJVcLNKCvu/pub?gid=1616142534&single=true&output=csv'

const CLUB_LOOKUP = buildClubLookup(INITIAL_TEAMS)

// Same pattern as useLiveGoalkeepers: fetch the sheet in the browser so an
// edit shows up without a redeploy, and keep a saved copy (src/data/
// players.js, refreshed on every build) for anyone who can't reach Google —
// ad-blockers, privacy extensions, offline. That copy holds 500+ players, so
// it's loaded only when this hook mounts (the Players tab), never as part of
// the bundle every other tab downloads.
export function useLivePlayers() {
  const [state, setState] = useState({ players: [], loading: true, live: false })

  useEffect(() => {
    let cancelled = false
    let gotLive = false

    import('../data/players.js').then(({ PLAYERS }) => {
      if (!cancelled && !gotLive) setState((s) => ({ ...s, players: PLAYERS, loading: PLAYERS_SHEET_URL != null }))
    })

    if (!PLAYERS_SHEET_URL) return undefined
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
        gotLive = true
        setState({ players, loading: false, live: true })
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('Player sheet: could not load live data, using the saved copy —', err)
        setState((s) => ({ ...s, loading: false, live: false }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
