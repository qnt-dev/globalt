/* «Каждый день»: финал мира «Клиенты» после примера «Сайт». Кофейня ZERNO выдумана, такой кофейни нет.
   Мысль: четыре станции показывают, как сделан бренд. Финал показывает, зачем: бренд живёт в руках у человека каждый день.
   Ход по шкале u от 0 до 100, это 40 щелчков колеса:
   0–2,5  бумага закрывает карточку «Сайта»;
   1–16   пульс «до и после»: ровная линия входит в чашку, выходит пульсом;
   16–20  руки вырастают снизу, проявляется утро;
   20–62  шесть состояний дня по 7 делений, у каждого своя подпись; дождь и снег кодом, над чашкой пар;
   62–66  вывод: «Кофе за 20 минут или быстрее»;
   66–70  фон уходит в бумагу, руки встают в середину кольца напитков;
   70–86  кольцо напитков, напиток можно нажать;
   86–100 «Coffee time»: «o» — чёрная чашка сверху, точка над «i» — знак ZERNO, внизу кнопка разговора.
   Связь с app.js: step() каждый кадр из updateAir; wheel() из колеса мира — раньше «Сайта», пока финал идёт, и после «Сайта», когда тот кончился.
   onTalk открывает разговор. Разметку модуль строит сам.
   Картинки лежат в assets/kofe: руки с чашкой и шесть фонов нарисованы нейросетью по нашим промтам (review/obrazy/prompty.md),
   знак на чашке поставлен по брендбуку ZERNO; напитки меню; зерно бумаги. */
window.GTFIN = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const win = (u, a, b, f = 1.2) => Math.min(ss(a - f / 2, a + f / 2, u), 1 - ss(b - f / 2, b + f / 2, u));
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const h1 = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = v => { const i = Math.floor(v), f = v - i, q = f * f * (3 - 2 * f); return h1(i) * (1 - q) + h1(i + 1) * q; };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const api = { onTalk: null };
const TOTAL = 40, INK = '#1b1a1c', RED = '#df1f12', PAPER = '#ecebe6';

/* ---------- данные ---------- */
/* фоны: файл, где резать широкий (fy) и узкий (fx) экран, цвет пара; lt — тёмный фон, подписи и шапка светлые */
const BG = [
  { f: 'utro', fy: .55, st: [26, 26, 28], k: '06:40', h: 'Утром, когда не выспались.' },
  { f: 'dozhd', fy: 0, st: [22, 22, 24], k: '09:15', h: 'В дождь.' },
  { f: 'zima', fy: .1, st: [22, 22, 24], k: '−20°', h: 'В минус двадцать.' },
  { f: 'den', fy: .4, st: [22, 22, 24], k: '13:10', h: 'Когда всё получается.' },
  { f: 'vecher', fy: .3, fx: .35, st: [22, 22, 24], k: '19:30', h: 'Вечером после работы.' },
  { f: 'noch', fy: .2, fx: .72, st: [240, 238, 233], k: '03:00', h: 'В три часа ночи.', lt: 1 },
];
const DR = [
  ['espresso', 'Эспрессо', 'Коротко и по делу.'], ['amerikano', 'Американо', 'Чтобы хватило на всё утро.'],
  ['flet-uait', 'Флэт уайт', 'Больше кофе, меньше молока.'], ['latte', 'Латте', 'Мягкий, на долгий разговор.'],
  ['raf', 'Раф', 'Сливки и ваниль.'], ['kold-bryu', 'Колд брю', 'Холодный, настоянный за ночь.'],
  ['matcha', 'Матча', 'Бодрость без кофе.'], ['kakao', 'Какао', 'С зефиром, как в детстве.'],
  ['chai', 'Чай', 'Листовой, в стеклянном чайнике.'], ['syrniki', 'Сырники', 'Со сметаной и ягодами.'],
  ['kruassan', 'Круассан', 'Утренний, хрустит.'],
];
const MENU_H = 'Нажмите на напиток.', MENU_P = 'Любой привезём за 20 минут или быстрее.';
const CAPS = [
  { a: -2, b: 16.6, k: 'ZERNO · кофейня-пример', h: 'До — ровная линия. После — пульс.', p: 'Так работает хороший кофе. И хороший бренд.' },
  ...BG.map((g, i) => ({ a: 19.4 + 7 * i, b: 26.5 + 7 * i, k: g.k, h: g.h })),
  { a: 62.5, b: 67.5, k: 'ZERNO', h: 'Кофе за 20 минут или быстрее.', p: 'В любое время и в любую погоду. Бренд, который держат в руках каждый день.' },
  { a: 70.5, b: 86.6, k: 'Меню ZERNO', h: MENU_H, p: MENU_P, menu: 1 },
];
/* остановки щелчка по пустому месту: конец пульса, каждый фон, вывод, кольцо, «Coffee time» */
const STOPS = [0, 16, 23.5, 30.5, 37.5, 44.5, 51.5, 58.5, 65, 76, 100].map(v => v / 100);

