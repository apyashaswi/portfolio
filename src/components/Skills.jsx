import { useEffect, useRef, useState } from 'react'
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
// Each row only holds ~8 skills, narrower than a viewport, so one copy per
// half would leave a gap mid-loop. Only the first copy is real; the rest are
// aria-hidden, so assistive tech reads each skill once and reduced-motion
// renders one copy and stops.
const REPEATS = 2

const CATS = Object.keys(SKILLS)
const FLAT = Object.values(SKILLS).flat()
const TOTAL = FLAT.length

// Deterministic round-robin, so "unclassified" is stable across renders rather
// than reshuffling on every paint. Categories are 8 consecutive entries each,
// so a stride of 4 puts two from every category in every row.
const RAW_ROWS = Array.from({ length: CATS.length }, (_, i) =>
  Array.from({ length: TOTAL / CATS.length }, (_, k) => FLAT[(i + CATS.length * k) % TOTAL])
)

const STAGES = ['Extract', 'Transform', 'Load']
const STAGE_MS = 1150

export default function Skills({ recruiterMode }) {
  // Recruiter mode is the skim path: it never runs the pipeline, so the
  // category names are on screen without anyone having to click for them.
  const [phase, setPhase] = useState(recruiterMode ? 'classified' : 'raw')
  const [stage, setStage] = useState(-1)
  const timers = useRef([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => clearTimers, [])

  // Anyone who asked for less motion gets the answer, not the animation.
  useEffect(() => {
    if (recruiterMode) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setPhase('classified')
  }, [recruiterMode])

  const run = () => {
    clearTimers()
    setPhase('running')
    STAGES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStage(i), i * STAGE_MS))
    })
    timers.current.push(setTimeout(() => {
      setStage(-1)
      setPhase('classified')
    }, STAGES.length * STAGE_MS))
  }

  const replay = () => { setPhase('raw'); setStage(-1) }

  const classified = phase === 'classified'
  const rows = classified ? CATS.map(c => SKILLS[c]) : RAW_ROWS

  return (
    <section id="skills" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" {...fadeUp()}>
          <h2 className="section-title">Skills &amp; Tools</h2>
          <p className="section-subtitle">
            What I reach for, grouped by the kind of work it does.
          </p>
        </motion.div>

        {!recruiterMode && (
          <div className="etl" data-phase={phase}>
            <p className="etl-status" role="status">
              {classified
                ? `${CATS.length} domains · ${TOTAL} skills classified`
                : `${TOTAL} skills, unclassified`}
            </p>

            {phase === 'running' && (
              <ol className="etl-stages" aria-hidden="true">
                {STAGES.map((s, i) => (
                  <li key={s} className={`etl-stage${i < stage ? ' is-done' : ''}${i === stage ? ' is-active' : ''}`}>
                    <span className="etl-stage-bar" />
                    <span className="etl-stage-name">{s}</span>
                  </li>
                ))}
              </ol>
            )}

            {phase !== 'running' && (
              <button type="button" className="etl-btn" onClick={classified ? replay : run}>
                {classified ? 'Replay' : 'Run the pipeline'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="skills-drift" data-phase={phase}>
        {rows.map((skills, i) => {
          const cat = CATS[i]
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
              {classified && (
                <div className="container">
                  <div className="skill-category-row">
                    {meta && <span className="skill-category-glyph">{meta.glyph}</span>}
                    <span className="skill-category">{cat}</span>
                    {/* The count is part of the pipeline's RESULT, so it only
                        belongs where the pipeline exists. Recruiter mode is
                        rendered classified from the start and must stay
                        exactly as it was. */}
                    {!recruiterMode && <span className="skill-count">{skills.length}</span>}
                  </div>
                </div>
              )}
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
