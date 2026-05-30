import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Masthead from './components/Masthead'
import ScrollTop from './components/ScrollTop'
import IntroOverlay from './components/IntroOverlay'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProjectDetail from './pages/ProjectDetail'

export default function App() {
  const [active, setActive] = useState('hero')
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('ap-mode') || 'explorer' } catch { return 'explorer' }
  })
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    try { localStorage.setItem('ap-mode', mode) } catch {}
  }, [mode])

  useEffect(() => {
    if (!isHome) return
    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [mode, isHome, location.pathname])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <IntroOverlay />
      <Masthead />
      <Nav active={active} bannerVisible={true} mode={mode} setMode={setMode} />
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
