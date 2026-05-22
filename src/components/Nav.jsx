import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ModeToggle from './ModeToggle'
import { NAV_LINKS, RECRUITER_NAV } from '../data'

export default function Nav({ active, bannerVisible, mode, setMode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const links = mode === 'recruiter' ? RECRUITER_NAV : NAV_LINKS
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const go = (id) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }
  return (
    <motion.nav
      className={`nav${scrolled ? ' scrolled' : ''}${bannerVisible ? ' with-banner' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-inner">
        <button className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          AP<span className="nav-status-dot" />
        </button>
        <div className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => (
            <button key={l} className={`nav-link${active === l.toLowerCase() ? ' active' : ''}`} onClick={() => go(l)}>{l}</button>
          ))}
          {mode === 'recruiter' && (
            <a href="/resume.pdf" download className="btn-ghost nav-resume-btn">Download Resume</a>
          )}
        </div>
        <div className="nav-right">
          <ModeToggle mode={mode} setMode={setMode} />
          <button className="hamburger" onClick={() => setOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
