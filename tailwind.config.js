/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Variable"', 'Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Archivo Variable"', 'Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ucl: {
          navy: '#050a24',
          deep: '#0a1240',
          blue: '#0d2a6b',
          indigo: '#1b2ad9',
          accent: '#4361ff',
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
