# Сборка страниц макета «Одна система» (вариант А). Общие части (голова, шапка, меню, три двери, подвал) одни на все страницы.
# python sistema/tools/pages.py — пишет index.html, rabota.html, lyudi.html, klienty.html, kejs-zerno.html в корень сайта.
# Стили, скрипты и картинки системы лежат в sistema/, общие файлы (шрифт, знак, фото, карты Земли) — в assets/.
# Главная и три раздела — один документ с четырьмя видами и одной Землёй (переходы — полёт камеры, tools/world-tail.js).
# Четыре файла одинаковые, разный только вид при открытии (body data-w), заголовок и описание.
# Перед этим: tools/extract.py (главная из src/) и tools/earth_shots.py (Земля для разделов).
import re, os, json, html
HERE = os.path.dirname(os.path.abspath(__file__)); SYS = os.path.join(HERE, '..'); ROOT = os.path.join(SYS, '..')
P = json.load(open(os.path.join(SYS, 'parts.json'), encoding='utf-8'))
DATA = json.load(open(os.path.join(SYS, 'data.json'), encoding='utf-8'))
SIGN = {k: f'<svg data-s="{k}" {v}' for k, v in P['signs'].items()}
STAR = '<svg class="st" viewBox="-1 -1 2 2" aria-hidden="true"><path d="M0-1Q.06-.06 1 0 .06.06 0 1-.06.06-1 0-.06-.06 0-1Z"/></svg>'
ARR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">'
V = '?v=34'

# прилёт полётом камеры: класс cam ставится до первой отрисовки (earth-view.js, EV.arrived)
CAM = '''<script data-p="{p}">try{{var c=JSON.parse(sessionStorage.getItem('gt-cam')||'null');if(c&&c.to===document.currentScript.dataset.p&&Date.now()-(c.at||0)<15000)document.documentElement.classList.add('cam')}}catch(e){{}}</script>'''
# мост: последний кадр полёта вместо заставки (раздел) или поверх Земли главной, пока она не нарисует тот же кадр
# страница не рисуется, пока мост не раскодирован: браузер держит последний кадр старой страницы, и чёрного кадра между ними нет
HOLD = "i.decoding='sync'"
BRIDGE_SEC = '''<script>(function(){if(!document.documentElement.classList.contains('cam'))return;try{var b=sessionStorage.getItem('gt-bridge');if(!b)return;var p=document.currentScript.previousElementSibling;p.querySelectorAll('source').forEach(function(s){s.remove()});var i=p.querySelector('img');i.removeAttribute('fetchpriority');i.src=b;''' + HOLD + '''}catch(e){}})()</script>'''
BRIDGE_HOME = '''<script>(function(){if(!document.documentElement.classList.contains('cam'))return;try{var b=sessionStorage.getItem('gt-bridge');if(!b)return;var i=document.createElement('img');i.id='bridge';i.alt='';i.src=b;document.currentScript.parentNode.insertBefore(i,document.currentScript);''' + HOLD + '''}catch(e){}})()</script>'''

def head(title, desc, extra_css='', p='home'):
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#000000">
<link rel="icon" href="assets/mark-white.svg">
{FONTS}
<link rel="stylesheet" href="sistema/base.css{V}">
<link rel="stylesheet" href="sistema/sys.css{V}">{extra_css}
</head>'''

def bar(cur=None, back=None):
    a = lambda w, t: f'<a href="{w}.html"' + (' aria-current="page"' if w == cur else '') + f'>{STAR}{t}</a>'
    nq = (f'<span class="nq"><a href="klienty.html">{STAR}← Клиенты</a> · Кейс ZERNO</span>' if back else
          f'<span class="nq">Ищете {a("rabota", "работу")}, {a("lyudi", "людей")} или {a("klienty", "клиентов")}?</span>')
    items = [('index', '00', 'Главная', 'к началу сайта'), ('rabota', '01', 'Работа', 'вакансии вахтой'), ('lyudi', '02', 'Люди', 'подбор персонала'), ('klienty', '03', 'Клиенты', 'сайт, бренд, реклама, SMM')]
    li = ''.join(f'<li><a href="{w}.html"' + (' aria-current="page"' if w == cur else '') + f'><i>{n}</i><b>{t}</b><small>{s}</small>{ARR}</a></li>' for w, n, t, s in items)
    li += f'<li><button type="button" data-talk><i>04</i><b>Напишите нам</b><small>обсудить задачу</small>{ARR}</button></li>'
    return f'''<div id="bar">
  <nav id="nav" aria-label="Что вы ищете">{nq}</nav>
  <div id="mn" data-open="false">
    <button type="button" id="mn-chip" aria-expanded="false" aria-controls="mn-panel"><i aria-hidden="true"></i><span>Меню</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg></button>
    <div id="mn-panel" role="dialog" aria-label="Меню"><ol class="mn-list">{li}</ol>
      <button type="button" class="mn-x"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7L7 17M15 17H7V9"/></svg><span>Закрыть</span></button></div>
  </div>
  <a id="logo" href="index.html" aria-label="GLOBAL TRIUMPH: на главную"><img class="lg-f" src="assets/logo-white.svg" alt="GLOBAL TRIUMPH" width="132" height="76"><img class="lg-m" src="assets/mark-white.svg" alt=""></a>
