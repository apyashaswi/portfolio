import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'

// Counts up to `target` the first time it scrolls into view. The DOM always
// carries the final value too: screen readers get it from the sr-only copy,
// and print (or any number never scrolled to) shows it because the count-up
// only starts once the number is actually seen. Reduced motion (OS setting or
// the EFFECTS switch) skips the count-up entirely.
export default function StatCounter({ target, suffix = '', decimals = 0, prefix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const still = useReducedMotion() || false
  const effectsOff = useReducedEffects()
  const end = parseFloat(target)
  const [count, setCount] = useState(end)
  useEffect(() => {
    if (still || effectsOff || !isInView) { if (still || effectsOff) setCount(end); return }
    let raf
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / 1800, 1)
      setCount(end * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    setCount(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end, still, effectsOff])
  const fmt = (n) => `${prefix}${decimals > 0 ? n.toFixed(decimals) : Math.floor(n)}${suffix}`
  return (
    <span ref={ref}>
      <span aria-hidden="true">{fmt(count)}</span>
      <span className="sr-only">{fmt(end)}</span>
    </span>
  )
}
