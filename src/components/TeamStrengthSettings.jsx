import { RotateCcw } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { RATING_COLORS } from '../data/teams.js'
import TeamBadge from './TeamBadge.jsx'
import RatingLegend from './RatingLegend.jsx'

export default function TeamStrengthSettings() {
  const { teams, setRating, resetRatings } = useTeams()
  // Sort by the original seed rating, not the live one — otherwise a team
  // jumps to a different row the moment you change its rating, which makes
  // it hard to tell what you just did. The order stays put; only the
  // highlighted button (and the "was X" hint) changes.
  const sorted = [...teams].sort((a, b) => b.baseRating - a.baseRating || a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Team Strength</h1>
          <p className="mt-0.5 text-sm text-ucl-star/60">Adjust each team's rating (1-5). Applied live everywhere.</p>
        </div>
        <button
          onClick={resetRatings}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 active:scale-95"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <RatingLegend className="mb-4" />

      <ul className="space-y-2">
        {sorted.map((team) => {
          const changed = team.rating !== team.baseRating
          return (
            <li
              key={team.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 shadow-card sm:p-3"
            >
              <TeamBadge abbr={team.abbr} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold sm:text-base">{team.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-ucl-star/50">
                  {team.abbr}
                  {changed && <span className="ml-1.5 normal-case text-ucl-accent/80">· was {team.baseRating}</span>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {[1, 2, 3, 4, 5].map((r) => {
                  const active = team.rating === r
                  const color = RATING_COLORS[r]
                  return (
                    <button
                      key={r}
                      aria-label={`Rating ${r}`}
                      onClick={() => setRating(team.id, r)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition active:scale-90 sm:h-9 sm:w-9"
                      style={{
                        backgroundColor: active ? color.bg : 'rgba(255,255,255,0.06)',
                        color: active ? color.text : 'rgba(230,233,255,0.5)',
                        boxShadow: active ? `0 0 0 2px ${color.bg}55` : 'none',
                      }}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
