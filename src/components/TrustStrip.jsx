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
    // The reveal moves the row, not the section: the section carries its stretch
    // of the sky band, which has to stay put under the hero.
    <section className="trust-strip sky-scrim" aria-label="Affiliations">
      <motion.div className="container trust-strip-inner" {...fadeUp(0.1)}>
        <span className="trust-strip-label">Seen across</span>
        <ul className="trust-strip-list">
          {AFFILIATIONS.map((a, i) => (
            <li key={a} className="trust-strip-item">
              {a}
              {i < AFFILIATIONS.length - 1 && <span className="trust-strip-sep" aria-hidden="true">·</span>}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  )
}
