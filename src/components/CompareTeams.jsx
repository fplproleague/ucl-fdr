import { useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns, effectiveDifficulty, formatAvg } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { useTeamDetail } from '../utils/useTeamDetail.js'
import { compareTeamFixtures, summarizeComparison } from '../utils/teamComplement.js'
import TeamBadge from './TeamBadge.jsx'
import ControlBar from './ControlBar.jsx'
import FixtureGrid from './FixtureGrid.jsx'
import TeamDetailPanel from './TeamDetailPanel.jsx'
import ViewHeading from './ViewHeading.jsx'

export default function CompareTeams() {
  const { visibleTeams, teamsByAbbr, togglePin, venueAdjust, from, to, skipMd, compare, setCompare } = useTeams()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { detailAbbr, openTeam, closeDetail, compareTeam } = useTeamDetail()

  const selectedTeams = compare.map((abbr) => teamsByAbbr[abbr]).filter(Boolean)

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(selectedTeams, teamsByAbbr, mds, venueAdjust)
  const sorted = useMemo(() => [...rows].sort(compareRuns), [rows])

  function toggle(abbr) {
    if (compare.includes(abbr)) setCompare(compare.filter((x) => x !== abbr))
    else setCompare([...compare, abbr])
  }

  const filtered = visibleTeams.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
  const best = sorted[0]
  const tied = best ? sorted.filter((r) => r.avg === best.avg) : []

  // Exactly two teams is the case a manager actually agonises over — a
  // per-matchday verdict and a rotation check, both built from the same
  // per-fixture numbers the grid above already shows, just diffed.
  const headToHead = useMemo(() => {
    if (sorted.length !== 2) return null
    const [a, b] = sorted
    let totalDelta = 0
    let compared = 0
    let aEasier = 0
    let bEasier = 0
    const perMd = mds.map((md, i) => {
      const cellA = a.cells[i]
      const cellB = b.cells[i]
      if (!cellA || !cellB) return { md, easier: null }
      const effA = effectiveDifficulty(
        teamsByAbbr[cellA.opp]?.rating ?? 3,
        cellA.venue,
        venueAdjust,
        teamsByAbbr[cellA.opp]?.awayDifficulty ?? 0,
      )
      const effB = effectiveDifficulty(
        teamsByAbbr[cellB.opp]?.rating ?? 3,
        cellB.venue,
        venueAdjust,
        teamsByAbbr[cellB.opp]?.awayDifficulty ?? 0,
      )
      compared += 1
      totalDelta += effB - effA
      const easier = effA < effB ? 'a' : effB < effA ? 'b' : null
      if (easier === 'a') aEasier += 1
      if (easier === 'b') bEasier += 1
      return { md, easier }
    })
    const rotationRows = compareTeamFixtures(a.team.abbr, b.team.abbr, mds, teamsByAbbr, venueAdjust)
    return {
      a,
      b,
      perMd,
      compared,
      aEasier,
      bEasier,
      avgDelta: compared > 0 ? totalDelta / compared : 0,
      rotation: summarizeComparison(rotationRows),
    }
  }, [sorted, mds, teamsByAbbr, venueAdjust])

  return (
    <div className="mx-auto max-w-5xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Compare Teams"
        subtitle={`Put teams side by side over MD${from}–MD${to}${skipMd ? ` (ignoring MD${skipMd})` : ''}.`}
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

          {headToHead && headToHead.compared > 0 && (
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ucl-muted">Head-to-head</p>
              <p className="mb-2 text-xs text-ucl-star/80">
                {headToHead.avgDelta > 0.05 ? (
                  <>
                    <span className="font-semibold text-ucl-star">{headToHead.a.team.name}</span>'s fixtures are{' '}
                    <strong className="text-ucl-star">{formatAvg(Math.abs(headToHead.avgDelta))}</strong> easier on
                    average here ({headToHead.aEasier} of {headToHead.compared} matchdays).
                  </>
                ) : headToHead.avgDelta < -0.05 ? (
                  <>
                    <span className="font-semibold text-ucl-star">{headToHead.b.team.name}</span>'s fixtures are{' '}
                    <strong className="text-ucl-star">{formatAvg(Math.abs(headToHead.avgDelta))}</strong> easier on
                    average here ({headToHead.bEasier} of {headToHead.compared} matchdays).
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-ucl-star">{headToHead.a.team.name}</span> and{' '}
                    <span className="font-semibold text-ucl-star">{headToHead.b.team.name}</span> have almost identical
                    fixture difficulty here.
                  </>
                )}
              </p>
              <div className="mb-3 flex flex-wrap gap-1">
                {headToHead.perMd.map((p) => (
                  <span
                    key={p.md}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      p.easier === 'a'
                        ? 'bg-ucl-accent/20 text-ucl-accent'
                        : p.easier === 'b'
                          ? 'bg-white/10 text-ucl-star/70'
                          : 'bg-white/5 text-ucl-muted'
                    }`}
                    title={`MD${p.md}: ${p.easier === 'a' ? headToHead.a.team.name : p.easier === 'b' ? headToHead.b.team.name : 'Even'} easier`}
                  >
                    MD{p.md}: {p.easier === 'a' ? headToHead.a.team.abbr : p.easier === 'b' ? headToHead.b.team.abbr : '='}
                  </span>
                ))}
              </div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">
                Rotation check over this range
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ucl-star/80">
                <span>
                  Different days:{' '}
                  <strong className="text-ucl-star">
                    {headToHead.rotation.differentDays}/{headToHead.rotation.total}
                  </strong>
                </span>
                <span>
                  ≥1 favourable:{' '}
                  <strong className="text-ucl-star">
                    {headToHead.rotation.atLeastOneFavourable}/{headToHead.rotation.total}
                  </strong>
                </span>
                <span>
                  Both favourable:{' '}
                  <strong className="text-ucl-star">
                    {headToHead.rotation.bothFavourable}/{headToHead.rotation.total}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <FixtureGrid
            mds={mds}
            rows={sorted}
            fullNames
            onTogglePin={togglePin}
            onTeamClick={openTeam}
            caption={`Fixture comparison for ${sorted.length} teams, matchday ${from} to ${to}${
              skipMd ? `, matchday ${skipMd} ignored` : ''
            }`}
          />
        </>
      )}

      {detailAbbr && (
        <TeamDetailPanel abbr={detailAbbr} onClose={closeDetail} onCompare={() => compareTeam(detailAbbr)} />
      )}
    </div>
  )
}
