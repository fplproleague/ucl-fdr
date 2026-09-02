# UCL FDR

Fixture Difficulty Rating tool for the UEFA Champions League league phase — React + Vite, mobile-first, Vercel-ready.

Live: [ucl-fdr.vercel.app](https://ucl-fdr.vercel.app/)

## Features

- **FDR Table** — all 36 teams as rows, MD1–MD8 as columns. Each cell shows the opponent, home/away and a difficulty band (colour *and* a printed digit). The sticky team column carries each team's average over the selected range.
- **Best Fixture Runs** — every team ranked by average difficulty, with real tiebreaks (home games, then count of very hard fixtures) and a "biggest swing" panel showing whose fixtures improve most inside the selected window.
- **Compare Teams** — up to five teams in one aligned grid, sorted easiest run first.
- **Team Strength** — override any team's 1–5 rating. Searchable, changed teams are flagged with their original value, and everything recalculates live.

## How difficulty is calculated

1. Every team carries a 1–5 strength rating, seeded from its UEFA coefficient and league-phase pot.
2. A fixture takes the difficulty of the **opponent**, not of the team playing it.
3. Home ties are eased by half a step, away ties hardened by half a step (`VENUE_DELTA` in `src/utils/difficulty.js`), which moves most fixtures one colour band. The Home/away switch turns this off.
4. Every rating is user-overridable and the overrides ride along in the URL.

Note that over the full MD1–MD8 range the venue adjustment nets out — every team plays exactly four home and four away — so it changes colours and per-fixture reading, not the season-long ranking. Over a shorter window, where the home/away split is uneven, it moves the averages.

## URL state

The whole view lives in the hash, so any state is linkable:

```
#/table?from=1&to=8
#/runs?from=2&to=5
#/compare?from=1&to=8&teams=ARS,INT,BAY
#/table?r=ARS4BVB2          # custom ratings, packed 4 chars per team
```

Changing tab pushes a history entry (so mobile back walks through views); every other change replaces, so the back button doesn't fill up with rating taps.

## Fixture data

`src/data/fixtures.js` holds the GW1–8 fixtures for the 2026/27 league phase, verified against the official draw:
every fixture has a matching reciprocal with the opposite venue, all 36 teams play 8 matches (4 home / 4 away), no
team faces a domestic rival, and nobody faces more than two clubs from one association.

Each entry has the shape:

```js
{ gw: 1, opp: 'BAY', venue: 'H' } // matchday, opponent abbreviation, home (H) or away (A)
```

The source list lives in `scripts/raw-fixtures.txt` (one block per team, `GW<n> <OPP> <H|A>` per line). To regenerate
`src/data/fixtures.js` after editing it:

```bash
node scripts/build-fixtures.mjs
```

The script cross-checks every fixture against its reciprocal and refuses to write the file if anything doesn't line up.
Bump `DATA_UPDATED` in the same file when the data changes — the footer reads it.

Matchday dates live in `src/data/matchdays.js`.

## Assets

Club badges ship as 96px WebP in `src/assets/badges/` (every file under 7 KB, crisp up to a 3× phone). The original
vector art stays in `src/assets/logos/` as the source of truth but is **not** imported — those files total ~490 KB,
with a single crest reaching 31 KB gzipped for a badge drawn at 20 pixels.

The share card at `public/og-image.jpg` (1200×630) is what X and other platforms render for a shared link.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (dist/)
npm run preview   # preview the build
npm run lint
```

## Deploy

Standard Vite project — import the repo into Vercel and the build (`npm run build`, output in `dist/`) is auto-detected.

Not affiliated with UEFA. Club badges are the property of their respective clubs.
