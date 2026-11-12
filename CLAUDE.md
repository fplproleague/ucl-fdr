# UCL FDR

Fixture Difficulty Rating-tool voor de competitiefase van de UEFA Champions League, gericht op UCL Fantasy-spelers.
Live: https://ucl-fdr.vercel.app (Vercel deployt automatisch vanaf `main`). Zie `README.md` voor alle features.

## Stack

- React 18 + Vite 6, Tailwind CSS 3, `lucide-react`-iconen. Geen backend: alles is statische data in `src/data/`.
- Routing via de hash (`#/table`, `#/players`, `#/odds`, …). De view-state zit in de URL (`src/utils/urlState.js`).
- Tests: Node's eigen test runner (`node --test`, bestanden in `tests/`). Lint: ESLint 9.
- Hosting: Vercel, met `@vercel/analytics` en `speed-insights`.

## Opstarten (Windows, Git Bash)

```bash
npm ci          # dependencies installeren
npm run dev     # dev-server op http://localhost:5173 (of het volgende vrije poortnummer)
npm test        # tests
npm run lint    # lint
npm run build   # productie-build naar dist/
```

In de Claude-app start `.claude/launch.json` de dev-server (naam `dev`).

## Data en scripts

- `src/data/fixtures.js` komt uit `scripts/raw-fixtures.txt` via `node scripts/build-fixtures.mjs`.
- `src/data/odds.js` wordt elke dag ververst door de GitHub Action `.github/workflows/odds.yml`, die rechtstreeks
  naar `main` commit ("Odds: scheduled update"). **Doe altijd eerst `git pull` voor je begint**, anders loop je achter.
- `npm run build` draait eerst `scripts/build-players.mjs --soft`. Dat herschrijft `src/data/players.js` met de
  actuele Google Sheet. Na een lokale build staat dat bestand dus als gewijzigd; dat is normaal. Zet het terug met
  `git restore src/data/players.js` als je het niet wil committen.
- Sleutels voor de odds-scripts staan in `*.local`-bestanden in de root (`api-football-key.local`,
  optioneel `odds-api-key.local`) of in `~/.ucl-fdr/`. Die zijn gitignored. Lees of toon ze nooit.
- `.env` (lokaal, staat in `.gitignore`) bevat dezelfde namen (`API_FOOTBALL_KEY`, `ODDS_API_KEY`).
  De scripts laden hem niet vanzelf: gebruik `node --env-file=.env scripts/build-odds.mjs`.
  De site zelf heeft geen omgevingsvariabelen nodig.

## Openstaand werk

- **PR #17 "Knockouts"** (branch `claude/eloquent-ramanujan-em891s`, lokale kopie `knockouts-na-md8`):
  bracket, knock-out-odds en planners. **Pas mergen na MD8** (27 jan 2027), als de stand van de competitiefase
  bekend is. Niet verwijderen. Hij ligt ver achter op `main` en moet vóór het mergen gerebased worden.

## Werkafspraken

- De eigenaar is geen ervaren programmeur: leg stappen eenvoudig uit, in het Nederlands.
- Niets pushen naar GitHub en geen bestaande code wijzigen zonder het eerst te vragen.
- Commits en PR's in het Engels, in de stijl van de bestaande geschiedenis (bv. "Odds: …").
