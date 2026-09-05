import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { MATCHDAY_LABEL } from '../data/matchdays.js'
import { difficultyBand, formatAvg, ratingColor } from '../utils/difficulty.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'

const TEAM_COL = 122

// The single scrolling surface used by both the FDR table and Compare.
// Everything — matchday headers, every team's row — lives inside one
// overflow container, so one swipe moves the lot and the labels can never
// drift out of sync with the cells they label.
export default function FixtureGrid({ mds, rows, fullNames = false, showAvg = true, onRemove, caption }) {
  const { teamsByAbbr, venueAdjust, showMatchday, dayFilter } = useTeams()
  const scrollerRef = useRef(null)
  const [atEnd, setAtEnd] = useState(true)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => {
      const overflow = el.scrollWidth - el.clientWidth
      setScrollable(overflow > 8)
      setAtEnd(el.scrollLeft >= overflow - 8)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [mds.length, rows.length])

  return (
    <>
      <div className="relative">
        <div ref={scrollerRef} className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
          <table className="w-full border-separate border-spacing-0 text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-ucl-deep px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ucl-muted"
                  style={{ minWidth: TEAM_COL, width: TEAM_COL }}
                >
                  Team
                </th>
                {mds.map((md) => (
                  <th
                    key={md}
                    scope="col"
                    className="min-w-[56px] bg-ucl-deep px-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-ucl-muted sm:min-w-[72px]"
                  >
                    <span className="block leading-tight">MD{md}</span>
                    <span className="block text-[9px] font-medium normal-case leading-tight text-ucl-star/35">
                      {MATCHDAY_LABEL[md]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ team, cells, avg }, idx) => {
                const band = ratingColor(difficultyBand(avg))
                return (
                  <tr key={team.id} className={idx % 2 === 0 ? 'bg-white/[0.015]' : ''}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-t border-white/5 bg-ucl-navy px-2 py-1.5 text-left font-normal"
                      style={{ minWidth: TEAM_COL, width: TEAM_COL }}
                    >
                      <div className="flex items-center gap-1.5">
                        <TeamBadge abbr={team.abbr} size={20} />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold sm:text-sm">
                            {fullNames ? team.name : (team.shortName ?? team.name)}
                          </span>
                          {showAvg && (
                            <span
                              className="mt-0.5 inline-block rounded px-1 py-px text-[10px] font-black leading-tight"
                              style={{ backgroundColor: band.bg, color: band.text }}
                              title="Average fixture difficulty over the selected matchdays"
                            >
                              {formatAvg(avg)}
                            </span>
                          )}
                        </div>
                        {onRemove && (
                          <button
                            type="button"
                            onClick={() => onRemove(team.id)}
                            aria-label={`Remove ${team.name} from the table`}
                            className="shrink-0 rounded p-0.5 text-ucl-muted/60 transition hover:bg-white/10 hover:text-ucl-star"
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </th>
                    {cells.map((cell, i) => (
                      <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center">
                        {cell ? (
                          <FixtureChip
                            opp={cell.opp}
                            oppName={teamsByAbbr[cell.opp]?.name}
                            venue={cell.venue}
                            rating={teamsByAbbr[cell.opp]?.rating ?? 3}
                            venueAdjust={venueAdjust}
                            awayDifficulty={teamsByAbbr[cell.opp]?.awayDifficulty ?? 0}
                            day={cell.day}
                            showDay={showMatchday}
                            dimmed={showMatchday && dayFilter !== 'ALL' && cell.day !== dayFilter}
                            className="mx-auto"
                          />
                        ) : (
                          <span className="text-ucl-star/20">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {scrollable && !atEnd && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl bg-gradient-to-l from-ucl-navy to-transparent"
          />
        )}
      </div>

      {scrollable && !atEnd && (
        <p className="mt-2 text-center text-[11px] font-medium text-ucl-muted">Swipe the table for later matchdays →</p>
      )}
    </>
  )
}
