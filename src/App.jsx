import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Masthead from './components/Masthead'
import ScrollTop from './components/ScrollTop'
import AskAI from './components/AskAI'
import SkyBackground from './components/SkyBackground'
import IntroOverlay from './components/IntroOverlay'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProjectDetail from './pages/ProjectDetail'

export default function App() {
  const [active, setActive] = useState('hero')
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('ap-mode') || 'recruiter' } catch { return 'recruiter' }
  })
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    try { localStorage.setItem('ap-mode', mode) } catch {}
  }, [mode])

  // The sky pins its day phases to section positions. A mode toggle swaps the
  // sections only after the 0.35s exit animation (AnimatePresence mode="wait"),
  // and a route change swaps the page, so re-measure once the new DOM is in.
  // (Height changes from lazy chunks and images reach it via its ResizeObserver.)
  useEffect(() => {
    const relayout = () => window.__sky?.relayout()
    const raf = requestAnimationFrame(relayout)
    const t = setTimeout(relayout, 450)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [mode, location.pathname])

  useEffect(() => {
    if (!isHome) return
    let obs
    // (Re-)scans for section[id] elements and (re-)subscribes the observer.
    // Needed on top of the [mode, ...] deps below because the sections
    // themselves get swapped out asynchronously after this effect already
    // ran: an Explorer/Recruiter toggle re-mounts <motion.main> only after
    // its exit animation finishes (AnimatePresence mode="wait"), and the
    // lazy-loaded Journey section replaces its Suspense fallback's
    // <section id="journey"> once the chunk finishes loading. Watching
    // #main for childList changes lets the observer re-sync to whichever
    // section[id] nodes are actually in the DOM right now.
    const attach = () => {
      obs?.disconnect()
      const sections = document.querySelectorAll('section[id]')
      obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
        { threshold: 0.3 }
      )
      sections.forEach(s => obs.observe(s))
    }
    attach()
    const main = document.getElementById('main')
    const mo = main && new MutationObserver(attach)
    mo?.observe(main, { childList: true, subtree: true })
    return () => { obs?.disconnect(); mo?.disconnect() }
  }, [mode, isHome, location.pathname])

  return (
    <>
      <SkyBackground />
      {/* the cold-open overlay stays outside .sky-page's stacking context, above the paper grain as before */}
      <IntroOverlay />
      <div className="sky-page">
        <a href="#main" className="skip-link">Skip to content</a>
        <Masthead mode={mode} setMode={setMode} />
        <Nav active={active} bannerVisible={true} mode={mode} />
        <Routes>
          <Route path="/" element={<Home mode={mode} />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="*" element={<Home mode={mode} />} />
        </Routes>
        <Footer />
        <ScrollTop />
        <AskAI />
      </div>
    </>
  )
}
