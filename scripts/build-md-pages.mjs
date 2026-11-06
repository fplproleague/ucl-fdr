// Static, crawlable matchday pages: dist/md/<n>/index.html for MD1–MD8.
//
// The app keeps every view in the URL hash, which search engines ignore, so
// "ucl md5 fixtures" could only ever land on the home page. These are plain
// HTML (no React, no JS) built from the same fixture data and difficulty
// helpers the app uses, with the app's DEFAULT ratings (what the bookmakers'
// odds say, as on a first visit), and each one links into the full fixture
// ticker for that matchday.
//
// Runs from the Vite build (closeBundle in vite.config.js). By hand:
//   node scripts/build-md-pages.mjs [outDir]     (default: dist)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { INITIAL_TEAMS, RATING_COLORS } from '../src/data/teams.js'
import { ODDS } from '../src/data/odds.js'
import { impliedRatings } from '../src/utils/oddsView.js'
import { MATCHDAYS } from '../src/data/matchdays.js'
import { matchesForMatchday } from '../src/utils/matches.js'
import { DAY_LABEL, DAY_ORDER } from '../src/utils/matchdaySplit.js'
import { effectiveDifficulty, difficultyBand, ratingColor } from '../src/utils/difficulty.js'
import { SITE_URL, matchdayDates, matchdayPath, upcomingMatchday } from './seo.mjs'

// The ratings a first-time visitor sees: the odds-implied rating, worked out
// exactly as the virtual:odds-ratings module in vite.config.js does, and the
// seed rating from teams.js for a club the odds can't place yet.
const IMPLIED = impliedRatings(ODDS, Object.fromEntries(INITIAL_TEAMS.map((t) => [t.abbr, t.rating])))
export const DEFAULT_TEAMS = INITIAL_TEAMS.map((t) => ({ ...t, rating: IMPLIED[t.abbr]?.rating ?? t.rating }))
const TEAMS_BY_ABBR = Object.fromEntries(DEFAULT_TEAMS.map((t) => [t.abbr, t]))
const WEEKDAY = { TUE: 2, WED: 3, THU: 4 }

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// One side of a fixture, rated exactly as the app rates it with its
// defaults: the opponent's 1–5 rating, half a step easier at home and half a
// step harder away.
function side(team, opp, venue) {
  const value = effectiveDifficulty(opp.rating, venue, true, opp.awayDifficulty ?? 0)
  const band = difficultyBand(value)
  return { team, opp, venue, value, band }
}

// "Tue 24 Nov": the date of that weekday inside the matchday's window.
function dayDate(m, day) {
  const start = new Date(`${m.start}T00:00:00Z`)
  for (let i = 0; i < 4; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    if (d.getUTCDay() === WEEKDAY[day])
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  }
  return null
}

export function matchdayData(md) {
  const m = MATCHDAYS.find((x) => x.md === md)
  const matches = matchesForMatchday(md, TEAMS_BY_ABBR).map(({ home, away, day }) => ({
    day,
    home: side(home, away, 'H'),
    away: side(away, home, 'A'),
  }))
  matches.sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.home.team.name.localeCompare(b.home.team.name),
  )
  // Easiest first; at equal difficulty a home tie ahead of an away one, then
  // the weaker opponent, then alphabetical so the order never looks random.
  const easiest = matches
    .flatMap((x) => [x.home, x.away])
    .sort(
      (a, b) =>
        a.value - b.value ||
        (a.venue === b.venue ? 0 : a.venue === 'H' ? -1 : 1) ||
        a.opp.rating - b.opp.rating ||
        a.team.name.localeCompare(b.team.name),
    )
    .slice(0, 5)
  return { m, matches, easiest }
}

const chip = (band) => {
  const c = ratingColor(band)
  return `<span class="d" style="background:${c.bg};color:${c.text}" title="${esc(c.label)}"><span class="sr">difficulty </span>${band}</span>`
}

