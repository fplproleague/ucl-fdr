// Expected fantasy points per player over a range of matchdays.
//
//   points per club match = season points ÷ matches the club has played
//   expected points       = Σ over the player's fixtures in the range of
//                           points per club match × a mild fixture adjustment
//
// Dividing by the *club's* matches rather than the player's own builds in
// rotation: a regular and a half-time sub with the same points per 90 don't
// project the same. The fixture adjustment is deliberately small — the
// points so far already reflect who the player has faced.
import { MATCHDAYS } from '../data/matchdays.js'

// ±8% per step a fixture's difficulty sits away from 3 (average), capped
// at ±20%.
export const FIXTURE_WEIGHT = 0.08
const FIXTURE_CAP = 0.2

// League-phase matchdays that have ended by `today` — every club plays
// each one, so this is every club's match count.
export function leagueMatchesPlayed(today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  return MATCHDAYS.filter((m) => m.end < iso).length
}

export function fixtureFactor(difficulty) {
  if (difficulty == null) return 1
  const f = FIXTURE_WEIGHT * (3 - difficulty)
  return 1 + Math.max(-FIXTURE_CAP, Math.min(FIXTURE_CAP, f))
}

// `difficulties`: the effective difficulty (1–5, venue-adjusted, as the FDR
// chips show it) of each of the player's fixtures in the range.
export function projectLeaguePlayer(player, difficulties, clubMatches) {
  const ppm = clubMatches > 0 ? player.points / clubMatches : 0
  const minutesShare = clubMatches > 0 ? Math.min(1, player.minutes / (clubMatches * 90)) : 0
  const xPts = difficulties.reduce((sum, d) => sum + ppm * fixtureFactor(d), 0)
  return { ppm, minutesShare, matches: difficulties.length, xPts, value: xPts / player.price }
}
