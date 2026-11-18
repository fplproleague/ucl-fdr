// A matchday range as people write it: "MD5–MD8", or just "MD5" when the
// range is one matchday (not "MD5–MD5", or "MD5 → MD5" in a column header).
export function mdRange(from, to) {
  return from === to ? `MD${from}` : `MD${from}–MD${to}`
}

// The same for sentences read aloud (table captions): "matchday 5 to 8",
// or "matchday 5".
export function matchdayRange(from, to) {
  return from === to ? `matchday ${from}` : `matchday ${from} to ${to}`
}
