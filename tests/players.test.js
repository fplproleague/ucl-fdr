import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { demoPlayers } from '../src/data/playersDemo.js'
import { buildClubLookup } from '../src/utils/parseGoalkeepersCsv.js'
import { parsePlayerRows } from '../src/utils/parsePlayersCsv.js'
import { fixtureFactor, leagueMatchesPlayed, projectLeaguePlayer } from '../src/utils/playerProjection.js'

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
})
