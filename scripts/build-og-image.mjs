// Renders public/og-image.jpg, the 1200x630 card shown when the site is
// shared. It replaces scripts/crop-ucl-icon.mjs, which existed only to crop
// the UEFA starball for the header: the starball is gone from the site's
// own identity (see src/components/BrandMark.jsx), and the old card still
// carried it, on the old blue gradient with the old accent blue.
//
// The card is drawn from the site's own data and palette, so it can be
// re-run when the season moves on: flat navy, white type, brass for the one
// emphasised word, the owner's F mark, and the four easiest runs over the
// remaining matchdays as fixture chips (default ratings from the odds, as
// on the site).
//
//   node scripts/build-og-image.mjs
//
// Needs Playwright's Chromium (not a project dependency; preinstalled where
// this was written). Run by hand, not on build.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { FIXTURES, TOTAL_MATCHDAYS } from '../src/data/fixtures.js'
import { INITIAL_TEAMS, RATING_COLORS } from '../src/data/teams.js'
import { MATCHDAY_LABEL, currentMatchday } from '../src/data/matchdays.js'
import { ODDS } from '../src/data/odds.js'
import { impliedRatings } from '../src/utils/oddsView.js'
import {
  averageDifficulty,
  compareRuns,
  difficultyBand,
  effectiveDifficulty,
  formatAvg,
  homeCount,
} from '../src/utils/difficulty.js'

// Playwright via require, so a global install (NODE_PATH) is found too.
const { chromium } = createRequire(import.meta.url)('playwright')

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = (p) => pathToFileURL(path.join(root, p)).href

// The same default ratings the site uses (vite.config.js, oddsRatings).
const implied = impliedRatings(ODDS, Object.fromEntries(INITIAL_TEAMS.map((t) => [t.abbr, t.rating])))
const teams = INITIAL_TEAMS.map((t) => ({ ...t, rating: implied[t.abbr]?.rating ?? t.rating }))
const byAbbr = Object.fromEntries(teams.map((t) => [t.abbr, t]))

const from = currentMatchday()
const mds = Array.from({ length: TOTAL_MATCHDAYS - from + 1 }, (_, i) => from + i).slice(0, 6)
const rows = teams
  .map((team) => {
    const fixtures = mds.map((md) => (FIXTURES[team.abbr] ?? []).find((f) => f.gw === md)).filter(Boolean)
    const hard = fixtures.filter(
      (f) => difficultyBand(effectiveDifficulty(byAbbr[f.opp]?.rating ?? 3, f.venue, true, 0)) >= 4,
    ).length
    return { team, fixtures, avg: averageDifficulty(fixtures, byAbbr, true), homes: homeCount(fixtures), hard }
  })
  .sort(compareRuns)
  .slice(0, 4)

const chip = (f) => {
  const band = difficultyBand(effectiveDifficulty(byAbbr[f.opp]?.rating ?? 3, f.venue, true, 0))
  const c = RATING_COLORS[band]
  return `<div class="chip" style="background:${c.bg};color:${c.text}">${f.opp} (${f.venue})<i>${band}</i></div>`
}
const mark = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')
const range = from === mds[mds.length - 1] ? `MD${from}` : `MD${from}–MD${mds[mds.length - 1]}`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Body; src: url(${file('node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: Display; src: url(${file('src/assets/fonts/archivo-expanded-latin.woff2')}); font-weight: 600 800; }
* { margin: 0; box-sizing: border-box }
body { width: 1200px; height: 630px; background: #040818; color: #e6e9ff; font-family: Body, sans-serif; padding: 48px 60px; position: relative }
.brand { display: flex; align-items: center; gap: 18px }
.brand svg { width: 56px; height: 56px }
.name { font-family: Display; font-weight: 800; font-size: 26px; letter-spacing: -0.01em }
.tag { color: #8f92b8; font-size: 17px; margin-top: 2px }
h1 { font-family: Display; font-weight: 800; font-size: 50px; line-height: 1.08; letter-spacing: -0.02em; margin-top: 30px; max-width: 1000px }
h1 b { color: #D7B45A; font-weight: 800 }
.sub { color: #8f92b8; font-size: 21px; margin-top: 12px }
table { margin-top: 18px; border-spacing: 8px 6px; margin-left: -8px }
th { font-family: Display; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; color: #8f92b8; text-align: center }
td.team { font-weight: 600; font-size: 21px; white-space: nowrap; padding-right: 10px }
td.team img { width: 26px; height: 26px; vertical-align: -8px; margin-right: 10px }
td.avg { font-size: 20px; color: #8f92b8; font-variant-numeric: tabular-nums; padding-right: 12px }
.chip { position: relative; width: 112px; height: 38px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 17px }
.chip i { position: absolute; right: 5px; top: 2px; font-style: normal; font-size: 11px; opacity: .65 }
.foot { position: absolute; left: 60px; right: 60px; bottom: 28px; display: flex; justify-content: space-between; font-size: 18px; color: #8f92b8 }
.foot b { color: #e6e9ff; font-weight: 600 }
</style></head><body>
<div class="brand">${mark}<div><div class="name">UCL Fantasy FDR</div><div class="tag">Fixture difficulty for UCL Fantasy</div></div></div>
<h1>Every Champions League fixture, <b>ranked</b>.</h1>
<p class="sub">All 36 teams · ${range} · ratings from the odds, yours to change</p>
<table><tr><th></th><th></th>${mds.map((md) => `<th>MD${md}<br><span style="letter-spacing:0;font-family:Body;font-weight:400;font-size:11px">${MATCHDAY_LABEL[md] ?? ''}</span></th>`).join('')}</tr>
${rows
  .map(
    (r) =>
      `<tr><td class="team"><img src="${file(`src/assets/badges/${r.team.abbr}.webp`)}">${r.team.shortName ?? r.team.name}</td><td class="avg">${formatAvg(r.avg)}</td>${mds
        .map((md) => {
          const f = r.fixtures.find((x) => x.gw === md)
          return `<td>${f ? chip(f) : ''}</td>`
        })
        .join('')}</tr>`,
  )
  .join('')}
</table>
<div class="foot"><b>ucl-fdr.vercel.app</b><span>Unofficial fan tool · by @fpl_proleague</span></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
// From a file, not setContent: an about:blank page may not load the
// file:// fonts and crests.
const dir = mkdtempSync(path.join(tmpdir(), 'og-'))
writeFileSync(path.join(dir, 'card.html'), html)
await page.goto(pathToFileURL(path.join(dir, 'card.html')).href, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
const jpg = await page.screenshot({ type: 'jpeg', quality: 88 })
await browser.close()
rmSync(dir, { recursive: true, force: true })
writeFileSync(path.join(root, 'public/og-image.jpg'), jpg)
console.log(`public/og-image.jpg: ${jpg.length} bytes, ${range}, ${rows.map((r) => r.team.abbr).join(' ')}`)
