import { useEffect, useRef, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'

const PINS = [
  // Professional — purple #7F77DD
  { lat: 42.3601,  lng: -71.0589, label: 'Boston, MA',           detail: 'Northeastern University · MS Engineering Management', color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 40.7684,  lng: -74.5143, label: 'Warren, NJ',           detail: 'MSIG USA · Program Manager & Scrum Master',            color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 12.9716,  lng:  77.5946, label: 'Bengaluru, India',     detail: 'PES University · B.Tech ECE · Cratel Co-Founder',      color: '#7F77DD', size: 1.2, type: 'pro' },
  { lat: 42.3770,  lng: -71.1167, label: 'Harvard · Cambridge',  detail: 'Harvard Asian Conference 2025',                        color: '#7F77DD', size: 1.0, type: 'pro' },
  // Award / Home — amber #EF9F27
  { lat: 42.3601,  lng: -71.0942, label: 'MIT · Cambridge, MA',  detail: 'MIT Reality Hack 2025 · Jaw-Dropping Award 🏆',        color: '#EF9F27', size: 1.8, type: 'award' },
  { lat: 12.2958,  lng:  76.6394, label: 'Mysuru, India',        detail: 'Hometown · City of Palaces · Karnataka',               color: '#EF9F27', size: 1.5, type: 'award' },
  // Travel US — teal #1D9E75
  { lat: 40.7128,  lng: -74.0060, label: 'New York City, NY',    detail: 'NYC · The City',                                       color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 43.0962,  lng: -79.0377, label: 'Niagara Falls, NY',    detail: 'Niagara Falls · Natural Wonder',                       color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 44.4759,  lng: -73.2121, label: 'Burlington, VT',       detail: 'Burlington · New England',                             color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 44.0523,  lng: -71.1270, label: 'North Conway, NH',     detail: 'North Conway · White Mountains, NH',                   color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 44.9778,  lng: -93.2650, label: 'Minneapolis, MN',      detail: 'Minneapolis · Twin Cities',                            color: '#1D9E75', size: 0.85, type: 'travel' },
  // Travel International — teal #1D9E75
  { lat: 25.2048,  lng:  55.2708, label: 'Dubai, UAE',           detail: 'Transit & Exploration',                                color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 19.0760,  lng:  72.8777, label: 'Mumbai, India',        detail: 'City of Dreams',                                       color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 28.6139,  lng:  77.2090, label: 'New Delhi, India',     detail: 'Capital of India',                                     color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 15.2993,  lng:  74.1240, label: 'Goa, India',           detail: 'Coastal Vibes',                                        color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 26.9124,  lng:  75.7873, label: 'Jaipur, India',        detail: 'Pink City · Rajasthan',                                color: '#1D9E75', size: 0.85, type: 'travel' },
  { lat: 13.0827,  lng:  80.2707, label: 'Chennai, India',       detail: 'Gateway of South India',                               color: '#1D9E75', size: 0.85, type: 'travel' },
]

export default function GlobeViz() {
  const globeEl = useRef()
  const wrapperRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState({ w: 900, h: 650 })
  const [landData, setLandData] = useState([])

  // Load land polygon GeoJSON — gives custom dark blue-grey continent color
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(d => setLandData(d.features))
      .catch(() => {})
  }, [])

  // Ocean base material — dark navy, clearly darker than land #1e2140
  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#0a0a1a',
    emissive: '#04040e',
    specular: '#161630',
    shininess: 5,
  }), [])

  // Responsive sizing — cap at 680px height for a large but contained globe
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

  // Controls — start centered on India (20°N 78°E), slow auto-rotate
  useEffect(() => {
    if (!globeEl.current) return
    const ctrl = globeEl.current.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.38
    ctrl.enableZoom = false
    ctrl.enablePan = false
    globeEl.current.pointOfView({ lat: 20, lng: 78, altitude: 1.85 }, 0)
  }, [])

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
        if (globeEl.current) globeEl.current.controls().autoRotate = true
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
          backgroundColor="#0b0b14"

          customGlobeMaterial={globeMaterial}

          // Land polygons: noticeably lighter than ocean (#1e2140 vs #0a0a1a)
          polygonsData={landData}
          polygonCapColor={() => '#1e2140'}
          polygonSideColor={() => 'transparent'}
          polygonStrokeColor={() => 'rgba(127,119,221,0.22)'}
          polygonAltitude={0.008}

          atmosphereColor="#7F77DD"
          atmosphereAltitude={0.26}

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
