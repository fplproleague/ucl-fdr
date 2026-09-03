import { useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import AboutFdr from './AboutFdr.jsx'
import ControlBar from './ControlBar.jsx'
import FixtureGrid from './FixtureGrid.jsx'
import ViewHeading from './ViewHeading.jsx'

export default function FDRTable() {
  const { visibleTeams, teamsByAbbr, hiddenCount, hideTeam, resetHidden, venueAdjust, from, to, skipMd } = useTeams()
  const [sortBy, setSortBy] = useState('avg')

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(visibleTeams, teamsByAbbr, mds, venueAdjust)

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
        subtitle={`${visibleTeams.length} of 36 teams, MD${from}–MD${to}${skipMd ? ` (skipping MD${skipMd})` : ''}. Tap the × on a row to drop a team from the table.`}
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

      {hiddenCount > 0 && (
        <p className="mb-3 flex items-center gap-2 text-xs text-ucl-muted">
          {hiddenCount} team{hiddenCount === 1 ? '' : 's'} hidden
          <button
            type="button"
            onClick={resetHidden}
            className="font-semibold text-ucl-accent underline underline-offset-2 hover:text-ucl-star"
          >
            Show all
          </button>
        </p>
      )}

      {visibleTeams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">Every team is hidden</p>
          <button
            type="button"
            onClick={resetHidden}
            className="mt-2 text-sm font-semibold text-ucl-accent underline underline-offset-2 hover:text-ucl-star"
          >
            Show all teams
          </button>
        </div>
      ) : (
        <FixtureGrid
          mds={mds}
          rows={sorted}
          showAvg={false}
          onRemove={hideTeam}
          caption={`Fixture difficulty for ${visibleTeams.length} Champions League teams, matchday ${from} to ${to}${
            skipMd ? `, matchday ${skipMd} skipped` : ''
          }`}
        />
      )}

      <AboutFdr />
    </div>
  )
}
