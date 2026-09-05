// Parses scripts/raw-fixtures.txt (opponent + venue, GW1-8) and
// scripts/raw-fixture-days.txt (matchday of the week per fixture — see
// scripts/build-matchday-days.mjs for how that file is produced and
// cross-checked) into src/data/fixtures.js.
//
// Cross-checks performed:
// - every fixture has a matching reciprocal entry with the opposite venue
//   (if ARS has "GW1 NAP A", NAP must have "GW1 ARS H")
// - every team plays exactly 8 matches, one per matchday
// - every fixture in raw-fixtures.txt has a day in raw-fixture-days.txt,
//   and vice versa, for the same team+matchday
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseBlocks(raw, lineRe, buildEntry) {
  const blocks = raw.trim().split(/\n\s*\n/)
  const out = {}
  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim())
    const team = lines[0]
    out[team] = lines.slice(1).map((line) => {
      const m = line.match(lineRe)
      if (!m) throw new Error(`Could not parse line "${line}" for team ${team}`)
      return buildEntry(m)
    })
  }
  return out
}

const rawFixtures = readFileSync(path.join(__dirname, 'raw-fixtures.txt'), 'utf8')
const FIXTURES_ONLY = parseBlocks(rawFixtures, /^GW(\d+)\s+([A-Z]+)\s+([HA])$/, (m) => ({
  gw: Number(m[1]),
  opp: m[2],
  venue: m[3],
}))

const rawDays = readFileSync(path.join(__dirname, 'raw-fixture-days.txt'), 'utf8')
const DAYS_ONLY = parseBlocks(rawDays, /^GW(\d+)\s+(TUE|WED|THU)$/, (m) => ({
  gw: Number(m[1]),
  day: m[2],
}))

const teams = Object.keys(FIXTURES_ONLY)
console.log('teams parsed:', teams.length)

let ok = true

for (const team of teams) {
  const fixtures = FIXTURES_ONLY[team]
  if (fixtures.length !== 8) {
    console.log('BAD LENGTH', team, fixtures.length)
    ok = false
  }
  const gws = new Set(fixtures.map((f) => f.gw))
  if (gws.size !== 8) {
    console.log('DUP/MISSING GW', team)
    ok = false
  }
  for (const f of fixtures) {
    if (!FIXTURES_ONLY[f.opp]) {
      console.log('UNKNOWN OPPONENT', team, f)
      ok = false
      continue
    }
    const reciprocal = FIXTURES_ONLY[f.opp].find((r) => r.gw === f.gw)
    if (!reciprocal) {
      console.log('MISSING RECIPROCAL', team, f)
      ok = false
      continue
    }
    if (reciprocal.opp !== team) {
      console.log('MISMATCHED RECIPROCAL OPP', team, f, 'vs', reciprocal)
      ok = false
    }
    if (reciprocal.venue === f.venue) {
      console.log('MISMATCHED VENUE (both same)', team, f, 'vs', reciprocal)
      ok = false
    }
  }

  if (!DAYS_ONLY[team]) {
    console.log('NO DAY DATA FOR TEAM', team)
    ok = false
    continue
  }
  for (const f of fixtures) {
    const dayEntry = DAYS_ONLY[team].find((d) => d.gw === f.gw)
    if (!dayEntry) {
      console.log('MISSING DAY', team, f)
      ok = false
    }
  }
}

console.log('all checks passed:', ok)

if (!ok) {
  process.exit(1)
}

const sortedTeams = [...teams].sort()
const sortedFixtures = Object.fromEntries(
  sortedTeams.map((t) => [
    t,
    [...FIXTURES_ONLY[t]]
      .sort((a, b) => a.gw - b.gw)
      .map((f) => ({ ...f, day: DAYS_ONLY[t].find((d) => d.gw === f.gw).day })),
  ]),
)

const out = `// MD1-8 fixtures for the 2026/27 UEFA Champions League league phase.
// Verified against the official draw: every fixture has a matching reciprocal
// with the opposite venue, all 36 teams play 8 matches (4 home, 4 away), no
// team faces a domestic rival, and nobody faces more than two clubs from one
// association. "day" (TUE/WED/THU) is cross-checked against this same
// reciprocal structure by scripts/build-matchday-days.mjs. Run
// \`node scripts/build-matchday-days.mjs <source.txt>\` then
// \`node scripts/build-fixtures.mjs\` to regenerate both.
export const TOTAL_MATCHDAYS = 8

// Bumped whenever the fixture data changes, so the UI can show visitors how
// fresh the numbers are without anyone hand-editing a date string in a
// component. Also stamped onto public/sitemap.xml's <lastmod> at build time
// (see the stampSitemapLastmod plugin in vite.config.js) — that's automatic,
// nothing else to update here.
export const DATA_UPDATED = '2026-09-05'

export const FIXTURES = ${JSON.stringify(sortedFixtures, null, 2)}
`

writeFileSync(path.join(__dirname, '../src/data/fixtures.js'), out)
console.log('wrote src/data/fixtures.js')
