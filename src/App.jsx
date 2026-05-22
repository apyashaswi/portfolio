import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Banner from './components/Banner'
import CustomCursor from './components/CustomCursor'
import Nav from './components/Nav'
import Hero, { RecruiterHero } from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Journey from './components/Journey'
import Projects from './components/Projects'
import Highlights from './components/Highlights'
import GlobeSection from './components/GlobeSection'
import Research from './components/Research'
import Skills from './components/Skills'
import Leadership from './components/Leadership'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  const [active, setActive] = useState('hero')
  const [banner, setBanner] = useState(true)
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('ap-mode') || 'explorer' } catch { return 'explorer' }
  })

  useEffect(() => {
    try { localStorage.setItem('ap-mode', mode) } catch {}
  }, [mode])

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [mode])

  const recruiterMode = mode === 'recruiter'

  return (
    <>
      <CustomCursor />
      {banner && <Banner onDismiss={() => setBanner(false)} />}
      <Nav active={active} bannerVisible={banner} mode={mode} setMode={setMode} />
      <AnimatePresence mode="wait">
        <motion.main
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {recruiterMode ? <RecruiterHero /> : <Hero />}
          <About />
          <Experience recruiterMode={recruiterMode} />
          {!recruiterMode && <Journey />}
          <Projects />
          {!recruiterMode && <Highlights />}
          {!recruiterMode && <GlobeSection />}
          <Research recruiterMode={recruiterMode} />
          <Skills recruiterMode={recruiterMode} />
          {!recruiterMode && <Leadership />}
          <Contact recruiterMode={recruiterMode} />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  )
}
