import { useEffect, useRef } from 'react'
import './PeacePriority.css'

export default function PeacePriority() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const element = section.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const showWithoutMotion = () => {
      if (motion.matches) element.classList.add('is-visible')
    }
    showWithoutMotion()
    element.classList.add('has-scroll-reveal')
    const observer = new IntersectionObserver(([entry]) => {
      if (motion.matches || entry.isIntersecting) {
        element.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: .01, rootMargin: '0px 0px 18% 0px' })
    observer.observe(element.querySelector('.peace-priority__scene')!)
    motion.addEventListener('change', showWithoutMotion)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', showWithoutMotion)
      element.classList.remove('has-scroll-reveal')
    }
  }, [])

  return (
    <section id="peace" className="peace-priority" ref={section} aria-labelledby="peace-priority-title">
      <div className="wrap">
        <h2 id="peace-priority-title" className="sr-only">Your peace, our priority</h2>
        <div className="peace-priority__scene" aria-hidden="true">
          <span className="peace-priority__label peace-priority__your">Your</span>
          <span className="peace-priority__word peace-priority__peace"><span>Peace</span></span>
          <div className="peace-priority__image">
            <img src="/media/peace-priority.png" alt="" width={604} height={506} loading="lazy" decoding="async" />
          </div>
          <span className="peace-priority__label peace-priority__our">Our</span>
          <span className="peace-priority__word peace-priority__priority"><span>Priority</span></span>
        </div>
      </div>
    </section>
  )
}
