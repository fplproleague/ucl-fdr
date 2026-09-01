import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_GAMEWEEKS } from '../data/fixtures.js'
import TeamBadge from './TeamBadge.jsx'
import RatingLegend from './RatingLegend.jsx'
import GwRangePicker from './GwRangePicker.jsx'
import FixtureChip from './FixtureChip.jsx'

const allGws = Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1)
// Narrower than a full team name column — long names use team.shortName here
// (see src/data/teams.js) so the sticky column stays compact and leaves more
// room for the fixture columns.
const TEAM_COL_WIDTH = 118

export default function FDRTable() {
  const { teams, teamsByAbbr } = useTeams()
  const [sortBy, setSortBy] = useState('avg') // 'avg' | 'name' — defaults to best-fixtures-first
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(TOTAL_GAMEWEEKS)

  const visibleGws = to >= from ? allGws.filter((gw) => gw >= from && gw <= to) : []

  const rows = useMemo(() => {
    return teams.map((team) => {
      const fixtures = FIXTURES[team.abbr] ?? []
      const cells = visibleGws.map((gw) => fixtures.find((f) => f.gw === gw) ?? null)
      const ratings = cells.filter(Boolean).map((c) => teamsByAbbr[c.opp]?.rating ?? 3)
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : Infinity
      return { team, cells, avg }
    })
  }, [teams, teamsByAbbr, visibleGws])

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (sortBy === 'avg') copy.sort((a, b) => a.avg - b.avg)
    else copy.sort((a, b) => a.team.name.localeCompare(b.team.name))
    return copy
  }, [rows, sortBy])

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">FDR Table</h1>
        <button
          onClick={() => setSortBy((s) => (s === 'name' ? 'avg' : 'name'))}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 active:scale-95"
        >
          <ArrowUpDown size={14} />
          {sortBy === 'avg' ? 'Best fixtures' : 'Name'}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <GwRangePicker allGws={allGws} from={from} to={to} onFromChange={setFrom} onToChange={setTo} className="sm:w-72" />
        <RatingLegend className="flex-1 items-center" />
      </div>

      {visibleGws.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ucl-star/50">Pick a valid GW range.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-20 bg-ucl-deep/95 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ucl-star/60 backdrop-blur"
                  style={{ minWidth: TEAM_COL_WIDTH, width: TEAM_COL_WIDTH }}
                >
                  Team
                </th>
                {visibleGws.map((gw) => (
                  <th
                    key={gw}
                    className="min-w-[64px] bg-ucl-deep/95 px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ucl-star/60"
                  >
                    GW{gw}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ team, cells }, idx) => (
                <tr key={team.id} className={idx % 2 === 0 ? 'bg-white/[0.015]' : ''}>
                  <td
                    className="sticky left-0 z-10 border-t border-white/5 bg-ucl-navy/95 px-2 py-1.5 backdrop-blur"
                    style={{ minWidth: TEAM_COL_WIDTH, width: TEAM_COL_WIDTH }}
                  >
                    <div className="flex items-center gap-1.5">
                      <TeamBadge abbr={team.abbr} size={20} />
                      <span className="truncate text-xs font-medium sm:text-sm">{team.shortName ?? team.name}</span>
                    </div>
                  </td>
                  {cells.map((cell, i) => (
                    <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center">
                      {cell ? (
                        <FixtureChip
                          opp={cell.opp}
                          venue={cell.venue}
                          rating={teamsByAbbr[cell.opp]?.rating ?? 3}
                          className="mx-auto"
                        />
                      ) : (
                        <span className="text-ucl-star/20">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