/* ---------- разметка ---------- */
const R = document.createElement('div');
R.id = 'x6'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Кофе ZERNO каждый день. Пример, такой кофейни нет');
R.innerHTML = `<canvas id="x6-cv" aria-hidden="true"></canvas>
<div id="x6-caps">${CAPS.map(o => `<div class="x6-cap"><small>${o.k}</small><h3>${o.h}</h3>${o.p ? `<p>${o.p}</p>` : ''}</div>`).join('')}</div>
<div id="x6-ring">${DR.map((d, i) => `<button type="button" class="x6-d" data-i="${i}" aria-pressed="false">${d[1]}</button>`).join('')}</div>
<div id="x6-cta"><small>Пример. Такой кофейни нет</small><h3>Сделаем так же для вашего бизнеса.</h3><button type="button" class="btn" id="x6-go"><span>Обсудить проект</span></button></div>`;
kl.append(R);
const cv = $('#x6-cv'), c = cv.getContext('2d');
const capEl = [...R.querySelectorAll('.x6-cap')], menuCap = CAPS.findIndex(o => o.menu), DB = [...R.querySelectorAll('.x6-d')];

/* ---------- картинки: грузятся, когда «Сайт» близко к концу; при ошибке сети ещё две попытки ---------- */
const IM = {}; let asked = false;
const load = (k, src, n = 0) => new Promise(r => { const i = new Image(); i.onload = () => { IM[k] = i; r(); }; i.onerror = () => n < 2 ? setTimeout(() => load(k, src, n + 1).then(r), 400 * (n + 1)) : r(); i.src = src + (n ? '?r=' + n : ''); });
function ask() {
  if (asked) return; asked = true;
  /* по три картинки за раз, в порядке показа: девятнадцать запросов сразу Windows иногда обрывает (ERR_NO_BUFFER_SPACE) */
  const Q = [['ruki', 'ruki.webp'], ['grain', 'grain.png'], ...BG.map(g => [g.f, g.f + '.webp']), ...DR.map(d => [d[0], 'd-' + d[0] + '.webp'])];
  const run = () => { const it = Q.shift(); return it ? load(it[0], 'assets/kofe/' + it[1]).then(run) : null; };
  Promise.all([run(), run(), run()]).then(() => { G.pat = null; G.ct = null; });
}

/* ---------- размеры ---------- */
const G = { W: 0, H: 0, D: 1, top: 56, pat: null, ct: null, narrow: false };
const IMG = 1254, CUP = { x: 624, y: 611 };          // сторона картинки рук и середина кофе в её пикселях
function layout() {
  const kr = kl.getBoundingClientRect(), bar = document.getElementById('bar');
  G.W = Math.max(1, kr.width || innerWidth); G.H = Math.max(1, kr.height || innerHeight); G.narrow = G.W < 700;
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom - kr.top : 56);
  G.D = Math.min(devicePixelRatio || 1, 1.5);
  cv.width = Math.round(G.W * G.D); cv.height = Math.round(G.H * G.D);
  R.style.setProperty('--top', G.top + 'px'); G.pat = null; G.ct = null;
}
addEventListener('resize', () => { if (F.vis) layout(); });
/* места рук: у пульса, на фонах (входят снизу), в кольце */
function P1() { const { W, H } = G, S = Math.min(H * .9, G.narrow ? W * .95 : W * 1.25); return { S, ox: W / 2 - 626 / IMG * S, oy: H * (G.narrow ? .63 : .6) - 690 / IMG * S }; }
function P2() { const { W, H } = G, S = Math.min(H * 1.45, W * 2); return { S, ox: (W - S) / 2, oy: H - S * 1000 / IMG }; }
function RING() { const { W, H } = G, r = Math.min(W * .4, H * .36); return { r, cx: W > 1000 ? W * .6 : W / 2, cy: W > 1000 ? H * .53 : H * .6, ds: r * .5 }; }
function P3() { const R0 = RING(), S = R0.r * 2.6; return { S, ox: R0.cx - 620 / IMG * S, oy: R0.cy - 770 / IMG * S }; }
const mixP = (a, b, t) => ({ S: lerp(a.S, b.S, t), ox: lerp(a.ox, b.ox, t), oy: lerp(a.oy, b.oy, t) });
function place(u) {
  if (u < 16) return P1(); if (u < 20) return mixP(P1(), P2(), ss(16, 20, u));
  if (u < 66) return P2(); if (u < 70) return mixP(P2(), P3(), ss(66, 70, u)); return P3();
}

