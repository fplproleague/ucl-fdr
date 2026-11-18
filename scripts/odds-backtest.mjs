// How close the Odds tab's estimates came to the bookmakers: for every
// match in src/data/odds.js that kept `est` (what the tab estimated just
// before the odds came in, saved by scripts/build-odds.mjs), the gap to the
// first odds saved, per matchday. Changes nothing; run it after a matchday
// is priced to see whether a change to the estimator helped.
//
// Usage: node scripts/odds-backtest.mjs
import { ODDS } from '../src/data/odds.js'

const byMd = new Map()
for (const m of Object.values(ODDS.matches ?? {})) {
  if (!m.est || m.md == null) continue
  if (!byMd.has(m.md)) byMd.set(m.md, [])
  byMd.get(m.md).push(m)
}
if (!byMd.size) {
  console.log('Backtest: no match with a saved estimate yet (build-odds saves one the first time it prices a match)')
  process.exit(0)
}

const pts = (x) => `${(x * 100).toFixed(1)} pts`
for (const [md, ms] of [...byMd].sort(([a], [b]) => a - b)) {
  let cs = 0
  let csBias = 0
  let xg = 0
  let n = 0
  const gaps = []
  for (const m of ms) {
    for (const i of [0, 1]) {
      const d = m.est.cs[i] - m.cs[i]
      cs += Math.abs(d)
      csBias += d
      xg += Math.abs(m.est.xg[i] - m.xg[i])
      n++
      gaps.push({ d, label: `${i ? m.away : m.home} CS (${m.home}-${m.away}): estimate ${Math.round(m.est.cs[i] * 100)}%, odds ${Math.round(m.cs[i] * 100)}%` })
    }
  }
  console.log(
    `MD${md}: ${ms.length} matches — clean sheet off by ${pts(cs / n)} on average (bias ${csBias >= 0 ? '+' : ''}${pts(csBias / n)}), ` +
      `expected goals by ${(xg / n).toFixed(2)}`,
  )
  for (const g of gaps.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5)) console.log(`  ${g.label}`)
}
