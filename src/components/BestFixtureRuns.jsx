import { useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_GAMEWEEKS } from '../data/fixtures.js'
import { ratingColor, formatAvg } from '../utils/difficulty.js'
import TeamBadge from './TeamBadge.jsx'

const allGws = Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1)

export default function BestFixtureRuns() {
  const { teams, teamsByAbbr } = useTeams()
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(TOTAL_GAMEWEEKS)

  const range = to >= from ? allGws.filter((gw) => gw >= from && gw <= to) : []

  const ranked = useMemo(() => {
    const withAvg = teams.map((team) => {
      const fixtures = (FIXTURES[team.abbr] ?? []).filter((f) => f.gw >= from && f.gw <= to)
      const ratings = fixtures.map((f) => teamsByAbbr[f.opp]?.rating ?? 3)
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : Infinity
      return { team, fixtures, avg }
    })
    return withAvg
      .filter((w) => w.fixtures.length > 0)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5)
  }, [teams, teamsByAbbr, from, to])

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-4 sm:px-4">
      <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Beste fixture runs</h1>
      <p className="mt-0.5 text-sm text-ucl-star/60">Top 5 teams met de laagste gemiddelde moeilijkheidsgraad.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-ucl-star/60">
          Van GW
          <select
            value={from}
            onChange={(e) => setFrom(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ucl-deep px-2 py-2 text-sm font-medium text-ucl-star focus:outline-none focus:ring-2 focus:ring-ucl-accent"
          >
            {allGws.map((gw) => (
              <option key={gw} value={gw}>
                GW{gw}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-ucl-star/60">
          Tot GW
          <select
            value={to}
            onChange={(e) => setTo(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ucl-deep px-2 py-2 text-sm font-medium text-ucl-star focus:outline-none focus:ring-2 focus:ring-ucl-accent"
          >
            {allGws.map((gw) => (
              <option key={gw} value={gw}>
                GW{gw}
              </option>
            ))}
          </select>
        </label>
      </div>

      {range.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ucl-star/50">Kies een geldige GW-range.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {ranked.map(({ team, fixtures, avg }, idx) => (
            <li key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ucl-accent/20 text-sm font-extrabold text-ucl-accent">
                  {idx + 1}
                </span>
                <TeamBadge abbr={team.abbr} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold sm:text-base">{team.name}</p>
                  <p className="text-[11px] text-ucl-star/50">
                    GW{from}–GW{to} · gem. {formatAvg(avg)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fixtures.map((f) => {
                  const color = ratingColor(teamsByAbbr[f.opp]?.rating ?? 3)
                  return (
                    <div
                      key={f.gw}
                      className="flex h-9 w-12 flex-col items-center justify-center rounded-md text-[11px] font-bold leading-tight"
                      style={{ backgroundColor: color.bg, color: color.text }}
                      title={`GW${f.gw}`}
                    >
                      <span>{f.opp}</span>
                      <span className="text-[9px] font-semibold opacity-80">{f.venue}</span>
                    </div>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
