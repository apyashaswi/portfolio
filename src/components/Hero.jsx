import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Picture from './Picture'
import HeroScene from './HeroScene'
import HeroHUD from './HeroHUD'
import { INTRO_DONE, introWillShow } from '../intro'
import { revealTransition } from '../utils'

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
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const openChat = () => typeof window.chatbase === 'function' && window.chatbase('open')

  const anim = (i) => ({
    variants: reveal,
    custom: i,
    initial: 'hidden',
    animate: revealed ? 'show' : 'hidden',
  })

  return (
    <section id="hero" className={`hero hero-editorial hero-futurist${recruiter ? ' hero-recruiter' : ''}`}>
      <HeroScene />
      <HeroHUD />
      <div className="hero-grid container">
        <div className="hero-text">
          <motion.div className="hero-kicker" {...anim(0)}>
            <span className="hero-kicker-rule" />
            Edition '26 · An Editorial Portfolio
          </motion.div>
          <motion.h1 className={`hero-name${revealed ? ' is-revealed' : ''}`} {...anim(1)}>
            <span className="hero-name-first">Yashaswi</span>
            <span className="hero-name-last">Alur Prasannakumar<span className="hero-name-stop">.</span></span>
          </motion.h1>
          <motion.div className="hero-byline" {...anim(2)}>
            <span className="hero-byline-by">by</span> Yashaswi Alur Prasannakumar &middot;{' '}
            <span className="hero-byline-loc">Somerset, NJ</span>
          </motion.div>
          <motion.p className="hero-lead" {...anim(3)}>
            A program manager, researcher, and builder working at the
            intersection of <em>Data</em>, <em>AI</em>, and Strategic Operations &mdash;
            currently leading delivery on the Data &amp; AI team at MSIG USA,
            graduating Northeastern in December&nbsp;2026.
          </motion.p>
          <motion.div className="hero-ctas" {...anim(4)}>
            {recruiter ? (
              <>
                <a href="https://www.linkedin.com/in/apyashaswi" target="_blank" rel="noopener noreferrer" className="hero-link hero-link-primary">
                  Résumé <span aria-hidden="true">→</span>
                </a>
                <button className="hero-link" onClick={() => go('experience')}>
                  View experience <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <>
                <button className="hero-link hero-link-primary" onClick={openChat}>
                  Chat with my AI <span aria-hidden="true">→</span>
                </button>
                <button className="hero-link" onClick={() => go('projects')}>
                  See the work <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </motion.div>
        </div>
        <motion.figure className="hero-portrait" {...anim(2)}>
          <Picture src="/APY_with_Paws.jpg" alt="Yashaswi Alur Prasannakumar" loading="eager" fetchPriority="high" />
          <figcaption>Northeastern University, Boston</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

export function RecruiterHero() {
  return <HeroBody recruiter />
}

export default function Hero() {
  return <HeroBody recruiter={false} />
}
