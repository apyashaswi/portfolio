import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '../../utils'
import { SKILLS } from '../../data'
import { SKILL_ICONS, skillIconUrl } from '../../icons.jsx'
import { shapedCategories } from './shape-data'

// Deterministic pseudo-random in [0,1) from a string seed, so node scatter
// positions are stable across renders/reloads without Math.random().
function seededRand(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}

const BAND_HEIGHT = 140

export default function Constellation() {
  const [hoverCat, setHoverCat] = useState(null)

  const { nodes, totalHeight } = useMemo(() => {
    const list = []
    let catIndex = 0
    for (const [cat, skills] of Object.entries(SKILLS)) {
      skills.forEach((label, j) => {
        const seed = cat + label
        const x = 6 + ((j + 0.5) / skills.length) * 88 + (seededRand(seed) - 0.5) * 6
        const y = catIndex * BAND_HEIGHT + 30 + seededRand(seed + 'y') * (BAND_HEIGHT - 60)
        list.push({ cat, label, x, y, slug: SKILL_ICONS[label] || null })
      })
      catIndex += 1
    }
    return { nodes: list, totalHeight: catIndex * BAND_HEIGHT }
  }, [])

  const lines = useMemo(() => {
    const segs = []
    shapedCategories.forEach(({ cat }) => {
      const catNodes = nodes.filter((n) => n.cat === cat)
      for (let i = 0; i < catNodes.length - 1; i++) {
        segs.push({ cat, a: catNodes[i], b: catNodes[i + 1], key: `${cat}-${i}` })
      }
    })
    return segs
  }, [nodes])

  return (
    <motion.div className="cn-wrap" style={{ height: totalHeight }} {...fadeUp()}>
      <svg className="cn-threads" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none">
        {lines.map(({ key, a, b, cat }) => (
          <line
            key={key}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            className={`cn-thread${hoverCat && hoverCat !== cat ? ' is-dimmed' : ''}`}
          />
        ))}
      </svg>
      {nodes.map((n) => (
        <div
          key={n.cat + n.label}
          className={`cn-node${hoverCat && hoverCat !== n.cat ? ' is-dimmed' : ''}${hoverCat === n.cat ? ' is-active-cat' : ''}`}
          style={{ left: `${n.x}%`, top: n.y }}
          onMouseEnter={() => setHoverCat(n.cat)}
          onMouseLeave={() => setHoverCat(null)}
        >
          {n.slug ? <img src={skillIconUrl(n.slug)} alt="" loading="lazy" /> : <span className="cn-node-dot" />}
          <span className="cn-node-label">{n.label}</span>
        </div>
      ))}
    </motion.div>
  )
}
