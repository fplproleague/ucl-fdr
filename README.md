# UCL FDR

Fixture Difficulty Rating tool voor de UEFA Champions League — React + Vite, mobile-first, klaar voor Vercel.

## Features

- **Team-sterkte**: pas de rating (1-5) van elk van de 36 teams live aan, met kleurcodering (groen = makkelijk, rood = moeilijk). Wordt bewaard in `localStorage`.
- **FDR-tabel**: alle teams als rijen, gameweeks als kolommen, elke cel toont de tegenstander + thuis/uit, gekleurd volgens de sterkte van die tegenstander.
- **Beste fixture runs**: top 5 teams met de laagste gemiddelde moeilijkheidsgraad over een zelf te kiezen GW-range.
- **Vergelijk teams**: selecteer tot 5 teams en bekijk hun fixtures onder elkaar.

## Fixture-data

`src/data/fixtures.js` bevat momenteel **placeholder-fixtures voor GW1-8**, gegenereerd met de round-robin "circle method" (`scripts/gen-placeholder-fixtures.mjs`) zodat elk team 8 unieke tegenstanders heeft met een realistische thuis/uit-verdeling. Zodra de echte fixtures beschikbaar zijn, vervang je gewoon de `FIXTURES`-object in dat bestand — de rest van de app (tabel, beste runs, vergelijken) rekent daar automatisch mee door.

Elke entry heeft de vorm:

```js
{ gw: 1, opp: 'BAY', venue: 'H' } // gameweek, tegenstander-afkorting, thuis (H) of uit (A)
```

## Development

```bash
npm install
npm run dev       # lokale dev server
npm run build     # productie build (dist/)
npm run preview   # preview van de build
```

## Deploy

Standaard Vite-project — importeer de repo in Vercel en de build (`npm run build`, output in `dist/`) wordt automatisch gedetecteerd.
