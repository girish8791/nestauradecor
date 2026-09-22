import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import './ScrollRail.css'

/* The page scrollbar: a hairline rail on the right edge with a slim olive
   thumb. It shows while the page moves or when the pointer comes near, fades
   away when idle, and the thumb can be dragged. */
export default function ScrollRail() {
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; scroll: number } | null>(null)
  const idle = useRef(0)
  const [thumb, setThumb] = useState({ top: 0, height: 0 })
  const [awake, setAwake] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const root = document.documentElement
      const track = rail.current?.clientHeight ?? innerHeight
      const ratio = innerHeight / root.scrollHeight
      const height = ratio >= 1 ? 0 : Math.max(48, track * ratio)
      const progress = scrollY / Math.max(1, root.scrollHeight - innerHeight)
      setThumb({ top: (track - height) * progress, height })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    const wake = () => {
      setAwake(true)
      clearTimeout(idle.current)
      idle.current = window.setTimeout(() => setAwake(false), 1100)
    }
    const onScroll = () => { schedule(); wake() }
    const resize = new ResizeObserver(schedule)
    resize.observe(document.body)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', schedule)
    measure()
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(idle.current)
      resize.disconnect()
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', schedule)
    }
  }, [])

  const scrollable = () => document.documentElement.scrollHeight - innerHeight
  const trackRoom = () => Math.max(1, rail.current!.clientHeight - thumb.height)

  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { y: event.clientY, scroll: scrollY }
    setDragging(true)
  }
  const onThumbMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const delta = (event.clientY - drag.current.y) / trackRoom() * scrollable()
    scrollTo({ top: drag.current.scroll + delta, behavior: 'instant' })
  }
  const onThumbUp = () => { drag.current = null; setDragging(false) }

  // Clicking the rail glides the page to that point.
  const onRailDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const bounds = rail.current!.getBoundingClientRect()
    const target = (event.clientY - bounds.top - thumb.height / 2) / trackRoom()
    scrollTo({ top: Math.min(1, Math.max(0, target)) * scrollable(), behavior: 'smooth' })
  }

  if (!thumb.height) return null

  return (
    <div className={`scroll-rail${awake || dragging ? ' is-awake' : ''}${dragging ? ' is-dragging' : ''}`} aria-hidden="true">
      <div className="scroll-rail__track" ref={rail} onPointerDown={onRailDown}>
        <div className="scroll-rail__thumb" style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
          onPointerDown={onThumbDown} onPointerMove={onThumbMove} onPointerUp={onThumbUp} onPointerCancel={onThumbUp} />
      </div>
    </div>
  )
}
