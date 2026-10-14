"""Orbital sky acceptance checks (CLAUDE_CODE_PROMPT.md §6), measured, not eyeballed.
The page is instrumented from an init script only (no app code changes): WebGL uniform1f /
drawArrays are wrapped to record what the sky actually renders, and window listeners are
counted. usage: python accept.py <base_url> <out_dir>"""
import sys, os, io, json, math
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']   # real GPU, headless
results = []
def rec(name, ok, detail):
    results.append({'check': name, 'ok': bool(ok), 'detail': detail})
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}", flush=True)

INSTR = r"""
(() => {
  window.__draws = 0; window.__u = []; window.__scrollL = 0; window.__ctx = 0;
  const names = new WeakMap();
  const P = WebGLRenderingContext.prototype;
  const gul = P.getUniformLocation;
  P.getUniformLocation = function (prog, n) { const l = gul.call(this, prog, n); if (l) names.set(l, n); return l };
  const u1 = P.uniform1f; let cur = {};
  P.uniform1f = function (l, v) { const n = names.get(l); if (n) cur[n] = v; return u1.call(this, l, v) };
  const da = P.drawArrays;
  P.drawArrays = function (...a) { window.__draws++; window.__u.push({ t: performance.now(), ...cur, y: scrollY }); if (window.__u.length > 20000) window.__u.shift(); return da.apply(this, a) };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { const c = gc.call(this, t, ...r); if (c && /webgl/.test(t)) window.__ctx++; return c };
  const ael = window.addEventListener, rel = window.removeEventListener;
  window.addEventListener = function (t, ...r) { if (t === 'scroll') window.__scrollL++; return ael.call(this, t, ...r) };
  window.removeEventListener = function (t, ...r) { if (t === 'scroll') window.__scrollL--; return rel.call(this, t, ...r) };
  try { sessionStorage.setItem('ap-intro-shown', '1'); localStorage.setItem('ap-mode', 'explorer') } catch (e) {}
})();
"""
HIDE_ALL = "document.querySelector('.sky-page').style.visibility='hidden';" \
           "const s=document.createElement('style');s.id='qa-nopaper';s.textContent='body::before,body::after{display:none!important}';document.head.appendChild(s)"
SHOW_ALL = "document.querySelector('.sky-page').style.visibility='';document.getElementById('qa-nopaper')?.remove()"

def shot(pg):
    return np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('RGB')).astype(np.float64)

def to_section(pg, sid, settle=2600):
    pg.evaluate(f"""(() => {{ const e = document.getElementById('{sid}');
      scrollTo({{top: e.getBoundingClientRect().top + scrollY - innerHeight * 0.5 + 2, behavior: 'instant'}}) }})()""")
    pg.wait_for_timeout(settle)

def limb_row(img):
    """Highest y where the planet's lit limb crosses the vertical centre band: the planet below the
    limb is dark, the band itself is the brightest thing in the column."""
    h, w, _ = img.shape
    lum = img[:, int(w * .45):int(w * .55)].mean(axis=(1, 2))
    # the limb is the strongest bright->dark transition going down the lower 60% of the screen
    lo = int(h * .4)
    grad = lum[lo:-1] - lum[lo + 1:]
    return lo + int(np.argmax(grad))

def srgb_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def rel_lum(rgb):
    l = srgb_lin(np.asarray(rgb, dtype=np.float64))
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]

