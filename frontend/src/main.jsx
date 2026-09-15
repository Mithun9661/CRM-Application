import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './LoginPolish.css'
import './reference-fix.css'
import './hero-section.css'
import './fresh-login.css'
import './dashboard-dark.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
