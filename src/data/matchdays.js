// Scheduled dates for the 2026/27 UEFA Champions League league phase.
// Source: UEFA competition calendar (matchday windows, not individual kick-offs).
// If UEFA shifts a window, edit the entry here — nothing else needs to change.
export const MATCHDAYS = [
  { md: 1, start: '2026-09-08', end: '2026-09-10', label: '8–10 Sep' },
  { md: 2, start: '2026-10-13', end: '2026-10-14', label: '13–14 Oct' },
  { md: 3, start: '2026-10-20', end: '2026-10-21', label: '20–21 Oct' },
  { md: 4, start: '2026-11-03', end: '2026-11-04', label: '3–4 Nov' },
  { md: 5, start: '2026-11-24', end: '2026-11-25', label: '24–25 Nov' },
  { md: 6, start: '2026-12-08', end: '2026-12-09', label: '8–9 Dec' },
  { md: 7, start: '2027-01-19', end: '2027-01-20', label: '19–20 Jan' },
  { md: 8, start: '2027-01-27', end: '2027-01-27', label: '27 Jan' },
]

export const MATCHDAY_LABEL = Object.fromEntries(MATCHDAYS.map((m) => [m.md, m.label]))

// The earliest matchday that hasn't finished yet — used to default the
// "next N matchdays" range. Falls back to the last matchday once the
// league phase is over, so the app never shows an empty range.
export function currentMatchday(today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  const upcoming = MATCHDAYS.find((m) => m.end >= iso)
  return upcoming ? upcoming.md : MATCHDAYS[MATCHDAYS.length - 1].md
}

// Default planning window: the next four matchdays. With two transfers per
// matchday (one rollover), planning much further than this isn't actionable.
export function defaultRange(total, today = new Date()) {
  const from = currentMatchday(today)
  return { from, to: Math.min(total, from + 3) }
}
