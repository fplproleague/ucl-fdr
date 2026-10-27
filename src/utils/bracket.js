// Bracket logic for the knockout phase: who meets whom, who hosts the second
// leg, and how a user's picks carry through to the final.
//
// The format (2025/26 onwards, unchanged for 2026/27):
// - 1st–8th skip the play-offs; 9th–24th play them; 25th–36th are out.
// - Play-off ties pair 9/10 with 23/24, 11/12 with 21/22, 13/14 with 19/20
//   and 15/16 with 17/18 — the draw only decides which of the two.
// - In the R16, 1/2 meet the winners of the 15/16–17/18 ties, 3/4 the
//   13/14–19/20 winners, 5/6 the 11/12–21/22 winners and 7/8 the
//   9/10–23/24 winners. The two clubs of a seeded pair always go to
//   opposite halves.
// - There's no QF or SF draw: within each half, the 1/2 slot meets the 7/8
//   slot and the 3/4 slot meets the 5/6 slot in the quarter-finals, and
//   those two winners meet in the semi-final.
// - The second leg is hosted by the higher-ranked side: the seeded club in
//   the play-offs and R16, and from the QF on the side whose bracket slot
//   was seeded higher. A club that knocks out a seed takes over that seed's
//   slot — the ranking isn't recalculated after each round.

export const PLAYOFF_PAIRS = [
  { seeded: [9, 10], unseeded: [23, 24] },
  { seeded: [11, 12], unseeded: [21, 22] },
  { seeded: [13, 14], unseeded: [19, 20] },
  { seeded: [15, 16], unseeded: [17, 18] },
]

// One entry per R16 slot within a half, in bracket order. `playoffPair`
// indexes PLAYOFF_PAIRS.
export const R16_SLOTS = [
  { seeds: [1, 2], playoffPair: 3 },
  { seeds: [7, 8], playoffPair: 0 },
  { seeds: [3, 4], playoffPair: 2 },
  { seeds: [5, 6], playoffPair: 1 },
]

export const ROUND_ORDER = ['PO', 'R16', 'QF', 'SF', 'F']

