# Claude Code prompt — replace the apyashaswi.com background with the orbital sky

Paste everything below this line into Claude Code, run from the root of the `portfolio` repo. Put the four files from `sky-bg/` (`sky.js`, `sky.css`, `sky-poster.jpg`, `sky-reference.html`) in the repo root first, so Claude Code can read them.

---

## 0. Mission and hard limits

Replace the site's current background effect with the new orbital sky background, defined exactly by `sky.js`, `sky.css` and `sky-poster.jpg`. `sky-reference.html` is a working reference page showing the finished effect. Use it only to see how the background behaves. Do NOT copy its content, copy, layout, fonts, colors, nav, cards or any other markup into the site.

Hard limits. Treat any violation as a failed task:

1. **Do not change content.** Keep all text, headings, links, images, section order, section ids, nav items, buttons, the Explorer/Recruiter toggle, "Chat with my AI", the "Seen across" strip and the photo exactly as they are.
2. **Do not change layout, typography or the color theme** of any foreground element. The only foreground styling you add is the two readability helpers in `sky.css`: the `--sky-glow` text shadow on `body` and the `.sky-scrim` class on section wrappers.
3. **Do not alter `SKY_FRAGMENT_SHADER`** in any way: no reformatting, no "cleanup", no constant changes, no precision changes, no uniform renames. It is tuned by measurement. Copy `sky.js` byte-for-byte.
4. **Do not add dependencies.** No three.js, no React Three Fiber, no shader libraries. `sky.js` is plain WebGL1 and has zero imports.
5. **Work on a new branch** named `feat/orbital-sky-bg`. Make small commits, open a PR, and do not merge.

Before editing anything, read the codebase and post a short plan containing:
- the framework and router in use;
- where the current background lives (component and file paths);
- the exact id of every top-level section;
- where you will mount the new canvas;
- which files you will delete or modify.

Then proceed.

---

## 1. Remove the old background completely

The current site renders, behind the hero and across the page:
- a large tan/beige organic blob shape behind the photo;
- a faint polygonal wireframe mesh around it;
- drifting square particles in tan, grey and blue;
- WebGL scene chrome text in the corners: `RENDER · WEBGL`, `SCENE — EDITORIAL-FUTURISM / V1`, `LAT 42.3601 · LNG -71.0589 — BOSTON`, `SCROLL 000%`.

Remove all of it: the components, their shaders and render loops, any canvas they own, their CSS, and any packages used only by them (remove from `package.json` too). Grep for leftover imports, `requestAnimationFrame` loops, resize listeners and canvas elements that belonged to the old scene. The four corner chrome labels belong to the old scene and go with it.

Keep the masthead's `EFFECTS: ON` switch, which is rewired in section 5, the Explorer/Recruiter toggle, and everything else in the foreground.

---

## 2. What the new background is (full visual specification)

Read this so you can verify the result. Do not re-implement it; `sky.js` already does all of it.

### 2.1 Concept
The viewer floats in low orbit about 950 km up, looking toward Earth's horizon. Earth is a huge dark sphere whose curved edge (the limb) forms a gentle arch across the bottom of the screen. The sun sits behind and just above that edge, slightly right of centre. As the visitor scrolls, the page lives through one day:
- the hero is pre-dawn;
- the middle sections are sunrise into a warm amber morning;
- the last sections are a red-orange sunset fading into a violet afterglow with stars.

The movement is continuous and eased, never stepped.

### 2.2 Geometry and camera
- Planet radius 6360 km, atmosphere top 6460 km, camera altitude 950 km.
- Vertical field of view: focal factor `f = 1.25` (about 44°).
- The camera pitches so the limb sits at a controlled height:
  - on the hero (`hz = 0.43`) the arch's crest is about 7% up from the bottom of the screen, so no hero text overlaps it;
  - from About onward (`hz = 0.22`) the crest is about 28% up from the bottom.
  - The change between them is a smooth camera tilt-up reveal as you scroll out of the hero.
- A tiny camera drift of ±0.6° across the whole page adds life.
- On narrow screens the sun's azimuth is scaled by the actual horizontal field of view, so the sun stays in the same relative screen position. On a 390 px portrait phone it is still on screen.

### 2.3 Atmosphere (physically based)
- Single-scattering ray march, 14 primary steps × 5 light steps per pixel.
- Rayleigh scattering (5.8, 13.5, 33.1)×10⁻³ /km with an 8 km scale height. Mie scattering 21×10⁻³ /km, 1.2 km scale height, Henyey-Greenstein g = 0.76.
- Ozone absorption (0.65, 1.881, 0.085)×10⁻³ /km, a tent profile centred at 25 km, ±15 km.
- Soft planet shadow along each light path (smoothstep over −4…+6 km around the surface).
- Sun intensity 15.

This produces the signature limb:
- a thin red-orange band hugging the surface;
- a deep blue band above it (from ozone);
- a fade to black;
- gold near the sun's direction, cool blue far from it.

None of these colors are hand-picked; they come from the physics.

