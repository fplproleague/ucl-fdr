import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { DEMO_STAGES, demoKnockout } from '../src/data/knockoutDemo.js'
import { buildBracket, favouritePicks } from '../src/utils/bracket.js'
import { knockoutOdds, tieWinProb } from '../src/utils/koOdds.js'

const rating = Object.fromEntries(INITIAL_TEAMS.map((t) => [t.id, t.rating]))
const ratingOf = (abbr) => rating[abbr] ?? 3
// Before the knockouts start, so every leg still counts.
const today = new Date('2027-01-01')
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`)
const sum = (odds, f) => odds.reduce((s, t) => s + f(t), 0)

test('tie odds: even when equal, favour the stronger side and the second-leg host', () => {
  close(tieWinProb(3, 3, 'QF', null), 0.5, 'equal, neutral')
  assert.ok(tieWinProb(3, 3, 'QF', 0) > 0.5)
  assert.ok(tieWinProb(5, 3, 'QF', 1) > 0.75)
  close(tieWinProb(4, 2, 'R16', 0) + tieWinProb(2, 4, 'R16', 1), 1, 'complementary')
})

for (const stage of DEMO_STAGES) {
  test(`odds add up at every round (${stage})`, () => {
    const odds = knockoutOdds(demoKnockout(stage), ratingOf, { today })
    assert.equal(odds.length, 24)
    close(
      sum(odds, (t) => t.reach.PO),
      16,
      'PO',
    )
    close(
      sum(odds, (t) => t.reach.R16),
      16,
      'R16',
    )
    close(
      sum(odds, (t) => t.reach.QF),
      8,
      'QF',
    )
    close(
      sum(odds, (t) => t.reach.SF),
      4,
      'SF',
    )
    close(
      sum(odds, (t) => t.reach.F),
      2,
      'F',
    )
    close(
      sum(odds, (t) => t.win),
      1,
      'champion',
    )
    // Top 8 skip the play-offs and are certain of the R16.
    for (const t of odds.filter((t) => t.rank <= 8)) {
      close(t.reach.PO, 0, `${t.abbr} PO`)
      close(t.reach.R16, 1, `${t.abbr} R16`)
    }
  })
}

test('an unmade play-off draw is averaged over both outcomes', () => {
  const ko = demoKnockout('standings')
  const ninth = knockoutOdds(ko, ratingOf, { today }).find((t) => t.rank === 9)
  const opps = Object.fromEntries(ninth.path.PO.opponents.map((o) => [o.abbr, o.p]))
  close(opps[ko.standings[22]], 0.5, '23rd')
  close(opps[ko.standings[23]], 0.5, '24th')
  // The play-off seed always hosts the second leg.
  close(ninth.path.PO.host2, 1, 'host')
})

test('real results knock clubs out, and expected matches only count what is left', () => {
  const ko = demoKnockout('bracket')
  const odds = knockoutOdds(ko, ratingOf, { today })
  const po = buildBracket(ko).rounds.PO[0]
  const loser = po.sides.find((s) => s.abbr !== po.result).abbr
  const l = odds.find((t) => t.abbr === loser)
  close(l.reach.R16, 0, 'loser R16')
  close(l.expMatches, 0, 'played tie counts nothing')
  close(l.path.PO.legsLeft, 0, 'no legs left in a decided tie')
  const top = odds.find((t) => t.rank === 1)
  // At least the two R16 legs, at most 2+2+2+1 more.
  assert.ok(top.expMatches > 2 && top.expMatches < 7, String(top.expMatches))
})

test('my bracket: picks are certain, so a full bracket gives one sure champion', () => {
  const ko = demoKnockout('bracket')
  const picks = favouritePicks(ko, {}, ratingOf)
  const champ = buildBracket(ko, picks).champion
  const odds = knockoutOdds(ko, ratingOf, { picks, today })
  close(odds.find((t) => t.abbr === champ).win, 1, 'champion')
  close(odds.find((t) => t.abbr === champ).expMatches, 7, 'R16 to final')
})

test('the full unknown-draw case stays fast', () => {
  const t0 = performance.now()
  knockoutOdds(demoKnockout('standings'), ratingOf, { today })
  assert.ok(performance.now() - t0 < 1500)
})
