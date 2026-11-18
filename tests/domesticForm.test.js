import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_TEAMS } from '../src/data/teams.js'
import { demoPlayers } from '../src/data/playersDemo.js'
import {
  buildTeamGames,
  domesticPoints,
  domesticSummary,
  gamesFor,
  uclMatchday,
  matchApiTeam,
  matchSquadPlayer,
  pickDomesticLeague,
} from '../src/utils/domesticForm.js'
import { blendForm, formPpm } from '../src/utils/playerProjection.js'

test('API-Football club names map to the site’s clubs', () => {
  const cases = {
    'Bayern München': 'BAY',
    'Bayern Munich': 'BAY',
    'Paris Saint Germain': 'PSG',
    'Atletico Madrid': 'ATM',
    'Club Brugge KV': 'CLU',
    'FC Porto': 'POR',
    Lens: 'LEN',
    'PSV Eindhoven': 'PSV',
    'Bodo/Glimt': 'BOD',
    Fenerbahçe: 'FEN',
    'Manchester City': 'MCI',
    'Manchester United': 'MUN',
    'Real Madrid': 'RMA',
    'Real Betis': 'BET',
    Viking: 'VIK',
    'AEK Athens FC': 'AEK',
  }
  for (const [name, abbr] of Object.entries(cases)) assert.equal(matchApiTeam(name, INITIAL_TEAMS), abbr, name)
  // "Manchester" alone could be either club: not guessed.
  assert.equal(matchApiTeam('Manchester', INITIAL_TEAMS), null)
})

test('sheet players match their API squad entry, and ambiguity stays unmatched', () => {
  const squad = [
    { id: 1, name: 'H. Kane' },
    { id: 2, name: 'R. Araújo' },
    { id: 3, name: 'Vitinha' },
    { id: 4, name: 'Gabriel Magalhães' },
    { id: 5, name: 'A. Silva' },
    { id: 6, name: 'B. Silva' },
    { id: 7, name: 'Gabriel Jesus' },
  ]
  const id = (name, extra = {}) => matchSquadPlayer({ name, ...extra }, squad)?.id ?? null
  assert.equal(id('H. Kane'), 1)
  assert.equal(id('Ronald Araujo'), 2)
  assert.equal(id('Vitinha'), 3)
  assert.equal(id('A. Silva'), 5)
  assert.equal(id('Silva'), null) // two of them
  assert.equal(id('Gabriel'), null) // two Gabriels
  assert.equal(id('Somebody Else'), null)
  // The sheet's API ID wins over the name.
  assert.equal(id('Anything', { apiId: 4 }), 4)
})

test('names in another order, double surnames, apostrophes and near-spellings still match', () => {
  const squad = [
    { id: 10, name: 'Kim Min-Jae' },
    { id: 11, name: 'Lee Han-Beom' },
    { id: 12, name: 'Pablo Barrios Rivas' },
    { id: 13, name: 'Kouakou Joane Gadou' },
    { id: 14, name: 'E. Ndicka' },
    { id: 15, name: 'M. Matvienko' },
    { id: 16, name: 'A. Maksimovi\u00c4\u0087' }, // "Maksimović" garbled by the API
    { id: 17, name: 'Pedro Fernández', names: ['Dro Fernández'] },
    { id: 18, name: 'Alejandro Baena Rodríguez' },
    { id: 19, name: 'Pedrinho' },
    { id: 20, name: 'Pedrinho' },
  ]
  const id = (name) => matchSquadPlayer({ name }, squad)?.id ?? null
  assert.equal(id('Minjae Kim'), 10)
  assert.equal(id('Han-beom Lee'), 11)
  assert.equal(id('P. Barrios'), 12)
  assert.equal(id('J. Gadou'), 13)
  assert.equal(id("E. N'Dicka"), 14)
  assert.equal(id('M. Matviyenko'), 15)
  assert.equal(id('A. Maksimović'), 16)
  assert.equal(id('Dro Fernández'), 17)
  assert.equal(id('Álex Baena'), 18)
  assert.equal(id('Pedrinho'), null) // two of them: needs an API ID
  // Loose steps are flagged for a check by hand; exact ones aren't.
  const info = {}
  matchSquadPlayer({ name: 'M. Matviyenko' }, squad, info)
  assert.equal(info.loose, true)
  matchSquadPlayer({ name: 'Pablo Barrios Rivas' }, squad, info)
  assert.equal(info.loose, false)
  assert.equal(id('X. Barrios'), null) // initial doesn't fit
  assert.equal(id('M. Matviyenkooo'), null) // more than one letter off
})

