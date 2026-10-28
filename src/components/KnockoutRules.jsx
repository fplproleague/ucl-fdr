import { FANTASY_RULES_CONFIRMED, KO_ROUNDS } from '../data/knockout.js'

// The round whose last leg hasn't been played yet — the one a manager is
// planning for right now.
function nextRoundId(today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  return KO_ROUNDS.find((r) => r.legs[r.legs.length - 1].end >= iso)?.id ?? null
}

// UCL Fantasy's rules change every knockout round (club limit, free
// transfers), and that's the first thing people look up before a deadline.
export default function KnockoutRules() {
  const next = nextRoundId()
  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <h3 className="mb-2 font-display text-sm font-bold tracking-wide sm:text-base">UCL Fantasy rules by round</h3>
      {/* A list rather than a four-column table: on a phone the table needed
          sideways scrolling to reach the transfers column, which is the one
          people actually come for. */}
      <ul className="divide-y divide-white/5">
        {KO_ROUNDS.map((r) => (
          <li
            key={r.id}
            aria-current={r.id === next ? 'step' : undefined}
            className={`-mx-1.5 flex items-center gap-3 rounded-lg px-1.5 py-2 ${r.id === next ? 'bg-ucl-accent/10' : ''}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {r.name}
                {r.id === next && <span className="ml-1.5 text-[10px] font-semibold text-ucl-accent">NEXT</span>}
              </p>
              <p className="text-[11px] text-ucl-muted">{r.legs.map((l) => l.label).join(' & ')}</p>
            </div>
            <div className="w-16 shrink-0 text-center">
              <p className="text-sm font-bold">{r.clubCap}</p>
              <p className="text-[10px] leading-tight text-ucl-muted">per club</p>
            </div>
            <div className="w-24 shrink-0 text-center">
              <p className="text-sm font-bold">{r.transfers.filter(Boolean).join(' / ')}</p>
              <p className="text-[10px] leading-tight text-ucl-muted">
                {r.transfers[1] ? 'transfers, leg 1 / 2' : 'transfers'}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ucl-muted">
        {FANTASY_RULES_CONFIRMED
          ? 'Official 2026/27 UCL Fantasy rules.'
          : 'Based on the 2025/26 UCL Fantasy rules. UEFA hasn’t published the 2026/27 knockout rules yet, so this will be updated.'}{' '}
        Unused transfers don&rsquo;t carry over in the knockouts, and each extra transfer costs 4 points.
      </p>
    </section>
  )
}
