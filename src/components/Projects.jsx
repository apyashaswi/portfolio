import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import TiltCard from './TiltCard'
import TechTag from './TechTag'
import { fadeUp } from '../utils'
import { PROJECTS } from '../data'

export default function Projects() {
  const featured = PROJECTS.find(p => p.featured)
  const rest = PROJECTS.filter(p => !p.featured)
  return (
    <section id="projects" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="04" {...fadeUp()}>
          <span className="section-num">04</span>
          <h2 className="section-title">Projects</h2>
        </motion.div>
        {featured && (
          <motion.div {...fadeUp(0.05)} style={{ marginBottom: '22px' }}>
            <TiltCard className="project-card project-featured">
              {featured.award && <div className="project-award-badge">🏆 {featured.award}</div>}
              <div className="project-featured-inner">
                <div>
                  <div className="project-icon">{featured.icon}</div>
                  <div className="project-title">{featured.title}</div>
                  {featured.subtitle && <div className="project-subtitle">{featured.subtitle}</div>}
                  <div className="project-context">{featured.context}</div>
                  <p className="project-desc">{featured.description}</p>
                </div>
                <div>
                  <ul className="project-bullets">{featured.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                  <div className="tag-row">{featured.tags.map(t => <TechTag key={t} label={t} />)}</div>
                  <Link to={`/projects/${featured.id}`} className="project-cta">
                    Read full case study →
                  </Link>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}
        <div className="projects-grid">
          {rest.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <TiltCard className="project-card">
                <div className="project-icon">{p.icon}</div>
                <div className="project-title">{p.title}</div>
                {p.subtitle && <div className="project-subtitle">{p.subtitle}</div>}
                <div className="project-context">{p.context}</div>
                <p className="project-desc">{p.description}</p>
                <ul className="project-bullets">{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="tag-row">{p.tags.map(t => <TechTag key={t} label={t} />)}</div>
                <Link to={`/projects/${p.id}`} className="project-cta">
                  Read full case study →
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
