# UCL FDR

Fixture Difficulty Rating tool for the UEFA Champions League — React + Vite, mobile-first, Vercel-ready.

## Features

- **Team Strength**: adjust each of the 36 teams' rating (1-5) live, color-coded (green = easy, red = hard). Persisted to `localStorage`.
- **FDR Table**: all teams as rows, gameweeks as columns, each cell shows the opponent + home/away, colored by that opponent's strength. Filter by GW range and sort by best fixture run or name.
- **Best Fixture Runs**: top 5 teams with the lowest average difficulty over a GW range you choose.
- **Compare Teams**: select up to 5 teams and see their fixtures stacked.

## Fixture data

`src/data/fixtures.js` holds the real GW1-8 fixtures for the 2026/27 UEFA Champions League league phase. Each entry has the shape:

```js
{ gw: 1, opp: 'BAY', venue: 'H' } // gameweek, opponent abbreviation, home (H) or away (A)
```

The source list lives in `scripts/raw-fixtures.txt` (one block per team, `GW<n> <OPP> <H|A>` per line). To regenerate `src/data/fixtures.js` after editing that file — e.g. once later gameweeks are announced — run:

```bash
node scripts/build-fixtures.mjs
```

The script cross-checks every fixture against its reciprocal (if ARS has `GW1 NAP A`, NAP must have `GW1 ARS H`) and refuses to write the file if anything doesn't line up.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (dist/)
npm run preview   # preview the build
```

## Deploy

Standard Vite project — import the repo into Vercel and the build (`npm run build`, output in `dist/`) is auto-detected.
