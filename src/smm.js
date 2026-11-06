/* «SMM»: пример на станции SMM мира «Клиенты». Профиль кофейни ZERNO живёт три месяца, такой кофейни нет.
   Колесо двигает время аккаунта: день 1, неделя, месяц, три месяца. Новый пост встаёт в сетку первым и сдвигает остальные,
   как в профиле соцсети. Пост сначала появляется кругом сторис у аватара, потом становится квадратом.
   Через месяц под постами идёт разговор: гостья спрашивает, кофейня отвечает, гостья возвращается.
   Последние девять постов — серия: вместе они складываются в одну картину, чашку эспрессо ZERNO.
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
const num = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
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
/* Шкала примера в щелчках колеса. День 1 стоит до 3,2. Посты первого месяца выходят 3,6–9,1, разговор 9,6–13,2,
   серия 14,4–19,6, картина собирается 20,3–21,6 и стоит три щелчка, перед уходом пауза, уход квадратами 25,4–27,4. */
const TOTAL = 28, EXIT = 25.4, LAND = .5;
const STOPS = [0, 3.2, 9.4, 14, 20.2, 22.6, TOTAL].map(n => n / TOTAL);
const TIMES = [...EARLY.map((_, k) => 3.6 + k * .55), ...Array.from({ length: SER }, (_, k) => 14.4 + k * .58)];
/* Подписи по времени аккаунта */
const CAPS = [
  [0, 'День 1', 'Аккаунт есть. Постов нет, подписаны только свои.'],
  [3.4, 'Неделя', 'Пост или сторис каждый день. Видно, что вы открыты.'],
  [9.2, 'Месяц', 'Вам пишут, вы отвечаете. Гостья возвращается.'],
  [14.2, '3 месяца', 'Посты идут серией и складываются в один образ.'],
  [20.3, 'Образ', 'Один пост — квадрат. Сто постов — образ.']
];
/* Время аккаунта на шкале: 0 — день 1, 0,22 — неделя, 0,48 — месяц, 1 — три месяца. Счётчики выдуманы. */
const CLOCK = [[3.6, 0], [6, .22], [9.2, .48], [14.2, .5], [19.6, 1]];
const FANS = [[3.6, 14], [6, 61], [9.2, 540], [14.2, 810], [19.6, 4800]];

/* Разметка */
/* знак ZERNO: зерно разрезано буквой Z. Разрез — цвет фона под знаком (--zbg), знак стоит на красном. */
const MARK = '<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor"/><path d="M8 34H61L39 66H92" fill="none" style="stroke:var(--zbg,#df1f12)" stroke-width="8" stroke-miterlimit="10"/></g></svg>';
const ZIMG = 'assets/zerno/', GRID = 'assets/zerno/espresso-grid.webp';
const tile = (p, k) => p.f
  ? `<div class="x3-t ph${p.reel ? ' reel' : ''}" data-k="${k}"><img src="${ZIMG + p.f}.webp" alt="" decoding="async"><b>${p.h}</b><em>${p.s}</em></div>`
  : `<div class="x3-t tx${p.red ? ' red' : ''}" data-k="${k}"><b>${p.h}</b><em>${p.s}</em></div>`;
/* кусок картины: номер в серии и, у двух кусков, надпись, чтобы пост читался и сам по себе */
const piece = s => { const c = SER - 1 - s, ov = c === 0 ? '<b class="ov">ZERNO</b>' : c === 2 ? '<b class="ov r">Эспрессо<em>120 с</em></b>' : '';
  return `<div class="x3-t sr" data-k="${EARLY.length + s}" style="--bx:${(c % 3) * 50}%;--by:${(c / 3 | 0) * 50}%">${ov}<i class="no">${s + 1}/${SER}</i></div>`; };
