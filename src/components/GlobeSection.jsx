import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'
import { fadeUp } from '../utils'

const GlobeViz = lazy(() => import('../GlobeViz'))

// A failed chunk load (offline, or a deploy replaced the file mid-visit) must
// not take the page down with it: show a retry instead. Browsers remember a
// failed module fetch for the rest of the visit, so the retry reloads the page
// (which also picks up a newer deploy) and reopens the globe there.
const REOPEN = 'ap-globe-reopen'
class GlobeBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="globe-placeholder globe-failed" role="alert">
        <span>The globe couldn't load.</span>
        <button type="button" className="globe-retry" onClick={this.props.onRetry}>Try again</button>
      </div>
    )
  }
}

export default function GlobeSection() {
  // The three.js / globe.gl chunk (~1.8MB) loads only when the visitor asks
  // for it: it never weighs on a scroll-through, and the compact launcher
  // keeps the section short until then.
  const [load, setLoad] = useState(() => {
    try { return sessionStorage.getItem(REOPEN) === '1' } catch { return false }
  })
  const regionRef = useRef(null)
  // the launcher button unmounts on click: keep keyboard focus in the section
  const open = () => { setLoad(true); requestAnimationFrame(() => regionRef.current?.focus()) }
  const retry = () => {
    try { sessionStorage.setItem(REOPEN, '1') } catch { /* no storage: the reload still retries */ }
    window.location.reload()
  }
  // back from a retry reload: bring the reopened globe into view
  useEffect(() => {
    let reopen = false
    try { reopen = sessionStorage.getItem(REOPEN) === '1'; sessionStorage.removeItem(REOPEN) } catch { /* ignore */ }
    if (reopen) requestAnimationFrame(() => { regionRef.current?.scrollIntoView({ block: 'center' }); regionRef.current?.focus() })
  }, [])

  return (
    <section id="globe" className="section section-alt sky-scrim">
      <div className="container">
        <motion.div className="section-header" data-num="05" {...fadeUp()}>
          <h2 className="section-title">Around the World</h2>
          <p className="section-subtitle">Places that shaped the journey — professional & personal</p>
        </motion.div>
        <motion.div ref={regionRef} tabIndex={-1} className="globe-region" role="region" aria-label="Interactive globe" {...fadeUp(0.1)}>
          {load ? (
            <GlobeBoundary onRetry={retry}>
              <Suspense fallback={<div className="globe-placeholder" role="status">Loading globe…</div>}>
                <GlobeViz />
              </Suspense>
            </GlobeBoundary>
          ) : (
            <button type="button" className="globe-launch" onClick={open}>
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
