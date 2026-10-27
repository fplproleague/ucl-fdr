// Expected fantasy points per player over a range of matchdays.
//
//   points per 90     = season points per 90 minutes, pulled towards the
//                       average for his position (see PRIOR_MINUTES)
//   minutes share     = his minutes ÷ (matches the club has played × 90)
//   points per match  = points per 90 × minutes share
//   expected points   = Σ over his fixtures in the range of points per
//                       match × a mild fixture adjustment
//
// The minutes share builds in rotation: a regular and a half-time sub with
// the same points per 90 don't project the same. The fixture adjustment is
// deliberately small — the points so far already reflect who he has faced.
import { MATCHDAYS } from '../data/matchdays.js'

// ±8% per step a fixture's difficulty sits away from 3 (average), capped
// at ±20%.
export const FIXTURE_WEIGHT = 0.08
const FIXTURE_CAP = 0.2

// Regression to the mean: every player's points per 90 is worked out as if
// he'd also played this many minutes at his position's average rate. Early
// in the season that stops one big haul in a cameo (17 points in 30
// minutes) from outranking a regular; it matters less and less as real
// minutes pile up, and barely moves a player who has played every minute.
export const PRIOR_MINUTES = 180

// League-phase matchdays that have ended by `today` — every club plays
// each one, so this is every club's match count.
export function leagueMatchesPlayed(today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  return MATCHDAYS.filter((m) => m.end < iso).length
}

// Average points per 90 for each position, over everyone who has played:
// the rate each player is pulled towards.
export function positionRates(players) {
  const totals = {}
  for (const p of players) {
    if (!(p.minutes > 0)) continue
    const t = (totals[p.position] ??= { points: 0, minutes: 0 })
    t.points += p.points
    t.minutes += p.minutes
  }
  return Object.fromEntries(Object.entries(totals).map(([pos, t]) => [pos, (t.points / t.minutes) * 90]))
}

export function fixtureFactor(difficulty) {
  if (difficulty == null) return 1
  const f = FIXTURE_WEIGHT * (3 - difficulty)
  return 1 + Math.max(-FIXTURE_CAP, Math.min(FIXTURE_CAP, f))
}

// `difficulties`: the effective difficulty (1–5, venue-adjusted, as the FDR
// chips show it) of each of his fixtures in the range. `positionRate`: his
// position's average points per 90 (positionRates); without it there's no
// regression and points per match is simply points ÷ club matches.
export function projectLeaguePlayer(player, difficulties, clubMatches, positionRate) {
  const minutesShare = clubMatches > 0 ? Math.min(1, player.minutes / (clubMatches * 90)) : 0
  const rawPpm = clubMatches > 0 ? player.points / clubMatches : 0
  const ppm =
    positionRate == null
      ? rawPpm
      : ((player.points + (PRIOR_MINUTES / 90) * positionRate) / (player.minutes + PRIOR_MINUTES)) * 90 * minutesShare
  const xPts = difficulties.reduce((sum, d) => sum + ppm * fixtureFactor(d), 0)
  return { ppm, rawPpm, minutesShare, matches: difficulties.length, xPts, value: xPts / player.price }
}

// The Players tab shows a relative score rather than a points total: this
// model only knows form and fixtures — not injuries, team news, expected
// minutes or expected goals — so it shouldn't dress up as a points
// prediction. 100 is the best player over the range; `valueScore` does the
// same per €1m. Taken over every player passed in (the whole sheet, before
// any filter), so a filter never changes anyone's score.
export function relativeScores(projections) {
  const best = Math.max(0, ...projections.map((p) => p.xPts))
  const bestValue = Math.max(0, ...projections.map((p) => p.value))
  return new Map(
    projections.map((p) => [
      p.id,
      {
        score: best > 0 ? (p.xPts / best) * 100 : 0,
        valueScore: bestValue > 0 ? (p.value / bestValue) * 100 : 0,
      },
    ]),
  )
}
