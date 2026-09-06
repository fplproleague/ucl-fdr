import { useMemo } from 'react'
import { FIXTURES } from '../data/fixtures.js'
import { averageDifficulty, difficultyBand, effectiveDifficulty, homeCount } from './difficulty.js'

// Shared row builder so the table, the runs list and the comparison can never
// disagree about what a team's average is.
export function useFixtureRows(teams, teamsByAbbr, mds, venueAdjust) {
  return useMemo(() => {
    return teams.map((team) => {
      const all = FIXTURES[team.abbr] ?? []
      const cells = mds.map((md) => all.find((f) => f.gw === md) ?? null)
      const inRange = cells.filter(Boolean)
      return {
        team,
        cells,
        fixtures: inRange,
        avg: averageDifficulty(inRange, teamsByAbbr, venueAdjust),
        homes: homeCount(inRange),
        veryHard: inRange.filter(
          (f) =>
            difficultyBand(
              effectiveDifficulty(
                teamsByAbbr[f.opp]?.rating ?? 3,
                f.venue,
                venueAdjust,
                teamsByAbbr[f.opp]?.awayDifficulty ?? 0,
              ),
            ) === 5,
        ).length,
        seasonAvg: averageDifficulty(all, teamsByAbbr, venueAdjust),
      }
    })
  }, [teams, teamsByAbbr, mds, venueAdjust])
}