</div>'''

def hud(text, href, sign, extra=''):
    return f'<a class="hud" href="{href}"{extra}>{text}<span class="go-s" aria-hidden="true">{SIGN[sign]}</span></a>'

EARTH = json.load(open(os.path.join(HERE, 'earth_shots.json'), encoding='utf-8'))
DETAIL = json.load(open(os.path.join(HERE, 'detail.json'), encoding='utf-8')) if os.path.exists(os.path.join(HERE, 'detail.json')) else {}
def hero(w, num, lab, h1, voice, acts, facts, f4=False):
    fs = ''.join(f'<div><b>{b}</b><span>{s}</span></div>' for b, s in facts)
    e = {k: v for k, v in EARTH[w].items() if k in ('gv', 'ld', 'nlc', 'dim', 'cla')}
    if w in DETAIL: e['detail'] = DETAIL[w]
    return f'''<header class="hero">
  <picture class="hero-bg" aria-hidden="true"><source media="(max-aspect-ratio:1/1)" srcset="sistema/img/zemlya-{w}-t.webp"><img src="sistema/img/zemlya-{w}-w.webp" alt="" fetchpriority="high"></picture>
  <div class="hero-top g wrap">
    <p class="lab"><span class="sg">{SIGN[w]}</span><b>{num}</b>{lab}</p>
    <h1 class="dsp">{h1}</h1>
    <p class="voice">{voice}</p>
    <div class="acts">{acts}</div>
  </div>
  <div class="wrap"><div class="facts{' f4' if f4 else ''}">{fs}</div></div>
</header>'''

def ch(id_, num, lab, h2, voice, body, full=False):
    v = f'<p class="voice" data-r>{voice}</p>' if voice else ''
    return f'''<section class="ch wrap" id="{id_}" aria-labelledby="{id_}-h">
  <div class="ch-h g"><p class="lab"><b>{num}</b>{lab}</p><div class="hd"><h2 class="dsp dots" id="{id_}-h">{h2}</h2>{v}</div></div>
  <div class="g"><div class="ch-b{' full' if full else ''}">{body}</div></div>
