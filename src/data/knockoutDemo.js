// A made-up knockout phase for previewing the Bracket tab before the real
// draws exist (open #/bracket?demo=playoffs or ?demo=bracket). The "table"
// is simply the seed ratings order from teams.js — it isn't a prediction.
import { INITIAL_TEAMS } from './teams.js'
import { PLAYOFF_PAIRS, R16_SLOTS } from '../utils/bracket.js'

export const DEMO_STAGES = ['standings', 'playoffs', 'bracket']

export function demoKnockout(stage) {
  const standings = INITIAL_TEAMS.map((t) => t.id)
  const at = (rank) => standings[rank - 1]
  if (stage === 'standings') return { standings, playoffDraw: null, r16Draw: null, results: {} }

  // 9th v 24th, 10th v 23rd, and so on: one of the two outcomes the draw allows.
  const playoffDraw = PLAYOFF_PAIRS.flatMap(({ seeded, unseeded }) => [
    [at(seeded[0]), at(unseeded[1])],
    [at(seeded[1]), at(unseeded[0])],
  ])
  if (stage === 'playoffs') return { standings, playoffDraw, r16Draw: null, results: {} }

  // Top half takes the first club of every seeded pair, bottom half the
  // second; each seed meets the play-off tie of the *lower* seeded club.
  const tieOf = (rank) => playoffDraw.find(([s]) => s === at(rank))
  const r16Draw = [0, 1].flatMap((half) =>
    R16_SLOTS.map((slot) => ({
      seed: at(slot.seeds[half]),
      playoff: tieOf(PLAYOFF_PAIRS[slot.playoffPair].seeded[1 - half])[0],
    })),
  )
  // Play-offs already decided: the seeded club goes through, bar one upset.
  const results = Object.fromEntries(
    playoffDraw.map(([seeded, unseeded], i) => [`PO${i + 1}`, i === 4 ? unseeded : seeded]),
  )
  return { standings, playoffDraw, r16Draw, results }
}
