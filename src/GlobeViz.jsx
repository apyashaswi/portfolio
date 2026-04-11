import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'

const PINS = [
  // Professional — purple
  { lat: 42.3601, lng: -71.0589, label: 'Boston, MA', detail: 'Northeastern University · MS Engineering Management', color: '#9F97F0', size: 0.5, type: 'pro' },
  { lat: 40.6879, lng: -74.5493, label: 'Warren, NJ', detail: 'MSIG USA · Program Manager & Scrum Master', color: '#9F97F0', size: 0.5, type: 'pro' },
  { lat: 42.3601, lng: -71.0942, label: 'MIT · Cambridge, MA', detail: 'MIT Reality Hack 2025 · Jaw-Dropping Award 🏆', color: '#c9a84c', size: 0.75, type: 'award' },
  { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India', detail: 'PES University · B.Tech ECE · Cratel Co-Founder', color: '#9F97F0', size: 0.5, type: 'pro' },
  { lat: 42.3736, lng: -71.1097, label: 'Harvard · Cambridge, MA', detail: 'Harvard Asian Conference 2025', color: '#9F97F0', size: 0.4, type: 'pro' },
  { lat: 40.5013, lng: -74.5717, label: 'Somerset, NJ', detail: 'Current Base · Somerset, New Jersey', color: '#9F97F0', size: 0.4, type: 'pro' },
  // Home — gold
  { lat: 12.2958, lng: 76.6394, label: 'Mysuru, India', detail: 'Hometown · City of Palaces · Karnataka', color: '#c9a84c', size: 0.55, type: 'award' },
  // Travel — teal
  { lat: 40.7128, lng: -74.0060, label: 'New York City, NY', detail: 'NYC · The City', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 38.9072, lng: -77.0369, label: 'Washington, D.C.', detail: 'D.C. · Capital', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 25.2048, lng: 55.2708, label: 'Dubai, UAE', detail: 'Transit & Exploration', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India', detail: 'City of Dreams', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 28.6139, lng: 77.2090, label: 'New Delhi, India', detail: 'Capital of India', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 15.2993, lng: 74.1240, label: 'Goa, India', detail: 'Coastal Vibes', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 26.9124, lng: 75.7873, label: 'Jaipur, India', detail: 'Pink City · Rajasthan', color: '#2DB88A', size: 0.35, type: 'travel' },
  { lat: 13.0827, lng: 80.2707, label: 'Chennai, India', detail: 'Gateway of South India', color: '#2DB88A', size: 0.35, type: 'travel' },
]

export default function GlobeViz() {
  const globeEl = useRef()
  const wrapperRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState({ w: 800, h: 520 })

  // Responsive sizing
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setDims({ w, h: Math.min(520, Math.max(320, w * 0.55)) })
    })
    if (wrapperRef.current) {
      ro.observe(wrapperRef.current)
      const w = wrapperRef.current.clientWidth
      setDims({ w, h: Math.min(520, Math.max(320, w * 0.55)) })
    }
    return () => ro.disconnect()
  }, [])

  // Globe controls after mount
  useEffect(() => {
    if (!globeEl.current) return
    const ctrl = globeEl.current.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.6
    ctrl.enableZoom = false
    globeEl.current.pointOfView({ lat: 22, lng: 40, altitude: 2.3 }, 1500)
  }, [])

  const handleMouseEnter = () => {
    if (globeEl.current) globeEl.current.controls().autoRotate = false
  }
  const handleMouseLeave = () => {
    if (globeEl.current) globeEl.current.controls().autoRotate = true
    setTooltip(null)
  }
  const handleMouseMove = (e) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }

  return (
    <div
      ref={wrapperRef}
      className="globe-wrapper"
      style={{ height: dims.h }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <Globe
        ref={globeEl}
        width={dims.w}
        height={dims.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        atmosphereColor="#7F77DD"
        atmosphereAltitude={0.15}
        pointsData={PINS}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointsMerge={false}
        onPointHover={(point) => setTooltip(point || null)}
        onPointClick={(point) => {
          if (point && globeEl.current) {
            globeEl.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 800)
          }
        }}
      />
      {tooltip && (
        <div
          className="globe-tooltip"
          style={{
            left: mouse.x + 16,
            top: mouse.y - 10,
            transform: mouse.x > window.innerWidth - 240 ? 'translateX(-110%)' : 'none',
          }}
        >
          <div className="gt-label">{tooltip.label}</div>
          <div className="gt-detail">{tooltip.detail}</div>
          <div className="gt-dot" style={{ background: tooltip.color }} />
        </div>
      )}
      <div className="globe-legend">
        <div className="gl-item"><span className="gl-dot pro" />Professional</div>
        <div className="gl-item"><span className="gl-dot travel" />Travels</div>
        <div className="gl-item"><span className="gl-dot award" />Award / Home</div>
      </div>
    </div>
  )
}
