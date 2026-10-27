import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { KO_ROUNDS } from '../data/knockout.js'
import { demoPlayers } from '../data/playersDemo.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import {
  FIXTURE_WEIGHT,
  PRIOR_MINUTES,
  clubMatchesPlayed,
  positionRates,
  projectPlayer,
} from '../utils/playerProjection.js'
import { windowLabel } from '../utils/koWindow.js'
import TeamBadge from './TeamBadge.jsx'
import KnockoutPlanPicker from './KnockoutPlanPicker.jsx'

const ROUND = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r]))
const PRICE_CAPS = [null, 5, 6, 7, 8, 10]
const PREVIEW = 40
// The demo pretends the league phase has just finished, so its made-up
// season totals line up with the eight matches every club has played.
const DEMO_TODAY = new Date('2027-01-28')

// Expected points per player over the "Plan for" window — the player-level
// answer to "who do I want for this stretch of the knockouts?"
export default function KnockoutPlayers({ ko, demo, plan, presets, setPlan, clubStats }) {
  const { teamsByAbbr } = useTeams()
  const live = useLivePlayers()
  const [position, setPosition] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('xPts')
  const [showAll, setShowAll] = useState(false)

  const players = useMemo(() => (demo ? demoPlayers() : live.players), [demo, live.players])
  const { byClub, league } = useMemo(() => clubMatchesPlayed(ko, demo ? DEMO_TODAY : new Date()), [ko, demo])
  // Over the whole sheet, before any filter (same as the league-phase tab).
  const rates = useMemo(() => positionRates(players), [players])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return players
      .filter((p) => clubStats[p.team]?.matches > 0)
      .filter((p) => position === 'ALL' || p.position === position)
      .filter((p) => maxPrice == null || p.price <= maxPrice)
      .filter((p) => {
        if (!q) return true
        const team = teamsByAbbr[p.team]
        return [p.name, team?.name, team?.shortName, p.team].some((s) => s?.toLowerCase().includes(q))
      })
      .map((p) => ({ ...p, ...projectPlayer(p, clubStats[p.team], byClub[p.team] ?? league, rates[p.position]) }))
      .sort((a, b) => b[sortBy] - a[sortBy] || b.xPts - a.xPts || a.price - b.price)
  }, [players, clubStats, position, maxPrice, query, teamsByAbbr, byClub, league, rates, sortBy])

  const visible = showAll ? rows : rows.slice(0, PREVIEW)
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr

  if (!players.length) {
    return (
      <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-ucl-star/75">
        {live.loading
          ? 'Loading players…'
          : 'Player projections appear here once the player database is connected for the knockouts.'}
      </p>
    )
  }

  const source = demo
    ? 'Demo players: made up, named by club and role.'
    : live.live
      ? `Live from the player sheet · ${players.length} players.`
      : `Saved copy of the player sheet · ${players.length} players.`

  const chip = (active) =>
    `min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
    }`

  return (
    <section className="mb-4">
      <p className="mb-3 text-xs text-ucl-muted">
        Expected points = points per match × the club&rsquo;s expected matches in the chosen rounds, nudged{' '}
        {Math.round(FIXTURE_WEIGHT * 100)}% per step of opponent strength. Points per match is his points per 90 × his
        share of the club&rsquo;s minutes, so rotation counts, with points per 90 pulled towards his position&rsquo;s
        average as if he&rsquo;d played {PRIOR_MINUTES} extra average minutes. {source}
      </p>

      <KnockoutPlanPicker presets={presets} plan={plan} onChange={setPlan} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Position" className="flex rounded-lg bg-white/5 p-0.5">
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
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ucl-muted">
          Max
          <select
            value={maxPrice ?? ''}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
            className="min-h-[36px] rounded-lg border border-white/10 bg-ucl-deep px-2 text-xs font-semibold normal-case tracking-normal text-ucl-star"
          >
            {PRICE_CAPS.map((c) => (
              <option key={c ?? 'any'} value={c ?? ''}>
                {c == null ? 'Any price' : `€${c.toFixed(1)}m`}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Sort by" className="flex rounded-lg bg-white/5 p-0.5">
          <button
            type="button"
            aria-pressed={sortBy === 'xPts'}
            onClick={() => setSortBy('xPts')}
            className={chip(sortBy === 'xPts')}
          >
            Points
          </button>
          <button
            type="button"
            aria-pressed={sortBy === 'value'}
            onClick={() => setSortBy('value')}
            className={chip(sortBy === 'value')}
          >
            Per €m
          </button>
        </div>
      </div>

      <div className="relative mb-3">
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
          className="min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
        />
      </div>

      {plan && (
        <p className="mb-2 text-[11px] text-ucl-muted">
          {windowLabel(plan)}: max {ROUND[plan.from].clubCap} players per club in the{' '}
          {ROUND[plan.from].name.toLowerCase()}. Club matches so far: {league} league phase
          {byClub && Object.values(byClub).some((n) => n > league) ? ' + knockouts' : ''}.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ucl-muted">
            <tr>
              {/* w-full + max-w-0 on the name column: it takes whatever the
                  number columns leave, and truncates instead of squeezing them. */}
              <th scope="col" className="w-full px-2 py-2 text-left font-semibold">
                Player
              </th>
              <th scope="col" className="px-1 py-2 text-right font-semibold">
                €m
              </th>
              <th
                scope="col"
                className="hidden px-1 py-2 text-right font-semibold sm:table-cell"
                title="Points per club match so far"
              >
                Pts/m
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-right font-semibold"
                title="Club's expected matches in the chosen rounds"
              >
                Mat.
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-right font-semibold"
                title="Expected points in the chosen rounds"
              >
                xPts
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold" title="Expected points per €1m">
                /€m
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <th scope="row" className="w-full max-w-0 px-2 py-1.5 text-left font-normal">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamBadge abbr={p.team} size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate text-[11px] text-ucl-muted">
                        {p.position} · {nameOf(p.team)} · {Math.round(p.minutesShare * 100)}% mins
                      </p>
                    </div>
                  </div>
                </th>
                <td className="px-1 py-1.5 text-right tabular-nums">{p.price.toFixed(1)}</td>
                <td className="hidden px-1 py-1.5 text-right tabular-nums text-ucl-star/75 sm:table-cell">
                  {p.ppm.toFixed(1)}
                </td>
                <td className="px-1 py-1.5 text-right tabular-nums text-ucl-star/75">{p.matches.toFixed(1)}</td>
                <td className="px-1 py-1.5 text-right font-display font-extrabold tabular-nums">{p.xPts.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-ucl-star/75">{p.value.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-ucl-muted">
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
          className="mt-2 min-h-[40px] w-full rounded-xl bg-white/5 text-xs font-semibold text-ucl-star/80 hover:bg-white/10"
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  )
}
