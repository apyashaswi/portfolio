import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { useReducedEffects, webglAvailable, saveDataOn } from '../../effects'
import { SKILLS } from '../../data'
import { SKILL_ICONS, skillIconUrl } from '../../icons.jsx'
import { fadeUp } from '../../utils'
import { motion } from 'framer-motion'
import FieldGuide from './FieldGuide'

/* ── The Toolkit Nebula ──────────────────────────────────────────────────
   A third, closing WebGL moment (after the hero constellation and the
   holographic globe) — skills float as a real 3D field, one glowing cluster
   per category, connected hub-and-spoke to a small category core.

   The signature moment: when the section first scrolls into view, every
   node flies in from further out along its own cluster's radial line —
   staggered per-node so it reads as a field coalescing, not a slide-in —
   and each connecting thread fades in as its node arrives. Once settled,
   every node keeps a small individual idle drift (never fully static) and
   is gently pulled toward the cursor within a small radius (magnetic, not
   physically simulated). Camera adds pointer-parallax on top, matching the
   hero rig. Hovering a node still ignites its whole category and dims the
   rest.

   Logos/labels are real DOM elements (via drei's <Html>, non-transform
   mode) positioned in 3D — crisp at any distance, no texture rasterization
   needed. Cluster colors stay inside the site's three named accents
   (oat / sage / ink-blue) plus warm ink-muted for the fourth category — no
   new hues introduced. Freezes to the final settled layout under reduced-
   motion (no flight, no idle drift, no magnetism), pauses off-screen,
   self-tunes quality, and always ships a real accessible list alongside it
   (see FieldGuide below the canvas) — same pattern as GlobeViz's <details>
   fallback. */

const OAT = '#bca47a'
const SAGE = '#7d9079'
const INKBLUE = '#6b8aa8'
const INK_MUTED = '#b3a48c'
const BG = '#2c2620'

const CLUSTER_COLOR = {
  'Program & Project Management': OAT,
  'Data & Analytics': SAGE,
  'Supply Chain & Operations': INKBLUE,
  'Engineering & Technical': INK_MUTED,
}

const FLIGHT_DURATION = 1.7
const MAX_STAGGER = 1.15

function seededRand(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}

const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)

function buildLayout() {
  const cats = Object.entries(SKILLS)
  const R = 4.3
  const clusters = cats.map(([cat], i) => {
    const angle = (i / cats.length) * Math.PI * 2 + Math.PI / 4
    return {
      cat,
      center: new THREE.Vector3(Math.cos(angle) * R, Math.sin(angle) * R * 0.42, Math.sin(angle) * R * 0.55),
    }
  })
  const nodes = []
  cats.forEach(([cat, skills], ci) => {
    const center = clusters[ci].center
    skills.forEach((label, j) => {
      const seed = cat + label
      const r = 0.95 + seededRand(seed) * 1.15
      const theta = (j / skills.length) * Math.PI * 2 + seededRand(seed + 't') * 0.8
      const phi = Math.PI / 2 + (seededRand(seed + 'p') - 0.5) * 1.7
      const pos = new THREE.Vector3(
        center.x + r * Math.sin(phi) * Math.cos(theta),
        center.y + r * Math.cos(phi) * 0.85,
        center.z + r * Math.sin(phi) * Math.sin(theta)
      )
      nodes.push({ cat, label, slug: SKILL_ICONS[label] || null, pos, center, seed })
    })
  })
  return { clusters, nodes }
}

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