/* ---------- пульс «до и после» ---------- */
function ecgY(ph) {
  ph -= Math.floor(ph);
  const g = (m, w, h) => h * Math.exp(-(((ph - m) / w) ** 2));
  return g(.16, .035, -.1) + g(.3, .012, .12) + g(.34, .014, -1) + g(.38, .016, .32) + g(.62, .06, -.2);
}
/* линия углём: основной штрих и тонкий второй рядом */
function charcoal(path, w, al) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = `rgba(27,26,28,${.85 * al})`; c.lineWidth = w; path(0, 0); c.stroke();
  c.strokeStyle = `rgba(27,26,28,${.35 * al})`; c.lineWidth = w * .5; path(.7, -.5); c.stroke();
}
function drawECG(u, t, E) {
  const { W, H } = G, P = P1(), k = P.S / IMG, y0 = P.oy + 690 * k, xl = P.ox + 400 * k, xr = P.ox + 850 * k;
  const a = ss(1, 5, u), b = ss(5, 12, u), amp = Math.min(H * .15, P.S * .17), per = Math.max(56, Math.min(170, W * .11));
  const flat = x => y0 + (noise(x * .04) - .5) * 1.4;
  const L = xl * a;
  if (L > 1) charcoal((dx, dy) => { c.beginPath(); for (let x = 0; x <= L; x += 3) { const y = flat(x) + dy; x ? c.lineTo(x + dx, y) : c.moveTo(dx, y); } }, 2.2, E);
  /* пульс: пока листают — перо ведёт линию, потом бежит по кругу, как на мониторе */
  const span = W - xr, done = b >= 1 && !RM;
  const pen = done ? xr + ((t * per * 1.1) % span) : xr + span * b, gap = done ? Math.max(28, per * .45) : 0;
  const yy = x => y0 + ecgY((x - xr) / per - .08) * amp * clamp((x - xr) / 24);
  const seg = (from, to) => charcoal((dx, dy) => { c.beginPath(); for (let x = from; x <= to; x += 2) { const y = yy(x) + dy; x === from ? c.moveTo(x + dx, y) : c.lineTo(x + dx, y); } }, 2.2, E);
  if (b > 0) { if (done) { seg(xr, pen); if (pen + gap < W) seg(pen + gap, W); } else seg(xr, pen); }
  if ((b > 0 && b < 1) || done) { c.fillStyle = `rgba(223,31,18,${E})`; c.beginPath(); c.arc(pen, yy(pen), 3.2, 0, 7); c.fill(); }
  c.font = '500 11px "JetBrains Mono", monospace'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.fillStyle = `rgba(27,26,28,${.55 * E * ss(2, 3.5, u)})`; c.fillText('ДО КОФЕ', Math.max(16, Math.min(xl * .25, 80)), y0 - 16);
  c.fillStyle = `rgba(27,26,28,${.55 * E * ss(6, 7.5, u)})`; c.textAlign = 'right';
  c.fillText('ПОСЛЕ КОФЕ', W - Math.max(16, Math.min(W * .04, 56)), y0 + amp * .45 + 22); c.textAlign = 'left';
}

