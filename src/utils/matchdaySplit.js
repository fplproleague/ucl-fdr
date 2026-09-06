import { FIXTURES } from '../data/fixtures.js'

// The day of the week a fixture is played on lives directly on each fixture
// object in FIXTURES (see scripts/build-matchday-days.mjs) — this module is
// just query helpers over that, not a second copy of the data. Kept generic
// enough that other day-based features (goalkeeper rotation, squad
// day-balance) can reuse the same lookups later.
export const DAY_ORDER = ['TUE', 'WED', 'THU']
export const DAY_LABEL = { TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday' }

// Every distinct day (in DAY_ORDER) that occurs across any team's fixture on
// any of the given matchdays — e.g. MD1 returns all three, most matchdays
// return just [TUE, WED], MD8 returns only [WED]. Never hardcoded: this is
// read straight off the fixture data so it can't drift from reality.
export function availableDays(mds) {
  const present = new Set()
  for (const fixtures of Object.values(FIXTURES)) {
    for (const f of fixtures) {
      if (mds.includes(f.gw)) present.add(f.day)
    }
  }
  return DAY_ORDER.filter((d) => present.has(d))
}
