import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ChevronDown, ChevronUp, Info, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES } from '../data/fixtures.js'
import { demoPlayers } from '../data/playersDemo.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { useOdds } from '../utils/useOdds.js'
import { playerOddsRows } from '../utils/oddsView.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import {
  blendForm,
  formPpm,
  leagueMatchesPlayed,
  positionRates,
  projectLeaguePlayer,
  projectPpm,
  relativeScores,
} from '../utils/playerProjection.js'
import { domesticSummary } from '../utils/domesticForm.js'
import { useDomesticForm } from '../utils/useDomesticForm.js'
import { effectiveDifficulty } from '../utils/difficulty.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'
import MdRangePicker from './MdRangePicker.jsx'
import ViewHeading from './ViewHeading.jsx'
import ComparePlayers from './ComparePlayers.jsx'
import ShowFilter from './ShowFilter.jsx'
import { PRICE_STEP, PriceSlider } from './PriceSlider.jsx'
import StickyHead from './StickyHead.jsx'
import { MAX_COMPARE_PLAYERS } from '../utils/urlState.js'
import { mdRange } from '../utils/mdLabel.js'

// How many players a phone compares: three fit side by side without
// scrolling sideways.
const PHONE_COMPARE_PLAYERS = 3

const PREVIEW = 40
// "Differential": owned by at most this share of managers.
const DIFFERENTIAL_MAX = 5

// The form switch. "Domestic" is each club's last few league matches.
const FORM_LABELS = [
  ['ucl', 'UCL'],
  ['domestic', 'Domestic'],
  ['both', 'Both'],
]

// The per-player stats shown in a row's details, in this order, when the
// sheet has them. Saves only mean something for a goalkeeper, clean sheets
// not for a forward.
const STAT_LABELS = [
  ['goals', 'goals', null],
  ['assists', 'assists', null],
  ['cleanSheets', 'clean sheets', ['GK', 'DEF', 'MID']],
  ['saves', 'saves', ['GK']],
  ['ballsRecovered', 'balls recovered', null],
  ['potm', 'POTM', null],
]

