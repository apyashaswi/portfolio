import { useEffect } from 'react'

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

export const fadeUp = (delay = 0) => {
  const d = Math.min(delay, 0.3)
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: {
      y: { type: 'spring', duration: 0.45, bounce: 0.16, delay: d },
      opacity: { duration: 0.28, ease: 'easeOut', delay: d },
    },
  }
}
