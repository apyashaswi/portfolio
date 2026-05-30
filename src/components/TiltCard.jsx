import { useRef } from 'react'

// Soft-tilt card — small rotation/scale for a paper-lift feel rather than a
// theatrical 3D plane. Easing smooths the return-to-rest after mouse leave.
export default function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const rafRef = useRef(0)

  const handleMove = (e) => {
    const card = ref.current
    if (!card) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const { left, top, width, height } = card.getBoundingClientRect()
      const x = (e.clientX - left) / width - 0.5
      const y = (e.clientY - top) / height - 0.5
      card.style.transform =
        `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-2px) scale3d(1.012,1.012,1.012)`
    })
  }

  const handleLeave = () => {
    cancelAnimationFrame(rafRef.current)
    if (ref.current) {
      ref.current.style.transform =
        'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1,1,1)'
    }
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}
