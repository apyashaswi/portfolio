import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_LINKS, RECRUITER_NAV } from '../data'
import { revealTransition, useScrollY } from '../utils'

// Sections that live at their own URL instead of on the scroll.
const ROUTED = { globe: '/globe', journey: '/journey' }

// Preview copy for those two only. Every other section is still in the DOM on
// the journal page, so its preview is read straight off its own
// .section-subtitle — no second copy of the text to drift out of sync. These
// two are no longer on that page, so they are the only ones that need an
// entry, and both strings are verbatim from their components.
const ROUTED_PREVIEW = {
  globe: 'Places that shaped the journey — professional & personal',
  journey: 'From Bengaluru to Boston — 2002 to 2027',
}

export default function Nav({ active, bannerVisible, mode }) {
  const scrolled = useScrollY() > 50
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const links = mode === 'recruiter' ? RECRUITER_NAV : NAV_LINKS
  const navigate = useNavigate()
  const location = useLocation()
  const hideTimer = useRef(null)

  // While the mobile menu overlay is open: lock body scroll and let Escape close it.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // WCAG 2.1 SC 1.4.13 — content shown on hover or focus must be dismissible
  // without moving the pointer.
  useEffect(() => {
    if (!preview) return
    const onKey = (e) => { if (e.key === 'Escape') setPreview(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const showPreview = (label) => {
    clearTimeout(hideTimer.current)
    const id = label.toLowerCase()
    const fromPage = document
      .querySelector(`#${id} .section-subtitle`)?.textContent?.trim()
    setPreview({ label, text: fromPage || ROUTED_PREVIEW[id] || '' })
  }

  // Small delay so sweeping the pointer across the bar doesn't strobe.
  const hidePreview = () => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setPreview(null), 120)
  }

  // Click navigates; hover only previews. Hover-to-navigate would strand every
  // touch and keyboard user, since neither has a hover state to trigger it.
  const go = (label) => {
    const id = label.toLowerCase()
    setOpen(false)
    setPreview(null)
    if (ROUTED[id]) { navigate(ROUTED[id]); return }
    // The nonce makes re-clicking the section you are already on re-trigger
    // the scroll, which a same-path navigate would otherwise no-op.
    navigate(`/${id}`, { state: { scrollTo: id, n: Date.now() } })
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
      onMouseLeave={hidePreview}
    >
      <div className="nav-inner">
        <button className="nav-logo" onClick={goHome}>
          AP<span className="nav-status-dot" />
        </button>
        <div id="nav-links" className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => {
            const id = l.toLowerCase()
            const isActive = ROUTED[id] ? location.pathname === ROUTED[id] : active === id
            return (
              <button
                key={l}
                className={`nav-link${isActive ? ' active' : ''}`}
                onClick={() => go(l)}
                onMouseEnter={() => showPreview(l)}
                onMouseLeave={hidePreview}
                onFocus={() => showPreview(l)}
                onBlur={hidePreview}
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

      {/* aria-hidden: the panel only restates the section's own subtitle, which
          is already on the page, and the button it belongs to already names the
          destination. Announcing it again on focus would be noise. */}
      {preview?.text && (
        <div className="nav-preview" aria-hidden="true">
          <span className="nav-preview-label">{preview.label}</span>
          <span className="nav-preview-text">{preview.text}</span>
        </div>
      )}
    </motion.nav>
  )
}
