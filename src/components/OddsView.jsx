import { useMemo, useRef, useState } from 'react'
import { ArrowDown, Search, Star } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { MATCHDAY_LABEL } from '../data/matchdays.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { useOdds } from '../utils/useOdds.js'
import { useTeamDetail } from '../utils/useTeamDetail.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { METRICS, compareRows, playerOddsRows, teamOddsRows } from '../utils/oddsView.js'
import MdRangePicker from './MdRangePicker.jsx'
import TeamBadge from './TeamBadge.jsx'
import { PRICE_STEP, PriceSlider } from './PriceSlider.jsx'
import ShowFilter from './ShowFilter.jsx'
import StickyHead from './StickyHead.jsx'
import TeamDetailPanel from './TeamDetailPanel.jsx'
import ViewHeading from './ViewHeading.jsx'

// The bookmakers' view, kept apart from the 1–5 ratings: expected goals
// and clean-sheet chances per team and matchday, and per player his
// chances of a goal or an assist. Matches the bookmakers haven't priced yet
// are estimated (see src/utils/oddsView.js) and drawn dashed and lighter.

const PREVIEW = 60
const pct = (x) => `${Math.round(x * 100)}%`
const chance = (rate) => 1 - Math.exp(-rate)

// One hue for every value, so this never reads like the green-to-red FDR
// colours: more fill = better for a fantasy pick.
function intensity(metric, value) {
  const t =
    metric === 'cs'
      ? (value - 0.05) / 0.45
      : metric === 'xgFor'
        ? (value - 0.6) / 2
        : (1.9 - value) / 1.4
  return Math.min(1, Math.max(0, t))
}
function cellStyle(metric, value, estimated) {
  const t = intensity(metric, value)
  const alpha = (0.08 + 0.72 * t) * (estimated ? 0.75 : 1)
  return {
    backgroundColor: `rgba(67, 97, 255, ${alpha.toFixed(3)})`,
    border: estimated ? '1px dashed rgba(230, 233, 255, 0.35)' : '1px solid transparent',
    color: alpha > 0.35 ? '#ffffff' : 'rgba(230, 233, 255, 0.85)',
  }
}

