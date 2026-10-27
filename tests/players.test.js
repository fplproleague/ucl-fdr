import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { demoPlayers } from '../src/data/playersDemo.js'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import {
  PRIOR_MINUTES,
  fixtureFactor,
  leagueMatchesPlayed,
  positionRates,
  projectLeaguePlayer,
} from '../src/utils/playerProjection.js'

const lookup = buildClubLookup(INITIAL_TEAMS)

test('the player sheet parses any column order, aliases and short club names', () => {
  const csv = [
    'Minutes,Points,Price,Position,Club,Player',
    '620,42,"9,5",Midfielder,Man. City,Someone',
    ',,4.5,gk,bodo glimt,Keeper',
  ].join('\n')
  const { players, errors } = parsePlayerRows(csv, lookup)
  assert.deepEqual(errors, [])
  assert.deepEqual(players[0], {
    id: 'someone',
    name: 'Someone',
    team: 'MCI',
    position: 'MID',
    price: 9.5,
    points: 42,
    minutes: 620,
  })
  // Empty points/minutes: hasn't played yet, not a broken row.
  assert.equal(players[1].team, 'BOD')
  assert.equal(players[1].points, 0)
})

test('bad rows are reported and skipped, never guessed', () => {
  const csv = [
    'Player,Club,Position,Price,Points,Minutes',
    'A,Nowhere FC,MID,5,1,90',
    'B,Arsenal,Winger,5,1,90',
    'C,Arsenal,MID,free,1,90',
    'D,Arsenal,FWD,7,10,180',
  ].join('\n')
  const { players, errors } = parsePlayerRows(csv, lookup)
  assert.equal(errors.length, 3)
  assert.deepEqual(
    players.map((p) => p.name),
    ['D'],
  )
  assert.match(parsePlayerRows('Player,Club\nA,Arsenal', lookup).errors[0], /Missing column/)
})

test('club matches count the league-phase matchdays that have ended', () => {
  assert.equal(leagueMatchesPlayed(new Date('2026-09-01')), 0)
  // MD3 ended 21 Oct, MD4 starts 3 Nov.
  assert.equal(leagueMatchesPlayed(new Date('2026-10-27')), 3)
  assert.equal(leagueMatchesPlayed(new Date('2027-02-01')), 8)
})

test('projection: points per club match over each fixture, mildly adjusted', () => {
  const player = { points: 15, minutes: 270, price: 7.5 }
  const p = projectLeaguePlayer(player, [3, 3], 3)
  assert.equal(p.ppm, 5)
  assert.equal(p.xPts, 10)
  assert.equal(p.minutesShare, 1)
  assert.equal(p.value, 10 / 7.5)
  // Easier fixtures project more, harder ones less, within ±20%.
  assert.ok(projectLeaguePlayer(player, [1.5, 1.5], 3).xPts > 10)
  assert.ok(projectLeaguePlayer(player, [5, 5], 3).xPts < 10)
  assert.equal(fixtureFactor(-10), 1.2)
  // Before any matchday has been played there's no form to go on.
  assert.equal(projectLeaguePlayer(player, [3], 0).xPts, 0)
})

test('demo players are valid sheet rows for every club', () => {
  const players = demoPlayers()
  assert.equal(players.length, INITIAL_TEAMS.length * 6)
  assert.equal(new Set(players.map((p) => p.id)).size, players.length)
  assert.ok(players.every((p) => p.price > 0 && p.points >= 0 && p.minutes <= 720))
  assert.ok(players.every((p) => p.form.reduce((s, f) => s + f.points, 0) === p.points))
})

