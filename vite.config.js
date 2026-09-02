import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Most club badges are under Vite's 4 KB inline threshold, so they were
    // being base64'd into the main bundle — 33% bigger than the binary and
    // sitting in front of first paint. As separate files they are cached
    // individually and fetched lazily as rows scroll into view.
    assetsInlineLimit: 0,
  },
})
