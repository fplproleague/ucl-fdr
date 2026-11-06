import { useTeams } from '../context/TeamsContext.jsx'

// The team detail panel is opened from several places (FDR Table, Best Runs,
// Odds) with identical open/close/compare wiring — one hook instead of
// three copies of the same lines. Which team is open lives in TeamsContext
// (and the link: &team=VIL), not here, so the back button can close it.
export function useTeamDetail() {
  const { setCompare, setTab, detail, openTeam, closeTeam } = useTeams()

  return {
    detailAbbr: detail,
    openTeam: (team) => openTeam(team.abbr),
    closeDetail: closeTeam,
    // Opens the FDR table comparing this team (pick the others there) —
    // reuses the exact setters the site's own tab navigation already uses,
    // no second comparison mechanism. The tab change closes the panel.
    compareTeam: (abbr) => {
      setCompare([abbr])
      setTab('table')
    },
  }
}
