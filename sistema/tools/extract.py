# Главная макета — точная копия главной сайта: стили и код берутся из src/ этим скриптом.
# Пишет base.css (шрифты, шапка, меню, завеса), home.css (Земля и три слова), home.js (Земля, выбор раздела)
# и вставляет в конец home.js tools/world-tail.js: четыре вида в одном документе и полёт камеры между ними.
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..'); SYS = os.path.join(HERE, '..')
css = open(os.path.join(ROOT, 'src', 'style.css'), encoding='utf-8').read().split('\n')
js = open(os.path.join(ROOT, 'src', 'app.js'), encoding='utf-8').read().split('\n')
L = lambda a, b: '\n'.join(css[a - 1:b])
def find(lines, pat, start=0):
    for i in range(start, len(lines)):
        if pat in lines[i]: return i + 1
    raise SystemExit('нет строки: ' + pat)

FACE = ('@font-face{font-family:"Science Gothic";font-weight:100 900;font-stretch:50% 200%;font-display:swap;src:url(../assets/science-gothic-2axis.woff2) format("woff2")}\n')
# шапка и меню: от начала до конца меню; завеса; .vh; телефон: шапка и меню; без анимации
menu_end = find(css, '#mn .mn-x:hover svg')
phone = find(css, '/* Телефон */')
phone_menu_end = find(css, '#mn .mn-x{flex-direction:row', phone)
land = find(css, '/* телефон лёжа: меню плотнее')
btn = find(css, '.btn{display:inline-flex')  # кнопка «Перейти» на главной стоит на общем правиле .btn из блока миров
base = [FACE, L(1, menu_end), css[find(css, '#veil{') - 1], css[find(css, '.vh{') - 1], L(btn, btn + 1),
        '@media (max-width:760px){', L(phone + 2, phone_menu_end), '}', L(land, land + 6),
        '@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}']
open(os.path.join(SYS, 'base.css'), 'w', encoding='utf-8').write('/* СКОПИРОВАНО из src/style.css скриптом tools/extract.py — правки делать там */\n' + '\n'.join(base) + '\n')
h0 = find(css, '/* ГЛАВНАЯ: Земля и три раздела на ней */'); h1 = find(css, '/* МИРЫ «РАБОТА» И «ЛЮДИ»')
home = [l for l in css[h0 - 1:h1 - 1] if not l.startswith('#veil')]
open(os.path.join(SYS, 'home.css'), 'w', encoding='utf-8').write('/* СКОПИРОВАНО из src/style.css скриптом tools/extract.py */\n' + '\n'.join(home) + '\n')

# код: WebGL, главная, «Распад» — до блока «Миры»
a = 0; b = find(js, '/* ---------- Миры ---------- */') - 1
code = '\n'.join(js[a:b])
code = code.replace("  if (e.key === 'Escape' && world === 'rabota' && vacCur && !talk.open) vacClose();\n", '')
# Земля главной рисуется общим модулем earth-view.js (тот же шейдер с добавками для разделов): свою программу и карты главная не грузит
code = code.replace("prog('home', FS_HOME); prog('radio', FS_RADIO);", '')
i0 = code.index("  ['assets/earth/day.webp'"); i1 = code.index("gl.uniform1i(u.CLOUD, 7);") + len("gl.uniform1i(u.CLOUD, 7);")
code = code[:i0] + '  /* карты Земли грузит EV.EarthGL */' + code[i1:]
i0 = code.index("  const { p, u } = P.home; gl.useProgram(p);"); i1 = code.index("  if (D) dustDraw(D);", i0)
code = code[:i0] + '  homeDraw(time);\n' + code[i1:]
assert 'P.home' not in code and 'homeDraw(time)' in code
# хвост — свой код макета: одна страница, четыре вида, одна Земля, полёт камеры между видами (tools/world-tail.js)
tail = '\n' + open(os.path.join(HERE, 'world-tail.js'), encoding='utf-8').read() + '\n})();\n'
# ширина окна без полосы прокрутки: под полосу всегда оставлено место (html{scrollbar-gutter:stable} в sys.css),
# поэтому Земля, строка компаний и кадры полёта считаются от неё — на главной и в разделах она одна
full = (code + tail).replace('innerWidth', 'CW()').replace("'use strict';", "'use strict';\n/* ширина Земли — ширина её холста: documentElement.clientWidth на главной без полосы даёт полную ширину, хотя место под полосу оставлено */\nconst CW = () => { const c = document.getElementById('gl'); return (c && c.clientWidth) || document.documentElement.clientWidth || window.innerWidth; };", 1)
open(os.path.join(SYS, 'home.js'), 'w', encoding='utf-8').write('/* СКОПИРОВАНО из src/app.js скриптом tools/extract.py; хвост «Макет» — свой */\n' + full)
# разметка главной: шапка и сама главная из body.html, знаки разделов оттуда же
body = open(os.path.join(ROOT, 'src', 'body.html'), encoding='utf-8').read()
bar = body[body.index('<div id="bar">'):body.index('<section id="home"')]
homeh = body[body.index('<section id="home"'):body.index('<section id="rabota"')]
signs = dict(re.findall(r'<svg data-s="(\w+)" (viewBox="[^"]+" fill="currentColor">.*?</svg>)', homeh, re.S))
open(os.path.join(SYS, 'parts.json'), 'w', encoding='utf-8').write(__import__('json').dumps({'bar': bar, 'home': homeh, 'signs': signs}, ensure_ascii=False))
print('base', len('\n'.join(base)), 'home.css', len('\n'.join(home)), 'home.js', len(code), 'signs', list(signs))
