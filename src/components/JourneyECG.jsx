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
const BG          = '#060608'
const LINE_BRIGHT = '#cc2222'
const LINE_DIM    = '#330000'
const GRID_COLOR  = '#140404'
const BASE_SPEED  = 1.5   // px / frame at 1×
const GAP         = 32    // eraser gap ahead of head (px)
const TRAIL       = 120   // bright-trail length behind head (px)

/* ─── SPIKE SHAPE ────────────────────────────────────────────────── */
// Returns y-offset: negative = upward, positive = dip
// Smooth, continuous ECG QRS+T shape
function spikeOffset(dx, h) {
  if (dx < -14 || dx > 64) return 0
  // Pre-dip (Q): small downward bulge centred at dx≈-9
  if (dx <= -5) {
    const t = (dx + 14) / 9
    return h * 0.1 * Math.sin(Math.PI * t)
  }
  // Rise to peak (smooth cubic: 0 → -h)
  if (dx <= 2) {
    const t = (dx + 5) / 7
    return -h * t * t * (3 - 2 * t)
  }
  // Fall from peak (-h → 0)
  if (dx <= 10) {
    const t = (dx - 2) / 8
    return -h * (1 - t * t)
  }
  // Post-dip (S): small downward hump
  if (dx <= 20) {
    const t = (dx - 10) / 10
    return h * 0.2 * Math.sin(Math.PI * t)
  }
  // T-wave: gentle upward recovery
  if (dx <= 58) {
    const t = (dx - 20) / 38
    return -h * 0.12 * Math.sin(Math.PI * t)
  }
  return 0
}

/* ─── Y VALUE AT WORLD POSITION ──────────────────────────────────── */
function computeY(worldX, W, H) {
  const baseline = H / 2 + Math.sin(worldX * 0.08) * 4
  let off = 0
  const cycleN = Math.floor(worldX / W)
  for (const ms of milestones) {
    const msWX = cycleN * W + ms.rx * W
    // Check adjacent cycles to avoid edge discontinuities
    for (const cwx of [msWX - W, msWX, msWX + W]) {
      const dx = worldX - cwx
      if (dx >= -14 && dx <= 64) off += spikeOffset(dx, ms.spike)
    }
  }
  return Math.max(8, Math.min(H - 8, baseline + off))
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

  /* scroll trigger */
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.15 })
    if (sectionRef.current) io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  /* canvas resize */
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current
      if (!canvas) return
      const W = canvas.parentElement?.clientWidth || 900
      const H = window.innerWidth < 768 ? 140 : 180
      canvas.width  = W
      canvas.height = H
      const st    = stateRef.current
      const newBuf = new Float32Array(W).fill(H / 2)
      if (st.bufY) for (let i = 0; i < Math.min(W, st.bufY.length); i++) newBuf[i] = st.bufY[i]
      st.bufY = newBuf
      st.W = W
      st.H = H
      /* draw static flatline until in view */
      if (!inView) drawFlatline(canvas, W, H)
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement)
    return () => ro.disconnect()
  }, [inView])

  /* animation loop */
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

      /* background + grid */
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = GRID_COLOR
      for (let gx = 0; gx < W; gx += 60) ctx.fillRect(gx, 0, 1, H)
      ctx.fillRect(0, Math.floor(H * 0.25), W, 1)
      ctx.fillRect(0, Math.floor(H * 0.5),  W, 1)
      ctx.fillRect(0, Math.floor(H * 0.75), W, 1)

      function cat(x) {
        const d = (headX - x + W) % W
        if (d < GAP)   return 'gap'
        if (d < TRAIL) return 'bright'
        return 'dim'
      }

      /* dim trail */
      ctx.save()
      ctx.strokeStyle = LINE_DIM
      ctx.lineWidth   = 1.6
      ctx.beginPath()
      let on = false
      for (let x = 0; x < W; x++) {
        if (cat(x) !== 'dim') { on = false; continue }
        if (!on) { ctx.moveTo(x, bufY[x]); on = true } else ctx.lineTo(x, bufY[x])
      }
      ctx.stroke()
      ctx.restore()

      /* bright trail with glow */
      ctx.save()
      ctx.strokeStyle = LINE_BRIGHT
      ctx.lineWidth   = 2
      ctx.shadowColor = LINE_BRIGHT
      ctx.shadowBlur  = 8
      ctx.beginPath()
      on = false
      for (let x = 0; x < W; x++) {
        if (cat(x) !== 'bright') { on = false; continue }
        if (!on) { ctx.moveTo(x, bufY[x]); on = true } else ctx.lineTo(x, bufY[x])
      }
      ctx.stroke()
      ctx.restore()

      /* milestone dots + year labels (fade out as they age) */
      const cycleN = Math.floor(worldX / W)
      for (const ms of milestones) {
        const msWX    = cycleN * W + ms.rx * W
        const elapsed = worldX - msWX
        if (elapsed < 0 || elapsed > W * 0.38) continue
        const alpha = Math.max(0, 1 - elapsed / (W * 0.38))
        const msX   = Math.floor(msWX) % W
        const dotY  = bufY[msX] || H / 2
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(msX, dotY, ms.featured ? 5 : 3, 0, Math.PI * 2)
        ctx.fillStyle = ms.featured ? '#EF9F27' : '#cc4444'
        if (ms.featured) { ctx.shadowColor = '#EF9F27'; ctx.shadowBlur = 14 }
        ctx.fill()
        ctx.font      = '9px monospace'
        ctx.fillStyle = ms.featured ? '#EF9F27' : '#cc5555'
        ctx.textAlign = 'center'
        ctx.fillText(ms.year, msX, H - 5)
        ctx.restore()
      }

      /* glowing head dot */
      ctx.save()
      ctx.beginPath()
      ctx.arc(headX, bufY[headX] || H / 2, 4.5, 0, Math.PI * 2)
      ctx.fillStyle   = '#ff3333'
      ctx.shadowColor = '#ff3333'
      ctx.shadowBlur  = 22
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

  /* controls */
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

  const ms = milestones[activeMsIdx] || milestones[0]
  const bs = BADGE_STYLE[ms.badge] || BADGE_STYLE.Milestone

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

        {/* ECG monitor */}
        <div className="ecg-monitor">

          {/* Monitor top bar */}
          <div className="ecg-monitor-header">
            <span className="ecg-vitals-label">AP · CAREER VITALS · 2002–2027</span>
            <div className="ecg-live-badge">
              <span className="ecg-blink-dot" />
              LIVE · CONTINUOUS
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
                <span className="ecg-badge" style={{ background:bs.bg, color:bs.color, borderColor:`${bs.color}55` }}>
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

/* ─── STATIC FLATLINE (before in-view) ───────────────────────────── */
function drawFlatline(canvas, W, H) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = GRID_COLOR
  for (let gx = 0; gx < W; gx += 60) ctx.fillRect(gx, 0, 1, H)
  ctx.fillRect(0, Math.floor(H * 0.25), W, 1)
  ctx.fillRect(0, Math.floor(H * 0.5),  W, 1)
  ctx.fillRect(0, Math.floor(H * 0.75), W, 1)
  ctx.strokeStyle = '#440000'
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.moveTo(0, H / 2)
  ctx.lineTo(W, H / 2)
  ctx.stroke()
}
