import { Suspense, lazy } from 'react'

const JourneyECG = lazy(() => import('./JourneyECG'))

export default function Journey() {
  return (
    <Suspense fallback={<section id="journey" className="section"><div style={{ height: 320 }} /></section>}>
      <JourneyECG />
    </Suspense>
  )
}
