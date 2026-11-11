/* «Бренд»: пример на станции «Бренд» мира «Клиенты». Колесо листает брендбук кофейни ZERNO, такой кофейни нет.
   Знак-зерно чертится на сетке, заливается красным, красный заливает экран и делится на палитру,
   рядом со знаком из квадратов собирается слово ZERNO, потом правила, потом знак встаёт на вещи.
   В конце мелькает только кусок знака из нескольких квадратов, и его узнают. Потом надпись станции возвращается.
   Образцы: брендбук NASA 1975, Dropbox Brand, Red Roaster Coffee (Pop & Pac), McDonald's «Guess who's back».
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. Разметку модуль строит сам. */
window.GTBRD = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
const api = { onTalk: null };

/* Цвета и знак ZERNO. Знак — зерно 7 : 10 под углом 24°, разрезанное буквой Z: бороздка зерна и есть первая буква ZERNO.
   Те же числа, что в значке рекламного поста и аватара: там знак нарисован в квадрате 100 × 100, зерно 31 × 44, разрез толщиной 8.
   Лист брендбука рисуется в тысячных долях своей стороны. */
const RED = '#df1f12', WHITE = '#fff', INK = 'rgba(255,255,255,.62)', FAINT = 'rgba(255,255,255,.08)', MONO = '"JetBrains Mono",monospace', WORD = 'Tektur,Montserrat,sans-serif';
const AZ = 24 * Math.PI / 180, K = 300 / 44, RX = 31 * K, RY = 300, GAP = 8 * K;
/* средняя линия разреза Z в осях зерна и сам разрез: эта линия толщиной GAP с острыми углами */
const ZL = [[-42, -16], [11, -16], [-11, 16], [42, 16]].map(([x, y]) => [x * K, y * K]);
const ZP = thick(ZL, GAP / 2);
function thick(P, w) {
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
  const L = [], Q = [];
  P.forEach((p, i) => {
    let m;
    if (i === 0) m = nrm(P[0], P[1]); else if (i === P.length - 1) m = nrm(P[i - 1], P[i]);
    else { const a = nrm(P[i - 1], P[i]), b = nrm(P[i], P[i + 1]), s = [a[0] + b[0], a[1] + b[1]], l = Math.hypot(...s), u = [s[0] / l, s[1] / l], d = 1 / (u[0] * a[0] + u[1] * a[1]); m = [u[0] * d, u[1] * d]; }
    L.push([p[0] + m[0] * w, p[1] + m[1] * w]); Q.push([p[0] - m[0] * w, p[1] - m[1] * w]);
  });
  return [...L, ...Q.reverse()];
}
/* точка зерна в осях листа: поворот на 24° и середина в (cx, cy) */
const rot = ([x, y], cx = 500, cy = 500, sc = 1) => [cx + (x * Math.cos(AZ) - y * Math.sin(AZ)) * sc, cy + (x * Math.sin(AZ) + y * Math.cos(AZ)) * sc];
/* габарит повёрнутого зерна */
const BW = 2 * Math.hypot(RX * Math.cos(AZ), RY * Math.sin(AZ)), BH = 2 * Math.hypot(RX * Math.sin(AZ), RY * Math.cos(AZ));
const PAL = [['Красный зерна', '#DF1F12', '223 · 31 · 18'], ['Тёмная обжарка', '#19181D', '25 · 24 · 29'], ['Оранжевый', '#FF5A1A', '255 · 90 · 26'], ['Крема', '#FFB03A', '255 · 176 · 58']];
/* Шкала примера в щелчках колеса. Знак чертится 1–4,4 и стоит до 4,8, заливка и размеры 5–6,6, цвет 7,6–11,4, буквы 12,6–14,4,
   правила 15,4–18, носители 19–22,8, проверка 24,4–27,2 и стоит три щелчка, перед уходом пауза, уход квадратами 30,6–32,6. */
/* Новые главы встают в паузы старой шкалы: пока идёт пауза, старый рассказ стоит на месте (m не растёт), а на листе идёт новая глава.
   n — настоящее положение в щелчках, m — положение на старой шкале. Паузы: Идея и Имя после того, как сетка-сонар села в узлы листа (m 1),
   Голос после букв (m 15,5), Брендбук после проверки (m 27,6). */
const GAPS = [[1, 7.4], [15.5, 3.7], [27.6, 5.2]];
const G1 = 1, G2 = 22.9, G3 = 38.7;
function remap(n) { let m = n; for (const [at, len] of GAPS) { if (m <= at) return m; if (m < at + len) return at; m -= len; } return m; }
/* «Бренд» кончается закрытой книгой на столе: щелчок паузы, потом книга распадается растром на точки сетки станции */
const TOTAL = 47.2, EXIT = 44.6, GO = 45.5;
const STOPS = [0, 4, 8.2, 12.2, 14.6, 19.4, 22.4, 26.3, 29.7, 34.5, 35.7, 37.4, 38.7, 43.4, TOTAL].map(n => n / TOTAL);
const CAPS = [
  [0, '01 · Идея', 'Идея', 'Суть, характер и обещание. Из этого вырастает всё остальное.'],
  [4.5, '02 · Имя', 'Имя', 'Коротко, звонко, читается на двух языках, и адрес свободен.'],
  [8.4, '03 · Знак', 'Знак', 'Зерно разрезано буквой Z. Каждая линия стоит на своём месте.'],
  [14.8, '04 · Цвет', 'Цвет', 'Красный ZERNO видно с другой стороны улицы.'],
  [19.6, '05 · Буквы', 'Буквы', 'Слово собрано из тех же квадратов, что и сайт кофейни.'],
  [22.9, '06 · Голос', 'Голос', 'Как бренд говорит с людьми: коротко, тепло и по делу.'],
  [26.6, '07 · Правила', 'Правила', 'Где знак кончается, каким он бывает самым маленьким и как его нельзя менять.'],
  [29.9, '08 · Носители', 'Везде', 'Один знак на стакане, пакете, в рекламе, на сайте и в профиле.'],
  [34.9, '09 · Проверка', 'Узнали?', 'Здесь только краешек.'],
  [37, '09 · Проверка', 'ZERNO', 'Узнают краем глаза, даже среди чужих стаканов.'],
  [38.9, '10 · Брендбук', 'Брендбук', 'Всё, что вы увидели, — в одной книге. По ней любой подрядчик сделает стакан или вывеску одинаково.']
];

