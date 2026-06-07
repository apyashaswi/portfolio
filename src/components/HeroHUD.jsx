import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/* Decorative "telemetry" HUD — IBM Plex Mono register marks that frame the hero
   like a viewport readout. Purely ornamental (aria-hidden); the scroll/coord
   readouts tick only when motion is allowed. */
export default function HeroHUD() {
  const reduced = useReducedMotion()
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    if (reduced) return
    const onScroll = () => {
      const max = window.innerHeight * 0.9
      setScrollPct(Math.min(100, Math.round((window.scrollY / max) * 100)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])

  return (
    <div className="hero-hud" aria-hidden="true">
      <div className="hud-tl">
        <span className="hud-dot" /> RENDER · WEBGL
      </div>
      <div className="hud-tr">SCENE — EDITORIAL·FUTURISM / v1</div>
      <div className="hud-bl">LAT 42.3601 · LNG −71.0589 — BOSTON</div>
      <div className="hud-br">SCROLL {String(scrollPct).padStart(3, '0')}%</div>
    </div>
  )
}
