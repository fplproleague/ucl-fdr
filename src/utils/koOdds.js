// Knockout odds: how likely each club is to reach each round, how many
// knockout matches it can still expect to play, and who it's likely to meet
// on the way. This is what a fantasy manager actually needs in the
// knockouts — a player whose club reaches the final plays up to nine more
// matches, one knocked out in the play-offs plays two.
//
// Everything is computed exactly (no simulation): each tie's winner is a
// probability distribution built from the two sides' distributions, and a
// draw that hasn't happened yet is averaged over every way it can come out.
import { KO_ROUNDS } from '../data/knockout.js'
import { PLAYOFF_PAIRS, R16_SLOTS, ROUND_ORDER, koStage, rankMap } from './bracket.js'

// The whole model in three numbers, kept deliberately simple: it runs on the
// same 1–5 strength ratings as the rest of the site, so it's only ever as
// good as those ratings — a rough guide, not a bookmaker.
//   twoLegs:       logistic slope per rating step over a two-legged tie
//                  (1 step ≈ 68%, 2 ≈ 82%, 3 ≈ 90%)
//   singleMatch:   flatter for the one-off final (1 step ≈ 65%)
//   secondLegHost: hosting the second leg is worth a tenth of a step
export const MODEL = { twoLegs: 0.75, singleMatch: 0.6, secondLegHost: 0.1 }

const LEGS = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r.legs]))

// Chance that side a beats side b. host2 is the index (0 = a, 1 = b) of the
// side hosting the second leg, or null for the neutral-venue final.
export function tieWinProb(ra, rb, round, host2) {
  const edge = host2 === 0 ? MODEL.secondLegHost : host2 === 1 ? -MODEL.secondLegHost : 0
  const k = round === 'F' ? MODEL.singleMatch : MODEL.twoLegs
  return 1 / (1 + Math.exp(-k * (ra - rb + edge)))
}

// Legs of a round still to be played on `today` — a round that's already
// under way only counts the legs left.
export function legsLeft(round, today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  return LEGS[round].filter((l) => l.end >= iso).length
}

// Every way the play-off draw can still come out (just the real one once
// it's been made): each pairing of 9/10 with 23/24 etc. has two outcomes.
function playoffDrawOptions(ko) {
  if (ko.playoffDraw) return [ko.playoffDraw]
  const at = (rank) => ko.standings[rank - 1]
  let draws = [[]]
  for (const {
    seeded: [s1, s2],
    unseeded: [u1, u2],
  } of PLAYOFF_PAIRS) {
    const straight = [
      [at(s1), at(u1)],
      [at(s2), at(u2)],
    ]
    const crossed = [
      [at(s1), at(u2)],
      [at(s2), at(u1)],
    ]
    draws = draws.flatMap((d) => [
      [...d, ...straight],
      [...d, ...crossed],
    ])
  }
  return draws
}

// Every way the R16 draw can still come out for a given play-off draw. Per
// seeded pair, two things are drawn: which seed goes to the top half, and
// which of the two play-off ties it meets — four outcomes per pair, 256 in
// all. Half of those are mirror images (every club in the other half), which
// give every club exactly the same odds, so the 1st seed is simply kept in
// the top half: 128 outcomes, same averages, half the work.
function r16DrawOptions(ko, playoffDraw) {
  if (ko.r16Draw) return [ko.r16Draw]
  const ranks = rankMap(ko.standings)
  let draws = [Array(8).fill(null)]
  R16_SLOTS.forEach((slot, k) => {
    const seeds = slot.seeds.map((r) => ko.standings[r - 1])
    const ties = playoffDraw
      .filter(([seeded]) => PLAYOFF_PAIRS[slot.playoffPair].seeded.includes(ranks[seeded]))
      .map(([seeded]) => seeded)
    const options = []
    for (const h of k === 0 ? [0] : [0, 1])
      for (const o of [0, 1])
        options.push([
          { seed: seeds[h], playoff: ties[o] },
          { seed: seeds[1 - h], playoff: ties[1 - o] },
        ])
    draws = draws.flatMap((d) =>
      options.map(([top, bottom]) => {
        const next = [...d]
        next[k] = top
        next[4 + k] = bottom
        return next
      }),
    )
  })
  return draws
}

// Clubs are indexed by finishing position (0 = 1st … 23 = 24th) and every
// accumulator is a flat typed array: the no-draw-yet case runs this 4,096
// times, and string-keyed objects made that take over a second on a laptop.
const N = 24
const R = ROUND_ORDER.length

