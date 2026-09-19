import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './EndlessPossibilities.css'

type Project = {
  id: string
  title: string
  description: string
  details: string[]
  before: string
  after: string
}

const projects: Project[] = [
  { id: 'commercial', before: '/media/comparisons/commercial-before.webp', after: '/media/comparisons/commercial-after.webp', title: 'Commercial Shops', description: 'Retail interiors designed around your brand, with thoughtful displays, intuitive layouts, and a welcoming customer experience.', details: ['Brand identity', 'Display & storage', 'Customer flow'] },
  { id: 'turnkey', before: '/media/comparisons/turnkey-before.webp', after: '/media/comparisons/turnkey-after.webp', title: 'Turnkey Projects', description: 'Complete interior solutions managed seamlessly from initial design to final project handover.', details: ['Design to handover', 'One team', 'Every detail'] },
  { id: 'cafe', before: '/media/comparisons/cafe-before.webp', after: '/media/comparisons/cafe-after.webp', title: 'Café Interior', description: 'Inviting café interiors designed to blend brand personality, customer comfort, functionality, and memorable dining experiences.', details: ['Brand personality', 'Comfortable seating', 'Thoughtful lighting'] },
  { id: 'clinic', before: '/media/comparisons/clinic-before.webp', after: '/media/comparisons/clinic-after.webp', title: 'Clinic Interior', description: 'Thoughtfully designed clinic interiors that balance patient comfort, efficient workflows, hygiene, privacy, and professional aesthetics.', details: ['Patient comfort', 'Efficient workflows', 'Privacy'] },
]

function Comparison({ project }: { project: Project }) {
  const [position, setPosition] = useState(50)
  const panel = useRef<HTMLDivElement>(null)
  const interacted = useRef(false)

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || !('IntersectionObserver' in window)) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const sweep = (time: number) => {
        if (interacted.current || motion.matches) { setPosition(value => interacted.current ? value : 50); return }
        const t = Math.min(1, (time - start) / 1400)
        setPosition(12 + 38 * (.5 - .5 * Math.cos(t * Math.PI)))
        if (t < 1) frame = requestAnimationFrame(sweep)
      }
      frame = requestAnimationFrame(sweep)
    }, { threshold: .5 })
    observer.observe(panel.current!)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [])

  return (
    <figure className="possibilities__figure">
      <div ref={panel} className="possibilities__comparison" style={{ '--split': `${position}%` } as CSSProperties}>
        <div className="possibilities__layer">
          <img src={project.after} alt={`${project.title} after completion`} loading="lazy" decoding="async" draggable={false} />
        </div>
        <div className="possibilities__layer possibilities__before">
          <img src={project.before} alt={`${project.title} before renovation`} loading="lazy" decoding="async" draggable={false} />
        </div>
        <span className="possibilities__label possibilities__label--before">Before</span>
        <span className="possibilities__label possibilities__label--after">After</span>
        <span className="possibilities__divider" aria-hidden="true"><span className="possibilities__handle"><svg viewBox="0 0 32 20" fill="none"><path d="m10 5-5 5 5 5m12-10 5 5-5 5M16 4v12" /></svg></span></span>
        <input type="range" min="0" max="100" value={position} step="1"
          aria-label={`Compare before and after: ${project.title}`} aria-valuetext={`${Math.round(position)}% before, ${Math.round(100 - position)}% after`}
          onPointerDown={() => { interacted.current = true }} onKeyDown={() => { interacted.current = true }}
          onChange={event => { interacted.current = true; setPosition(Number(event.target.value)) }} />
      </div>
      <figcaption><span>Before & after</span><span>Drag to explore <span aria-hidden="true">↔</span></span></figcaption>
    </figure>
  )
}

export default function EndlessPossibilities() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const element = section.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const items = element.querySelectorAll('.possibilities__header, .possibilities__project')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (motion.matches || entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: .01, rootMargin: '0px 0px 18% 0px' })
    const showWithoutMotion = () => {
      if (motion.matches) items.forEach(item => item.classList.add('is-visible'))
    }
    showWithoutMotion()
    element.classList.add('has-scroll-reveal')
    items.forEach(item => observer.observe(item))
    motion.addEventListener('change', showWithoutMotion)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', showWithoutMotion)
      element.classList.remove('has-scroll-reveal')
    }
  }, [])

  return (
    <section ref={section} id="possibilities" className="possibilities" aria-labelledby="possibilities-title">
      <div className="wrap">
        <header className="possibilities__header">
          <h2 id="possibilities-title">Endless Possibilities</h2>
          <p>A fresh perspective. A thoughtful design. A whole new space.</p>
        </header>
        <div className="possibilities__projects">
          {projects.map((project, index) => (
            <article className="possibilities__project" key={project.id} aria-labelledby={`possibilities-${project.id}`}>
              <div className="possibilities__copy">
                <span className="possibilities__number" aria-hidden="true">0{index + 1}<span /></span>
                <h3 id={`possibilities-${project.id}`}>{project.title}</h3>
                <p>{project.description}</p>
                <ul>{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
              </div>
              <Comparison project={project} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
