import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import Hero, { RecruiterHero } from '../components/Hero'
import TrustStrip from '../components/TrustStrip'
import About from '../components/About'
import Experience from '../components/Experience'
import Projects from '../components/Projects'
import Highlights from '../components/Highlights'
import Research from '../components/Research'
import Skills from '../components/Skills'
import Leadership from '../components/Leadership'
import Contact from '../components/Contact'

export default function Home({ mode }) {
  const recruiterMode = mode === 'recruiter'
  const location = useLocation()

  // Scroll target comes from either a router state hand-off (arriving from
  // another route) or straight off the path, so /research is a real, shareable
  // URL rather than a fragment. Retried on a few frames because the section
  // may not be in the DOM yet: an Explorer/Recruiter toggle re-mounts <main>
  // only after AnimatePresence finishes its exit animation.
  useEffect(() => {
    const target = location.state?.scrollTo || location.pathname.slice(1)
    if (!target || target.includes('/')) return

    let tries = 0
    let raf
    const timers = []
    const scrollTo = (behavior) =>
      document.getElementById(target)?.scrollIntoView({ behavior, block: 'start' })

    const tryScroll = () => {
      if (document.getElementById(target)) {
        scrollTo('smooth')
        // Sections above the target are still settling as their images and
        // lazy chunks resolve, which pushes the target further down the
        // document after we have already scrolled -- measured at 167-221px
        // short. Two corrective passes land it, the second silent if the
        // first was already right.
        timers.push(setTimeout(() => scrollTo('auto'), 500))
        timers.push(setTimeout(() => scrollTo('auto'), 1200))
        return
      }
      if (tries++ < 30) raf = requestAnimationFrame(tryScroll)
    }
    raf = requestAnimationFrame(tryScroll)
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, [location.state, location.pathname, mode])

  return (
    <AnimatePresence mode="wait">
      <motion.main
        id="main"
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {recruiterMode ? <RecruiterHero /> : <Hero />}
        <TrustStrip />
        <About />
        <Experience recruiterMode={recruiterMode} />
        <Projects />
        {!recruiterMode && <Highlights />}
        <Research recruiterMode={recruiterMode} />
        <Skills recruiterMode={recruiterMode} />
        {!recruiterMode && <Leadership />}
        <Contact recruiterMode={recruiterMode} />
      </motion.main>
    </AnimatePresence>
  )
}
