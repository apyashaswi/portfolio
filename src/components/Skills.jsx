import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { SKILLS } from '../data'
import { SKILL_ICONS, CATEGORY_META, SkillLogo } from '../icons.jsx'

function SkillIcon({ name }) {
  const slug = SKILL_ICONS[name]
  if (slug) return <SkillLogo slug={slug} size={18} className="skill-icon" />
  return <span className="skill-icon skill-icon-dot" aria-hidden="true" />
}

// A seamless marquee needs the track to be exactly twice the width it travels,
// so translating it -50% lands the copy precisely where the original started.
// Each category only has ~8 skills, which is narrower than a viewport, so one
// copy would leave a gap mid-loop -- REPEATS is the number of copies per half.
// Only the first is real; the rest are aria-hidden, so assistive tech reads
// each skill once and reduced-motion renders one copy and stops.
const REPEATS = 2

export default function Skills({ recruiterMode }) {
  return (
    <section id="skills" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Skills &amp; Tools</h2>
          <p className="section-subtitle">
            What I reach for, grouped by the kind of work it does.
          </p>
        </motion.div>
      </div>

      <div className="skills-drift">
        {Object.entries(SKILLS).map(([cat, skills], i) => {
          const meta = CATEGORY_META[cat]
          const list = (copy) => (
            <ul className="skill-list" key={copy} aria-hidden={copy > 0 ? 'true' : undefined}>
              {skills.map(s => (
                <li className="skill-item" key={s}>
                  <SkillIcon name={s} />
                  <span className="skill-label">{s}</span>
                </li>
              ))}
            </ul>
          )
          return (
            <motion.div
              key={cat}
              className="drift-row"
              // staggered durations so the rows never fall into step
              style={{
                ...(meta ? { '--cat-accent': meta.accent } : null),
                '--drift-dur': `${52 + i * 13}s`,
              }}
              data-dir={i % 2 ? 'right' : 'left'}
              {...fadeUp(i * 0.08)}
            >
              <div className="container">
                <div className="skill-category-row">
                  {meta && <span className="skill-category-glyph">{meta.glyph}</span>}
                  <span className="skill-category">{cat}</span>
                </div>
              </div>
              <div className="drift-viewport">
                <div className="drift-track">
                  {Array.from({ length: REPEATS * 2 }, (_, c) => list(c))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
