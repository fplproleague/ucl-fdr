export const PRICE_STEP = 0.5

// Max price in €0.5m steps. The top of the slider means no cap. Shared by
// Players, GK Rotation and Odds. It lived in PlayerProjections.jsx, which
// meant opening GK Rotation or Odds also downloaded the whole Players view
// (41 kB) for one slider.
export function PriceSlider({
  bounds,
  value,
  onChange,
  className = 'mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2',
  // Inside an Options tile, which already says "Max price" above it.
  inTile = false,
}) {
  const current = value ?? bounds.max
  return (
    <label className={`flex items-center gap-3 ${inTile ? 'w-full max-w-xs sm:w-56' : ''} ${className}`}>
      <span className={inTile ? 'sr-only' : 'shrink-0 section-label'}>Max price</span>
      <input
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={PRICE_STEP}
        value={current}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange(v >= bounds.max ? null : v)
        }}
        aria-valuetext={value == null ? 'Any price' : `€${current.toFixed(1)}m`}
        className="h-10 min-w-0 flex-1 accent-ucl-select"
      />
      <span className={`w-12 shrink-0 font-semibold tabular-nums ${inTile ? 'text-xs' : 'text-right text-sm'}`}>
        {value == null ? 'Any' : `€${current.toFixed(1)}m`}
      </span>
    </label>
  )
}
