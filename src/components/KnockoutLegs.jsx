import { useMemo, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { KO_ROUNDS } from '../data/knockout.js'
import { ROUND_ORDER, buildBracket } from '../utils/bracket.js'
import { effectiveDifficulty, formatAvg } from '../utils/difficulty.js'
import FixtureChip from './FixtureChip.jsx'
import TeamBadge from './TeamBadge.jsx'

const ROUND = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r]))

// Venue of each leg for the club on side `i` of a tie: the second-leg host
// plays the first leg away. The final is one match on neutral ground.
function venues(tie, i) {
  if (tie.round === 'F') return ['N']
  return tie.home2 === i ? ['A', 'H'] : ['H', 'A']
}

// The FDR table for one knockout round: every club's opponent and venue per
// leg, easiest first — what you need to pick players leg by leg. Only ties
// whose two clubs are known show up: from real results, or from your own
// picks in "My bracket" mode.
export default function KnockoutLegs({ ko, picks, mode, standings }) {
  const { teamsByAbbr, venueAdjust } = useTeams()
  const bracket = useMemo(() => buildBracket(ko, mode === 'mine' ? picks : {}), [ko, picks, mode])
  const playable = (round) => bracket.rounds[round].some((t) => !t.result && t.sides[0].abbr && t.sides[1].abbr)
  const rounds = ROUND_ORDER.filter(playable)
  const [chosen, setChosen] = useState(null)
  const round = rounds.includes(chosen) ? chosen : rounds[0]

  if (!round) {
    return (
      <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-ucl-star/75">
        No ties with both clubs known yet.{' '}
        {mode === 'mine'
          ? 'Pick some winners in your bracket first.'
          : 'They appear here as the draws and results come in.'}
      </p>
    )
  }

  const ties = bracket.rounds[round]
  const legs = ROUND[round].legs
  const rows = ties
    .filter((t) => t.sides[0].abbr && t.sides[1].abbr)
    .flatMap((tie) =>
      tie.sides.map((side, i) => {
        const opp = tie.sides[1 - i].abbr
        const oppTeam = teamsByAbbr[opp]
        const legVenues = venues(tie, i)
        const diffs = legVenues.map((v) =>
          effectiveDifficulty(oppTeam?.rating ?? 3, v, venueAdjust, oppTeam?.awayDifficulty ?? 0),
        )
        return {
          abbr: side.abbr,
          opp,
          oppTeam,
          legVenues,
          avg: diffs.reduce((s, d) => s + d, 0) / diffs.length,
          decided: tie.result != null,
          out: tie.result != null && tie.result !== side.abbr,
        }
      }),
    )
    .sort((a, b) => a.avg - b.avg || (teamsByAbbr[a.abbr]?.name ?? '').localeCompare(teamsByAbbr[b.abbr]?.name ?? ''))
  const unknown = ties.filter((t) => !t.sides[0].abbr || !t.sides[1].abbr).length
  // Top 8 sit the play-offs out: their players can't score in that round.
  const byes = round === 'PO' && standings ? standings.slice(0, 8) : []
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr

  return (
    <section className="mb-4">
      {rounds.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Round">
          {rounds.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === round}
              onClick={() => setChosen(r)}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition ${
                r === round ? 'bg-ucl-accent text-white' : 'bg-white/5 text-ucl-star/70 hover:bg-white/10'
              }`}
            >
              {ROUND[r].short}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 bg-white/[0.04] px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-ucl-muted">
          <span className="flex-1">{ROUND[round].name}</span>
          {legs.map((l, i) => (
            <span key={l.label} className="w-[52px] text-center sm:w-[68px]">
              {legs.length > 1 ? `Leg ${i + 1}` : 'Match'}
            </span>
          ))}
          <span className="w-9 text-right">Avg</span>
        </div>
        <ul>
          {rows.map((row) => (
            <li
              key={row.abbr}
              className={`flex items-center gap-2 border-t border-white/5 px-2 py-1.5 ${row.out ? 'opacity-40' : ''}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <TeamBadge abbr={row.abbr} size={22} />
                <span className="truncate text-sm font-semibold">{nameOf(row.abbr)}</span>
              </span>
              {row.legVenues.map((v, i) => (
                <FixtureChip
                  key={i}
                  opp={row.opp}
                  oppName={row.oppTeam?.name}
                  venue={v}
                  rating={row.oppTeam?.rating ?? 3}
                  venueAdjust={venueAdjust}
                  awayDifficulty={row.oppTeam?.awayDifficulty ?? 0}
                />
              ))}
              <span className="w-9 text-right text-xs font-semibold tabular-nums">{formatAvg(row.avg)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-[11px] text-ucl-muted">
        {legs.map((l, i) => `${legs.length > 1 ? `Leg ${i + 1}` : 'Match'}: ${l.label}`).join(' · ')}
        {unknown > 0 &&
          ` · ${unknown} ${unknown === 1 ? 'tie' : 'ties'} still open${
            mode === 'mine' ? ' — pick more winners to see them' : ' — switch to My bracket to plan with your picks'
          }`}
      </p>

      {byes.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
          <p className="mb-2 text-xs text-amber-100">
            <span className="font-semibold">No match in the play-offs:</span> the top 8 go straight to the R16, so their
            players score nothing this round.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {byes.map((abbr) => (
              <span key={abbr} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-1 text-xs">
                <TeamBadge abbr={abbr} size={16} />
                {nameOf(abbr)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
