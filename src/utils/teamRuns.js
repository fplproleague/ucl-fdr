import { averageDifficulty } from './difficulty.js'

// The site has no existing "sub-run within one team's own schedule" concept
// — "Best Fixture Runs" (BestFixtureRuns.jsx) ranks teams by their average
// over one fixed, user-chosen matchday window, it doesn't search a single
// team's calendar for a stretch. For a one-team profile, a sliding window
// is the natural equivalent. 4 matchdays mirrors the "Next 4" planning
// horizon already used elsewhere (MdRangePicker's default preset, and
// defaultRange() in data/matchdays.js) rather than picking a new number.
export const RUN_LENGTH = 4

// Every possible run of consecutive matchdays in one team's fixtures, with
// its average difficulty from the exact same averageDifficulty used
// everywhere else in the app — no separate FDR math. `fixtures` must be
// sorted by gw ascending with no gaps (true of every FIXTURES[team.abbr]
// entry).
//
// A run is RUN_LENGTH matchdays, but always shorter than what's left: with
// four matchdays to go, a four-matchday run is the whole lot, the only one
// there is, and "best run MD5–MD8 avg 2.38" beside "worst run MD5–MD8 avg
// 2.38" read as a broken calculation. So late in the league phase the
// runs shrink (three of the last four, then two of three…), which always
// leaves at least two to choose from. If the best and the worst still come
// out level, there is nothing to tell apart and both are null: the panel
// shows neither rather than two identical cards.
//   → { best, worst, length } — best/worst: { fromMd, toMd, avg } or null
export function findBestWorstRuns(fixtures, teamsByAbbr, venueAdjust, windowSize = RUN_LENGTH) {
  const length = Math.min(windowSize, fixtures.length - 1)
  if (length < 1) return { best: null, worst: null, length: 0 }

  const windows = []
  for (let start = 0; start + length <= fixtures.length; start++) {
    const slice = fixtures.slice(start, start + length)
    windows.push({
      fromMd: slice[0].gw,
      toMd: slice[slice.length - 1].gw,
      avg: averageDifficulty(slice, teamsByAbbr, venueAdjust),
    })
  }

  const best = windows.reduce((a, b) => (b.avg < a.avg ? b : a))
  const worst = windows.reduce((a, b) => (b.avg > a.avg ? b : a))
  if (best.avg === worst.avg) return { best: null, worst: null, length }
  return { best, worst, length }
}
