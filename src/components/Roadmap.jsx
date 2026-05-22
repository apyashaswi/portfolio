import { motion } from 'framer-motion'
import { fadeUp } from '../utils'
import { ROADMAP } from '../data'

export default function Roadmap() {
  return (
    <section id="roadmap" className="section section-alt">
      <div className="container">
        <motion.div className="section-header" data-num="02" {...fadeUp()}>
          <span className="section-num">02</span>
          <h2 className="section-title">AP as a Product</h2>
          <p className="section-subtitle">Treating my career like the products I ship — mission, roadmap, stack, KPIs.</p>
        </motion.div>

        <motion.div className="rm-spec" {...fadeUp(0.05)}>
          <div className="rm-spec-block">
            <div className="rm-spec-label">Mission</div>
            <p className="rm-spec-body">{ROADMAP.spec.mission}</p>
          </div>
          <div className="rm-spec-block">
            <div className="rm-spec-label">North Star</div>
            <p className="rm-spec-body">{ROADMAP.spec.northStar}</p>
          </div>
          <div className="rm-spec-block rm-spec-principles">
            <div className="rm-spec-label">Operating Principles</div>
            <ul className="rm-principles">
              {ROADMAP.spec.principles.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </motion.div>

        <div className="rm-lanes">
          {ROADMAP.lanes.map((lane, i) => (
            <motion.div key={lane.label} className={`rm-lane rm-${lane.tone}`} {...fadeUp(0.1 + i * 0.08)}>
              <div className="rm-lane-header">
                <span className={`rm-lane-dot rm-${lane.tone}-dot`} />
                <span className="rm-lane-label">{lane.label}</span>
              </div>
              <ul className="rm-lane-items">
                {lane.items.map((it, j) => (
                  <li key={j} className="rm-lane-item">
                    <div className="rm-item-quarter">{it.quarter}</div>
                    <div className="rm-item-title">{it.title}</div>
                    <div className="rm-item-sub">{it.sub}</div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div className="rm-bottom-grid" {...fadeUp(0.2)}>
          <div className="rm-stack">
            <div className="rm-block-label">Build Stack</div>
            {ROADMAP.stack.map((s, i) => (
              <div key={s.label} className="rm-stack-row">
                <div className="rm-stack-cat">{s.label}</div>
                <div className="tag-row">
                  {s.items.map(item => <span key={item} className="tag">{item}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="rm-kpis">
            <div className="rm-block-label">KPIs</div>
            <div className="rm-kpi-grid">
              {ROADMAP.kpis.map(k => (
                <div key={k.label} className="rm-kpi-card">
                  <div className="rm-kpi-value">{k.value}</div>
                  <div className="rm-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
