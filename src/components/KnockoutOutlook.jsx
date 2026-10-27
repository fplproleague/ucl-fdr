import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { KO_ROUNDS } from '../data/knockout.js'
import { knockoutOdds } from '../utils/koOdds.js'
import { nextRound, roundsIn, squadWindow, windowStats } from '../utils/koWindow.js'
import { difficultyBand, ratingColor } from '../utils/difficulty.js'
import { ordinal } from '../utils/ordinal.js'
import TeamBadge from './TeamBadge.jsx'

const ROUND = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r]))
const COLUMNS = ['R16', 'QF', 'SF', 'F']

function pct(p) {
  if (p <= 0) return '–'
  if (p >= 0.995) return '100'
  if (p < 0.005) return '<1'
  return String(Math.round(p * 100))
}

const windowLabel = ({ from, to }) =>
  from === to ? `${ROUND[from].short} only` : `${ROUND[from].short} → ${ROUND[to].short}`

// Odds per round and expected matches, for every club still in it, over a
// window of rounds: the expected-matches column leads because it's the
// fantasy question — how long will a player from this club keep scoring
// before you can next rebuild your squad for free?
export default function KnockoutOutlook({ ko, picks, mode, stage }) {
  const { teamsByAbbr } = useTeams()
  const [openAbbr, setOpenAbbr] = useState(null)
  const [chosenWindow, setChosenWindow] = useState(null)
  const ratingOf = (abbr) => teamsByAbbr[abbr]?.rating ?? 3

  const allOdds = useMemo(
    () => knockoutOdds(ko, (abbr) => teamsByAbbr[abbr]?.rating ?? 3, { picks: mode === 'mine' ? picks : {} }),
    [ko, picks, mode, teamsByAbbr],
  )
  const next = nextRound(allOdds)
  // Presets, deduplicated so two buttons never select the same window (the
  // same mistake as "Next 6" = "All 5" in the matchday picker).
  const presets = next
    ? [{ from: next, to: next }, squadWindow(next), { from: next, to: 'F' }].filter(
        (w, i, all) => all.findIndex((x) => x.from === w.from && x.to === w.to) === i,
      )
    : []
  const plan =
    presets.find((w) => chosenWindow && w.from === chosenWindow.from && w.to === chosenWindow.to) ??
    (next ? squadWindow(next) : null)

  const odds = useMemo(
    () =>
      allOdds
        .filter((t) => t.expMatches > 0 || t.win > 0)
        .map((t) => ({ ...t, ...(plan ? windowStats(t, plan, (a) => teamsByAbbr[a]?.rating ?? 3) : {}) }))
        .sort(
          (a, b) =>
            (b.matches ?? b.expMatches) - (a.matches ?? a.expMatches) ||
            (a.oppAvg ?? 0) - (b.oppAvg ?? 0) ||
            a.rank - b.rank,
        ),
    [allOdds, plan, teamsByAbbr],
  )
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr
  const cap = plan ? ROUND[plan.from].clubCap : null

  const drawNote = {
    standings: ' Both draws are still to come, so every possible draw is averaged in.',
    playoffs: ' The R16 draw is still to come, so every possible draw is averaged in.',
    bracket: '',
  }[stage]

  return (
    <section className="mb-4">
      <p className="mb-3 text-xs text-ucl-muted">
        Expected matches in the chosen rounds, how strong those opponents are, and each club&rsquo;s chance (%) to reach
        every round. Built from your strength ratings
        {mode === 'mine' ? ', with your bracket picks treated as certain' : ''}.{drawNote} Tap a club for its path.
      </p>

      {presets.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ucl-muted">Plan for</span>
          <div role="group" aria-label="Rounds to plan for" className="flex rounded-lg bg-white/5 p-0.5">
            {presets.map((w) => {
              const active = w.from === plan.from && w.to === plan.to
              return (
                <button
                  key={`${w.from}-${w.to}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setChosenWindow(w)}
                  className={`min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
                    active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
                  }`}
                >
                  {windowLabel(w)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {plan && <StackNote plan={plan} cap={cap} top={odds.slice(0, 3)} nameOf={nameOf} />}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ucl-muted">
            <tr>
              <th scope="col" className="px-2 py-2 text-left font-semibold">
                Club
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center font-semibold"
                title="Expected matches in the rounds you're planning for"
              >
                <span className="sm:hidden">Exp.</span>
                <span className="hidden sm:inline">Matches</span>
              </th>
              <th
                scope="col"
                className="px-0.5 py-2 text-center font-semibold"
                title="Average strength (1–5) of the opponents in those matches"
              >
                Opp.
              </th>
              {COLUMNS.map((r) => (
                <th key={r} scope="col" className="px-0.5 py-2 text-center font-semibold">
                  {ROUND[r].short}
                </th>
              ))}
              <th scope="col" className="px-0.5 py-2 pr-2 text-center font-semibold">
                Win
              </th>
            </tr>
          </thead>
          <tbody>
            {odds.map((t) => {
              const open = openAbbr === t.abbr
              return (
                <Fragment key={t.abbr}>
                  <tr
                    className={`cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04] ${open ? 'bg-white/[0.04]' : ''}`}
                    onClick={() => setOpenAbbr(open ? null : t.abbr)}
                  >
                    <th scope="row" className="px-2 py-1.5 text-left font-semibold">
                      <button
                        type="button"
                        aria-expanded={open}
                        className="flex min-h-[32px] w-full min-w-0 items-center gap-1.5 text-left"
                      >
                        <TeamBadge abbr={t.abbr} size={20} />
                        <span className="sm:hidden">{t.abbr}</span>
                        <span className="hidden truncate sm:inline">{nameOf(t.abbr)}</span>
                        {open ? (
                          <ChevronUp size={14} className="hidden shrink-0 text-ucl-muted sm:block" aria-hidden="true" />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="hidden shrink-0 text-ucl-muted sm:block"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                    <td className="px-1 py-1.5 text-center font-display text-base font-extrabold">
                      {(t.matches ?? t.expMatches).toFixed(1)}
                    </td>
                    <OppCell avg={t.oppAvg} />
                    {COLUMNS.map((r) => (
                      <ProbCell key={r} p={t.reach[r]} />
                    ))}
                    <ProbCell p={t.win} last />
                  </tr>
                  {open && (
                    <tr className="bg-white/[0.04]">
                      <td colSpan={COLUMNS.length + 4} className="px-2 pb-3 pt-1">
                        <ClubPath team={t} ratingOf={ratingOf} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function OppCell({ avg }) {
  if (avg == null) return <td className="px-0.5 py-1.5 text-center text-xs text-ucl-muted">–</td>
  const color = ratingColor(difficultyBand(avg))
  return (
    <td className="px-0.5 py-1.5 text-center">
      <span
        className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-md px-0.5 text-xs font-bold tabular-nums sm:min-w-[32px] sm:px-1"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {avg.toFixed(1)}
      </span>
    </td>
  )
}

// The stack question in one line: how many players you may take from one
// club this round, and which clubs give the most matches in the window.
function StackNote({ plan, cap, top, nameOf }) {
  const rounds = roundsIn(plan)
  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-ucl-star/80">
        <span className="font-semibold text-ucl-star">Stacking for {windowLabel(plan)}:</span> up to {cap} players per
        club in the {ROUND[plan.from].name.toLowerCase()}
        {rounds.length > 1 ? ', rising in later rounds' : ''}. Most matches in this window:
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {top.map((t) => (
          <span key={t.abbr} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs">
            <TeamBadge abbr={t.abbr} size={18} />
            <span className="font-semibold">{nameOf(t.abbr)}</span>
            <span className="text-ucl-muted">{t.matches.toFixed(1)}</span>
          </span>
        ))}
      </div>
      {plan.from === 'PO' && plan.to === 'PO' && (
        <p className="mt-2 text-[11px] text-ucl-muted">
          Transfers are unlimited again before the R16, so this squad only has to last the play-offs.
        </p>
      )}
      {plan.to === 'F' && rounds.includes('QF') && (
        <p className="mt-2 text-[11px] text-ucl-muted">
          After the R16 there are no more unlimited transfers, so a squad picked now has to carry you towards the final.
        </p>
      )}
    </div>
  )
}

function ProbCell({ p, last = false }) {
  return (
    <td className={`px-0.5 py-1.5 text-center ${last ? 'pr-2' : ''}`}>
      <span
        className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-md px-0.5 text-xs font-semibold tabular-nums sm:min-w-[34px] sm:px-1"
        style={{ backgroundColor: p > 0 ? `rgba(67, 97, 255, ${0.08 + 0.55 * p})` : 'transparent' }}
      >
        {pct(p)}
      </span>
    </td>
  )
}

// Round by round: how likely the club gets there, who it'd most likely meet,
// how hard that is on average, and whether it would host the second leg.
function ClubPath({ team, ratingOf }) {
  const rounds = KO_ROUNDS.filter((r) => team.path[r.id].p > 0 && team.path[r.id].legsLeft > 0)
  if (!rounds.length) return <p className="text-xs text-ucl-muted">No knockout matches left.</p>
  return (
    <ol className="space-y-2">
      {rounds.map((round) => {
        const step = team.path[round.id]
        const top = step.opponents.slice(0, 3)
        const avg = step.opponents.reduce((s, o) => s + o.p * ratingOf(o.abbr), 0)
        const color = ratingColor(difficultyBand(avg))
        const home =
          round.id === 'F'
            ? 'Neutral venue'
            : step.host2 >= 0.995
              ? 'Hosts the 2nd leg'
              : step.host2 <= 0.005
                ? '2nd leg away'
                : `Hosts the 2nd leg: ${pct(step.host2)}%`
        return (
          <li key={round.id} className="rounded-xl border border-white/5 bg-ucl-deep/60 p-2">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-semibold text-ucl-star">{round.name}</span>
              <span className="text-ucl-muted">{step.p >= 0.995 ? 'certain' : `${pct(step.p)}% to get here`}</span>
              <span className="text-ucl-muted">· {home}</span>
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: color.bg, color: color.text }}
                title="Average strength of the likely opponents (1–5)"
              >
                Opp. {avg.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {top.map((o) => (
                <span key={o.abbr} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-1 text-xs">
                  <TeamBadge abbr={o.abbr} size={16} />
                  <span className="font-semibold">{o.abbr}</span>
                  <span className="text-ucl-muted">{pct(o.p)}%</span>
                </span>
              ))}
              {step.opponents.length > top.length && (
                <span className="self-center text-[11px] text-ucl-muted">
                  +{step.opponents.length - top.length} more
                </span>
              )}
            </div>
          </li>
        )
      })}
      <li className="text-[11px] text-ucl-muted">Finished {ordinal(team.rank)} in the league phase.</li>
    </ol>
  )
}
