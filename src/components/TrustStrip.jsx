import { motion } from 'framer-motion'
import { fadeUp } from '../utils'

// Quiet authority row — the affiliations a recruiter scans for in the first
// few seconds. Text wordmarks (not logos) keep it on-brand and avoid brand
// misuse. It drifts as an endless marquee; the edge fades keep the loop's
// seam out of sight.
const AFFILIATIONS = [
  'MSIG USA',
  'MIT Reality Hack',
  'Northeastern University',
  'Harvard',
  'PES University',
]

// The track translates -50%, so each half must already be wider than the
// viewport: one pass of five names is not, so each half holds two passes.
// Only the very first pass is real; every copy is aria-hidden so assistive
// tech reads each affiliation once, and reduced motion shows the first only.
const PASSES = 4

export default function TrustStrip() {
  return (
    <motion.section className="trust-strip trust-marquee" aria-label="Affiliations" {...fadeUp(0.1)}>
      <div className="container trust-strip-inner">
        <span className="trust-strip-label">Seen across</span>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: PASSES }, (_, pass) => (
            <ul key={pass} className="trust-strip-list marquee-pass" aria-hidden={pass > 0 ? 'true' : undefined}>
              {AFFILIATIONS.map(a => (
                <li key={a} className="trust-strip-item">
                  {a}
                  {/* every name carries its separator so all passes are the
                      same width and the -50% loop has no seam */}
                  <span className="trust-strip-sep" aria-hidden="true">·</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
