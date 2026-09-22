import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import './scrollDirection'
import App from './App.tsx'

// The production build ships the page prerendered (scripts/prerender.mjs):
// hydrate that markup. In development #root starts empty, so render into it.
const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