function NodeGroup({ node, hoverCat, setHoverCat, startRef, reduced }) {
  const group = useRef()
  const ptr = useMemo(() => new THREE.Vector3(), [])
  const delay = seededRand(node.seed) * MAX_STAGGER
  const scatterScale = 4.2 + seededRand(node.seed + 's') * 3.0
  const phase = seededRand(node.seed + 'ph') * Math.PI * 2
  const start = useMemo(() => {
    const dir = node.pos.clone().sub(node.center)
    return node.center.clone().add(dir.multiplyScalar(scatterScale))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state) => {
    if (!group.current) return
    if (reduced) { group.current.position.copy(node.pos); return }

    const t = startRef.current ? (performance.now() - startRef.current) / 1000 : 0
    const p = Math.min(1, Math.max(0, (t - delay) / FLIGHT_DURATION))
    const eased = easeOutQuint(p)
    const cur = start.clone().lerp(node.pos, eased)

    // Idle drift only kicks in once mostly arrived, so it never reads as
    // jitter mid-flight.
    const idleAmp = 0.05 * eased
    cur.x += Math.sin(t * 0.6 + phase) * idleAmp
    cur.y += Math.cos(t * 0.5 + phase * 1.3) * idleAmp
    cur.z += Math.sin(t * 0.55 + phase * 0.7) * idleAmp

    // Gentle magnetic pull toward the cursor, local to this node's parent
    // (the rotating Rig), same projection technique as the hero's cursor
    // repulsion — just attracting instead of repelling, and only once the
    // node has essentially landed.
    if (group.current.parent && eased > 0.85) {
      ptr.set(state.pointer.x * state.viewport.width / 2, state.pointer.y * state.viewport.height / 2, 0)
      group.current.parent.worldToLocal(ptr)
      const dx = ptr.x - cur.x, dy = ptr.y - cur.y
      const dist = Math.hypot(dx, dy)
      const R = 1.5
      if (dist < R) {
        const f = (1 - dist / R) * 0.3
        cur.x += dx * f
        cur.y += dy * f
      }
    }

    group.current.position.copy(cur)
  })

  const color = CLUSTER_COLOR[node.cat]
  const dimmed = hoverCat && hoverCat !== node.cat

  return (
    <group ref={group} position={reduced ? node.pos : start}>
      <Html center zIndexRange={[10, 0]} occlude={false}>
        <div
          className={`neb-node${dimmed ? ' is-dimmed' : ''}`}
          onMouseEnter={() => setHoverCat(node.cat)}
          onMouseLeave={() => setHoverCat(null)}
        >
          <span className="neb-node-glow" style={{ background: color }} />
          {node.slug ? (
            <img src={skillIconUrl(node.slug)} alt="" draggable={false} />
          ) : (
            <span className="neb-node-dot" style={{ background: color }} />
          )}
          <span className="neb-node-label">{node.label}</span>
        </div>
      </Html>
    </group>
  )
}

function Spoke({ cluster, node, hoverCat, startRef, reduced }) {
  const ref = useRef()
  const delay = seededRand(node.seed) * MAX_STAGGER
  const dimmed = hoverCat && hoverCat !== node.cat

  useFrame(() => {
    if (!ref.current?.material) return
    const target = dimmed ? 0.05 : 0.35
    if (reduced) { ref.current.material.opacity = target; return }
    const t = startRef.current ? (performance.now() - startRef.current) / 1000 : 0
    const p = Math.min(1, Math.max(0, (t - delay) / FLIGHT_DURATION))
    ref.current.material.opacity = target * easeOutQuint(p)
  })

  return (
    <Line
      ref={ref}
      points={[cluster.center, node.pos]}
      color={CLUSTER_COLOR[node.cat]}
      lineWidth={1}
      transparent
      opacity={0}
    />
  )
}

function Spokes({ clusters, nodes, hoverCat, startRef, reduced }) {
  return nodes.map((n, i) => (
    <Spoke
      key={i}
      cluster={clusters.find((c) => c.cat === n.cat)}
      node={n}
      hoverCat={hoverCat}
      startRef={startRef}
      reduced={reduced}
    />
  ))
}

function Core({ cat, center, hoverCat, startRef, reduced }) {
  const ref = useRef()
  const dimmed = hoverCat && hoverCat !== cat

  useFrame(() => {
    if (!ref.current) return
    const t = startRef.current ? (performance.now() - startRef.current) / 1000 : 0
    const scale = reduced ? 1 : easeOutQuint(Math.min(1, t / 0.5))
    ref.current.scale.setScalar(scale)
    if (ref.current.material) ref.current.material.opacity = (dimmed ? 0.15 : 0.9) * scale
  })

  return (
    <mesh ref={ref} position={center}>
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshBasicMaterial color={CLUSTER_COLOR[cat]} transparent opacity={0} />
    </mesh>
  )
}

function Cores({ clusters, hoverCat, startRef, reduced }) {
  return clusters.map(({ cat, center }) => (
    <Core key={cat} cat={cat} center={center} hoverCat={hoverCat} startRef={startRef} reduced={reduced} />
  ))
}

