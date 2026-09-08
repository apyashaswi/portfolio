// Temporary side-by-side comparison of 4 Skills-section redesign candidates.
// Not linked from nav — visit /skills-preview directly. Delete once a
// direction is chosen and integrated into components/Skills.jsx.
import FieldGuide from '../components/skills-variants/FieldGuide'
import LedgerIndex from '../components/skills-variants/LedgerIndex'
import FilterFlow from '../components/skills-variants/FilterFlow'
import Constellation from '../components/skills-variants/Constellation'
import SkillNebula from '../components/skills-variants/SkillNebula'

const VARIANTS = [
  { id: 'e', title: 'E — The Toolkit Nebula (3D WebGL)', Comp: SkillNebula },
  { id: 'a', title: 'A — Field Guide Plates', Comp: FieldGuide },
  { id: 'b', title: 'B — Ledger Index', Comp: LedgerIndex },
  { id: 'c', title: 'C — Interactive Filter', Comp: FilterFlow },
  { id: 'd', title: 'D — Constellation (2D)', Comp: Constellation },
]

export default function SkillsPreview() {
  return (
    <div className="sp-page">
      {VARIANTS.map(({ id, title, Comp }) => (
        <section className="sp-variant section" key={id} id={`variant-${id}`}>
          <div className="container">
            <div className="sp-variant-label">{title}</div>
            <Comp />
          </div>
        </section>
      ))}
    </div>
  )
}
