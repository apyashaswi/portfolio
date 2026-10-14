"""Readability sweep over the whole page: at every scroll stop, every visible text element's own colour
against the 95th-percentile luminance of the sky behind its box (text hidden, paper grain off).
usage: python readability.py <base_url> <out_json> [step_px] [explorer|recruiter] [--hw]"""
import sys, io, json
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
STEP = int(sys.argv[3]) if len(sys.argv) > 3 else 450
MODE = sys.argv[4] if len(sys.argv) > 4 else 'explorer'
HW = '--hw' in sys.argv
import os
VW, VH = int(os.environ.get('VW', 1440)), int(os.environ.get('VH', 900))
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']   # real GPU, headless

def lin(c):
    c = np.asarray(c, dtype=np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lum(rgb):
    l = lin(rgb); return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]

# Leaf-ish text elements that sit directly on the sky (not inside a card/chip with its own opaque ground).
COLLECT = r"""(() => {
  const opaque = el => { for (let e = el; e && e !== document.body; e = e.parentElement) {
      const bg = getComputedStyle(e).backgroundColor; const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) { const a = m[1].split(',').map(Number); if ((a[3] ?? 1) >= 0.6) return true }
      if (getComputedStyle(e).backgroundImage.includes('gradient') && e.matches('.project-tilt,.project-tilt-featured,.skill-card,[class*=card]')) return true
    } return false };
  const out = [];
  for (const el of document.querySelectorAll('.sky-page h1,.sky-page h2,.sky-page h3,.sky-page h4,.sky-page p,.sky-page li,.sky-page a,.sky-page span,.sky-page figcaption,.sky-page div,.sky-page button')) {
    if (!el.closest('main,footer,section,.project-detail')) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 6 || r.bottom < 110 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    { let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; if (o < 0.5) continue }
    if (opaque(el)) continue;
    const sec = el.closest('section[id],footer');
    out.push({ box: [r.left, Math.max(r.top, 110), r.right, Math.min(r.bottom, innerHeight)], color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight,
      sec: sec ? (sec.id || 'footer') : '?', text: el.textContent.trim().slice(0, 48) });
  }
  return out })()"""
HIDE = """(() => { const s = document.createElement('style'); s.id = 'qa-hide';
  s.textContent = 'body::before,body::after{display:none!important} .sky-page *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important;caret-color:transparent!important} .sky-page img,.sky-page svg,.sky-page canvas,.sky-page video{visibility:hidden!important} .ask-ai,.scroll-top-btn,.masthead,.nav{visibility:hidden!important}';
  document.head.appendChild(s) })()"""

def parse_color(c):
    inner = c[c.index('(') + 1:c.rindex(')')]
    if c.startswith('color('):
        parts = inner.replace('/', ' ').split(); vals = [float(v) * 255 for v in parts[1:4]]
        return vals, (float(parts[4]) if len(parts) > 4 else 1.0)
    parts = [v.strip() for v in inner.replace('/', ',').split(',')]
    return [float(v) for v in parts[:3]], (float(parts[3]) if len(parts) > 3 else 1.0)

rows = []
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    c = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1)
    c.add_init_script(f"try{{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','{MODE}')}}catch(e){{}}")
    pg = c.new_page(); pg.goto(BASE + '/' + os.environ.get('ROUTE', '').lstrip('/'), wait_until='load')   # ROUTE without a leading slash (Git Bash rewrites /paths); pg.wait_for_timeout(4000)
    H = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
    for y in list(range(0, H, STEP)) + [H]:
        pg.evaluate(f'scrollTo({{top:{y},behavior:"instant"}})'); pg.wait_for_timeout(2400)
        els = pg.evaluate(COLLECT)
        pg.evaluate(HIDE); pg.wait_for_timeout(250)
        img = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('RGB')).astype(np.float64)
        pg.evaluate("document.getElementById('qa-hide').remove()")
        for e in els:
            l, t, r, bt = [int(round(v)) for v in e['box']]
            if bt - t < 34 and r - l > 10: l, t, r, bt = l + 3, t + 3, r - 3, bt - 3   # chips/badges: skip their border hairline, which is not what the glyphs sit on
            patch = img[max(t, 0):min(bt, VH), max(l, 0):min(r, VW)].reshape(-1, 3)
            if len(patch) < 20: continue
            p95 = float(np.percentile(lum(patch), 95))
            rgb, a = parse_color(e['color'])
            if a < 1: rgb = [a * c + (1 - a) * float(np.median(img[max(t,0):min(bt,VH), max(l,0):min(r,VW), i])) for i, c in enumerate(rgb)]   # composite translucent ink over its sky
            Lt = float(lum(np.array(rgb)))
            cr = (max(Lt, p95) + 0.05) / (min(Lt, p95) + 0.05)
            large = e['size'] >= 24 or (e['size'] >= 18.66 and e['weight'] >= 700)
            rows.append({**e, 'y': y, 'p95': round(p95, 4), 'cr': round(cr, 2), 'need': 3.0 if large else 4.5, 'alpha': a})
    b.close()

fails = [r for r in rows if r['cr'] < r['need']]
worst = sorted(rows, key=lambda r: r['cr'] / r['need'])[:25]
json.dump({'rows': rows, 'fails': fails}, open(OUT, 'w'), indent=1)
print(f'{len(rows)} text samples, {len(fails)} below AA ({len({(f["sec"], f["text"]) for f in fails})} distinct elements)')
for r in worst:
    print(f"{r['cr']:5.2f} (need {r['need']})  y={r['y']:5d} [{r['sec']}] {r['size']:.0f}px {r['color']}  {r['text']!r}")
