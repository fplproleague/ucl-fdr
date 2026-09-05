import { difficultyBand, effectiveDifficulty, ratingColor, describeFixture } from '../utils/difficulty.js'
import { DAY_LABEL } from '../utils/matchdaySplit.js'

// One fixture cell. The difficulty band is printed as a small corner digit as
// well as painted as a colour: red/green is the one thing a sizeable slice of a
// football audience can't separate, and a ticker that only speaks in colour is
// unreadable for them.
//
// day/showDay/dimmed are the Matchday Split layer: showDay defaults to false,
// which returns the exact same single-node chip as before Matchday Split
// existed, so the tool is byte-for-byte unchanged when the toggle is off.
export default function FixtureChip({
  opp,
  oppName,
  venue,
  rating,
  venueAdjust = true,
  awayDifficulty = 0,
  day,
  showDay = false,
  dimmed = false,
  className = '',
}) {
  const awayBumpApplied = venue === 'A' && awayDifficulty > 0
  const effective = effectiveDifficulty(rating, venue, venueAdjust, awayDifficulty)
  const band = difficultyBand(effective)
  const color = ratingColor(band)
  const description = describeFixture(oppName ?? opp, venue, band)
  const awaySuffix = awayBumpApplied ? ` (+${awayDifficulty} away difficulty)` : ''
  const fullDescription = (showDay && day ? `${description} · ${DAY_LABEL[day]}` : description) + awaySuffix

  const chip = (
    <div
      className={`relative flex h-8 min-w-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-1.5 text-[11px] font-bold sm:min-w-[68px] sm:text-xs ${showDay ? '' : className}`}
      style={{ backgroundColor: color.bg, color: color.text }}
      title={fullDescription}
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
      {awayBumpApplied && (
        <span
          aria-hidden="true"
          className="absolute bottom-[1px] left-[3px] text-[8px] font-black leading-none opacity-60"
        >
          +{awayDifficulty}
        </span>
      )}
      <span className="sr-only">{fullDescription}</span>
    </div>
  )

  if (!showDay) return chip

  // The day is a small, neutral pill under the (unchanged) coloured FDR chip —
  // secondary to the rating, never competing with it for attention. Fixtures
  // outside the active day filter are dimmed, not removed, so the grid/ranking
  // never changes shape based on the filter.
  return (
    <div className={`inline-flex flex-col items-center gap-0.5 transition-opacity ${dimmed ? 'opacity-30' : ''} ${className}`}>
      {chip}
      {day && (
        <span className="rounded-full bg-white/10 px-1.5 py-px text-[8px] font-bold uppercase leading-none tracking-wide text-ucl-star/70">
          {day}
        </span>
      )}
    </div>
  )
}
