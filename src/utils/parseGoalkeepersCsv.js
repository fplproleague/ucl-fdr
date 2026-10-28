// CSV parsing and club-name matching for the published sheets — used by
// parsePlayersCsv.js, which both scripts/build-players.mjs (the saved copy
// committed to the repo) and useLivePlayers.js (the live fetch at runtime)
// go through, so the two paths can never disagree about what a row means.
// Pure JS, no Node-only APIs (no node:fs, no Buffer) — this file also runs
// in the browser. (The name is from when it only served the old goalkeeper
// sheet, which GK Rotation no longer needs: it reads the player sheet.)

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

// Club -> abbreviation lookup for the sheet parsers. Keys are slugified,
// so case, accents and punctuation don't matter ("Bodo Glimt" finds
// "Bodø/Glimt"), and a team can be named by its full name, short name,
// abbreviation or an explicit alias ("PSV Eindhoven" for "PSV").
export function buildClubLookup(teams) {
  const lookup = {}
  for (const t of teams) {
    for (const label of [t.name, t.shortName, t.abbr, ...(t.aliases ?? [])]) {
      if (label) lookup[slugifyName(label)] = t.abbr
    }
  }
  return lookup
}
