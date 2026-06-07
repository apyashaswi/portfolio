import { useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'

// Soft-tilt card with a pointer-tracked specular glare. The rotation stays
// restrained (paper-lift, not theatrical), but a moving oat highlight + lifted
// shadow give the card real depth in the 3D treatment. Reduced-motion and the
// in-page Effects toggle are read reactively, so toggling either disables the
// tilt immediately (not just on the next full reload).
export default function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const rafRef = useRef(0)
  const reduced = useReducedMotion() || useReducedEffects()

  const handleMove = (e) => {
    const card = ref.current
    if (!card || reduced) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const { left, top, width, height } = card.getBoundingClientRect()
      const px = (e.clientX - left) / width
      const py = (e.clientY - top) / height
      const x = px - 0.5
      const y = py - 0.5
      card.style.setProperty('--mx', `${px * 100}%`)
      card.style.setProperty('--my', `${py * 100}%`)
      card.style.setProperty('--glare', '0.5')
      card.style.transform =
        `perspective(1100px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px) scale3d(1.018,1.018,1.018)`
    })
  }

  const handleLeave = () => {
    cancelAnimationFrame(rafRef.current)
    if (!ref.current) return
    ref.current.style.setProperty('--glare', '0')
    ref.current.style.transform =
      'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1,1,1)'
  }

  return (
    <div
      ref={ref}
      className={`tilt-card tilt-card--glare ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}
