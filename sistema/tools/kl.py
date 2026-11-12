# проверка правок 12.11: стена «Людей» не прыгает при наведении, выбор нескольких профессий, клетки первого экрана «Клиентов», одна ссылка на кейс
import time, os, json
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kl'); os.makedirs(OUT, exist_ok=True)
U = 'http://127.0.0.1:4391/'
GEO = """() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
  return { wall: r(document.querySelector('.wall')), next: r(document.getElementById('l-kak')), btn: [...document.querySelectorAll('.wall button')].map(r) }; }"""
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    for vw, vh, mob in [(2000, 825, False), (1440, 900, False), (1024, 768, False), (390, 844, True)]:
        c = b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        p = c.new_page(); E = []
        p.on('pageerror', lambda e: E.append('ERR ' + str(e)[:200]))
        p.on('console', lambda m: E.append(m.text[:200]) if m.type == 'error' else None)
        # «Люди»: наведение на каждое слово стены не двигает ни слова, ни следующую главу
        p.goto(f'{U}lyudi.html?t={time.time()}', wait_until='load'); time.sleep(2.5)
        p.evaluate("document.getElementById('l-kogo').scrollIntoView()"); time.sleep(1.5)
        g0 = p.evaluate(GEO); moved = []
        if not mob:
            for i in range(len(g0['btn'])):
                p.locator('.wall button').nth(i).hover(); time.sleep(.35)
                g = p.evaluate(GEO)
                if g != g0: moved.append(i)
            p.locator('.wall button').nth(0).hover(); time.sleep(.4); p.screenshot(path=f'{OUT}/{vw}_wall_hover.png')
        print(vw, 'hover moved', moved or 'nothing')
        # выбрать три профессии, одну убрать в форме, одну добавить из списка
        for r in ['Комплектовщик', 'Грузчик', 'Кладовщик']: p.click(f'.wall button[data-role="{r}"]'); time.sleep(.2)
        print(vw, 'after 3 picks:', p.text_content('#pb-n'), [x for x in p.eval_on_selector_all('#f-pk li', 'l => l.map(x => x.dataset.role)')])
        print(vw, 'layout after picks same:', p.evaluate(GEO) == g0)
        p.screenshot(path=f'{OUT}/{vw}_wall_pick.png')
        p.click('#f-pk li[data-role="Грузчик"] .pk-x'); time.sleep(.2)
        p.select_option('#f-add', 'Бригадир'); time.sleep(.2)
        p.fill('#f-pk li[data-role="Комплектовщик"] input', '12')
        print(vw, 'after edit:', p.eval_on_selector_all('#f-pk li', 'l => l.map(x => x.dataset.role)'),
              'wall pressed', p.eval_on_selector_all('.wall button[aria-pressed=true]', 'l => l.map(x => x.dataset.role)'), p.text_content('#pb-n'))
        p.evaluate("document.getElementById('l-svyaz').scrollIntoView()"); time.sleep(1.2)
        p.screenshot(path=f'{OUT}/{vw}_form.png')
        # «Клиенты»: клетки первого экрана — одинаковый отступ текста от своей линии; ссылки на кейс
        p.goto(f'{U}klienty.html?t={time.time()}', wait_until='load'); time.sleep(3)
        pads = p.evaluate("""() => [...document.querySelectorAll('main.view:not([hidden]) .facts>div')].map(d => { const b = d.getBoundingClientRect(), t = d.querySelector('b').getBoundingClientRect();
            return [Math.round(b.left), Math.round(t.left - b.left), getComputedStyle(d).borderLeftWidth]; })""")
        print(vw, 'facts [cell left, text offset, line]', pads)
        print(vw, 'links to case', p.evaluate("[...document.querySelectorAll('main.view:not([hidden]) a')].filter(a => /kejs-zerno/.test(a.getAttribute('href'))).map(a => a.textContent.trim())"))
        p.screenshot(path=f'{OUT}/{vw}_klienty_hero.png')
        p.evaluate("document.getElementById('k-uslugi').scrollIntoView()"); time.sleep(1.5); p.screenshot(path=f'{OUT}/{vw}_svc.png')
        p.evaluate("document.getElementById('k-keys').scrollIntoView()"); time.sleep(1.5); p.screenshot(path=f'{OUT}/{vw}_case.png')
        # «Работа»: клетки первого экрана тоже
        p.goto(f'{U}rabota.html?t={time.time()}', wait_until='load'); time.sleep(3); p.screenshot(path=f'{OUT}/{vw}_rabota_hero.png')
        print(vw, 'errors', E); c.close()
    b.close()
