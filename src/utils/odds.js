// Betting odds (API-Football's /odds) → per match: each team's expected
// goals, clean-sheet chance and win/draw/loss chances, and per player his
// expected goals and assists. Used by scripts/build-odds.mjs; pure, so it
// is tested in tests/odds.test.js.
//
// Bookmaker prices carry a margin (the implied chances add up to more than
// 100%): every market is de-vigged by scaling its chances back to 100%, and
// the median over bookmakers is used, so one odd price can't move a value.

// API-Football bet ids (stable; the names can change).
export const BET = {
  matchWinner: 1,
  goalsOverUnder: 5,
  totalHome: 16, // goals the home team scores, Over/Under lines
  totalAway: 17,
  cleanSheetHome: 27, // Yes/No
  cleanSheetAway: 28,
  anytimeScorer: 92,
  homeAnytimeScorer: 231,
  awayAnytimeScorer: 218,
  scoreOrAssist: 257,
}

// Share of a team's goals that are own goals: no player scores those, so
// the players' expected goals add up to a little less than the team's.
const OWN_GOAL_SHARE = 0.03

export const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const price = (odd) => {
  const n = Number(odd)
  return n > 1 ? n : null
}

// Implied chances of a set of outcomes that together cover everything
// (home/draw/away, over/under, yes/no), scaled to add up to 1.
export function devig(odds) {
  const inv = odds.map((o) => (price(o) ? 1 / price(o) : null))
  if (inv.some((x) => x == null)) return null
  const sum = inv.reduce((a, b) => a + b, 0)
  return inv.map((x) => x / sum)
}

// P(X > line) for a Poisson count with mean lambda; line is x.5.
export function poissonOver(lambda, line) {
  let term = Math.exp(-lambda)
  let cdf = term
  for (let k = 1; k <= Math.floor(line); k++) {
    term *= lambda / k
    cdf += term
  }
  return 1 - cdf
}

// The mean goals that give P(goals > line) = pOver.
export function lambdaFromOver(line, pOver) {
  let lo = 0.001
  let hi = 10
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (poissonOver(mid, line) < pOver) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const betOf = (bookmaker, id) => bookmaker.bets?.find((b) => b.id === id)
const valueOf = (bet, name) => bet?.values?.find((v) => String(v.value).toLowerCase() === name.toLowerCase())?.odd

// "Over 1.5" / "Under 1.5" pairs of one bet, de-vigged: [{ line, pOver }].
export function overUnderLines(bet) {
  const lines = []
  for (const v of bet?.values ?? []) {
    const m = String(v.value).match(/^over\s+(\d+(?:\.\d+)?)$/i)
    if (!m) continue
    const line = Number(m[1])
    if (line % 1 !== 0.5) continue // whole and quarter lines refund on a push: not a plain chance
    const p = devig([v.odd, valueOf(bet, `Under ${m[1]}`)])
    if (p) lines.push({ line, pOver: p[0] })
  }
  return lines
}

// One bookmaker's expected goals from one Over/Under bet: every line
// converted to a Poisson mean, averaged with the most weight on lines near
// 50/50 (the far-out lines carry the most margin and say the least).
export function lambdaFromLines(lines) {
  let sum = 0
  let weights = 0
  for (const { line, pOver } of lines) {
    if (pOver < 0.03 || pOver > 0.97) continue
    const w = pOver * (1 - pOver)
    sum += w * lambdaFromOver(line, pOver)
    weights += w
  }
  return weights ? sum / weights : null
}

// Expected goals for home and away from the match odds alone (when there
// are no team-total markets): the pair of Poisson means whose home/draw/
// away and over/under 2.5 chances sit closest to the bookmakers'.
export function fitFromResult([pHome, pDraw, pAway], pOver25) {
  let best = null
  const pmfs = (lambda) => Array.from({ length: 11 }, (_, k) => poissonPmf(lambda, k))
  for (let h = 0.1; h <= 4.5; h += 0.02) {
    const ph = pmfs(h)
    for (let a = 0.1; a <= 4.5; a += 0.02) {
      const pa = pmfs(a)
      let win = 0
      let draw = 0
      for (let i = 0; i <= 10; i++)
        for (let j = 0; j <= 10; j++) {
          if (i > j) win += ph[i] * pa[j]
          else if (i === j) draw += ph[i] * pa[j]
        }
      const loss = 1 - win - draw
      let err = (win - pHome) ** 2 + (draw - pDraw) ** 2 + (loss - pAway) ** 2
      if (pOver25 != null) err += (poissonOver(h + a, 2.5) - pOver25) ** 2
      if (!best || err < best.err) best = { err, home: h, away: a }
    }
  }
  return [best.home, best.away]
}

function poissonPmf(lambda, k) {
  let p = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) p *= lambda / i
  return p
}

const round = (x, digits = 2) => (x == null ? null : Math.round(x * 10 ** digits) / 10 ** digits)

