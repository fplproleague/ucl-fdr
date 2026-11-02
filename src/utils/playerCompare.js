// The rows of the Players tab's side-by-side comparison: one stat per row,
// one value per player, and which player is best at it. Pure JS, so the
// tests can check what "best" means without rendering anything.
//
// Each player passed in is a scored row from the Players tab (score,
// valueScore, rawPpm, minutesShare, stats, form, dom, domestic …) plus
// `fixtureAvg`, the average difficulty of his fixtures in the range.
//
// A row can also say where its number comes from, match by match
// (`matches`): tapping it in the comparison lists them. That needs
// per-match data, which exists for the league matches (API-Football) and
// for UCL points per matchday; the sheet's other UCL stats are season
// totals only, so those rows have no breakdown.
import { domesticPoints } from './domesticForm.js'

// Totals turned into a rate per 90 only once there are 90 minutes to go
// on: one goal in a 20-minute cameo isn't 4.5 per 90.
export const per90 = (count, minutes) => (count != null && minutes >= 90 ? (count / minutes) * 90 : null)

const fixed = (digits) => (v) => v.toFixed(digits)
const pct = (v) => `${Math.round(v)}%`

// A clean sheet as UCL Fantasy counts one: 60+ minutes, nothing conceded.
export const isCleanSheet = (g) => g.min >= 60 && g.gc === 0
const keepsCleanSheets = (position) => position !== 'FWD'

// One league match in a breakdown: where, and what he did there.
function leagueMatch(g, value, hit) {
  return {
    key: `${g.d}-${g.opp}`,
    label: `${g.v === 'H' ? 'v' : '@'} ${g.opp}`,
    title: `${g.d} · ${g.opp} (${g.v === 'H' ? 'home' : 'away'})`,
    sub: g.min ? `${g.min}′` : 'didn’t play',
    value,
    hit,
  }
}
// One UCL match in a breakdown, by matchday.
function uclMatch(g, value, hit) {
  return {
    key: `md${g.md}`,
    label: `MD${g.md} ${g.v === 'H' ? 'v' : '@'} ${g.opp}`,
    title: `MD${g.md} · ${g.d} · ${g.opp} (${g.v === 'H' ? 'home' : 'away'})`,
    sub: g.min ? `${g.min}′` : 'didn’t play',
    value,
    hit,
  }
}
// Shots / key passes per 90 over saved games, when the file has them.
function gamesPer90(games, field) {
  if (!games?.some((g) => g[field] != null)) return null
  return per90(
    games.reduce((s, g) => s + (g[field] ?? 0), 0),
    games.reduce((s, g) => s + g.min, 0),
  )
}
const countOf = (games, field) => games.reduce((s, g) => s + (g[field] ?? 0), 0)
const goalsAndAssists = (g) => [g.g && `${g.g}G`, g.a && `${g.a}A`].filter(Boolean).join(' ') || '–'

// A breakdown over his saved UCL / league games: `cell(g)` → [value, hit].
const ucl = (cell) => (p) => (p.uclGames?.length ? p.uclGames.map((g) => uclMatch(g, ...cell(g))) : null)
const league = (cell) => (p) => (p.domestic?.length ? p.domestic.map((g) => leagueMatch(g, ...cell(g))) : null)

// Shots and key passes per 90, from saved games (the sheet doesn't have them).
function shotRows(group, gamesOf, breakdown) {
  return [
    ['sh', 'Shots per 90', 'shot'],
    ['kp', 'Key passes per 90', 'key pass'],
  ].map(([field, label, word]) => ({
    group,
    label,
    better: 'high',
    get: (p) => gamesPer90(gamesOf(p), field),
    format: fixed(1),
    sub: (p) => (gamesPer90(gamesOf(p), field) != null ? `${countOf(gamesOf(p), field)} total` : null),
    hint: label.startsWith('Key') ? 'Passes that led to a shot' : undefined,
    matches: (p) =>
      gamesPer90(gamesOf(p), field) != null
        ? breakdown((g) => [
            g[field] ? `${g[field]} ${word}${g[field] > 1 ? (word === 'key pass' ? 'es' : 's') : ''}` : '–',
            g[field] > 0,
          ])(p)
        : null,
  }))
}