function formatUpdated(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`flex rounded-lg border border-white/10 p-0.5 text-xs font-semibold ${className}`}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`min-h-[36px] flex-1 whitespace-nowrap rounded px-3 transition ${
            value === id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/60 hover:text-ucl-star'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function OddsGrid({ mds, rows, metric, teamsByAbbr, sortMd, onSortMd, onTeamClick }) {
  const scrollerRef = useRef(null)
  const tableRef = useRef(null)
  const { format, label, better } = METRICS[metric]
  const order = better === 'high' ? 'highest first' : 'lowest first'
  const headerButton = (active) =>
    `inline-flex min-h-[36px] w-full flex-col items-center justify-center rounded px-1 transition ${
      active ? 'bg-white/10 text-ucl-star' : 'hover:bg-white/5 hover:text-ucl-star'
    }`
  const headRow = (
    <tr>
      <th
        scope="col"
        aria-sort={sortMd == null ? (better === 'high' ? 'descending' : 'ascending') : 'none'}
        className="sticky left-0 z-20 min-w-[92px] bg-ucl-deep px-1 py-1 text-left section-label"
      >
        <button
          type="button"
          onClick={() => onSortMd(null)}
          title={`Sort on the average over these matchdays, ${order}`}
          className={`${headerButton(sortMd == null)} !items-start px-1`}
        >
          <span className="flex items-center gap-1">
            Team avg
            {sortMd == null && <ArrowDown size={11} aria-hidden="true" />}
          </span>
        </button>
      </th>
      {mds.map((md) => (
        <th
          key={md}
          scope="col"
          aria-sort={sortMd === md ? (better === 'high' ? 'descending' : 'ascending') : 'none'}
          className="min-w-[62px] bg-ucl-deep px-0.5 py-1 text-center section-label sm:min-w-[76px]"
        >
          <button
            type="button"
            onClick={() => onSortMd(sortMd === md ? null : md)}
            title={sortMd === md ? 'Back to the average' : `Sort on MD${md}, ${order}`}
            className={headerButton(sortMd === md)}
          >
            <span className="flex items-center gap-0.5 leading-tight">
              MD{md}
              {sortMd === md && <ArrowDown size={11} aria-hidden="true" />}
            </span>
            <span className="block text-[9px] font-normal normal-case leading-tight tracking-normal text-ucl-star/35">
              {MATCHDAY_LABEL[md]}
            </span>
          </button>
        </th>
      ))}
      {/* Spare width goes to an empty last column, at any number of
          matchdays, so the cells sit right after the team column (see
          FixtureGrid). */}
      <th aria-hidden="true" className="w-full bg-ucl-deep p-0" />
    </tr>
  )
  return (
    <>
    <StickyHead scrollerRef={scrollerRef} tableRef={tableRef}>
      {headRow}
    </StickyHead>
    <div ref={scrollerRef} className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] shadow-card">
      <table ref={tableRef} className="w-full border-separate border-spacing-0 text-table">
        <caption className="sr-only">
          {label} per team, matchday {mds[0]} to {mds[mds.length - 1]}, sorted {sortMd ? `on matchday ${sortMd}` : 'on the average'},{' '}
          {order}; estimates are marked
        </caption>
        <thead>
          {headRow}
        </thead>
        <tbody>
          {rows.map(({ team, cells, avg }, idx) => (
            <tr
              key={team.id}
              onClick={() => onTeamClick(team)}
              className={`cursor-pointer transition hover:bg-white/[0.06] ${idx % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
            >
              <th scope="row" className="sticky left-0 z-10 border-t border-white/5 bg-ucl-navy px-2 py-1.5 text-left font-normal">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTeamClick(team)
                  }}
                  aria-label={`View ${team.name} details`}
                  className="flex items-center gap-1.5 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ucl-accent"
                >
                  <TeamBadge abbr={team.abbr} size={20} />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold sm:text-table">{team.abbr}</span>
                    {avg != null && (
                      <span className="block text-[10px] font-semibold leading-tight text-ucl-star/60" title={`Average ${label.toLowerCase()} over these matchdays`}>
                        {format(avg)}
                      </span>
                    )}
                  </span>
                  {team.pinned && <Star size={10} className="shrink-0 text-ucl-brass" fill="currentColor" aria-label="My team" />}
                </button>
              </th>
              {cells.map((cell, i) => (
                <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center">
                  {cell ? (
                    <div
                      className="mx-auto flex h-9 w-[58px] flex-col items-center justify-center rounded sm:w-[72px]"
                      style={cellStyle(metric, cell[metric], cell.estimated)}
                      title={`${team.name} ${cell.venue === 'H' ? 'v' : 'at'} ${teamsByAbbr[cell.opp]?.name ?? cell.opp}: ${
                        cell.estimated ? 'estimate' : `odds from ${cell.bookmakers} bookmakers`
                      } — xG ${cell.xgFor.toFixed(2)} for, ${cell.xgAgainst.toFixed(2)} against, clean sheet ${pct(cell.cs)}`}
                    >
                      <span className="text-[9px] font-semibold leading-none opacity-80">
                        {cell.opp} ({cell.venue})
                      </span>
                      <span className="mt-0.5 text-xs font-extrabold leading-none">
                        {format(cell[metric])}
                        {cell.estimated && <span className="sr-only"> (estimate)</span>}
                      </span>
                    </div>
                  ) : (
                    <span className="text-ucl-star/20">–</span>
                  )}
                </td>
              ))}
              <td aria-hidden="true" className="w-full border-t border-white/5 p-0" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  )
}

// Clean sheets aren't a sort: they belong to the team, so sorting players
// on them only stacks whole squads (the Teams view ranks them).
const PLAYER_SORTS = [
  ['ga', 'a goal or an assist', 'goals + assists'],
  ['goal', 'a goal', 'goals'],
  ['assist', 'an assist', 'assists'],
]
const sortValue = {
  ga: (r) => r.xgi,
  goal: (r) => r.xg,
  assist: (r) => r.xa ?? 0,
}

