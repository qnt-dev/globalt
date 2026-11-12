# Земля для первых экранов разделов: рисует tools/earth.html в Chrome и сохраняет webp в img/.
# python earth_shots.py [proba] — proba: снимки в tools/proba/ для подбора ракурса
import base64, io, os, sys, time, json
from playwright.sync_api import sync_playwright
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'img')
U = 'http://127.0.0.1:4391/sistema/tools/earth.html'
# раздел: поворот Земли (долгота, широта середины диска, наклон), солнце, размер и высота середины
SHOTS = json.loads(open(os.path.join(HERE, 'earth_shots.json'), encoding='utf-8').read())
PROBA = len(sys.argv) > 1 and sys.argv[1].startswith('proba')
if PROBA: OUT = os.path.join(HERE, sys.argv[1])
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=False, args=['--use-angle=d3d11', '--enable-gpu'])
    p = b.new_page(viewport={'width': 800, 'height': 600})
    p.goto(U + '?t=' + str(time.time())); p.wait_for_function('window.isReady && isReady()', timeout=30000)
    for name, o in SHOTS.items():
        if name.startswith('_'): continue
        for fmt, (w, h) in {'w': (2560, 1280), 't': (1170, 1560)}.items():
            q = {k: v for k, v in o.items() if k != 'tall'}; q.update(o.get('tall', {}) if fmt == 't' else {}); q['w'] = w; q['h'] = h
            d = p.evaluate('o => render(o)', q)
            im = Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGB')
            f = os.path.join(OUT, f'zemlya-{name}-{fmt}.webp'); im.save(f, quality=82)
            print(name, fmt, im.size, os.path.getsize(f) // 1024, 'KB')
    b.close()
