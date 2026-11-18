import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { compareRows, winCounts } from '../utils/playerCompare.js'
import { MATCHDAY_LABEL } from '../data/matchdays.js'
import TeamBadge from './TeamBadge.jsx'
import FixtureChip from './FixtureChip.jsx'

// Players side by side: stats as rows, players as columns, the best value
// in each row picked out, and a bar per value where more is better. A row
// with match-by-match data opens to show where its number comes from. The
// table always fits its box (fixed layout, no sideways scroll): the Players
// tab caps a phone at three players for that. Opens as its own screen once
// the players are picked (full screen on a phone, a dialog on a desktop).
export default function ComparePlayers({
  players,
  hiddenCount = 0,
  max,
  mds,
  teamsByAbbr,
  venueAdjust,
  domesticMatches,
  scoreLabel,
  onRemove,
  onClear,
  onClose,
}) {
  const [openRow, setOpenRow] = useState(null)
  const closeRef = useRef(null)
  // Same as the team details: the page behind stops scrolling, Escape closes.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  const rows = useMemo(
    () => compareRows(players, { domesticMatches, scoreLabel }),
    [players, domesticMatches, scoreLabel],
  )
  const wins = winCounts(rows, players.length)
  const mostWins = Math.max(0, ...wins)
  const groups = [...new Set(rows.map((r) => r.group))]
  const nameOf = (abbr) => teamsByAbbr[abbr]?.shortName ?? teamsByAbbr[abbr]?.name ?? abbr
  const cols = players.length + 1

  return (
    <div className="fixed inset-0 z-40 sm:flex sm:items-start sm:justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-heading"
        className="relative h-full w-full overflow-y-auto bg-ucl-navy pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-lg sm:border sm:border-white/10"
      >
        <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-white/10 bg-ucl-navy px-3">
          <h2 id="compare-heading" className="min-w-0 flex-1 truncate text-sm font-semibold">
            Compare players{' '}
            <span className="font-normal text-ucl-muted">
              ({players.length}/{max})
            </span>
          </h2>
          <button
            type="button"
            onClick={onClear}
            className="min-h-[36px] rounded px-2.5 text-xs font-semibold text-ucl-star/70 hover:bg-white/10"
          >
            Clear
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close the comparison"
            className="flex h-9 w-9 items-center justify-center rounded text-ucl-star/70 hover:bg-white/10 hover:text-ucl-star"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {players.length < 2 && (
          <p className="px-3 pt-2 text-xs text-ucl-muted">Close this and tap VS on another player to compare.</p>
        )}
        {hiddenCount > 0 && (
          <p className="px-3 pt-2 text-xs text-ucl-muted">
            A phone shows {max} players: {hiddenCount} more {hiddenCount === 1 ? 'is' : 'are'} in this comparison on a
            bigger screen.
          </p>
        )}

        <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
          <colgroup>
            <col className="w-[84px] sm:w-[150px]" />
            {players.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="sticky top-12 z-10 bg-ucl-navy px-2 py-2 text-left sm:px-3">
                <span className="sr-only">Stat</span>
              </th>
              {players.map((p, i) => (
                <th
                  key={p.id}
                  scope="col"
                  className="sticky top-12 z-10 bg-ucl-navy px-1 pb-2 pt-1 align-top font-normal"
                >
                  {/* The cross sits in the column's corner, out of the centred
                    stack of badge, name and wins. */}
                  <div className="relative flex flex-col items-center gap-1 rounded-lg bg-white/[0.03] px-1 pb-1.5 pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      aria-label={`Remove ${p.name} from the comparison`}
                      className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded text-ucl-star/40 hover:bg-white/10 hover:text-ucl-star"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                    <TeamBadge abbr={p.team} size={24} />
                    <span className="w-full truncate text-xs font-semibold leading-tight">{p.name}</span>
                    <span className="w-full truncate text-[10px] leading-tight text-ucl-muted">
                      {p.position} · {nameOf(p.team)}
                    </span>
                    {players.length > 1 && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          wins[i] === mostWins && mostWins > 0
                            ? 'bg-white/15 text-ucl-star'
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
            {groups.map((group) => (
              <Fragment key={group}>
                <GroupHeader label={group} cols={cols} />
                {group === 'Fixtures' &&
                  // One row per matchday, so the order reads top to bottom
                  // and every player's fixture on a matchday lines up.
                  mds.map((md) => (
                    <tr key={md}>
                      <th scope="row" className="px-2 py-1 text-left font-normal sm:px-3">
                        <span className="font-semibold text-ucl-star/85">MD{md}</span>{' '}
                        <span className="hidden text-[10px] text-ucl-muted sm:inline">{MATCHDAY_LABEL[md]}</span>
                      </th>
                      {players.map((p) => {
                        const f = p.fixtures.find((x) => x.gw === md)
                        return (
                          <td key={p.id} className="px-1 py-1 text-center">
                            {f ? (
                              <FixtureChip
                                opp={f.opp}
                                oppName={teamsByAbbr[f.opp]?.name}
                                venue={f.venue}
                                rating={teamsByAbbr[f.opp]?.rating ?? 3}
                                venueAdjust={venueAdjust}
                                awayDifficulty={teamsByAbbr[f.opp]?.awayDifficulty ?? 0}
                              />
                            ) : (
                              <span className="text-ucl-muted">–</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                {rows
                  .filter((r) => r.group === group)
                  .map((row) => {
                    const key = `${row.group}|${row.label}`
                    return (
                      <StatRow
                        key={key}
                        row={row}
                        open={openRow === key}
                        onToggle={() => setOpenRow(openRow === key ? null : key)}
                      />
                    )
                  })}
              </Fragment>
            ))}
          </tbody>
        </table>
        <p className="px-3 pb-2.5 pt-1 text-[10px] text-ucl-muted">
          Tap a stat with <ChevronDown size={10} className="inline" aria-hidden="true" /> to see it match by match.
        </p>
      </div>
    </div>
  )
}

function GroupHeader({ label, cols }) {
  return (
    <tr>
      <th
        scope="colgroup"
        colSpan={cols}
        className="border-t border-white/10 px-2 pb-1 pt-2.5 text-left section-label sm:px-3"
      >
        {label}
      </th>
    </tr>
  )
}

function StatRow({ row, open, onToggle }) {
  const label = (
    <>
      <span className="min-w-0 flex-1">{row.label}</span>
      {row.breakdown && (
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 text-ucl-muted transition ${open ? 'rotate-180' : ''}`}
        />
      )}
    </>
  )
  return (
    <>
      <tr className={open ? 'bg-white/[0.04]' : ''}>
        <th scope="row" title={row.hint} className="px-2 py-1 text-left font-normal text-ucl-star/80 sm:px-3">
          {row.breakdown ? (
            <button
              type="button"
              aria-expanded={open}
              onClick={onToggle}
              className="-mx-1 flex w-[calc(100%+0.5rem)] items-start gap-1 rounded px-1 py-0.5 text-left hover:bg-white/[0.06]"
            >
              {label}
            </button>
          ) : (
            <span className="flex items-start gap-1">{label}</span>
          )}
        </th>
        {row.text.map((text, i) => {
          const best = row.best.has(i)
          const cell = (
            <>
              <span className={best ? 'font-semibold text-ucl-star' : 'text-ucl-star/75'}>
                {text}
                {best && <span className="sr-only"> (best)</span>}
              </span>
              {row.subs[i] && <span className="block text-[10px] text-ucl-muted">{row.subs[i]}</span>}
              {row.bars && row.values[i] != null && (
                <span className="mx-auto mt-0.5 block h-1 w-full max-w-[72px] overflow-hidden rounded bg-white/[0.06]">
                  <span
                    className={`block h-full rounded ${best ? 'bg-white/70' : 'bg-white/25'}`}
                    style={{ width: `${row.bars[i]}%` }}
                  />
                </span>
              )}
            </>
          )
          return (
            <td
              key={i}
              className={`px-1 py-1 text-center align-top tabular-nums ${best ? 'rounded bg-white/[0.05]' : ''}`}
            >
              {row.breakdown?.[i] ? (
                <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full">
                  {cell}
                </button>
              ) : (
                cell
              )}
            </td>
          )
        })}
      </tr>
      {open && (
        <tr className="bg-white/[0.04]">
          <td className="px-2 pb-2 align-top text-[10px] leading-tight text-ucl-muted sm:px-3">Match by match</td>
          {row.breakdown.map((matches, i) => (
            <td key={i} className="px-1 pb-2 align-top">
              {matches ? (
                <ul className="space-y-1">
                  {matches.map((m) => (
                    <li
                      key={m.key}
                      title={m.title}
                      className={`rounded px-1.5 py-1 ${m.hit ? 'bg-ucl-accent/15' : 'bg-white/[0.03]'}`}
                    >
                      <span className="block truncate text-[10px] text-ucl-muted">{m.label}</span>
                      <span className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-1">
                        <span className={`truncate ${m.hit ? 'font-semibold text-ucl-star' : 'text-ucl-star/70'}`}>
                          {m.value}
                        </span>
                        {m.sub && <span className="shrink-0 text-[10px] text-ucl-muted">{m.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="block text-center text-ucl-muted">–</span>
              )}
            </td>
          ))}
        </tr>
      )}
    </>
  )
}
