// Betting odds (API-Football's /odds) → per match: each team's expected
// goals, clean-sheet chance and win/draw/loss chances, and per player his
// prices, turned into expected goals and assists if he plays. Used by scripts/build-odds.mjs; pure, so it
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

// Bookmakers price a draw a little above what two independent Poisson means
// give (low scores are correlated, which Poisson misses): on MD4's 18 matches
// by 1.65 points on average. Fitting the raw 1X2 to Poisson then pushes the
// total down to make more draws: without over/under that came out 0.45
// goals short a match and the clean sheets ~5 points too high. So the draw
// is fitted with this excess taken off (the win and loss scaled up to match).
export const DRAW_EXCESS = 0.0165
// Bookmakers' clean sheets sit about 10% above Poisson's chance of zero
// (median over MD4's priced clean-sheet markets): used when a match has no
// clean-sheet or team-total market to price it directly.
export const CS_LIFT = 1.1
export const MAX_CS = 0.9

// Expected goals for home and away from the match odds alone (when there
// are no team-total markets): the pair of Poisson means whose home/draw/
// away (draw less DRAW_EXCESS) and over/under 2.5 chances sit closest to
// the bookmakers'. Means up to 6, so a 90% favourite isn't cut off.
const FIT_GRID = Array.from({ length: 296 }, (_, i) => Math.round((0.1 + i * 0.02) * 100) / 100)
let fitPmfs = null
export function fitFromResult([pHome, pDraw, pAway], pOver25, drawExcess = DRAW_EXCESS) {
  const draw0 = Math.max(0.01, pDraw - drawExcess)
  const scale = (1 - draw0) / (pHome + pAway)
  const [tHome, tDraw, tAway] = [pHome * scale, draw0, pAway * scale]
  fitPmfs ??= FIT_GRID.map((lambda) => Array.from({ length: 16 }, (_, k) => poissonPmf(lambda, k)))
  let best = null
  for (let x = 0; x < FIT_GRID.length; x++) {
    const ph = fitPmfs[x]
    for (let y = 0; y < FIT_GRID.length; y++) {
      const pa = fitPmfs[y]
      let win = 0
      let draw = 0
      for (let i = 0; i <= 15; i++) {
        draw += ph[i] * pa[i]
        for (let j = 0; j < i; j++) win += ph[i] * pa[j]
      }
      const loss = 1 - win - draw
      let err = (win - tHome) ** 2 + (draw - tDraw) ** 2 + (loss - tAway) ** 2
      if (pOver25 != null) err += (poissonOver(FIT_GRID[x] + FIT_GRID[y], 2.5) - pOver25) ** 2
      if (!best || err < best.err) best = { err, home: FIT_GRID[x], away: FIT_GRID[y] }
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
  // Poisson's chance of zero, lifted the way bookmakers lift it (CS_LIFT).
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
    return median(direct) ?? Math.min(MAX_CS, Math.exp(-oppXg) * CS_LIFT)
  })

  return {
    xg: xg.map((x) => round(x)),
    cs: cs.map((x) => round(x)),
    win: win.every((x) => x != null) ? win.map((x) => round(x)) : null,
    bookmakers: books.length,
    source,
  }
}

// A player's prices for one match → his expected goals and assists IF HE
// PLAYS. Anytime-scorer bets are void when a player doesn't take part, so
// the prices are conditional on playing, and the bookmaker lists the whole
// squad: the prices can't be scaled to add up to the team's goals (the
// bench would eat a starter's share). Instead each price loses a typical
// margin (PLAYER_MARGIN), and the chance left is turned into expected goals
// (Poisson: xg = −ln(1 − P)); "to score or assist" gives the same for a
// goal or an assist, and the difference is his expected assists.
//   odds: [anytime scorer, score or assist] (decimal; the second may be null)
export const PLAYER_MARGIN = 1.15
export function playerRates([scorer, scoreOrAssist] = []) {
  const rate = (odd) => {
    const p = price(odd) ? 1 / price(odd) / PLAYER_MARGIN : null
    return p == null ? null : -Math.log(1 - Math.min(p, 0.99))
  }
  const g = rate(scorer)
  const ga = rate(scoreOrAssist)
  return {
    xg: round(g),
    xa: g == null || ga == null ? null : round(Math.max(0, ga - g)),
  }
}

// Player markets → { name: { side: 'home'|'away'|null, odds: [anytime
// scorer, score or assist] } } for one fixture, from the bookmaker that
// prices the most players. The raw prices are what gets saved, so a change
// to playerRates never needs the (by then deleted) odds again.
export function playerOdds(entry) {
  const count = (b) => betOf(b, BET.anytimeScorer)?.values?.length ?? 0
  const book = (entry.bookmakers ?? []).filter(count).sort((x, y) => count(y) - count(x))[0]
  if (!book) return {}

  const isPlayer = (name) => name && !/no goal ?scorer/i.test(name)
  const sideOf = new Map()
  for (const [id, side] of [
    [BET.homeAnytimeScorer, 'home'],
    [BET.awayAnytimeScorer, 'away'],
  ])
    for (const v of betOf(book, id)?.values ?? []) if (isPlayer(v.value)) sideOf.set(v.value, side)
  const assistOdd = new Map((betOf(book, BET.scoreOrAssist)?.values ?? []).map((v) => [v.value, price(v.odd)]))

  const out = {}
  for (const v of betOf(book, BET.anytimeScorer).values ?? []) {
    if (!isPlayer(v.value) || !price(v.odd)) continue
    out[v.value] = { side: sideOf.get(v.value) ?? null, odds: [price(v.odd), assistOdd.get(v.value) ?? null] }
  }
  return out
}

// One event from The Odds API (the second source, for matches API-Football
// hasn't priced yet: it lists UCL 1X2 and totals about three weeks ahead) →
// an entry in API-Football's shape, so teamNumbers reads it unchanged:
// h2h becomes Match Winner, totals becomes Goals Over/Under.
//   event: { home_team, away_team, bookmakers: [{ title, last_update,
//            markets: [{ key: 'h2h'|'totals', outcomes: [{ name, price, point }] }] }] }
export function fromTheOddsApi(event) {
  const bookmakers = (event?.bookmakers ?? []).map((b) => {
    const bets = []
    for (const market of b.markets ?? []) {
      if (market.key === 'h2h') {
        const odd = (name) => market.outcomes?.find((o) => o.name === name)?.price
        bets.push({
          id: BET.matchWinner,
          values: [
            { value: 'Home', odd: odd(event.home_team) },
            { value: 'Draw', odd: odd('Draw') },
            { value: 'Away', odd: odd(event.away_team) },
          ],
        })
      } else if (market.key === 'totals') {
        bets.push({
          id: BET.goalsOverUnder,
          values: (market.outcomes ?? [])
            .filter((o) => /^(over|under)$/i.test(o.name) && o.point != null)
            .map((o) => ({ value: `${o.name[0].toUpperCase()}${o.name.slice(1).toLowerCase()} ${o.point}`, odd: o.price })),
        })
      }
    }
    return { name: b.title, bets }
  })
  const update = (event?.bookmakers ?? []).map((b) => b.last_update).filter(Boolean).sort().pop()
  return { bookmakers, update }
}
