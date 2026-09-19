/**
 * Liquid Glass Infinity — embeddable module.
 *
 *   import { createInfinityGlass } from './infinity-glass.js';
 *   const piece = await createInfinityGlass({ container: el });
 *   // ... later
 *   piece.dispose();
 *
 * Owns only the canvas inside `container`. No global CSS, no window-level
 * side effects that survive dispose(). See README for the React wrapper.
 */
import * as THREE from 'three';
import { A, B, R0, makeCurve, radiusAt, buildTube } from './ig-geometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export const DEFAULT_PALETTE = {
  bg:      '#2c2620',   // page ground
  card:    '#3a342c',   // lifted surface
  paper:   '#efe3c8',   // warm cream
  accent:  '#bca47a',   // warm oat — the voice colour
  warm:    '#cba479',
  sage:    '#8a9d84',   // quiet
  inkblue: '#6b8aa8',   // rare
};

export async function createInfinityGlass(opts = {}) {
  // Anything allocated before the API exists is registered here, so a throw
  // part-way through initialisation still releases GPU resources instead of
  // leaking a renderer and a canvas into the page.
  const _born = [];
  const own = r => { _born.push(r); return r; };
  const abort = () => {
    for (let i = _born.length - 1; i >= 0; i--) {
      try { _born[i].dispose ? _born[i].dispose() : _born[i](); } catch (e) { /* best effort */ }
    }
  };
  try {
    return await build(opts, own);
  } catch (e) {
    abort();
    throw e;
  }
}