const R = document.createElement('div');
R.id = 'x4'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример брендбука. Такой кофейни нет');
R.innerHTML = `
<div id="x4-bg" aria-hidden="true"></div>
<div id="x4-flood" aria-hidden="true"></div>
<div id="x4-scene">
  <div class="x4-cap" id="x4-cap"><small id="x4-n">${CAPS[0][1]}</small><h3 id="x4-h">${CAPS[0][2]}</h3><p id="x4-p">${CAPS[0][3]}</p></div>
  <div id="x4-stage"><div id="x4-sheet">
    <canvas id="x4-cv" aria-hidden="true"></canvas>
    <div id="x4-pal" aria-hidden="true">${PAL.map(([nm, hx, rgb]) => `<div class="ch"><i class="sw" style="background:${hx}"></i><b>${nm}</b><span>${hx}</span><span>${rgb}</span></div>`).join('')}</div>
    <span class="pg" id="x4-pg">ZERNO · брендбук · 01</span>
    <button type="button" id="x4-get">Брендбук · PDF</button>
  </div><div id="x4-b3" aria-hidden="true"></div></div>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>
<div id="x4-sd" role="dialog" aria-modal="true" aria-labelledby="x4-sd-t" hidden><div class="bx"><small>Пример</small><h3 id="x4-sd-t">Здесь заказчик получит брендбук</h3><p>Идея, имя, знак, цвета, буквы, голос, правила и&nbsp;носители в&nbsp;одном файле. По&nbsp;нему любой подрядчик сделает стакан или вывеску одинаково.</p><div class="bt"><button type="button" id="x4-sd-x">Понятно</button><button type="button" id="x4-sd-go">Обсудить бренд</button></div></div></div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
const cv = $('#x4-cv'), ctx = cv.getContext('2d'), CHIPS = $$('#x4-pal .ch');

/* Слово из квадратов: буквы режутся на квадраты, при сборке квадраты слетаются на места. Как буквы сайта кофейни в «Рекламе». */
class Pix {
  constructor(text) { this.text = text; this.src = document.createElement('canvas'); this.cells = []; this.h = 0; }
  fit(h) {
    h = Math.max(8, Math.round(h)); if (h === this.h) return; this.h = h;
    const s = this.src.getContext('2d', { willReadFrequently: true });
    s.font = `500 ${h}px ${WORD}`; let m = s.measureText(this.text);
    const fs = h * h / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
    s.font = `500 ${fs}px ${WORD}`; m = s.measureText(this.text);
    const asc = m.actualBoundingBoxAscent, w = Math.ceil(m.width) + 4, hh = Math.ceil(asc + m.actualBoundingBoxDescent) + 4;
    this.src.width = w; this.src.height = hh;
    s.font = `500 ${fs}px ${WORD}`; s.fillStyle = '#fff'; s.fillText(this.text, 2, 2 + asc);
    const b = this.b = Math.max(4, Math.round(h / 12)), data = s.getImageData(0, 0, w, hh).data; this.cells = [];
    for (let j = 0; j * b < hh; j++) for (let i = 0; i * b < w; i++) {
      let on = false;
      for (let y = j * b; y < Math.min(hh, (j + 1) * b) && !on; y += 2) for (let x = i * b; x < Math.min(w, (i + 1) * b) && !on; x += 2) if (data[(y * w + x) * 4 + 3] > 8) on = true;
      if (on) this.cells.push({ i, j, rx: hash(i + j * 31, 3) * 2 - 1, ry: hash(i * 7 + j, 5) * 2 - 1, rd: hash(i + j * 13, 9) });
    }
    this.w = w; this.hh = hh;
  }
  /* x, y — левый верх слова в пикселях холста, k от 0 (разлетелось) до 1 (собрано) */
  draw(c, x, y, k) {
    /* квадраты стоят на целых пикселях, иначе между ними видны швы */
    const b = this.b; x = Math.round(x); y = Math.round(y);
    for (const q of this.cells) {
      const t = ss(0, 1, k * 1.5 - q.rd * .5); if (t <= .01) continue;
      c.globalAlpha = t;
      c.drawImage(this.src, q.i * b, q.j * b, b, b, x + q.i * b + Math.round(q.rx * (1 - t) * this.w * .35), y + q.j * b + Math.round(q.ry * (1 - t) * this.hh * 1.4), b, b);
    }
    c.globalAlpha = 1;
  }
}
const ZW = new Pix('ZERNO');

/* Геометрия: сцена стоит между шапкой сайта и строкой над шкалой. Лист брендбука квадратный. */
const G = { W: 0, H: 0, wide: true, top: 0, bot: 0, S: 400, U: 1, mx: 0, my: 0, chip: [0, 0, 0, 0] };
function layout() {
  const foot = document.getElementById('air-foot'), bar = document.getElementById('bar'), kr = kl.getBoundingClientRect();
  G.W = innerWidth; G.H = Math.max(240, kr.height || innerHeight); G.wide = G.W > 760;
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom : 56); G.bot = foot.getBoundingClientRect().top - kr.top;
  R.style.setProperty('--top', G.top + 'px'); R.style.setProperty('--bot', Math.max(0, G.H - G.bot) + 'px');
  const st = $('#x4-stage'), cs = getComputedStyle(st), sh0 = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const S = Math.floor(Math.max(160, Math.min(st.clientWidth, sh0, 760)));
  G.S = S; R.style.setProperty('--s', S + 'px');
  const d = dpr(); cv.width = cv.height = Math.round(S * d); G.U = S * d / 1000;
  /* середина знака на экране: оттуда красный заливает экран. Красная плашка палитры: туда красный сжимается. */
  const rr = R.getBoundingClientRect(), sh = $('#x4-sheet').getBoundingClientRect(), sw = CHIPS[0].querySelector('.sw').getBoundingClientRect();
  G.mx = sh.left - rr.left + S / 2; G.my = sh.top - rr.top + S / 2;
  G.chip = [sw.top - rr.top, rr.right - sw.right, rr.bottom - sw.bottom, sw.left - rr.left];
  ZW.h = 0; X.key = ''; BOOK.ready = false; fxFit();
}

/* ---------- рисование листа ---------- */
/* знак: зерно, разрезанное буквой Z. Разрез настоящий: через него виден фон под знаком. col — цвет зерна, по умолчанию красный */
function mark(c, cx, cy, sc, a, col = RED) {
  if (a <= .004) return;
  c.save(); c.globalAlpha = a; c.fillStyle = col; c.translate(cx, cy); c.rotate(AZ); c.scale(sc, sc);
  c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, Math.PI * 2); c.clip();
  c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, Math.PI * 2); c.moveTo(...ZP[0]); ZP.slice(1).forEach(p => c.lineTo(...p)); c.closePath();
  c.fill('evenodd'); c.restore();
}
/* логотип: знак и слово. x, y — левый верх, h — высота знака. Возвращает ширину. */
function lockup(c, x, y, h, a, col = RED, wcol = '#fff') {
  const sc = h / BH, mw = BW * sc, cap = h * .62;
  mark(c, x + mw / 2, y + h / 2, sc, a, col);
  c.globalAlpha = a; c.fillStyle = wcol; c.font = `500 ${cap * 1.36}px ${WORD}`; c.textBaseline = 'alphabetic';
  c.fillText('ZERNO', x + mw + h * .18, y + h / 2 + cap / 2);
  c.globalAlpha = 1;
  return mw + h * .18 + c.measureText('ZERNO').width;
}
function label(c, t, x, y, a, size = 22, col = INK, al = 'left') {
  if (a <= .004) return;
  c.globalAlpha = a; c.fillStyle = col; c.font = `400 ${size}px ${MONO}`; c.textAlign = al; c.textBaseline = 'alphabetic'; c.fillText(t, x, y); c.textAlign = 'left'; c.globalAlpha = 1;
}
function node(c, x, y, a, round) {
  if (a <= .004) return;
  c.globalAlpha = a; c.fillStyle = '#0b0b0e'; c.strokeStyle = '#ff9a6a'; c.lineWidth = 2.5;
  c.beginPath(); if (round) c.arc(x, y, 7, 0, Math.PI * 2); else c.rect(x - 7, y - 7, 14, 14); c.fill(); c.stroke(); c.globalAlpha = 1;
}
function line(c, x0, y0, x1, y1, k, a, col = INK, w = 2) {
  if (a <= .004 || k <= 0) return;
  c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); c.stroke(); c.globalAlpha = 1;
}

/* Точки в узлах листа 19 × 19 такого же размера и такой же яркости, как севшие точки сетки-сонара (sonar.js).
   Лист в начале ещё проявляется, поэтому яркость делится на его прозрачность: на экране она равна яркости точек сонара. */
const dotR = () => (window.GTSONAR ? 1.4 : 2) * 1000 / G.S;
function nodes(c, r) { for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) { c.moveTo(i * 50 + r, j * 50); c.arc(i * 50, j * 50, r, 0, Math.PI * 2); } }
/* DOTK: точки в узлах гаснут на время «Идеи» и «Имени» (лист чистый) и возвращаются перед «Знаком» */
let DOTK = 1;
function matrix(c, n, a) {
  a *= DOTK;
  if (a <= .004) return;
  c.globalAlpha = Math.min(1, a * (window.GTSONAR ? GTSONAR.MV.land : .7) / Math.max(.2, ss(.2, 1.2, n))); c.fillStyle = '#fff';
  c.beginPath(); nodes(c, dotR()); c.fill(); c.globalAlpha = 1;
}
/* 1–2. Знак на сетке: сетка, оси, окружности, контур зерна, средняя линия разреза Z с узлами, края разреза, потом заливка и размеры */
function drawSign(c, n) {
  const fade = 1 - ss(7.6, 8.1, n), cons = ss(1, 1.6, n) * lerp(1, .25, ss(5, 6, n)) * fade;
  /* Точки в узлах листа: в них села сетка-сонар. Они проявляются, пока точки сонара тают у цели. */
  matrix(c, n, ss(.87, 1, n) * (1 - ss(1.7, 2.4, n)));
  if (cons > .004) {
    /* Линии сетки растут из узлов: от каждого узла к соседям, встречаются посередине. У края листа линия идёт от узла до края. */
    const g = ss(1, 1.8, n);
    if (g > 0) {
      c.globalAlpha = cons * .9; c.strokeStyle = FAINT; c.lineWidth = 1.5; c.beginPath();
      for (let i = 1; i < 20; i++) for (let j = 0; j < 20; j++) {
        const a = j * 50, b = a + 50, x = i * 50, fa = (j < 19 ? 25 : 50) * g, fb = (j > 0 ? 25 : 50) * g;
        if (j > 0) { c.moveTo(x, a); c.lineTo(x, a + fa); c.moveTo(a, x); c.lineTo(a + fa, x); }
        if (j < 19) { c.moveTo(x, b); c.lineTo(x, b - fb); c.moveTo(b, x); c.lineTo(b - fb, x); }
      }
      c.stroke(); c.globalAlpha = 1;
    }
    const ax = ss(1.6, 2.4, n), ma = [-Math.sin(AZ), Math.cos(AZ)], mi = [Math.cos(AZ), Math.sin(AZ)];
    for (const [v, r] of [[ma, 420], [mi, 330]]) {
      line(c, 500, 500, 500 + v[0] * r, 500 + v[1] * r, ax, cons); line(c, 500, 500, 500 - v[0] * r, 500 - v[1] * r, ax, cons);
    }
    const ci = ss(2.2, 3.2, n);
    if (ci > 0) { c.globalAlpha = cons * .8; c.strokeStyle = INK; c.lineWidth = 1.5; c.setLineDash([8, 10]); for (const r of [RY, RX]) { c.beginPath(); c.arc(500, 500, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ci); c.stroke(); } c.setLineDash([]); c.globalAlpha = 1; }
    const el = ss(2.8, 3.8, n);
    if (el > 0) { c.globalAlpha = cons; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(500, 500, RX, RY, AZ, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * el); c.stroke(); c.globalAlpha = 1; }
    /* средняя линия Z чертится по длине, узлы встают в её изломах */
    const zr = ss(3.4, 4.4, n), zp = ZL.map(p => rot(p));
    if (zr > 0) {
      const seg = zp.slice(1).map((p, i) => Math.hypot(p[0] - zp[i][0], p[1] - zp[i][1])), tot = seg.reduce((a, b) => a + b, 0);
      let left = zr * tot;
      c.globalAlpha = cons; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(...zp[0]);
      for (let i = 0; i < seg.length && left > 0; i++) { const k = Math.min(1, left / seg[i]); c.lineTo(lerp(zp[i][0], zp[i + 1][0], k), lerp(zp[i][1], zp[i + 1][1], k)); left -= seg[i]; }
      c.stroke(); c.globalAlpha = 1;
      zp.forEach((p, i) => node(c, ...p, cons * ss(i / 4, i / 4 + .25, zr), i === 1 || i === 2));
      /* края разреза: толщина Z */
      const ed = ss(4, 4.6, n);
      if (ed > 0) { c.globalAlpha = cons * ed; c.strokeStyle = '#ff9a6a'; c.lineWidth = 1.5; c.setLineDash([6, 8]); c.beginPath(); ZP.map(p => rot(p)).forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    }
    /* узлы на концах осей */
    for (const [v, r] of [[ma, RY], [mi, RX]]) for (const sg of [1, -1]) node(c, 500 + sg * v[0] * r, 500 + sg * v[1] * r, cons * ss(2.8, 3.4, n));
    node(c, 500, 500, cons * ss(1.6, 2, n), true);
  }
  mark(c, 500, 500, 1, ss(5, 6, n) * fade);
  /* размеры: угол 24° от вертикали и пропорция зерна. Подписи стоят за краем зерна, на тёмном. */
  const sp = ss(5.6, 6.6, n) * (1 - ss(7.3, 7.7, n));
  if (sp > .004) {
    c.globalAlpha = sp; c.strokeStyle = '#ff9a6a'; c.lineWidth = 2; c.setLineDash([6, 8]);
    c.beginPath(); c.moveTo(500, 140); c.lineTo(500, 70); c.stroke(); c.setLineDash([]);
    const ma = [Math.sin(AZ), -Math.cos(AZ)];
    c.beginPath(); c.moveTo(500 + ma[0] * 320, 500 + ma[1] * 320); c.lineTo(500 + ma[0] * 430, 500 + ma[1] * 430); c.stroke();
    c.beginPath(); c.arc(500, 500, 380, -Math.PI / 2, -Math.PI / 2 + AZ); c.stroke(); c.globalAlpha = 1;
    const mid = -Math.PI / 2 + AZ / 2;
    label(c, '24°', 500 + Math.cos(mid) * 410, 500 + Math.sin(mid) * 410, sp, 30, '#ffb08a', 'center');
    label(c, '10', 500 + ma[0] * 300 + 34, 500 + ma[1] * 300 + 24, sp, 28, '#ffb08a');
    label(c, '7', 500 + Math.cos(AZ) * RX + 30, 500 + Math.sin(AZ) * RX + 40, sp, 28, '#ffb08a');
    label(c, 'зерно 7 : 10 · наклон 24° · разрез — буква Z', 40, 960, sp, 22);
  }
}
/* 4. Логотип: знак и слово из квадратов */
function drawWord(c, n) {
  const a = ss(12.6, 13.2, n) * (1 - ss(15.1, 15.5, n));
  if (a <= .004) return;
  /* ширина слова зависит от шрифта, поэтому логотип подгоняется под лист по настоящей ширине и стоит посередине */
  const U = G.U; let h = 240; ZW.fit(h * .62 * U);
  let tot = BW * h / BH + h * .18 + ZW.w / U;
  if (tot > 840) { h *= 840 / tot; ZW.fit(h * .62 * U); tot = BW * h / BH + h * .18 + ZW.w / U; }
  const sc = h / BH, mw = BW * sc, cap = h * .62, x0 = (1000 - tot) / 2;
  mark(c, x0 + mw / 2, 500, sc * lerp(.85, 1, ss(12.6, 13.4, n)), a);
  /* слово рисуется в пикселях холста: квадраты должны совпасть с пикселями */
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a;
  ZW.draw(c, (x0 + mw + h * .18) * U, (500 - cap / 2) * U - 2, ss(13.2, 14.4, n)); c.restore();
  label(c, 'логотип · знак и слово стоят вместе', 40, 960, a * ss(13.8, 14.4, n), 22);
}
/* 5. Правила: поле вокруг знака, самый маленький размер, как нельзя */
function drawRules(c, n) {
  const out = 1 - ss(18.8, 19.2, n), r1 = ss(15.4, 16, n) * out, r2 = ss(16.2, 16.8, n) * out, r3 = ss(17, 17.6, n) * out;
  if (r1 > .004) {
    label(c, 'поле вокруг знака', 40, 60, r1);
    const h = 110, w = lockup(c, -9999, 0, h, 0), x = 500 - w / 2, y = 200 - h / 2, m = BW * (h / BH) * .5;
    lockup(c, x, y, h, r1);
    c.globalAlpha = r1; c.strokeStyle = '#ff9a6a'; c.lineWidth = 2; c.setLineDash([8, 8]); c.strokeRect(x - m, y - m, w + 2 * m, h + 2 * m); c.setLineDash([]); c.globalAlpha = 1;
    label(c, 'x', x - m / 2, y + h / 2 + 8, r1, 24, '#ffb08a', 'center'); label(c, 'x', x + w + m / 2, y + h / 2 + 8, r1, 24, '#ffb08a', 'center');
    label(c, 'x — ширина зерна', 40, 330, r1, 20);
  }
  if (r2 > .004) {
    label(c, 'самый маленький размер', 40, 400, r2);
    let x = 40;
    for (const [h, t] of [[96, '48 px'], [64, '32 px'], [40, '24 px · минимум']]) { const w = lockup(c, x, 530 - h / 2, h, r2); label(c, t, x, 640, r2, 20); x += w + 60; }
  }
  if (r3 > .004) {
    label(c, 'нельзя', 40, 730, r3);
    const k = ss(17.4, 18, n), cells = [[40, 'растянуть'], [360, 'перекрасить'], [680, 'повернуть']];
    cells.forEach(([x, t], i) => {
      const lh = 54, lw = lockup(c, -9999, 0, lh, 0);
      c.save(); c.translate(x + 140, 840);
      if (i === 0) c.scale(1.3, .72);
      if (i === 2) c.rotate(-.35);
      lockup(c, -lw / 2, -lh / 2, lh, r3, i === 1 ? '#2d6cdf' : RED, i === 1 ? '#2d6cdf' : '#fff');
      c.restore();
      line(c, x + 10, 780, x + 270, 900, k, r3, RED, 4); line(c, x + 270, 780, x + 10, 900, k, r3, RED, 4);
      label(c, t, x, 960, r3, 20);
    });
  }
}
/* 6. Носители: вещи нарисованы в линиях, знак встаёт на каждую */
const CARRY = [
  ['стакан', (c, x, y, w, h, b) => {
    c.beginPath(); c.moveTo(x + w * .19, y + h * .16); c.lineTo(x + w * .81, y + h * .16); c.lineTo(x + w * .73, y + h * .82); c.lineTo(x + w * .27, y + h * .82); c.closePath();
    c.rect(x + w * .15, y + h * .1, w * .7, h * .06); c.moveTo(x + w * .22, y + h * .36); c.lineTo(x + w * .78, y + h * .36); c.moveTo(x + w * .245, y + h * .6); c.lineTo(x + w * .755, y + h * .6); return () => mark(c, x + w / 2, y + h * .48, h * .2 / BH, b); }],
  ['пакет доставки', (c, x, y, w, h, b) => {
    c.rect(x + w * .14, y + h * .26, w * .72, h * .56); c.moveTo(x + w * .14, y + h * .34); c.lineTo(x + w * .86, y + h * .34);
    c.moveTo(x + w * .36, y + h * .26); c.bezierCurveTo(x + w * .36, y + h * .08, x + w * .64, y + h * .08, x + w * .64, y + h * .26); return () => lockup(c, x + w * .22, y + h * .5, h * .1, b); }],
  ['коробка', (c, x, y, w, h, b) => {
    c.rect(x + w * .1, y + h * .38, w * .62, h * .44); c.moveTo(x + w * .1, y + h * .38); c.lineTo(x + w * .28, y + h * .24); c.lineTo(x + w * .9, y + h * .24); c.lineTo(x + w * .72, y + h * .38);
    c.moveTo(x + w * .9, y + h * .24); c.lineTo(x + w * .9, y + h * .68); c.lineTo(x + w * .72, y + h * .82);
    return () => { c.globalAlpha = b; c.fillStyle = RED; c.beginPath(); c.arc(x + w * .41, y + h * .6, h * .12, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; mark(c, x + w * .41, y + h * .6, h * .15 / BH, b, WHITE); }; }],
  ['рекламный пост', (c, x, y, w, h, b) => {
    c.rect(x + w * .12, y + h * .12, w * .76, h * .7); c.moveTo(x + w * .12, y + h * .24); c.lineTo(x + w * .88, y + h * .24);
    c.moveTo(x + w * .3 + 14, y + h * .18); c.arc(x + w * .3, y + h * .18, 14, 0, Math.PI * 2); c.moveTo(x + w * .4, y + h * .18); c.lineTo(x + w * .7, y + h * .18);
    return () => { c.globalAlpha = b; c.fillStyle = RED; c.fillRect(x + w * .12, y + h * .24, w * .76, h * .5); c.globalAlpha = 1; mark(c, x + w / 2, y + h * .49, h * .3 / BH, b, WHITE); }; }],
  ['шапка сайта', (c, x, y, w, h, b) => {
    c.rect(x + w * .06, y + h * .2, w * .88, h * .6); c.moveTo(x + w * .06, y + h * .3); c.lineTo(x + w * .94, y + h * .3);
    for (let i = 0; i < 3; i++) { c.moveTo(x + w * (.11 + i * .05) + 6, y + h * .25); c.arc(x + w * (.11 + i * .05), y + h * .25, 6, 0, Math.PI * 2); }
    c.moveTo(x + w * .12, y + h * .62); c.lineTo(x + w * .7, y + h * .62); c.moveTo(x + w * .12, y + h * .7); c.lineTo(x + w * .5, y + h * .7);
    return () => lockup(c, x + w * .12, y + h * .36, h * .1, b); }],
  ['аватар профиля', (c, x, y, w, h, b) => {
    c.moveTo(x + w / 2 + w * .3, y + h * .47); c.arc(x + w / 2, y + h * .47, w * .3, 0, Math.PI * 2);
    return () => { c.globalAlpha = b; c.fillStyle = RED; c.beginPath(); c.arc(x + w / 2, y + h * .47, w * .26, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; mark(c, x + w / 2, y + h * .47, w * .3 / BH, b, WHITE); }; }]
];
function drawCarry(c, n) {
  const out = 1 - ss(23.8, 24.3, n);
  if (out <= .004 || n < 18.9) return;
  CARRY.forEach(([t, f], k) => {
    const t0 = 19 + k * .6, a = ss(t0, t0 + .45, n) * out, b = ss(t0 + .35, t0 + .8, n) * out;
    if (a <= .004) return;
    const x = 30 + (k % 3) * 320, y = 40 + Math.floor(k / 3) * 470, w = 300, h = 400;
    /* вещь проступает сверху вниз, как чертёж, потом на неё встаёт знак */
    c.save(); c.beginPath(); c.rect(x - 10, y - 10, w + 20, (h + 20) * a); c.clip();
    c.globalAlpha = out; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); const brand = f(c, x, y, w, h, b); c.stroke(); c.globalAlpha = 1; c.restore();
    brand();
    label(c, t, x + w / 2, y + h + 34, a, 21, INK, 'center');
  });
}
/* значок ZERNO: красный квадрат с белым зерном. Это страница «Проверка» в книге брендбука */
function icon(c, x, y, s, a) {
  if (a <= .004) return;
  c.globalAlpha = a; c.fillStyle = RED; c.fillRect(x, y, s, s); c.globalAlpha = 1;
  mark(c, x + s / 2, y + s / 2, s * .74 / BH, a, WHITE);
}
/* ---------- 01 Идея: платформа бренда ---------- */
const TXT = 'Montserrat,sans-serif';
function typed(c, t, x, y, k) { const m = Math.round(t.length * clamp(k)); c.fillText(t.slice(0, m), x, y); return m; }
function drawIdea(c, n) {
  const g = n - G1, a = ss(.1, .5, g) * (1 - ss(3.4, 3.9, g));
  if (a <= .004) return;
  label(c, 'платформа бренда', 40, 60, a);
  /* суть печатается, главное слово — красное */
  const k = ss(.3, 1.7, g), L = [['Кофе, который', WHITE], ['успевает', RED], ['за вами.', WHITE]];
  c.globalAlpha = a; c.font = `500 104px ${WORD}`; c.textBaseline = 'alphabetic';
  let left = k * L.reduce((p, q) => p + q[0].length, 0);
  L.forEach(([t, col], i) => { c.fillStyle = col; const part = clamp(left / t.length); typed(c, t, 40, 250 + i * 118, part); left -= t.length; });
  /* три слова характера */
  const W3 = [['01', 'быстрый', '20 минут или быстрее'], ['02', 'тёплый', 'привезём горячим'], ['03', 'точный', 'минута в минуту']];
  W3.forEach(([nm, w, d], i) => {
    const q = ss(1.8 + i * .35, 2.3 + i * .35, g) * a; if (q <= .004) return;
    const x = 40 + i * 320, y = 690 + (1 - q) * 20;
    c.globalAlpha = q; c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 40); c.lineTo(x + 290, y - 40); c.stroke();
    label(c, nm, x, y, q, 22, '#ff9a6a');
    c.globalAlpha = q; c.fillStyle = WHITE; c.font = `500 46px ${WORD}`; c.fillText(w.toUpperCase(), x, y + 62);
    c.fillStyle = INK; c.font = `500 25px ${TXT}`; c.fillText(d, x, y + 104);
  });
  label(c, 'суть · характер · обещание', 40, 960, a * ss(2.6, 3, g), 22);
  c.globalAlpha = 1;
}
/* ---------- 02 Имя: табло с перекидными буквами ---------- */
const CAND = [['АРОМА', 'как у всех'], ['БОДРО', 'не про кофе'], ['КОФЕИН', 'длинно'], ['ГРАНД', 'адрес занят'], ['ZERNO', 'zerno.kg — свободен']];
const FLAP = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯZRNOE0123456789';
function drawName(c, n) {
  const h = n - G1 - 3.6, a = ss(0, .4, h) * (1 - ss(3.3, 3.9, h));
  if (a <= .004) return;
  label(c, 'нейминг', 40, 60, a);
  const N = 6, cw = 130, chh = 176, gp = 12, x0 = (1000 - (N * cw + (N - 1) * gp)) / 2, y0 = 300, p = 4.4 * ss(.5, 2.7, h);
  for (let j = 0; j < N; j++) {
    const loc = p - j * .06, idx = clamp(Math.floor(loc), 0, 4), fr = loc - Math.floor(loc), final = loc >= 4;
    const flipping = !final && loc > 0 && fr < .32;
    const x = x0 + j * (cw + gp);
    c.globalAlpha = a; c.fillStyle = '#17171c'; c.fillRect(x, y0, cw, chh);
    c.fillStyle = '#0b0b0e'; c.fillRect(x, y0 + chh / 2 - 2, cw, 4);
    let ch = (CAND[idx][0].padEnd(N, ' ')[j]) || ' ';
    if (flipping) ch = FLAP[Math.floor(hash(j * 17 + idx * 5, Math.floor(fr * 30)) * FLAP.length)];
    if (loc <= 0) ch = ' ';
    const sq = flipping ? Math.abs(Math.cos(fr / .32 * Math.PI)) : 1;
    if (ch !== ' ') {
      c.save(); c.translate(x + cw / 2, y0 + chh / 2); c.scale(1, Math.max(.08, sq));
      c.fillStyle = final ? RED : WHITE; c.font = `500 118px ${WORD}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 0, 6); c.restore();
    }
  }
  c.textAlign = 'left';
  /* под табло — почему вариант не подошёл; у ZERNO — свободный адрес */
  const ci = clamp(Math.floor(p - .3), 0, 4), nk = clamp((p - .3) - Math.floor(p - .3)), fin = p >= 4;
  const t = CAND[ci][1], noteA = a * (fin ? 1 : ss(.35, .5, nk) * (1 - ss(.85, 1, nk)));
  if (noteA > .004) {
    c.globalAlpha = noteA; c.font = `500 30px ${MONO}`; c.fillStyle = fin ? WHITE : INK; c.fillText(t, x0, y0 + chh + 70);
    if (!fin) { const w = c.measureText(t).width; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0 + chh + 60); c.lineTo(x0 + w, y0 + chh + 60); c.stroke(); }
    else { c.fillStyle = RED; c.fillRect(x0 + c.measureText(t).width + 18, y0 + chh + 46, 22, 22); }
  }
  label(c, 'коротко · звонко · читается на двух языках', 40, 960, a * ss(2.9, 3.2, h), 22);
  c.globalAlpha = 1;
}
/* ---------- 06 Голос: как бренд говорит ---------- */
const VOICE = [['Осуществляем доставку кофейных напитков', 'Привезём горячим'], ['Уважаемые клиенты! Акция!', 'Второй капучино — за наш счёт'], ['Ваш заказ передан в службу доставки', 'Едем. Будем через 12 минут']];
function wrap(c, t, x, y, w, lh) { const ws = t.split(' '); let line = '', yy = y; for (const word of ws) { const tt = line ? line + ' ' + word : word; if (c.measureText(tt).width > w && line) { c.fillText(line, x, yy); line = word; yy += lh; } else line = tt; } c.fillText(line, x, yy); return yy; }
function drawVoice(c, n) {
  const g = n - G2, a = ss(.05, .4, g) * (1 - ss(3.3, 3.7, g));
  if (a <= .004) return;
  label(c, 'голос бренда · как мы говорим', 40, 60, a);
  label(c, 'не так', 40, 160, a, 22); label(c, 'а так', 520, 160, a, 22);
  c.globalAlpha = a * .5; c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(490, 130); c.lineTo(490, 900); c.stroke();
  VOICE.forEach(([bad, good], i) => {
    const t = .3 + i * .75, l = ss(t, t + .35, g) * a, st = ss(t + .35, t + .7, g), r = ss(t + .55, t + .9, g) * a, y = 270 + i * 230;
    if (l > .004) {
      c.globalAlpha = l * .55; c.fillStyle = WHITE; c.font = `500 30px ${TXT}`; const yl = wrap(c, bad, 40, y, 410, 40);
      if (st > 0) { c.globalAlpha = l; c.strokeStyle = RED; c.lineWidth = 3; for (let yy = y - 10; yy <= yl - 10; yy += 40) { c.beginPath(); c.moveTo(40, yy); c.lineTo(40 + 410 * st, yy); c.stroke(); } }
    }
    if (r > .004) { c.globalAlpha = r; c.fillStyle = WHITE; c.font = `500 44px ${WORD}`; wrap(c, good, 520, y + (1 - r) * 14, 440, 54); }
  });
  c.globalAlpha = 1;
}
/* ---------- 10 Брендбук: готовая книга ----------
   Лист превращается в книгу: обложка фирменного красного, книга ложится на стол под углом (виден обрез страниц и тень),
   обложка раскрывается, листаются развороты с настоящими страницами глав, книга закрывается и лежит. Перед уходом в сетку
   книга снова становится плоским листом. Всё — функция положения на шкале, кроме ничего: колесо назад листает обратно. */
