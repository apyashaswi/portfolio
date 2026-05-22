import { useLocation, useNavigate } from 'react-router-dom'

export default function Banner({ onDismiss }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toContact = (e) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: 'contact' } })
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }
  }
  return (
    <div className="top-banner">
      <span className="banner-text">
        Open to full-time roles starting Jan 2027 ·{' '}
        <a href="#contact" onClick={toContact}>Let's connect</a>
      </span>
      <button className="banner-close" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  )
}
