import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'
import { RESEARCH } from '../data'

export default function Research({ recruiterMode }) {
  const underReview = RESEARCH.papers.filter(p => p.status === 'under-review')
  const published = RESEARCH.papers.filter(p => p.status === 'published')
  const sectionNum = recruiterMode ? '04' : '06'
  return (
    <section id="research" className="section">
      <div className="container">
        <motion.div className="section-header" data-num={sectionNum} {...fadeUp()}>
          <h2 className="section-title">Research</h2>
          <p className="section-subtitle">With Prof. Nada R. Sanders · Northeastern University</p>
        </motion.div>
        <motion.div className="research-stats" {...fadeUp(0.1)}>
          {[
            { value: 40.61, suffix: '%', decimals: 2, label: 'MAPE Score', sub: 'Statistically equiv. to pure ARIMA' },
            { value: 100, suffix: '%', decimals: 0, label: 'Routing Accuracy', sub: 'LangGraph HITL orchestration' },
            { value: 13, suffix: 'pp', decimals: 0, label: 'Improvement', sub: 'Over baseline on volatile SKUs' },
          ].map((s, i) => (
            <motion.div key={s.label} className="research-stat-card" {...fadeUp(0.1 + i * 0.1)}>
              <div className="rstat-num"><StatCounter target={s.value} suffix={s.suffix} decimals={s.decimals} /></div>
              <div className="rstat-label">{s.label}</div>
              <div className="rstat-sub">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>
        {!recruiterMode && (
          <>
            <motion.h3 className="pub-heading" {...fadeUp(0.15)}>Under Review</motion.h3>
            {underReview.map((p, i) => (
              <motion.div key={i} className="research-card featured-research" {...fadeUp(0.1 + i * 0.08)}>
                <div className="research-status-badge">Under Review</div>
                <h3 className="research-title">{p.title}</h3>
                <div className="research-authors">{p.authors}</div>
                <div className="research-venue">{p.venue}</div>
                <p className="research-desc">{p.description}</p>
                {p.highlights.length > 0 && (
                  <ul className="research-highlights">{p.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
                )}
                <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              </motion.div>
            ))}
            <motion.h3 className="pub-heading" style={{ marginTop: '48px' }} {...fadeUp(0.2)}>Published</motion.h3>
            <div className="published-grid">
              {published.map((p, i) => (
                <motion.div key={i} className="research-card" {...fadeUp(0.2 + i * 0.08)}>
                  <div className="research-status-badge published">Published</div>
                  <div className="research-title small">{p.title}</div>
                  <div className="research-venue">{p.venue}</div>
                  <p className="research-desc">{p.description}</p>
                  <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
