import { useEffect, useRef } from 'react'
import './MeetTheBrains.css'

const people = [
  {
    name: 'Founder name',
    role: 'Principal designer',
    quote: 'I still measure every site myself. It is the only way to draw a plan that fits how you live.',
  },
  {
    name: 'Co-founder name',
    role: 'Head of production',
    quote: 'Every module leaves our workshop finished. Site days are for fitting, not fixing.',
  },
]

export default function MeetTheBrains() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = section.current
    if (!element || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: .14 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="brains" ref={section} aria-labelledby="brains-title">
      <div className="wrap">
        <header className="brains__header">
          <h2 id="brains-title">Meet the Brains Behind</h2>
          <p>Meet the people who will actually be on your site.</p>
        </header>

        <div className="brains__grid">
          {people.map((person, index) => (
            <article className="person-card" key={person.role} tabIndex={0} style={{ animationDelay: `${index * .12}s` }}>
              <div className="person-card__placeholder" role="img" aria-label={`${person.name} portrait placeholder`}>
                <span>Portrait<br />placeholder</span>
              </div>
              <div className="person-card__meta">
                <h3>{person.name}</h3>
                <span>{person.role}</span>
                <div className="person-card__stats" aria-label="Profile statistics">
                  <span><b>—</b> projects</span>
                  <span><b>—</b> years</span>
                </div>
                <p>“{person.quote}”</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
