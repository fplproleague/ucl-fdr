import { RATING_COLORS } from '../data/teams.js'

// The 1-5 strength buttons, extracted so the Strength tab and the team
// detail overlay share one editable control instead of the overlay showing
// a read-only copy of it.
export default function StrengthPicker({ team, onSetRating, compact = false }) {
  const size = compact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-xs'
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label={`${team.name} strength`}>
      {[1, 2, 3, 4, 5].map((r) => {
        const active = team.rating === r
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
            {r}
          </button>
        )
      })}
    </div>
  )
}
