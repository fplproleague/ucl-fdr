import { availabilityOf } from '../utils/availability.js'

const TONES = {
  out: 'bg-fdr-5',
  doubt: 'bg-fdr-3',
  none: 'bg-ucl-muted/70',
}

// A small dot beside a player's name when UCL Fantasy flags him (injured,
// doubtful, suspended, not in the squad); nothing for a fit player. The
// status is the dot's tooltip, and spelled out for screen readers.
export function AvailabilityDot({ id, className = '' }) {
  const status = availabilityOf(id)
  if (!status) return null
  return (
    <span
      title={`${status.label} (UCL Fantasy)`}
      className={`inline-flex h-3 w-3 shrink-0 items-center justify-center ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${TONES[status.tone]}`} />
      <span className="sr-only">{status.label}</span>
    </span>
  )
}
