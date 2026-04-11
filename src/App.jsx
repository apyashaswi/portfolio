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
const NAV_LINKS = ['About', 'Experience', 'Projects', 'Highlights', 'Research', 'Skills', 'Leadership', 'Contact']

const EXPERIENCE = [
  {
    title: 'Program Manager & Scrum Master',
    company: 'MSIG USA',
    type: 'Co-op',
    location: 'Warren, NJ',
    period: 'Jan 2025 – Present',
    description: 'Serving as the operational and delivery anchor for the Data & AI team — spanning agile delivery, PI planning, hiring operations, ADO governance, and executive reporting across Claims Data, Re-insurance and Finance Data, and Strategic Projects.',
    bullets: [
      'Facilitating daily standups for Claims Data, Fabric, and Data Operations teams; managing Azure DevOps boards, resolving access issues, and aligning sprint work items with PI planning inputs across multiple concurrent workstreams',
      'Co-authored Q2 2026 PI Planning Kick-off deck and led dependency coordination across Claims, Actuarial, Finance, and Data Platforms; translated capacity planning inputs into ADO-ready line items',
      'Developed the PCT/Prosci Change Triangle Assessment Framework — a 29-deliverable, 16-condition project health methodology presented to VP/Director leadership as a proposed organizational standard',
      'Co-authoring EDM Monthly Status Tracking decks for leadership covering onboarding throughput, interview pipeline, risks, and mitigations; acting as trusted operational anchor for delivery directors and data leads',
      'Supporting Microsoft Fabric tenant-to-tenant migration across database tables and delivering Fabric enablement training for 20 actuarial participants on F64 capacity',
    ],
    tags: ['Microsoft Fabric', 'Azure DevOps', 'Scrum / Agile', 'PI Planning', 'Change Management', 'Hiring Operations', 'Executive Reporting', 'Prosci'],
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
      'Designed platform that reduced consumer costs by 40% through direct producer-consumer connections',
      'Implemented process optimizations cutting operational costs by 25%',
      'Developed data-driven should-cost models for IoT hardware procurement',
      'Established supplier selection frameworks and quality control procedures',
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
      'Directed 1,000+ student volunteers and organized university-wide events for audiences up to 10,000',
      'Managed $350,000+ in annual funding across 50+ student organizations',
      'Designed automated event approval system reducing administrative turnaround time by 60%',
    ],
    tags: ['Event Management', 'Budget Oversight', 'Stakeholder Management', 'SOPs'],
    current: false,
  },
]