const BOOK = { ready: false, pages: [], P: 0 };
function pagePalette(c) {
  PAL.forEach(([nm, hx, rgb], i) => { const x = 60 + i * 225; c.fillStyle = hx; c.fillRect(x, 120, 195, 640); c.strokeStyle = 'rgba(255,255,255,.1)'; c.strokeRect(x, 120, 195, 640); c.fillStyle = WHITE; c.font = `500 26px ${TXT}`; c.fillText(nm.split(' ')[0], x, 810); label(c, hx, x, 850, 1, 20); });
}
/* обложка: красный во весь формат, белый знак, слово ZERNO разрядкой, внизу «брендбук · 2026» */
function cover(c) {
  c.fillStyle = RED; c.fillRect(0, 0, 1000, 1000);
  mark(c, 150, 190, 150 / BH, 1, WHITE);
  c.fillStyle = WHITE; c.font = `500 112px ${WORD}`; c.textBaseline = 'alphabetic'; c.fillText('Z E R N O', 70, 640);
  c.fillStyle = 'rgba(255,255,255,.85)'; c.font = `500 30px ${MONO}`; c.fillText('БРЕНДБУК', 76, 720);
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('2026', 76, 930); c.textAlign = 'right'; c.fillText('48 СТР.', 930, 930); c.textAlign = 'left';
}
/* оборот обложки: тёмный форзац с маленьким знаком */
function endpaper(c) { c.fillStyle = '#121216'; c.fillRect(0, 0, 1000, 1000); mark(c, 500, 470, 90 / BH, 1, RED); label(c, 'ZERNO · брендбук · 2026', 500, 600, 1, 22, INK, 'center'); }
function buildBook() {
  const d = cv.width, off = document.createElement('canvas'); off.width = off.height = d;
  const o = off.getContext('2d');
  /* 0 Идея, 1 Имя, 2 Знак, 3 Цвет, 4 Буквы, 5 Голос, 6 Правила, 7 Носители, 8 Проверка, 9 обложка, 10 форзац */
  const PG = [c => drawIdea(c, G1 + 3), c => drawName(c, G1 + 3.6 + 3.1), c => drawSign(c, 6.6), pagePalette, c => drawWord(c, 14.6), c => drawVoice(c, G2 + 3), c => drawRules(c, 18.4), c => drawCarry(c, 23.2), c => icon(c, 150, 150, 700, 1), cover, endpaper];
  BOOK.pages = PG.map(f => {
    o.setTransform(1, 0, 0, 1, 0, 0); o.fillStyle = '#0b0b0e'; o.fillRect(0, 0, d, d); o.setTransform(G.U, 0, 0, G.U, 0, 0); f(o); o.globalAlpha = 1;
    const p = document.createElement('canvas'); p.width = p.height = d; p.getContext('2d').drawImage(off, 0, 0); return p;
  });
  /* 3D: пять листов (обложка и четыре разворота) и блок страниц под ними. У листа лицо и оборот. */
  const P = BOOK.P = Math.round(Math.min(G.S * .56, $('#x4-stage').clientWidth * .44)), T = 16, k = Math.max(1, Math.round(P * dpr()));
  const face = i => { const cnv = document.createElement('canvas'); cnv.width = cnv.height = k; cnv.getContext('2d').drawImage(BOOK.pages[i], 0, 0, k, k); return cnv; };
  const LEAF = [[9, 10], [0, 1], [2, 3], [4, 5], [6, 7]];
  const box = $('#x4-b3'); box.innerHTML = ''; box.style.setProperty('--p', P + 'px'); box.style.setProperty('--t', T + 'px');
  const bk = document.createElement('div'); bk.className = 'bk'; box.append(bk);
  const shd = document.createElement('i'); shd.className = 'shd'; bk.append(shd);
  const blk = document.createElement('div'); blk.className = 'blk';
  const base = face(8); base.className = 'fc'; blk.append(base);
  const eR = document.createElement('i'); eR.className = 'eR'; const eB = document.createElement('i'); eB.className = 'eB'; blk.append(eR, eB);
  bk.append(blk);
  BOOK.leaves = LEAF.map(([fr, bc], i) => {
    const lf = document.createElement('div'); lf.className = 'lf' + (i ? '' : ' cv');
    const f = face(fr), b = face(bc); f.className = 'f'; b.className = 'b'; lf.append(f, b); bk.append(lf); return lf;
  });
  BOOK.bk = bk; BOOK.ready = true;
}
function book(n) {
  const box = $('#x4-b3'), g = n - G3, ex = EXIT - G3;
  const a = ss(0, .5, g);
  if (g < 0 || a <= .004) { vis(box, 0); return; }
  if (!BOOK.ready) buildBook();
  vis(box, a);
  const P = BOOK.P, S = G.S;
  /* вид: плоско (как лист) → на столе закрытая → раскрыта → закрыта на столе → снова плоско перед уходом */
  const tab = ss(.5, 1.4, g), open = ss(1.4, 2.1, g) * (1 - ss(3.9, 4.6, g));
  const rx = lerp(0, lerp(52, 40, open), tab), rz = lerp(0, lerp(-22, 0, open), tab), sc = lerp(S / P, 1, tab), tx = lerp(-P / 2, 0, open);
  BOOK.bk.style.transform = `translateX(${tx * sc}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${sc})`;
  const sh = BOOK.bk.querySelector('.shd'); sh.style.left = `${-P * open}px`; sh.style.width = `${P * (1 + open)}px`; sh.style.opacity = tab;
  /* листы: обложка раскрывается, четыре листа листаются, потом всё закрывается обратно с конца */
  BOOK.leaves.forEach((lf, i) => {
    const o = i ? ss(2.1 + (i - 1) * .35, 2.55 + (i - 1) * .35, g) : ss(1.4, 2, g);
    const c = ss(3.9 + (4 - i) * .12, 4.35 + (4 - i) * .12, g);
    const ang = -180 * o * (1 - c);
    lf.style.transform = `rotateY(${ang.toFixed(2)}deg) translateZ(${-i * .7}px)`;
  });
}
/* ---------- Живые сцены: Идея, Имя, Голос. Идут на весь экран, лист брендбука на это время уходит. ----------
   Сначала мы ищем смысл (сцены), потом превращаем его в систему (листы брендбука). Правило цвета: серое и одно красное. */
