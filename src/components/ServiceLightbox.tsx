import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import './ServiceLightbox.css'

type Props = { title: string; photos: string[]; onClose: () => void }
type Point = { x: number; y: number }
type Gesture =
  | { mode: 'swipe'; start: Point; time: number; axis: 'x' | 'y' | null }
  | { mode: 'pan'; start: Point; time: number; tx: number; ty: number; moved: boolean }
  | { mode: 'pinch'; distance: number; mid: Point; scale: number; tx: number; ty: number }

const MAX_SCALE = 4
const TAP_ZOOM = 2.5
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const pad = (value: number) => String(value).padStart(2, '0')

/* Full-screen gallery for a service: the photos rise in over a blurred olive
   backdrop and are browsed by gesture alone — drag or swipe to slide,
   double-tap, pinch or scroll to zoom, swipe down to close. */
export default function ServiceLightbox({ title, photos, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const images = useRef<(HTMLImageElement | null)[]>([])
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null)
  const wheel = useRef({ x: 0, lockedUntil: 0 })
  const [index, setIndex] = useState(0)
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const zoomed = view.scale > 1.01

  const close = () => setClosing(true)
  const go = (next: number) => {
    const target = clamp(next, 0, photos.length - 1)
    if (target === index) return
    setIndex(target)
    setView({ scale: 1, x: 0, y: 0 })
    setInteracted(true)
  }

  // Keep a zoomed photo covering the stage instead of drifting off it.
  const bounded = (scale: number, x: number, y: number) => {
    const image = images.current[index]
    const area = stage.current
    if (!image || !area || scale <= 1) return { scale: 1, x: 0, y: 0 }
    const limitX = Math.max(0, (image.offsetWidth * scale - area.clientWidth) / 2)
    const limitY = Math.max(0, (image.offsetHeight * scale - area.clientHeight) / 2)
    return { scale, x: clamp(x, -limitX, limitX), y: clamp(y, -limitY, limitY) }
  }

  // Zoom so the point under the finger or cursor stays where it is.
  const zoomAt = (scale: number, point: Point, from = view) => {
    const slide = slides.current[index]
    if (!slide) return
    const rect = slide.getBoundingClientRect()
    const px = point.x - (rect.left + rect.width / 2)
    const py = point.y - (rect.top + rect.height / 2)
    const next = clamp(scale, 1, MAX_SCALE)
    const ratio = next / from.scale
    setView(bounded(next, px - (px - from.x) * ratio, py - (py - from.y) * ratio))
    setInteracted(true)
  }

  const latest = useRef({ zoomAt, go, bounded, view, index })
  useEffect(() => { latest.current = { zoomAt, go, bounded, view, index } })

  useEffect(() => {
    const modal = dialog.current!
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    modal.showModal()
    return () => {
      modal.close()
      root.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, reduced ? 0 : 480)
    return () => window.clearTimeout(timer)
  }, [closing, onClose, reduced])

  // Wheel and trackpad: vertical scroll or pinch zooms, a horizontal swipe
  // slides (or pans a zoomed photo). Native so the browser's own zoom is held.
  useEffect(() => {
    const area = stage.current!
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const { zoomAt, go, bounded, view, index } = latest.current
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      if (horizontal && !event.ctrlKey) {
        if (view.scale > 1.01) { setView(bounded(view.scale, view.x - event.deltaX, view.y)); return }
        const now = performance.now()
        if (now < wheel.current.lockedUntil) return
        wheel.current.x += event.deltaX
        if (Math.abs(wheel.current.x) > 60) {
          go(index + Math.sign(wheel.current.x))
          wheel.current = { x: 0, lockedUntil: now + 550 }
        }
        return
      }
      zoomAt(view.scale * Math.exp(-event.deltaY * (event.ctrlKey ? .01 : .0018)), { x: event.clientX, y: event.clientY }, view)
    }
    area.addEventListener('wheel', onWheel, { passive: false })
    return () => area.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    if (points.length === 2) {
      setDrag({ x: 0, y: 0 })
      gesture.current = { mode: 'pinch', distance: distance(points[0], points[1]), mid: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }, scale: view.scale, tx: view.x, ty: view.y }
    } else if (points.length === 1) {
      const start = { x: event.clientX, y: event.clientY }
      gesture.current = zoomed
        ? { mode: 'pan', start, time: performance.now(), tx: view.x, ty: view.y, moved: false }
        : { mode: 'swipe', start, time: performance.now(), axis: null }
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const current = gesture.current
    if (!current) return
    if (current.mode === 'pinch') {
      const [a, b] = [...pointers.current.values()]
      if (!b) return
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const slide = slides.current[index]!.getBoundingClientRect()
      const px = current.mid.x - (slide.left + slide.width / 2)
      const py = current.mid.y - (slide.top + slide.height / 2)
      const scale = clamp(current.scale * distance(a, b) / current.distance, .85, MAX_SCALE)
      const ratio = scale / current.scale
      setDragging(true)
      setView({ scale, x: px - (px - current.tx) * ratio + mid.x - current.mid.x, y: py - (py - current.ty) * ratio + mid.y - current.mid.y })
      return
    }
    const dx = event.clientX - current.start.x
    const dy = event.clientY - current.start.y
    if (current.mode === 'pan') {
      if (Math.hypot(dx, dy) > 6) current.moved = true
      if (!current.moved) return
      setDragging(true)
      setView(bounded(view.scale, current.tx + dx, current.ty + dy))
      return
    }
    if (!current.axis) {
      if (Math.hypot(dx, dy) < 8) return
      current.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      setInteracted(true)
    }
    setDragging(true)
    if (current.axis === 'x') {
      const atEdge = (index === 0 && dx > 0) || (index === photos.length - 1 && dx < 0)
      setDrag({ x: atEdge ? dx * .3 : dx, y: 0 })
    } else {
      setDrag({ x: 0, y: dy })
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return
    const current = gesture.current
    setDragging(false)

    if (current?.mode === 'pinch') {
      const settled = view.scale < 1.05 ? { scale: 1, x: 0, y: 0 } : bounded(view.scale, view.x, view.y)
      setView(settled)
      const remaining = [...pointers.current.values()][0]
      gesture.current = remaining ? { mode: 'pan', start: remaining, time: performance.now(), tx: settled.x, ty: settled.y, moved: true } : null
      setInteracted(true)
      return
    }
    gesture.current = null
    if (!current) return

    const dx = event.clientX - current.start.x
    const dy = event.clientY - current.start.y
    const elapsed = Math.max(1, performance.now() - current.time)

    if (current.mode === 'swipe' && current.axis === 'x') {
      const width = stage.current!.clientWidth
      const velocity = dx / elapsed
      setDrag({ x: 0, y: 0 })
      if (dx < -width * .12 || (velocity < -.45 && dx < -24)) go(index + 1)
      else if (dx > width * .12 || (velocity > .45 && dx > 24)) go(index - 1)
      return
    }
    if (current.mode === 'swipe' && current.axis === 'y') {
      setDrag({ x: 0, y: 0 })
      if (Math.abs(dy) > 110 || Math.abs(dy / elapsed) > .6) close()
      return
    }
    if (current.mode === 'pan' && current.moved) return

    // A tap: two in quick succession toggle zoom; one on a side photo moves to it.
    const now = performance.now()
    const previous = lastTap.current
    if (previous && now - previous.time < 320 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 30) {
      lastTap.current = null
      if (zoomed) setView({ scale: 1, x: 0, y: 0 })
      else zoomAt(TAP_ZOOM, { x: event.clientX, y: event.clientY })
      return
    }
    lastTap.current = { time: now, x: event.clientX, y: event.clientY }
    const tapped = (event.target as Element).closest<HTMLElement>('[data-slide]')
    if (tapped && Number(tapped.dataset.slide) !== index && !zoomed) go(Number(tapped.dataset.slide))
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    gesture.current = null
    setDragging(false)
    setDrag({ x: 0, y: 0 })
    setView(current => bounded(current.scale, current.x, current.y))
  }

  const dismiss = Math.min(1, Math.abs(drag.y) / 320)

  return (
    <dialog ref={dialog} aria-label={`${title} gallery`}
      className={`lightbox${closing ? ' is-closing' : ''}${dragging ? ' is-dragging' : ''}${zoomed ? ' is-zoomed' : ''}`}
      style={{ '--dismiss': dismiss } as CSSProperties}
      onCancel={event => { event.preventDefault(); close() }}
      onKeyDown={event => {
        event.stopPropagation()
        if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1) }
        const middle = { x: innerWidth / 2, y: innerHeight / 2 }
        if (event.key === '+' || event.key === '=') zoomAt(view.scale * 1.5, middle)
        if (event.key === '-') zoomAt(view.scale / 1.5, middle)
        if (event.key === '0') setView({ scale: 1, x: 0, y: 0 })
      }}>
      <header className="lightbox__header">
        <div>
          <p className="lightbox__eyebrow">Our Services</p>
          <h2 className="lightbox__title">{title}</h2>
        </div>
        <button type="button" className="lightbox__close" aria-label="Close gallery" onClick={close} autoFocus>
          <span className="lightbox__close-label" aria-hidden="true">Close</span>
          <span className="lightbox__close-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </span>
        </button>
      </header>

      <div className="lightbox__stage" ref={stage}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        <div className="lightbox__track" style={{ '--index': index, '--drag-x': drag.x, '--drag-y': drag.y } as CSSProperties}>
          {photos.map((photo, slide) => (
            <div key={photo} data-slide={slide} ref={node => { slides.current[slide] = node }}
              className={`lightbox__slide${slide === index ? ' is-current' : ''}`} aria-hidden={slide !== index}>
              <img ref={node => { images.current[slide] = node }} src={photo} alt={`${title} inspiration ${slide + 1}`}
                draggable={false} loading={Math.abs(slide - index) <= 2 ? 'eager' : 'lazy'} decoding="async"
                onLoad={event => event.currentTarget.classList.add('is-loaded')}
                style={slide === index ? { transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` } : undefined} />
            </div>
          ))}
        </div>
      </div>

      <footer className="lightbox__footer">
        <p className="lightbox__count" aria-live="polite">
          <span className="sr-only">Photo {index + 1} of {photos.length}</span>
          <span aria-hidden="true"><strong>{pad(index + 1)}</strong><span className="lightbox__count-rule" />{pad(photos.length)}</span>
        </p>
        <span className="lightbox__progress" aria-hidden="true"><span style={{ width: `${(index + 1) / photos.length * 100}%` }} /></span>
        <p className={`lightbox__hint${interacted ? ' is-hidden' : ''}`} aria-hidden="true">
          <span className="lightbox__hint--touch">Swipe to browse · Pinch to zoom</span>
          <span className="lightbox__hint--pointer">Drag to browse · Scroll to zoom</span>
        </p>
      </footer>
    </dialog>
  )
}
