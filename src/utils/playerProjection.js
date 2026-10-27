// Expected fantasy points per player over a range of matchdays (league
// phase) or a window of knockout rounds.
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
import { KO_ROUNDS } from '../data/knockout.js'
import { buildBracket, ROUND_ORDER } from './bracket.js'

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

const LEGS = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r.legs]))

// The knockout version of leagueMatchesPlayed, per club: every league-phase
// matchday that has ended, plus every knockout leg that has ended in a tie
// the club is really in (results and draws only — never someone's bracket
// picks).
export function clubMatchesPlayed(ko, today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  const league = leagueMatchesPlayed(today)
  const out = {}
  for (const abbr of ko.standings ?? []) out[abbr] = league
  const bracket = buildBracket(ko, {})
  for (const round of ROUND_ORDER) {
    const played = LEGS[round].filter((l) => l.end < iso).length
    if (!played) continue
    for (const tie of bracket.rounds[round])
      for (const side of tie.sides) if (side.abbr) out[side.abbr] = (out[side.abbr] ?? league) + played
  }
  return { byClub: out, league }
}

export function fixtureFactor(difficulty) {
  if (difficulty == null) return 1
  const f = FIXTURE_WEIGHT * (3 - difficulty)
  return 1 + Math.max(-FIXTURE_CAP, Math.min(FIXTURE_CAP, f))
}

// Points per match: points per 90 pulled towards `positionRate` (his
// position's average per 90, from positionRates), times his share of the
// club's minutes. Without a rate there's no regression and it's simply
// points ÷ club matches.
function pointsPerMatch(player, clubMatches, positionRate) {
  const minutesShare = clubMatches > 0 ? Math.min(1, player.minutes / (clubMatches * 90)) : 0
  const rawPpm = clubMatches > 0 ? player.points / clubMatches : 0
  const ppm =
    positionRate == null
      ? rawPpm
      : ((player.points + (PRIOR_MINUTES / 90) * positionRate) / (player.minutes + PRIOR_MINUTES)) * 90 * minutesShare
  return { ppm, rawPpm, minutesShare }
}

// League phase. `difficulties`: the effective difficulty (1–5,
// venue-adjusted, as the FDR chips show it) of each of his fixtures in the
// range.
export function projectLeaguePlayer(player, difficulties, clubMatches, positionRate) {
  const rate = pointsPerMatch(player, clubMatches, positionRate)
  const xPts = difficulties.reduce((sum, d) => sum + rate.ppm * fixtureFactor(d), 0)
  return { ...rate, matches: difficulties.length, xPts, value: xPts / player.price }
}

// Knockouts. `club` is the club's window stats ({ matches, oppAvg } from
// koWindow.js): expected matches rather than known fixtures, and the
// average strength of the likely opponents as the difficulty.
export function projectPlayer(player, club, clubMatches, positionRate) {
  const rate = pointsPerMatch(player, clubMatches, positionRate)
  const xPts = rate.ppm * club.matches * fixtureFactor(club.oppAvg)
  return { ...rate, matches: club.matches, oppAvg: club.oppAvg, xPts, value: xPts / player.price }
}