const fx = document.createElement('canvas'); fx.id = 'x4-fx'; fx.setAttribute('aria-hidden', 'true');
R.insertBefore(fx, $('#x4-flood'));
const FX = { w: 0, h: 0, d: 1, vx0: 0, vx1: 0, vy0: 0, vy1: 0, cx: 0, cy: 0 };
function fxFit() {
  const d = FX.d = dpr(), st = $('#x4-stage').getBoundingClientRect(), rr = R.getBoundingClientRect();
  FX.w = G.W; FX.h = G.H; fx.width = Math.round(G.W * d); fx.height = Math.round(G.H * d);
  /* область сцены — правая колонка (где лист), с запасом; слева подпись главы */
  FX.vx0 = st.left - rr.left - 20; FX.vx1 = G.W - 30; FX.vy0 = G.top + 20; FX.vy1 = G.bot - 20;
  /* на телефоне сцена под подписью главы во всю ширину: эффекты не заходят на подпись и на края экрана */
  if (!G.wide) { FX.vx0 = 12; FX.vx1 = G.W - 12; FX.vy0 = st.top - rr.top + 6; }
  FX.cx = (FX.vx0 + FX.vx1) / 2; FX.cy = (FX.vy0 + FX.vy1) / 2;
  NAMES.lay = null; CUPS.lay = null; IDOT.n = null;
}
/* 01 Идея: что люди говорят о кофейнях. Серые фразы в три слоя глубины, колесо сжимает шум в одну точку, из неё встаёт обещание. */
const PAIN = ['опять остыл', 'ждать 40 минут', 'утром не доставляют', 'вкусно, но далеко', 'курьер потерялся', 'кофе как вода', 'а где мой заказ?', 'дорого за стакан',
  'очередь до двери', 'не успеваю позавтракать', 'привезли холодным', 'в офисе нет кофемашины', 'пока дойду — опоздаю', 'нужен кофе к 9:00', 'капучино без пенки',
  'опоздали на полчаса', 'хочу просто вкусно', 'звоню — не берут', 'доставка дороже кофе', 'слишком сладко', 'крышка протекла', 'перепутали заказ', 'сайт не грузится',
  'нет оплаты картой', 'где ближайшая кофейня?', 'хочу кофе прямо сейчас', 'остыл, пока везли', 'час ждал латте', 'а можно без сахара?', 'всё одинаковое', 'не помню, как называлась',
  'вывеска как у всех', 'зашёл и вышел', 'не понял меню', 'а есть на вынос?', 'сколько ещё ждать?', 'кофе на бегу', 'до работы 10 минут', 'нет времени на очередь', 'хочу горячий'];