</section>'''

def steps(items):
    return f'<ol class="steps" style="--n:{len(items)}" data-r>' + ''.join(f'<li><i>{i:02d}</i><b>{t}</b><p>{p}</p></li>' for i, (t, p) in enumerate(items, 1)) + '</ol>'

# «Люди», «Как мы работаем»: проявка. Человек проявляется шаг за шагом (контур, штрих, плотный штрих, фото), число «виден на N %» растёт.
# Разметка по умолчанию — готовое состояние (100 %, фото): без скрипта читается целиком. Рисует и считает sistema/portrait.js
# Под шагами — документ «Работаем официально»: пока идут шаги, на листе пишутся строки (по строке на шаг), на 100 % ложится оранжевая печать-ромб.
# Шапка листа — штрих под 45°, как у портрета. Рисунок 1:1 (57×72, центр 28.5 — на оси линии шагов), линии в 1 px на полупикселях — чёткие. Строки тянет portrait.js через --d1…--d5, печать — класс .full у .pt
DOC = '''<svg class="pt-dk" width="57" height="72" viewBox="0 0 57 72" aria-hidden="true">
<defs><pattern id="pt-hh" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M.5 0V3"/></pattern></defs>
<path class="sh" d="M.5 .5H42.5L56.5 14.5V71.5H.5Z"/><path class="fo" d="M42.5 .5V14.5H56.5"/>
<rect class="ln hh" x="6" y="6" width="30" height="9" fill="url(#pt-hh)" style="transform:scaleX(var(--d1,1))"/>
<path class="ln" d="M6 22.5H49M6 27.5H45" style="transform:scaleX(var(--d2,1))"/>
<path class="ln" d="M6 32.5H49M6 37.5H40" style="transform:scaleX(var(--d3,1))"/>
<path class="ln" d="M6 42.5H31" style="transform:scaleX(var(--d4,1))"/>
<path class="sg" pathLength="1" d="M7 63c3-9 6-9 5-4s-3 5 0 3 4-7 6-6-1 5 1 5 4-3 9-3"/><path class="ln sl" d="M6 64.5H27" style="transform:scaleX(var(--d5,1))"/>
<g class="seal"><path d="M45 47.5 57.5 60 45 72.5 32.5 60Z"/><path class="m" d="M45 52 53 60 45 68 37 60Z"/><path class="in" d="M45 56 49 60 45 64 41 60Z"/></g>
<path class="ink" d="M45 47.5 57.5 60 45 72.5 32.5 60Z"/>
</svg>'''

# неразрывные пробелы: короткое слово не висит в конце строки («с ним», «и ставим», «за 48 ч»), тире не начинает строку
NB = ' '
def nb(t):
    t = re.sub(r'(?<![\wЁё])([А-Яа-яЁёA-Za-z]{1,2}) ', lambda m: m.group(1) + NB, t)
    return re.sub(r'(\d) ', lambda m: m.group(1) + NB, t).replace(' —', NB + '—')

def portrait(items, caps):
    items = [(t, nb(p)) for t, p in items]; caps = [nb(c) for c in caps]
    cap = ''.join(f'<span{" class=on" if i == len(caps) - 1 else ""}>{c}</span>' for i, c in enumerate(caps))
    pp = ''.join(f'<span{" class=on" if i == len(items) else ""}>{p}</span>' for i, (t, p) in enumerate(items, 1))   # невысокий экран: текст только текущего шага, под списком
    li = ''.join(f'<li class="{"on" if i == len(items) else "past"}"><button type="button" class="pt-k" aria-label="Шаг {i}: {t}">{i:02d}</button><b>{t}</b><p>{p}</p></li>' for i, (t, p) in enumerate(items, 1))
    return f'''<div class="pt full">
 <div class="pt-st">
  <div class="pt-s"><ol class="pt-o">{li}</ol>
   <p class="pt-p" aria-hidden="true">{pp}</p>
   <div class="pt-d">{DOC}<div><b>Работаем официально</b><p>Договор и закрывающие документы.</p></div></div></div>
  <div class="pt-f"><canvas aria-hidden="true"></canvas><img class="pt-fb" src="assets/photo/p4.webp" alt="Человек, которого вы ищете" width="1300" height="1300" loading="lazy" decoding="async"></div>
  <div class="pt-m" aria-hidden="true"><p class="pt-l">Ваш человек виден на</p><p class="pt-v"><span class="pt-n">100</span><em>%</em></p><i class="pt-h"></i><p class="pt-c">{cap}</p></div>
 </div>
</div>
<div class="pt-end"><span>7 дней до первой смены · 48 ч на замену</span><a class="lnk" href="#l-svyaz">Оставить заявку <i>→</i></a></div>'''

def doors(cur):
    D = [('rabota', 'Работа', 'Вакансии и помощь с трудоустройством'), ('lyudi', 'Люди', 'Подбор персонала для вашей компании'), ('klienty', 'Клиенты', 'Сайты, реклама, SMM, брендбук и логотип')]
    li = ''.join(f'<li><a href="{w}.html"' + (' aria-current="page"' if w == cur else '') + f'><span class="dsp">{t}</span><small>{"Вы здесь · " if w == cur else ""}{s}</small></a></li>' for w, t, s in D)
    return f'''<footer class="doors wrap">
  <p class="q">Что вы ищете?</p>
  <ul>{li}</ul>
  <div class="foot"><span>© GLOBAL TRIUMPH, 2026</span><span>[Телефон] · [Почта] · Telegram · WhatsApp</span><span>Макет. Объекты, суммы и цифры — примеры</span></div>
