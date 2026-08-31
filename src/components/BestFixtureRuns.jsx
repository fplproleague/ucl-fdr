import { useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_GAMEWEEKS } from '../data/fixtures.js'
import { formatAvg } from '../utils/difficulty.js'
import TeamBadge from './TeamBadge.jsx'
import GwRangePicker from './GwRangePicker.jsx'
import FixtureChip from './FixtureChip.jsx'

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
      <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Best Fixture Runs</h1>
      <p className="mt-0.5 text-sm text-ucl-star/60">Top 5 teams with the lowest average difficulty.</p>

      <GwRangePicker allGws={allGws} from={from} to={to} onFromChange={setFrom} onToChange={setTo} className="mt-4" />

      {range.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ucl-star/50">Pick a valid GW range.</p>
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
                    GW{from}–GW{to} · avg {formatAvg(avg)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fixtures.map((f) => (
                  <FixtureChip key={f.gw} opp={f.opp} venue={f.venue} rating={teamsByAbbr[f.opp]?.rating ?? 3} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
