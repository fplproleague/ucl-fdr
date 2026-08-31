import { RATING_COLORS } from '../data/teams.js'

export default function RatingLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
      {Object.entries(RATING_COLORS).map(([r, c]) => (
        <div key={r} className="flex items-center gap-2 text-sm font-medium text-ucl-star/80">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.bg }} />
          {c.label}
        </div>
      ))}
    </div>
  )
}
