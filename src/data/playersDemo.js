// Made-up players for previewing the Players view before the real sheet
// exists (#/bracket?demo=…&v=players). Named by club and role on purpose
// ("Arsenal MID 1") so nobody mistakes them for real numbers.
import { INITIAL_TEAMS } from './teams.js'

const ROLES = [
  ['GK', 1, 3.6, 4.5],
  ['DEF', 1, 3.8, 5],
  ['DEF', 2, 3.2, 4.5],
  ['MID', 1, 5.2, 7.5],
  ['MID', 2, 4.0, 6],
  ['FWD', 1, 5.6, 8],
]

export function demoPlayers(matchesPlayed = 8) {
  return INITIAL_TEAMS.flatMap((team, t) =>
    ROLES.map(([position, n, perMatch, basePrice], r) => {
      // Stronger clubs score more and cost more; the small wobble keeps
      // clubs on the same rating from producing identical rows.
      const wobble = ((t * 7 + r * 3) % 5) / 10
      const share = 0.65 + (((t + r) * 13) % 35) / 100
      const points = Math.round(perMatch * (0.55 + 0.12 * team.rating + wobble / 2) * matchesPlayed * share)
      return {
        id: `${team.id.toLowerCase()}-${position.toLowerCase()}-${n}`,
        name: `${team.shortName ?? team.name} ${position}${position === 'GK' || position === 'FWD' ? '' : ` ${n}`}`,
        team: team.id,
        position,
        price: Math.round((basePrice + (team.rating - 3) * 0.75 + wobble) * 2) / 2,
        points,
        minutes: Math.round(matchesPlayed * 90 * share),
      }
    }),
  )
}
