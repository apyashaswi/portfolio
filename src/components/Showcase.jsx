import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PROJECTS } from '../data'
import { saveDataOn, useReducedEffects, webglAvailable } from '../effects'
import { fadeUp } from '../utils'

// One headline result per project, straight from each case study's first
// metric -- no new numbers, just the ones the Projects section already makes.
const IMPACT = PROJECTS.filter(p => p.caseStudy?.metrics?.[0]).map(p => ({
  id: p.id,
  title: p.title,
  value: p.caseStudy.metrics[0].value,
  label: p.caseStudy.metrics[0].label,
  line: p.caseStudy.tldr || p.description,
}))

const DESKTOP = '(min-width: 821px)'

function useCinematic() {
  const reducedEffects = useReducedEffects()
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const wideMq = window.matchMedia(DESKTOP)
    const check = () => setOk(!reducedEffects && !motionMq.matches && wideMq.matches && !saveDataOn() && webglAvailable())
    check()
    motionMq.addEventListener('change', check)
    wideMq.addEventListener('change', check)
    return () => { motionMq.removeEventListener('change', check); wideMq.removeEventListener('change', check) }
  }, [reducedEffects])
  return ok
}

// Static form: the same four results as a quiet grid of glass cards. This is
// what phones, reduced motion, reduced effects, Data Saver and no-WebGL get.
function ImpactGrid() {
  return (
    <section id="impact" className="section showcase-static" aria-labelledby="impact-tag">
      <div className="container">
        <motion.div className="cine-tag" id="impact-tag" {...fadeUp()}>Selected impact</motion.div>
        <div className="impact-grid">
          {IMPACT.map((it, i) => (
            <motion.div key={it.id} {...fadeUp(i * 0.08)}>
              <Link to={`/projects/${it.id}`} className="impact-card glass glass-hover">
                <span className="impact-card-title">{it.title}</span>
                <span className="impact-card-value">{it.value}</span>
                <span className="impact-card-label">{it.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PinnedShowcase({ onFail }) {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const linesRef = useRef(null)
  const warpRef = useRef(null)
  const visibleRef = useRef(false)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [cap, setCap] = useState(0)

  // Two observers: "near" (within a viewport) fetches three.js and builds the
  // scene ahead of time; "visible" (actually on screen) gates the loop, so
  // nothing renders while the band is merely close. Margins are in pixels --
  // a percentage rootMargin is not something to trust across engines.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const nearIo = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: `${window.innerHeight}px 0px` })
    const visIo = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting; setVisible(e.isIntersecting) })
    nearIo.observe(el)
    visIo.observe(el)
    return () => { nearIo.disconnect(); visIo.disconnect() }
  }, [])

  // Build (and tear down) the scene. Any failure -- chunk fetch, context
  // creation, a lost context -- hands the section over to the static grid.
  const sceneRef = useRef(null)
  useEffect(() => {
    if (!near) return
    let cancelled = false
    const cv = canvasRef.current
    const lost = (e) => { e.preventDefault(); onFail() }
    cv?.addEventListener('webglcontextlost', lost)
    import('../showcaseScene')
      .then(({ createShowcaseScene }) => {
        if (cancelled || !canvasRef.current) return
        sceneRef.current = createShowcaseScene(canvasRef.current)
      })
      .catch(() => { if (!cancelled) onFail() })
    return () => {
      cancelled = true
      cv?.removeEventListener('webglcontextlost', lost)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [near, onFail])

  // The loop: runs only while the band is on screen. Captions advance from
  // scroll position alone, so they work even before the scene has loaded.
  useEffect(() => {
    if (!visible) return
    let raf = 0, last = performance.now()
    let lastY = window.scrollY, vel = 0, mx = 0, my = 0, capNow = -1, opac = 0
    const onMove = (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5 }
    window.addEventListener('pointermove', onMove, { passive: true })

    const flash = () => {
      const w = warpRef.current
      if (!w) return
      w.style.opacity = '0.5'
      setTimeout(() => { w.style.opacity = '0' }, 170)
    }

    const tick = (now) => {
      if (!visibleRef.current) return
      raf = requestAnimationFrame(tick)
      // f = elapsed time in 60fps frames, clamped so a resumed tab does not jump
      const f = Math.min(4, Math.max(0.25, (now - last) / (1000 / 60)))
      last = now
      if (document.hidden) return
      const sec = sectionRef.current, cv = canvasRef.current
      if (!sec || !cv) return
      const rect = sec.getBoundingClientRect()
      const span = Math.max(1, rect.height - window.innerHeight)
      const p = Math.min(1, Math.max(0, -rect.top / span))

      const dy = Math.abs(window.scrollY - lastY) / f   // px per 60fps frame
      lastY = window.scrollY
      vel += (dy - vel) * (1 - Math.pow(0.85, f))
      const nv = Math.min(1, vel / 45)

      const idx = Math.min(IMPACT.length - 1, Math.floor(p * IMPACT.length))
      if (idx !== capNow) {
        if (capNow !== -1) flash()
        capNow = idx
        setCap(idx)
      }

      const scene = sceneRef.current
      if (!scene) return
      // fade the object in over the first 15% and out over the last 10%
      const target = p <= 0 || p >= 1 ? 0.35 : Math.min(1, 0.65 + 0.35 * Math.min(1, p / 0.15), 0.65 + 0.35 * Math.min(1, (1 - p) / 0.1))
      opac += (target - opac) * (1 - Math.pow(0.9, f))
      cv.style.opacity = opac.toFixed(3)
      if (linesRef.current) linesRef.current.style.opacity = (nv * 0.5).toFixed(2)
      scene.resize(cv.clientWidth, cv.clientHeight)
      scene.frame(p, nv, mx, my, f)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [visible])

  return (
    <section id="impact" ref={sectionRef} className="showcase" aria-labelledby="impact-tag">
      <div className="showcase-sticky">
        <div className="showcase-bg" aria-hidden="true" />
        <canvas ref={canvasRef} className="showcase-canvas" aria-hidden="true" />
        <div ref={linesRef} className="showcase-speedlines" aria-hidden="true" />
        <div ref={warpRef} className="showcase-warp" aria-hidden="true" />

        <div className="showcase-copy">
          <div className="cine-tag showcase-tag" id="impact-tag">Selected impact</div>
          {/* Screen readers get all four results as one list; the animated
              captions below are the sighted presentation of the same thing. */}
          <ul className="sr-only">
            {IMPACT.map(it => <li key={it.id}>{it.title}: {it.value} {it.label}. {it.line}</li>)}
          </ul>
          {IMPACT.map((it, i) => (
            <div key={it.id} className={`showcase-cap${i === cap ? ' on' : ''}`} aria-hidden={i === cap ? undefined : 'true'}>
              <div className="showcase-cap-project" aria-hidden="true">{it.title}</div>
              <div className="showcase-cap-value" aria-hidden="true">{it.value}</div>
              <div className="showcase-cap-label" aria-hidden="true">{it.label}</div>
              <p className="showcase-cap-line" aria-hidden="true">{it.line}</p>
              {/* Each result leads straight to its write-up. Only the visible
                  caption's link is focusable. */}
              <Link to={`/projects/${it.id}`} className="btn-pill btn-pill-ghost showcase-cap-cta" tabIndex={i === cap ? 0 : -1}>
                Read the full case study <span className="arrow" aria-hidden="true">→</span><span className="sr-only">: {it.title}</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="showcase-progress" aria-hidden="true">
          {IMPACT.map((it, i) => <span key={it.id} className={i === cap ? 'on' : ''} />)}
        </div>
      </div>
    </section>
  )
}

export default function Showcase() {
  const cinematic = useCinematic()
  const [failed, setFailed] = useState(false)
  const onFail = useCallback(() => setFailed(true), [])
  return cinematic && !failed ? <PinnedShowcase onFail={onFail} /> : <ImpactGrid />
}
