import { useEffect, useRef, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'

const PINS = [
  // Professional â€” purple #bca47a
  { lat: 42.3601,  lng: -71.0589, label: 'Boston, MA',           detail: 'Northeastern University Â· MS Engineering Management', color: '#bca47a', size: 1.2, type: 'pro' },
  { lat: 40.7684,  lng: -74.5143, label: 'Warren, NJ',           detail: 'MSIG USA Â· Program Manager & Scrum Master',            color: '#bca47a', size: 1.2, type: 'pro' },
  { lat: 12.9716,  lng:  77.5946, label: 'Bengaluru, India',     detail: 'PES University Â· B.Tech ECE Â· Cratel Co-Founder',      color: '#bca47a', size: 1.2, type: 'pro' },
  { lat: 42.3770,  lng: -71.1167, label: 'Harvard Â· Cambridge',  detail: 'Harvard Asian Conference 2025',                        color: '#bca47a', size: 1.0, type: 'pro' },
  // Award / Home â€” ink-blue #6b8aa8
  { lat: 42.3601,  lng: -71.0942, label: 'MIT Â· Cambridge, MA',  detail: 'MIT Reality Hack 2025 Â· Jaw-Dropping Award',        color: '#6b8aa8', size: 1.8, type: 'award' },
  { lat: 12.2958,  lng:  76.6394, label: 'Mysuru, India',        detail: 'Hometown Â· City of Palaces Â· Karnataka',               color: '#6b8aa8', size: 1.5, type: 'award' },
  // Travel US â€” teal #7d9079
  { lat: 40.7128,  lng: -74.0060, label: 'New York City, NY',    detail: 'NYC Â· The City',                                       color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 43.0962,  lng: -79.0377, label: 'Niagara Falls, NY',    detail: 'Niagara Falls Â· Natural Wonder',                       color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 44.4759,  lng: -73.2121, label: 'Burlington, VT',       detail: 'Burlington Â· New England',                             color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 44.0523,  lng: -71.1270, label: 'North Conway, NH',     detail: 'North Conway Â· White Mountains, NH',                   color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 44.9778,  lng: -93.2650, label: 'Minneapolis, MN',      detail: 'Minneapolis Â· Twin Cities',                            color: '#7d9079', size: 0.85, type: 'travel' },
  // Travel International â€” teal #7d9079
  { lat: 25.2048,  lng:  55.2708, label: 'Dubai, UAE',           detail: 'Transit & Exploration',                                color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 19.0760,  lng:  72.8777, label: 'Mumbai, India',        detail: 'City of Dreams',                                       color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 28.6139,  lng:  77.2090, label: 'New Delhi, India',     detail: 'Capital of India',                                     color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 15.2993,  lng:  74.1240, label: 'Goa, India',           detail: 'Coastal Vibes',                                        color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 26.9124,  lng:  75.7873, label: 'Jaipur, India',        detail: 'Pink City Â· Rajasthan',                                color: '#7d9079', size: 0.85, type: 'travel' },
  { lat: 13.0827,  lng:  80.2707, label: 'Chennai, India',       detail: 'Gateway of South India',                               color: '#7d9079', size: 0.85, type: 'travel' },
]

// Holographic "data-link" arcs tracing the journey between key locations.
const ARCS = [
  { startLat: 12.9716, startLng: 77.5946, endLat: 42.3601, endLng: -71.0589 }, // Bengaluru → Boston
  { startLat: 42.3601, startLng: -71.0589, endLat: 40.7684, endLng: -74.5143 }, // Boston → Warren NJ
  { startLat: 12.9716, startLng: 77.5946, endLat: 25.2048, endLng: 55.2708 },   // Bengaluru → Dubai
  { startLat: 12.2958, startLng: 76.6394, endLat: 12.9716, endLng: 77.5946 },   // Mysuru → Bengaluru
  { startLat: 42.3601, startLng: -71.0589, endLat: 40.7128, endLng: -74.0060 }, // Boston → NYC
  { startLat: 42.3601, startLng: -71.0942, endLat: 42.3601, endLng: -71.0589 }, // MIT → Boston
]

export default function GlobeViz() {
  const globeEl = useRef()
  const wrapperRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState({ w: 900, h: 650 })
  const [landData, setLandData] = useState([])

  // Load land polygon GeoJSON — bundled locally (no third-party dependency),
  // with an abort guard so it never sets state after unmount.
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/countries.geojson', { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setLandData(d.features))
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // Ocean base material â€” warm cardstock (--bg #2c2620), no longer navy
  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#2c2620',      // --bg: warm cardstock ocean, not navy
    emissive: '#2c2620',    // --bg (reused rather than inventing a darker shade)
    specular: '#3a342c',   // --bg-card
    shininess: 5,
  }), [])

  // Responsive sizing â€” cap at 680px height for a large but contained globe
  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return
      const w = wrapperRef.current.clientWidth
      const h = Math.min(680, Math.max(380, Math.round(w * 0.64)))
      setDims({ w, h })
    }
    const ro = new ResizeObserver(update)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    update()
    return () => ro.disconnect()
  }, [])

  // Honour the OS "reduce motion" setting — no perpetual auto-rotation.
  const reduceMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Controls â€” start centered on India (20Â°N 78Â°E), slow auto-rotate
  useEffect(() => {
    if (!globeEl.current) return
    const ctrl = globeEl.current.controls()
    ctrl.autoRotate = !reduceMotion
    ctrl.autoRotateSpeed = 0.38
    ctrl.enableZoom = false
    ctrl.enablePan = false
    globeEl.current.pointOfView({ lat: 20, lng: 78, altitude: 1.85 }, 0)
  }, [reduceMotion])

  // Pause the WebGL render loop whenever the globe is off-screen. A globe
  // spinning at 60fps forever (even scrolled far away) is the single biggest
  // source of scroll/animation jank elsewhere on the page.
  useEffect(() => {
    const el = wrapperRef.current
    const globe = globeEl.current
    if (!el || !globe) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          globe.resumeAnimation?.()
          globe.controls().autoRotate = !reduceMotion
        } else {
          globe.controls().autoRotate = false
          globe.pauseAnimation?.()
        }
      },
      { threshold: 0.04 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduceMotion])

  const ringColorFn = d => t => {
    const alpha = Math.floor((1 - t * t) * 210).toString(16).padStart(2, '0')
    return d.color + alpha
  }

  return (
    <div
      ref={wrapperRef}
      className="globe-outer"
      onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
      onMouseEnter={() => { if (globeEl.current) globeEl.current.controls().autoRotate = false }}
      onMouseLeave={() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = !reduceMotion
        setTooltip(null)
      }}
    >
      <div className="globe-wrapper" style={{ height: dims.h }}>
        <Globe
          ref={globeEl}
          width={dims.w}
          height={dims.h}
          // Use solid section-alt background color instead of transparent
          // to avoid WebGL ghost-rendering artifacts on canvas edges
          backgroundColor="#2c2620"

          customGlobeMaterial={globeMaterial}

          // Holographic landmass: continents stippled into oat hex-dots so the
          // globe reads like a projected hologram rather than a solid map.
          hexPolygonsData={landData}
          hexPolygonResolution={3}
          hexPolygonMargin={0.32}
          hexPolygonAltitude={0.008}
          hexPolygonUseDots={true}
          hexPolygonColor={() => 'rgba(188,164,122,0.55)'}

          atmosphereColor="#bca47a"
          atmosphereAltitude={0.32}

          // Animated data-links between the places that shaped the journey.
          arcsData={ARCS}
          arcColor={() => ['rgba(188,164,122,0.9)', 'rgba(138,157,132,0.6)']}
          arcStroke={0.5}
          arcDashLength={0.4}
          arcDashGap={0.18}
          arcDashAnimateTime={reduceMotion ? 0 : 3200}
          arcAltitudeAutoScale={0.4}

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

        {/* Accessible, touch-friendly equivalent — the globe interactions are
            pointer-only, so this disclosure gives keyboard, screen-reader, AND
            touch users the full list of places (tap to expand on mobile). */}
        <details className="globe-locations">
          <summary>View all {PINS.length} locations</summary>
          <ul>
            {PINS.map(p => (
              <li key={p.label}>
                <span className="gloc-dot" style={{ background: p.color }} aria-hidden="true" />
                <span className="gloc-name">{p.label}</span>
                <span className="gloc-detail">{p.detail}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="globe-legend">
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#bca47a', boxShadow: '0 0 7px #bca47aaa' }} />
            Professional
          </div>
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#7d9079', boxShadow: '0 0 7px #7d9079aa' }} />
            Travels
          </div>
          <div className="gl-item">
            <span className="gl-dot" style={{ background: '#6b8aa8', boxShadow: '0 0 9px #6b8aa8bb' }} />
            Award / Home
          </div>
        </div>
      </div>
    </div>
  )
}
