/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Archivo"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ucl: {
          navy: '#050a24',
          deep: '#0a1240',
          blue: '#0d2a6b',
          indigo: '#1b2ad9',
          accent: '#4361ff',
          star: '#e6e9ff',
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
