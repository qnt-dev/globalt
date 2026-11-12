# поле «сто одинаковых» в «Услугах»: кадр каждого этапа на четырёх размерах; вёрстка не двигается, пока этапы сменяются
import time, os, sys
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'svc'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
G = """() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
  return [r(document.querySelector('.sv2')), r(document.querySelector('.field canvas')), r(document.getElementById('k-keys')), ...[...document.querySelectorAll('.svc li')].map(r)]; }"""
SIZES = [(2000, 825, False), (1440, 900, False), (1024, 768, False), (390, 844, True)]
if len(sys.argv) > 1: SIZES = [s for s in SIZES if str(s[0]) in sys.argv[1:]]
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for vw, vh, mob in SIZES:
        c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200]))
        p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
        p.goto(f'{U}klienty.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
        p.evaluate("document.getElementById('k-uslugi').scrollIntoView()"); time.sleep(.3)
        p.evaluate("scrollBy(0, document.querySelector('.sv2').getBoundingClientRect().top - (innerWidth > 760 ? 90 : 70))"); time.sleep(1.5)
        g0 = p.evaluate(G); moved = set()
        # сам перебирает этапы: снимок каждые 0.5 с, проверка вёрстки
        seen = []
        for k in range(44):
            time.sleep(.5); g = p.evaluate(G); st = p.evaluate('__svc.st')
            if g != g0: moved.add(st)
            if st not in seen: seen.append(st)
        print(vw, 'auto stages seen', seen, 'layout moved at', sorted(moved) or 'never')
        # каждый этап рукой: кадр через 3 с
        for s in range(5):
            if s: p.locator('.svc li').nth(s - 1).click() if mob else p.locator('.svc li').nth(s - 1).hover()
            else: p.evaluate('__svc.set(0, true)')
            time.sleep(3.2 if s else 1.5)
            p.screenshot(path=f'{OUT}/{vw}_s{s}.png')
        print(vw, 'counters', p.text_content('.fc-n'), '| caption', p.text_content('.fc-cap'))
        print(vw, 'errors', E); c.close()
    b.close()
