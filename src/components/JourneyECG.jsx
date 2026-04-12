import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── MILESTONES ─────────────────────────────────────────────────── */
const milestones = [
  { year:'2002',     title:'Born in Mysuru, Karnataka',              sub:'Where the story begins',                                                               badge:'Origin',      rx:0.04, spike:15,  featured:false },
  { year:'2020',     title:'PES University, Bengaluru',              sub:'B.Tech · Electronics & Communication Engineering',                                     badge:'Education',   rx:0.12, spike:28,  featured:false },
  { year:'2022',     title:'First Research Paper',                   sub:'LSTM channel blockage prediction · IRS-assisted V2X networks',                         badge:'Research',    rx:0.20, spike:32,  featured:false },
  { year:'Jun 2023', title:'Co-founded Cratel',                      sub:'CPO · B2C supply chain startup · 3,000+ orders · 88% forecast accuracy',               badge:'Startup',     rx:0.28, spike:38,  featured:false },
  { year:'2023',     title:'UAE — First International Trip',         sub:'Dubai · Abu Dhabi · Sharjah',                                                          badge:'Travel',      rx:0.35, spike:18,  featured:false },
  { year:'Sep 2024', title:'Northeastern University, Boston',        sub:'MS Engineering Management · GPA 3.75',                                                 badge:'Education',   rx:0.44, spike:35,  featured:false },
  { year:'Jan 2025', title:'MIT Reality Hack — Jaw-Dropping Award',  sub:'Spidey Sense · Haptic VR accessibility device · 48hrs · 100+ international teams',    badge:'Award',       rx:0.55, spike:110, featured:true  },
  { year:'Jan 2026', title:'MSIG USA · PM & Scrum Master',           sub:'Data Analytics & AI · Microsoft Fabric · Warren, NJ',                                 badge:'Current',     rx:0.67, spike:52,  featured:false },
  { year:'Jan 2026', title:'Harvard GCCH 2026',                      sub:'Finance & M&A Case Competition · Cambridge, MA',                                       badge:'Achievement', rx:0.76, spike:40,  featured:false },
  { year:'Apr 2026', title:'MS Thesis',                              sub:'Hybrid ARIMA-LLM · 40.61% MAPE · 100% routing accuracy · 13pp improvement',            badge:'Research',    rx:0.84, spike:45,  featured:false },
  { year:'Dec 2026', title:'Graduation · MS Engineering Management', sub:'Northeastern University · Next chapter loading...',                                    badge:'Milestone',   rx:0.91, spike:48,  featured:false },
  { year:'Jan 2027', title:"What's Next?",                           sub:'Open to full-time roles · Data AI & Program Management',                               badge:'Future',      rx:0.97, spike:30,  featured:false },
]