export const TIE_IDS = [
  ...Array.from({ length: 8 }, (_, i) => `PO${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `R16-${i + 1}`),
  'QF1',
  'QF2',
  'QF3',
  'QF4',
  'SF1',
  'SF2',
  'F',
]

export function rankMap(standings) {
  return Object.fromEntries((standings ?? []).map((abbr, i) => [abbr, i + 1]))
}

// How far the real-world knockout phase has got, i.e. what the Bracket tab
// can offer: nothing yet, the qualified clubs, play-off picks, or the full
// bracket.
export function koStage(ko) {
  if (!ko.standings) return 'pre'
  if (!ko.playoffDraw) return 'standings'
  if (!ko.r16Draw) return 'playoffs'
  return 'bracket'
}

// The clubs behind each play-off pairing, before the draw splits them up.
export function playoffPairTeams(standings) {
  const at = (rank) => standings[rank - 1] ?? null
  return PLAYOFF_PAIRS.map((pair) => ({
    ...pair,
    seededTeams: pair.seeded.map(at),
    unseededTeams: pair.unseeded.map(at),
  }))
}

function playoffTies(ko) {
  const ranks = rankMap(ko.standings)
  return (ko.playoffDraw ?? []).map(([seeded, unseeded], i) => ({
    id: `PO${i + 1}`,
    seeded,
    unseeded,
    seededRank: ranks[seeded] ?? null,
  }))
}

function findPlayoffTie(ties, abbr) {
  return ties.find((t) => t.seeded === abbr || t.unseeded === abbr) ?? null
}

// Every format rule the hand-entered data has to satisfy. Returns a list of
// human-readable problems — empty means the data describes a real bracket.
export function validateKnockout(ko, knownIds) {
  const errors = []
  const known = new Set(knownIds)
  if (!ko.standings) return errors

  const seen = new Set()
  ko.standings.forEach((abbr, i) => {
    if (!known.has(abbr)) errors.push(`standings[${i}]: unknown club "${abbr}"`)
    if (seen.has(abbr)) errors.push(`standings: "${abbr}" listed twice`)
    seen.add(abbr)
  })
  if (ko.standings.length < 24) errors.push(`standings: need at least 24 clubs, got ${ko.standings.length}`)
  const ranks = rankMap(ko.standings)

  if (!ko.playoffDraw) return errors
  if (ko.playoffDraw.length !== 8) errors.push(`playoffDraw: need 8 ties, got ${ko.playoffDraw.length}`)
  const inPlayoffs = new Set()
  ko.playoffDraw.forEach(([seeded, unseeded], i) => {
    const s = ranks[seeded]
    const u = ranks[unseeded]
    for (const abbr of [seeded, unseeded]) {
      if (inPlayoffs.has(abbr)) errors.push(`playoffDraw: "${abbr}" drawn twice`)
      inPlayoffs.add(abbr)
    }
    const pair = PLAYOFF_PAIRS.find((p) => p.seeded.includes(s))
    if (!pair) errors.push(`playoffDraw[${i}]: "${seeded}" finished ${s ?? '?'}th, not 9th–16th`)
    else if (!pair.unseeded.includes(u))
      errors.push(`playoffDraw[${i}]: ${s}th can only meet ${pair.unseeded.join('th/')}th, not "${unseeded}" (${u ?? '?'}th)`)
  })

  if (!ko.r16Draw) return errors
  if (ko.r16Draw.length !== 8) errors.push(`r16Draw: need 8 ties, got ${ko.r16Draw.length}`)
  const ties = playoffTies(ko)
  const usedTies = new Set()
  ko.r16Draw.forEach(({ seed, playoff }, i) => {
    const slot = R16_SLOTS[i % 4]
    const rank = ranks[seed]
    if (!slot.seeds.includes(rank))
      errors.push(`r16Draw[${i}]: this bracket slot is for the ${slot.seeds.join('/')} seeds, not "${seed}" (${rank ?? '?'}th)`)
    const tie = findPlayoffTie(ties, playoff)
    if (!tie) {
      errors.push(`r16Draw[${i}]: "${playoff}" isn't in any play-off tie`)
      return
    }
    if (usedTies.has(tie.id)) errors.push(`r16Draw[${i}]: play-off tie ${tie.id} used twice`)
    usedTies.add(tie.id)
    if (!PLAYOFF_PAIRS[slot.playoffPair].seeded.includes(tie.seededRank))
      errors.push(`r16Draw[${i}]: the ${slot.seeds.join('/')} seeds meet a ${PLAYOFF_PAIRS[slot.playoffPair].seeded.join('/')} play-off tie, not ${tie.id}`)
  })

  for (const [id, winner] of Object.entries(ko.results ?? {})) {
    if (!TIE_IDS.includes(id)) errors.push(`results: unknown tie id "${id}"`)
    else if (!known.has(winner)) errors.push(`results.${id}: unknown club "${winner}"`)
  }
  return errors
}

function makeTie(id, round, sides, home2, slotRank, ko, picks) {
  const known = sides.map((s) => s.abbr).filter(Boolean)
  const result = ko.results?.[id] ?? null
  const pick = known.includes(picks[id]) ? picks[id] : null
  return { id, round, sides, home2, slotRank, result, pick, winner: result ?? pick }
}

function sideFrom(tie, ranks) {
  return { abbr: tie.winner, rank: tie.winner ? (ranks[tie.winner] ?? null) : null, from: tie.id, fromSides: tie.sides }
}

