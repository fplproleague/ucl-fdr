// Knockout phase of the 2026/27 UEFA Champions League — everything after MD8.
//
// The three draw/result blocks below start empty and get filled in by hand as
// the season goes. Each one unlocks the next step of the Bracket tab:
//
//   1. LEAGUE_STANDINGS  after MD8 (27 Jan 2027)   → who's in, who's out
//   2. PLAYOFF_DRAW      after the play-off draw   → pick play-off winners
//   3. R16_DRAW          after the R16 draw        → full bracket to the final
//   4. RESULTS           after every tie           → locks that tie
//
// `npm test` checks every block against the format rules (pairings, bracket
// halves, known club ids), so a typo here fails loudly instead of quietly
// drawing a bracket that can't exist.

// Final league-phase table, 1st to 36th, as club ids from src/data/teams.js.
// Only 1–24 matter for the bracket; 25–36 may be left off.
export const LEAGUE_STANDINGS = null

// The eight play-off ties as [seeded (9th–16th), unseeded (17th–24th)].
// Order doesn't matter. The seeded club hosts the second leg.
export const PLAYOFF_DRAW = null

// The eight round-of-16 ties in bracket order, top to bottom: the first two
// meet in QF1, the next two in QF2, and so on; QF1/QF2 meet in SF1 and
// QF3/QF4 in SF2. `seed` is the top-8 club, `playoff` is either club from
// the play-off tie whose winner it faces. Copy the order from UEFA's bracket
// graphic — the tests check it against the seeding pairs.
export const R16_DRAW = null

// Winners of decided ties, keyed by tie id: PO1–PO8 (in PLAYOFF_DRAW order),
// R16-1–R16-8 (in R16_DRAW order), QF1–QF4, SF1, SF2, F.
export const RESULTS = {}

// Leg dates are UEFA's calendar windows. The draw dates aren't announced yet:
// they follow the pattern of 2025/26 (the Friday after MD8, and the Friday
// after the play-off second legs) and are flagged as expected in the UI.
export const PLAYOFF_DRAW_DATE = { label: '29 Jan', confirmed: false }
export const R16_DRAW_DATE = { label: '26 Feb', confirmed: false }

// UCL Fantasy rules per round. These are the 2025/26 game's rules — UEFA
// hasn't published the 2026/27 knockout rules yet, so the UI says so. When
// they're out, update the numbers here and flip FANTASY_RULES_CONFIRMED.
//   clubCap:   max players from one club
//   transfers: free transfers before leg 1 / before leg 2 (null = no leg 2)
export const FANTASY_RULES_CONFIRMED = false

export const KO_ROUNDS = [
  {
    id: 'PO',
    name: 'Knockout play-offs',
    short: 'Play-offs',
    legs: [
      { start: '2027-02-16', end: '2027-02-17', label: '16–17 Feb' },
      { start: '2027-02-23', end: '2027-02-24', label: '23–24 Feb' },
    ],
    clubCap: 4,
    transfers: ['Unlimited', '2'],
  },
  {
    id: 'R16',
    name: 'Round of 16',
    short: 'R16',
    legs: [
      { start: '2027-03-09', end: '2027-03-10', label: '9–10 Mar' },
      { start: '2027-03-16', end: '2027-03-17', label: '16–17 Mar' },
    ],
    clubCap: 4,
    transfers: ['Unlimited', '3'],
  },
  {
    id: 'QF',
    name: 'Quarter-finals',
    short: 'QF',
    legs: [
      { start: '2027-04-06', end: '2027-04-07', label: '6–7 Apr' },
      { start: '2027-04-13', end: '2027-04-14', label: '13–14 Apr' },
    ],
    clubCap: 5,
    transfers: ['5', '3'],
  },
  {
    id: 'SF',
    name: 'Semi-finals',
    short: 'SF',
    legs: [
      { start: '2027-04-27', end: '2027-04-28', label: '27–28 Apr' },
      { start: '2027-05-04', end: '2027-05-05', label: '4–5 May' },
    ],
    clubCap: 6,
    transfers: ['5', '3'],
  },
  {
    id: 'F',
    name: 'Final',
    short: 'Final',
    legs: [{ start: '2027-06-05', end: '2027-06-05', label: '5 Jun · Madrid' }],
    clubCap: 8,
    transfers: ['5', null],
  },
]

// Everything above in the one shape src/utils/bracket.js works on — the demo
// data (src/data/knockoutDemo.js) produces the same shape.
export const KNOCKOUT = {
  standings: LEAGUE_STANDINGS,
  playoffDraw: PLAYOFF_DRAW,
  r16Draw: R16_DRAW,
  results: RESULTS,
}
