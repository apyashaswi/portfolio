import { lookupIcon, WIDE_LOGOS, SkillLogo } from '../icons.jsx'

export default function TechTag({ label, className = '' }) {
  const slug = lookupIcon(label)
  // Tags are pill-sized, and a horizontal lockup shrunk to fit one is an
  // illegible smear — of a wordmark that just repeats the tag's own label.
  // So only square marks ride along here; the rest go text-only.
  const mark = slug && !WIDE_LOGOS.has(slug) ? slug : null
  return (
    <span className={`tag tech-tag${mark ? ' tech-tag-has-icon' : ''} ${className}`}>
      {mark && <SkillLogo slug={mark} size={13} className="tech-tag-icon" />}
      <span>{label}</span>
    </span>
  )
}
