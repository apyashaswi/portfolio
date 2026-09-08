import { motion } from 'framer-motion'
import { fadeUp, MAX_STAGGER_DELAY } from '../../utils'
import { skillIconUrl } from '../../icons.jsx'
import { shapedCategories } from './shape-data'

export default function LedgerIndex() {
  return (
    <div className="li-wrap">
      <div className="li-rule li-rule-top" />
      <div className="li-columns">
        {shapedCategories.map(({ cat, index, logoed, concepts }) => (
          <motion.div className="li-column" key={cat} {...fadeUp(Math.min(index * 0.08, MAX_STAGGER_DELAY))}>
            <h3 className="li-col-title">{cat}</h3>
            <div className="li-col-rule" />
            <ul className="li-col-list">
              {logoed.map(({ label, slug }) => (
                <li key={label}>
                  <img src={skillIconUrl(slug)} alt="" loading="lazy" />
                  <span>{label}</span>
                </li>
              ))}
              {concepts.map((label) => (
                <li key={label} className="li-concept">
                  <span className="li-dot" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <div className="li-rule li-rule-bottom" />
    </div>
  )
}
