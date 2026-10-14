"""before/after shots. usage: python ba.py <base> <outdir>"""
import sys, os
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
INIT = "try{localStorage.setItem('ap-mode','explorer');sessionStorage.setItem('ap-intro-shown','1')}catch(e){}"
STOPS = [('impact', '#impact', 0), ('about', '#about', 0), ('about-photo', '.about-figure', 0), ('experience', '#experience', 0), ('experience-mid', '#experience', 0.5), ('journey', '#journey', 0), ('seen-across', '.trust-strip', 0)]
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for label, vp in (('desktop', {'width': 1440, 'height': 900}), ('phone', {'width': 390, 'height': 844})):
        c = b.new_context(viewport=vp); c.add_init_script(INIT); pg = c.new_page()
        pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(3000)
        for name, sel, frac in STOPS:
            pg.evaluate(f"""(() => {{ const e = document.querySelector('{sel}'); const r = e.getBoundingClientRect();
              scrollTo({{top: r.top + scrollY + r.height * {frac} - 90, behavior: 'instant'}}) }})()""")
            pg.wait_for_timeout(2600)
            pg.screenshot(path=f'{OUT}/{label}-{name}.png')
        print(label, 'scrollW', pg.evaluate('document.documentElement.scrollWidth'), 'innerW', pg.evaluate('innerWidth'))
        c.close()
    b.close()
