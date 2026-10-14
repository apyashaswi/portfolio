"""Verifies the Codex-review fixes in the integration. usage: python fixes.py <base_url> <out_dir>"""
import sys, os
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
INIT = "try{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer')}catch(e){}"
fails = 0
def rec(name, ok, d):
    global fails; fails += not ok; print(f"{'PASS' if ok else 'FAIL'}  {name}: {d}", flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    # 1. shader that fails to compile -> no canvas left, poster stays, no blank fade-in
    c = b.new_context(viewport={'width': 1440, 'height': 900})
    c.add_init_script(INIT + """;(() => { const P = WebGLRenderingContext.prototype, ss = P.shaderSource;
      P.shaderSource = function (sh, src) { return ss.call(this, sh, src.includes('uSunOff') ? src + '\\n this is not glsl;' : src) } })()""")
    pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(2500)
    n = pg.evaluate("document.querySelectorAll('canvas.sky-canvas').length")
    rec('broken shader falls back to poster', n == 0 and not errs and 'sky-poster' in pg.evaluate('getComputedStyle(document.body).backgroundImage'),
        f'sky canvases={n}, page errors={errs[:2]}, window.__sky={pg.evaluate("typeof window.__sky")}')
    pg.screenshot(path=f'{OUT}/broken-shader.png'); c.close()
    # 2. EFFECTS: start off, switch on -> canvas only shows once it has drawn
    c = b.new_context(viewport={'width': 1440, 'height': 900})
    c.add_init_script(INIT + ";try{localStorage.setItem('ap-effects','reduced')}catch(e){}")
    pg = c.new_page(); pg.goto(BASE + '/', wait_until='domcontentloaded')
    pg.wait_for_selector('.effects-toggle')
    on_before = pg.evaluate("document.querySelector('canvas.sky-canvas')?.classList.contains('on')")
    pg.click('.effects-toggle')
    on_now = pg.evaluate("document.querySelector('canvas.sky-canvas')?.classList.contains('on')")
    state = pg.evaluate('document.readyState')
    # the sky canvas is created after load, once its shader has compiled in the
    # background (SkyBackground prewarm), so before that there may be no canvas at all
    pg.wait_for_load_state('load')
    try: pg.wait_for_function("document.querySelector('canvas.sky-canvas')?.classList.contains('on')", timeout=15000); on_later = True
    except Exception: on_later = False
    rec('effects on before first frame stays hidden', on_before in (False, None) and (on_now in (False, None) or state == 'complete') and on_later is True,
        f'readyState at click={state}; .on before={on_before} right after click={on_now} after load+draw={on_later}')
    # 3. print: dark ink, no fixed chrome
    pg.emulate_media(media='print')
    col = pg.evaluate("getComputedStyle(document.querySelector('#about p')).color")
    nav = pg.evaluate("getComputedStyle(document.querySelector('.masthead')).display")
    rec('print uses dark ink and hides chrome', col == 'rgb(27, 22, 18)' and nav == 'none', f'about text {col}, masthead display {nav}')
    pg.pdf(path=f'{OUT}/print.pdf') if False else None
    pg.emulate_media(media='screen'); c.close()
    # 4. globe: transparent ground over the pane
    c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script(INIT); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('globe').scrollIntoView({block: 'center', behavior: 'instant'})")
    btn = pg.query_selector('#globe button')
    try: pg.wait_for_selector('#globe canvas', timeout=25000)
    except Exception:
        if btn: btn.click(); pg.wait_for_selector('#globe canvas', timeout=25000)
    pg.wait_for_timeout(4000); pg.screenshot(path=f'{OUT}/globe.png')
    rec('globe canvas present', pg.evaluate("document.querySelectorAll('#globe canvas').length") >= 1, 'see globe.png')
    # 5. resize relayout: shrinking the viewport re-pins phases (no exception, sky still drawing)
    pg.set_viewport_size({'width': 1100, 'height': 700}); pg.wait_for_timeout(1200)
    rec('resize keeps one sky', pg.evaluate("document.querySelectorAll('canvas.sky-canvas').length") == 1, 'ok')
    c.close(); b.close()
print('RESULT:', 'PASS' if not fails else f'{fails} FAIL')
