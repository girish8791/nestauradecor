import { useEffect, useRef, useState } from 'react'
import './Hero.css'

/* From the Figma frame "MacBook Pro 16" - 1": the copy at the left over the
   room media, which fills the whole hero under a flat dark tint.
   Load sequence: the copy rises in as soon as the page renders (it doesn't
   wait on the photo, so slow connections see the headline at once); the photo
   fades in when it has loaded. The photo stays for 5 seconds on screen, then
   the walkthrough video (silent, looping) fades in over it. The video only
   starts downloading once the page has finished loading and the browser is
   idle, and never on slow or data-saving connections. */
const BG_FALLBACK_MS = 1200  // show the photo layer anyway if it is slow
const PHOTO_MS = 5000        // how long the photo shows before the video takes over
const MIN_VIDEO_MBPS = 3     // below this estimated bandwidth the photo stays

type NetworkInfo = { saveData?: boolean; effectiveType?: string; downlink?: number }
const connectionIsSlow = () => {
  const c = (navigator as Navigator & { connection?: NetworkInfo }).connection
  if (!c) return false
  return !!c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType ?? '') || (c.downlink !== undefined && c.downlink > 0 && c.downlink < MIN_VIDEO_MBPS)
}

// Resolve once the load event has fired and the main thread is idle.
const afterPageLoad = () => new Promise<void>(resolve => {
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 3000 }) : setTimeout(resolve, 200))
  if (document.readyState === 'complete') idle()
  else addEventListener('load', idle, { once: true })
})

const PHOTO_SIZES = '100vw'
const VIDEO_SMALL = '/media/hero-walkthrough-720.mp4'   // phones and tablets
const VIDEO_LARGE = '/media/hero-walkthrough-1080.mp4'

export default function Hero() {
  const [ready, setReady] = useState(false)
  const [videoOn, setVideoOn] = useState(false)
  const photo = useRef<HTMLImageElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)

  // photo loaded (or taking too long) -> start the sequence
  useEffect(() => {
    if (photo.current?.complete) setReady(true)
    const t = window.setTimeout(() => setReady(true), BG_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [])

  // Once the photo is up and the page has finished loading, load the video. The
  // 5 seconds start when the media is on screen; after that the video plays
  // while it is on screen and pauses when scrolled away. Visitors who ask for
  // reduced motion or data saving, or are on a slow connection, keep the photo
  // and never download the video.
  useEffect(() => {
    const v = video.current
    const area = media.current
    if (!ready || !v || !area) return
    if (connectionIsSlow() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let t = 0
    let timeUp = false
    let io: IntersectionObserver | undefined
    const onPlaying = () => setVideoOn(true)
    const play = () => { v.play().catch(() => { /* autoplay refused: the photo stays */ }) }

    afterPageLoad().then(() => {
      if (cancelled || connectionIsSlow()) return
      v.muted = true
      v.src = window.matchMedia('(max-width: 900px)').matches ? VIDEO_SMALL : VIDEO_LARGE
      v.addEventListener('playing', onPlaying)
      io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          if (timeUp) v.pause()
          return
        }
        if (timeUp) play()
        else if (!t) t = window.setTimeout(() => { timeUp = true; play() }, PHOTO_MS)
      }, { threshold: 0.2 })
      io.observe(area)
    })

    return () => {
      cancelled = true
      window.clearTimeout(t)
      io?.disconnect()
      v.removeEventListener('playing', onPlaying)
      v.pause()
    }
  }, [ready])

  return (
    <section id="hero" className={ready ? 'hero is-ready' : 'hero'} aria-labelledby="hero-title">
      <div className="wrap hero__inner">
        <div className="hero__copy">
          <h1 id="hero-title">
            <span className="hero__line">Every space</span>{' '}
            <span className="hero__line">has an <em>aura</em></span>{' '}
            <span className="hero__line">We shape yours.</span>
          </h1>
          <p className="hero__lede">
            Nest Aura Decor creates interiors with an aura of their own, designed and built under
            one roof, from the first sketch to the final detail.
          </p>

          <div className="hero__cta">
            <a className="btn" href="#callback">Book Consultation</a>
            <a className="btn line" href="#possibilities">Our work</a>
          </div>
        </div>
      </div>

      {/* decorative room photo, then the walkthrough video over it, behind the whole hero */}
      <div ref={media} className="hero__media">
        <picture className="hero__photo">
          <source
            type="image/avif"
            srcSet="/media/hero-room-900.avif 900w, /media/hero-room-1500.avif 1500w, /media/hero-room-2400.avif 2400w"
            sizes={PHOTO_SIZES}
          />
          <source
            type="image/webp"
            srcSet="/media/hero-room-900.webp 900w, /media/hero-room-1500.webp 1500w, /media/hero-room-2400.webp 2400w"
            sizes={PHOTO_SIZES}
          />
          <img
            ref={photo}
            src="/media/hero-room-1500.jpg"
            srcSet="/media/hero-room-900.jpg 900w, /media/hero-room-1500.jpg 1500w, /media/hero-room-2400.jpg 2400w"
            sizes={PHOTO_SIZES}
            alt=""
            width="2400"
            height="1602"
            fetchPriority="high"
            onLoad={() => setReady(true)}
          />
        </picture>
        {/* src is set in the effect above, so nothing downloads until the page has loaded */}
        <video
          ref={video}
          className={videoOn ? 'hero__video is-on' : 'hero__video'}
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
        />
      </div>
    </section>
  )
}
