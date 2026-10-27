import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { demoKnockout } from '../src/data/knockoutDemo.js'
import { demoPlayers } from '../src/data/playersDemo.js'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import { clubMatchesPlayed, fixtureFactor, projectPlayer } from '../src/utils/playerProjection.js'

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

test('club matches count ended matchdays and real knockout legs only', () => {
  const ko = demoKnockout('bracket')
  // Mid-March: the league phase (8) and both play-off legs are done, and
  // the R16 first leg (9–10 Mar) too.
  const { byClub, league } = clubMatchesPlayed(ko, new Date('2027-03-12'))
  assert.equal(league, 8)
  assert.equal(byClub[ko.standings[0]], 9) // bye, then R16 leg 1
  const poWinner = ko.results.PO1
  assert.equal(byClub[poWinner], 11) // two play-off legs + R16 leg 1
})

test('projection: points per club match × expected matches, mildly fixture-adjusted', () => {
  const player = { points: 40, minutes: 720, price: 8 }
  const p = projectPlayer(player, { matches: 2, oppAvg: 3 }, 8)
  assert.equal(p.ppm, 5)
  assert.equal(p.xPts, 10)
  assert.equal(p.minutesShare, 1)
  assert.equal(p.value, 10 / 8)
  assert.ok(fixtureFactor(1) > 1 && fixtureFactor(5) < 1)
  assert.equal(fixtureFactor(-10), 1.2)
})

test('demo players are valid sheet rows for every club', () => {
  const players = demoPlayers()
  assert.equal(players.length, INITIAL_TEAMS.length * 6)
  assert.equal(new Set(players.map((p) => p.id)).size, players.length)
  assert.ok(players.every((p) => p.price > 0 && p.points >= 0 && p.minutes <= 720))
})
