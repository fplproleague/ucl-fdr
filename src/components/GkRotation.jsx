import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { GOALKEEPERS } from '../data/goalkeepers.js'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { compareComplementSummaries, compareTeamFixtures, summarizeComparison } from '../utils/gkRotation.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'
import ViewHeading from './ViewHeading.jsx'

const GK_SELECTED_KEY = 'ucl-fdr:gk-selected:v1'

function readStoredGkId() {
  try {
    return localStorage.getItem(GK_SELECTED_KEY)
  } catch {
    return null
  }
}

function formatPrice(price) {
  return `€${price.toFixed(1)}m`
}

export default function GkRotation() {
  const { teamsByAbbr, venueAdjust } = useTeams()
  // Always the full league phase — this finder is about how two teams'
  // schedules relate across the whole season, independent of whatever range
  // the FDR Table/Best Runs/Compare happen to be showing right now.
  const mds = useVisibleMds(1, TOTAL_MATCHDAYS, null)

  const [selectedId, setSelectedId] = useState(() => {
    const stored = readStoredGkId()
    return GOALKEEPERS.some((gk) => gk.id === stored) ? stored : null
  })
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(GK_SELECTED_KEY, selectedId)
      else localStorage.removeItem(GK_SELECTED_KEY)
    } catch {
      // private mode or quota — the pick just won't survive a reload
    }
  }, [selectedId])

  const selectedGk = GOALKEEPERS.find((gk) => gk.id === selectedId) ?? null

  function clubName(gk) {
    const team = teamsByAbbr[gk.team]
    return team?.shortName ?? team?.name ?? gk.team
  }

  const filteredGks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GOALKEEPERS
    return GOALKEEPERS.filter((gk) => {
      const team = teamsByAbbr[gk.team]
      const club = team?.shortName ?? team?.name ?? gk.team
      return gk.name.toLowerCase().includes(q) || club.toLowerCase().includes(q)
    })
  }, [query, teamsByAbbr])

  function selectGk(id) {
    setSelectedId(id)
    setPickerOpen(false)
    setQuery('')
    setExpandedId(null)
  }

  // Every other goalkeeper in the database, ranked by the transparent
  // priority order from the spec — never a combined score.
  const complements = useMemo(() => {
    if (!selectedGk) return []
    return GOALKEEPERS.filter((gk) => gk.id !== selectedGk.id)
      .map((gk) => {
        const rows = compareTeamFixtures(selectedGk.team, gk.team, mds, teamsByAbbr, venueAdjust)
        return { gk, rows, summary: summarizeComparison(rows) }
      })
      .sort(compareComplementSummaries)
  }, [selectedGk, mds, teamsByAbbr, venueAdjust])

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="GK Rotation"
        subtitle="Pick a goalkeeper you own to see who complements their fixtures across the league phase."
      />

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ucl-muted">Your goalkeeper</p>

        {selectedGk && !pickerOpen ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-left shadow-card transition hover:bg-white/[0.06] sm:p-3"
          >
            <TeamBadge abbr={selectedGk.team} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold sm:text-base">{selectedGk.name}</p>
              <p className="text-[11px] text-ucl-muted">
                {clubName(selectedGk)} · {formatPrice(selectedGk.price)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-ucl-accent">Change</span>
          </button>
        ) : (
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
                placeholder="🔍 Search goalkeeper..."
                aria-label="Search goalkeeper"
                autoFocus={pickerOpen}
                className="min-h-[40px] w-full rounded-lg border border-white/10 bg-ucl-deep pl-8 pr-2 text-sm text-ucl-star placeholder:text-ucl-star/30"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              <ul className="space-y-1">
                {filteredGks.map((gk) => (
                  <li key={gk.id}>
                    <button
                      type="button"
                      onClick={() => selectGk(gk.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-white/5"
                    >
                      <TeamBadge abbr={gk.team} size={22} />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{gk.name}</span>
                        <span className="text-ucl-muted">
                          {' '}
                          — {clubName(gk)} — {formatPrice(gk.price)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {filteredGks.length === 0 && (
                  <li className="px-2 py-3 text-center text-xs text-ucl-muted">No goalkeeper matches “{query}”.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {selectedGk && (
        <>
          <h2 className="mb-1 text-base font-bold text-ucl-star sm:text-lg">Best complements for {selectedGk.name}</h2>
          <p className="mb-3 text-xs text-ucl-muted">
            A favourable fixture is band 1–2 (green), under your current FDR settings.
          </p>

          <ul className="space-y-2">
            {complements.map(({ gk, rows, summary }) => {
              const isOpen = expandedId === gk.id
              return (
                <li key={gk.id} className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : gk.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-2.5 text-left sm:p-3"
                  >
                    <TeamBadge abbr={gk.team} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold sm:text-base">{gk.name}</p>
                      <p className="text-[11px] text-ucl-muted">
                        {clubName(gk)} · {formatPrice(gk.price)}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={18} aria-hidden="true" className="shrink-0 text-ucl-muted" />
                    ) : (
                      <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-ucl-muted" />
                    )}
                  </button>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 px-2.5 py-2 text-[11px] text-ucl-star/80 sm:px-3">
                    <span>
                      Different days: <strong className="text-ucl-star">{summary.differentDays}/{summary.total}</strong>
                    </span>
                    <span>
                      ≥1 favourable:{' '}
                      <strong className="text-ucl-star">
                        {summary.atLeastOneFavourable}/{summary.total}
                      </strong>
                    </span>
                    <span>
                      Both favourable: <strong className="text-ucl-star">{summary.bothFavourable}/{summary.total}</strong>
                    </span>
                  </div>

                  {isOpen && (
                    <div className="overflow-x-auto border-t border-white/5 p-2.5 sm:p-3">
                      <table className="w-full border-separate border-spacing-y-1.5 text-center text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide text-ucl-muted">
                            <th scope="col" className="text-left font-semibold">
                              MD
                            </th>
                            <th scope="col" className="font-semibold">
                              {selectedGk.team}
                            </th>
                            <th scope="col" className="font-semibold">
                              {gk.team}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.md}>
                              <td className="text-left text-[11px] font-semibold text-ucl-muted">MD{row.md}</td>
                              <td>
                                {row.a ? (
                                  <FixtureChip
                                    opp={row.a.opp}
                                    oppName={teamsByAbbr[row.a.opp]?.name}
                                    venue={row.a.venue}
                                    rating={teamsByAbbr[row.a.opp]?.rating ?? 3}
                                    venueAdjust={venueAdjust}
                                    awayDifficulty={teamsByAbbr[row.a.opp]?.awayDifficulty ?? 0}
                                    day={row.a.day}
                                    showDay
                                    className="mx-auto"
                                  />
                                ) : (
                                  <span className="text-ucl-star/20">–</span>
                                )}
                              </td>
                              <td>
                                {row.b ? (
                                  <FixtureChip
                                    opp={row.b.opp}
                                    oppName={teamsByAbbr[row.b.opp]?.name}
                                    venue={row.b.venue}
                                    rating={teamsByAbbr[row.b.opp]?.rating ?? 3}
                                    venueAdjust={venueAdjust}
                                    awayDifficulty={teamsByAbbr[row.b.opp]?.awayDifficulty ?? 0}
                                    day={row.b.day}
                                    showDay
                                    className="mx-auto"
                                  />
                                ) : (
                                  <span className="text-ucl-star/20">–</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