export function pageTitle(m) {
  return `UCL MD${m.md} Fixtures & Fixture Difficulty (${matchdayDates(m)})`
}

export function renderMatchdayPage(md, { today = new Date() } = {}) {
  const { m, matches, easiest } = matchdayData(md)
  const title = pageTitle(m)
  const canonical = `${SITE_URL}${matchdayPath(md)}`
  const dates = matchdayDates(m)
  const tickerHref = `/#/table?from=${md}&to=${md}`
  const description = `All 18 Champions League MD${md} fixtures (${dates}) with the fixture difficulty for both sides and the five easiest fixtures of the matchday. Free UCL Fantasy fixture ticker.`
  const upcoming = upcomingMatchday(today)
  const played = upcoming == null || upcoming.md > md
  const prev = MATCHDAYS.find((x) => x.md === md - 1)
  const next = MATCHDAYS.find((x) => x.md === md + 1)

  const groups = DAY_ORDER.map((day) => ({ day, matches: matches.filter((x) => x.day === day) })).filter(
    (g) => g.matches.length,
  )
  const matchList = groups
    .map((g) => {
      const date = dayDate(m, g.day)
      const rows = g.matches
        .map(
          (x) =>
            `<li class="match">${chip(x.home.band)}<span class="h">${esc(x.home.team.name)}</span><span class="v">–</span><span class="a">${esc(x.away.team.name)}</span>${chip(x.away.band)}</li>`,
        )
        .join('\n          ')
      return `<section>
        <h3>${DAY_LABEL[g.day]}${date ? ` ${date}` : ''} <span class="muted">(${g.day})</span></h3>
        <ul class="matches">
          ${rows}
        </ul>
      </section>`
    })
    .join('\n      ')

  const easiestList = easiest
    .map(
      (s) =>
        `<li>${chip(s.band)}<span><strong>${esc(s.team.name)}</strong> v ${esc(s.opp.name)} (${s.venue === 'H' ? 'home' : 'away'}) — ${esc(RATING_COLORS[s.band].label)}</span></li>`,
    )
    .join('\n        ')

  const legend = [1, 2, 3, 4, 5].map((b) => `<li>${chip(b)} ${esc(RATING_COLORS[b].label)}</li>`).join('')
  const mdLinks = MATCHDAYS.map((x) =>
    x.md === md ? `<span aria-current="page">MD${x.md}</span>` : `<a href="${matchdayPath(x.md)}">MD${x.md}</a>`,
  ).join(' · ')

  const status = played
    ? `<p class="note">MD${md} has been played. The fixture ticker only shows matchdays still to come${upcoming ? `, so it opens on MD${upcoming.md}` : ''}.</p>`
    : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#040818" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="UCL FDR" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${SITE_URL}/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="UCL FDR fixture difficulty grid for the Champions League league phase" />
    <meta property="og:locale" content="en_GB" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@fpl_proleague" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.jpg" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #040818; color: #e6e9ff; font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
      a { color: #7f95ff; }
      .wrap { max-width: 44rem; margin: 0 auto; padding: 1rem 1rem 2.5rem; }
      .top { display: flex; align-items: center; gap: .75rem; font-size: .875rem; margin-bottom: 1.25rem; }
      .top a { color: #e6e9ff; font-weight: 800; text-decoration: none; }
      .top img { width: 32px; height: 32px; border-radius: 8px; }
      h1 { font-size: 1.5rem; line-height: 1.2; margin: 0 0 .5rem; }
      h2 { font-size: 1.125rem; margin: 1.75rem 0 .5rem; }
      h3 { font-size: .9375rem; margin: 1.25rem 0 .5rem; }
      p { margin: .5rem 0; }
      .muted, .lead { color: #8f92b8; }
      .lead { font-size: .9375rem; }
      .note { font-size: .875rem; color: #c8ccef; border-left: 3px solid #D7B45A; padding-left: .75rem; }
      .cta { display: inline-block; margin: .75rem 0 .25rem; padding: .75rem 1.25rem; border-radius: 8px; background: #fff; color: #0C1330; font-weight: 700; text-decoration: none; }
      .cta:hover, .cta:focus-visible { background: #e6e9ff; }
      ul, ol { list-style: none; margin: 0; padding: 0; }
      .matches { border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: #0C1330; overflow: hidden; }
      .match { display: grid; grid-template-columns: 1.75rem 1fr auto 1fr 1.75rem; align-items: center; gap: .5rem; padding: .5rem .75rem; }
      .match + .match { border-top: 1px solid rgba(255,255,255,.07); }
      .h { text-align: right; }
      .h, .a { font-weight: 600; overflow-wrap: anywhere; }
      .v { color: #8f92b8; }
      .d { display: inline-flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem; border-radius: 4px; font-weight: 800; font-size: .875rem; flex: none; }
      .easiest li, .legend li { display: flex; align-items: center; gap: .625rem; padding: .3rem 0; }
      .legend { display: flex; flex-wrap: wrap; gap: .25rem 1rem; font-size: .875rem; color: #c8ccef; }
      .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      nav.pager { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2rem; font-weight: 600; }
      .all { margin-top: 1rem; font-size: .875rem; color: #8f92b8; }
      .all [aria-current] { color: #e6e9ff; font-weight: 700; }
      footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,.1); font-size: .75rem; color: #8f92b8; }
      @media (min-width: 640px) { h1 { font-size: 2rem; } .wrap { padding-top: 1.5rem; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="top"><img src="/favicon.svg" alt="" width="32" height="32" /><a href="/">UCL FDR</a><span class="muted">Fixture ticker &amp; fixture difficulty</span></div>
      <main>
        <h1>Champions League MD${md} fixtures &amp; difficulty</h1>
        <p class="lead">${esc(dates)} · all 18 matches. Difficulty is the opponent's 1–5 strength rating, eased half a step at home and hardened half a step away. Ratings are the site's defaults, taken from the bookmakers' odds; in the fixture ticker you can set your own.</p>
        ${status}
        <a class="cta" href="${tickerHref}">Open the full fixture ticker</a>
        <ul class="legend" aria-label="Difficulty colours">${legend}</ul>

        <h2>Easiest fixtures this matchday</h2>
        <ol class="easiest">
        ${easiestList}
        </ol>

        <h2>All MD${md} fixtures</h2>
        <p class="muted">Each side's difficulty is shown next to its name: home team left, away team right.</p>
      ${matchList}

        <nav class="pager" aria-label="Matchdays">
          <span>${prev ? `<a href="${matchdayPath(prev.md)}">← MD${prev.md} fixtures</a>` : ''}</span>
          <span>${next ? `<a href="${matchdayPath(next.md)}">MD${next.md} fixtures →</a>` : ''}</span>
        </nav>
        <p class="all">Matchday pages: ${mdLinks}</p>
        <p class="all"><a href="/">← Back to UCL FDR</a>: fixture ticker for every matchday, best fixture runs, compare teams side by side, and ratings you can change.</p>
      </main>
      <footer>
        <p>Made by <a href="https://x.com/fpl_proleague">@fpl_proleague</a>. Not affiliated with UEFA.</p>
      </footer>
    </div>
  </body>
</html>
`
}

export function matchdayPages(opts) {
  return MATCHDAYS.map((m) => {
    const html = renderMatchdayPage(m.md, opts)
    return { md: m.md, path: matchdayPath(m.md), html }
  })
}

export function writeMatchdayPages(outDir, opts) {
  const pages = matchdayPages(opts)
  for (const p of pages) {
    const dir = join(outDir, 'md', String(p.md))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), p.html)
  }
  return pages
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const outDir = resolve(process.argv[2] ?? 'dist')
  const pages = writeMatchdayPages(outDir)
  console.log(`wrote ${pages.length} matchday pages to ${outDir}/md/`)
}
