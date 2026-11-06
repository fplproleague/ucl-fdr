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
}) {
  const current = value ?? bounds.max
  return (
    <label className={`flex items-center gap-3 ${className}`}>
      <span className="shrink-0 section-label">Max price</span>
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
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
        {value == null ? 'Any' : `€${current.toFixed(1)}m`}
      </span>
    </label>
  )
}
