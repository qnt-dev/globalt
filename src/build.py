import base64, json, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); AS = os.path.join(ROOT, 'assets')
def b64(p): return base64.b64encode(open(p, 'rb').read()).decode()
small = os.path.join(AS, 'science-gothic-2axis.woff2')
if not os.path.exists(small):
    f = TTFont(os.path.join(AS, 'science-gothic.woff2')); f = instancer.instantiateVariableFont(f, {'CTRS': 0, 'slnt': 0}); f.flavor = 'woff2'; f.save(small)
    print('font', os.path.getsize(small) // 1024, 'KB')
# sayt.*: пример на станции «Сайт», идёт перед app.js, потому что app.js его вызывает
css = open(os.path.join(HERE, 'style.css'), encoding='utf8').read() + open(os.path.join(HERE, 'sayt.css'), encoding='utf8').read()
js = '\n'.join(open(os.path.join(HERE, n), encoding='utf8').read() for n in ('sayt.js', 'sonar.js', 'app.js'))
body = open(os.path.join(HERE, 'body.html'), encoding='utf8').read()
face = '@font-face{font-family:"Science Gothic";font-weight:100 900;font-stretch:50%% 200%%;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}\n' % b64(small)
logo = 'data:image/svg+xml;base64,' + b64(os.path.join(AS, 'logo-white.svg'))
mark = 'data:image/svg+xml;base64,' + b64(os.path.join(AS, 'mark-white.svg'))
sdf = 'data:image/png;base64,' + b64(os.path.join(AS, 'mark-sdf.png'))
imgs = json.dumps({n[:-5]: 'data:image/webp;base64,' + b64(os.path.join(AS, 'photo', n)) for n in sorted(os.listdir(os.path.join(AS, 'photo')))})
body = body.replace('{{LOGO}}', logo).replace('{{MARK}}', mark)
def page(face, css, js): return f'''<title>GLOBAL TRIUMPH</title>
<meta name="description" content="Вакансии, подбор персонала и маркетинг. GLOBAL TRIUMPH сводит тех, кто ищет друг друга.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
{face}{css}</style>
{body}
<script>window.GT_SDF="{sdf}";window.GT_IMG={imgs};</script>
<script>
{js}</script>
'''
def full(html): return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>' + html + '</body></html>'
html = page(face, css, js)
open(os.path.join(ROOT, 'artifact.html'), 'w', encoding='utf8').write(html)
# готовая страница с тем же каркасом, который артефакт добавляет при публикации
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf8').write(full(html))
print('index', os.path.getsize(os.path.join(ROOT, 'index.html')) // 1024, 'KB')
# Прототип мира «Клиенты»: весь сайт и все четыре примера. В index.html примеры «Реклама», SMM и «Бренд» войдут после одобрения.
# Шрифт TT Mussels лежит только локально в maket/fonts, для запуска нужна лицензия или другой шрифт. Фото кофейни берутся из maket/img.
# Страница одна, она пишется под тремя адресами прошлых кругов, чтобы старые ссылки показывали всё.
rk_face = face + '@font-face{font-family:Mussels;src:url(fonts/TTMussels_Medium.ttf);font-weight:500;font-display:swap}\n'
mk_css = css + ''.join(open(os.path.join(HERE, n), encoding='utf8').read() for n in ('reklama.css', 'smm.css', 'brend.css'))
mk_js = '\n'.join(open(os.path.join(HERE, n), encoding='utf8').read() for n in ('sayt.js', 'reklama.js', 'smm.js', 'brend.js', 'sonar.js', 'app.js'))
mk = full(page(rk_face, mk_css, mk_js))
for n in ('reklama', 'smm', 'brend'):
    open(os.path.join(ROOT, 'maket', n + '.html'), 'w', encoding='utf8').write(mk)
print('maket/reklama, smm, brend', len(mk.encode('utf8')) // 1024, 'KB')
