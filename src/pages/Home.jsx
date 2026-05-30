import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import Hero, { RecruiterHero } from '../components/Hero'
import About from '../components/About'
import Experience from '../components/Experience'
import Journey from '../components/Journey'
import Projects from '../components/Projects'
import Highlights from '../components/Highlights'
import GlobeSection from '../components/GlobeSection'
import Research from '../components/Research'
import Skills from '../components/Skills'
import Leadership from '../components/Leadership'
import Contact from '../components/Contact'

export default function Home({ mode }) {
  const recruiterMode = mode === 'recruiter'
  const location = useLocation()

  useEffect(() => {
    const target = location.state?.scrollTo
    if (target) {
      requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [location.state])

  return (
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
  )
}
