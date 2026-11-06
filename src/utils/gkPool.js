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

// Each club's expected starter in goal: the keeper who played its most
// recent UCL match (the one with the most minutes in it, if both did, as
// when one comes off injured). Only he is worth buying for a rotation: a
// back-up who covered a match or two still has minutes in the sheet, which
// is how two keepers from one club ended up in the recommendations.
//
// The last UCL match, not the last match in any competition, on purpose:
// some clubs play a different keeper in the league (Bayern: Neuer in the
// UCL, Urbig in the Bundesliga), and here only the UCL one scores. What it
// can't see is an injury since that match; the sheet has no injury news.
//
//   goalkeepers: from rankGoalkeepers (most UCL minutes first)
//   uclGames: { [playerId]: [{ md, min }, …] } (DOMESTIC_FORM.uclPlayers)
// Returns a Set of player ids, one per club. A club with no match data
// keeps its keeper with the most UCL minutes.
export function expectedStarters(goalkeepers, uclGames = {}) {
  const byClub = new Map()
  for (const gk of goalkeepers) {
    if (!byClub.has(gk.team)) byClub.set(gk.team, [])
    byClub.get(gk.team).push(gk)
  }
  const starters = new Set()
  for (const keepers of byClub.values()) {
    let best = null
    for (const gk of keepers) {
      for (const g of uclGames[gk.id] ?? []) {
        if (!(g.min > 0)) continue
        if (!best || g.md > best.md || (g.md === best.md && g.min > best.min)) best = { md: g.md, min: g.min, id: gk.id }
      }
    }
    starters.add(best ? best.id : keepers[0].id)
  }
  return starters
}