// One fixture's odds entry → the team-level numbers:
//   xg:   [home, away] expected goals
//   cs:   [home, away] chance of keeping a clean sheet
//   win:  [home, draw, away] chances
//   bookmakers: how many bookmakers priced the match
//   source: 'totals' (team-total markets) or 'result' (fitted from 1X2 + O/U)
export function teamNumbers(entry) {
  const books = entry.bookmakers ?? []
  const result = books.map((b) => {
    const bet = betOf(b, BET.matchWinner)
    return devig([valueOf(bet, 'Home'), valueOf(bet, 'Draw'), valueOf(bet, 'Away')])
  })
  const win = [0, 1, 2].map((i) => median(result.filter(Boolean).map((p) => p[i])))

  let xg = [BET.totalHome, BET.totalAway].map((id) =>
    median(books.map((b) => lambdaFromLines(overUnderLines(betOf(b, id))))),
  )
  let source = 'totals'
  if (xg.some((x) => x == null)) {
    if (win.some((x) => x == null)) return null
    const over25 = median(
      books.map((b) => overUnderLines(betOf(b, BET.goalsOverUnder)).find((l) => l.line === 2.5)?.pOver),
    )
    xg = fitFromResult(win, over25)
    source = 'result'
  }

  // A clean sheet is the other side scoring nothing: priced directly by the
  // Clean Sheet markets and by the other side's Under 0.5; without either,
  // Poisson's chance of zero.
  const cs = [
    [BET.cleanSheetHome, BET.totalAway, xg[1]],
    [BET.cleanSheetAway, BET.totalHome, xg[0]],
  ].map(([csId, oppTotalId, oppXg]) => {
    const direct = books.flatMap((b) => {
      const out = []
      const yesNo = devig([valueOf(betOf(b, csId), 'Yes'), valueOf(betOf(b, csId), 'No')])
      if (yesNo) out.push(yesNo[0])
      const zero = overUnderLines(betOf(b, oppTotalId)).find((l) => l.line === 0.5)
      if (zero) out.push(1 - zero.pOver)
      return out
    })
    return median(direct) ?? Math.exp(-oppXg)
  })

  return {
    xg: xg.map((x) => round(x)),
    cs: cs.map((x) => round(x)),
    win: win.every((x) => x != null) ? win.map((x) => round(x)) : null,
    bookmakers: books.length,
    source,
  }
}

// Player markets → { name: { side: 'home'|'away'|null, xg, xa } } for one
// fixture, from the bookmaker that prices the most players. Anytime-scorer
// odds give his chance of scoring, turned into expected goals (Poisson:
// xg = −ln(1 − P)); "to score or assist" gives the same for a goal or an
// assist, and the difference is his expected assists. These markets have a
// big margin and can't be de-vigged outcome by outcome (several players
// can score), so each side's players are scaled down together until their
// expected goals add up to the team's (less own goals) — never up, since
// the list can miss a few unlikely scorers.
export function playerNumbers(entry, teamXg) {
  const books = (entry.bookmakers ?? []).filter((b) => betOf(b, BET.anytimeScorer))
  const book = books.sort((x, y) => (betOf(y, BET.anytimeScorer).values?.length ?? 0) - (betOf(x, BET.anytimeScorer).values?.length ?? 0))[0]
  if (!book) return {}

  const rate = (odd) => {
    const p = price(odd) ? 1 / price(odd) : null
    return p == null || p >= 1 ? null : -Math.log(1 - p)
  }
  const isPlayer = (name) => name && !/no goal ?scorer/i.test(name)
  const sideOf = new Map()
  for (const [id, side] of [
    [BET.homeAnytimeScorer, 'home'],
    [BET.awayAnytimeScorer, 'away'],
  ])
    for (const v of betOf(book, id)?.values ?? []) if (isPlayer(v.value)) sideOf.set(v.value, side)

  const players = {}
  for (const v of betOf(book, BET.anytimeScorer).values ?? []) {
    if (!isPlayer(v.value)) continue
    const g = rate(v.odd)
    if (g == null) continue
    players[v.value] = { side: sideOf.get(v.value) ?? null, g, ga: null }
  }
  for (const v of betOf(book, BET.scoreOrAssist)?.values ?? []) if (players[v.value]) players[v.value].ga = rate(v.odd)

  const out = {}
  for (const [side, i] of [
    ['home', 0],
    ['away', 1],
  ]) {
    const mine = Object.entries(players).filter(([, p]) => p.side === side)
    const total = mine.reduce((s, [, p]) => s + p.g, 0)
    const scale = teamXg?.[i] != null && total > 0 ? Math.min(1, ((1 - OWN_GOAL_SHARE) * teamXg[i]) / total) : 1
    for (const [name, p] of mine)
      out[name] = {
        side,
        xg: round(p.g * scale),
        xa: p.ga == null ? null : round(Math.max(0, p.ga - p.g) * scale),
      }
  }
  for (const [name, p] of Object.entries(players))
    if (!p.side) out[name] = { side: null, xg: round(p.g), xa: p.ga == null ? null : round(Math.max(0, p.ga - p.g)) }
  return out
}
