// Parses scripts/raw-fixtures.txt (pasted GW1-8 fixture list) into
// src/data/fixtures.js, cross-checking that every fixture has a matching
// reciprocal entry (if ARS has "GW1 NAP A", NAP must have "GW1 ARS H").
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(path.join(__dirname, 'raw-fixtures.txt'), 'utf8')

const blocks = raw.trim().split(/\n\s*\n/)
const FIXTURES = {}

for (const block of blocks) {
  const lines = block.trim().split('\n').map((l) => l.trim())
  const team = lines[0]
  FIXTURES[team] = lines.slice(1).map((line) => {
    const m = line.match(/^GW(\d+)\s+([A-Z]+)\s+([HA])$/)
    if (!m) throw new Error(`Could not parse line "${line}" for team ${team}`)
    return { gw: Number(m[1]), opp: m[2], venue: m[3] }
  })
}

const teams = Object.keys(FIXTURES)
console.log('teams parsed:', teams.length)

let ok = true
for (const team of teams) {
  const fixtures = FIXTURES[team]
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
    if (!FIXTURES[f.opp]) {
      console.log('UNKNOWN OPPONENT', team, f)
      ok = false
      continue
    }
    const reciprocal = FIXTURES[f.opp].find((r) => r.gw === f.gw)
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
}
console.log('all checks passed:', ok)

if (!ok) {
  process.exit(1)
}

const sortedTeams = Object.keys(FIXTURES).sort()
const sortedFixtures = Object.fromEntries(
  sortedTeams.map((t) => [t, [...FIXTURES[t]].sort((a, b) => a.gw - b.gw)]),
)

const out = `// GW1-8 fixtures for the 2026/27 UEFA Champions League league phase.
export const TOTAL_GAMEWEEKS = 8

export const FIXTURES = ${JSON.stringify(sortedFixtures, null, 2)}
`

writeFileSync(path.join(__dirname, '../src/data/fixtures.js'), out)
console.log('wrote src/data/fixtures.js')
