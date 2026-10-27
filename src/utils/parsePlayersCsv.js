// Parses the player database CSV for the knockout projections. Same
// approach as the GK sheet (parseGoalkeepersCsv.js, whose CSV parser and
// club lookup this reuses): any column order, case-insensitive headers, and
// a row that can't be read is reported and skipped, never guessed at.
//
// Columns: Player, Club, Position, Price, Points, Minutes
//   Position: GK / DEF / MID / FWD (full words and common short forms work)
//   Points:   total UCL Fantasy points so far this season
//   Minutes:  total minutes played so far this season
//
// Optional, used when present (any other column is ignored):
//   Player ID     a stable id, so a renamed player keeps the same row key
//   Ownership %   share of managers who own him (0–100)
//   Apps          appearances
//   MD1, MD2, …   points per matchday: the form line in the details
//   Goals, Assists, Clean sheets, Saves, Balls recovered, POTM
import { parseCsv, slugifyName } from './parseGoalkeepersCsv.js'

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

const POSITION_ALIASES = {
  gk: 'GK',
  gkp: 'GK',
  goalkeeper: 'GK',
  keeper: 'GK',
  d: 'DEF',
  def: 'DEF',
  defender: 'DEF',
  m: 'MID',
  mid: 'MID',
  midfielder: 'MID',
  f: 'FWD',
  fw: 'FWD',
  fwd: 'FWD',
  forward: 'FWD',
  att: 'FWD',
  attacker: 'FWD',
}

// Header → field name for the optional per-player stats shown in the details.
const STAT_COLUMNS = {
  goals: 'goals',
  assists: 'assists',
  'clean sheets': 'cleanSheets',
  saves: 'saves',
  'balls recovered': 'ballsRecovered',
  potm: 'potm',
}
const OWNERSHIP_HEADERS = ['ownership %', 'ownership', 'selected %', 'selected by %']

const number = (raw) =>
  Number(
    String(raw)
      .trim()
      .replace(',', '.')
      .replace(/[^0-9.-]/g, ''),
  )

export function parsePlayerRows(csvText, clubLookup) {
  const rows = parseCsv(csvText)
  if (rows.length < 2) return { players: [], errors: ['CSV has no data rows'] }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = Object.fromEntries(
    ['player', 'club', 'position', 'price', 'points', 'minutes'].map((name) => [name, header.indexOf(name)]),
  )
  const missing = Object.entries(col)
    .filter(([, i]) => i === -1)
    .map(([name]) => name)
  if (missing.length)
    return { players: [], errors: [`Missing column(s) ${missing.join(', ')} in header: ${rows[0].join(', ')}`] }

  const idCol = header.indexOf('player id')
  const ownershipCol = header.findIndex((h) => OWNERSHIP_HEADERS.includes(h))
  const appsCol = header.indexOf('apps')
  const mdCols = header
    .map((h, i) => ({ md: Number(h.match(/^md\s*(\d+)$/)?.[1]), i }))
    .filter(({ md }) => Number.isInteger(md))
    .sort((a, b) => a.md - b.md)
  const statCols = Object.entries(STAT_COLUMNS)
    .map(([h, field]) => ({ field, i: header.indexOf(h) }))
    .filter(({ i }) => i !== -1)
  // An optional number: blank or unreadable reads as "not given", never as 0.
  const optional = (cells, i) => {
    const raw = (cells[i] ?? '').trim()
    if (i === -1 || raw === '') return undefined
    const n = number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  const errors = []
  const players = []
  const idCounts = new Map()

  for (const cells of rows.slice(1)) {
    const get = (name) => (cells[col[name]] ?? '').trim()
    const name = get('player')
    if (!name && !get('club')) continue
    if (!name) {
      errors.push(`Empty player name in row: ${cells.join(', ')}`)
      continue
    }
    const team = clubLookup[slugifyName(get('club'))]
    if (!team) {
      errors.push(`Unknown club "${get('club')}" for ${name}`)
      continue
    }
    const position = POSITION_ALIASES[get('position').toLowerCase()]
    if (!position) {
      errors.push(`Unknown position "${get('position')}" for ${name} — use GK, DEF, MID or FWD`)
      continue
    }
    const price = number(get('price'))
    if (!Number.isFinite(price) || price <= 0) {
      errors.push(`Bad price "${get('price')}" for ${name}`)
      continue
    }
    // Empty points/minutes mean "hasn't played yet", not a broken row.
    const points = get('points') === '' ? 0 : number(get('points'))
    const minutes = get('minutes') === '' ? 0 : number(get('minutes'))
    if (!Number.isFinite(points) || !Number.isFinite(minutes) || minutes < 0) {
      errors.push(`Bad points/minutes for ${name}`)
      continue
    }

    // "250016833", "250016833.0" (a spreadsheet's number) and "250.016.833"
    // (a Dutch-formatted export) are all the same id.
    const externalId =
      idCol === -1
        ? ''
        : (cells[idCol] ?? '')
            .trim()
            .replace(/[.,]0+$/, '')
            .replace(/[^0-9A-Za-z]/g, '')
    const baseId = externalId ? `p${externalId}` : slugifyName(name)
    const seen = idCounts.get(baseId) ?? 0
    idCounts.set(baseId, seen + 1)
    const player = { id: seen === 0 ? baseId : `${baseId}-${seen + 1}`, name, team, position, price, points, minutes }

    const ownership = optional(cells, ownershipCol)
    if (ownership != null) player.ownership = ownership
    const apps = optional(cells, appsCol)
    if (apps != null) player.apps = apps
    if (mdCols.length) {
      // Only matchdays with a number in them: a blank MD5 column added ahead
      // of time is "not played yet", not a zero.
      const form = mdCols.map(({ md, i }) => ({ md, points: optional(cells, i) })).filter((f) => f.points != null)
      if (form.length) player.form = form
    }
    if (statCols.length) {
      const stats = {}
      for (const { field, i } of statCols) {
        const v = optional(cells, i)
        if (v != null) stats[field] = v
      }
      if (Object.keys(stats).length) player.stats = stats
    }
    players.push(player)
  }

  return { players, errors }
}
