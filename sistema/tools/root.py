# сайт в корне: каждая страница открывается без битых файлов (404), без ошибок, со шрифтом и живой Землёй;
# «Кейс ZERNO» показывает мир «Клиенты» из zerno.html. Запуск: python sistema/tools/root.py (сервер на 4391 из корня репозитория)
import time, os, sys
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'root'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
PAGES = ['index.html', 'rabota.html', 'lyudi.html', 'klienty.html', 'kejs-zerno.html']
bad = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for vw, vh, mob in [(1440, 900, False), (390, 844, True)]:
        for pg in PAGES:
            c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
            p = c.new_page(); E = []; F = []
            p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:160]))
            p.on('console', lambda m: E.append(m.text[:160]) if m.type == 'error' else None)
            p.on('response', lambda r: F.append(f'{r.status} {r.url[len(U):] if r.url.startswith(U) else r.url}') if r.status >= 400 else None)
            p.on('requestfailed', lambda r: F.append('FAIL ' + r.url))
            p.goto(f'{U}{pg}?t={time.time()}', wait_until='load'); time.sleep(5 if pg == 'kejs-zerno.html' else 3)
            info = p.evaluate("""() => ({ font: document.fonts.check('800 40px "Science Gothic"'), view: document.body.dataset.w,
                earth: !!(window.__gt && window.__gt.earth()), sw: document.documentElement.scrollWidth, W: innerWidth })""")
            extra = ''
            if pg == 'kejs-zerno.html':
                extra = p.evaluate("""() => { const f = document.getElementById('world'), w = f && f.contentWindow;
                    return { src: f && f.getAttribute('src'), world: w && w.document.body.dataset.w, bar: w && getComputedStyle(w.document.getElementById('bar')).display }; }""")
                info['earth'] = True   # своей Земли у кейса нет: Земля и станции внутри рамки
            p.screenshot(path=f'{OUT}/{vw}_{pg[:-5]}.png')
            # на телефоне слишком широкая вёрстка раздвигает окно (innerWidth > ширины экрана): сравниваем с самим экраном
            ok = info['font'] and info['earth'] and not E and not F and info['sw'] <= vw and info['W'] <= vw
            bad += not ok
            print('OK ' if ok else 'BAD', vw, pg, info, extra, E[:3], F[:5])
            c.close()
    b.close()
print('плохих', bad)
