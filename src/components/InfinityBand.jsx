import { useEffect, useRef, useState } from 'react'
import { useReducedEffects, webglAvailable, saveDataOn } from '../effects'

/**
 * A liquid-glass infinity symbol whose latitude/longitude graticule lights up
 * under the pointer. It gets its own full-width band rather than sitting
 * behind the hero.
 *
 * It was in the hero first, and that did not work. The hero is full -- copy
 * left, portrait right -- so the form was either covered by the portrait or
 * had to be scrimmed until it vanished to keep the copy readable. Measured
 * with the reveal lit, the byline failed AA at 0.42 opacity unless the scrim
 * was heavy enough to hide the form as well. Those two requirements cannot
 * both be met in that layout. Here there is nothing over it: full opacity, no
 * scrim, hoverable edge to edge.
 *
 * The hero keeps the bundle win that swap bought -- it now carries no WebGL at
 * all. The old react-three-fiber scene pulled @react-three/fiber + drei +
 * postprocessing into the EAGER bundle for a decorative blob: index.js
 * measured 367KB gzip with it and 119KB without.
 */
export default function InfinityBand() {
  const wrap = useRef(null)
  const mount = useRef(null)
  const [ready, setReady] = useState(false)
  const reduced = useReducedEffects()
  // Checked once: webglAvailable() builds a throwaway canvas, and neither of
  // these changes during a session.
  const [capable] = useState(() => webglAvailable() && !saveDataOn())
  // When the piece will never render, the band must not reserve its height --
  // EFFECTS: OFF otherwise left a 486px hole between the hero and About.
  const gated = reduced || !capable

  useEffect(() => {
    // Same gates the old scene used: a real WebGL context, not Data Saver, and
    // not the manual EFFECTS: OFF preference.
    if (gated) return
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
          // It has the stage to itself now, so it gets the middle tier rather
          // than the hero-backdrop tier. autoQuality steps it down further if
          // it cannot hold 30fps.
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
  }, [gated])

  if (gated) return null

  return (
    <div className={`infinity-band${ready ? ' is-ready' : ''}`} aria-hidden="true" ref={wrap}>
      <div className="infinity-band-mount" ref={mount} />
    </div>
  )
}
