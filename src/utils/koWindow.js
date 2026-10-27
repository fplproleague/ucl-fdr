// The planning window for a fantasy squad in the knockouts. UCL Fantasy
// gives unlimited transfers before some rounds (the play-offs and the R16 in
// the 2025/26 rules) and only a handful before the rest, so a squad picked
// for one round has to last until the next unlimited round — or, from the
// R16 on, all the way to the final.
import { KO_ROUNDS } from '../data/knockout.js'
import { ROUND_ORDER } from './bracket.js'

const RESETS = new Set(KO_ROUNDS.filter((r) => r.transfers[0] === 'Unlimited').map((r) => r.id))

// The first round in which anyone still has a match to play.
export function nextRound(odds) {
  return ROUND_ORDER.find((r) => odds.some((t) => t.path[r].p * t.path[r].legsLeft > 0)) ?? null
}

// From `from` up to the round before the next unlimited-transfer round.
export function squadWindow(from) {
  const i = ROUND_ORDER.indexOf(from)
  const reset = ROUND_ORDER.findIndex((r, j) => j > i && RESETS.has(r))
  return { from, to: reset === -1 ? 'F' : ROUND_ORDER[reset - 1] }
}

export function roundsIn({ from, to }) {
  return ROUND_ORDER.slice(ROUND_ORDER.indexOf(from), ROUND_ORDER.indexOf(to) + 1)
}

// Expected matches inside the window, and how strong the opponents in those
// matches are on average (weighted by how many of them the club is expected
// to play) — the two numbers behind "which clubs are worth stacking".
export function windowStats(team, window, ratingOf) {
  let matches = 0
  let weighted = 0
  for (const r of roundsIn(window)) {
    const step = team.path[r]
    const m = step.p * step.legsLeft
    if (!m) continue
    matches += m
    weighted += m * step.opponents.reduce((s, o) => s + o.p * ratingOf(o.abbr), 0)
  }
  return { matches, oppAvg: matches ? weighted / matches : null }
}