const IDEA = PAIN.map((t, i) => ({ t, z: hash(i, 3), x: hash(i, 4), y: hash(i, 5), ph: hash(i, 6) * 6.283, d: hash(i, 7), h: hash(i, 8), node: -1 }));
/* точки листа для начала «Идеи»: у каждой фразы своя точка — узел, ближайший к её месту; остальные точки уходят в глубину */
const IDOT = { n: null, c: [0, 0] };
function idotLay() {
  const r = cv.getBoundingClientRect(), kr = R.getBoundingClientRect(), x0 = r.left - kr.left, y0 = r.top - kr.top, S = r.width, used = new Set(), nd = [];
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) nd.push([i, j]);
  IDEA.forEach(it => { let best = 0, bd = 1e9; nd.forEach(([i, j], q) => { if (used.has(q)) return; const d = (i / 20 - it.x) ** 2 + (j / 20 - it.y) ** 2; if (d < bd) { bd = d; best = q; } }); used.add(best); it.node = best; });
  IDOT.n = nd.map(([i, j], q) => ({ x: x0 + S * i / 20, y: y0 + S * j / 20, ph: used.has(q), h: hash(q, 31), h2: hash(q, 32) }));
  IDOT.c = [x0 + S / 2, y0 + S / 2];
}
function fxIdea(c, n, T) {
  const g = n - G1, out = 1 - ss(3.3, 3.6, g);
  if (g < 0 || out <= 0) return;
  const { vx0, vx1, vy0, vy1, cx, cy } = FX, cmp = ss(1.35, 2.3, g), cmp2 = cmp * cmp;
  if (!IDOT.n) idotLay();
  /* Рамка листа уходит, точки узлов разлетаются. Чужие точки (не доставшиеся фразам) уходят на зрителя: расходятся от середины листа, крупнеют и гаснут */
  if (g >= .1 && g < 1.2) {
    const [ox, oy] = IDOT.c; c.fillStyle = '#fff';
    for (const p of IDOT.n) {
      if (p.ph) continue;
      const t = ss(.1 + p.h * .2, .7 + p.h * .3, g); if (t >= 1) continue;
      const e = t * t, k = 1 + (1.2 + 2.4 * p.h2) * e;
      c.globalAlpha = .72 * (1 - t); c.beginPath(); c.arc(ox + (p.x - ox) * k, oy + (p.y - oy) * k, 1.4 * (1 + 2.2 * e), 0, 7); c.fill();
    }
  }
  c.textBaseline = 'middle'; c.textAlign = 'center';
  for (const it of IDEA) {
    /* своя точка летит из узла к месту фразы, на месте фраза раскрывается из неё в обе стороны */
    const ar = .5 + it.d * .55, gr = ss(ar - .03, ar + .32, g), a = gr * out * (1 - ss(.75, 1, cmp));
    /* на телефоне фразы мельче и целиком внутри экрана */
    const mob = !G.wide, s0 = mob ? lerp(11, 19, it.z) : lerp(13, 31, it.z), est = it.t.length * s0 * .28;
    let bx = (mob ? lerp(vx0 + est, vx1 - est, it.x) : lerp(vx0 - 120, vx1, it.x)) + Math.sin(T * .17 + it.ph) * 10 * (.3 + it.z) * (mob ? .4 : 1);
    const by = lerp(vy0 + 14, vy1, it.y) + Math.cos(T * .13 + it.ph) * 6;
    const x = lerp(bx, cx, cmp2), y = lerp(by, cy, cmp2), sz = s0 * lerp(1, .25, cmp), left = !mob && x < vx0 + 40 ? .35 : 1;
    if (g >= .1 && gr < 1) {
      const p = IDOT.n[it.node], f = ss(.12 + it.d * .3, ar, g), e = f * f * (3 - 2 * f);
      c.globalAlpha = .72 * (1 - gr) * lerp(1, lerp(.45, 1, it.z), e); c.fillStyle = '#fff';
      c.beginPath(); c.arc(lerp(p.x, x, e), lerp(p.y, y, e) - Math.sin(Math.PI * e) * 26 * (.5 - it.h), 1.4 + 1.6 * it.z * e, 0, 7); c.fill();
    }
    if (a <= .004) continue;
    c.globalAlpha = a * lerp(.16, .62, it.z) * left; c.fillStyle = '#fff'; c.font = `500 ${sz}px ${TXT}`;
    /* дальние фразы размыты: так видна глубина */
    c.filter = it.z < .4 ? `blur(${((.4 - it.z) * 5).toFixed(1)}px)` : 'none';
    if (gr < 1) { const tw = c.measureText(it.t).width * gr; c.save(); c.beginPath(); c.rect(x - tw / 2 - 1, y - sz, tw + 2, sz * 2); c.clip(); c.fillText(it.t, x, y); c.restore(); }
    else c.fillText(it.t, x, y);
    c.filter = 'none';
  }
  /* шум схлопнулся в точку — вспышка */
  const fl = ss(2, 2.3, g) * (1 - ss(2.4, 2.9, g));
  if (fl > 0) { const gr = c.createRadialGradient(cx, cy, 0, cx, cy, 140); gr.addColorStop(0, `rgba(255,70,40,${.55 * fl})`); gr.addColorStop(1, 'rgba(255,70,40,0)'); c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(cx - 140, cy - 140, 280, 280); }
  /* обещание: три строки, главное слово красное */
  const fs = Math.min((vx1 - vx0) * .1, 96), L = [['Кофе, который', '#fff'], ['успевает', RED], ['за вами.', '#fff']];
  L.forEach(([t, col], i) => {
    const k = ss(2.2 + i * .15, 2.65 + i * .15, g) * out; if (k <= .004) return;
    const y = cy + (i - 1) * fs * 1.08;
    c.save(); c.globalAlpha = k; c.translate(cx, y); const s = lerp(1.25, 1, k); c.scale(s, s);
    c.fillStyle = col; c.font = `500 ${fs}px ${WORD}`; if (col === RED) { c.shadowColor = RED; c.shadowBlur = 24 * k; } c.fillText(t, 0, 0); c.restore();
  });
  const k2 = ss(2.8, 3.15, g) * out;
  if (k2 > .004) { c.globalAlpha = k2; c.fillStyle = INK; c.font = `500 15px ${MONO}`; c.fillText('БЫСТРЫЙ  ·  ТЁПЛЫЙ  ·  ТОЧНЫЙ', cx, cy + fs * 2.05); }
  c.globalAlpha = 1; c.textAlign = 'left';
}
/* 02 Имя: стена из 300 вариантов, фильтры вычёркивают их волнами, счётчик бежит 300 → 112 → 42 → 7 → 1, остаётся ZERNO */
const NAMES = { list: null, lay: null };
function nameList() {
  if (NAMES.list) return NAMES.list;
  const ru = ['Арома', 'Бодро', 'Кофеин', 'Гранд', 'Утро', 'Бариста', 'Обжарка', 'Капля', 'Пенка', 'Турка', 'Эспрессо', 'Зёрнышко', 'Бодрость', 'Глоток', 'Пар', 'Арабика', 'Робуста', 'Минутка', 'Экспресс', 'Горячо', 'Утренний', 'Чашка', 'Какао', 'Ваниль', 'Корица', 'Крема', 'Огонёк', 'Сахарок', 'Молочник', 'Бобы'];
  const en = ['Brew', 'Bean', 'Roast', 'Mocha', 'Latte', 'Crema', 'Drip', 'Shot', 'Hot', 'Fresh', 'Daily', 'Cup', 'Grind', 'Aroma', 'Morning', 'Rush', 'Black', 'Steam', 'Pour', 'Cocoa'];
  const sf = ['', ' Go', ' Lab', ' 24', ' Плюс', ' Экспресс', ' & Co', ' Point', ' Time', ' House'];
  /* все сочетания основы и хвоста, перемешанные одинаково при каждом запуске; берём 299 и ставим ZERNO в середину стены */
  const all = []; [...ru, ...en].forEach((b, i) => sf.forEach((f, j) => all.push([b + f, hash(i * 13 + j, 21)])));
  const L = all.sort((p, q) => p[1] - q[1]).map(p => p[0]).slice(0, 299); L.splice(137, 0, 'ZERNO');
  /* волны отсева: 188, 70, 35, 6 вариантов; ZERNO не вычёркивается */
  const order = L.map((t, k) => [t, k]).filter(([t]) => t !== 'ZERNO').sort((p, q) => hash(p[1], 13) - hash(q[1], 13));
  const wave = {}; order.forEach(([t, k], j) => { wave[k] = j < 188 ? 0 : j < 258 ? 1 : j < 293 ? 2 : 3; });
  return NAMES.list = L.map((t, k) => ({ t, z: t === 'ZERNO', w: wave[k] }));
}
const FILT = ['занято', 'не звучит', 'домен занят', 'трудно произнести'], CNT = [300, 112, 42, 7, 1];
function fxName(c, n) {
  const h = n - G1 - 3.6, out = 1 - ss(3.45, 3.8, h);
  if (h < 0 || out <= 0) return;
  /* на телефоне стена уже: четыре столбца и столько строк, сколько читается; видна часть стены вокруг ZERNO */
  const L = nameList(), { vx0, vx1, vy0, vy1, cx, cy } = FX, cols = G.wide ? 7 : 4, top = vy0 + 70, bot = vy1 - 20, zk0 = L.findIndex(it => it.z);
  const rows = G.wide ? Math.ceil(L.length / cols) : Math.max(4, Math.floor((bot - top) / 13)), NV = rows * cols, start = G.wide ? 0 : Math.max(0, Math.min(L.length - NV, zk0 - Math.floor(NV / 2)));
  const rh = (bot - top) / rows, cw = (vx1 - vx0) / cols;
  const fs = Math.max(10, Math.min(15, rh * .72)), app = ss(0, .5, h);
  const zt = ss(2.95, 3.4, h);
  c.textBaseline = 'middle'; c.font = `500 ${fs}px ${MONO}`;
  L.forEach((it, k0) => {
    const k = k0 - start; if (k < 0 || k >= NV) return;
    const col = k % cols, row = Math.floor(k / cols), x = vx0 + col * cw + 6, y = top + row * rh + rh / 2;
    const ap = ss(row / rows * .4, row / rows * .4 + .3, h) * app;
    if (it.z) return;
    const tw = .8 + it.w * .55, st = ss(tw, tw + .25, h), fd = 1 - .94 * ss(tw + .2, tw + .45, h), a = ap * fd * out * (1 - zt * .8);
    if (a <= .004) return;
    c.globalAlpha = a * .5; c.fillStyle = '#fff'; c.fillText(it.t, x, y);
    if (st > 0) { const w = c.measureText(it.t).width * st; c.globalAlpha = a; c.fillStyle = RED; c.fillRect(x, y - 1, w, 2); }
  });
  /* ZERNO: стоит в стене чуть ярче, после отсева выходит в центр и вырастает */
  const zk = zk0 - start, zx = vx0 + (zk % cols) * cw + 6, zy = top + Math.floor(zk / cols) * rh + rh / 2;
  const zs = lerp(fs, Math.min((vx1 - vx0) * .19, 170), zt * zt), za = ss(0, .5, h) * out;
  c.save(); c.globalAlpha = za; c.textAlign = zt > .02 ? 'center' : 'left';
  const x = lerp(zx, cx, zt), y = lerp(zy, cy, zt);
  c.font = zt > .02 ? `500 ${zs}px ${WORD}` : `600 ${fs}px ${MONO}`; c.fillStyle = h > 2.7 ? RED : '#fff';
  if (h > 2.7) { c.shadowColor = RED; c.shadowBlur = 30 * zt; }
  c.fillText('ZERNO', zt > .02 ? x : zx, y); c.restore();
  const dm = ss(3.2, 3.45, h) * out;
  if (dm > .004) { c.globalAlpha = dm; c.textAlign = 'center'; c.fillStyle = INK; c.font = `500 16px ${MONO}`; c.fillText('zerno.kg — свободен', cx, cy + zs * .62); c.textAlign = 'left'; }
  /* фильтр и счётчик над стеной */
  const lab = ss(.3, .7, h) * out * (1 - zt);
  if (lab > .004) {
    let wi = -1; for (let i = 0; i < 4; i++) if (h > .7 + i * .55) wi = i;
    const cnt = Math.round(wi < 0 ? 300 : lerp(CNT[wi], CNT[wi + 1], ss(.8 + wi * .55, 1.25 + wi * .55, h)));
    c.globalAlpha = lab; c.fillStyle = '#fff'; c.font = `800 44px ${TXT}`; c.fillText(String(cnt), vx0 + 6, vy0 + 22);
    const nw = c.measureText(String(cnt)).width; c.fillStyle = INK; c.font = `500 15px ${MONO}`; c.fillText('вариантов имени', vx0 + 18 + nw, vy0 + 26);
    if (wi >= 0) { const fa = ss(.7 + wi * .55, .8 + wi * .55, h); c.globalAlpha = lab * fa; c.fillStyle = RED; c.font = `600 15px ${MONO}`; c.textAlign = 'right'; if (G.wide) c.fillText('фильтр: ' + FILT[wi], vx1 - 6, vy0 + 26); else { c.font = `600 12px ${MONO}`; c.textAlign = 'left'; c.fillText('фильтр: ' + FILT[wi], vx0 + 6, vy0 + 60); } c.textAlign = 'left'; }
  }
  c.globalAlpha = 1;
}
/* 06 Голос: телефон, уведомления переписываются в голос ZERNO; вокруг — где ещё звучит этот голос */
const NOTE = [['Ваш заказ передан в службу доставки', 'Едем. Будем через 12 минут'], ['Уважаемые клиенты! Акция!', 'Второй капучино — за наш счёт'], ['Оцените качество обслуживания', 'Как вам латте? Ответьте одним словом']];
const TOUCH = [['стакан', 'Горячо. Держите крепче.'], ['наклейка курьера', 'Едем к вам'], ['чек', 'Спасибо, что успели с нами']];
const SCR = 'абвгдежзиклмнопрстуфхцчшэюя';
const phone = document.createElement('div'); phone.id = 'x4-phone'; phone.setAttribute('aria-hidden', 'true');
phone.innerHTML = `<div class="ph"><div class="nch"></div><div class="tm">9:41</div><div class="dt">вторник, 10 ноября</div>
  ${NOTE.map(() => `<div class="nt"><i class="ic">${'<svg viewBox="0 0 100 100"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="#fff"/><path d="M8 34H61L39 66H92" fill="none" stroke="#df1f12" stroke-width="8"/></g></svg>'}</i><div class="tx"><div class="hd"><b>ZERNO</b><small>сейчас</small></div><p class="bad"></p><p class="good"></p></div></div>`).join('')}</div>
  ${TOUCH.map(([a, b]) => `<div class="tp"><small>${a}</small><b>${b}</b></div>`).join('')}`;
