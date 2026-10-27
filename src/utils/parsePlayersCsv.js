// Parses the player database CSV for the knockout projections. Same
// approach as the GK sheet (parseGoalkeepersCsv.js, whose CSV parser and
// club lookup this reuses): any column order, case-insensitive headers, and
// a row that can't be read is reported and skipped, never guessed at.
//
// Columns: Player, Club, Position, Price, Points, Minutes
//   Position: GK / DEF / MID / FWD (full words and common short forms work)
//   Points:   total UCL Fantasy points so far this season
//   Minutes:  total minutes played so far this season
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

    const baseId = slugifyName(name)
    const seen = idCounts.get(baseId) ?? 0
    idCounts.set(baseId, seen + 1)
    players.push({ id: seen === 0 ? baseId : `${baseId}-${seen + 1}`, name, team, position, price, points, minutes })
  }

  return { players, errors }
}
