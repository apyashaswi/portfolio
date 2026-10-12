import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

const GlobeViz = lazy(() => import('../GlobeViz'))

export default function GlobeSection() {
  // The three.js / globe.gl chunk (~1.8MB) loads only when the visitor asks
  // for it: it never weighs on a scroll-through, and the compact launcher
  // keeps the section short until then.
  const [load, setLoad] = useState(false)

  return (
    <section id="globe" className="section section-alt sky-scrim">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional & personal</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          {load ? (
            <Suspense fallback={<div className="globe-placeholder" role="status">Loading globe…</div>}>
              <GlobeViz />
            </Suspense>
          ) : (
            <button type="button" className="globe-launch" onClick={() => setLoad(true)}>
              <span className="globe-launch-title">Explore the interactive globe</span>
              <span className="globe-launch-sub">Loads a 3D map of the places on this page</span>
              <span className="globe-launch-cta" aria-hidden="true">Open globe →</span>
            </button>
          )}
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
