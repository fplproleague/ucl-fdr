import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { KNOCKOUT } from '../src/data/knockout.js'
import { DEMO_STAGES, demoKnockout } from '../src/data/knockoutDemo.js'
import {
  buildBracket,
  favouritePicks,
  koStage,
  parsePicks,
  prunePicks,
  serializePicks,
  validateKnockout,
} from '../src/utils/bracket.js'

const IDS = INITIAL_TEAMS.map((t) => t.id)
const rating = Object.fromEntries(INITIAL_TEAMS.map((t) => [t.id, t.rating]))

// The real data is the one that matters most: every time a draw or result
// is typed into src/data/knockout.js, this is what catches the typo.
test('the real knockout data follows the format', () => {
  assert.deepEqual(validateKnockout(KNOCKOUT, IDS), [])
})

for (const stage of DEMO_STAGES) {
  test(`demo data (${stage}) follows the format`, () => {
    const ko = demoKnockout(stage)
    assert.equal(koStage(ko), stage)
    assert.deepEqual(validateKnockout(ko, IDS), [])
  })
}

test('the validator catches a play-off tie the format does not allow', () => {
  const ko = demoKnockout('playoffs')
  const swapped = ko.playoffDraw.map((t) => [...t])
  // 9th against 17th instead of 23rd/24th.
  swapped[0][1] = ko.standings[16]
  const errors = validateKnockout({ ...ko, playoffDraw: swapped }, IDS)
  assert.ok(
    errors.some((e) => e.includes('can only meet')),
    errors.join('\n'),
  )
})

test('the validator catches an R16 seed in the wrong bracket slot', () => {
  const ko = demoKnockout('bracket')
  const r16Draw = ko.r16Draw.map((t) => ({ ...t }))
  ;[r16Draw[0].seed, r16Draw[1].seed] = [r16Draw[1].seed, r16Draw[0].seed]
  assert.ok(validateKnockout({ ...ko, r16Draw }, IDS).some((e) => e.includes('bracket slot')))
})

test('seeds host the second leg, and the higher slot keeps it from the QF on', () => {
  const ko = demoKnockout('bracket')
  const b = buildBracket(
    ko,
    favouritePicks(ko, {}, (a) => rating[a]),
  )
  for (const t of [...b.rounds.PO, ...b.rounds.R16]) assert.equal(t.home2, 0)
  // QF1 is the 1st seed's slot against the 7th's: the 1st seed's side hosts.
  assert.equal(b.rounds.QF[0].slotRank, 1)
  assert.equal(b.rounds.QF[0].home2, 0)
  // 1st and 2nd can only meet in the final.
  assert.deepEqual(
    b.rounds.SF.map((t) => t.slotRank),
    [1, 2],
  )
  assert.equal(b.rounds.F[0].home2, null)
})

test("a club that knocks out a seed inherits that seed's slot", () => {
  const ko = demoKnockout('bracket')
  const r16 = buildBracket(ko).rounds.R16[0]
  const upset = r16.sides[1].abbr
  const b = buildBracket(ko, { [r16.id]: upset })
  assert.equal(b.rounds.QF[0].sides[0].abbr, upset)
  assert.equal(b.rounds.QF[0].home2, 0)
})

test('favourites fill the whole bracket and name a champion', () => {
  const ko = demoKnockout('bracket')
  const b = buildBracket(
    ko,
    favouritePicks(ko, {}, (a) => rating[a]),
  )
  assert.ok(b.champion)
  assert.ok([...b.rounds.R16, ...b.rounds.QF, ...b.rounds.SF, ...b.rounds.F].every((t) => t.winner))
})

test('real results beat picks, and picks for clubs no longer in a tie are dropped', () => {
  const ko = demoKnockout('bracket')
  const po = buildBracket(ko).rounds.PO.find((t) => t.result)
  const loser = po.sides.find((s) => s.abbr !== po.result).abbr
  const b = buildBracket(ko, { [po.id]: loser })
  assert.equal(b.rounds.PO.find((t) => t.id === po.id).winner, po.result)

  const full = favouritePicks(ko, {}, (a) => rating[a])
  const qf = buildBracket(ko, full).rounds.QF[0]
  // Flip the R16 tie that put this QF's first side there: the old QF pick
  // can't stand if it named the club that's now out.
  const r16 = buildBracket(ko, full).rounds.R16[0]
  const other = r16.sides.find((s) => s.abbr !== r16.pick).abbr
  const pruned = prunePicks(ko, { ...full, [r16.id]: other })
  assert.equal(qf.pick, r16.pick)
  assert.equal(pruned[qf.id], undefined)
  assert.equal(pruned[r16.id], other)
})

test('picks survive a round trip through the URL', () => {
  const ko = demoKnockout('bracket')
  const picks = favouritePicks(ko, {}, (a) => rating[a])
  const str = serializePicks(picks)
  assert.ok(str.length <= 69)
  assert.deepEqual(parsePicks(str), picks)
  assert.equal(serializePicks({}), '')
  assert.deepEqual(parsePicks('---ARS'), { PO2: 'ARS' })
})
