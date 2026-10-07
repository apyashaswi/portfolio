import { useEffect, useRef } from 'react'
import { useReducedEffects } from '../effects'

// The page's slow-drifting light: three huge radial blobs (oat, honey, sage)
// summed with 'lighter' on a fixed 2D canvas behind every section. Rendered at
// half resolution and upscaled by CSS -- the blobs are pure blur, so the lost
// pixels are invisible and the fill cost drops by 4x. Reduced motion / effects
// get a single still frame instead of the loop.
const BLOBS = [
  { h: 38, s: 35, l: 60, r: 0.55, sx: 0.0006, sy: 0.0009, a: 0.16 },
  { h: 32, s: 45, l: 63, r: 0.5, sx: -0.0008, sy: 0.0005, a: 0.12 },
  { h: 105, s: 12, l: 57, r: 0.42, sx: 0.0005, sy: -0.0007, a: 0.1 },
]
const SCALE = 0.5

export default function AmbientMesh() {
  const ref = useRef(null)
  const reducedEffects = useReducedEffects()

  useEffect(() => {
    const c = ref.current
    const x = c?.getContext('2d')
    if (!x) return
    const still = reducedEffects || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, t = 0, raf = 0

    const size = () => {
      w = c.width = Math.ceil(window.innerWidth * SCALE)
      h = c.height = Math.ceil(window.innerHeight * SCALE)
    }
    const draw = () => {
      x.clearRect(0, 0, w, h)
      x.globalCompositeOperation = 'lighter'
      BLOBS.forEach((b, i) => {
        const cx = w * (0.5 + 0.35 * Math.sin(t * b.sx + i * 2))
        const cy = h * (0.4 + 0.3 * Math.cos(t * b.sy + i))
        const rad = Math.min(w, h) * b.r
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,${b.a})`)
        g.addColorStop(1, 'hsla(0,0%,0%,0)')
        x.fillStyle = g
        x.beginPath()
        x.arc(cx, cy, rad, 0, Math.PI * 2)
        x.fill()
      })
    }
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      t++
      draw()
    }
    const onResize = () => { size(); if (still) draw() }

    size()
    if (still) draw()
    else loop()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [reducedEffects])

  return (
    <>
      <canvas ref={ref} className="ambient-mesh" aria-hidden="true" />
      <div className="ambient-vignette" aria-hidden="true" />
    </>
  )
}
