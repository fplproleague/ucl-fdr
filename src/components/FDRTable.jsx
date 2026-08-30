import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_GAMEWEEKS } from '../data/fixtures.js'
import { ratingColor, formatAvg } from '../utils/difficulty.js'
import TeamBadge from './TeamBadge.jsx'

const gameweeks = Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1)

export default function FDRTable() {
  const { teams, teamsByAbbr } = useTeams()
  const [sortBy, setSortBy] = useState('name') // 'name' | 'avg'

  const rows = useMemo(() => {
    return teams.map((team) => {
      const fixtures = FIXTURES[team.abbr] ?? []
      const cells = gameweeks.map((gw) => fixtures.find((f) => f.gw === gw) ?? null)
      const ratings = cells.filter(Boolean).map((c) => teamsByAbbr[c.opp]?.rating ?? 3)
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      return { team, cells, avg }
    })
  }, [teams, teamsByAbbr])

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (sortBy === 'avg') copy.sort((a, b) => a.avg - b.avg)
    else copy.sort((a, b) => a.team.name.localeCompare(b.team.name))
    return copy
  }, [rows, sortBy])

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">FDR-tabel</h1>
          <p className="mt-0.5 text-sm text-ucl-star/60">Gameweek 1 t/m {TOTAL_GAMEWEEKS} · groen = makkelijk, rood = moeilijk</p>
        </div>
        <button
          onClick={() => setSortBy((s) => (s === 'name' ? 'avg' : 'name'))}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 active:scale-95"
        >
          <ArrowUpDown size={14} />
          {sortBy === 'name' ? 'Naam' : 'Gem. FDR'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-card">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[150px] bg-ucl-deep/95 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ucl-star/60 backdrop-blur">
                Team
              </th>
              {gameweeks.map((gw) => (
                <th
                  key={gw}
                  className="min-w-[56px] bg-ucl-deep/95 px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ucl-star/60"
                >
                  GW{gw}
                </th>
              ))}
              <th className="min-w-[64px] bg-ucl-deep/95 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ucl-star/60">
                Gem.
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ team, cells, avg }, idx) => (
              <tr key={team.id} className={idx % 2 === 0 ? 'bg-white/[0.015]' : ''}>
                <td className="sticky left-0 z-10 min-w-[150px] border-t border-white/5 bg-ucl-navy/95 px-3 py-1.5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <TeamBadge abbr={team.abbr} size={22} />
                    <span className="truncate text-xs font-medium sm:text-sm">{team.name}</span>
                  </div>
                </td>
                {cells.map((cell, i) => {
                  if (!cell) {
                    return <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center text-ucl-star/20">–</td>
                  }
                  const oppRating = teamsByAbbr[cell.opp]?.rating ?? 3
                  const color = ratingColor(oppRating)
                  return (
                    <td key={i} className="border-t border-white/5 px-1 py-1.5 text-center">
                      <div
                        className="mx-auto flex h-9 w-12 flex-col items-center justify-center rounded-md text-[11px] font-bold leading-tight sm:h-10 sm:w-14 sm:text-xs"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        <span>{cell.opp}</span>
                        <span className="text-[9px] font-semibold opacity-80 sm:text-[10px]">{cell.venue}</span>
                      </div>
                    </td>
                  )
                })}
                <td className="border-t border-white/5 px-2 py-1.5 text-center text-xs font-semibold text-ucl-star/80 sm:text-sm">
                  {formatAvg(avg)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
