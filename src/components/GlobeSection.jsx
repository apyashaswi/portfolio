import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

const GlobeViz = lazy(() => import('../GlobeViz'))

export default function GlobeSection() {
  return (
    <section id="globe" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <span className="section-num">06</span>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional & personal</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          <Suspense fallback={<div className="globe-placeholder">Loading globe…</div>}>
            <GlobeViz />
          </Suspense>
        </motion.div>
        <motion.div className="globe-tagline" {...fadeUp(0.2)}>
          <span className="gtl-stat"><StatCounter target={40} suffix="+" /><span className="gtl-label"> cities</span></span>
          <span className="gtl-sep">·</span>
          <span className="gtl-stat"><StatCounter target={3} /><span className="gtl-label"> countries</span></span>
          <span className="gtl-sep">·</span>
          <span className="gtl-stat"><StatCounter target={15} /><span className="gtl-label"> US states</span></span>
          <span className="gtl-sep">·</span>
          <span className="gtl-still">still counting</span>
        </motion.div>
      </div>
    </section>
  )
}
