import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { EXPERIENCE } from '../data'

export default function Experience({ recruiterMode }) {
  const list = recruiterMode ? EXPERIENCE.slice(0, 1) : EXPERIENCE
  return (
    <section id="experience" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="03" {...fadeUp()}>
          <span className="section-num">03</span>
          <h2 className="section-title">Experience</h2>
        </motion.div>
        <div className="timeline">
          {list.map((exp, i) => (
            <motion.div key={i} className="timeline-item" {...fadeUp(i * 0.1)}>
              <div className="timeline-marker">
                {exp.current && <div className="timeline-pulse" />}
                <div className={`timeline-dot${exp.current ? ' current' : ''}`} />
                {i < list.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="exp-header">
                  <div>
                    <div className="exp-title">{exp.title}</div>
                    <div className="exp-company">
                      {exp.company}
                      {exp.type && <span className="exp-type-badge">{exp.type}</span>}
                      {exp.current && <span className="exp-current-badge">Current</span>}
                    </div>
                  </div>
                  <div className="exp-meta">
                    <div className="exp-period">{exp.period}</div>
                    <div className="exp-location">{exp.location}</div>
                  </div>
                </div>
                <p className="exp-desc">{exp.description}</p>
                <ul className="exp-bullets">{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="tag-row">{exp.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
