"""Acceptance screenshots for the orbital sky (prompt §6, checks 1-6 + 8).
usage: python shots.py <base_url> <out_dir> [explorer|recruiter]"""
import sys, os, json
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
MODE = sys.argv[3] if len(sys.argv) > 3 else 'explorer'
os.makedirs(OUT, exist_ok=True)
INIT = f"try{{localStorage.setItem('ap-mode','{MODE}');sessionStorage.setItem('ap-intro-shown','1')}}catch(e){{}}"
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']   # real GPU, headless
STOPS = ['top', 'impact', 'about', 'experience', 'journey', 'projects', 'highlights', 'globe', 'research', 'skills', 'leadership', 'bottom']

def go(pg, stop):
    if stop == 'top': pg.evaluate('scrollTo({top:0,behavior:"instant"})')
    elif stop == 'bottom': pg.evaluate('scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})')
    else:
        ok = pg.evaluate(f"""(() => {{ const e = document.getElementById('{stop}'); if (!e) return false;
          scrollTo({{top: e.getBoundingClientRect().top + scrollY - innerHeight * 0.5 + 2, behavior: 'instant'}}); return true }})()""")
        if not ok: return False
    pg.wait_for_timeout(2600)   # damped follow settles in ~2s
    return True

with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    log = {}
    for label, vp in (('desktop', {'width': 1440, 'height': 900}), ('phone', {'width': 390, 'height': 844})):
        c = b.new_context(viewport=vp, device_scale_factor=1)
        c.add_init_script(INIT)
        pg = c.new_page()
        msgs = []
        pg.on('console', lambda m: msgs.append(f'{m.type}: {m.text}'))
        pg.on('pageerror', lambda e: msgs.append(f'pageerror: {e}'))
        pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3500)
        for stop in STOPS:
            if not go(pg, stop): continue
            pg.screenshot(path=f'{OUT}/{label}-{MODE}-{stop}.png')
        log[label] = {
            'canvases': pg.evaluate("document.querySelectorAll('canvas.sky-canvas').length"),
            'canvasOn': pg.evaluate("document.querySelector('canvas.sky-canvas')?.classList.contains('on')"),
            'scrollW': pg.evaluate('document.documentElement.scrollWidth'), 'innerW': pg.evaluate('innerWidth'),
            'console': msgs,
        }
        c.close()
    b.close()
print(json.dumps(log, indent=1))
