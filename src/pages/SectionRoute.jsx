import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Wrapper for a section that lives at its own URL instead of on the journal
 * scroll. Globe and Journey are the two that earn it: GlobeViz alone is
 * ~1.25MB, and on a single long page that weight is paid by everyone who
 * scrolls far enough, lazy-loaded or not. Behind a route, it is opt-in.
 *
 * Keeps <main id="main"> so the skip-link target exists on these pages too.
 */
export default function SectionRoute({ children }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <motion.main
      id="main"
      className="route-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {children}
      <div className="route-back">
        <Link to="/" className="route-back-link">Back to the journal</Link>
      </div>
    </motion.main>
  )
}
