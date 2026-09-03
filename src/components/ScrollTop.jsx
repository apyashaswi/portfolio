import { AnimatePresence, motion } from 'framer-motion'
import { revealTransition, useScrollY } from '../utils'

export default function ScrollTop() {
  const visible = useScrollY() > 600
  const go = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="scroll-top-btn"
          aria-label="Back to top"
          onClick={go}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ ...revealTransition(), scale: revealTransition().y }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 14 12 8 18 14" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
