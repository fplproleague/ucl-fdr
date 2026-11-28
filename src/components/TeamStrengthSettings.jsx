import { useState } from 'react'
import { Info, RotateCcw, Search } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import TeamBadge from './TeamBadge.jsx'
import RatingLegend from './RatingLegend.jsx'
import StrengthPicker from './StrengthPicker.jsx'
import { formatRating } from '../utils/difficulty.js'
import ViewHeading from './ViewHeading.jsx'
import { IconButton, MetaRow, SubTabs } from './Toolbar.jsx'
import { ODDS_RATINGS, ODDS_RATINGS_MATCHES } from 'virtual:odds-ratings'

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
  const [showInfo, setShowInfo] = useState(false)
  // The defaults come from the odds (see oddsRatings in vite.config.js).
  // There used to be an "Odds ≈ 4" hint under each team beside a hand-set
  // default; the default is now that number, so the hint went with it.
  const fromOdds = Object.keys(ODDS_RATINGS).length > 0

  // Ordered by the default rating, never the live one — otherwise a team jumps
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
        tools={
          <IconButton label="How the ratings work" pressed={showInfo} onClick={() => setShowInfo((v) => !v)}>
            <Info size={16} aria-hidden="true" />
          </IconButton>
        }
        action={
          modifiedCount > 0 && (
            <button
              type="button"
              onClick={resetRatings}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 active:scale-95"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset {modifiedCount}
            </button>
          )
        }
      />

      {showInfo && (
        <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-ucl-star/75">
          <RatingLegend variant="full" className="mb-2 !border-0 !bg-transparent !p-0" />
          {fromOdds ? (
            <p>The default ratings follow the bookmakers&apos; prices (and Elo club ratings where a club isn&apos;t
              priced): all 36 ranked, in bands as big as a hand-set list would have, from {ODDS_RATINGS_MATCHES} priced
              matches so far. They move as new odds come in. A rating you change is yours and stays as you set it until
              you reset it.</p>
          ) : (
            <p>Each team&apos;s rating is how hard it is to play against, from 1 (very easy) to 5 (very hard).</p>
          )}
        </div>
      )}

      <SubTabs label="Strength settings" value={subTab} onChange={setSubTab} options={SUB_TABS} />

      {subTab === 'strength' && (
        <>
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
              className="h-10 w-full rounded border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-ucl-star placeholder:text-ucl-star/30"
            />
          </div>

          <MetaRow aside={<RatingLegend />}>
            {filtered.length} team{filtered.length === 1 ? '' : 's'}, strongest first. Tap a number to change a rating.
          </MetaRow>

          <ul className="space-y-2">
            {filtered.map((team) => (
              <li
                key={team.id}
                className={`flex items-center gap-2 rounded-lg border bg-white/[0.03] p-2.5 shadow-card transition-opacity sm:gap-3 sm:p-3 ${
                  team.modified ? 'border-ucl-accent/50' : 'border-white/10'
                } ${team.hidden ? 'opacity-50' : ''}`}
              >
                <TeamBadge abbr={team.abbr} size={32} />
                <div className="min-w-0 flex-1">
                  {/* Short name on phones: the picker's +½ button left too little
                      room for "Manchester City" to show more than "Manc…". */}
                  <p className="truncate text-sm font-semibold sm:text-base">
                    <span className="sm:hidden">{team.shortName ?? team.name}</span>
                    <span className="hidden sm:inline">{team.name}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
                    {team.modified ? (
                      <button
                        type="button"
                        onClick={() => resetTeam(team.id)}
                        className="font-semibold text-ucl-link transition hover:underline"
                      >
                        {fromOdds ? 'odds say' : 'was'} {formatRating(team.baseRating)} · reset
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
                          className="font-semibold text-ucl-link transition hover:underline"
                        >
                          show
                        </button>
                      </>
                    )}
                  </p>
                </div>
                <StrengthPicker team={team} onSetRating={setRating} />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ucl-muted">
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

          <ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            {byName.map((team) => (
              <li key={team.id} className="flex items-center gap-2.5 px-2.5 py-2 sm:gap-3 sm:px-3">
                <TeamBadge abbr={team.abbr} size={24} />
                <span className="min-w-0 flex-1 truncate text-sm font-normal">{team.shortName ?? team.name}</span>
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
                        className={`flex h-8 w-9 items-center justify-center rounded text-xs font-semibold transition active:scale-90 ${
                          active ? 'bg-ucl-select text-ucl-selectInk' : 'bg-white/[0.06] text-ucl-star/55 hover:bg-white/10'
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