const PROJECTS = [
  {
    id: 'spidey',
    featured: true,
    icon: '🥽',
    title: '"Spidey Sense"',
    subtitle: 'Haptic VR Accessibility Device',
    context: 'MIT Reality Hack 2025 · Project Manager · Team of 5 · 48-Hour Hackathon',
    description: 'Led a multidisciplinary team to develop a wearable haptic navigation device making VR accessible to visually impaired users. Meta Quest 3 cameras map surroundings and translate obstacles into real-time vibration patterns.',
    bullets: [
      'Built around ESP32 microcontroller with custom pancake vibration motors via DRV8833 drivers',
      'Bluetooth Low Energy integration with Meta Quest 3 — feedback latency under 50ms',
      '95% improvement in navigation confidence among visually impaired test users',
      'Patent application initiated for haptic feedback algorithm',
      'Won "Jaw-Dropping Award" in Hardware Track from 100+ international teams',
    ],
    tags: ['ESP32', 'C++', 'VR Development', 'Bluetooth LE', 'Meta Quest 3', 'Hardware Design'],
    award: 'Jaw-Dropping Award · MIT Reality Hack 2025',
  },
  {
    id: 'warehouse',
    featured: false,
    icon: '🏭',
    title: 'Warehouse Automation Optimization',
    subtitle: null,
    context: 'Northeastern University · Supply Chain Engineering',
    description: 'Redesign of a mid-sized e-commerce warehouse handling 50,000+ monthly orders, exploring automation while preserving human-machine collaboration.',
    bullets: [
      '25% increase in operational efficiency with 18-month ROI payback period',
      '$280K annual savings through labor optimization and error reduction',
      '40% reduction in average pick-walk distance',
    ],
    tags: ['Operations Research', 'AGV Systems', 'WMS', 'ROI Analysis'],
    award: null,
  },
  {
    id: 'firetamer',
    featured: false,
    icon: '🔥',
    title: 'FireTamer',
    subtitle: 'Drone-Based Wildfire Management System',
    context: 'PES University · Simulation Research',
    description: 'Simulation-based research exploring autonomous drone-controlled burning for large-scale wildfire containment using Unity 3D, Python, fuzzy logic, and OpenCV.',
    bullets: [
      '60% reduction in simulated fire spread using proactive controlled burn lines',
      'Real-time 3D visualization with dynamic drone response and environmental feedback loops',
    ],
    tags: ['Unity 3D', 'Python', 'OpenCV', 'Fuzzy Logic', 'Drone Simulation'],
    award: null,
  },
  {
    id: 'uav',
    featured: false,
    icon: '🚁',
    title: 'Digital Twin of UAVs',
    subtitle: null,
    context: 'PES University · Research Project',
    description: 'Comprehensive digital twin framework for UAVs — a real-time virtual replica fed by live sensor data to predict behavior and failures without risking hardware.',
    bullets: [
      '95% accuracy in flight parameter prediction, 88% in failure prediction',
      'Sub-100ms latency Unity physics environment with ROS sensor fusion',
      'Submitted to IEEE Transactions on Aerospace and Electronic Systems',
    ],
    tags: ['ROS', 'Unity 3D', 'Machine Learning', 'LiDAR', 'Kafka'],
    award: null,
  },
  {
    id: 'pct',
    featured: false,
    icon: '📋',
    title: 'PCT Assessment Framework',
    subtitle: 'Organizational Change Methodology',
    context: 'MSIG USA · Data & AI Team · 2025',
    description: 'Designed a project health assessment framework based on the Prosci Change Triangle — combining 29 deliverables and 16 conditions to evaluate organizational readiness and change adoption for enterprise data initiatives.',
    bullets: [
      '29-deliverable assessment covering leadership, project management, and change management dimensions',
      '16-condition health scoring model for real-time project risk visibility',
      'Built on Prosci ADKAR methodology with custom adaptations for data platform delivery',
    ],
    tags: ['Prosci', 'Change Management', 'ADKAR', 'Organizational Design', 'Risk Assessment'],
    award: null,
  },
]

const HIGHLIGHTS = [
  {
    img: '/APY_MIT_Reality_Hack.jpg',
    title: 'MIT Reality Hack 2025 — "Jaw-Dropping Award"',
    sub: 'Won Hardware Track · 100+ international teams',
    badge: '🏆 Award',
    tall: true,
  },
  {
    img: '/APY_Harvard_Bg.jpg',
    title: 'Harvard Asian Conference 2025',
    sub: 'Harvard University, Cambridge, MA',
    badge: null,
    tall: false,
  },
  {
    img: '/APY_MIT_Dome_bg.jpg',
    title: 'MIT Campus',
    sub: 'Boston, MA',
    badge: null,
    tall: false,
  },
  {
    img: '/APY_with_Paws.jpg',
    title: 'Northeastern University',
    sub: 'Boston, MA · MS Engineering Management',
    badge: null,
    tall: false,
  },
]

