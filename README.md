# UCL FDR

Fixture Difficulty Rating tool for the UEFA Champions League — React + Vite, mobile-first, Vercel-ready.

## Features

- **Team Strength**: adjust each of the 36 teams' rating (1-5) live, color-coded (green = easy, red = hard). Persisted to `localStorage`.
- **FDR Table**: all teams as rows, gameweeks as columns, each cell shows the opponent + home/away, colored by that opponent's strength. Filter by GW range and sort by best fixture run or name.
- **Best Fixture Runs**: top 5 teams with the lowest average difficulty over a GW range you choose.
- **Compare Teams**: select up to 5 teams and see their fixtures stacked.

## Fixture data

`src/data/fixtures.js` currently holds **placeholder fixtures for GW1-8**, generated with a round-robin "circle method" (`scripts/gen-placeholder-fixtures.mjs`) so every team has 8 unique opponents with a realistic home/away split. Once the real fixtures are available, just replace the `FIXTURES` object in that file — the rest of the app (table, best runs, compare) recalculates automatically.

Each entry has the shape:

```js
{ gw: 1, opp: 'BAY', venue: 'H' } // gameweek, opponent abbreviation, home (H) or away (A)
```

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (dist/)
npm run preview   # preview the build
```

## Deploy

Standard Vite project — import the repo into Vercel and the build (`npm run build`, output in `dist/`) is auto-detected.
