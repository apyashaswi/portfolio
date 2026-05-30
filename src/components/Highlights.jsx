import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { HIGHLIGHTS } from '../data'

export default function Highlights() {
  return (
    <section id="highlights" className="section">
      <div className="container">
        <motion.div className="section-header" data-num="04" {...fadeUp()}>
          <h2 className="section-title">Highlights</h2>
          <p className="section-subtitle">Moments from the journey</p>
        </motion.div>
        <div className="highlights-grid">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div key={i} className={`highlight-item${h.tall ? ' tall' : ''}`} {...fadeUp(i * 0.1)}>
              <img src={h.img} alt={h.title} className="highlight-img" />
              {h.badge && <div className="highlight-badge">{h.badge}</div>}
              <div className="highlight-overlay">
                <div className="highlight-title">{h.title}</div>
                <div className="highlight-sub">{h.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
