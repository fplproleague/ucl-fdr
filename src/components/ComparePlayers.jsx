import { forwardRef, useMemo } from 'react'
import { X } from 'lucide-react'
import { compareRows, winCounts } from '../utils/playerCompare.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'

// Up to five players side by side: stats as rows, players as columns, the
// best value in each row picked out, and a bar per value where more is
// better. A header line counts how many rows each player wins.
const ComparePlayers = forwardRef(function ComparePlayers(
  { players, teamsByAbbr, venueAdjust, domesticMatches, scoreLabel, onRemove, onClear },
  ref,
) {
  const rows = useMemo(
    () => compareRows(players, { domesticMatches, scoreLabel }),
    [players, domesticMatches, scoreLabel],
  )
  const wins = winCounts(rows, players.length)
  const mostWins = Math.max(0, ...wins)
  const groups = [...new Set(rows.map((r) => r.group))]
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr

  return (
    <section
      ref={ref}
      aria-label="Compare players"
      className="mb-3 scroll-mt-20 rounded-2xl border border-ucl-accent/30 bg-ucl-accent/[0.04]"
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2.5">
        <h2 className="text-sm font-bold">
          Compare players <span className="font-normal text-ucl-muted">({players.length}/5)</span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="min-h-[32px] rounded-lg px-2.5 text-xs font-semibold text-ucl-star/70 hover:bg-white/10"
        >
          Clear
        </button>
      </div>
      {players.length < 2 && (
        <p className="px-3 pb-1 text-xs text-ucl-muted">Add another player with the + next to his name.</p>
      )}

      <div className="relative overflow-x-auto pb-2">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 min-w-[104px] bg-ucl-navy/95 px-3 py-2 text-left">
                <span className="sr-only">Stat</span>
              </th>
              {players.map((p, i) => (
                <th key={p.id} scope="col" className="min-w-[84px] px-1.5 py-2 align-top font-normal">
                  <div className="flex flex-col items-center gap-0.5 text-center">
                    <div className="flex items-center gap-1">
                      <TeamBadge abbr={p.team} size={20} />
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        aria-label={`Remove ${p.name} from the comparison`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-ucl-star/50 hover:bg-white/10 hover:text-ucl-star"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="max-w-[96px] truncate text-xs font-semibold">{p.name}</span>
                    <span className="text-[10px] text-ucl-muted">
                      {p.position} · {nameOf(p.team)}
                    </span>
                    {players.length > 1 && (
                      <span
                        className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          wins[i] === mostWins && mostWins > 0
                            ? 'bg-ucl-accent/25 text-ucl-star'
                            : 'bg-white/5 text-ucl-muted'
                        }`}
                      >
                        Best in {wins[i]}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-ucl-navy/95 px-3 py-1.5 text-left font-normal">
                <span className="text-ucl-star/80">Fixtures</span>
              </th>
              {players.map((p) => (
                <td key={p.id} className="px-1.5 py-1.5">
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {p.fixtures.map((f) => (
                      <FixtureChip
                        key={f.gw}
                        opp={f.opp}
                        oppName={teamsByAbbr[f.opp]?.name}
                        venue={f.venue}
                        rating={teamsByAbbr[f.opp]?.rating ?? 3}
                        venueAdjust={venueAdjust}
                        awayDifficulty={teamsByAbbr[f.opp]?.awayDifficulty ?? 0}
                      />
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            {groups.map((group) => (
              <GroupRows
                key={group}
                group={group}
                rows={rows.filter((r) => r.group === group)}
                count={players.length}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
})

function GroupRows({ group, rows, count }) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={count + 1}
          className="border-t border-white/10 px-3 pb-1 pt-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ucl-muted"
        >
          {group}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.label}>
          <th
            scope="row"
            title={row.hint}
            className="sticky left-0 z-10 bg-ucl-navy/95 px-3 py-1 text-left font-normal text-ucl-star/80"
          >
            {row.label}
          </th>
          {row.text.map((text, i) => {
            const best = row.best.has(i)
            return (
              <td
                key={i}
                className={`px-1.5 py-1 text-center align-top tabular-nums ${best ? 'rounded-md bg-ucl-accent/[0.1]' : ''}`}
              >
                <span className={best ? 'font-bold text-ucl-star' : 'text-ucl-star/75'}>
                  {text}
                  {best && <span className="sr-only"> (best)</span>}
                </span>
                {row.subs[i] && <span className="block text-[10px] text-ucl-muted">{row.subs[i]}</span>}
                {row.bars && row.values[i] != null && (
                  <span className="mx-auto mt-0.5 block h-1 w-full max-w-[72px] overflow-hidden rounded-full bg-white/[0.06]">
                    <span
                      className={`block h-full rounded-full ${best ? 'bg-ucl-accent' : 'bg-ucl-accent/35'}`}
                      style={{ width: `${row.bars[i]}%` }}
                    />
                  </span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

export default ComparePlayers
