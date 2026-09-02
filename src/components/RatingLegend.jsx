import { RATING_COLORS } from '../data/teams.js'

// Compact by default: five swatches carrying their own digit, bracketed by
// "Easier"/"Harder". The old legend was a full card with five wrapped labels —
// about 110px of a phone screen spent on five words, permanently above the data.
export default function RatingLegend({ variant = 'compact', className = '' }) {
  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
        {Object.entries(RATING_COLORS).map(([r, c]) => (
          <div key={r} className="flex items-center gap-2 text-sm font-medium text-ucl-star/80">
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-black"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {r}
            </span>
            {c.label}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-ucl-muted sm:inline">Easier</span>
      <div className="flex gap-0.5">
        {Object.entries(RATING_COLORS).map(([r, c]) => (
          <span
            key={r}
            title={c.label}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-black"
            style={{ backgroundColor: c.bg, color: c.text }}
          >
            {r}
          </span>
        ))}
      </div>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-ucl-muted sm:inline">Harder</span>
    </div>
  )
}
