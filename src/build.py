import base64, json, os, sys
# собирает index.html; другое имя файла можно передать для пробной сборки: python src/build.py proba.html
OUT = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); AS = os.path.join(ROOT, 'assets')
def b64(p): return base64.b64encode(open(p, 'rb').read()).decode()
def read(n): return open(os.path.join(HERE, n), encoding='utf8').read()
small = os.path.join(AS, 'science-gothic-2axis.woff2')
if not os.path.exists(small):
    f = TTFont(os.path.join(AS, 'science-gothic.woff2')); f = instancer.instantiateVariableFont(f, {'CTRS': 0, 'slnt': 0}); f.flavor = 'woff2'; f.save(small)
    print('font', os.path.getsize(small) // 1024, 'KB')
# Tektur: буквы кофейни ZERNO в примерах станций «Клиентов». Свободная лицензия OFL, текст в assets/tektur-OFL.txt. В сайт идёт одно начертание 500
tek = os.path.join(AS, 'tektur-500.woff2')
if not os.path.exists(tek):
    f = TTFont(os.path.join(AS, 'tektur.ttf')); f = instancer.instantiateVariableFont(f, {'wght': 500, 'wdth': 100}); f.flavor = 'woff2'; f.save(tek)
    print('tektur', os.path.getsize(tek) // 1024, 'KB')
# примеры станций «Клиентов» (Бренд, SMM, Реклама, Сайт) и финал мира (final) идут перед app.js, потому что app.js их вызывает
css = read('style.css') + ''.join(read(n + '.css') for n in ('reklama', 'smm', 'brend', 'site', 'final', 'reel'))
js = '\n'.join(read(n + '.js') for n in ('reklama', 'smm', 'brend', 'site', 'final', 'sonar', 'app'))
# лента профессий идёт отдельным скриптом после основного: у неё своё замыкание, с сайтом она связана через window.__reel
reel = read('reel.js')
# поле клавиш станции SMM: модуль на three.js (с jsdelivr, версия закреплена). Он идёт после основного скрипта и дополняет пример SMM
keys = read('smm-keys.js')
body = read('body.html')
face = ('@font-face{font-family:"Science Gothic";font-weight:100 900;font-stretch:50%% 200%%;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}\n' % b64(small)
        + '@font-face{font-family:Tektur;font-weight:500;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}\n' % b64(tek))
logo = 'data:image/svg+xml;base64,' + b64(os.path.join(AS, 'logo-white.svg'))
mark = 'data:image/svg+xml;base64,' + b64(os.path.join(AS, 'mark-white.svg'))
# фото вакансий и людей встроены в страницу. Карты Земли и фото кофейни лежат рядом в assets: они крупные, страница грузит их сама
imgs = json.dumps({n[:-5]: 'data:image/webp;base64,' + b64(os.path.join(AS, 'photo', n)) for n in sorted(os.listdir(os.path.join(AS, 'photo')))})
body = body.replace('{{LOGO}}', logo).replace('{{MARK}}', mark)
html = f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{{display:none!important}}</style></head><body><title>GLOBAL TRIUMPH</title>
<meta name="description" content="Вакансии, подбор персонала и маркетинг. GLOBAL TRIUMPH сводит тех, кто ищет друг друга.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
{face}{css}</style>
{body}
<script>window.GT_IMG={imgs};</script>
<script>
{js}</script>
<script>
{reel}</script>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js"}}}}</script>
<script type="module">
{keys}</script>
</body></html>'''
open(os.path.join(ROOT, OUT), 'w', encoding='utf8').write(html)
print(OUT, os.path.getsize(os.path.join(ROOT, OUT)) // 1024, 'KB')
