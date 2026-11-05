import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { useTeamDetail } from '../utils/useTeamDetail.js'
import ControlBar from './ControlBar.jsx'
import FixtureGrid from './FixtureGrid.jsx'
import MyTeamsEmpty from './MyTeamsEmpty.jsx'
import ViewHeading from './ViewHeading.jsx'
import { mdRange, matchdayRange } from '../utils/mdLabel.js'

// This view is in the first chunk, so what it only shows after a tap (a
// team's panel, the hidden-teams dialog, the single-matchday match list)
// loads on demand. The team panel brings the odds code with it.
const TeamDetailPanel = lazy(() => import('./TeamDetailPanel.jsx'))
const HiddenTeamsPanel = lazy(() => import('./HiddenTeamsPanel.jsx'))
const MatchdayMatches = lazy(() => import('./MatchdayMatches.jsx'))
// Comparing a few teams (what the Compare tab used to be): see TeamComparison.
const TeamComparison = lazy(() => import('./TeamComparison.jsx'))

export default function FDRTable() {
  const {
    visibleTeams,
    teamsByAbbr,
    hiddenCount,
    hideTeam,
    togglePin,
    myTeamsOnly,
    setMyTeamsOnly,
    pinnedCount,
    venueAdjust,
    from,
    to,
    skipMd,
    compare,
    setCompare,
  } = useTeams()
  const [sortBy, setSortBy] = useState('avg')
  const [hiddenPanelOpen, setHiddenPanelOpen] = useState(false)
  // Match view only makes sense for a single matchday — force back to Teams
  // the moment the range widens again.
  const [viewMode, setViewMode] = useState('teams')
  const singleMd = from === to
  useEffect(() => {
    if (!singleMd && viewMode === 'matches') setViewMode('teams')
  }, [singleMd, viewMode])

  const { detailAbbr, openTeam, closeDetail, compareTeam } = useTeamDetail()

  // Compare mode: the table shows only the teams picked to compare (in the
  // link as ?teams=), easiest run first. Opened from "Compare teams" here,
  // from a team's panel, or by an old #/compare link. `comparing` covers the
  // moment before the first team is picked.
  const [comparing, setComparing] = useState(false)
  const inCompare = comparing || compare.length > 0
  const comparedTeams = compare.map((abbr) => teamsByAbbr[abbr]).filter(Boolean)
  function stopComparing() {
    setCompare([])
    setComparing(false)
  }

  const shownTeams = inCompare ? comparedTeams : myTeamsOnly ? visibleTeams.filter((t) => t.pinned) : visibleTeams

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(shownTeams, teamsByAbbr, mds, venueAdjust)

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (sortBy === 'avg' || inCompare) copy.sort(compareRuns)
    else copy.sort((a, b) => a.team.name.localeCompare(b.team.name))
    return copy
  }, [rows, sortBy, inCompare])
  const showMatches = viewMode === 'matches' && !inCompare

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="FDR Table"
        subtitle={
          inCompare
            ? `Comparing ${shownTeams.length} team${shownTeams.length === 1 ? '' : 's'}, ${mdRange(from, to)}${
                skipMd ? ` (ignoring MD${skipMd})` : ''
              }, easiest run first.`
            : myTeamsOnly && shownTeams.length === 0
              ? `My teams, ${mdRange(from, to)}: nothing to show yet.`
              : `${shownTeams.length} of 36 teams, ${mdRange(from, to)}${skipMd ? ` (ignoring MD${skipMd})` : ''}. Tap a row to see that team, or to drop it.`
        }
        action={
          !inCompare &&
          !showMatches && (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setComparing(true)}
                className="flex min-h-[40px] items-center gap-1.5 rounded border border-white/10 px-3 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 hover:text-ucl-star"
              >
                <Scale size={14} aria-hidden="true" />
                Compare<span className="hidden sm:inline"> teams</span>
              </button>
              <div className="flex shrink-0 rounded-lg border border-white/10 p-0.5 text-xs font-semibold">
                {[
                  { id: 'avg', label: 'Best fixtures' },
                  { id: 'name', label: 'A–Z' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id)}
                    aria-pressed={sortBy === opt.id}
                    className={`min-h-[36px] rounded px-3 transition ${
                      sortBy === opt.id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/60 hover:text-ucl-star'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        }
      />

      <ControlBar className="mb-3" showMyTeamsFilter={!inCompare} />

      {inCompare && (
        <Suspense fallback={null}>
          <TeamComparison sorted={sorted} mds={mds} onClose={stopComparing} startOpen={compare.length < 2} />
        </Suspense>
      )}

      {singleMd && !inCompare && (
        <div className="mb-3 flex rounded-lg border border-white/10 p-0.5 text-xs font-semibold" role="tablist">
          {[
            { id: 'teams', label: 'Teams' },
            { id: 'matches', label: 'Matches' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={viewMode === opt.id}
              onClick={() => setViewMode(opt.id)}
              className={`min-h-[36px] flex-1 rounded px-3 transition ${
                viewMode === opt.id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/60 hover:text-ucl-star'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {hiddenCount > 0 && !inCompare && (
        <p className="mb-3 flex items-center gap-2 text-xs text-ucl-muted">
          {hiddenCount} team{hiddenCount === 1 ? '' : 's'} hidden
          <button
            type="button"
            onClick={() => setHiddenPanelOpen(true)}
            className="font-semibold text-ucl-link underline underline-offset-2 hover:text-ucl-star"
          >
            Show hidden teams
          </button>
        </p>
      )}

      {inCompare && shownTeams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">Nothing to compare yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-ucl-muted">
            Add two or more teams and their matchdays line up here, easiest run first.
          </p>
        </div>
      ) : visibleTeams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">Every team is hidden</p>
          <button
            type="button"
            onClick={() => setHiddenPanelOpen(true)}
            className="mt-2 text-sm font-semibold text-ucl-link underline underline-offset-2 hover:text-ucl-star"
          >
            Show hidden teams
          </button>
        </div>
      ) : myTeamsOnly && shownTeams.length === 0 ? (
        <MyTeamsEmpty pinnedCount={pinnedCount} onShowAll={() => setMyTeamsOnly(false)} />
      ) : showMatches ? (
        <Suspense fallback={null}>
          <MatchdayMatches md={from} onTeamClick={openTeam} />
        </Suspense>
      ) : (
        <FixtureGrid
          mds={mds}
          rows={sorted}
          showAvg={inCompare}
          fullNames={inCompare}
          onRemove={inCompare ? undefined : hideTeam}
          onTogglePin={togglePin}
          onTeamClick={openTeam}
          caption={`Fixture difficulty for ${shownTeams.length} Champions League teams, ${matchdayRange(from, to)}${
            skipMd ? `, matchday ${skipMd} ignored` : ''
          }`}
        />
      )}

      <Suspense fallback={null}>
        {detailAbbr && (
          <TeamDetailPanel
            abbr={detailAbbr}
            onClose={closeDetail}
            onCompare={() => compareTeam(detailAbbr)}
            onHide={hideTeam}
          />
        )}
        {hiddenPanelOpen && <HiddenTeamsPanel onClose={() => setHiddenPanelOpen(false)} />}
      </Suspense>
    </div>
  )
}
