import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import TechTag from './TechTag'
import { fadeUp } from '../utils'
import { PROJECTS } from '../data'

function ProjectEntry({ p, featured }) {
  return (
    <article className={`project-entry${featured ? ' project-entry-featured' : ''}`}>
      {p.award && (
        <div className="project-kicker">
          <span className="project-kicker-rule" />
          {p.award}
        </div>
      )}
      <header className="project-head">
        <h3 className="project-title">
          <Link to={`/projects/${p.id}`}>{p.title}</Link>
        </h3>
        {p.subtitle && <div className="project-subtitle">{p.subtitle}</div>}
        <div className="project-context">{p.context}</div>
      </header>
      {p.caseStudy?.metrics?.[0] && (
        <div className="project-metric" aria-label={`Headline result: ${p.caseStudy.metrics[0].value} ${p.caseStudy.metrics[0].label}`}>
          <span className="project-metric-value">{p.caseStudy.metrics[0].value}</span>
          <span className="project-metric-label">{p.caseStudy.metrics[0].label}</span>
        </div>
      )}
      <p className="project-desc">{p.description}</p>
      <ul className="project-bullets">
        {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
      </ul>
      <div className="project-foot">
        <div className="tag-row">{p.tags.map(t => <TechTag key={t} label={t} />)}</div>
        <Link to={`/projects/${p.id}`} className="project-cta">
          Read the full case study <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default function Projects() {
  const featured = PROJECTS.find(p => p.featured)
  const rest = PROJECTS.filter(p => !p.featured)
  return (
    <section id="projects" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Selected Projects</h2>
          <p className="section-subtitle">A few of the things I've shipped, written up at length.</p>
        </motion.div>
        {featured && (
          <motion.div {...fadeUp(0.05)}>
            <div className="project-tilt project-tilt-featured">
              <ProjectEntry p={featured} featured />
            </div>
          </motion.div>
        )}
        <div className="projects-list projects-list-cards">
          {rest.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <div className="project-tilt">
                <ProjectEntry p={p} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
