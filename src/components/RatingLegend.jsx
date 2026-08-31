import { RATING_COLORS } from '../data/teams.js'

export default function RatingLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
      {Object.entries(RATING_COLORS).map(([r, c]) => (
        <div key={r} className="flex items-center gap-1.5 text-[11px] text-ucl-star/70">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.bg }} />
          {c.label}
        </div>
      ))}
    </div>
  )
}
