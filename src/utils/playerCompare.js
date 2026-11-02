// The rows of the Players tab's side-by-side comparison: one stat per row,
// one value per player, and which player is best at it. Pure JS, so the
// tests can check what "best" means without rendering anything.
//
// Each player passed in is a scored row from the Players tab (score,
// valueScore, rawPpm, minutesShare, stats, dom …) plus `fixtureAvg`, the
// average difficulty of his fixtures in the range.

// Totals turned into a rate per 90 only once there are 90 minutes to go
// on: one goal in a 20-minute cameo isn't 4.5 per 90.
export const per90 = (count, minutes) => (count != null && minutes >= 90 ? (count / minutes) * 90 : null)

const fixed = (digits) => (v) => v.toFixed(digits)
const pct = (v) => `${Math.round(v)}%`

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
      group: 'Overview',
      label: 'Fixture difficulty',
      better: 'low',
      get: (p) => p.fixtureAvg,
      format: fixed(1),
      hint: 'Average difficulty of his fixtures in the range, 1 = easiest',
    },

    { group: 'UCL', label: 'Points per match', better: 'high', get: (p) => p.rawPpm, format: fixed(1) },
    { group: 'UCL', label: 'Minutes', better: 'high', get: (p) => p.minutesShare * 100, format: pct },
    ...[
      ['goals', 'Goals per 90'],
      ['assists', 'Assists per 90'],
      ['ballsRecovered', 'Balls recovered per 90'],
    ].map(([field, label]) => ({
      group: 'UCL',
      label,
      better: 'high',
      get: (p) => per90(stat(p, field), p.minutes),
      format: fixed(2),
      sub: (p) => (stat(p, field) != null ? `${stat(p, field)} total` : null),
    })),
    {
      group: 'UCL',
      label: 'Clean sheets',
      better: 'high',
      get: (p) => (p.position === 'FWD' ? null : stat(p, 'cleanSheets')),
      format: String,
    },
    {
      group: 'UCL',
      label: 'Saves per 90',
      better: 'high',
      get: (p) => (p.position === 'GK' ? per90(stat(p, 'saves'), p.minutes) : null),
      format: fixed(1),
    },
    { group: 'UCL', label: 'POTM', better: 'high', get: (p) => stat(p, 'potm'), format: String },
    {
      group: 'UCL',
      label: 'Points per matchday',
      better: null,
      get: (p) => (p.form?.length ? p.form.map((f) => f.points).join(' · ') : null),
      format: String,
    },

    ...[
      {
        label: 'Points per match',
        get: (d) => d.points / d.matches,
        format: fixed(1),
        hint: 'UCL Fantasy rules, an estimate',
      },
      {
        label: 'Minutes',
        get: (d) => (d.minutes / (d.matches * 90)) * 100,
        format: pct,
        sub: (d) => `${d.minutes}/${d.matches * 90}`,
      },
      { label: 'G+A per 90', get: (d) => d.ga90, format: fixed(2) },
      {
        label: 'Goals per 90',
        get: (d) => per90(d.goals, d.minutes),
        format: fixed(2),
        sub: (d) => `${d.goals} total`,
      },
      {
        label: 'Assists per 90',
        get: (d) => per90(d.assists, d.minutes),
        format: fixed(2),
        sub: (d) => `${d.assists} total`,
      },
    ].map(({ get, sub, ...row }) => ({
      ...row,
      group: `League · last ${domesticMatches}`,
      better: 'high',
      get: (p) => (p.dom ? get(p.dom) : null),
      sub: sub && ((p) => (p.dom ? sub(p.dom) : null)),
    })),
  ]

  return rows
    .map(({ get, format, sub, ...row }) => {
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
      }
    })
    .filter((row) => row.values.some((v) => v != null))
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
