# стык страниц без потерь: кадры прямо из браузера (CDP Page.startScreencast, PNG), каждый кадр отрисовки.
# Для каждого перехода: яркость космоса и разница соседних кадров в части Земли без текста вокруг смены страницы.
# Зерно плёнки меняется 14 раз в секунду и само даёт разницу около 1 — это норма; мигание — разница больше 1,5 на стыке.
import time, os, sys, base64, io
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
U = 'http://127.0.0.1:4391/'
vw, vh = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1440, 900)
# зоны в долях кадра: (космос), (Земля без текста)
ZS = {'sec': ((.62, .09, .97, .155), (.58, .66, .99, .84)), 'home': ((.02, .12, .14, .3), (.32, .16, .68, .44)) if vw > vh else ((.02, .1, .14, .16), (.2, .12, .8, .27))}
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    c = b.new_context(viewport={'width': vw, 'height': vh}); p = c.new_page(); E = []
    p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:300]))
    p.goto(f'{U}index.html?t={time.time()}', wait_until='load'); time.sleep(4)
    p.locator('#hub .hub-t button').nth(0).hover(); time.sleep(2)
    def leg(name, start, dest, zone):
        FR = []; cdp = c.new_cdp_session(p)
        def on_frame(ev):
            FR.append((time.time(), ev['data']))
            try: cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
            except Exception: pass
        cdp.on('Page.screencastFrame', on_frame); cdp.send('Page.startScreencast', {'format': 'png', 'everyNthFrame': 1})
        start(); p.wait_for_url(f'**/{dest}', timeout=15000); tn = time.time()
        t = time.time()
        while time.time() - t < 2.2: p.wait_for_timeout(50)
        try: cdp.send('Page.stopScreencast')
        except Exception: pass
        (sx0, sy0, sx1, sy1), (zx0, zy0, zx1, zy1) = ZS[zone]; prev = None; worst = 0; out = []
        for ts, data in FR:
            im = np.asarray(Image.open(io.BytesIO(base64.b64decode(data))).convert('L'), dtype=np.float32); h, w = im.shape
            sky = im[int(h * sy0):int(h * sy1), int(w * sx0):int(w * sx1)].mean(); z = im[int(h * zy0):int(h * zy1), int(w * zx0):int(w * zx1)]
            d = float(np.abs(z - prev).mean()) if prev is not None else 0; prev = z; dt = ts - tn
            if -.35 < dt < 1.2: out.append(f'{dt:+.2f}:{sky:.2f}/{d:.2f}'); worst = max(worst, d) if dt > -.25 else worst
        print(name, 'кадров', len(FR), 'наибольшая разница у стыка', round(worst, 2), 'ошибки', E[:2]); E.clear()
        print('  ', ' '.join(out))
    leg('главная→работа', lambda: p.locator('#hub .hub-go').click(), 'rabota.html', 'sec'); time.sleep(1.5)
    leg('работа→люди', (lambda: p.evaluate("__hero.leave('lyudi', 'lyudi.html')")) if vw < 760 else (lambda: p.click('#nav a[href="lyudi.html"]')), 'lyudi.html', 'sec'); time.sleep(1.5)
    leg('люди→главная', lambda: p.click('#logo'), 'index.html', 'home')
    c.close(); b.close()