const RESEARCH = {
  papers: [
    {
      title: 'Bridging the Accuracy-Explainability Gap: A Hybrid ARIMA-LLM Architecture for Demand Forecasting',
      authors: 'Yashaswi Alur Prasannakumar, Dr. Nada R. Sanders',
      venue: 'Under Review · Targeting INFORMS 2027 & POMS 2027',
      status: 'under-review',
      description: 'A novel hybrid forecasting architecture integrating ARIMA\'s statistical rigor with LLM explainability — addressing the critical gap in enterprise supply chain tools where black-box predictions impede trust and adoption. Achieved statistical equivalence to pure ARIMA (40.61% vs. 38.44% MAPE, p=0.0524) while adding natural language explanations. Particularly strong on high-volatility items: +13.18 pp improvement over baseline.',
      highlights: [
        'LangGraph orchestration framework with Human-in-the-Loop escalation achieving 100% routing accuracy',
        'Chess-engine-inspired forecast confidence visualizer for practitioner transparency',
        'Between-subjects user study validating explainability impact on decision quality',
      ],
      tags: ['ARIMA', 'LLM', 'LangGraph', 'Supply Chain Forecasting', 'Time Series', 'Python', 'HITL'],
    },
    {
      title: 'Multi-Dimensional Trust Calibration for Human-in-the-Loop AI Decision Systems: Evidence from Supply Chain Planning',
      authors: 'Yashaswi Alur Prasannakumar, Dr. Nada R. Sanders',
      venue: 'Under Review · Targeting INFORMS 2027 & POMS 2027',
      status: 'under-review',
      description: 'Investigates how trust in AI-assisted decision systems can be systematically calibrated across multiple dimensions in supply chain planning contexts. Examines the interplay between model transparency, human oversight, and decision quality in high-stakes operational settings.',
      highlights: [],
      tags: ['Human-in-the-Loop', 'AI Trust', 'Decision Systems', 'Supply Chain', 'Behavioral Research'],
    },
    {
      title: 'Deep Learning-Based Blockage Prediction for IRS-Aided V2X Networks',
      authors: 'Yashaswi Alur Prasannakumar et al.',
      venue: 'Published · WiSPNET 2024',
      status: 'published',
      description: 'Implemented and compared CNN, GRU, and LSTM models for predicting mm-Wave link blockages in vehicular networks using the ViWi dataset. Demonstrated how Intelligent Reflecting Surfaces improve prediction accuracy and SNR.',
      highlights: [],
      tags: ['CNN', 'GRU', 'LSTM', 'mm-Wave', 'V2X', 'IRS'],
    },
    {
      title: 'IRS-Assisted mm-Wave Blockage Prediction in Vehicular Environments',
      authors: 'Yashaswi Alur Prasannakumar et al.',
      venue: 'Published · PES University Research · 2024',
      status: 'published',
      description: 'ML-based obstacle prediction in high-mobility V2X environments, focusing on NLOS communication reliability and model generalization across urban mobility scenarios via intelligent reflecting surfaces.',
      highlights: [],
      tags: ['Machine Learning', 'V2X', 'NLOS', 'IRS', 'Vehicular Networks'],
    },
  ],
}

const SKILLS = {
  'Program & Project Management': ['Scrum / Agile', 'Azure DevOps', 'Sprint Planning', 'Change Management', 'Stakeholder Communication', 'Risk Management', 'Roadmapping', 'Prosci / ADKAR'],
  'Data & Analytics': ['Microsoft Fabric', 'Power BI', 'Python (Pandas, NumPy, sklearn)', 'SQL', 'Machine Learning', 'LLMs & LangGraph', 'Time Series Analysis', 'Data Pipelines & ETL'],
  'Supply Chain & Operations': ['Strategic Sourcing', 'Should-Cost Modeling', 'Vendor Evaluation', 'Process Optimization', 'Demand Forecasting', 'ERP Systems', 'ROI Analysis', 'Quality Control'],
  'Engineering & Technical': ['MATLAB', 'ROS', 'Unity 3D', 'Google Cloud / Vertex AI', 'Microsoft Azure', 'C++', 'REST APIs', 'Apache Airflow'],
}

