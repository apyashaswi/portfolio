import json
from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
OBS = """window.__m = {lcp: [], long: []};
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp.push([Math.round(e.startTime), e.element ? e.element.tagName + '.' + (e.element.className || '').toString().slice(0, 30) : '', e.size]) }).observe({type: 'largest-contentful-paint', buffered: true});
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.long.push([Math.round(e.startTime), Math.round(e.duration), (e.attribution || []).map(a => a.containerSrc || a.name).join(',')]) }).observe({type: 'longtask', buffered: true});
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for name, init in (('normal', "sessionStorage.setItem('ap-intro-shown','1')"), ('effects-off', "sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-effects','reduced')"), ('first-visit', "")):
        c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script(OBS + 'try{' + init + '}catch(e){}'); pg = c.new_page()
        pg.goto('http://localhost:4173/', wait_until='load'); pg.wait_for_timeout(7000)
        print(name, json.dumps(pg.evaluate('window.__m')))
        c.close()
    b.close()
