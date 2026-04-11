import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, useInView } from 'framer-motion'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

/* ─── UTILS ─────────────────────────────────────────────────────── */
const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
})

/* ─── DATA ──────────────────────────────────────────────────────── */
const NAV_LINKS = ['About', 'Experience', 'Projects', 'Research', 'Awards', 'Contact']

const EXPERIENCE = [
  {
    title: 'Program Manager & Scrum Master',
    company: 'MSIG USA',
    type: 'Co-op',
    location: 'Warren, NJ',
    period: 'Jan 2025 – Present',
    description: 'Operational and delivery anchor for the Data & AI team — spanning agile delivery, PI planning, hiring operations, ADO governance, and executive reporting across Claims, Re-insurance, Finance, and Strategic Projects.',
    bullets: [
      'Facilitating daily standups across Claims Data, Fabric, and Data Operations; managing Azure DevOps boards and aligning sprint work with PI planning inputs',
      'Co-authored Q2 2026 PI Planning Kick-off deck; led dependency coordination across Claims, Actuarial, Finance, and Data Platforms',
      'Developed PCT/Prosci Change Triangle Assessment Framework — 29-deliverable, 16-condition project health methodology presented to VP/Director leadership',
      'Supporting Microsoft Fabric tenant-to-tenant migration and delivering enablement training for 20 actuarial participants on F64 capacity',
    ],
    tags: ['Microsoft Fabric', 'Azure DevOps', 'Scrum / Agile', 'PI Planning', 'Change Management', 'Prosci'],
    current: true,
  },
  {
    title: 'Co-Founder & Chief Product Officer',
    company: 'Cratel',
    type: 'Startup',
    location: 'Bengaluru, India',
    period: 'Jun 2023 – Apr 2024',
    description: 'Co-founded a B2C e-commerce startup streamlining supply chains by connecting producers directly to consumers.',
    bullets: [
      'Designed platform reducing consumer costs by 40% through direct producer-consumer connections',
      'Implemented process optimizations cutting operational costs by 25%',
      'Developed data-driven should-cost models for IoT hardware procurement',
    ],
    tags: ['Product Strategy', 'Supply Chain', 'Should-Cost Modeling', 'Team Leadership'],
    current: false,
  },
  {
    title: 'Program Manager',
    company: 'Office of Dean of Student Affairs, PES University',
    type: null,
    location: 'Bengaluru, India',
    period: 'Jun 2023 – Jan 2024',
    description: 'Operational lead for the Dean\'s office, overseeing a broad portfolio of student programs and organizations.',
    bullets: [
      'Directed 1,000+ student volunteers; organized university-wide events for audiences up to 10,000',
      'Managed $350,000+ in annual funding across 50+ student organizations',
      'Designed automated event approval system reducing administrative turnaround by 60%',
    ],
    tags: ['Event Management', 'Budget Oversight', 'Stakeholder Management', 'SOPs'],
    current: false,
  },
]

