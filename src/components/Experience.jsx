import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { EXPERIENCE } from '../data'

function CompanyMark({ exp }) {
  const accent = exp.brandColor || 'var(--accent)'
  return (
    <div
      className={`company-mark${exp.current ? ' company-mark-current' : ''}`}
      style={{ '--brand': accent }}
    >
      {exp.logo ? (
        <img src={exp.logo} alt={`${exp.company} logo`} loading="lazy" />
      ) : (
        <span className="company-monogram">{exp.monogram || exp.company.slice(0, 2).toUpperCase()}</span>
      )}
      {exp.current && <span className="company-mark-pulse" aria-hidden="true" />}
    </div>
  )
}

export default function Experience({ recruiterMode }) {
  const list = recruiterMode ? EXPERIENCE.slice(0, 1) : EXPERIENCE
  return (
    <section id="experience" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="02" {...fadeUp()}>
          <h2 className="section-title">Experience</h2>
        </motion.div>
        <div className="timeline timeline-v2">
          {list.map((exp, i) => (
            <motion.div
              key={i}
              className="timeline-item-v2"
              style={{ '--brand': exp.brandColor || 'var(--accent)' }}
              {...fadeUp(i * 0.1)}
            >
              <div className="timeline-rail">
                <CompanyMark exp={exp} />
                {i < list.length - 1 && <div className="timeline-line-v2" />}
              </div>
              <div className="timeline-content">
                <div className="exp-header">
                  <div>
                    <div className="exp-title">{exp.title}</div>
                    <div className="exp-company">
                      <span className="exp-company-name">{exp.company}</span>
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