test('optional columns: player id, ownership, apps, per-matchday points and stats', () => {
  const csv = [
    'Player,Club,Position,Price,Points,Minutes,Apps,MD1,MD2,MD3,MD4,Goals,Assists,Saves,Ownership %,Player ID,Pts/90',
    'H. Kane,Bayern München,FWD,"11,1",34,270,3,9,13,12,,4,2,0,51,250016833.0,11.33',
    'No Extras,Arsenal,MID,5,0,0,0,,,,,,,,,,',
  ].join('\n')
  const { players, errors } = parsePlayerRows(csv, lookup)
  assert.deepEqual(errors, [])
  const [kane, blank] = players
  // A spreadsheet's "250016833.0" is the same id as "250016833".
  assert.equal(kane.id, 'p250016833')
  assert.equal(kane.ownership, 51)
  assert.equal(kane.apps, 3)
  // MD4 is blank: not played yet, so not in the form line (and not a zero).
  assert.deepEqual(
    kane.form.map((f) => f.points),
    [9, 13, 12],
  )
  assert.deepEqual(kane.stats, { goals: 4, assists: 2, saves: 0 })
  // Blank optional cells leave the field out rather than inventing a 0.
  assert.equal(blank.ownership, undefined)
  assert.equal(blank.form, undefined)
  assert.equal(blank.id, 'no-extras')
})

test('the saved copy of the player sheet is valid', async () => {
  const { PLAYERS } = await import('../src/data/players.js')
  const clubs = new Set(INITIAL_TEAMS.map((t) => t.id))
  assert.equal(new Set(PLAYERS.map((p) => p.id)).size, PLAYERS.length)
  for (const p of PLAYERS) {
    assert.ok(clubs.has(p.team), `${p.name}: ${p.team}`)
    assert.ok(['GK', 'DEF', 'MID', 'FWD'].includes(p.position), p.name)
    assert.ok(p.price > 0 && p.minutes >= 0, p.name)
    // Where the sheet gives per-matchday points, they add up to the total.
    if (p.form)
      assert.equal(
        p.form.reduce((s, f) => s + f.points, 0),
        p.points,
        p.name,
      )
  }
})

test('regression to the mean: a cameo haul is pulled back, a regular barely moves', () => {
  const rates = positionRates([
    { position: 'MID', points: 12, minutes: 270 },
    { position: 'MID', points: 0, minutes: 0 }, // didn't play: not part of the average
  ])
  assert.equal(rates.MID, 4)

  // 3 club matches. Regular: every minute, 12 points per match.
  const regular = projectLeaguePlayer({ points: 36, minutes: 270, price: 8 }, [3], 3, rates.MID)
  // Cameo: one 30-minute appearance worth 17 points.
  const cameo = projectLeaguePlayer({ points: 17, minutes: 30, price: 6 }, [3], 3, rates.MID)
  assert.equal(regular.rawPpm, 12)
  // (36 + 2 × 4) / (270 + 180) × 90 × 1 = 8.8
  assert.ok(Math.abs(regular.ppm - ((36 + (PRIOR_MINUTES / 90) * 4) / 450) * 90) < 1e-9)
  // Raw, the cameo looks like 5.7 a match; pulled back, well under the regular.
  assert.ok(cameo.rawPpm > 5 && cameo.ppm < 1.5, String(cameo.ppm))
  assert.ok(regular.xPts > cameo.xPts * 5)
  // Without a position rate there's no regression at all.
  assert.equal(projectLeaguePlayer({ points: 36, minutes: 270, price: 8 }, [3], 3).ppm, 12)
})

test('scores are relative: 100 for the best, and per €m judged separately', async () => {
  const { relativeScores } = await import('../src/utils/playerProjection.js')
  const scores = relativeScores([
    { id: 'a', xPts: 40, value: 4 },
    { id: 'b', xPts: 20, value: 5 },
    { id: 'c', xPts: 0, value: 0 },
  ])
  assert.deepEqual(scores.get('a'), { score: 100, valueScore: 80 })
  assert.deepEqual(scores.get('b'), { score: 50, valueScore: 100 })
  assert.deepEqual(scores.get('c'), { score: 0, valueScore: 0 })
  // Nobody with any points (before MD1): everyone 0, no division by zero.
  assert.deepEqual(relativeScores([{ id: 'x', xPts: 0, value: 0 }]).get('x'), { score: 0, valueScore: 0 })
})
