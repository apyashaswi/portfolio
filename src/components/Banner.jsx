export default function Banner({ onDismiss }) {
  return (
    <div className="top-banner">
      <span className="banner-text">
        Open to full-time roles starting Jan 2027 ·{' '}
        <a href="#contact" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
          Let's connect
        </a>
      </span>
      <button className="banner-close" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  )
}
