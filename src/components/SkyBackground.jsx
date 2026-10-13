import { useEffect, useRef } from 'react'
import { createSky, SKY_FRAGMENT_SHADER } from '../lib/sky'
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
   - a viewport resize re-pins the day phases to the sections;
   - the readability tokens reach only the few elements that read them. */

const MAX_REBUILDS = 3

/* sky.js writes --sky-glow and --sky-scrim on <html> on every frame it draws.
   A custom property on the root restyles every element on the page: on a
   4x-throttled phone that alone took scrolling from 33ms to 80-120ms a frame
   (measured). createSky takes a `root` option, so it gets this stand-in: the
   real <html> for scrollHeight, and a style object that sends each token to
   one rule of a small stylesheet instead:
   - --sky-scrim lands on the scrim bands, caption pills and the top bar (the
     only things that read it), so a change restyles a dozen boxes, not the
     document;
   - --sky-glow feeds body's text-shadow, which every line of text inherits, so
     it moves in coarse steps and is applied once scrolling pauses (GLOW_SETTLE_MS),
     never mid-scroll.
   Values are rounded and unchanged writes are skipped. Returns the stand-in
   root plus dispose(), which the wrapper always calls: sky.js's no-WebGL
   destroy() never removes the tokens itself. */
const SCRIM_SCOPE = [
  '.sky-scrim::before', 'figcaption::before', '.masthead', '.nav',
].join(', ')
const STEP = { '--sky-scrim': 0.01, '--sky-glow': 0.04 }
const GLOW_SETTLE_MS = 180

function scopedTokens() {
  const html = document.documentElement
  const sheet = document.createElement('style')
  sheet.dataset.sky = 'tokens'
  document.head.appendChild(sheet)
  const rules = {
    '--sky-scrim': sheet.sheet.cssRules[sheet.sheet.insertRule(`${SCRIM_SCOPE} {}`, 0)],
  }
  rules['--sky-glow'] = sheet.sheet.cssRules[sheet.sheet.insertRule('body {}', 1)]
  const last = new Map()
  let glowTimer = 0
  let lastScroll = 0
  const onScroll = () => { lastScroll = performance.now() }
  addEventListener('scroll', onScroll, { passive: true })
  // apply the glow only once the page has actually stopped scrolling
  const applyGlowWhenSettled = () => {
    clearTimeout(glowTimer)
    const wait = GLOW_SETTLE_MS - (performance.now() - lastScroll)
    if (wait > 0) { glowTimer = setTimeout(applyGlowWhenSettled, wait); return }
    const v = last.get('--sky-glow')
    if (v != null) rules['--sky-glow'].style.setProperty('--sky-glow', v)
  }
  const round = (n, step) => (Math.round(n / step) * step).toFixed(2)
  const quantize = (name, value) => {
    const step = STEP[name] ?? 0.01
    const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(value)
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},${round(+m[4], step)})`
    const n = Number(value)
    return Number.isFinite(n) ? round(n, step) : value
  }
  const root = {
    get scrollHeight() { return html.scrollHeight },
    style: {
      setProperty(name, value) {
        const rule = rules[name]
        if (!rule) return html.style.setProperty(name, value)
        const q = quantize(name, value)
        if (last.get(name) === q) return
        last.set(name, q)
        if (name === '--sky-glow') applyGlowWhenSettled()
        else rule.style.setProperty(name, q)
      },
      removeProperty(name) {
        last.delete(name)
        if (rules[name]) rules[name].style.removeProperty(name)
        else html.style.removeProperty(name)
      },
    },
  }
  const dispose = () => {
    clearTimeout(glowTimer)
    removeEventListener('scroll', onScroll)
    sheet.remove()
  }
  return { root, dispose }
}

/* sky.js compiles its shader synchronously: it asks for COMPILE_STATUS right
   after compileShader, so the page's main thread waits for the GPU process to
   finish the compile. With ANGLE on Windows (Direct3D) that froze the page for
   ~3s on load and held the hero's first paint back to 4s (measured). sky.js
   stays byte-for-byte, so the wrapper compiles the same program first on a
   scratch context with KHR_parallel_shader_compile, polling its completion
   without blocking, and only then lets sky.js run: its compile and link then
   come out of the browser's program cache. The sources must match sky.js
   exactly for that cache hit; the vertex shader is copied from sky.js:189.
   Without the extension (or if it never completes) sky.js simply runs as before.
   Returns a cancel function. */
const SKY_VERTEX_SHADER = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'
const PREWARM_LIMIT_MS = 8000

function prewarmSkyProgram(done) {
  const scratch = document.createElement('canvas')
  const gl = scratch.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
  const ext = gl && gl.getExtension('KHR_parallel_shader_compile')
  if (!ext) { done(); return () => {} }
  const prog = gl.createProgram()
  for (const [type, src] of [[gl.VERTEX_SHADER, SKY_VERTEX_SHADER], [gl.FRAGMENT_SHADER, SKY_FRAGMENT_SHADER]]) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    gl.attachShader(prog, sh)
  }
  gl.linkProgram(prog)
  const started = performance.now()
  let timer = 0
  const finish = () => {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    done()
  }
  const poll = () => {
    if (gl.isContextLost() || performance.now() - started > PREWARM_LIMIT_MS ||
        gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) finish()
    else timer = setTimeout(poll, 50)
  }
  poll()
  return () => { clearTimeout(timer); gl.getExtension('WEBGL_lose_context')?.loseContext() }
}

export default function SkyBackground() {
  const effectsReduced = useReducedEffects()
  const offRef = useRef(effectsReduced)      // read by build(), so a rebuilt sky keeps the switch's state
  const enableRef = useRef(null)             // set by the mount effect: shows the sky once it has drawn

  useEffect(() => {
    let sky = null
    let tokens = null
    let canvas = null
    let drawn = false
    let rebuilds = 0
    let rebuildTimer = 0
    let resizeRaf = 0

    const teardown = () => {
      if (canvas) canvas.removeEventListener('webglcontextlost', onLost)
      sky?.destroy()
      tokens?.dispose()
      canvas?.remove()
      sky = null
      tokens = null
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
      tokens = scopedTokens()
      sky = createSky({ canvas, root: tokens.root })
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

    // The compile still occupies the GPU process, which would hold back the
    // page's own first frames, so it starts once the page has loaded and
    // painted (the poster covers the wait; sky.js waits for load anyway).
    let cancelPrewarm = () => {}
    let startRaf = 0
    const startSky = () => {
      startRaf = requestAnimationFrame(() => { startRaf = requestAnimationFrame(() => { cancelPrewarm = prewarmSkyProgram(build) }) })
    }
    if (document.readyState === 'complete') startSky()
    else window.addEventListener('load', startSky, { once: true })
    return () => {
      window.removeEventListener('load', startSky)
      cancelAnimationFrame(startRaf)
      cancelPrewarm()
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
