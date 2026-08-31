// Initial team strength ratings (1 = easiest opponent, 5 = hardest opponent).
// Users can override these live in the "Team-sterkte" tab; overrides are
// persisted to localStorage (see src/context/TeamsContext.jsx).
export const INITIAL_TEAMS = [
  { id: 'ARS', name: 'Arsenal', abbr: 'ARS', rating: 5 },
  { id: 'BAY', name: 'Bayern München', abbr: 'BAY', rating: 5 },
  { id: 'BAR', name: 'Barcelona', abbr: 'BAR', rating: 5 },
  { id: 'MCI', name: 'Manchester City', abbr: 'MCI', rating: 5 },
  { id: 'PSG', name: 'Paris Saint-Germain', abbr: 'PSG', rating: 5 },
  { id: 'RMA', name: 'Real Madrid', abbr: 'RMA', rating: 5 },
  { id: 'LIV', name: 'Liverpool', abbr: 'LIV', rating: 5 },
  { id: 'INT', name: 'Inter', abbr: 'INT', rating: 5 },

  { id: 'ATM', name: 'Atlético Madrid', abbr: 'ATM', rating: 4 },
  { id: 'BVB', name: 'Borussia Dortmund', abbr: 'BVB', rating: 4 },
  { id: 'MUN', name: 'Manchester United', abbr: 'MUN', rating: 4 },
  { id: 'AVL', name: 'Aston Villa', abbr: 'AVL', rating: 4 },
  { id: 'ROM', name: 'AS Roma', abbr: 'ROM', rating: 4 },
  { id: 'SPO', name: 'Sporting CP', abbr: 'SPO', rating: 4 },
  { id: 'POR', name: 'FC Porto', abbr: 'POR', rating: 4 },
  { id: 'NAP', name: 'Napoli', abbr: 'NAP', rating: 4 },
  { id: 'RBL', name: 'RB Leipzig', abbr: 'RBL', rating: 4 },

  { id: 'LIL', name: 'Lille', abbr: 'LIL', rating: 3 },
  { id: 'VIL', name: 'Villarreal', abbr: 'VIL', rating: 3 },
  { id: 'BET', name: 'Real Betis', abbr: 'BET', rating: 3 },
  { id: 'STU', name: 'VfB Stuttgart', abbr: 'STU', rating: 3 },
  { id: 'CLU', name: 'Club Brugge', abbr: 'CLU', rating: 3 },
  { id: 'PSV', name: 'PSV', abbr: 'PSV', rating: 3 },
  { id: 'LEN', name: 'RC Lens', abbr: 'LEN', rating: 3 },
  { id: 'COM', name: 'Como', abbr: 'COM', rating: 3 },

  { id: 'SLA', name: 'Slavia Praha', abbr: 'SLA', rating: 2 },
  { id: 'SHK', name: 'Shakhtar Donetsk', abbr: 'SHK', rating: 2 },
  { id: 'BOD', name: 'Bodø/Glimt', abbr: 'BOD', rating: 2 },
  { id: 'FEN', name: 'Fenerbahçe', abbr: 'FEN', rating: 2 },
  { id: 'GAL', name: 'Galatasaray', abbr: 'GAL', rating: 2 },
  { id: 'FEY', name: 'Feyenoord', abbr: 'FEY', rating: 2 },

  { id: 'SAB', name: 'Sabah FK', abbr: 'SAB', rating: 1 },
  { id: 'VIK', name: 'Viking FK', abbr: 'VIK', rating: 1 },
  { id: 'SLO', name: 'Slovan Bratislava', abbr: 'SLO', rating: 1 },
  { id: 'LAS', name: 'LASK', abbr: 'LAS', rating: 1 },
  { id: 'AEK', name: 'AEK Athens', abbr: 'AEK', rating: 1 },
]

export const RATING_COLORS = {
  1: { bg: '#1e8a4c', text: '#eafff1', label: 'Zeer makkelijk' },
  2: { bg: '#7fc242', text: '#0b2412', label: 'Makkelijk' },
  3: { bg: '#f2c14e', text: '#3a2b00', label: 'Gemiddeld' },
  4: { bg: '#e8722c', text: '#2c1200', label: 'Moeilijk' },
  5: { bg: '#d13438', text: '#fff0ef', label: 'Zeer moeilijk' },
}
