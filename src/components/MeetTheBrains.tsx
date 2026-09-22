import { useEffect, useRef } from 'react'
import './MeetTheBrains.css'

// projects / years: add both (e.g. projects: '120+', years: '8') to show the
// stats line on a card; it stays hidden until then.
type Person = { name: string; role: string; quote: string; photo?: string; focus?: string; projects?: string; years?: string }

const people: Person[] = [
  {
    name: 'Abhishek Bhardwaj',
    role: 'Founder',
    photo: '/media/team/abhishek-bhardwaj.webp',
    focus: '50% 0%', // his hair runs close to the top of the photo
    quote: 'A home should feel like the people who live in it. We design it that way, and hand it over on the date we promised.',
  },
  {
    name: 'Tannu Bhardwaj',
    role: 'Interior design head',
    photo: '/media/team/tannu-bhardwaj.webp',
    quote: 'I still measure every site myself. It is the only way to draw a plan that fits how you live.',
  },
]

export default function MeetTheBrains() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = section.current
    if (!element) return
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: .01, rootMargin: '0px 0px 18% 0px' })
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
              {person.photo
                ? <img className="person-card__photo" src={person.photo} alt={`${person.name}, ${person.role}`} width={900} height={1200} loading="lazy" decoding="async"
                    style={person.focus ? { objectPosition: person.focus } : undefined} />
                : <div className="person-card__placeholder" role="img" aria-label={`${person.name} portrait placeholder`}>
                    <span>Portrait<br />placeholder</span>
                  </div>}
              <div className="person-card__meta">
                <h3>{person.name}</h3>
                <p className="person-card__role">{person.role}</p>
                {person.projects && person.years && (
                  <p className="person-card__stats">{person.projects} projects<span aria-hidden="true"> · </span>{person.years} years</p>
                )}
                <div className="person-card__quote">
                  <div><p>“{person.quote}”</p></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