</footer>'''

MK = '<div class="mk" aria-hidden="true"><b>Макет</b> · вариант А · одна система</div>'
VEIL = '<canvas id="veil" aria-hidden="true"></canvas>'
TALK = '''<dialog id="talk" aria-label="О чём поговорим"><div class="in"><button type="button" id="talk-x">Закрыть ✕</button><h2 class="dsp">О чём поговорим?</h2>
<a href="rabota.html#r-svyaz">Ищу работу<small>01 →</small></a><a href="lyudi.html#l-svyaz">Нужны люди<small>02 →</small></a><a href="klienty.html#k-svyaz">Нужны клиенты<small>03 →</small></a></div></dialog>'''

def page(name, title, desc, w, body, scripts, extra_css='', cls=''):
    scripts = ['sec.js', 'earth-view.js'] + scripts
    out = head(title, desc, extra_css, w) + f'\n<body data-w="{w}"{(" class=" + chr(34) + cls + chr(34)) if cls else ""}>\n' + body + f'\n{TALK}\n{VEIL}\n' + ''.join(f'<script src="sistema/{s}{V}"></script>\n' for s in scripts) + '</body>\n</html>\n'
    open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(out); print(name, len(out) // 1024, 'KB')

# ---------- главная: та же, что на сайте ----------
# вид Земли каждого раздела для полёта камеры (earth-view.js читает window.GT_SEC)
SEC = {w: dict({k: v for k, v in EARTH[w].items() if k in ('gv', 'ld', 'nlc', 'dim', 'cla')}, **({'detail': DETAIL[w]} if w in DETAIL else {})) for w in EARTH}
open(os.path.join(SYS, 'sec.js'), 'w', encoding='utf-8').write('/* собрано tools/pages.py: вид Земли каждого раздела */\nwindow.GT_SEC = ' + json.dumps(SEC).replace('"img/', '"sistema/img/') + ';\n')
HOME = '<canvas id="gl" aria-hidden="true"></canvas>\n' + P['home']

# ---------- «Работа» ----------
VAC, SITES = DATA['VAC'], DATA['SITES']
pays = [s[1] for v in VAC if v.get('sites') for s in v['sites'] if len(s) > 1 and s[1]]
fmt = lambda n: f'{n:,}'.replace(',', ' ')
chips = ''.join(f'<button type="button" class="chip" aria-pressed="false" data-t="{t}">{n}</button>' for t, n in [('noexp', 'Без опыта'), ('train', 'С обучением'), ('pair', 'Можно парой'), ('sit', 'Сидячая работа')])
rab = '<main class="view" data-view="rabota">\n' + hero('rabota', '01', 'Работа · вахта',
    '<span class="wide">Вас ищут</span><span>склады и заводы</span>',
    'Вахта от 30 смен. Жильё бесплатно, аванс раз в неделю или раз в две.',
    hud('Смотреть вакансии', '#r-vakansii', 'rabota') + '<a class="lnk" href="#r-kak">Как это устроено <i>→</i></a>',
    [(str(len(VAC)), 'профессий'), (str(len(SITES)), 'объектов: склады и заводы'), (f'{fmt(min(pays))}–{fmt(max(pays))} <em>₽</em>', 'за смену, по объектам')]) + '\n' + \
  ch('r-vakansii', '02', 'Вакансии', 'Кем хотите работать?', 'Найдите профессию — внутри объекты, условия и отклик.',
     f'''<div class="find" data-r><input id="q" type="search" placeholder="Например, грузчик" aria-label="Кем хотите работать" autocomplete="off">
<div class="row"><div class="chips" id="vf" aria-label="Условия">{chips}</div><span id="count" aria-live="polite"></span></div></div>
<ul class="vl" id="vl"></ul><p id="none" class="txt" hidden>Такой профессии пока нет. <button type="button" class="lnk" data-talk>Оставьте телефон <i>→</i></button></p>
<script type="application/json" id="vac-data">{json.dumps(DATA, ensure_ascii=False)}</script>''', full=True) + '\n' + \
  ch('r-kak', '03', 'Как это устроено', 'От отклика до смены', 'Четыре шага. Первый занимает минуту.', steps([
     ('Отклик', 'Имя и телефон. Больше ничего не нужно.'),
     ('Звонок', 'Расскажем про объект, жильё и даты. Ответим на вопросы.'),
     ('Дорога', '[Билет: оплачивает компания или нет.] На месте встретим и заселим.'),
     ('Смена', 'Первая смена с наставником. Аванс — по графику объекта.')])) + '\n' + \
  ch('r-voprosy', '04', 'Вопросы', 'Коротко о главном', '', '<div class="faq" data-r>' + ''.join(f'<details><summary>{q}</summary><p class="txt">{a}</p></details>' for q, a in [
     ('Нужен ли опыт?', 'На большинство профессий — нет: комплектовщик, упаковщик, грузчик, фасовщик, оператор линии. Всё покажем на месте. Для погрузчика нужно удостоверение, для бригадира — опыт руководства.'),
     ('Где жить?', 'Жильё бесплатно: хостел, общежитие, квартира или коттедж — зависит от объекта. В каждой вакансии написано, сколько человек в комнате.'),
     ('Когда платят?', 'Аванс раз в неделю или раз в две недели — по объекту. Сумма за смену указана у каждого объекта.'),
     ('Можно с другом или парой?', 'Да, на часть объектов берут вдвоём. Включите фишку «Можно парой» — останутся только такие вакансии.'),
     ('Что взять с собой?', 'Паспорт, телефон, удобную обувь. [Медкнижку, если её требует объект.]')]) + '</div>') + '\n' + \
  ch('r-svyaz', '05', 'Отклик', 'Позвоним за 15 минут', 'В рабочее время. Подберём объект, если своей профессии не нашли.',
     '''<form class="form" data-done="r-done" novalidate data-r>
