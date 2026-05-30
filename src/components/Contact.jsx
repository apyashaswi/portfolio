import { motion } from 'framer-motion'
import { fadeUp } from '../utils'

export default function Contact({ recruiterMode }) {
  const sectionNum = recruiterMode ? '06' : '09'
  return (
    <section id="contact" className="section section-alt">
      <div className="container contact-container">
        <motion.div className="section-header" data-num={sectionNum} {...fadeUp()}>
          <span className="section-num">{sectionNum}</span>
          <h2 className="section-title">Contact</h2>
        </motion.div>
        <motion.p className="contact-blurb" {...fadeUp(0.1)}>
          Open to full-time roles in Program Management, Data &amp; AI, and Engineering Operations — available from January 2027. Based in Somerset, NJ. Happy to connect on research, XR, or anything interesting.
        </motion.p>
        <motion.div className="contact-links" {...fadeUp(0.2)}>
          {[
            { label: 'Email', value: 'apy@apyashaswi.com', href: 'mailto:apy@apyashaswi.com', icon: '✉' },
            { label: 'LinkedIn', value: 'linkedin.com/in/apyashaswi', href: 'https://linkedin.com/in/apyashaswi', icon: '🔗' },
            { label: 'GitHub', value: 'github.com/apyashaswi', href: 'https://github.com/apyashaswi', icon: '⌥' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="contact-link-card">
              <span className="clc-icon">{l.icon}</span>
              <div>
                <div className="clc-label">{l.label}</div>
                <div className="clc-value">{l.value}</div>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
