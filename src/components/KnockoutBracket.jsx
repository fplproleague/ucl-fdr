import { useMemo, useState } from 'react'
import { Check, Home, Lock, RotateCcw, Share2, Sparkles, Trophy, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { KNOCKOUT, KO_ROUNDS, PLAYOFF_DRAW_DATE, R16_DRAW_DATE } from '../data/knockout.js'
import { demoKnockout } from '../data/knockoutDemo.js'
import { ROUND_ORDER, allTies, buildBracket, favouritePicks, playoffPairTeams, prunePicks } from '../utils/bracket.js'
import { ordinal } from '../utils/ordinal.js'
import TeamBadge from './TeamBadge.jsx'
import ViewHeading from './ViewHeading.jsx'
import KnockoutRules from './KnockoutRules.jsx'
import KnockoutOutlook from './KnockoutOutlook.jsx'
import KnockoutPlayers from './KnockoutPlayers.jsx'
import { useKnockoutPlan } from '../utils/useKnockoutPlan.js'
import KnockoutLegs from './KnockoutLegs.jsx'

const ROUND = Object.fromEntries(KO_ROUNDS.map((r) => [r.id, r]))

const drawDate = (d) => `${d.label}${d.confirmed ? '' : ' (expected)'}`

const legsLabel = (round) => ROUND[round].legs.map((l) => l.label).join(' & ')

export default function KnockoutBracket() {
  const { teamsByAbbr, demo, picks, setPicks, viewingShared, adoptSharedPicks, discardSharedPicks, koView, setKoView } =
    useTeams()
  const ko = useMemo(() => (demo ? demoKnockout(demo) : KNOCKOUT), [demo])
  const bracket = useMemo(() => buildBracket(ko, picks), [ko, picks])
  const { stage } = bracket
  // Model = the odds from ratings alone; My bracket = the same, but with the
  // user's picks treated as certain. Shared by Outlook and Legs.
  const [mode, setMode] = useState('model')
  const hasPicks = Object.keys(picks).length > 0
  const effectiveMode = mode === 'mine' && hasPicks ? 'mine' : 'model'

  // Which sub-views exist so far: Outlook needs the league table, Legs needs
  // at least the play-off draw.
  const views = [
    { id: 'bracket', label: 'Bracket' },
    ...(stage !== 'pre'
      ? [
          { id: 'odds', label: 'Outlook' },
          { id: 'players', label: 'Players' },
        ]
      : []),
    ...(stage === 'playoffs' || stage === 'bracket' ? [{ id: 'legs', label: 'Legs' }] : []),
  ]
  const view = views.some((v) => v.id === koView) ? koView : 'bracket'
  const plan = useKnockoutPlan({
    ko,
    picks,
    mode: effectiveMode,
    teamsByAbbr,
    enabled: view === 'odds' || view === 'players',
  })

  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr

  // Every change goes through prunePicks, so un-picking a play-off winner
  // also clears the later picks that only made sense with them in it.
  function pick(tieId, abbr) {
    const next = { ...picks }
    if (next[tieId] === abbr) delete next[tieId]
    else next[tieId] = abbr
    setPicks(prunePicks(ko, next))
  }

  const subtitle =
    view === 'odds'
      ? 'Who is likely to go how far, and how many matches each club has left.'
      : view === 'players'
        ? 'Expected points per player for the rounds you plan for.'
        : view === 'legs'
          ? 'Every club’s opponent and venue per leg, easiest first.'
          : {
              pre: 'Predict the knockouts, round by round, all the way to the final in Madrid.',
              standings: `The league phase is done. Play-off picks open after the draw on ${drawDate(PLAYOFF_DRAW_DATE)}.`,
              playoffs: `Pick your play-off winners. The full bracket follows the R16 draw on ${drawDate(R16_DRAW_DATE)}.`,
              bracket: 'Tap a club to send it through. Your bracket is saved on this device and in the link.',
            }[stage]

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading title="Knockouts" subtitle={subtitle} />

      {views.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Segmented label="View" options={views} value={view} onChange={setKoView} />
          {view !== 'bracket' && (stage === 'playoffs' || stage === 'bracket') && (
            <Segmented
              label="Odds based on"
              options={[
                { id: 'model', label: 'Model' },
                {
                  id: 'mine',
                  label: 'My bracket',
                  disabled: !hasPicks,
                  title: hasPicks ? undefined : 'Pick some winners first',
                },
              ]}
              value={effectiveMode}
              onChange={setMode}
            />
          )}
        </div>
      )}

      {demo && (
        <p className="mb-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Demo: the table, draws and results below are made up to preview this page — they aren&rsquo;t a prediction.
        </p>
      )}

      {viewingShared && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-ucl-accent/40 bg-ucl-accent/10 px-3 py-2">
          <p className="min-w-0 flex-1 text-xs text-ucl-star/90">
            You&rsquo;re looking at a bracket someone shared. Your own picks on this device are untouched.
          </p>
          <button
            type="button"
            onClick={discardSharedPicks}
            className="min-h-[36px] rounded-lg px-3 text-xs font-semibold text-ucl-star/80 hover:bg-white/10"
          >
            Back to mine
          </button>
          <button
            type="button"
            onClick={adoptSharedPicks}
            className="min-h-[36px] rounded-lg bg-ucl-accent px-3 text-xs font-semibold text-white"
          >
            Use this bracket
          </button>
        </div>
      )}

      {view === 'odds' && (
        <KnockoutOutlook
          allOdds={plan.odds}
          plan={plan.plan}
          presets={plan.presets}
          setPlan={plan.setPlan}
          clubStats={plan.clubStats}
          mode={effectiveMode}
          stage={stage}
        />
      )}
      {view === 'players' && (
        <KnockoutPlayers
          ko={ko}
          demo={demo}
          plan={plan.plan}
          presets={plan.presets}
          setPlan={plan.setPlan}
          clubStats={plan.clubStats}
        />
      )}
      {view === 'legs' && <KnockoutLegs ko={ko} picks={picks} mode={effectiveMode} standings={ko.standings} />}

      {view === 'bracket' && stage === 'pre' && <BeforeKnockouts />}
      {view === 'bracket' && stage === 'standings' && <Qualified standings={ko.standings} nameOf={nameOf} />}

      {view === 'bracket' && (stage === 'playoffs' || stage === 'bracket') && (
        <>
          <PickBar
            bracket={bracket}
            nameOf={nameOf}
            disabled={viewingShared}
            onFavourites={() => setPicks(favouritePicks(ko, picks, (abbr) => teamsByAbbr[abbr]?.rating ?? 3))}
            onReset={() => setPicks({})}
          />
          {ROUND_ORDER.filter((r) => bracket.rounds[r].length).map((round) => (
            <RoundSection
              key={round}
              round={round}
              ties={bracket.rounds[round]}
              nameOf={nameOf}
              onPick={viewingShared ? null : pick}
            />
          ))}
          {stage === 'playoffs' && <R16Preview pools={bracket.r16Pools} nameOf={nameOf} />}
        </>
      )}

      <KnockoutRules />
    </div>
  )
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg bg-white/5 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={`min-h-[36px] rounded-[6px] px-3 text-xs font-semibold transition disabled:opacity-40 ${
            value === o.id ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 ${className}`}>
      {title && <h3 className="mb-2 font-display text-sm font-bold tracking-wide sm:text-base">{title}</h3>}
      {children}
    </section>
  )
}

