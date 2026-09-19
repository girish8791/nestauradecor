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
    let frame = 0

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
      update()
    }

    const warmImages = () => {
      items.forEach(item => {
        const img = item.querySelector('img')!
        img.loading = 'eager'
        void img.decode().catch(() => {})
      })
    }
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { warmImages(); preload.disconnect() }
    }, { rootMargin: '900px 0px' })
    preload.observe(section)

    const update = () => {
      frame = 0
      const bounds = journey.getBoundingClientRect()
      const focus = innerHeight * .68
      const visible = bounds.top < focus && bounds.bottom > 0
      const targetY = Math.max(0, Math.min(bounds.height, focus - bounds.top))

      let drawn = 0
      if (length && visible) {
        let low = 0
        let high = length
        for (let i = 0; i < 12; i++) {
          const middle = (low + high) / 2
          if (progress.getPointAtLength(middle).y < targetY) low = middle
          else high = middle
        }
        drawn = (low + high) / 2
        journey.classList.add('has-started')
      } else if (bounds.top >= focus) {
        journey.classList.remove('has-started')
      }

      if (motion.matches) drawn = length
      progress.style.strokeDashoffset = `${length - drawn}`
      progress.style.opacity = drawn > .1 ? '1' : '0'
      if (length) {
        const point = progress.getPointAtLength(drawn)
        runner.setAttribute('cx', `${point.x}`)
        runner.setAttribute('cy', `${point.y}`)
      }

      // Reveal each step only when the travelling dot reaches its centre.
      // Once revealed, keep it visible so returning upward does not replay it.
      items.forEach(item => {
        if (motion.matches || (visible && item.offsetTop + item.offsetHeight * .5 <= targetY + 12)) {
          item.classList.add('is-active')
        }
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = new ResizeObserver(() => { measurePath(); schedule() })
    resize.observe(journey)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measurePath)
    motion.addEventListener('change', schedule)
    const entrance = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add('is-visible')
        entrance.disconnect()
      }
    }, { threshold: .01, rootMargin: '0px 0px 18% 0px' })
    entrance.observe(section.querySelector('.process__header')!)
    if (motion.matches) section.classList.add('is-visible')
    measurePath()
    schedule()
    return () => {
      preload.disconnect()
      cancelAnimationFrame(frame)
      resize.disconnect()
      entrance.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measurePath)
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