<label class="fld"><span>Имя</span><input name="name" autocomplete="given-name" placeholder="Как к вам обращаться"></label>
<label class="fld"><span>Телефон *</span><input name="tel" type="tel" autocomplete="tel" placeholder="+7 или +996" data-need></label>
<label class="fld w2"><span>Кем хотите работать</span><input id="f-who" name="who" placeholder="Профессия или объект"></label>
<div class="fld w2"><span>Едете</span><div class="chips" data-one><button type="button" class="chip" aria-pressed="true">Один</button><button type="button" class="chip" aria-pressed="false">Вдвоём</button><button type="button" class="chip" aria-pressed="false">Бригадой</button></div></div>
<div class="send w2">''' + hud('Отправить', '#', 'rabota', ' role="button"').replace('<a class="hud" href="#" role="button"', '<button class="hud" type="submit"').replace('</a>', '</button>') + '''<span class="err" hidden>Нужен телефон</span><span class="note">Макет: форма никуда не отправляет</span></div>
</form>
<div class="done" id="r-done" hidden><h3 class="dsp">Отклик у нас</h3><p class="txt">Позвоним за 15 минут в рабочее время. Если не успеем — напишем в мессенджер.</p></div>''') + '\n' + doors('rabota') + '\n</main>'

# ---------- «Люди» ----------
roles = [v['title'] for v in VAC]
wall = ''.join(f'<button type="button" aria-pressed="false" data-role="{html.escape(r)}">{html.escape(v["wall"])}</button>' for r, v in zip(roles, VAC))
opts = ''.join(f'<option>{html.escape(r)}</option>' for r in roles) + '<option>Другое</option>'
ly = '<main class="view" data-view="lyudi">\n' + hero('lyudi', '02', 'Люди · подбор персонала',
    '<span class="wide">Вы ищете</span><span>людей на смену</span>',
    'Найдём, проверим и привезём людей на склад или производство. От заявки до первой смены.',
    hud('Оставить заявку', '#l-svyaz', 'lyudi') + '<a class="lnk" href="#l-kak">Как мы работаем <i>→</i></a>',
    [('7 <em>дней</em>', 'от заявки до первой смены'), ('1 200', 'человек на вахтах сейчас'), ('48 <em>ч</em>', 'на замену выбывшего')]) + '\n' + \
  ch('l-kak', '02', 'Как мы работаем', 'От задачи до выхода', 'Пять шагов. Сами говорим с людьми и доводим до первой смены.', portrait([
     ('Разговор', 'Кого, сколько, когда и куда. Ставка, смены, жильё.'),
     ('Вакансия', 'Пишем объявление языком кандидата и ставим туда, где его видят.'),
     ('Отбор', 'Сами звоним людям: опыт, документы, готовность ехать.'),
     ('Дорога', 'Билеты, встреча, заселение. Человек приезжает к первой смене.'),
     ('Замена', 'Если человек ушёл — ищем замену. Отчёт по людям каждую неделю.')],
     ['Контур: знаем, кого ищем', 'Черты: знаем, где его найти', 'Лицо: говорили с ним сами', 'Человек: едет к первой смене', 'На месте. Ушёл — замена за 48 ч']), full=True) + '\n' + \
  ch('l-kogo', '03', 'Кого подбираем', 'Склад и производство', 'Те же профессии, что ищут у нас кандидаты. Выберите одну или несколько — они встанут в заявку.',
     f'<div class="wall" data-r>{wall}</div><p class="txt" data-r>И менеджеров по клиентам на удалённую работу.</p>'
     '<div class="pb" data-r><span id="pb-n" aria-live="polite"></span><a class="lnk" href="#l-svyaz">К заявке <i>→</i></a></div>') + '\n' + \
  ch('l-format', '04', 'Форматы', 'Под вашу задачу', 'Условия и сроки уточняем в разговоре.',
     '<div class="fmt" data-r><div><em>30–60 смен</em><b>Вахта</b><p class="txt">Люди живут у объекта. Жильё, дорогу и замены берём на себя.</p></div>'
     '<div><em>2–8 недель</em><b>Сезонный пик</b><p class="txt">Добавим людей на распродажи, праздники и сезон.</p></div>'
     '<div><em>в ваш штат</em><b>Постоянный штат</b><p class="txt">Бригадиры, кладовщики, операторы — к вам в штат.</p></div></div>') + '\n' + \
  ch('l-svyaz', '05', 'Заявка', 'Кто вам нужен?', 'Ответим в течение рабочего дня.',
     f'''<form class="form" data-done="l-done" novalidate data-r>
