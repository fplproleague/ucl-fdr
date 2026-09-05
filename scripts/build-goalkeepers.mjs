// Regenerates src/data/goalkeepers.js from the published GK database Google
// Sheet (Player / Club / Price columns — see the sheet shared with the app
// owner). "Club" must match a team name from src/data/teams.js exactly:
// that's the only link back to the app's existing fixture/FDR data, so a
// typo there is treated as a fatal error rather than silently dropped.
//
// Usage:
//   node scripts/build-goalkeepers.mjs
//     fetches the default published CSV URL below
//   node scripts/build-goalkeepers.mjs <url-or-local-csv-path>
//     fetches a different published CSV, or reads a local file (handy for
//     testing without network access — e.g. a CSV exported by hand)
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { INITIAL_TEAMS } = await import('../src/data/teams.js')

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT05F7C7W82oQEVdr3tSg_h5T3u3xXEh-FobEgnXwKvuGGWxwusdau5eeREapT28lRxgia51VVoXYPw/pub?gid=0&single=true&output=csv'

const source = process.argv[2] ?? DEFAULT_SHEET_URL

async function readSource(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch ${src}: HTTP ${res.status}`)
    return res.text()
  }
  return readFileSync(src, 'utf8')
}

// Minimal RFC4180-ish CSV parser — handles quoted fields (Google Sheets
// quotes anything containing a comma or a quote), which a plain split(',')
// would break on.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r') {
      // swallow; \n (below) closes the row
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

// Turkish/Nordic letters aren't reachable by NFD-stripping combining marks
// (they're distinct code points, not base+accent), so map them explicitly
// before the general accent-stripping pass below.
const CHAR_MAP = { ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ş: 's', Ş: 's', ø: 'o', Ø: 'o' }

function slugify(name) {
  const mapped = [...name].map((ch) => CHAR_MAP[ch] ?? ch).join('')
  return mapped
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const raw = await readSource(source)
const rows = parseCsv(raw)
if (rows.length < 2) throw new Error('CSV has no data rows')

const header = rows[0].map((h) => h.trim().toLowerCase())
const col = (name) => {
  const i = header.indexOf(name)
  if (i === -1) throw new Error(`Missing "${name}" column in header: ${rows[0].join(', ')}`)
  return i
}
const playerCol = col('player')
const clubCol = col('club')
const priceCol = col('price')

const NAME_TO_ABBR = Object.fromEntries(INITIAL_TEAMS.map((t) => [t.name, t.abbr]))

let ok = true
const goalkeepers = []
const idCounts = new Map()

for (const cells of rows.slice(1)) {
  const player = (cells[playerCol] ?? '').trim()
  const club = (cells[clubCol] ?? '').trim()
  const priceRaw = (cells[priceCol] ?? '').trim()
  if (!player && !club && !priceRaw) continue

  if (!player) {
    console.error('EMPTY PLAYER NAME in row:', cells)
    ok = false
    continue
  }
  const abbr = NAME_TO_ABBR[club]
  if (!abbr) {
    console.error(`UNKNOWN CLUB "${club}" for ${player} — must match a team name in src/data/teams.js exactly`)
    ok = false
    continue
  }
  const price = Number(priceRaw.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(price) || price <= 0) {
    console.error(`BAD PRICE "${priceRaw}" for ${player}`)
    ok = false
    continue
  }

  const baseId = slugify(player)
  const seen = idCounts.get(baseId) ?? 0
  idCounts.set(baseId, seen + 1)
  const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`

  goalkeepers.push({ id, name: player, team: abbr, price })
}

console.log('goalkeepers parsed:', goalkeepers.length)
console.log('all checks passed:', ok)
if (!ok) process.exit(1)

// Single-quoted, matching the rest of the codebase's style — not
// JSON.stringify, which would emit double quotes.
function quote(str) {
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

const lines = goalkeepers
  .map((gk) => `  { id: '${gk.id}', name: ${quote(gk.name)}, team: '${gk.team}', price: ${gk.price} },`)
  .join('\n')

const out = `// GK Rotation database: just the facts that don't already live elsewhere —
// name, the team they play for (a team abbreviation from src/data/teams.js),
// and their Fantasy price. Fixtures, matchdays, days and FDR are never
// duplicated here: every goalkeeper links to \`team\`, and everything about
// that team's schedule is read live from src/data/fixtures.js exactly like
// every other view in the app (see src/utils/gkRotation.js).
//
// Generated by scripts/build-goalkeepers.mjs from the published GK database
// Google Sheet — edit the sheet and re-run the script, don't hand-edit this
// file. Two goalkeepers can share a team (e.g. Inter, Napoli) — kept as
// separate records, never merged.
export const GOALKEEPERS = [
${lines}
]
`

writeFileSync(path.join(__dirname, '../src/data/goalkeepers.js'), out)
console.log('wrote src/data/goalkeepers.js')
