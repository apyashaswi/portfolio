import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_LINKS, RECRUITER_NAV } from '../data'

export default function Nav({ active, bannerVisible, mode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const links = mode === 'recruiter' ? RECRUITER_NAV : NAV_LINKS
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

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

  const go = (id) => {
    const target = id.toLowerCase()
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: target } })
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
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
      transition={{
        y: { type: 'spring', duration: 0.4, bounce: 0.14 },
        opacity: { duration: 0.25, ease: 'easeOut' },
      }}
    >
      <div className="nav-inner">
        <button className="nav-logo" onClick={goHome}>
          AP<span className="nav-status-dot" />
        </button>
        <div id="nav-links" className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => (
            <button key={l} className={`nav-link${active === l.toLowerCase() ? ' active' : ''}`} onClick={() => go(l)}>{l}</button>
          ))}
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
    </motion.nav>
  )
}
