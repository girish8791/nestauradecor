import { useState } from 'react'
import type { FormEvent } from 'react'
import './Footer.css'

export default function Footer() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setSubmitted(true)
  }

  return (
    <footer id="callback" className="footer">
      <div className="wrap footer__grid">
        <div className="footer__info">
          <a className="footer__brand" href="#main" aria-label="Nest Aura Decor — back to top">
            <img src="/logo-olive.webp" alt="Nest Aura Decor" width="184" height="137" />
          </a>

          <p>Location details coming soon</p>
          <p>Studio hours coming soon</p>

          <div className="footer__links">
            <div>
              <h3>Talk to us</h3>
              <a href="tel:+919354326246">+91 93543 26246</a>
              <a href="https://wa.me/919354326246" target="_blank" rel="noreferrer">WhatsApp</a>
              <span>Email coming soon</span>
            </div>
            <div>
              <h3>Explore</h3>
              <a href="#services">Services</a>
              <a href="#process">Our Process</a>
              <a href="#possibilities">Before &amp; After</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h3>Follow</h3>
              <a href="https://www.instagram.com/nestauradecor/" target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
        </div>

        <form className="footer-form" onSubmit={handleSubmit}>
          <h2>Request a call back</h2>
          <p className="footer-form__hint">A designer calls, not a sales desk.</p>

          <div className="footer-form__fields">
            <label>
              Your name
              <input type="text" name="name" placeholder="Name" autoComplete="name" required />
            </label>
            <label>
              Phone or WhatsApp
              <input type="tel" name="phone" placeholder="+91 number" autoComplete="tel" required />
            </label>
            <label className="footer-form__location">
              Location
              <input type="text" name="location" placeholder="Area, city" autoComplete="street-address" required />
            </label>
            <div className="footer-form__two">
              <label>
                Type of space
                <select name="spaceType" defaultValue="Apartment">
                  <option>Apartment</option>
                  <option>Villa or house</option>
                  <option>Café or lounge</option>
                  <option>Clinic</option>
                  <option>Shop or office</option>
                </select>
              </label>
              <label>
                Budget
                <select name="budget" defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>Not sure yet</option>
                </select>
              </label>
            </div>
            <label>
              Anything we should know
              <textarea name="message" placeholder="Rooms, timeline, and what you have in mind." />
            </label>
            <button className={`footer-form__submit${submitted ? ' is-done' : ''}`} type="submit">
              {submitted ? 'Request noted' : 'Request call back'}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7" /></svg>
            </button>
            {submitted && <p className="footer-form__status" role="status">Thank you. Contact details will be connected to this form shortly.</p>}
          </div>
        </form>
      </div>

      <div className="wrap footer__bar">
        <span>© {new Date().getFullYear()} Nest Aura Decor</span>
        <span>Designed around real living</span>
      </div>
    </footer>
  )
}
