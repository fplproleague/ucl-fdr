/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Two radii, set here rather than as arbitrary values: 4px for anything
    // you operate (fixture chips, inputs, selects, buttons, badges) and 8px
    // for anything that holds other things (panels, table wrappers, the
    // segmented-control rails). There were five tokens plus three arbitrary
    // values, and pills for everything; squarer corners read as the dense,
    // editorial table this is. Replacing the scale (not extending it) means a
    // stray rounded-2xl generates nothing instead of quietly coming back.
    // full survives for two circles only: the crest in the header and the
    // star button in a team's detail panel.
    borderRadius: {
      none: '0',
      DEFAULT: '4px',
      lg: '8px',
      full: '9999px',
    },
    extend: {
      // coarse: a touch screen, at any width. Used where a control is fine for
      // a mouse but too small for a finger, so it moves somewhere larger.
      screens: {
        coarse: { raw: '(pointer: coarse)' },
      },
      // The type scale. Hierarchy used to come from six weights at two sizes
      // (most of the page was 12 or 14px), which is why it read as one flat
      // surface. Weights: 400, 600, 800 only.
      fontSize: {
        // View title ("FDR Table", "Players"): 800, display width.
        title: ['30px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        // Table body and the line under a title: 400 / 600.
        table: ['13px', '18px'],
        // Section labels (see .section-label) and meta lines: 11px.
        meta: ['11px', '16px'],
      },
      fontFamily: {
        display: ['"Archivo Variable"', 'Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Archivo Variable"', 'Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ucl: {
          navy: '#040818',
          // Raised surfaces: table heads, selects. Less saturated than the old
          // #0a1240, which read as a blue band across every table.
          deep: '#0C1330',
          blue: '#0d2a6b',
          indigo: '#1b2ad9',
          // Selection is white-on-navy, the way UEFA's own graphics mark state:
          // active tab, chosen segment, checked toggle, the one primary button.
          select: '#FFFFFF',
          selectInk: '#0C1330',
          // One warm accent, reserved for genuine emphasis: starred teams and
          // players, and the team ranked first in Best Runs. Champions League
          // broadcast gold. Never as text on a white pill (1.99:1).
          brass: '#D7B45A',
          // Kept for the few places that still need a blue tint (hover washes,
          // the odds cells, the focus ring), never for a filled selected state.
          accent: '#4361ff',
          // Text links. #4361ff as text on the navy measured 4.17:1, under AA
          // at the 12-14px the links are set in; this is the focus-ring blue
          // from index.css, 7.26:1.
          link: '#7f95ff',
          star: '#e6e9ff',
          // Secondary text. The old star/50 measured 4.48:1 on the navy
          // background — a hair under AA at the 10–11px sizes it was used at.
          muted: '#8f92b8',
        },
        fdr: {
          1: '#1e8a4c',
          2: '#7fc242',
          3: '#f2c14e',
          4: '#e8722c',
          5: '#d13438',
        },
      },
      boxShadow: {
        card: '0 8px 30px -8px rgba(0, 10, 60, 0.5)',
      },
    },
  },
  plugins: [],
}
