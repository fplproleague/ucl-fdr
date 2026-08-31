// One-off generator for PLACEHOLDER GW1-8 fixtures (circle/round-robin method).
// Run with: node scripts/gen-placeholder-fixtures.mjs
// Produces src/data/fixtures.js. Real fixtures will replace this file's
// FIXTURES object once provided.
import { INITIAL_TEAMS } from '../src/data/teams.js'

const abbrs = INITIAL_TEAMS.map((t) => t.abbr)
const n = abbrs.length // 36
const rounds = 8

// Standard circle method: fix index 0, rotate the rest.
const arr = [...abbrs]
const schedule = [] // schedule[round] = [[home, away], ...]

for (let r = 0; r < rounds; r++) {
  const roundPairs = []
  for (let i = 0; i < n / 2; i++) {
    const a = arr[i]
    const b = arr[n - 1 - i]
    // Alternate home/away across rounds and pair position to balance venues.
    const homeFirst = (i + r) % 2 === 0
    roundPairs.push(homeFirst ? [a, b] : [b, a])
  }
  schedule.push(roundPairs)

  // rotate all but the first element one step clockwise
  const fixed = arr[0]
  const rest = arr.slice(1)
  rest.unshift(rest.pop())
  arr.splice(0, arr.length, fixed, ...rest)
}

const fixturesByTeam = Object.fromEntries(abbrs.map((a) => [a, []]))

schedule.forEach((roundPairs, idx) => {
  const gw = idx + 1
  roundPairs.forEach(([home, away]) => {
    fixturesByTeam[home].push({ gw, opp: away, venue: 'H' })
    fixturesByTeam[away].push({ gw, opp: home, venue: 'A' })
  })
})

abbrs.forEach((a) => fixturesByTeam[a].sort((x, y) => x.gw - y.gw))

const out = `// PLACEHOLDER fixtures for GW1-8, generated with a round-robin circle
// method so every team has 8 distinct opponents with a realistic H/A split.
// Replace the FIXTURES object below with the real UCL league-phase fixtures
// once they're available (see scripts/gen-placeholder-fixtures.mjs).
export const TOTAL_GAMEWEEKS = ${rounds}

export const FIXTURES = ${JSON.stringify(fixturesByTeam, null, 2)}
`

process.stdout.write(out)
