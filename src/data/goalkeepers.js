// GK Rotation database: just the facts that don't already live elsewhere —
// name, the team they play for (a team abbreviation from src/data/teams.js),
// and their Fantasy price. Fixtures, matchdays, days and FDR are never
// duplicated here: every goalkeeper links to `team`, and everything about
// that team's schedule is read live from src/data/fixtures.js exactly like
// every other view in the app (see src/utils/gkRotation.js).
//
// Two goalkeepers can share a team (Inter, Napoli below) — kept as separate
// records, never merged.
//
// To add a goalkeeper: append a row with an existing team abbreviation.
// Nothing else in the app needs to change. This shape is also meant to
// extend to other positions later — `team` is the only link every position
// would need.
export const GOALKEEPERS = [
  { id: 'raya', name: 'David Raya', team: 'ARS', price: 6.0 },
  { id: 'courtois', name: 'Thibaut Courtois', team: 'RMA', price: 6.0 },
  { id: 'donnarumma', name: 'Gianluigi Donnarumma', team: 'MCI', price: 6.0 },
  { id: 'alisson', name: 'Alisson Becker', team: 'LIV', price: 6.0 },
  { id: 'safonov', name: 'Matvei Safonov', team: 'PSG', price: 5.5 },
  { id: 'neuer', name: 'Manuel Neuer', team: 'BAY', price: 5.5 },
  { id: 'oblak', name: 'Jan Oblak', team: 'ATM', price: 5.5 },
  { id: 'joan-garcia', name: 'Joan García', team: 'BAR', price: 5.0 },
  { id: 'cakir', name: 'Uğurcan Çakır', team: 'GAL', price: 5.0 },
  { id: 'kobel', name: 'Gregor Kobel', team: 'BVB', price: 5.0 },
  { id: 'rui-silva', name: 'Rui Silva', team: 'SPO', price: 5.0 },
  { id: 'sommer', name: 'Yann Sommer', team: 'CLU', price: 4.5 },
  { id: 'lammens', name: 'Senne Lammens', team: 'MUN', price: 4.5 },
  { id: 'josep-martinez', name: 'Josep Martínez', team: 'INT', price: 4.5 },
  { id: 'provedel', name: 'Ivan Provedel', team: 'INT', price: 4.5 },
  { id: 'milinkovic-savic', name: 'Vanja Milinković-Savić', team: 'NAP', price: 4.0 },
  { id: 'meret', name: 'Alex Meret', team: 'NAP', price: 4.5 },
  { id: 'luiz-junior', name: 'Luiz Júnior', team: 'VIL', price: 4.0 },
  { id: 'bredlow', name: 'Fabian Bredlow', team: 'STU', price: 4.0 },
]
