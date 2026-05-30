import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { LEADERSHIP } from '../data'

export default function Leadership() {
  return (
    <section id="leadership" className="section">
      <div className="container-prose">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Leadership &amp; Communities</h2>
          <p className="section-subtitle">
            Twelve roles across student government, hackathons, research societies,
            cultural festivals, and a startup.
          </p>
        </motion.div>

        <ol className="leadership-list">
          {LEADERSHIP.map((l, i) => (
            <motion.li key={i} className="leadership-entry" {...fadeUp(i * 0.04)}>
              <div className="leadership-rail">
                <span className={`leadership-dot${l.current ? ' leadership-dot-current' : ''}`} />
              </div>
              <div className="leadership-body">
                <div className="leadership-period">
                  {l.period}
                  {l.current && <span className="leadership-active">Active</span>}
                </div>
                <div className="leadership-role">{l.role}</div>
                <div className="leadership-org">{l.org}</div>
                <p className="leadership-desc">{l.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
