import { lookupIcon, skillIconUrl } from '../icons.jsx'

export default function TechTag({ label, className = '' }) {
  const slug = lookupIcon(label)
  return (
    <span className={`tag tech-tag${slug ? ' tech-tag-has-icon' : ''} ${className}`}>
      {slug && (
        <img
          className="tech-tag-icon"
          src={skillIconUrl(slug)}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      )}
      <span>{label}</span>
    </span>
  )
}
