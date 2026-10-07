"""Phase 7 QA: axe (contrast + a11y), keyboard order, 360px overflow, console errors.
usage: python qa.py <base_url>"""
import sys, json, functools
from playwright.sync_api import sync_playwright
print = functools.partial(print, flush=True)
BASE = sys.argv[1]
AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'
INIT = "try{{localStorage.setItem('ap-mode','{m}');sessionStorage.setItem('ap-intro-shown','1')}}catch(e){{}};document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.setProperty('scroll-behavior','auto','important'))"

def settle(pg):
    h = pg.evaluate('document.body.scrollHeight')
    for y in range(0, h + 900, 700):
        pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(60)
    pg.wait_for_timeout(2500)
    pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(400)

with sync_playwright() as p:
    b = p.chromium.launch()
    # axe in reduced motion so every reveal is at its end state
    for mode in ('explorer', 'recruiter'):
        for route in ('/', '/projects/spidey'):
            c = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
            c.add_init_script(INIT.format(m=mode))
            pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.goto(BASE + route, wait_until='load'); settle(pg)
            pg.add_script_tag(url=AXE)
            r = pg.evaluate("""async () => {
              const r = await axe.run(document, { resultTypes: ['violations'], rules: { region: { enabled: false } } });
              return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length,
                nodes: v.nodes.slice(0, 6).map(n => n.target.join(' ') + ' :: ' + (n.any[0]?.message || n.failureSummary || '').slice(0, 140)) }))
            }""")
            print(f'\n== axe {mode} {route}: {len(r)} violation types; console errors: {errs[:3]}')
            for v in r:
                print(f"  [{v['impact']}] {v['id']} x{v['n']}")
                for n in v['nodes']: print('     ', n)
            c.close()

    # keyboard: first Tab lands on the skip link (intro shown -> dismissed)
    c = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = c.new_page(); pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(2600)
    pg.keyboard.press('Tab')
    print('\nfirst Tab after intro ->', pg.evaluate("document.activeElement.className || document.activeElement.tagName"))
    c.close()

    # 360px: no horizontal scroll anywhere
    for mode in ('explorer', 'recruiter'):
        for route in ('/', '/projects/pct'):
            c = b.new_context(viewport={'width': 360, 'height': 780})
            c.add_init_script(INIT.format(m=mode))
            pg = c.new_page(); pg.goto(BASE + route, wait_until='load'); settle(pg)
            wide = pg.evaluate("""[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.marquee,.drift-viewport,.nav-links,.showcase-sticky')}).slice(0,6).map(e=>e.className+' '+Math.round(e.getBoundingClientRect().right))""")
            print(f'360px {mode} {route}: scrollWidth', pg.evaluate('document.documentElement.scrollWidth'), 'overflowing:', wide)
            c.close()
    b.close()
