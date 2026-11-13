/* «Люди» → «Как мы работаем»: проявка. Пока листаются пять шагов подбора, человек проявляется, а число «виден на N %» растёт.
   01 Разговор — белый контур (рисунок p1), 02 Вакансия — крупный штрих, 03 Отбор — тонкий штрих, 04 Дорога и 05 Замена — фото проступает точками до чистого.
   Штрих свой, из фото (p4): линии под 45°, как ромбы системы, толщина линии — яркость фото. Так на чёрном он позитивный: светлое лицо — толстые
   светлые линии, тени — тонкие. Рисунки штриха со старого сайта (p2, p3) на чёрном читались бы негативом: в них линии стоят в тенях.
   Слои штриха приходят диагональной шторкой, фото — точками растра 7 px, тем же, из которого вырастают заголовки глав.
   Слева шаги; их линия кончается на документе «Работаем официально»: строка на шаг, подпись в начале 05, на 100 % ложится печать-ромб. Справа число.
   Если шаги с текстами не входят по высоте (ноутбук, 1024×768), шаги идут списком, а текст показан только у текущего (класс .cmp).
   Прокрутка сразу даёт состояние, назад — обратно. Сцена липнет к экрану на время шагов; ни размеры, ни места элементов не меняются. */
(() => {
'use strict';
const pt = document.querySelector('.pt'); if (!pt) return;
const st = pt.querySelector('.pt-st'), cv = pt.querySelector('.pt-f canvas'), cx = cv.getContext('2d');
const dEl = pt.querySelector('.pt-d'), dIc = pt.querySelector('.pt-dk'), nEl = pt.querySelector('.pt-n'), hl = pt.querySelector('.pt-h'), caps = [...pt.querySelectorAll('.pt-c span')], pps = [...pt.querySelectorAll('.pt-p span')], sEl = pt.querySelector('.pt-s'), ol = pt.querySelector('.pt-o'), lis = [...ol.children];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const FLOW = matchMedia('(min-width:761px) and (max-height:600px)'), ROW = matchMedia('(max-width:760px),(min-width:761px) and (max-aspect-ratio:4/5)');
const K = [0, 20, 40, 65, 90, 100];               /* число в начале каждого шага и в конце */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
pt.classList.add('js'); pt.classList.remove('full');

/* ---------- картинки (контур и фото, 56 КБ): грузятся, когда глава в экране от нас ---------- */
const IM = []; let ready = false, vis = false;
function load() {
  if (IM.length) return;
  ['p1', 'p4'].forEach((n, i) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { if (IM.every(x => x.complete && x.naturalWidth)) { ready = true; bake(); paint(true); } }; IM[i] = im; im.src = 'assets/photo/' + n + '.webp'; });
}
new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis) { load(); size(); sched(); } }), { rootMargin: '100% 0px' }).observe(pt);

/* ---------- заготовки под размер холста ---------- */
let side = 0, dpr = 1, S = 0, n = 0, cs = 7, cells = [], P, Cw, LC, LF, Mk, lastQ = -1;
const mk = () => document.createElement('canvas');
const sz = (c, w) => { c.width = c.height = w; return c; };
const ctx2 = c => c.getContext('2d', { willReadFrequently: true });
/* контур: линии рисунка (чёрное на белом) становятся белыми линиями на прозрачном */
function contour(img) {
  const c = sz(mk(), S), g = ctx2(c); g.drawImage(img, 0, 0, S, S); const d = g.getImageData(0, 0, S, S), a = d.data;
  for (let i = 0; i < a.length; i += 4) { a[i + 3] = 255 - (a[i] * .299 + a[i + 1] * .587 + a[i + 2] * .114); a[i] = a[i + 1] = a[i + 2] = 255; }
  g.putImageData(d, 0, 0); return c;
}
/* штрих: светлые линии под 45° с шагом pitch (CSS px), полуширина линии = яркость фото × половина шага; фон фото (почти чёрный) — без линий.
   opaque: чёрная подложка, чтобы тонкий штрих закрывал крупный там, где он уже пришёл */
