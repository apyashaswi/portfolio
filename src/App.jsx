import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Masthead from './components/Masthead'
import ScrollTop from './components/ScrollTop'
import IntroOverlay from './components/IntroOverlay'
import AmbientMesh from './components/AmbientMesh'
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
      // A thin band across the middle of the viewport: whichever section is
      // crossing it is the active one. A ratio threshold (0.3) never fires
      // for sections taller than ~3 viewports, which left the nav stuck on
      // the previous section through all of Leadership and the showcase.
      // Pixels, not percentages: percentage rootMargins resolve against the
      // viewport WIDTH, which on a landscape screen collapses the band.
      const vh = window.innerHeight
      obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
        { rootMargin: `-${Math.round(vh * 0.45)}px 0px -${Math.round(vh * 0.54)}px 0px`, threshold: 0 }
      )
      sections.forEach(s => obs.observe(s))
    }
    attach()
    const main = document.getElementById('main')
    const mo = main && new MutationObserver(attach)
    mo?.observe(main, { childList: true, subtree: true })
    window.addEventListener('resize', attach)
    return () => { obs?.disconnect(); mo?.disconnect(); window.removeEventListener('resize', attach) }
  }, [mode, isHome, location.pathname])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <AmbientMesh />
      <IntroOverlay />
      <Masthead mode={mode} setMode={setMode} />
      <Nav active={active} bannerVisible={true} mode={mode} />
      <Routes>
        <Route path="/" element={<Home mode={mode} />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="*" element={<Home mode={mode} />} />
      </Routes>
      <Footer />
      <ScrollTop />
    </>
  )
}
