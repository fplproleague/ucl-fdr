import { Star } from 'lucide-react'

// What the FDR table and Best Runs show with the My teams filter on and no
// team to show. An empty table under "0 of 36 teams. Tap a row…" didn't say
// what My teams is or how to fill it, and the only way out was spotting the
// toggle you had just pressed.
//   pinnedCount: pinned teams overall; above 0 means they're all hidden
export default function MyTeamsEmpty({ pinnedCount, onShowAll }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center">
      <p className="text-sm font-semibold text-ucl-star/90">
        {pinnedCount > 0 ? 'Your pinned teams are all hidden' : 'No teams in My teams yet'}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ucl-muted">
        My teams is your shortlist: the clubs you own players from or are targeting. With the filter on, this view
        shows only them.{' '}
        {pinnedCount > 0 ? (
          'Show them again from “Show hidden teams”, or turn the filter off.'
        ) : (
          <>
            Add a team with the <Star size={12} aria-label="star" className="-mt-0.5 inline" /> on its row, or in its
            panel (tap the team).
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-3 min-h-[40px] rounded border border-white/15 px-4 text-sm font-semibold text-ucl-star transition hover:bg-white/10"
      >
        Show all teams
      </button>
    </div>
  )
}
