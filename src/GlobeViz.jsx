import { useEffect, useRef, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'

const PINS = [
  // Professional — purple #7F77DD
  { lat: 42.3601, lng: -71.0589, label: 'Boston, MA', detail: 'Northeastern University · MS Engineering Management', color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 40.6879, lng: -74.5493, label: 'Warren, NJ', detail: 'MSIG USA · Program Manager & Scrum Master', color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India', detail: 'PES University · B.Tech ECE · Cratel Co-Founder', color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 42.3736, lng: -71.1097, label: 'Harvard · Cambridge, MA', detail: 'Harvard Asian Conference 2025', color: '#7F77DD', size: 1.0, type: 'pro' },
  { lat: 40.5013, lng: -74.5717, label: 'Somerset, NJ', detail: 'Current Base · Somerset, New Jersey', color: '#7F77DD', size: 1.0, type: 'pro' },
  // Award / Home — amber #EF9F27
  { lat: 42.3601, lng: -71.0942, label: 'MIT · Cambridge, MA', detail: 'MIT Reality Hack 2025 · Jaw-Dropping Award 🏆', color: '#EF9F27', size: 1.8, type: 'award' },
  { lat: 12.2958, lng: 76.6394, label: 'Mysuru, India', detail: 'Hometown · City of Palaces · Karnataka', color: '#EF9F27', size: 1.5, type: 'award' },
  // Travel — teal #1D9E75
  { lat: 40.7128, lng: -74.0060, label: 'New York City, NY', detail: 'NYC · The City', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 38.9072, lng: -77.0369, label: 'Washington, D.C.', detail: 'D.C. · Capital', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 25.2048, lng: 55.2708, label: 'Dubai, UAE', detail: 'Transit & Exploration', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India', detail: 'City of Dreams', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 28.6139, lng: 77.2090, label: 'New Delhi, India', detail: 'Capital of India', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 15.2993, lng: 74.1240, label: 'Goa, India', detail: 'Coastal Vibes', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 26.9124, lng: 75.7873, label: 'Jaipur, India', detail: 'Pink City · Rajasthan', color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 13.0827, lng: 80.2707, label: 'Chennai, India', detail: 'Gateway of South India', color: '#1D9E75', size: 0.85, type: 'travel' },
]

export default function GlobeViz() {
  const globeEl = useRef()
  const wrapperRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState({ w: 860, h: 620 })
  const [landData, setLandData] = useState([])

  // Load land polygon GeoJSON for custom dark continent coloring
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(d => setLandData(d.features))
      .catch(() => {}) // pins still render on plain dark sphere if fetch fails
  }, [])

  // Ocean/base sphere material
  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#0c0c1e',
    emissive: '#05050f',
    specular: '#1e1e40',
    shininess: 6,
  }), [])

  // Responsive sizing
  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return
      const w = wrapperRef.current.clientWidth
      setDims({ w, h: Math.min(650, Math.max(360, Math.round(w * 0.62))) })
    }
    const ro = new ResizeObserver(update)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    update()
    return () => ro.disconnect()
  }, [])

  // Controls — start at India, slow auto-rotate
  useEffect(() => {
    if (!globeEl.current) return
    const ctrl = globeEl.current.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.38
    ctrl.enableZoom = false
    ctrl.enablePan = false
    // Center on India/subcontinent at load
    globeEl.current.pointOfView({ lat: 20, lng: 78, altitude: 2.1 }, 0)
  }, [])

  const ringColorFn = d => t => {
    // Fade from opaque to transparent as ring expands
    const alpha = Math.floor((1 - t * t) * 200).toString(16).padStart(2, '0')
    return d.color + alpha
  }

  return (
    <div
      ref={wrapperRef}
      className="globe-outer"
      onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
      onMouseEnter={() => globeEl.current?.controls() && (globeEl.current.controls().autoRotate = false)}
      onMouseLeave={() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = true
        setTooltip(null)
      }}
    >
      <div className="globe-wrapper" style={{ height: dims.h }}>
        <Globe
          ref={globeEl}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"

          // Ocean: custom dark navy material
          customGlobeMaterial={globeMaterial}

          // Continents: dark blue-grey polygons
          polygonsData={landData}
          polygonCapColor={() => '#1a1a2e'}
          polygonSideColor={() => 'transparent'}
          polygonStrokeColor={() => 'rgba(127,119,221,0.2)'}
          polygonAltitude={0.007}

          // Atmosphere glow — stronger purple
          atmosphereColor="#7F77DD"
          atmosphereAltitude={0.24}

          // Pins
          pointsData={PINS}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.025}
          pointRadius="size"
          pointsMerge={false}
          onPointHover={point => setTooltip(point || null)}
          onPointClick={point => {
            if (point && globeEl.current) {
              globeEl.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 800)
            }
          }}

          // Pulsing rings from each pin
          ringsData={PINS}
          ringLat="lat"
          ringLng="lng"
          ringColor={ringColorFn}
          ringMaxRadius={d => d.type === 'award' ? 5.5 : d.type === 'pro' ? 4.2 : 3.2}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={d => d.type === 'award' ? 850 : 1350}
          ringAltitude={0.006}
        />

        {tooltip && (
          <div
            className="globe-tooltip"
            style={{
              left: mouse.x + 18,
              top: mouse.y - 12,
              transform: mouse.x > window.innerWidth - 270 ? 'translateX(-110%)' : 'none',
            }}
          >
            <div className="gt-header">
              <div className="gt-dot" style={{ background: tooltip.color, boxShadow: `0 0 8px ${tooltip.color}88` }} />
              <div className="gt-label">{tooltip.label}</div>
            </div>
            <div className="gt-detail">{tooltip.detail}</div>
          </div>
        )}

        <div className="globe-legend">
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#7F77DD', boxShadow: '0 0 7px #7F77DDaa' }} />
            Professional
          </div>
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#1D9E75', boxShadow: '0 0 7px #1D9E75aa' }} />
            Travels
          </div>
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#EF9F27', boxShadow: '0 0 9px #EF9F27bb' }} />
            Award / Home
          </div>
        </div>
      </div>
    </div>
  )
}
