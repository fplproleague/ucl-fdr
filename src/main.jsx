import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted variable Archivo: one 35 KB latin file for every weight,
// served from our own origin instead of a render-blocking Google Fonts
// stylesheet plus seven static weight files on two extra hosts.
import '@fontsource-variable/archivo/wght.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
