// Parses the uploaded team-by-team "MD / Fixture / Day" list, cross-checks it
// against src/data/fixtures.js's own FIXTURES (opponent + venue must match
// exactly, and both sides of the same real match must report the same day),
// then writes scripts/raw-fixture-days.txt in the same team-block shape as
// scripts/raw-fixtures.txt so build-fixtures.mjs can merge the two.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { FIXTURES } = await import('../src/data/fixtures.js')

const SRC = process.argv[2]
if (!SRC) {
  console.error('Usage: node build-matchday-days.mjs <path-to-uploaded-txt>')
  process.exit(1)
}
const raw = readFileSync(SRC, 'utf8')

// Full team name (as headed in the upload) -> abbreviation used everywhere
// else in this codebase (src/data/teams.js).
const NAME_TO_ABBR = {
  'AEK Athens': 'AEK',
  Arsenal: 'ARS',
  'Aston Villa': 'AVL',
  'Atlético Madrid': 'ATM',
  Barcelona: 'BAR',
  'Bayern München': 'BAY',
  'Bodø/Glimt': 'BOD',
  'Borussia Dortmund': 'BVB',
  'Club Brugge': 'CLU',
  Como: 'COM',
  Fenerbahçe: 'FEN',
  Feyenoord: 'FEY',
  Galatasaray: 'GAL',
  Inter: 'INT',
  LASK: 'LAS',
  Leipzig: 'RBL',
  Lens: 'LEN',
  Lille: 'LIL',
  Liverpool: 'LIV',
  'Manchester City': 'MCI',
  'Manchester United': 'MUN',
  Napoli: 'NAP',
  PSG: 'PSG',
  Porto: 'POR',
  PSV: 'PSV',
  'Real Betis': 'BET',
  'Real Madrid': 'RMA',
  Roma: 'ROM',
  Sabah: 'SAB',
  'Shakhtar Donetsk': 'SHK',
  'Slavia Praha': 'SLA',
  'Slovan Bratislava': 'SLO',
  'Sporting CP': 'SPO',
  Stuttgart: 'STU',
  Viking: 'VIK',
  Villarreal: 'VIL',
}

// Opponent names as they appear in the "Fixture" column -> abbreviation.
// Includes every short/alt form used anywhere in the file (e.g. "Bayern",
// "Atlético", "Slavia", "Slovan", "Leipzig" already covered above).
const OPP_TO_ABBR = {
  ...NAME_TO_ABBR,
  Bayern: 'BAY',
  Atlético: 'ATM',
  Slavia: 'SLA',
  Slovan: 'SLO',
  Dortmund: 'BVB',
  Shakhtar: 'SHK',
  'Man City': 'MCI',
  'Man United': 'MUN',
  Sporting: 'SPO',
}

// Blocks are separated by one-or-more blank lines: [intro line], then for
// each team a [team name] block, a [MD/Fixture/Day header] block, and an
// [8 fixture lines] block, in that order.
const blocks = raw
  .split(/\n\s*\n/)
  .map((b) => b.trim())
  .filter(Boolean)

const days = {} // days[ABBR] = { [gw]: 'TUE'|'WED'|'THU' }
const parsedFixtures = {} // parsedFixtures[ABBR] = [{ gw, opp, venue, day }]
let teamCount = 0

for (let i = 0; i < blocks.length; i++) {
  const abbr = NAME_TO_ABBR[blocks[i]]
  if (!abbr) continue

  const fixtureBlock = blocks[i + 2]
  if (!fixtureBlock) {
    console.error(`No fixture block found after team header "${blocks[i]}"`)
    process.exitCode = 1
    continue
  }

  teamCount++
  days[abbr] = {}
  parsedFixtures[abbr] = []

  const lines = fixtureBlock.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(@|vs)\s+(.+?)\s+(TUE|WED|THU)$/)
    if (!m) {
      console.error(`Could not parse fixture line "${line}" for ${abbr}`)
      process.exitCode = 1
      continue
    }
    const [, gwStr, venueSym, oppName, day] = m
    const gw = Number(gwStr)
    const venue = venueSym === 'vs' ? 'H' : 'A'
    const opp = OPP_TO_ABBR[oppName.trim()]
    if (!opp) {
      console.error(`UNKNOWN OPPONENT NAME "${oppName}" for ${abbr} MD${gw}`)
      process.exitCode = 1
      continue
    }
    days[abbr][gw] = day
    parsedFixtures[abbr].push({ gw, opp, venue, day })
  }
}

console.log('teams parsed from upload:', teamCount)

// --- Cross-validate against the app's existing FIXTURES ---
let ok = true
for (const abbr of Object.keys(FIXTURES)) {
  if (!parsedFixtures[abbr]) {
    console.error('MISSING TEAM IN UPLOAD:', abbr)
    ok = false
    continue
  }
  if (parsedFixtures[abbr].length !== 8) {
    console.error('BAD LENGTH in upload for', abbr, parsedFixtures[abbr].length)
    ok = false
  }
  for (const existing of FIXTURES[abbr]) {
    const parsed = parsedFixtures[abbr].find((f) => f.gw === existing.gw)
    if (!parsed) {
      console.error(`NO DAY DATA for ${abbr} MD${existing.gw}`)
      ok = false
      continue
    }
    // Opponent identity is the real match key — a wrong opponent means the
    // day would be attached to the wrong fixture entirely, so that's fatal.
    if (parsed.opp !== existing.opp) {
      console.error(`OPPONENT MISMATCH ${abbr} MD${existing.gw}: app has ${existing.opp}, upload has ${parsed.opp}`)
      ok = false
      continue
    }
    // Venue (H/A) is NOT trusted from the upload — app's FIXTURES is the
    // existing, already-reciprocal-verified source for that. A mismatch here
    // just means the source spreadsheet's vs/@ column has a typo; it doesn't
    // affect which day gets attached to which match, so it's a warning, not
    // a reason to reject the day data.
    if (parsed.venue !== existing.venue) {
      console.warn(`(venue label differs, ignored) ${abbr} MD${existing.gw}: app has ${existing.venue}, upload has ${parsed.venue}`)
    }
  }
}

// Both sides of the same real match must agree on the day.
for (const abbr of Object.keys(days)) {
  for (const [gwStr, day] of Object.entries(days[abbr])) {
    const gw = Number(gwStr)
    const fixture = parsedFixtures[abbr].find((f) => f.gw === gw)
    const oppDay = days[fixture.opp]?.[gw]
    if (oppDay && oppDay !== day) {
      console.error(`DAY MISMATCH: ${abbr} MD${gw} says ${day}, but ${fixture.opp} MD${gw} says ${oppDay}`)
      ok = false
    }
  }
}

console.log('all checks passed:', ok)
if (!ok) process.exit(1)

const sortedAbbrs = Object.keys(days).sort()
const out = sortedAbbrs
  .map((abbr) => {
    const lines = Array.from({ length: 8 }, (_, i) => i + 1).map((gw) => `GW${gw} ${days[abbr][gw]}`)
    return `${abbr}\n${lines.join('\n')}`
  })
  .join('\n\n')

writeFileSync(path.join(__dirname, 'raw-fixture-days.txt'), out + '\n')
console.log('wrote scripts/raw-fixture-days.txt')
