import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './OurServices.css'

const services = [
  { id: 0, title: 'Turnkey Projects', description: 'Complete interior solutions managed seamlessly from initial design to final project handover.' },
  { id: 1, title: 'Living Spaces', description: 'Beautiful, functional living spaces thoughtfully designed around your lifestyle and everyday comfort.' },
  { id: 2, title: 'Pooja Units', description: 'Elegant, space-efficient pooja units crafted for peaceful rituals and beautiful everyday living.' },
  { id: 3, title: 'Cafe Interiors', description: 'Inviting cafe spaces designed to enhance customer experience, functionality, comfort, and brand identity.' },
  { id: 4, title: 'Kitchen Interiors', description: 'Functional kitchens combining smart storage, efficient layouts, durable finishes, and modern aesthetics.' },
  { id: 5, title: 'Bedroom Interiors', description: 'Comfortable, calming bedrooms designed with personalised layouts, storage, lighting, and finishes.' },
]

export default function OurServices() {
  const section = useRef<HTMLElement>(null)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const dragged = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const exploreTrigger = useRef<HTMLButtonElement | null>(null)
  const [explored, setExplored] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const go = (index: number) => setActive((index + services.length) % services.length)

  useEffect(() => {
    if (explored === null) return
    const modal = dialog.current!
    const overflow = document.documentElement.style.overflow
    const gutter = document.documentElement.style.scrollbarGutter
    document.documentElement.style.scrollbarGutter = 'stable'
    document.documentElement.style.overflow = 'hidden'
    modal.showModal()
    return () => {
      modal.close()
      document.documentElement.style.overflow = overflow
      document.documentElement.style.scrollbarGutter = gutter
      exploreTrigger.current?.focus({ preventScroll: true })
    }
  }, [explored])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .25 })
    observer.observe(section.current!)
    return () => { observer.disconnect(); media.removeEventListener('change', change) }
  }, [])

  useEffect(() => {
    if (paused || reduced || !inView || explored !== null) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % services.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [paused, reduced, inView, active, explored])

  return (
    <section id="services" className="services" ref={section} aria-labelledby="services-title"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
      <div className="services__scene" role="region" aria-roledescription="carousel" aria-label="Our services"
        onKeyDown={event => {
          if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1) }
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1) }
        }}
        onPointerDown={event => {
          if (event.button !== 0) return
          gesture.current = { x: event.clientX, y: event.clientY }
          dragged.current = false
          const target = (event.target as Element).closest('button') ?? event.currentTarget
          target.setPointerCapture(event.pointerId)
        }}
        onPointerUp={event => {
          if (!gesture.current) return
          const dx = event.clientX - gesture.current.x
          const dy = event.clientY - gesture.current.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            dragged.current = true
            go(active + (dx < 0 ? 1 : -1))
          }
          gesture.current = null
        }}
        onPointerCancel={() => { gesture.current = null }}>
        <h2 id="services-title">Our Services</h2>
        {services.map((service, index) => {
          let offset = index - active
          if (offset > services.length / 2) offset -= services.length
          if (offset < -services.length / 2) offset += services.length
          const hidden = Math.abs(offset) > 2
          return (
            <div key={service.id} role="group"
              className={`services__card${offset === 0 ? ' is-active' : ''}`}
              style={{ '--offset': offset, '--direction': Math.sign(offset), '--scale': offset === 0 ? 1 : .704, zIndex: 12 - Math.abs(offset), opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' } as CSSProperties}
              aria-label={`${service.title}, service ${index + 1} of ${services.length}`}
              aria-hidden={hidden}>
              <button type="button" className="services__select" aria-label={`Select ${service.title}`} aria-pressed={index === active} tabIndex={hidden ? -1 : 0} onClick={() => { if (!dragged.current) go(index) }} />
              <span className="services__arch" aria-hidden="true" />
              <span className="services__flourish services__flourish--top" aria-hidden="true" />
              <span className="services__flourish services__flourish--bottom" aria-hidden="true" />
              <span className="services__copy">
              <span className="services__name">{service.title}</span>
              <span className="services__description">{service.description}</span></span>
              <button type="button" className="services__explore" aria-label={`Explore ${service.title}`} aria-haspopup="dialog" tabIndex={hidden ? -1 : 0}
                onClick={event => { if (!dragged.current) { exploreTrigger.current = event.currentTarget; setExplored(index) } }}>
                Explore
                <span className="services__explore-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" /></svg>
                </span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="services__controls" aria-label="Service carousel controls">
        <button type="button" onClick={() => go(active - 1)} aria-label="Previous service">←</button>
        {services.map((service, index) => <button type="button" className="services__dot" key={service.id} aria-label={`Show service ${index + 1}`} aria-pressed={index === active} onClick={() => go(index)} />)}
        <button type="button" onClick={() => go(active + 1)} aria-label="Next service">→</button>
        <button type="button" className="services__play" onClick={() => setReduced(value => !value)} aria-label={reduced ? 'Start automatic sliding' : 'Pause automatic sliding'}>{reduced ? '▶' : 'Ⅱ'}</button>
      </div>
      {explored !== null && createPortal(
        <dialog ref={dialog} className="services-gallery" aria-labelledby="services-gallery-title"
          onCancel={event => { event.preventDefault(); setExplored(null) }}
          onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setExplored(null) } }}
          onWheel={event => event.stopPropagation()} onTouchMove={event => event.stopPropagation()} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Tab') { event.preventDefault(); dialog.current?.querySelector<HTMLButtonElement>('.services-gallery__close')?.focus() } }}>
          <h2 id="services-gallery-title" className="sr-only">{services[explored].title} gallery</h2>
          <button type="button" className="services-gallery__close" aria-label="Close gallery" onClick={() => setExplored(null)} autoFocus>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <div className="services-gallery__frame">
            {[
              { x: 204, y: 354, w: 1056, h: 1027, alt: 'Spacious lounge with sculptural lighting and comfortable seating' },
              { x: 1327, y: 354, w: 498, h: 500, alt: 'Team meeting in a glass-partitioned room' },
              { x: 1888, y: 354, w: 498, h: 500, alt: 'Contemporary open office with exposed ceiling details' },
              { x: 1327, y: 918, w: 498, h: 463, alt: 'Bright lounge and informal meeting space' },
              { x: 1888, y: 918, w: 498, h: 463, alt: 'Collaborative office seating area' },
            ].map((photo, index) => (
              <div className={index === 0 ? 'services-gallery__photo services-gallery__photo--main' : 'services-gallery__photo'} key={photo.alt}>
                <img src="/media/services-gallery.png" alt={photo.alt} width="2591" height="1527"
                  style={{ width: `${2591 / photo.w * 100}%`, height: `${1527 / photo.h * 100}%`, left: `${-photo.x / photo.w * 100}%`, top: `${-photo.y / photo.h * 100}%` }} />
              </div>
            ))}
          </div>
        </dialog>, document.body
      )}
    </section>
  )
}