/* ---------- пар над чашкой: струйки шума, прерывистый штрих бежит вверх ---------- */
const STR = [
  { x0: -26, seed: 1.7, a: 1, hh: 1, n: 4 }, { x0: 16, seed: 5.3, a: .85, hh: .86, n: 4 },
  { x0: -58, seed: 9.1, a: .55, hh: .62, n: 3 }, { x0: 50, seed: 13.9, a: .6, hh: .7, n: 3 },
];
function steam(t, P, col, al, hk) {
  const k = P.S / IMG, by = P.oy + CUP.y * k, cs = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`;
  c.lineCap = 'round';
  for (const s of STR) {
    const Hs = 420 * s.hh * hk, breath = .45 + .55 * noise(t * .23 + s.seed * 7);
    const g = c.createLinearGradient(0, by, 0, by - Hs * k);
    g.addColorStop(0, `rgba(${cs},0)`); g.addColorStop(.08, `rgba(${cs},${al * s.a * breath})`);
    g.addColorStop(.35, `rgba(${cs},${al * s.a * breath * .8})`); g.addColorStop(1, `rgba(${cs},0)`);
    c.strokeStyle = g;
    for (let j = 0; j < s.n; j++) {
      c.beginPath();
      for (let h = 0; h <= Hs; h += 5) {
        const q = h / Hs, n1 = noise(h * .0105 - t * .5 + s.seed) - .5, n2 = noise(h * .027 - t * 1.05 + s.seed * 3.1) - .5;
        const sway = 16 * Math.pow(q, 1.6) * Math.sin(t * .31 + s.seed);
        const fan = (j - (s.n - 1) / 2) * (1.4 + q * 7) + (noise(h * .05 + j * 17 - t * .8) - .5) * 3 * (1 + q * 2);
        const X = P.ox + (CUP.x + s.x0 * (1 - q * .3) + (5 + h * .2) * 2 * n1 + 12 * q * n2 + sway + fan) * k, Y = P.oy + (CUP.y - h) * k;
        h ? c.lineTo(X, Y) : c.moveTo(X, Y);
      }
      const dk = k * 1.6; c.lineWidth = Math.max(.6, (1.25 - j * .12) * dk);
      c.setLineDash([22 * dk, 7 * dk, 46 * dk, 10 * dk, 13 * dk, 6 * dk, 30 * dk, 12 * dk]);
      c.lineDashOffset = -t * 34 * dk - j * 19 * dk - s.seed * 40; c.stroke();
    }
  }
  c.setLineDash([]);
}

/* ---------- фоны, дождь, снег ---------- */
function bgRect(g) {
  const im = IM[g.f]; if (!im) return null;
  const { W, H } = G, s = Math.max(W / im.naturalWidth, H / im.naturalHeight), bw = im.naturalWidth * s, bh = im.naturalHeight * s;
  return [(W - bw) * (g.fx ?? .5), (H - bh) * g.fy, bw, bh];
}
function drawBG(i, a) { const g = BG[i], r = bgRect(g); if (!r || a <= 0) return; c.globalAlpha = a; c.drawImage(IM[g.f], ...r); c.globalAlpha = 1; }
const DROPS = Array.from({ length: 200 }, (_, i) => ({ x: h1(i * 3.1 + 1), y: h1(i * 7.7 + 2), s: .55 + .9 * h1(i * 1.3 + 3) }));
const many = () => Math.round(DROPS.length * clamp(G.W * G.H / 1.3e6, .35, 1));
function rain(t, a) {
  if (a <= .01) return;
  const { W, H } = G, r = bgRect(BG[1]), top = r ? r[1] + r[3] * .13 : 0, n = many();
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const d = DROPS[i], y = ((d.y + t * (.55 + .5 * d.s)) % 1) * (H + 80) - 40, x = d.x * (W + 120) - 60 + y * .1, len = 14 + 16 * d.s;
    if (y < top) continue;
    c.strokeStyle = `rgba(36,36,40,${(.12 + .2 * d.s) * a})`; c.lineWidth = .6 + .6 * d.s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - len * .1, y - len); c.stroke();
  }
}
function snow(t, a) {
  if (a <= .01) return;
  const { W, H } = G, n = many();
  for (let i = 0; i < n; i++) {
    const d = DROPS[i], y = ((d.y + t * (.035 + .05 * d.s)) % 1) * (H + 20) - 10;
    const x = ((d.x + .02 * Math.sin(t * .6 + i)) % 1 + 1) % 1 * W, r = (.8 + 1.8 * d.s) * Math.max(.8, H / 900);
    c.fillStyle = `rgba(255,255,255,${.9 * a})`; c.strokeStyle = `rgba(60,60,64,${.22 * a})`; c.lineWidth = .7;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  }
}

/* ---------- кольцо напитков: рисунки на холсте, над ними прозрачные кнопки (клавиатура и чтение с экрана) ---------- */
let hover = -1, sel = -1;
function ringPos(i) { const R0 = RING(), a = -Math.PI / 2 + i * 2 * Math.PI / DR.length; return [R0.cx + R0.r * Math.cos(a), R0.cy + R0.r * Math.sin(a), R0.ds]; }
function drawRing(u) {
  const out = 1 - ss(86, 88.5, u); if (out <= 0 || u < 69.5) return;
  DR.forEach((d, i) => {
    const im = IM[d[0]]; if (!im) return;
    const e = ss(70 + i * .45, 71.4 + i * .45, u); if (e <= 0) return;
    const [x, y, ds] = ringPos(i), sc = (.7 + .3 * e) * (i === hover || i === sel ? 1.08 : 1);
    const k = ds * sc / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    c.globalAlpha = e * out * (sel >= 0 && sel !== i ? .38 : 1); c.globalCompositeOperation = 'multiply';
    c.drawImage(im, x - w / 2, y - h / 2, w, h); c.globalCompositeOperation = 'source-over';
    if (!G.narrow || i === sel) {
      c.font = `500 ${G.narrow ? 11 : 12}px Montserrat, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillStyle = i === sel ? RED : INK; c.globalAlpha *= i === sel || i === hover ? 1 : .55;
      c.fillText(d[1], x, y + ds * .5 + 6);
    }
    c.globalAlpha = 1;
  });
}
function placeButtons(live) {
  R.classList.toggle('ring', live);
  if (!live) return;
  DB.forEach((b, i) => { const [x, y, ds] = ringPos(i); Object.assign(b.style, { left: x - ds * .55 + 'px', top: y - ds * .55 + 'px', width: ds * 1.1 + 'px', height: ds * 1.1 + 'px' }); });
}
function select(i) {
  sel = i; const el = capEl[menuCap], h = el.querySelector('h3'), p = el.querySelector('p');
  if (i < 0) { h.textContent = MENU_H; p.textContent = MENU_P; } else { h.textContent = DR[i][1] + '.'; p.textContent = DR[i][2] + ' Привезём за 20 минут или быстрее.'; }
  DB.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
}
DB.forEach((b, i) => {
  b.addEventListener('click', e => { e.stopPropagation(); select(i === sel ? -1 : i); });
  b.addEventListener('pointerenter', () => { hover = i; }); b.addEventListener('pointerleave', () => { if (hover === i) hover = -1; });
  b.addEventListener('focus', () => { hover = i; }); b.addEventListener('blur', () => { if (hover === i) hover = -1; });
});

