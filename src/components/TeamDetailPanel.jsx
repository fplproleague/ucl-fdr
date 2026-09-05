import { useEffect, useMemo, useRef } from 'react'
import { Scale, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { RATING_COLORS } from '../data/teams.js'
import { difficultyBand, effectiveDifficulty, formatAvg, ratingColor } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { findBestWorstRuns } from '../utils/teamRuns.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'

const ALL_MDS = Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => i + 1)

// A centred, wide rectangular modal on desktop (the table stays visible and
// dimmed behind it), a full-screen panel on mobile — one set of responsive
// classes gets both, rather than two components. Always the full league
// phase, independent of whatever MD range the table itself is currently
// showing: this is a team's whole-season profile.
export default function TeamDetailPanel({ abbr, onClose, onCompare }) {
  const { teamsByAbbr, venueAdjust } = useTeams()
  const team = teamsByAbbr[abbr]
  const closeButtonRef = useRef(null)

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
  const [row] = useFixtureRows(team ? [team] : [], teamsByAbbr, ALL_MDS, venueAdjust)

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
    return findBestWorstRuns(FIXTURES[abbr] ?? [], teamsByAbbr, venueAdjust)
  }, [abbr, team, teamsByAbbr, venueAdjust])

  if (!team || !row) return null

  const avgBand = ratingColor(difficultyBand(row.avg))
  const strengthColor = RATING_COLORS[team.rating] ?? RATING_COLORS[3]

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
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">Team Strength</p>
              <span
                className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black"
                style={{ backgroundColor: strengthColor.bg, color: strengthColor.text }}
                title={strengthColor.label}
              >
                {team.rating}
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">Average FDR</p>
              <span
                className="mt-1 inline-flex rounded-lg px-2.5 py-1 text-sm font-black"
                style={{ backgroundColor: avgBand.bg, color: avgBand.text }}
              >
                {formatAvg(row.avg)}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ucl-muted">
              MD1–MD{TOTAL_MATCHDAYS} fixtures
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {row.cells.map((cell, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-ucl-muted/70">
                    MD{ALL_MDS[i]}
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
                {easyCount}/{TOTAL_MATCHDAYS}
              </strong>
            </span>
            <span>
              Hard fixtures (≥4):{' '}
              <strong className="text-ucl-star">
                {hardCount}/{TOTAL_MATCHDAYS}
              </strong>
            </span>
          </div>
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
