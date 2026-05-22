import { Suspense, lazy, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Typewriter from './Typewriter'
import { fadeUp, isMobileDevice } from '../utils'

const HeroCanvas = lazy(() => import('../HeroCanvas'))

export function RecruiterHero() {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section id="hero" className="hero hero-recruiter">
      <div className="hero-content hero-content-recruiter">
        <motion.div className="hero-eyebrow" {...fadeUp(0.1)}>PM · Researcher · AI Builder</motion.div>
        <motion.h1 className="hero-name" {...fadeUp(0.2)}>
          Yashaswi Alur Prasannakumar
        </motion.h1>
        <motion.p className="hero-tagline" {...fadeUp(0.35)}>
          Building at the intersection of <span className="accent">Data</span>, <span className="accent2">AI</span> &amp; Strategic Operations
        </motion.p>
        <motion.div className="hero-ctas" {...fadeUp(0.45)}>
          <a href="/resume.pdf" download className="btn-primary btn-glow">Download Resume</a>
          <button className="btn-ghost" onClick={() => go('experience')}>View Experience</button>
        </motion.div>
        <motion.div className="hero-badges" {...fadeUp(0.55)}>
          {['Open to Full-Time · Jan 2027', 'Somerset, NJ', 'Dec 2026 Graduate'].map(b => (
            <span key={b} className="hero-badge">{b}</span>
          ))}
        </motion.div>
        <motion.div className="recruiter-highlights" {...fadeUp(0.65)}>
          {[
            { icon: '🏆', text: 'MIT Reality Hack Winner' },
            { icon: '📊', text: 'GPA 3.75 · Northeastern' },
            { icon: '💼', text: 'MSIG USA · Program Manager' },
            { icon: '🔬', text: '4 Research Papers' },
          ].map(h => (
            <div key={h.text} className="rec-highlight-pill">
              <span>{h.icon}</span> {h.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default function Hero() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => { setMobile(isMobileDevice()) }, [])
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section id="hero" className="hero">
      {!mobile && (
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>
      )}
      {mobile && <div className="hero-gradient-fallback" />}
      <div className="hero-content">
        <motion.div className="hero-eyebrow" {...fadeUp(0.1)}>PM · Researcher · AI Builder</motion.div>
        <motion.h1 className="hero-name" {...fadeUp(0.2)}>
          <Typewriter text="Yashaswi Alur Prasannakumar" speed={55} />
        </motion.h1>
        <motion.p className="hero-tagline" {...fadeUp(0.35)}>
          Building at the intersection of <span className="accent">Data</span>, <span className="accent2">AI</span> &amp; Strategic Operations
        </motion.p>
        <motion.div className="hero-ctas" {...fadeUp(0.45)}>
          <button className="btn-primary btn-glow" onClick={() => typeof window.chatbase === 'function' && window.chatbase('open')}>
            Chat with AP
          </button>
          <button className="btn-ghost" onClick={() => go('projects')}>View Work</button>
        </motion.div>
        <motion.div className="hero-badges" {...fadeUp(0.55)}>
          {['Open to Full-Time · Jan 2027', 'Somerset, NJ', 'Dec 2026 Graduate'].map(b => (
            <span key={b} className="hero-badge">{b}</span>
          ))}
        </motion.div>
      </div>
      <motion.div className="scroll-indicator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }}>
        <div className="scroll-line" />
        <span>Scroll</span>
      </motion.div>
    </section>
  )
}
