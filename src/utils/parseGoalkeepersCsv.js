// Shared CSV parsing/validation for the GK database — used by both
// scripts/build-goalkeepers.mjs (the offline fallback snapshot committed to
// the repo) and useLiveGoalkeepers.js (the live fetch at runtime), so the
// two paths can never disagree about what a row means. Pure JS, no
// Node-only APIs (no node:fs, no Buffer) — this file also runs in the
// browser.

// Turkish/Nordic letters aren't reachable by NFD-stripping combining marks
// (they're distinct code points, not base+accent), so map them explicitly
// before the general accent-stripping pass below.
const CHAR_MAP = { ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ş: 's', Ş: 's', ø: 'o', Ø: 'o', ö: 'o' }

export function slugifyName(name) {
  const mapped = [...name].map((ch) => CHAR_MAP[ch] ?? ch).join('')
  return mapped
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Minimal RFC4180-ish CSV parser — handles quoted fields (Google Sheets
// quotes anything containing a comma or a quote), which a plain split(',')
// would break on.
export function parseCsv(text) {
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

// Parses the GK database CSV (Player / Club / Price columns, any order,
// case-insensitive header) into goalkeeper records, given a map of team
// name -> abbreviation. "Club" must match a team name exactly — that's the
// only link back to the app's existing fixture/FDR data, so a mismatch is
// reported as an error rather than guessed at.
export function parseGoalkeeperRows(csvText, nameToAbbr) {
  const rows = parseCsv(csvText)
  if (rows.length < 2) return { goalkeepers: [], errors: ['CSV has no data rows'] }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const playerCol = header.indexOf('player')
  const clubCol = header.indexOf('club')
  const priceCol = header.indexOf('price')
  if (playerCol === -1 || clubCol === -1 || priceCol === -1) {
    return { goalkeepers: [], errors: [`Missing Player/Club/Price column in header: ${rows[0].join(', ')}`] }
  }

  const errors = []
  const goalkeepers = []
  const idCounts = new Map()

  for (const cells of rows.slice(1)) {
    const player = (cells[playerCol] ?? '').trim()
    const club = (cells[clubCol] ?? '').trim()
    const priceRaw = (cells[priceCol] ?? '').trim()
    if (!player && !club && !priceRaw) continue

    if (!player) {
      errors.push(`Empty player name in row: ${cells.join(', ')}`)
      continue
    }
    const abbr = nameToAbbr[club]
    if (!abbr) {
      errors.push(`Unknown club "${club}" for ${player} — must match a team name exactly`)
      continue
    }
    const price = Number(priceRaw.replace(',', '.').replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(price) || price <= 0) {
      errors.push(`Bad price "${priceRaw}" for ${player}`)
      continue
    }

    const baseId = slugifyName(player)
    const seen = idCounts.get(baseId) ?? 0
    idCounts.set(baseId, seen + 1)
    const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`

    goalkeepers.push({ id, name: player, team: abbr, price })
  }

  return { goalkeepers, errors }
}
