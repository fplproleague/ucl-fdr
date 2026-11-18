// Build-time SEO helpers shared by vite.config.js, scripts/build-md-pages.mjs
// and the tests. Node-only: nothing here ships to the browser.
import { MATCHDAYS } from '../src/data/matchdays.js'

export const SITE_URL = 'https://ucl-fdr.vercel.app'

const isoDate = (date) => date.toISOString().slice(0, 10)

// The matchday that hasn't finished yet, or null once the league phase is
// over. Same rule as currentMatchday() in src/data/matchdays.js, minus its
// fall-back to MD8: "next up" must not name a matchday that has been played.
export function upcomingMatchday(today = new Date()) {
  const iso = isoDate(today)
  return MATCHDAYS.find((m) => m.end >= iso) ?? null
}

// "24–25 Nov 2026" — the matchday's own label plus the year it ends in
// (MD7 and MD8 are in January 2027).
export function matchdayDates(m) {
  return `${m.label} ${m.end.slice(0, 4)}`
}

// "Next up: MD5, 24–25 Nov 2026" — stamped into the static HTML so the
// snippet a search engine shows says which matchday is next without JS.
export function nextUpLine(today = new Date()) {
  const m = upcomingMatchday(today)
  return m ? `Next up: MD${m.md}, ${matchdayDates(m)}` : null
}

const NEXT_UP_TEXT = '__NEXT_UP__'
const NEXT_UP_HTML = '<!--next-up-->'

// index.html carries two placeholders: __NEXT_UP__ at the end of the meta
// description, and <!--next-up--> inside <noscript>. Both disappear cleanly
// once the league phase is over. The <title> is left alone on purpose: a
// matchday number in it would change the title every two weeks.
export function stampNextMatchday(html, today = new Date()) {
  const m = upcomingMatchday(today)
  const line = nextUpLine(today)
  return html
    .replaceAll(NEXT_UP_TEXT, line ? ` ${line}.` : '')
    .replaceAll(
      NEXT_UP_HTML,
      m ? `<p>Next up: <a href="/md/${m.md}/">MD${m.md} fixtures &amp; difficulty</a>, ${matchdayDates(m)}.</p>` : '',
    )
}

export function matchdayPath(md) {
  return `/md/${md}/`
}

// The whole sitemap, generated rather than stamped: the home page plus one
// static page per matchday. lastmod is the build date for all of them —
// every deploy refreshes the odds and player data the home page shows (and
// the matchday pages' "played / next up" notes), so DATA_UPDATED, which
// only moves when the fixture list itself changes, under-reported it.
export function buildSitemap(buildDate = new Date()) {
  const lastmod = isoDate(buildDate)
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    ...MATCHDAYS.map((m) => ({ loc: `${SITE_URL}${matchdayPath(m.md)}`, changefreq: 'weekly', priority: '0.8' })),
  ]
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
