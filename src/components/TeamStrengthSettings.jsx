import { useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { RATING_COLORS } from '../data/teams.js'
import TeamBadge from './TeamBadge.jsx'
import RatingLegend from './RatingLegend.jsx'
import ViewHeading from './ViewHeading.jsx'

const AWAY_DIFFICULTY_LEVELS = [0, 1, 2]

const SUB_TABS = [
  { id: 'strength', label: 'Team Strength' },
  { id: 'away', label: 'Away Difficulty' },
]

export default function TeamStrengthSettings() {
  const { teams, setRating, resetTeam, resetRatings, modifiedCount, showTeam, setAwayDifficulty } = useTeams()
  const [query, setQuery] = useState('')
  // A sub-tab, not two stacked sections — most people never scroll far enough
  // to find Away Difficulty if it just sits below all 36 strength rows.
  const [subTab, setSubTab] = useState('strength')

  // Ordered by the seed rating, never the live one — otherwise a team jumps
  // rows the instant you change it and you lose your place in a 36-row list.
  const sorted = [...teams].sort((a, b) => b.baseRating - a.baseRating || a.name.localeCompare(b.name))
  const filtered = sorted.filter((t) => {
    const q = query.trim().toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.abbr.toLowerCase().includes(q)
  })

  // Alphabetical, not by strength — this list is for finding one team fast,
  // not for ranking them.
  const byName = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Team Strength"
        subtitle="Set what each team is worth as an opponent. Everything else recalculates live."
        action={
          modifiedCount > 0 && (
            <button
              type="button"
              onClick={resetRatings}
              className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 active:scale-95"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset {modifiedCount}
            </button>
          )
        }
      />

      <div className="mb-3 flex gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1" role="tablist">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={subTab === t.id}
            onClick={() => setSubTab(t.id)}
            className={`min-h-[36px] flex-1 rounded-full text-xs font-semibold uppercase tracking-wide transition sm:text-sm ${
              subTab === t.id ? 'bg-ucl-accent text-white' : 'text-ucl-star/60 hover:text-ucl-star'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'strength' && (
        <>
          <RatingLegend variant="full" className="mb-3" />

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
              placeholder="Search 36 teams"
              aria-label="Search teams"
              className="min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
            />
          </div>

          <ul className="space-y-2">
            {filtered.map((team) => (
              <li
                key={team.id}
                className={`flex items-center gap-3 rounded-2xl border bg-white/[0.03] p-2.5 shadow-card transition-opacity sm:p-3 ${
                  team.modified ? 'border-ucl-accent/50' : 'border-white/10'
                } ${team.hidden ? 'opacity-50' : ''}`}
              >
                <TeamBadge abbr={team.abbr} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold sm:text-base">{team.name}</p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
                    {team.modified ? (
                      <button
                        type="button"
                        onClick={() => resetTeam(team.id)}
                        className="font-semibold text-ucl-accent transition hover:underline"
                      >
                        was {team.baseRating} · reset
                      </button>
                    ) : (
                      <span className="uppercase tracking-wide text-ucl-muted">{team.abbr}</span>
                    )}
                    {team.hidden && (
                      <>
                        <span className="text-ucl-muted">· hidden from table</span>
                        <button
                          type="button"
                          onClick={() => showTeam(team.id)}
                          className="font-semibold text-ucl-accent transition hover:underline"
                        >
                          show
                        </button>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1" role="group" aria-label={`${team.name} strength`}>
                  {[1, 2, 3, 4, 5].map((r) => {
                    const active = team.rating === r
                    const color = RATING_COLORS[r]
                    return (
                      <button
                        key={r}
                        type="button"
                        aria-label={`Set ${team.name} to ${r} — ${color.label}`}
                        aria-pressed={active}
                        onClick={() => setRating(team.id, r)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition active:scale-90"
                        style={{
                          backgroundColor: active ? color.bg : 'rgba(255,255,255,0.06)',
                          color: active ? color.text : 'rgba(230,233,255,0.55)',
                          boxShadow: active ? `0 0 0 2px ${color.bg}55` : 'none',
                        }}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ucl-muted">
                No team matches “{query}”.
              </li>
            )}
          </ul>
        </>
      )}

      {subTab === 'away' && (
        <>
          <p className="mb-3 text-xs text-ucl-muted">
            Pick teams that are tough to play away at — every visiting team's fixture there gets harder, on top of
            Home/away.
          </p>

          <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {byName.map((team) => (
              <li key={team.id} className="flex items-center gap-2.5 px-2.5 py-2 sm:gap-3 sm:px-3">
                <TeamBadge abbr={team.abbr} size={24} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.shortName ?? team.name}</span>
                <div className="flex shrink-0 gap-1" role="group" aria-label={`${team.name} away difficulty`}>
                  {AWAY_DIFFICULTY_LEVELS.map((level) => {
                    const active = team.awayDifficulty === level
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={active}
                        aria-label={`${team.name}: ${level === 0 ? 'no away difficulty adjustment' : `+${level} away difficulty`}`}
                        onClick={() => setAwayDifficulty(team.id, level)}
                        className={`flex h-8 w-9 items-center justify-center rounded-lg text-xs font-bold transition active:scale-90 ${
                          active ? 'bg-ucl-accent text-white' : 'bg-white/[0.06] text-ucl-star/55 hover:bg-white/10'
                        }`}
                      >
                        {level === 0 ? '0' : `+${level}`}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
