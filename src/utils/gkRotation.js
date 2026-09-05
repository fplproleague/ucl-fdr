import { FIXTURES } from '../data/fixtures.js'
import { effectiveDifficulty, difficultyBand } from './difficulty.js'

// A fixture this easy or easier already reads as green/very-green everywhere
// else in the app (see RATING_COLORS in src/data/teams.js) — reused here as
// the "favourable" cut-off rather than inventing a new one.
export const FAVOURABLE_BAND = 2

// Per-matchday, per-team fact: the same live FDR band the rest of the app
// shows (team strength + Home/away + Away Difficulty, whatever the user has
// set), plus the day the fixture is played on. No goalkeeper-specific
// calculation exists — this is the existing FDR pipeline applied to a team.
function fixtureFact(fixture, teamsByAbbr, venueAdjust) {
  if (!fixture) return null
  const opponent = teamsByAbbr[fixture.opp]
  const band = difficultyBand(
    effectiveDifficulty(opponent?.rating ?? 3, fixture.venue, venueAdjust, opponent?.awayDifficulty ?? 0),
  )
  return { opp: fixture.opp, venue: fixture.venue, day: fixture.day, band, favourable: band <= FAVOURABLE_BAND }
}

// Matchday-by-matchday comparison of two teams' fixtures — the building
// block for both the complement list and the detailed MD-by-MD view.
export function compareTeamFixtures(teamAAbbr, teamBAbbr, mds, teamsByAbbr, venueAdjust) {
  const fixturesA = FIXTURES[teamAAbbr] ?? []
  const fixturesB = FIXTURES[teamBAbbr] ?? []

  return mds.map((md) => {
    const a = fixtureFact(fixturesA.find((f) => f.gw === md) ?? null, teamsByAbbr, venueAdjust)
    const b = fixtureFact(fixturesB.find((f) => f.gw === md) ?? null, teamsByAbbr, venueAdjust)
    return {
      md,
      a,
      b,
      differentDay: !!(a && b && a.day !== b.day),
      atLeastOneFavourable: !!(a?.favourable || b?.favourable),
      bothFavourable: !!(a?.favourable && b?.favourable),
    }
  })
}

// Plain counts over a comparison — facts, not a score.
export function summarizeComparison(rows) {
  return {
    total: rows.length,
    differentDays: rows.filter((r) => r.differentDay).length,
    atLeastOneFavourable: rows.filter((r) => r.atLeastOneFavourable).length,
    bothFavourable: rows.filter((r) => r.bothFavourable).length,
  }
}

// Ranks complement candidates by the priority the user asked for: more
// different-day matchdays first, then more matchdays with at least one
// favourable fixture, then more matchdays where both are favourable. Three
// separate tie-breakers applied in order — never combined into one number.
export function compareComplementSummaries(a, b) {
  if (a.summary.differentDays !== b.summary.differentDays) return b.summary.differentDays - a.summary.differentDays
  if (a.summary.atLeastOneFavourable !== b.summary.atLeastOneFavourable) {
    return b.summary.atLeastOneFavourable - a.summary.atLeastOneFavourable
  }
  if (a.summary.bothFavourable !== b.summary.bothFavourable) return b.summary.bothFavourable - a.summary.bothFavourable
  return a.gk.name.localeCompare(b.gk.name)
}
