// Player availability (injured, doubtful, suspended, not in the UCL squad),
// as UCL Fantasy flags it. scripts/build-availability.mjs turns the game's
// player feed into src/data/availability.js with availabilityFromFeed(); the
// UI asks availabilityOf() for one player and shows a small dot beside the
// name when there is something to say.
import { AVAILABILITY } from '../data/availability.js'

// One letter per status, kept short because the data file holds one per
// flagged player:
//   I  injured                      (feed pStatus "I")
//   U  doubtful, unlikely to start  (pStatus "D" + "Unlikely to start next game")
//   D  doubtful                     (pStatus "D")
//   S  suspended                    (pStatus "S")
//   N  not in the UCL squad         (pStatus "NIS")
// A fit player has no entry. Players the feed calls "unlikely to start"
// without a status are rotation calls, not availability, so they get none.
export const STATUSES = {
  I: { label: 'Injured', tone: 'out' },
  U: { label: 'Doubtful, unlikely to start', tone: 'doubt' },
  D: { label: 'Doubtful', tone: 'doubt' },
  S: { label: 'Suspended', tone: 'out' },
  N: { label: 'Not in UCL squad', tone: 'none' },
}

// The feed's playerList → { p<id>: code }, keyed like the player sheet's ids
// (parsePlayersCsv.js prefixes the UEFA id with "p").
export function availabilityFromFeed(playerList) {
  const out = {}
  for (const p of playerList ?? []) {
    if (!p?.id) continue
    const status = String(p.pStatus ?? '').trim().toUpperCase()
    let code = null
    if (status === 'I') code = 'I'
    else if (status === 'D') code = /unlikely/i.test(p.trained ?? '') ? 'U' : 'D'
    else if (status === 'S') code = 'S'
    else if (status === 'NIS') code = 'N'
    if (code) out[`p${String(p.id).trim()}`] = code
  }
  return out
}

// The feed's matchday for a list (the highest mdId on it). The feed is served
// by several servers that are not always in step, so the script keeps the
// newest of a few answers.
export function feedMatchday(playerList) {
  let md = 0
  for (const p of playerList ?? []) {
    const n = Number(p?.mdId)
    if (Number.isFinite(n) && n > md) md = n
  }
  return md
}

// A player's status, or null when fit (or when nothing is known). Duplicate
// sheet rows get "-2", "-3" on their id; they share the base id's status.
export function availabilityOf(id, data = AVAILABILITY) {
  if (!id || !data?.players) return null
  const code = data.players[id] ?? data.players[String(id).replace(/-\d+$/, '')]
  const status = code && STATUSES[code]
  return status ? { code, ...status } : null
}
