import { useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import ControlBar from './ControlBar.jsx'
import FixtureGrid from './FixtureGrid.jsx'
import ViewHeading from './ViewHeading.jsx'

export default function FDRTable() {
  const { teams, teamsByAbbr, venueAdjust, from, to, skipMd } = useTeams()
  const [sortBy, setSortBy] = useState('avg')

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(teams, teamsByAbbr, mds, venueAdjust)

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (sortBy === 'avg') copy.sort(compareRuns)
    else copy.sort((a, b) => a.team.name.localeCompare(b.team.name))
    return copy
  }, [rows, sortBy])

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="FDR Table"
        subtitle={`All 36 teams, MD${from}–MD${to}${skipMd ? ` (skipping MD${skipMd})` : ''}.`}
        action={
          <div className="flex shrink-0 rounded-full border border-white/10 bg-white/5 p-0.5 text-xs font-semibold">
            {[
              { id: 'avg', label: 'Best fixtures' },
              { id: 'name', label: 'A–Z' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                aria-pressed={sortBy === opt.id}
                className={`min-h-[36px] rounded-full px-3 transition ${
                  sortBy === opt.id ? 'bg-ucl-accent text-white' : 'text-ucl-star/60 hover:text-ucl-star'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      <ControlBar className="mb-3" />

      <FixtureGrid
        mds={mds}
        rows={sorted}
        showAvg={false}
        caption={`Fixture difficulty for all 36 Champions League teams, matchday ${from} to ${to}${
          skipMd ? `, matchday ${skipMd} skipped` : ''
        }`}
      />
    </div>
  )
}
