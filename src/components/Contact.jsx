import { motion } from 'framer-motion'
import { fadeUp } from '../utils'

export default function Contact({ recruiterMode }) {
  return (
    <section id="contact" className="section section-alt">
      <div className="container-prose contact-section">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Get in Touch</h2>
          <p className="section-subtitle">
            The fastest way to reach me is by email. I read everything.
          </p>
        </motion.div>

        {!recruiterMode && (
          <motion.p className="contact-blurb" {...fadeUp(0.08)}>
            Open to full-time roles in <em>Program Management</em>, <em>Data &amp; AI</em>,
            and <em>Engineering Operations</em> &mdash; available from January&nbsp;2027.
            Based in Somerset, NJ. Happy to talk research, XR, or anything interesting.
          </motion.p>
        )}

        <motion.a
          href="mailto:apy@apyashaswi.com"
          className="contact-email"
          {...fadeUp(recruiterMode ? 0.08 : 0.14)}
        >
          apy@apyashaswi.com
          <span className="contact-email-arrow" aria-hidden="true">→</span>
        </motion.a>

        <motion.div className="contact-secondary" {...fadeUp(recruiterMode ? 0.14 : 0.2)}>
          <a href="https://linkedin.com/in/apyashaswi" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <span className="contact-sep">·</span>
          <a href="https://github.com/apyashaswi" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span className="contact-sep">·</span>
          <a href="https://www.linkedin.com/in/apyashaswi" target="_blank" rel="noopener noreferrer">
            Résumé
          </a>
        </motion.div>

        {!recruiterMode && (
          <motion.div className="contact-signoff" {...fadeUp(0.26)}>
            &mdash; Yashaswi
          </motion.div>
        )}
      </div>
    </section>
  )
}
