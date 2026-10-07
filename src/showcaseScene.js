// The showcase object, in plain three.js (no R3F): a faceted bronze core, a
// counter-rotating oat wireframe shell, and a cream particle halo, lit warm.
// Lazy-loaded by Showcase.jsx only when its section is about to scroll in, so
// three.js never lands in the main bundle. The caller owns the rAF loop and
// hands every frame its scroll progress + velocity; this module just draws.
import * as THREE from 'three'

// Equirect gradient run through PMREM so the metal reflects warm brass light
// instead of a studio HDRI (which would cost a large download).
function warmEnvironment(renderer) {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#efe3c8')
  g.addColorStop(0.3, '#cba479')
  g.addColorStop(0.5, '#bca47a')
  g.addColorStop(0.62, '#4a3a28')
  g.addColorStop(1, '#1a1612')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  try {
    // Keep the render target, not just its .texture: disposing the texture
    // alone leaves the target's framebuffer allocated on the GPU.
    return pmrem.fromEquirectangular(tex)
  } finally {
    tex.dispose()
    pmrem.dispose()
  }
}

// Throws if a WebGL context cannot be created -- the caller falls back to the
// static grid. Per-frame motion is scaled by elapsed time, so the object turns
// at the same speed on 60Hz and 144Hz screens.
export function createShowcaseScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 5.1)

  let envTarget = null
  try { envTarget = warmEnvironment(renderer); scene.environment = envTarget.texture } catch { /* falls back to lights only */ }

  const group = new THREE.Group()
  scene.add(group)

  const coreGeo = new THREE.IcosahedronGeometry(1.15, 0)
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, metalness: 1, roughness: 0.18, flatShading: true })
  group.add(new THREE.Mesh(coreGeo, coreMat))

  const shellSrc = new THREE.IcosahedronGeometry(1.62, 1)
  const shellGeo = new THREE.EdgesGeometry(shellSrc)
  shellSrc.dispose()
  const shellMat = new THREE.LineBasicMaterial({ color: 0xbca47a, transparent: true, opacity: 0.32 })
  const shell = new THREE.LineSegments(shellGeo, shellMat)
  group.add(shell)

  const N = 700
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const r = 2.3 + Math.random() * 1.7
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    pos[i * 3 + 2] = r * Math.cos(ph)
  }
  const ptsGeo = new THREE.BufferGeometry()
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  // round sprite so the halo reads as dust, not square pixels
  const dot = document.createElement('canvas')
  dot.width = dot.height = 32
  const dctx = dot.getContext('2d')
  const dg = dctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  dg.addColorStop(0, 'rgba(255,255,255,1)')
  dg.addColorStop(0.5, 'rgba(255,255,255,.6)')
  dg.addColorStop(1, 'rgba(255,255,255,0)')
  dctx.fillStyle = dg
  dctx.fillRect(0, 0, 32, 32)
  const dotTex = new THREE.CanvasTexture(dot)
  const ptsMat = new THREE.PointsMaterial({ color: 0xefe3c8, size: 0.03, map: dotTex, transparent: true, opacity: 0.6, depthWrite: false })
  const pts = new THREE.Points(ptsGeo, ptsMat)
  scene.add(pts)

  // decay 0 keeps the classic (non-physical) falloff these intensities assume
  scene.add(new THREE.AmbientLight(0xffffff, 0.35))
  const lights = [
    [0xbca47a, 1.5, [4, 3, 4]],     // oat
    [0xcba479, 1.2, [-4, -2, 3]],   // honey
    [0x8a9d84, 0.8, [0, 4, -3]],    // sage -- the one quiet sage light
  ]
  lights.forEach(([c, i, p]) => { const l = new THREE.PointLight(c, i, 0, 0); l.position.set(...p); scene.add(l) })
  const key = new THREE.DirectionalLight(0xffffff, 0.5)
  key.position.set(2, 4, 5)
  scene.add(key)

  let t = 0, spin = 0, tx = 0, ty = 0, lw = 0, lh = 0

  return {
    resize(w, h) {
      if (!w || !h || (w === lw && h === lh)) return
      lw = w; lh = h
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    // p: 0..1 progress through the pinned section; nv: 0..1 scroll speed;
    // mx/my: pointer offset from centre, -0.5..0.5; f: elapsed time in
    // 60fps frames (1 at 60Hz, ~0.42 at 144Hz).
    frame(p, nv, mx, my, f = 1) {
      t += 0.004 * f
      spin += nv * 0.55 * f                   // momentum: spins up, settles when idle
      const k = 1 - Math.pow(1 - 0.06, f)     // frame-rate independent lerp
      tx += (my * 0.4 - tx) * k
      ty += (mx * 0.6 - ty) * k
      group.rotation.y = p * Math.PI * 4 + t + ty + spin
      group.rotation.x = Math.sin(p * Math.PI) * 0.35 + tx
      shell.rotation.y = -t * 1.6 - spin * 0.6
      shell.rotation.x = t * 0.7
      pts.rotation.y = t * 0.3 + spin * 0.3
      pts.rotation.x = -t * 0.15
      camera.position.z = 5.1 - p * 0.55
      const fov = 45 + nv * 12               // velocity tunnel-warp
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }
      ptsMat.size = 0.03 + nv * 0.03
      renderer.render(scene, camera)
    },
    dispose() {
      ;[coreGeo, shellGeo, ptsGeo].forEach(g => g.dispose())
      ;[coreMat, shellMat, ptsMat].forEach(m => m.dispose())
      dotTex.dispose()
      envTarget?.dispose()
      renderer.dispose()
    },
  }
}
