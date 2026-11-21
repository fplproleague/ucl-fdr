import { useId, useState } from 'react'
import { useTeams } from '../context/TeamsContext.jsx'
import { RATING_METHOD } from '../data/teams.js'
import MdRangePicker from './MdRangePicker.jsx'
import { ActiveChips, OptionsButton, OptionsPanel, Toolbar } from './Toolbar.jsx'
import { useSharedOptions } from '../utils/useSharedOptions.jsx'

// Every view with a matchday range shares this bar, laid out the same way:
// the range first, the view's own controls (children) after it, Options last
// on the right. What's behind Options is the view's tiles plus the shared
// ones (`shared`: which of home/away, the day split, my teams and "ignore a
// matchday" apply here); each one that's changed shows as a chip under the
// bar, so the bar can stay short without hiding what's switched on.
//   tiles / chips / onReset: the view's own options, chips and reset
//   range: { from, to, setRange, skipMd, setSkipMd } for a view with a range
//          of its own (GK Rotation) instead of the shared one
export default function ControlBar({ children, tiles = [], chips = [], onReset, shared = {}, range, className = '' }) {
  const ctx = useTeams()
  const { from, to, setRange } = range ?? ctx
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const common = useSharedOptions(shared, range)
  const allTiles = [...tiles, ...common.tiles]
  const allChips = [...chips, ...common.chips]
  const changed = allChips.filter((c) => c.onRemove).length
  const reset = () => {
    onReset?.()
    common.reset()
  }

  return (
    <div className={className}>
      <Toolbar>
        {/* A row of its own on a phone when the view has controls of its own,
            so they and Options share the next one instead of Options
            wrapping alone; with none, Options sits beside the range. */}
        <MdRangePicker from={from} to={to} onChange={setRange} className={children ? 'w-full sm:w-auto' : ''} />
        {children}
        {allTiles.length > 0 && (
          <OptionsButton open={open} onToggle={() => setOpen((v) => !v)} count={changed} controls={panelId} />
        )}
      </Toolbar>
      {open && (
        <OptionsPanel id={panelId} onClose={() => setOpen(false)} onReset={changed > 0 ? reset : undefined}>
          {allTiles}
        </OptionsPanel>
      )}
      <ActiveChips chips={allChips} onClearAll={reset} />
    </div>
  )
}

// How a fixture's difficulty is worked out: opened from the ⓘ beside the
// title of the FDR table and Best Runs.
export function DifficultyInfo({ onClose }) {
  const { setTab } = useTeams()
  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-ucl-star/75">
      <ul className="space-y-1.5">
        {RATING_METHOD.map((line, i) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="text-ucl-muted">
              •
            </span>
            <span>
              {line}
              {i === 0 && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => setTab('strength')}
                    className="font-semibold text-ucl-link underline underline-offset-2 hover:text-ucl-star"
                  >
                    Go to Strength tab
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-[32px] text-xs font-semibold text-ucl-link underline-offset-2 hover:underline"
      >
        Close
      </button>
    </div>
  )
}
