import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Keeps public/sitemap.xml's <lastmod> from drifting: it's derived from
// DATA_UPDATED (src/data/fixtures.js) at build time instead of being a second
// date someone has to remember to bump by hand alongside the fixture data.
function stampSitemapLastmod() {
  let outDir = 'dist'
  return {
    name: 'stamp-sitemap-lastmod',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const fixturesSrc = readFileSync(resolve(__dirname, 'src/data/fixtures.js'), 'utf-8')
      const match = fixturesSrc.match(/DATA_UPDATED\s*=\s*['"]([^'"]+)['"]/)
      if (!match) return

      const sitemapPath = resolve(__dirname, outDir, 'sitemap.xml')
      if (!existsSync(sitemapPath)) return

      const sitemap = readFileSync(sitemapPath, 'utf-8')
      const stamped = sitemap.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${match[1]}</lastmod>`)
      writeFileSync(sitemapPath, stamped)
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
  plugins: [react(), stampSitemapLastmod(), oddsRatings()],
  build: {
    // Most club badges are under Vite's 4 KB inline threshold, so they were
    // being base64'd into the main bundle — 33% bigger than the binary and
    // sitting in front of first paint. As separate files they are cached
    // individually and fetched lazily as rows scroll into view.
    assetsInlineLimit: 0,
  },
})
