/* «SMM»: пример на станции SMM мира «Клиенты». Профиль кофейни ZERNO живёт три месяца, такой кофейни нет.
   Колесо двигает время аккаунта: день 1, неделя, месяц, три месяца. Новый пост встаёт в сетку первым и сдвигает остальные,
   как в профиле соцсети. Пост сначала появляется кругом сторис у аватара, потом становится квадратом.
   Через месяц под постами идёт разговор: гостья спрашивает, кофейня отвечает, гостья возвращается.
   Последние девять постов — серия: вместе они складываются в одну картину, чашку эспрессо ZERNO.
   Между ними четыре главы: план постов, сторис и Reels, отметки гостей, отчёт с цифрами.
   В конце картина распадается растром в сетку-сонар, возвращается надпись станции.
   В начале сетка-сонар (sonar.js) слетается в пунктир пустых клеток профиля: точки вытягиваются в чёрточки, и это клетки.
   Образцы: сетка-пазл в Instagram, Mario Mosaic 2.0, Codrops Grid Scroll Animations, If the Moon Were Only 1 Pixel.
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. Разметку модуль строит сам. */
window.GTSMM = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
/* значение по точкам [n, v]: между точками линейно */
const pw = (P, n) => { if (n <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (n <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (n - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P[P.length - 1][1]; };
const num = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const api = { onTalk: null };

/* Посты первого месяца: напитки из меню ZERNO и посты-объявления. Фото вырезаны из фона, авторы в PHOTOS.txt. */
const EARLY = [
  { h: 'Мы открылись', s: 'Бишкек, доставка за 20 минут', red: 1 },
  { f: 'cappuccino', h: 'Капучино', s: '190 с' },
  { f: 'espresso', h: 'Как варим эспрессо', s: 'Видео', reel: 1 },
  { f: 'croissant', h: 'Круассан', s: '150 с' },
  { h: '8:00–22:00', s: 'Каждый день' },
  { f: 'matcha', h: 'Матча', s: '240 с' },
  { f: 'raf', h: 'Раф', s: '230 с' },
  { f: 'latte', h: 'Латте', s: '200 с' },
  { h: 'Новое зерно', s: 'Эфиопия, светлая обжарка', red: 1 },
  { f: 'syrniki', h: 'Сырники', s: '260 с' }
];
/* Серия из девяти постов: каждый — кусок одной картины. Публикуют с конца: первым выходит правый нижний кусок. */
const SER = 9;
/* Старая шкала примера в щелчках колеса (m). День 1 стоит до 3,2. Посты первого месяца выходят 3,6–9,1, разговор 9,6–13,2,
   серия 14,4–19,6, картина собирается 20,3–21,6 и стоит три щелчка, перед уходом пауза, уход квадратами 25,4–27,4.
   Новые главы встают в паузы старой шкалы, как в «Бренде»: пока идёт пауза, старый рассказ стоит (m не растёт), а поверх идёт новая глава.
   n — настоящее положение в щелчках. Паузы: План после «Дня 1» (m 3,25), Сторис и Reels после «Недели» (m 9,15),
   Отметки после разговора (m 13,6), Отчёт после серии (m 20,15). */
const GAPS = [[3.25, 4.4], [9.15, 6.4], [13.6, 4.6], [20.15, 4.6]];
function remap(n) { let m = n; for (const [at, len] of GAPS) { if (m <= at) return m; if (m < at + len) return at; m -= len; } return m; }
/* начала пауз на настоящей шкале: 3,25 · 13,55 · 24,4 · 35,55. N(m) — где на настоящей шкале стоит точка m старой шкалы */
const GN = (() => { let add = 0; return GAPS.map(([at, len]) => { const g = at + add; add += len; return g; }); })();
const N = m => m + GAPS.reduce((a, [at, len]) => a + (at < m ? len : 0), 0);
const ADD = GAPS.reduce((s, g) => s + g[1], 0), TOTAL = 28 + ADD, EXIT = 25.4 + ADD, LAND = .5;
const STOPS = [0, 3.2, GN[0] + 4.3, N(9.05), GN[1] + 2.4, GN[1] + 6.3, N(13.2), GN[2] + 4.5, N(20.1), GN[3] + 4.5, N(22.6), TOTAL].map(n => n / TOTAL);
const TIMES = [...EARLY.map((_, k) => 3.6 + k * .55), ...Array.from({ length: SER }, (_, k) => 14.4 + k * .58)];
/* Подписи глав по настоящей шкале: номер и глава, заголовок, фраза */
const CAPS = [
  [0, '01 · День 1', 'День 1', 'Аккаунт есть. Постов нет, подписаны только свои.'],
  [GN[0] + .1, '02 · План', 'План', 'Две недели постов заранее: что, когда и зачем.'],
  [N(3.4), '03 · Неделя', 'Неделя', 'Пост или сторис каждый день. Видно, что вы открыты.'],
  [GN[1] + .1, '04 · Сторис и Reels', 'Сторис', 'Каждый день — что нового. Сторис держат своих.'],
  [GN[1] + 2.5, '04 · Сторис и Reels', 'Reels', 'Короткое видео видят те, кто на вас ещё не подписан.'],
  [N(9.2), '05 · Месяц', 'Месяц', 'Вам пишут, вы отвечаете. Гостья возвращается.'],
  [GN[2] + .1, '06 · Отметки', 'Отметки', 'Гости снимают ваш кофе и отмечают вас. О вас рассказывают другие.'],
  [N(14.2), '07 · 3 месяца', '3 месяца', 'Посты идут серией и складываются в один образ.'],
  [GN[3] + .1, '08 · Отчёт', 'Отчёт', 'Раз в месяц — цифры: сколько людей пришло и сколько заказало.'],
  [N(20.3), '09 · Образ', 'Образ', 'Один пост — квадрат. Сто постов — образ.']
];
/* Время аккаунта на старой шкале: 0 — день 1, 0,22 — неделя, 0,48 — месяц, 1 — три месяца. Счётчики выдуманы.
   Подписчики растут по старой шкале и прыгают после Reels (+1 300) и поста блогера (+500): к концу 4 800 */
const CLOCK = [[3.6, 0], [6, .22], [9.2, .48], [14.2, .5], [19.6, 1]];
const FANS = [[3.6, 14], [6, 61], [9.2, 540], [14.2, 810], [19.6, 3000]];
const fans = (n, m) => pw(FANS, m) + 1300 * ss(GN[1] + 5.4, GN[1] + 6, n) + 500 * ss(GN[2] + 2.5, GN[2] + 3.2, n);

/* 02 План: день, рубрика и пост. Красные рубрики — поводы, остальные — обычные дни */
const PLAN = [['пн 3', 'Анонс', 1], ['вт 4', 'Напиток дня'], ['ср 5', 'Видео'], ['чт 6', 'К кофе'], ['пт 7', 'Важное'], ['сб 8', 'Не кофе'], ['вс 9', 'Напиток дня'], ['пн 10', 'Утро'], ['вт 11', 'Новинка', 1], ['ср 12', 'Завтрак']];
/* 06 Отметки: посты гостей с отметкой @zerno.kg. Пятый, в середине, — местный блогер */
const TAGS = [['flatwhite', 'aigerim_b', '#2b2622'], ['americano', 'timur.k', '#22252b'], ['cocoa', 'dana.art', '#2a2420'], ['coldbrew', 'ernis.b', '#1f2327'], ['latte', 'bishkek.coffee.walk', '#2e2722', '48K'],
  ['croissant', 'alina_m', '#25221f'], ['tea', 'office.42', '#20252a'], ['raf', 'kairat', '#2a2522'], ['matcha', 'meerim', '#212622']];
/* 08 Отчёт: подписчики по неделям, скачки после Reels (5-я неделя) и поста блогера (8-я) */
const WEEKS = [14, 61, 180, 540, 650, 1950, 2150, 2400, 2950, 3300, 3800, 4300, 4800];
const KPI = [['Подписчики', 4800, '+4 786 за 3 месяца'], ['Охват за месяц', 182000, 'увидели посты'], ['Сохранения', 3400, 'вернутся к посту'], ['Заказы из директа', 610, '≈ 20 в день', 1]];

/* Разметка */
/* знак ZERNO: зерно разрезано буквой Z. Разрез — цвет фона под знаком (--zbg), знак стоит на красном. */
const MARK = '<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor"/><path d="M8 34H61L39 66H92" fill="none" style="stroke:var(--zbg,#df1f12)" stroke-width="8" stroke-miterlimit="10"/></g></svg>';
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>';
const ZIMG = 'assets/zerno/', GRID = 'assets/zerno/espresso-grid.webp';
const tile = (p, k) => p.f
  ? `<div class="x3-t ph${p.reel ? ' reel' : ''}" data-k="${k}"><img src="${ZIMG + p.f}.webp" alt="" decoding="async"><b>${p.h}</b><em>${p.s}</em></div>`
  : `<div class="x3-t tx${p.red ? ' red' : ''}" data-k="${k}"><b>${p.h}</b><em>${p.s}</em></div>`;
/* кусок картины: номер в серии и, у двух кусков, надпись, чтобы пост читался и сам по себе */
const piece = s => { const c = SER - 1 - s, ov = c === 0 ? '<b class="ov">ZERNO</b>' : c === 2 ? '<b class="ov r">Эспрессо<em>120 с</em></b>' : '';
  return `<div class="x3-t sr" data-k="${EARLY.length + s}" style="--bx:${(c % 3) * 50}%;--by:${(c / 3 | 0) * 50}%">${ov}<i class="no">${s + 1}/${SER}</i></div>`; };
const tag = ([f, u, bg, blog]) => `<div class="x3-u${blog ? ' x3-bl' : ''}" style="--ub:${bg}"><img src="${ZIMG + f}.webp" alt="" decoding="async"><i class="x3-uw"><s>${u[0].toUpperCase()}</s>${u}${blog ? `<small>${blog}</small>` : ''}</i><em>@zerno.kg</em></div>`;
const R = document.createElement('div');
R.id = 'x3'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример ведения соцсетей. Такой кофейни нет');
R.innerHTML = `
<div id="x3-bg" aria-hidden="true"></div>
<div id="x3-scene">
  <div class="x3-cap" id="x3-cap"><small id="x3-n">${CAPS[0][1]}</small><h3 id="x3-h">${CAPS[0][2]}</h3><p id="x3-p">${CAPS[0][3]}</p>
    <div id="x3-ru" aria-hidden="true"><div class="tk"></div><i id="x3-nd"></i><span style="left:0">День 1</span><span style="left:22%">Неделя</span><span style="left:48%">Месяц</span><span style="left:100%">3 месяца</span></div>
  </div>
  <div id="x3-stage">
    <div id="x3-pf">
      <header id="x3-hd"><div id="x3-av"><i class="rg"></i><i class="lg">${MARK}</i></div>
        <div class="who"><b>zerno.kg</b><span>Кофе с доставкой · Бишкек</span></div>
        <button class="cta" type="button" id="x3-sub">Подписаться</button>
        <dl id="x3-ct"><div><dd id="x3-np">0</dd><dt>публикаций</dt></div><div><dd id="x3-nf">14</dd><dt>подписчиков</dt></div></dl></header>
      <div id="x3-gw"><nav id="x3-tb" aria-hidden="true"><span>Публикации</span><span>Reels</span><span>Отметки <b id="x3-tn">0</b></span><i></i></nav>
        <div id="x3-grid">${Array.from({ length: 12 }, () => '<i class="x3-c"></i>').join('')}${EARLY.map(tile).join('')}${Array.from({ length: SER }, (_, s) => piece(s)).join('')}<div id="x3-big" aria-hidden="true"><b class="ov">ZERNO</b><b class="ov r">Эспрессо<em>120 с</em></b></div></div>
</div>
    </div>
    <div id="x3-cm" aria-live="polite">
      <div id="x3-plan" aria-hidden="true"><small>Контент-план · 2 недели</small><ol>${PLAN.map(([d, r, red], k) => `<li><time>${d}</time><i${red ? ' class="x3-r"' : ''}>${r}</i><span>${EARLY[k].h}</span></li>`).join('')}</ol></div>
      <div class="gp" id="x3-g1" data-c="2"><div class="bb q" id="x3-q1"><i class="av">А</i><div><b>aigerim_b</b><p>Есть овсяное молоко?</p></div></div>
        <div class="bb a" id="x3-a1"><i class="av z">${MARK}</i><div><b>zerno.kg <small>через 4 минуты</small></b><p><span class="dots"><i></i><i></i><i></i></span><span class="tx">Есть. Флэт уайт на овсяном — 230 с.</span></p></div></div></div>
      <div class="gp" id="x3-g2" data-c="8"><div class="bb q" id="x3-q2"><i class="av">А</i><div><b>aigerim_b <small class="vip">Постоянная гостья</small></b><p>Снова у вас. Флэт уайт на овсяном, как в прошлый раз.</p></div></div></div>
    </div>
    <div id="x3-tg" aria-hidden="true">${TAGS.map(tag).join('')}</div>
    <div id="x3-vw" aria-hidden="true"><div class="x3-sw"><div class="x3-pr"><i></i><i></i><i></i></div><div class="x3-vh"><i class="av">${MARK}</i><b>zerno.kg</b><small>2 ч</small></div>
      <div class="x3-st x3-s1"><img src="${ZIMG}latte.webp" alt=""><p>Открылись в 8:00.<br>Первый латте ждёт.</p></div>
      <div class="x3-st x3-s2"><p>Овсяное или обычное?</p><div class="x3-pl"><span style="--v:.64"><b>Овсяное</b><em>64%</em></span><span style="--v:.36"><b>Обычное</b><em>36%</em></span></div></div>
      <div class="x3-st x3-s3"><img src="${ZIMG}croissant.webp" alt=""><p>Сегодня круассаны<br>с миндалём</p><span class="x3-stk">Заказать →</span></div></div>
      <div class="x3-rl"><img src="${GRID}" alt=""><b class="x3-rtg">Reels</b><i class="x3-rt">0:00</i><p>Как варим эспрессо</p></div></div>
    <canvas id="x3-rc" aria-hidden="true"></canvas>
    <div id="x3-rn" aria-hidden="true"><b>0</b><small>увидели видео</small><p><span>0</span> из них ещё не подписаны</p></div>
    <div id="x3-rp" aria-hidden="true"><small>Статистика · 3 месяца</small>
      <div class="x3-kp">${KPI.map(([t, v, s, r]) => `<div${r ? ' class="x3-r"' : ''}><dt>${t}</dt><dd data-v="${v}">0</dd><em>${s}</em></div>`).join('')}</div>
      <svg class="x3-ch" viewBox="0 0 600 170" preserveAspectRatio="none"><g class="x3-gl">${[0, 1, 2, 3].map(i => `<line x1="0" x2="600" y1="${20 + i * 45}" y2="${20 + i * 45}"/>`).join('')}</g><clipPath id="x3-clip"><rect x="0" y="0" width="0" height="170"/></clipPath><g clip-path="url(#x3-clip)"><path class="x3-ar"/><path class="x3-ln"/></g></svg><i class="x3-hd2"></i>
      <div class="x3-ax"><span>Неделя 1</span><span class="x3-m5">Reels</span><span class="x3-m8">Блогер</span><span>Неделя 13</span></div></div>
  </div>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>
<div id="x3-sd" role="dialog" aria-modal="true" aria-labelledby="x3-sd-t" hidden><div class="bx"><small>Пример</small><h3 id="x3-sd-t">Здесь человек подпишется</h3><p>Реклама привела его один раз. Соцсети напоминают о&nbsp;вас, и&nbsp;он возвращается.</p><div class="bt"><button type="button" id="x3-sd-x">Понятно</button><button type="button" id="x3-sd-go">Обсудить SMM</button></div></div></div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
const TILES = $$('.x3-t'), CELLS = $$('.x3-c'), PLI = $$('#x3-plan li'), UT = $$('.x3-u'), ST = $$('#x3-vw .x3-st'), PR = $$('#x3-vw .x3-pr i'), KD = $$('#x3-rp dd');
/* картина серии */
R.style.setProperty('--grid', `url("${GRID}")`);
/* линия подписчиков в отчёте: x по неделям, y по числу */
{ const P = WEEKS.map((v, i) => [i / 12 * 600, 160 - v / 5000 * 140]), d = 'M' + P.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L');
  $('#x3-rp .x3-ln').setAttribute('d', d); $('#x3-rp .x3-ar').setAttribute('d', d + 'L600 170L0 170Z'); }

/* Геометрия: сцена стоит между шапкой сайта и строкой над шкалой. Размер плитки зависит от высоты: видно три ряда и край четвёртого. */
const G = { W: 0, H: 0, wide: true, top: 0, bot: 0, ts: 100, g: 4, av: [0, 0, 56], vw: null, src: {} };
function layout() {
  const foot = document.getElementById('air-foot'), bar = document.getElementById('bar'), kr = kl.getBoundingClientRect();
  G.W = innerWidth; G.H = Math.max(240, kr.height || innerHeight); G.wide = G.W > 760;
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom : 56); G.bot = foot.getBoundingClientRect().top - kr.top;
  R.style.setProperty('--top', G.top + 'px'); R.style.setProperty('--bot', Math.max(0, G.H - G.bot) + 'px');
  const st = $('#x3-stage'), hd = $('#x3-hd'), sw = st.clientWidth, sh = st.clientHeight;
  /* сначала ширина под шапку, потом плитка по оставшейся высоте */
  const cmW = G.wide ? Math.min(270, Math.max(200, sw * .32)) : 0, g = G.wide ? 5 : 3;
  let ts = G.wide ? (sw - cmW - 28 - 2 * g) / 3 : (sw - 2 * g) / 3;
  R.style.setProperty('--pw', 3 * ts + 2 * g + 'px');
  const hh = hd.offsetHeight + (G.wide ? 18 : 10);
  ts = Math.floor(Math.min(ts, (sh - hh - 3 * g) / 3.35, G.wide ? 210 : 150));
  G.ts = Math.max(40, ts); G.g = g;
  R.style.setProperty('--ts', G.ts + 'px'); R.style.setProperty('--g', g + 'px'); R.style.setProperty('--pw', 3 * G.ts + 2 * g + 'px'); R.style.setProperty('--cmw', cmW + 'px');
  /* аватар в координатах сетки: оттуда выходят новые посты */
  $('#x3-gw').style.height = 3.35 * G.ts + 3 * g + 'px';
  const gr = $('#x3-grid').getBoundingClientRect(), ar = $('#x3-av').getBoundingClientRect(), cr = $('#x3-cm').getBoundingClientRect();
  G.av = [ar.left - gr.left, ar.top - gr.top, ar.width]; G.hh = hd.offsetHeight;
  /* разговор стоит справа от поста, под которым он идёт; на телефоне поверх нижних рядов */
  $$('#x3-cm .gp').forEach(el => {
    const [, y] = cellXY(+el.dataset.c, g);
    el.style.top = G.wide ? gr.top - cr.top + y + 'px' : el.id === 'x3-g2' ? gr.top - cr.top + 'px' : '';
    el.style.setProperty('--lw', Math.max(0, cr.left - gr.left - 3 * G.ts - 2 * g - 6) + 'px');
  });
  CELLS.forEach((c, i) => { const [x, y] = cellXY(i, g); c.style.transform = `translate(${x}px,${y}px)`; });
  /* новые главы. План — в столбце разговора на высоте сетки. Окно сторис и Reels — справа во всю высоту профиля, 9 : 16.
     Отчёт — на месте шапки и сетки профиля вместе со столбцом разговора. Отметки — в клетках сетки. */
  const sr = st.getBoundingClientRect(), hr = hd.getBoundingClientRect();
  $('#x3-plan').style.top = gr.top - cr.top + 'px';
  const vh = Math.min(sh * .97, gr.top - hr.top + 3 * G.ts + 2 * g + 24), vwW = vh * 9 / 16;
  G.vw = { x: cr.right - sr.left - vwW, y: Math.max(0, Math.min(hr.top - sr.top - 12, sh - vh)), w: vwW, h: vh };
  /* на телефоне окно стоит ниже шапки профиля, чтобы не закрывать её, и оставляет слева место числу */
  if (!G.wide) { const y0 = gr.top - sr.top, h2 = Math.min(sh - y0 - 4, vh), w2 = h2 * 9 / 16; G.vw = { x: cr.right - sr.left - w2, y: y0, w: w2, h: h2 }; }
  G.sr = sr; G.rp = { x: gr.left - sr.left, y: hr.top - sr.top, w: cr.right - gr.left, h: gr.top - hr.top + 3 * G.ts + 2 * g };
  Object.assign($('#x3-rp').style, { left: G.rp.x + 'px', top: G.rp.y + 'px', width: G.rp.w + 'px', height: G.rp.h + 'px' });
  Object.assign($('#x3-tg').style, { left: gr.left - sr.left + 'px', top: gr.top - sr.top + 'px' });
  const dpr = Math.min(devicePixelRatio || 1, 2); RC.width = Math.round(sw * dpr); RC.height = Math.round(sh * dpr); RC.style.width = sw + 'px'; RC.style.height = sh + 'px'; RC.dataset.on = '';
  Object.assign(RN.style, { left: gr.left - sr.left + 'px', top: gr.top - sr.top + G.ts * .75 + 'px', maxWidth: G.wide ? '' : Math.max(90, G.vw.x - (gr.left - sr.left) - 10) + 'px' });
  UT.forEach((u, i) => { const [x, y] = cellXY(i, g); u.dataset.x = x; u.dataset.y = y; });
  X.key = '';
}
const cellXY = (c, g = G.g) => [(c % 3) * (G.ts + g), Math.floor(c / 3) * (G.ts + g)];
/* место и видимость плитки по дробному номеру клетки. В ряду плитка едет вправо.
   Из правого столбца в следующий ряд она уходит вправо и входит слева, а не ползёт по диагонали поверх других. */
function at(c, g) {
  const c0 = Math.floor(c), f = c - c0, k = f * f * (3 - 2 * f), a = cellXY(c0, g), b = cellXY(c0 + 1, g);
  if (c0 % 3 !== 2) return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), 1];
  const st = G.ts + g;
  return k < .5 ? [a[0] + st * k, a[1], 1 - 2 * k] : [b[0] - st * (1 - k), b[1], 2 * k - 1];
}

const X = { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '', tr: trace(0) };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '' });
  R.classList.remove('on'); $('#x3-sd').hidden = true;
  ['#x3-bg', '#x3-scene'].forEach(s => vis($(s), 0));
  R.style.opacity = ''; window.GTSONAR?.halftone(R, 0);
  kl.classList.remove('ex', 'exd');
}
/* c: near — ручка у станции SMM, tuned — станция настроена, alpha — насколько станция слышна */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); layout(); }
  if (!c.tuned) { X.tw = 0; if (X.u <= 0) X.goal = null; }
  else if (!X.auto && X.u <= 0 && X.goal == null) { X.tw += dt; if (X.tw > 6) { X.auto = true; X.goal = STOPS[1]; } }
  /* Щелчок и сам запуск проигрывают отрезок со скоростью четыре щелчка в секунду */
  /* переходы с сеткой-сонаром идут медленнее, колесо в них мягче */
  const slow = v => v * TOTAL < 1.9 || v * TOTAL > EXIT;
  if (X.goal != null) { const sp = RM ? 9 : (slow(X.u) ? 1.3 : 4) / TOTAL * dt, d = X.goal - X.u; X.u = Math.abs(d) <= sp ? X.goal : X.u + Math.sign(d) * sp; if (X.u === X.goal) X.goal = null; }
  X.uc = RM || X.goal != null || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * (slow(X.uc) ? 3.5 : 9)));
  const n = X.uc * TOTAL, A = c.alpha;
  X.ph = n <= .1 ? 0 : 1; X.tr = trace(n);
  const hz = ss(EXIT, EXIT + .8, n), wt = ss(EXIT + .8, EXIT + 1.6, n), gone = wt >= 1;
  vis($('#x3-bg'), ss(.1, 1, n) * (gone ? 0 : 1) * A);
  const sceneA = ss(.2, 1.4, n) * (gone ? 0 : 1) * A;
  vis($('#x3-scene'), sceneA);
  const key = n.toFixed(4) + '|' + A.toFixed(3);
  if (sceneA > .004 && key !== X.key) { X.key = key; scene(n); }

  /* Уход: картина распадается растром на кружки на местах точек сетки-сонара (hz), кружки мельчают до точек,
     на них проявляются белые точки сетки (grid), потом пример гаснет (wt): картина белеет в сетку. */
  if (window.GTSONAR) GTSONAR.halftone(R, hz);
  R.style.opacity = 1 - (window.GTSONAR ? wt : ss(EXIT, EXIT + 1.6, n));
  /* Пока идёт пример, надпись станции спрятана. После примера она возвращается. */
  const done = n > TOTAL - .15;
  kl.classList.toggle('ex', X.ph === 1 && !done); kl.classList.toggle('exd', done);
}
function scene(n) {
  const m = remap(n);
  /* подпись: на границе отрезков старая гаснет, слова меняются, новая проявляется */
  let ci = 0; CAPS.forEach((cp, i) => { if (n >= cp[0]) ci = i; });
  const nb = CAPS.reduce((mm, cp, i) => i ? Math.min(mm, Math.abs(n - cp[0])) : mm, 9);
  if (ci !== X.cap) { X.cap = ci; $('#x3-n').textContent = CAPS[ci][1]; $('#x3-h').textContent = CAPS[ci][2]; $('#x3-p').textContent = CAPS[ci][3]; }
  const cap = $('#x3-cap'), ca = ss(.6, 1.6, n) * clamp(nb / .22);
  cap.style.opacity = ca; cap.style.transform = `translateY(${(1 - ss(.6, 1.6, n)) * 16}px)`;
  R.classList.toggle('fin', ci === CAPS.length - 1);
  /* шкала времени аккаунта */
  const k = pw(CLOCK, m); $('#x3-ru').style.setProperty('--k', k);
  $$('#x3-ru span').forEach((s, i) => s.classList.toggle('on', k >= [0, .22, .48, 1][i] - .005));

  /* посты: e — насколько пост долетел до первой клетки. Номер клетки поста — сколько постов вышло после него. */
  const E = TIMES.map(t => ss(t + LAND * .3, t + LAND, m)), P = TIMES.map(t => clamp((m - t) / LAND));
  const rv = ss(20.3, 21.6, m), g = lerp(G.g, 0, rv), ts = G.ts;
  let ring = 0, tail = 0;
  for (let k = TILES.length - 1; k >= 0; k--) {
    const el = TILES[k], p = P[k], e = E[k], c = tail; tail += e;
    if (p <= 0 || c > 12.5) { if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'; continue; }
    el.style.visibility = 'visible';
    let [x, y, o] = at(c, g), s = 1, rad = 0;
    if (e < 1) {
      /* до полёта пост — круг сторис у аватара */
      const a0 = G.av, s0 = a0[2] / ts, x1 = x, y1 = y; o = 1;
      x = lerp(a0[0], x1, e); y = lerp(a0[1], y1, e); s = lerp(s0, 1, e); rad = 1 - ss(.45, 1, e);
      ring = Math.max(ring, ss(0, .15, p) * (1 - ss(.4, .7, p)));
    }
    el.style.transform = `translate(${x}px,${y}px) scale(${s})`;
    el.style.borderRadius = rad > .001 ? `${rad * 50}%` : '';
    /* старые посты уходят в четвёртый ряд, при сборке картины гаснут */
    el.style.opacity = ss(0, .2, p) * o * (c > 8.5 ? 1 - rv : 1);
  }
  /* сторис горят у аватара и в главе «Сторис и Reels» */
  const sg = n - GN[1], sRing = ss(0, .2, sg) * (1 - ss(2.3, 2.6, sg));
  $('#x3-av').style.setProperty('--ring', Math.max(ring, sRing));
  /* клетки пустого профиля видны, пока их не заняли. В начале их пунктир собирает сетка-сонар и отдаёт им (X.tr.out). */
  const filled = tail;
  CELLS.forEach((cl, i) => { cl.style.opacity = (i < filled - .5 ? 0 : 1) * (1 - rv) * X.tr.out; });

  /* счётчики */
  const early = E.slice(0, EARLY.length).filter(v => v >= .5).length, ser = clamp((m - 14.4) / (TIMES[TIMES.length - 1] + LAND - 14.4));
  $('#x3-np').textContent = num(m < 14.4 ? early : EARLY.length + ser * (92 - EARLY.length));
  $('#x3-nf').textContent = num(fans(n, m));

  /* разговор под постами: вопрос, ответ кофейни через несколько минут, гостья возвращается. На «Отметках» он уходит и больше не возвращается */
  const cmA = (1 - ss(14.2, 14.6, m)) * (n >= GN[2] ? 1 - ss(GN[2], GN[2] + .4, n) : 1);
  const bub = (sel, a, b) => { const el = $(sel), k = ss(a, b, m); vis(el, k * cmA); el.style.transform = `translateY(${(1 - k) * 10}px)`; };
  bub('#x3-q1', 9.6, 10.2); bub('#x3-a1', 10.3, 10.8); bub('#x3-q2', 11.9, 12.5);
  /* на телефоне разговор стоит поверх сетки, второй вопрос сменяет первый */
  $('#x3-g1').style.opacity = G.wide ? '' : 1 - ss(11.5, 11.9, m);
  $('#x3-g1').style.setProperty('--ln', ss(9.6, 10.2, m) * cmA); $('#x3-g2').style.setProperty('--ln', ss(11.9, 12.5, m) * cmA);
  const typed = ss(10.9, 11.2, m); $('#x3-a1').style.setProperty('--typed', typed);
  $('#x3-q2').classList.toggle('vip', m > 12.6);
  /* пост, под которым идёт разговор, подсвечен */
  TILES.forEach(t => t.classList.remove('hot'));
  if (cmA > 0 && m > 9.6 && m < 14.2) TILES[EARLY.length - 1 - (m > 11.9 ? 8 : 2)].classList.add('hot');

  /* новые главы */
  plan(n, m, E);
  stories(n);
  const ra = reach(n); $('#x3-gw').style.opacity = ra > 0 ? (1 - .85 * ra).toFixed(3) : '';
  const sw = tags(n), gx = -(3 * G.ts + 2 * G.g + 60) * sw;
  const rr = report(n);

  /* сборка картины: щели закрываются, шапка профиля и номера серии гаснут, картина чуть растёт.
     На «Отметках» сетка уезжает влево (gx), на «Отчёте» профиль притухает (rr) */
  R.style.setProperty('--rv', rv); $('#x3-big').style.opacity = ss(.55, 1, rv);
  const hd = $('#x3-hd'); hd.style.opacity = 1 - rv;
  const gt = [gx ? `translateX(${gx.toFixed(1)}px)` : '', rv > 0 ? `translateY(${-rv * G.hh * .5}px) scale(${1 + rv * .1})` : ''].join(' ').trim();
  $('#x3-grid').style.transform = gt; $('#x3-grid').style.opacity = sw > 0 ? (1 - sw).toFixed(3) : '';
  $('#x3-pf').style.opacity = rr > 0 ? (1 - .9 * rr).toFixed(3) : '';
  $('#x3-stage').style.transform = `translateY(${(1 - ss(.2, 1.4, n)) * 30}px)`;
  $('#x3-scene .tag').style.opacity = .5 * ss(1, 2, n);
}

/* ---------- 02 План: в столбце справа печатается план на две недели, в «Неделе» каждый пункт отмечается, когда выходит его пост ---------- */
function plan(n, m, E) {
  const el = $('#x3-plan'), g = n - GN[0], a = (g < 0 ? 0 : ss(0, .4, g)) * (1 - ss(9, 9.15, m));
  vis(el, a); if (a <= .004) return;
  PLI.forEach((li, k) => {
    const t = ss(.5 + k * .3, .8 + k * .3, g); li.style.opacity = t; li.style.transform = `translateX(${((1 - t) * 14).toFixed(1)}px)`;
    li.classList.toggle('x3-ok', E[k] >= .5);
  });
}
/* ---------- 04 Сторис и Reels: окно 9 : 16 раскрывается из аватара (сторис) и из плитки видео в сетке (Reels) ----------
   Окно — коробка, которая едет и растёт от места, откуда раскрывается, до своего места справа; всё внутри размечено долями её ширины */
function box(el, r, rad) { Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: rad }); }
function rel(el) { const r = el.getBoundingClientRect(), s = $('#x3-stage').getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; }
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
/* Одно окно на всю главу: раскрывается из аватара, три сторис, свайп вверх к Reels, в конце уходит в плитку видео в сетке.
   Шкала главы g: 0,15–0,55 окно из аватара; сторис 0,55–1,15 · 1,15–1,75 · 1,75–2,35; 2,35–2,75 свайп к Reels; видео 2,75–5,9; 5,9–6,3 в плитку */
const SC = [.55, 1.15, 1.75, 2.35], SWP = [2.35, 2.75];
function stories(n) {
  const g = n - GN[1], vw = $('#x3-vw');
  if (g < 0 || g > 6.4 || !G.vw) { vis(vw, 0); return; }
  const op = ss(.15, .55, g), cl = 1 - ss(5.9, 6.3, g), o = Math.min(op, cl);
  vis(vw, o > .002 ? 1 : 0); if (o <= .002) return;
  const closing = g > 5.9, src = closing ? rel(TILES[2]) : rel($('#x3-av')), e = o * o * (3 - 2 * o);
  box(vw, mix(src, G.vw, e), `${lerp(closing ? 0 : 50, 4.5, e).toFixed(2)}%`);
  /* свайп: сторис уезжают вверх, снизу въезжает видео — как в ленте */
  const sw = ss(SWP[0], SWP[1], g), sk = sw * sw * (3 - 2 * sw);
  $('#x3-vw .x3-sw').style.transform = sk > 0 ? `translateY(${(-100 * sk).toFixed(2)}%)` : '';
  $('#x3-vw .x3-rl').style.transform = `translateY(${(102 * (1 - sk)).toFixed(2)}%)`;
  /* сторис по очереди, полоски хода сверху */
  const si = i => ss(SC[i] - .06, SC[i] + .06, g);
  ST.forEach((s, i) => { s.style.opacity = ((i ? si(i) : 1) * (i < 2 ? 1 - si(i + 1) : 1)).toFixed(3); });
  PR.forEach((p, i) => p.style.setProperty('--p', clamp((g - SC[i]) / (SC[i + 1] - SC[i])).toFixed(3)));
  $('#x3-vw .x3-s2').style.setProperty('--f', ss(1.3, 1.6, g).toFixed(3));
  /* кнопка «Заказать» появляется и вздрагивает, когда в неё прилетают заказы */
  const bump = ss(2.05, 2.15, g) * (1 - ss(2.15, 2.35, g));
  $('#x3-vw .x3-s3 .x3-stk').style.transform = `scale(${(.6 + .4 * ss(1.85, 2, g) + .1 * bump).toFixed(3)}) rotate(-4deg)`;
  /* видео идёт 28 секунд: камера медленно наезжает на чашку, таймер и полоса хода */
  const p = ss(2.75, 5.9, g); $('#x3-vw .x3-rl img').style.transform = `scale(${(1.04 + .18 * p).toFixed(3)})`;
  $('#x3-vw .x3-rt').textContent = '0:' + String(Math.round(28 * p)).padStart(2, '0');
  $('#x3-vw .x3-rl').style.setProperty('--p', p.toFixed(3));
}
/* ---------- 04 Сторис и Reels: свои и чужие точками ----------
   Вокруг окна кольцо своих — 533 подписчика, каждая точка — человек. В сторис кольцо отвечает: точки загораются (посмотрели),
   красятся в два цвета (ответили на опрос: красные — за овсяное), часть краснеет и летит в кнопку «Заказать» (заказали).
   После свайпа к Reels от кольца по сцене расходится поле серых точек — чужие, которые увидели видео. Край поля светлеет, как волна сонара.
   Число растёт до 41 000, потом часть серых точек краснеет и летит в счётчик подписчиков в шапке: +1 300.
   Крупное число слева считает то, что делают точки. Сетка профиля на всю главу притухает. */
const RC = $('#x3-rc'), RN = $('#x3-rn');
const RNT = [[0, 'посмотрели сторис', 'из 533 подписчиков'], [1.15, 'ответили на опрос', '64% — за овсяное'], [1.75, 'заказали из сторис', 'по кнопке «Заказать»'], [2.45, 'увидели видео', '']];
function reach(n) {
  const g = n - GN[1], c = RC.getContext('2d'), d = Math.min(devicePixelRatio || 1, 2);
  const a = ss(.1, .5, g) * (1 - ss(5.85, 6.25, g));
  if (!(a > .004) || !G.vw) { if (RC.dataset.on) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, RC.width, RC.height); RC.dataset.on = ''; } vis(RN, 0); return 0; }
  RC.dataset.on = 1;
  const W = RC.width / d, H = RC.height / d, ox = G.vw.x + G.vw.w / 2, oy = G.vw.y + G.vw.h / 2;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
  /* свои — кольцо у окна; после свайпа поле растёт по мере просмотров до дальнего угла сцены */
  const vv = ss(3.4, 5, g), v = 533 + 40467 * vv ** 1.3;
  const r0 = Math.hypot(G.vw.w, G.vw.h) / 2 + 30, rm = Math.max(Math.hypot(ox, oy), Math.hypot(W - ox, oy), Math.hypot(ox, H - oy), Math.hypot(W - ox, H - oy)) + 20;
  const r = vv > 0 ? r0 + (rm - r0) * Math.sqrt((v - 533) / 40467) : r0, crestK = 1 - ss(5, 5.3, g);
  const sr = $('#x3-stage').getBoundingClientRect(), nf = $('#x3-nf').getBoundingClientRect(), tx = nf.left - sr.left + nf.width / 2, ty = nf.top - sr.top + nf.height / 2;
  const sb = $('#x3-vw .x3-stk').getBoundingClientRect(), bx = sb.left - sr.left + sb.width / 2, by = sb.top - sr.top + sb.height / 2;
  const S = 18, i0 = Math.floor(-ox / S), i1 = Math.ceil((W - ox) / S), j0 = Math.floor(-oy / S), j1 = Math.ceil((H - oy) / S);
  const red = [], ord = [];
  /* под шапкой профиля и под числом точек нет: там читают */
  const box2 = (el, p) => { const q = el.getBoundingClientRect(); return [q.left - sr.left - p, q.top - sr.top - p, q.right - sr.left + p, q.bottom - sr.top + p]; };
  const hdB = box2($('#x3-hd'), 10), rnB = box2(RN, 18), out = (x, y) => (x > hdB[0] && x < hdB[2] && y > hdB[1] && y < hdB[3]) || (x > rnB[0] && x < rnB[2] && y > rnB[1] && y < rnB[3]);
  /* что делают свои: посмотрели (s1), ответили на опрос (k2), заказали (k3), снова все вместе перед Reels (kr) */
  const s1 = ss(.6, 1.1, g), k2 = ss(1.2, 1.45, g) * (1 - ss(1.75, 1.85, g)), k3 = ss(1.8, 1.95, g), kr = ss(2.35, 2.6, g);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const x = ox + i * S, y = oy + j * S, dd = Math.hypot(x - ox, y - oy);
    if (dd > r + 2 || out(x, y)) continue;
    const inner = dd < r0, q = i * 131 + j, h = hash(q, 51);
    let col = '#fff', al, rr;
    if (inner) {
      const h2 = hash(q, 53), h3 = hash(q, 54), seen = h < .773 * s1 ? .9 : .2;
      rr = 1.6;
      if (g < 1.2) al = seen;
      else if (g < 1.8) { const ans = h < .555; al = lerp(seen, ans ? .95 : .2, k2); if (ans && h2 < .64 && k2 > .4) { col = '#df1f12'; rr = 2; } }
      else if (g < 2.35) { if (h3 < .07) { ord.push([x, y, h2]); continue; } al = lerp(.9, .5, k3); }
      else al = lerp(.5, .9, kr);
    } else {
      if (h < .02) { red.push([x, y, hash(q, 52)]); continue; }
      const crest = Math.max(0, 1 - Math.abs(dd - r) / 26) * crestK; al = .32 + .6 * crest; rr = 1.15 + 1.5 * crest;
    }
    c.globalAlpha = a * al; c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill();
  }
  /* заказы из сторис: точки краснеют и по дуге летят в кнопку «Заказать» */
  ord.forEach(([x, y, h]) => {
    const k = ss(1.8 + h * .1, 1.9 + h * .1, g), f = ss(1.95 + h * .12, 2.15 + h * .12, g), e = f * f * (3 - 2 * f);
    if (f >= 1 && g < 2.35) return;
    const px = lerp(x, bx, e), py = lerp(y, by, e) - Math.sin(Math.PI * e) * 40;
    c.globalAlpha = a * .95; c.fillStyle = k > 0 ? '#df1f12' : '#fff'; c.beginPath(); c.arc(px, py, 1.6 + .8 * k, 0, 7); c.fill();
  });
  /* кольцо своих и подпись к нему — слева от кольца, на уровне нижней части окна */
  c.globalAlpha = a * .35; c.strokeStyle = '#fff'; c.lineWidth = 1; c.setLineDash([3, 5]); c.beginPath(); c.arc(ox, oy, r0, 0, 7); c.stroke(); c.setLineDash([]);
  c.globalAlpha = a * .75; c.fillStyle = '#fff'; c.font = '500 11px "JetBrains Mono",monospace'; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText('533 ПОДПИСЧИКА · СВОИ', ox - r0 - 12, oy + r0 * .55); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  /* новые подписчики из Reels: серые точки краснеют и по дуге летят в счётчик подписчиков */
  red.forEach(([x, y, h]) => {
    const k = ss(5 + h * .3, 5.15 + h * .3, g), f = ss(5.35 + h * .3, 5.75 + h * .3, g), e = f * f * (3 - 2 * f);
    if (f >= 1) return;
    const px = lerp(x, tx, e), py = lerp(y, ty, e) - Math.sin(Math.PI * e) * 60;
    c.globalAlpha = a * (k > 0 ? 1 : .32); c.fillStyle = k > 0 ? '#df1f12' : '#fff'; c.beginPath(); c.arc(px, py, k > 0 ? 1.15 + 1.9 * k * (1 - .4 * e) : 1.15, 0, 7); c.fill();
  });
  /* у счётчика подписчиков красное «+1 300», пока долетают точки */
  const pa = ss(5.45, 5.7, g) * (1 - ss(5.95, 6.25, g));
  if (pa > 0) { c.globalAlpha = pa; c.fillStyle = '#ff5a45'; c.font = '500 15px Tektur,Montserrat,sans-serif'; c.textBaseline = 'middle'; const nr = $('#x3-nf').parentElement.getBoundingClientRect(); c.fillText('+1 300', nr.right - sr.left + 12, ty - 14 * (1 - ss(5.45, 5.7, g))); c.textBaseline = 'alphabetic'; }
  c.globalAlpha = 1;
  /* число слева: что сделали точки в этой части главы. На смене части число на миг гаснет и меняет подпись */
  let mi = 0; RNT.forEach((t, k) => { if (g >= t[0]) mi = k; });
  const dip = Math.min(...RNT.slice(1).map(t => clamp(Math.abs(g - t[0]) / .07)));
  vis(RN, a * ss(.6, .8, g) * dip);
  const val = [412 * s1, 296 * ss(1.25, 1.55, g), 37 * ss(1.95, 2.3, g), v][mi];
  RN.firstChild.textContent = num(val);
  if (RN.dataset.m !== mi + '') { RN.dataset.m = mi; RN.querySelector('small').textContent = RNT[mi][1]; if (mi < 3) RN.querySelector('p').textContent = RNT[mi][2]; }
  if (mi === 3) RN.querySelector('p').innerHTML = v > 600 ? `<span>${num(v - 533)}</span> из них ещё не подписаны` : 'пока только свои';
  return a;
}
/* ---------- 06 Отметки: вкладки профиля, сетка уезжает влево, со всех сторон слетаются посты гостей с отметкой ---------- */
function tags(n) {
  const g = n - GN[2], tb = $('#x3-tb'), tg = $('#x3-tg');
  if (g < 0 || g > 4.6) { vis(tb, 0); vis(tg, 0); return 0; }
  const ta = ss(.15, .5, g) * (1 - ss(4.25, 4.6, g)), sw = ss(.6, 1, g) * (1 - ss(3.9, 4.3, g)), W = 3 * G.ts + 2 * G.g + 60;
  vis(tb, ta); tb.style.setProperty('--t', sw.toFixed(3));
  $('#x3-tn').textContent = num(126 * ss(1, 3.6, g));
  vis(tg, 1 - ss(3.9, 4.3, g)); tg.style.transform = g > 3.9 ? `translateX(${(W * ss(3.9, 4.3, g)).toFixed(1)}px)` : '';
  UT.forEach((u, j) => {
    const t = ss(1 + j * .26, 1.5 + j * .26, g), e = 1 - (1 - t) ** 3, an = hash(j, 41) * 6.283, d = 520 + 260 * hash(j, 42);
    const x = +u.dataset.x + Math.cos(an) * d * (1 - e), y = +u.dataset.y + Math.sin(an) * d * .6 * (1 - e), r = (hash(j, 43) - .5) * 40 * (1 - e);
    u.style.opacity = ss(0, .25, t).toFixed(3); u.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg)`;
    u.classList.toggle('hit', t >= 1 && g < 3.9);
  });
  return sw;
}
/* ---------- 08 Отчёт: профиль притухает, на его месте статистика за три месяца: четыре цифры и линия подписчиков ---------- */
function report(n) {
  const g = n - GN[3], rp = $('#x3-rp');
  if (g < 0 || g > 4.6) { vis(rp, 0); return 0; }
  const a = ss(.1, .6, g) * (1 - ss(3.9, 4.4, g)), c = ss(.8, 2, g);
  vis(rp, a); rp.style.transform = `translateY(${((1 - ss(.1, .6, g)) * 18).toFixed(1)}px)`;
  KD.forEach(dd => { dd.textContent = num(+dd.dataset.v * c); });
  /* линия рисуется слева направо: её открывает прямоугольник-обрезка, на конце линии — точка */
  const p = ss(.8, 2.4, g), x = 600 * p, i = Math.min(11, Math.floor(p * 12)), f = p * 12 - i, y = lerp(WEEKS[i], WEEKS[i + 1], f);
  $('#x3-clip rect').setAttribute('width', x.toFixed(1)); const hd = $('#x3-rp .x3-hd2'), ch = $('#x3-rp .x3-ch');
  const cb = ch.getBoundingClientRect(), rb = rp.getBoundingClientRect();
  hd.style.left = (cb.left - rb.left + cb.width * x / 600).toFixed(1) + 'px'; hd.style.top = (cb.top - rb.top + cb.height * (160 - y / 5000 * 140) / 170).toFixed(1) + 'px'; hd.style.opacity = p > 0 && p < 1 ? 1 : 0;
  rp.style.setProperty('--mk', ss(2.3, 2.8, g).toFixed(3));
  return a;
}
/* Колесо: сначала пример, потом ручка. У края пример держит колесо ещё 0,45 секунды. Так же колесо держится перед уходом в сетку. */
function wheel(dy) {
  if (!X.on || !dy) return false;
  const now = performance.now(), ex = EXIT / TOTAL, du = dy / (100 * TOTAL);
  X.goal = null;
  if ((dy > 0 && X.u >= 1) || (dy < 0 && X.u <= 0)) return now - X.edge < 450;
  if (dy > 0 && X.u < ex && X.u + du >= ex) { X.u = ex; X.hold = now; return true; }
  if (dy > 0 && X.u === ex && now - X.hold < 450) return true;
  X.u = clamp(X.u + du);
  if (X.u >= 1 || X.u <= 0) X.edge = now;
  return true;
}
/* Щелчок по пустому месту: следующий отрезок рассказа */
function next() {
  if (!X.on) return;
  const n = STOPS.find(v => v > X.u + .005); if (n != null) { X.goal = n; X.auto = true; }
}
kl.addEventListener('click', e => { if (X.on && !e.target.closest('button,a,input,#air-foot,#dial,#x3-hd,#x3-cm,#x3-sd')) next(); });
/* На телефоне пример листается пальцем вверх и вниз */
let ty = null;
/* слой примера не ловит касания (pointer-events: none), поэтому палец ловим на всём экране «Клиентов», кроме кнопок, ссылок и шкалы */
kl.addEventListener('pointerdown', e => { if (X.on && e.pointerType === 'touch' && !e.target.closest('button,a,input,#dial,#air-foot')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) layout(); });
document.fonts?.load('500 100px Tektur').then(() => { if (X.on) layout(); }).catch(() => {});

