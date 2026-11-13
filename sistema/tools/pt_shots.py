# «Люди», проявка: кадр каждого полушага (q = 0 … 5) на четырёх размерах; число растёт; сцена не двигается, пока прилипла; нет выхода за экран
import time, os, sys
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pt'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
SIZES = [(2000, 825, False), (1440, 900, False), (1024, 768, False), (390, 844, True)]
if len(sys.argv) > 1: SIZES = [s for s in SIZES if str(s[0]) in sys.argv[1:]]
QS = [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
REL = """() => { const s = document.querySelector('.pt-st').getBoundingClientRect(), r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left - s.left), Math.round(b.top - s.top), Math.round(b.width), Math.round(b.height)]; };
  return [r(document.querySelector('.pt-m')), r(document.querySelector('.pt-f')), r(document.querySelector('.pt-o')), r(document.querySelector('.pt-d')), r(document.querySelector('.pt-p')), ...[...document.querySelectorAll('.pt-o b, .pt-o .pt-k, .pt-v, .pt-d b, .pt-dk')].map(r)]; }"""
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for vw, vh, mob in SIZES:
        c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200]))
        p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
        p.goto(f'{U}lyudi.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
        p.evaluate("document.getElementById('l-kak').scrollIntoView({behavior:'instant'})"); time.sleep(2)
        rows = []; rel0 = None; moved = []
        for q in QS:
            g = p.evaluate('__pt.geo()')
            y = g['top'] - g['S0'] * (1 - q) if q <= 1 else g['top'] + (q - 1) / 4 * g['PIN']
            p.evaluate(f"scrollTo({{top:{y}, behavior:'instant'}})"); time.sleep(.45)
            info = p.evaluate("() => ({ cmp: document.querySelector('.pt').classList.contains('cmp'), q: __pt.q, n: document.querySelector('.pt-n').textContent, cap: document.querySelector('.pt-c span.on').textContent, on: document.querySelector('.pt-o li.on b').textContent, sw: document.documentElement.scrollWidth, W: innerWidth })")
            rel = p.evaluate(REL)
            if q >= 1 and q <= 4.9:
                if rel0 is None: rel0 = rel
                elif rel != rel0: moved.append(q)
            rows.append(f"{'cmp ' if info['cmp'] else ''}q={q:<4} -> {info['q']:.2f} N={info['n']:>3} [{info['on']}] {info['cap']} sw={info['sw']}/{info['W']}")
            p.screenshot(path=f'{OUT}/{vw}_q{int(q*10):02d}.png')
        print(vw, '\n  ' + '\n  '.join(rows)); print(vw, 'stage moved at', moved or 'never', 'errors', E)
        c.close()
    b.close()
