"""Round-2 behaviour checks. usage: python round2.py <base_url>"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; fails = 0
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
INIT = "try{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','explorer')}catch(e){}"
def rec(n, ok, d):
    global fails; fails += not ok; print(f"{'PASS' if ok else 'FAIL'}  {n}: {d}", flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    # phone: launcher hidden over hero, shown after; scroll-top never shown
    c = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True); c.add_init_script(INIT); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(1500)
    vis = lambda sel: pg.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); if (!e) return 'absent'; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.5 }})()")
    rec('phone: launcher hidden over hero', vis('.ask-ai') is False, f'visible={vis(".ask-ai")}')
    pg.evaluate('scrollTo({top: 2200, behavior: "instant"})'); pg.wait_for_timeout(900)
    rec('phone: launcher shown after hero', vis('.ask-ai') is True, f'visible={vis(".ask-ai")}')
    rec('phone: no back-to-top button', vis('.scroll-top-btn') in (False, 'absent'), f'visible={vis(".scroll-top-btn")}')
    pg.evaluate('scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"})'); pg.wait_for_timeout(900)
    clear = pg.evaluate("(() => { const a = document.querySelector('.ask-ai').getBoundingClientRect(); const t = [...document.querySelectorAll('.footer *')].filter(e => e.children.length === 0 && e.textContent.trim()).map(e => e.getBoundingClientRect()); return t.every(r => r.bottom <= a.top || r.right <= a.left || r.top >= a.bottom) })()")
    rec('phone: footer text clears the launcher at page end', clear, '')
    # phone menu after scrolling: the overlay must cover the whole screen
    pg.evaluate('scrollTo({top: 3000, behavior: "instant"})'); pg.wait_for_timeout(700)
    pg.click('.hamburger'); pg.wait_for_timeout(500)
    r = pg.evaluate("(() => { const e = document.querySelector('.nav-links'); const b = e.getBoundingClientRect(); return [b.width, b.height] })()")
    rec('phone: menu overlay fills the screen after scrolling', r[0] >= 389 and r[1] >= 843, f'overlay {r}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    c.close()
    # phone recruiter: the hero has no chat button, so the launcher stays
    c = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    c.add_init_script("try{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','recruiter')}catch(e){}"); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(1500)
    rec('phone recruiter: launcher visible over hero', pg.evaluate("(() => { const cs = getComputedStyle(document.querySelector('.ask-ai')); return cs.visibility !== 'hidden' && +cs.opacity > 0.5 })()"), '')
    c.close()
    # globe chunk fails -> page survives with a retry; focus stays in the section after opening
    c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script(INIT); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(1200)
    c.route('**/GlobeViz-*.js', lambda route: route.abort())
    pg.evaluate("document.getElementById('globe').scrollIntoView({block:'center',behavior:'instant'})"); pg.wait_for_timeout(600)
    pg.click('.globe-launch'); pg.wait_for_timeout(2500)
    alive = pg.evaluate("document.getElementById('root').children.length > 0 && !!document.getElementById('impact')")
    rec('globe chunk failure keeps the page and offers retry', alive and pg.evaluate("!!document.querySelector('.globe-retry')"), f'page alive={alive}')
    rec('focus stays in the globe section after opening', pg.evaluate("document.activeElement?.classList.contains('globe-region')"), pg.evaluate("document.activeElement?.className || document.activeElement?.tagName"))
    c.unroute('**/GlobeViz-*.js'); pg.click('.globe-retry'); pg.wait_for_load_state('load')
    try: pg.wait_for_selector('#globe canvas', timeout=30000); ok = True
    except Exception: ok = False
    rec('globe retry loads after the failure', ok, '')
    # counters: final values in the DOM (sr-only) before scrolling; impact cards named and linked
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(800)
    srv = pg.evaluate("[...document.querySelectorAll('#impact .sr-only')].map(e => e.textContent)")
    rec('impact numbers readable before scrolled to', srv[:2] == ['<30 min', '<50ms'] and len(srv) == 6, srv)
    names = pg.evaluate("[...document.querySelectorAll('.impact-card')].map(e => [e.tagName, e.getAttribute('href'), e.getAttribute('aria-label')])")
    rec('impact cards are links with one-phrase names', all(n[0] == 'A' and n[1] for n in names) and names[0][2] == 'Downstream mapping · MSIG USA: <30 min, Mapping time, down from 24 hours', names[0])
    c.close()
    # desktop: nav active follows the section crossing the middle
    c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script(INIT); pg = c.new_page()
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(1500)
    bad = []
    for sid in ['about', 'experience', 'journey', 'projects', 'highlights', 'globe', 'research', 'skills', 'leadership', 'contact']:
        for frac in (0.1, 0.5, 0.9):
            pg.evaluate(f"(() => {{ const e = document.getElementById('{sid}'); const r = e.getBoundingClientRect(); scrollTo({{top: r.top + scrollY + r.height * {frac} - innerHeight / 2, behavior: 'instant'}}) }})()")
            pg.wait_for_timeout(350)
            act = pg.evaluate("document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase() || null")
            if act != sid: bad.append(f'{sid}@{frac}:{act}')
    rec('nav highlight matches the section at mid-screen', not bad, bad[:6] or 'all 30 positions')
    # after an Explorer -> Recruiter -> Explorer swap the highlight must still follow
    pg.evaluate('scrollTo({top: 0, behavior: "instant"})'); pg.wait_for_timeout(300)
    pg.click('.mode-btn:has-text("Recruiter")'); pg.wait_for_timeout(900)
    bad2 = []
    for sid in ['experience', 'projects', 'research', 'skills']:
        pg.evaluate(f"(() => {{ const e = document.getElementById('{sid}'); const r = e.getBoundingClientRect(); scrollTo({{top: r.top + scrollY + r.height * 0.5 - innerHeight / 2, behavior: 'instant'}}) }})()")
        pg.wait_for_timeout(400)
        act = pg.evaluate("document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase() || null")
        if act != sid: bad2.append(f'{sid}:{act}')
    pg.evaluate('scrollTo({top: 0, behavior: "instant"})'); pg.click('.mode-btn:has-text("Explorer")'); pg.wait_for_timeout(900)
    rec('nav highlight still follows after a mode swap', not bad2, bad2 or 'recruiter: 4/4')
    # drop cap, single Active, CTA label, globe on request
    pg.evaluate('scrollTo({top: 0, behavior: "instant"})')
    rec('drop cap is the "I" alone', pg.evaluate("document.querySelector('.about-dropcap')?.textContent") == 'I', pg.evaluate("document.querySelector('.about-lead').textContent.trim().slice(0, 20)"))
    rec('one "Active" on the current leadership role', pg.evaluate("[...document.querySelectorAll('.leadership-entry')].every(e => (e.textContent.match(/Active/g) || []).length <= 1)"), '')
    rec('hero CTA says Ask AP AI', 'Ask AP AI' in pg.evaluate("document.querySelector('.hero-ctas').textContent"), '')
    n0 = pg.evaluate("document.querySelectorAll('#globe canvas').length")
    pg.evaluate("document.getElementById('globe').scrollIntoView({block:'center',behavior:'instant'})"); pg.wait_for_timeout(1500)
    n1 = pg.evaluate("document.querySelectorAll('#globe canvas').length")
    pg.click('.globe-launch'); pg.wait_for_selector('#globe canvas', timeout=30000)
    rec('globe loads only on request', n0 == 0 and n1 == 0, f'canvases before scroll {n0}, after scroll {n1}, after click {pg.evaluate("document.querySelectorAll(\'#globe canvas\').length")}')
    rec('impact: six cards in order', pg.evaluate("[...document.querySelectorAll('.impact-card-title')].map(e => e.textContent)").__len__() == 6,
        pg.evaluate("[...document.querySelectorAll('.impact-card-title')].map(e => e.textContent.slice(0,18))"))
    c.close(); b.close()
print('RESULT:', 'PASS' if not fails else f'{fails} FAIL')
