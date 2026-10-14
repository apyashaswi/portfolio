"""Masthead + nav text contrast over the frosted top bar, at every sky phase.
usage: python topbar.py <base_url>"""
import sys, io
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; fails = 0
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
def lin(c):
    c = np.asarray(c, float) / 255; return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def L(rgb): l = lin(rgb); return .2126 * l[..., 0] + .7152 * l[..., 1] + .0722 * l[..., 2]
COLLECT = """[...document.querySelectorAll('.masthead *, .nav *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
  .filter(e => e.checkVisibility({opacityProperty: true}) && !e.closest('.mode-btn.active') && !e.closest('.nav-links.open'))
  .map(e => { const r = e.getBoundingClientRect(); return {t: e.textContent.trim().slice(0, 24), c: getComputedStyle(e).color, b: [r.left, r.top, r.right, r.bottom]} })
  .filter(x => x.b[2] - x.b[0] > 4 && x.b[3] < 120)"""
HIDE = "(() => { const s = document.createElement('style'); s.id = 'qa-h'; s.textContent = 'body::before,body::after{display:none!important} .masthead *, .nav *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important} .nav img,.masthead img{visibility:hidden!important}'; document.head.appendChild(s) })()"
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for vw, vh in ((1440, 900), (390, 844)):
        c = b.new_context(viewport={'width': vw, 'height': vh}); c.add_init_script("try{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer')}catch(e){}")
        pg = c.new_page(); pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3000)
        H = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
        worst = (99, '')
        for y in range(0, H, 700):
            pg.evaluate(f'scrollTo({{top:{y},behavior:"instant"}})'); pg.wait_for_timeout(2300)
            els = pg.evaluate(COLLECT); pg.evaluate(HIDE); pg.wait_for_timeout(200)
            shots = []
            for _ in range(3):   # a failure must reproduce on every capture to count (compositor timing noise)
                shots.append(np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('RGB')).astype(float)); pg.wait_for_timeout(250)
            img = np.minimum.reduce(shots)
            pg.evaluate("document.getElementById('qa-h').remove()")
            for e in els:
                l, t, r, bt = [int(round(v)) for v in e['b']]
                patch = img[max(t, 0):min(bt, vh), max(l, 0):min(r, vw)].reshape(-1, 3)
                if len(patch) < 20: continue
                bg = float(np.percentile(L(patch), 95))
                col = e['c']; inner = col[col.index('(') + 1:col.rindex(')')]
                rgb = [float(v) * (255 if col.startswith('color(') else 1) for v in (inner.split()[1:4] if col.startswith('color(') else inner.replace('/', ',').split(',')[:3])]
                cr = (max(L(np.array(rgb)), bg) + .05) / (min(L(np.array(rgb)), bg) + .05)
                if cr < worst[0]: worst = (cr, f"y={y} {e['t']!r} {col}")
                if cr < 4.5: fails += 1; print(f'FAIL {vw}px y={y} {cr:.2f} {e["t"]!r} {col}', flush=True)
        print(f'{vw}px worst {worst[0]:.2f} {worst[1]}', flush=True)
        c.close()
    b.close()
print('RESULT:', 'PASS' if not fails else f'{fails} FAIL')