test('the domestic league wins over a summer tournament and foreign leagues', () => {
  const entry = (id, name, country, year, stats = true) => ({
    league: { id, name },
    country: { name: country },
    seasons: [{ year, coverage: { fixtures: { statistics_players: stats } } }],
  })
  const liverpool = [
    entry(1022, 'Premier League - Summer Series', 'England', 2025, false),
    entry(39, 'Premier League', 'England', 2026),
  ]
  assert.equal(pickDomesticLeague(liverpool, 'England').league.id, 39)
  assert.equal(
    pickDomesticLeague(
      [entry(333, 'Premier League', 'Ukraine', 2026), entry(39, 'Premier League', 'England', 2026)],
      'Ukraine',
    ).league.id,
    333,
  )
  assert.equal(pickDomesticLeague([entry(419, 'Premyer Liqa', 'Azerbaijan', 2026, false)], 'Azerbaijan').league.id, 419)
  assert.equal(pickDomesticLeague([], 'England'), null)
})

// Shaped like API-Football's /fixtures and /fixtures/players responses.
const fixture = (id, date, homeId, awayId, home, away) => ({
  fixture: { id, date: `${date}T18:00:00+00:00`, status: { short: 'FT' } },
  teams: { home: { id: homeId, name: `Team ${homeId}` }, away: { id: awayId, name: `Team ${awayId}` } },
  goals: { home, away },
})
const line = (playerId, name, minutes, goals = null, assists = null, extra = {}) => ({
  player: { id: playerId, name },
  statistics: [
    {
      games: { minutes },
      goals: { total: goals, assists, saves: extra.saves ?? null },
      cards: { yellow: extra.yellow ?? 0, red: 0 },
      penalty: {},
    },
  ],
})

test('a club’s last matches become per-player games, with 0 minutes when he didn’t play', () => {
  const fixtures = [
    fixture(10, '2026-09-20', 50, 99, 2, 0),
    fixture(11, '2026-09-27', 98, 50, 1, 1),
    {
      ...fixture(12, '2026-10-04', 50, 97, 0, 0),
      fixture: { id: 12, date: '2026-10-04T18:00:00Z', status: { short: 'PST' } },
    },
    fixture(13, '2026-10-18', 50, 96, 3, 1),
  ]
  const stats = new Map([
    [
      10,
      [
        { team: { id: 50 }, players: [line(1, 'H. Kane', 90, 2, null), line(2, 'Sub', 15)] },
        { team: { id: 99 }, players: [line(9, 'Opp', 90, 1)] },
      ],
    ],
    [11, [{ team: { id: 50 }, players: [line(1, 'H. Kane', 90, null, 1, { yellow: 1 }), line(2, 'Sub', null)] }]],
    [13, [{ team: { id: 50 }, players: [line(1, 'H. Kane', 70, 1, 1)] }]],
  ])
  const team = buildTeamGames(50, fixtures, stats, 2)
  // Postponed match left out; only the last 2 finished ones kept, oldest first.
  assert.deepEqual(
    team.template.map((g) => [g.d, g.v, g.opp, g.gc]),
    [
      ['2026-09-27', 'A', 'Team 98', 1],
      ['2026-10-18', 'H', 'Team 96', 1],
    ],
  )
  assert.deepEqual(gamesFor(team, 1), [
    { d: '2026-09-27', opp: 'Team 98', v: 'A', gc: 1, min: 90, g: 0, a: 1, sh: 0, kp: 0, yc: 1 },
    { d: '2026-10-18', opp: 'Team 96', v: 'H', gc: 1, min: 70, g: 1, a: 1, sh: 0, kp: 0 },
  ])
  // On the bench (null minutes) and not in the last match's sheet at all.
  assert.deepEqual(
    gamesFor(team, 2).map((g) => g.min),
    [0, 0],
  )
  // The opponent's players never land in this club's list.
  assert.equal(team.players.has(9), false)
})

test('domestic matches are scored with UCL Fantasy’s main rules', () => {
  const base = { min: 90, g: 0, a: 0, gc: 0 }
  assert.equal(domesticPoints({ ...base, min: 0 }, 'FWD'), 0)
  assert.equal(domesticPoints({ ...base, min: 30 }, 'FWD'), 1)
  assert.equal(domesticPoints({ ...base, g: 1, a: 1, gc: 2 }, 'FWD'), 2 + 4 + 3)
  assert.equal(domesticPoints({ ...base, g: 1 }, 'MID'), 2 + 5 + 1)
  // Clean sheet only after 60 minutes; −1 per two conceded for defenders.
  assert.equal(domesticPoints({ ...base, min: 59 }, 'DEF'), 1)
  assert.equal(domesticPoints(base, 'DEF'), 2 + 4)
  assert.equal(domesticPoints({ ...base, gc: 3 }, 'DEF'), 2 - 1)
  assert.equal(domesticPoints({ ...base, gc: 1, sv: 6, yc: 1 }, 'GK'), 2 + 2 - 1)
})

