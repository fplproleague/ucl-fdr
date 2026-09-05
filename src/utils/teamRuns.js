import { averageDifficulty } from './difficulty.js'

// The site has no existing "sub-run within one team's own schedule" concept
// — "Best Fixture Runs" (BestFixtureRuns.jsx) ranks teams by their average
// over one fixed, user-chosen matchday window, it doesn't search a single
// team's calendar for a stretch. For a one-team profile, a sliding window
// is the natural equivalent. 4 matchdays mirrors the "Next 4" planning
// horizon already used elsewhere (MdRangePicker's default preset, and
// defaultRange() in data/matchdays.js) rather than picking a new number.
export const RUN_LENGTH = 4

// Every possible RUN_LENGTH-matchday window's average difficulty for one
// team's fixtures, using the exact same averageDifficulty used everywhere
// else in the app — no separate FDR math. `fixtures` must be sorted by gw
// ascending with no gaps (true of every FIXTURES[team.abbr] entry).
export function findBestWorstRuns(fixtures, teamsByAbbr, venueAdjust, windowSize = RUN_LENGTH) {
  if (fixtures.length < windowSize) return { best: null, worst: null }

  const windows = []
  for (let start = 0; start + windowSize <= fixtures.length; start++) {
    const slice = fixtures.slice(start, start + windowSize)
    windows.push({
      fromMd: slice[0].gw,
      toMd: slice[slice.length - 1].gw,
      avg: averageDifficulty(slice, teamsByAbbr, venueAdjust),
    })
  }

  const best = windows.reduce((a, b) => (b.avg < a.avg ? b : a))
  const worst = windows.reduce((a, b) => (b.avg > a.avg ? b : a))
  return { best, worst }
}