function BeforeKnockouts() {
  const steps = [
    { when: '27 Jan', what: 'MD8 ends the league phase: top 8 straight to the R16, 9th–24th into the play-offs.' },
    { when: drawDate(PLAYOFF_DRAW_DATE), what: 'Play-off draw: pick your play-off winners here.' },
    { when: drawDate(R16_DRAW_DATE), what: 'R16 draw fixes the whole bracket: pick every round up to the final.' },
  ]
  return (
    <Card title="The bracket opens after MD8">
      <ol className="space-y-2">
        {steps.map((s) => (
          <li key={s.what} className="flex gap-3 text-sm">
            <span className="w-24 shrink-0 font-semibold text-ucl-star">{s.when}</span>
            <span className="text-ucl-star/75">{s.what}</span>
          </li>
        ))}
      </ol>
      <FormatNotes />
    </Card>
  )
}

function FormatNotes() {
  return (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-ucl-muted">
      <li>
        Play-offs pair 9th/10th with 23rd/24th, 11th/12th with 21st/22nd, and so on. The draw only picks which of the
        two.
      </li>
      <li>
        1st/2nd meet the 15th–18th play-off winners in the R16, 7th/8th the 9th/10th–23rd/24th winners. 1st and 2nd can
        only meet in the final.
      </li>
      <li>There&rsquo;s no QF or SF draw. Once the R16 is drawn, every path to the final is fixed.</li>
      <li>The higher seed hosts the second leg. A club that knocks out a seed takes over its slot.</li>
    </ul>
  )
}

