import { Suspense, lazy, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

const GlobeViz = lazy(() => import('../GlobeViz'))

export default function GlobeSection() {
  // Click to load, not scroll to load. The three.js / globe.gl chunk is
  // ~1.25MB, and an IntersectionObserver only defers that cost -- on a single
  // long page everyone who scrolls this far still pays it, whether or not
  // they wanted a globe. Behind a click it is opt-in, and Explorer's total
  // drops by the whole chunk for everyone who does not ask for it.
  const [load, setLoad] = useState(false)

  // Warm the chunk on hover/focus so the click itself feels instant. Harmless
  // if it never comes -- the import is cached, and a pointer landing on the
  // button is a much stronger signal of intent than a viewport intersection.
  const prefetch = useCallback(() => { import('../GlobeViz') }, [])

  return (
    <section id="globe" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional &amp; personal</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          {load ? (
            <Suspense fallback={<div className="globe-placeholder">Loading globe…</div>}>
              <GlobeViz />
            </Suspense>
          ) : (
            <div className="globe-placeholder globe-placeholder--idle">
              <button
                type="button"
                className="globe-load-btn"
                onClick={() => setLoad(true)}
                onMouseEnter={prefetch}
                onFocus={prefetch}
              >
                Load the interactive globe
              </button>
              <span className="globe-load-note">1.2 MB · three.js</span>
            </div>
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
