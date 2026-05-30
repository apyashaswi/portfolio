import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { SKILLS } from '../data'
import { SKILL_ICONS, CATEGORY_META, skillIconUrl } from '../icons.jsx'

function SkillIcon({ name }) {
  const slug = SKILL_ICONS[name]
  if (slug) {
    return (
      <span className="skill-icon skill-icon-logo" aria-hidden="true">
        <img src={skillIconUrl(slug)} alt="" loading="lazy" />
      </span>
    )
  }
  return <span className="skill-icon skill-icon-dot" aria-hidden="true" />
}

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
          {Object.entries(SKILLS).map(([cat, skills], i) => {
            const meta = CATEGORY_META[cat]
            return (
              <motion.div
                key={cat}
                className="skill-group"
                style={meta ? { '--cat-accent': meta.accent } : undefined}
                {...fadeUp(i * 0.08)}
              >
                <div className="skill-category-row">
                  {meta && <span className="skill-category-glyph">{meta.glyph}</span>}
                  <span className="skill-category">{cat}</span>
                </div>
                <ul className="skill-list">
                  {skills.map((s, j) => (
                    <motion.li
                      key={s}
                      className="skill-item"
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.04 * j }}
                    >
                      <SkillIcon name={s} />
                      <span className="skill-label">{s}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
