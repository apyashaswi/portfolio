import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NODES = [
  {
    year: '2002',
    title: 'Born in Mysuru',
    detail: 'Mysuru, Karnataka, India — where it all began.',
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: '2020',
    title: 'B.Tech ECE Begins',
    detail: 'Started Bachelor of Technology in Electronics & Communication Engineering at PES University, Bengaluru.',
    color: '#7F77DD',
    type: 'purple',
    future: false,
    highlight: false,
  },
  {
    year: 'Nov 2021',
    title: 'Founded Shunya Math Club',
    detail: '200+ active contributors. Organized ₹20L prize Arithemania 2.0 hackathon with MathWorks & Wolfram sponsorships. Community math outreach in government schools.',
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: 'Apr 2022',
    title: 'IEEE SPS Founding Member',
    detail: 'Founding member and executive committee of IEEE Signal Processing & Communication Society, PES University. Organized national workshops and 5G/AI hackathons.',
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
  },
  {
    year: '2022',
    title: 'Founded IRA PESU',
    detail: 'Established IRA PESU — a socio-cultural club at PES University to celebrate national and cultural festivals across campus. Built a community-driven platform for cultural events and student engagement.',
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: '2022',
    title: 'Founded HoPES Media Club',
    detail: "Founding member of PES University's official media club. Contributed to major institutional decisions, content strategy, and organizational direction. Continued as Advisor.",
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: '2022',
    title: 'Head of Logistics · Aikya',
    detail: 'Managed logistics for social service drives, school outreach programs teaching underprivileged children, hackathons, and donation drives at this Akshaya Patra-inspired community initiative.',
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
  },
  {
    year: 'Jun 2022',
    title: 'Samarpana Event Head',
    detail: 'Led 1,000+ volunteers for a 4-day national event honoring Indian Armed Forces. 10,000+ attendees. Chief Guest: Padma Shri A.S. Kiran Kumar. Featured Kargil War veterans.',
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
  },
  {
    year: '2022',
    title: 'Apple Developers Group',
    detail: 'Founding member and Head of Operations for the Apple Developers Group at PES University. Ran workshops, technical talks, and engineering events on campus.',
    color: '#7F77DD',
    type: 'purple',
    future: false,
    highlight: false,
  },
  {
    year: 'Jun 2023',
    title: 'Co-founded Cratel',
    detail: 'Co-founded a B2C e-commerce startup streamlining supply chains. Reduced consumer costs by 40% through direct producer-consumer connections. Led as Chief Product Officer.',
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: 'Aug 2023',
    title: 'Program Manager · Dean\'s Office',
    detail: 'Operational lead at PES University Dean of Student Affairs office. Directed 1,000+ volunteers, managed $350K+ in annual funding across 50+ student organizations. Designed automated approval system reducing turnaround by 60%.',
    color: '#7F77DD',
    type: 'purple',
    future: false,
    highlight: false,
  },
  {
    year: 'Jan 2024',
    title: 'Student Head · Bharat Unleashed',
    detail: "Student lead for PES University's 50th anniversary celebrations — a 4-day flagship event featuring Shankar Mahadevan, Smt. Sudha Murthy, and other distinguished luminaries.",
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: 'May 2024',
    title: 'Graduated PES University',
    detail: 'Bachelor of Technology in Electronics & Communication Engineering, PES University, Bengaluru. Published two IEEE research papers on IRS-aided V2X communication networks.',
    color: '#c9a84c',
    type: 'amber',
    future: false,
    highlight: false,
  },
  {
    year: 'Sep 2024',
    title: 'MS at Northeastern Begins',
    detail: 'Started Master of Science in Engineering Management at Northeastern University, Boston. GPA 3.75. Focus: Supply Chain Engineering, Operations Research, Project Management.',
    color: '#7F77DD',
    type: 'purple',
    future: false,
    highlight: false,
  },
  {
    year: 'Jan 2025',
    title: '🏆 MIT Reality Hack',
    detail: 'Led multidisciplinary team of 5 to build "Spidey Sense" — a haptic VR device for visually impaired users. Won Jaw-Dropping Award in Hardware Track from 100+ international teams. Patent application initiated.',
    color: '#c9a84c',
    type: 'gold',
    future: false,
    highlight: true,
    glow: true,
  },
  {
    year: 'Mar 2025',
    title: 'Community Chair · ICXR',
    detail: "Joined Intercollegiate XR as Community Chair & Executive Committee Member — the world's premier collegiate XR community. Organized multi-campus hackathons and managed industry partnerships.",
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
  },
  {
    year: '2025',
    title: 'Senator · Northeastern GSG',
    detail: 'Elected Senator in Northeastern University Graduate Student Government. Representing graduate student interests in institutional policy and funding decisions.',
    color: '#7F77DD',
    type: 'purple',
    future: false,
    highlight: false,
  },
  {
    year: 'Jan 2026',
    title: 'PM & Scrum Master · MSIG USA',
    detail: 'Program Manager & Scrum Master at MSIG USA, leading the Data & AI team across Claims Data, Reinsurance, Finance Data, and Strategic Projects. Co-authored PI Planning decks, designed PCT Assessment Framework.',
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
    current: true,
  },
  {
    year: '2026',
    title: 'Head of Hardware Sponsorship · MIT Reality Hack 2027',
    detail: 'Leading hardware sponsorship operations for MIT Reality Hack 2027 — one of the world\'s premier XR hackathons. Coordinating with industry partners to source and deliver hardware for participants.',
    color: '#1D9E75',
    type: 'teal',
    future: false,
    highlight: false,
    current: true,
  },
  {
    year: 'Jan 2027',
    title: 'Full-Time — What\'s Next?',
    detail: 'Available for full-time roles in Program Management, Data & AI, and Engineering Operations. MS graduation December 2026. Based in Somerset, NJ. Open to relocation.',
    color: '#7F77DD',
    type: 'purple',
    future: true,
    highlight: false,
  },
]

export default function CareerTimeline() {
  const [active, setActive] = useState(null)
  const scrollRef = useRef(null)

  const toggle = (i) => setActive(active === i ? null : i)

  return (
    <div className="tl-outer">
      <div className="tl-scroll-container" ref={scrollRef}>
        <div className="tl-track">
          <div className="tl-connector" />
          {NODES.map((node, i) => (
            <div
              key={i}
              className={[
                'tl-node',
                node.future ? 'tl-future' : '',
                node.highlight ? 'tl-highlight' : '',
                node.glow ? 'tl-glow' : '',
                node.current ? 'tl-current' : '',
                active === i ? 'tl-active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => toggle(i)}
            >
              <div className="tl-dot-wrap">
                {node.current && <div className="tl-pulse" style={{ borderColor: node.color }} />}
                <div className="tl-dot" style={{ background: node.color, boxShadow: node.glow ? `0 0 18px ${node.color}aa` : 'none' }} />
              </div>
              <div className="tl-year" style={{ color: node.color }}>{node.year}</div>
              <div className="tl-title">{node.title}</div>
              {node.highlight && (
                <div className="tl-award-badge">🏆 Award</div>
              )}
              <AnimatePresence>
                {active === i && (
                  <motion.div
                    className="tl-detail"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {node.detail}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div className="tl-hint">← Scroll to explore · Click a node to expand →</div>
    </div>
  )
}
