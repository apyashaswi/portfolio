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
