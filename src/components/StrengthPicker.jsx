import { RATING_COLORS } from '../data/teams.js'
import { formatRating } from '../utils/difficulty.js'

// The 1-5 strength buttons, extracted so the Strength tab and the team
// detail overlay share one editable control instead of the overlay showing
// a read-only copy of it.
//
// Half steps: "+½" lifts the current rating by half a step (4 → 4½), for the
// sides that sit between two bands — five 5-rated clubs aren't all equally
// strong, and the knockout odds feel that more than the FDR colours do.
// Tapping a number always sets that whole number. The compact overlay has no
// room for the extra button, so it only shows a half step on the active
// button; the Strength tab is where you set one.
export default function StrengthPicker({ team, onSetRating, compact = false }) {
  const size = compact ? 'h-8 w-8 text-xs' : 'h-10 w-8 text-xs sm:w-10'
  const whole = Math.floor(team.rating)
  const half = !Number.isInteger(team.rating)
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label={`${team.name} strength`}>
      {[1, 2, 3, 4, 5].map((r) => {
        const active = whole === r
        const color = RATING_COLORS[r]
        return (
          <button
            key={r}
            type="button"
            aria-label={`Set ${team.name} to ${r} — ${color.label}`}
            aria-pressed={active}
            onClick={() => onSetRating(team.id, r)}
            className={`flex items-center justify-center rounded-lg font-bold transition active:scale-90 ${size}`}
            style={{
              backgroundColor: active ? color.bg : 'rgba(255,255,255,0.06)',
              color: active ? color.text : 'rgba(230,233,255,0.55)',
              boxShadow: active ? `0 0 0 2px ${color.bg}55` : 'none',
            }}
          >
            {active ? formatRating(team.rating) : r}
          </button>
        )
      })}
      {!compact && (
        <button
          type="button"
          aria-label={half ? `Remove the half step from ${team.name}` : `Add half a step to ${team.name}`}
          aria-pressed={half}
          disabled={whole === 5}
          onClick={() => onSetRating(team.id, half ? whole : whole + 0.5)}
          className={`flex h-10 w-8 items-center justify-center rounded-lg text-[11px] font-bold transition active:scale-90 disabled:opacity-25 ${
            half ? 'bg-ucl-accent text-white' : 'bg-white/[0.06] text-ucl-star/55 hover:bg-white/10'
          }`}
        >
          +½
        </button>
      )}
    </div>
  )
}
