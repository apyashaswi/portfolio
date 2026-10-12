import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'

// Counts up to `target` the first time it scrolls into view. The DOM always
// carries the final value too: screen readers read the sr-only copy, print
// shows that copy (sky-panels.css), and a number never scrolled near keeps its
// final value. It drops to 0 while still ~200px below the fold, so the reset
// is never seen, and counts up once actually in view. Reduced motion (OS
// setting or the EFFECTS switch) skips the count-up entirely.
export default function StatCounter({ target, suffix = '', decimals = 0, prefix = '' }) {
  const ref = useRef(null)
  const isNear = useInView(ref, { once: true, margin: '200px' })
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const still = useReducedMotion() || false
  const effectsOff = useReducedEffects()
  const end = parseFloat(target)
  const [count, setCount] = useState(end)
  const animate = !still && !effectsOff
  useEffect(() => {
    if (animate && isNear && !isInView) setCount(0)   // off screen: prime the count-up
  }, [animate, isNear, isInView])
  useEffect(() => {
    if (!animate) { setCount(end); return }
    if (!isInView) return
    let raf
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / 1800, 1)
      setCount(end * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end, animate])
  const fmt = (n) => `${prefix}${decimals > 0 ? n.toFixed(decimals) : Math.floor(n)}${suffix}`
  return (
    <span ref={ref}>
      <span className="stat-live" aria-hidden="true">{fmt(count)}</span>
      <span className="sr-only stat-final">{fmt(end)}</span>
    </span>
  )
}
