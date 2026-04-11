import { useEffect, useRef, useState } from 'react'

const PINS = [
  // Professional — purple
  { lat: 42.3601, lng: -71.0589, label: 'Boston, MA', detail: 'Northeastern University · MS Engineering Management', color: '#9F97F0', size: 9, type: 'pro' },
  { lat: 40.6879, lng: -74.5493, label: 'Warren, NJ', detail: 'MSIG USA · Program Manager & Scrum Master', color: '#9F97F0', size: 9, type: 'pro' },
  { lat: 42.3601, lng: -71.0942, label: 'MIT · Cambridge, MA', detail: 'MIT Reality Hack 2025 · Jaw-Dropping Award 🏆', color: '#c9a84c', size: 13, type: 'award' },
  { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India', detail: 'PES University · B.Tech ECE · Cratel Co-Founder', color: '#9F97F0', size: 9, type: 'pro' },
  { lat: 42.3736, lng: -71.1097, label: 'Harvard · Cambridge, MA', detail: 'Harvard Asian Conference 2025', color: '#9F97F0', size: 7, type: 'pro' },
  { lat: 40.5013, lng: -74.5717, label: 'Somerset, NJ', detail: 'Current Base · Somerset, New Jersey', color: '#9F97F0', size: 7, type: 'pro' },
  // Travel — teal
  { lat: 40.7128, lng: -74.0060, label: 'New York City, NY', detail: 'NYC · The City', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 38.9072, lng: -77.0369, label: 'Washington, D.C.', detail: 'D.C. · Capital', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 25.2048, lng: 55.2708, label: 'Dubai, UAE', detail: 'Transit & Exploration', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India', detail: 'City of Dreams', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 28.6139, lng: 77.2090, label: 'New Delhi, India', detail: 'Capital of India', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 15.2993, lng: 74.1240, label: 'Goa, India', detail: 'Coastal Vibes', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 12.2958, lng: 76.6394, label: 'Mysuru, India', detail: 'City of Palaces · Karnataka', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 26.9124, lng: 75.7873, label: 'Jaipur, India', detail: 'Pink City · Rajasthan', color: '#2DB88A', size: 6, type: 'travel' },
  { lat: 13.0827, lng: 80.2707, label: 'Chennai, India', detail: 'Gateway of South India', color: '#2DB88A', size: 6, type: 'travel' },
]

export default function GlobeViz() {
  const mountRef = useRef(null)
  const globeRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let Globe, instance, animFrame

    const init = async () => {
      const mod = await import('react-globe.gl')
      Globe = mod.default

      if (!mountRef.current) return

      instance = Globe({ animateIn: true })(mountRef.current)
      globeRef.current = instance

      instance
        .width(mountRef.current.clientWidth)
        .height(mountRef.current.clientHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        .atmosphereColor('#7F77DD')
        .atmosphereAltitude(0.15)
        .pointsData(PINS)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude(0.01)
        .pointRadius(d => d.size * 0.012)
        .pointsMerge(false)
        .onPointHover((point, ev) => {
          if (point) {
            setTooltip(point)
            if (ev) setTooltipPos({ x: ev.clientX, y: ev.clientY })
          } else {
            setTooltip(null)
          }
        })
        .onPointClick((point) => {
          if (point) {
            instance.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 800)
          }
        })

      instance.controls().autoRotate = true
      instance.controls().autoRotateSpeed = 0.6
      instance.controls().enableZoom = false

      instance.pointOfView({ lat: 22, lng: 40, altitude: 2.3 }, 1500)

      // stop autorotate on hover
      mountRef.current.addEventListener('mouseenter', () => {
        instance.controls().autoRotate = false
      })
      mountRef.current.addEventListener('mouseleave', () => {
        instance.controls().autoRotate = true
        setTooltip(null)
      })
      mountRef.current.addEventListener('mousemove', (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY })
      })

      setLoaded(true)
    }

    init()

    const ro = new ResizeObserver(() => {
      if (globeRef.current && mountRef.current) {
        globeRef.current
          .width(mountRef.current.clientWidth)
          .height(mountRef.current.clientHeight)
      }
    })
    if (mountRef.current) ro.observe(mountRef.current)

    return () => {
      cancelAnimationFrame(animFrame)
      ro.disconnect()
      if (mountRef.current) mountRef.current.innerHTML = ''
    }
  }, [])

  return (
    <div className="globe-wrapper">
      <div
        ref={mountRef}
        className="globe-mount"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease' }}
      />
      {!loaded && (
        <div className="globe-loading">
          <div className="globe-loading-ring" />
          <span>Loading Globe…</span>
        </div>
      )}
      {tooltip && (
        <div
          className="globe-tooltip"
          style={{
            left: tooltipPos.x + 16,
            top: tooltipPos.y - 10,
            transform: tooltipPos.x > window.innerWidth - 220 ? 'translateX(-110%)' : 'none',
          }}
        >
          <div className="gt-label">{tooltip.label}</div>
          <div className="gt-detail">{tooltip.detail}</div>
          <div
            className="gt-dot"
            style={{ background: tooltip.color }}
          />
        </div>
      )}
      <div className="globe-legend">
        <div className="gl-item"><span className="gl-dot pro" />Professional</div>
        <div className="gl-item"><span className="gl-dot travel" />Travels</div>
        <div className="gl-item"><span className="gl-dot award" />Award</div>
      </div>
    </div>
  )
}