test('domestic summary: G+A per 90 only once he has 90 minutes', () => {
  const games = [
    { min: 90, g: 1, a: 0, gc: 1 },
    { min: 0, g: 0, a: 0, gc: 0 },
    { min: 45, g: 0, a: 1, gc: 0 },
  ]
  const s = domesticSummary(games, 'FWD')
  assert.equal(s.matches, 3)
  assert.equal(s.apps, 2)
  assert.equal(s.minutes, 135)
  assert.equal(s.ga90, (2 / 135) * 90)
  assert.equal(s.points, 2 + 4 + 1 + 3)
  assert.equal(domesticSummary([{ min: 20, g: 1, a: 0, gc: 0 }], 'FWD').ga90, null)
  assert.equal(domesticSummary(undefined, 'FWD'), null)
})

test('form sources: UCL, domestic, or both counted equally', () => {
  assert.equal(blendForm('ucl', 6, 2), 6)
  assert.equal(blendForm('domestic', 6, 2), 2)
  assert.equal(blendForm('both', 6, 2), 4)
  // No domestic data: keeps UCL form under "both", nothing under "domestic".
  assert.equal(blendForm('both', 6, null), 6)
  assert.equal(blendForm('domestic', 6, null), 0)
  // 5 matches, every minute, 30 points: 6 a match without regression.
  assert.equal(formPpm(30, 450, 5), 6)
  assert.equal(formPpm(30, 450, 0, 4), 0)
})

test('demo players carry five domestic games', () => {
  const players = demoPlayers(3)
  assert.ok(players.every((p) => p.domestic.length === 5))
  assert.ok(players.some((p) => p.domestic.some((g) => g.min === 0)))
  assert.ok(players.some((p) => domesticSummary(p.domestic, p.position).goals > 0))
})

test('the saved domestic form is valid', async () => {
  const { DOMESTIC_FORM } = await import('../src/data/domesticForm.js')
  for (const [id, games] of Object.entries(DOMESTIC_FORM.players)) {
    assert.ok(games.length <= DOMESTIC_FORM.matches, id)
    assert.ok(
      games.every((g) => g.min >= 0 && g.min <= 130),
      id,
    )
  }
})

test('UCL fixtures get their matchday from the round, else from the date; qualifiers none', () => {
  const f = (round, date) => ({ league: { round }, fixture: { date: `${date}T19:00:00+00:00` } })
  assert.equal(uclMatchday(f('League Stage - 3', '2026-10-21')), 3)
  assert.equal(uclMatchday(f('', '2026-11-04')), 4)
  assert.equal(uclMatchday(f('', '2026-09-10')), 1) // a Thursday game, the day after the window
  assert.equal(uclMatchday(f('3rd Qualifying Round', '2026-08-12')), null)
  assert.equal(uclMatchday(f('', '2026-08-12')), null)
})

test('UCL games carry their matchday, shots and key passes', () => {
  const fixtures = [
    {
      league: { round: 'League Stage - 1' },
      fixture: { id: 1, date: '2026-09-09T19:00:00+00:00', status: { short: 'FT' } },
      teams: { home: { id: 50, name: 'Us' }, away: { id: 60, name: 'Them' } },
      goals: { home: 1, away: 0 },
    },
    {
      league: { round: 'Play-offs' },
      fixture: { id: 2, date: '2026-08-20T19:00:00+00:00', status: { short: 'FT' } },
      teams: { home: { id: 50, name: 'Us' }, away: { id: 70, name: 'Early' } },
      goals: { home: 2, away: 0 },
    },
  ]
  const stats = new Map([
    [
      1,
      [
        {
          team: { id: 50 },
          players: [
            {
              player: { id: 7, name: 'Kane' },
              statistics: [{ games: { minutes: 90 }, goals: { total: 1 }, shots: { total: 4 }, passes: { key: 2 } }],
            },
          ],
        },
      ],
    ],
  ])
  const team = buildTeamGames(50, fixtures, stats, Infinity, { matchday: uclMatchday })
  assert.deepEqual(gamesFor(team, 7), [
    { d: '2026-09-09', opp: 'Them', v: 'H', gc: 0, md: 1, min: 90, g: 1, a: 0, sh: 4, kp: 2 },
  ])
})
