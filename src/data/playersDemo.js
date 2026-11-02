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
        ownership: Math.round((team.rating - 1) * 6 * share + wobble * 10),
        // Spread evenly over the matchdays played, so the details have a form line.
        form: Array.from({ length: matchesPlayed }, (_, i) => ({
          md: i + 1,
          points: Math.floor(points / matchesPlayed) + (i < points % matchesPlayed ? 1 : 0),
        })),
        domestic: demoDomestic(t, r, position, team.rating),
      }
    }),
  )
}

// Five made-up league matches, so the Domestic / Both form switch has
// something to show in the demo. Some players sit out a game or two.
function demoDomestic(t, r, position, rating) {
  const attack = { GK: 0, DEF: 0.1, MID: 0.3, FWD: 0.5 }[position]
  return Array.from({ length: 5 }, (_, i) => {
    const seed = (t * 31 + r * 17 + i * 7) % 20
    const min = seed < 2 ? 0 : seed < 5 ? 25 : 90
    const involvement = min ? Math.round(attack * (rating / 3) * (seed % 4) * 0.6) : 0
    return {
      d: `2026-10-${String(4 + i * 6).padStart(2, '0')}`,
      opp: `League side ${i + 1}`,
      v: i % 2 ? 'A' : 'H',
      gc: seed % 3,
      min,
      g: Math.ceil(involvement / 2),
      a: Math.floor(involvement / 2),
    }
  })
}