### 2.4 Sun
- Disc of angular radius 0.0085 rad with limb darkening and radiance 14.
- Tint goes from deep orange (1.0, 0.34, 0.10) at the horizon to warm white (1.0, 0.80, 0.56) once about 8° up.
- Light is reddened by atmospheric transmittance when low, so it turns orange and red automatically.
- Three-layer lens bloom that leaks over the limb in proportion to how much of the disc has cleared it.
- A faint, tight horizontal anamorphic streak through the sun (intensity 0.02).
- Before sunrise, a "crest" glow wraps the limb at the sun's azimuth before the disc appears.

### 2.5 Earth surface
- Night side: deep navy-black ocean and dark land with very faint ambient fill. Warm sodium-orange city lights appear in clusters on land only (population mask × fine detail), dimmed under clouds, and only on the night side.
- Day side, near the edge: dark ocean and muted land lit by grazing sunlight. Clouds at 7.5× noise frequency, drifting slowly, catch light earlier than the ground because cloud tops sit higher.
- A specular sun glint on open ocean appears under the sun when it is up.
- The planet rotates imperceptibly slowly.

### 2.6 Space
- Two star layers of varied brightness and colour temperature, from blue-white to warm, with gentle twinkle.
- A faint Milky Way band with dust lanes.
- A thin green airglow line about 95 km above the limb on the night side, as in real orbital photography.
- Stars fade according to the actual sky brightness behind them, so they never show through the glow.

### 2.7 Warm theme layer
An artistic warm backdrop is added on top of the physics, anchored to the limb and concentrated around the sun:
- **Morning:** amber (1.0, 0.55, 0.16) at the horizon rising to deep brown at the top, weight 0.26.
- **Sunset:** crimson-orange (0.95, 0.22, 0.06) rising to near-black violet, weight 0.32.

This is what makes the morning read as "yellowish orange" and the sunset as red without washing the screen like a filter.

### 2.8 Tone and finish
- Exposure goes from 1.3 at night to 0.85 at the morning peak.
- ACES filmic tonemap, then gamma 2.2.
- A soft brightness ceiling (above 0.9, compress toward 0.9) so nothing is ever pure white and the sunrise never glares.
- Triangular dither noise to remove banding in the gradients.

### 2.9 The day timeline (keyframes are pinned to sections, not scroll %)
Each keyframe takes effect when that section's top edge reaches the vertical middle of the viewport. Values between keyframes are a Catmull-Rom spline, so velocity is continuous with no stop-start. The rendered state then follows the scrollbar through a critically damped filter (`1 − e^(−2.2·dt)`, about 0.45 s), so the sky glides behind the scroll instead of snapping.

| Keyframe (`at`) | Sun above limb (°) | Azimuth (°) | Morning | Sunset | Limb height | What you see |
|---|---|---|---|---|---|---|
| `start` (hero) | −2.4 | 12.0 | 0 | 0 | 0.43 | Black space, stars, Milky Way, airglow, city lights; thin blue limb low on screen; gold crest building where the sun will rise |
| `#about` | −1.2 | 12.6 | 0.04 | 0 | 0.22 | Camera tilts up; crest brightening; sun still hidden |
| `#experience` | +0.6 | 13.2 | 0.25 | 0 | 0.22 | Sun breaks the edge: orange disc, bloom spills over the limb |
| `#journey` | +2.0 | 14.0 | 0.55 | 0 | 0.22 | Sky warming to amber; stars fading |
| `#projects` | +4.4 | 15.0 | 0.90 | 0 | 0.22 | Full warm morning |
| `#highlights` | +5.0 | 15.5 | 1.00 | 0 | 0.22 | Morning peak: brightest moment, sun warm-white, cloud tops lit |
| `#globe` | +4.8 | 16.5 | 0.95 | 0.05 | 0.22 | Holding the morning |
| `#research` | +1.2 | 18.0 | 0.30 | 0.80 | 0.22 | Sun descending and reddening; sky turns orange-red |
| `#skills` | +0.4 | 18.3 | 0.15 | 0.95 | 0.22 | Sun touching the limb, deepest red |
| `#leadership` | −0.2 | 18.6 | 0.05 | 1.00 | 0.22 | Sun sinks behind the edge; crimson afterglow |
| `end` (Contact, page bottom) | −2.6 | 19.0 | 0 | 0.55 | 0.22 | Violet-red afterglow on the limb, stars returning |

The sun drifts rightward from 12° to 19° over the page, a slight diagonal path like a real sunrise and sunset. Azimuth 12–19° places it in the right third of a desktop screen, behind the photo column and away from left-aligned text.

**Section ids:** `SKY_PHASES` uses `#about`, `#experience`, `#journey`, `#projects`, `#highlights`, `#globe`, `#research`, `#skills`, `#leadership`. These match the site's nav order. If the real section ids differ, edit only the `at` selectors in `SKY_PHASES` to the real ids, in the same order, and leave every number unchanged. Any keyframe whose selector isn't found is skipped automatically. Do not rename ids in the site's markup to fit.

---

## 3. Rendering behaviour (already in `sky.js`, verify it)

- **Canvas:** one `<canvas class="sky-canvas" aria-hidden="true">`, `position: fixed; inset: 0; z-index: 0; pointer-events: none`. A single full-screen triangle is drawn with one fragment shader.
- **Instant first paint:**
  - `body` shows `sky-poster.jpg`, the opening frame (960×600, 19 KB), `cover`, anchored centre-bottom.
  - The shader starts only after the window `load` event plus one tick.
  - The canvas fades in over 0.9 s on its first draw, so there's no black flash and no layout cost.
