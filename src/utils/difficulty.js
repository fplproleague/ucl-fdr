import { RATING_COLORS } from '../data/teams.js'

// How much a venue moves a fixture's difficulty. Half a step is deliberate:
// combined with the band thresholds below it makes a home tie land exactly one
// colour band easier than the same tie away, while the extremes (a 5-rated side
// away, a 1-rated side at home) stay pinned — which is how they actually feel.
export const VENUE_DELTA = 0.5

export function clamp(n, min = 1, max = 5) {
  return Math.min(max, Math.max(min, n))
}

// Difficulty of one fixture on a continuous 1–5 scale.
export function effectiveDifficulty(oppRating, venue, venueAdjust = true) {
  if (!venueAdjust) return oppRating
  return clamp(oppRating + (venue === 'A' ? VENUE_DELTA : -VENUE_DELTA))
}

// Continuous difficulty → one of the five colour bands.
// Thresholds are b + 0.5, so 4.5 → band 4 and 4.5001 → band 5.
export function difficultyBand(effective) {
  return clamp(Math.ceil(effective - 0.5) || 1)
}

export function ratingColor(band) {
  return RATING_COLORS[band] ?? RATING_COLORS[3]
}

export function formatAvg(avg) {
  return Number.isFinite(avg) ? avg.toFixed(2) : '–'
}

// Average difficulty across a set of fixtures, venue-adjusted when enabled.
export function averageDifficulty(fixtures, teamsByAbbr, venueAdjust = true) {
  if (!fixtures.length) return Infinity
  const total = fixtures.reduce(
    (sum, f) => sum + effectiveDifficulty(teamsByAbbr[f.opp]?.rating ?? 3, f.venue, venueAdjust),
    0,
  )
  return total / fixtures.length
}

export function homeCount(fixtures) {
  return fixtures.filter((f) => f.venue === 'H').length
}

// Ranking comparator: easiest average first, then more home games, then fewer
// very-hard fixtures, then alphabetical. Without this, teams tied on average
// (three sit on exactly 3.00 over MD1–8) fall back to array order, which is
// arbitrary and looks like a bug.
export function compareRuns(a, b) {
  if (a.avg !== b.avg) return a.avg - b.avg
  if (a.homes !== b.homes) return b.homes - a.homes
  if (a.veryHard !== b.veryHard) return a.veryHard - b.veryHard
  return a.team.name.localeCompare(b.team.name)
}

export function describeFixture(oppName, venue, band) {
  const label = RATING_COLORS[band]?.label ?? 'Average'
  return `${oppName} ${venue === 'H' ? 'at home' : 'away'} — ${label}, difficulty ${band} of 5`
}
