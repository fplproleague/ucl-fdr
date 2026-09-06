import { useTeams } from '../context/TeamsContext.jsx'
import { DAY_LABEL, DAY_ORDER } from '../utils/matchdaySplit.js'
import { matchesForMatchday } from '../utils/matches.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'

// One matchday's 18 matches, grouped by day — the shape a substitution or
// captaincy decision is actually made in ("who plays Tuesday, who plays
// Wednesday, and how hard is each side's match"), which the team-rows table
// can't show directly even though the day data already exists.
export default function MatchdayMatches({ md, onTeamClick }) {
  const { teamsByAbbr, venueAdjust } = useTeams()
  const matches = matchesForMatchday(md, teamsByAbbr)
  const groups = DAY_ORDER.map((day) => ({ day, matches: matches.filter((m) => m.day === day) })).filter(
    (g) => g.matches.length > 0,
  )

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-semibold text-ucl-star/80">No matches to show</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-ucl-muted">
          Every team involved this matchday is currently hidden from the table.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(({ day, matches }) => (
        <div key={day}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ucl-muted">{DAY_LABEL[day]}</p>
          <div className="space-y-1.5">
            {matches.map((m) => (
              <div
                key={`${m.home.abbr}-${m.away.abbr}`}
                className={`flex items-center gap-2 rounded-xl border bg-white/[0.03] p-2 sm:gap-3 sm:p-2.5 ${
                  m.home.pinned || m.away.pinned ? 'border-ucl-accent/40' : 'border-white/10'
                }`}
              >
                <TeamSide team={m.home} onTeamClick={onTeamClick} />
                <FixtureChip
                  opp={m.away.abbr}
                  oppName={m.away.name}
                  venue="H"
                  rating={m.away.rating}
                  venueAdjust={venueAdjust}
                  awayDifficulty={m.away.awayDifficulty ?? 0}
                  className="shrink-0"
                />
                <span className="shrink-0 text-[10px] font-semibold uppercase text-ucl-muted/50">vs</span>
                <FixtureChip
                  opp={m.home.abbr}
                  oppName={m.home.name}
                  venue="A"
                  rating={m.home.rating}
                  venueAdjust={venueAdjust}
                  awayDifficulty={m.home.awayDifficulty ?? 0}
                  className="shrink-0"
                />
                <TeamSide team={m.away} onTeamClick={onTeamClick} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TeamSide({ team, onTeamClick }) {
  const content = (
    <>
      <TeamBadge abbr={team.abbr} size={22} />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm">{team.shortName ?? team.name}</span>
    </>
  )
  const className = `flex min-w-0 flex-1 items-center gap-1.5 ${team.pinned ? 'text-ucl-accent' : ''}`
  if (!onTeamClick) return <div className={className}>{content}</div>
  return (
    <button
      type="button"
      onClick={() => onTeamClick(team)}
      aria-label={`View ${team.name} details`}
      className={`${className} rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ucl-accent`}
    >
      {content}
    </button>
  )
}
