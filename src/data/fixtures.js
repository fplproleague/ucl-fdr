// MD1-8 fixtures for the 2026/27 UEFA Champions League league phase.
// Verified against the official draw: every fixture has a matching reciprocal
// with the opposite venue, all 36 teams play 8 matches (4 home, 4 away), no
// team faces a domestic rival, and nobody faces more than two clubs from one
// association. Run `node scripts/build-fixtures.mjs` to regenerate.
export const TOTAL_MATCHDAYS = 8

// Bumped whenever the fixture data changes, so the UI can show visitors how
// fresh the numbers are without anyone hand-editing a date string in a component.
export const DATA_UPDATED = '2026-09-01'

export const FIXTURES = {
  "AEK": [
    {
      "gw": 1,
      "opp": "LAS",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "SHK",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "MCI",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "RMA",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "COM",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "GAL",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "ROM",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "BVB",
      "venue": "A"
    }
  ],
  "ARS": [
    {
      "gw": 1,
      "opp": "NAP",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "LIL",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "BAY",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "SLA",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "BVB",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "RMA",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "BET",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "SAB",
      "venue": "H"
    }
  ],
  "ATM": [
    {
      "gw": 1,
      "opp": "LIV",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "MUN",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "STU",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "BAY",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "VIK",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "PSV",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "BOD",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "FEN",
      "venue": "H"
    }
  ],
  "AVL": [
    {
      "gw": 1,
      "opp": "CLU",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "FEN",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "VIK",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "BAR",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "GAL",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "PSG",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "BVB",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "SLA",
      "venue": "A"
    }
  ],
  "BAR": [
    {
      "gw": 1,
      "opp": "FEY",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "GAL",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "PSG",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "AVL",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "SAB",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "MCI",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "SPO",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "COM",
      "venue": "H"
    }
  ],
  "BAY": [
    {
      "gw": 1,
      "opp": "BOD",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "VIK",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "ARS",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "ATM",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "LIL",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "SLA",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "MUN",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "BET",
      "venue": "H"
    }
  ],
  "BET": [
    {
      "gw": 1,
      "opp": "LIL",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "POR",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "FEY",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "BVB",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "SLO",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "COM",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "ARS",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "BAY",
      "venue": "A"
    }
  ],
  "BOD": [
    {
      "gw": 1,
      "opp": "BAY",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "BVB",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "NAP",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "LIL",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "LAS",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "LEN",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "ATM",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "CLU",
      "venue": "A"
    }
  ],
  "BVB": [
    {
      "gw": 1,
      "opp": "VIL",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "BOD",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "SAB",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "BET",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "ARS",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "INT",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "AVL",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "AEK",
      "venue": "H"
    }
  ],
  "CLU": [
    {
      "gw": 1,
      "opp": "AVL",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "INT",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "LEN",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "PSV",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "LIV",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "NAP",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "STU",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "BOD",
      "venue": "H"
    }
  ],
  "COM": [
    {
      "gw": 1,
      "opp": "RBL",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "FEY",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "MUN",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "LEN",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "AEK",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "BET",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "PSG",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "BAR",
      "venue": "A"
    }
  ],
  "FEN": [
    {
      "gw": 1,
      "opp": "ROM",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "AVL",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "SLA",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "LIV",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "SHK",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "LAS",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "VIL",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "ATM",
      "venue": "A"
    }
  ],
  "FEY": [
    {
      "gw": 1,
      "opp": "BAR",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "COM",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "BET",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "INT",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "POR",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "VIK",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "GAL",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "RBL",
      "venue": "H"
    }
  ],
  "GAL": [
    {
      "gw": 1,
      "opp": "SPO",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "BAR",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "LIL",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "STU",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "AVL",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "AEK",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "FEY",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "PSG",
      "venue": "A"
    }
  ],
  "INT": [
    {
      "gw": 1,
      "opp": "RMA",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "CLU",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "SHK",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "FEY",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "STU",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "BVB",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "LIV",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "SLO",
      "venue": "A"
    }
  ],
  "LAS": [
    {
      "gw": 1,
      "opp": "AEK",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "LIV",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "SPO",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "SLO",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "BOD",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "FEN",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "RMA",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "POR",
      "venue": "H"
    }
  ],
  "LEN": [
    {
      "gw": 1,
      "opp": "SLA",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "SPO",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "CLU",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "COM",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "RBL",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "BOD",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "MCI",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "LIV",
      "venue": "A"
    }
  ],
  "LIL": [
    {
      "gw": 1,
      "opp": "BET",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "ARS",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "GAL",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "BOD",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "BAY",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "STU",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "SLO",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "ROM",
      "venue": "A"
    }
  ],
  "LIV": [
    {
      "gw": 1,
      "opp": "ATM",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "LAS",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "VIL",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "FEN",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "CLU",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "POR",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "INT",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "LEN",
      "venue": "H"
    }
  ],
  "MCI": [
    {
      "gw": 1,
      "opp": "POR",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "PSG",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "AEK",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "RBL",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "NAP",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "BAR",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "LEN",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "SPO",
      "venue": "H"
    }
  ],
  "MUN": [
    {
      "gw": 1,
      "opp": "SAB",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "ATM",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "COM",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "ROM",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "SPO",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "RBL",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "BAY",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "VIL",
      "venue": "A"
    }
  ],
  "NAP": [
    {
      "gw": 1,
      "opp": "ARS",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "VIL",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "BOD",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "POR",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "MCI",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "CLU",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "SAB",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "VIK",
      "venue": "H"
    }
  ],
  "POR": [
    {
      "gw": 1,
      "opp": "MCI",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "BET",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "PSV",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "NAP",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "FEY",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "LIV",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "SLA",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "LAS",
      "venue": "A"
    }
  ],
  "PSG": [
    {
      "gw": 1,
      "opp": "SLO",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "MCI",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "BAR",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "VIL",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "ROM",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "AVL",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "COM",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "GAL",
      "venue": "H"
    }
  ],
  "PSV": [
    {
      "gw": 1,
      "opp": "SHK",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "RBL",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "POR",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "CLU",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "RMA",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "ATM",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "VIK",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "STU",
      "venue": "H"
    }
  ],
  "RBL": [
    {
      "gw": 1,
      "opp": "COM",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "PSV",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "RMA",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "MCI",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "LEN",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "MUN",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "SHK",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "FEY",
      "venue": "A"
    }
  ],
  "RMA": [
    {
      "gw": 1,
      "opp": "INT",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "ROM",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "RBL",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "AEK",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "PSV",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "ARS",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "LAS",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "SHK",
      "venue": "A"
    }
  ],
  "ROM": [
    {
      "gw": 1,
      "opp": "FEN",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "RMA",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "SLO",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "MUN",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "PSG",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "SPO",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "AEK",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "LIL",
      "venue": "H"
    }
  ],
  "SAB": [
    {
      "gw": 1,
      "opp": "MUN",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "SLA",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "BVB",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "VIK",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "BAR",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "VIL",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "NAP",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "ARS",
      "venue": "A"
    }
  ],
  "SHK": [
    {
      "gw": 1,
      "opp": "PSV",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "AEK",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "INT",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "SPO",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "FEN",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "SLO",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "RBL",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "RMA",
      "venue": "H"
    }
  ],
  "SLA": [
    {
      "gw": 1,
      "opp": "LEN",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "SAB",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "FEN",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "ARS",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "VIL",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "BAY",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "POR",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "AVL",
      "venue": "H"
    }
  ],
  "SLO": [
    {
      "gw": 1,
      "opp": "PSG",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "STU",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "ROM",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "LAS",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "BET",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "SHK",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "LIL",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "INT",
      "venue": "H"
    }
  ],
  "SPO": [
    {
      "gw": 1,
      "opp": "GAL",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "LEN",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "LAS",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "SHK",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "MUN",
      "venue": "H"
    },
    {
      "gw": 6,
      "opp": "ROM",
      "venue": "A"
    },
    {
      "gw": 7,
      "opp": "BAR",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "MCI",
      "venue": "A"
    }
  ],
  "STU": [
    {
      "gw": 1,
      "opp": "VIK",
      "venue": "H"
    },
    {
      "gw": 2,
      "opp": "SLO",
      "venue": "A"
    },
    {
      "gw": 3,
      "opp": "ATM",
      "venue": "H"
    },
    {
      "gw": 4,
      "opp": "GAL",
      "venue": "A"
    },
    {
      "gw": 5,
      "opp": "INT",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "LIL",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "CLU",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "PSV",
      "venue": "A"
    }
  ],
  "VIK": [
    {
      "gw": 1,
      "opp": "STU",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "BAY",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "AVL",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "SAB",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "ATM",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "FEY",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "PSV",
      "venue": "H"
    },
    {
      "gw": 8,
      "opp": "NAP",
      "venue": "A"
    }
  ],
  "VIL": [
    {
      "gw": 1,
      "opp": "BVB",
      "venue": "A"
    },
    {
      "gw": 2,
      "opp": "NAP",
      "venue": "H"
    },
    {
      "gw": 3,
      "opp": "LIV",
      "venue": "A"
    },
    {
      "gw": 4,
      "opp": "PSG",
      "venue": "H"
    },
    {
      "gw": 5,
      "opp": "SLA",
      "venue": "A"
    },
    {
      "gw": 6,
      "opp": "SAB",
      "venue": "H"
    },
    {
      "gw": 7,
      "opp": "FEN",
      "venue": "A"
    },
    {
      "gw": 8,
      "opp": "MUN",
      "venue": "H"
    }
  ]
}