const PROJECTS = [
  {
    id: 'adop',
    icon: '⚙️',
    title: 'Autonomous Data Operations Platform',
    subtitle: 'MSIG USA · Data & AI Team',
    context: 'MSIG USA · 2025 · Internal Platform',
    description: 'Built the operational backbone for MSIG\'s Data & AI delivery — spanning ADO governance, sprint orchestration, PI planning, and executive dashboards across Claims, Re-insurance, and Finance data teams.',
    bullets: [
      'Automated Azure DevOps governance across 3 concurrent data workstreams',
      'Built Q2 2026 PI Planning framework translating capacity inputs into 100+ ADO line items',
      'Delivered EDM Monthly Status dashboards tracking hiring pipeline and risks to VP/Director leadership',
      'Enabled Microsoft Fabric tenant migration and trained 20 actuarial staff on F64 capacity',
    ],
    tags: ['Azure DevOps', 'Microsoft Fabric', 'PI Planning', 'Agile', 'Executive Reporting'],
    award: null,
  },
  {
    id: 'arima',
    icon: '📈',
    title: 'Hybrid ARIMA-LLM Forecasting',
    subtitle: 'MS Thesis Research',
    context: 'Northeastern University · Prof. Nada R. Sanders · 2025',
    description: 'Novel hybrid architecture combining ARIMA\'s statistical rigor with LLM explainability for enterprise supply chain demand forecasting — bridging accuracy and interpretability.',
    bullets: [
      '40.61% MAPE — statistically equivalent to pure ARIMA (p=0.0524)',
      '100% routing accuracy via LangGraph Human-in-the-Loop orchestration',
      '+13.18 pp improvement over baseline on high-volatility SKUs',
      'Chess-engine-inspired confidence visualizer for practitioner transparency',
    ],
    tags: ['ARIMA', 'LLM', 'LangGraph', 'Python', 'Supply Chain', 'HITL'],
    award: 'MS Thesis · Under Review — INFORMS 2027',
  },
  {
    id: 'spidey',
    icon: '🥽',
    title: '"Spidey Sense"',
    subtitle: 'Haptic VR Accessibility Device',
    context: 'MIT Reality Hack 2025 · Project Manager · 48-Hour Hackathon',
    description: 'Led a multidisciplinary team to build a wearable haptic navigation device making VR accessible to visually impaired users using Meta Quest 3 spatial mapping and real-time vibration feedback.',
    bullets: [
      'ESP32 microcontroller with DRV8833 pancake vibration motors',
      'Bluetooth LE integration with Meta Quest 3 — <50ms feedback latency',
      '95% improvement in navigation confidence among visually impaired test users',
      'Won "Jaw-Dropping Award" from 100+ international teams',
    ],
    tags: ['ESP32', 'C++', 'VR', 'Bluetooth LE', 'Meta Quest 3', 'Hardware'],
    award: 'Jaw-Dropping Award · MIT Reality Hack 2025',
  },
  {
    id: 'pct',
    icon: '📋',
    title: 'PCT Assessment Framework',
    subtitle: 'Organizational Change Methodology',
    context: 'MSIG USA · Presented to VP/Director Leadership · 2025',
    description: 'Developed the PCT/Prosci Change Triangle Assessment Framework — a 29-deliverable, 16-condition project health methodology for evaluating organizational readiness and change adoption.',
    bullets: [
      '29-deliverable assessment covering leadership, PM, and change management dimensions',
      '16-condition health scoring model for real-time project risk visibility',
      'Proposed as organizational standard to VP/Director leadership at MSIG USA',
    ],
    tags: ['Prosci', 'Change Management', 'ADKAR', 'Organizational Design', 'Risk Assessment'],
    award: null,
  },
]

const RESEARCH = [
  {
    title: 'Bridging the Accuracy-Explainability Gap: A Hybrid ARIMA-LLM Architecture for Demand Forecasting',
    authors: 'Yashaswi Alur Prasannakumar, Dr. Nada R. Sanders',
    venue: 'Under Review · Targeting INFORMS 2027 & POMS 2027',
    status: 'under-review',
    description: 'A novel hybrid forecasting architecture integrating ARIMA\'s statistical rigor with LLM explainability — addressing the critical gap in enterprise supply chain tools where black-box predictions impede trust and adoption.',
    highlights: [
      'LangGraph orchestration with Human-in-the-Loop escalation achieving 100% routing accuracy',
      'Chess-engine-inspired forecast confidence visualizer for practitioner transparency',
      'Between-subjects user study validating explainability impact on decision quality',
    ],
    tags: ['ARIMA', 'LLM', 'LangGraph', 'Supply Chain Forecasting', 'Time Series', 'Python', 'HITL'],
  },
  {
    title: 'Multi-Dimensional Trust Calibration for Human-in-the-Loop AI Decision Systems',
    authors: 'Yashaswi Alur Prasannakumar, Dr. Nada R. Sanders',
    venue: 'Under Review · Targeting INFORMS 2027 & POMS 2027',
    status: 'under-review',
    description: 'Investigates how trust in AI-assisted decision systems can be systematically calibrated across multiple dimensions in supply chain planning contexts.',
    highlights: [],
    tags: ['Human-in-the-Loop', 'AI Trust', 'Decision Systems', 'Supply Chain', 'Behavioral Research'],
  },
  {
    title: 'Deep Learning-Based Blockage Prediction for IRS-Aided V2X Networks',
    authors: 'Yashaswi Alur Prasannakumar et al.',
    venue: 'Published · WiSPNET 2024',
    status: 'published',
    description: 'CNN, GRU, and LSTM models for predicting mm-Wave link blockages in vehicular networks using the ViWi dataset.',
    highlights: [],
    tags: ['CNN', 'GRU', 'LSTM', 'mm-Wave', 'V2X', 'IRS'],
  },
  {
    title: 'IRS-Assisted mm-Wave Blockage Prediction in Vehicular Environments',
    authors: 'Yashaswi Alur Prasannakumar et al.',
    venue: 'Published · PES University Research · 2024',
    status: 'published',
    description: 'ML-based obstacle prediction in high-mobility V2X environments, focusing on NLOS communication reliability via intelligent reflecting surfaces.',
    highlights: [],
    tags: ['Machine Learning', 'V2X', 'NLOS', 'IRS', 'Vehicular Networks'],
  },
]