- **Render on demand:**
  - It redraws every frame only while the scroll target is moving.
  - When idle, it redraws at 20 fps (10 fps on low-power devices) for twinkle and cloud drift.
  - It renders nothing while the tab is hidden.
- **Resolution:** the canvas is rendered at `min(devicePixelRatio, 1.5) × 0.8` of CSS pixels, or × 0.5 on low-power devices, and upscaled by the browser. This is intentional: the scene is soft and this keeps it smooth.
- **Adaptive quality:** while scrolling, if frames take longer than 28 ms for 20 frames, the scale drops by 15% (floor 0.4). After 240 fast frames it climbs back. Each resize happens before the draw, so there's never an empty frame.
- **Low-power devices:** `navigator.connection.saveData`, or a coarse pointer with 4 or fewer CPU cores.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, twinkle and drift freeze and scroll easing becomes instant. The sun still follows scroll because the user drives it.
- **No WebGL:** the poster stays as a static background and the readability tokens still update on scroll.
- **Relayout:** keyframe positions are recomputed on `load`, on any body resize (ResizeObserver), and when `sky.relayout()` is called. Call `sky.relayout()` after anything that changes page height, such as the Explorer/Recruiter toggle, accordions or lazy-loaded images.
- **Teardown:** `sky.destroy()` cancels the loop, removes every listener, deletes GL objects, and releases the context via `WEBGL_lose_context`.

---

## 4. Integration steps

### 4.1 Files
- `sky.js` goes in the shared client code folder, for example `src/lib/sky.js` or `lib/sky.js`. Copy it byte-for-byte; TypeScript projects may keep it as `.js` with `allowJs`.
- `sky.css` is imported globally once, or its rules are merged into the global stylesheet unchanged.
- `sky-poster.jpg` goes in the public/static folder, for example `public/sky-poster.jpg`. Update only the `url(...)` path in `sky.css` to its served path, for example `/sky-poster.jpg`.
- Do not commit `sky-reference.html` to the production build. Keep it out of the deploy, or delete it after verification.

### 4.2 Markup (presentational only)
1. Add `<canvas class="sky-canvas" aria-hidden="true"></canvas>` as the first child of `<body>`, or of the root layout, outside every scrolling container.
2. Wrap all existing page content (masthead, nav, main, footer) in an element that has `position: relative; z-index: 1;` and the class `sky-page`. If such a wrapper exists, add the class to it; otherwise add a single wrapper `<div>`. Make sure no ancestor of the content has an opaque background colour, so the sky shows through. Remove or make transparent only the page-level and section-level background colours that previously hid the old scene. Cards, chips and buttons keep their own backgrounds.
3. Add the class `sky-scrim` to each top-level content section, about through contact. Not the hero.
4. The document itself must be the scroll container (`window` scrolls). If the site scrolls inside a div, for example a full-height `main` with `overflow: auto`, or uses smooth-scroll libraries like Lenis or Locomotive, tell me before proceeding: `sky.js` reads `window.scrollY`.

### 4.3 Mounting

**React or Next.js (App Router):** create a client component and render it once in the root layout.

```jsx
'use client';
import { useEffect, useRef } from 'react';
import { createSky } from '@/lib/sky';

export default function SkyBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const sky = createSky({ canvas: ref.current });
    window.__sky = sky;                       // lets other components call relayout / setEnabled
    return () => { sky.destroy(); delete window.__sky; };
  }, []);
  return <canvas ref={ref} className="sky-canvas" aria-hidden="true" />;
}
```
- It must not render on the server path: `createSky` touches `window`, so it only runs inside `useEffect`.
- React Strict Mode double-mounts in development. `destroy()` makes this safe, so do not disable Strict Mode.
- Route changes: if pages change without a full reload, call `window.__sky?.relayout()` after each route render.

**Vite or vanilla:**
```js
import { createSky } from './lib/sky.js';
const sky = createSky({ canvas: document.querySelector('.sky-canvas') });
```

---

## 5. Wire the existing controls (no new UI)

- **`EFFECTS: ON` switch in the masthead:** when switched off, call `sky.setEnabled(false)`. The canvas fades out and rendering stops, leaving the static poster. When switched on, call `sky.setEnabled(true)`. Keep the switch's existing look and label behaviour. If it previously also toggled other effects, keep those too.
- **Explorer/Recruiter toggle:** after it changes the page, call `sky.relayout()`.
- Do not add a new pause button. If the site already has a motion or reduced-motion control, map it to `sky.setPaused(true/false)`.

---

## 6. Acceptance checks (run all, report results with screenshots)

Use Playwright or the browser at 1440×900 and 390×844. Wait about 2 s after each scroll for the damped sky to settle.

