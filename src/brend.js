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
/* Уход — зеркало начала: 30,6–31,5 знак распадается на точки в узлах листа, 31,5–33 точки разлетаются в сетку-сонар (GO — начало разлёта). */
const TOTAL = 33.2, EXIT = 30.6, GO = 31.5;
const STOPS = [0, 4.8, 7.2, 12, 15, 18.6, 23.4, 27.6, TOTAL].map(n => n / TOTAL);
const CAPS = [
  [0, '01 · Знак', 'Знак', 'Зерно разрезано буквой Z. Каждая линия стоит на своём месте.'],
  [7.4, '02 · Цвет', 'Цвет', 'Красный ZERNO видно с другой стороны улицы.'],
  [12.2, '03 · Буквы', 'Буквы', 'Слово собрано из тех же квадратов, что и сайт кофейни.'],
  [15.2, '04 · Правила', 'Правила', 'Где знак кончается, каким он бывает самым маленьким и как его нельзя менять.'],
  [18.8, '05 · Носители', 'Везде', 'Один знак на стакане, пакете, в рекламе, на сайте и в профиле.'],
  [23.8, '06 · Проверка', 'Узнали?', 'На экране только угол и три квадрата.'],
  [25.9, '06 · Проверка', 'ZERNO', 'Хватило трёх квадратов и красного цвета.']
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
  </div></div>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>
<div id="x4-sd" role="dialog" aria-modal="true" aria-labelledby="x4-sd-t" hidden><div class="bx"><small>Пример</small><h3 id="x4-sd-t">Здесь заказчик получит брендбук</h3><p>Знак, цвета, буквы, правила и&nbsp;носители в&nbsp;одном файле. По&nbsp;нему любой подрядчик сделает стакан или вывеску одинаково.</p><div class="bt"><button type="button" id="x4-sd-x">Понятно</button><button type="button" id="x4-sd-go">Обсудить бренд</button></div></div></div>`;
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
  ZW.h = 0; X.key = '';
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
function matrix(c, n, a) {
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
/* 7. Проверка: значок ZERNO крупными квадратами. Сначала видны красный угол и три квадрата зерна, потом все, потом чёткий знак. */
const ICON = { n: 7, q: null, lit: null };
function icon(c, x, y, s, a) {
  if (a <= .004) return;
  c.globalAlpha = a; c.fillStyle = RED; c.fillRect(x, y, s, s); c.globalAlpha = 1;
  mark(c, x + s / 2, y + s / 2, s * .74 / BH, a, WHITE);
}
function iconCells() {
  if (ICON.q) return;
  const N = ICON.n, big = document.createElement('canvas'), sm = document.createElement('canvas');
  big.width = big.height = N * 40; icon(big.getContext('2d'), 0, 0, N * 40, 1);
  sm.width = sm.height = N; const s = sm.getContext('2d', { willReadFrequently: true }); s.imageSmoothingQuality = 'high'; s.drawImage(big, 0, 0, N, N);
  const d = s.getImageData(0, 0, N, N).data; ICON.q = [];
  for (let i = 0; i < N * N; i++) ICON.q.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  /* три квадрата зерна — самые светлые; красный угол — левый верхний */
  const bean = ICON.q.map((v, i) => [v[0] + v[1] + v[2], i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(v => v[1]);
  ICON.lit = new Set([0, 1, N, ...bean]);
}
function drawCheck(c, n) {
  const a = ss(24.4, 24.9, n);
  if (a <= .004) return;
  iconCells();
  const N = ICON.n, S = 700, q = S / N, x0 = 150, y0 = 150, all = ss(25.9, 26.5, n), sharp = ss(26.5, 27.2, n);
  ICON.q.forEach(([r, g, b], i) => {
    const k = (ICON.lit.has(i) ? 1 : all) * a * (1 - sharp);
    if (k <= .004) return;
    c.globalAlpha = k; c.fillStyle = `rgb(${r},${g},${b})`; c.fillRect(x0 + (i % N) * q + 4, y0 + Math.floor(i / N) * q + 4, q - 8, q - 8);
  });
  c.globalAlpha = 1;
  /* Уход: знак распадается на точки в узлах листа, как растр. Кружки в узлах сжимаются от сплошного знака до точек сетки, точки белеют,
     потом белые точки отдаются сетке-сонару, и она разлетается из листа на весь экран. */
  const hz = ss(EXIT, EXIT + .7, n), wt = ss(EXIT + .4, GO, n);
  if (hz <= 0) { icon(c, x0, y0, S, sharp); return; }
  if (wt < 1) { c.save(); c.beginPath(); nodes(c, lerp(36, dotR(), hz)); c.clip(); icon(c, x0, y0, S, sharp * (1 - wt)); c.restore(); }
  matrix(c, n, ss(EXIT + .3, GO, n) * (1 - ss(GO, GO + .21, n)));
}
function paint(n) {
  const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(G.U, 0, 0, G.U, 0, 0);
  if (n < 8.2) drawSign(c, n);
  if (n > 12.5 && n < 15.6) drawWord(c, n);
  if (n > 15.3 && n < 19.3) drawRules(c, n);
  drawCarry(c, n);
  if (n > 24.3) drawCheck(c, n);
}


const X = { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '' };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '' });
  R.classList.remove('on'); $('#x4-sd').hidden = true;
  ['#x4-bg', '#x4-scene', '#x4-flood'].forEach(s => vis($(s), 0));
  kl.classList.remove('ex', 'exd');
}
/* c: near — ручка у станции «Бренд», tuned — станция настроена, alpha — насколько станция слышна */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); layout(); }
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
  vis($('#x4-bg'), ss(.1, 1, n) * (1 - ss(EXIT + .3, EXIT + .9, n)) * A);
  const sceneA = ss(.2, 1.2, n) * (1 - ss(GO + .22, GO + .3, n)) * A;
  vis($('#x4-scene'), sceneA);
  const key = n.toFixed(4) + '|' + A.toFixed(3);
  if (sceneA > .004 && key !== X.key) { X.key = key; scene(n, A); }

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
  paint(n);

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
  $('#x4-scene .tag').style.opacity = .5 * ss(1, 2, n) * gone;
  $('#x4-get').style.opacity = ss(1.2, 2, n) * (1 - ss(23.8, 24.3, n));
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
R.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.target.closest('button,a')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) layout(); });
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
  if (!X.on) return null;
  const kr = kl.getBoundingClientRect(), r = cv.getBoundingClientRect(), out = [];
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) out.push([r.left - kr.left + r.width * i / 20, r.top - kr.top + r.height * j / 20]);
  return out;
}
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0] });
/* grid: ход перехода сетки-сонара, 0 сетка на надписи, 1 точки в узлах листа. В начале идёт по первому щелчку, в уходе обратно с GO до конца. */
Object.defineProperty(api, 'grid', { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - clamp((n - GO) / 1.5); } });
/* пример всегда на тёмном или красном фоне, поэтому буквы сайта белые, пока пример включён */
Object.defineProperties(api, { dark: { get: () => X.on }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on }) } });
return api;
})();
