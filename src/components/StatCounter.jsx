import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'

export default function StatCounter({ target, suffix = '', decimals = 0, prefix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  // Reduced motion (OS setting or the EFFECTS switch): show the final value, no count-up.
  const still = useReducedMotion() || false
  const effectsOff = useReducedEffects()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (still || effectsOff) { setCount(parseFloat(target)); return }
    if (!isInView) return
    let raf
    const end = parseFloat(target)
    const startTime = performance.now()
    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / 1800, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(end * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, target, still, effectsOff])
  return <span ref={ref}>{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>
}
