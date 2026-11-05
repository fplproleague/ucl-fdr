import { useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'

// The team detail panel is opened from several places (FDR Table, Best Runs,
// Odds) with identical open/close/compare wiring — one hook instead of
// three copies of the same three lines.
export function useTeamDetail() {
  const { setCompare, setTab } = useTeams()
  const [detailAbbr, setDetailAbbr] = useState(null)

  return {
    detailAbbr,
    openTeam: (team) => setDetailAbbr(team.abbr),
    closeDetail: () => setDetailAbbr(null),
    // Opens the FDR table comparing this team (pick the others there) —
    // reuses the exact setters the site's own tab navigation already uses,
    // no second comparison mechanism.
    compareTeam: (abbr) => {
      setCompare([abbr])
      setTab('table')
      setDetailAbbr(null)
    },
  }
}
