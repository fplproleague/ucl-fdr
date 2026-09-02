import { useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns, formatAvg } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import TeamBadge from './TeamBadge.jsx'
import ControlBar from './ControlBar.jsx'
import FixtureGrid from './FixtureGrid.jsx'
import ViewHeading from './ViewHeading.jsx'

export default function CompareTeams() {
  const { teams, teamsByAbbr, venueAdjust, from, to, skipMd, compare, setCompare } = useTeams()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedTeams = compare.map((abbr) => teamsByAbbr[abbr]).filter(Boolean)

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(selectedTeams, teamsByAbbr, mds, venueAdjust)
  const sorted = useMemo(() => [...rows].sort(compareRuns), [rows])

  function toggle(abbr) {
    if (compare.includes(abbr)) setCompare(compare.filter((x) => x !== abbr))
    else setCompare([...compare, abbr])
  }

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
  const best = sorted[0]
  const tied = best ? sorted.filter((r) => r.avg === best.avg) : []

  return (
    <div className="mx-auto max-w-5xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Compare Teams"
        subtitle={`Put teams side by side over MD${from}–MD${to}${skipMd ? ` (skipping MD${skipMd})` : ''}.`}
      />

      <ControlBar className="mb-3" />

      <div className="mb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {selectedTeams.map((team) => (
            <button
              key={team.abbr}
              type="button"
              onClick={() => toggle(team.abbr)}
              aria-label={`Remove ${team.name}`}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-ucl-accent/40 bg-ucl-accent/15 px-2.5 text-xs font-semibold text-ucl-star transition hover:bg-ucl-accent/25"
            >
              <TeamBadge abbr={team.abbr} size={16} />
              {team.abbr}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="min-h-[36px] rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10"
          >
            {open ? 'Done' : `Add team${selectedTeams.length ? ` (${selectedTeams.length} selected)` : ''}`}
          </button>
          {selectedTeams.length > 0 && (
            <button
              type="button"
              onClick={() => setCompare([])}
              className="min-h-[36px] rounded-full px-2 text-xs font-semibold text-ucl-muted transition hover:text-ucl-star"
            >
              Clear
            </button>
          )}
        </div>

        {open && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <div className="relative mb-2">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ucl-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams"
                aria-label="Search teams"
                className="min-h-[40px] w-full rounded-lg border border-white/10 bg-ucl-deep pl-8 pr-2 text-sm text-ucl-star placeholder:text-ucl-star/30"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {filtered.map((team) => {
                  const active = compare.includes(team.abbr)
                  return (
                    <button
                      key={team.abbr}
                      type="button"
                      onClick={() => toggle(team.abbr)}
                      aria-pressed={active}
                      className={`flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-left text-xs font-medium transition ${
                        active
                          ? 'bg-ucl-accent/25 text-ucl-star ring-1 ring-ucl-accent/50'
                          : 'text-ucl-star/80 hover:bg-white/5'
                      }`}
                    >
                      <TeamBadge abbr={team.abbr} size={18} />
                      <span className="truncate">{team.name}</span>
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p className="col-span-full py-3 text-center text-xs text-ucl-muted">No team matches “{query}”.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">Nothing to compare yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-ucl-muted">
            Add two or more teams and their matchdays line up in one grid, easiest run first.
          </p>
        </div>
      ) : (
        <>
          {sorted.length > 1 && best && (
            <p className="mb-2 text-xs text-ucl-star/70">
              {/* Don't hand one team the crown when the averages are level —
                  three teams sit on exactly 3.00 over the full league phase. */}
              {tied.length > 1 ? (
                <>
                  <span className="font-semibold text-ucl-star">{tied.map((r) => r.team.name).join(' and ')}</span> are
                  level on the best average here — {formatAvg(best.avg)}.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ucl-star">{best.team.name}</span> has the easiest run here — avg{' '}
                  {formatAvg(best.avg)} with {best.homes} home {best.homes === 1 ? 'tie' : 'ties'}.
                </>
              )}
            </p>
          )}
          <FixtureGrid
            mds={mds}
            rows={sorted}
            fullNames
            caption={`Fixture comparison for ${sorted.length} teams, matchday ${from} to ${to}${
              skipMd ? `, matchday ${skipMd} skipped` : ''
            }`}
          />
        </>
      )}
    </div>
  )
}
