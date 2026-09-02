import { difficultyBand, effectiveDifficulty, ratingColor, describeFixture } from '../utils/difficulty.js'

// One fixture cell. The difficulty band is printed as a small corner digit as
// well as painted as a colour: red/green is the one thing a sizeable slice of a
// football audience can't separate, and a ticker that only speaks in colour is
// unreadable for them.
export default function FixtureChip({ opp, oppName, venue, rating, venueAdjust = true, className = '' }) {
  const effective = effectiveDifficulty(rating, venue, venueAdjust)
  const band = difficultyBand(effective)
  const color = ratingColor(band)

  return (
    <div
      className={`relative flex h-8 min-w-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-1.5 text-[11px] font-bold sm:min-w-[68px] sm:text-xs ${className}`}
      style={{ backgroundColor: color.bg, color: color.text }}
      title={describeFixture(oppName ?? opp, venue, band)}
    >
      <span aria-hidden="true">
        {opp} ({venue})
      </span>
      <span
        aria-hidden="true"
        className="absolute right-[3px] top-[1px] text-[9px] font-black leading-none opacity-60"
      >
        {band}
      </span>
      <span className="sr-only">{describeFixture(oppName ?? opp, venue, band)}</span>
    </div>
  )
}