const AWARDS = [
  {
    icon: '🏆',
    title: 'MIT Reality Hack 2025',
    award: 'Jaw-Dropping Award',
    sub: 'Hardware Track · 100+ International Teams · MIT Media Lab',
    desc: '"Spidey Sense" — haptic VR accessibility device for visually impaired users. Won from over 100 international teams at the world\'s premier XR hackathon.',
    highlight: true,
  },
  {
    icon: '🎓',
    title: 'Harvard GCCH 2026',
    award: 'Finance / M&A Case Competition',
    sub: 'Harvard Global Case Competition on Healthcare',
    desc: 'Competed in the Finance and M&A track at Harvard\'s Global Case Competition on Healthcare, presenting strategic analysis to industry judges.',
    highlight: false,
  },
  {
    icon: '🏛️',
    title: 'GSG Senator',
    award: 'Graduate Student Government',
    sub: 'Northeastern University · 2025–2026',
    desc: 'Elected Senator representing graduate student interests in institutional policy discussions and funding decisions at Northeastern University.',
    highlight: false,
  },
  {
    icon: '⭐',
    title: 'Graduate Leadership Institute',
    award: 'GLI Fellow',
    sub: 'Northeastern University · Selective Cohort',
    desc: 'Selective leadership development program for high-impact graduate students, focused on institutional leadership and professional excellence.',
    highlight: false,
  },
]

const LEADERSHIP_EXTRA = [
  { role: 'Head of Hardware Sponsorship', org: 'MIT Reality Hack 2027', period: 'Active' },
  { role: 'Community Chair & Exec Committee', org: 'Intercollegiate XR (ICXR)', period: 'Mar 2025 – Mar 2026' },
  { role: 'Founder & Club Head', org: 'Shunya: The Math Club, PES University', period: '2021 – 2024' },
  { role: 'Student Head', org: 'Bharat Unleashed — PES Golden Jubilee', period: 'Jan 2024' },
  { role: 'Event Head', org: 'Samarpana — Armed Forces Tribute, PES', period: '2022 – 2023' },
  { role: 'Founding Member', org: 'IEEE Signal Processing Society, PES', period: '2022 – 2024' },
]

/* ─── CUSTOM CURSOR ──────────────────────────────────────────────── */
function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (dot.current) {
        dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
      if (ring.current) {
        ring.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  )
}

/* ─── TYPEWRITER ─────────────────────────────────────────────────── */
function Typewriter({ text, speed = 65 }) {
  const [display, setDisplay] = useState('')
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (i < text.length) {
      const t = setTimeout(() => { setDisplay(text.slice(0, i + 1)); setI(i + 1) }, speed)
      return () => clearTimeout(t)
    } else {
      setDone(true)
    }
  }, [i, text, speed])
  return <span>{display}{!done && <span className="tw-cursor">|</span>}</span>
}

/* ─── TILT CARD ──────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    const card = ref.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.025, 1.025, 1.025)`
  }
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }
  return (
    <div ref={ref} className={`tilt-card ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  )
}

/* ─── STAT COUNTER ───────────────────────────────────────────────── */
function StatCounter({ target, suffix = '', decimals = 0, prefix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isInView) return
    const end = parseFloat(target)
    const duration = 1800
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(end * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, target])
  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  )
}

