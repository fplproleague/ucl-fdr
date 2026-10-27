import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { KO_ROUNDS } from '../data/knockout.js'
import { demoPlayers } from '../data/playersDemo.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import { clubMatchesPlayed, positionRates, projectPlayer, relativeScores } from '../utils/playerProjection.js'
import { windowLabel } from '../utils/koWindow.js'
import TeamBadge from './TeamBadge.jsx'
import KnockoutPlanPicker from './KnockoutPlanPicker.jsx'
import { PRICE_STEP, PriceSlider, ScoreBar } from './PlayerProjections.jsx'

const ROUND = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r]))
const PREVIEW = 40
// The demo pretends the league phase has just finished, so its made-up
// season totals line up with the eight matches every club has played.
const DEMO_TODAY = new Date('2027-01-28')

// Form and fixtures per player over the "Plan for" window, as the same
// relative 0–100 score as the league-phase Players tab — the player-level
// answer to "who do I want for this stretch of the knockouts?"
export default function KnockoutPlayers({ ko, demo, plan, presets, setPlan, clubStats }) {
  const { teamsByAbbr } = useTeams()
  const live = useLivePlayers()
  const [position, setPosition] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [showAll, setShowAll] = useState(false)

  const players = useMemo(() => (demo ? demoPlayers() : live.players), [demo, live.players])
  const { byClub, league } = useMemo(() => clubMatchesPlayed(ko, demo ? DEMO_TODAY : new Date()), [ko, demo])
  // Over the whole sheet, before any filter (same as the league-phase tab).
  const rates = useMemo(() => positionRates(players), [players])

  // Every player still in it, projected and scored before any filter, so a
  // filter only hides rows and never changes anyone's score.
  const scored = useMemo(() => {
    const projected = players
      .filter((p) => clubStats[p.team]?.matches > 0)
      .map((p) => ({ ...p, ...projectPlayer(p, clubStats[p.team], byClub[p.team] ?? league, rates[p.position]) }))
    const scores = relativeScores(projected)
    return projected.map((p) => ({ ...p, ...scores.get(p.id) }))
  }, [players, clubStats, byClub, league, rates])

  const priceBounds = useMemo(() => {
    const prices = players.map((p) => p.price)
    if (!prices.length) return { min: 4, max: 12 }
    return {
      min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
    }
  }, [players])

  const sortKey = { score: 'score', value: 'valueScore', matches: 'matches' }[sortBy]
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scored
      .filter((p) => position === 'ALL' || p.position === position)
      .filter((p) => maxPrice == null || p.price <= maxPrice)
      .filter((p) => {
        if (!q) return true
        const team = teamsByAbbr[p.team]
        return [p.name, team?.name, team?.shortName, p.team].some((s) => s?.toLowerCase().includes(q))
      })
      .sort((a, b) => b[sortKey] - a[sortKey] || b.score - a.score || a.price - b.price)
  }, [scored, position, maxPrice, query, teamsByAbbr, sortKey])

  const visible = showAll ? rows : rows.slice(0, PREVIEW)
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr

  if (!players.length) {
    return (
      <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-ucl-star/75">
        {live.loading
          ? 'Loading players…'
          : 'Players appear here once the player database is connected for the knockouts.'}
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
        <span className="font-semibold text-ucl-star/80">Score</span> combines form (points per match so far, taking
        minutes played into account) with how many matches his club can expect in the chosen rounds and how strong those
        opponents are; 100 is the best player for this stretch. It&rsquo;s a form-and-fixtures guide, not a points
        prediction: it doesn&rsquo;t know about injuries, team news or expected goals. {source}
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
        <div role="group" aria-label="Sort by" className="flex rounded-lg bg-white/5 p-0.5">
          {[
            ['score', 'Score'],
            ['value', 'Per €m'],
            ['matches', 'Matches'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={sortBy === id}
              onClick={() => setSortBy(id)}
              className={chip(sortBy === id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PriceSlider bounds={priceBounds} value={maxPrice} onChange={setMaxPrice} />

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
              <th scope="col" className="px-1.5 py-2 text-right font-semibold">
                €m
              </th>
              <th
                scope="col"
                className="hidden px-1.5 py-2 text-right font-semibold sm:table-cell"
                title="Points per match so far"
              >
                Form
              </th>
              <th
                scope="col"
                className="px-1.5 py-2 text-right font-semibold"
                title="Club's expected matches in the chosen rounds"
              >
                Mat.
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-left font-semibold"
                title={
                  sortBy === 'value'
                    ? 'Score per €1m, 100 = best value for this stretch'
                    : 'Form and fixtures, 100 = best player for this stretch'
                }
              >
                {sortBy === 'value' ? 'Score / €m' : 'Score'}
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
                <td className="px-1.5 py-1.5 text-right tabular-nums">{p.price.toFixed(1)}</td>
                <td className="hidden px-1.5 py-1.5 text-right tabular-nums text-ucl-star/75 sm:table-cell">
                  {p.rawPpm.toFixed(1)}
                </td>
                <td className="px-1.5 py-1.5 text-right tabular-nums text-ucl-star/75">{p.matches.toFixed(1)}</td>
                <td className="px-2 py-1.5">
                  <ScoreBar value={sortBy === 'value' ? p.valueScore : p.score} />
                </td>
              </tr>
            ))}
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
          className="mt-2 min-h-[40px] w-full rounded-xl bg-white/5 text-xs font-semibold text-ucl-star/80 hover:bg-white/10"
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  )
}
