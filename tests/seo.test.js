import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildSitemap, nextUpLine, stampNextMatchday, SITE_URL } from '../scripts/seo.mjs'
import { matchdayPages, matchdayData } from '../scripts/build-md-pages.mjs'

const day = (iso) => new Date(`${iso}T12:00:00Z`)
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf-8')

test('index.html title targets fixture ticker and fixture difficulty within ~60 characters', () => {
  const title = indexHtml.match(/<title>([^<]*)<\/title>/)[1].replace(/&amp;/g, '&')
  assert.match(title, /UCL FDR|UCL Fantasy/)
  assert.match(title, /Fixture Ticker/)
  assert.match(title, /Fixture Difficulty/)
  assert.ok(title.length <= 62, `${title.length} characters`)
  assert.doesNotMatch(title, /MD\d/, 'no matchday number in the title')
})

test('next-up line names the matchday that has not finished yet', () => {
  assert.equal(nextUpLine(day('2026-11-05')), 'Next up: MD5, 24–25 Nov 2026')
  assert.equal(nextUpLine(day('2026-11-25')), 'Next up: MD5, 24–25 Nov 2026')
  assert.equal(nextUpLine(day('2026-11-26')), 'Next up: MD6, 8–9 Dec 2026')
  assert.equal(nextUpLine(day('2026-12-20')), 'Next up: MD7, 19–20 Jan 2027')
  assert.equal(nextUpLine(day('2027-02-01')), null)
})

test('index.html gets the next-up line stamped into its description and noscript', () => {
  const html = stampNextMatchday(indexHtml, day('2026-11-05'))
  assert.doesNotMatch(html, /__NEXT_UP__|<!--next-up-->/)
  const description = html.match(/name="description"\s+content="([^"]*)"/)[1]
  assert.match(description, /fixture difficulty/i)
  assert.match(description, /fixture ticker/i)
  assert.match(description, /Next up: MD5, 24–25 Nov 2026\.$/)
  assert.match(html, /<noscript>[\s\S]*Next up: <a href="\/md\/5\/">MD5[\s\S]*<\/noscript>/)

  const after = stampNextMatchday(indexHtml, day('2027-03-01'))
  assert.doesNotMatch(after, /__NEXT_UP__|<!--next-up-->|Next up/)
  assert.match(after, /side by side\."/)
})

test('sitemap lists the home page and all eight matchday pages, dated by the build', () => {
  const xml = buildSitemap(day('2026-11-19'))
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  assert.deepEqual(locs, [`${SITE_URL}/`, ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${SITE_URL}/md/${n}/`)])
  assert.equal([...xml.matchAll(/<lastmod>2026-11-19<\/lastmod>/g)].length, 9)
})

test('every matchday page has 18 matches and its own title and canonical', () => {
  const pages = matchdayPages({ today: day('2026-11-05') })
  assert.equal(pages.length, 8)
  const titles = new Set()
  const canonicals = new Set()
  for (const p of pages) {
    assert.equal((p.html.match(/<li class="match">/g) || []).length, 18, `MD${p.md}`)
    const title = p.html.match(/<title>([^<]*)<\/title>/)[1]
    const canonical = p.html.match(/<link rel="canonical" href="([^"]+)"/)[1]
    assert.match(title, new RegExp(`^UCL MD${p.md} Fixtures &amp; Fixture Difficulty \\(`))
    assert.equal(canonical, `${SITE_URL}/md/${p.md}/`)
    assert.equal((p.html.match(/<h1>/g) || []).length, 1)
    assert.match(p.html, new RegExp(`href="/#/table\\?from=${p.md}&to=${p.md}">Open the full fixture ticker<`))
    assert.equal((p.html.match(/<ol class="easiest">([\s\S]*?)<\/ol>/)[1].match(/<li>/g) || []).length, 5)
    assert.doesNotMatch(p.html, /<script/)
    titles.add(title)
    canonicals.add(canonical)
  }
  assert.equal(titles.size, 8)
  assert.equal(canonicals.size, 8)
})

test('matchday pages link to their neighbours and say when a matchday has been played', () => {
  const pages = matchdayPages({ today: day('2026-11-05') })
  const md1 = pages[0].html
  const md5 = pages[4].html
  const md8 = pages[7].html
  assert.doesNotMatch(md1, /← MD0/)
  assert.match(md1, /href="\/md\/2\/">MD2 fixtures →/)
  assert.match(md5, /href="\/md\/4\/">← MD4 fixtures/)
  assert.match(md5, /href="\/md\/6\/">MD6 fixtures →/)
  assert.doesNotMatch(md8, /MD9/)
  assert.match(md1, /MD1 has been played/)
  assert.doesNotMatch(md5, /has been played/)
})

test('matchday page ratings come from the default ratings, every team once', () => {
  for (let md = 1; md <= 8; md++) {
    const { matches, easiest } = matchdayData(md)
    const teams = matches.flatMap((x) => [x.home.team.abbr, x.away.team.abbr])
    assert.equal(new Set(teams).size, 36, `MD${md}`)
    for (let i = 1; i < easiest.length; i++) assert.ok(easiest[i - 1].value <= easiest[i].value)
  }
  // A 1-rated side visiting a 5-rated one: very easy for the hosts, very hard for the visitors.
  const sample = [1, 2, 3, 4, 5, 6, 7, 8]
    .flatMap((md) => matchdayData(md).matches)
    .find((x) => x.home.team.rating === 5 && x.away.team.rating === 1)
  assert.ok(sample)
  assert.equal(sample.home.band, 1)
  assert.equal(sample.away.band, 5)
})

test('matchday pages use the same default ratings as the app (odds-implied, else the seed)', async () => {
  const { DEFAULT_TEAMS } = await import('../scripts/build-md-pages.mjs')
  const { ODDS } = await import('../src/data/odds.js')
  const { INITIAL_TEAMS } = await import('../src/data/teams.js')
  const { impliedRatings } = await import('../src/utils/oddsView.js')
  const implied = impliedRatings(ODDS, Object.fromEntries(INITIAL_TEAMS.map((t) => [t.abbr, t.rating])))
  assert.equal(DEFAULT_TEAMS.length, 36)
  for (const t of DEFAULT_TEAMS) assert.equal(t.rating, implied[t.abbr]?.rating ?? INITIAL_TEAMS.find((x) => x.abbr === t.abbr).rating, t.abbr)
})