/* ─── NAV ────────────────────────────────────────────────────────── */
function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const go = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }
  return (
    <motion.nav
      className={`nav${scrolled ? ' scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-inner">
        <button className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>AP</button>
        <div className={`nav-links${open ? ' open' : ''}`}>
          {NAV_LINKS.map(l => (
            <button
              key={l}
              className={`nav-link${active === l.toLowerCase() ? ' active' : ''}`}
              onClick={() => go(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <button className="hamburger" onClick={() => setOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </motion.nav>
  )
}

/* ─── HERO ───────────────────────────────────────────────────────── */
function Hero() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => { setMobile(isMobileDevice()) }, [])
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section id="hero" className="hero">
      {!mobile && (
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>
      )}
      {mobile && <div className="hero-gradient-fallback" />}
      <div className="hero-content">
        <motion.div className="hero-eyebrow" {...fadeUp(0.1)}>
          PM · Researcher · Builder
        </motion.div>
        <motion.h1 className="hero-name" {...fadeUp(0.2)}>
          <Typewriter text="Yashaswi Alur Prasannakumar" speed={55} />
        </motion.h1>
        <motion.p className="hero-tagline" {...fadeUp(0.35)}>
          Building at the intersection of <span className="accent">Data</span>,{' '}
          <span className="accent2">AI</span> &amp; Strategic Operations
        </motion.p>
        <motion.div className="hero-ctas" {...fadeUp(0.45)}>
          <button
            className="btn-primary"
            onClick={() => typeof window.chatbase === 'function' && window.chatbase('open')}
          >
            Chat with AP
          </button>
          <button className="btn-ghost" onClick={() => go('projects')}>
            View Work
          </button>
        </motion.div>
        <motion.div className="hero-badges" {...fadeUp(0.55)}>
          {['Open to Full-Time · Jan 2027', 'Somerset, NJ', 'Dec 2026 Graduate'].map(b => (
            <span key={b} className="hero-badge">{b}</span>
          ))}
        </motion.div>
      </div>
      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <div className="scroll-line" />
        <span>Scroll</span>
      </motion.div>
    </section>
  )
}

/* ─── ABOUT ──────────────────────────────────────────────────────── */
const SKILL_BADGES = [
  { label: 'Program Management', color: 'accent' },
  { label: 'Microsoft Fabric', color: 'accent2' },
  { label: 'LangGraph / LLMs', color: 'accent' },
  { label: 'Azure DevOps', color: 'accent2' },
  { label: 'Supply Chain', color: 'accent' },
  { label: 'Python', color: 'accent2' },
  { label: 'Scrum / Agile', color: 'accent' },
  { label: 'XR / Hardware', color: 'accent2' },
  { label: 'PI Planning', color: 'accent' },
  { label: 'Power BI', color: 'accent2' },
  { label: 'Change Management', color: 'accent' },
  { label: 'Time Series', color: 'accent2' },
]

function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">01</span>
          <h2 className="section-title">About</h2>
        </motion.div>
        <div className="about-grid">
          <div className="about-text-col">
            <motion.p className="about-lead" {...fadeUp(0.1)}>
              Engineering Management grad student at Northeastern (GPA 3.75, Dec 2026) — specializing at the intersection of <span className="accent">Data, AI</span>, and <span className="accent2">Program Management</span>.
            </motion.p>
            <motion.p className="about-body" {...fadeUp(0.2)}>
              Currently leading strategic projects under the Head of Data &amp; AI at MSIG USA across agile delivery, PI planning, and organizational change. My background spans electronics engineering from PES University, startup co-founding, award-winning hardware hacking at MIT, and graduate-level supply chain research.
            </motion.p>
            <motion.p className="about-body" {...fadeUp(0.25)}>
              I thrive in roles that blend technical depth with strategic execution — building systems that are rigorous, explainable, and actually useful to the humans in the loop.
            </motion.p>
            <motion.div className="about-stats" {...fadeUp(0.3)}>
              {[
                { num: '3.75', label: 'GPA' },
                { num: 'MIT', label: 'Hackathon Winner' },
                { num: '10+', label: 'Leadership Roles' },
                { num: '4', label: 'Research Papers' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="about-right-col">
            <motion.div className="about-photo-wrap" {...fadeUp(0.15)}>
              <img src="/APY_Harvard_Bg.jpg" alt="Yashaswi at Harvard" className="about-photo" />
              <div className="about-photo-caption">Harvard Asian Conference 2025</div>
            </motion.div>
            <motion.div className="edu-cards" {...fadeUp(0.25)}>
              <div className="edu-card">
                <div className="edu-degree">MS · Engineering Management</div>
                <div className="edu-school">Northeastern University</div>
                <div className="edu-detail">Boston, MA · Dec 2026 · GPA 3.75</div>
              </div>
              <div className="edu-card">
                <div className="edu-degree">BTech · Electronics &amp; Communication</div>
                <div className="edu-school">PES University</div>
                <div className="edu-detail">Bengaluru, India · Class of 2024</div>
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div className="skill-badges-wrap" {...fadeUp(0.3)}>
          {SKILL_BADGES.map((b, i) => (
            <motion.span
              key={b.label}
              className={`skill-badge ${b.color}`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              {b.label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── EXPERIENCE ─────────────────────────────────────────────────── */
function Experience() {
  return (
    <section id="experience" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">02</span>
          <h2 className="section-title">Experience</h2>
        </motion.div>
        <div className="timeline">
          {EXPERIENCE.map((exp, i) => (
            <motion.div key={i} className="timeline-item" {...fadeUp(i * 0.1)}>
              <div className="timeline-marker">
                {exp.current && <div className="timeline-pulse" />}
                <div className={`timeline-dot${exp.current ? ' current' : ''}`} />
                {i < EXPERIENCE.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="exp-header">
                  <div>
                    <div className="exp-title">{exp.title}</div>
                    <div className="exp-company">
                      {exp.company}
                      {exp.type && <span className="exp-type-badge">{exp.type}</span>}
                      {exp.current && <span className="exp-current-badge">Current</span>}
                    </div>
                  </div>
                  <div className="exp-meta">
                    <div className="exp-period">{exp.period}</div>
                    <div className="exp-location">{exp.location}</div>
                  </div>
                </div>
                <p className="exp-desc">{exp.description}</p>
                <ul className="exp-bullets">
                  {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <div className="tag-row">
                  {exp.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PROJECTS ───────────────────────────────────────────────────── */
function Projects() {
  return (
    <section id="projects" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">03</span>
          <h2 className="section-title">Projects</h2>
        </motion.div>
        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <TiltCard className="project-card">
                {p.award && <div className="project-award-badge">🏆 {p.award}</div>}
                <div className="project-icon">{p.icon}</div>
                <div className="project-title">{p.title}</div>
                {p.subtitle && <div className="project-subtitle">{p.subtitle}</div>}
                <div className="project-context">{p.context}</div>
                <p className="project-desc">{p.description}</p>
                <ul className="project-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <div className="tag-row">
                  {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── RESEARCH ───────────────────────────────────────────────────── */
function Research() {
  const underReview = RESEARCH.filter(p => p.status === 'under-review')
  const published = RESEARCH.filter(p => p.status === 'published')
  return (
    <section id="research" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">04</span>
          <h2 className="section-title">Research</h2>
          <p className="section-subtitle">With Prof. Nada R. Sanders · Northeastern University</p>
        </motion.div>

        {/* Thesis stats */}
        <motion.div className="research-stats" {...fadeUp(0.1)}>
          {[
            { value: 40.61, suffix: '%', decimals: 2, label: 'MAPE Score', sub: 'Statistically equiv. to pure ARIMA' },
            { value: 100, suffix: '%', decimals: 0, label: 'Routing Accuracy', sub: 'LangGraph HITL orchestration' },
            { value: 13, suffix: 'pp', decimals: 0, label: 'Improvement', sub: 'Over baseline on volatile SKUs' },
          ].map((s, i) => (
            <motion.div key={s.label} className="research-stat-card" {...fadeUp(0.1 + i * 0.1)}>
              <div className="rstat-num">
                <StatCounter target={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="rstat-label">{s.label}</div>
              <div className="rstat-sub">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.h3 className="pub-heading" {...fadeUp(0.15)}>Under Review</motion.h3>
        {underReview.map((p, i) => (
          <motion.div key={i} className="research-card featured-research" {...fadeUp(0.1 + i * 0.08)}>
            <div className="research-status-badge">Under Review</div>
            <h3 className="research-title">{p.title}</h3>
            <div className="research-authors">{p.authors}</div>
            <div className="research-venue">{p.venue}</div>
            <p className="research-desc">{p.description}</p>
            {p.highlights.length > 0 && (
              <ul className="research-highlights">
                {p.highlights.map((h, j) => <li key={j}>{h}</li>)}
              </ul>
            )}
            <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
          </motion.div>
        ))}

        <motion.h3 className="pub-heading" style={{ marginTop: '48px' }} {...fadeUp(0.2)}>Published</motion.h3>
        <div className="published-grid">
          {published.map((p, i) => (
            <motion.div key={i} className="research-card" {...fadeUp(0.2 + i * 0.08)}>
              <div className="research-status-badge published">Published</div>
              <div className="research-title small">{p.title}</div>
              <div className="research-venue">{p.venue}</div>
              <p className="research-desc">{p.description}</p>
              <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── AWARDS ─────────────────────────────────────────────────────── */
function Awards() {
  return (
    <section id="awards" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">05</span>
          <h2 className="section-title">Awards &amp; Leadership</h2>
        </motion.div>
        <div className="awards-grid">
          {AWARDS.map((a, i) => (
            <motion.div key={i} {...fadeUp(i * 0.09)}>
              <TiltCard className={`award-card${a.highlight ? ' highlight' : ''}`}>
                <div className="award-icon">{a.icon}</div>
                <div className="award-title">{a.title}</div>
                <div className="award-name">{a.award}</div>
                <div className="award-sub">{a.sub}</div>
                <p className="award-desc">{a.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        <motion.h3 className="pub-heading" style={{ marginTop: '56px' }} {...fadeUp(0.2)}>
          More Leadership
        </motion.h3>
        <div className="leadership-compact-grid">
          {LEADERSHIP_EXTRA.map((l, i) => (
            <motion.div key={i} className="leadership-compact-card" {...fadeUp(0.1 + i * 0.07)}>
              <div className="lc-role">{l.role}</div>
              <div className="lc-org">{l.org}</div>
              <div className="lc-period">{l.period}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CONTACT ────────────────────────────────────────────────────── */
function Contact() {
  return (
    <section id="contact" className="section section-alt">
      <div className="container contact-container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">06</span>
          <h2 className="section-title">Contact</h2>
        </motion.div>
        <motion.p className="contact-blurb" {...fadeUp(0.1)}>
          Open to full-time roles in Program Management, Data &amp; AI, and Engineering Operations — available from January 2027. Based in Somerset, NJ. Happy to connect on research, XR, or anything interesting.
        </motion.p>
        <motion.div className="contact-links" {...fadeUp(0.2)}>
          {[
            { label: 'Email', value: 'alurprasannakumar.y@northeastern.edu', href: 'mailto:alurprasannakumar.y@northeastern.edu', icon: '✉' },
            { label: 'LinkedIn', value: 'linkedin.com/in/apyashaswi', href: 'https://linkedin.com/in/apyashaswi', icon: '🔗' },
            { label: 'GitHub', value: 'github.com/apyashaswi', href: 'https://github.com/apyashaswi', icon: '⌥' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="contact-link-card">
              <span className="clc-icon">{l.icon}</span>
              <div>
                <div className="clc-label">{l.label}</div>
                <div className="clc-value">{l.value}</div>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── APP ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [])
  return (
    <>
      <CustomCursor />
      <Nav active={active} />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Research />
        <Awards />
        <Contact />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">AP</span>
          <span>© 2026 Yashaswi Alur Prasannakumar</span>
          <span>Built with React · Hosted on Vercel</span>
        </div>
      </footer>
    </>
  )
}
