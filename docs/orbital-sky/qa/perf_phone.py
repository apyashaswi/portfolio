"""Low-end phone profile: 390x844, touch (coarse pointer), 4 cores, 4x CPU throttle.
sky.js's own low-power path (0.5x render scale, 10fps idle) should kick in.
usage: python perf_phone.py <base_url>"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for label, effects in (('sky on', 'full'), ('sky on, no token writes', 'full'), ('sky on, no text glow', 'full'), ('sky off', 'reduced')):
        c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        if 'no token' in label: c.add_init_script("(()=>{const sp=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(n,...a){if(this===document.documentElement.style&&n.startsWith('--sky-'))return;return sp.call(this,n,...a)}})()")
        c.add_init_script("Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4});"
                          f"try{{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-effects','{effects}')}}catch(e){{}}")
        pg = c.new_page(); pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3000)
        if 'no text glow' in label: pg.add_style_tag(content='body{text-shadow:none!important}')
        if 'no blur' in label: pg.add_style_tag(content='*,*::before{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}')
        info = pg.evaluate("(() => { const c = document.querySelector('canvas.sky-canvas'); return c ? [c.width, c.height, matchMedia('(pointer: coarse)').matches] : null })()")
        cdp = c.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        pg.evaluate('scrollTo({top:1500,behavior:"instant"})'); pg.wait_for_timeout(1500)
        pg.evaluate("window.__iv=[];let l=performance.now();(function f(t){window.__iv.push(t-l);l=t;if(window.__iv.length<300)requestAnimationFrame(f)})(l)")
        for _ in range(80): pg.mouse.wheel(0, 90); pg.wait_for_timeout(33)
        iv = sorted(pg.evaluate('window.__iv.slice(3)'))
        print(f"{label}: canvas(w,h,coarse)={info} 4x scroll p50 {iv[len(iv)//2]:.0f}ms p90 {iv[int(len(iv)*.9)]:.0f}ms p95 {iv[int(len(iv)*.95)]:.0f}ms", flush=True)
        c.close()
    b.close()