$('#x4-stage').append(phone);
const NT = [...phone.querySelectorAll('.nt')], TP = [...phone.querySelectorAll('.tp')];
function fxVoice(n) {
  const g = n - G2, out = 1 - ss(3.35, 3.7, g), a = ss(.05, .4, g) * out;
  vis(phone, g >= 0 ? a : 0);
  if (a <= .004) return;
  NT.forEach((el, i) => {
    const [bad, good] = NOTE[i], t = .3 + i * .85, k = ss(t, t + .35, g), st = ss(t + .4, t + .65, g), rw = ss(t + .6, t + 1.05, g);
    el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * -18}px)`;
    const b = el.querySelector('.bad'), gd = el.querySelector('.good');
    if (b.textContent !== bad) b.textContent = bad;
    b.style.setProperty('--st', st); b.style.opacity = 1 - .65 * rw; b.style.display = rw >= 1 ? 'none' : '';
    const m = Math.round(good.length * rw); let s = good.slice(0, m);
    for (let j = m; j < Math.min(good.length, m + 3) && rw > 0 && rw < 1; j++) s += good[j] === ' ' ? ' ' : SCR[Math.floor(hash(j, Math.floor(n * 40)) * SCR.length)];
    if (gd.textContent !== s) gd.textContent = s;
  });
  TP.forEach((el, i) => { const k = ss(2.8 + i * .15, 3.15 + i * .15, g); el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 14}px)`; });
}
/* ---------- 09 Проверка: «Одна среди многих» ----------
   Камера въезжает в стакан с листа «Везде»: остальные вещи гаснут, контур стакана заливается красным, знак белеет,
   и камера встаёт вплотную на краешке знака — «Узнали?». Потом камера отъезжает: это стакан ZERNO на стойке среди трёх рядов
   серых стаканов других кофеен, и его видно сразу — как красная плитка среди ста шаблонов в начале «Клиентов».
   Потом серые стаканы гаснут и оседают, красный стакан становится обложкой брендбука: тело — квадратом листа, знак — на место знака обложки.
   Стакан ZERNO на стойке той же формы, что на листе «Везде» (zcup), поэтому вплотную обе картинки одинаковы и стык не виден.
   Всё — функция положения на шкале: колесо назад проводит те же кадры обратно. */
const CUPS = { lay: null, me: null, shelf: null }, ease3 = t => t * t * (3 - 2 * t);
const CZ = { in0: 34.9, in1: 35.7, z0: 36.1, z1: 37.2, out0: 37.8, out1: 38.5, m0: 37.9, m1: 38.6, Z0: 24 };
/* точка, на которой камера стоит вплотную: край зерна у верхней черты Z, в координатах знака */
const ZFR = [-22 * K, -14 * K];
/* стойка: три ряда по девять стаканов разной высоты и ширины, у каждого свой серый и свой простой знак; ZERNO — во втором ряду правее середины.
   (x, y) — середина дна, h — высота от крышки до дна. У ZERNO ещё box — коробка рисунка с листа «Везде», в которой стакан той же высоты */
