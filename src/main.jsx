import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted variable Archivo, served from our own origin instead of a
// render-blocking Google Fonts stylesheet plus seven static weight files on
// two extra hosts: one 35 KB latin file for every weight. The expanded
// display face is separate and much smaller (index.css); loading the
// two-axis wdth build for everything cost 90 KB.
import '@fontsource-variable/archivo/wght.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