function screen(lum, pitch, opaque) {
  const c = sz(mk(), S), g = ctx2(c), d = g.createImageData(S, S), a = d.data, pp = pitch * dpr, k = Math.SQRT1_2;
  for (let y = 0, i = 0; y < S; y++) for (let x = 0; x < S; x++, i += 4) {
    const w = lum[y * S + x] * pp * .5, m = ((x + y) * k) % pp, dd = Math.min(m, pp - m), al = w <= 0 ? 0 : clamp(w - dd + .5) * Math.min(1, w * 2);   /* тонкая линия гаснет, а не остаётся полупрозрачной нитью */
    a[i] = a[i + 1] = a[i + 2] = Math.round(236 * al); a[i + 3] = opaque ? 255 : Math.round(255 * al);
    if (!opaque) a[i] = a[i + 1] = a[i + 2] = 236;
  }
  g.putImageData(d, 0, 0); return c;
}
function bake() {
  if (!ready) return;
  side = cv.clientWidth; if (!side) return;            /* вид спрятан: ResizeObserver позовёт снова */
  dpr = Math.min(2, devicePixelRatio || 1); S = Math.round(side * dpr); sz(cv, S);
  n = Math.max(24, Math.floor(side / 7)); cs = side / n;
  P = sz(mk(), S); const pg = ctx2(P); pg.drawImage(IM[1], 0, 0, S, S);
  const pd = pg.getImageData(0, 0, S, S).data, lum = new Float32Array(S * S);
  for (let j = 0, i = 0; j < lum.length; j++, i += 4) { const l = (pd[i] * .299 + pd[i + 1] * .587 + pd[i + 2] * .114) / 255; lum[j] = sstep(.05, .14, l) * Math.pow(l, .8); }
  Cw = contour(IM[0]); LC = screen(lum, 7, false); LF = screen(lum, 3.5, true); Mk = sz(mk(), S);
  { const fd = pg.createLinearGradient(0, .8 * S, 0, S); fd.addColorStop(0, '#000'); fd.addColorStop(.55, 'rgba(0,0,0,.45)'); fd.addColorStop(1, 'rgba(0,0,0,0)');
    pg.globalCompositeOperation = 'destination-in'; pg.fillStyle = fd; pg.fillRect(0, 0, S, S); pg.globalCompositeOperation = 'source-over'; }   /* низ фото растворяется в чёрном: без прямого обреза футболки */
  const g4 = (() => { const c = sz(mk(), n), g = ctx2(c); g.drawImage(IM[1], 0, 0, n, n); return g.getImageData(0, 0, n, n).data; })();
  cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = (r * n + c) * 4, l = (g4[i] * .299 + g4[i + 1] * .587 + g4[i + 2] * .114) / 255;
    if (l > .03) cells.push({ x: (c + .5) * cs, y: (r + .5) * cs, L: Math.pow(l, .85) });
  }
  lastQ = -1; size();
}
/* вид показан или сменился размер: сразу пересчитать сцену (вид мог быть спрятан при загрузке), картинки — чуть позже */
new ResizeObserver(() => { if (cv.clientWidth) { size(); paint(true); } clearTimeout(bake.t); bake.t = setTimeout(() => { bake(); paint(true); }, 120); }).observe(cv);
if (document.fonts) document.fonts.ready.then(() => { size(); paint(true); });

/* ---------- прокрутка → q от 0 до 5 (по шагу на единицу) ---------- */
let H = 0, PIN = 0, S0 = 1, dK = [];
function size() {
  H = st.offsetHeight; PIN = Math.max(1, pt.offsetHeight - H);
  const cvTop = cv.getBoundingClientRect().top - st.getBoundingClientRect().top;
  S0 = Math.max(.25 * H, .85 * innerHeight - cvTop);
  /* шаги с текстами не входят по высоте — компактный список (только при смене размера, не при прокрутке) */
  if (!ROW.matches && !FLOW.matches && H) {
    const cs = getComputedStyle(st), room = H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    pt.classList.remove('cmp'); pt.classList.toggle('cmp', sEl.offsetHeight > room);
  } else pt.classList.remove('cmp');
  /* заливка линии шагов доходит до ромба шага, когда шаг начинается */
  /* линия шагов: от первого ромба до верха документа (на телефоне шаги в строку, там своя линия) */
  const s0 = sEl.getBoundingClientRect().top;
  dK = lis.map(li => li.querySelector('.pt-k').getBoundingClientRect().top - s0 + 7); dK.push(dIc.getBoundingClientRect().top - s0);
  if (!ROW.matches) { sEl.style.setProperty('--lt', dK[0] + 'px'); sEl.style.setProperty('--lh', Math.max(0, dK[5] - dK[0]) + 'px'); }
  /* ширина числа — по «100»: число растёт, а знак % стоит на месте */
  nEl.style.setProperty('--nw', '0px'); const t = nEl.textContent; nEl.textContent = '100'; const w = nEl.offsetWidth; nEl.textContent = t; nEl.style.setProperty('--nw', w + 'px');
}
function progress() {
  if (FLOW.matches) { const r = cv.getBoundingClientRect(); return 5 * clamp((.85 * innerHeight - r.top) / (.7 * innerHeight)); }
  const top = pt.getBoundingClientRect().top;
  return top > 0 ? clamp((S0 - top) / S0) : 1 + 4 * clamp(-top / PIN);
}

