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

  useEffect(() => {
    if (!show) { fireIntroDone(); return }   // skipped (reduced motion / effects off)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus()
    const t = setTimeout(() => dismiss(), 1200)
    const onKey = (e) => {
      if (e.key === 'Escape') { dismiss(); return }
      // Trap focus on the single focusable element in this modal dialog —
      // without this, Tab escapes into Nav during the 1200ms window and a
      // keyboard user can open the mobile menu while the intro still holds
      // the body-scroll lock, corrupting Nav's own save/restore of it.
      if (e.key === 'Tab') { e.preventDefault(); skipRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // prevFocus is always <body> here (the intro only ever shows once, at
      // initial load, before anything is interactively focused), and <body>
      // isn't natively focusable — calling .focus() on it doesn't reset
      // Chromium's sequential-navigation pointer, so the next Tab continues
      // from the overlay's former DOM position and skips .skip-link. A
      // temporary tabindex resets that pointer to the top of the document
      // instead, with no visible focus ring for mouse users.
      document.body.setAttribute('tabindex', '-1')
      document.body.focus({ preventScroll: true })
      document.body.removeAttribute('tabindex')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const dismiss = () => {
    // Don't fire INTRO_DONE here — setShow(false) re-runs the effect above,
    // whose `if (!show)` branch fires it exactly once, for both this path
    // and the "never showed at all" path. Firing it here too would double-fire.
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
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.5, ease: [0.7, 0, 0.2, 1] } }}
        >
          <motion.div
            className="intro-flash"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 1.6, 2.2] }}
            transition={{ duration: 1.0, times: [0, 0.75, 0.85, 1], ease: 'easeOut' }}
          />
          <motion.div
            className="intro-monogram"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.86, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, scale: 1, letterSpacing: '0.16em' }}
            exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.45, ease: [0.7, 0, 0.2, 1] } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            AP
          </motion.div>
          <motion.div
            className="intro-rule"
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.25, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="intro-tagline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