1. **Hero (top of page):** near-black starfield, Milky Way, a thin blue-violet arc of the limb about 7% above the bottom edge, a soft gold crest glow right of centre, no sun disc. No hero text or button overlaps the arc on 1440×900.
2. **About:** the arc has risen to about 28% from the bottom; the crest is brighter; still no disc.
3. **Experience to Journey:** an orange sun disc breaks the limb right of centre with bloom spilling over the edge; the sky warms; stars thin out.
4. **Highlights:** brightest frame; amber sky; warm-white sun about 5° above the limb in the right third; the limb shows red-orange, then blue, then black bands. Nothing reaches pure white; check that no pixel is (255,255,255).
5. **Research to Leadership:** the sun lowers and reddens and sets behind the limb; crimson then violet afterglow.
6. **Page bottom:** dark violet-red afterglow on the limb, stars back.
7. **Smoothness:** scroll continuously top to bottom. No jumps or stepping at section boundaries; the sun moves on one continuous path.
8. **Mobile 390×844:** the sun or its glow is visible on screen during the morning sections, and there's no horizontal page scroll (`document.documentElement.scrollWidth <= innerWidth`).
9. **Readability:** sample the background behind body text at the Highlights section, with text hidden, at the 95th-percentile brightness. Contrast with the site's existing body text colour must be at least 4.5:1. If it falls short, raise only the `0.55` factor in `setReadability`'s `--sky-scrim` line, up to 0.7, and report the value used. Change nothing else.
10. **Performance:** no console errors or warnings from the sky. With the tab hidden, no frames render (log via a temporary counter, then remove it). Idle frame rate is about 20 fps. Scrolling stays smooth on a throttled CPU (4× slowdown in DevTools).
11. **Fallbacks:**
    - with WebGL disabled (`--disable-webgl`), the poster shows and nothing errors;
    - with reduced motion emulated, there's no twinkle, and the sun still tracks scroll;
    - `EFFECTS` off fades the canvas out and the poster remains.
12. **Teardown:** on a route change and back, or a Strict Mode remount, only one canvas exists, there are no duplicate scroll listeners, and no "too many WebGL contexts" warning appears.
13. **Diff hygiene:** the PR touches only the background code, global CSS for the sky, the removal of the old scene, the canvas mount, the `sky-page`/`sky-scrim` classes, and the switch wiring. Show `git diff --stat`, and confirm that no content, copy, text styles or section ids changed.

---

## 7. Do not

- Do not edit, minify, reformat or "optimise" the shader, or change any numeric constant in `sky.js` other than the section selectors in `SKY_PHASES` and, only if check 9 fails, the scrim factor.
- Do not raise the render scale, add MSAA, or set `preserveDrawingBuffer`.
- Do not tie the sky to scroll percentage instead of sections.
- Do not put the canvas inside a transformed, filtered or `overflow: hidden` ancestor; that breaks `position: fixed`.
- Do not add `will-change`, CSS filters or blend modes to the canvas.
- Do not ship `sky-reference.html`.
- Do not change any copy, content, fonts, colours of text, layout or component structure beyond what's listed in section 4.2.

When done, post:
- the plan you followed;
- the files changed;
- screenshots for checks 1–6 at desktop and the mobile morning frame;
- the contrast number from check 9;
- any deviation you had to make, with the reason.

---

## Appendix A — `sky.js` (copy verbatim; identical to the attached file)

