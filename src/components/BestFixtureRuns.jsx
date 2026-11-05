import { useMemo, useState } from 'react'
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
import ViewHeading from './ViewHeading.jsx'

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
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Best Fixture Runs"
        subtitle={`${shownTeams.length} teams over MD${from}–MD${to}${skipMd ? ` (ignoring MD${skipMd})` : ''}, ${
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
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ucl-muted">
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
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">No pinned teams yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-ucl-muted">
            Tap the star on a team's card (or in its detail view) to add it to My teams.
          </p>
          <button
            type="button"
            onClick={() => setMyTeamsOnly(false)}
            className="mt-2 text-sm font-semibold text-ucl-link underline underline-offset-2 hover:text-ucl-star"
          >
            Show all teams
          </button>
        </div>
      ) : (
        <ol className="space-y-2">
          {visible.map((row, idx) => (
            <li
              key={row.team.id}
              onClick={() => openTeam(row.team)}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-3 shadow-card transition hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm font-extrabold ${
                    idx === 0 ? 'bg-ucl-brass text-ucl-navy' : 'bg-white/[0.06] text-ucl-muted'
                  }`}
                >
                  {idx + 1}
                </span>
                <TeamBadge abbr={row.team.abbr} size={30} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openTeam(row.team)
                  }}
                  aria-label={`View ${row.team.name} details`}
                  className="min-w-0 flex-1 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ucl-accent"
                >
                  <p className="truncate text-sm font-semibold sm:text-base">{row.team.name}</p>
                  <p className="text-[11px] text-ucl-muted">
                    avg {formatAvg(row.avg)} · {row.homes} home
                    {oddsAvg?.get(row.team.id) && rankBy !== 'fdr' && (
                      <>
                        {' · '}
                        <strong className="text-ucl-star">
                          {rankBy === 'cs'
                            ? `CS ${Math.round(oddsAvg.get(row.team.id).cs * 100)}%`
                            : `xG ${oddsAvg.get(row.team.id).xgFor.toFixed(2)}`}
                        </strong>{' '}
                        per match
                      </>
                    )}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePin(row.team.id)
                  }}
                  aria-label={row.team.pinned ? `Unpin ${row.team.name} from My teams` : `Pin ${row.team.name} to My teams`}
                  aria-pressed={row.team.pinned}
                  className={`shrink-0 rounded p-1 transition hover:bg-white/10 ${
                    row.team.pinned ? 'text-ucl-brass' : 'text-ucl-muted/60 hover:text-ucl-star'
                  }`}
                >
                  <Star size={16} aria-hidden="true" fill={row.team.pinned ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    hideTeam(row.team.id)
                  }}
                  aria-label={`Remove ${row.team.name} from this ranking`}
                  className="shrink-0 rounded p-1 text-ucl-muted/60 transition hover:bg-white/10 hover:text-ucl-star"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.fixtures.map((f) => (
                  // The MD travels with its own chip (rather than one shared
                  // header above the list) so it survives flex-wrap at any
                  // width and stays correct if a single card gets screenshotted
                  // on its own.
                  <div key={f.gw} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-ucl-muted/70">
                      MD{f.gw}
                    </span>
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
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
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
        <TeamDetailPanel abbr={detailAbbr} onClose={closeDetail} onCompare={() => compareTeam(detailAbbr)} />
      )}

      {hiddenPanelOpen && <HiddenTeamsPanel onClose={() => setHiddenPanelOpen(false)} />}
    </div>
  )
}
