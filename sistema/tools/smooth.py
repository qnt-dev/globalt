# плавность полёта и посадки по самим кадрам Земли: для каждого нарисованного кадра — скорость поворота (°/с), скорость
# приближения камеры (размер Земли, %/с) и скорость дуги (cy). Прыжок — всплеск скорости, остановка — ноль, рывок — скачок скорости.
# Печатает рядом с посадкой (смена вида) и самое резкое изменение скорости за весь переход.
import time, sys, math
import numpy as np
from playwright.sync_api import sync_playwright
U = 'http://127.0.0.1:4391/'
vw, vh = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1440, 900)
def ang(a, b):
    A, B = np.array(a), np.array(b); R = B @ A.T; c = (np.trace(R) - 1) / 2
    return math.degrees(math.acos(max(-1, min(1, c))))
with sync_playwright() as pw:
    br = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    c = br.new_context(viewport={'width': vw, 'height': vh}, is_mobile=vw < 760, has_touch=vw < 760); p = c.new_page(); E = []
    p.on('pageerror', lambda e: E.append(str(e)[:200]))
    p.goto(f'{U}index.html?t={time.time()}', wait_until='load'); time.sleep(4)
    p.evaluate("__gt.pick(1)"); time.sleep(1.5)
    for to in ['rabota', 'lyudi', 'home', 'klienty', 'home']:
        p.evaluate("window.__trace = []; window.__rec = 1"); t0 = p.evaluate('performance.now()')
        p.evaluate(f"__gt.go('{to}')"); time.sleep(3.6); tr = p.evaluate('window.__rec = 0, window.__trace')
        rows = []
        for i in range(1, len(tr)):
            a, b = tr[i - 1], tr[i]; dt = (b['t'] - a['t']) / 1000
            if dt <= 0: continue
            rows.append((b['t'] - t0, ang(a['m'], b['m']) / dt, (math.log(b['z']) - math.log(a['z'])) / dt * 100, (b['cy'] - a['cy']) / dt, b['f'], b['w'], dt * 1000))
        land = next((i for i in range(1, len(rows)) if rows[i - 1][4] and not rows[i][4]), None)
        # резкость: наибольший скачок скорости поворота между соседними кадрами (°/с), без учёта первых кадров
        jumps = [abs(rows[i][1] - rows[i - 1][1]) for i in range(3, len(rows))]
        print(f'→ {to}: кадров {len(rows)}, посадка на кадре {land}, наибольший скачок скорости поворота {max(jumps):.2f}°/с, длинных кадров {sum(1 for r in rows if r[6] > 40)}, ошибки {E[:1]}')
        mj = max(range(3, len(rows)), key=lambda i: abs(rows[i][1] - rows[i - 1][1]))
        print('    самый резкий скачок:')
        for r in rows[max(0, mj - 3):mj + 3]:
            print(f'      {r[0]/1000:5.2f}s {"полёт" if r[4] else r[5]:8s} поворот {r[1]:7.2f}°/с  камера {r[2]:7.2f}%/с  кадр {r[6]:.0f} мс')
        if land and '--land' in sys.argv:
            for r in rows[max(0, land - 4):land + 6]:
                print(f'    {r[0]/1000:5.2f}s {"полёт" if r[4] else r[5]:8s} поворот {r[1]:7.2f}°/с  камера {r[2]:7.2f}%/с  дуга {r[3]:+.4f}/с  кадр {r[6]:.0f} мс')
        time.sleep(.5)
    br.close()