function cupLay() {
  const { vx0, vx1, vy0, vy1 } = FX, W = vx1 - vx0, H = vy1 - vy0, cols = 9, rows = 3, out = [], h0 = Math.min(H / rows * .72, W / cols * 1.3);
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const k = r * cols + i, me = r === 1 && i === 5, h = h0 * (me ? 1 : .78 + .3 * hash(k, 21)), w = h * (me ? .7 : .6 + .16 * hash(k, 22));
    const p = { me, k, x: vx0 + (i + .5) * W / cols + (me ? 0 : (hash(k, 23) - .5) * 12), y: vy0 + (r + 1) * H / rows - 16, w, h, g: Math.round(44 + 34 * hash(k, 24)), lg: Math.floor(hash(k, 25) * 6) };
    if (me) { const bh = h / .72, bw = bh * .75; p.box = [p.x - bw / 2, p.y - bh * .82, bw, bh]; }
    out.push(p);
  }
  CUPS.lay = out; CUPS.me = out.find(c => c.me); CUPS.shelf = [1, 2, 3].map(r => vy0 + r * H / rows - 16);
}
/* стакан ZERNO в коробке листа «Везде» (x, y, w, h): f 0 — контур с красным знаком, как на листе; 1 — красный стакан с тёмной крышкой и белым знаком.
   Между ними стакан наполняется красным снизу вверх, как кофе: ниже уровня он уже красный, знак ниже уровня уже белый */
