import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = new URL('.', import.meta.url).pathname

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

export default defineConfig({
  plugins: [react(), stampSitemapLastmod()],
  build: {
    // Most club badges are under Vite's 4 KB inline threshold, so they were
    // being base64'd into the main bundle — 33% bigger than the binary and
    // sitting in front of first paint. As separate files they are cached
    // individually and fetched lazily as rows scroll into view.
    assetsInlineLimit: 0,
  },
})
