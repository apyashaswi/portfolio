import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { introWillShow, fireIntroDone } from '../intro'
import { EASE } from '../utils'

// flat · beat · flat · beat · flat
const ECG_PATH = 'M0 20 H58 L64 20 L68 8 L73 33 L78 4 L84 26 L88 20 H132 L138 20 L142 8 L147 33 L152 4 L158 26 L162 20 H220'

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
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)', transition: { duration: 0.5, ease: EASE } }}
        >
          <motion.div
            className="intro-flash"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 1.6, 2.2] }}
            transition={{ duration: 1.0, times: [0, 0.75, 0.85, 1], ease: EASE }}
          />
          <motion.div
            className="intro-monogram"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.86, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, scale: 1, letterSpacing: '0.16em' }}
            exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.45, ease: EASE } }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            AP
          </motion.div>
          {/* The rule under the monogram is an ECG trace -- two beats, the
              same motif as the Journey monitor -- drawn left to right. */}
          <svg className="intro-ecg" viewBox="0 0 220 40" aria-hidden="true">
            <motion.path
              d={ECG_PATH}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
            />
          </svg>
          <motion.div
            className="intro-tagline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
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