/* ---------- рисунок ---------- */
function wipe(k) {          /* шторка по диагонали сверху слева: позади фронта слой есть, впереди нет, край мягкий */
  const g = Mk.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S);
  const b = .3, a = k * (1 + b) - b, e = k * (1 + b), gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(clamp(a), 'rgba(255,255,255,1)'); gr.addColorStop(clamp(e), 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S); return g;
}
function dots(t) {          /* фото точками растра: светлые клетки (лицо) раньше, тени позже; позади — клетка целиком */
  const g = Mk.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = cs * .74; g.beginPath();
  for (const c of cells) {
    const r = R * clamp((t - (1 - c.L) * .55) / .45); if (r < .25) continue;
    if (r >= R - .01) g.rect(c.x - cs / 2, c.y - cs / 2, cs, cs); else { g.moveTo(c.x + r, c.y); g.arc(c.x, c.y, r, 0, 6.2832); }
  }
  g.fillStyle = '#fff'; g.fill(); g.setTransform(1, 0, 0, 1, 0, 0); return g;
}
function layer(img, k, alpha, op, mask) {
  if (k <= 0 || alpha <= .004) return;
  cx.globalAlpha = alpha; cx.globalCompositeOperation = op;
  if (k >= 1) { cx.drawImage(img, 0, 0); return; }
  const g = mask(k); g.globalCompositeOperation = 'source-in'; g.drawImage(img, 0, 0); cx.drawImage(Mk, 0, 0);
}
function draw(q) {
  if (!S || !P) return;
  /* фото проступает точками за два последних шага (65 → 100 %): к 90 % лицо уже ясно, тени и волосы смыкаются к 100 % — последний шаг тоже меняет картинку */
  const s = [0, 1, 2, 3, 4].map(i => clamp(q - i)), t = clamp((q - 3) / 2), lines = 1 - sstep(0, .4, t);
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, S, S);
  if (q >= 4.998) { cx.drawImage(P, 0, 0); return; }
  layer(LC, s[1], lines, 'source-over', wipe);                    /* 02 крупный штрих */
  layer(LF, s[2], lines, 'source-over', wipe);                    /* 03 тонкий штрих закрывает крупный */
  layer(Cw, s[0], (1 - .6 * s[1]) * (1 - s[2]), 'lighten', wipe); /* 01 белый контур; уходит, когда штрих становится тонким */
  layer(P, t, 1, 'source-over', dots);                            /* 04–05 фото точками; к концу точки смыкаются в чистое фото */
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}

/* ---------- число, подписи, шаги ---------- */
let lastN = -1, lastA = -1;
function paint(force) {
  const q = progress();
  if (!force && Math.abs(q - lastQ) < .002) return; lastQ = q;
  const i = Math.min(4, Math.floor(q)), N = Math.round(K[i] + (K[i + 1] - K[i]) * (q - i)), a = Math.min(4, Math.floor(q));
  if (N !== lastN) { nEl.textContent = N; hl.style.setProperty('--n', (N / 100).toFixed(3)); pt.classList.toggle('full', N === 100); lastN = N; }
  if (a !== lastA) { caps.forEach((c, k) => c.classList.toggle('on', k === a)); pps.forEach((c, k) => c.classList.toggle('on', k === a)); lis.forEach((li, k) => { li.classList.toggle('on', k === a); li.classList.toggle('past', k < a); }); lastA = a; }
  let f; if (lastN === 100) f = 1; else if (ROW.matches || !dK.length) f = q / 5; else { const fr = q - i, y = dK[i] + (dK[i + 1] - dK[i]) * (q >= 5 ? 1 : fr); f = (y - dK[0]) / Math.max(1, dK[5] - dK[0]); }
  sEl.style.setProperty('--f', clamp(f).toFixed(4));
  /* документ: строка на шаг (01–04), подпись в начале 05; печать ложится на 100 % (класс .full) */
  if (dEl) for (let k = 0; k < 5; k++) dEl.style.setProperty('--d' + (k + 1), (k < 4 ? clamp(q - k) : clamp((q - 4) / .8)).toFixed(3));
  draw(q);
}
let raf = 0;
function sched() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (vis) paint(false); }); }
addEventListener('scroll', sched, { passive: true });
addEventListener('resize', () => { size(); paint(true); });

/* шаг по нажатию: страница плавно встаёт на середину этого шага (обычная прокрутка, колесо не перехватываем) */
ol.addEventListener('click', e => {
  const li = e.target.closest('li'); if (!li) return; const k = lis.indexOf(li) + 1;
  size(); const docTop = scrollY + pt.getBoundingClientRect().top;
  const y = FLOW.matches ? scrollY + cv.getBoundingClientRect().top - .85 * innerHeight + .7 * innerHeight * (k - .5) / 5
    : k === 1 ? docTop - .5 * S0 : docTop + (k - 1.5) * PIN / 4;
  scrollTo({ top: Math.max(0, y), behavior: RM ? 'instant' : 'smooth' });
});
size(); paint(true);
window.__pt = { progress, paint, size, get q() { return lastQ; }, geo: () => ({ S0, PIN, flow: FLOW.matches, top: scrollY + pt.getBoundingClientRect().top }) };
})();
