import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_LINKS, RECRUITER_NAV } from '../data'
import { revealTransition, scrollToSection, useScrollY } from '../utils'

export default function Nav({ active, bannerVisible, mode }) {
  const scrolled = useScrollY() > 40
  const [open, setOpen] = useState(false)
  const links = mode === 'recruiter' ? RECRUITER_NAV : NAV_LINKS
  const navigate = useNavigate()
  const location = useLocation()

  const sheetRef = useRef(null)
  const burgerRef = useRef(null)

  // While the mobile menu overlay is open: lock body scroll, move focus into
  // the sheet and keep Tab cycling inside it (links + the close button), let
  // Escape close it, and hand focus back to the burger afterwards.
  useEffect(() => {
    if (!open) return
    const focusables = () => [...(sheetRef.current?.querySelectorAll('button, a[href]') ?? []), burgerRef.current].filter(Boolean)
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (!els.length) return
      const i = els.indexOf(document.activeElement)
      const next = e.shiftKey ? (i <= 0 ? els.length - 1 : i - 1) : (i === els.length - 1 || i === -1 ? 0 : i + 1)
      e.preventDefault()
      els[next].focus()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    focusables()[0]?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (sheetRef.current?.contains(document.activeElement) || document.activeElement === document.body) burgerRef.current?.focus()
    }
  }, [open])

  const go = (id) => {
    const target = id.toLowerCase()
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: target } })
    } else {
      scrollToSection(target)
    }
    setOpen(false)
  }

  const goHome = () => {
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <motion.nav
      className={`nav${scrolled ? ' scrolled' : ''}${bannerVisible ? ' with-banner' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={revealTransition()}
    >
      <div className="nav-inner">
        <button className="nav-logo" onClick={goHome}>
          AP<span className="nav-status-dot" />
        </button>
        <div id="nav-links" ref={sheetRef} className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => {
            const isActive = active === l.toLowerCase()
            const isCta = l === 'Contact'
            return (
              <button
                key={l}
                className={`nav-link${isActive ? ' active' : ''}${isCta ? ' nav-cta' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => go(l)}
              >
                {l}
              </button>
            )
          })}
          {mode === 'recruiter' && (
            <a href="https://www.linkedin.com/in/apyashaswi" target="_blank" rel="noopener noreferrer" className="btn-ghost nav-resume-btn">Résumé</a>
          )}
        </div>
        <div className="nav-right">
          <button
            ref={burgerRef}
            className="hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="nav-links"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