/* ---------- знак ZERNO, как в брендбуке: зерно 31 × 44 под углом 24°, разрез Z толщиной 8 ---------- */
const AZ = 24 * Math.PI / 180;
function thick(P, w) {
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
  const L = [], Q = [];
  P.forEach((p, i) => {
    let m;
    if (i === 0) m = nrm(P[0], P[1]); else if (i === P.length - 1) m = nrm(P[i - 1], P[i]);
    else { const a = nrm(P[i - 1], P[i]), b = nrm(P[i], P[i + 1]), s = [a[0] + b[0], a[1] + b[1]], l = Math.hypot(...s), q = [s[0] / l, s[1] / l], d = 1 / (q[0] * a[0] + q[1] * a[1]); m = [q[0] * d, q[1] * d]; }
    L.push([p[0] + m[0] * w, p[1] + m[1] * w]); Q.push([p[0] - m[0] * w, p[1] - m[1] * w]);
  });
  return [...L, ...Q.reverse()];
}
const ZP = thick([[-42, -16], [11, -16], [-11, 16], [42, 16]], 4), MBH = 2 * Math.hypot(31 * Math.sin(AZ), 44 * Math.cos(AZ));
function zmark(x, y, h, col) {
  const s = h / MBH; c.save(); c.translate(x, y); c.rotate(AZ); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, 31, 44, 0, 0, 7); c.clip();                     // разрез Z длиннее зерна: без обрезки он торчит наружу
  c.beginPath(); c.ellipse(0, 0, 31, 44, 0, 0, 7); c.moveTo(...ZP[0]); ZP.slice(1).forEach(p => c.lineTo(...p)); c.closePath(); c.fill('evenodd'); c.restore();
}

