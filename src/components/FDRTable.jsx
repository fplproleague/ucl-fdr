import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Info, Scale } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { compareRuns } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { useTeamDetail } from '../utils/useTeamDetail.js'
import ControlBar, { DifficultyInfo } from './ControlBar.jsx'
import RatingLegend from './RatingLegend.jsx'
import { CopyLinkButton, IconButton, MetaRow, OptionTile, Segmented, SubTabs } from './Toolbar.jsx'
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
    step,
    openStep,
    closeStep,
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
  // from a team's panel, or by an old #/compare link. The 'fdrCompare' step
  // covers the moment before the first team is picked; started from the
  // button, compare mode is a history entry of its own (see STEP_RESETS),
  // so the back button leaves it.
  const inCompare = step === 'fdrCompare' || compare.length > 0
  const comparedTeams = compare.map((abbr) => teamsByAbbr[abbr]).filter(Boolean)
  function stopComparing() {
    setCompare([])
    if (step === 'fdrCompare') closeStep()
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

  const { modifiedCount, setTab } = useTeams()
  const [showInfo, setShowInfo] = useState(false)

  // Behind Options: the order, plus the shared fixture options. Hidden teams
  // and custom ratings aren't options here but they do change the table, so
  // they get a chip that opens where they're set.
  const tiles = inCompare
    ? []
    : [
        <OptionTile key="order" label="Order" hint="Easiest run first, or alphabetical to find a team.">
          <Segmented
            label="Order"
            stretch
            value={sortBy}
            onChange={setSortBy}
            options={[
              { id: 'avg', label: 'Best fixtures' },
              { id: 'name', label: 'A–Z' },
            ]}
          />
        </OptionTile>,
      ]
  const chips = []
  if (!inCompare && sortBy !== 'avg') chips.push({ key: 'order', label: 'A–Z', onRemove: () => setSortBy('avg') })
  if (!inCompare && hiddenCount > 0)
    chips.push({ key: 'hidden', label: `${hiddenCount} hidden · show`, onClick: () => setHiddenPanelOpen(true) })
  if (modifiedCount > 0)
    chips.push({
      key: 'custom',
      label: `${modifiedCount} custom rating${modifiedCount === 1 ? '' : 's'}`,
      onClick: () => setTab('strength'),
    })

  const range = `${mdRange(from, to)}${skipMd ? `, MD${skipMd} ignored` : ''}`
  const meta = inCompare
    ? `Comparing ${shownTeams.length} team${shownTeams.length === 1 ? '' : 's'}, ${range}, easiest run first.`
    : showMatches
      ? `Every match of ${mdRange(from, to)}.`
      : `${shownTeams.length} of 36 teams, ${range}, ${sortBy === 'avg' ? 'easiest run first' : 'A–Z'}. Tap a team for details.`

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="FDR Table"
        subtitle="How hard every team's Champions League fixtures are, matchday by matchday."
        tools={
          <>
            <IconButton label="How difficulty works" pressed={showInfo} onClick={() => setShowInfo((v) => !v)}>
              <Info size={16} aria-hidden="true" />
            </IconButton>
            <CopyLinkButton />
          </>
        }
      />

      {singleMd && !inCompare && (
        <SubTabs
          label="FDR view"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { id: 'teams', label: 'Teams' },
            { id: 'matches', label: 'Matches' },
          ]}
        />
      )}

      <ControlBar
        tiles={tiles}
        chips={chips}
        onReset={() => setSortBy('avg')}
        shared={{ venue: true, split: true, myTeams: !inCompare }}
      >
        {!inCompare && !showMatches && (
          <button
            type="button"
            onClick={() => openStep('fdrCompare')}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded border border-white/10 px-3 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 hover:text-ucl-star"
          >
            <Scale size={14} aria-hidden="true" />
            Compare
          </button>
        )}
      </ControlBar>

      {showInfo && <DifficultyInfo onClose={() => setShowInfo(false)} />}

      {inCompare && (
        <Suspense fallback={null}>
          <TeamComparison sorted={sorted} mds={mds} onClose={stopComparing} startOpen={compare.length < 2} />
        </Suspense>
      )}

      {!(inCompare && shownTeams.length === 0) && <MetaRow aside={!showMatches && <RatingLegend />}>{meta}</MetaRow>}

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
