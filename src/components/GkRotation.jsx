import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { currentMatchday } from '../data/matchdays.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { useOdds } from '../utils/useOdds.js'
import { teamOddsRows } from '../utils/oddsView.js'
import { expectedStarters, findStoredGoalkeeper, rankGoalkeepers } from '../utils/gkPool.js'
import { useDomesticForm } from '../utils/useDomesticForm.js'
import { compareComplementSummaries, compareTeamFixtures, summarizeComparison } from '../utils/teamComplement.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'
import MdRangePicker from './MdRangePicker.jsx'
import ViewHeading from './ViewHeading.jsx'
import { PRICE_STEP, PriceSlider } from './PriceSlider.jsx'
import { mdRange } from '../utils/mdLabel.js'

const GK_SELECTED_KEY = 'ucl-fdr:gk-selected:v1'
// How many pairs the page opens with, before a keeper is picked.
const PAIRS_SHOWN = 10

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

// What the player sheet knows about a goalkeeper, in one line: minutes first,
// since that's what tells a starter from a back-up.
function sheetFacts(gk) {
  return [
    `${gk.minutes} mins`,
    `${gk.points} pts`,
    gk.ownership != null ? `${gk.ownership}% owned` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function GkRotation() {
  const { teams, teamsByAbbr, venueAdjust } = useTeams()
  const { odds, index, estimator } = useOdds()
  // Every goalkeeper in the player sheet (live, or its saved copy if Google
  // can't be reached — see useLivePlayers.js), most minutes first.
  const { players, loading: gkLoading, live: gkLive } = useLivePlayers()
  const GOALKEEPERS = useMemo(() => rankGoalkeepers(players), [players])
  // One keeper per club in the recommendations: whoever played its last UCL
  // match (see expectedStarters). The match-by-match minutes come with the
  // saved domestic form; until that has loaded, the most UCL minutes decide.
  const domesticForm = useDomesticForm()
  const starters = useMemo(
    () => expectedStarters(GOALKEEPERS, domesticForm?.uclPlayers),
    [GOALKEEPERS, domesticForm],
  )

  // Its own range, deliberately not the FDR Table/Best Runs/Compare one in
  // TeamsContext — narrowing this to plan around one cup week shouldn't
  // silently change what those other views show. Starts at the same floor
  // as every other selector (a matchday that's passed is gone here too) and
  // running to the last matchday, like every other view. It used to stop at
  // MD7 (MD8 is all on one Wednesday, so it can't show a "different day"
  // win), but the one view with a different default, beside an "All 4"
  // preset that didn't match it, read as a bug. MD8's clean sheets still
  // count towards the ranking.
  const [from, setFrom] = useState(() => currentMatchday())
  const [to, setTo] = useState(() => TOTAL_MATCHDAYS)
  const [skipMd, setSkipMd] = useState(null)
  const mds = useVisibleMds(from, to, skipMd)

  function setRange(nextFrom, nextTo) {
    const clampedTo = Math.max(nextFrom, nextTo)
    const stillInside = skipMd != null && skipMd > nextFrom && skipMd < clampedTo
    setFrom(nextFrom)
    setTo(clampedTo)
    if (!stillInside) setSkipMd(null)
  }

  // Kept as stored, not checked against the list: the sheet loads after the
  // first render, so the pick is only resolved (below) once it's there.
  const [selectedId, setSelectedId] = useState(readStoredGkId)
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  // null = no cap. A budget filter on the complement list only — it never
  // affects who you can pick as "your goalkeeper".
  const [maxPrice, setMaxPrice] = useState(null)

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(GK_SELECTED_KEY, selectedId)
      else localStorage.removeItem(GK_SELECTED_KEY)
    } catch {
      // private mode or quota — the pick just won't survive a reload
    }
  }, [selectedId])

  const selectedGk = findStoredGoalkeeper(selectedId, GOALKEEPERS)
  // A pick saved under the old GK sheet's ids is re-saved under the new one.
  useEffect(() => {
    if (selectedGk && selectedGk.id !== selectedId) setSelectedId(selectedGk.id)
  }, [selectedGk, selectedId])

  const priceBounds = useMemo(() => {
    const prices = GOALKEEPERS.map((gk) => gk.price)
    if (!prices.length) return { min: 4, max: 6 }
    return {
      min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
    }
  }, [GOALKEEPERS])

  function clubName(gk) {
    const team = teamsByAbbr[gk.team]
    return team?.shortName ?? team?.name ?? gk.team
  }

  const filteredGks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GOALKEEPERS
    return GOALKEEPERS.filter((gk) => {
      const team = teamsByAbbr[gk.team]
      // Match the full club name and the short one — "Bayern München" and
      // "Bayern" should both find the same goalkeeper.
      const names = [team?.name, team?.shortName, gk.team].filter(Boolean)
      return gk.name.toLowerCase().includes(q) || names.some((n) => n.toLowerCase().includes(q))
    })
  }, [query, teamsByAbbr, GOALKEEPERS])

  function selectGk(id) {
    setSelectedId(id)
    setPickerOpen(false)
    setQuery('')
    setExpandedId(null)
  }

  // Each club's clean-sheet chance per matchday in the range (odds, or the
  // estimate where a match isn't priced yet).
  const csByTeam = useMemo(() => {
    if (!odds) return null
    return new Map(teamOddsRows(teams, mds, index, estimator, 'cs').map((r) => [r.team.abbr, r.cells.map((c) => c?.cs ?? null)]))
  }, [odds, teams, mds, index, estimator])

  // One pairing of two keepers over the range: the fixtures side by side,
  // the FDR facts, and the clean sheets you'd expect starting the better of
  // the two each matchday.
  const pairUp = useCallback(
    (left, right) => {
      const rows = compareTeamFixtures(left.team, right.team, mds, teamsByAbbr, venueAdjust)
      const csA = csByTeam?.get(left.team)
      const csB = csByTeam?.get(right.team)
      const withCs = rows.map((r, i) => ({ ...r, csA: csA?.[i] ?? null, csB: csB?.[i] ?? null }))
      const bestCs = csByTeam ? withCs.reduce((sum, r) => sum + Math.max(r.csA ?? 0, r.csB ?? 0), 0) : null
      // candidate: the name compareComplementSummaries breaks its last tie on.
      return { key: `${left.id}+${right.id}`, left, right, candidate: right, rows: withCs, summary: summarizeComparison(rows), bestCs }
    },
    [mds, teamsByAbbr, venueAdjust, csByTeam],
  )
  const byRotationValue = useCallback(
    (a, b) => (csByTeam ? b.bestCs - a.bestCs : 0) || compareComplementSummaries(a, b),
    [csByTeam],
  )

  // Before a keeper is picked the page answers a question on arrival: the
  // best pairs across all clubs, every expected starter against every other
  // (about 600 pairings, cheap). The price cap applies to both keepers.
  const pairs = useMemo(() => {
    if (selectedGk) return []
    const pool = GOALKEEPERS.filter((gk) => starters.has(gk.id) && (maxPrice == null || gk.price <= maxPrice))
    const out = []
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        if (pool[i].team !== pool[j].team) out.push(pairUp(pool[i], pool[j]))
      }
    }
    return out.sort(byRotationValue).slice(0, PAIRS_SHOWN)
  }, [selectedGk, GOALKEEPERS, starters, maxPrice, pairUp, byRotationValue])

  // Each other club's expected starter, ranked on one list. There used to
  // be two (FDR facts, or clean-sheet odds) behind a switch; now the odds
  // lead, since they are the sharper measure of a clean sheet, and the FDR
  // facts break ties and stay on every row. Without odds (not loaded yet,
  // or none at all) the FDR order is all there is.
  const complements = useMemo(() => {
    if (!selectedGk) return []
    // Not the selected keeper's own club: same fixtures, nothing to rotate.
    return GOALKEEPERS.filter((gk) => starters.has(gk.id))
      .filter((gk) => gk.team !== selectedGk.team)
      .filter((gk) => maxPrice == null || gk.price <= maxPrice)
      .map((gk) => pairUp(selectedGk, gk))
      .sort(byRotationValue)
  }, [selectedGk, maxPrice, GOALKEEPERS, starters, pairUp, byRotationValue])
  const list = selectedGk ? complements : pairs

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="GK Rotation"
        subtitle={`Pick a goalkeeper you own to see who complements their fixtures over ${mdRange(from, to)}${
          skipMd ? ` (ignoring MD${skipMd})` : ''
        }.`}
      />

      <MdRangePicker from={from} to={to} onChange={setRange} skipMd={skipMd} onSkipChange={setSkipMd} className="mb-3" />

      {!gkLoading && !gkLive && GOALKEEPERS.length > 0 && (
        <p className="mb-3 text-[11px] text-ucl-muted">
          Couldn't reach the live player sheet — showing the last saved data.
        </p>
      )}

      <div className="mb-4">
        <p className="mb-1.5 section-label">Your goalkeeper</p>

        {selectedGk && !pickerOpen ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left shadow-card transition hover:bg-white/[0.06] sm:p-3"
          >
            <TeamBadge abbr={selectedGk.team} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold sm:text-base">{selectedGk.name}</p>
              <p className="text-[11px] text-ucl-muted">
                {clubName(selectedGk)} · {formatPrice(selectedGk.price)} · {sheetFacts(selectedGk)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-ucl-link">Change</span>
          </button>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or club..."
              aria-label="Search goalkeeper by name or club"
              autoFocus={pickerOpen}
              className="min-h-[40px] w-full rounded border border-white/10 bg-ucl-deep px-2.5 text-sm text-ucl-star placeholder:text-ucl-star/30"
            />
            {/* With nobody picked yet the pairs below fill the page, so the
                full list waits for a search; changing a pick shows it all. */}
            {(selectedGk || query.trim()) && (
            <div className="max-h-72 overflow-y-auto">
              <ul className="mt-2 space-y-1">
                {filteredGks.map((gk) => (
                  <li key={gk.id}>
                    <button
                      type="button"
                      onClick={() => selectGk(gk.id)}
                      className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left text-sm transition hover:bg-white/5"
                    >
                      <TeamBadge abbr={gk.team} size={22} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          <span className="font-semibold">{gk.name}</span>
                          <span className="text-ucl-muted">
                            {' '}
                            · {clubName(gk)} · {formatPrice(gk.price)}
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-ucl-muted">
                          {sheetFacts(gk)}
                          {!starters.has(gk.id) && ' · back-up'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {filteredGks.length === 0 && (
                  <li className="px-2 py-3 text-center text-xs text-ucl-muted">
                    {GOALKEEPERS.length === 0 && gkLoading ? 'Loading goalkeepers…' : `No goalkeeper matches “${query}”.`}
                  </li>
                )}
              </ul>
            </div>
            )}
          </div>
        )}
      </div>

      {GOALKEEPERS.length > 0 && (
        <>
          <h2 className="mb-1 font-display text-base font-extrabold text-ucl-star sm:text-lg">
            {selectedGk ? `Best complements for ${selectedGk.name}` : `Best rotation pairs, ${mdRange(from, to)}`}
          </h2>
          <p className="mb-3 text-xs text-ucl-muted">
            {!selectedGk && 'Every expected starter paired with every other; pick your goalkeeper above (or from a pair) to see only his partners. '}
            One keeper per club: the one who played its last UCL match. Ranked on the clean sheets you&rsquo;d
            expect by starting the better of the two every matchday (bookmaker odds, estimates where a match
            isn&rsquo;t priced yet); a favourable fixture is FDR band 1&ndash;2 under your current settings.
          </p>

          <PriceSlider bounds={priceBounds} value={maxPrice} onChange={setMaxPrice} />

          {list.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ucl-muted">
              No goalkeeper matches this filter.
            </p>
          )}

          <ul className="space-y-2">
            {list.map(({ key, left, right: gk, rows, summary, bestCs }) => {
              const isOpen = expandedId === key
              return (
                <li key={key} className="rounded-lg border border-white/10 bg-white/[0.03] shadow-card">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-2.5 text-left sm:p-3"
                  >
                    {selectedGk ? (
                      <>
                        <TeamBadge abbr={gk.team} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold sm:text-base">{gk.name}</p>
                          <p className="text-[11px] text-ucl-muted">
                            {clubName(gk)} · {formatPrice(gk.price)} · {sheetFacts(gk)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                          <TeamBadge abbr={left.team} size={26} />
                          <TeamBadge abbr={gk.team} size={26} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold sm:text-base">
                            {left.name} + {gk.name}
                          </p>
                          <p className="truncate text-[11px] text-ucl-muted">
                            {clubName(left)} + {clubName(gk)} · {formatPrice(left.price + gk.price)} together
                          </p>
                        </div>
                      </>
                    )}
                    {isOpen ? (
                      <ChevronUp size={18} aria-hidden="true" className="shrink-0 text-ucl-muted" />
                    ) : (
                      <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-ucl-muted" />
                    )}
                  </button>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 px-2.5 py-2 text-[11px] text-ucl-star/80 sm:px-3">
                    {bestCs != null && (
                      <span title="Clean sheets expected when you start the better of the two every matchday">
                        Best-of CS: <strong className="text-ucl-star">{bestCs.toFixed(1)}</strong>
                      </span>
                    )}
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
                      {!selectedGk && (
                        <div className="mb-1 flex flex-wrap gap-2">
                          {[left, gk].map((k) => (
                            <button
                              key={k.id}
                              type="button"
                              onClick={() => selectGk(k.id)}
                              className="min-h-[36px] rounded border border-white/15 px-2.5 text-xs font-semibold text-ucl-star/85 transition hover:bg-white/10"
                            >
                              I own {k.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <table className="w-full border-separate border-spacing-y-1.5 text-center text-xs">
                        <thead>
                          <tr className="section-label">
                            <th scope="col" className="text-left font-semibold">
                              MD
                            </th>
                            <th scope="col" className="font-semibold">
                              {left.team}
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
                                  <>
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
                                  {row.csA != null && <CsNote cs={row.csA} best={row.csA >= (row.csB ?? 0)} />}
                                  </>
                                ) : (
                                  <span className="text-ucl-star/20">–</span>
                                )}
                              </td>
                              <td>
                                {row.b ? (
                                  <>
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
                                  {row.csB != null && <CsNote cs={row.csB} best={row.csB > (row.csA ?? 0)} />}
                                  </>
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

// A keeper's clean-sheet chance under his fixture chip; the better of the
// two that matchday stands out.
function CsNote({ cs, best }) {
  return (
    <span className={`mt-0.5 block text-[10px] tabular-nums ${best ? 'font-semibold text-ucl-star' : 'text-ucl-muted'}`}>
      CS {Math.round(cs * 100)}%
    </span>
  )
}
