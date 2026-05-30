import { useLocation, useNavigate } from 'react-router-dom'
import ModeToggle from './ModeToggle'

// Permanent editorial masthead — replaces the dismissible promo banner.
// Folds the "open to roles" message into a journal-style nameplate.
export default function Masthead({ mode, setMode }) {
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
    <div className="masthead">
      <div className="masthead-inner">
        <a href="#contact" onClick={toContact} className="masthead-cta">
          <span className="masthead-pip" aria-hidden="true" />
          Open to roles · Jan 2027
        </a>
        <div className="masthead-title">
          <span className="masthead-the">The</span>
          <span className="masthead-name">A&middot;P Journal</span>
        </div>
        <div className="masthead-edition">
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </div>
    </div>
  )
}
