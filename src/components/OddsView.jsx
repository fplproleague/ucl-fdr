import { useEffect, useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { MATCHDAYS, MATCHDAY_LABEL } from '../data/matchdays.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import { METRICS, compareRows, fitEstimator, indexOdds, playerOddsRows, teamOddsRows } from '../utils/oddsView.js'
import MdRangePicker from './MdRangePicker.jsx'
import TeamBadge from './TeamBadge.jsx'
import ViewHeading from './ViewHeading.jsx'

// The bookmakers' view, kept apart from the 1–5 ratings: expected goals
// and clean-sheet chances per team and matchday, and per player his
// chances of a goal or an assist. Matches the bookmakers haven't priced yet
// are estimated (see src/utils/oddsView.js) and drawn dashed with a "~".

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

function OddsGrid({ mds, rows, metric, teamsByAbbr }) {
  const { format, label } = METRICS[metric]
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          {label} per team, matchday {mds[0]} to {mds[mds.length - 1]}; estimates marked with a tilde
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 min-w-[92px] bg-ucl-deep px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ucl-muted"
            >
              Team
            </th>
            {mds.map((md) => (
              <th
                key={md}
                scope="col"
                className="min-w-[62px] bg-ucl-deep px-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-ucl-muted sm:min-w-[76px]"
              >
                <span className="block leading-tight">MD{md}</span>
                <span className="block text-[9px] font-medium normal-case leading-tight text-ucl-star/35">
                  {MATCHDAY_LABEL[md]}
                </span>
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
                        {cell.estimated && <span aria-label="estimate">~</span>}
                        {format(cell[metric])}
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

const PLAYER_SORTS = [
  ['ga', 'G/A', 'Chance of a goal or an assist, if he plays'],
  ['goal', 'Goal', 'Chance of scoring (anytime scorer), if he plays'],
  ['assist', 'Assist', 'Chance of an assist, if he plays'],
  ['cs', 'CS', "His team's clean-sheet chance"],
]
const sortValue = {
  ga: (r) => r.xgi,
  goal: (r) => r.xg,
  assist: (r) => r.xa ?? 0,
  cs: (r) => r.cs,
}

function PlayerOdds({ rows, nextMd, showMd }) {
  const [position, setPosition] = useState('ALL')
  const [sortBy, setSortBy] = useState('ga')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => position === 'ALL' || r.player.position === position)
        .sort((a, b) => sortValue[sortBy](b) - sortValue[sortBy](a) || a.player.name.localeCompare(b.player.name)),
    [rows, position, sortBy],
  )
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW)

  if (!rows.length) {
    const md = MATCHDAYS.find((m) => m.md === nextMd)
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-semibold text-ucl-star/80">No player prices for these matchdays yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ucl-muted">
          Bookmakers price players in the last days before a matchday
          {md ? ` — for MD${md.md} (${md.label}) they show up here then` : ''}. Team numbers are on the Teams tab
          already.
        </p>
      </div>
    )
  }

  const chip = (active) =>
    `min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
    }`

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

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full whitespace-nowrap text-sm">
          <caption className="sr-only">Player chances of a goal or an assist if he plays, from bookmaker odds</caption>
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ucl-muted">
            <tr>
              <th scope="col" className="w-full px-2 py-2 text-left font-semibold">
                Player
              </th>
              <th scope="col" className="px-1 py-2 text-left font-semibold">
                {showMd ? 'MD · vs' : 'vs'}
              </th>
              {PLAYER_SORTS.map(([id, text, title]) => (
                <th key={id} scope="col" className="px-0.5 py-1 text-right font-semibold" aria-sort={sortBy === id ? 'descending' : 'none'}>
                  <button
                    type="button"
                    onClick={() => setSortBy(id)}
                    title={title}
                    className={`min-h-[32px] rounded px-1.5 uppercase tracking-wider ${
                      sortBy === id ? 'bg-ucl-accent/20 text-ucl-star' : 'hover:text-ucl-star'
                    }`}
                  >
                    {text}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.player.id}:${r.md}`} className="border-t border-white/5">
                <th scope="row" className="w-full max-w-0 py-1.5 pl-2 pr-2 text-left font-normal">
                  <div className="flex items-center gap-1.5">
                    <TeamBadge abbr={r.player.team} size={18} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold sm:text-sm">{r.player.name}</span>
                      <span className="block text-[10px] text-ucl-muted">
                        {r.player.position} · €{r.player.price.toFixed(1)}m
                      </span>
                    </span>
                  </div>
                </th>
                <td className="px-1 py-1.5 text-xs text-ucl-star/80">
                  {showMd && <span className="text-ucl-muted">MD{r.md} · </span>}
                  {r.opp} ({r.venue})
                </td>
                <td className={`px-2 py-1.5 text-right text-xs tabular-nums ${sortBy === 'ga' ? 'font-bold' : ''}`}>{pct(chance(r.xgi))}</td>
                <td className={`px-2 py-1.5 text-right text-xs tabular-nums ${sortBy === 'goal' ? 'font-bold' : ''}`}>{pct(r.pGoal)}</td>
                <td className={`px-2 py-1.5 text-right text-xs tabular-nums ${sortBy === 'assist' ? 'font-bold' : ''}`}>
                  {r.xa == null ? '–' : pct(chance(r.xa))}
                </td>
                <td className={`px-2 py-1.5 text-right text-xs tabular-nums ${sortBy === 'cs' ? 'font-bold' : ''}`}>{pct(r.cs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <p className="mt-3 text-xs text-ucl-muted">
        Chances <strong className="text-ucl-star/80">if he plays</strong>: anytime-scorer bets are void for a player who
        doesn&apos;t, so check his minutes on the Players tab. From one bookmaker&apos;s prices, after taking off a typical
        margin.
      </p>
    </>
  )
}

export default function OddsView() {
  const { teams, teamsByAbbr, from, to, skipMd, setRange, setSkipMd } = useTeams()
  const [view, setView] = useState('teams')
  const [metric, setMetric] = useState('cs')
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
  const rows = useMemo(
    () => [...teamOddsRows(teams, mds, index, estimator, metric)].sort(compareRows(metric)),
    [teams, mds, index, estimator, metric],
  )
  const playerRows = useMemo(() => playerOddsRows(players, mds, index), [players, mds, index])
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
          <OddsGrid mds={mds} rows={rows} metric={metric} teamsByAbbr={teamsByAbbr} />
          <div className="mt-3 space-y-1 text-xs text-ucl-muted">
            <p>
              <span className="mr-1 inline-block h-3 w-4 rounded-sm bg-ucl-accent/70 align-middle" aria-hidden="true" />
              Bookmaker odds
              {pricedMds.length ? ` (MD${pricedMds.join(', MD')}${updated ? `, updated ${updated}` : ''})` : ' — none for these matchdays yet'}.
              <span
                className="ml-3 mr-1 inline-block h-3 w-4 rounded-sm border border-dashed border-ucl-star/40 bg-ucl-accent/40 align-middle"
                aria-hidden="true"
              />
              ~ Estimate until bookmakers price the match (about a week before).
            </p>
            <p>
              Estimates come from the team ratings, fitted to {estimator.matches} priced match
              {estimator.matches === 1 ? '' : 'es'} so far, and sharpen as more matchdays are priced. More fill = better for
              a fantasy pick.
            </p>
          </div>
        </>
      ) : (
        <PlayerOdds rows={playerRows} nextMd={mds.find((md) => !pricedMds.includes(md)) ?? mds[0]} showMd={new Set(playerRows.map((r) => r.md)).size > 1} />
      )}
    </div>
  )
}