// The whole knockout phase as far as it's known, with `picks` ({tieId: club})
// filling in whatever hasn't been played. A real result always wins over a
// pick, and a pick for a club that isn't in that tie (any more) is ignored.
export function buildBracket(ko, picks = {}) {
  const stage = koStage(ko)
  const ranks = rankMap(ko.standings)
  const rounds = { PO: [], R16: [], QF: [], SF: [], F: [] }
  if (stage === 'pre' || stage === 'standings') return { stage, rounds, champion: null, r16Pools: [] }

  const poTies = playoffTies(ko)
  const poById = {}
  for (const t of poTies) {
    const tie = makeTie(
      t.id,
      'PO',
      [
        { abbr: t.seeded, rank: ranks[t.seeded] ?? null },
        { abbr: t.unseeded, rank: ranks[t.unseeded] ?? null },
      ],
      0,
      t.seededRank,
      ko,
      picks,
    )
    poById[t.id] = tie
    rounds.PO.push(tie)
  }
  // Shown in seeding order (9th's tie first), whatever order the draw was typed in.
  rounds.PO.sort((a, b) => a.slotRank - b.slotRank)

  // Between the two draws: which top-8 clubs could meet which play-off ties.
  const r16Pools =
    stage === 'playoffs'
      ? R16_SLOTS.map((slot) => ({
          seeds: slot.seeds.map((r) => ({ abbr: ko.standings[r - 1], rank: r })),
          ties: rounds.PO.filter((t) => PLAYOFF_PAIRS[slot.playoffPair].seeded.includes(t.slotRank)),
        }))
      : []
  if (stage === 'playoffs') return { stage, rounds, champion: null, r16Pools }

  ko.r16Draw.forEach(({ seed, playoff }, i) => {
    const feeder = poById[findPlayoffTie(poTies, playoff)?.id]
    rounds.R16.push(
      makeTie(
        `R16-${i + 1}`,
        'R16',
        [{ abbr: seed, rank: ranks[seed] ?? null }, feeder ? sideFrom(feeder, ranks) : { abbr: null }],
        0,
        ranks[seed] ?? null,
        ko,
        picks,
      ),
    )
  })

  const advance = (prev, round, prefix) => {
    for (let i = 0; i < prev.length; i += 2) {
      const [a, b] = [prev[i], prev[i + 1]]
      const id = round === 'F' ? 'F' : `${prefix}${i / 2 + 1}`
      const home2 = round === 'F' ? null : a.slotRank <= b.slotRank ? 0 : 1
      rounds[round].push(
        makeTie(id, round, [sideFrom(a, ranks), sideFrom(b, ranks)], home2, Math.min(a.slotRank, b.slotRank), ko, picks),
      )
    }
  }
  advance(rounds.R16, 'QF', 'QF')
  advance(rounds.QF, 'SF', 'SF')
  advance(rounds.SF, 'F', '')

  return { stage, rounds, champion: rounds.F[0]?.winner ?? null, r16Pools }
}

export function allTies(bracket) {
  return ROUND_ORDER.flatMap((r) => bracket.rounds[r])
}

// Only the picks that still mean something — called after every change, so
// changing a play-off winner clears the later picks that relied on it rather
// than leaving them dangling in the URL.
export function prunePicks(ko, picks) {
  const out = {}
  for (const tie of allTies(buildBracket(ko, picks))) if (tie.pick) out[tie.id] = tie.pick
  return out
}

// Fills every still-open tie with the stronger club (by the user's own
// ratings), the better-ranked one on a tie. Existing picks are kept. Works
// round by round, since who's in a QF depends on the R16 picks before it.
export function favouritePicks(ko, picks, ratingOf) {
  let next = { ...picks }
  for (const round of ROUND_ORDER) {
    for (const tie of buildBracket(ko, next).rounds[round]) {
      if (tie.result || tie.pick || !tie.sides[0].abbr || !tie.sides[1].abbr) continue
      const [a, b] = tie.sides
      const ra = ratingOf(a.abbr)
      const rb = ratingOf(b.abbr)
      next[tie.id] = ra !== rb ? (ra > rb ? a.abbr : b.abbr) : (a.rank ?? 99) <= (b.rank ?? 99) ? a.abbr : b.abbr
    }
  }
  return next
}

// Picks travel in the link as one 3-letter club id per tie in TIE_IDS order,
// "---" for an open tie, trailing open ties dropped: a full bracket is 69
// characters, short enough to tweet alongside the URL.
export function serializePicks(picks) {
  return TIE_IDS.map((id) => picks[id] ?? '---')
    .join('')
    .replace(/(---)+$/, '')
}

export function parsePicks(str) {
  if (!str) return null
  const out = {}
  TIE_IDS.forEach((id, i) => {
    const chunk = str.slice(i * 3, i * 3 + 3).toUpperCase()
    if (/^[A-Z]{3}$/.test(chunk)) out[id] = chunk
  })
  return out
}
