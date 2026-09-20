import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

export default function GlobeSection() {
  // Click to load, not scroll to load. The three.js / globe.gl chunk is
  // ~1.25MB, and an IntersectionObserver only defers that cost -- on a single
  // long page everyone who scrolls this far still pays it, whether or not
  // they wanted a globe. Behind a click it is opt-in, and Explorer's total
  // drops by the whole chunk for everyone who does not ask for it.
  // Explicit state rather than lazy() + Suspense, so a failed chunk fetch is
  // recoverable. With Suspense alone a rejected import leaves the fallback on
  // screen forever: the button is gone, nothing reports the failure, and the
  // only way out is a manual reload. That is not hypothetical -- every
  // rebuild re-hashes the chunk filenames and empties dist, so any tab opened
  // before a deploy asks for a file that no longer exists.
  // On error the action is a RELOAD, not a retry. ESM caches a rejected
  // dynamic import, so re-requesting the same specifier fails again without
  // touching the network -- and in the common cause (a tab open across a
  // deploy, where the hashed filename no longer exists) the file is genuinely
  // gone. Fresh HTML is the only thing that fixes it.
  const [phase, setPhase] = useState('idle')   // idle | loading | ready | error
  const [Viz, setViz] = useState(null)

  const load = useCallback(async () => {
    setPhase('loading')
    try {
      const mod = await import('../GlobeViz')
      setViz(() => mod.default)
      setPhase('ready')
    } catch {
      setPhase('error')
    }
  }, [])

  // Warm the chunk on hover/focus so the click itself feels instant. A
  // pointer landing on the button is a much stronger signal of intent than a
  // viewport intersection. The catch is load-bearing: a bare import() here
  // turns any fetch failure into an unhandled rejection, which surfaces as a
  // page error even though the click path handles the same failure fine.
  const prefetch = useCallback(() => { import('../GlobeViz').catch(() => {}) }, [])

  return (
    <section id="globe" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional &amp; personal</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          {phase === 'ready' && Viz ? (
            <Viz />
          ) : phase === 'loading' ? (
            <div className="globe-placeholder">Loading globe…</div>
          ) : (
            <div className="globe-placeholder globe-placeholder--idle">
              <button
                type="button"
                className="globe-load-btn"
                onClick={phase === 'error' ? () => location.reload() : load}
                onMouseEnter={prefetch}
                onFocus={prefetch}
              >
                {phase === 'error' ? 'Reload the page' : 'Load the interactive globe'}
              </button>
              <span className="globe-load-note">
                {phase === 'error' ? 'Load failed — the page was likely updated' : '1.2 MB · three.js'}
              </span>
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
