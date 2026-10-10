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

   sky.js is used exactly as supplied; this wrapper adds the guards around it:
   - a context whose shader program failed to link is torn down at once, so
     the poster that sky.css paints on <body> stays instead of a black canvas;
   - if the browser drops the context (GPU reset, too many contexts), the sky
     is rebuilt on a new canvas a few times before settling on the poster;
   - the EFFECTS switch never reveals the canvas before its first frame;
   - a viewport resize re-pins the day phases to the sections. */

const MAX_REBUILDS = 3

export default function SkyBackground() {
  const effectsReduced = useReducedEffects()
  const offRef = useRef(effectsReduced)      // read by build(), so a rebuilt sky keeps the switch's state
  const enableRef = useRef(null)             // set by the mount effect: shows the sky once it has drawn

  useEffect(() => {
    let sky = null
    let canvas = null
    let drawn = false
    let rebuilds = 0
    let rebuildTimer = 0
    let resizeRaf = 0

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
      drawn = false
      canvas = document.createElement('canvas')
      canvas.className = 'sky-canvas'
      canvas.setAttribute('aria-hidden', 'true')
      // Note the first real frame: sky.js shows the canvas on its first draw,
      // but setEnabled(true) shows it immediately, drawn or not.
      let gl = null
      const getContext = canvas.getContext.bind(canvas)
      canvas.getContext = (type, attrs) => {
        gl = getContext(type, attrs)
        if (gl) {
          const drawArrays = gl.drawArrays.bind(gl)
          gl.drawArrays = (...args) => { drawn = true; return drawArrays(...args) }
        }
        return gl
      }
      document.body.prepend(canvas)
      canvas.addEventListener('webglcontextlost', onLost)
      sky = createSky({ canvas })
      // sky.js logs a shader compile error but carries on with an unusable
      // program; without this check that would fade a black canvas over the poster.
      const program = gl && !gl.isContextLost() ? gl.getParameter(gl.CURRENT_PROGRAM) : null
      if (gl && (!program || !gl.getProgramParameter(program, gl.LINK_STATUS))) {
        teardown()
        return
      }
      // Only ever switch it off here (see enableRef below).
      if (offRef.current) sky.setEnabled(false)
      window.__sky = sky                       // lets other components call relayout / setEnabled
    }

    enableRef.current = (on) => {
      if (!sky) return
      sky.setEnabled(on)
      // Not drawn yet: keep it hidden; sky.js adds .on itself on the first frame.
      if (on && !drawn) canvas.classList.remove('on')
    }

    const onResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => sky?.relayout())
    }
    window.addEventListener('resize', onResize)

    build()
    return () => {
      clearTimeout(rebuildTimer)
      cancelAnimationFrame(resizeRaf)
      window.removeEventListener('resize', onResize)
      enableRef.current = null
      teardown()
    }
  }, [])

  // EFFECTS switch in the masthead: off fades the canvas out and stops rendering,
  // leaving the static poster; on fades it back in. Acts on changes only.
  useEffect(() => {
    if (offRef.current === effectsReduced) return
    offRef.current = effectsReduced
    enableRef.current?.(!effectsReduced)
  }, [effectsReduced])

  return null
}
