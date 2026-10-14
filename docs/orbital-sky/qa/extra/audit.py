import json
from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
OBS = """window.__m = {cls: 0, lcp: null, lcpEl: null, long: 0};
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value }).observe({type: 'layout-shift', buffered: true});
new PerformanceObserver(l => { const e = l.getEntries().at(-1); window.__m.lcp = e.startTime; window.__m.lcpEl = e.element ? (e.element.tagName + '.' + e.element.className).slice(0, 60) : e.url }).observe({type: 'largest-contentful-paint', buffered: true});
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.long += Math.max(0, e.duration - 50) }).observe({type: 'longtask', buffered: true});
try{sessionStorage.setItem('ap-intro-shown','1')}catch(e){}"""
AXE = """axe.run(document, {resultTypes: ['violations']}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length,
  ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split(String.fromCharCode(10)).slice(1, 2).join(''))})))"""
out = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for label, vp, mob in (('desktop', {'width': 1440, 'height': 900}, False), ('phone', {'width': 390, 'height': 844}, True)):
        c = b.new_context(viewport=vp, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1); c.add_init_script(OBS); pg = c.new_page()
        cdp = c.new_cdp_session(pg)
        if mob:
            cdp.send('Network.enable'); cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 1.6e6 / 8, 'uploadThroughput': 750e3 / 8})
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        reqs = []
        def onresp(r):
            try: n = len(r.body())
            except Exception: n = 0
            reqs.append((r.url.rsplit('/', 1)[-1][:50], n // 1024))
        pg.on('response', onresp)
        pg.goto('http://localhost:4173/', wait_until='load'); pg.wait_for_timeout(6000)
        m = pg.evaluate('window.__m')
        nav = pg.evaluate("(() => { const n = performance.getEntriesByType('navigation')[0]; const f = performance.getEntriesByName('first-contentful-paint')[0]; return {load: Math.round(n.loadEventEnd), fcp: f && Math.round(f.startTime)} })()")
        initial = sum(r[1] for r in reqs)
        H = pg.evaluate('document.documentElement.scrollHeight')
        for y in range(0, H, 700): pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(150)
        pg.wait_for_timeout(2000)
        imgs = pg.evaluate("""[...document.images].filter(i => i.complete && i.naturalWidth).map(i => { const r = i.getBoundingClientRect(); return [i.currentSrc.split('/').pop(), i.naturalWidth + 'x' + i.naturalHeight, Math.round(r.width) + 'x' + Math.round(r.height), +(i.naturalWidth / Math.max(1, r.width * devicePixelRatio)).toFixed(1), i.loading, i.decoding, !!i.getAttribute('width')] })""")
        out[label] = {'metrics': m, 'nav': nav, 'initial_kB': initial, 'all_kB': sum(r[1] for r in reqs), 'top': sorted(reqs, key=lambda r: -r[1])[:10], 'imgs': imgs}
        if label == 'desktop':
            pg.add_script_tag(url='https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js')
            out['axe'] = pg.evaluate(AXE)
            out['headings'] = pg.evaluate("[...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ' ' + h.textContent.trim().slice(0, 40))")
            out['meta'] = pg.evaluate("""({title: document.title, desc: document.querySelector('meta[name=description]')?.content, og: document.querySelector('meta[property="og:image"]')?.content, canonical: document.querySelector('link[rel=canonical]')?.href, lang: document.documentElement.lang, jsonld: !!document.querySelector('script[type="application/ld+json"]'), icon: document.querySelector('link[rel~=icon]')?.href, theme: document.querySelector('meta[name=theme-color]')?.content})""")
        c.close()
    b.close()
print(json.dumps(out, indent=1, ensure_ascii=False))
