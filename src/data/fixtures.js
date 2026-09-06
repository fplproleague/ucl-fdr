// MD1-8 fixtures for the 2026/27 UEFA Champions League league phase.
// Verified against the official draw: every fixture has a matching reciprocal
// with the opposite venue, all 36 teams play 8 matches (4 home, 4 away), no
// team faces a domestic rival, and nobody faces more than two clubs from one
// association. "day" (TUE/WED/THU) is cross-checked against this same
// reciprocal structure by scripts/build-matchday-days.mjs. Run
// `node scripts/build-matchday-days.mjs <source.txt>` then
// `node scripts/build-fixtures.mjs` to regenerate both.
export const TOTAL_MATCHDAYS = 8

// Bumped whenever the fixture data changes, so the UI can show visitors how
// fresh the numbers are without anyone hand-editing a date string in a
// component. Also stamped onto public/sitemap.xml's <lastmod> at build time
// (see the stampSitemapLastmod plugin in vite.config.js) — that's automatic,
// nothing else to update here.
export const DATA_UPDATED = '2026-09-05'

export const FIXTURES = {
  "AEK": [
    {
      "gw": 1,
      "opp": "LAS",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "SHK",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "MCI",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "RMA",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "COM",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "GAL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "ROM",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "BVB",
      "venue": "A",
      "day": "WED"
    }
  ],
  "ARS": [
    {
      "gw": 1,
      "opp": "NAP",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "LIL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "BAY",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "SLA",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "BVB",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "RMA",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "BET",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "SAB",
      "venue": "H",
      "day": "WED"
    }
  ],
  "ATM": [
    {
      "gw": 1,
      "opp": "LIV",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "MUN",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "STU",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "BAY",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "VIK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "PSV",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "BOD",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "FEN",
      "venue": "H",
      "day": "WED"
    }
  ],
  "AVL": [
    {
      "gw": 1,
      "opp": "CLU",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "FEN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "VIK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "BAR",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "GAL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "PSG",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "BVB",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "SLA",
      "venue": "A",
      "day": "WED"
    }
  ],
  "BAR": [
    {
      "gw": 1,
      "opp": "FEY",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "GAL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "PSG",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "AVL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "SAB",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "MCI",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "SPO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "COM",
      "venue": "H",
      "day": "WED"
    }
  ],
  "BAY": [
    {
      "gw": 1,
      "opp": "BOD",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "VIK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "ARS",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "ATM",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "LIL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "SLA",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "MUN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "BET",
      "venue": "H",
      "day": "WED"
    }
  ],
  "BET": [
    {
      "gw": 1,
      "opp": "LIL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "POR",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "FEY",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "BVB",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "SLO",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "COM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "ARS",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "BAY",
      "venue": "A",
      "day": "WED"
    }
  ],
  "BOD": [
    {
      "gw": 1,
      "opp": "BAY",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "BVB",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "NAP",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "LIL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "LAS",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "LEN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "ATM",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "CLU",
      "venue": "A",
      "day": "WED"
    }
  ],
  "BVB": [
    {
      "gw": 1,
      "opp": "VIL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "BOD",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "SAB",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "BET",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "ARS",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "INT",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "AVL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "AEK",
      "venue": "H",
      "day": "WED"
    }
  ],
  "CLU": [
    {
      "gw": 1,
      "opp": "AVL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "INT",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "LEN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "PSV",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "LIV",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "NAP",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "STU",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "BOD",
      "venue": "H",
      "day": "WED"
    }
  ],
  "COM": [
    {
      "gw": 1,
      "opp": "RBL",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "FEY",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "MUN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "LEN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "AEK",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "BET",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "PSG",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "BAR",
      "venue": "A",
      "day": "WED"
    }
  ],
  "FEN": [
    {
      "gw": 1,
      "opp": "ROM",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "AVL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "SLA",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "LIV",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "SHK",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "LAS",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "VIL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "ATM",
      "venue": "A",
      "day": "WED"
    }
  ],
  "FEY": [
    {
      "gw": 1,
      "opp": "BAR",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "COM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "BET",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "INT",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "POR",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "VIK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "GAL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "RBL",
      "venue": "H",
      "day": "WED"
    }
  ],
  "GAL": [
    {
      "gw": 1,
      "opp": "SPO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "BAR",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "LIL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "STU",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "AVL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "AEK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "FEY",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "PSG",
      "venue": "A",
      "day": "WED"
    }
  ],
  "INT": [
    {
      "gw": 1,
      "opp": "RMA",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "CLU",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "SHK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "FEY",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "STU",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "BVB",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "LIV",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "SLO",
      "venue": "A",
      "day": "WED"
    }
  ],
  "LAS": [
    {
      "gw": 1,
      "opp": "AEK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "LIV",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "SPO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "SLO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "BOD",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "FEN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "RMA",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "POR",
      "venue": "H",
      "day": "WED"
    }
  ],
  "LEN": [
    {
      "gw": 1,
      "opp": "SLA",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "SPO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "CLU",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "COM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "RBL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "BOD",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "MCI",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "LIV",
      "venue": "A",
      "day": "WED"
    }
  ],
  "LIL": [
    {
      "gw": 1,
      "opp": "BET",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "ARS",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "GAL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "BOD",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "BAY",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "STU",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "SLO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "ROM",
      "venue": "A",
      "day": "WED"
    }
  ],
  "LIV": [
    {
      "gw": 1,
      "opp": "ATM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "LAS",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "VIL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "FEN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "CLU",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "POR",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "INT",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "LEN",
      "venue": "H",
      "day": "WED"
    }
  ],
  "MCI": [
    {
      "gw": 1,
      "opp": "POR",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "PSG",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "AEK",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "RBL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "NAP",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "BAR",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "LEN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "SPO",
      "venue": "H",
      "day": "WED"
    }
  ],
  "MUN": [
    {
      "gw": 1,
      "opp": "SAB",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "ATM",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "COM",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "ROM",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "SPO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "RBL",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "BAY",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "VIL",
      "venue": "A",
      "day": "WED"
    }
  ],
  "NAP": [
    {
      "gw": 1,
      "opp": "ARS",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "VIL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "BOD",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "POR",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "MCI",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "CLU",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "SAB",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "VIK",
      "venue": "H",
      "day": "WED"
    }
  ],
  "POR": [
    {
      "gw": 1,
      "opp": "MCI",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "BET",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "PSV",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "NAP",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "FEY",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "LIV",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "SLA",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "LAS",
      "venue": "A",
      "day": "WED"
    }
  ],
  "PSG": [
    {
      "gw": 1,
      "opp": "SLO",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "MCI",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "BAR",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "VIL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "ROM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "AVL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "COM",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "GAL",
      "venue": "H",
      "day": "WED"
    }
  ],
  "PSV": [
    {
      "gw": 1,
      "opp": "SHK",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "RBL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "POR",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "CLU",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "RMA",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "ATM",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "VIK",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "STU",
      "venue": "H",
      "day": "WED"
    }
  ],
  "RBL": [
    {
      "gw": 1,
      "opp": "COM",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "PSV",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "RMA",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "MCI",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "LEN",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "MUN",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "SHK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "FEY",
      "venue": "A",
      "day": "WED"
    }
  ],
  "RMA": [
    {
      "gw": 1,
      "opp": "INT",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "ROM",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "RBL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "AEK",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "PSV",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "ARS",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "LAS",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "SHK",
      "venue": "A",
      "day": "WED"
    }
  ],
  "ROM": [
    {
      "gw": 1,
      "opp": "FEN",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "RMA",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "SLO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "MUN",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "PSG",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "SPO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "AEK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "LIL",
      "venue": "H",
      "day": "WED"
    }
  ],
  "SAB": [
    {
      "gw": 1,
      "opp": "MUN",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "SLA",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "BVB",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "VIK",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "BAR",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "VIL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "NAP",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "ARS",
      "venue": "A",
      "day": "WED"
    }
  ],
  "SHK": [
    {
      "gw": 1,
      "opp": "PSV",
      "venue": "A",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "AEK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "INT",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "SPO",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "FEN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "SLO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "RBL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "RMA",
      "venue": "H",
      "day": "WED"
    }
  ],
  "SLA": [
    {
      "gw": 1,
      "opp": "LEN",
      "venue": "H",
      "day": "THU"
    },
    {
      "gw": 2,
      "opp": "SAB",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "FEN",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "ARS",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "VIL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "BAY",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "POR",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "AVL",
      "venue": "H",
      "day": "WED"
    }
  ],
  "SLO": [
    {
      "gw": 1,
      "opp": "PSG",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "STU",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "ROM",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "LAS",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "BET",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 6,
      "opp": "SHK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "LIL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "INT",
      "venue": "H",
      "day": "WED"
    }
  ],
  "SPO": [
    {
      "gw": 1,
      "opp": "GAL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "LEN",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "LAS",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "SHK",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "MUN",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "ROM",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "BAR",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "MCI",
      "venue": "A",
      "day": "WED"
    }
  ],
  "STU": [
    {
      "gw": 1,
      "opp": "VIK",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "SLO",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 3,
      "opp": "ATM",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "GAL",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "INT",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "LIL",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 7,
      "opp": "CLU",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 8,
      "opp": "PSV",
      "venue": "A",
      "day": "WED"
    }
  ],
  "VIK": [
    {
      "gw": 1,
      "opp": "STU",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 2,
      "opp": "BAY",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "AVL",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 4,
      "opp": "SAB",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 5,
      "opp": "ATM",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "FEY",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "PSV",
      "venue": "H",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "NAP",
      "venue": "A",
      "day": "WED"
    }
  ],
  "VIL": [
    {
      "gw": 1,
      "opp": "BVB",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 2,
      "opp": "NAP",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 3,
      "opp": "LIV",
      "venue": "A",
      "day": "TUE"
    },
    {
      "gw": 4,
      "opp": "PSG",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 5,
      "opp": "SLA",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 6,
      "opp": "SAB",
      "venue": "H",
      "day": "TUE"
    },
    {
      "gw": 7,
      "opp": "FEN",
      "venue": "A",
      "day": "WED"
    },
    {
      "gw": 8,
      "opp": "MUN",
      "venue": "H",
      "day": "WED"
    }
  ]
}