<div class="fld w2 who"><span>Кого ищете</span><ul class="pk" id="f-pk"></ul>
<label class="pk-add"><select id="f-add" aria-label="Добавить профессию"><option value="">+ Добавить профессию</option>{opts}</select></label></div>
<label class="fld"><span>С какой даты</span><input name="from" placeholder="Например, с 1 декабря"></label>
<label class="fld"><span>Город или объект</span><input name="city" placeholder="Где работать"></label>
<label class="fld"><span>Компания</span><input name="co" autocomplete="organization" placeholder="Название"></label>
<label class="fld"><span>Телефон или почта *</span><input name="c" placeholder="Как с вами связаться" data-need></label>
<label class="fld w2"><span>Комментарий</span><textarea name="t" rows="2" placeholder="Смены, ставка, жильё — что важно"></textarea></label>
<div class="send w2"><button class="hud" type="submit">Отправить заявку<span class="go-s" aria-hidden="true">{SIGN["lyudi"]}</span></button><span class="err" hidden>Нужен телефон или почта</span><span class="note">Макет: форма никуда не отправляет</span></div>
</form>
<div class="done" id="l-done" hidden><h3 class="dsp">Заявка у нас</h3><p class="txt">Позвоним в течение рабочего дня: уточним задачу и сроки.</p></div>''') + '\n' + doors('lyudi') + '\n</main>' + '''
<script>
/* стена профессий: можно выбрать несколько. Каждая выбранная — строка заявки со своим числом людей.
   Строку можно убрать крестиком или добавить из списка в форме; стена и форма показывают одно и то же */
