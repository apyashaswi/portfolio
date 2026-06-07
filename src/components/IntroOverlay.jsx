import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { introWillShow, fireIntroDone } from '../intro'

/* Cinematic cold-open as an ACCESSIBLE modal dialog: it exposes a real focusable
   "Skip intro" button (focus moves to it on open, restores on close), dismisses
   on Escape, and is a labelled role="dialog" rather than an aria-hidden wall.
   It never appears for reduced-motion users or when the Effects toggle is off
   (introWillShow handles that) — they go straight to the hero. On dismiss it
   fires INTRO_DONE so the hero reveal lands on the same beat (see Hero.jsx). */
export default function IntroOverlay() {
  const [show, setShow] = useState(introWillShow)
  const skipRef = useRef(null)
  const prevFocus = useRef(null)

  useEffect(() => {
    if (!show) { fireIntroDone(); return }   // skipped (reduced motion / effects off)
    prevFocus.current = document.activeElement
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus()
    const t = setTimeout(() => dismiss(), 2000)
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // Return focus to wherever it was, so keyboard users aren't dumped at the top.
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const dismiss = () => {
    fireIntroDone()
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Intro animation"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.85, ease: [0.7, 0, 0.2, 1] } }}
        >
          <motion.div
            className="intro-flash"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 1.6, 2.2] }}
            transition={{ duration: 2.0, times: [0, 0.8, 0.9, 1], ease: 'easeOut' }}
          />
          <motion.div
            className="intro-monogram"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.86, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, scale: 1, letterSpacing: '0.16em' }}
            exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            AP
          </motion.div>
          <motion.div
            className="intro-rule"
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="intro-tagline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Yashaswi Alur Prasannakumar
          </motion.div>
          <button ref={skipRef} type="button" className="intro-skip-btn" onClick={dismiss}>
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
