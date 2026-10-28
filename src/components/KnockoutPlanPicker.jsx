import { sameWindow, windowLabel } from '../utils/koWindow.js'

// "Plan for": which knockout rounds the Outlook and Players numbers cover.
export default function KnockoutPlanPicker({ presets, plan, onChange }) {
  if (!presets.length) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ucl-muted">Plan for</span>
      <div role="group" aria-label="Rounds to plan for" className="flex rounded-lg bg-white/5 p-0.5">
        {presets.map((w) => {
          const active = sameWindow(w, plan)
          return (
            <button
              key={`${w.from}-${w.to}`}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(w)}
              className={`min-h-[36px] rounded-[6px] px-2.5 text-xs font-semibold transition ${
                active ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
              }`}
            >
              {windowLabel(w)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
