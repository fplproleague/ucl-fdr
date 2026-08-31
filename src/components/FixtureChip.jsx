import { ratingColor } from '../utils/difficulty.js'

export default function FixtureChip({ opp, venue, rating, className = '' }) {
  const color = ratingColor(rating)
  return (
    <div
      className={`flex min-w-[60px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-1.5 py-1.5 text-[11px] font-bold sm:min-w-[68px] sm:text-xs ${className}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {opp} ({venue})
    </div>
  )
}
