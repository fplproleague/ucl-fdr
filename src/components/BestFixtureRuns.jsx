import { useMemo, useState } from 'react'
import { TrendingUp, X } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { compareRuns, formatAvg } from '../utils/difficulty.js'
import { useFixtureRows } from '../utils/useFixtureRows.js'
import { useVisibleMds } from '../utils/useVisibleMds.js'
import TeamBadge from './TeamBadge.jsx'
import ControlBar from './ControlBar.jsx'
import FixtureChip from './FixtureChip.jsx'
import ViewHeading from './ViewHeading.jsx'

const PREVIEW = 8

export default function BestFixtureRuns() {
  const { visibleTeams, teamsByAbbr, hiddenCount, hideTeam, resetHidden, venueAdjust, from, to, skipMd } = useTeams()
  const [showAll, setShowAll] = useState(false)

  const mds = useVisibleMds(from, to, skipMd)
  const rows = useFixtureRows(visibleTeams, teamsByAbbr, mds, venueAdjust)
  const ranked = useMemo(() => [...rows].sort(compareRuns), [rows])

  // Teams whose selected window is much kinder than their league phase as a
  // whole. This is the insight people screenshot: not "who is easiest", but
  // "whose fixtures turn".
  const swings = useMemo(() => {
    if (mds.length >= TOTAL_MATCHDAYS) return []
    return [...rows]
      .map((r) => ({ ...r, delta: r.seasonAvg - r.avg }))
      .filter((r) => r.delta > 0.3)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
  }, [rows, mds.length])

  const visible = showAll ? ranked : ranked.slice(0, PREVIEW)

  return (
    <div className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <ViewHeading
        title="Best Fixture Runs"
        subtitle={`${visibleTeams.length} teams over MD${from}–MD${to}${skipMd ? ` (skipping MD${skipMd})` : ''}, easiest average first.`}
      />

      <ControlBar className="mb-3" />

      {hiddenCount > 0 && (
        <p className="mb-3 flex items-center gap-2 text-xs text-ucl-muted">
          {hiddenCount} team{hiddenCount === 1 ? '' : 's'} hidden
          <button
            type="button"
            onClick={resetHidden}
            className="font-semibold text-ucl-accent underline underline-offset-2 hover:text-ucl-star"
          >
            Show all
          </button>
        </p>
      )}

      {swings.length > 0 && (
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ucl-muted">
            <TrendingUp size={14} aria-hidden="true" />
            Biggest swing into this window
          </p>
          <ul className="space-y-1.5">
            {swings.map((s) => (
              <li key={s.team.id} className="flex items-center gap-2 text-xs">
                <TeamBadge abbr={s.team.abbr} size={18} />
                <span className="min-w-0 flex-1 truncate font-semibold">{s.team.name}</span>
                <span className="text-ucl-muted">
                  {formatAvg(s.seasonAvg)} over MD1–{TOTAL_MATCHDAYS} → {formatAvg(s.avg)} here
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-ucl-star/80">Every team is hidden</p>
          <button
            type="button"
            onClick={resetHidden}
            className="mt-2 text-sm font-semibold text-ucl-accent underline underline-offset-2 hover:text-ucl-star"
          >
            Show all teams
          </button>
        </div>
      ) : (
        <ol className="space-y-2">
          {visible.map((row, idx) => (
            <li key={row.team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ucl-accent/20 text-sm font-extrabold text-ucl-accent">
                  {idx + 1}
                </span>
                <TeamBadge abbr={row.team.abbr} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold sm:text-base">{row.team.name}</p>
                  <p className="text-[11px] text-ucl-muted">
                    avg {formatAvg(row.avg)} · {row.homes} home
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => hideTeam(row.team.id)}
                  aria-label={`Remove ${row.team.name} from this ranking`}
                  className="shrink-0 rounded p-1 text-ucl-muted/60 transition hover:bg-white/10 hover:text-ucl-star"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.fixtures.map((f) => (
                  // The MD travels with its own chip (rather than one shared
                  // header above the list) so it survives flex-wrap at any
                  // width and stays correct if a single card gets screenshotted
                  // on its own.
                  <div key={f.gw} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-ucl-muted/70">
                      MD{f.gw}
                    </span>
                    <FixtureChip
                      opp={f.opp}
                      oppName={teamsByAbbr[f.opp]?.name}
                      venue={f.venue}
                      rating={teamsByAbbr[f.opp]?.rating ?? 3}
                      venueAdjust={venueAdjust}
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {ranked.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 min-h-[44px] w-full rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-ucl-star/80 transition hover:bg-white/10"
        >
          {showAll ? 'Show top 8 only' : `Show all ${ranked.length} teams`}
        </button>
      )}
    </div>
  )
}
