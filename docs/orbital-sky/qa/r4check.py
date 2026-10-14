"""Owner revision checks. usage: python r4check.py <base>"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; fails = 0
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
def rec(n, ok, d=''):
    global fails; fails += not ok; print(f"{'PASS' if ok else 'FAIL'}  {n}: {d}", flush=True)
PROBE = """(() => {
  const top = [...document.querySelectorAll('#main > section, #main > .sky-scrim, footer.footer')];
  const rect = [];
  const paint = (el, pseudo) => { const cs = getComputedStyle(el, pseudo);
    if (pseudo && cs.content === 'none') return null;
    const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || (cs.backgroundImage !== 'none' && !(pseudo === '::before' && el.classList.contains('sky-scrim')));
    const bf = cs.backdropFilter && cs.backdropFilter !== 'none'; const sh = cs.boxShadow !== 'none';
    return (bg || bf || sh) ? `${bg?'bg ':''}${bf?'backdrop ':''}${sh?'shadow':''}` : null };
  for (const s of top) {
    for (const [el, ps] of [[s, null], [s, '::before'], [s, '::after'], ...[...s.children].flatMap(c => [[c, null], [c, '::before'], [c, '::after']])]) {
      const r = paint(el, ps); if (r) rect.push(`${s.id || s.className.split(' ')[0]} > ${el === s ? '' : (el.className || el.tagName)}${ps || ''}: ${r}`) }
  }
  const unscrim = top.filter(s => !s.classList.contains('sky-scrim')).map(s => s.id || s.className);
  const band = s => { const r = s.getBoundingClientRect(), cs = getComputedStyle(s), pb = getComputedStyle(s, '::before');
    let t = r.top + parseFloat(pb.top), bt = r.bottom - parseFloat(pb.bottom);
    if (cs.overflowY === 'hidden') { t = Math.max(t, r.top); bt = Math.min(bt, r.bottom) }
    if (cs.overflowY === 'clip') { const m = parseFloat(cs.overflowClipMargin) || 0; t = Math.max(t, r.top - m); bt = Math.min(bt, r.bottom + m) }
    return [t, bt] };
  const fade = (s, side) => parseFloat(getComputedStyle(s, '::before').getPropertyValue('--fade-' + side)) || 0;
  const gaps = []; for (let i = 1; i < top.length; i++) { const a = band(top[i-1]), b = band(top[i]);
    // joined: both stretches full strength to a shared edge (no fade on either side, no gap)
    const overlap = a[1] - b[0];
    const ok = (Math.abs(overlap) < 1 && fade(top[i-1], 'bottom') === 0 && fade(top[i], 'top') === 0) || overlap >= 80;
    if (!ok) gaps.push(`${top[i-1].id||top[i-1].className.split(' ')[0]}->${top[i].id||top[i].className.split(' ')[0]} overlap ${overlap.toFixed(0)}px`) }
  return { n: top.length, rect, unscrim, gaps, sw: document.documentElement.scrollWidth, iw: innerWidth }
})()"""
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for mode in ('explorer', 'recruiter'):
        for vw, vh in ((1440, 900), (390, 844)):
            c = b.new_context(viewport={'width': vw, 'height': vh}); c.add_init_script(f"try{{sessionStorage.setItem('ap-intro-shown','1');localStorage.setItem('ap-mode','{mode}')}}catch(e){{}}")
            pg = c.new_page(); pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(2500)
            pg.evaluate('scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"})'); pg.wait_for_timeout(1200)
            r = pg.evaluate(PROBE); tag = f'{mode} {vw}px'
            rec(f'{tag}: no section rectangles ({r["n"]} sections)', not r['rect'], r['rect'][:6])
            rec(f'{tag}: every top-level section has the band', not r['unscrim'], r['unscrim'])
            rec(f'{tag}: neighbouring bands join flush (or overlap >=80px)', not r['gaps'], r['gaps'] or 'all')
            rec(f'{tag}: no horizontal scroll', r['sw'] <= r['iw'], f"{r['sw']} vs {r['iw']}")
            c.close()
    for route in ('projects/msig-mapping',):
        pass
    b.close()
print('RESULT:', 'PASS' if not fails else f'{fails} FAIL')
