import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import Picture from './Picture'

export function RecruiterHero() {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section id="hero" className="hero hero-editorial hero-recruiter">
      <div className="hero-grid container">
        <div className="hero-text">
          <motion.div className="hero-kicker" {...fadeUp(0.05)}>
            <span className="hero-kicker-rule" />
            Edition '26 · An Editorial Portfolio
          </motion.div>
          <motion.h1 className="hero-name" {...fadeUp(0.15)}>
            <span className="hero-name-first">Yashaswi</span>
            <span className="hero-name-last">Alur Prasannakumar<span className="hero-name-stop">.</span></span>
          </motion.h1>
          <motion.div className="hero-byline" {...fadeUp(0.25)}>
            <span className="hero-byline-by">by</span> the author &middot;{' '}
            <span className="hero-byline-loc">Somerset, NJ</span>
          </motion.div>
          <motion.p className="hero-lead" {...fadeUp(0.32)}>
            A program manager, researcher, and builder working at the
            intersection of <em>Data</em>, <em>AI</em>, and Strategic Operations &mdash;
            currently leading delivery on the Data &amp; AI team at MSIG USA.
          </motion.p>
          <motion.div className="hero-ctas" {...fadeUp(0.4)}>
            <a href="/resume.pdf" download className="hero-link hero-link-primary">
              Download résumé <span aria-hidden="true">→</span>
            </a>
            <button className="hero-link" onClick={() => go('experience')}>
              View experience <span aria-hidden="true">→</span>
            </button>
          </motion.div>
        </div>
        <motion.figure className="hero-portrait" {...fadeUp(0.2)}>
          <Picture src="/APY_with_Paws.jpg" alt="Yashaswi Alur Prasannakumar" loading="eager" fetchPriority="high" />
          <figcaption>Northeastern University, Boston</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

export default function Hero() {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const openChat = () => typeof window.chatbase === 'function' && window.chatbase('open')
  return (
    <section id="hero" className="hero hero-editorial">
      <div className="hero-grid container">
        <div className="hero-text">
          <motion.div className="hero-kicker" {...fadeUp(0.05)}>
            <span className="hero-kicker-rule" />
            Edition '26 · An Editorial Portfolio
          </motion.div>
          <motion.h1 className="hero-name" {...fadeUp(0.15)}>
            <span className="hero-name-first">Yashaswi</span>
            <span className="hero-name-last">Alur Prasannakumar<span className="hero-name-stop">.</span></span>
          </motion.h1>
          <motion.div className="hero-byline" {...fadeUp(0.25)}>
            <span className="hero-byline-by">by</span> the author &middot;{' '}
            <span className="hero-byline-loc">Somerset, NJ</span>
          </motion.div>
          <motion.p className="hero-lead" {...fadeUp(0.32)}>
            A program manager, researcher, and builder working at the
            intersection of <em>Data</em>, <em>AI</em>, and Strategic Operations &mdash;
            currently leading delivery on the Data &amp; AI team at MSIG USA,
            graduating Northeastern in December&nbsp;2026.
          </motion.p>
          <motion.div className="hero-ctas" {...fadeUp(0.4)}>
            <button className="hero-link hero-link-primary" onClick={openChat}>
              Chat with my AI <span aria-hidden="true">→</span>
            </button>
            <button className="hero-link" onClick={() => go('projects')}>
              See the work <span aria-hidden="true">→</span>
            </button>
          </motion.div>
        </div>
        <motion.figure className="hero-portrait" {...fadeUp(0.2)}>
          <Picture src="/APY_with_Paws.jpg" alt="Yashaswi Alur Prasannakumar" loading="eager" fetchPriority="high" />
          <figcaption>Northeastern University, Boston</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
