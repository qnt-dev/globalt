# раскрытая вакансия: фото, текст и табло; кадры роста фото; четыре размера; ошибки
import time, os
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vac'); os.makedirs(OUT, exist_ok=True)
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11'])
    for vw, vh, mob in [(2000, 825, False), (1440, 900, False), (1024, 768, False), (390, 844, True)]:
        c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1); p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append(str(e)[:200]))
        p.goto(f'http://127.0.0.1:4391/rabota.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
        p.evaluate("document.getElementById('r-vakansii').scrollIntoView(); scrollBy(0, 360)"); time.sleep(1)
        p.locator('.vr-h').nth(3).click()
        for k, t in enumerate([.12, .25, .45]): time.sleep(t if k == 0 else t - [.12, .25, .45][k - 1]); p.screenshot(path=f'{OUT}/{vw}_grow{k}.png')
        time.sleep(1.2)
        p.evaluate("document.querySelector('.vr.open').scrollIntoView({block:'start'}); scrollBy(0,-70)"); time.sleep(.8)
        p.screenshot(path=f'{OUT}/{vw}_open.png'); p.evaluate('scrollBy(0, innerHeight*.8)'); time.sleep(.6); p.screenshot(path=f'{OUT}/{vw}_open2.png')
        print(vw, 'ошибки', E); c.close()
    b.close()
