import io, numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    pg = b.new_page(viewport={'width': 1440, 'height': 900}); pg.add_init_script("sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer')")
    pg.goto('http://localhost:4173/'); pg.wait_for_timeout(2500)
    pg.evaluate("(() => { const e = document.getElementById('projects'); scrollTo({top: e.getBoundingClientRect().top + scrollY - 450, behavior: 'instant'}) })()"); pg.wait_for_timeout(3000)
    pg.add_style_tag(content='body::before,body::after{display:none!important} .sky-page *{color:transparent!important;border-color:transparent!important} .sky-page img, .ecg-monitor, .ecg-milestone-card, .section + .section::after{visibility:hidden!important}')
    pg.wait_for_timeout(400)
    on = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('L')).astype(float)
    pg.add_style_tag(content='.sky-scrim::before{display:none!important}'); pg.wait_for_timeout(400)
    off = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('L')).astype(float)
    top = pg.evaluate("document.getElementById('projects').getBoundingClientRect().top")
    print('projects top at', round(top))
    for x in (720, 300, 1180):
        t = on[:, x-20:x+20].mean(1) / np.maximum(off[:, x-20:x+20].mean(1), 1)
        print('x', x, ' '.join(f'{y}:{t[y]:.2f}' for y in range(int(top) - 140, int(top) + 141, 20)))
    b.close()