const BADGE_STYLE = {
  Origin:      { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Education:   { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Research:    { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Startup:     { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Travel:      { bg:'rgba(29,158,117,0.18)',   color:'#2DB88A' },
  Award:       { bg:'rgba(204,34,34,0.22)',    color:'#ff5555' },
  Current:     { bg:'rgba(29,158,117,0.22)',   color:'#2DB88A' },
  Achievement: { bg:'rgba(201,168,76,0.18)',   color:'#c9a84c' },
  Milestone:   { bg:'rgba(127,119,221,0.18)',  color:'#9F97F0' },
  Future:      { bg:'rgba(80,80,120,0.14)',    color:'#7070a8' },
}

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
const BG         = '#010d04'          // near-black with faint green tint
const GRID_MINOR = 'rgba(0,140,50,0.10)'
const GRID_MAJOR = 'rgba(0,140,50,0.20)'
const LINE_DIM   = '#01300a'          // very dark green — old phosphor
const LINE_AURA  = 'rgba(0,230,80,0.14)'
const LINE_MID   = 'rgba(0,210,75,0.50)'
const LINE_CORE  = '#00d060'          // bright phosphor green
const HEAD_CLR   = '#00ff88'
const BASE_SPEED = 0.8                // px / frame at 1×
const GAP        = 28                 // eraser gap ahead of head (px)
const TRAIL      = 160               // bright-trail length (px)

/* ─── ECG WAVEFORM ───────────────────────────────────────────────── */
// Returns y-offset (negative = upward on canvas).
// dx is measured from the R-peak centre.
function spikeOffset(dx, h) {
  // P-wave: smooth gaussian bump ~24px before R-peak
  if (dx >= -38 && dx < -10) {
    const t = (dx + 24) / 11
    return -h * 0.14 * Math.exp(-t * t * 1.6)
  }
  // Q-dip: small downward notch just before R
  if (dx >= -10 && dx < -2) {
    const t = (dx + 10) / 8
    return h * 0.11 * Math.sin(Math.PI * t)
  }
  // R-rise: sharp linear ascent
  if (dx >= -2 && dx <= 0) {
    return -h * (dx + 2) / 2
  }
  // R-fall: sharp linear descent
  if (dx > 0 && dx <= 5) {
    return -h * (1 - dx / 5)
  }
  // S-dip: brief downward excursion below baseline
  if (dx > 5 && dx <= 17) {
    const t = (dx - 5) / 12
    return h * 0.22 * Math.sin(Math.PI * t)
  }
  // ST segment: slight isoelectric elevation
  if (dx > 17 && dx <= 27) return -h * 0.025
  // T-wave: broad rounded positive hump
  if (dx > 27 && dx <= 70) {
    const t = (dx - 27) / 43
    return -h * 0.30 * Math.sin(Math.PI * t)
  }
  return 0
}

/* ─── BASELINE WANDER + NOISE ────────────────────────────────────── */
// Deterministic breathing drift + muscle noise; no Math.random so buffer
// is reproducible across resize cycles.
function wanderAndNoise(x) {
  const wander = Math.sin(x * 0.0038) * 7 + Math.sin(x * 0.0091) * 3.5
  const noise  = (Math.sin(x * 18.7) + Math.sin(x * 43.1)) * 0.55
  return wander + noise
}

/* ─── Y VALUE AT WORLD POSITION ──────────────────────────────────── */
function computeY(worldX, W, H) {
  const baseline = H / 2 + wanderAndNoise(worldX)
  let off = 0
  const cycleN = Math.floor(worldX / W)
  for (const ms of milestones) {
    const msWX = cycleN * W + ms.rx * W
    for (const cwx of [msWX - W, msWX, msWX + W]) {
      const dx = worldX - cwx
      if (dx >= -38 && dx <= 70) off += spikeOffset(dx, ms.spike)
    }
  }
  return Math.max(6, Math.min(H - 6, baseline + off))
}

/* ─── ACTIVE MILESTONE ───────────────────────────────────────────── */
function getActiveMsIdx(worldX, W) {
  const pos = worldX % W
  let idx = 0
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i].rx * W <= pos) idx = i
  }
  return idx
}

/* ─── ECG PAPER GRID ─────────────────────────────────────────────── */
function drawGrid(ctx, W, H) {
  // Minor squares — every 20 px
  ctx.beginPath()
  ctx.strokeStyle = GRID_MINOR
  ctx.lineWidth   = 0.5
  for (let x = 0; x < W; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, H) }
  for (let y = 0; y < H; y += 20) { ctx.moveTo(0, y); ctx.lineTo(W, y) }
  ctx.stroke()
  // Major squares — every 100 px
  ctx.beginPath()
  ctx.strokeStyle = GRID_MAJOR
  ctx.lineWidth   = 0.8
  for (let x = 0; x < W; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, H) }
  for (let y = 0; y < H; y += 100) { ctx.moveTo(0, y); ctx.lineTo(W, y) }
  ctx.stroke()
}

