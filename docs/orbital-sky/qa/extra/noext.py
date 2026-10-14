from playwright.sync_api import sync_playwright
GL = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
with sync_playwright() as p:
    for name, init in (('with extension', ''), ('no extension', "const g = WebGLRenderingContext.prototype.getExtension; WebGLRenderingContext.prototype.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? null : g.call(this, n) };")):
        b = p.chromium.launch(args=GL)
        c = b.new_context(viewport={'width': 1440, 'height': 900}); c.add_init_script("sessionStorage.setItem('ap-intro-shown','1');" + init); pg = c.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type in ('error', 'warning') and errs.append(m.text))
        pg.add_init_script("window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(Math.round(e.duration))}).observe({type:'longtask',buffered:true})")
        pg.goto('http://localhost:4173/', wait_until='load')
        t0 = pg.evaluate('performance.now()')
        pg.wait_for_function("document.querySelector('canvas.sky-canvas')?.classList.contains('on')", timeout=20000)
        print(name, 'sky on at', round(pg.evaluate('performance.now()')), 'ms; canvases', pg.evaluate("document.querySelectorAll('canvas.sky-canvas').length"), 'errors', errs, 'longest task', max(pg.evaluate('window.__lt') or [0]))
        pg.wait_for_timeout(3000)
        lt = pg.evaluate("performance.getEntriesByType('longtask') ? 0 : 0")
        c.close(); b.close()
