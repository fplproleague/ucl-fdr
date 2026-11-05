import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildSitemap, stampNextMatchday } from './scripts/seo.mjs'
import { writeMatchdayPages } from './scripts/build-md-pages.mjs'

const __dirname = new URL('.', import.meta.url).pathname

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

export default defineConfig({
  plugins: [react(), stampNextMatchdayHtml(), sitemapAndMatchdayPages()],
  build: {
    // Most club badges are under Vite's 4 KB inline threshold, so they were
    // being base64'd into the main bundle — 33% bigger than the binary and
    // sitting in front of first paint. As separate files they are cached
    // individually and fetched lazily as rows scroll into view.
    assetsInlineLimit: 0,
  },
})