const R = document.createElement('div');
R.id = 'x3'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример ведения соцсетей. Такой кофейни нет');
R.innerHTML = `
<div id="x3-bg" aria-hidden="true"></div>
<div id="x3-scene">
  <div class="x3-cap" id="x3-cap"><small>SMM · пример</small><h3 id="x3-h">День 1</h3><p id="x3-p">${CAPS[0][2]}</p>
    <div id="x3-ru" aria-hidden="true"><div class="tk"></div><i id="x3-nd"></i><span style="left:0">День 1</span><span style="left:22%">Неделя</span><span style="left:48%">Месяц</span><span style="left:100%">3 месяца</span></div>
  </div>
  <div id="x3-stage">
    <div id="x3-pf">
      <header id="x3-hd"><div id="x3-av"><i class="rg"></i><i class="lg">${MARK}</i></div>
        <div class="who"><b>zerno.kg</b><span>Кофе с доставкой · Бишкек</span></div>
        <button class="cta" type="button" id="x3-sub">Подписаться</button>
        <dl id="x3-ct"><div><dd id="x3-np">0</dd><dt>публикаций</dt></div><div><dd id="x3-nf">14</dd><dt>подписчиков</dt></div></dl></header>
      <div id="x3-gw"><div id="x3-grid">${Array.from({ length: 12 }, () => '<i class="x3-c"></i>').join('')}${EARLY.map(tile).join('')}${Array.from({ length: SER }, (_, s) => piece(s)).join('')}<div id="x3-big" aria-hidden="true"><b class="ov">ZERNO</b><b class="ov r">Эспрессо<em>120 с</em></b></div></div></div>
    </div>
    <div id="x3-cm" aria-live="polite">
      <div class="gp" id="x3-g1" data-c="2"><div class="bb q" id="x3-q1"><i class="av">А</i><div><b>aigerim_b</b><p>Есть овсяное молоко?</p></div></div>
        <div class="bb a" id="x3-a1"><i class="av z">${MARK}</i><div><b>zerno.kg <small>через 4 минуты</small></b><p><span class="dots"><i></i><i></i><i></i></span><span class="tx">Есть. Флэт уайт на овсяном — 230 с.</span></p></div></div></div>
      <div class="gp" id="x3-g2" data-c="8"><div class="bb q" id="x3-q2"><i class="av">А</i><div><b>aigerim_b <small class="vip">Постоянная гостья</small></b><p>Снова у вас. Флэт уайт на овсяном, как в прошлый раз.</p></div></div></div>
    </div>
  </div>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>
<div id="x3-sd" role="dialog" aria-modal="true" aria-labelledby="x3-sd-t" hidden><div class="bx"><small>Пример</small><h3 id="x3-sd-t">Здесь человек подпишется</h3><p>Реклама привела его один раз. Соцсети напоминают о&nbsp;вас, и&nbsp;он возвращается.</p><div class="bt"><button type="button" id="x3-sd-x">Понятно</button><button type="button" id="x3-sd-go">Обсудить SMM</button></div></div></div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
const TILES = $$('.x3-t'), CELLS = $$('.x3-c');
/* картина серии */
R.style.setProperty('--grid', `url("${GRID}")`);

/* Геометрия: сцена стоит между шапкой сайта и строкой над шкалой. Размер плитки зависит от высоты: видно три ряда и край четвёртого. */
const G = { W: 0, H: 0, wide: true, top: 0, bot: 0, ts: 100, g: 4, av: [0, 0, 56] };
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
  /* подпись: на границе отрезков старая гаснет, слова меняются, новая проявляется */
  let ci = 0; CAPS.forEach((cp, i) => { if (n >= cp[0]) ci = i; });
  const nb = CAPS.reduce((m, cp, i) => i ? Math.min(m, Math.abs(n - cp[0])) : m, 9);
  if (ci !== X.cap) { X.cap = ci; $('#x3-h').textContent = CAPS[ci][1]; $('#x3-p').textContent = CAPS[ci][2]; }
  const cap = $('#x3-cap'), ca = ss(.6, 1.6, n) * clamp(nb / .22);
  cap.style.opacity = ca; cap.style.transform = `translateY(${(1 - ss(.6, 1.6, n)) * 16}px)`;
  R.classList.toggle('fin', ci === CAPS.length - 1);
  /* шкала времени аккаунта */
  const k = pw(CLOCK, n); $('#x3-ru').style.setProperty('--k', k);
  $$('#x3-ru span').forEach((s, i) => s.classList.toggle('on', k >= [0, .22, .48, 1][i] - .005));

  /* посты: e — насколько пост долетел до первой клетки. Номер клетки поста — сколько постов вышло после него. */
  const E = TIMES.map(t => ss(t + LAND * .3, t + LAND, n)), P = TIMES.map(t => clamp((n - t) / LAND));
  const rv = ss(20.3, 21.6, n), g = lerp(G.g, 0, rv), ts = G.ts;
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
  $('#x3-av').style.setProperty('--ring', ring);
  /* клетки пустого профиля видны, пока их не заняли. В начале их пунктир собирает сетка-сонар и отдаёт им (X.tr.out). */
  const filled = tail;
  CELLS.forEach((cl, i) => { cl.style.opacity = (i < filled - .5 ? 0 : 1) * (1 - rv) * X.tr.out; });

  /* счётчики */
  const early = E.slice(0, EARLY.length).filter(v => v >= .5).length, ser = clamp((n - 14.4) / (TIMES[TIMES.length - 1] + LAND - 14.4));
  $('#x3-np').textContent = num(n < 14.4 ? early : EARLY.length + ser * (92 - EARLY.length));
  $('#x3-nf').textContent = num(pw(FANS, n));

  /* разговор под постами: вопрос, ответ кофейни через несколько минут, гостья возвращается */
  const cmA = 1 - ss(14.2, 14.6, n);
  const bub = (sel, a, b) => { const el = $(sel), k = ss(a, b, n); vis(el, k * cmA); el.style.transform = `translateY(${(1 - k) * 10}px)`; };
  bub('#x3-q1', 9.6, 10.2); bub('#x3-a1', 10.3, 10.8); bub('#x3-q2', 11.9, 12.5);
  /* на телефоне разговор стоит поверх сетки, второй вопрос сменяет первый */
  $('#x3-g1').style.opacity = G.wide ? '' : 1 - ss(11.5, 11.9, n);
  $('#x3-g1').style.setProperty('--ln', ss(9.6, 10.2, n) * cmA); $('#x3-g2').style.setProperty('--ln', ss(11.9, 12.5, n) * cmA);
  const typed = ss(10.9, 11.2, n); $('#x3-a1').style.setProperty('--typed', typed);
  $('#x3-q2').classList.toggle('vip', n > 12.6);
  /* пост, под которым идёт разговор, подсвечен */
  TILES.forEach(t => t.classList.remove('hot'));
  if (cmA > 0 && n > 9.6 && n < 14.2) TILES[EARLY.length - 1 - (n > 11.9 ? 8 : 2)].classList.add('hot');

  /* сборка картины: щели закрываются, шапка профиля и номера серии гаснут, картина чуть растёт */
  R.style.setProperty('--rv', rv); $('#x3-big').style.opacity = ss(.55, 1, rv);
  const hd = $('#x3-hd'); hd.style.opacity = 1 - rv;
  $('#x3-grid').style.transform = rv > 0 ? `translateY(${-rv * G.hh * .5}px) scale(${1 + rv * .1})` : '';
  $('#x3-stage').style.transform = `translateY(${(1 - ss(.2, 1.4, n)) * 30}px)`;
  $('#x3-scene .tag').style.opacity = .5 * ss(1, 2, n);
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
R.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.target.closest('button,a')) ty = e.clientY; });
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
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0] });
/* пример всегда на тёмном фоне, поэтому буквы сайта белые, пока пример включён.
   grid: 0 сетка на надписи, 1 сетки нет. В начале сетка слетается в клетки профиля, в уходе встаёт из растра. */
Object.defineProperties(api, {
  grid: { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } },
  trace: { get: () => X.on && X.uc * TOTAL < 3 ? X.tr : null },
  dark: { get: () => X.on }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on }) } });
return api;
})();
