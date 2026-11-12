# одна страница, четыре вида: прямое открытие каждого адреса, переходы полётом без перезагрузки, «Назад», вакансия с табло.
# Вращение не останавливается: долгота Земли (V.lon / S.v[0]) растёт всё время, и на стыке нет кадров без движения.
import time, os, sys
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spa'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
vw, vh = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1440, 900)
mob = vw < 760
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob); p = c.new_page(); E = []
    p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:300])); p.on('console', lambda m: E.append(m.text[:300]) if m.type == 'error' else None)
    for f in ['index.html', 'rabota.html', 'lyudi.html', 'klienty.html']:
        p.goto(f'{U}{f}?t={time.time()}', wait_until='load'); time.sleep(3)
        print(f, 'вид', p.evaluate('__gt.view()'), 'Земля', p.evaluate('__gt.earth()'), 'заголовок', p.title(), 'ошибки', E[:2]); E.clear()
        p.screenshot(path=f'{OUT}/{vw}_direct_{f[:-5]}.png')
    # переходы без перезагрузки: метка на window переживает только переход внутри документа
    p.goto(f'{U}index.html?t={time.time()}', wait_until='load'); time.sleep(3); p.evaluate('window.__mark = 1')
    def lon():
        return p.evaluate("__gt.view() === 'home' ? __gt.S.v[0] : __gt.V.lon")
    def leg(name, act, dest):
        act(); samples = []
        t0 = time.time()
        while time.time() - t0 < 3.6:
            samples.append((round(time.time() - t0, 2), p.evaluate('__gt.view()'), round(lon(), 3))); time.sleep(.12)
        print(name, 'адрес', p.url.split('/')[-1], 'тот же документ', p.evaluate('window.__mark === 1'), 'ошибки', E[:2]); E.clear()
        land = [s for s in samples if s[1] == dest]
        if len(land) > 2:
            d = [round(land[i + 1][2] - land[i][2], 3) for i in range(len(land) - 1)]
            print('   после посадки долгота растёт на каждом шаге:', all(x > 0 for x in d), d[:8])
        p.screenshot(path=f'{OUT}/{vw}_{name}.png')
    tab = p.locator('#hub .hub-t button').nth(0)
    if mob: tab.tap()
    else: tab.hover()
    time.sleep(1.2)
    leg('home-rabota', lambda: p.locator('#hub .hub-go').click(), 'rabota')
    if mob: leg('rabota-lyudi', lambda: p.evaluate("__gt.go('lyudi')"), 'lyudi')
    else: leg('rabota-lyudi', lambda: p.click('#nav a[href="lyudi.html"]'), 'lyudi')
    leg('back', lambda: p.go_back(), 'rabota')
    leg('rabota-home', lambda: p.click('#logo'), 'home')
    # вакансия: табло объектов
    p.goto(f'{U}rabota.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
    p.evaluate("document.getElementById('r-vakansii').scrollIntoView()"); time.sleep(1)
    p.locator('.vr-h').nth(0).click(); time.sleep(1.2)
    p.screenshot(path=f'{OUT}/{vw}_vac.png'); print('табло строк', p.locator('.vr.open .tb-r:not(.tb-h)').count())
    p.locator('.vr.open .ob-go').nth(1).click(); time.sleep(1.4); print('отклик:', p.input_value('#f-who'), 'ошибки', E[:2])
    c.close(); b.close()
