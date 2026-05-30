import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SESSION_KEY = 'ap-intro-shown'

export default function IntroOverlay() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY) } catch { return true }
  })

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => dismiss(), 1700)
    // Let keyboard users skip the intro (Escape or any key), not just a click.
    const onKey = () => dismiss()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro-overlay"
          onClick={dismiss}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
          aria-hidden="true"
        >
          <motion.div
            className="intro-monogram"
            initial={{ opacity: 0, scale: 0.85, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, scale: 1, letterSpacing: '0.18em' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            AP
          </motion.div>
          <motion.div
            className="intro-tagline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Yashaswi Alur Prasannakumar
          </motion.div>
          <motion.div
            className="intro-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="intro-skip">Click or press any key to skip</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
