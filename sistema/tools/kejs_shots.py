# кадры станций для кейса на странице «Клиенты»: каждая станция на нескольких точках примера, потом выбираем
import time, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kejs'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/zerno.html'
ST = [('brend', 3, 'GTBRD', [.18, .3, .45, .6, .75]), ('smm', 2, 'GTSMM', [.2, .35, .5, .65, .8]), ('reklama', 1, 'GTREK', [.12, .3, .52, .7, .85]), ('sayt', 0, 'GTSITE', [.1, .3, .5, .7, .9])]
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for name, i, mod, fr in ST:
        c = b.new_context(viewport={'width': 1440, 'height': 900}); p = c.new_page()
        p.goto(f'{U}?t={time.time()}#klienty', wait_until='load'); time.sleep(2)
        p.click(f'#presets button[data-i="{i}"]'); p.wait_for_function(f'window.__gt.air.cur=={i}', timeout=20000); time.sleep(1.5)
        if i == 3:
            for _ in range(30):
                if p.evaluate(f'{mod}.state.on'): break
                p.mouse.click(720, 400); time.sleep(.6)
        p.mouse.move(720, 400)
        for f in fr:
            n = 0
            while p.evaluate(f'{mod}.state.u') < f and n < 400: p.mouse.wheel(0, 60); time.sleep(.05); n += 1
            time.sleep(1.6); p.add_style_tag(content='#bar{visibility:hidden!important}')
            p.screenshot(path=f'{OUT}/{name}_{int(f*100)}.png'); print(name, f, round(p.evaluate(f'{mod}.state.u'), 2))
        c.close()
    # финал «Каждый день»: кольцо напитков и Coffee time
    c = b.new_context(viewport={'width': 1440, 'height': 900}); p = c.new_page()
    p.goto(f'{U}?t={time.time()}#klienty', wait_until='load'); time.sleep(2)
    p.click('#presets button[data-i="0"]'); p.wait_for_function('window.__gt.air.cur==0', timeout=20000); time.sleep(1.5); p.mouse.move(720, 400)
    n = 0
    while p.evaluate('GTSITE.state.u') < 1 and n < 300: p.mouse.wheel(0, 100); time.sleep(.06); n += 1
    time.sleep(1.5)
    for _ in range(4): p.mouse.wheel(0, 100); time.sleep(.2)
    p.add_style_tag(content='#bar{visibility:hidden!important}')
    for u in [44, 79, 99]:
        p.evaluate(f'GTFIN.jump({u})'); time.sleep(2.2); p.screenshot(path=f'{OUT}/final_{u}.png'); print('final', u)
    c.close(); b.close()
fs = sorted(f for f in os.listdir(OUT) if f.endswith('.png') and not f.startswith('sheet'))
W = 360; H = 225; sh = Image.new('RGB', (W * 5 + 40, (H + 10) * 5), (30, 30, 30))
rows = {}
for f in fs: rows.setdefault(f.split('_')[0], []).append(f)
for r, (k, L) in enumerate(rows.items()):
    for j, f in enumerate(L): sh.paste(Image.open(os.path.join(OUT, f)).convert('RGB').resize((W, H)), (j * (W + 10), r * (H + 10)))
sh.save(os.path.join(OUT, 'sheet.png')); print(list(rows))
