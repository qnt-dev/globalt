# «Клиенты», услуги: стопка. Кадры q = 0 … 4 на четырёх размерах; вёрстка главы (этапы, слой сцены) не двигается;
# нет выхода за экран; нет ошибок
import time, os, sys
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sf'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
SIZES = [(2000, 825, False), (1440, 900, False), (1024, 768, False), (390, 844, True)]
if len(sys.argv) > 1: SIZES = [s for s in SIZES if str(s[0]) in sys.argv[1:]]
QS = [0, .15, .3, .45, .6, .75, .9, 1.1, 1.3, 1.45, 1.6, 1.75, 1.9, 2.1, 2.27, 2.4, 2.52, 2.65, 2.9, 3.1, 3.27, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4]
REL = """() => { const s = document.querySelector('.sf-st').getBoundingClientRect(), r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left - s.left), Math.round(b.top - s.top), Math.round(b.width), Math.round(b.height)]; };
  return [r(document.querySelector('.sf-s')), r(document.querySelector('.sf-v')), r(document.querySelector('.sk')), ...[...document.querySelectorAll('.sf-o b, .sf-o .sf-k, .sf-d b')].map(r)]; }"""
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for vw, vh, mob in SIZES:
        c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200]))
        p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
        p.goto(f'{U}klienty.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
        p.evaluate("document.getElementById('k-uslugi').scrollIntoView({behavior:'instant'})"); time.sleep(1.5)
        rows = []; rel0 = None; moved = []
        for q in QS:
            y = p.evaluate(f'__sf.measure(), __sf.scrollFor({q})')
            p.evaluate(f"scrollTo({{top:{y}, behavior:'instant'}})"); time.sleep(.9)
            info = p.evaluate("() => ({ q: __sf.q, on: document.querySelector('.sf-o li.on b').textContent, full: document.querySelector('.sf').classList.contains('full'), sw: document.documentElement.scrollWidth, W: innerWidth })")
            rel = p.evaluate(REL)
            if rel0 is None: rel0 = rel
            elif rel != rel0: moved.append(q)
            rows.append(f"q={q:<4} -> {info['q']:.2f} [{info['on']}]{' full' if info['full'] else ''} sw={info['sw']}/{info['W']}")
            p.screenshot(path=f'{OUT}/{vw}_q{int(round(q*100)):03d}.png')
        print(vw, '\n  ' + '\n  '.join(rows)); print(vw, 'stage moved at', moved or 'never', 'errors', E)
        c.close()
    b.close()
