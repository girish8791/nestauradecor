import { useEffect, useRef, useState } from 'react'
import './WhyUs.css'

/* From the Figma "Why choose us frame": a centred heading; the promise and five
   points at the left; the team photo card at the right, with the bronze
   branch reaching in from the edge behind it. */
const points = [
  { title: 'Design + build, one roof', text: 'No handoffs, no blame games', icon: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
  { title: 'Fixed cost sheet', text: 'Signed before work starts', icon: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h5' },
  { title: 'Delivery in 45 days', text: 'Date in the contract', icon: 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16M12 8v4l3 2' },
  { title: 'Weekly site photos', text: 'On WhatsApp, every Friday', icon: 'M4 6h16v12H4zM8 6v12M4 10h4' },
  { title: 'Named brands only', text: 'Every material listed', icon: 'M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z' },
]

const BRANCH_SIZES = 'min(1144px, 79.5vw)' // matches .why__branch in WhyUs.css

export default function WhyUs() {
  const section = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !('IntersectionObserver' in window),
  )

  useEffect(() => {
    const element = section.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
      else if (entry.boundingClientRect.top >= innerHeight * .88) setIsVisible(false)
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -12% 0px',
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={section}
      id="why"
      className={isVisible ? 'why is-visible' : 'why'}
      aria-labelledby="why-title"
    >
      {/* decorative: the bronze branch at the right edge, behind the photo */}
      {/* Figma's high-resolution export: 2289 x 3434, twice its 1144px display width.
          The frame around it lets the branch rise a little into the hero's faded
          foot, tying the two sections together (see WhyUs.css). */}
      <div className="why__branch-frame" aria-hidden="true">
        <picture className="why__branch">
          <source type="image/avif" srcSet="/media/why-branch-1144.avif 1144w, /media/why-branch-2289.avif 2289w" sizes={BRANCH_SIZES} />
          <source type="image/webp" srcSet="/media/why-branch-1144.webp 1144w, /media/why-branch-2289.webp 2289w" sizes={BRANCH_SIZES} />
          <img src="/media/why-branch-1144.png" alt="" width="2289" height="3434" loading="lazy" decoding="async" />
        </picture>
      </div>

      <div className="wrap">
        <h2 id="why-title" className="why__heading">Why Choose Us?</h2>

        <div className="why__body">
          <div className="why__copy">
            <h3 className="why__title">A studio, not a marketplace</h3>
            <p className="why__sub">One designer owns your project from the first sketch to the last snag.</p>

            <ul className="why__points">
              {points.map((point) => (
                <li key={point.title} className="why__point">
                  <span className="why__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d={point.icon} /></svg>
                  </span>
                  <span>
                    <strong className="why__point-title">{point.title}</strong>
                    <span className="why__point-text">{point.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <a className="btn line why__cta" href="#process">How we work</a>
          </div>

          {/* the photo is landscape; the card (Figma 471 x 512) shows its right
              part, framed on the three people at the table (see WhyUs.css) */}
          <picture className="why__photo">
            <source type="image/avif" srcSet="/media/why-team.avif" />
            <source type="image/webp" srcSet="/media/why-team.webp" />
            <img
              src="/media/why-team.jpg"
              alt="Designers gathered around a worktable, pointing at drawings and colour swatches together"
              width="740"
              height="493"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </section>
  )
}
