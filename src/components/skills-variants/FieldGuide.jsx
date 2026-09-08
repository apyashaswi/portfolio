import { motion } from 'framer-motion'
import { fadeUp, MAX_STAGGER_DELAY } from '../../utils'
import { skillIconUrl } from '../../icons.jsx'
import { shapedCategories } from './shape-data'

export default function FieldGuide() {
  return (
    <div className="fg-wrap">
      {shapedCategories.map(({ cat, index, logoed, concepts }) => (
        <motion.div className="fg-plate" key={cat} {...fadeUp(Math.min(index * 0.08, MAX_STAGGER_DELAY))}>
          <div className="fg-plate-head">
            <span className="fg-plate-num">PLATE {String(index + 1).padStart(2, '0')}</span>
            <span className="fg-plate-rule" />
            <h3 className="fg-plate-title">{cat}</h3>
          </div>
          {logoed.length > 0 && (
            <div className="fg-specimens">
              {logoed.map(({ label, slug }) => (
                <div className="fg-specimen" key={label}>
                  <img src={skillIconUrl(slug)} alt="" loading="lazy" />
                  <span className="fg-specimen-label">{label}</span>
                </div>
              ))}
            </div>
          )}
          {concepts.length > 0 && (
            <p className="fg-concepts">{concepts.join(' · ')}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
