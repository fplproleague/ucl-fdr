// The colour of an odds cell: one sequential ramp, dark to light in one hue,
// where lighter = better for a fantasy pick (more clean sheets, more goals
// for, fewer goals against). The number in the cell carries the precision;
// the ramp only has to make the order visible at a glance.
//
// It replaces a single blue at varying opacity, on a fixed scale: values
// that matter (47%, 37%, 40% clean-sheet chances) came out as nearly the
// same blue. Now the ramp is stretched over the values actually on screen
// (rampDomain), and steps in lightness and saturation together, so the
// same three cells are three visibly different shades.
//
// Teal-green (hue 175), not the accent blue the generated-app look leaned
// on, and not the FDR 1–5 colours: those mean "how hard is the opponent",
// and these cells are the bookmakers' numbers, deliberately separate.

const HUE = 175
// Lightness and chroma at the bad and the good end (OKLCH).
const LOW = { l: 0.24, c: 0.025 }
const HIGH = { l: 0.5, c: 0.1 }

// [min, max] of the values on screen, never narrower than `minSpan` so a
// near-flat column isn't stretched into fake contrast.
export function rampDomain(values, minSpan) {
  const xs = values.filter((v) => Number.isFinite(v))
  if (!xs.length) return [0, 1]
  let lo = Math.min(...xs)
  let hi = Math.max(...xs)
  if (hi - lo < minSpan) {
    const mid = (lo + hi) / 2
    lo = mid - minSpan / 2
    hi = mid + minSpan / 2
  }
  return [lo, hi]
}

// 0 = worst on screen, 1 = best.
export function goodness(value, [lo, hi], better = 'high') {
  const t = hi > lo ? (value - lo) / (hi - lo) : 0.5
  const clamped = Math.min(1, Math.max(0, t))
  return better === 'low' ? 1 - clamped : clamped
}

// OKLCH → sRGB hex (CSS Color 4 matrices), so the page doesn't depend on
// oklch() support.
function oklchToHex(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return `#${lin
    .map((x) => {
      const v = Math.min(1, Math.max(0, x))
      const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
      return Math.round(srgb * 255)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

// The fill for a goodness t in [0, 1]. Text stays the site's light ink on
// every shade: the ramp tops out at a lightness where that still clears
// 4.5:1 (tests/oddsRamp.test.js), so no cell flips to dark text halfway.
export function rampFill(t) {
  return oklchToHex(LOW.l + (HIGH.l - LOW.l) * t, LOW.c + (HIGH.c - LOW.c) * t, HUE)
}

export const RAMP_INK = '#e6e9ff'