```js
/*
 * sky.js — scroll-driven orbital sunrise → morning → sunset background.
 * Framework-agnostic. No dependencies. Copy verbatim.
 *
 *   import { createSky } from './sky.js';
 *   const sky = createSky({ canvas, phases: SKY_PHASES });
 *   ...
 *   sky.destroy();
 */

export const SKY_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uT;
uniform float uSunOff;   // sun elevation above the limb, radians
uniform float uSunAz;    // sun azimuth, radians
uniform float uDay;      // morning warmth 0..1
uniform float uDusk;     // sunset warmth 0..1
uniform float uDrift;    // tiny camera drift with scroll
uniform float uHorizon;  // limb height below screen center

#define PI 3.14159265
const float RP = 6360.;          // planet radius, km
const float RA = 6460.;          // top of atmosphere, km
const float ALT = 950.;          // camera altitude, km
const vec3  BR = vec3(5.8e-3, 13.5e-3, 33.1e-3);  // Rayleigh, per km
const float BM = 21e-3;                           // Mie, per km
const float HR = 8.0, HM = 1.2;
const vec3  BO = vec3(.65e-3, 1.881e-3, .085e-3);  // ozone absorption, per km
float oz(float h){ return max(0., 1. - abs(h - 25.)/15.); }

vec2 rsi(vec3 ro, vec3 rd, float r){
  float b = dot(ro, rd), c = dot(ro, ro) - r*r, d = b*b - c;
  if (d < 0.) return vec2(1e9, -1e9);
  d = sqrt(d); return vec2(-b - d, -b + d);
}
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p = fract(p*.3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3. - 2.*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a*n3(p); p = p*2.07 + 3.1; a *= .5; } return v; }
vec3 aces(vec3 x){ return clamp((x*(2.51*x + .03))/(x*(2.43*x + .59) + .14), 0., 1.); }

vec3 scatter(vec3 ro, vec3 rd, vec3 sd, float tMax, out vec3 trans){
  trans = vec3(1.);
  vec2 a = rsi(ro, rd, RA);
  float t0 = max(a.x, 0.), t1 = min(a.y, tMax);
  if (t1 <= t0) return vec3(0.);
  const int N = 14; const int L = 5;
  float ds = (t1 - t0)/float(N);
  vec3 sR = vec3(0.), sM = vec3(0.); float oR = 0., oM = 0., oO = 0.;
  float mu = dot(rd, sd), g = .76;
  float pR = 3./(16.*PI)*(1. + mu*mu);
  float pM = 3./(8.*PI)*((1. - g*g)*(1. + mu*mu))/((2. + g*g)*pow(1. + g*g - 2.*g*mu, 1.5));
  for (int i = 0; i < N; i++){
    vec3 x = ro + rd*(t0 + ds*(float(i) + .5));
    float h = length(x) - RP;
    float hr = exp(-h/HR)*ds, hm = exp(-h/HM)*ds;
    oR += hr; oM += hm; oO += oz(h)*ds;
    // soft planet shadow along the light path
    float tc = max(-dot(x, sd), 0.);
    float dmin = length(x + sd*tc);
    float sh = smoothstep(RP - 4., RP + 6., dmin);
    if (sh <= 0.) continue;
    float ls = rsi(x, sd, RA).y/float(L);
    float lR = 0., lM = 0., lO = 0.;
    for (int j = 0; j < L; j++){
      float hh = max(length(x + sd*(ls*(float(j) + .5))) - RP, 0.);
      lR += exp(-hh/HR)*ls; lM += exp(-hh/HM)*ls; lO += oz(hh)*ls;
    }
    vec3 att = exp(-(BR*(oR + lR) + BM*1.1*(oM + lM) + BO*(oO + lO)))*sh;
    sR += att*hr; sM += att*hm;
  }
  trans = exp(-(BR*oR + BM*1.1*oM + BO*oO));
  return 15.*(sR*BR*pR + sM*BM*pM);
}

void main(){
  vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  float f = 1.25;
  float dip = acos(RP/(RP + ALT));               // how far below horizontal the limb sits
  float pitch = -dip + atan(uHorizon/f) + uDrift;
  vec3 rd = normalize(vec3(p.x, p.y, -f));
  float cp = cos(pitch), sp = sin(pitch);
  rd = vec3(rd.x, rd.y*cp - rd.z*sp, rd.y*sp + rd.z*cp);
  vec3 ro = vec3(0., RP + ALT, 0.);

  float el = -dip + uSunOff;
  // keep the sun at the same place on screen on narrow phones as on wide desktops
  float hf = atan(.5*uRes.x/uRes.y/f);
  float az = uSunAz * min(1., hf/.569);
  vec3 sd = normalize(vec3(sin(az)*cos(el), sin(el), -cos(az)*cos(el)));

  vec2 pt = rsi(ro, rd, RP);
  bool hit = pt.x > 0. && pt.x < 1e8;
  vec3 tr;
  vec3 inS = scatter(ro, rd, sd, hit ? pt.x : 1e9, tr);

  float mu = dot(rd, sd);
  float vis = smoothstep(-.012, .012, uSunOff);           // share of the disc above the limb
  vec3 sunTint = mix(vec3(1., .34, .10), vec3(1., .80, .56), smoothstep(.0, .14, uSunOff));

  // warm backdrop that carries the morning and sunset themes
  float above = clamp((asin(clamp(rd.y, -1., 1.)) + dip)/.55, 0., 1.);
  float nearSun = exp((mu - 1.)*4.5);
  vec3 dayBg  = mix(vec3(1.0, .55, .16), vec3(.20, .085, .03), pow(above, .55)) * (.40 + .55*nearSun);
  vec3 duskBg = mix(vec3(.95, .22, .06), vec3(.03, .012, .04), pow(above, .45)) * (.30 + 1.0*nearSun);
  vec3 bg = dayBg*uDay*.26 + duskBg*uDusk*.32;

  vec3 col;
  if (hit){
    vec3 x = ro + rd*pt.x; vec3 n = normalize(x);
    float a = uT*.0025; mat2 r2 = mat2(cos(a), -sin(a), sin(a), cos(a));
    vec3 q = n; q.xz = r2*q.xz;
    float land = smoothstep(.50, .57, fbm3(q*3.2 + 7.));
    float cl = fbm3(q*7.5 + vec3(uT*.004, 0., 0.) + 2.);
    float clouds = smoothstep(.50, .78, cl);
    vec3 ground = mix(vec3(.008, .022, .05), vec3(.04, .045, .03), land);
    float ndl = dot(n, sd);
    vec3 sunT  = exp(-(BR*HR + BM*1.1*HM + BO*8.)/max(ndl + .06, .015));
    vec3 sunTc = exp(-(BR*HR + BM*1.1*HM + BO*8.)*.6/max(ndl + .09, .015));   // cloud tops sit higher
    vec3 lit = ground * sunT * max(ndl, 0.) * 20./PI;
    lit = mix(lit, vec3(.62) * sunTc * max(ndl + .03, 0.) * 20./PI * .85, clouds);
    // sun glint off the ocean, strongest under the sun near the edge
    vec3 hv = normalize(sd - rd);
    float glint = pow(max(dot(n, hv), 0.), 900.) * (1. - land) * (1. - clouds) * step(0., ndl);
    lit += sunT * glint * 30.;
    float night = 1. - smoothstep(-.10, .03, ndl);
    float pop = smoothstep(.55, .70, fbm3(q*9. + 4.));
    float lights = smoothstep(.62, .80, fbm3(q*70. + 1.)) * pop * land;
    vec3 city = vec3(1., .66, .30) * lights * (1. - clouds*.85) * .06 * night;
    vec3 ambient = mix(ground, vec3(.5), clouds) * vec3(.03, .04, .08) * .05;
    col = (lit + city + ambient)*tr + inS + bg*.02;
  } else {
    // stars, fixed to the sky so they drift with the camera
    vec2 su = vec2(atan(rd.x, -rd.z), asin(clamp(rd.y, -1., 1.)));
    vec3 stars = vec3(0.);
    for (int L = 0; L < 2; L++){
      float sc = L == 0 ? 260. : 520.;
      vec2 g = su*sc; vec2 id = floor(g); float h = h21(id + float(L)*13.);
      vec2 o = vec2(h21(id + 3.1), h21(id + 7.7)) - .5;
      float d = length(fract(g) - .5 - o*.7);
      float m = step(L == 0 ? .975 : .985, h);
      float b = pow(h21(id + 1.9), 6.) * 3. + .25;
      float tw = .85 + .15*sin(uT*(.7 + 2.5*h) + h*40.);
      vec3 tint = mix(vec3(.72, .82, 1.), vec3(1., .86, .70), h21(id + 5.3));
      stars += tint * m * b * tw * exp(-d*d*(L == 0 ? 60. : 110.));
    }
    vec3 nb = normalize(vec3(.35, .75, .55));
    float band = exp(-pow(dot(rd, nb), 2.)*22.);
    float mw = band * (.55 + .45*fbm3(rd*7.)) * (1. - .55*smoothstep(.45, .7, fbm3(rd*16. + 3.)));
    float skyL = dot(bg*tr + inS, vec3(.2126, .7152, .0722));
    float starVis = exp(-skyL*40.);
    float hc = length(ro + rd*max(-dot(ro, rd), 0.)) - RP;
    float airglow = exp(-pow((hc - 95.)/5., 2.)) * (1. - uDay) * (1. - uDusk*.5) * (1. - exp((mu - 1.)*3.));
    vec3 space = vec3(.0010, .0013, .0026) + (stars*.55 + vec3(.72, .76, .9)*mw*.006)*starVis + vec3(.2, 1., .35)*airglow*.006;
    // sun disc with limb darkening
    float ang = acos(clamp(mu, -1., 1.)), rs = .0085;
    float disc = 1. - smoothstep(rs*.92, rs, ang);
    float ld = 1. - .55*(1. - sqrt(max(1. - pow(ang/rs, 2.), 0.)));
    vec3 sun = vec3(1., .94, .86) * disc * ld * 14.;
    col = (space + bg + sun)*tr + inS;
  }

  // lens bloom: leaks over the limb as the disc clears it
  float bloom = exp((mu - 1.)*900.)*.45 + exp((mu - 1.)*120.)*.20 + exp((mu - 1.)*18.)*.07;
  col += sunTint * bloom * vis * (hit ? .55 : 1.);
  vec3 rdC = normalize(vec3(p.x, p.y, -f));
  vec3 sdC = vec3(sd.x, sd.y*cp + sd.z*sp, -sd.y*sp + sd.z*cp);
  vec2 dd = rdC.xy/max(-rdC.z, 1e-3) - sdC.xy/max(-sdC.z, 1e-3);
  col += sunTint * exp(-abs(dd.y)*420.) * exp(-abs(dd.x)*9.) * .02 * vis;
  // pre-dawn crest: light that wraps the edge before the disc appears
  float crest = exp((mu - 1.)*60.) * (1. - vis) * smoothstep(-.07, 0., uSunOff);
  col += vec3(1., .5, .2) * crest * .38;

  float exposure = mix(1.3, .85, uDay);
  col = aces(col*exposure);
  col = pow(col, vec3(1./2.2));
  float pk = max(col.r, max(col.g, col.b));
  col *= mix(1., .9/pk, smoothstep(.9, 1., pk));   // soft ceiling: no pure-white glare
  vec2 fc = gl_FragCoord.xy;
  col += (h21(fc + fract(uT*7.)) + h21(fc*1.37 + 17.) - 1.) / 255.;   // triangular dither, kills banding
  gl_FragColor = vec4(col, 1.);
}
`;