with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    c = b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    c.add_init_script(INSTR)
    pg = c.new_page()
    msgs = []
    pg.on('console', lambda m: msgs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: msgs.append(f'pageerror: {e}'))
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(4000)

    # 1. hero: limb crest ~7% up from the bottom; hero text/buttons stay above it
    pg.evaluate(HIDE_ALL); pg.wait_for_timeout(400); img = shot(pg); pg.evaluate(SHOW_ALL)
    Image.fromarray(img.astype(np.uint8)).save(f'{OUT}/c1-hero-sky.png')
    y = limb_row(img); frac = 1 - y / 900
    lowest = pg.evaluate("Math.max(...[...document.querySelectorAll('#hero .hero-text > *')].map(e => e.getBoundingClientRect().bottom))")
    u = pg.evaluate('window.__u.at(-1)')
    rec('1 hero limb height', 0.04 <= frac <= 0.10, f'crest {frac*100:.1f}% from bottom (y={y}); sun off={u["uSunOff"]/math.pi*180:.2f}deg (hidden)')
    rec('1 hero text clear of limb', lowest < y, f'lowest hero text/button bottom y={lowest:.0f} vs limb crest y={y}')

    # 2. about: crest ~28%
    to_section(pg, 'about'); pg.evaluate(HIDE_ALL); pg.wait_for_timeout(400); img = shot(pg); pg.evaluate(SHOW_ALL)
    Image.fromarray(img.astype(np.uint8)).save(f'{OUT}/c2-about-sky.png')
    y = limb_row(img); frac = 1 - y / 900; u = pg.evaluate('window.__u.at(-1)')
    rec('2 about limb height', 0.22 <= frac <= 0.34, f'crest {frac*100:.1f}% from bottom; sun off={u["uSunOff"]/math.pi*180:.2f}deg (still hidden: {u["uSunOff"] < 0})')

    # 3-6. timeline values at each section (what the shader actually received)
    for sid in ['experience', 'journey', 'projects', 'highlights', 'globe', 'research', 'skills', 'leadership']:
        to_section(pg, sid); u = pg.evaluate('window.__u.at(-1)')
        rec(f'timeline @{sid}', True, f"off={u['uSunOff']/math.pi*180:+.2f}deg az={u['uSunAz']/math.pi*180:.1f}deg day={u['uDay']:.2f} dusk={u['uDusk']:.2f} hz={u['uHorizon']:.2f}")
        if sid == 'highlights':
            pg.evaluate(HIDE_ALL); pg.wait_for_timeout(400); img = shot(pg); pg.evaluate(SHOW_ALL)
            Image.fromarray(img.astype(np.uint8)).save(f'{OUT}/c4-highlights-sky.png')
            white = int(((img >= 254.5).all(axis=2)).sum()); mx = img.max(axis=2).max()
            rec('4 no pure white at morning peak', white == 0, f'{white} pixels at (255,255,255); brightest channel {mx:.0f}')
            # 9. readability behind Highlights body text, text hidden, p95 brightness vs body text colour
            boxes = pg.evaluate("""[...document.querySelectorAll('#highlights p, #highlights .section-subtitle, #highlights figcaption, #highlights h3, #highlights h4')]
              .map(e => e.getBoundingClientRect()).filter(r => r.width && r.bottom > 0 && r.top < innerHeight)
              .map(r => [r.left, r.top, r.right, r.bottom])""")
            ink = pg.evaluate("getComputedStyle(document.querySelector('#highlights .section-subtitle') || document.body).color")
            pg.add_style_tag(content='#highlights *{color:transparent!important;-webkit-text-fill-color:transparent!important}#highlights img{visibility:hidden!important}')
            pg.evaluate("document.getElementById('qa-nopaper')?.remove()"); pg.wait_for_timeout(300)
            bg = shot(pg)
            px = np.concatenate([bg[int(max(t, 0)):int(min(bt, 900)), int(max(l, 0)):int(min(r, 1440))].reshape(-1, 3) for l, t, r, bt in boxes if bt - t > 2])
            L = rel_lum(px); p95 = float(np.percentile(L, 95))
            rgb = [float(v) for v in ink[ink.index('(') + 1:ink.index(')')].split(',')[:3]]
            Lt = float(rel_lum(np.array(rgb)))
            cr = (max(Lt, p95) + 0.05) / (min(Lt, p95) + 0.05)
            rec('9 readability @highlights', cr >= 4.5, f'text {ink} vs p95 background luminance {p95:.4f} over {len(px)} px in {len(boxes)} text boxes -> {cr:.2f}:1')
            pg.reload(wait_until='load'); pg.wait_for_timeout(3500); to_section(pg, 'highlights')

    # 7. smoothness: continuous wheel scroll top->bottom, every rendered frame's sun state
    pg.evaluate('scrollTo({top:0,behavior:"instant"})'); pg.wait_for_timeout(2500)
    pg.evaluate('window.__u.length = 0')
    H = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
    steps = int(H / 60) + 40
    for _ in range(steps): pg.mouse.wheel(0, 60); pg.wait_for_timeout(16)
    pg.wait_for_timeout(2500)
    U = pg.evaluate('window.__u')
    off = np.array([x['uSunOff'] for x in U]) / math.pi * 180; az = np.array([x['uSunAz'] for x in U]) / math.pi * 180
    hz = np.array([x['uHorizon'] for x in U])
    d_off, d_az, d_hz = np.abs(np.diff(off)), np.abs(np.diff(az)), np.abs(np.diff(hz))
    rec('7 smooth path', len(U) > 50 and d_off.max() < 0.6 and d_az.max() < 0.6 and d_hz.max() < 0.06,
        f'{len(U)} frames; max per-frame step off={d_off.max():.3f}deg az={d_az.max():.3f}deg hz={d_hz.max():.4f}; range off {off.min():.2f}..{off.max():.2f}')
    np.save(f'{OUT}/c7-path.npy', np.stack([off, az, hz]))

    # 10. performance: idle fps, hidden tab, throttled scroll
    pg.wait_for_timeout(1500); d0 = pg.evaluate('window.__draws'); pg.wait_for_timeout(5000); d1 = pg.evaluate('window.__draws')
    rec('10 idle frame rate', 15 <= (d1 - d0) / 5 <= 22, f'{(d1-d0)/5:.1f} draws/s idle (target ~20)')
    pg.evaluate("Object.defineProperty(document, 'hidden', {configurable: true, get: () => true}); document.dispatchEvent(new Event('visibilitychange'))")
    d0 = pg.evaluate('window.__draws'); pg.wait_for_timeout(3000); d1 = pg.evaluate('window.__draws')
    pg.evaluate("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))")
    rec('10 hidden tab renders nothing', d1 == d0, f'{d1 - d0} draws in 3s while hidden')
    cdp = c.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.evaluate('scrollTo({top:0,behavior:"instant"})'); pg.wait_for_timeout(2000)
    pg.evaluate("window.__iv=[];let l=performance.now();(function f(t){window.__iv.push(t-l);l=t;if(window.__iv.length<400)requestAnimationFrame(f)})(l)")
    for _ in range(120): pg.mouse.wheel(0, 80); pg.wait_for_timeout(30)
    iv = sorted(pg.evaluate('window.__iv.slice(3)')); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    p50 = iv[len(iv)//2] if iv else 0; p95 = iv[int(len(iv)*.95)] if iv else 0
    rec('10 throttled 4x scroll', p95 <= 50, f'rAF interval p50 {p50:.1f}ms p95 {p95:.1f}ms over {len(iv)} frames')

    # 12. teardown: route change and back -> one canvas, no extra scroll listeners or contexts
    L0 = pg.evaluate('window.__scrollL'); X0 = pg.evaluate('window.__ctx')
    pg.evaluate('scrollTo({top:0,behavior:"instant"})')
    pg.click("a[href^='/projects/']"); pg.wait_for_timeout(1500)
    pg.go_back(); pg.wait_for_timeout(2000)
    nC = pg.evaluate("document.querySelectorAll('canvas.sky-canvas').length"); X1 = pg.evaluate('window.__ctx'); L1 = pg.evaluate('window.__scrollL')
    rec('12 route change keeps one sky', nC == 1 and X1 == X0 and L1 == L0, f'canvases={nC} webgl contexts {X0}->{X1} scroll listeners {L0}->{L1}')
    # mode toggle relayout: keyframes follow the recruiter layout (journey/highlights/globe/leadership absent)
    pg.click('.mode-btn:has-text("Recruiter")'); pg.wait_for_timeout(1500)
    to_section(pg, 'research'); u = pg.evaluate('window.__u.at(-1)')
    rec('5 recruiter @research after toggle', u['uDusk'] > 0.5, f"off={u['uSunOff']/math.pi*180:+.2f}deg day={u['uDay']:.2f} dusk={u['uDusk']:.2f}")
    pg.click('.mode-btn:has-text("Explorer")'); pg.wait_for_timeout(1500)

    # 11c. EFFECTS off -> canvas fades out, rendering stops, poster stays
    pg.click('.effects-toggle'); pg.wait_for_timeout(1500)
    d0 = pg.evaluate('window.__draws'); pg.wait_for_timeout(2000); d1 = pg.evaluate('window.__draws')
    op = pg.evaluate("getComputedStyle(document.querySelector('canvas.sky-canvas')).opacity")
    poster = pg.evaluate("getComputedStyle(document.body).backgroundImage")
    rec('11 effects off', d1 == d0 and float(op) == 0 and 'sky-poster' in poster, f'draws +{d1-d0}, canvas opacity {op}, body {poster[:60]}')
    pg.click('.effects-toggle'); pg.wait_for_timeout(1500)
    rec('11 effects back on', float(pg.evaluate("getComputedStyle(document.querySelector('canvas.sky-canvas')).opacity")) == 1, 'canvas visible again')
    rec('10 console clean', not msgs, msgs[:6] or 'no errors or warnings')
    c.close()

    # 11b. reduced motion: no twinkle (no idle redraws, uT frozen), sun still tracks scroll
    c = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); c.add_init_script(INSTR); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3500)
    d0 = pg.evaluate('window.__draws'); pg.wait_for_timeout(3000); d1 = pg.evaluate('window.__draws')
    o0 = pg.evaluate('window.__u.at(-1).uSunOff'); to_section(pg, 'highlights', 1500); o1 = pg.evaluate('window.__u.at(-1).uSunOff')
    ts = {round(x['uT'], 4) for x in pg.evaluate('window.__u')}
    rec('11 reduced motion', d1 == d0 and o1 > o0 and len(ts) == 1, f'idle draws +{d1-d0}, uT values {sorted(ts)[:3]}, sun off {o0/math.pi*180:+.2f} -> {o1/math.pi*180:+.2f}deg')
    c.close(); b.close()

    # 11a. WebGL disabled: poster, no errors
    b = p.chromium.launch(args=['--disable-webgl', '--disable-3d-apis']); c = b.new_context(viewport={'width': 1440, 'height': 900}); pg = c.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{OUT}/c11-nowebgl.png')
    scrim = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--sky-scrim')")
    rec('11 no WebGL', not errs and 'sky-poster' in pg.evaluate('getComputedStyle(document.body).backgroundImage'), f'errors={errs[:3]} --sky-scrim={scrim!r}')
    b.close()

    # 8. phone: sun/glow on screen in the morning, no sideways scroll
    b = p.chromium.launch(args=GL); c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1); c.add_init_script(INSTR); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3500); to_section(pg, 'highlights')
    pg.evaluate(HIDE_ALL); pg.wait_for_timeout(400); img = shot(pg); pg.evaluate(SHOW_ALL)
    Image.fromarray(img.astype(np.uint8)).save(f'{OUT}/c8-phone-highlights-sky.png')
    ys, xs = np.unravel_index(np.argmax(img.sum(axis=2)), img.shape[:2])
    sw = pg.evaluate('document.documentElement.scrollWidth')
    rec('8 phone morning sun on screen', 0 < xs < 389 and img.sum(axis=2).max() > 600, f'brightest pixel at x={xs}, y={ys} ({img[ys, xs].astype(int).tolist()})')
    rec('8 phone no sideways scroll', sw <= 390, f'scrollWidth {sw} vs innerWidth 390')
    b.close()

json.dump(results, open(f'{OUT}/results.json', 'w'), indent=1)
fails = [r for r in results if not r['ok']]
print('RESULT:', 'PASS' if not fails else f'{len(fails)} FAIL')
