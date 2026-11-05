import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted variable Archivo, served from our own origin instead of a
// render-blocking Google Fonts stylesheet plus seven static weight files on
// two extra hosts. The wdth build carries the width axis as well as weight,
// for the expanded display face (.font-display). It costs more than the
// weight-only file (90 KB latin against 35 KB) and replaces it rather than
// adding to it: one family, one file, two voices.
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