function Qualified({ standings, nameOf }) {
  const pairs = playoffPairTeams(standings)
  const chip = (abbr, rank) => (
    <span key={abbr} className="inline-flex items-center gap-1.5 text-sm">
      <span className="w-5 text-right text-[11px] text-ucl-muted">{rank}</span>
      <TeamBadge abbr={abbr} size={20} />
      <span className="truncate">{nameOf(abbr)}</span>
    </span>
  )
  return (
    <>
      <Card title="Straight to the round of 16">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
          {standings.slice(0, 8).map((abbr, i) => chip(abbr, i + 1))}
        </div>
      </Card>
      <Card title={`Play-off pairings, drawn on ${drawDate(PLAYOFF_DRAW_DATE)}`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {pairs.map((p) => (
            <div key={p.seeded[0]} className="rounded-xl bg-white/[0.04] p-2.5">
              <div className="flex flex-col gap-1">{p.seededTeams.map((a, i) => a && chip(a, p.seeded[i]))}</div>
              <p className="my-1 pl-7 text-[11px] font-semibold uppercase tracking-wider text-ucl-muted">v one of</p>
              <div className="flex flex-col gap-1">{p.unseededTeams.map((a, i) => a && chip(a, p.unseeded[i]))}</div>
            </div>
          ))}
        </div>
        <FormatNotes />
      </Card>
    </>
  )
}

function PickBar({ bracket, nameOf, disabled, onFavourites, onReset }) {
  const [copied, setCopied] = useState(false)
  const open = allTies(bracket).filter((t) => !t.result)
  const picked = open.filter((t) => t.pick).length
  const champion = bracket.champion

  async function share() {
    const url = window.location.href
    const text = champion
      ? `My Champions League bracket: ${nameOf(champion)} win it all.`
      : 'My Champions League bracket'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'UCL Knockout Bracket', text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // share sheet dismissed, or no clipboard permission — nothing to undo
    }
  }

  const btn =
    'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-40'
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex min-h-[40px] w-full min-w-0 items-center gap-2 sm:mr-auto sm:w-auto">
        {champion ? (
          <>
            <Trophy size={18} className="shrink-0 text-amber-300" aria-hidden="true" />
            <TeamBadge abbr={champion} size={24} />
            <span className="truncate text-sm font-bold">{nameOf(champion)}</span>
          </>
        ) : (
          <span className="text-sm text-ucl-star/75">
            <span className="font-bold text-ucl-star">{picked}</span>/{open.length} ties picked
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onFavourites}
        disabled={disabled}
        className={`${btn} bg-white/5 hover:bg-white/10`}
      >
        <Sparkles size={14} aria-hidden="true" />
        Fill with favourites
      </button>
      <button type="button" onClick={share} className={`${btn} bg-ucl-accent text-white hover:bg-ucl-accent/90`}>
        <Share2 size={14} aria-hidden="true" />
        {copied ? 'Link copied' : 'Share'}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={disabled || picked === 0}
        aria-label="Clear all picks"
        title="Clear all picks"
        className={`${btn} px-2.5 text-ucl-star/70 hover:bg-white/10`}
      >
        <RotateCcw size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

const GRID = {
  PO: 'sm:grid-cols-2 lg:grid-cols-4',
  R16: 'sm:grid-cols-2 lg:grid-cols-4',
  QF: 'sm:grid-cols-2 lg:grid-cols-4',
  SF: 'sm:grid-cols-2',
  F: 'sm:mx-auto sm:max-w-sm',
}

function RoundSection({ round, ties, nameOf, onPick }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-bold sm:text-lg">{ROUND[round].name}</h3>
        <span className="text-[11px] text-ucl-muted">{legsLabel(round)}</span>
      </div>
      <div className={`grid gap-2 ${GRID[round]}`}>
        {ties.map((tie) => (
          <TieCard key={tie.id} tie={tie} nameOf={nameOf} onPick={onPick} />
        ))}
      </div>
    </section>
  )
}

const TIE_LABEL = (id) => id.replace('R16-', 'R16 · ').replace(/^PO(\d)/, 'Play-off $1')

function TieCard({ tie, nameOf, onPick }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ucl-deep/60 p-1.5">
      <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ucl-muted">
        {tie.id === 'F' ? 'Final' : TIE_LABEL(tie.id)}
      </p>
      <div className="flex flex-col gap-1">
        {tie.sides.map((side, i) => (
          <SideRow
            key={side.abbr ?? `${tie.id}-${i}`}
            tie={tie}
            side={side}
            hostsSecondLeg={tie.home2 === i}
            nameOf={nameOf}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
}

function SideRow({ tie, side, hostsSecondLeg, nameOf, onPick }) {
  if (!side.abbr) {
    const from = side.fromSides?.map((s) => s.abbr).filter(Boolean)
    return (
      <div className="flex min-h-[44px] items-center rounded-lg border border-dashed border-white/10 px-2.5 text-xs text-ucl-muted">
        Winner of {from?.length === 2 ? from.join(' / ') : TIE_LABEL(side.from ?? '')}
      </div>
    )
  }

  const decided = tie.result != null
  const isWinner = tie.winner === side.abbr
  const isOut = tie.winner != null && !isWinner
  // A real result that went against this pick: shown, not hidden, so the
  // bracket keeps telling you what you said.
  const wrongPick = decided && tie.pick === side.abbr && !isWinner

  let tone = 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07]'
  if (isWinner) tone = decided ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-ucl-accent/60 bg-ucl-accent/20'
  else if (isOut) tone = 'border-white/5 bg-transparent opacity-50'

  return (
    <button
      type="button"
      disabled={decided || !onPick}
      onClick={() => onPick?.(tie.id, side.abbr)}
      aria-pressed={!decided ? isWinner : undefined}
      className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2 text-left transition disabled:cursor-default ${tone}`}
    >
      <TeamBadge abbr={side.abbr} size={22} />
      <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${isOut && decided ? 'line-through' : ''}`}>
        {nameOf(side.abbr)}
      </span>
      {side.rank && <span className="text-[10px] text-ucl-muted">{ordinal(side.rank)}</span>}
      {hostsSecondLeg && (
        <span title="Hosts the second leg" className="shrink-0 text-ucl-star/50">
          <Home size={13} aria-hidden="true" />
          <span className="sr-only">Hosts the second leg</span>
        </span>
      )}
      <span className="flex w-4 shrink-0 justify-center">
        {decided && isWinner && <Lock size={13} className="text-emerald-300" aria-label="Through" />}
        {wrongPick && <X size={14} className="text-red-300" aria-label="Your pick, knocked out" />}
        {!decided && isWinner && <Check size={15} className="text-ucl-accent" aria-hidden="true" />}
      </span>
    </button>
  )
}

// Between the play-off draw and the R16 draw: who each top-8 club could get,
// with the user's own play-off picks already filled in.
function R16Preview({ pools, nameOf }) {
  const label = (tie) => (tie.winner ? nameOf(tie.winner) : `${tie.sides[0].abbr} / ${tie.sides[1].abbr}`)
  return (
    <Card title={`Round of 16, drawn on ${drawDate(R16_DRAW_DATE)}`}>
      <p className="mb-2 text-xs text-ucl-muted">
        Each pair of seeds goes to opposite halves and meets one of the two play-off winners next to it. Once the draw
        is in, you can pick every round to the final.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {pools.map((pool) => (
          <div key={pool.seeds[0].rank} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 text-sm">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {pool.seeds.map((s) => (
                <span key={s.abbr} className="flex min-w-0 items-center gap-1.5">
                  <TeamBadge abbr={s.abbr} size={18} />
                  <span className="truncate font-semibold">{nameOf(s.abbr)}</span>
                  <span className="text-[10px] text-ucl-muted">{ordinal(s.rank)}</span>
                </span>
              ))}
            </div>
            <span className="text-[10px] font-semibold uppercase text-ucl-muted">v</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {pool.ties.map((t) => (
                <span key={t.id} className="flex min-w-0 items-center gap-1.5">
                  {t.winner && <TeamBadge abbr={t.winner} size={18} />}
                  <span className={`truncate ${t.winner ? 'font-semibold' : 'text-xs text-ucl-muted'}`}>
                    {label(t)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
