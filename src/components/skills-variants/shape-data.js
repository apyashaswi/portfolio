import { SKILLS } from '../../data'
import { SKILL_ICONS, CATEGORY_META } from '../../icons.jsx'

// Splits each category's skill list into "logoed" (a real tool/tech with a
// downloaded brand mark) vs "concept" (a methodology/soft-skill with no
// single-vendor logo) — every redesign variant needs this same split.
export const shapedCategories = Object.entries(SKILLS).map(([cat, skills], i) => {
  const logoed = []
  const concepts = []
  for (const s of skills) {
    const slug = SKILL_ICONS[s]
    if (slug) logoed.push({ label: s, slug })
    else concepts.push(s)
  }
  return { cat, index: i, meta: CATEGORY_META[cat], logoed, concepts, all: skills }
})
