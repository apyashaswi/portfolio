import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PROJECTS, IMPACT_EXTRA } from '../data'
import { fadeUp } from '../utils'
import StatCounter from './StatCounter'
import '../impact.css'

// One headline result per project, straight from each case study's first
// metric (no new numbers), framed by the owner-supplied results that aren't
// projects: MSIG mapping first, the thesis last.
const projectResults = PROJECTS.filter(p => p.caseStudy?.metrics?.[0]).map(p => ({
  id: p.id,
  title: p.title,
  value: p.caseStudy.metrics[0].value,
  label: p.caseStudy.metrics[0].label,
}))
export const IMPACT = [
  ...IMPACT_EXTRA.filter(x => x.placement === 'first'),
  ...projectResults,
  ...IMPACT_EXTRA.filter(x => x.placement === 'last'),
]

// "<30 min" -> "<" + count-up 30 + " min"; values without a number render as-is.
function ImpactValue({ value }) {
  const m = String(value).match(/^([^\d]*)([\d.]+)(.*)$/)
  if (!m) return value
  return <StatCounter target={parseFloat(m[2])} decimals={(m[2].split('.')[1] || '').length} prefix={m[1]} suffix={m[3]} />
}

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function Impact() {
  return (
    <section id="impact" className="section impact-section sky-scrim" aria-labelledby="impact-title">
      <div className="container">
        <motion.div className="section-header impact-header" {...fadeUp()}>
          <h2 className="section-title" id="impact-title">Selected Impact</h2>
        </motion.div>
        <ul className="impact-grid">
          {IMPACT.map((it, i) => {
            const body = (
              <>
                <span className="impact-card-title">{it.title}</span>
                <span className="impact-card-value"><ImpactValue value={it.value} /></span>
                <span className="impact-card-label">{it.label}</span>
              </>
            )
            return (
              <motion.li key={it.id} {...fadeUp(Math.min(i * 0.06, 0.3))}>
                {it.section
                  ? <button type="button" className="impact-card" onClick={() => scrollTo(it.section)}>{body}</button>
                  : <Link to={`/projects/${it.id}`} className="impact-card">{body}</Link>}
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
