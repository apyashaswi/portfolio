import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

const GlobeViz = lazy(() => import('../GlobeViz'))

export default function GlobeSection() {
  // Defer the heavy three.js / globe.gl chunk (~1.8MB) until the section
  // nears the viewport — keeps it off the initial page load.
  const ref = useRef(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (load || !ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setLoad(true); obs.disconnect() } },
      { rootMargin: '400px' }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [load])

  return (
    <section id="globe" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional & personal</p>
        </motion.div>
        <motion.div ref={ref} {...fadeUp(0.1)}>
          {load ? (
            <Suspense fallback={<div className="globe-placeholder">Loading globe…</div>}>
              <GlobeViz />
            </Suspense>
          ) : (
            <div className="globe-placeholder">Loading globe…</div>
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
