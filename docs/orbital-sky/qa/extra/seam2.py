import io, sys, numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
VW = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
HIDE = 'body::before,body::after{display:none!important} .sky-page *{color:transparent!important;border-color:transparent!important;box-shadow:none!important} .sky-page img, .sky-page canvas, .ecg-monitor, .ecg-milestone-card, .impact-card, .project-tilt, .skill-card, .timeline-content, .company-mark, .section + .section::after, .footer::after, figcaption::before, .tag, .highlight-frame, [class*=card]{visibility:hidden!important}'
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    pg = b.new_page(viewport={'width': VW, 'height': 900}); pg.add_init_script("sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer')")
    pg.goto('http://localhost:4173/'); pg.wait_for_timeout(2500)
    seams = pg.evaluate("""(() => { const els = [...document.querySelectorAll('#main > .sky-scrim, footer.sky-scrim')]; const out = [];
      for (let i = 1; i < els.length; i++) out.push([(els[i-1].id || els[i-1].className.split(' ')[0]) + '/' + (els[i].id || els[i].className.split(' ')[0]), els[i].getBoundingClientRect().top + scrollY, els[i-1].getBoundingClientRect().bottom + scrollY]); return out })()""")
    worst = 0
    for name, top, prevBottom in seams:
        y0 = (top + prevBottom) / 2
        pg.evaluate(f'scrollTo({{top: {y0} - 450, behavior: "instant"}})'); pg.wait_for_timeout(2600)
        st = pg.add_style_tag(content=HIDE); pg.wait_for_timeout(250)
        on = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('L')).astype(float)
        off_tag = pg.add_style_tag(content='.sky-scrim::before{display:none!important}'); pg.wait_for_timeout(250)
        off = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('L')).astype(float)
        pg.evaluate("document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('visibility:hidden!important') || s.textContent.includes('.sky-scrim::before{display:none')) s.remove() })")
        cy = int(round(y0 - pg.evaluate('scrollY')))
        cols = slice(VW // 2 - 120, VW // 2 + 120)
        ys = range(max(cy - 160, 110), min(cy + 160, 899), 4)
        t = [on[y, cols].mean() / max(off[y, cols].mean(), 8) for y in ys if off[y, cols].mean() > 8]
        if not t: print(f'{name:28s} sky too dark to measure'); continue
        base = np.median(t); spread = max(t) - min(t)
        worst = max(worst, spread)
        print(f'{name:28s} gap {top - prevBottom:5.0f}px  transmission median {base:.2f}  min {min(t):.2f}  max {max(t):.2f}')
    print('worst spread', round(worst, 2))
    b.close()
