import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useReducedEffects } from '../effects'
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

export default function AskAI() {
  const [open, setOpen] = useState(false)
  const osReduced = useReducedMotion()
  const effectsReduced = useReducedEffects()
  const still = osReduced || effectsReduced

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
      className={`ask-ai${open ? ' is-open' : ''}${still ? ' is-still' : ''}`}
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
