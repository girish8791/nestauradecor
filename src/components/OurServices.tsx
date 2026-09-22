import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './OurServices.css'
import serviceGalleries from './serviceGalleries.json'
import ServiceLightbox from './ServiceLightbox'
import { REDUCED_MOTION, useMediaQuery } from '../useMediaQuery'

const services = [
  { id: 0, title: 'Turnkey Projects', description: 'Complete interior solutions managed seamlessly from initial design to final project handover.' },
  { id: 1, title: 'Living Spaces', description: 'Beautiful, functional living spaces thoughtfully designed around your lifestyle and everyday comfort.' },
  { id: 2, title: 'Pooja Units', description: 'Elegant, space-efficient pooja units crafted for peaceful rituals and beautiful everyday living.' },
  { id: 3, title: 'Café Interiors', description: 'Inviting café spaces designed to enhance customer experience, functionality, comfort, and brand identity.' },
  { id: 4, title: 'Kitchen Interiors', description: 'Functional kitchens combining smart storage, efficient layouts, durable finishes, and modern aesthetics.' },
  { id: 5, title: 'Bedroom Interiors', description: 'Comfortable, calming bedrooms designed with personalised layouts, storage, lighting, and finishes.' },
]

function NavigationArrow({ previous = false }: { previous?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={previous ? { transform: 'rotate(180deg)' } : undefined}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
}

export default function OurServices() {
  const section = useRef<HTMLElement>(null)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const dragged = useRef(false)
  const exploreTrigger = useRef<HTMLButtonElement | null>(null)
  const [explored, setExplored] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // useMediaQuery is false while prerendering, so the markup matches the server.
  const reduced = useMediaQuery(REDUCED_MOTION)
  const [inView, setInView] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const go = (index: number) => setActive((index + services.length) % services.length)

  const closeGallery = useCallback(() => {
    setExplored(null)
    exploreTrigger.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting) setRevealed(true)
    }, { threshold: .01, rootMargin: '0px 0px 18% 0px' })
    observer.observe(section.current!)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (paused || reduced || !inView || explored !== null) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % services.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [paused, reduced, inView, active, explored])

  return (
    <section id="services" className={`services${revealed || reduced ? ' is-visible' : ''}`} ref={section} aria-labelledby="services-title"
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
              style={{ '--reveal-delay': `${.275 + Math.abs(offset) * .16}s`, '--offset': offset, '--direction': Math.sign(offset), '--scale': offset === 0 ? 1 : .704, zIndex: 12 - Math.abs(offset), opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' } as CSSProperties}
              aria-label={`${service.title}, service ${index + 1} of ${services.length}`}
              aria-hidden={hidden}>
              <div className="services__card-reveal">
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
            </div>
          )
        })}
      </div>
      <div className="services__controls" aria-label="Service carousel controls">
        <button type="button" onClick={() => go(active - 1)} aria-label="Previous service"><NavigationArrow previous /></button>
        {services.map((service, index) => <button type="button" className="services__dot" key={service.id} aria-label={`Show service ${index + 1}`} aria-pressed={index === active} onClick={() => go(index)} />)}
        <button type="button" onClick={() => go(active + 1)} aria-label="Next service"><NavigationArrow /></button>
      </div>
      {explored !== null && createPortal(<ServiceLightbox title={services[explored].title} photos={serviceGalleries[explored]} onClose={closeGallery} />, document.body)}
    </section>
  )
}
