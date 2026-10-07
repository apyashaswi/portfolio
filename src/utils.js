import { useEffect, useState } from 'react'

// Shared rAF-gated scroll-position hook — avoids each consumer (Nav,
// ScrollTop, HeroHUD) attaching its own unthrottled `scroll` listener and
// re-rendering on every native scroll tick, which can fire far more often
// than once per animation frame. Pass `enabled=false` to skip subscribing
// entirely (e.g. under reduced motion).
export const useScrollY = (enabled = true) => {
  const [y, setY] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let raf = null
    const onScroll = () => {
      if (raf != null) return
      raf = requestAnimationFrame(() => {
        setY(window.scrollY)
        raf = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [enabled])
  return y
}

export const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768

// Per-route <title> + meta description (and og:/twitter: mirrors) for SPA routes
// like /projects/:id, restored on unmount so the home defaults come back.
export const useDocumentMeta = (title, description) => {
  useEffect(() => {
    const prevTitle = document.title
    const setMeta = (selector, value) => {
      const el = document.querySelector(selector)
      if (!el || value == null) return null
      const prev = el.getAttribute('content')
      el.setAttribute('content', value)
      return () => el.setAttribute('content', prev ?? '')
    }
    if (title) document.title = title
    const restores = [
      setMeta('meta[name="description"]', description),
      setMeta('meta[property="og:title"]', title),
      setMeta('meta[property="og:description"]', description),
      setMeta('meta[name="twitter:title"]', title),
      setMeta('meta[name="twitter:description"]', description),
    ].filter(Boolean)
    return () => {
      document.title = prevTitle
      restores.forEach((r) => r())
    }
  }, [title, description])
}

// Shared ceiling for any stagger delay — keeps long lists (Highlights,
// Projects, Skills tags, ...) from compounding into a slow full-list settle.
// Reused by revealTransition() below and by any hand-rolled stagger
// transition that needs the same policy (e.g. Skills' per-tag list).
export const MAX_STAGGER_DELAY = 0.3

// The cinematic layer's one easing curve (expo-out). Mirrors --ease-out-expo
// in cinematic.css so CSS transitions and framer-motion land on the same feel.
export const EASE = [0.16, 1, 0.3, 1]

// The site's one canonical reveal recipe, now on the same expo-out curve as
// everything else: position settles long, opacity lands early so content
// reads before the motion finishes. Shared by mount-triggered reveals (Nav,
// ScrollTop, Hero) so the timing can't drift into N different tunings.
export const revealTransition = (delay = 0) => {
  const d = Math.min(delay, MAX_STAGGER_DELAY)
  return {
    y: { duration: 0.9, ease: EASE, delay: d },
    opacity: { duration: 0.5, ease: EASE, delay: d },
  }
}

// Scroll reveal: a long, settling expo-out rise. Everything that enters on
// scroll goes through here so the whole page moves with one hand.
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.9, ease: EASE, delay: Math.min(delay, MAX_STAGGER_DELAY) },
})

// Variant form of the same reveal, for parents that stagger their children.
export const revealVariants = {
  hidden: { opacity: 0, y: 34 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay: Math.min(i * 0.08, MAX_STAGGER_DELAY) },
  }),
}
