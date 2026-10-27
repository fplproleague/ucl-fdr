// Expected fantasy points per player over a window of knockout rounds.
//
//   points per club match = season points ÷ matches the club has played
//   expected points       = that × the club's expected matches in the window
//                           × a mild opponent adjustment
//
// Dividing by the *club's* matches rather than the player's own builds in
// rotation: a regular and a half-time sub with the same points per 90 don't
// project the same. The opponent adjustment is deliberately small — the
// points so far already reflect who the player has faced.
import { MATCHDAYS } from '../data/matchdays.js'
import { KO_ROUNDS } from '../data/knockout.js'
import { buildBracket, ROUND_ORDER } from './bracket.js'

// ±8% per rating step the opponents average away from 3 (an average side),
// capped at ±20%.
export const FIXTURE_WEIGHT = 0.08
const FIXTURE_CAP = 0.2

const LEGS = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r.legs]))

// How many matches each club has played by `today`: every league-phase
// matchday that has ended (all 36 play each one), plus every knockout leg
// that has ended in a tie the club is really in (results and draws only —
// never someone's bracket picks).
export function clubMatchesPlayed(ko, today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  const league = MATCHDAYS.filter((m) => m.end < iso).length
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

export function fixtureFactor(oppAvg) {
  if (oppAvg == null) return 1
  const f = FIXTURE_WEIGHT * (3 - oppAvg)
  return 1 + Math.max(-FIXTURE_CAP, Math.min(FIXTURE_CAP, f))
}

// `club` is the club's window stats ({ matches, oppAvg } from koWindow.js).
export function projectPlayer(player, club, clubMatches) {
  const ppm = clubMatches > 0 ? player.points / clubMatches : 0
  const minutesShare = clubMatches > 0 ? Math.min(1, player.minutes / (clubMatches * 90)) : 0
  const xPts = ppm * club.matches * fixtureFactor(club.oppAvg)
  return { ppm, minutesShare, matches: club.matches, oppAvg: club.oppAvg, xPts, value: xPts / player.price }
}
