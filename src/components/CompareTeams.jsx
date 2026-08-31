import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { FIXTURES, TOTAL_GAMEWEEKS } from '../data/fixtures.js'
import { ratingColor, formatAvg } from '../utils/difficulty.js'
import TeamBadge from './TeamBadge.jsx'

const MAX_TEAMS = 5
const gameweeks = Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1)

export default function CompareTeams() {
  const { teams, teamsByAbbr } = useTeams()
  const [selected, setSelected] = useState([])

  const selectedTeams = selected.map((id) => teams.find((t) => t.id === id)).filter(Boolean)

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_TEAMS) return prev
      return [...prev, id]
    })
  }

  const rows = useMemo(
    () =>
      selectedTeams.map((team) => {
        const fixtures = FIXTURES[team.abbr] ?? []
        const cells = gameweeks.map((gw) => fixtures.find((f) => f.gw === gw) ?? null)
        const ratings = cells.filter(Boolean).map((c) => teamsByAbbr[c.opp]?.rating ?? 3)
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        return { team, cells, avg }
      }),
    [selectedTeams, teamsByAbbr],
  )

  return (
    <div className="mx-auto max-w-4xl px-3 pb-6 pt-4 sm:px-4">
      <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Vergelijk teams</h1>
      <p className="mt-0.5 text-sm text-ucl-star/60">Selecteer tot {MAX_TEAMS} teams om hun fixtures naast elkaar te zien.</p>

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedTeams.length === 0 && (
            <p className="text-xs text-ucl-star/40">Nog geen teams geselecteerd.</p>
          )}
          {selectedTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => toggle(team.id)}
              className="flex items-center gap-1.5 rounded-full border border-ucl-accent/40 bg-ucl-accent/15 px-2.5 py-1.5 text-xs font-semibold text-ucl-star transition hover:bg-ucl-accent/25"
            >
              <TeamBadge abbr={team.abbr} size={16} />
              {team.abbr}
              <X size={12} />
            </button>
          ))}
        </div>

        <details className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-semibold text-ucl-star/80">
            Team toevoegen ({selected.length}/{MAX_TEAMS})
          </summary>
          <div className="max-h-64 overflow-y-auto border-t border-white/5 p-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {teams.map((team) => {
                const active = selected.includes(team.id)
                const disabled = !active && selected.length >= MAX_TEAMS
                return (
                  <button
                    key={team.id}
                    disabled={disabled}
                    onClick={() => toggle(team.id)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition ${
                      active
                        ? 'bg-ucl-accent/25 text-ucl-star'
                        : disabled
                          ? 'cursor-not-allowed text-ucl-star/25'
                          : 'text-ucl-star/70 hover:bg-white/5'
                    }`}
                  >
                    <TeamBadge abbr={team.abbr} size={18} />
                    <span className="truncate">{team.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </details>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 space-y-3">
          {rows.map(({ team, cells, avg }) => (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <TeamBadge abbr={team.abbr} size={26} />
                <p className="text-sm font-semibold sm:text-base">{team.name}</p>
                <span className="ml-auto text-xs font-semibold text-ucl-star/60">gem. {formatAvg(avg)}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {cells.map((cell, i) =>
                  cell ? (
                    <div
                      key={i}
                      className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-md text-[11px] font-bold leading-tight"
                      style={{
                        backgroundColor: ratingColor(teamsByAbbr[cell.opp]?.rating ?? 3).bg,
                        color: ratingColor(teamsByAbbr[cell.opp]?.rating ?? 3).text,
                      }}
                    >
                      <span className="text-[9px] font-semibold opacity-70">GW{cell.gw}</span>
                      <span>{cell.opp}</span>
                      <span className="text-[9px] font-semibold opacity-80">{cell.venue}</span>
                    </div>
                  ) : (
                    <div key={i} className="flex h-11 w-14 shrink-0 items-center justify-center rounded-md bg-white/5 text-ucl-star/20">
                      –
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
