"""Scroll smoothness under 4x CPU throttle, with variants to isolate the cost.
usage: python perf.py <base_url> [variant ...]   variants: asis noblur nopanes effectsoff noglow"""
import sys, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; VARIANTS = sys.argv[2:] or ['asis', 'noblur', 'nopanes', 'noglow', 'effectsoff']
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
CSS = {
  'noblur': '*::before{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
  'nopanes': '.sky-scrim>.container::before,.sky-scrim>.container-prose::before,.footer>.footer-inner::before,.trust-strip>.trust-strip-inner::before,.about-figure>figcaption::before,.hero-portrait>figcaption::before{display:none!important}',
  'noglow': 'body{text-shadow:none!important}',
}
out = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for v in VARIANTS:
        c = b.new_context(viewport={'width': 1440, 'height': 900})
        init = "try{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer');" + ("localStorage.setItem('ap-effects','reduced')" if v == 'effectsoff' else '') + "}catch(e){}"
        if v == 'noprops': init += ";(()=>{const sp=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(n,...a){if(this===document.documentElement.style&&n.startsWith('--sky-'))return;return sp.call(this,n,...a)}})()"
        c.add_init_script(init)
        pg = c.new_page(); pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3000)
        if v in CSS: pg.add_style_tag(content=CSS[v])
        res = []
        for rate in (1, 4):
            cdp = c.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})
            pg.evaluate('scrollTo({top:2000,behavior:"instant"})'); pg.wait_for_timeout(1500)
            pg.evaluate("window.__iv=[];let l=performance.now();(function f(t){window.__iv.push(t-l);l=t;if(window.__iv.length<300)requestAnimationFrame(f)})(l)")
            for _ in range(90): pg.mouse.wheel(0, 80); pg.wait_for_timeout(33)
            iv = sorted(pg.evaluate('window.__iv.slice(3)'))
            res.append(f'{rate}x p50 {iv[len(iv)//2]:.0f}ms p95 {iv[int(len(iv)*.95)]:.0f}ms')
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
        out[v] = res; print(v, '|', ' || '.join(res), flush=True)
        c.close()
    b.close()
