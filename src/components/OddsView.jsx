import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { MATCHDAY_LABEL } from '../data/matchdays.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { METRICS, compareRows, fitEstimator, indexOdds, playerOddsRows, teamOddsRows } from '../utils/oddsView.js'
import MdRangePicker from './MdRangePicker.jsx'
import TeamBadge from './TeamBadge.jsx'
import { PRICE_STEP, PriceSlider } from './PlayerProjections.jsx'
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
    <div role="group" aria-label={label} className={`flex rounded-full border border-white/10 bg-white/5 p-0.5 text-xs font-semibold ${className}`}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`min-h-[36px] flex-1 whitespace-nowrap rounded-full px-3 transition ${
            value === id ? 'bg-ucl-accent text-white' : 'text-ucl-star/60 hover:text-ucl-star'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function OddsGrid({ mds, rows, metric, teamsByAbbr, sortMd, onSortMd }) {
  const { format, label, better } = METRICS[metric]
  const order = better === 'high' ? 'highest first' : 'lowest first'
  const headerButton = (active) =>
    `inline-flex min-h-[36px] w-full flex-col items-center justify-center rounded-md px-1 transition ${
      active ? 'bg-ucl-accent/20 text-ucl-star' : 'hover:bg-white/5 hover:text-ucl-star'
    }`
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          {label} per team, matchday {mds[0]} to {mds[mds.length - 1]}, sorted {sortMd ? `on matchday ${sortMd}` : 'on the average'},{' '}
          {order}; estimates are marked
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              aria-sort={sortMd == null ? (better === 'high' ? 'descending' : 'ascending') : 'none'}
              className="sticky left-0 z-20 min-w-[92px] bg-ucl-deep px-1 py-1 text-left text-xs font-semibold uppercase tracking-wide text-ucl-muted"
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
                className="min-w-[62px] bg-ucl-deep px-0.5 py-1 text-center text-xs font-semibold uppercase tracking-wide text-ucl-muted sm:min-w-[76px]"
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
                  <span className="block text-[9px] font-medium normal-case leading-tight text-ucl-star/35">
                    {MATCHDAY_LABEL[md]}
                  </span>
                </button>
              </th>
            ))}
            {mds.length < 4 && <th aria-hidden="true" className="w-full bg-ucl-deep p-0" />}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, cells, avg }, idx) => (
            <tr key={team.id} className={idx % 2 === 0 ? 'bg-white/[0.015]' : ''}>
              <th scope="row" className="sticky left-0 z-10 border-t border-white/5 bg-ucl-navy px-2 py-1.5 text-left font-normal">
                <div className="flex items-center gap-1.5">
                  <TeamBadge abbr={team.abbr} size={20} />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold sm:text-sm">{team.abbr}</span>
                    {avg != null && (
                      <span className="block text-[10px] font-bold leading-tight text-ucl-star/60" title={`Average ${label.toLowerCase()} over these matchdays`}>
                        {format(avg)}
                      </span>
                    )}
                  </span>
                </div>
              </th>
              {cells.map((cell, i) => (
                <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center">
                  {cell ? (
                    <div
                      className="mx-auto flex h-9 w-[58px] flex-col items-center justify-center rounded-md sm:w-[72px]"
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
              {mds.length < 4 && <td aria-hidden="true" className="w-full border-t border-white/5 p-0" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function PlayerOdds({ rows, single, teamsByAbbr }) {
  const [position, setPosition] = useState('ALL')
  const [sortBy, setSortBy] = useState('ga')
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState(null)

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
      .filter((r) => {
        if (!q) return true
        const team = teamsByAbbr[r.player.team]
        return [r.player.name, team?.name, team?.shortName, r.player.team].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => sortValue[sortBy](b) - sortValue[sortBy](a) || a.player.name.localeCompare(b.player.name))
  }, [rows, position, maxPrice, query, sortBy, teamsByAbbr])
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW)

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-semibold text-ucl-star/80">No player prices yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ucl-muted">
          Bookmakers price players in the last days before a matchday; they show up here then.
        </p>
      </div>
    )
  }

  const chip = (active) =>
    `min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
    }`
  // One matchday: chances. Several: expected totals over them.
  const show = (rate) => (rate == null ? '–' : single ? pct(chance(rate)) : rate.toFixed(2))
  const csShow = (r) => (single ? pct(r.cs) : r.cs.toFixed(1))
  const head = single
    ? { ga: 'G/A', goal: 'Goal', assist: 'Assist', cs: 'CS' }
    : { ga: 'xG+xA', goal: 'xG', assist: 'xA', cs: 'CS' }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Position" className="flex rounded-lg bg-white/5 p-0.5">
          {['ALL', ...POSITIONS].map((pos) => (
            <button key={pos} type="button" aria-pressed={position === pos} onClick={() => setPosition(pos)} className={chip(position === pos)}>
              {pos === 'ALL' ? 'All' : pos}
            </button>
          ))}
        </div>
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
          className="min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full whitespace-nowrap text-sm">
          <caption className="sr-only">
            {single ? 'Chances of a goal or an assist' : 'Expected goals and assists over the matchdays shown'}, if he plays
          </caption>
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ucl-muted">
            <tr>
              <th scope="col" className="w-full px-2 py-2 text-left font-semibold">
                Player
              </th>
              {single && (
                <th scope="col" className="px-1 py-2 text-left font-semibold">
                  vs
                </th>
              )}
              {PLAYER_SORTS.map(([id, oneMatch, total]) => (
                <th key={id} scope="col" className="px-0.5 py-1 text-right font-semibold" aria-sort={sortBy === id ? 'descending' : 'none'}>
                  <button
                    type="button"
                    onClick={() => setSortBy(id)}
                    title={single ? `Chance of ${oneMatch}, if he plays` : `Expected ${total} over these matchdays, if he plays`}
                    className={`inline-flex min-h-[32px] items-center gap-0.5 rounded px-1.5 uppercase tracking-wider ${
                      sortBy === id ? 'bg-ucl-accent/20 text-ucl-star' : 'hover:text-ucl-star'
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
          </thead>
          <tbody>
            {visible.map((r) => {
              const m = r.matches[0]
              const tone = r.estimated ? 'text-ucl-star/60' : ''
              return (
                <tr key={r.player.id} className="border-t border-white/5">
                  <th scope="row" className="w-full max-w-0 py-1.5 pl-2 pr-2 text-left font-normal">
                    <div className="flex items-center gap-1.5">
                      <TeamBadge abbr={r.player.team} size={18} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold sm:text-sm">{r.player.name}</span>
                        <span className="block truncate text-[10px] text-ucl-muted">
                          {r.player.position} · €{r.player.price.toFixed(1)}m
                          {!single && ` · ${r.matches.length} match${r.matches.length === 1 ? '' : 'es'}`}
                        </span>
                      </span>
                    </div>
                  </th>
                  {single && (
                    <td className="px-1 py-1.5 text-xs text-ucl-star/80">
                      {m.opp} ({m.venue})
                    </td>
                  )}
                  {PLAYER_SORTS.map(([id]) => (
                    <td key={id} className={`px-2 py-1.5 text-right text-xs tabular-nums ${tone} ${sortBy === id ? 'font-bold' : ''}`}>
                      {show(id === 'ga' ? r.xgi : id === 'goal' ? r.xg : r.xa)}
                    </td>
                  ))}
                  <td className={`px-2 py-1.5 text-right text-xs tabular-nums ${tone}`}>{csShow(r)}</td>
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
          className="mt-3 w-full rounded-full border border-white/10 py-2 text-xs font-semibold text-ucl-star/80 hover:bg-white/5"
        >
          {showAll ? 'Show fewer' : `Show all ${filtered.length}`}
        </button>
      )}

      <div className="mt-3 space-y-1 text-xs text-ucl-muted">
        <p>
          All <strong className="text-ucl-star/80">if he plays</strong>: anytime-scorer bets are void for a player who
          doesn&apos;t, so check his minutes on the Players tab.
        </p>
        <p>
          Bookmakers price players only for the next matchday, a few days before it. Lighter rows include later
          matchdays, estimated from his share of his team&apos;s goals in the matches already priced.
        </p>
      </div>
    </>
  )
}

export default function OddsView() {
  const { teams, teamsByAbbr, from, to, skipMd, setRange, setSkipMd } = useTeams()
  const [view, setView] = useState('teams')
  const [metric, setMetric] = useState('cs')
  const [sortMd, setSortMd] = useState(null)
  const [odds, setOdds] = useState(null)
  const { players } = useLivePlayers()

  // The archive grows with every matchday: loaded with the tab, not with
  // the site.
  useEffect(() => {
    let cancelled = false
    import('../data/odds.js').then(({ ODDS }) => {
      if (!cancelled) setOdds(ODDS)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const mds = useVisibleMds(from, to, skipMd)
  const index = useMemo(() => indexOdds(odds), [odds])
  const estimator = useMemo(() => fitEstimator(odds, (abbr) => teamsByAbbr[abbr]?.rating ?? 3), [odds, teamsByAbbr])
  // A picked matchday that has left the range sorts on the average again.
  const sortIndex = sortMd == null ? -1 : mds.indexOf(sortMd)
  const rows = useMemo(
    () => [...teamOddsRows(teams, mds, index, estimator, metric)].sort(compareRows(metric, sortIndex < 0 ? null : sortIndex)),
    [teams, mds, index, estimator, metric, sortIndex],
  )
  const playerRows = useMemo(() => playerOddsRows(players, mds, index, estimator), [players, mds, index, estimator])
  const pricedMds = mds.filter((md) => teams.some((t) => index.has(`${md}:${t.abbr}`)))
  const updated = formatUpdated(odds?.updated)

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Odds"
        subtitle="What the bookmakers expect: goals and clean sheets per match, and each player's chance of a goal or an assist. Separate from the 1–5 ratings."
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
          <Segmented
            label="Show"
            className="mb-3 sm:max-w-md"
            value={metric}
            onChange={setMetric}
            options={Object.entries(METRICS).map(([id, m]) => [id, m.label])}
          />
          <OddsGrid
            mds={mds}
            rows={rows}
            metric={metric}
            teamsByAbbr={teamsByAbbr}
            sortMd={sortIndex < 0 ? null : sortMd}
            onSortMd={setSortMd}
          />
          <div className="mt-3 space-y-1 text-xs text-ucl-muted">
            <p>
              <span className="mr-1 inline-block h-3 w-4 rounded-sm bg-ucl-accent/70 align-middle" aria-hidden="true" />
              Bookmaker odds
              {pricedMds.length ? ` (MD${pricedMds.join(', MD')}${updated ? `, updated ${updated}` : ''})` : ' — none for these matchdays yet'}.
              <span
                className="ml-3 mr-1 inline-block h-3 w-4 rounded-sm border border-dashed border-ucl-star/40 bg-ucl-accent/40 align-middle"
                aria-hidden="true"
              />
              Estimate, until bookmakers price the match (about a week before).
            </p>
            <p>
              Estimates come from the team ratings, fitted to {estimator.matches} priced match
              {estimator.matches === 1 ? '' : 'es'} so far, and sharpen as more matchdays are priced. More fill = better for
              a fantasy pick. Tap a matchday to sort on it.
            </p>
          </div>
        </>
      ) : (
        <PlayerOdds rows={playerRows} single={mds.length === 1} teamsByAbbr={teamsByAbbr} />
      )}
    </div>
  )
}
