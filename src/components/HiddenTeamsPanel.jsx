import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useTeams } from '../context/TeamsContext.jsx'

// Same "reversible bulk action" concept as Fantasy Football Scout's hidden-
// players list — each hidden team gets its own way back in, not just an
// all-or-nothing reset.
export default function HiddenTeamsPanel({ onClose }) {
  const { hiddenTeams, showTeam, resetHidden } = useTeams()
  const doneButtonRef = useRef(null)

  useEffect(() => {
    doneButtonRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  // Nothing left to show once the last hidden team is added back — close
  // rather than leave an empty dialog on screen.
  useEffect(() => {
    if (hiddenTeams.length === 0) onClose()
  }, [hiddenTeams.length, onClose])

  if (hiddenTeams.length === 0) return null

  return (
    <div className="fixed inset-0 z-40 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hidden-teams-heading"
        className="relative flex h-full w-full flex-col overflow-y-auto bg-ucl-navy shadow-2xl sm:h-auto sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-white/10"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 id="hidden-teams-heading" className="font-display text-lg font-extrabold">
            Hidden teams
          </h2>
          <button
            type="button"
            ref={doneButtonRef}
            onClick={onClose}
            className="min-h-[40px] shrink-0 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-ucl-star transition hover:bg-white/10"
          >
            Done
          </button>
        </div>

        <div className="flex-1 px-4 py-4 sm:px-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ucl-muted">
            Tap a team to add it back
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => showTeam(team.id)}
                aria-label={`Add ${team.name} back`}
                className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-2.5 text-sm font-bold text-ucl-star transition hover:bg-white/10"
              >
                {team.abbr}
                <Plus size={16} aria-hidden="true" className="text-ucl-accent" />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={resetHidden}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-ucl-star transition hover:bg-white/10"
          >
            Add everything back
          </button>
        </div>
      </div>
    </div>
  )
}
