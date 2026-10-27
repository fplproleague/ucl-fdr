import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES } from '../data/fixtures.js'
import { demoPlayers } from '../data/playersDemo.js'
import { useLivePlayers } from '../utils/useLivePlayers.js'
import { POSITIONS } from '../utils/parsePlayersCsv.js'
import { FIXTURE_WEIGHT, leagueMatchesPlayed, projectLeaguePlayer } from '../utils/playerProjection.js'
import { effectiveDifficulty } from '../utils/difficulty.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'
import MdRangePicker from './MdRangePicker.jsx'
import ViewHeading from './ViewHeading.jsx'

const PRICE_CAPS = [null, 5, 6, 7, 8, 10]
const PREVIEW = 40
// "Differential": owned by at most this share of managers.
const DIFFERENTIAL_MAX = 5

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

// Expected points per player over the selected matchdays: form (points per
// club match so far, which also prices in rotation) times the fixtures. The
// FDR table answers "whose fixtures are good"; this answers "who do I want
// for them". Same matchday range as every other view.
export default function PlayerProjections() {
  const { teamsByAbbr, venueAdjust, from, to, skipMd, setRange, setSkipMd, demo } = useTeams()
  const live = useLivePlayers()
  const [position, setPosition] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('xPts')
  const [showAll, setShowAll] = useState(false)
  const [differentialsOnly, setDifferentialsOnly] = useState(false)
  const [openId, setOpenId] = useState(null)

  const clubMatches = leagueMatchesPlayed()
  // The demo's made-up totals are sized to the matchdays played so far, so
  // their points per match look like real ones.
  const players = useMemo(
    () => (demo ? demoPlayers(Math.max(1, clubMatches)) : live.players),
    [demo, live.players, clubMatches],
  )
  const mds = useVisibleMds(from, to, skipMd)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return players
      .filter((p) => position === 'ALL' || p.position === position)
      .filter((p) => maxPrice == null || p.price <= maxPrice)
      .filter((p) => !differentialsOnly || (p.ownership != null && p.ownership <= DIFFERENTIAL_MAX))
      .filter((p) => {
        if (!q) return true
        const team = teamsByAbbr[p.team]
        return [p.name, team?.name, team?.shortName, p.team].some((s) => s?.toLowerCase().includes(q))
      })
      .map((p) => {
        const fixtures = mds.map((md) => (FIXTURES[p.team] ?? []).find((f) => f.gw === md)).filter(Boolean)
        const difficulties = fixtures.map((f) =>
          effectiveDifficulty(
            teamsByAbbr[f.opp]?.rating ?? 3,
            f.venue,
            venueAdjust,
            teamsByAbbr[f.opp]?.awayDifficulty ?? 0,
          ),
        )
        return { ...p, fixtures, ...projectLeaguePlayer(p, difficulties, clubMatches) }
      })
      .sort((a, b) => b[sortBy] - a[sortBy] || b.xPts - a.xPts || a.price - b.price)
  }, [players, position, maxPrice, differentialsOnly, query, teamsByAbbr, mds, venueAdjust, clubMatches, sortBy])
  const hasOwnership = players.some((p) => p.ownership != null)

  const visible = showAll ? rows : rows.slice(0, PREVIEW)
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr
  const chip = (active) =>
    `min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
      active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
    }`

  const source = demo
    ? 'Demo players: made up, named by club and role.'
    : live.live
      ? `Live from the player sheet · ${players.length} players.`
      : `Saved copy of the player sheet · ${players.length} players.`

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Players"
        subtitle={`Expected points per player over MD${from}–MD${to}${skipMd ? ` (ignoring MD${skipMd})` : ''}.`}
      />

      {demo && (
        <p className="mb-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Demo: these players and their numbers are made up to preview this page.
        </p>
      )}

      {!players.length ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-ucl-star/75">
          {live.loading ? 'Loading players…' : 'Player projections appear here once the player database is connected.'}
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

          <p className="mb-3 text-xs text-ucl-muted">
            Expected points = points per club match so far × each fixture in the range, nudged{' '}
            {Math.round(FIXTURE_WEIGHT * 100)}% per step of difficulty. Dividing by the club&rsquo;s matches (
            {clubMatches} played so far), not the player&rsquo;s, prices in rotation. {source}
          </p>

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
            {hasOwnership && (
              <button
                type="button"
                aria-pressed={differentialsOnly}
                onClick={() => setDifferentialsOnly(!differentialsOnly)}
                title={`Only players owned by ${DIFFERENTIAL_MAX}% of managers or fewer`}
                className={`min-h-[40px] rounded-lg px-3 text-xs font-semibold transition ${
                  differentialsOnly ? 'bg-ucl-accent text-white' : 'bg-white/5 text-ucl-star/70 hover:bg-white/10'
                }`}
              >
                Differentials ≤{DIFFERENTIAL_MAX}%
              </button>
            )}
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

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ucl-muted">
                <tr>
                  {/* w-full + max-w-0 on the name column: it takes whatever the
                      number columns leave, and truncates instead of squeezing them. */}
                  <th scope="col" className="w-full px-2 py-2 text-left font-semibold">
                    Player
                  </th>
                  <th scope="col" className="hidden px-1 py-2 text-left font-semibold lg:table-cell">
                    Fixtures
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
                  <th scope="col" className="px-1 py-2 text-right font-semibold" title="Expected points over the range">
                    xPts
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold" title="Expected points per €1m">
                    /€m
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const open = openId === p.id
                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={`cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04] ${open ? 'bg-white/[0.04]' : ''}`}
                        onClick={() => setOpenId(open ? null : p.id)}
                      >
                        <th scope="row" className="w-full max-w-0 px-2 py-1.5 text-left font-normal">
                          <button
                            type="button"
                            aria-expanded={open}
                            className="flex w-full min-w-0 items-center gap-2 text-left"
                          >
                            <TeamBadge abbr={p.team} size={22} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{p.name}</span>
                              <span className="block truncate text-[11px] text-ucl-muted">
                                {/* Ownership before minutes: on a phone the line gets
                                    cut short, and ownership is the one people scan for. */}
                                {p.position} · {nameOf(p.team)}
                                {p.ownership != null && ` · ${p.ownership}% owned`} · {Math.round(p.minutesShare * 100)}
                                % mins
                              </span>
                            </span>
                            {open ? (
                              <ChevronUp size={14} className="shrink-0 text-ucl-muted" aria-hidden="true" />
                            ) : (
                              <ChevronDown size={14} className="shrink-0 text-ucl-muted" aria-hidden="true" />
                            )}
                          </button>
                        </th>
                        <td className="hidden px-1 py-1.5 lg:table-cell">
                          <Fixtures
                            fixtures={p.fixtures}
                            teamsByAbbr={teamsByAbbr}
                            venueAdjust={venueAdjust}
                            wrap={false}
                          />
                        </td>
                        <td className="px-1 py-1.5 text-right tabular-nums">{p.price.toFixed(1)}</td>
                        <td className="hidden px-1 py-1.5 text-right tabular-nums text-ucl-star/75 sm:table-cell">
                          {p.ppm.toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 text-right font-display font-extrabold tabular-nums">
                          {p.xPts.toFixed(1)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-ucl-star/75">{p.value.toFixed(2)}</td>
                      </tr>
                      {open && (
                        <tr className="bg-white/[0.04]">
                          <td colSpan={6} className="whitespace-normal px-2 pb-3 pt-1">
                            <PlayerDetails player={p} teamsByAbbr={teamsByAbbr} venueAdjust={venueAdjust} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
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
        </>
      )}
    </div>
  )
}

// One line in the table (the name column would otherwise squeeze the chips
// into a stack), wrapping in a row's details on a phone.
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

// What's behind the numbers: points per matchday (is that average one big
// haul or steady returns?), the season stats, and — for phones, where the
// fixtures column is hidden — the fixtures in the range.
function PlayerDetails({ player, teamsByAbbr, venueAdjust }) {
  const stats = STAT_LABELS.filter(
    ([field, , positions]) => player.stats?.[field] != null && (!positions || positions.includes(player.position)),
  )
  return (
    <div className="space-y-2.5">
      {player.form?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ucl-muted">Points per matchday</p>
          <div className="flex flex-wrap gap-1">
            {player.form.map((f) => (
              <span
                key={f.md}
                className="inline-flex min-w-[44px] flex-col items-center rounded-md bg-white/5 px-1.5 py-1 text-xs"
              >
                <span className="text-[10px] text-ucl-muted">MD{f.md}</span>
                <span className="font-bold tabular-nums">{f.points}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {stats.length > 0 && (
        <p className="text-xs text-ucl-star/80">
          {stats.map(([field, label]) => `${player.stats[field]} ${label}`).join(' · ')}
          {player.apps != null && ` · ${player.apps} apps, ${player.minutes} mins`}
        </p>
      )}
      {player.fixtures.length > 0 && (
        <div className="lg:hidden">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ucl-muted">Fixtures in range</p>
          <Fixtures fixtures={player.fixtures} teamsByAbbr={teamsByAbbr} venueAdjust={venueAdjust} />
        </div>
      )}
    </div>
  )
}
