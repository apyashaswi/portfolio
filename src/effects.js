import { useEffect, useState } from 'react'

/* Manual "reduce effects" preference + device capability checks.
   Kept outside the React tree (localStorage + a window event) so any component
   — however deep — can read it without prop-drilling. */

const KEY = 'ap-effects'
const EVT = 'ap-effects-change'

export const getEffectsReduced = () => {
  try { return localStorage.getItem(KEY) === 'reduced' } catch { return false }
}

export const setEffectsReduced = (v) => {
  try { localStorage.setItem(KEY, v ? 'reduced' : 'full') } catch {}
  window.dispatchEvent(new CustomEvent(EVT))
}

export const useReducedEffects = () => {
  const [reduced, setReduced] = useState(getEffectsReduced)
  useEffect(() => {
    const h = () => setReduced(getEffectsReduced())
    window.addEventListener(EVT, h)
    return () => window.removeEventListener(EVT, h)
  }, [])
  return reduced
}

// True only if the browser can actually create a WebGL context.
export const webglAvailable = () => {
  if (typeof window === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

// Honour Data Saver — skip the heavy 3D for users who asked to conserve data.
export const saveDataOn = () => {
  try { return !!navigator.connection?.saveData } catch { return false }
}
