# UCL FDR

Fixture Difficulty Rating tool for the UEFA Champions League league phase — React + Vite, mobile-first, Vercel-ready.

Live: [ucl-fdr.vercel.app](https://ucl-fdr.vercel.app/)

## Features

- **FDR Table** — all 36 teams as rows, MD1–MD8 as columns. Each cell shows the opponent, home/away and a difficulty band (colour *and* a printed digit). The sticky team column carries each team's average over the selected range.
- **Best Fixture Runs** — every team ranked by average difficulty, with real tiebreaks (home games, then count of very hard fixtures) and a "biggest swing" panel showing whose fixtures improve most inside the selected window.
- **Comparing teams** — *Compare teams* on the FDR Table (or *Compare* in a team's panel) cuts the table down to the teams you pick, easiest run first; with exactly two it adds a head-to-head and a rotation check. This was a Compare tab of its own until it turned out to be the least used one; old `#/compare` links open the table in this mode.
- **Players** — a form-and-fixtures guide per player over the selected matchdays: a 0–100 score (100 = best player for those matchdays) from points per match so far, minutes played and the fixtures in the range. Deliberately not shown as expected points: the model knows form and fixtures, not injuries, team news or expected goals. Filter by position, max price (a slider in €0.5m steps) and ownership; sort by score, score per €m or form. A **Form: UCL / Domestic / Both** switch (once domestic data exists, see below; *Both* by default) adds each club's last 5 league matches: form as points per match (missed matches count as zeros, so cameos don't top the Form sort), goals + assists per 90, and minutes plus per-match lines in a player's details; under *Both* UCL and domestic form count equally in the score. Players can be starred into a shortlist (kept in the browser, shared with the Odds tab) and filtered on from the *Show* menu, with *My teams* and Differentials. Tap **VS** on up to 5 players (3 on a phone, so the table never scrolls sideways) to compare them side by side: stats as rows (overview, fixtures per matchday, UCL, last 5 league matches, rates per 90), the best value in each row highlighted, bars where more is better, and a "best in N" count per player. A stat with match-by-match data opens to show where it comes from (which matches the clean sheets, goals or minutes came in). The comparison is in the link (`#/players?cmp=…`), so it can be shared. Appears in the menu once a player sheet is connected (see below); `#/players?demo=1` previews it with made-up players.
- **Odds** — the bookmakers' view, independent of the 1–5 ratings (they're opinions anyone can change, so they never feed it). *Teams*: every team × matchday with a switch between clean-sheet chance, expected goals for and expected goals against; one colour, more fill = better for a fantasy pick; tap a matchday to sort on it. A match the bookmakers haven't priced yet (they start about a week ahead) is an estimate, drawn dashed and lighter: each club's Elo rating (clubelo.com, saved with the odds) plus every team's attack and defence fitted to all priced matches together (`src/utils/oddsView.js`), so the estimates sharpen as matchdays are priced. *Players*: one matchday shows each sheet player's chances of a goal, an assist, either, and his team's clean sheet, from the odds; several show expected totals, later matchdays estimated from his share of his team's goals — a line above the table says which, all if he plays. Long tables (FDR, Odds, Players) keep a slim copy of their header row under the site header while scrolling. Data: see *Betting odds* below.
- **Across tabs** — the Odds data shows up where it helps, without extra toolbar rows: the team panel (tap a team anywhere, the Odds grid included) shows its clean-sheet chances and expected goals per matchday and links to that club's players on the Players and Odds tabs; a player's name on the Odds tab opens him on the Players tab, and a player's details there show his goal-or-assist chances with a link back; the side-by-side comparison gets *Bookmaker odds* rows; Best Runs and GK Rotation can rank on clean-sheet odds (and Best Runs on expected goals) from a switch beside the title; the Strength tab shows the rating the odds point to (*Odds ≈*) next to each team's own. Starred players are one shortlist for every tab, and starred players and *My teams* filter the Players and Odds tabs from one small *Show* menu that only appears once you star or pin something. The Odds tab's view, metric, sorted matchday and the searches on Players and Odds ride in the link (`ov`, `om`, `os`, `q`).
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
#/table?from=1&to=8&teams=ARS,INT,BAY   # the FDR table comparing three teams (#/compare… still works)
#/table?r=ARS4BVB2          # custom ratings, packed 4 chars per team
#/players?cmp=p250016833,p250176450   # players compared side by side (up to 5)
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

## Player sheet

The Players tab and GK Rotation both read this one published Google Sheet (GK Rotation uses its goalkeepers, with their minutes, points, price and ownership).

