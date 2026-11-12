# снимки страниц макета: экран за экраном, три размера; ошибки консоли
import time, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'look'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
PAGES = sys.argv[1].split(',') if len(sys.argv) > 1 else ['rabota', 'lyudi', 'klienty']
SIZES = [(1440, 900, False), (2000, 825, False), (390, 844, True)]
if len(sys.argv) > 2: SIZES = [s for s in SIZES if str(s[0]) in sys.argv[2].split(',')]
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for pg in PAGES:
        for (vw, vh, mob) in SIZES:
            c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
            p = c.new_page(); E = []
            p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200]))
            p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
            p.goto(f'{U}{pg}.html?t={time.time()}', wait_until='load'); time.sleep(2.6)
            H = p.evaluate('document.documentElement.scrollHeight'); shots = []; y = 0; k = 0
            while y < H and k < 14:
                p.evaluate(f'scrollTo(0,{y})'); time.sleep(1.2)
                f = f'{OUT}/{pg}_{vw}_{k:02d}.png'; p.screenshot(path=f); shots.append(f); y += int(vh * .9); k += 1
            print(pg, vw, 'height', H, 'shots', len(shots), 'errors', E)
            tw = 360 if not mob else 180; th = round(tw * vh / vw); cols = 4 if not mob else 7
            sh = Image.new('RGB', (tw * cols, th * ((len(shots) + cols - 1) // cols)), (60, 60, 60))
            for i, f in enumerate(shots): sh.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
            sh.save(f'{OUT}/sheet_{pg}_{vw}.png'); c.close()
    b.close()