const VERTEX_SHADER = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

/*
 * Phase keyframes. `at` is a CSS selector for a section on the page (or the
 * literal 'start' / 'end'). Each keyframe takes effect when that section's top
 * edge reaches the vertical middle of the viewport.
 *   off  : sun height above the planet's edge, degrees (negative = hidden behind it)
 *   az   : sun direction, degrees right of centre (auto-scaled on narrow screens)
 *   day  : morning warmth 0..1
 *   dusk : sunset warmth 0..1
 *   hz   : planet edge height below screen centre, in screen heights
 *          (0.43 = edge at ~7% from the bottom, 0.22 = edge at ~28% from the bottom)
 */
export const SKY_PHASES = [
  { at: 'start',       off: -2.4, az: 12.0, day: 0.00, dusk: 0.00, hz: 0.43 },
  { at: '#about',      off: -1.2, az: 12.6, day: 0.04, dusk: 0.00, hz: 0.22 },
  { at: '#experience', off:  0.6, az: 13.2, day: 0.25, dusk: 0.00, hz: 0.22 },
  { at: '#journey',    off:  2.0, az: 14.0, day: 0.55, dusk: 0.00, hz: 0.22 },
  { at: '#projects',   off:  4.4, az: 15.0, day: 0.90, dusk: 0.00, hz: 0.22 },
  { at: '#highlights', off:  5.0, az: 15.5, day: 1.00, dusk: 0.00, hz: 0.22 },
  { at: '#globe',      off:  4.8, az: 16.5, day: 0.95, dusk: 0.05, hz: 0.22 },
  { at: '#research',   off:  1.2, az: 18.0, day: 0.30, dusk: 0.80, hz: 0.22 },
  { at: '#skills',     off:  0.4, az: 18.3, day: 0.15, dusk: 0.95, hz: 0.22 },
  { at: '#leadership', off: -0.2, az: 18.6, day: 0.05, dusk: 1.00, hz: 0.22 },
  { at: 'end',         off: -2.6, az: 19.0, day: 0.00, dusk: 0.55, hz: 0.22 },
];