// Form and fixtures per player over the selected matchdays, as a relative
// score (see relativeScores for why it isn't shown as points). The FDR table
// answers "whose fixtures are good"; this answers "who do I want for them".
// Same matchday range as every other view.
export default function PlayerProjections() {
  const {
    teamsByAbbr,
    venueAdjust,
    from,
    to,
    skipMd,
    setRange,
    setSkipMd,
    demo,
    comparePlayers,
    setComparePlayers,
    starred,
    toggleStar,
    playersQuery: query,
    setPlayersQuery: setQuery,
    openTab,
    pinnedCount,
  } = useTeams()
  // Picking players and looking at them are two steps: tapping VS only
  // collects players, the comparison opens from the bar. A shared link
  // with players in it opens straight on the comparison.
  const [compareOpen, setCompareOpen] = useState(() => comparePlayers.length > 0)
  const closeCompare = useCallback(() => setCompareOpen(false), [])
  const live = useLivePlayers()
  const domesticForm = useDomesticForm()
  // Both by default: UCL form alone is three or four matches deep.
  const [formSource, setFormSource] = useState('both')
  const [position, setPosition] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState(null)
  const [sortBy, setSortBy] = useState('score')
  const [showAll, setShowAll] = useState(false)
  // One menu for the shortlists: all / starred / my teams / differentials.
  const [show, setShow] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  // A search arriving from another tab (a player's name, a club) opens
  // that player's details when it finds exactly one.
  const [autoOpened, setAutoOpened] = useState(null)
  const tableScrollerRef = useRef(null)
  const tableRef = useRef(null)
  const compareSet = new Set(comparePlayers)
  // A phone fits three players side by side without scrolling sideways.
  const isPhone = useIsPhone()
  const maxCompare = isPhone ? PHONE_COMPARE_PLAYERS : MAX_COMPARE_PLAYERS
  const compareFull = comparePlayers.length >= maxCompare
  const toggleCompare = (id) => {
    if (compareSet.has(id)) setComparePlayers(comparePlayers.filter((x) => x !== id))
    else if (!compareFull) setComparePlayers([...comparePlayers, id])
  }
  const clubMatches = leagueMatchesPlayed()
  // The demo's made-up totals are sized to the matchdays played so far, so
  // their points per match look like real ones.
  const players = useMemo(() => {
    if (demo) return demoPlayers(Math.max(1, clubMatches))
    const saved = domesticForm?.players ?? {}
    const savedUcl = domesticForm?.uclPlayers ?? {}
    return live.players.map((p) =>
      saved[p.id] || savedUcl[p.id] ? { ...p, domestic: saved[p.id], uclGames: savedUcl[p.id] } : p,
    )
  }, [demo, live.players, clubMatches, domesticForm])
  // The switch only appears once there is domestic data to switch to.
  const hasDomestic = players.some((p) => p.domestic?.length)
  const source = hasDomestic ? formSource : 'ucl'
  const mds = useVisibleMds(from, to, skipMd)
  // The bookmakers' view of each player over the same matchdays (Odds tab):
  // in his details and in the comparison.
  const { index: oddsIndex, estimator } = useOdds()
  const oddsById = useMemo(
    () => (demo ? new Map() : new Map(playerOddsRows(players, mds, oddsIndex, estimator).map((r) => [r.player.id, r]))),
    [demo, players, mds, oddsIndex, estimator],
  )
  // Computed over the whole sheet, before any filter: the average a player
  // is pulled towards mustn't change because someone set a price cap.
  const rates = useMemo(() => positionRates(players), [players])
  // Domestic form per player, and its own position averages to pull towards.
  const domestic = useMemo(
    () => new Map(players.map((p) => [p.id, domesticSummary(p.domestic, p.position)]).filter(([, d]) => d)),
    [players],
  )
  const domesticRates = useMemo(
    () =>
      positionRates(
        players.filter((p) => domestic.has(p.id)).map((p) => ({ ...domestic.get(p.id), position: p.position })),
      ),
    [players, domestic],
  )

  // Every player's projection and score first, over the whole sheet: the
  // filters below only hide rows, they never change anyone's score.
  const scored = useMemo(() => {
    const projected = players.map((p) => {
      const fixtures = mds.map((md) => (FIXTURES[p.team] ?? []).find((f) => f.gw === md)).filter(Boolean)
      const difficulties = fixtures.map((f) =>
        effectiveDifficulty(
          teamsByAbbr[f.opp]?.rating ?? 3,
          f.venue,
          venueAdjust,
          teamsByAbbr[f.opp]?.awayDifficulty ?? 0,
        ),
      )
      const ucl = projectLeaguePlayer(p, difficulties, clubMatches, rates[p.position])
      const dom = domestic.get(p.id) ?? null
      const domPpm = dom && formPpm(dom.points, dom.minutes, dom.matches, domesticRates[p.position])
      const ppm = blendForm(source, ucl.ppm, domPpm)
      // The Form column, and what the Form sort orders by: points per match
      // over all his club's matches, so the minutes he didn't play count
      // as zeros. Goals per 90 would put a striker with a 4-goal game and
      // three cameos on top; points per match puts the regulars there.
      const domRaw = dom ? dom.points / dom.matches : null
      const formValue =
        source === 'ucl' ? ucl.rawPpm : source === 'domestic' ? domRaw : blendForm('both', ucl.rawPpm, domRaw)
      return {
        ...p,
        fixtures,
        fixtureAvg: difficulties.length ? difficulties.reduce((s, d) => s + d, 0) / difficulties.length : null,
        ...ucl,
        ...projectPpm(ppm, difficulties, p.price),
        dom,
        formValue,
        formSort: formValue ?? -1,
      }
    })
    const scores = relativeScores(projected)
    return projected.map((p) => ({ ...p, ...scores.get(p.id) }))
  }, [players, mds, teamsByAbbr, venueAdjust, clubMatches, rates, domestic, domesticRates, source])

  // The price slider runs in €0.5m steps from just under the cheapest player
  // to just over the dearest; its top end means "any price".
  const priceBounds = useMemo(() => {
    const prices = players.map((p) => p.price)
    if (!prices.length) return { min: 4, max: 12 }
    return {
      min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
    }
  }, [players])

  const sortKey = { score: 'score', value: 'valueScore', form: 'formSort' }[sortBy]
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scored
      .filter((p) => position === 'ALL' || p.position === position)
      .filter((p) => maxPrice == null || p.price <= maxPrice)
      .filter((p) => show !== 'diff' || (p.ownership != null && p.ownership <= DIFFERENTIAL_MAX))
      .filter((p) => show !== 'starred' || starred.has(p.id))
      .filter((p) => show !== 'mine' || teamsByAbbr[p.team]?.pinned)
      .filter((p) => {
        if (!q) return true
        const team = teamsByAbbr[p.team]
        return [p.name, team?.name, team?.shortName, p.team].some((s) => s?.toLowerCase().includes(q))
      })
      .sort((a, b) => b[sortKey] - a[sortKey] || b.score - a.score || a.price - b.price)
  }, [scored, position, maxPrice, show, starred, query, teamsByAbbr, sortKey])
  useEffect(() => {
    const q = query.trim()
    if (q && rows.length === 1 && autoOpened !== q) {
      setOpenId(rows[0].id)
      setAutoOpened(q)
    }
  }, [query, rows, autoOpened])
  const hasOwnership = players.some((p) => p.ownership != null)
  const starredCount = players.filter((p) => starred.has(p.id)).length

  const visible = showAll ? rows : rows.slice(0, PREVIEW)
  // How many of the filters behind the Filters button are narrowing the list.
  const activeFilters = (maxPrice != null ? 1 : 0) + (show !== 'all' ? 1 : 0)
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr
  const chip = (active) =>
    `min-h-[36px] rounded px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/70 hover:bg-white/10'
    }`

  const dataSource = demo
    ? 'Demo players: made up, named by club and role.'
    : live.live
      ? `Live from the player sheet · ${players.length} players.`
      : `Saved copy of the player sheet · ${players.length} players.`
  const domesticMatches = domesticForm?.matches ?? 5
  // In the order they were picked; an id the current sheet doesn't have
  // (an old link) is skipped.
  const allCompared = useMemo(() => {
    const byId = new Map(scored.map((p) => [p.id, p]))
    return comparePlayers
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => ({ ...p, odds: oddsById.get(p.id) ?? null }))
  }, [scored, comparePlayers, oddsById])
  // A shared link can hold five; a phone shows the first three.
  const compared = allCompared.slice(0, maxCompare)
  const scoreLabel = { ucl: 'Score (UCL form)', domestic: 'Score (league form)', both: 'Score' }[source]
  const withoutDomestic = players.length - domestic.size
  // In the table and in the sticky copy under the site header.
  const headRow = (
    <tr className="section-label bg-ucl-deep">
      {/* w-full + max-w-0 on the name column: it takes whatever the
          number columns leave, and truncates instead of squeezing them. */}
      <th scope="col" className="w-full px-2 py-2 text-left font-semibold">
        Player
      </th>
      <th scope="col" className="hidden px-1 py-2 text-left font-semibold lg:table-cell">
        Fixtures{mds.length > 0 && ` · ${mdRange(mds[0], mds[mds.length - 1])}`}
      </th>
      <th scope="col" className="px-1.5 py-2 text-right font-semibold">
        €m
      </th>
      <th
        scope="col"
        className="px-1.5 py-2 text-right font-semibold"
        title={
          source === 'domestic'
            ? `Points per match in the last ${domesticMatches} league matches (UCL Fantasy rules), goals + assists per 90 below`
            : source === 'both'
              ? 'Average of UCL and domestic points per match, domestic goals + assists per 90 below'
              : 'UCL points per match so far'
        }
      >
        Form
      </th>
      <th
        scope="col"
        className="px-2 py-2 text-right font-semibold"
        title={
          sortBy === 'value'
            ? 'Score per €1m, 100 = best value over these matchdays'
            : 'Form and fixtures, 100 = best player over these matchdays'
        }
      >
        {/* The explanation opens from here. The caveat sits just above the
            table instead (see below): in this header it crowded the column. */}
        <span className="inline-flex items-center gap-1">
          {sortBy === 'value' ? 'Score / €m' : 'Score'}
          <button
            type="button"
            aria-expanded={showInfo}
            aria-controls="players-info"
            onClick={() => setShowInfo(!showInfo)}
            className="-my-2 inline-flex h-8 w-8 items-center justify-center rounded text-ucl-star/60 hover:bg-white/10 hover:text-ucl-star"
          >
            <Info size={13} aria-hidden="true" />
            <span className="sr-only">{showInfo ? 'Hide how the score works' : 'How the score works'}</span>
          </button>
        </span>
      </th>
    </tr>
  )

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Players"
        subtitle={`Form and fixtures per player over ${mdRange(from, to)}${skipMd ? ` (ignoring MD${skipMd})` : ''}.`}
      />

      {demo && (
        <p className="mb-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Demo: these players and their numbers are made up to preview this page.
        </p>
      )}

      {!players.length ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ucl-star/75">
          {live.loading ? 'Loading players…' : 'Players appear here once the player database is connected.'}
        </p>
      ) : (
        <>
          <MdRangePicker
            from={from}
            to={to}
            onChange={setRange}
            skipMd={skipMd}
            onSkipChange={setSkipMd}
            className="mb-3"
          />

          {compareOpen && compared.length > 0 && (
            <ComparePlayers
              players={compared}
              hiddenCount={allCompared.length - compared.length}
              max={maxCompare}
              mds={mds}
              teamsByAbbr={teamsByAbbr}
              venueAdjust={venueAdjust}
              domesticMatches={domesticMatches}
              scoreLabel={scoreLabel}
              onRemove={toggleCompare}
              onClear={() => {
                setComparePlayers([])
                setCompareOpen(false)
              }}
              onClose={closeCompare}
            />
          )}

          {/* One toolbar: what to show (position, form), how to order it, and a
              search. The rest (price cap, shortlists) sits behind Filters,
              closed by default, with a count on the button while any of it
              is narrowing the list. These used to be five full-width rows. */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Position" className="flex rounded-lg border border-white/10 p-0.5">
              {['ALL', ...POSITIONS].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  aria-pressed={position === pos}
                  onClick={() => setPosition(pos)}
                  className={chip(position === pos)}
                >
                  {pos === 'ALL' ? 'All' : pos}
                </button>
              ))}
            </div>
            {hasDomestic && (
              <div role="group" aria-label="Form" className="flex items-center rounded-lg border border-white/10 p-0.5">
                <span className="px-2 section-label">Form</span>
                {FORM_LABELS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={source === id}
                    onClick={() => setFormSource(id)}
                    className={chip(source === id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {/* The order of the list, not a filter on it, so it doesn't look like
                one: no rail and no white fill (All and Both already wear that),
                but a label and an underlined, arrowed choice, the way a sorted
                column head reads. Three white pills side by side read as one
                control. */}
            <div role="group" aria-label="Sort by" className="flex items-center">
              <span aria-hidden="true" className="px-1.5 section-label">
                Sort
              </span>
              {[
                ['score', 'Score'],
                ['value', 'Per €m'],
                ['form', 'Form'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sortBy === id}
                  onClick={() => setSortBy(id)}
                  className={`flex min-h-[36px] items-center gap-0.5 border-b-2 px-2 text-xs font-semibold transition ${
                    sortBy === id
                      ? 'border-ucl-star text-ucl-star'
                      : 'border-transparent text-ucl-star/60 hover:text-ucl-star'
                  }`}
                >
                  {label}
                  {sortBy === id && <ArrowDown size={12} aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ucl-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player or club"
                aria-label="Search player or club"
                className="min-h-[40px] w-full rounded border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
              />
            </div>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="players-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded border px-3 text-xs font-semibold transition ${
                activeFilters > 0
                  ? 'border-white/40 bg-white/10 text-ucl-star'
                  : 'border-white/10 text-ucl-star/70 hover:bg-white/10 hover:text-ucl-star'
              }`}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              Filters{activeFilters > 0 && ` · ${activeFilters}`}
            </button>
          </div>

          {filtersOpen && (
            <div
              id="players-filters"
              className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 p-2"
            >
              <ShowFilter
                value={show}
                onChange={setShow}
                options={[
                  { id: 'all', label: 'All players' },
                  { id: 'starred', label: 'Starred', count: starredCount },
                  { id: 'mine', label: 'My teams', count: pinnedCount },
                  ...(hasOwnership ? [{ id: 'diff', label: `Differentials ≤${DIFFERENTIAL_MAX}%` }] : []),
                ]}
              />
              <PriceSlider bounds={priceBounds} value={maxPrice} onChange={setMaxPrice} className="min-w-[260px] flex-1" />
            </div>
          )}

          {showInfo && (
            <div
              id="players-info"
              className="relative mb-3 space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-ucl-muted"
            >
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Close how the score works"
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded text-ucl-muted transition hover:bg-white/10 hover:text-ucl-star"
              >
                <X size={16} aria-hidden="true" />
              </button>
              <p className="pr-8">
                <span className="font-semibold text-ucl-star/80">Score</span>: form and fixtures, 100 = best for these
                matchdays. <NotAPrediction />
              </p>
              <p>
                <span className="font-semibold text-ucl-star/80">Form</span> is points per match so far, counting the
                matches he didn&rsquo;t play as zeros. The score adds the fixtures in the range and pulls small
                samples towards the average for his position. It doesn&rsquo;t know about injuries, team news or
                expected goals.
              </p>
              {hasDomestic && (
                <p>
                  <span className="font-semibold text-ucl-star/80">Domestic</span> is each club&rsquo;s last{' '}
                  {domesticMatches} league matches
                  {!demo && domesticForm?.updated ? ` (up to ${domesticForm.updated})` : ''}, scored with UCL
                  Fantasy&rsquo;s main rules (appearance, goals, assists, clean sheets, cards), without balls
                  recovered or POTM. <span className="font-semibold text-ucl-star/80">Both</span> counts UCL and
                  domestic form equally.
                  {withoutDomestic > 0 &&
                    ` ${withoutDomestic} players have no domestic data and keep their UCL form.`}
                </p>
              )}
              <p>
                Tap a player for his minutes, points per matchday and league matches. Star players to keep a shortlist
                (saved in this browser), or tap VS on up to {maxCompare} players and then Compare to see them side by
                side (the comparison is in the link, so you can share it). {dataSource}
              </p>
            </div>
          )}

          {/* The caveat, one line above the table at every width, right over
              the Score column it qualifies. */}
          <p className="mb-1.5 text-right text-meta text-ucl-muted">
            Score: form and fixtures, 100 = best for {mdRange(from, to)}. <NotAPrediction />
          </p>

          <StickyHead scrollerRef={tableScrollerRef} tableRef={tableRef} className="rounded-t-lg">
            {headRow}
          </StickyHead>
          <div ref={tableScrollerRef} className="overflow-x-auto rounded-lg border border-white/10">
            <table ref={tableRef} className="w-full whitespace-nowrap text-table">
              <thead>
                {headRow}
              </thead>
              <tbody>
                {visible.map((p) => {
                  const open = openId === p.id
                  const shown = sortBy === 'value' ? p.valueScore : p.score
                  // The player on 100: his score in the heaviest weight.
                  const top = shown >= 99.95
                  const isStarred = starred.has(p.id)
                  const inCompare = compareSet.has(p.id)
                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={`cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04] ${
                          open ? 'bg-white/[0.04]' : ''
                        }`}
                        onClick={() => setOpenId(open ? null : p.id)}
                      >
                        <th scope="row" className="w-full max-w-0 py-1.5 pl-0.5 pr-2 text-left font-normal">
                          <div className="flex min-w-0 items-center">
                            <button
                              type="button"
                              aria-pressed={isStarred}
                              aria-label={isStarred ? `Unstar ${p.name}` : `Star ${p.name}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStar(p.id)
                              }}
                              className={`flex h-9 w-7 shrink-0 items-center justify-center rounded transition hover:bg-white/10 ${
                                isStarred ? 'text-ucl-brass' : 'text-ucl-star/25 hover:text-ucl-star/60'
                              }`}
                            >
                              <Star size={15} aria-hidden="true" fill={isStarred ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              type="button"
                              aria-pressed={inCompare}
                              disabled={!inCompare && compareFull}
                              aria-label={inCompare ? `Remove ${p.name} from compare` : `Compare ${p.name}`}
                              title={
                                inCompare
                                  ? 'Remove from compare'
                                  : compareFull
                                    ? `Compare holds ${maxCompare} players`
                                    : 'Add to compare'
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCompare(p.id)
                              }}
                              className="mr-1 flex h-9 w-7 shrink-0 items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <span
                                aria-hidden="true"
                                className={`rounded border px-1 py-[1px] text-[9px] font-extrabold leading-none tracking-tight ${
                                  inCompare
                                    ? 'border-ucl-select bg-ucl-select text-ucl-selectInk'
                                    : 'border-ucl-star/30 text-ucl-star/55'
                                }`}
                              >
                                VS
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-expanded={open}
                              className="flex w-full min-w-0 items-center gap-2 text-left"
                            >
                              <TeamBadge abbr={p.team} size={22} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-table font-semibold">{p.name}</span>
                                <span className="block truncate text-[11px] text-ucl-muted">
                                  {/* Minutes live in the details: this line stays short. */}
                                  {p.position} · {nameOf(p.team)}
                                  {p.ownership != null && ` · ${p.ownership}% owned`}
                                </span>
                              </span>
                              {open ? (
                                <ChevronUp
                                  size={14}
                                  className="hidden shrink-0 text-ucl-muted sm:block"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ChevronDown
                                  size={14}
                                  className="hidden shrink-0 text-ucl-muted sm:block"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          </div>
                        </th>
                        <td className="hidden px-1 py-1.5 lg:table-cell">
                          <Fixtures
                            fixtures={p.fixtures}
                            teamsByAbbr={teamsByAbbr}
                            venueAdjust={venueAdjust}
                            wrap={false}
                          />
                        </td>
                        <td className="px-1.5 py-1.5 text-right tabular-nums">{p.price.toFixed(1)}</td>
                        <td className="px-1.5 py-1.5 text-right tabular-nums text-ucl-star/75">
                          {p.formValue == null ? '–' : p.formValue.toFixed(1)}
                          {source !== 'ucl' && (
                            <span className="block text-[10px] text-ucl-muted">{formatGa90(p.dom)} G+A</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <ScoreValue value={shown} highlight={top} />
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-white/[0.04]">
                          {/* The details sit in a panel of their own (the 8px
                              container radius), so they read as belonging to
                              the row above and not as more table. */}
                          <td colSpan={5} className="whitespace-normal px-2 pb-3 pt-1">
                            <div className="rounded-lg border border-white/10 bg-ucl-navy/60 p-3">
                              <PlayerDetails
                                player={p}
                                odds={oddsById.get(p.id)}
                                onOpenOdds={() => openTab('odds', { oddsView: 'players', oddsQuery: p.name })}
                                teamsByAbbr={teamsByAbbr}
                                venueAdjust={venueAdjust}
                                league={demo ? 'league' : domesticForm?.leagues?.[p.team]}
                                clubMatches={clubMatches}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-ucl-muted">
                      No players match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-2 min-h-[40px] w-full rounded bg-white/5 text-xs font-semibold text-ucl-star/80 hover:bg-white/10"
            >
              {showAll ? 'Show fewer' : `Show all ${rows.length}`}
            </button>
          )}
          {compared.length > 0 && !compareOpen && (
            // Follows the list while scrolling: pick players anywhere in it,
            // then open them side by side from here.
            <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-3 flex justify-center sm:bottom-4">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-ucl-navy/95 p-1 pl-2 shadow-card backdrop-blur-md">
                <span className="flex -space-x-1.5" aria-hidden="true">
                  {compared.map((p) => (
                    <span key={p.id} className="rounded bg-ucl-navy p-0.5">
                      <TeamBadge abbr={p.team} size={20} />
                    </span>
                  ))}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {compared.length}/{maxCompare}
                </span>
                <button
                  type="button"
                  disabled={compared.length < 2}
                  onClick={() => setCompareOpen(true)}
                  className="min-h-[36px] rounded bg-ucl-select text-ucl-selectInk px-3 text-xs font-semibold disabled:bg-white/10 disabled:text-ucl-star/60"
                >
                  {compared.length < 2 ? 'Pick 1 more' : 'Compare'}
                </button>
                <button
                  type="button"
                  onClick={() => setComparePlayers([])}
                  aria-label="Clear the comparison"
                  className="min-h-[36px] rounded px-2.5 text-xs font-semibold text-ucl-star/70 hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// G+A per 90 in the table, or a dash: no domestic data, or under half the
// minutes he could have played (a cameo goal isn't a rate worth showing).
const formatGa90 = (dom) => (dom?.ga90 == null || dom.minutes < dom.matches * 45 ? '–' : dom.ga90.toFixed(2))

// The score as a number, right-aligned like the price and form beside it,
// with a 2px rule under it as long as the score. It used to be a filled bar
// with the number printed on it as well: the same value twice, and a column
// that read as a row of progress bars. The rule keeps the glance; the
// number is the reading. The player on 100 gets his number in 800.
export function ScoreValue({ value, highlight = false }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <span className="ml-auto block w-10 sm:w-20">
      <span className={`block text-right tabular-nums ${highlight ? 'font-extrabold text-ucl-star' : 'font-semibold'}`}>
        {Math.round(pct)}
      </span>
      {/* 2px at 60% white on a barely-there track: at the old white/70 on
          white/15 the two were too close to read as a length. */}
      <span aria-hidden="true" className="mt-1 block h-0.5 bg-white/[0.06]">
        <span className="block h-full bg-white/60" style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}


// One line in the table (the name column would otherwise squeeze the chips
// into a stack).
function Fixtures({ fixtures, teamsByAbbr, venueAdjust, wrap = true }) {
  return (
    <div className={`flex gap-1 ${wrap ? 'flex-wrap' : ''}`}>
      {fixtures.map((f) => (
        <FixtureChip
          key={f.gw}
          opp={f.opp}
          oppName={teamsByAbbr[f.opp]?.name}
          venue={f.venue}
          rating={teamsByAbbr[f.opp]?.rating ?? 3}
          venueAdjust={venueAdjust}
          awayDifficulty={teamsByAbbr[f.opp]?.awayDifficulty ?? 0}
        />
      ))}
    </div>
  )
}

// Under Tailwind's sm breakpoint (640px): the phone layout.
function useIsPhone() {
  const query = '(max-width: 639px)'
  const [phone, setPhone] = useState(() => {
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    let mq
    try {
      mq = window.matchMedia(query)
    } catch {
      return undefined
    }
    const onChange = () => setPhone(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return phone
}

// What's behind the numbers, in three columns that use the row's width
// (stacked on a phone): what's next, what he has done in the UCL, and his
// league form. It used to be six stacked blocks down the left edge, with
// minutes in a block of their own and the fixtures listed twice on a phone
// (once with odds, once without). Now each match is one line: the fixture
// and his goal-or-assist chance side by side; minutes sit in the heading of
// the competition they belong to.
function PlayerDetails({ player, odds, onOpenOdds, teamsByAbbr, venueAdjust, league, clubMatches }) {
  // Balls recovered is left out: it's the longest label and the smallest
  // points source; the Odds and Compare views still have it.
  const stats = STAT_LABELS.filter(
    ([field, , positions]) =>
      field !== 'ballsRecovered' && player.stats?.[field] != null && (!positions || positions.includes(player.position)),
  )
  const oddsByMd = new Map((odds?.matches ?? []).map((m) => [m.md, m]))
  const pct = (part, whole) => (whole > 0 ? ` (${Math.round((part / whole) * 100)}%)` : '')
  const first = player.fixtures[0]?.gw
  const last = player.fixtures[player.fixtures.length - 1]?.gw
  return (
    <div className="grid gap-x-6 gap-y-4 pt-1 md:grid-cols-3">
      {player.fixtures.length > 0 && (
        <section>
          <DetailHeading
            title={`Next · ${mdRange(first, last)}`}
            aside={
              odds && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenOdds()
                  }}
                  className="-my-2 min-h-[32px] rounded px-1.5 font-semibold normal-case tracking-normal text-ucl-link hover:bg-white/10"
                >
                  Odds →
                </button>
              )
            }
          />
          <ul className="space-y-1">
            {player.fixtures.map((f) => {
              const m = oddsByMd.get(f.gw)
              return (
                <li key={f.gw} className="flex items-center gap-2 text-xs">
                  <span className="w-8 shrink-0 text-meta text-ucl-muted">MD{f.gw}</span>
                  <FixtureChip
                    opp={f.opp}
                    oppName={teamsByAbbr[f.opp]?.name}
                    venue={f.venue}
                    rating={teamsByAbbr[f.opp]?.rating ?? 3}
                    venueAdjust={venueAdjust}
                    awayDifficulty={teamsByAbbr[f.opp]?.awayDifficulty ?? 0}
                  />
                  {m && (
                    <span
                      className="tabular-nums text-ucl-star/80"
                      title={`Bookmaker odds, if he plays: xG ${m.xg.toFixed(2)}${
                        m.xa != null ? `, xA ${m.xa.toFixed(2)}` : ''
                      }${m.estimated ? ' (estimate until the match is priced)' : ''}`}
                    >
                      <span className="font-semibold text-ucl-star">
                        {Math.round((1 - Math.exp(-(m.xg + (m.xa ?? 0)))) * 100)}%
                      </span>{' '}
                      goal or assist{m.estimated && <span className="text-ucl-muted"> · est.</span>}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <DetailHeading
          title="UCL so far"
          aside={`${player.minutes}/${clubMatches * 90} min${pct(player.minutes, clubMatches * 90)}`}
        />
        {player.form?.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {player.form.map((f) => (
              <span
                key={f.md}
                className="inline-flex min-w-[40px] flex-col items-center rounded bg-white/5 px-1.5 py-1 text-xs"
              >
                <span className="text-[10px] text-ucl-muted">MD{f.md}</span>
                <span className="font-semibold tabular-nums">{f.points}</span>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-ucl-star/80">
          {[player.apps != null && plural(player.apps, 'app'), ...stats.map(([field, label]) => `${player.stats[field]} ${label}`)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </section>

      {player.dom && (
        <section>
          <DetailHeading
            title={`${league ?? 'League'} · last ${player.dom.matches}`}
            aside={`${player.dom.minutes}/${player.dom.matches * 90} min`}
          />
          <ul className="mb-1.5 space-y-0.5">
            {player.domestic.map((g) => (
              <li
                key={`${g.d}-${g.opp}`}
                title={g.d}
                className={`flex items-baseline gap-2 text-xs ${g.min ? '' : 'text-ucl-muted'}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {g.v === 'H' ? 'v' : '@'} {g.opp}
                </span>
                <span className="w-9 text-right tabular-nums">{g.min}&prime;</span>
                <span className="w-10 text-right tabular-nums">
                  {g.g || g.a ? [g.g && `${g.g}G`, g.a && `${g.a}A`].filter(Boolean).join(' ') : '–'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ucl-star/80">
            {plural(player.dom.goals, 'goal')} · {plural(player.dom.assists, 'assist')}
            {player.dom.ga90 != null && ` · ${player.dom.ga90.toFixed(2)} G+A per 90`}
          </p>
        </section>
      )}
    </div>
  )
}

// A column's heading in a player's details, with a figure on the right.
function DetailHeading({ title, aside }) {
  return (
    <p className="mb-1.5 flex items-baseline justify-between gap-2 border-b border-white/10 pb-1 section-label">
      <span className="truncate">{title}</span>
      {aside && <span className="shrink-0 normal-case tracking-normal text-ucl-star/70">{aside}</span>}
    </p>
  )
}

// "Not a points prediction": kept wherever the score is explained, because
// a 0-100 number beside fixtures is easy to read as expected points.
function NotAPrediction() {
  return (
    <mark className="whitespace-nowrap rounded bg-amber-300/15 px-1 font-semibold text-amber-100">
      Not a points prediction
    </mark>
  )
}
