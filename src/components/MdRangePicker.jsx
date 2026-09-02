import { MATCHDAY_LABEL, currentMatchday } from '../data/matchdays.js'
import { TOTAL_MATCHDAYS } from '../data/fixtures.js'

// One shared range control, used by every view. Two things changed from the old
// picker: the "To" list can no longer be set below "From" (the old pair let you
// pick MD5→MD2 and the entire table vanished behind "Pick a valid GW range"),
// and the presets exist because with two transfers per matchday the next four
// is the window people can actually act on.
export default function MdRangePicker({ from, to, onChange, className = '' }) {
  const now = currentMatchday()
  const presets = [
    { label: 'Next 4', from: now, to: Math.min(TOTAL_MATCHDAYS, now + 3) },
    { label: 'Next 6', from: now, to: Math.min(TOTAL_MATCHDAYS, now + 5) },
    { label: `All ${TOTAL_MATCHDAYS}`, from: 1, to: TOTAL_MATCHDAYS },
  ]

  const all = Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => i + 1)

  function handleFrom(next) {
    onChange(next, Math.max(next, to))
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-white/10 bg-white/[0.03] px-2.5 py-2 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor="md-from">
          From matchday
        </label>
        <select
          id="md-from"
          value={from}
          onChange={(e) => handleFrom(Number(e.target.value))}
          className="min-h-[40px] rounded-lg border border-white/10 bg-ucl-deep px-2 text-sm font-semibold text-ucl-star"
        >
          {all.map((md) => (
            <option key={md} value={md}>
              MD{md}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="text-ucl-muted">
          →
        </span>
        <label className="sr-only" htmlFor="md-to">
          To matchday
        </label>
        <select
          id="md-to"
          value={to}
          onChange={(e) => onChange(from, Number(e.target.value))}
          className="min-h-[40px] rounded-lg border border-white/10 bg-ucl-deep px-2 text-sm font-semibold text-ucl-star"
        >
          {all
            .filter((md) => md >= from)
            .map((md) => (
              <option key={md} value={md}>
                MD{md}
              </option>
            ))}
        </select>
      </div>

      <div className="flex rounded-lg bg-white/5 p-0.5">
        {presets.map((p) => {
          const active = from === p.from && to === p.to
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.from, p.to)}
              aria-pressed={active}
              className={`min-h-[36px] rounded-[6px] px-2 text-[11px] font-semibold transition ${
                active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