const LEADERSHIP = [
  {
    role: 'Head of Hardware Sponsorship',
    org: 'MIT Reality Hack 2027',
    period: 'Active',
    current: true,
    description: 'Leading hardware sponsorship operations for one of the world\'s premier XR hackathons at MIT, coordinating with industry partners to source and deliver hardware for participants.',
  },
  {
    role: 'Senator',
    org: 'Graduate Student Government, Northeastern University',
    period: '2025 – 2026',
    current: false,
    description: 'Represented graduate student interests at Northeastern University, participating in institutional policy discussions and funding decisions.',
  },
  {
    role: 'Community Chair & Executive Committee Member',
    org: 'Intercollegiate XR (ICXR)',
    period: 'Mar 2025 – Mar 2026',
    current: false,
    description: 'Led the world\'s premier collegiate XR community — organizing multi-campus hackathons, managing industry partnerships, and coordinating VR equipment sharing across universities. Resigned March 2026.',
  },
  {
    role: 'Founder & Club Head',
    org: 'Shunya: The Math Club, PES University',
    period: 'Nov 2021 – May 2024',
    current: false,
    description: '200+ active contributors across campuses, ₹20L prize Arithemania 2.0 hackathon, sponsorships from MathWorks and Wolfram, and community math outreach in government schools.',
  },
  {
    role: 'Founder & Advisor',
    org: 'IRA PESU — Socio-Cultural Club, PES University',
    period: '2022 – 2024',
    current: false,
    description: 'Established IRA PESU to celebrate national and cultural festivals across the university campus, building a community-driven platform for cultural events and student engagement.',
  },
  {
    role: 'Founding Member & Advisor',
    org: 'HoPES — Official Media Club, PES University',
    period: '2022 – 2024',
    current: false,
    description: 'One of the founding members of PES University\'s official media club — contributed to major institutional decisions, content strategy, and organizational direction as an advisor.',
  },
  {
    role: 'Student Head',
    org: 'Bharat Unleashed — Golden Jubilee Celebrations, PES University',
    period: 'Jan 2024',
    current: false,
    description: 'Student lead for PES University\'s 50th anniversary celebrations — a 4-day flagship event featuring distinguished speakers, cultural performances by Shankar Mahadevan, and a conclave attended by Smt. Sudha Murthy and other luminaries.',
  },
  {
    role: 'Head of Logistics',
    org: 'Aikya — Social Service Club, PES University',
    period: '2022 – 2024',
    current: false,
    description: 'Managed logistics for social service drives, school outreach programs teaching underprivileged children, hackathons, and donation drives at this Akshaya Patra-inspired community initiative.',
  },
  {
    role: 'Founding Member & Head of Operations',
    org: 'Apple Developers Group, PES University',
    period: '2022 – 2024',
    current: false,
    description: 'Looked after operations and logistics for workshops, technical talks, and engineering events organized by the Apple Developers Group on campus.',
  },
  {
    role: 'Founding Member & Executive Committee',
    org: 'IEEE Signal Processing & Communication Society, PES University',
    period: 'Apr 2022 – Jun 2024',
    current: false,
    description: 'Organized national-level workshops, signal processing bootcamps, and IEEE-sponsored hackathons connecting students with 5G and AI-driven communications industry professionals.',
  },
  {
    role: 'Event Head & Advisor',
    org: 'Samarpana — Annual Armed Forces Tribute, PES University',
    period: 'Jun 2022 – Dec 2023',
    current: false,
    description: 'Led 1,000+ volunteers for a 4-day national event honoring the Indian Armed Forces, featuring Padma Shri A.S. Kiran Kumar as Chief Guest and talks by Kargil War veterans. 10,000+ attendees. Continued as Advisor in 2023.',
  },
  {
    role: 'Co-Founder',
    org: 'Cratel — B2C E-Commerce Startup',
    period: 'Jun 2023 – Apr 2024',
    current: false,
    description: 'Co-founded and led product strategy for a B2C supply chain startup, reducing consumer costs by 40% through direct producer-consumer connections.',
  },
]

/* ─── CUSTOM CURSOR ──────────────────────────────────────────────── */
function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (dot.current) dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      if (ring.current) ring.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
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
    } else { setDone(true) }
  }, [i, text, speed])
  return <span>{display}{!done && <span className="tw-cursor">|</span>}</span>
}