(() => {
  const wall = document.querySelector('.wall'), pk = document.getElementById('f-pk'), add = document.getElementById('f-add'), n = document.getElementById('pb-n');
  const W = r => [...wall.querySelectorAll('button')].find(b => b.dataset.role === r);
  const rows = () => [...pk.querySelectorAll('li')];
  const plural = k => k % 10 === 1 && k % 100 !== 11 ? 'профессия' : k % 10 > 1 && k % 10 < 5 && (k % 100 < 12 || k % 100 > 14) ? 'профессии' : 'профессий';
  const sync = () => {
    const k = rows().length; pk.classList.toggle('empty', !k);
    n.innerHTML = k ? 'В заявке <b>' + k + '</b> ' + plural(k) : 'Выберите одну или несколько';
    [...add.options].forEach(o => { if (o.value) o.disabled = rows().some(li => li.dataset.role === o.value); });
  };
  const on = (r, yes) => {
    const b = W(r); if (b) b.setAttribute('aria-pressed', yes);
    const li = rows().find(x => x.dataset.role === r);
    if (yes && !li) {
      const x = document.createElement('li'); x.dataset.role = r;
      x.innerHTML = '<b></b><input inputmode="numeric" placeholder="' + (innerWidth > 760 ? 'Сколько человек' : 'Сколько') + '"><button type="button" class="pk-x" aria-label="Убрать">✕</button>';
      x.querySelector('b').textContent = r; x.querySelector('input').setAttribute('aria-label', 'Сколько человек: ' + r); pk.appendChild(x);
    }
    if (!yes && li) li.remove();
    sync();
  };
  wall.addEventListener('click', e => { const b = e.target.closest('button'); if (b) on(b.dataset.role, b.getAttribute('aria-pressed') !== 'true'); });
  pk.addEventListener('click', e => { const x = e.target.closest('.pk-x'); if (x) on(x.closest('li').dataset.role, false); });
  add.addEventListener('change', () => { if (add.value) { on(add.value, true); add.value = ''; pk.lastElementChild.querySelector('input').focus(); } });
  sync();
})();
</script>'''

# ---------- «Клиенты» ----------
SV = [('brend', 'Бренд', 'Имя, знак, цвет, шрифт и правила.', ['Имя', 'Знак', 'Цвет', 'Шрифт', 'Брендбук']),
      ('smm', 'SMM', 'План, съёмка, посты, сторис и Reels.', ['План', 'Съёмка', 'Посты', 'Reels', 'Отчёт']),
      ('reklama', 'Реклама', 'Поиск, карты и таргет.', ['Поиск', 'Карты', 'Таргет', 'Аналитика']),
      ('sayt', 'Сайт', 'Структура, дизайн, заказ с телефона и скорость.', ['Структура', 'Дизайн', 'Заказ', 'Скорость', 'Заявки'])]
# на кейс ZERNO ведёт одна ссылка — кнопка в конце главы «Кейс»; услуги и кадры кейса не ссылки
# услуги: четыре строки и рядом поле «сто одинаковых» (svc.js) — этап строки показывает, что услуга делает с вашей точкой среди ста
svc = ''.join(f'<li tabindex="0"><i>{i:02d}</i><span class="dsp">{t}</span><p class="d">{d}</p><p class="t">{" · ".join(L)}</p></li>' for i, (k, t, d, L) in enumerate(SV, 1))
svc = (f'<div class="sv2" data-r><ol class="svc">{svc}</ol>'
       '<figure class="field" aria-hidden="true"><p class="fc-n"><span>Подписчики<b data-n="f">0</b></span><span>Нашли рядом<b data-n="r">0</b></span><span>Заказы<b data-n="o">0</b></span></p>'
       '<canvas></canvas><figcaption class="fc-cap"></figcaption></figure></div>')
CASE = [('brend', 'Бренд', 'имя и знак'), ('smm', 'SMM', 'первый месяц'), ('reklama', 'Реклама', 'рядом с вами'), ('sayt', 'Сайт', 'заказ за минуту'), ('final', 'Каждый день', 'финал кейса')]
case = ''.join(f'<div><span class="im"><img src="sistema/img/kejs-{k}.webp" alt="{t}: кадр из кейса ZERNO" loading="lazy"></span><b>{t}</b><small>{s}</small></div>' for k, t, s in CASE)
kl = '<main class="view" data-view="klienty">\n' + hero('klienty', '03', 'Клиенты · маркетинг',
    '<span class="wide">Вас услышат</span><span>среди ста одинаковых</span>',
    'Бренд, соцсети, реклама и сайт. Одна команда ведёт бизнес от имени до первого заказа.',
    hud('Обсудить проект', '#k-svyaz', 'klienty') + '<a class="lnk" href="#k-uslugi">Что мы делаем <i>→</i></a>',
    [('Бренд', 'имя, знак, правила'), ('SMM', 'план и контент'), ('Реклама', 'поиск, карты, таргет'), ('Сайт', 'заказ с телефона')], f4=True) + '\n' + \
  ch('k-uslugi', '02', 'Услуги', 'Четыре этапа', 'Каждый можно заказать отдельно. Вместе они работают сильнее.', svc) + '\n' + \
  ch('k-keys', '03', 'Кейс', 'Кофейня ZERNO', 'Мы придумали кофейню с нуля и провели её через все четыре этапа. Каждый этап можно покрутить вживую.',
     f'<div class="case" data-r>{case}</div>' + hud('Открыть кейс', 'kejs-zerno.html', 'klienty')) + '\n' + \
  ch('k-kak', '04', 'Как работаем', 'Без сюрпризов', 'Цена и сроки известны до начала работы.', steps([
     ('Разговор', 'Задача, бюджет, сроки. Бесплатно.'),
     ('План', 'Этапы, цена каждого и что вы получите.'),
     ('Работа', 'Показываем результат после каждого этапа.'),
     ('Запуск', 'Запускаем и считаем заявки. Отчёт раз в месяц.')])) + '\n' + \
  ch('k-svyaz', '05', 'Разговор', 'Расскажите о бизнесе', 'Ответим в течение рабочего дня.',
     f'''<form class="form" data-done="k-done" novalidate data-r>
