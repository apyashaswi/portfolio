"""Content snapshot of the portfolio: all text, links, images per route+mode.
usage: python snapshot.py <base_url> <out.json>
"""
import json, sys, re
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
ROUTES = ['/', '/projects/spidey', '/projects/warehouse', '/projects/uav', '/projects/pct']
MODES = ['recruiter', 'explorer']

JS = r"""
() => {
  const root = document.body.cloneNode(true);
  root.querySelectorAll('script,style,noscript,canvas,svg title').forEach(n => n.remove());
  // aria-hidden decorative duplicates (e.g. marquee copies) are still content; keep them
  const parts = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) parts.push(w.currentNode.nodeValue);
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
  const imgs = [...document.querySelectorAll('img')].map(i => (i.getAttribute('src')||'') + ' | ' + (i.getAttribute('alt')||''));
  const labels = [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label'));
  return {text, links, imgs, labels};
}
"""

def words(t):
    return re.findall(r"[\w$%+#@./'’–—-]+", t)

res = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for mode in MODES:
        ctx = b.new_context(reduced_motion='reduce', viewport={'width': 1440, 'height': 900})
        ctx.add_init_script(f"try{{localStorage.setItem('ap-mode','{mode}');localStorage.setItem('ap-effects','reduced');sessionStorage.setItem('ap-intro-seen','1')}}catch(e){{}}")
        pg = ctx.new_page()
        for r in ROUTES:
            pg.goto(BASE + r, wait_until='load'); pg.wait_for_timeout(1200)
            # scroll through to trigger lazy sections
            h = pg.evaluate('document.body.scrollHeight')
            for y in range(0, h + 900, 600):
                pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(40)
            pg.wait_for_timeout(3000)
            d = pg.evaluate(JS)
            d['words'] = sorted(set(words(d['text'])))
            res[f'{mode} {r}'] = d
        ctx.close()
    b.close()
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: len(v['words']) for k, v in res.items()})
