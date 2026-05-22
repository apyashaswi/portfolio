import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function ScrollTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
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
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 14 12 8 18 14" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
