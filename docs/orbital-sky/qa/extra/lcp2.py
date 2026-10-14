import json, statistics
from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
OBS = """window.__m = {lcp: 0};
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp = Math.round(e.startTime) }).observe({type: 'largest-contentful-paint', buffered: true});
try{sessionStorage.setItem('ap-intro-shown','1')}catch(e){}"""
NOGL = "HTMLCanvasElement.prototype.getContext = function(){ return null };"
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for name, extra in (('sky', ''), ('no-webgl', NOGL), ('effects-off', "localStorage.setItem('ap-effects','reduced');")):
        r = []
        for i in range(4):
            c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script(OBS + extra); pg = c.new_page()
            pg.goto('http://localhost:4173/', wait_until='load'); pg.wait_for_timeout(5000)
            r.append(pg.evaluate("[window.__m.lcp, Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0), Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd)]"))
            c.close()
        print(name, r)
    b.close()