/* ─── TILT CARD ──────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    const card = ref.current; if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.025,1.025,1.025)`
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
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 1800, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(end * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, target])
  return <span ref={ref}>{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>
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
  const go = (id) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }
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
            <button key={l} className={`nav-link${active === l.toLowerCase() ? ' active' : ''}`} onClick={() => go(l)}>{l}</button>
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
        <motion.div className="hero-eyebrow" {...fadeUp(0.1)}>PM · Researcher · Builder</motion.div>
        <motion.h1 className="hero-name" {...fadeUp(0.2)}>
          <Typewriter text="Yashaswi Alur Prasannakumar" speed={55} />
        </motion.h1>
        <motion.p className="hero-tagline" {...fadeUp(0.35)}>
          Building at the intersection of <span className="accent">Data</span>, <span className="accent2">AI</span> &amp; Strategic Operations
        </motion.p>
        <motion.div className="hero-ctas" {...fadeUp(0.45)}>
          <button className="btn-primary" onClick={() => typeof window.chatbase === 'function' && window.chatbase('open')}>
            Chat with AP
          </button>
          <button className="btn-ghost" onClick={() => go('projects')}>View Work</button>
        </motion.div>
        <motion.div className="hero-badges" {...fadeUp(0.55)}>
          {['Open to Full-Time · Jan 2027', 'Somerset, NJ', 'Dec 2026 Graduate'].map(b => (
            <span key={b} className="hero-badge">{b}</span>
          ))}
        </motion.div>
      </div>
      <motion.div className="scroll-indicator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }}>
        <div className="scroll-line" />
        <span>Scroll</span>
      </motion.div>
    </section>
  )
}

/* ─── ABOUT ──────────────────────────────────────────────────────── */
function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">01</span>
          <h2 className="section-title">About</h2>
        </motion.div>
        <div className="about-grid">
          <motion.div className="about-text-col" {...fadeUp(0.1)}>
            <p className="about-lead">I'm an Engineering Management graduate student at Northeastern (GPA 3.75, December 2026), specializing at the intersection of <span className="accent">Data, AI</span>, and <span className="accent2">Program Management</span>.</p>
            <p className="about-body">Currently leading strategic projects under the Head of Data & AI at MSIG USA, working across agile delivery, PI planning, hiring operations, and organizational change management. Based in Somerset, New Jersey.</p>
            <p className="about-body">My background spans electronics engineering (PES University, Bengaluru), startup co-founding, award-winning hardware hacking at MIT, and graduate-level supply chain research under Prof. Nada R. Sanders. I thrive in roles that blend technical depth with strategic execution and cross-functional leadership.</p>
            <div className="about-stats">
              {[{ num: '3.75', label: 'GPA' }, { num: 'MIT', label: 'Hackathon Winner' }, { num: '10+', label: 'Leadership Roles' }, { num: '4', label: 'Research Papers' }].map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div className="about-right-col" {...fadeUp(0.2)}>
            <div className="about-photo-wrap">
              <img src="/APY_Harvard_Bg.jpg" alt="Yashaswi Alur Prasannakumar at Harvard University" className="about-photo" />
              <div className="about-photo-caption">Harvard Asian Conference 2025</div>
            </div>
            <div className="edu-cards">
              <div className="edu-card">
                <div className="edu-degree">Master of Science · Engineering Management</div>
                <div className="edu-school">Northeastern University</div>
                <div className="edu-detail">Boston, MA · Expected December 2026 · GPA 3.75</div>
                <div className="tag-row">{['Supply Chain Engineering', 'Project Management', 'Operations Research'].map(t => <span key={t} className="tag">{t}</span>)}</div>
              </div>
              <div className="edu-card">
                <div className="edu-degree">Bachelor of Technology · Electronics &amp; Communication Engineering</div>
                <div className="edu-school">PES University</div>
                <div className="edu-detail">Bengaluru, India · Class of 2024</div>
              </div>
            </div>
          </motion.div>
        </div>
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
                <ul className="exp-bullets">{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="tag-row">{exp.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
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
  const featured = PROJECTS.find(p => p.featured)
  const rest = PROJECTS.filter(p => !p.featured)
  return (
    <section id="projects" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">03</span>
          <h2 className="section-title">Projects</h2>
        </motion.div>
        {featured && (
          <motion.div {...fadeUp(0.05)} style={{ marginBottom: '22px' }}>
            <TiltCard className="project-card project-featured">
              {featured.award && <div className="project-award-badge">🏆 {featured.award}</div>}
              <div className="project-featured-inner">
                <div>
                  <div className="project-icon">{featured.icon}</div>
                  <div className="project-title">{featured.title}</div>
                  {featured.subtitle && <div className="project-subtitle">{featured.subtitle}</div>}
                  <div className="project-context">{featured.context}</div>
                  <p className="project-desc">{featured.description}</p>
                </div>
                <div>
                  <ul className="project-bullets">{featured.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                  <div className="tag-row">{featured.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}
        <div className="projects-grid">
          {rest.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <TiltCard className="project-card">
                <div className="project-icon">{p.icon}</div>
                <div className="project-title">{p.title}</div>
                {p.subtitle && <div className="project-subtitle">{p.subtitle}</div>}
                <div className="project-context">{p.context}</div>
                <p className="project-desc">{p.description}</p>
                <ul className="project-bullets">{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── HIGHLIGHTS ─────────────────────────────────────────────────── */
function Highlights() {
  return (
    <section id="highlights" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">04</span>
          <h2 className="section-title">Highlights</h2>
          <p className="section-subtitle">Moments from the journey</p>
        </motion.div>
        <div className="highlights-grid">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div key={i} className={`highlight-item${h.tall ? ' tall' : ''}`} {...fadeUp(i * 0.1)}>
              <img src={h.img} alt={h.title} className="highlight-img" />
              {h.badge && <div className="highlight-badge">{h.badge}</div>}
              <div className="highlight-overlay">
                <div className="highlight-title">{h.title}</div>
                <div className="highlight-sub">{h.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── RESEARCH ───────────────────────────────────────────────────── */
function Research() {
  const underReview = RESEARCH.papers.filter(p => p.status === 'under-review')
  const published = RESEARCH.papers.filter(p => p.status === 'published')
  return (
    <section id="research" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">05</span>
          <h2 className="section-title">Research</h2>
          <p className="section-subtitle">With Prof. Nada R. Sanders · Northeastern University</p>
        </motion.div>
        <motion.div className="research-stats" {...fadeUp(0.1)}>
          {[
            { value: 40.61, suffix: '%', decimals: 2, label: 'MAPE Score', sub: 'Statistically equiv. to pure ARIMA' },
            { value: 100, suffix: '%', decimals: 0, label: 'Routing Accuracy', sub: 'LangGraph HITL orchestration' },
            { value: 13, suffix: 'pp', decimals: 0, label: 'Improvement', sub: 'Over baseline on volatile SKUs' },
          ].map((s, i) => (
            <motion.div key={s.label} className="research-stat-card" {...fadeUp(0.1 + i * 0.1)}>
              <div className="rstat-num"><StatCounter target={s.value} suffix={s.suffix} decimals={s.decimals} /></div>
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
              <ul className="research-highlights">{p.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
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

/* ─── SKILLS ─────────────────────────────────────────────────────── */
function Skills() {
  return (
    <section id="skills" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">06</span>
          <h2 className="section-title">Skills</h2>
        </motion.div>
        <div className="skills-grid">
          {Object.entries(SKILLS).map(([cat, skills], i) => (
            <motion.div key={cat} className="skill-group" {...fadeUp(i * 0.08)}>
              <div className="skill-category">{cat}</div>
              <div className="tag-row">
                {skills.map((s, j) => (
                  <motion.span key={s} className="tag skill-tag"
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.05 * j }}
                  >{s}</motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── LEADERSHIP ─────────────────────────────────────────────────── */
function Leadership() {
  return (
    <section id="leadership" className="section">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <span className="section-num">07</span>
          <h2 className="section-title">Leadership</h2>
        </motion.div>
        <div className="leadership-grid">
          {LEADERSHIP.map((l, i) => (
            <motion.div key={i} className="leadership-card" {...fadeUp(i * 0.05)}>
              <div className="lc-header">
                <div className="lc-role">{l.role}</div>
                {l.current && <span className="exp-current-badge">Active</span>}
              </div>
              <div className="lc-org">{l.org}</div>
              <div className="lc-period">{l.period}</div>
              <p className="lc-desc">{l.description}</p>
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
          <span className="section-num">08</span>
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
        <Highlights />
        <Research />
        <Skills />
        <Leadership />
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
