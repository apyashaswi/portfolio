import { useEffect, useRef, useState } from 'react'
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

function PinnedShowcase() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const linesRef = useRef(null)
  const warpRef = useRef(null)
  const [near, setNear] = useState(false)
  const [cap, setCap] = useState(0)

  // Only fetch three.js once the section is within a viewport of scrolling in.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '100% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!near) return
    let scene = null, raf = 0, cancelled = false
    let lastY = window.scrollY, vel = 0, mx = 0, my = 0, capNow = -1, opac = 0
    const onMove = (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5 }
    window.addEventListener('pointermove', onMove, { passive: true })

    const flash = () => {
      const w = warpRef.current
      if (!w) return
      w.style.opacity = '0.5'
      setTimeout(() => { w.style.opacity = '0' }, 170)
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (document.hidden || !scene) return
      const sec = sectionRef.current, cv = canvasRef.current
      if (!sec || !cv) return
      const rect = sec.getBoundingClientRect()
      const span = Math.max(1, rect.height - window.innerHeight)
      const p = Math.min(1, Math.max(0, -rect.top / span))

      const dy = window.scrollY - lastY
      lastY = window.scrollY
      vel += (Math.abs(dy) - vel) * 0.15
      const nv = Math.min(1, vel / 45)

      // fade the object in over the first 15% and out over the last 10%
      const target = p <= 0 ? 0.35 : p >= 1 ? 0.35 : Math.min(1, 0.65 + 0.35 * Math.min(1, p / 0.15), 0.65 + 0.35 * Math.min(1, (1 - p) / 0.1))
      opac += (target - opac) * 0.1
      cv.style.opacity = opac.toFixed(3)
      if (linesRef.current) linesRef.current.style.opacity = (nv * 0.5).toFixed(2)

      scene.resize(cv.clientWidth, cv.clientHeight)
      scene.frame(p, nv, mx, my)

      const idx = Math.min(IMPACT.length - 1, Math.floor(p * IMPACT.length))
      if (idx !== capNow) {
        if (capNow !== -1) flash()
        capNow = idx
        setCap(idx)
      }
    }

    import('../showcaseScene').then(({ createShowcaseScene }) => {
      if (cancelled || !canvasRef.current) return
      scene = createShowcaseScene(canvasRef.current)
      loop()
    }).catch(() => { /* the copy still reads fine without the object */ })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      scene?.dispose()
    }
  }, [near])

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
            <div key={it.id} className={`showcase-cap${i === cap ? ' on' : ''}`} aria-hidden="true">
              <div className="showcase-cap-project">{it.title}</div>
              <div className="showcase-cap-value">{it.value}</div>
              <div className="showcase-cap-label">{it.label}</div>
              <p className="showcase-cap-line">{it.line}</p>
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
  return useCinematic() ? <PinnedShowcase /> : <ImpactGrid />
}
