import { useMemo, useRef, useState } from 'react'
import { Star, TrendingUp, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { compareRuns, formatAvg } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { useOdds } from '../utils/useOdds.js'
import { teamOddsRows } from '../utils/oddsView.js'
import { useTeamDetail } from '../utils/useTeamDetail.js'
import TeamBadge from './TeamBadge.jsx'
import ControlBar from './ControlBar.jsx'
import FixtureChip from './FixtureChip.jsx'
import HiddenTeamsPanel from './HiddenTeamsPanel.jsx'
import TeamDetailPanel from './TeamDetailPanel.jsx'
import StickyHead from './StickyHead.jsx'
import MyTeamsEmpty from './MyTeamsEmpty.jsx'
import ViewHeading from './ViewHeading.jsx'
import { mdRange, matchdayRange } from '../utils/mdLabel.js'

const PREVIEW = 8
// What the ranking runs on: the FDR (default), or the bookmakers' clean-sheet
// chances or expected goals for (Odds tab; estimates where not priced yet).
const RANK_BY = [
  ['fdr', 'FDR'],
  ['cs', 'CS'],
  ['xgFor', 'xG'],
]

export default function BestFixtureRuns() {
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
    showMatchday,
    dayFilter,
  } = useTeams()
  const [showAll, setShowAll] = useState(false)
  const [hiddenPanelOpen, setHiddenPanelOpen] = useState(false)
  const [rankBy, setRankBy] = useState('fdr')
  const { detailAbbr, openTeam, closeDetail, compareTeam } = useTeamDetail()
  const { odds, index, estimator } = useOdds()

  const shownTeams = myTeamsOnly ? visibleTeams.filter((t) => t.pinned) : visibleTeams

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(shownTeams, teamsByAbbr, mds, venueAdjust)
  // Each team's average clean-sheet chance and expected goals over the range.
  const oddsAvg = useMemo(() => {
    if (!odds) return null
    const cs = teamOddsRows(shownTeams, mds, index, estimator, 'cs')
    const xg = teamOddsRows(shownTeams, mds, index, estimator, 'xgFor')
    return new Map(cs.map((r, i) => [r.team.id, { cs: r.avg, xgFor: xg[i].avg }]))
  }, [odds, shownTeams, mds, index, estimator])
  const byOdds = rankBy !== 'fdr' && oddsAvg
  const ranked = useMemo(() => {
    if (!byOdds) return [...rows].sort(compareRuns)
    const v = (r) => oddsAvg.get(r.team.id)?.[rankBy] ?? -1
    return [...rows].sort((a, b) => v(b) - v(a) || compareRuns(a, b))
  }, [rows, byOdds, oddsAvg, rankBy])

  // Teams whose selected window is much kinder than their league phase as a
  // whole. This is the insight people screenshot: not "who is easiest", but
  // "whose fixtures turn".
  const swings = useMemo(() => {
    if (mds.length >= TOTAL_MATCHDAYS) return []
    return [...rows]
      .map((r) => ({ ...r, delta: r.seasonAvg - r.avg }))
      .filter((r) => r.delta > 0.3)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
  }, [rows, mds.length])

  const visible = showAll ? ranked : ranked.slice(0, PREVIEW)

  return (
    <div className="mx-auto max-w-5xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Best Fixture Runs"
        subtitle={`${shownTeams.length} teams over ${mdRange(from, to)}${skipMd ? ` (ignoring MD${skipMd})` : ''}, ${
          byOdds ? (rankBy === 'cs' ? 'best clean-sheet odds first' : 'most expected goals first') : 'easiest average first'
        }.`}
        action={
          <div
            role="group"
            aria-label="Rank by"
            className="flex shrink-0 rounded-lg border border-white/10 p-0.5 text-xs font-semibold"
          >
            {RANK_BY.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRankBy(id)}
                aria-pressed={rankBy === id}
                title={id === 'fdr' ? 'Rank by fixture difficulty' : id === 'cs' ? 'Rank by clean-sheet odds' : 'Rank by expected goals (odds)'}
                className={`min-h-[36px] rounded px-3 transition ${
                  rankBy === id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/60 hover:text-ucl-star'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <ControlBar className="mb-3" showMyTeamsFilter />

      {hiddenCount > 0 && (
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

      {!byOdds && swings.length > 0 && (
        <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 flex items-center gap-1.5 section-label">
            <TrendingUp size={14} aria-hidden="true" />
            Biggest swing into this window
          </p>
          <ul className="space-y-1.5">
            {swings.map((s) => (
              <li key={s.team.id} className="flex items-center gap-2 text-xs">
                <TeamBadge abbr={s.team.abbr} size={18} />
                <span className="min-w-0 flex-1 truncate font-semibold">{s.team.name}</span>
                <span className="text-ucl-muted">
                  {formatAvg(s.seasonAvg)} over MD1–{TOTAL_MATCHDAYS} → {formatAvg(s.avg)} here
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visibleTeams.length === 0 ? (
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
      ) : myTeamsOnly && ranked.length === 0 ? (
        <MyTeamsEmpty pinnedCount={pinnedCount} onShowAll={() => setMyTeamsOnly(false)} />
      ) : (
        <RunsTable
          rows={visible}
          mds={mds}
          rankBy={rankBy}
          oddsAvg={byOdds ? oddsAvg : null}
          teamsByAbbr={teamsByAbbr}
          venueAdjust={venueAdjust}
          showMatchday={showMatchday}
          dayFilter={dayFilter}
          onOpen={openTeam}
          onTogglePin={togglePin}
          onHide={hideTeam}
          caption={`Teams ranked by ${
            byOdds ? (rankBy === 'cs' ? 'clean-sheet odds' : 'expected goals') : 'average fixture difficulty'
          }, ${matchdayRange(from, to)}${skipMd ? `, matchday ${skipMd} ignored` : ''}`}
        />
      )}

      {ranked.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 min-h-[44px] w-full rounded border border-white/10 bg-white/5 text-sm font-semibold text-ucl-star/80 transition hover:bg-white/10"
        >
          {showAll ? 'Show top 8 only' : `Show all ${ranked.length} teams`}
        </button>
      )}

      {detailAbbr && (
        <TeamDetailPanel
          abbr={detailAbbr}
          onClose={closeDetail}
          onCompare={() => compareTeam(detailAbbr)}
          onHide={hideTeam}
        />
      )}

      {hiddenPanelOpen && <HiddenTeamsPanel onClose={() => setHiddenPanelOpen(false)} />}
    </div>
  )
}

// The ranking as one table, the way the FDR table already reads: rank, team,
// average, home count, then a chip per matchday under a shared header, with
// a hairline between rows. It used to be a bordered, shadowed card per team,
// three screens of scroll for what fits on one. A row still opens the team,
// and keeps its star and its x.
//
// On a phone the table scrolls sideways like the FDR table, with the team
// column held at the left; the average and home count move under the name
// there, so the chips start as early as they can. On a touch screen the star
// and x are left out of the row (see TeamDetailPanel's onHide): the row
// opens the panel, which has both at full size.
function RunsTable({
  rows,
  mds,
  rankBy,
  oddsAvg,
  teamsByAbbr,
  venueAdjust,
  showMatchday,
  dayFilter,
  onOpen,
  onTogglePin,
  onHide,
  caption,
}) {
  const scrollerRef = useRef(null)
  const tableRef = useRef(null)
  const oddsLabel = rankBy === 'cs' ? 'CS' : 'xG'
  const oddsText = (team) => {
    const o = oddsAvg?.get(team.id)
    if (!o) return null
    return rankBy === 'cs' ? `${Math.round(o.cs * 100)}%` : o.xgFor.toFixed(2)
  }
  const headRow = (
    <tr className="section-label bg-ucl-deep">
      <th scope="col" className="sticky left-0 z-20 bg-ucl-deep py-2 pl-2 pr-1 text-left font-semibold">
        <span className="inline-block w-6 text-center">#</span>
        <span className="ml-8">Team</span>
      </th>
      <th scope="col" className="hidden px-2 py-2 text-right font-semibold sm:table-cell" title="Average fixture difficulty">
        Avg
      </th>
      {oddsAvg && (
        <th
          scope="col"
          className="hidden px-2 py-2 text-right font-semibold sm:table-cell"
          title={rankBy === 'cs' ? 'Clean-sheet chance per match' : 'Expected goals per match'}
        >
          {oddsLabel}
        </th>
      )}
      <th scope="col" className="hidden px-2 py-2 text-right font-semibold sm:table-cell" title="Home matches in the range">
        Home
      </th>
      {mds.map((md) => (
        <th key={md} scope="col" className="px-1 py-2 text-center font-semibold">
          MD{md}
        </th>
      ))}
    </tr>
  )
  return (
    <>
      <StickyHead scrollerRef={scrollerRef} tableRef={tableRef} className="rounded-t-lg">
        {headRow}
      </StickyHead>
      <div ref={scrollerRef} className="overflow-x-auto rounded-lg border border-white/10">
        <table ref={tableRef} className="w-full border-separate border-spacing-0 text-table">
          <caption className="sr-only">{caption}</caption>
          <thead>{headRow}</thead>
          <tbody>
            {rows.map((row, idx) => {
              const { team } = row
              const odds = oddsText(team)
              return (
                <tr key={team.id} onClick={() => onOpen(team)} className="cursor-pointer transition hover:bg-white/[0.06]">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 w-full border-t border-white/5 bg-ucl-navy py-1.5 pl-2 pr-1 text-left font-normal"
                  >
                    <div className="flex min-w-[180px] items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-meta font-extrabold tabular-nums ${
                          idx === 0 ? 'bg-ucl-brass text-ucl-navy' : 'text-ucl-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <TeamBadge abbr={team.abbr} size={22} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(team)
                        }}
                        aria-label={`View ${team.name} details`}
                        className="-my-1.5 flex min-h-[44px] min-w-0 flex-1 flex-col justify-center rounded text-left"
                      >
                        <span className="block truncate font-semibold">{team.name}</span>
                        <span className="block text-meta text-ucl-muted sm:hidden">
                          avg {formatAvg(row.avg)} · {row.homes} home{odds && ` · ${oddsLabel} ${odds}`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTogglePin(team.id)
                        }}
                        aria-label={team.pinned ? `Unpin ${team.name} from My teams` : `Pin ${team.name} to My teams`}
                        aria-pressed={team.pinned}
                        className={`shrink-0 rounded p-1 transition hover:bg-white/10 coarse:hidden ${
                          team.pinned ? 'text-ucl-brass' : 'text-ucl-muted/60 hover:text-ucl-star'
                        }`}
                      >
                        <Star size={14} aria-hidden="true" fill={team.pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onHide(team.id)
                        }}
                        aria-label={`Remove ${team.name} from this ranking`}
                        className="shrink-0 rounded p-1 text-ucl-muted/60 transition hover:bg-white/10 hover:text-ucl-star coarse:hidden"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                  <td className="hidden border-t border-white/5 px-2 py-1.5 text-right font-semibold tabular-nums sm:table-cell">
                    {formatAvg(row.avg)}
                  </td>
                  {oddsAvg && (
                    <td className="hidden border-t border-white/5 px-2 py-1.5 text-right font-semibold tabular-nums sm:table-cell">
                      {odds ?? '–'}
                    </td>
                  )}
                  <td className="hidden border-t border-white/5 px-2 py-1.5 text-right tabular-nums text-ucl-star/75 sm:table-cell">
                    {row.homes}
                  </td>
                  {row.cells.map((f, i) => {
                    return (
                      <td
                        key={mds[i]}
                        className="border-t border-white/5 px-1 py-1.5 text-center"
                      >
                        {f ? (
                          <FixtureChip
                            opp={f.opp}
                            oppName={teamsByAbbr[f.opp]?.name}
                            venue={f.venue}
                            rating={teamsByAbbr[f.opp]?.rating ?? 3}
                            venueAdjust={venueAdjust}
                            awayDifficulty={teamsByAbbr[f.opp]?.awayDifficulty ?? 0}
                            day={f.day}
                            showDay={showMatchday}
                            dimmed={showMatchday && dayFilter !== 'ALL' && f.day !== dayFilter}
                            className="mx-auto"
                          />
                        ) : (
                          <span className="text-ucl-star/20">–</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
