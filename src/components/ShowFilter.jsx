import { ListFilter } from 'lucide-react'

// One small menu instead of a row of toggles: All / Starred / My teams /
// … in a single control. Options with nothing behind them (no starred
// players, no pinned teams) are left out, and with only "All" left the
// control isn't drawn at all — a toolbar only grows once you use stars or
// pins.
//   options: [{ id, label, count? }] — count 0 hides an option
export default function ShowFilter({ value, onChange, options, label = 'Show', className = '' }) {
  const available = options.filter((o) => o.count == null || o.count > 0)
  if (available.length < 2) return null
  const current = available.some((o) => o.id === value) ? value : available[0].id
  const active = current !== available[0].id
  return (
    <label
      className={`relative inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
        active ? 'bg-ucl-select text-ucl-selectInk' : 'bg-white/5 text-ucl-star/70 hover:bg-white/10'
      } ${className}`}
    >
      <ListFilter size={13} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold outline-none [&>option]:bg-ucl-deep [&>option]:text-ucl-star"
      >
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.count != null ? `${o.label} (${o.count})` : o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
