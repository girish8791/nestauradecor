import { useEffect, useRef, useState } from 'react'
import './Faq.css'

const questions = [
  {
    question: 'How is the quote fixed if material prices change?',
    answer: 'We lock brands and quantities in the signed cost sheet. If a named brand is unavailable, we propose an equal alternative at the same price—and you approve it in writing.',
  },
  {
    question: 'Do you really deliver in 45 days?',
    answer: 'For modular homes, yes—counted from the day the quote is signed and the site is handed to us. Civil-heavy renovations get their own date, also written into the contract.',
  },
  {
    question: 'Can I hire you for design only?',
    answer: 'Yes. You get drawings, 3D views and a material list your own contractor can build from, plus site visits at every milestone.',
  },
  {
    question: 'Which areas do you serve?',
    answer: 'We serve projects across our local region and take on select turnkey projects in other cities. Share your location on the call and we will confirm availability.',
  },
  {
    question: 'What happens if something breaks after handover?',
    answer: 'Every project has a snag-fix window after move-in, and all applicable modular work carries a written warranty shared with you before sign-off.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = section.current
    if (!element || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: .15 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="faq" className="faq-section" ref={section} aria-labelledby="faq-title">
      <div className="wrap faq-section__layout">
        <header className="faq-section__header">
          <h2 id="faq-title">FAQ</h2>
        </header>

        <div className="faq-section__list">
          {questions.map((item, index) => {
            const expanded = open === index
            const buttonId = `faq-question-${index}`
            const panelId = `faq-answer-${index}`
            return (
              <article className={`faq-item${expanded ? ' is-open' : ''}`} key={item.question} style={{ '--item-index': index } as React.CSSProperties}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpen(expanded ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="faq-item__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={panelId} className="faq-item__answer" role="region" aria-labelledby={buttonId} inert={!expanded ? true : undefined}>
                  <div><p>{item.answer}</p></div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
