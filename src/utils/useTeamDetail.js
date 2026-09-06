import { useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'

// The team detail panel is opened from three places (FDR Table, Best Runs,
// Compare) with identical open/close/compare wiring — one hook instead of
// three copies of the same three lines.
export function useTeamDetail() {
  const { setCompare, setTab } = useTeams()
  const [detailAbbr, setDetailAbbr] = useState(null)

  return {
    detailAbbr,
    openTeam: (team) => setDetailAbbr(team.abbr),
    closeDetail: () => setDetailAbbr(null),
    // Preselects the viewed team in Compare and switches to it — reuses the
    // exact setters the site's own tab navigation already uses, no second
    // comparison mechanism.
    compareTeam: (abbr) => {
      setCompare([abbr])
      setTab('compare')
      setDetailAbbr(null)
    },
  }
}
