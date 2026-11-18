import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildSitemap, stampNextMatchday } from './scripts/seo.mjs'
import { writeMatchdayPages } from './scripts/build-md-pages.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Stamps the upcoming matchday ("Next up: MD5, 24–25 Nov 2026") into
// index.html's meta description and <noscript> at build time, from
// src/data/matchdays.js, so the static HTML a crawler reads is never a
// matchday behind. The <title> is deliberately left stable.
function stampNextMatchdayHtml() {
  return {
    name: 'stamp-next-matchday',
    transformIndexHtml(html) {
      return stampNextMatchday(html, new Date())
    },
  }
}

// Writes dist/sitemap.xml (the home page plus the eight matchday pages,
// lastmod = build date) and the static matchday pages themselves
// (dist/md/<n>/index.html, see scripts/build-md-pages.mjs). Generated, not
// hand-kept, so nobody has to remember to bump a date.
function sitemapAndMatchdayPages() {
  let outDir = 'dist'
  return {
    name: 'sitemap-and-matchday-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(__dirname, config.build.outDir)
    },
    closeBundle() {
      const now = new Date()
      writeMatchdayPages(outDir, { today: now })
      writeFileSync(resolve(outDir, 'sitemap.xml'), buildSitemap(now))
    },
  }
}

// The default 1-5 rating of every team, as the bookmakers' odds (and Elo,
// where a club isn't priced) rank them: `import { ODDS_RATINGS } from
// 'virtual:odds-ratings'`. Worked out here, at build time, from the same
// odds file and the same impliedRatings() the Strength tab uses, so the site
// doesn't have to download the whole odds archive before it can colour its
// first table, and the table can't open on one set of ratings and then
// reshuffle when the odds arrive. If there are no odds, the object is empty
// and every team keeps its seed rating from src/data/teams.js.
function oddsRatings() {
  const id = 'virtual:odds-ratings'
  const resolved = `\0${id}`
  const sources = ['src/data/odds.js', 'src/data/teams.js', 'src/utils/oddsView.js']
  return {
    name: 'odds-ratings',
    resolveId(source) {
      return source === id ? resolved : null
    },
    async load(moduleId) {
      if (moduleId !== resolved) return null
      for (const file of sources) this.addWatchFile(resolve(__dirname, file))
      // A fresh copy each time, so the dev server picks up a new odds file.
      const fresh = (file) => import(`${pathToFileURL(resolve(__dirname, file)).href}?t=${Date.now()}`)
      const [{ ODDS }, { INITIAL_TEAMS }, { impliedRatings }] = await Promise.all(sources.map(fresh))
      const implied = impliedRatings(ODDS, Object.fromEntries(INITIAL_TEAMS.map((t) => [t.abbr, t.rating])))
      const ratings = Object.fromEntries(Object.entries(implied).map(([abbr, r]) => [abbr, r.rating]))
      return `export const ODDS_RATINGS = ${JSON.stringify(ratings)}\nexport const ODDS_RATINGS_MATCHES = ${
        Object.values(implied)[0]?.matches ?? 0
      }\n`
    },
  }
}

export default defineConfig({
  plugins: [react(), stampNextMatchdayHtml(), sitemapAndMatchdayPages(), oddsRatings()],
  build: {
    // Most club badges are under Vite's 4 KB inline threshold, so they were
    // being base64'd into the main bundle — 33% bigger than the binary and
    // sitting in front of first paint. As separate files they are cached
    // individually and fetched lazily as rows scroll into view.
    assetsInlineLimit: 0,
  },
})
