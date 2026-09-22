import { useSyncExternalStore } from 'react'

/* A media query as React state that is safe to prerender: false on the server
   and during hydration, then the browser's live answer. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    change => {
      const media = matchMedia(query)
      media.addEventListener('change', change)
      return () => media.removeEventListener('change', change)
    },
    () => matchMedia(query).matches,
    () => false,
  )
}

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
