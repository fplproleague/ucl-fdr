import { useEffect, useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { fitEstimator, indexOdds } from './oddsView.js'

// The odds archive (src/data/odds.js), loaded once for every tab that uses
// it — Odds, the team panel, Players, Best Runs, GK Rotation, Strength —
// and only when one of them opens, never with the site itself.
let loading = null
let loaded = null
function loadOdds() {
  loading ??= import('../data/odds.js').then(({ ODDS }) => {
    loaded = ODDS
    return ODDS
  })
  return loading
}

// { odds, index, estimator }: odds is null until it has loaded; index and
// estimator work either way (empty, and the default fit, until then). The
// estimate uses the ratings as they are set, overrides included.
export function useOdds() {
  const { teamsByAbbr } = useTeams()
  const [odds, setOdds] = useState(loaded)
  useEffect(() => {
    if (odds) return undefined
    let cancelled = false
    loadOdds().then((o) => {
      if (!cancelled) setOdds(o)
    })
    return () => {
      cancelled = true
    }
  }, [odds])
  const index = useMemo(() => indexOdds(odds), [odds])
  const estimator = useMemo(() => fitEstimator(odds, (abbr) => teamsByAbbr[abbr]?.rating ?? 3), [odds, teamsByAbbr])
  return { odds, index, estimator }
}
