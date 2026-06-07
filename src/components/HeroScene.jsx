import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Icosahedron, MeshDistortMaterial, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { useReducedEffects, webglAvailable, saveDataOn } from '../effects'

/* ── Editorial-Futurism hero substrate ─────────────────────────────────────
   A breathing particle constellation around a soft, bloom-lit core in the
   portfolio's warm-paper palette. The field assembles on load, sways and drifts
   per-particle (organic, not mechanical), parts and swirls around the cursor,
   and disperses on scroll. The core morphs gently and brightens as the pointer
   nears it. A cinematic post-grade (bloom + chromatic aberration + vignette +
   film grain) ties it together. Everything freezes under reduced-motion, pauses
   off-screen, self-tunes quality, and never blocks the hero text or LCP. */

const BG = '#2c2620'
const OAT = '#bca47a'
const SAGE = '#8a9d84'
const INKBLUE = '#6b8aa8'

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const scrollFactor = () =>
  typeof window === 'undefined' ? 0 : Math.min(1, window.scrollY / (window.innerHeight * 0.9))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

function Constellation({ count = 850, reduced }) {
  const points = useRef()
  const mat = useRef()
  const t0 = useRef(0)
  const ptr = useMemo(() => new THREE.Vector3(), [])

  const { base, scatter, colors, phase } = useMemo(() => {
    const base = new Float32Array(count * 3)
    const scatter = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const phase = new Float32Array(count)
    const palette = [new THREE.Color(OAT), new THREE.Color(SAGE), new THREE.Color(INKBLUE)]
    let seed = 7
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
    for (let i = 0; i < count; i++) {
      const r = 3.2 + rand() * 6.5
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.7
      const z = r * Math.cos(phi)
      base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z
      const s = 2.6 + rand() * 2.2
      scatter[i * 3] = x * s; scatter[i * 3 + 1] = y * s; scatter[i * 3 + 2] = z * s
      const c = palette[rand() < 0.7 ? 0 : rand() < 0.6 ? 1 : 2]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
      phase[i] = rand() * Math.PI * 2
    }
    return { base, scatter, colors, phase }
  }, [count])

  const live = useMemo(() => new Float32Array(reduced ? base : scatter), [base, scatter, reduced])

  // Free the GPU buffers/material on unmount (canvas tears down on Effects-off
  // and on Explorer/Recruiter mode switches).
  useEffect(() => () => {
    points.current?.geometry?.dispose()
    mat.current?.dispose()
  }, [])

  useFrame((state, delta) => {
    if (reduced || !points.current) return
    const d = Math.min(delta, 0.05)
    t0.current += d
    const t = t0.current
    const assemble = easeOutCubic(Math.min(1, t / 2.2))
    const disperse = scrollFactor()
    const expand = 1 + disperse * 0.9

    // Cursor position in the field's OWN local space (accurate through every
    // parent rotation), so the parting/swirl tracks the pointer on screen.
    ptr.set(state.pointer.x * state.viewport.width / 2, state.pointer.y * state.viewport.height / 2, 0)
    points.current.worldToLocal(ptr)
    const R = 2.4, R2 = R * R, PUSH = 1.5 * (1 - disperse)

    const arr = points.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const ph = phase[i]
      const dx = Math.sin(t * 0.28 + ph) * 0.07 * assemble
      const dy = Math.cos(t * 0.22 + ph * 1.3) * 0.07 * assemble
      const dz = Math.sin(t * 0.25 + ph * 0.7) * 0.07 * assemble
      let tx = (scatter[ix] + (base[ix] - scatter[ix]) * assemble + dx) * expand
      let ty = (scatter[ix + 1] + (base[ix + 1] - scatter[ix + 1]) * assemble + dy) * expand
      const tz = (scatter[ix + 2] + (base[ix + 2] - scatter[ix + 2]) * assemble + dz) * expand
      // Repel + swirl near the cursor.
      const ux = tx - ptr.x, uy = ty - ptr.y
      const dd = ux * ux + uy * uy
      if (dd < R2) {
        const dist = Math.sqrt(dd) || 1e-3
        const f = (1 - dist / R) * PUSH
        tx += (ux / dist) * f - (uy / dist) * f * 0.5
        ty += (uy / dist) * f + (ux / dist) * f * 0.5
      }
      arr[ix] += (tx - arr[ix]) * 0.12
      arr[ix + 1] += (ty - arr[ix + 1]) * 0.12
      arr[ix + 2] += (tz - arr[ix + 2]) * 0.12
    }
    points.current.geometry.attributes.position.needsUpdate = true
    // Bounded sway (no accumulating spin) keeps the cursor mapping stable.
    points.current.rotation.y = Math.sin(t * 0.06) * 0.2
    points.current.rotation.x = Math.sin(t * 0.05) * 0.05
    if (mat.current) {
      const breathe = 1 + Math.sin(t * 0.5) * 0.07
      mat.current.opacity = (0.5 + 0.35 * assemble) * breathe * (1 - disperse * 0.85)
    }
  })

  return (
    // Keyed on `reduced` so the position buffer is rebuilt (not stale) if the
    // motion preference flips while the canvas is mounted.
    <points ref={points} key={reduced ? 'reduced' : 'motion'}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[live, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.055}
        vertexColors
        transparent
        opacity={reduced ? 0.8 : 0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Core({ reduced }) {
  const group = useRef()
  const matRef = useRef()
  const t0 = useRef(0)
  const wp = useMemo(() => new THREE.Vector3(), [])
  const ptr = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, delta) => {
    if (reduced || !group.current) return
    t0.current += Math.min(delta, 0.05)
    const t = t0.current
    const intro = easeOutCubic(Math.min(1, t / 2.0))

    // Pointer proximity → the core brightens and swells slightly as you approach.
    ptr.set(state.pointer.x * state.viewport.width / 2, state.pointer.y * state.viewport.height / 2, 0)
    group.current.getWorldPosition(wp)
    const near = Math.max(0, 1 - Math.hypot(ptr.x - wp.x, ptr.y - wp.y) / 4.5)

    const s = (0.55 + 0.45 * intro) * (1 - scrollFactor() * 0.32) * (1 + near * 0.06)
    group.current.scale.setScalar(s)
    group.current.rotation.y = Math.sin(t * 0.12) * 0.4 + t * 0.03
    if (matRef.current) matRef.current.emissiveIntensity = 0.5 + near * 0.8
  })
  return (
    <group ref={group} position={[1.15, 0.25, 0]} scale={reduced ? 1 : 0.55}>
      <Float speed={reduced ? 0 : 0.7} rotationIntensity={reduced ? 0 : 0.3} floatIntensity={reduced ? 0 : 0.5}>
        <Icosahedron args={[1.6, 4]}>
          <MeshDistortMaterial
            ref={matRef}
            color="#5a4a33"
            emissive={OAT}
            emissiveIntensity={0.6}
            roughness={0.35}
            metalness={0.6}
            distort={reduced ? 0 : 0.3}
            speed={reduced ? 0 : 0.9}
          />
        </Icosahedron>
        <Icosahedron args={[2.05, 1]}>
          <meshBasicMaterial color={OAT} wireframe transparent opacity={0.12} />
        </Icosahedron>
      </Float>
    </group>
  )
}

