import { useEffect, useRef } from 'react'
import './OurProcess.css'

const steps = [
  { title: 'Discovery call', text: 'Your brief, your budget, and our honest read on both.', kind: 'conversation', image: '/media/process-discovery-call.webp' },
  { title: 'Site measure', text: 'We visit, measure and photograph every wall and socket.', kind: 'measure', image: '/media/process-site-measure.webp' },
  { title: 'Concept & 3D views', text: 'Two directions, one review, one decision.', kind: 'design', image: '/media/process-concept-3d-views.webp' },
  { title: 'Fixed quote signed', text: 'Every material named. The number does not change.', kind: 'materials', image: '/media/process-fixed-quote-signed.webp' },
  { title: 'Workshop & site work', text: 'Weekly photo updates from the factory and the site.', kind: 'making', image: '/media/process-workshop-site-work.webp' },
  { title: 'Handover & styling', text: 'Keys, a care guide and a snag-fix window after you move in.', kind: 'home', image: '/media/process-handover-styling.webp' },
] as const

export default function OurProcess() {
  const journeyRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<SVGPathElement>(null)
  const runnerRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const journey = journeyRef.current!
    const progress = progressRef.current!
    const runner = runnerRef.current!
    const section = journey.closest('section')!
    const items = [...journey.querySelectorAll<HTMLElement>('.process__step')]
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let length = 0
    const measurePath = () => {
      const bounds = journey.getBoundingClientRect()
      const points = items.map(item => {
        const art = item.querySelector<HTMLElement>('.process__art')!
        return { x: item.offsetLeft + art.offsetLeft + art.offsetWidth / 2, y: item.offsetTop + art.offsetTop + art.offsetHeight / 2 }
      })
      const first = points[0]
      let d = `M ${first.x - 100} 0 Q ${first.x - 50} 60 ${first.x} ${first.y}`
      points.slice(1).forEach((point, i) => {
        const previous = points[i]
        const middle = (previous.y + point.y) / 2
        const swing = bounds.width * .16 * (i % 2 === 0 ? 1 : -1)
        d += ` C ${previous.x + swing} ${middle + 70}, ${point.x - swing} ${middle - 70}, ${point.x} ${point.y}`
      })
      const last = points[points.length - 1]
      d += ` Q ${last.x - 50} ${last.y + 100} ${last.x + 100} ${bounds.height}`
      const svg = progress.ownerSVGElement!
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`)
      progress.setAttribute('d', d)
      length = progress.getTotalLength()
      progress.style.strokeDasharray = `${length}`
      progress.style.strokeDashoffset = `${length - drawn}`
    }
    let frame = 0
    let drawn = 0
    let lineVelocity = 0
    let startedAt: number | null = null
    let previousTime = 0
    let heldStep: HTMLElement | null = null
    let releaseAt = 0
    let holdLimit = 0
    let holdY = 0
    let lastScrollY = scrollY
    let travel: { from: number; to: number; start: number; duration: number } | null = null
    const visited = new Set<HTMLElement>()
    const warmImages = () => {
      items.forEach(item => {
        const img = item.querySelector('img')!
        img.loading = 'eager'
        void img.decode().catch(() => {})
      })
    }
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { warmImages(); preload.disconnect() }
    }, { rootMargin: '600px' })
    preload.observe(section)

    const stepPosition = (item: HTMLElement) => {
      const rect = item.getBoundingClientRect()
      return scrollY + rect.top + rect.height / 2 - innerHeight * .55 + 8
    }
    const isHolding = () => heldStep !== null && performance.now() < Math.min(releaseAt, holdLimit)
    const hold = (item: HTMLElement) => {
      warmImages()
      heldStep = item
      visited.add(item)
      releaseAt = Infinity
      holdLimit = performance.now() + 4200
      holdY = stepPosition(item)
      // Ease into the next reading position instead of jumping a full step
      // on the first wheel event after a pause.
      travel = { from: scrollY, to: holdY, start: performance.now(), duration: Math.min(650, Math.max(280, Math.abs(holdY - scrollY) * 1.5)) }
      schedule()
    }
    const onScroll = () => {
      // Native touch inertia and scrollbar movement can bypass wheel events.
      // Keep the current step still until its short reading pause has ended.
      if (!motion.matches && !travel) {
        if (isHolding()) {
          if (scrollY < holdY - 2) heldStep = null
          else if (scrollY > holdY + 1) window.scrollTo({ top: holdY, behavior: 'instant' })
        } else if (scrollY > lastScrollY) {
          heldStep = null
          const crossed = items.find(item => {
            const position = stepPosition(item)
            return !visited.has(item) && position > lastScrollY && position <= scrollY
          })
          if (crossed) hold(crossed)
        }
      }
      lastScrollY = scrollY
      schedule()
    }

    // Pause only downward gestures that would pass an unrevealed step.
    // Upward scrolling and Escape always let the visitor leave immediately.
    const gateScroll = (delta: number, event: Event) => {
      if (!event.cancelable || motion.matches || delta === 0) return
      if (delta < 0) { heldStep = null; travel = null; return }
      if (heldStep) {
        if (isHolding()) {
          event.preventDefault()
          return
        }
        heldStep = null
      }
      const next = items.find(item => {
        const rect = item.getBoundingClientRect()
        const distance = rect.top + rect.height / 2 - innerHeight * .55 + 8
        return !visited.has(item) && distance >= -16 && distance <= delta
      })
      if (!next) return
      event.preventDefault()
      hold(next)
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      gateScroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event)
    }
    let touchY = 0
    const touchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0 }
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const y = event.touches[0].clientY
      gateScroll(touchY - y, event)
      touchY = y
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { heldStep = null; travel = null; return }
      if (event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [contenteditable]'))) return
      const delta = event.key === 'ArrowDown' ? 40 : event.key === 'ArrowUp' ? -40
        : event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey) ? innerHeight * .85
        : event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? -innerHeight * .85 : 0
      gateScroll(delta, event)
    }

    const update = (time: number) => {
      frame = 0
      if (motion.matches) { travel = null; heldStep = null }
      if (travel) {
        const t = Math.min(1, (time - travel.start) / travel.duration)
        // Quintic easing has zero speed and acceleration at both ends.
        const eased = t * t * t * (10 + t * (-15 + 6 * t))
        window.scrollTo({ top: travel.from + (travel.to - travel.from) * eased, behavior: 'instant' })
        lastScrollY = scrollY
        if (t === 1) travel = null
      }
      const bounds = journey.getBoundingClientRect()
      const focus = innerHeight * .55
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 16
      previousTime = time
      // Keep the dot hidden while the heading is entering. Start only when
      // there is actual scroll distance to draw, and replay after returning above it.
      if (bounds.top >= focus) {
        startedAt = null
        drawn = 0
        lineVelocity = 0
        journey.classList.remove('has-started')
      }
      if (startedAt === null && bounds.top < focus - 24 && bounds.bottom > 0) {
        startedAt = time
        journey.classList.add('has-started')
      }
      // Match the runner's vertical position to the scroll focus along the curved route.
      let low = 0
      let high = length
      for (let i = 0; i < 16; i++) {
        const middle = (low + high) / 2
        if (progress.getPointAtLength(middle).y < focus - bounds.top) low = middle
        else high = middle
      }
      const ready = startedAt !== null && time - startedAt >= 325
      const target = motion.matches ? length : ready ? (low + high) / 2 : 0
      // A critically damped spring preserves line speed across frames, so the
      // dot accelerates gently after a stop and settles without bouncing.
      const dt = elapsed / 1000
      const omega = 16
      const offset = drawn - target
      const impulse = lineVelocity + omega * offset
      const decay = Math.exp(-omega * dt)
      drawn = motion.matches ? length : target + (offset + impulse * dt) * decay
      lineVelocity = motion.matches ? 0 : (lineVelocity - omega * impulse * dt) * decay
      drawn = Math.max(0, Math.min(length, drawn))
      if (Math.abs(target - drawn) < .1 && Math.abs(lineVelocity) < 1) { drawn = target; lineVelocity = 0 }
      progress.style.strokeDashoffset = `${length - drawn}`
      progress.style.opacity = ready && drawn > .1 ? '1' : '0'
      const point = progress.getPointAtLength(drawn)
      runner.setAttribute('cx', `${point.x}`)
      runner.setAttribute('cy', `${point.y}`)
      if (motion.matches) section.classList.add('is-visible')
      items.forEach(item => {
        // Reveal and conceal against the same moving point in either direction.
        item.classList.toggle('is-active', motion.matches || (ready && item.offsetTop + item.offsetHeight * .5 <= point.y + 12))
        // Allow the entrance to finish, then give the visible content a full
        // second of stillness. Loading speed does not control the reading pause.
        if (!travel && item === heldStep && item.classList.contains('is-active') && releaseAt === Infinity) releaseAt = time + 800 + 1000
        if (item !== heldStep && item.getBoundingClientRect().top + item.offsetHeight * .5 > focus + 80) visited.delete(item)
      })
      if (!motion.matches && (travel || (startedAt !== null && !ready) || Math.abs(target - drawn) > .1 || Math.abs(lineVelocity) >= 1)) schedule()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = new ResizeObserver(() => { measurePath(); schedule() })
    resize.observe(journey)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('keydown', keyDown)
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', schedule)
    const entrance = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add('is-visible')
      } else if (entry.boundingClientRect.top >= innerHeight * .88 && !motion.matches) {
        section.classList.remove('is-visible')
      }
    }, { threshold: .12, rootMargin: '0px 0px -12% 0px' })
    entrance.observe(section.querySelector('.process__header')!)
    measurePath()
    update(performance.now())
    return () => {
      preload.disconnect()
      cancelAnimationFrame(frame)
      resize.disconnect()
      entrance.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
    }
  }, [])

  const path = 'M50 0 V420 C50 460 20 460 20 490 C20 520 80 520 80 490 C80 460 50 460 50 500 V1500'
  return (
    <section id="process" className="process" aria-labelledby="process-title">
      <div className="wrap">
        <header className="process__header">
          <h2 id="process-title">Our Process</h2>
          <p>Six steps, one designer, and you always know which step we are on.</p>
        </header>
        <div className="process__journey" ref={journeyRef}>
          <svg className="process__path" viewBox="0 0 100 1500" preserveAspectRatio="none" aria-hidden="true">
            <path className="process__progress" ref={progressRef} d={path} />
            <circle className="process__runner" ref={runnerRef} cx="50" cy="0" r="7" />
          </svg>
          <ol className="process__list">
          {steps.map((step, index) => (
            <li className={`process__step process__step--${step.kind}`} key={step.kind}>
              <div className="process__copy">
                <span className="process__number" aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p className="process__description">{step.text}</p>
              </div>
              <div className="process__art" aria-hidden="true">
                <span className="process__halo" />
                <picture className="process__photo">
                  <img src={step.image} alt="" width={800} height={800} loading="lazy" decoding="async" />
                </picture>
                <span className="process__spark">✳</span>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
