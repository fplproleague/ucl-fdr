// Initial team strength ratings (1 = easiest opponent, 5 = hardest opponent).
// Users can override these live in the "Strength" tab; overrides are
// persisted to localStorage (see src/context/TeamsContext.jsx).
export const INITIAL_TEAMS = [
  { id: 'ARS', name: 'Arsenal', abbr: 'ARS', rating: 5 },
  { id: 'BAY', name: 'Bayern München', shortName: 'Bayern', abbr: 'BAY', rating: 5 },
  { id: 'BAR', name: 'Barcelona', abbr: 'BAR', rating: 5 },
  { id: 'MCI', name: 'Manchester City', shortName: 'Man. City', abbr: 'MCI', rating: 5 },
  { id: 'PSG', name: 'Paris Saint-Germain', shortName: 'PSG', abbr: 'PSG', rating: 5 },
  { id: 'RMA', name: 'Real Madrid', abbr: 'RMA', rating: 5 },
  { id: 'LIV', name: 'Liverpool', abbr: 'LIV', rating: 5 },
  { id: 'INT', name: 'Inter', abbr: 'INT', rating: 5 },

  { id: 'ATM', name: 'Atlético Madrid', abbr: 'ATM', rating: 4 },
  { id: 'BVB', name: 'Borussia Dortmund', shortName: 'Dortmund', abbr: 'BVB', rating: 4 },
  { id: 'MUN', name: 'Manchester United', shortName: 'Man. United', abbr: 'MUN', rating: 4 },
  { id: 'AVL', name: 'Aston Villa', abbr: 'AVL', rating: 4 },
  { id: 'ROM', name: 'AS Roma', abbr: 'ROM', rating: 4 },
  { id: 'SPO', name: 'Sporting CP', abbr: 'SPO', rating: 4 },
  { id: 'POR', name: 'FC Porto', abbr: 'POR', rating: 4 },
  { id: 'NAP', name: 'Napoli', abbr: 'NAP', rating: 4 },
  { id: 'RBL', name: 'RB Leipzig', abbr: 'RBL', rating: 4 },

  { id: 'LIL', name: 'Lille', abbr: 'LIL', rating: 3 },
  { id: 'VIL', name: 'Villarreal', abbr: 'VIL', rating: 3 },
  { id: 'BET', name: 'Real Betis', abbr: 'BET', rating: 3 },
  { id: 'STU', name: 'VfB Stuttgart', shortName: 'Stuttgart', abbr: 'STU', rating: 3 },
  { id: 'CLU', name: 'Club Brugge', abbr: 'CLU', rating: 3 },
  { id: 'PSV', name: 'PSV', abbr: 'PSV', rating: 3 },
  { id: 'LEN', name: 'RC Lens', abbr: 'LEN', rating: 3 },
  { id: 'COM', name: 'Como', abbr: 'COM', rating: 3 },

  { id: 'SLA', name: 'Slavia Praha', abbr: 'SLA', rating: 2 },
  { id: 'SHK', name: 'Shakhtar Donetsk', shortName: 'Shakhtar', abbr: 'SHK', rating: 2 },
  { id: 'BOD', name: 'Bodø/Glimt', abbr: 'BOD', rating: 2 },
  { id: 'FEN', name: 'Fenerbahçe', abbr: 'FEN', rating: 2 },
  { id: 'GAL', name: 'Galatasaray', abbr: 'GAL', rating: 2 },
  { id: 'FEY', name: 'Feyenoord', abbr: 'FEY', rating: 2 },

  { id: 'SAB', name: 'Sabah FK', abbr: 'SAB', rating: 1 },
  { id: 'VIK', name: 'Viking FK', abbr: 'VIK', rating: 1 },
  { id: 'SLO', name: 'Slovan Bratislava', shortName: 'S. Bratislava', abbr: 'SLO', rating: 1 },
  { id: 'LAS', name: 'LASK', abbr: 'LAS', rating: 1 },
  { id: 'AEK', name: 'AEK Athens', abbr: 'AEK', rating: 1 },
]

// Every pair below clears 4.5:1 text-on-background contrast, so the number
// printed inside a fixture chip stays readable at 11px bold. Bands 1 and 5 were
// previously 4.19 and 4.45 — close, but under the line.
export const RATING_COLORS = {
  1: { bg: '#1a7a44', text: '#eafff1', label: 'Very easy' },
  2: { bg: '#7fc242', text: '#0b2412', label: 'Easy' },
  3: { bg: '#f2c14e', text: '#3a2b00', label: 'Average' },
  4: { bg: '#e8722c', text: '#2c1200', label: 'Hard' },
  5: { bg: '#c62d31', text: '#ffffff', label: 'Very hard' },
}

// Shown in the "How difficulty is calculated" panel. Kept here so the
// explanation and the numbers it describes live in the same file.
export const RATING_METHOD = [
  'Every team starts on a 1–5 strength rating — adjust it to your own opinion any time.',
  'A fixture takes the difficulty of the opponent you face, not your own strength.',
  'Home ties are eased by half a step and away ties hardened by half a step, which moves most fixtures one colour band. Turn this off with the Home/away switch.',
  'Every rating is yours to override in the Strength tab — the table, runs and comparisons all recalculate live.',
  'Building a separate Limitless/wildcard team for one matchday? Use "Skip" in the range picker to leave it out of this team’s table and averages.',
]
