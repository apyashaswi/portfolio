import { useState, useEffect, useRef } from 'react'

/* ─── DATA ──────────────────────────────────────────────────────── */
const NAV_LINKS = ['About', 'Experience', 'Projects', 'Highlights', 'Research', 'Skills', 'Leadership', 'Contact']
// Case Studies removed — to be re-added later

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

// Case Studies removed — to be re-added later

/* ─── FadeIn Component ──────────────────────────────────────────── */
function FadeIn({ children, className = '', tag: Tag = 'div', delay = 0, dir = 'up' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const cls = dir === 'left' ? 'fade-left' : dir === 'right' ? 'fade-right' : 'fade-in'
    el.classList.add(cls)
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible') }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [dir])
  return <Tag ref={ref} className={className} style={delay ? { transitionDelay: `${delay}ms` } : {}}>{children}</Tag>
}

/* ─── Nav ───────────────────────────────────────────────────────── */
function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const go = id => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }
  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
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
    </nav>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────── */
function Hero() {
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section id="hero" className="hero">
      <div className="hero-container">
        <div className="hero-left">
          <FadeIn>
            <div className="hero-eyebrow">Engineering Management · Data &amp; AI · Program Management</div>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="hero-name">Yashaswi<br />Alur Prasannakumar</h1>
            <span className="hero-name-sub">AP · Northeastern '26</span>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="hero-tagline">
              <strong>Program Manager @ MSIG USA</strong> · MIT Reality Hack Winner<br />
              Building at the intersection of Data, AI, and Strategic Operations.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => go('projects')}>View Work</button>
              <button className="btn btn-ghost" onClick={() => go('contact')}>Get in Touch</button>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="hero-badges">
              {['Open to Full-Time Roles · Jan 2027', 'Somerset, NJ', 'Dec 2026 Graduate'].map(b => (
                <span key={b} className="hero-badge">{b}</span>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={250} dir="right">
          <div className="hero-photo-card">
            <div className="hero-photo-frame">
              <img src="/APY_MIT_Dome_bg.jpg" alt="Yashaswi Alur Prasannakumar at MIT" />
            </div>
            <div className="hero-photo-badge">MS Eng. Management · Dec '26</div>
          </div>
        </FadeIn>
      </div>
      <div className="hero-bottom">
        <div className="hero-scroll-hint">
          <div className="scroll-line" />
          Scroll
        </div>
      </div>
    </section>
  )
}

/* ─── About ─────────────────────────────────────────────────────── */
function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">01</span><h2 className="section-title">About</h2></div></FadeIn>
        <div className="about-grid">
          <FadeIn delay={100} dir="left">
            <div className="about-text">
              <p className="about-lead">I'm an Engineering Management graduate student at Northeastern (GPA 3.75, December 2026), specializing at the intersection of <strong>Data, AI, and Program Management</strong>.</p>
              <p>Currently leading strategic projects under the Head of Data & AI at MSIG USA, working across agile delivery, PI planning, hiring operations, and organizational change management. Based in Somerset, New Jersey.</p>
              <p>My background spans electronics engineering (PES University, Bengaluru), startup co-founding, award-winning hardware hacking at MIT, and graduate-level supply chain research under Prof. Nada R. Sanders. I thrive in roles that blend technical depth with strategic execution and cross-functional leadership.</p>
              <div className="about-stats">
                {[{ num: '3.75', label: 'GPA' }, { num: 'MIT', label: 'Hackathon Winner' }, { num: '10+', label: 'Leadership Roles' }, { num: '4', label: 'Research Papers' }].map(s => (
                  <div key={s.label}>
                    <span className="stat-num">{s.num}</span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={200} dir="right">
            <div className="about-sidebar">
              <div className="about-headshot">
                <img src="/APY_Harvard_Bg.jpg" alt="Yashaswi Alur Prasannakumar at Harvard University" />
                <div className="about-headshot-caption">Harvard Asian Conference 2025</div>
              </div>
              <div className="edu-card">
                <div className="edu-degree">Master of Science · Engineering Management</div>
                <div className="edu-school">Northeastern University</div>
                <div className="edu-detail">Boston, MA · Expected December 2026 · GPA 3.75</div>
                <div className="tag-row">{['Supply Chain Engineering', 'Project Management', 'Operations Research'].map(t => <span key={t} className="tag">{t}</span>)}</div>
              </div>
              <div className="edu-card">
                <div className="edu-degree">Bachelor of Technology · Electronics & Communication Engineering</div>
                <div className="edu-school">PES University</div>
                <div className="edu-detail">Bengaluru, India · Class of 2024</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ─── Experience ────────────────────────────────────────────────── */
function Experience() {
  return (
    <section id="experience" className="section section-alt">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">02</span><h2 className="section-title">Experience</h2></div></FadeIn>
        <div className="timeline">
          {EXPERIENCE.map((exp, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="timeline-item">
                <div className="timeline-marker">
                  {exp.current && <div className="timeline-dot-pulse" />}
                  <div className={`timeline-dot${exp.current ? ' current' : ''}`} />
                  {i < EXPERIENCE.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="exp-header">
                    <div>
                      <div className="exp-title">{exp.title}</div>
                      <div className="exp-company">{exp.company}{exp.type && <span className="exp-type">{exp.type}</span>}</div>
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
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Projects ──────────────────────────────────────────────────── */
function Projects() {
  return (
    <section id="projects" className="section">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">03</span><h2 className="section-title">Projects</h2></div></FadeIn>
        <div style={{display:'flex', flexDirection:'column', gap:'22px'}}>
          {PROJECTS.map((p, i) => (
            <FadeIn key={p.id} delay={i * 80}>
              <div className={`project-card${p.featured ? ' featured' : ''}`} style={{gridColumn:'unset'}}>
                {p.award && <div className="project-award">🏆 {p.award}</div>}
                <div style={{display:'grid', gridTemplateColumns: p.featured ? '1fr 1fr' : '1fr', gap:'32px'}}>
                  <div>
                    <div className="project-icon">{p.icon}</div>
                    <div className="project-title">{p.title}</div>
                    {p.subtitle && <div className="project-subtitle">{p.subtitle}</div>}
                    <div className="project-context">{p.context}</div>
                    <p className="project-desc">{p.description}</p>
                  </div>
                  <div>
                    <ul className="project-bullets">{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                    <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Highlights Gallery ────────────────────────────────────────── */
function Highlights() {
  return (
    <section id="highlights" className="highlights">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-num">04</span>
            <h2 className="section-title">Highlights</h2>
            <p className="section-subtitle">Moments from the journey</p>
          </div>
        </FadeIn>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px'}}>
          {HIGHLIGHTS.map((h, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div style={{position:'relative', borderRadius:'20px', overflow:'hidden', height: i === 0 ? '460px' : '280px'}}>
                <img src={h.img} alt={h.title} style={{width:'100%', height:'100%', objectFit:'cover', transition:'transform .5s ease', display:'block'}}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                />
                {h.badge && (
                  <div style={{position:'absolute', top:'14px', left:'14px', fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'20px', background:'#B8882A', color:'#fff', letterSpacing:'.05em', textTransform:'uppercase'}}>
                    {h.badge}
                  </div>
                )}
                <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'48px 20px 18px', background:'linear-gradient(to top, rgba(10,22,40,.92) 0%, transparent 100%)'}}>
                  <div style={{fontWeight:700, fontSize:'15px', color:'#fff', marginBottom:'3px', lineHeight:1.3}}>{h.title}</div>
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,.6)', fontWeight:500}}>{h.sub}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Research ──────────────────────────────────────────────────── */
function Research() {
  const underReview = RESEARCH.papers.filter(p => p.status === 'under-review')
  const published = RESEARCH.papers.filter(p => p.status === 'published')
  return (
    <section id="research" className="section section-alt">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">05</span><h2 className="section-title">Research</h2><p className="section-subtitle">With Prof. Nada R. Sanders · Northeastern University</p></div></FadeIn>

        <FadeIn delay={100}><h3 className="pub-heading">Under Review</h3></FadeIn>
        {underReview.map((p, i) => (
          <FadeIn key={i} delay={100 + i * 80}>
            <div className="research-thesis">
              <div className="thesis-badge">Under Review</div>
              <h3 className="thesis-title">{p.title}</h3>
              <div className="thesis-meta">{p.authors}</div>
              <div className="thesis-status">{p.venue}</div>
              <p className="thesis-desc">{p.description}</p>
              {p.highlights.length > 0 && (
                <ul className="thesis-highlights">{p.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
              )}
              <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            </div>
          </FadeIn>
        ))}

        <FadeIn delay={300}><h3 className="pub-heading" style={{marginTop: '48px'}}>Published</h3></FadeIn>
        {published.map((p, i) => (
          <FadeIn key={i} delay={300 + i * 80}>
            <div className="pub-card">
              <div className="pub-title">{p.title}</div>
              <div className="pub-venue">{p.venue}</div>
              <p className="pub-desc">{p.description}</p>
              <div className="tag-row">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ─── Skills ────────────────────────────────────────────────────── */
function Skills() {
  return (
    <section id="skills" className="section">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">06</span><h2 className="section-title">Skills</h2></div></FadeIn>
        <div className="skills-grid">
          {Object.entries(SKILLS).map(([cat, skills], i) => (
            <FadeIn key={cat} delay={i * 80}>
              <div className="skill-group">
                <div className="skill-category">{cat}</div>
                <div className="tag-row">{skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Leadership ────────────────────────────────────────────────── */
function Leadership() {
  return (
    <section id="leadership" className="section section-alt">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">07</span><h2 className="section-title">Leadership</h2></div></FadeIn>
        <div className="leadership-grid">
          {LEADERSHIP.map((l, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="leadership-card">
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                  <div className="leadership-role">{l.role}</div>
                  {l.current && <span className="exp-type" style={{fontSize:'10px'}}>Active</span>}
                </div>
                <div className="leadership-org">{l.org}</div>
                <div className="leadership-period">{l.period}</div>
                <p className="leadership-desc">{l.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Contact ───────────────────────────────────────────────────── */
function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <FadeIn><div className="section-header"><span className="section-num">08</span><h2 className="section-title">Contact</h2></div></FadeIn>
        <div className="contact-grid">
          <FadeIn delay={100} dir="left">
            <div>
              <p className="contact-blurb">Open to full-time roles in Program Management, Data, AI, and Engineering Operations — available from January 2027. Based in Somerset, NJ. Happy to connect on research, XR, or anything interesting.</p>
              <div className="contact-links">
                {[
                  { label: 'Email', value: 'alurprasannakumar.y@northeastern.edu', href: 'mailto:alurprasannakumar.y@northeastern.edu' },
                  { label: 'LinkedIn', value: 'linkedin.com/in/apyashaswi', href: 'https://linkedin.com/in/apyashaswi' },
                  { label: 'GitHub', value: 'github.com/apyashaswi', href: 'https://github.com/apyashaswi' },
                ].map(l => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="contact-link">
                    <span className="contact-link-label">{l.label}</span>
                    <span className="contact-link-value">{l.value}</span>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={200} dir="right">
            <form className="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
              <div className="form-row">
                <input name="name" placeholder="Name" required className="form-input" />
                <input name="email" type="email" placeholder="Email" required className="form-input" />
              </div>
              <input name="subject" placeholder="Subject" className="form-input" />
              <textarea name="message" placeholder="Message" rows={5} required className="form-input" />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Send Message</button>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ─── App ───────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }), { threshold: 0.35 })
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [])
  return (
    <>
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
