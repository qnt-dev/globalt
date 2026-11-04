import sys
from playwright.sync_api import sync_playwright as S
sys.stdout.reconfigure(encoding='utf-8')
OUT = sys.argv[1]
U = 'file:///C:/PRDJKT/GT/zatmenie/maket/maket3.html'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl']
with S() as pw:
    b = pw.chromium.launch(channel='chrome', args=ARGS, headless=False)
    for W, H, dsf in ((1440, 900, 1), (1024, 768, 1), (1920, 1080, 1), (390, 844, 1.5), (320, 640, 1.5)):
        c = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=dsf); p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append(str(e)[:300])); p.on('console', lambda m: E.append(m.text[:300]) if m.type in ('error', 'warning') and 'favicon' not in m.text else None)
        for v in ((1, 8, 10, 12) if W in (1440, 390) else (12,)):
            p.goto('about:blank'); p.goto(f'{U}?v={v}', wait_until='load'); p.wait_for_timeout(1100)
            p.screenshot(path=f'{OUT}m3_{W}_{v}.png')
        print(W, E, p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect();const r=e=>[Math.round(e.left),Math.round(e.top),Math.round(e.right),Math.round(e.bottom)];return {w:r(q('#w')),line:r(q('#line')),btns:r(q('#btns')),foot:r(q('#foot')),sw:document.documentElement.scrollWidth}})()"))
        c.close()
    b.close()
