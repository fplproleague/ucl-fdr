import { useMemo } from 'react'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'

const allMds = Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => i + 1)

// The matchday columns a view actually renders: the selected range, minus
// one optional skipped matchday (e.g. a Limitless/wildcard round you're
// building a separate team for and don't want pulling down this team's
// averages). Shared so the table, Best Runs and Compare can never disagree
// about which columns exist.
export function useVisibleMds(from, to, skipMd) {
  return useMemo(() => allMds.filter((md) => md >= from && md <= to && md !== skipMd), [from, to, skipMd])
}
