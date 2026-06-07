import { motion } from 'framer-motion'
import { fadeUp } from '../utils'

// Quiet authority row — the affiliations a recruiter scans for in the first
// few seconds. Text wordmarks (not logos) keep it on-brand and avoid brand
// misuse; the editorial mono treatment makes it read as a masthead credit line.
const AFFILIATIONS = [
  'MSIG USA',
  'MIT Reality Hack',
  'Northeastern University',
  'Harvard',
  'PES University',
]

export default function TrustStrip() {
  return (
    <motion.section className="trust-strip" aria-label="Affiliations" {...fadeUp(0.1)}>
      <div className="container trust-strip-inner">
        <span className="trust-strip-label">Seen across</span>
        <ul className="trust-strip-list">
          {AFFILIATIONS.map((a, i) => (
            <li key={a} className="trust-strip-item">
              {a}
              {i < AFFILIATIONS.length - 1 && <span className="trust-strip-sep" aria-hidden="true">·</span>}
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  )
}