// One concrete bracket (both draws fixed), weighted by how likely that draw
// is. Adds into the flat accumulators in `ctx`.
function propagate(ctx, playoffDraw, r16Draw, weight) {
  const { ko, winTable, forced, realIds, idx, reach, host2s, opp, win, exp, pending, legs } = ctx

  // A distribution is { t: [club indices], p: [probabilities] } — parallel
  // arrays and indexed loops, since this is the hot path.
  const one = (t) => ({ t: [t], p: [1] })
  const play = (id, r, A, B, host2) => {
    const real = realIds.has(id)
    const result = real ? ko.results?.[id] : null
    const legsHere = result ? 0 : legs[r]
    for (let side = 0; side < 2; side++) {
      const own = side ? B : A
      const other = side ? A : B
      for (let i = 0; i < own.t.length; i++) {
        const t = own.t[i]
        const w = weight * own.p[i]
        reach[r * N + t] += w
        exp[t] += w * legsHere
        pending[r * N + t] += w * legsHere
        if (host2 === side) host2s[r * N + t] += w
        const base = (r * N + t) * N
        for (let j = 0; j < other.t.length; j++) opp[base + other.t[j]] += w * other.p[j]
      }
    }

    if (result) return one(idx[result])
    const pick = real && forced[id] != null ? idx[forced[id]] : -1
    const table = (r * 3 + (host2 ?? 2)) * N * N
    const out = new Float64Array(N)
    for (let i = 0; i < A.t.length; i++) {
      const a = A.t[i]
      for (let j = 0; j < B.t.length; j++) {
        const b = B.t[j]
        const w = A.p[i] * B.p[j]
        if (pick === a || pick === b) {
          out[pick] += w
          continue
        }
        const p = winTable[table + a * N + b]
        out[a] += w * p
        out[b] += w * (1 - p)
      }
    }
    const dist = { t: [], p: [] }
    for (let i = 0; i < N; i++)
      if (out[i] > 0) {
        dist.t.push(i)
        dist.p.push(out[i])
      }
    return dist
  }

  const poWinner = new Array(N)
  playoffDraw.forEach(([seeded, unseeded], i) => {
    poWinner[idx[seeded]] = play(`PO${i + 1}`, 0, one(idx[seeded]), one(idx[unseeded]), 0)
  })
  const seededOf = (abbr) => idx[playoffDraw.find((t) => t.includes(abbr))[0]]

  // Each entry: winner distribution plus the slot's seeding rank, which
  // decides who hosts the second leg from the QF on.
  let prev = r16Draw.map(({ seed, playoff }, i) => ({
    dist: play(`R16-${i + 1}`, 1, one(idx[seed]), poWinner[seededOf(playoff)], 0),
    slotRank: idx[seed],
  }))
  for (const [r, prefix] of [
    [2, 'QF'],
    [3, 'SF'],
    [4, ''],
  ]) {
    const next = []
    for (let i = 0; i < prev.length; i += 2) {
      const [a, b] = [prev[i], prev[i + 1]]
      const id = r === 4 ? 'F' : `${prefix}${i / 2 + 1}`
      const host2 = r === 4 ? null : a.slotRank <= b.slotRank ? 0 : 1
      next.push({ dist: play(id, r, a.dist, b.dist, host2), slotRank: Math.min(a.slotRank, b.slotRank) })
    }
    prev = next
  }
  const final = prev[0].dist
  for (let i = 0; i < final.t.length; i++) win[final.t[i]] += weight * final.p[i]
}

// Odds for every club still in it (1st–24th), averaged over any draw that
// hasn't been made yet. `picks` are applied as certain winners — that's the
// "my bracket" view — but only for ties that really exist: before the R16
// draw, R16 tie ids don't mean anything yet.
export function knockoutOdds(ko, ratingOf, { picks = {}, today = new Date() } = {}) {
  const stage = koStage(ko)
  if (stage === 'pre') return []
  const clubs = ko.standings.slice(0, N)
  const idx = Object.fromEntries(clubs.map((abbr, i) => [abbr, i]))
  const realIds = new Set()
  if (ko.playoffDraw) ko.playoffDraw.forEach((_, i) => realIds.add(`PO${i + 1}`))
  if (ko.r16Draw) {
    for (let i = 1; i <= 8; i++) realIds.add(`R16-${i}`)
    ;['QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', 'F'].forEach((id) => realIds.add(id))
  }
  // Every pairing's odds up front, per round and per second-leg host
  // (0, 1, or none for the final): the inner loop then never calls Math.exp.
  const rating = clubs.map(ratingOf)
  const winTable = new Float64Array(R * 3 * N * N)
  ROUND_ORDER.forEach((round, r) => {
    for (let h = 0; h < 3; h++)
      for (let a = 0; a < N; a++)
        for (let b = 0; b < N; b++)
          winTable[(r * 3 + h) * N * N + a * N + b] = tieWinProb(rating[a], rating[b], round, h === 2 ? null : h)
  })
  const ctx = {
    ko,
    winTable,
    forced: picks,
    realIds,
    idx,
    reach: new Float64Array(R * N),
    host2s: new Float64Array(R * N),
    opp: new Float64Array(R * N * N),
    win: new Float64Array(N),
    exp: new Float64Array(N),
    pending: new Float64Array(R * N),
    legs: ROUND_ORDER.map((r) => legsLeft(r, today)),
  }

  const poDraws = playoffDrawOptions(ko)
  for (const poDraw of poDraws) {
    const r16Draws = r16DrawOptions(ko, poDraw)
    const weight = 1 / (poDraws.length * r16Draws.length)
    for (const r16Draw of r16Draws) propagate(ctx, poDraw, r16Draw, weight)
  }

  return clubs.map((abbr, t) => {
    const reach = {}
    // Opponents and home legs as "given that this club gets there".
    const path = {}
    ROUND_ORDER.forEach((round, r) => {
      const p = ctx.reach[r * N + t]
      reach[round] = p
      const opponents = []
      for (let o = 0; o < N; o++) {
        const w = ctx.opp[(r * N + t) * N + o]
        if (w > 0) opponents.push({ abbr: clubs[o], p: w / p })
      }
      opponents.sort((a, b) => b.p - a.p)
      // legsLeft: matches still to play in this round if the club gets
      // there — 0 once its tie in that round has a result.
      path[round] = {
        p,
        host2: p ? ctx.host2s[r * N + t] / p : 0,
        legsLeft: p ? ctx.pending[r * N + t] / p : 0,
        opponents,
      }
    })
    return { abbr, rank: t + 1, reach, win: ctx.win[t], expMatches: ctx.exp[t], path }
  })
}
