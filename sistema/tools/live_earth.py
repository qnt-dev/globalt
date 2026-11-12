# живая Земля на первом экране: снимок сразу, через 6 с (повернулась) и после перетаскивания мышью; три размера
import time, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'live'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for (vw, vh, mob) in [(1440, 900, False), (2000, 825, False), (390, 844, True)]:
        for pg in ['rabota', 'lyudi', 'klienty']:
            c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
            p = c.new_page(); E = []
            p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200])); p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
            p.goto(f'{U}{pg}.html?t={time.time()}', wait_until='load'); time.sleep(5)
            on = p.evaluate("!!document.querySelector('.hero-gl.on')")
            a = f'{OUT}/{pg}_{vw}_a.png'; p.screenshot(path=a); time.sleep(6); bb = f'{OUT}/{pg}_{vw}_b.png'; p.screenshot(path=bb)
            d = ImageStat.Stat(ImageChops.difference(Image.open(a).convert('L'), Image.open(bb).convert('L'))).mean[0]
            if not mob:
                p.mouse.move(vw * .8, vh * .85); p.mouse.down(); p.mouse.move(vw * .3, vh * .85, steps=12); p.mouse.up(); time.sleep(.8)
                p.screenshot(path=f'{OUT}/{pg}_{vw}_drag.png')
            print(pg, vw, 'live canvas', on, 'moved', round(d, 2), 'errors', E); c.close()
    b.close()
