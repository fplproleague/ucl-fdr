import { FIXTURES } from '../data/fixtures.js'

// One matchday's fixtures reshaped from "36 team rows" into "18 matches" —
// each match appears twice in FIXTURES (once per side), so the home side's
// entry is picked as the canonical record. Matches involving a hidden team
// are left out, same as the team-row views. Consumers should not assume
// day-of-week ordering; sort by whatever grouping they need (see
// matchdaySplit.js's DAY_ORDER for the TUE/WED/THU convention).
export function matchesForMatchday(md, teamsByAbbr) {
  const matches = []
  for (const abbr of Object.keys(FIXTURES)) {
    const fixture = FIXTURES[abbr].find((f) => f.gw === md)
    if (!fixture || fixture.venue !== 'H') continue
    const home = teamsByAbbr[abbr]
    const away = teamsByAbbr[fixture.opp]
    if (!home || !away || home.hidden || away.hidden) continue
    matches.push({ home, away, day: fixture.day })
  }
  return matches
}