function zcup(c, x, y, w, h, f, a = 1) {
  const body = () => { c.beginPath(); c.moveTo(x + w * .19, y + h * .16); c.lineTo(x + w * .81, y + h * .16); c.lineTo(x + w * .73, y + h * .82); c.lineTo(x + w * .27, y + h * .82); c.closePath(); };
  const mx = x + w / 2, my = y + h * .48, sc = h * .2 / BH;
  if (f < 1) {
    c.globalAlpha = a; c.strokeStyle = INK; c.lineWidth = 2.5 * w / 300; body();
    c.rect(x + w * .15, y + h * .1, w * .7, h * .06); c.moveTo(x + w * .22, y + h * .36); c.lineTo(x + w * .78, y + h * .36); c.moveTo(x + w * .245, y + h * .6); c.lineTo(x + w * .755, y + h * .6); c.stroke();
    mark(c, mx, my, sc, a, RED);
  }
  if (f > 0) {
    const lv = y + h * .84 - f * h * .76;
    c.save(); if (f < 1) { c.beginPath(); c.rect(x - w, lv, w * 3, h); c.clip(); }
    c.globalAlpha = a; c.fillStyle = '#2a2930'; c.fillRect(x + w * .15, y + h * .1, w * .7, h * .06);
    c.fillStyle = RED; c.strokeStyle = RED; c.lineWidth = 3 * w / 300; body(); c.fill(); c.stroke();
    mark(c, mx, my, sc, a, WHITE); c.restore();
  }
  c.globalAlpha = 1;
}
/* вещь листа «Везде» в единицах листа, как её рисует drawCarry */
function carryAt(c, k, a) {
  const [t, f] = CARRY[k], x = 30 + (k % 3) * 320, y = 40 + Math.floor(k / 3) * 470, w = 300, h = 400;
  c.globalAlpha = a; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); const brand = f(c, x, y, w, h, a); c.stroke(); c.globalAlpha = 1; brand();
  label(c, t, x + w / 2, y + h + 34, a, 21, INK, 'center');
}
/* чужой стакан: крышка, тело-трапеция, серая манжета и простой серый знак */
function drawCup(c, p, a) {
  const { x, y, w, h } = p, t = y - h * .9;
  if (a <= .004) return;
  c.globalAlpha = a; c.fillStyle = `rgb(${p.g + 26},${p.g + 26},${p.g + 30})`;
  c.beginPath(); c.roundRect(x - w * .55, t - h * .085, w * 1.1, h * .06, h * .02); c.fill(); c.fillRect(x - w * .48, t - h * .03, w * .96, h * .035);
  c.fillStyle = `rgb(${p.g},${p.g},${p.g + 5})`; c.beginPath(); c.moveTo(x - w * .5, t); c.lineTo(x + w * .5, t); c.lineTo(x + w * .38, y); c.lineTo(x - w * .38, y); c.closePath(); c.fill();
  const ww = v => lerp(w * .5, w * .38, v / .9), y0 = y - h * .62, y1 = y - h * .3;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(x - ww(.28), y0); c.lineTo(x + ww(.28), y0); c.lineTo(x + ww(.6), y1); c.lineTo(x - ww(.6), y1); c.closePath(); c.fill();
  c.fillStyle = c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = Math.max(.6, w * .025); const cx = x, cy = y - h * .46, s = w * .17;
  c.beginPath();
  if (p.lg === 0) { c.arc(cx, cy, s, 0, 7); c.stroke(); }
  else if (p.lg === 1) { c.arc(cx, cy - s * .35, s * .55, 0, 7); c.fill(); c.fillRect(cx - s, cy + s * .45, s * 2, s * .22); }
  else if (p.lg === 2) { c.fillRect(cx - s, cy - s * .35, s * 2, s * .26); c.fillRect(cx - s * .7, cy + s * .15, s * 1.4, s * .2); }
  else if (p.lg === 3) { for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s, an = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(cx + r * Math.cos(an), cy + r * Math.sin(an)); } c.closePath(); c.fill(); }
  else if (p.lg === 4) { c.ellipse(cx, cy, s * .5, s, .6, 0, 7); c.fill(); }
  else { c.font = `700 ${(s * .62).toFixed(2)}px ${TXT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COFFEE', cx, cy); c.textAlign = 'left'; }
  c.globalAlpha = 1;
}
function fxCheck(c, n) {
  if (n < CZ.in0 || n > G3 + .55) return;
  if (!CUPS.lay) cupLay();
  const d = FX.d, me = CUPS.me, kr = R.getBoundingClientRect(), sr = cv.getBoundingClientRect();
  const sx = sr.left - kr.left, sy = sr.top - kr.top, S = sr.width, u = S / 1000, C = [FX.cx, FX.cy];
  const [bx, by, bw, bh] = me.box, Pst = rot(ZFR, bx + bw / 2, by + bh * .48, bh * .2 / BH), P8 = rot(ZFR, 180, 232, 80 / BH);
  const m = ease3(ss(CZ.m0, CZ.m1, n));
  c.save();
  if (m <= 0) { c.beginPath(); c.rect(FX.vx0, FX.vy0, FX.vx1 - FX.vx0, FX.vy1 - FX.vy0); c.clip(); }
  if (n < CZ.in1) {
    /* въезд: лист «Везде» тем же рисунком; камера по логарифму к краешку знака на стакане, вещи кроме стакана гаснут, стакан заливается красным.
       В конце въезда знак на экране того же размера и на том же месте, что знак стакана на стойке вплотную */
    const ea = ease3(ss(CZ.in0, CZ.in1, n)), sA = bh * .2 * CZ.Z0 / 80, s = u * Math.exp(Math.log(sA / u) * ea);
    const w = (1 - u / s) / (1 - u / sA), P0 = [sx + P8[0] * u, sy + P8[1] * u], Q = [lerp(P0[0], C[0], w), lerp(P0[1], C[1], w)];
    c.setTransform(d * s, 0, 0, d * s, d * (Q[0] - P8[0] * s), d * (Q[1] - P8[1] * s));
    const fo = 1 - ss(0, .35, ea);
    if (fo > .004) for (let k = 1; k < CARRY.length; k++) carryAt(c, k, fo);
    zcup(c, 30, 40, 300, 400, ss(.25, .75, ea));
    label(c, CARRY[0][0], 180, 474, fo, 21, INK, 'center');
    c.restore(); return;
  }
  /* стойка: вплотную на краешке знака, потом отъезд по логарифму до всей стойки; точка краешка плавно уходит из середины на своё место */
  const e = ss(CZ.z0, CZ.z1, n), z = Math.exp(Math.log(CZ.Z0) * (1 - e));
  const Fx = Pst[0] - (Pst[0] - C[0]) * e / z, Fy = Pst[1] - (Pst[1] - C[1]) * e / z, k = ss(CZ.out0, CZ.out1, n), cA = ss(38.35, G3, n);
  c.setTransform(d * z, 0, 0, d * z, d * (C[0] - Fx * z), d * (C[1] - Fy * z));
  /* стойка и чужие стаканы; на уходе гаснут и оседают, дальние от ZERNO позже */
  if (k < 1) {
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1 / z; c.globalAlpha = 1 - k;
    CUPS.shelf.forEach(y => { c.beginPath(); c.moveTo(FX.vx0 - 40, y + .5); c.lineTo(FX.vx1 + 40, y + .5); c.stroke(); });
    CUPS.lay.forEach(p => {
      if (p.me) return;
      const dk = ss(0, .7, k - .3 * clamp(Math.hypot(p.x - me.x, p.y - me.y) / 600));
      c.save(); c.translate(0, 26 * dk * dk); drawCup(c, p, 1 - dk); c.restore();
    });
    c.globalAlpha = 1;
  }
  if (m <= 0) zcup(c, bx, by, bw, bh, 1);
  else {
    /* ZERNO становится обложкой: тело — квадратом листа, крышка уходит вверх, знак переезжает на место знака обложки */
    c.setTransform(d, 0, 0, d, 0, 0);
    c.globalAlpha = 1 - ss(0, .4, m); c.fillStyle = '#2a2930'; c.fillRect(bx + bw * .15, by + bh * .1 - 30 * m, bw * .7, bh * .06);
    const Q = [[bx + bw * .19, by + bh * .16, sx, sy], [bx + bw * .81, by + bh * .16, sx + S, sy], [bx + bw * .73, by + bh * .82, sx + S, sy + S], [bx + bw * .27, by + bh * .82, sx, sy + S]];
    c.globalAlpha = 1; c.fillStyle = RED; c.beginPath(); Q.forEach(([a0, b0, a1, b1], i) => c[i ? 'lineTo' : 'moveTo'](lerp(a0, a1, m), lerp(b0, b1, m))); c.closePath(); c.fill();
    mark(c, lerp(bx + bw / 2, sx + S * .15, m), lerp(by + bh * .48, sy + S * .19, m), lerp(bh * .2, S * .15, m) / BH, 1, WHITE);
    /* обложка проявляется поверх: те же красный и знак на тех же местах, добавляются надписи */
    if (cA > 0) { if (!BOOK.ready) buildBook(); c.globalAlpha = cA; c.drawImage(BOOK.pages[9], sx, sy, S, S); c.globalAlpha = 1; }
  }
  c.restore();
}
function fxPaint(n) {
  const on1 = n > G1 - .1 && n < G1 + 7.5, on2 = n > G2 - .1 && n < G2 + 3.8;
  const c = fx.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fx.width, fx.height);
  if (on1) { c.setTransform(FX.d, 0, 0, FX.d, 0, 0); const T = RM ? 8 : performance.now() * .001; fxIdea(c, n, T); fxName(c, n); }
  fxVoice(n);
  if (n > CZ.in0 - .1 && n < G3 + .6) { c.setTransform(FX.d, 0, 0, FX.d, 0, 0); fxCheck(c, n); }
  /* лист уходит на время сцен и возвращается к «Знаку», к «Правилам» и к брендбуку (красный стакан становится обложкой на месте листа) */
  const sk = (n < G2 - 1 ? clamp(1 - ss(1.1, 1.5, n) + ss(8, 8.5, n)) : clamp(1 - ss(G2, G2 + .4, n) + ss(G2 + 3.3, G2 + 3.7, n))) * clamp(1 - ss(CZ.in0, CZ.in0 + .4, n) + ss(38.2, G3, n));
  $('#x4-sheet').style.opacity = sk; $('#x4-sheet').style.visibility = sk > .004 ? 'visible' : 'hidden';
  const sx = n < G1 + 3 ? ss(G1 + .1, G1 + .5, n) : 0; $('#x4-sheet').style.transform = sx > 0 ? `scale(${(1 + .07 * sx).toFixed(4)})` : '';
  const bkK = n > G3 ? ss(G3 + .2, G3 + .7, n) : 0;
  cv.style.opacity = (1 - bkK) * (n >= CZ.in0 && n < G3 ? 0 : 1); $('#x4-sheet').style.borderColor = bkK > 0 ? `rgba(255,255,255,${(.12 * (1 - bkK)).toFixed(3)})` : '';
  if (bkK > 0) $('#x4-pg').style.opacity = 1 - bkK;
}

function paint(n) {
  const c = ctx, m = remap(n), gap = n > G1 && n < G1 + 7.4 ? 1 : n > G2 && n < G2 + 3.7 ? 2 : 0;
  /* в 1,1 точки узлов передаются сцене «Идея» (она рисует их на тех же местах и уводит в фразы), к «Знаку» возвращаются на лист */
  DOTK = n < G1 + 7.4 ? (n < G1 + .1 ? 1 : ss(7.9, 8.4, n)) : 1;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(G.U, 0, 0, G.U, 0, 0);
  if (m < 8.2) drawSign(c, m);
  if (gap !== 2) { if (m > 12.5 && m < 15.6) drawWord(c, m); if (m > 15.3 && m < 19.3) drawRules(c, m); }
  drawCarry(c, m);
}


const X = { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '' };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '' });
  R.classList.remove('on'); $('#x4-sd').hidden = true; R.style.opacity = ''; window.GTSONAR?.halftone(R, 0);
  ['#x4-bg', '#x4-scene', '#x4-flood'].forEach(s => vis($(s), 0)); fx.style.opacity = 0;
  kl.classList.remove('ex', 'exd');
}
/* c: near — ручка у станции «Бренд», tuned — станция настроена, alpha — насколько станция слышна,
   wait — перед станцией ещё идёт «Сто одинаковых»: пример стоит в начале и сам не запускается */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); layout(); }
  if (c.wait) Object.assign(X, { u: 0, uc: 0, goal: null, tw: 0, auto: false });
  if (!c.tuned) { X.tw = 0; if (X.u <= 0) X.goal = null; }
  else if (!X.auto && X.u <= 0 && X.goal == null) { X.tw += dt; if (X.tw > 6) { X.auto = true; X.goal = STOPS[1]; } }
  /* Щелчок и сам запуск проигрывают отрезок со скоростью четыре щелчка в секунду.
     Переходы с сеткой-сонаром идут медленнее: первый щелчок (сетка складывается в лист) за секунду, уход (лист раскладывается в сетку) за две. */
  const slow = v => v * TOTAL < 1 || v * TOTAL > EXIT;
  if (X.goal != null) { const sp = RM ? 9 : (X.u * TOTAL < 1 ? 1 : X.u * TOTAL > EXIT ? 1.2 : 4) / TOTAL * dt, d = X.goal - X.u; X.u = Math.abs(d) <= sp ? X.goal : X.u + Math.sign(d) * sp; if (X.u === X.goal) X.goal = null; }
  /* колесо сглаживается, а в переходах с сеткой мягче */
  X.uc = RM || X.goal != null || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * (slow(X.uc) || X.uc * TOTAL < 1.2 ? 3.5 : 9)));
  const n = X.uc * TOTAL, A = c.alpha;
  X.ph = n <= .1 ? 0 : 1;
  /* фон листа гаснет до чёрного фона станции, лист держится, пока его точки не отдались сетке-сонару */
  vis($('#x4-bg'), ss(.1, 1, n) * A);
  const sceneA = ss(.2, 1.2, n) * (1 - ss(EXIT + 1.5, EXIT + 1.6, n)) * A;
  /* уход: пример виден только в кружках на местах точек сетки-сонара, кружки мельчают до точек, потом пример гаснет в сетку */
  if (window.GTSONAR) GTSONAR.halftone(R, ss(EXIT, EXIT + .8, n));
  R.style.opacity = 1 - (window.GTSONAR ? ss(EXIT + .8, EXIT + 1.6, n) : ss(EXIT, EXIT + 1.6, n));
  vis($('#x4-scene'), sceneA);
  const key = n.toFixed(4) + '|' + A.toFixed(3);
  if (sceneA > .004 && key !== X.key) { X.key = key; scene(n, A); }
  /* живые сцены рисуются каждый кадр: фразы и стена плывут сами */
  fx.style.opacity = sceneA; if (sceneA > .004) fxPaint(n); else vis(phone, 0);

  const done = n > TOTAL - .15;
  kl.classList.toggle('ex', X.ph === 1 && !done); kl.classList.toggle('exd', done);
}
function scene(n, A) {
  /* подпись: на границе отрезков старая гаснет, слова меняются, новая проявляется */
  let ci = 0; CAPS.forEach((cp, i) => { if (n >= cp[0]) ci = i; });
  const nb = CAPS.reduce((m, cp, i) => i ? Math.min(m, Math.abs(n - cp[0])) : m, 9);
  if (ci !== X.cap) { X.cap = ci; $('#x4-n').textContent = CAPS[ci][1]; $('#x4-h').textContent = CAPS[ci][2]; $('#x4-p').textContent = CAPS[ci][3]; $('#x4-pg').textContent = 'ZERNO · брендбук · ' + CAPS[ci][1].slice(0, 2); }
  const cap = $('#x4-cap'), ci0 = ss(.5, 1.4, n);
  const gone = 1 - ss(EXIT, EXIT + .6, n);
  cap.style.opacity = ci0 * clamp(nb / .22) * gone; cap.style.transform = `translateY(${(1 - ci0) * 16}px)`;
  $('#x4-pg').style.opacity = gone; R.style.setProperty('--line', `rgba(255,255,255,${(.12 * gone).toFixed(3)})`);
  $('#x4-stage').style.transform = `translateY(${(1 - ss(.2, 1.2, n)) * 24}px)`;
  paint(n); book(n);
  const nr = n; n = remap(n);

  /* 3. Цвет: красный растёт из середины знака до краёв экрана, потом сжимается в красную плашку палитры */
  const fl = $('#x4-flood'), grow = ss(7.6, 9.2, n), shrink = ss(9.6, 11, n), flA = grow > 0 ? (1 - ss(12.4, 12.9, n)) * A : 0;
  vis(fl, flA);
  if (flA > .004) {
    if (shrink <= 0) fl.style.clipPath = `circle(${grow * (Math.hypot(G.W, G.H) + 40)}px at ${G.mx}px ${G.my}px)`;
    else { const [t, r, b, l] = G.chip; fl.style.clipPath = `inset(${t * shrink}px ${r * shrink}px ${b * shrink}px ${l * shrink}px)`; }
  }
  const palOut = 1 - ss(12.4, 12.9, n);
  CHIPS.forEach((ch, i) => {
    const k = i ? ss(10.2 + i * .25, 10.9 + i * .25, n) : ss(10.8, 11.3, n);
    vis(ch, k * palOut); ch.style.transform = i ? `translateY(${(1 - k) * 30}px)` : '';
  });
  R.classList.toggle('red', grow > .5 && shrink < .5);
  $('#x4-scene .tag').style.opacity = .5 * ss(1, 2, nr) * gone;
  /* «Брендбук · PDF» виден со знака до проверки и снова, когда книга собрана */
  $('#x4-get').style.opacity = Math.max(ss(1.2, 2, n) * (1 - ss(23.8, 24.3, n)), ss(G3 + 3.4, G3 + 4, nr) * (1 - ss(EXIT, EXIT + .3, nr)));
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
kl.addEventListener('click', e => { if (X.on && !e.target.closest('button,a,input,#air-foot,#dial,#x4-sd')) next(); });
/* На телефоне пример листается пальцем вверх и вниз */
let ty = null;
/* слой примера не ловит касания (pointer-events: none), поэтому палец ловим на всём экране «Клиентов», кроме кнопок, ссылок и шкалы */
kl.addEventListener('pointerdown', e => { if (X.on && e.pointerType === 'touch' && !e.target.closest('button,a,input,#dial,#air-foot')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { BOOK.ready = false; if (X.on) layout(); });
/* слово и подписи листа рисуются шрифтами страницы, поэтому лист перерисовывается, когда шрифты догрузились */
document.fonts?.load(`500 100px ${WORD}`).then(() => { if (X.on) layout(); }).catch(() => {});
document.fonts?.ready.then(() => { if (X.on) layout(); });

/* «Брендбук · PDF»: окно примера и разговор про бренд */
const sd = $('#x4-sd');
let sdBack = null;
$('#x4-get').addEventListener('click', e => { sdBack = e.currentTarget; sd.hidden = false; $('#x4-sd-x').focus(); });
$('#x4-sd-x').addEventListener('click', () => { sd.hidden = true; sdBack?.focus(); });
$('#x4-sd-go').addEventListener('click', () => { sd.hidden = true; api.onTalk?.(); });
sd.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); sd.hidden = true; sdBack?.focus(); } });

/* цвет станции для эфира: чёрный, как у остальных станций с примером */
/* Узлы сетки листа: в них складывается сетка-сонар, когда начинается пример. Столбцами, как точки сонара. */
function dots() {
  /* только в начале: в уходе сетка встаёт из растра на своих местах */
  if (!X.on || X.uc * TOTAL > 3) return null;
  const kr = kl.getBoundingClientRect(), r = cv.getBoundingClientRect(), out = [];
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) out.push([r.left - kr.left + r.width * i / 20, r.top - kr.top + r.height * j / 20]);
  return out;
}
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0], notch: TOTAL });
/* grid: ход перехода сетки-сонара, 0 сетка на надписи, 1 точки в узлах листа. В начале идёт по первому щелчку, в уходе обратно с GO до конца. */
Object.defineProperty(api, 'grid', { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } });
/* пример всегда на тёмном или красном фоне, поэтому буквы сайта белые, пока пример включён */
Object.defineProperties(api, { dark: { get: () => X.on }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on }) } });
return api;
})();