1. A sheet with this header row (any order, see `scripts/players-template.csv`):
   `Player, Club, Position, Price, Points, Minutes`
   - **Club**: the club's name as the site knows it (full name, short name or 3-letter code all work).
   - **Position**: `GK`, `DEF`, `MID` or `FWD`.
   - **Points** / **Minutes**: season totals so far; leave empty for someone who hasn't played.
   - Optional, used when present: `Player ID` (stable row key), `Ownership %` (the Differentials filter), `Apps`,
     `MD1`, `MD2`, … (points per matchday, shown in a player's details), and `Goals`, `Assists`, `Clean sheets`,
     `Saves`, `Balls recovered`, `POTM`. Any other column is ignored.
2. File → Share → Publish to web → pick that tab → *Comma-separated values (.csv)* → Publish, and copy the link.
3. Paste the link into `PLAYERS_SHEET_URL` in `src/utils/useLivePlayers.js`. The tab then shows up in the menu.

From then on edits to the sheet show up live; every deploy also saves a fallback copy to `src/data/players.js`
(`scripts/build-players.mjs`, run by `npm run build`), which the browser only downloads when the Players tab opens. Rows the site can't read (unknown club, bad position or price)
are skipped and listed in the browser console and the build log. Update the totals after every matchday: points per
match divide by the matchdays played *by today*, so a sheet that lags behind under-rates everyone (evenly).

## Domestic form (API-Football)

`scripts/build-domestic-form.mjs` fetches every club's last 5 domestic league matches from
[API-Football](https://www.api-football.com/) and saves each sheet player's minutes, goals and assists in them to
`src/data/domesticForm.js`, plus every player's UCL league-phase matches (minutes, goals, assists, clean sheets, saves, shots and key passes per matchday) for the comparison's match-by-match view. The browser never calls the API, so the key stays private.

- **Key**: a text file holding only the key, `api-football-key.local` in the repo root (git ignores `*.local`) or
  `~/.ucl-fdr/api-football-key` (or `API_FOOTBALL_KEY` / `API_FOOTBALL_KEY_FILE`), so it never ends up in a commit, a
  command or a chat.
- **Run**: `node scripts/build-domestic-form.mjs` on a laptop with the repo checked out, then commit and push
  `src/data/domesticForm.js` (that push redeploys the site). Claude Cowork can do this as a scheduled task.
- **Cost**: about 290 requests a run for the league (36 clubs × league, fixtures and squad, plus one per match) and
  one per UCL match played so far (up to 144 by MD8), so a paid plan; the free 100 a day isn't enough.
- **Matching**: clubs are matched to the API by name (`TEAM_ID_OVERRIDES` in the script for any it misses), players by
  name within their club, also with names in another order, a surname inside a longer name or one letter off. The
  run's log lists everyone it couldn't match and every such loose match, to check by hand. A wrong or missing player
  is fixed with an optional `API ID` column in the player sheet (his API-Football player id; no redeploy needed) or
  `PLAYER_ID_OVERRIDES` in the script, which can also mark a player as missing from the API (`null`).
- **Scoring**: in the score a domestic match counts with UCL Fantasy's main rules (appearance, goals, assists, clean
  sheets, goals conceded, saves, cards, penalties) — an estimate, without balls recovered or POTM, which the API
  doesn't have.

Until the file has data the Players tab looks exactly as before; `#/players?demo=1` previews the switch.

## Betting odds (API-Football)

`scripts/build-odds.mjs` saves, for every UCL match bookmakers have priced, each team's expected goals, clean-sheet
chance and win/draw/loss chances, plus the expected goals and assists of the sheet players they price, to
`src/data/odds.js`. Same key and same laptop routine as the domestic form: run `node scripts/build-odds.mjs`, then commit
and push the file.

- **Maths** (`src/utils/odds.js`): every market is de-vigged (implied chances scaled back to 100%) and the median over
  bookmakers is used. Expected goals come from the team-total over/under lines through a Poisson model (or, without
  those, are fitted to the 1X2 and over/under 2.5 odds); a clean sheet is priced directly by the Clean Sheet market and
  the other side's Under 0.5. Players are saved as raw prices (anytime scorer, score or assist); `playerRates` turns
  them into expected goals and assists **if he plays** (those bets are void for a player who doesn't), after taking a
  typical margin (`PLAYER_MARGIN`, an estimate) off each price.
- **When**: bookmakers price a match about two weeks ahead and API-Football drops the odds about a week after it, so
  the file is an archive: each run adds what's priced now and keeps the rest, and a match that has kicked off keeps the
  odds saved before kick-off (`--refresh` re-saves those while the API still has them). Run it in the days before every matchday and on the day itself (player markets fill up
  late).
- **Cost**: one request for the fixture list plus one per 10 priced matches.
- **Matching**: clubs by name like the domestic form (`TEAM_NAME_OVERRIDES` for a miss), players by name within their
  club (`PLAYER_NAME_OVERRIDES`: sheet id → the bookmaker's spelling). The log lists loose matches and likely scorers it
  couldn't place.
- **Elo**: every run also saves each club's Elo rating from [clubelo.com](http://clubelo.com) (free, no key) for the
  estimates; `ELO_NAMES` in the script maps a club the log says it couldn't find. When the machine it runs on can't
  reach clubelo.com (Cowork's sandbox can't), save `http://api.clubelo.com/<today's date>` from a browser into the repo
  folder (as `clubelo.csv`, or under the date-name the browser picks; git ignores both) and the script reads the newest
  one. Neither: the saved Elo is kept. Elo moves slowly, so a download every few weeks is enough.
- `scripts/probe-odds.mjs` prints which bookmakers and markets exist right now, without changing anything.

## Analytics

Vercel Web Analytics (`@vercel/analytics`) counts each tab as a page of its own — `/table`, `/runs`,
`/gk`, `/players`, `/odds/teams`, `/odds/players`, `/strength` — although the app lives on one URL with the view in the
hash (`TrackedAnalytics` in `src/App.jsx`). They show up under *Pages* in the project's Analytics tab; filters and
searches don't count as pageviews.

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
npm test          # player sheet parsing, projection, domestic form and odds checks
```

## Deploy

Standard Vite project — import the repo into Vercel and the build (`npm run build`, output in `dist/`) is auto-detected.

Not affiliated with UEFA. Club badges are the property of their respective clubs.
