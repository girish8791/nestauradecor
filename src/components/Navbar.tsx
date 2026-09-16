import { useEffect, useRef, useState } from 'react'
import './Navbar.css'

const links = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'process', label: 'Process' },
  { id: 'services', label: 'Services' },
  { id: 'faq', label: 'FAQs' },
]

// Above this width the links sit in the bar; below it they open from the Menu
// button. Keep in sync with the 820px breakpoint in Navbar.css.
const DESKTOP = '(min-width: 821px)'

export default function Navbar() {
  const [active, setActive] = useState('hero')
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLUListElement>(null)

  // Underline the link of the section in the middle of the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    document.querySelectorAll('section[id]').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  // While the menu is open: focus its first link, close on Escape,
  // and close if the window grows back to the desktop layout.
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    const desktop = window.matchMedia(DESKTOP)
    const onResize = () => { if (desktop.matches) setOpen(false) }
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onResize)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <nav className="nav" aria-label="Primary">
      <div className="wrap nav__inner">
        <a className="nav__logo" href="#hero" aria-label="Nest Aura Decor, home">
          <picture>
            <source srcSet="/logo-olive.webp" type="image/webp" />
            <img src="/logo-olive.png" alt="Nest Aura Decor" width="320" height="257" />
          </picture>
        </a>

        <ul id="nav-menu" ref={panel} className={open ? 'nav__links is-open' : 'nav__links'}>
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={active === link.id ? 'nav__link on' : 'nav__link'}
                aria-current={active === link.id ? 'location' : undefined}
                data-label={link.label}
                onClick={close}
              >
                {link.label}
              </a>
            </li>
          ))}
          {/* phones: the call-to-action moves from the bar into the menu */}
          <li className="nav__menu-cta">
            <a className="btn" href="#callback" onClick={close}>Request a call back</a>
          </li>
        </ul>

        <a className="btn nav__cta" href="#callback">Request a call back</a>

        <button
          ref={menuButton}
          className="nav__menu"
          type="button"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
    </nav>
  )
}