function Rig({ reduced }) {
  const group = useRef()
  useFrame((state) => {
    if (reduced || !group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y += (x * 0.2 - group.current.rotation.y) * 0.02
    group.current.rotation.x += (-y * 0.14 - group.current.rotation.x) * 0.02
  })
  return (
    <group ref={group}>
      <Core reduced={reduced} />
      <Constellation reduced={reduced} />
    </group>
  )
}

function Dolly({ reduced }) {
  const { camera } = useThree()
  useFrame(() => {
    if (reduced) return
    camera.position.z += (6.5 + scrollFactor() * 3.2 - camera.position.z) * 0.05
  })
  return null
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

export default function HeroScene() {
  const reduced = useReducedMotion()
  const reducedEffects = useReducedEffects()
  const wrap = useRef(null)
  const [onScreen, setOnScreen] = useState(true)
  const [hiQ, setHiQ] = useState(true)
  const [mounted, setMounted] = useState(false)

  const allow3D = useMemo(() => webglAvailable() && !saveDataOn() && !reducedEffects, [reducedEffects])

  useEffect(() => {
    if (!allow3D) { setMounted(false); return }
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
    const cic = window.cancelIdleCallback || clearTimeout
    const id = ric(() => setMounted(true), { timeout: 1500 })
    return () => cic(id)
  }, [allow3D])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const frameloop = reduced ? 'demand' : onScreen ? 'always' : 'never'

  return (
    <div className="hero-scene" aria-hidden="true" ref={wrap}>
      <div className="hero-poster" />
      {allow3D && mounted && (
        <SceneBoundary>
          <Canvas
            className="hero-canvas"
            dpr={1.5}
            camera={{ position: [0, 0, 6.5], fov: 45 }}
            frameloop={frameloop}
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          >
            <fog attach="fog" args={[BG, 7, 15]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[4, 3, 5]} intensity={55} color={OAT} />
            <pointLight position={[-5, -2, 2]} intensity={28} color={SAGE} />
            <pointLight position={[2.5, 1.5, 2.5]} intensity={20} color={INKBLUE} />
            {!reduced && <Quality onBloom={setHiQ} />}
            <Rig reduced={reduced} />
            <Dolly reduced={reduced} />
            {hiQ && (
              <EffectComposer disableNormalPass multisampling={0}>
                <Bloom intensity={0.7} luminanceThreshold={0.22} luminanceSmoothing={0.5} mipmapBlur radius={0.6} />
                <ChromaticAberration offset={[0.0009, 0.0012]} radialModulation={false} />
                <Vignette eskil={false} offset={0.28} darkness={0.62} />
                <Noise opacity={0.035} premultiply />
              </EffectComposer>
            )}
          </Canvas>
        </SceneBoundary>
      )}
    </div>
  )
}