/* «Подписаться»: окно примера и разговор про SMM */
const sd = $('#x3-sd');
let sdBack = null;
$('#x3-sub').addEventListener('click', e => { sdBack = e.currentTarget; sd.hidden = false; $('#x3-sd-x').focus(); });
$('#x3-sd-x').addEventListener('click', () => { sd.hidden = true; sdBack?.focus(); });
$('#x3-sd-go').addEventListener('click', () => { sd.hidden = true; api.onTalk?.(); });
sd.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); sd.hidden = true; sdBack?.focus(); } });

/* цвет станции для эфира: чёрный, как у «Сайта» и «Рекламы» */
/* Сетка-сонар (sonar.js): точки в серединах чёрточек пунктира у первых трёх рядов клеток. Четвёртый ряд уходит в тень, его клетки проявляются сами.
   Пунктир клетки: чёрточка 4 пикселя, промежуток 4, от начала каждой стороны (smm.css .x3-c). */
function dots() {
  /* только в начале: в уходе сетка встаёт из растра на своих местах */
  if (!X.on || X.uc * TOTAL > 3) return null;
  const k = kl.getBoundingClientRect(), T = [];
  CELLS.slice(0, 9).forEach(cl => {
    const r = cl.getBoundingClientRect(), x0 = r.left - k.left, y0 = r.top - k.top;
    for (let d = 2; d + 2 <= r.width; d += 8) T.push([x0 + d, y0 + .5, 1, 0, 1.5], [x0 + d, y0 + r.height - .5, 1, 0, 1.5]);
    for (let d = 2; d + 2 <= r.height; d += 8) T.push([x0 + .5, y0 + d, 0, 1, 1.5], [x0 + r.width - .5, y0 + d, 0, 1, 1.5]);
  });
  return T;
}
/* точки вытягиваются в чёрточки (g), чёрточки становятся пунктиром клеток: 1 пиксель цвета --line (th), потом отдаются клеткам (out) */
function trace(n) { return { g: ss(1, 1.4, n), th: ss(1.2, 1.7, n), w: 1, a: .122, out: ss(1.6, 1.9, n) }; }
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0], notch: TOTAL });
/* пример всегда на тёмном фоне, поэтому буквы сайта белые, пока пример включён.
   grid: 0 сетка на надписи, 1 сетки нет. В начале сетка слетается в клетки профиля, в уходе встаёт из растра. */
Object.defineProperties(api, {
  grid: { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } },
  trace: { get: () => X.on && X.uc * TOTAL < 3 ? X.tr : null },
  dark: { get: () => X.on }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on }) } });
return api;
})();
