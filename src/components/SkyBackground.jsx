import { useEffect, useRef } from 'react'
import { createSky } from '../lib/sky'
import { useReducedEffects } from '../effects'

/* Site-wide orbital sky (src/lib/sky.js, styled by src/sky.css).

   The canvas is created here rather than rendered by React, for two reasons:
   it becomes the first child of <body>, outside every content wrapper (so
   nothing can break its position: fixed), and every mount gets a fresh
   canvas. sky.destroy() releases its WebGL context with WEBGL_lose_context,
   and a canvas whose context was lost can never hand out a working one again,
   so reusing one canvas across a Strict Mode remount would leave the sky dark.
   If the browser drops the context itself (GPU reset, too many contexts), the
   sky is rebuilt on a new canvas a few times before settling on the poster
   that sky.css paints on <body>. */

const MAX_REBUILDS = 3

export default function SkyBackground() {
  const effectsReduced = useReducedEffects()
  const offRef = useRef(effectsReduced)      // read by build(), so a rebuilt sky keeps the switch's state

  useEffect(() => {
    let sky = null
    let canvas = null
    let rebuilds = 0
    let rebuildTimer = 0

    const teardown = () => {
      if (canvas) canvas.removeEventListener('webglcontextlost', onLost)
      sky?.destroy()
      canvas?.remove()
      sky = null
      canvas = null
      if (window.__sky) delete window.__sky
    }

    function onLost() {
      teardown()
      if (rebuilds++ < MAX_REBUILDS) rebuildTimer = setTimeout(build, 500)
    }

    function build() {
      canvas = document.createElement('canvas')
      canvas.className = 'sky-canvas'
      canvas.setAttribute('aria-hidden', 'true')
      document.body.prepend(canvas)
      canvas.addEventListener('webglcontextlost', onLost)
      sky = createSky({ canvas })
      // Only ever switch it off here: setEnabled(true) shows the canvas at once,
      // and before its first draw that would fade a blank canvas over the poster.
      if (offRef.current) sky.setEnabled(false)
      window.__sky = sky                       // lets other components call relayout / setEnabled
    }

    build()
    return () => { clearTimeout(rebuildTimer); teardown() }
  }, [])

  // EFFECTS switch in the masthead: off fades the canvas out and stops rendering,
  // leaving the static poster; on fades it back in. Acts on changes only.
  useEffect(() => {
    if (offRef.current === effectsReduced) return
    offRef.current = effectsReduced
    window.__sky?.setEnabled(!effectsReduced)
  }, [effectsReduced])

  return null
}
