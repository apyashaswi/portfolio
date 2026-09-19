import { useEffect, useRef, useState } from 'react'
import { useReducedEffects, webglAvailable, saveDataOn } from '../effects'

/**
 * The hero centrepiece: a liquid-glass infinity symbol whose latitude/longitude
 * graticule lights up under the pointer.
 *
 * Replaces the old react-three-fiber scene. That scene pulled
 * @react-three/fiber + drei + postprocessing into the EAGER bundle for a
 * decorative blob: index.js measured 367KB gzip with it and 118KB without.
 * This module is vanilla three.js and is imported lazily after first paint, so
 * the nameplate renders on the small bundle and the glass arrives after.
 *
 * Reuses .hero-scene / .hero-poster, so positioning and the text-legibility
 * scrim are unchanged from the scene it replaces.
 */
export default function HeroInfinity() {
  const wrap = useRef(null)
  const mount = useRef(null)
  const [ready, setReady] = useState(false)
  const reduced = useReducedEffects()

  useEffect(() => {
    // Same gates the old scene used: a real WebGL context, not Data Saver, and
    // not the manual EFFECTS: OFF preference.
    if (reduced || !webglAvailable() || saveDataOn()) return
    const el = mount.current
    if (!el) return

    let piece
    let cancelled = false

    const boot = async () => {
      try {
        const { createInfinityGlass } = await import('../infinity/infinity-glass.js')
        if (cancelled) return
        piece = await createInfinityGlass({
          container: el,
          // A hero backdrop should not be the most expensive thing on the
          // page. autoQuality steps this down further if it cannot hold 30fps.
          particles: 400000,
          mode: 'reveal',
          autoQuality: true,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        })
        if (cancelled) { piece.dispose(); return }

        // The module makes its canvas focusable and exposes arrow-key control,
        // which is right for the standalone piece. Here it lives inside an
        // aria-hidden decorative wrapper, and a focusable node inside
        // aria-hidden content is a focus trap for screen-reader users — so the
        // canvas is taken out of the tab order. Nothing is lost: the reveal
        // carries no information.
        const canvas = el.querySelector('canvas')
        if (canvas) {
          canvas.tabIndex = -1
          canvas.removeAttribute('role')
        }
        setReady(true)
      } catch {
        // A hero that fails to load 3D is still a hero. The poster stays.
      }
    }

    // After first paint, and only when the browser is idle, so the glass never
    // competes with the nameplate for the first frame.
    const idle = window.requestIdleCallback
      ? requestIdleCallback(boot, { timeout: 2500 })
      : setTimeout(boot, 400)

    return () => {
      cancelled = true
      if (window.cancelIdleCallback && window.requestIdleCallback) cancelIdleCallback(idle)
      else clearTimeout(idle)
      piece?.dispose()
      setReady(false)
    }
  }, [reduced])

  return (
    <div className={`hero-scene hero-scene--infinity${ready ? ' is-ready' : ''}`} aria-hidden="true" ref={wrap}>
      <div className="hero-poster" />
      <div className="hero-infinity-mount" ref={mount} />
    </div>
  )
}
