import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Picture from './Picture'

import HeroHUD from './HeroHUD'
import { INTRO_DONE, introWillShow } from '../intro'
import { EASE, revealTransition, scrollToSection, useScrollY } from '../utils'

const HERO_LINES = [
  'Yashaswi',
  <>Alur <span className="grad-voice">Prasannakumar</span><span className="hero-name-stop">.</span></>,
]

// The thin animated rule at the foot of the hero; it bows out once the
// reader has started scrolling, so it never sits over content.
function ScrollCue() {
  const gone = useScrollY() > 70
  return (
    <a href="#about" className={`scroll-cue${gone ? ' gone' : ''}`} aria-label="Scroll to About" tabIndex={gone ? -1 : 0}
      onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>
      <span className="scroll-cue-label" aria-hidden="true">Scroll</span>
      <span className="scroll-cue-line" aria-hidden="true" />
    </a>
  )
}

// Reveal begins the instant the intro overlay lifts (or immediately if the
// intro was already shown this session) — so the cold-open and the hero land
// as one orchestrated sequence.
function useHeroReveal() {
  const [revealed, setRevealed] = useState(() => !introWillShow())
  useEffect(() => {
    if (revealed) return
    const h = () => setRevealed(true)
    window.addEventListener(INTRO_DONE, h)
    const t = setTimeout(() => setRevealed(true), 2600) // safety net
    return () => { window.removeEventListener(INTRO_DONE, h); clearTimeout(t) }
  }, [revealed])
  return revealed
}

const makeReveal = (reduced) => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 26, filter: 'blur(7px)' },
  show: (i = 0) => {
    if (reduced) {
      return { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, delay: 0, ease: [0.22, 1, 0.36, 1] } }
    }
    const delay = i * 0.06
    const t = revealTransition(delay)
    return {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { ...t, filter: t.y },
    }
  },
})

function HeroBody({ recruiter }) {
  const reduced = useReducedMotion()
  const revealed = useHeroReveal()
  const reveal = makeReveal(reduced)
  const go = (id) => scrollToSection(id)
  const openChat = () => typeof window.chatbase === 'function' && window.chatbase('open')

  const anim = (i) => ({
    variants: reveal,
    custom: i,
    initial: 'hidden',
    animate: revealed ? 'show' : 'hidden',
  })

  return (
    <section id="hero" className={`hero hero-editorial hero-futurist${recruiter ? ' hero-recruiter' : ''}`}>
      {/* Static backdrop only. The 3D moved to its own band below, and the
          hero deliberately carries no WebGL now — that is where the 249KB
          gzip saving comes from. */}
      <div className="hero-scene" aria-hidden="true"><div className="hero-poster" /></div>
      <HeroHUD />
      <div className="hero-grid container">
        <div className="hero-text">
          <motion.div className="hero-kicker hero-eyebrow" {...anim(0)}>
            <span className="hero-eyebrow-dot" aria-hidden="true" />
            Edition '26 · An Editorial Portfolio
          </motion.div>
          {/* Line-mask reveal: each line rises out of its own clipped slot. */}
          <h1 className={`hero-name hero-name-cine${revealed ? ' is-revealed' : ''}`}>
            {HERO_LINES.map((line, i) => (
              <span key={i} className={`hero-line hero-line-${i}`}>
                <motion.span
                  className="hero-line-inner"
                  initial={reduced ? false : { y: '110%' }}
                  animate={revealed || reduced ? { y: 0 } : { y: '110%' }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.08 + i * 0.09 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div className="hero-byline" {...anim(2)}>
            <span className="hero-byline-by">by</span> Yashaswi Alur Prasannakumar &middot;{' '}
            <span className="hero-byline-loc">Boston, MA</span>
          </motion.div>
          <motion.p className="hero-lead" {...anim(3)}>
            A program manager, researcher, and technology strategist working at the
            intersection of business and <em>AI</em> &mdash; turning requirements into
            enterprise-scale solutions. Recently led delivery on the Data &amp; AI
            team at MSIG USA, graduating Northeastern in December&nbsp;2026.
          </motion.p>
          <motion.div className="hero-ctas" {...anim(4)}>
            {recruiter ? (
              <>
                <a href="https://www.linkedin.com/in/apyashaswi" target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-primary">
                  Résumé <span className="arrow" aria-hidden="true">→</span>
                </a>
                <button className="btn-pill btn-pill-ghost" onClick={() => go('experience')}>
                  View experience <span className="arrow" aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <>
                <button className="btn-pill btn-pill-primary" onClick={openChat}>
                  Chat with my AI <span className="arrow" aria-hidden="true">→</span>
                </button>
                <button className="btn-pill btn-pill-ghost" onClick={() => go('projects')}>
                  See the work <span className="arrow" aria-hidden="true">→</span>
                </button>
              </>
            )}
          </motion.div>
        </div>
        <motion.figure className="hero-portrait" {...anim(2)}>
          <Picture src="/APY_with_Paws.jpg" alt="Yashaswi Alur Prasannakumar" loading="eager" fetchPriority="high" sizes="(max-width: 900px) 88vw, 400px" />
          <figcaption>Northeastern University, Boston</figcaption>
        </motion.figure>
      </div>
      <ScrollCue />
    </section>
  )
}

export function RecruiterHero() {
  return <HeroBody recruiter />
}

export default function Hero() {
  return <HeroBody recruiter={false} />
}
