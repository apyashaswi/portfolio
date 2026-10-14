import json, sys, io
from playwright.sync_api import sync_playwright
from PIL import Image

BASE, PID = sys.argv[1], sys.argv[2]

def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])

def cr(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

out = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--ignore-gpu-blocklist"])
    for vw, vh in ((1440, 900), (390, 844)):
        page = b.new_page(viewport={"width": vw, "height": vh})
        page.add_init_script("try{sessionStorage.setItem('ap-intro-shown','1');localStorage.removeItem('ap-effects')}catch(e){}")
        page.goto(f"{BASE}/projects/{PID}", wait_until="load")
        H = page.evaluate("() => document.documentElement.scrollHeight")
        for y in range(0, H, vh // 2):
            page.evaluate(f"() => scrollTo(0, {y})")
            page.wait_for_timeout(2200)
            runs = page.evaluate("""() => {
              const res = [];
              const w = document.createTreeWalker(document.querySelector('.project-detail') || document.body, NodeFilter.SHOW_TEXT);
              let n; while ((n = w.nextNode())) {
                if (!n.textContent.trim()) continue;
                const el = n.parentElement; const cs = getComputedStyle(el);
                if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
                const r = document.createRange(); r.selectNodeContents(n);
                for (const b of r.getClientRects()) {
                  if (b.width < 4 || b.bottom < 110 || b.top > innerHeight || b.top < 0) continue;
                  res.push({t: n.textContent.trim().slice(0, 40), c: cs.color, op: cs.opacity, x: b.left, y: b.top, w: b.width, h: b.height});
                }
              }
              return res;
            }""")
            page.add_style_tag(content=".project-detail, .project-detail * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow:none !important; border-color: transparent !important }")
            page.wait_for_timeout(150)
            img = Image.open(io.BytesIO(page.screenshot())).convert("RGB")
            page.evaluate("() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('color: transparent !important')) s.remove() })")
            for r in runs:
                import re
                m = [float(v) for v in re.findall(r"[\d.]+", r["c"])]
                if len(m) >= 4 and m[3] < 1:
                    pass
                fg = m[:3]
                px = []
                x0, y0 = int(max(0, r["x"])), int(max(0, r["y"]))
                x1, y1 = int(min(vw - 1, r["x"] + r["w"])), int(min(vh - 1, r["y"] + r["h"]))
                for yy in range(y0, y1, 2):
                    for xx in range(x0, x1, 2):
                        px.append(img.getpixel((xx, yy)))
                if not px: continue
                px.sort(key=lum)
                p95 = px[int(len(px) * 0.95) - 1 if len(px) > 1 else 0]
                c = cr(fg, p95)
                if c < 4.5:
                    out.append({"vw": vw, "scroll": y, "text": r["t"], "fg": r["c"], "bg95": p95, "cr": round(c, 2), "h": round(r["h"])})
        page.close()
    b.close()
seen = {}
for o in out:
    k = (o["vw"], o["text"])
    if k not in seen or o["cr"] < seen[k]["cr"]: seen[k] = o
print(len(seen))
for o in sorted(seen.values(), key=lambda o: o["cr"])[:40]:
    print(json.dumps(o))
