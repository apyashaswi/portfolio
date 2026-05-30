import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'
import { RESEARCH } from '../data'

function PaperEntry({ p, index, status }) {
  return (
    <article className="paper-entry">
      <div className="paper-status">
        <span className="paper-status-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="paper-status-sep">/</span>
        <span className="paper-status-label">{status}</span>
      </div>
      <h3 className="paper-title">{p.title}</h3>
      <div className="paper-authors">{p.authors}</div>
      <div className="paper-venue">{p.venue}</div>
      <p className="paper-desc">{p.description}</p>
      {p.highlights && p.highlights.length > 0 && (
        <ul className="paper-highlights">
          {p.highlights.map((h, j) => <li key={j}>{h}</li>)}
        </ul>
      )}
      <div className="paper-tags">
        {p.tags.map(t => <span key={t} className="paper-tag">{t}</span>)}
      </div>
    </article>
  )
}

export default function Research({ recruiterMode }) {
  const underReview = RESEARCH.papers.filter(p => p.status === 'under-review')
  const published = RESEARCH.papers.filter(p => p.status === 'published')

  return (
    <section id="research" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Research</h2>
          <p className="section-subtitle">
            With Prof.&nbsp;Nada&nbsp;R.&nbsp;Sanders, Northeastern University &mdash;
            forecasting, human-in-the-loop AI, and how organisations decide.
          </p>
        </motion.div>

        <motion.div className="research-stats" {...fadeUp(0.1)}>
          {[
            { value: 40.61, suffix: '%', decimals: 2, label: 'MAPE Score', sub: 'Statistically equivalent to pure ARIMA' },
            { value: 100,   suffix: '%', decimals: 0, label: 'Routing Accuracy', sub: 'LangGraph HITL orchestration' },
            { value: 13,    suffix: 'pp', decimals: 0, label: 'Improvement', sub: 'Over baseline on volatile SKUs' },
          ].map((s, i) => (
            <motion.div key={s.label} className="research-stat" {...fadeUp(0.1 + i * 0.08)}>
              <div className="research-stat-num">
                <StatCounter target={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="research-stat-label">{s.label}</div>
              <div className="research-stat-sub">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {!recruiterMode && (
          <>
            <motion.h3 className="pub-heading" {...fadeUp(0.15)}>Under Review</motion.h3>
            <div className="papers-list">
              {underReview.map((p, i) => (
                <motion.div key={i} {...fadeUp(0.1 + i * 0.08)}>
                  <PaperEntry p={p} index={i} status="Under review" />
                </motion.div>
              ))}
            </div>

            <motion.h3 className="pub-heading" {...fadeUp(0.2)}>Published</motion.h3>
            <div className="papers-list">
              {published.map((p, i) => (
                <motion.div key={i} {...fadeUp(0.2 + i * 0.08)}>
                  <PaperEntry p={p} index={i} status="Published" />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
