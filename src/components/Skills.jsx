import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { SKILLS } from '../data'

export default function Skills({ recruiterMode }) {
  const sectionNum = recruiterMode ? '06' : '08'
  return (
    <section id="skills" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num={sectionNum} {...fadeUp()}>
          <span className="section-num">{sectionNum}</span>
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
