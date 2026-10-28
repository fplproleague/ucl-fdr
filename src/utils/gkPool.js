import { slugifyName } from './parseGoalkeepersCsv.js'

// The goalkeepers GK Rotation works with, straight from the player sheet:
// most minutes first, so whoever is actually starting comes up before his
// back-up — in the full list and for a search like "Arsenal" alike. Then
// points, then name, so the order never jumps between loads.
export function rankGoalkeepers(players) {
  return players
    .filter((p) => p.position === 'GK')
    .sort((a, b) => b.minutes - a.minutes || b.points - a.points || a.name.localeCompare(b.name))
}

// One goalkeeper per club — the first-choice one, i.e. the first in
// rankGoalkeepers order. Rotation partners come from different clubs, so a
// back-up at the same club as the starter adds nothing, and a back-up
// elsewhere is rarely worth recommending.
export function firstChoices(ranked) {
  const seen = new Set()
  return ranked.filter((gk) => !seen.has(gk.team) && seen.add(gk.team))
}

// Finds a saved pick in today's list. Picks saved before GK Rotation moved
// to the player sheet are name slugs ("raya"), where the sheet now has ids
// ("p250…") and fuller names ("D. Raya"): those are matched on the end of
// the name, as long as exactly one goalkeeper fits.
export function findStoredGoalkeeper(stored, ranked) {
  if (!stored) return null
  const exact = ranked.find((gk) => gk.id === stored)
  if (exact) return exact
  const byName = ranked.filter((gk) => {
    const slug = slugifyName(gk.name)
    return slug === stored || slug.endsWith(`-${stored}`)
  })
  return byName.length === 1 ? byName[0] : null
}
