import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import Picture from './Picture'

export default function About() {
  return (
    <section id="about" className="section about-section">
      <div className="container-prose">
        <motion.div className="section-header about-header" {...fadeUp()}>
          <h2 className="section-title">About</h2>
          <p className="section-subtitle">A short note on who I am and what I do.</p>
        </motion.div>

        <motion.p className="about-lead" {...fadeUp(0.05)}>
          I'm an Engineering Management graduate student at <span className="about-accent">Northeastern University</span>
          {' '}(GPA 3.75, graduating December&nbsp;2026), specializing at the intersection of
          {' '}<em>Data, AI</em>, and <em>Program Management</em>.
        </motion.p>

        <motion.p className="about-body" {...fadeUp(0.1)}>
          Currently leading strategic projects under the Head of Data &amp; AI at <strong>MSIG USA</strong>,
          working across agile delivery, PI planning, hiring operations, and organizational change
          management. Based in Somerset, New Jersey.
        </motion.p>

        <motion.figure className="about-pullquote" {...fadeUp(0.12)}>
          <blockquote>
            The operational and delivery anchor for the Data &amp; AI team &mdash;
            spanning agile delivery, PI planning, hiring operations,
            and executive reporting.
          </blockquote>
          <figcaption>— from my current role at MSIG USA</figcaption>
        </motion.figure>

        <motion.p className="about-body" {...fadeUp(0.14)}>
          My background spans electronics engineering at <strong>PES University, Bengaluru</strong>,
          startup co-founding (Cratel), award-winning hardware hacking at MIT, and
          graduate-level supply chain research under Prof. Nada&nbsp;R.&nbsp;Sanders. I thrive in roles
          that blend technical depth with strategic execution and cross-functional leadership.
        </motion.p>
      </div>

      {/* Editorial inline photo breaks out wider than the prose column */}
      <motion.figure className="about-figure" {...fadeUp(0.18)}>
        <Picture src="/pm-class-northeastern.jpg" alt="With my Project Management cohort at Northeastern" />
        <figcaption>
          With the Project Management cohort, Northeastern University &mdash; Spring 2026.
        </figcaption>
      </motion.figure>

      <div className="container-prose">
        <motion.p className="about-body" {...fadeUp(0.22)}>
          Before all that, I co-founded a B2C supply-chain startup in Bengaluru, led the
          Dean's Office portfolio at PES (1,000+ student volunteers, $350K+ in annual program funding),
          and built communities — math, XR, media, an armed-forces tribute — that I'm still proud of.
        </motion.p>

        <motion.div className="about-numbers" {...fadeUp(0.26)}>
          <span className="about-numbers-label">By the numbers</span>
          <span className="about-numbers-sep">·</span>
          <span><b>3.75</b> GPA</span>
          <span className="about-numbers-sep">·</span>
          <span><b>4</b> research papers</span>
          <span className="about-numbers-sep">·</span>
          <span><b>10+</b> leadership roles</span>
          <span className="about-numbers-sep">·</span>
          <span><b>1</b> hackathon award</span>
        </motion.div>

        <motion.div className="about-education" {...fadeUp(0.3)}>
          <div className="about-edu-row">
            <div className="about-edu-degree">M.S. Engineering Management</div>
            <div className="about-edu-school">Northeastern University · Boston, MA</div>
            <div className="about-edu-meta">Expected December 2026 · GPA 3.75</div>
          </div>
          <div className="about-edu-row">
            <div className="about-edu-degree">B.Tech. Electronics &amp; Communication Engineering</div>
            <div className="about-edu-school">PES University · Bengaluru, India</div>
            <div className="about-edu-meta">Class of 2024</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