function PlayerOdds({ rows, single, rowsMds, teamsByAbbr }) {
  const scrollerRef = useRef(null)
  const tableRef = useRef(null)
  const { oddsQuery: query, setOddsQuery: setQuery, starred, toggleStar, openTab } = useTeams()
  const [position, setPosition] = useState('ALL')
  const [sortBy, setSortBy] = useState('ga')
  const [showAll, setShowAll] = useState(false)
  const [maxPrice, setMaxPrice] = useState(null)
  const [show, setShow] = useState('all')
  const starredCount = rows.filter((r) => starred.has(r.player.id)).length
  const pinnedCount = rows.filter((r) => teamsByAbbr[r.player.team]?.pinned).length

  const priceBounds = useMemo(() => {
    const prices = rows.map((r) => r.player.price)
    return prices.length
      ? { min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP, max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP }
      : { min: 0, max: 0 }
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => position === 'ALL' || r.player.position === position)
      .filter((r) => maxPrice == null || r.player.price <= maxPrice)
      .filter((r) => show !== 'starred' || starred.has(r.player.id))
      .filter((r) => show !== 'mine' || teamsByAbbr[r.player.team]?.pinned)
      .filter((r) => {
        if (!q) return true
        const team = teamsByAbbr[r.player.team]
        return [r.player.name, team?.name, team?.shortName, r.player.team].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => sortValue[sortBy](b) - sortValue[sortBy](a) || a.player.name.localeCompare(b.player.name))
  }, [rows, position, maxPrice, query, sortBy, teamsByAbbr, show, starred])
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW)

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-semibold text-ucl-star/80">No player prices yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ucl-muted">
          Bookmakers price players in the last days before a matchday; they show up here then.
        </p>
      </div>
    )
  }

  const chip = (active) =>
    `min-h-[36px] rounded px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/70 hover:bg-white/10'
    }`
  // One matchday: chances. Several: expected totals over them.
  const fmt = (rate) => (rate == null ? '–' : single ? pct(chance(rate)) : rate.toFixed(2))
  const csShow = (r) => (single ? pct(r.cs) : r.cs.toFixed(1))
  const head = single
    ? { ga: 'G/A', goal: 'Goal', assist: 'Assist', cs: 'CS' }
    : { ga: 'xG+xA', goal: 'xG', assist: 'xA', cs: 'CS' }

  const headRow = (
    <tr className="section-label bg-ucl-deep">
      <th scope="col" className="w-full py-2 pl-9 pr-2 text-left font-semibold">
        Player
      </th>
      {single && (
        <th scope="col" className="hidden px-1 py-2 text-left font-semibold sm:table-cell">
          vs
        </th>
      )}
      {PLAYER_SORTS.map(([id, oneMatch, total]) => (
        <th key={id} scope="col" className="px-0.5 py-1 text-right font-semibold" aria-sort={sortBy === id ? 'descending' : 'none'}>
          <button
            type="button"
            onClick={() => setSortBy(id)}
            title={single ? `Chance of ${oneMatch}, if he plays` : `Expected ${total} over these matchdays, if he plays`}
            className={`inline-flex min-h-[32px] items-center gap-0.5 rounded px-1.5 ${
              sortBy === id ? 'bg-white/10 text-ucl-star' : 'hover:text-ucl-star'
            }`}
          >
            {head[id]}
            {sortBy === id && <ArrowDown size={10} aria-hidden="true" />}
          </button>
        </th>
      ))}
      <th
        scope="col"
        className="px-2 py-2 text-right font-semibold"
        title={single ? "His team's clean-sheet chance" : "His team's expected clean sheets over these matchdays"}
      >
        {head.cs}
      </th>
    </tr>
  )

  return (
    <>
      {/* What the numbers are, up front: one matchday and several read differently. */}
      <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ucl-muted">
        {single ? (
          <>
            <strong className="text-ucl-star/90">1 matchday</strong>: each player&apos;s chances from the bookmakers&apos;
            odds. Pick more matchdays for expected totals.
          </>
        ) : (
          <>
            <strong className="text-ucl-star/90">{rowsMds} matchdays</strong>: expected goals and assists added up. Only
            the next matchday has odds; later ones are estimated (lighter). Pick 1 matchday for the odds themselves.
          </>
        )}{' '}
        All <strong className="text-ucl-star/80">if he plays</strong>: tap a name to check his minutes.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Position" className="flex rounded-lg border border-white/10 p-0.5">
          {['ALL', ...POSITIONS].map((pos) => (
            <button key={pos} type="button" aria-pressed={position === pos} onClick={() => setPosition(pos)} className={chip(position === pos)}>
              {pos === 'ALL' ? 'All' : pos}
            </button>
          ))}
        </div>
        <ShowFilter
          value={show}
          onChange={setShow}
          options={[
            { id: 'all', label: 'All players' },
            { id: 'starred', label: 'Starred', count: starredCount },
            { id: 'mine', label: 'My teams', count: pinnedCount },
          ]}
        />
      </div>

      <PriceSlider bounds={priceBounds} value={maxPrice} onChange={setMaxPrice} />

      <div className="relative mb-3">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ucl-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player or club"
          aria-label="Search player or club"
          className="min-h-[44px] w-full rounded border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
        />
      </div>

      <StickyHead scrollerRef={scrollerRef} tableRef={tableRef} className="rounded-t-lg">
        {headRow}
      </StickyHead>
      <div ref={scrollerRef} className="overflow-x-auto rounded-lg border border-white/10">
        <table ref={tableRef} className="w-full whitespace-nowrap text-table">
          <caption className="sr-only">
            {single ? 'Chances of a goal or an assist' : 'Expected goals and assists over the matchdays shown'}, if he plays
          </caption>
          <thead>
            {headRow}
          </thead>
          <tbody>
            {visible.map((r) => {
              const m = r.matches[0]
              const tone = r.estimated ? 'text-ucl-star/60' : ''
              return (
                <tr key={r.player.id} className="border-t border-white/5">
                  <th scope="row" className="w-full max-w-0 py-1 pl-0.5 pr-2 text-left font-normal">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={starred.has(r.player.id)}
                        aria-label={starred.has(r.player.id) ? `Unstar ${r.player.name}` : `Star ${r.player.name}`}
                        onClick={() => toggleStar(r.player.id)}
                        className={`flex h-9 w-7 shrink-0 items-center justify-center rounded transition hover:bg-white/10 ${
                          starred.has(r.player.id) ? 'text-ucl-brass' : 'text-ucl-star/25 hover:text-ucl-star/60'
                        }`}
                      >
                        <Star size={14} aria-hidden="true" fill={starred.has(r.player.id) ? 'currentColor' : 'none'} />
                      </button>
                      {/* His name opens him on the Players tab: form, minutes, compare. */}
                      <button
                        type="button"
                        onClick={() => openTab('players', { playersQuery: r.player.name })}
                        title={`${r.player.name} on the Players tab`}
                        className="flex min-w-0 items-center gap-1.5 rounded text-left hover:text-ucl-link"
                      >
                        <TeamBadge abbr={r.player.team} size={18} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold sm:text-table">{r.player.name}</span>
                          <span className="block truncate text-[10px] text-ucl-muted">
                            {/* On a phone the opponent moves in here (no vs column) and the
                                position, which the chips filter on, steps out. */}
                            <span className={single ? 'hidden sm:inline' : ''}>{r.player.position} · </span>€
                            {r.player.price.toFixed(1)}m
                            {single && <span className="sm:hidden"> · {m.opp} ({m.venue})</span>}
                            {!single && ` · ${r.matches.length} match${r.matches.length === 1 ? '' : 'es'}`}
                          </span>
                        </span>
                      </button>
                    </div>
                  </th>
                  {single && (
                    <td className="hidden px-1 py-1.5 text-xs text-ucl-star/80 sm:table-cell">
                      {m.opp} ({m.venue})
                    </td>
                  )}
                  {PLAYER_SORTS.map(([id]) => (
                    <td key={id} className={`px-1.5 py-1.5 text-right text-xs tabular-nums sm:px-2 ${tone} ${sortBy === id ? 'font-semibold' : ''}`}>
                      {fmt(id === 'ga' ? r.xgi : id === 'goal' ? r.xg : r.xa)}
                    </td>
                  ))}
                  <td className={`py-1.5 pl-1.5 pr-2 text-right text-xs tabular-nums ${tone}`}>{csShow(r)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="px-3 py-6 text-center text-xs text-ucl-muted">No players match these filters.</p>}
      </div>

      {filtered.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full rounded border border-white/10 py-2 text-xs font-semibold text-ucl-star/80 hover:bg-white/5"
        >
          {showAll ? 'Show fewer' : `Show all ${filtered.length}`}
        </button>
      )}

    </>
  )
}

export default function OddsView() {
  const {
    teams,
    teamsByAbbr,
    from,
    to,
    skipMd,
    setRange,
    setSkipMd,
    oddsView: view,
    setOddsView: setView,
    oddsMetric: metric,
    setOddsMetric: setMetric,
    oddsSortMd: sortMd,
    setOddsSortMd: setSortMd,
    pinnedCount,
  } = useTeams()
  const [teamsShown, setTeamsShown] = useState('all')
  const { odds, index, estimator } = useOdds()
  const { players } = useLivePlayers()
  const { detailAbbr, openTeam, closeDetail, compareTeam } = useTeamDetail()

  const mds = useVisibleMds(from, to, skipMd)
  // A picked matchday that has left the range sorts on the average again.
  const sortIndex = sortMd == null ? -1 : mds.indexOf(sortMd)
  const shownTeams = teamsShown === 'mine' && pinnedCount > 0 ? teams.filter((t) => t.pinned) : teams
  const rows = useMemo(
    () =>
      [...teamOddsRows(shownTeams, mds, index, estimator, metric)].sort(compareRows(metric, sortIndex < 0 ? null : sortIndex)),
    [shownTeams, mds, index, estimator, metric, sortIndex],
  )
  const playerRows = useMemo(() => playerOddsRows(players, mds, index, estimator), [players, mds, index, estimator])
  const pricedMds = mds.filter((md) => teams.some((t) => index.has(`${md}:${t.abbr}`)))
  const updated = formatUpdated(odds?.updated)

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Odds"
        subtitle="What the bookmakers expect: goals and clean sheets per match, and each player's chance of a goal or an assist. Independent of the 1–5 ratings."
      />

      <div className="mb-3 flex flex-col gap-2">
        <MdRangePicker from={from} to={to} onChange={setRange} skipMd={skipMd} onSkipChange={setSkipMd} />
        <Segmented
          label="Odds view"
          className="sm:max-w-xs"
          value={view}
          onChange={setView}
          options={[
            ['teams', 'Teams'],
            ['players', 'Players'],
          ]}
        />
      </div>

      {!odds ? (
        <p className="py-10 text-center text-sm text-ucl-muted">Loading odds…</p>
      ) : view === 'teams' ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Segmented
              label="Show"
              className="flex-1 sm:max-w-md sm:flex-none"
              value={metric}
              onChange={setMetric}
              options={Object.entries(METRICS).map(([id, m]) => [id, m.label])}
            />
            <ShowFilter
              label="Teams"
              value={teamsShown}
              onChange={setTeamsShown}
              options={[
                { id: 'all', label: 'All teams' },
                { id: 'mine', label: 'My teams', count: pinnedCount },
              ]}
            />
          </div>
          <OddsGrid
            mds={mds}
            rows={rows}
            metric={metric}
            teamsByAbbr={teamsByAbbr}
            sortMd={sortIndex < 0 ? null : sortMd}
            onSortMd={setSortMd}
            onTeamClick={openTeam}
          />
          <div className="mt-3 space-y-1 text-xs text-ucl-muted">
            <p>
              <span className="mr-1 inline-block h-3 w-4 rounded bg-ucl-accent/70 align-middle" aria-hidden="true" />
              Bookmaker odds
              {pricedMds.length ? ` (MD${pricedMds.join(', MD')}${updated ? `, updated ${updated}` : ''})` : ' — none for these matchdays yet'}.
              <span
                className="ml-3 mr-1 inline-block h-3 w-4 rounded border border-dashed border-ucl-star/40 bg-ucl-accent/40 align-middle"
                aria-hidden="true"
              />
              Estimate, until bookmakers price the match (about a week before).
            </p>
            <p>
              Estimates come from {estimator.usesElo ? 'Elo club ratings (clubelo.com) and ' : ''}
              {estimator.matches} priced match{estimator.matches === 1 ? '' : 'es'}, never from the 1–5 ratings, and sharpen
              as more matchdays are priced. More fill = better for a fantasy pick. Tap a matchday to sort on it, a team for
              its details.
            </p>
          </div>
        </>
      ) : (
        <PlayerOdds rows={playerRows} single={mds.length === 1} rowsMds={mds.length} teamsByAbbr={teamsByAbbr} />
      )}

      {detailAbbr && (
        <TeamDetailPanel abbr={detailAbbr} onClose={closeDetail} onCompare={() => compareTeam(detailAbbr)} />
      )}
    </div>
  )
}
