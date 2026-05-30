import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { PROJECTS } from '../data'
import TechTag from '../components/TechTag'

export default function ProjectDetail() {
  const { id } = useParams()
  const project = PROJECTS.find(p => p.id === id)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  if (!project) return <Navigate to="/" replace />

  const cs = project.caseStudy || {}
  const others = PROJECTS.filter(p => p.id !== project.id).slice(0, 3)

  return (
    <main className="project-detail">
      <div className="container pd-container">
        <motion.div {...fadeUp()}>
          <Link to="/" state={{ scrollTo: 'projects' }} className="pd-back">
            ← Back to all projects
          </Link>
        </motion.div>

        <motion.header className="pd-hero" {...fadeUp(0.05)}>
          {project.award && <div className="project-award-badge pd-award">🏆 {project.award}</div>}
          <div className="pd-icon">{project.icon}</div>
          <h1 className="pd-title">{project.title}</h1>
          {project.subtitle && <div className="pd-subtitle">{project.subtitle}</div>}
          <div className="pd-context">{project.context}</div>
          {cs.tldr && <p className="pd-tldr">{cs.tldr}</p>}
        </motion.header>

        <motion.div className="pd-meta-row" {...fadeUp(0.1)}>
          {cs.role && <div className="pd-meta-card"><div className="pd-meta-label">Role</div><div className="pd-meta-value">{cs.role}</div></div>}
          {cs.duration && <div className="pd-meta-card"><div className="pd-meta-label">Duration</div><div className="pd-meta-value">{cs.duration}</div></div>}
          {cs.team && <div className="pd-meta-card"><div className="pd-meta-label">Team</div><div className="pd-meta-value">{cs.team}</div></div>}
        </motion.div>

        {cs.metrics && (
          <motion.div className="pd-metrics" {...fadeUp(0.15)}>
            {cs.metrics.map((m, i) => (
              <div key={i} className="pd-metric-card">
                <div className="pd-metric-value">{m.value}</div>
                <div className="pd-metric-label">{m.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {cs.problem && (
          <motion.section className="pd-section" {...fadeUp(0.2)}>
            <h2 className="pd-section-title">The Brief</h2>
            <p className="pd-section-body">{cs.problem}</p>
          </motion.section>
        )}

        {cs.approach && (
          <motion.section className="pd-section" {...fadeUp(0.25)}>
            <h2 className="pd-section-title">Approach</h2>
            <ul className="pd-bullets">
              {cs.approach.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </motion.section>
        )}

        {project.bullets && (
          <motion.section className="pd-section" {...fadeUp(0.3)}>
            <h2 className="pd-section-title">Outcomes</h2>
            <ul className="pd-bullets">
              {project.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </motion.section>
        )}

        {cs.learnings && (
          <motion.section className="pd-section pd-reflection" {...fadeUp(0.35)}>
            <h2 className="pd-section-title">What I Took Away</h2>
            <p className="pd-section-body">{cs.learnings}</p>
          </motion.section>
        )}

        {project.tags && (
          <motion.section className="pd-section" {...fadeUp(0.4)}>
            <h2 className="pd-section-title">Stack & Tools</h2>
            <div className="tag-row">
              {project.tags.map(t => <TechTag key={t} label={t} />)}
            </div>
          </motion.section>
        )}

        <motion.div className="pd-other" {...fadeUp(0.45)}>
          <div className="pd-other-label">Other case studies</div>
          <div className="pd-other-grid">
            {others.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="pd-other-card">
                <span className="pd-other-icon">{p.icon}</span>
                <div>
                  <div className="pd-other-title">{p.title}</div>
                  {p.subtitle && <div className="pd-other-sub">{p.subtitle}</div>}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