<div class="fld w2"><span>Что нужно</span><div class="chips"><button type="button" class="chip" aria-pressed="false">Бренд</button><button type="button" class="chip" aria-pressed="false">SMM</button><button type="button" class="chip" aria-pressed="false">Реклама</button><button type="button" class="chip" aria-pressed="false">Сайт</button><button type="button" class="chip" aria-pressed="false">Пока не знаю</button></div></div>
<label class="fld"><span>Бизнес</span><input name="biz" placeholder="Например, кофейня в Бишкеке"></label>
<label class="fld"><span>Имя</span><input name="name" autocomplete="given-name" placeholder="Как к вам обращаться"></label>
<label class="fld w2"><span>Телефон или почта *</span><input name="c" placeholder="Как с вами связаться" data-need></label>
<div class="send w2"><button class="hud" type="submit">Обсудить проект<span class="go-s" aria-hidden="true">{SIGN["klienty"]}</span></button><span class="err" hidden>Нужен телефон или почта</span><span class="note">Макет: форма никуда не отправляет</span></div>
</form>
<div class="done" id="k-done" hidden><h3 class="dsp">Разговор назначен</h3><p class="txt">Напишем в течение рабочего дня и предложим время звонка.</p></div>''') + '\n' + doors('klienty') + '\n</main>'
# ---------- один документ: шапка, Земля и главная, три раздела. Четыре файла с разным видом при открытии ----------
VIEWS = [('index.html', 'home', 'GLOBAL TRIUMPH', 'Вакансии, подбор персонала и маркетинг. GLOBAL TRIUMPH сводит тех, кто ищет друг друга.'),
         ('rabota.html', 'rabota', 'Работа вахтой — GLOBAL TRIUMPH', 'Вахта на складах и заводах: жильё бесплатно, аванс каждую неделю.'),
         ('lyudi.html', 'lyudi', 'Подбор персонала — GLOBAL TRIUMPH', 'Люди на склад и производство: от заявки до первой смены.'),
         ('klienty.html', 'klienty', 'Маркетинг для бизнеса — GLOBAL TRIUMPH', 'Бренд, соцсети, реклама и сайт одной командой.')]
for f, w, t, d in VIEWS:
    body = bar(None if w == 'home' else w) + '\n' + HOME + '\n' + '\n'.join(m if mw == w else m.replace('<main class="view"', '<main class="view" hidden', 1) for mw, m in [('rabota', rab), ('lyudi', ly), ('klienty', kl)])
    if w != 'home': body = body.replace('<section id="home" class="world"', '<section id="home" class="world" hidden', 1)
    page(f, t, d, w, body, ['home.js', 'sys.js', 'rabota.js', 'svc.js', 'portrait.js'], f'\n<link rel="stylesheet" href="sistema/home.css{V}">')

# ---------- «Кейс ZERNO»: мир станций сайта целиком, под шапкой системы ----------
kj = bar('klienty', back=True) + '''
<main><h1 class="vh">Кейс: кофейня ZERNO</h1><iframe id="world" title="Кейс ZERNO: бренд, SMM, реклама, сайт" src="zerno.html#klienty" allow="autoplay"></iframe></main>
<script>
/* мир «Клиенты» с сайта как он есть. Своя шапка сайта в нём спрятана: сверху шапка системы. #brend, #smm, #reklama, #sayt — сразу на станцию */
(() => {
  const f = document.getElementById('world'), ST = { sayt: 0, final: 0, reklama: 1, smm: 2, brend: 3 };
  f.addEventListener('load', () => {
    const d = f.contentDocument; if (!d) return;
    const s = d.createElement('style'); s.textContent = '#bar{display:none!important}'; d.head.appendChild(s);
    const k = location.hash.slice(1); if (k in ST) setTimeout(() => { const b = d.querySelector('#presets button[data-i="' + ST[k] + '"]'); if (b) b.click(); }, 900);
    /* из кейса нет дороги в прежний сайт: «Ищете людей?», «Ищете работу?» ведут на новые страницы, «Обсудить…» — к разговору на «Клиентах» */
    const NEW = { home: 'index.html', rabota: 'rabota.html', lyudi: 'lyudi.html', klienty: 'klienty.html' }, TALK = 'klienty.html#k-svyaz';
    d.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'), t = e.target.closest('#st-go, #x6-go, [data-talk], #contact-open'); if (!g && !t) return;
      e.preventDefault(); e.stopPropagation(); location.href = g ? (NEW[g.dataset.go] || 'index.html') : TALK;
    }, true);
    const w = f.contentWindow; ['GTSITE', 'GTREK', 'GTSMM', 'GTBRD', 'GTFIN'].forEach(n => { if (w[n]) w[n].onTalk = () => { location.href = TALK; }; });
    f.focus();
  });
})();
</script>'''
page('kejs-zerno.html', 'Кейс ZERNO — GLOBAL TRIUMPH', 'Кофейня ZERNO с нуля: бренд, SMM, реклама и сайт.', 'klienty', kj, ['sys.js'], cls='kejs')
