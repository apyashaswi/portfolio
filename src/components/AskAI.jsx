import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'
import { useScrollY } from '../utils'
import '../ask-ai.css'

/* Our own launcher for the Chatbase assistant, replacing Chatbase's default
   bubble (hidden in index.html). It renders from first paint; clicks before the
   embed has loaded wait in the chatbase queue (index.html defines the stub).
   Open state is read off Chatbase's own window element, so the panel's
   internal close button keeps this button in sync. */

const chatWindow = () => document.getElementById('chatbase-bubble-window')
const isChatOpen = () => {
  const w = chatWindow()
  return !!w && getComputedStyle(w).display !== 'none'
}

const NARROW = '(max-width: 820px)'
const useNarrow = () => {
  const [narrow, setNarrow] = useState(() => matchMedia(NARROW).matches)
  useEffect(() => {
    const mq = matchMedia(NARROW)
    const h = () => setNarrow(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return narrow
}

export default function AskAI({ mode }) {
  const [open, setOpen] = useState(false)
  const osReduced = useReducedMotion()
  const effectsReduced = useReducedEffects()
  const still = osReduced || effectsReduced
  // Phones only (CSS): the hero has its own "Ask AP AI" button, so the
  // round launcher stays out of the hero copy until the hero has scrolled away.
  // Phones only. Measured after commit (the hero isn't in the DOM yet during
  // render), on every rAF-throttled scroll, on resize, on route changes, and
  // once an Explorer/Recruiter swap (0.35s exit) has put the new hero in.
  // Desktop never subscribes to scroll here.
  const narrow = useNarrow()
  const y = useScrollY(narrow)
  const { pathname } = useLocation()
  const [overHero, setOverHero] = useState(false)
  useEffect(() => {
    if (!narrow) { setOverHero(false); return }
    const check = () => {
      const hero = document.getElementById('hero')
      setOverHero(!!hero && hero.getBoundingClientRect().bottom > 120)
    }
    check()
    const t = setTimeout(check, 450)
    addEventListener('resize', check)
    return () => { clearTimeout(t); removeEventListener('resize', check) }
  }, [narrow, y, pathname, mode])

  useEffect(() => {
    let mo = null
    const watch = () => {
      const w = chatWindow()
      if (!w) return false
      mo = new MutationObserver(() => setOpen(isChatOpen()))
      mo.observe(w, { attributes: true, attributeFilter: ['style', 'class'] })
      setOpen(isChatOpen())
      return true
    }
    // The window element appears only once the embed script has loaded.
    const finder = watch() ? null : new MutationObserver(() => { if (watch()) finder.disconnect() })
    finder?.observe(document.body, { childList: true })
    return () => { mo?.disconnect(); finder?.disconnect() }
  }, [])

  const toggle = () => {
    if (typeof window.chatbase !== 'function') return
    const next = !isChatOpen()
    window.chatbase(next ? 'open' : 'close')
    setOpen(next)
  }

  return (
    <button
      type="button"
      className={`ask-ai${open ? ' is-open' : ''}${still ? ' is-still' : ''}${overHero && !open ? ' is-over-hero' : ''}`}
      onClick={toggle}
      aria-label={open ? 'Close chat with AP AI' : 'Ask AP AI about Yashaswi'}
      aria-expanded={open}
    >
      <span className="ask-ai-avatar" aria-hidden="true">
        <img src="/ap-ai-avatar-96.webp" srcSet="/ap-ai-avatar-96.webp 1x, /ap-ai-avatar-192.webp 2x" alt="" width="48" height="48" decoding="async" />
      </span>
      <span className="ask-ai-label" aria-hidden="true">{open ? 'Close chat' : 'Ask AP AI'}</span>
    </button>
  )
}
