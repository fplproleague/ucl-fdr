import { useEffect, useState } from 'react'
import { INITIAL_TEAMS } from '../data/teams.js'
import { GOALKEEPERS as FALLBACK_GOALKEEPERS } from '../data/goalkeepers.js'
import { parseGoalkeeperRows } from './parseGoalkeepersCsv.js'

// Same published sheet scripts/build-goalkeepers.mjs reads — one source,
// fetched directly by the browser here so editing the sheet takes effect
// immediately, with no rebuild or redeploy. The bundled src/data/
// goalkeepers.js is only the offline fallback for when the sheet can't be
// reached right now (network hiccup, ad-blocker, offline).
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT05F7C7W82oQEVdr3tSg_h5T3u3xXEh-FobEgnXwKvuGGWxwusdau5eeREapT28lRxgia51VVoXYPw/pub?gid=0&single=true&output=csv'

const NAME_TO_ABBR = Object.fromEntries(INITIAL_TEAMS.map((t) => [t.name, t.abbr]))

export function useLiveGoalkeepers() {
  const [state, setState] = useState({ goalkeepers: FALLBACK_GOALKEEPERS, loading: true, live: false })

  useEffect(() => {
    let cancelled = false

    fetch(SHEET_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const { goalkeepers, errors } = parseGoalkeeperRows(text, NAME_TO_ABBR)
        if (errors.length) console.warn('GK sheet: skipped invalid rows —', errors)
        if (goalkeepers.length === 0) throw new Error('Sheet had no valid rows')
        setState({ goalkeepers, loading: false, live: true })
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('GK sheet: could not load live data, using the bundled fallback —', err)
        setState((s) => ({ ...s, loading: false, live: false }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
