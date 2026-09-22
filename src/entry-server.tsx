import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'

// Build-time render of the page (scripts/prerender.mjs), so the hero and the
// rest of the markup arrive in index.html and paint before the script runs.
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
