import { motion } from 'framer-motion'
import { fadeUp } from '../utils'

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <motion.div className="section-header" data-num="01" {...fadeUp()}>
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
