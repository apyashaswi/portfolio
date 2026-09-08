import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '../../utils'
import { skillIconUrl } from '../../icons.jsx'
import { shapedCategories } from './shape-data'

// Short labels for the filter tabs — category names are too long for a tab row.
const SHORT_LABEL = {
  'Program & Project Management': 'PM',
  'Data & Analytics': 'Data',
  'Supply Chain & Operations': 'Supply Chain',
  'Engineering & Technical': 'Engineering',
}

export default function FilterFlow() {
  const [active, setActive] = useState('All')

  const flat = shapedCategories.flatMap(({ cat, logoed, concepts }) => [
    ...logoed.map((s) => ({ ...s, cat, hasLogo: true })),
    ...concepts.map((label) => ({ label, cat, hasLogo: false })),
  ])

  return (
    <div className="ff-wrap">
      <motion.div className="ff-tabs" {...fadeUp()}>
        <button className={`ff-tab${active === 'All' ? ' is-active' : ''}`} onClick={() => setActive('All')}>All</button>
        {shapedCategories.map(({ cat }) => (
          <button
            key={cat}
            className={`ff-tab${active === cat ? ' is-active' : ''}`}
            onClick={() => setActive(cat)}
          >
            {SHORT_LABEL[cat] || cat}
          </button>
        ))}
      </motion.div>
      <motion.div className="ff-grid" {...fadeUp(0.08)}>
        {flat.map((item) => {
          const dimmed = active !== 'All' && item.cat !== active
          return (
            <span className={`ff-item${dimmed ? ' is-dimmed' : ''}`} key={item.label}>
              {item.hasLogo ? <img src={skillIconUrl(item.slug)} alt="" loading="lazy" /> : <span className="ff-item-dot" />}
              {item.label}
            </span>
          )
        })}
      </motion.div>
    </div>
  )
}
