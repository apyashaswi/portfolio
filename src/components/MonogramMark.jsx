import { useEffect, useRef, useState } from 'react'
import { useReducedEffects, webglAvailable, saveDataOn } from '../effects'

/**
 * The AP monogram, drawn in glass, as the journal's sign-off.
 *
 * It was an infinity symbol first, in the hero and then in a band of its own,
 * and it meant nothing in either place — a shape with no connection to
 * anything on the page. The mark is the site's own: .nav-logo and
 * .footer-monogram are both var(--font-hand), so it is drawn the way that
 * mark is written rather than extruded from letterform outlines.
 *
 * It sits under "Thank you for reading." because that is where a signature
 * goes. Nothing is layered over it, so there is no scrim and no opacity
 * compromise: full strength, hoverable across its whole surface.
 */
export default function MonogramMark() {
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
          // no lit plane behind it — the mark floats on the footer's own ground
          backdrop: false,
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
    <div className={`monogram-mark${ready ? ' is-ready' : ''}`} aria-hidden="true" ref={wrap}>
      <div className="monogram-mark-mount" ref={mount} />
    </div>
  )
}