const KEYS = ['off', 'az', 'day', 'dusk', 'hz'];
const DEG = Math.PI / 180;

export function createSky({ canvas, phases = SKY_PHASES, root = document.documentElement, paused = false } = {}) {
  let destroyed = false, enabled = true;
  let reduce = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let K = [], target = 0, s = 0, dirty = true, raf = 0;

  // ---------- phase layout (pinned to sections, recomputed on any layout change) ----------
  const maxScroll = () => Math.max(root.scrollHeight - innerHeight, 1);
  const layout = () => {
    const max = maxScroll();
    let prev = -1;
    const present = phases.filter(ph => ph.at === 'start' || ph.at === 'end' || document.querySelector(ph.at));
    K = present.map(ph => {
      let y;
      if (ph.at === 'start') y = 0;
      else if (ph.at === 'end') y = max;
      else y = document.querySelector(ph.at).getBoundingClientRect().top + scrollY - innerHeight * 0.5;
      let sv = Math.min(Math.max(y / max, 0), 1);
      if (sv <= prev) sv = Math.min(prev + 0.004, 1);   // keep keyframes strictly increasing
      prev = sv;
      return Object.assign({ s: sv }, ph);
    });
    K[K.length - 1].s = 1;
  };

  // Catmull-Rom (cubic Hermite) through the keyframes: continuous velocity, no stop-start.
  const sample = v => {
    v = Math.min(Math.max(v, 0), 1);
    let i = 0; while (i < K.length - 2 && v > K[i + 1].s) i++;
    const k0 = K[Math.max(i - 1, 0)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(i + 2, K.length - 1)];
    const span = (k2.s - k1.s) || 1e-6;
    const t = Math.min(Math.max((v - k1.s) / span, 0), 1), t2 = t * t, t3 = t2 * t;
    const out = {};
    for (const k of KEYS) {
      const m1 = (k2[k] - k0[k]) / ((k2.s - k0.s) || 1) * span;
      const m2 = (k3[k] - k1[k]) / ((k3.s - k1.s) || 1) * span;
      out[k] = (2*t3 - 3*t2 + 1) * k1[k] + (t3 - 2*t2 + t) * m1 + (-2*t3 + 3*t2) * k2[k] + (t3 - t2) * m2;
    }
    out.day = Math.min(Math.max(out.day, 0), 1);
    out.dusk = Math.min(Math.max(out.dusk, 0), 1);
    return out;
  };

  const readScroll = () => { target = Math.min(Math.max(scrollY / maxScroll(), 0), 1); };
  const relayout = () => { layout(); readScroll(); dirty = true; };

  // Readability tokens consumed by sky.css (text shadow + section scrim follow the light).
  const setReadability = (day, dusk) => {
    root.style.setProperty('--sky-glow', `rgba(0,0,0,${(0.28 * Math.max(day, 0)).toFixed(3)})`);
    root.style.setProperty('--sky-scrim', (0.55 * Math.max(day, dusk * 0.7)).toFixed(3));
  };

  const onScroll = () => readScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('load', relayout);
  const ro = new ResizeObserver(relayout); ro.observe(document.body);
  relayout(); s = target;

  // ---------- WebGL ----------
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    // No WebGL: the poster image on <body> stays; readability tokens still follow scroll.
    const fallback = () => { const k = sample(target); setReadability(k.day, k.dusk); };
    addEventListener('scroll', fallback, { passive: true }); fallback();
    return {
      relayout, setPaused() {}, setEnabled() {},
      destroy() { removeEventListener('scroll', onScroll); removeEventListener('scroll', fallback); removeEventListener('load', relayout); ro.disconnect(); },
    };
  }
  const compile = (type, src) => {
    const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error('[sky] shader:', gl.getShaderInfoLog(o));
    return o;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, SKY_FRAGMENT_SHADER));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);  // one full-screen triangle
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), t: U('uT'), off: U('uSunOff'), az: U('uSunAz'), day: U('uDay'), dusk: U('uDusk'), drift: U('uDrift'), hz: U('uHorizon') };

  // Battery: low-power devices render smaller and idle slower; idles when nothing moves.
  const conn = navigator.connection || {};
  const lowPower = !!conn.saveData || (matchMedia('(pointer: coarse)').matches && (navigator.hardwareConcurrency || 4) <= 4);
  const maxScale = Math.min(devicePixelRatio || 1, 1.5) * (lowPower ? 0.5 : 0.8);
  let idleGap = reduce ? Infinity : (lowPower ? 100 : 50);   // twinkle + cloud drift at 10–20 fps
  let scale = maxScale, slow = 0, fast = 0;
  const resize = () => {
    canvas.width = Math.max(1, Math.round(innerWidth * scale));
    canvas.height = Math.max(1, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height); dirty = true;
  };
  addEventListener('resize', resize); resize();

  let last = performance.now(), lastDraw = 0, t = 0;
  const onVis = () => { last = performance.now(); dirty = true; };
  document.addEventListener('visibilitychange', onVis);

  const draw = () => {
    const k = sample(s);
    setReadability(k.day, k.dusk);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.off, k.off * DEG); gl.uniform1f(u.az, k.az * DEG);
    gl.uniform1f(u.day, k.day); gl.uniform1f(u.dusk, k.dusk);
    gl.uniform1f(u.hz, k.hz); gl.uniform1f(u.drift, (s - 0.5) * 1.2 * DEG);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = now => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden || !enabled) return;            // nothing renders in a background tab or when disabled
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const moving = Math.abs(target - s) > 1e-4;
    if (!reduce) t += dt;
    s += (target - s) * (reduce ? 1 : 1 - Math.exp(-dt * 2.2));   // critically damped follow, ~0.45 s
    if (!(moving || dirty || now - lastDraw >= idleGap)) return;
    if (moving) {                                        // adapt resolution only while it matters
      if (dt > 0.028) slow++; else if (dt < 0.018) fast++;
      if (slow > 20 && scale > 0.4) { scale *= 0.85; slow = fast = 0; resize(); }
      else if (fast > 240 && scale < maxScale) { scale = Math.min(scale / 0.85, maxScale); slow = fast = 0; resize(); }
    }
    draw(); lastDraw = now; dirty = false;
    if (!canvas.classList.contains('on')) canvas.classList.add('on');   // fade in over the poster
  };
  // Start after first paint so the page is readable immediately.
  const start = () => { raf = requestAnimationFrame(frame); };
  if (document.readyState === 'complete') setTimeout(start, 0); else addEventListener('load', () => setTimeout(start, 0), { once: true });

  return {
    relayout,
    /** Freeze twinkle/cloud drift and scroll easing (scroll still moves the sun). */
    setPaused(p) { reduce = p || matchMedia('(prefers-reduced-motion: reduce)').matches; idleGap = reduce ? Infinity : (lowPower ? 100 : 50); dirty = true; },
    /** false = hide the canvas and stop rendering; the poster on <body> remains. */
    setEnabled(on) { enabled = on; canvas.classList.toggle('on', on); dirty = true; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll); removeEventListener('load', relayout); removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis); ro.disconnect();
      gl.deleteBuffer(buf); gl.deleteProgram(prog);
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      root.style.removeProperty('--sky-glow'); root.style.removeProperty('--sky-scrim');
    },
  };
}
```

## Appendix B — `sky.css` (copy verbatim; only the poster `url(...)` path may change)

```css
/* sky.css — styles for the orbital sky background. Copy verbatim. */