/* ---------- «Coffee time» ---------- */
function roughCircle(x, y, R0, seed, w, al) {
  const r = rng(seed), a0 = r() * 6.28, ph = r() * 6.28, n = 72;
  c.strokeStyle = `rgba(27,26,28,${al})`; c.lineWidth = w; c.beginPath();
  for (let i = 0; i <= n + 4; i++) { const a = a0 + i / n * 6.2832, rr = R0 * (1 + Math.sin(a * 3 + ph) * .007 + (r() - .5) * .006); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.stroke();
}
/* чёрный стакан сверху, углём: тень, светлый ободок, кофе со штриховкой и бликом */
function sketchCup(x, y, R0) {
  const sh = c.createRadialGradient(x + R0 * .14, y + R0 * .18, R0 * .6, x + R0 * .14, y + R0 * .18, R0 * 1.35);
  sh.addColorStop(0, 'rgba(20,18,20,.3)'); sh.addColorStop(1, 'rgba(20,18,20,0)'); c.fillStyle = sh; c.beginPath(); c.arc(x + R0 * .14, y + R0 * .18, R0 * 1.35, 0, 7); c.fill();
  c.fillStyle = '#f2f0eb'; c.beginPath(); c.arc(x, y, R0, 0, 7); c.fill();
  const cr = R0 * .83, g = c.createRadialGradient(x - cr * .25, y - cr * .3, cr * .1, x, y, cr);
  g.addColorStop(0, '#2e2927'); g.addColorStop(.7, '#181516'); g.addColorStop(1, '#0d0b0c'); c.fillStyle = g; c.beginPath(); c.arc(x, y, cr, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(x, y, cr, 0, 7); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
  for (let i = -cr * 2; i < cr * 2; i += Math.max(3, R0 * .055)) { c.beginPath(); c.moveTo(x + i, y - cr); c.lineTo(x + i + cr * .8, y + cr); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = R0 * .05; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, cr * .7, Math.PI * 1.08, Math.PI * 1.4); c.stroke();
  const ish = c.createRadialGradient(x + cr * .1, y + cr * .12, cr * .7, x, y, cr); ish.addColorStop(0, 'rgba(0,0,0,0)'); ish.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = ish; c.fillRect(x - cr, y - cr, cr * 2, cr * 2);
  c.restore();
  roughCircle(x, y, R0, 11, Math.max(1.6, R0 * .03), .9); roughCircle(x, y, R0 * 1.004, 17, Math.max(.8, R0 * .012), .45);
  roughCircle(x, y, cr, 23, Math.max(1.2, R0 * .02), .8); roughCircle(x, y, R0 * .92, 29, Math.max(.6, R0 * .01), .35);
}
function sketchBean(x, y, a, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = 'rgba(20,18,20,.16)'; c.beginPath(); c.ellipse(a * .12, a * .2, a, a * .68, 0, 0, 7); c.fill();
  const g = c.createRadialGradient(-a * .3, -a * .3, a * .1, 0, 0, a); g.addColorStop(0, '#55504c'); g.addColorStop(1, '#1b191a');
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, a, a * .68, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(27,26,28,.9)'; c.lineWidth = Math.max(1, a * .07); c.stroke();
  c.strokeStyle = '#e9e6e0'; c.lineWidth = a * .12; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-a * .8, a * .02); c.bezierCurveTo(-a * .3, -a * .22, a * .3, a * .22, a * .8, -a * .02); c.stroke();
  c.restore();
}
/* раскладка: на телефоне две строки, иначе одна. Место «o» в «Coffee» шире — там стоит чашка */
function coffeeLayout() {
  const { W, H } = G, narrow = G.narrow, lines = narrow ? ['Coffee', 'time'] : ['Coffee time'], font = s => `800 ${s}px "Science Gothic"`;
  /* меряем от обычной базовой линии: подписи кольца перед этим ставят её сверху, и высота «x» вышла бы отрицательной */
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.font = font(100); const xh0 = c.measureText('x').actualBoundingBoxAscent;
  const wide0 = xh0 * .62 * 2.25 + 4;
  const w0 = Math.max(...lines.map(l => c.measureText(l).width - c.measureText('o').width + wide0));
  let F = 100 * Math.min(narrow ? W * .86 : W * .74, 1180) / w0; F = Math.min(F, narrow ? 150 : 230);
  c.font = font(F);
  const xh = c.measureText('x').actualBoundingBoxAscent, R0 = xh * .62;
  const base0 = H * (narrow ? .3 : .43), lh = F * .98, L = [], boxes = [];
  let cupAt = null, dotAt = null;
  lines.forEach((text, li) => {
    const wide = text.indexOf('o'), adv = [...text].map(ch => c.measureText(ch).width);
    const widths = adv.map((w, i) => i === wide ? R0 * 2.25 + 4 : w), total = widths.reduce((a, b) => a + b, 0);
    let x = (W - total) / 2; const base = base0 + li * lh;
    [...text].forEach((ch, i) => {
      if (i === wide) cupAt = [x + widths[i] / 2, base - xh / 2];
      else if (ch !== ' ') {
        L.push({ ch, x, base, n: L.length });
        const m = c.measureText(ch); boxes.push([x, base - m.actualBoundingBoxAscent, x + widths[i], base + m.actualBoundingBoxDescent]);
        if (ch === 'i') dotAt = [x + widths[i] / 2, base - xh - F * .27 * .62];   // знак над ножкой «i» с зазором
      }
      x += widths[i];
    });
  });
  /* зёрна рассыпаются от чашки мимо букв: на компьютере вниз-влево, на телефоне вверх, на пустую бумагу над словом */
  const r = rng(4), beans = [], avoid = boxes.concat([[cupAt[0] - R0, cupAt[1] - R0, cupAt[0] + R0, cupAt[1] + R0]]);
  let tries = 0;
  while (beans.length < 7 && tries++ < 6000) {
    const a = (narrow ? -Math.PI * .66 : Math.PI * .7) + (r() - .5) * (narrow ? 1.2 : 1.7), d = R0 * (1.2 + 1.9 * Math.pow(r(), 1.3));
    const x = cupAt[0] + Math.cos(a) * d, y = cupAt[1] + Math.sin(a) * d, s = F * .055 * (.75 + .5 * r());
    if (avoid.some(b => x > b[0] - s && x < b[2] + s && y > b[1] - s && y < b[3] + s)) continue;
    avoid.push([x - s, y - s, x + s, y + s]); beans.push({ x, y, s, ang: r() * 6.28, n: beans.length });
  }
  return { F, xh, font: font(F), L, cupAt, dotAt, R: R0, beans, sub: base0 + (lines.length - 1) * lh + F * .55, dotH: F * .27 };
}
function drawCoffee(u) {
  if (u < 87.5) return;
  const T = G.ct || (G.ct = coffeeLayout()); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = T.font;
  T.L.forEach(g => {
    const e = ss(88 + g.n * .28, 89.2 + g.n * .28, u); if (e <= 0) return;
    c.globalAlpha = e; c.fillStyle = INK; c.save(); c.translate(0, (1 - e) * T.F * .12);
    if (g.ch === 'i') { c.beginPath(); c.rect(g.x - 4, g.base - T.xh - T.F * .02, T.F, T.F); c.clip(); }
    c.fillText(g.ch, g.x, g.base); c.restore();
  });
  c.globalAlpha = 1;
  T.beans.forEach(b => { const e = ss(91.2 + b.n * .2, 92.2 + b.n * .2, u); if (e > 0) { c.globalAlpha = e; sketchBean(b.x, b.y, b.s * (.6 + .4 * e), b.ang); c.globalAlpha = 1; } });
  const ec = ss(88.6, 90.4, u);
  if (ec > 0) { c.save(); c.globalAlpha = ec; c.translate(T.cupAt[0], T.cupAt[1]); c.scale(1.25 - .25 * ec, 1.25 - .25 * ec); sketchCup(0, 0, T.R); c.restore(); c.globalAlpha = 1; }
  const ed = ss(90.6, 91.6, u);
  if (ed > 0 && T.dotAt) { c.globalAlpha = ed; zmark(T.dotAt[0], T.dotAt[1] - (1 - ed) * T.F * .5, T.dotH, RED); c.globalAlpha = 1; }
  const es = ss(92.2, 93.4, u);
  if (es > 0) { c.globalAlpha = es * .8; c.fillStyle = INK; c.textAlign = 'center'; c.font = `italic 500 ${Math.round(Math.max(20, T.F * .24))}px Cormorant, Georgia, serif`; c.fillText('Привезём за 20 минут или быстрее.', G.W / 2, T.sub); c.globalAlpha = 1; }
}

/* ---------- состояние и кадр ---------- */
/* on — финал держит колесо; vis — финал виден (после отпускания колеса он ещё доезжает до нуля); end — когда «Сайт» встал в конец */
const F = { on: false, vis: false, u: 0, uc: 0, goal: null, edge: 0, end: 0, ink: false, t0: performance.now() };
const siteDone = () => { const s = window.GTSITE && GTSITE.state; return !!(s && s.on && s.u >= 1); };
function setOp(el, o) { if (Math.abs((el._o ?? -1) - o) < .005) return; el._o = o; el.style.opacity = o.toFixed(3); el.style.visibility = o > .004 ? 'visible' : 'hidden'; }
function reset() {
  Object.assign(F, { on: false, vis: false, u: 0, uc: 0, goal: null, ink: false, end: 0 }); hover = -1; select(-1);
  R.classList.remove('on', 'ring'); setOp(R, 0);
}
/* c: near — ручка у станции «Сайт» */
function step(dt, cx) {
  if (!cx.near) { if (F.vis || F.on || F.u) reset(); return; }
  const s = window.GTSITE && GTSITE.state, now = performance.now();
  if (s && s.on && s.u > .6) ask();
  F.end = siteDone() ? F.end || now : 0;
  if (F.goal != null) { const sp = (RM ? 9 : .14) * dt, d = F.goal - F.u; F.u = Math.abs(d) <= sp ? F.goal : F.u + Math.sign(d) * sp; if (F.u === F.goal) F.goal = null; }
  F.uc = RM || Math.abs(F.uc - F.u) < 2e-4 ? F.u : lerp(F.uc, F.u, clamp(dt * 7));
  const vis = F.on || F.uc > 5e-4;
  if (vis && !F.vis) { R.classList.add('on'); layout(); }
  if (!vis && F.vis) { R.classList.remove('on', 'ring'); setOp(R, 0); F.ink = false; }
  F.vis = vis; if (!vis) return;
  draw(F.uc * 100, RM ? 3 : (now - F.t0) / 1000);
}
function draw(u, t) {
  const { W, H, D } = G, OA = ss(0, 2.5, u);
  setOp(R, OA);
  c.setTransform(D, 0, 0, D, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  /* фоны: два соседних, второй проявляется в конце своего отрезка */
  const A = ss(16, 20, u) * (1 - ss(66, 70, u));
  const f = clamp((u - 20) / 7, 0, 5), bi = Math.min(5, Math.floor(f)), bt = bi < 5 ? ss(.84, 1, f - bi) : 0, cur = BG[bt > .5 ? bi + 1 : bi];
  if (A > 0) {
    drawBG(bi, A); if (bt > 0) drawBG(bi + 1, A * bt);
    const wOf = j => (bi === j ? 1 - bt : 0) + (bi + 1 === j ? bt : 0);
    rain(t, A * wOf(1)); snow(t, A * wOf(2));
    /* под подписью мягкое пятно бумаги, на ночи — тьмы: подпись читается на любом рисунке */
    const R0 = Math.min(Math.max(W * .62, 420), 900), cy0 = G.top - 40, col = cur.lt ? '16,16,18' : '236,234,230', k = cur.lt ? .72 : .88;
    const g = c.createRadialGradient(0, cy0, 0, 0, cy0, R0);
    g.addColorStop(0, `rgba(${col},${k * A})`); g.addColorStop(.45, `rgba(${col},${k * .8 * A})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(0, 0, R0, R0 + cy0);
  }
  const E = 1 - ss(16, 18.5, u); if (E > 0) drawECG(u, t, E);
  /* руки и пар; в кольце пар ниже и тише, чтобы не залезать на верхний напиток */
  const P = place(u), HA = 1 - ss(86, 88.5, u);
  if (HA > 0 && IM.ruki) {
    const nx = BG[bi + 1] || BG[bi], st = BG[bi].st.map((v, j) => lerp(v, nx.st[j], bt)).map((v, j) => lerp([26, 26, 28][j], v, A)), inR = ss(66, 70, u);
    c.globalAlpha = HA; c.drawImage(IM.ruki, P.ox, P.oy, P.S, P.S); c.globalAlpha = 1;
    steam(t, P, st, .58 * HA * (1 - .45 * inR), 1 - .45 * inR);
  }
  drawRing(u); drawCoffee(u);
  /* зерно бумаги и тёплый тон бумаги поверх всего */
  if (IM.grain) {
    if (!G.pat) G.pat = c.createPattern(IM.grain, 'repeat');
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = .45; c.fillStyle = G.pat; c.fillRect(0, 0, W, H);
    c.globalAlpha = 1; c.fillStyle = 'rgb(255,252,248)'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  }
  /* подписи, кнопки кольца, кнопка разговора; шапка сайта тёмная на бумаге и светлая на ночи */
  const lt = A > .5 && !!cur.lt; R.classList.toggle('lt', lt); F.ink = OA > .5 && !lt;
  CAPS.forEach((o, i) => setOp(capEl[i], win(u, o.a, o.b)));
  const live = u > 72 && u < 86; placeButtons(live);
  if (!live && sel >= 0 && (u < 70 || u > 87)) select(-1);
  setOp($('#x6-cta'), ss(94, 96, u));
}

/* ---------- колесо и палец ---------- */
/* Колесо вперёд после конца «Сайта»: карточка «Сайта» стоит секунду, потом финал. Пока карточка стоит, ручка не уходит дальше.
   Колесо назад в начале финала держится 0,45 секунды и отдаёт ход «Сайту». В конце финала колесо дальше не ведёт. */
function wheel(dy) {
  if (!dy) return false;
  const now = performance.now();
  if (!F.on) {
    if (dy <= 0 || !siteDone()) return false;
    if (!F.end || now - F.end < 1000) return true;
    F.on = true; ask(); if (!F.vis) { R.classList.add('on'); layout(); F.vis = true; }
  }
  F.goal = null;
  if (dy > 0 && F.u >= 1) return true;
  /* финал отпускает колесо на этом же щелчке, но щелчок не отдаёт: человек сначала видит карточку «Сайта» */
  if (dy < 0 && F.u <= 0) { if (now - F.edge < 450) return true; F.on = false; return true; }
  F.u = clamp(F.u + dy / (100 * TOTAL));
  if (F.u <= 0) F.edge = now;
  return true;
}
/* щелчок по пустому месту: следующий отрезок. На карточке «Сайта» после его конца щелчок открывает финал */
function next() {
  if (!F.on) { if (!siteDone() || !F.end) return; F.on = true; ask(); }
  const n = STOPS.find(v => v > F.u + .005); if (n != null) F.goal = n;
}
kl.addEventListener('click', e => {
  if (e.target.closest('button,a,input,#dial,#air-foot,dialog')) return;
  if (F.vis || (siteDone() && F.end && performance.now() - F.end > 600)) next();
});
$('#x6-go').addEventListener('click', e => { e.stopPropagation(); if (api.onTalk) api.onTalk(); });
/* на телефоне финал листается пальцем; пример «Сайта» в это время палец не трогает (site.js смотрит на GTFIN.on) */
let ty = null;
kl.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && (F.on || siteDone()) && !e.target.closest('button,a,input,#dial,#air-foot')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; if (F.on || d > 0) wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
document.fonts?.load('800 100px "Science Gothic"').then(() => { G.ct = null; }).catch(() => {});

Object.assign(api, { step, wheel, reset, next, select, notch: TOTAL });
Object.defineProperties(api, {
  on: { get: () => F.on }, vis: { get: () => F.vis }, ink: { get: () => F.ink },
  state: { get: () => ({ u: +F.u.toFixed(3), on: F.on, vis: F.vis, sel }) },
  /* для проверок: поставить финал на деление шкалы u (0–100) */
  jump: { value: u => { F.on = true; ask(); F.goal = null; F.u = F.uc = clamp(u / 100); } },
});
return api;
})();
