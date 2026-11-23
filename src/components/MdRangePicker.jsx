import { ChevronDown } from 'lucide-react'
import { currentMatchday } from '../data/matchdays.js'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'
import { Segmented } from './Toolbar.jsx'

// One shared range control, first in every view's toolbar. The "To" list can't
// be set below "From" (the old pair let you pick MD5→MD2 and the whole table
// vanished), and the presets exist because with two transfers per matchday
// the next four is the window people can actually act on. Leaving one
// matchday out ("Ignore MD") moved behind Options: it's for a Limitless
// week, not something to look past every visit.
export default function MdRangePicker({ from, to, onChange, className = '' }) {
  const now = currentMatchday()
  // "All" means all *remaining* matchdays — a played one has already dropped
  // off the site. A "Next N" preset only shows while N is smaller than that:
  // once it would be the same range as "All" it's a duplicate that lights up
  // together with it and reads as a bug.
  const remaining = TOTAL_MATCHDAYS - now + 1
  const presets = [
    ...[4, 6].filter((n) => n < remaining).map((n) => ({ id: `next${n}`, label: `Next ${n}`, from: now, to: now + n - 1 })),
    { id: 'all', label: `All ${remaining}`, from: now, to: TOTAL_MATCHDAYS },
  ]
  const active = presets.find((p) => p.from === from && p.to === to)?.id ?? null

  // A matchday whose window has closed is gone from every selector.
  const all = Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => i + 1).filter((md) => md >= now)

  const select =
    'h-full cursor-pointer appearance-none rounded bg-transparent pl-2.5 pr-6 text-sm font-semibold text-ucl-star outline-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ucl-link [&>option]:bg-ucl-deep'

  // The two selects share one rail, so the range reads as one value
  // ("MD5 → MD8") rather than two loose dropdowns; the presets sit beside it
  // as a segmented choice, lit when the range matches one.
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-10 items-center rounded-lg border border-white/10 bg-ucl-deep p-0.5">
        <label className="sr-only" htmlFor="md-from">
          From matchday
        </label>
        <span className="relative h-full">
          <select
            id="md-from"
            value={from}
            onChange={(e) => {
              const next = Number(e.target.value)
              onChange(next, Math.max(next, to))
            }}
            className={select}
          >
            {all.map((md) => (
              <option key={md} value={md}>
                MD{md}
              </option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ucl-muted" />
        </span>
        <span aria-hidden="true" className="px-0.5 text-ucl-muted">
          →
        </span>
        <label className="sr-only" htmlFor="md-to">
          To matchday
        </label>
        <span className="relative h-full">
          <select id="md-to" value={to} onChange={(e) => onChange(from, Number(e.target.value))} className={select}>
            {all
              .filter((md) => md >= from)
              .map((md) => (
                <option key={md} value={md}>
                  MD{md}
                </option>
              ))}
          </select>
          <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ucl-muted" />
        </span>
      </div>

      {remaining > 1 && (
        <Segmented
          label="Range presets"
          value={active}
          onChange={(id) => {
            const p = presets.find((x) => x.id === id)
            onChange(p.from, p.to)
          }}
          options={presets}
        />
      )}
    </div>
  )
}
