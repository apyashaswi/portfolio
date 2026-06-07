// Shared signal that ties the intro overlay's exit to the hero's reveal so the
// two read as one orchestrated sequence instead of two independent animations.
import { getEffectsReduced } from './effects'

export const INTRO_KEY = 'ap-intro-shown'
export const INTRO_DONE = 'ap-intro-done'

// Replay the cold-open on every page load (true) vs. once per session (false).
// Production default: once per session.
export const ALWAYS_REPLAY = false

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export const introWillShow = () => {
  // Never run the cold-open for reduced-motion users or when effects are off —
  // they get straight to content (the hero reveals immediately instead).
  if (prefersReducedMotion() || getEffectsReduced()) return false
  if (ALWAYS_REPLAY) return true
  try { return !sessionStorage.getItem(INTRO_KEY) } catch { return false }
}

export const fireIntroDone = () => {
  if (!ALWAYS_REPLAY) {
    try { sessionStorage.setItem(INTRO_KEY, '1') } catch {}
  }
  window.dispatchEvent(new CustomEvent(INTRO_DONE))
}
