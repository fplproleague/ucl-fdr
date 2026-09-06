import { useEffect, useMemo, useRef } from 'react'
import { Scale, Star, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { currentMatchday } from '../data/matchdays.js'
import { RATING_COLORS } from '../data/teams.js'
import { difficultyBand, effectiveDifficulty, formatAvg, ratingColor } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { findBestWorstRuns } from '../utils/teamRuns.js'
import { compareComplementSummaries, compareTeamFixtures, summarizeComparison } from '../utils/teamComplement.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'
import StrengthPicker from './StrengthPicker.jsx'

// A centred, wide rectangular modal on desktop (the table stays visible and
// dimmed behind it), a full-screen panel on mobile — one set of responsive
// classes gets both, rather than two components. Always the remaining
// league phase (a matchday that's already passed is gone from the whole
// site, not just this panel), independent of whatever MD range the table
// itself is currently showing.
export default function TeamDetailPanel({ abbr, onClose, onCompare }) {
  const { teamsByAbbr, venueAdjust, setRating, togglePin, setCompare, setTab } = useTeams()
  const team = teamsByAbbr[abbr]
  const closeButtonRef = useRef(null)

  const floor = currentMatchday()
  const seasonMds = useMemo(() => Array.from({ length: TOTAL_MATCHDAYS - floor + 1 }, (_, i) => floor + i), [floor])

  useEffect(() => {
    closeButtonRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  // The exact same shared hook the FDR Table, Best Runs and Compare all use
  // — no separate FDR calculation exists for this panel.
  const [row] = useFixtureRows(team ? [team] : [], teamsByAbbr, seasonMds, venueAdjust)

  const cellBands = useMemo(() => {
    if (!row) return []
    return row.cells.map((cell) => {
      if (!cell) return null
      const opponent = teamsByAbbr[cell.opp]
      return difficultyBand(
        effectiveDifficulty(opponent?.rating ?? 3, cell.venue, venueAdjust, opponent?.awayDifficulty ?? 0),
      )
    })
  }, [row, teamsByAbbr, venueAdjust])

  const easyCount = cellBands.filter((b) => b != null && b <= 2).length
  const hardCount = cellBands.filter((b) => b != null && b >= 4).length

  const { best, worst } = useMemo(() => {
    if (!team) return { best: null, worst: null }
    const remaining = (FIXTURES[abbr] ?? []).filter((f) => f.gw >= floor)
    return findBestWorstRuns(remaining, teamsByAbbr, venueAdjust)
  }, [abbr, team, teamsByAbbr, venueAdjust, floor])

  // Same "which other club's schedule complements this one" engine GK
  // Rotation uses, just applied to every team instead of one position.
  const rotationPartners = useMemo(() => {
    if (!team) return []
    return Object.values(teamsByAbbr)
      .filter((t) => t.abbr !== team.abbr && !t.hidden)
      .map((candidate) => {
        const compRows = compareTeamFixtures(team.abbr, candidate.abbr, seasonMds, teamsByAbbr, venueAdjust)
        return { candidate, summary: summarizeComparison(compRows) }
      })
      .sort(compareComplementSummaries)
      .slice(0, 3)
  }, [team, teamsByAbbr, venueAdjust, seasonMds])

  if (!team || !row) return null

  const avgBand = ratingColor(difficultyBand(row.avg))
  const strengthColor = RATING_COLORS[team.rating] ?? RATING_COLORS[3]

  function openRotationPartner(partnerAbbr) {
    setCompare([team.abbr, partnerAbbr])
    setTab('compare')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-detail-heading"
        className="relative flex h-full w-full flex-col overflow-y-auto bg-ucl-navy shadow-2xl sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:border sm:border-white/10"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <TeamBadge abbr={team.abbr} size={36} />
          <h2 id="team-detail-heading" className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">
            {team.name}
          </h2>
          <button
            type="button"
            onClick={() => togglePin(team.id)}
            aria-label={team.pinned ? `Unpin ${team.name} from My teams` : `Pin ${team.name} to My teams`}
            aria-pressed={team.pinned}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 ${
              team.pinned ? 'text-ucl-accent' : 'text-ucl-muted hover:text-ucl-star'
            }`}
          >
            <Star size={20} aria-hidden="true" fill={team.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ucl-muted transition hover:bg-white/10 hover:text-ucl-star"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">Team Strength</p>
              <StrengthPicker team={team} onSetRating={setRating} compact />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">Average FDR</p>
              <span
                className="mt-1 inline-flex rounded-lg px-2.5 py-1 text-sm font-black"
                style={{ backgroundColor: avgBand.bg, color: avgBand.text }}
                title={strengthColor.label}
              >
                {formatAvg(row.avg)}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ucl-muted">
              MD{seasonMds[0]}–MD{seasonMds[seasonMds.length - 1]} fixtures
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(64px, 1fr))' }}>
              {row.cells.map((cell, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-ucl-muted/70">
                    MD{seasonMds[i]}
                  </span>
                  {cell ? (
                    <FixtureChip
                      opp={cell.opp}
                      oppName={teamsByAbbr[cell.opp]?.name}
                      venue={cell.venue}
                      rating={teamsByAbbr[cell.opp]?.rating ?? 3}
                      venueAdjust={venueAdjust}
                      awayDifficulty={teamsByAbbr[cell.opp]?.awayDifficulty ?? 0}
                      day={cell.day}
                      showDay
                    />
                  ) : (
                    <span className="text-ucl-star/20">–</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Best run', run: best },
              { label: 'Worst run', run: worst },
            ].map(({ label, run }) => {
              if (!run) return null
              const runBand = ratingColor(difficultyBand(run.avg))
              return (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-ucl-star">
                    MD{run.fromMd}–MD{run.toMd}
                  </p>
                  <span
                    className="mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-black"
                    style={{ backgroundColor: runBand.bg, color: runBand.text }}
                  >
                    avg {formatAvg(run.avg)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ucl-star/80">
            <span>
              Easy fixtures (≤2):{' '}
              <strong className="text-ucl-star">
                {easyCount}/{row.cells.length}
              </strong>
            </span>
            <span>
              Hard fixtures (≥4):{' '}
              <strong className="text-ucl-star">
                {hardCount}/{row.cells.length}
              </strong>
            </span>
          </div>

          {rotationPartners.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ucl-muted">
                Best rotation partners
              </p>
              <ul className="space-y-1.5">
                {rotationPartners.map(({ candidate, summary }) => (
                  <li key={candidate.abbr}>
                    <button
                      type="button"
                      onClick={() => openRotationPartner(candidate.abbr)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <TeamBadge abbr={candidate.abbr} size={24} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {candidate.shortName ?? candidate.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-ucl-muted">
                        Different days: <strong className="text-ucl-star">{summary.differentDays}/{summary.total}</strong>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onCompare}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-ucl-accent text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <Scale size={16} aria-hidden="true" />
            Compare {team.shortName ?? team.name}
          </button>
        </div>
      </div>
    </div>
  )
}