/* 1. Page base: the poster is the first frame of the scene, shown instantly and kept as the no-WebGL fallback. */
html, body { background-color: #07080d; }
body {
  background-image: url("./sky-poster.jpg");   /* adjust path to wherever the poster is served */
  background-position: center bottom;
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 2. The canvas: fixed, full-viewport, behind everything, fades in over the poster on first draw. */
.sky-canvas {
  position: fixed; inset: 0;
  width: 100vw; height: 100%;
  z-index: 0;                       /* all page content must sit above this: position: relative; z-index: 1 */
  display: block;
  pointer-events: none;
  opacity: 0;
  transition: opacity .9s ease;
}
.sky-canvas.on { opacity: 1; }

/* 3. Readability: soft text shadow that strengthens in daylight (value set by sky.js). */
body { text-shadow: 0 1px 22px var(--sky-glow, transparent); }

/* 4. Readability: a soft dark pool behind each content section, stronger as the sky brightens.
      Add class "sky-scrim" to each top-level section wrapper (presentational only). */
.sky-scrim { position: relative; isolation: isolate; }
.sky-scrim::before {
  content: ""; position: absolute; inset: 40px -60px; z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse 42% 48% at 42% 50%,
              rgba(10,7,5, calc(.32 + var(--sky-scrim, 0))),
              rgba(10,7,5, 0) 100%);
}
/* The scrim overhangs its section by 60px each side; stop that from causing sideways scroll. */
.sky-page { overflow-x: clip; }

/* 5. Print: no sky. */
@media print { .sky-canvas { display: none !important; } body { background: #fff !important; text-shadow: none !important; } .sky-scrim::before { display: none; } }
```