function Rig({ reduced, children }) {
  const group = useRef()
  useFrame((state) => {
    if (!group.current || reduced) return
    // Pointer-relative parallax only (no time-based auto-drift) — settles
    // as soon as the pointer stops moving, so hover targets stay put long
    // enough to actually read a label or click through to a logo's site.
    const { x, y } = state.pointer
    const targetY = x * 0.28
    const targetX = -y * 0.14
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05
  })
  return <group ref={group}>{children}</group>
}

function Quality({ onBloom }) {
  const setDpr = useThree((s) => s.setDpr)
  return (
    <PerformanceMonitor
      bounds={() => [45, 60]}
      flipflops={3}
      onIncline={() => { setDpr(1.5); onBloom(true) }}
      onDecline={() => { setDpr(1); onBloom(false) }}
      onFallback={() => { setDpr(0.85); onBloom(false) }}
    />
  )
}

function Scene({ reduced, onScreen }) {
  const [hoverCat, setHoverCat] = useState(null)
  const [hiQ, setHiQ] = useState(true)
  const { clusters, nodes } = useMemo(buildLayout, [])
  const startRef = useRef(null)

  useEffect(() => {
    if (onScreen && !startRef.current) startRef.current = performance.now()
  }, [onScreen])

  return (
    <>
      <fog attach="fog" args={[BG, 8, 16]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 3, 5]} intensity={45} color={OAT} />
      <pointLight position={[-5, -2, 2]} intensity={24} color={SAGE} />
      {!reduced && <Quality onBloom={setHiQ} />}
      <Rig reduced={reduced}>
        <Cores clusters={clusters} hoverCat={hoverCat} startRef={startRef} reduced={reduced} />
        <Spokes clusters={clusters} nodes={nodes} hoverCat={hoverCat} startRef={startRef} reduced={reduced} />
        {nodes.map((n) => (
          <NodeGroup
            key={n.cat + n.label}
            node={n}
            hoverCat={hoverCat}
            setHoverCat={setHoverCat}
            startRef={startRef}
            reduced={reduced}
          />
        ))}
      </Rig>
      {hiQ && (
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.15} luminanceSmoothing={0.5} mipmapBlur radius={0.5} />
          <Vignette eskil={false} offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  )
}

export default function SkillNebula() {
  const reduced = useReducedMotion()
  const reducedEffects = useReducedEffects()
  const wrap = useRef(null)
  const [onScreen, setOnScreen] = useState(false)

  const allow3D = useMemo(() => webglAvailable() && !saveDataOn() && !reducedEffects, [reducedEffects])

  // No separate idle-callback mount gate here (unlike the hero, which
  // deliberately defers its WebGL off the critical path of first paint):
  // this component is already lazy-loaded behind Suspense at the section
  // level (see SkillsSection's IntersectionObserver-gated dynamic import)
  // and its own frameloop is already paused until it's actually on-screen.
  // An extra idle-callback delay on top only decoupled the "just scrolled
  // into view" moment from when the assembly visibly starts, by an
  // unpredictable amount — mounting as soon as `allow3D` is true keeps the
  // trigger tight to the real scroll moment.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '-10%', threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const frameloop = reduced ? 'demand' : onScreen ? 'always' : 'never'

  return (
    <div className="neb-wrap">
      <motion.div className="neb-canvas-outer" ref={wrap} {...fadeUp()}>
        {allow3D ? (
          <SceneBoundary>
            <Canvas
              className="neb-canvas"
              dpr={1.5}
              camera={{ position: [0, 0, 8.5], fov: 50 }}
              frameloop={frameloop}
              gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            >
              <Scene reduced={reduced} onScreen={onScreen} />
            </Canvas>
          </SceneBoundary>
        ) : (
          <div className="neb-poster" aria-hidden="true" />
        )}
      </motion.div>

      {/* Accessible, always-present equivalent — same pattern as GlobeViz's
          <details> location list: keyboard/screen-reader/touch users, and
          anyone under reduced-motion or with Effects off, get the full
          skill list here regardless of whether the 3D field rendered. */}
      <details className="neb-fallback">
        <summary>View all skills &amp; tools as a list</summary>
        <FieldGuide />
      </details>
    </div>
  )
}