async function build(opts, own) {
  const {
    container,
    palette: paletteIn = DEFAULT_PALETTE,
    particles = 1048576,
    autoQuality = true,
    bloom = true,
    // 'reveal' — hovering lights up the graticule and surface sparkles.
    // 'shatter' — the cursor is a damage brush and the glass breaks.
    mode = 'reveal',
    reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches,
    onProgress = null,
  } = opts;

  if (!container) throw new Error('createInfinityGlass: `container` is required');

  const C = {};
  for (const k of Object.keys(DEFAULT_PALETTE)) {
    C[k] = new THREE.Color(paletteIn[k] || DEFAULT_PALETTE[k]);
  }

  const MAX_PARTICLES = 1048576;   // hard ceiling of the design
  const TIERS = [
    { label: '1M', n: MAX_PARTICLES },
    { label: '400K', n: 400000 },
    { label: '150K', n: 150000 },
  ];
  // Allocate to the ceiling the caller asked for. Previously every quality
  // setting still allocated and sampled a full million (~20MiB of attributes)
  // and setTier only narrowed the draw range, so "150K" cost the same to start.
  let start = TIERS.findIndex(t => t.n <= particles);
  if (start < 0) start = TIERS.length - 1;
  const AVAIL = TIERS.slice(start);      // can only step coarser than the cap
  const CAP = AVAIL[0].n;
  let tier = 0;

  /* ── shard grid ────────────────────────────────────────────────────────
     Breakage is per-shard state, so shards need stable IDs derivable from a
     position. A hashed-to-N-slots scheme would collide and break distant
     cells together, so this is a plain bounded 3D grid flattened into a
     160x160 texture. Boundaries are then warped by fractureWarp() on the GPU,
     which is what stops breaks looking like voxels. */
  const K = 13.0;
  const GMIN = [-22, -13, -9];
  const GDIM = [44, 26, 18];
  const TEX = 160;

  const slotOf = (cx, cy, cz) => {
    const x = Math.min(GDIM[0] - 1, Math.max(0, cx - GMIN[0]));
    const y = Math.min(GDIM[1] - 1, Math.max(0, cy - GMIN[1]));
    const z = Math.min(GDIM[2] - 1, Math.max(0, cz - GMIN[2]));
    return x + GDIM[0] * (y + GDIM[1] * z);
  };

  // feel. Reduced motion keeps the interaction but takes the travel out of it.
  const BRUSH = 0.34;
  const GRAVITY = reducedMotion ? -0.55 : -1.75;
  const DRAG = reducedMotion ? 1.9 : 0.95;
  const FADE = 0.16;              // glass<->particle crossfade, seconds
  // PER-SHARD lifecycle, not global. Each piece knits back on its own clock,
  // measured from when IT broke — so the trail re-forms behind the cursor
  // while you are still carving ahead. Previously nothing restored until the
  // cursor left the form entirely, which made the whole model feel latched.
  // Reveal mode paints touch-times into the same shard grid, so the cursor
  // leaves a WAKE that decays behind it instead of a static pool that
  // simply follows. That trail is what makes the interaction feel alive.
  const REVEAL_R = 0.42;          // paint radius
  const REVEAL_FADE = 2.10;       // how long a touched patch stays lit
  let HOLD = 0.85;                // how long a piece stays broken
  const HEAL_DUR = 0.60;          // the knit-back itself
  const LIFETIME = () => HOLD + HEAL_DUR;
  const DRIFT = reducedMotion ? 0 : 1;

  const report = (msg, pct) => { if (onProgress) onProgress(msg, pct); };
  const yieldFrame = () =>
    new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

  /* ── renderer ──────────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // lower than before: bloom adds its own light back on top
  renderer.toneMappingExposure = 1.02;
  own(renderer);
  own(() => { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); });
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  // the canvas is the whole interaction, so it needs to announce itself
  // Operable, not just decorative: focusable and described, with the key
  // bindings announced rather than left to discovery.
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label',
    'Interactive glass infinity sculpture. Use the arrow keys to move a '
    + 'pointer across its surface and light up the latitude and longitude '
    + 'lines. Press Enter or Space to pulse, Escape to stop.');
  canvas.style.outline = 'none';
  container.appendChild(canvas);

  const sizeOf = () => {
    const r = container.getBoundingClientRect();
    return { w: Math.max(1, r.width | 0), h: Math.max(1, r.height | 0) };
  };
  let { w: VW, h: VH } = sizeOf();
  renderer.setSize(VW, VH, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, VW / VH, 0.1, 100);
  camera.position.set(0, 0.28, 5.0);
  camera.lookAt(0, 0, 0);

  // Bloom. Without it specular highlights are just pale pixels and the debris
  // is flat dust — this is what makes glass edges burn and shards read as
  // catching the light. Threshold is high so only true highlights bloom and
  // the body stays crisp rather than hazy.
  let composer = null;
  if (bloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(VW, VH), 0.62 /* strength */, 0.42 /* radius */, 0.78 /* threshold */));
    composer.addPass(new OutputPass());
    composer.setSize(VW, VH);
  }

  /* ── backdrop: the surface the glass actually refracts ─────────────── */
  const backdropMat = new THREE.ShaderMaterial({
    uniforms: {
      uAccent: { value: C.accent }, uWarm: { value: C.warm },
      uPaper: { value: C.paper }, uSage: { value: C.sage },
      uBg: { value: C.bg }, uCard: { value: C.card },
      uAspect: { value: 1 },
      // The backdrop plane was enlarged so the orbiting camera can never
      // see its edge. Its falloffs are in UV space, so without this the
      // warm pool and the grid scale up with the plane and flood the view.
      uSpread: { value: 2.4 },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    ].join('\n'),
    fragmentShader: [
      'varying vec2 vUv;',
      'uniform vec3 uAccent, uWarm, uPaper, uSage, uBg, uCard;',
      'uniform float uAspect, uSpread;',
      'void main(){',
      '  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);',
      '  float g = dot(normalize(vec2(1.0,-1.0)), p) * 0.85 + 0.5;',
      '  // NOTE: these values are LINEAR and are tone-mapped + sRGB-encoded',
      '  // downstream by OutputPass. A raw ShaderMaterial skips the chunks a',
      '  // built-in material gets, so pre-composer these went to the canvas',
      '  // unconverted and had been over-brightened to compensate.',
      '  vec3 col = mix(uCard * 0.13, uAccent * 0.07, clamp(g, 0.0, 1.0));',
      '  col = mix(col, uSage * 0.05, smoothstep(0.62, 1.0, g) * 0.5);',
      '  // Contained warm pool behind the form. It was briefly cranked up to',
      '  // push light THROUGH the body, but a tube this thick transmits almost',
      '  // nothing — so a bright pool only washed out the dark editorial ground',
      '  // and bought no refraction. The glow now comes from the Fresnel rim.',
      '  float r = length(p * vec2(1.0, 1.45)) * uSpread;',
      '  col += uPaper  * 0.26 * exp(-r * 4.0);',
      '  col += uAccent * 0.22 * exp(-r * 2.4);',
      '  col += uWarm   * 0.07 * exp(-r * 1.4);',
      '  // Editorial hairline grid. Not decoration: glass only reads as glass',
      '  // when something STRUCTURED bends through it.',
      '  vec2 q = p * 7.0 * uSpread;',
      '  vec2 fw = abs(fract(q) - 0.5) / max(fwidth(q), 1e-5);',
      '  float rule = 1.0 - min(min(fw.x, fw.y), 1.0);',
      '  col += uPaper * rule * 0.14 * exp(-r * 2.0);',
      '  col = mix(uBg * 0.10, col, smoothstep(1.24, 0.10, r));',
      '  float d = fract(sin(dot(vUv, vec2(12.9898,78.233))) * 43758.5453);',
      '  gl_FragColor = vec4(col + (d - 0.5) / 255.0, 1.0);',
      '}',
    ].join('\n'),
    depthWrite: true,
  });
  const backdropGeo = new THREE.PlaneGeometry(1, 1);
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.position.z = -6.2;
  scene.add(backdrop);

  // The form spans about 3.2 x 2.0 units. On a narrow or portrait viewport a
  // fixed distance cropped it, so pull back to whatever actually fits.
  const FIT_W = 1.75, FIT_H = 1.05;
  let CAM_Z = 5.0;
  function fitCamera() {
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const dV = FIT_H / Math.tan(half);
    const dH = FIT_W / (Math.tan(half) * camera.aspect);
    CAM_Z = Math.max(4.6, Math.max(dV, dH) * 1.12);
  }
  fitCamera();
  function fitBackdrop() {
    // sized against the BASE camera z, with generous margin, because the
    // camera now orbits and must never reveal the plane's edge
    const d = CAM_Z - backdrop.position.z;
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
    backdrop.scale.set(h * camera.aspect * 2.6, h * 2.6, 1);
    backdropMat.uniforms.uAspect.value = camera.aspect;
  }
  fitBackdrop();
  camera.position.z = CAM_Z;
  camera.lookAt(0, 0.02, 0);

  /* ── environment: warm mid-dark with bright strip lights ───────────── */
  function buildEnvTexture() {
    const w = 1024, h = 512;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d');
    // Cool, clean key from above; warmth kept low in the scene so it tints
    // the underside rather than soaking the whole body. Oat now reads as an
    // accent on edges and in the dispersion, not as the body colour.
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#eef1f6');   // cool white key, top only
    g.addColorStop(0.17, '#93918d');
    g.addColorStop(0.44, '#6b5a3e');   // oat keeps the body warm
    g.addColorStop(0.74, '#3b2f20');
    g.addColorStop(1.00, '#14100b');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const bar = (cx, cy, rw, rh, a) => {
      const m = Math.max(rw, rh);
      const rg = x.createRadialGradient(0, 0, 0, 0, 0, m);
      rg.addColorStop(0.0, 'rgba(255,253,250,' + a + ')');
      rg.addColorStop(0.55, 'rgba(238,244,255,' + (a * 0.34) + ')');
      rg.addColorStop(1.0, 'rgba(238,244,255,0)');
      x.save(); x.translate(cx, cy); x.scale(rw / m, rh / m);
      x.fillStyle = rg; x.fillRect(-m, -m, m * 2, m * 2); x.restore();
    };
    // tighter and hotter: crisp glints rather than broad soft sheen
    bar(w * 0.23, h * 0.15, w * 0.20, h * 0.045, 1.00);
    bar(w * 0.69, h * 0.26, w * 0.11, h * 0.024, 1.00);
    bar(w * 0.45, h * 0.73, w * 0.24, h * 0.022, 0.62);
    bar(w * 0.88, h * 0.52, w * 0.07, h * 0.018, 0.80);
    const tex = new THREE.Texture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envSrc = buildEnvTexture();
  const envRT = pmrem.fromEquirectangular(envSrc);
  scene.environment = envRT.texture;
  envSrc.dispose();
  pmrem.dispose();

  /* ── geometry (see ig-geometry.js) ─────────────────────────────────── */
  const curve = makeCurve();

  /* ── shard state texture ───────────────────────────────────────────── */
  // R = release time (-1 intact), G = heal start (-1 none),
  // B = impulse azimuth, A = impulse elevation.
  const shardData = new Float32Array(TEX * TEX * 4);
  for (let i = 0; i < TEX * TEX; i++) { shardData[i * 4] = -1; shardData[i * 4 + 1] = -1; }
  const shardTex = new THREE.DataTexture(shardData, TEX, TEX, THREE.RGBAFormat, THREE.FloatType);
  shardTex.magFilter = shardTex.minFilter = THREE.NearestFilter;
  shardTex.needsUpdate = true;

  const SHARD_GLSL = [
    'uniform sampler2D uShard;',
    'const float K = ' + K.toFixed(1) + ';',
    'const vec3 GMIN = vec3(' + GMIN.join('.0, ') + '.0);',
    'const vec3 GDIM = vec3(' + GDIM.join('.0, ') + '.0);',
    'const float TEX = ' + TEX.toFixed(1) + ';',
    'float slotOf(vec3 p){',
    '  vec3 c = clamp(floor(p * K) - GMIN, vec3(0.0), GDIM - 1.0);',
    '  return c.x + GDIM.x * (c.y + GDIM.y * c.z);',
    '}',
    '// Organic fracture boundary. Quantising raw position makes breaks follow',
    '// axis-aligned cube faces, which reads as voxels. Warping position BEFORE',
    '// quantising bends those boundaries onto a wavy contour instead.',
    '// Sum-of-sines rather than value noise: 6 sin ops versus ~48, and this',
    '// runs per-vertex across a million points.',
    'vec3 fractureWarp(vec3 p){',
    '  return vec3(',
    '    sin(p.y*23.0 + p.z*17.0) + 0.55*sin(p.z*47.0 - p.x*41.0),',
    '    sin(p.z*19.0 + p.x*29.0) + 0.55*sin(p.x*53.0 - p.y*43.0),',
    '    sin(p.x*21.0 + p.y*25.0) + 0.55*sin(p.y*51.0 - p.z*37.0)) * 0.034;',
    '}',
    '// Both the glass and the particles use THIS, computed on the GPU from',
    '// position. Precomputing the shard id on the CPU would desynchronise: a',
    '// few-ULP difference between JS double sin() and GLSL float sin() flips',
    '// floor() near boundaries and leaves stray specks.',
    'float slotOfW(vec3 p){ return slotOf(p + fractureWarp(p)); }',
    'vec4 shardAt(float slot){',
    '  float x = mod(slot, TEX), y = floor(slot / TEX);',
    '  return texture2D(uShard, (vec2(x, y) + 0.5) / TEX);',
    '}',
    'float dh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }',
    '// Shared crossfade. 1 = solid glass, 0 = fully handed over to particles.',
    '// Both shaders call this so the handover is exactly complementary and',
    '// neither pops. Everything derives from the shard own release time, so a',
    '// piece restores on its own clock with no global state involved.',
    '// Reveal wake: 1 at the instant of touch, decaying to 0 over uRevealFade.',
    '// Holds briefly before falling so the trail has body rather than',
    '// evaporating the moment the cursor passes.',
    'float wakeOf(vec4 sd, float now, float fade){',
    '  if (sd.r < 0.0) return 0.0;',
    '  float a = clamp((now - sd.r) / fade, 0.0, 1.0);',
    '  return 1.0 - smoothstep(0.12, 1.0, a);',
    '}',
    'float healOf(vec4 sd, float now, float hold, float healDur){',
    '  if (sd.r < 0.0) return 0.0;',
    '  return clamp((now - sd.r - hold) / healDur, 0.0, 1.0);',
    '}',
    'float glassPresence(vec4 sd, float now, float fade, float hold, float healDur){',
    '  if (sd.r < 0.0) return 1.0;',
    '  float out_ = clamp((now - sd.r) / fade, 0.0, 1.0);',
    '  float back = smoothstep(0.30, 0.95, healOf(sd, now, hold, healDur));',
    '  return max(1.0 - out_, back);',
    '}',
  ].join('\n');

  const U = {
    uTime: { value: 0 },
    uShard: { value: shardTex },
    uLiquid: { value: 0.016 },
    uHealDur: { value: HEAL_DUR },
    uHold: { value: HOLD },
    uFade: { value: FADE },
    uRim: { value: new THREE.Color('#fbf7f2') },   // cool white edge
    uRimStrength: { value: 0.70 },
    // lat/long wireframe. Ink-blue is the palette's rare tertiary, lifted
    // toward cyan so it reads as instrumentation rather than decoration.
    uGrid: { value: new THREE.Color('#9fd4ff') },
    uGridStrength: { value: 1.75 },
    uGridN: { value: new THREE.Vector2(96, 12) },  // longitudes, latitudes
    // hover reveal: object-space cursor point, strength, radius
    uHoverPos: { value: new THREE.Vector3(999, 999, 999) },
    uHoverAmt: { value: 0 },
    uHoverR: { value: 0.95 },
    uRevealFade: { value: REVEAL_FADE },
    uMode: { value: mode === 'shatter' ? 1 : 0 },
    uEntryT: { value: -99 },   // when the cursor last LANDED on the form
    uSpeed: { value: 0 },      // smoothed cursor speed, 0..1
    // Reduced motion previously only stopped the camera and the debris.
    // Shader-level animation (liquid displacement, ripples, sweep, rim
    // breath, twinkle) kept running, which is most of the movement on
    // screen. uCalm stills all of it.
    uCalm: { value: reducedMotion ? 1 : 0 },
  };

  // THIN-WALLED, not solid. Rendered FrontSide with a thick body, a tube this
  // fat refracts so steeply that nothing legible survives the crossing — it
  // read as lustrous amber no matter how the lighting was tuned (verified:
  // zeroing transmission changed the image barely at all).
  //
  // DoubleSide + a near-zero thickness makes it a blown-glass shell: you see
  // the front wall, the backdrop through it, and the far wall behind that.
  // Light crosses two thin interfaces instead of 0.6 units of solid, so the
  // grid actually bends through and the body finally reads as glass.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.022,
    transmission: 1.0, thickness: 0.12, ior: 1.46,
    attenuationColor: C.paper.clone(), attenuationDistance: 3.2,
    clearcoat: 0.55, clearcoatRoughness: 0.02,
    iridescence: 0.30, iridescenceIOR: 1.34,
    envMapIntensity: 0.80, side: THREE.DoubleSide,
  });
  if ('dispersion' in glassMat) glassMat.dispersion = 0.40;
  // makes three declare `vUv`, which the wireframe below rides on. The tube's
  // own parameterisation is already exactly what's wanted: u runs along the
  // curve (longitudes), v around the cross-section (latitudes).
  // MERGE, never replace: MeshPhysicalMaterial ships { STANDARD, PHYSICAL },
  // and clobbering them drops `ior` from the material struct and breaks the
  // transmission chunk at compile time.
  glassMat.defines.USE_UV = '';

  const NOISE = [
    'float vh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }',
    'float vn(vec3 p){',
    '  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(mix(vh(i),vh(i+vec3(1,0,0)),f.x), mix(vh(i+vec3(0,1,0)),vh(i+vec3(1,1,0)),f.x), f.y),',
    '             mix(mix(vh(i+vec3(0,0,1)),vh(i+vec3(1,0,1)),f.x), mix(vh(i+vec3(0,1,1)),vh(i+vec3(1,1,1)),f.x), f.y), f.z);',
    '}',
  ].join('\n');

  glassMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>',
        '#include <common>\nuniform float uTime, uLiquid, uCalm;\nvarying vec3 vObj;\n' + NOISE)
      .replace('#include <begin_vertex>', [
        'vObj = position;',
        'float lq = vn(position * 2.4 + vec3(0.0, 0.0, uTime * 0.22 * (1.0 - uCalm))) - 0.5;',
        'vec3 transformed = position + normal * lq * uLiquid * (1.0 - uCalm);',
      ].join('\n'));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', [
        '#include <common>',
        'uniform float uTime, uHealDur, uHold, uFade, uRimStrength, uGridStrength;',
        'uniform float uHoverAmt, uHoverR, uRevealFade, uMode, uEntryT, uSpeed, uCalm;',
        'uniform vec3 uHoverPos;',
        'uniform vec3 uRim, uGrid;',
        'uniform vec2 uGridN;',
        'varying vec3 vObj;',
        SHARD_GLSL,
      ].join('\n'))
      // Fresnel rim. A solid tube this thick cannot show crisp background
      // detail through it — the refraction is far too steep — so it will always
      // read as a lustrous solid rather than a window. Bright turning edges are
      // the cue that actually says "glass", and bloom then makes them burn.
      .replace('#include <opaque_fragment>', [
        'float _f = 1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0);',
        '// slow breath along the rim, so the piece is alive at rest without',
        '// showing the graticule before you touch it',
        'float _br = 1.0 + 0.30 * (1.0 - uCalm) * sin(vUv.x * 6.2831 - uTime * 0.65);',
        'outgoingLight += uRim * pow(_f, 3.4) * uRimStrength * _br;',
        '{',
        '  // Latitude / longitude wireframe, straight off the tube UV.',
        '  // Derivative-based width so lines stay one pixel at any distance',
        '  // instead of aliasing into a moire as the camera orbits.',
        '  vec2 gq = vUv * uGridN;',
        '  vec2 gw = abs(fract(gq) - 0.5) / max(fwidth(gq), 1e-5);',
        '  float minor = max(1.0 - min(gw.x, 1.0), 1.0 - min(gw.y, 1.0));',
        '  // Majors drawn as their own WIDER line field rather than a step()',
        '  // multiplier, which was too subtle to read as hierarchy at all.',
        '  vec2 mq = vUv * uGridN / vec2(8.0, 4.0);',
        '  vec2 mw = abs(fract(mq) - 0.5) / max(fwidth(mq), 1e-5);',
        '  float major = max(1.0 - min(mw.x * 0.45, 1.0), 1.0 - min(mw.y * 0.45, 1.0));',
        '  float ln = minor * 0.42 + major * 1.50;',
        '  // a slow scan travelling along the form',
        '  float sweep = mix(0.62 + 0.55 * sin(vUv.x * 18.85 - uTime * 1.15), 1.0, uCalm);',
        '  // brighter where the surface turns away, like a rim readout',
        '  // Three layers: a decaying WAKE painted into the grid as the cursor',
        '  // moves, a bright HEAD at the contact point, and RIPPLES radiating',
        '  // out from it. The old version was a static pool that just faded.',
        '  float wake = wakeOf(shardAt(slotOfW(vObj)), uTime, uRevealFade);',
        '  float dc = distance(vObj, uHoverPos);',
        '  float head = uHoverAmt * (1.0 - smoothstep(0.06, uHoverR * 0.55, dc));',
        '  // Envelope so rings decay outward instead of standing still, and',
        '  // amplitude that grows with how fast the cursor is moving.',
        '  float ripple = 0.70 + (1.0 - uCalm) * (0.30 + 0.46 * uSpeed)',
        '                 * sin(dc * 20.0 - uTime * 6.0) * exp(-dc * 1.25);',
        '  // Entry flare: a ring that expands from the point where the cursor',
        '  // first LANDED, so arriving on the form is an event.',
        '  float et = uTime - uEntryT;',
        '  // calm: a plain fade at the contact point, no expanding ring',
        '  float ring = mix(exp(-et * 3.8) * exp(-pow((dc - et * 2.2) / 0.11, 2.0)),',
        '                   exp(-et * 3.0) * (1.0 - smoothstep(0.0, 0.35, dc)), uCalm);',
        '  float hv = max(max(wake * ripple, head), ring * 1.4);',
        '  outgoingLight += uGrid * ln * uGridStrength * sweep * (0.45 + 0.9 * _f) * hv;',
        '  // the contact point itself blooms',
        '  outgoingLight += uGrid * head * head * 0.55;',
        '}',
        '#include <opaque_fragment>',
      ].join('\n'))
      .replace('#include <clipping_planes_fragment>', [
        '#include <clipping_planes_fragment>',
        'if (uMode > 0.5) {',
        '  // Dissolve rather than cut. A binary discard popped the surface out',
        '  // in one frame; thresholding a STABLE per-position hash against the',
        '  // crossfade makes the glass crumble away and re-knit smoothly.',
        '  // SHATTER ONLY: reveal mode paints touch times into the same R',
        '  // channel, and without this gate the glass dissolved along the',
        '  // hover trail as though it had been broken.',
        '  float solid = glassPresence(shardAt(slotOfW(vObj)), uTime, uFade, uHold, uHealDur);',
        '  if (solid < 0.999 && dh(floor(vObj * 300.0)) > solid) discard;',
        '}',
      ].join('\n'));
  };

  const glassGeo = own(buildTube(curve, 1024, 48));
  const glass = new THREE.Mesh(glassGeo, glassMat);
  scene.add(glass);

  const proxyGeo = own(buildTube(curve, 220, 16));
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const proxy = new THREE.Mesh(proxyGeo, proxyMat);
  scene.add(proxy);

  /* ── sample the points ─────────────────────────────────────────────── */
  report('Sampling surface', 18);
  await yieldFrame();

  const SEG = 2048;
  const cp = new Float32Array((SEG + 1) * 3), cn = new Float32Array((SEG + 1) * 3),
        cb = new Float32Array((SEG + 1) * 3), cr = new Float32Array(SEG + 1);
  {
    const fr = curve.computeFrenetFrames(SEG, true), P = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      curve.getPointAt(i / SEG, P);
      cp[i * 3] = P.x; cp[i * 3 + 1] = P.y; cp[i * 3 + 2] = P.z;
      const N = fr.normals[i], Bn = fr.binormals[i];
      cn[i * 3] = N.x; cn[i * 3 + 1] = N.y; cn[i * 3 + 2] = N.z;
      cb[i * 3] = Bn.x; cb[i * 3 + 1] = Bn.y; cb[i * 3 + 2] = Bn.z;
      cr[i] = radiusAt(P);
    }
  }

  // Shard identity is derived on the GPU from position, so no aShard/aLocal
  // attributes are needed — 16MB of buffers and a second pass over a million
  // points both disappear.
  const home = new Float32Array(CAP * 3);
  const aSeed = new Float32Array(CAP);
  const aU = new Float32Array(CAP);
  const cnt = new Uint32Array(TEX * TEX);

  for (let i = 0; i < CAP; i++) {
    const f = Math.random() * SEG, si = f | 0, t = f - si, s2 = si + 1;
    const px = cp[si * 3] + (cp[s2 * 3] - cp[si * 3]) * t,
          py = cp[si * 3 + 1] + (cp[s2 * 3 + 1] - cp[si * 3 + 1]) * t,
          pz = cp[si * 3 + 2] + (cp[s2 * 3 + 2] - cp[si * 3 + 2]) * t;
    const nx = cn[si * 3] + (cn[s2 * 3] - cn[si * 3]) * t,
          ny = cn[si * 3 + 1] + (cn[s2 * 3 + 1] - cn[si * 3 + 1]) * t,
          nz = cn[si * 3 + 2] + (cn[s2 * 3 + 2] - cn[si * 3 + 2]) * t;
    const bx = cb[si * 3] + (cb[s2 * 3] - cb[si * 3]) * t,
          by = cb[si * 3 + 1] + (cb[s2 * 3 + 1] - cb[si * 3 + 1]) * t,
          bz = cb[si * 3 + 2] + (cb[s2 * 3 + 2] - cb[si * 3 + 2]) * t;
    const a = Math.random() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const rr = (cr[si] + (cr[s2] - cr[si]) * t) * (0.72 + 0.28 * Math.sqrt(Math.random()));
    const hx = px + (nx * ca + bx * sa) * rr,
          hy = py + (ny * ca + by * sa) * rr,
          hz = pz + (nz * ca + bz * sa) * rr;
    home[i * 3] = hx; home[i * 3 + 1] = hy; home[i * 3 + 2] = hz;
    cnt[slotOf(Math.floor(hx * K), Math.floor(hy * K), Math.floor(hz * K))]++;
    aSeed[i] = Math.random();
    aU[i] = f / SEG;
    if ((i & 0x3FFFF) === 0) {
      report('Sampling surface', 18 + 60 * (i / CAP));
      await yieldFrame();
    }
  }

  let occupied = 0;
  for (let s = 0; s < TEX * TEX; s++) if (cnt[s]) occupied++;

  report('Uploading', 84);
  await yieldFrame();

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(home, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  pGeo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

  const pUni = {
    uTime: { value: 0 }, uScale: { value: 600 }, uSize: { value: 0.0125 },
    uShard: { value: shardTex },
    uGravity: { value: GRAVITY }, uDrag: { value: DRAG },
    uHealDur: { value: HEAL_DUR }, uHold: { value: HOLD }, uFade: { value: FADE },
    uPaper: { value: C.paper }, uAccent: { value: C.accent },
    uWarm: { value: C.warm }, uSage: { value: C.sage },
    uInkBlue: { value: C.inkblue },
    uDebug: { value: 0 }, uAge: { value: -1 },
    uMode: { value: mode === 'shatter' ? 1 : 0 },
    uHoverPos: { value: U.uHoverPos.value },
    uHoverAmt: { value: 0 }, uHoverR: { value: 0.95 },
    uRevealFade: { value: REVEAL_FADE },
    uEntryT: { value: -99 }, uSpeed: { value: 0 },
    uCalm: { value: reducedMotion ? 1 : 0 },
  };

  const pMat = new THREE.ShaderMaterial({
    uniforms: pUni,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute float aSeed, aU;',
      'uniform float uTime, uScale, uSize, uGravity, uDrag, uHealDur, uHold, uFade, uDebug, uAge;',
      'uniform float uMode, uHoverAmt, uHoverR, uRevealFade, uEntryT, uSpeed, uCalm;',
      'uniform vec3 uHoverPos;',
      'uniform vec3 uPaper, uAccent, uWarm, uSage, uInkBlue;',
      'varying vec3 vCol; varying float vA;',
      SHARD_GLSL,
      'vec3 hash33(vec3 p){',
      '  p = fract(p * vec3(0.1031, 0.1030, 0.0973));',
      '  p += dot(p, p.yxz + 33.33);',
      '  return fract((p.xxy + p.yxx) * p.zyx);',
      '}',
      '// Rodrigues rotation, for tumbling a shard about its own centre',
      'vec3 rot(vec3 v, vec3 axis, float a){',
      '  float c = cos(a), s = sin(a);',
      '  return v*c + cross(axis, v)*s + axis*dot(axis, v)*(1.0 - c);',
      '}',
      '',
      'void main(){',
      '  vec3 home = position;',
      '',
      '  if (uMode < 0.5) {',
      '    // REVEAL MODE. Points stay on the surface and glitter where the',
      '    // cursor is, instead of being thrown off as debris. Only a sparse',
      '    // subset twinkles — glittering all million reads as fog, not sparkle.',
      '    // Sparkles are BORN where the cursor just touched and die along',
      '    // the trail, instead of twinkling uniformly inside a moving disc.',
      '    vec3 pwr = home + fractureWarp(home);',
      '    vec4 sdr = shardAt(slotOf(pwr));',
      '    float wake = wakeOf(sdr, uTime, uRevealFade);',
      '    float birth = sdr.r >= 0.0 ? (uTime - sdr.r) : 99.0;',
      '    float flash = exp(-birth * 5.5);            // hot at the instant',
      '    float near = 1.0 - smoothstep(0.08, uHoverR * 0.6,',
      '                                  distance(home, uHoverPos));',
      '    // Density follows the wake: thick right where you are touching,',
      '    // thinning out along the tail, instead of one flat 12% everywhere.',
      '    // 20% at the head merged into a solid smear. Sparse enough that',
      '    // individual points stay legible as points.',
      '    float thr = mix(0.990, 0.912, max(wake, uHoverAmt * near));',
      '    float pick = step(thr, aSeed);',
      '    float rate = mix(2.5, 9.0, fract(aSeed * 17.31));',
      '    float tw = pow(max(0.0, sin(uTime * rate + aSeed * 41.0)), 14.0);',
      '    tw = max(tw, flash);                             // burst overrides',
      '    // moving fast reads as more energetic than drifting slowly',
      '    tw *= 1.0 + 0.85 * uSpeed;',
      '    // calm: steady points, no flashing',
      '    tw = mix(tw, 0.62, uCalm);',
      '    // entry flare lights the whole contact patch for an instant',
      '    tw = max(tw, exp(-(uTime - uEntryT) * 4.2) * near);',
      '    vec4 mvr = modelViewMatrix * vec4(home, 1.0);',
      '    mvr.z += 0.012;    // nudge toward camera so they sit ON the glass',
      '    gl_Position = projectionMatrix * mvr;',
      '    gl_PointSize = max(1.0, uSize * uScale * 1.15 / -mvr.z);',
      '    float tr = fract(aU + 0.08);',
      '    vec3 cr = mix(uPaper, uAccent, smoothstep(0.00, 0.30, tr));',
      '    cr = mix(cr, uWarm,  smoothstep(0.28, 0.62, tr));',
      '    cr = mix(cr, uSage,  smoothstep(0.66, 0.88, tr));',
      '    cr = mix(cr, uPaper, smoothstep(0.90, 1.00, tr));',
      '    cr = mix(cr, uInkBlue, step(0.96, aSeed) * 0.72);',
      '    // pushed past 1.0 so bloom picks each one up as a star',
      '    vCol = mix(cr, vec3(1.0, 0.97, 0.90), 0.48) * 1.75;',
      '    vA = pick * tw * max(wake, uHoverAmt * near) * 0.95;',
      '    return;',
      '  }',
      '',
      '  // exactly the warped lookup the glass uses, so the hole in the',
      '  // surface and the debris leaving it always agree',
      '  vec3 pw = home + fractureWarp(home);',
      '  float slot = slotOf(pw);',
      '  vec4 sd = shardAt(slot);',
      '  float relT = sd.r;',
      '  if (uDebug > 0.5) relT = uTime - 0.6;',
      '',
      '  float age = max(0.0, uTime - relT);',
      '  // test hook: pin the age so the fall can be photographed at exact',
      '  // moments (screenshots are slow and the clock is real-time)',
      '  if (uAge >= 0.0) age = uAge;',
      '',
      '  vec3 pos = home;',
      '  float live = 0.0;',
      '',
      '  if (relT >= 0.0){',
      '    float t = age;',
      '    float az = sd.b, el = sd.a;',
      '    vec3 dir = vec3(sin(el)*cos(az), cos(el), sin(el)*sin(az));',
      '    vec3 r3 = hash33(vec3(slot*0.017, slot*0.031, slot*0.011));',
      '    float speed = mix(0.30, 0.95, r3.x);',
      '    // velocity decays exponentially; this is its integral, so a piece',
      '    // eases into its arc instead of travelling at a constant rate',
      '    float damp = (1.0 - exp(-uDrag * t)) / uDrag;',
      '    pos = home + dir * speed * damp;',
      '    pos.y += 0.5 * uGravity * t * t * exp(-0.22 * t);',
      '    // rigid tumble about the shard centre, from the warped cell',
      '    vec3 lo = home - (floor(pw * K) + 0.5) / K;',
      '    vec3 axis = normalize(r3 * 2.0 - 1.0 + vec3(1e-4));',
      '    float spin = mix(1.1, 4.2, r3.y) * damp;',
      '    pos += rot(lo, axis, spin) - lo;',
      '    live = 1.0;',
      '    // knits back on its own clock, measured from this piece own',
      '    // release — no dependence on where the cursor is now',
      '    float h = healOf(sd, uTime, uHold, uHealDur);',
      '    if (h > 0.0) pos = mix(pos, home, h*h*(3.0 - 2.0*h));',
      '  }',
      '',
      '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = max(1.0, uSize * uScale / -mv.z);',
      '',
      '  float tu = fract(aU + 0.08);',
      '  vec3 c = mix(uPaper, uAccent, smoothstep(0.00, 0.30, tu));',
      '  c = mix(c, uWarm,   smoothstep(0.28, 0.62, tu));',
      '  c = mix(c, uSage,   smoothstep(0.66, 0.88, tu));',
      '  c = mix(c, uPaper,  smoothstep(0.90, 1.00, tu));',
      '  c = mix(c, uInkBlue, step(0.96, aSeed) * 0.72);   // ink-blue stays rare',
      '  vCol = c * (1.0 + 1.10 * exp(-age * 3.5));',
      '',
      '  // GLINT. Real glass fragments flash as they tumble through the light;',
      '  // without this the debris is just drifting sand. A sharp periodic',
      '  // spike per shard, pushed well above 1.0 so bloom catches it.',
      '  if (relT >= 0.0){',
      '    vec3 g3 = hash33(vec3(slot*0.011, slot*0.023, slot*0.037));',
      '    float ph = uTime * mix(2.2, 6.5, g3.x) + g3.y * 6.28318;',
      '    float glint = pow(max(0.0, sin(ph)), 22.0);',
      '    vCol += vec3(1.0, 0.94, 0.82) * glint * 3.2;',
      '  }',
      '',
      '  // Exactly complementary to the glass: as the surface dissolves the',
      '  // particles rise in, and as it knits back they bow out. Same helper,',
      '  // so the two can never disagree and pop.',
      '  float solid = glassPresence(sd, uTime, uFade, uHold, uHealDur);',
      '  vA = live * 0.55 * (1.0 - solid) * (1.0 - smoothstep(5.0, 9.0, age));',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vCol; varying float vA;',
      'void main(){',
      '  if (vA <= 0.001) discard;',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  // harder core than before: soft wide dots read as dust, tight bright',
      '  // ones read as chips of glass',
      '  gl_FragColor = vec4(vCol, (1.0 - smoothstep(0.34, 0.5, d)) * vA);',
      '}',
    ].join('\n'),
  });

  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  /* ── breakage ──────────────────────────────────────────────────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-9, -9);
  const brokenList = [];
  let havePointer = false, broken = 0;
  // virtual cursor driven by the arrow keys, in NDC like the real one
  const keys = new Set();
  const kbNdc = new THREE.Vector2(0, 0);
  let kbActive = false;
  let SHATTER = mode === 'shatter';
  let hoverAmt = 0, wasHit = false, cursorSpeed = 0;
  const _prevForSpeed = new THREE.Vector3();
  let prevHit = null;

  function breakNear(p, now) {
    // Iterate the GRID CELLS inside the brush, not the occupied-shard list.
    // Warping can send a point into a neighbouring cell the CPU never saw as
    // occupied; leaving those unmarked speckles the hole with intact glass.
    const r2 = BRUSH * BRUSH;
    let hit = 0, any = false;
    const x0 = Math.floor((p.x - BRUSH) * K), x1 = Math.floor((p.x + BRUSH) * K);
    const y0 = Math.floor((p.y - BRUSH) * K), y1 = Math.floor((p.y + BRUSH) * K);
    const z0 = Math.floor((p.z - BRUSH) * K), z1 = Math.floor((p.z + BRUSH) * K);
    for (let cz = z0; cz <= z1; cz++) {
      if (cz < GMIN[2] || cz > GMIN[2] + GDIM[2] - 1) continue;
      for (let cy = y0; cy <= y1; cy++) {
        if (cy < GMIN[1] || cy > GMIN[1] + GDIM[1] - 1) continue;
        for (let cx = x0; cx <= x1; cx++) {
          if (cx < GMIN[0] || cx > GMIN[0] + GDIM[0] - 1) continue;
          const ex = (cx + 0.5) / K - p.x,
                ey = (cy + 0.5) / K - p.y,
                ez = (cz + 0.5) / K - p.z;
          const d2 = ex * ex + ey * ey + ez * ez;
          if (d2 > r2) continue;
          const s = slotOf(cx, cy, cz);
          const rel = shardData[s * 4];
          // Still in flight? Leave it. But a piece that has begun knitting
          // back may be struck again, so sweeping back over a re-forming area
          // shatters it a second time rather than feeling dead.
          if (rel >= 0 && (now - rel) < HOLD) continue;
          const fresh = rel < 0;
          const d = Math.sqrt(d2) || 1e-5;
          let ux = ex / d, uy = ey / d + 0.35, uz = ez / d;
          const ul = Math.hypot(ux, uy, uz) || 1;
          ux /= ul; uy /= ul; uz /= ul;
          shardData[s * 4] = now;
          shardData[s * 4 + 1] = -1;
          shardData[s * 4 + 2] = Math.atan2(uz, ux);
          shardData[s * 4 + 3] = Math.acos(Math.min(1, Math.max(-1, uy)));
          any = true;
          if (fresh) {                       // re-strikes must not double-count
            brokenList.push(s);
            if (cnt[s]) hit++;
          }
        }
      }
    }
    if (any) { broken += hit; shardTex.needsUpdate = true; }
  }

  // Sweep the brush ALONG the cursor's path. Sampling only at discrete
  // pointer positions leaves gaps at speed, so a fast drag carved a dotted
  // trail instead of a continuous one.
  const _seg = new THREE.Vector3();
  function alongPath(from, to, now, fn, spacing) {
    if (!from) { fn(to, now); return; }
    const dist = _seg.subVectors(to, from).length();
    const steps = Math.min(24, Math.max(1, Math.ceil(dist / spacing)));
    for (let i = 1; i <= steps; i++) {
      _seg.lerpVectors(from, to, i / steps);
      fn(_seg, now);
    }
  }
  const breakAlong = (a, b, t) => alongPath(a, b, t, breakNear, BRUSH * 0.45);
  const paintAlong = (a, b, t) => alongPath(a, b, t, paintReveal, REVEAL_R * 0.40);

  // Retire shards whose lifecycle has run out, freeing them to break again.
  // Nothing here consults the cursor — that is the whole point: a piece
  // restores on its own clock, so the trail knits up behind you mid-drag.
  const revealList = [];

  // Stamp "touched at now" into every cell in range. Re-touching refreshes
  // the timestamp, so holding still keeps a patch lit while moving leaves a
  // decaying trail behind the cursor.
  function paintReveal(p, now) {
    const r2 = REVEAL_R * REVEAL_R;
    let any = false;
    const x0 = Math.floor((p.x - REVEAL_R) * K), x1 = Math.floor((p.x + REVEAL_R) * K);
    const y0 = Math.floor((p.y - REVEAL_R) * K), y1 = Math.floor((p.y + REVEAL_R) * K);
    const z0 = Math.floor((p.z - REVEAL_R) * K), z1 = Math.floor((p.z + REVEAL_R) * K);
    for (let cz = z0; cz <= z1; cz++) {
      if (cz < GMIN[2] || cz > GMIN[2] + GDIM[2] - 1) continue;
      for (let cy = y0; cy <= y1; cy++) {
        if (cy < GMIN[1] || cy > GMIN[1] + GDIM[1] - 1) continue;
        for (let cx = x0; cx <= x1; cx++) {
          if (cx < GMIN[0] || cx > GMIN[0] + GDIM[0] - 1) continue;
          const ex = (cx + 0.5) / K - p.x,
                ey = (cy + 0.5) / K - p.y,
                ez = (cz + 0.5) / K - p.z;
          if (ex * ex + ey * ey + ez * ez > r2) continue;
          const sl = slotOf(cx, cy, cz);
          if (shardData[sl * 4] < 0) revealList.push(sl);
          shardData[sl * 4] = now;
          any = true;
        }
      }
    }
    if (any) shardTex.needsUpdate = true;
  }

  function sweepReveal(now) {
    if (!revealList.length) return;
    const dead = now - REVEAL_FADE - 0.05;
    let w = 0, changed = false;
    for (let n = 0; n < revealList.length; n++) {
      const sl = revealList[n];
      if (shardData[sl * 4] >= 0 && shardData[sl * 4] < dead) {
        shardData[sl * 4] = -1; changed = true;
      } else {
        revealList[w++] = sl;
      }
    }
    revealList.length = w;
    if (changed) shardTex.needsUpdate = true;
  }

  function sweepHealed(now) {
    if (!brokenList.length) return;
    const dead = now - LIFETIME() - 0.05;
    let w = 0, changed = false;
    for (let n = 0; n < brokenList.length; n++) {
      const s = brokenList[n];
      if (shardData[s * 4] >= 0 && shardData[s * 4] < dead) {
        shardData[s * 4] = -1;
        if (cnt[s]) broken--;
        changed = true;
      } else {
        brokenList[w++] = s;
      }
    }
    brokenList.length = w;
    if (changed) shardTex.needsUpdate = true;
  }

  function resetAll() {
    for (let n = 0; n < brokenList.length; n++) shardData[brokenList[n] * 4] = -1;
    for (let n = 0; n < revealList.length; n++) shardData[revealList[n] * 4] = -1;
    brokenList.length = 0; revealList.length = 0;
    broken = 0; prevHit = null;
    shardTex.needsUpdate = true;
  }

  /* ── events ────────────────────────────────────────────────────────── */
  const onPointerMove = e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1,
            -((e.clientY - r.top) / r.height) * 2 + 1);
    havePointer = true;
  };
  const onPointerOut = () => { havePointer = false; prevHit = null; };
  // Where the keyboard cursor starts. Hand-picking a point is unreliable:
  // dead centre threads the gap between the braided strands, and each lobe
  // has a counter you can land inside. Probe candidates and take the first
  // that actually hits, which also stays correct at any aspect ratio.
  const KB_SEEDS = [[-0.52, 0.0], [0.52, 0.0], [-0.30, 0.30], [0.30, -0.30],
                    [0.0, 0.26], [0.0, -0.26], [0.0, 0.0]];
  const _kbProbe = new THREE.Vector2();
  function seedKb() {
    for (let i = 0; i < KB_SEEDS.length; i++) {
      _kbProbe.set(KB_SEEDS[i][0], KB_SEEDS[i][1]);
      ray.setFromCamera(_kbProbe, camera);
      if (ray.intersectObject(proxy, false).length) { kbNdc.copy(_kbProbe); return; }
    }
    kbNdc.set(0, 0);
  }

  const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  const onKeyDown = e => {
    if (KEYS.includes(e.key)) {
      e.preventDefault();          // don't scroll the host page
      keys.add(e.key);
      if (!kbActive) { kbActive = true; seedKb(); }
      havePointer = false;         // keyboard takes over from the mouse
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (kbActive) U.uEntryT.value = pUni.uEntryT.value = clock.elapsedTime;
    } else if (e.key === 'Escape') {
      kbActive = false; keys.clear(); prevHit = null;
    }
  };
  const onKeyUp = e => keys.delete(e.key);
  const onFocus = () => { canvas.style.outline = '2px solid ' +
    '#' + C.accent.getHexString(); canvas.style.outlineOffset = '-2px'; };
  const onBlur = () => {
    canvas.style.outline = 'none';
    kbActive = false; keys.clear(); prevHit = null;
  };
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('focus', onFocus);
  canvas.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerOut);
  canvas.addEventListener('pointercancel', onPointerOut);
  // Losing focus (alt-tab, switching apps) fires no pointerleave, so without
  // this the brush would keep carving at the last cursor position forever.
  addEventListener('blur', onPointerOut);

  const ro = new ResizeObserver(() => {
    const s = sizeOf();
    VW = s.w; VH = s.h;
    camera.aspect = VW / VH;
    camera.updateProjectionMatrix();
    fitCamera();
    renderer.setSize(VW, VH, false);
    if (composer) composer.setSize(VW, VH);
    pUni.uScale.value = renderer.domElement.height * 0.5;
    fitBackdrop();
  });
  ro.observe(container);
  pUni.uScale.value = renderer.domElement.height * 0.5;

  // A hidden tab freezes rAF while the clock keeps real time, so the first
  // frame back dumps the whole hidden duration into elapsedTime and every
  // broken shard is suddenly seconds old — debris blinks out mid-air and the
  // drift jumps. Absorb the gap, then clear the transient breakage.
  const onVisibility = () => {
    if (document.hidden) return;
    clock.getDelta();
    if (broken > 0) resetAll();
  };
  document.addEventListener('visibilitychange', onVisibility);

  let contextLost = false;
  const onLost = e => { e.preventDefault(); contextLost = true; };
  const onRestored = () => { contextLost = false; };
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);

  /* ── loop ──────────────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let acc = 0, frames = 0, fps = 0, raf = 0, disposed = false;
  // Auto-quality with hysteresis. It used to fire once and never again, so a
  // machine that stayed below target after the first step was stuck there.
  let slowFor = 0, fastFor = 0, manualQuality = false;
  let reveal = reducedMotion ? 1 : 0;
  const par = new THREE.Vector2(0, 0);
  const RIM = U.uRimStrength.value;

  function setTier(i) {
    // Math.round, not a bare clamp: setQuality(1.5) indexed a hole in TIERS
    // and threw reading `.n` of undefined.
    const n = Number.isFinite(i) ? Math.round(i) : 0;
    tier = Math.min(AVAIL.length - 1, Math.max(0, n));
    pGeo.setDrawRange(0, AVAIL[tier].n);
  }
  setTier(tier);

  function tick() {
    raf = requestAnimationFrame(tick);
    if (contextLost) return;
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05), t = clock.elapsedTime;

    if (kbActive && keys.size) {
      const sp = 0.95 * dt;                       // NDC per second
      if (keys.has('ArrowLeft'))  kbNdc.x -= sp;
      if (keys.has('ArrowRight')) kbNdc.x += sp;
      if (keys.has('ArrowUp'))    kbNdc.y += sp;
      if (keys.has('ArrowDown'))  kbNdc.y -= sp;
      kbNdc.x = Math.min(1, Math.max(-1, kbNdc.x));
      kbNdc.y = Math.min(1, Math.max(-1, kbNdc.y));
    }
    const aNdc = havePointer ? ndc : (kbActive ? kbNdc : null);

    let hitLocal = null;
    if (aNdc) {
      ray.setFromCamera(aNdc, camera);
      const h = ray.intersectObject(proxy, false)[0];
      if (h) hitLocal = glass.worldToLocal(h.point.clone());
    }
    // Landing on the form is an EVENT: record it so both shaders can fire a
    // flare, and track how fast the cursor is travelling across the surface.
    if (hitLocal && !wasHit) {
      U.uEntryT.value = pUni.uEntryT.value = t;
      _prevForSpeed.copy(hitLocal);
    }
    if (hitLocal && wasHit && dt > 1e-4) {
      const raw = _prevForSpeed.distanceTo(hitLocal) / dt;   // units/sec
      _prevForSpeed.copy(hitLocal);
      cursorSpeed += (Math.min(1, raw / 3.2) - cursorSpeed) * (1 - Math.exp(-6 * dt));
    } else if (!hitLocal) {
      cursorSpeed += (0 - cursorSpeed) * (1 - Math.exp(-3 * dt));
    }
    wasHit = !!hitLocal;
    U.uSpeed.value = pUni.uSpeed.value = cursorSpeed;

    if (hitLocal) {
      U.uHoverPos.value.copy(hitLocal);       // shared with the point cloud
      if (SHATTER) breakAlong(prevHit, hitLocal, t);
      else paintAlong(prevHit, hitLocal, t);
      prevHit = hitLocal;
    } else {
      prevHit = null;
    }
    // reveal eases in faster than it fades out, so it feels responsive to
    // arrive and unhurried to leave
    const aimH = hitLocal ? 1 : 0;
    hoverAmt += (aimH - hoverAmt) * (1 - Math.exp(-(aimH > hoverAmt ? 9 : 3.5) * dt));
    U.uHoverAmt.value = hoverAmt;
    pUni.uHoverAmt.value = hoverAmt;

    if (SHATTER) sweepHealed(t); else sweepReveal(t);

    U.uTime.value = t;
    pUni.uTime.value = t;

    const dr = DRIFT;
    glass.rotation.y = proxy.rotation.y = points.rotation.y = Math.sin(t * 0.16) * 0.19 * dr;
    glass.rotation.x = proxy.rotation.x = points.rotation.x = Math.sin(t * 0.11) * 0.07 * dr;

    // Entrance: the form settles in rather than appearing fully formed.
    if (reveal < 1) {
      reveal = Math.min(1, reveal + dt / 1.25);
      const e = 1 - Math.pow(1 - reveal, 3);          // ease-out cubic
      const s = 0.86 + 0.14 * e;
      glass.scale.setScalar(s);
      proxy.scale.setScalar(s);
      points.scale.setScalar(s);
      U.uRimStrength.value = RIM * e;
    }

    if (dr) {
      // Slow orbit plus cursor parallax. A static camera made the piece feel
      // like an object you poke at; moving the viewpoint is what makes the
      // refraction and the rim read as three-dimensional.
      // ndc starts at the off-canvas sentinel (-9,-9); easing toward it
      // before any pointer event dragged the camera ~1.4 units off centre.
      const tx = aNdc ? aNdc.x : 0, ty = aNdc ? aNdc.y : 0;
      par.x += (tx - par.x) * (1 - Math.exp(-2.2 * dt));
      par.y += (ty - par.y) * (1 - Math.exp(-2.2 * dt));
      const orb = t * 0.055;
      camera.position.x = Math.sin(orb) * 0.20 + par.x * 0.16;
      camera.position.y = 0.28 + Math.sin(t * 0.041) * 0.07 + par.y * 0.11;
      camera.position.z = CAM_Z + Math.cos(orb) * 0.16;
      camera.lookAt(0, 0.02, 0);
      // highlights sweep across the body instead of sitting still
      if (scene.environmentRotation) scene.environmentRotation.y = t * 0.035;
    }

    if (composer) composer.render(); else renderer.render(scene, camera);

    acc += raw; frames++;
    if (acc >= 0.5) {
      fps = frames / acc;
      // Manual selection wins outright: once the user picks a tier we stop
      // second-guessing them.
      if (autoQuality && !manualQuality && t > 3) {
        if (fps < 30) { slowFor += acc; fastFor = 0; } 
        else if (fps > 52) { fastFor += acc; slowFor = 0; }
        else { slowFor = fastFor = 0; }
        if (slowFor > 1.5 && tier < AVAIL.length - 1) {
          setTier(tier + 1); slowFor = 0;      // sustained slowness, step down
        } else if (fastFor > 6 && tier > 0) {
          setTier(tier - 1); fastFor = 0;      // comfortably fast, step back up
        }
      }
      acc = 0; frames = 0;
    }
  }

  report('Ready', 100);
  tick();

  /* ── public API ────────────────────────────────────────────────────── */
  const api = {
    canvas,
    reset: () => resetAll(),
    setQuality: i => { manualQuality = true; setTier(i); },
    setMode: m => {
      const next = m === 'shatter';
      if (next === SHATTER) return;
      // Both modes write timestamps into the same R channel but read them
      // with different meanings, so a live reveal trail became phantom
      // "already broken" cells on switching — outside brokenList, so outside
      // all the bookkeeping too. Clear on every real change.
      resetAll();
      SHATTER = next;
      pUni.uMode.value = U.uMode.value = SHATTER ? 1 : 0;
    },
    get mode() { return SHATTER ? 'shatter' : 'reveal'; },
    get quality() { return tier; },
    tiers: AVAIL.map(t => t.label),
    getStats: () => ({
      fps, particles: AVAIL[tier].n, broken, shards: occupied,
      reducedMotion, mode: SHATTER ? 'shatter' : 'reveal',
      hover: +hoverAmt.toFixed(3),
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerOut);
      canvas.removeEventListener('pointercancel', onPointerOut);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('focus', onFocus);
      canvas.removeEventListener('blur', onBlur);
      removeEventListener('blur', onPointerOut);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      scene.clear();
      glassGeo.dispose(); proxyGeo.dispose(); pGeo.dispose(); backdropGeo.dispose();
      glassMat.dispose(); proxyMat.dispose(); pMat.dispose(); backdropMat.dispose();
      shardTex.dispose(); envRT.dispose();
      if (composer) composer.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
    // ── test hooks (used by the Playwright verification pass) ──
    _probe: () => {
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(proxy, false);
      const now = clock.elapsedTime;
    const healing = brokenList.some(s => shardData[s * 4] >= 0
      && (now - shardData[s * 4]) > HOLD);
    return { havePointer, broken, healing, shards: occupied, fps,
             kbActive, kb: [kbNdc.x, kbNdc.y], keys: [...keys],
             kbHits: (ray.setFromCamera(kbNdc, camera),
                      ray.intersectObject(proxy, false).length),
             hoverAmt: +hoverAmt.toFixed(3),
               ndc: [ndc.x, ndc.y], hits: hits.length };
    },
    _breakAt: (nx, ny) => {
      ndc.set(nx, ny);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObject(proxy, false)[0];
      if (!h) return false;
      breakNear(glass.worldToLocal(h.point.clone()), clock.elapsedTime);
      return true;
    },
    _setHold: s => { HOLD = s; U.uHold.value = s; pUni.uHold.value = s; },
    _setReform: s => { HOLD = s; U.uHold.value = s; pUni.uHold.value = s; },
    _setAge: s => { pUni.uAge.value = s; },
    _debug: v => { pUni.uDebug.value = +v; },
    _pinTier: i => { manualQuality = true; setTier(i); },
  };
  return api;
}
