import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { LEADERSHIP } from '../data'

export default function Leadership() {
  return (
    <section id="leadership" className="section">
      <div className="container">
        <motion.div className="section-header" data-num="08" {...fadeUp()}>
          <h2 className="section-title">Leadership</h2>
        </motion.div>
        <div className="leadership-grid">
          {LEADERSHIP.map((l, i) => (
            <motion.div key={i} className="leadership-card" {...fadeUp(i * 0.05)}>
              <div className="lc-header">
                <div className="lc-role">{l.role}</div>
                {l.current && <span className="exp-current-badge">Active</span>}
              </div>
              <div className="lc-org">{l.org}</div>
              <div className="lc-period">{l.period}</div>
              <p className="lc-desc">{l.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
