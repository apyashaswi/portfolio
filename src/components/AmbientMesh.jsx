import { useEffect, useRef } from 'react'
import { useReducedEffects } from '../effects'

// The page's slow-drifting light: three huge radial blobs (oat, honey, sage)
// summed with 'lighter' on a fixed 2D canvas behind every section. Rendered at
// 1/8 resolution and upscaled by CSS -- the blobs are pure blur, so the lost
// pixels are invisible and the fill cost drops ~64x. It draws at 30fps (the
// drift is far too slow to need 60) and only starts once the page has loaded
// and gone idle, so it never competes with first paint. Reduced motion /
// effects get a single still frame instead of the loop.
const BLOBS = [
  { h: 38, s: 35, l: 60, r: 0.55, sx: 0.0006, sy: 0.0009, a: 0.16 },
  { h: 32, s: 45, l: 63, r: 0.5, sx: -0.0008, sy: 0.0005, a: 0.12 },
  { h: 105, s: 12, l: 57, r: 0.42, sx: 0.0005, sy: -0.0007, a: 0.1 },
]
const SCALE = 0.125
const FRAME_MS = 1000 / 30

export default function AmbientMesh() {
  const ref = useRef(null)
  const reducedEffects = useReducedEffects()

  useEffect(() => {
    const c = ref.current
    const x = c?.getContext('2d')
    if (!x) return
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let w = 0, h = 0, t = 0, raf = 0, last = 0

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
    // Phones get the still frame: the drift is barely perceptible at that
    // size, and a steady 30fps canvas loop competes with the load on a slow CPU.
    const smallMq = window.matchMedia('(max-width: 768px)')
    const still = () => reducedEffects || motionMq.matches || smallMq.matches
    const loop = (now) => {
      if (still() || document.hidden) { raf = 0; return }
      raf = requestAnimationFrame(loop)
      if (last && now - last < FRAME_MS - 1) return
      // t counts 60fps frames of elapsed time, so the drift speed does not
      // depend on the display's refresh rate (or on the 30fps cap)
      t += last ? Math.min(8, (now - last) / (1000 / 60)) : 1
      last = now
      draw()
    }
    const start = () => {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
      if (still()) draw()
      else raf = requestAnimationFrame(loop)
    }
    const onResize = () => { size(); draw() }
    const onVisible = () => { if (!document.hidden && !raf) start() }

    size()
    draw()   // the still first frame paints immediately; motion waits for idle
    let idle = 0
    const begin = () => { idle = 0; start() }
    const defer = () => {
      idle = 'requestIdleCallback' in window
        ? window.requestIdleCallback(begin, { timeout: 3000 })
        : window.setTimeout(begin, 1500)
    }
    if (document.readyState === 'complete') defer()
    else window.addEventListener('load', defer, { once: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisible)
    motionMq.addEventListener('change', start)
    return () => {
      cancelAnimationFrame(raf)
      if (idle) ('cancelIdleCallback' in window ? window.cancelIdleCallback(idle) : clearTimeout(idle))
      window.removeEventListener('load', defer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      motionMq.removeEventListener('change', start)
    }
  }, [reducedEffects])

  return (
    <>
      <canvas ref={ref} className="ambient-mesh" aria-hidden="true" />
      <div className="ambient-vignette" aria-hidden="true" />
    </>
  )
}
