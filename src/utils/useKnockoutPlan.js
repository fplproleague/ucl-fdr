import { useMemo, useState } from 'react'
import { knockoutOdds } from './koOdds.js'
import { nextRound, sameWindow, squadWindow, windowPresets, windowStats } from './koWindow.js'

// The odds and the "Plan for" window, shared by the Outlook and Players
// views so switching between them keeps the same window. Odds are only
// computed while one of those views is open (`enabled`): the no-draw-yet
// case is the one expensive calculation on the site.
export function useKnockoutPlan({ ko, picks, mode, teamsByAbbr, enabled }) {
  const [chosen, setChosen] = useState(null)
  const odds = useMemo(
    () =>
      enabled
        ? knockoutOdds(ko, (abbr) => teamsByAbbr[abbr]?.rating ?? 3, { picks: mode === 'mine' ? picks : {} })
        : [],
    [enabled, ko, picks, mode, teamsByAbbr],
  )
  const next = nextRound(odds)
  const presets = useMemo(() => windowPresets(next), [next])
  // A chosen window only counts while it's still on offer (the next round
  // moves on as results come in); otherwise, the squad window.
  const plan = useMemo(
    () => presets.find((w) => sameWindow(w, chosen)) ?? (next ? squadWindow(next) : null),
    [presets, chosen, next],
  )

  // Each club's expected matches and average opponent strength in the window.
  const clubStats = useMemo(() => {
    if (!plan) return {}
    const ratingOf = (abbr) => teamsByAbbr[abbr]?.rating ?? 3
    return Object.fromEntries(odds.map((t) => [t.abbr, windowStats(t, plan, ratingOf)]))
  }, [odds, plan, teamsByAbbr])

  return { odds, presets, plan, setPlan: setChosen, clubStats }
}
