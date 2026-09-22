/* Marks the page while the reader scrolls upward (html[data-scroll="up"]).
   Section entrances are written for content arriving from below; when a
   section arrives from above it should already be in place, not still
   fading in, so layout.css settles reveals instantly while this is set.
   The mark clears shortly after scrolling stops, so hovers and the FAQ
   keep their motion. */
const root = document.documentElement
let last = scrollY
let idle = 0

addEventListener('scroll', () => {
  const delta = scrollY - last
  last = scrollY
  if (Math.abs(delta) < 2) return
  if (delta < 0) root.dataset.scroll = 'up'
  else delete root.dataset.scroll
  clearTimeout(idle)
  idle = window.setTimeout(() => delete root.dataset.scroll, 240)
}, { passive: true })