// better: 'high' (most is best), 'low' (least is best) or null (shown, never judged).
export function compareRows(players, { domesticMatches = 5, scoreLabel = 'Score' } = {}) {
  const stat = (p, field) => p.stats?.[field]
  const rows = [
    { group: 'Overview', label: scoreLabel, better: 'high', get: (p) => p.score, format: (v) => String(Math.round(v)) },
    {
      group: 'Overview',
      label: 'Score per €m',
      better: 'high',
      get: (p) => p.valueScore,
      format: (v) => String(Math.round(v)),
    },
    { group: 'Overview', label: 'Price €m', better: 'low', get: (p) => p.price, format: fixed(1) },
    { group: 'Overview', label: 'Owned', better: null, get: (p) => p.ownership, format: pct },

    {
      group: 'Fixtures',
      label: 'Avg difficulty',
      better: 'low',
      get: (p) => p.fixtureAvg,
      format: fixed(1),
      hint: 'Average difficulty of his fixtures in the range, 1 = easiest',
    },

    {
      group: 'UCL',
      label: 'Points per match',
      better: 'high',
      get: (p) => p.rawPpm,
      format: fixed(1),
      matches: (p) => {
        if (!p.form?.length) return null
        const games = new Map((p.uclGames ?? []).map((g) => [g.md, g]))
        return p.form.map((f) => {
          const g = games.get(f.md)
          const value = `${f.points} pts`
          return g
            ? uclMatch(g, value, f.points > 2)
            : { key: `md${f.md}`, label: `MD${f.md}`, value, hit: f.points > 2 }
        })
      },
    },
    {
      group: 'UCL',
      label: 'Minutes',
      better: 'high',
      get: (p) => p.minutesShare * 100,
      format: pct,
      matches: ucl((g) => [g.min ? `${g.min}′` : '0′', g.min >= 60]),
    },
    {
      group: 'UCL',
      label: 'Goals per 90',
      better: 'high',
      get: (p) => per90(stat(p, 'goals'), p.minutes),
      format: fixed(2),
      sub: (p) => (stat(p, 'goals') != null ? `${stat(p, 'goals')} total` : null),
      matches: ucl((g) => [g.g ? `${g.g} goal${g.g > 1 ? 's' : ''}` : '–', g.g > 0]),
    },
    {
      group: 'UCL',
      label: 'Assists per 90',
      better: 'high',
      get: (p) => per90(stat(p, 'assists'), p.minutes),
      format: fixed(2),
      sub: (p) => (stat(p, 'assists') != null ? `${stat(p, 'assists')} total` : null),
      matches: ucl((g) => [g.a ? `${g.a} assist${g.a > 1 ? 's' : ''}` : '–', g.a > 0]),
    },
    ...shotRows('UCL', (p) => p.uclGames, ucl),
    {
      group: 'UCL',
      label: 'Balls recovered per 90',
      better: 'high',
      get: (p) => per90(stat(p, 'ballsRecovered'), p.minutes),
      format: fixed(2),
      sub: (p) => (stat(p, 'ballsRecovered') != null ? `${stat(p, 'ballsRecovered')} total` : null),
    },
    {
      group: 'UCL',
      label: 'Clean sheets',
      better: 'high',
      get: (p) => (keepsCleanSheets(p.position) ? stat(p, 'cleanSheets') : null),
      format: String,
      matches: (p) =>
        keepsCleanSheets(p.position)
          ? ucl((g) => [isCleanSheet(g) ? 'Clean sheet' : g.min >= 60 ? `${g.gc} conceded` : '–', isCleanSheet(g)])(p)
          : null,
    },
    {
      group: 'UCL',
      label: 'Saves per 90',
      better: 'high',
      get: (p) => (p.position === 'GK' ? per90(stat(p, 'saves'), p.minutes) : null),
      format: fixed(1),
      sub: (p) => (p.position === 'GK' && stat(p, 'saves') != null ? `${stat(p, 'saves')} total` : null),
      matches: (p) => (p.position === 'GK' ? ucl((g) => [`${g.sv ?? 0} saves`, (g.sv ?? 0) >= 3])(p) : null),
    },
    { group: 'UCL', label: 'POTM', better: 'high', get: (p) => stat(p, 'potm'), format: String },

    ...[
      {
        label: 'Points per match',
        get: (d) => d.points / d.matches,
        format: fixed(1),
        hint: 'UCL Fantasy rules, an estimate',
        match: (g, p) => {
          const pts = domesticPoints(g, p.position)
          return [`${pts} pts`, pts > 2]
        },
      },
      {
        label: 'Minutes',
        get: (d) => (d.minutes / (d.matches * 90)) * 100,
        format: pct,
        sub: (d) => `${d.minutes}/${d.matches * 90}`,
        match: (g) => [g.min ? `${g.min}′` : '0′', g.min >= 60],
      },
      {
        label: 'G+A per 90',
        get: (d) => d.ga90,
        format: fixed(2),
        match: (g) => [goalsAndAssists(g), g.g + g.a > 0],
      },
      {
        label: 'Goals per 90',
        get: (d) => per90(d.goals, d.minutes),
        format: fixed(2),
        sub: (d) => `${d.goals} total`,
        match: (g) => [g.g ? `${g.g} goal${g.g > 1 ? 's' : ''}` : '–', g.g > 0],
      },
      {
        label: 'Assists per 90',
        get: (d) => per90(d.assists, d.minutes),
        format: fixed(2),
        sub: (d) => `${d.assists} total`,
        match: (g) => [g.a ? `${g.a} assist${g.a > 1 ? 's' : ''}` : '–', g.a > 0],
      },
      {
        label: 'Clean sheets',
        position: keepsCleanSheets,
        get: (d, p) => p.domestic.filter(isCleanSheet).length,
        format: String,
        hint: '60+ minutes and nothing conceded',
        match: (g) => [isCleanSheet(g) ? 'Clean sheet' : g.min >= 60 ? `${g.gc} conceded` : '–', isCleanSheet(g)],
      },
    ].map(({ get, sub, match, position, ...row }) => {
      const has = (p) => p.dom && p.domestic?.length && (!position || position(p.position))
      return {
        ...row,
        group: `League · last ${domesticMatches}`,
        better: 'high',
        get: (p) => (has(p) ? get(p.dom, p) : null),
        sub: sub && ((p) => (has(p) ? sub(p.dom) : null)),
        matches: (p) => (has(p) ? p.domestic.map((g) => leagueMatch(g, ...match(g, p))) : null),
      }
    }),
    ...shotRows(`League · last ${domesticMatches}`, (p) => (p.dom ? p.domestic : null), league),
  ]

  return rows
    .map(({ get, format, sub, matches, ...row }) => {
      const values = players.map((p) => {
        const v = get(p)
        return v == null || (typeof v === 'number' && !Number.isFinite(v)) ? null : v
      })
      return {
        ...row,
        values,
        text: values.map((v) => (v == null ? '–' : format(v))),
        subs: players.map((p) => sub?.(p) ?? null),
        best: bestOf(values, row.better),
        // Bars only where more is better: a longer bar for a higher price
        // would read as "better".
        bars: row.better === 'high' ? barWidths(values) : null,
        breakdown: matches ? players.map((p) => matches(p)) : null,
      }
    })
    .filter((row) => row.values.some((v) => v != null))
    .map((row) => (row.breakdown?.some((b) => b?.length) ? row : { ...row, breakdown: null }))
}

// Indices of the best value (all of them when tied). Nothing is "best"
// with fewer than two values to compare, or when they're all the same.
export function bestOf(values, better) {
  if (!better) return new Set()
  const nums = values.map((v, i) => [v, i]).filter(([v]) => typeof v === 'number')
  if (nums.length < 2) return new Set()
  const target = better === 'high' ? Math.max(...nums.map(([v]) => v)) : Math.min(...nums.map(([v]) => v))
  const winners = nums.filter(([v]) => Math.abs(v - target) < 1e-9).map(([, i]) => i)
  return winners.length === nums.length ? new Set() : new Set(winners)
}

// Each value as a share (0–100) of the row's highest.
function barWidths(values) {
  const max = Math.max(0, ...values.filter((v) => typeof v === 'number'))
  return values.map((v) => (typeof v === 'number' && max > 0 ? Math.max(0, (v / max) * 100) : 0))
}

// How many judged rows each player is best in: the headline "who's better".
export function winCounts(rows, count) {
  const wins = Array(count).fill(0)
  for (const row of rows) for (const i of row.best) wins[i]++
  return wins
}
