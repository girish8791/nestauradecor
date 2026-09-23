import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './Footer.css'
import { normalisePhone, phoneProblem } from '../phone'

const WHATSAPP = '919354326246'
// The Google Apps Script web app (scripts/lead-form.gs) that saves each request
// to the leads Sheet and emails it. Set in .env.local or the host's settings.
const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined

const FIELDS = ['name', 'phone', 'location', 'spaceType', 'budget', 'message'] as const
type Lead = Record<(typeof FIELDS)[number], string>
type Status = 'idle' | 'sending' | 'sent' | 'failed'

// The request as a WhatsApp message, so it can go straight to the studio.
function whatsappLink(lead: Lead) {
  const lines = [
    'Hi Nest Aura Decor, I would like a call back.',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    lead.location && `Location: ${lead.location}`,
    lead.spaceType && `Space: ${lead.spaceType}`,
    lead.budget && `Budget: ${lead.budget}`,
    lead.message && `Note: ${lead.message}`,
  ]
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
}

async function sendLead(lead: Lead, seconds: number) {
  if (!LEAD_ENDPOINT) throw new Error('VITE_LEAD_ENDPOINT is not set')
  // form-encoded, so the browser sends it without a CORS preflight (Apps Script answers none)
  const response = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    // seconds: how long the form was open. The backend marks instant fills for review.
    body: new URLSearchParams({ ...lead, page: location.href, seconds: String(seconds) }),
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json() as { ok?: boolean }
  if (!result.ok) throw new Error('The form backend refused the request')
}

export default function Footer() {
  const [status, setStatus] = useState<Status>('idle')
  const [lead, setLead] = useState<Lead | null>(null)
  const thanks = useRef<HTMLHeadingElement>(null)
  // the form's height, so the thank-you card keeps it and the page doesn't jump
  const [height, setHeight] = useState<number>()
  const openedAt = useRef(0)
  const done = lead !== null && (status === 'sent' || status === 'failed')

  useEffect(() => { openedAt.current = Date.now() }, [])

  // the fields give way to the thank-you panel; move focus onto it
  useEffect(() => {
    if (done) thanks.current?.focus()
  }, [done])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (status === 'sending') return
    const phone = form.elements.namedItem('phone') as HTMLInputElement
    phone.setCustomValidity(phone.value.trim() ? phoneProblem(phone.value) ?? '' : '')
    if (!form.reportValidity()) return
    const data = new FormData(form)
    if (data.get('website')) return // the hidden trap field: only bots fill it
    setHeight(form.offsetHeight)
    const next = Object.fromEntries(FIELDS.map(key => [key, String(data.get(key) ?? '').trim()])) as Lead
    // one spelling of the number everywhere: the sheet, the email and WhatsApp
    const digits = normalisePhone(next.phone)
    next.phone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    setLead(next)
    setStatus('sending')
    try {
      await sendLead(next, openedAt.current ? Math.round((Date.now() - openedAt.current) / 1000) : 0)
      setStatus('sent')
    } catch (error) {
      console.error('Call-back request not sent:', error)
      setStatus('failed')
    }
  }

  return (
    <footer id="callback" className="footer">
      <div className="wrap footer__grid">
        <div className="footer__info">
          <a className="footer__brand" href="#main" aria-label="Nest Aura Decor — back to top">
            <img src="/logo-olive.webp" alt="Nest Aura Decor" width="184" height="137" />
          </a>

          <p>Delhi NCR</p>
          <p>Monday to Saturday, 9 am – 6 pm</p>

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

        {done ? (
          <div className="footer-form footer-form--thanks" role="status" style={{ minHeight: height }}>
            <span className={`footer-form__badge${status === 'failed' ? ' is-warning' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d={status === 'sent' ? 'M5 12.5 9.5 17 19 7' : 'M12 7v6m0 4h.01'} /></svg>
            </span>
            <h2 ref={thanks} tabIndex={-1}>
              {status === 'sent' ? `Thank you, ${lead.name.split(' ')[0]}.` : 'Almost there'}
            </h2>
            <p className="footer-form__hint">
              {status === 'sent'
                ? <>A designer will call you on <strong>{lead.phone}</strong> within one working day, <span>Monday to Saturday</span>, <span>9 am to 6 pm</span>.</>
                : <>Your request didn’t reach us. Send it on WhatsApp instead; your details are already filled in.</>}
            </p>
            <a className="footer-form__submit" href={whatsappLink(lead)} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6a7.9 7.9 0 1 1 2.6 2.5z" /></svg>
              {status === 'sent' ? 'Chat on WhatsApp now' : 'Send on WhatsApp'}
            </a>
            {/* after a failed send the form comes back filled in; after a sent one, empty */}
            <button type="button" className="footer-form__again" onClick={() => { if (status === 'sent') setLead(null); setStatus('idle') }}>
              {status === 'sent' ? 'Send another request' : 'Back to the form'}
            </button>
          </div>
        ) : (
          <form className="footer-form" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
            <h2>Request a call back</h2>
            <p className="footer-form__hint">A designer calls, not a sales desk.</p>

            <div className="footer-form__fields">
              {/* hidden from people; bots that fill every field give themselves away */}
              <input className="footer-form__trap" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <label>
                Your name
                <input type="text" name="name" placeholder="Name" autoComplete="name" defaultValue={lead?.name} required />
              </label>
              <label>
                Phone or WhatsApp
                {/* checked against src/phone.ts on blur and again on submit */}
                <input type="tel" name="phone" placeholder="+91 number" autoComplete="tel" inputMode="tel" maxLength={18} defaultValue={lead?.phone} required
                  onInput={event => event.currentTarget.setCustomValidity('')}
                  onBlur={event => {
                    const field = event.currentTarget
                    field.setCustomValidity(field.value.trim() ? phoneProblem(field.value) ?? '' : '')
                    if (field.value.trim()) field.reportValidity()
                  }} />
              </label>
              <label className="footer-form__location">
                Location
                <input type="text" name="location" placeholder="Area, city" autoComplete="street-address" defaultValue={lead?.location} required />
              </label>
              <div className="footer-form__two">
                <label>
                  Type of space
                  <select name="spaceType" defaultValue={lead?.spaceType || 'Apartment'}>
                    <option>Apartment</option>
                    <option>Villa or house</option>
                    <option>Café or lounge</option>
                    <option>Clinic</option>
                    <option>Shop or office</option>
                  </select>
                </label>
                <label>
                  Budget
                  <select name="budget" defaultValue={lead?.budget ?? ''}>
                    <option value="" disabled>Select</option>
                    <option>Not sure yet</option>
                  </select>
                </label>
              </div>
              <label>
                Anything we should know
                <textarea name="message" rows={3} maxLength={1000} placeholder="Rooms, timeline, and what you have in mind." defaultValue={lead?.message} />
              </label>
              <button className="footer-form__submit" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Request call back'}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7" /></svg>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="wrap footer__bar">
        <span>© {new Date().getFullYear()} Nest Aura Decor</span>
        <span>Designed around real living</span>
      </div>
    </footer>
  )
}
