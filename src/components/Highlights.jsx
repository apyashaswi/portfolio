import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { HIGHLIGHTS } from '../data'

export default function Highlights() {
  return (
    <section id="highlights" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Highlights</h2>
          <p className="section-subtitle">
            Moments from the journey &mdash; awards, classrooms, cities, and the
            people in the rooms that made them.
          </p>
        </motion.div>
        <div className="highlights-grid">
          {HIGHLIGHTS.map((h, i) => (
            <motion.figure key={i} className={`highlight-item${h.tall ? ' highlight-tall' : ''}`} {...fadeUp(i * 0.08)}>
              <div className="highlight-frame">
                <img src={h.img} alt={h.title} className="highlight-img" />
                {h.badge && <span className="highlight-badge">{h.badge}</span>}
              </div>
              <figcaption className="highlight-caption">
                <span className="highlight-title">{h.title}</span>
                <span className="highlight-sub">{h.sub}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