/* ─── COMPONENT ──────────────────────────────────────────────────── */
export default function JourneyECG() {
  const sectionRef  = useRef(null)
  const canvasRef   = useRef(null)
  const animRef     = useRef(null)
  const activeMsRef = useRef(0)
  const stateRef    = useRef({ worldX:0, bufY:null, W:900, H:180, paused:false, speedMul:1 })

  const [paused,      setPaused]      = useState(false)
  const [speedMul,    setSpeedMul]    = useState(1)
  const [activeMsIdx, setActiveMsIdx] = useState(0)
  const [inView,      setInView]      = useState(false)

  /* scroll trigger — animation starts once section enters viewport */
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true)
    }, { threshold: 0.15 })
    if (sectionRef.current) io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  /* responsive canvas sizing */
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current
      if (!canvas) return
      const W = canvas.parentElement?.clientWidth || 900
      const H = window.innerWidth < 768 ? 140 : 180
      canvas.width  = W
      canvas.height = H
      const st     = stateRef.current
      const newBuf = new Float32Array(W).fill(H / 2)
      if (st.bufY) {
        for (let i = 0; i < Math.min(W, st.bufY.length); i++) newBuf[i] = st.bufY[i]
      }
      st.bufY = newBuf
      st.W = W
      st.H = H
      if (!inView) drawFlatline(canvas, W, H)
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement)
    return () => ro.disconnect()
  }, [inView])

  /* main animation loop */
  useEffect(() => {
    if (!inView) return
    const canvas = canvasRef.current
    if (!canvas) return

    function render() {
      const ctx = canvas.getContext('2d')
      const st  = stateRef.current
      const { W, H, bufY, worldX } = st
      if (!bufY) return

      const headX = Math.floor(worldX) % W

      /* ── background */
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      /* ── ECG paper grid */
      drawGrid(ctx, W, H)

      /* ── categorise each x pixel */
      function cat(x) {
        const d = (headX - x + W) % W
        if (d < GAP)   return 'gap'
        if (d < TRAIL) return 'bright'
        return 'dim'
      }

      /* ── dim (old phosphor) trail */
      ctx.save()
      ctx.strokeStyle = LINE_DIM
      ctx.lineWidth   = 1.4
      ctx.beginPath()
      let on = false
      for (let x = 0; x < W; x++) {
        if (cat(x) !== 'dim') { on = false; continue }
        if (!on) { ctx.moveTo(x + 0.5, bufY[x]); on = true }
        else ctx.lineTo(x + 0.5, bufY[x])
      }
      ctx.stroke()
      ctx.restore()

      /* ── build bright-trail path once, render 3× for phosphor glow */
      const brightPath = new Path2D()
      on = false
      for (let x = 0; x < W; x++) {
        if (cat(x) !== 'bright') { on = false; continue }
        if (!on) { brightPath.moveTo(x + 0.5, bufY[x]); on = true }
        else brightPath.lineTo(x + 0.5, bufY[x])
      }

      // Layer 1 — wide aura
      ctx.save()
      ctx.strokeStyle = LINE_AURA
      ctx.lineWidth   = 10
      ctx.shadowColor = LINE_CORE
      ctx.shadowBlur  = 32
      ctx.stroke(brightPath)
      ctx.restore()

      // Layer 2 — mid glow
      ctx.save()
      ctx.strokeStyle = LINE_MID
      ctx.lineWidth   = 3.5
      ctx.shadowColor = LINE_CORE
      ctx.shadowBlur  = 14
      ctx.stroke(brightPath)
      ctx.restore()

      // Layer 3 — sharp phosphor core
      ctx.save()
      ctx.strokeStyle = LINE_CORE
      ctx.lineWidth   = 1.6
      ctx.shadowColor = HEAD_CLR
      ctx.shadowBlur  = 5
      ctx.stroke(brightPath)
      ctx.restore()

      /* ── milestone dots + year labels (fade as they age) */
      const cycleN = Math.floor(worldX / W)
      for (const ms of milestones) {
        const msWX    = cycleN * W + ms.rx * W
        const elapsed = worldX - msWX
        if (elapsed < 0 || elapsed > W * 0.40) continue
        const alpha = Math.max(0, 1 - elapsed / (W * 0.40))
        const msX   = Math.floor(msWX) % W
        const dotY  = bufY[msX] ?? H / 2
        ctx.save()
        ctx.globalAlpha = alpha
        // dot
        ctx.beginPath()
        ctx.arc(msX, dotY, ms.featured ? 5.5 : 3.5, 0, Math.PI * 2)
        ctx.fillStyle   = ms.featured ? '#EF9F27' : LINE_CORE
        ctx.shadowColor = ms.featured ? '#EF9F27' : LINE_CORE
        ctx.shadowBlur  = ms.featured ? 20 : 10
        ctx.fill()
        // year label at bottom
        ctx.font        = 'bold 8px monospace'
        ctx.fillStyle   = ms.featured ? '#EF9F27' : 'rgba(0,210,80,0.9)'
        ctx.shadowColor = ms.featured ? '#EF9F27' : LINE_CORE
        ctx.shadowBlur  = 6
        ctx.textAlign   = 'center'
        ctx.fillText(ms.year, msX, H - 4)
        ctx.restore()
      }

      /* ── scan beam: faint vertical line at head position */
      ctx.save()
      const beamGrad = ctx.createLinearGradient(headX, 0, headX, H)
      beamGrad.addColorStop(0,   'rgba(0,255,120,0.00)')
      beamGrad.addColorStop(0.4, 'rgba(0,255,120,0.12)')
      beamGrad.addColorStop(0.6, 'rgba(0,255,120,0.12)')
      beamGrad.addColorStop(1,   'rgba(0,255,120,0.00)')
      ctx.strokeStyle = beamGrad
      ctx.lineWidth   = 2
      ctx.beginPath()
      ctx.moveTo(headX, 0)
      ctx.lineTo(headX, H)
      ctx.stroke()
      ctx.restore()

      /* ── head dot — outer glow + bright white core */
      const hy = bufY[headX] ?? H / 2
      ctx.save()
      ctx.beginPath()
      ctx.arc(headX, hy, 5, 0, Math.PI * 2)
      ctx.fillStyle   = HEAD_CLR
      ctx.shadowColor = HEAD_CLR
      ctx.shadowBlur  = 28
      ctx.fill()
      // inner white core
      ctx.beginPath()
      ctx.arc(headX, hy, 2, 0, Math.PI * 2)
      ctx.fillStyle   = '#ffffff'
      ctx.shadowBlur  = 0
      ctx.fill()
      ctx.restore()
    }

    function tick() {
      const st = stateRef.current
      if (!st.paused) {
        st.worldX += BASE_SPEED * st.speedMul
        const px = Math.floor(st.worldX) % st.W
        if (st.bufY) st.bufY[px] = computeY(st.worldX, st.W, st.H)
        const newIdx = getActiveMsIdx(st.worldX, st.W)
        if (newIdx !== activeMsRef.current) {
          activeMsRef.current = newIdx
          setActiveMsIdx(newIdx)
        }
      }
      render()
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [inView])

  /* ── controls */
  function togglePause() {
    const next = !stateRef.current.paused
    stateRef.current.paused = next
    setPaused(next)
  }
  function restart() {
    const st = stateRef.current
    st.worldX = 0
    if (st.bufY) st.bufY.fill(st.H / 2)
    activeMsRef.current = 0
    setActiveMsIdx(0)
  }
  function changeSpeed(s) {
    stateRef.current.speedMul = s
    setSpeedMul(s)
  }
  function jumpToPip(idx) {
    const st     = stateRef.current
    const cycleN = Math.floor(st.worldX / st.W)
    let target   = cycleN * st.W + milestones[idx].rx * st.W
    if (target <= st.worldX + st.W * 0.01) target += st.W
    st.worldX = target
    activeMsRef.current = idx
    setActiveMsIdx(idx)
  }

  const ms  = milestones[activeMsIdx] || milestones[0]
  const bs  = BADGE_STYLE[ms.badge]   || BADGE_STYLE.Milestone
  const bpm = Math.round(72 * speedMul)

  return (
    <section id="journey" className="section ecg-section" ref={sectionRef}>
      <div className="container">

        {/* Section header */}
        <motion.div
          className="section-header"
          data-num="03"
          initial={{ opacity:0, y:32 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:'-60px' }}
          transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
        >
          <span className="section-num">03</span>
          <h2 className="section-title">My Journey</h2>
          <p className="section-subtitle">From Bengaluru to Boston — 2002 to 2027</p>
        </motion.div>

        {/* ECG monitor frame */}
        <div className="ecg-monitor">

          {/* Monitor top bar */}
          <div className="ecg-monitor-header">
            <span className="ecg-vitals-label">AP · CAREER VITALS · 2002–2027</span>
            <div className="ecg-header-right">
              <div className="ecg-bpm-display">
                <span className="ecg-bpm-num">{bpm}</span>
                <span className="ecg-bpm-label">BPM</span>
              </div>
              <div className="ecg-live-badge">
                <span className="ecg-blink-dot" />
                LIVE
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="ecg-canvas-wrap">
            <canvas ref={canvasRef} />
          </div>

          {/* Controls */}
          <div className="ecg-controls">
            <button className="ecg-ctrl-btn" onClick={togglePause} title={paused ? 'Play' : 'Pause'}>
              {paused ? '▶' : '⏸'}
            </button>
            <button className="ecg-ctrl-btn" onClick={restart} title="Restart">↺</button>
            <div className="ecg-speed-group">
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  className={`ecg-speed-btn${speedMul === s ? ' active' : ''}`}
                  onClick={() => changeSpeed(s)}
                >
                  {s}×
                </button>
              ))}
            </div>
            <span className="ecg-scale-label">25 mm/s</span>
          </div>

        </div>

        {/* Active milestone card */}
        <div className="ecg-card-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={ms.title}
              className={`ecg-card${ms.featured ? ' ecg-card-featured' : ''}`}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.22, ease:'easeOut' }}
            >
              <div className="ecg-card-top">
                <span
                  className="ecg-badge"
                  style={{ background:bs.bg, color:bs.color, borderColor:`${bs.color}55` }}
                >
                  {ms.badge}
                </span>
                <span className="ecg-card-year">{ms.year}</span>
              </div>
              <div className="ecg-card-title">{ms.title}</div>
              <div className="ecg-card-sub">{ms.sub}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress pips */}
        <div className="ecg-pips">
          {milestones.map((m, i) => (
            <button
              key={i}
              className={[
                'ecg-pip',
                i === activeMsIdx ? 'active' : i < activeMsIdx ? 'past' : '',
                m.featured ? 'featured' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => jumpToPip(i)}
              title={`${m.year} — ${m.title}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

/* ─── STATIC FLATLINE (shown before scroll triggers animation) ───── */
function drawFlatline(canvas, W, H) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  drawGrid(ctx, W, H)
  ctx.strokeStyle = '#012d0a'
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.moveTo(0, H / 2)
  ctx.lineTo(W, H / 2)
  ctx.stroke()
}
