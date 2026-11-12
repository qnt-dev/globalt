/* «Клиенты» → «Услуги»: поле «сто одинаковых». Сто серых точек мигают в такт — их не отличить. Одна из них — ваша.
   Четыре этапа по очереди делают с ней то, что делает услуга, и этапы копятся:
   01 бренд — точка становится оранжевым знаком и перестаёт мигать в такт со всеми;
   02 SMM — к знаку тянутся подписчики со всего поля (линии);
   03 реклама — от знака расходятся круги и находят тех, кто рядом;
   04 сайт — от подписчиков и найденных к знаку идут заказы.
   Поле само перебирает этапы, пока его видно. Наведение, касание или фокус на строке показывает её этап. */
(() => {
'use strict';
const root = document.querySelector('.sv2'); if (!root) return;
const cv = root.querySelector('canvas'), cx = cv.getContext('2d'), rows = [...root.querySelectorAll('.svc li')];
const cap = root.querySelector('.fc-cap'), num = k => root.querySelector(`[data-n="${k}"]`), NF = num('f'), NR = num('r'), NO = num('o');
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const CAP = ['Сто одинаковых: вас не отличить', 'Бренд: вас узнают с одного взгляда', 'SMM: на вас подписываются', 'Реклама: вас находят рядом, когда ищут', 'Сайт: вам пишут и заказывают'];
const DUR = [2600, 3600, 3800, 4200, 5600];       /* сколько держится каждый этап при самостоятельном показе, мс */
const N = 10, MI = 5 * N + 3, NFOL = 18, RA = 3.4;  /* сетка 10×10; ваша точка — 6-я строка, 4-й столбец; подписчиков 18; радиус «рядом» в шагах сетки */
const OR = [255, 92, 10];

/* случайность с семенем: поле одинаковое при каждом показе */
let seed = 11; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const D = []; for (let i = 0; i < N * N; i++) D.push({ i, c: i % N, r: (i / N) | 0, w: 0, f: 0, hit: 0 });
const M = D[MI], dist = d => Math.hypot(d.c - M.c, d.r - M.r);
const pool = D.filter(d => d !== M); for (let i = pool.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
/* подписчики — по всему полю, но не вплотную к знаку: соцсети приводят издалека */
const FOL = pool.filter(d => dist(d) > 1.6).slice(0, NFOL); FOL.forEach((d, k) => d.fk = k);
/* «рядом» — круг вокруг знака: реклама на картах и в поиске находит соседей */
const NEAR = D.filter(d => d !== M && dist(d) <= RA);

let st = 0, t0 = 0, auto = true, resumeAt = 0, vis = false, last = 0, raf = 0, W = 0, H = 0, dpr = 1;
let b = 0, fol = 0, orders = 0, pulse = 0, lastRing = -1e9, lastPart = 0;
const rings = [], parts = [];

function size() {
  dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if (RM || !raf) draw(performance.now());
}
new ResizeObserver(size).observe(cv);

function set(s, manual) {
  /* выбранный рукой этап стоит, пока на строке курсор (или 9 с после касания); полоска над строкой — полная */
  if (manual) { auto = false; if (s) rows[s - 1].style.setProperty('--p', 1); }
  if (s === st) return;
  if (s === 0) orders = 0;
  st = s; t0 = performance.now();
  rows.forEach((li, k) => { li.classList.toggle('on', k + 1 === s); li.classList.toggle('past', k + 1 < s); if (k + 1 !== s) li.style.setProperty('--p', 0); });
  cap.textContent = CAP[s];
  if (!RM && cap.animate) cap.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
  /* без движения: этап показывается сразу в готовом виде */
  if (RM) { b = s >= 1 ? 1 : 0; fol = s >= 2 ? NFOL : 0; FOL.forEach(d => d.w = s >= 2 ? 1 : 0); NEAR.forEach(d => d.f = s >= 3 ? 1 : 0); draw(0); }
}
const hold = (s, ms) => { set(s, true); resumeAt = performance.now() + ms; };
rows.forEach((li, k) => {
  li.addEventListener('mouseenter', () => hold(k + 1, 1e9));
  li.addEventListener('focus', () => hold(k + 1, 1e9));
  li.addEventListener('click', () => hold(k + 1, 9000));
  li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(k + 1, 9000); } });
});
root.querySelector('.svc').addEventListener('mouseleave', () => { resumeAt = performance.now() + 1400; });
root.querySelector('.svc').addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) resumeAt = performance.now() + 1400; });

new IntersectionObserver(es => es.forEach(e => {
  vis = e.isIntersecting;
  if (vis && !raf && !RM) { last = performance.now(); if (auto && st === 4) set(0); t0 = last; raf = requestAnimationFrame(frame); }
}), { threshold: .3 }).observe(root);

const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const mix = (a, c, k) => a.map((v, i) => Math.round(v + (c[i] - v) * k));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function step(now, dt) {
  /* самостоятельный показ: этап держится DUR, потом следующий; после «Сайта» — снова сто одинаковых */
  if (!auto && now > resumeAt) { auto = true; t0 = now; }
  if (auto) {
    const p = Math.min(1, (now - t0) / DUR[st]); if (st) rows[st - 1].style.setProperty('--p', p.toFixed(3));
    if (p >= 1) set((st + 1) % 5);
  }
  /* бренд: точка становится знаком за 1,3 с */
  b = Math.max(0, Math.min(1, b + (st >= 1 ? 1 : -1.6) * dt / 1300));
  /* SMM: подписчики подключаются по одному (каждые 0,16 с), линия тянется от знака к точке */
  fol = st >= 2 ? Math.min(NFOL, fol + dt / 160) : Math.max(0, fol - dt / 40);
  FOL.forEach(d => { d.w = d.fk < fol ? Math.min(1, d.w + dt / 380) : Math.max(0, d.w - dt / 200); });
  /* реклама: круг каждые 1,5 с; фронт круга находит точки рядом — они вспыхивают и остаются светлыми */
  if (st >= 3 && now - lastRing > 1500) { rings.push(now); lastRing = now; }
  for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i] > 2300) rings.splice(i, 1);
  NEAR.forEach(d => {
    const dd = dist(d);
    rings.forEach(t => { const R = (now - t) / 2300 * (RA + .6); if (Math.abs(R - dd) < .22) { d.hit = 1; if (st >= 3) d.f = Math.max(d.f, .001); } });
    d.hit = Math.max(0, d.hit - dt / 500);
    d.f = st >= 3 ? (d.f > 0 ? Math.min(1, d.f + dt / 300) : 0) : Math.max(0, d.f - dt / 300);
  });
  /* сайт: от подписчиков и найденных к знаку идут заказы */
  if (st >= 4 && now - lastPart > 300) {
    const src = D.filter(d => d.w > .9 || d.f > .9); if (src.length) { parts.push({ d: src[(rnd() * src.length) | 0], t: now, T: 900 + rnd() * 600, k: (rnd() - .5) * .7 }); lastPart = now; }
  }
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; if (now - q.t > q.T) { parts.splice(i, 1); if (st >= 4) { orders++; pulse = 1; } } }
  if (st < 4) parts.length = 0;
  pulse = Math.max(0, pulse - dt / 600);
}

function draw(now) {
  if (!W || !H) return;
  const c = cx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const sp = Math.min(W, H) / N, ox = (W - sp * N) / 2 + sp / 2, oy = (H - sp * N) / 2 + sp / 2, r0 = Math.max(2.4, sp * .1);
  const P = d => [ox + d.c * sp, oy + d.r * sp], [mx, my] = P(M), e = ease(b);
  /* все одинаковые мигают в такт: так видно, что их не отличить */
  const beat = RM ? .75 : .66 + .2 * Math.sin(now / 620);
  /* бренд: линии построения знака видны, пока точка превращается в знак */
  const g = Math.sin(Math.PI * Math.min(1, Math.max(0, b))) * (b > 0 && b < 1 ? 1 : 0);
  if (g > .01) {
    c.strokeStyle = rgb([255, 255, 255], .22 * g); c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox - sp / 2, my); c.lineTo(ox + sp * (N - .5), my); c.moveTo(mx, oy - sp / 2); c.lineTo(mx, oy + sp * (N - .5)); c.stroke();
    c.beginPath(); c.arc(mx, my, sp * (.5 + .35 * e), 0, 7); c.stroke();
    c.strokeStyle = rgb(OR, .5 * g); c.strokeRect(mx - sp * .42, my - sp * .42, sp * .84, sp * .84);
  }
  /* SMM: линии от знака к подписчикам; линия дорастает до точки, пока та подключается */
  c.lineWidth = 1;
  FOL.forEach(d => {
    if (d.w <= 0) return; const [x, y] = P(d), k = ease(Math.min(1, d.w));
    c.strokeStyle = rgb([255, 255, 255], .16 * k + (d.w < 1 ? .25 * (1 - k) : 0));
    c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + (x - mx) * k, my + (y - my) * k); c.stroke();
  });
  /* реклама: круги от знака */
  rings.forEach(t => { const a = (now - t) / 2300, R = a * (RA + .6) * sp; c.strokeStyle = rgb(OR, .75 * (1 - a)); c.lineWidth = 1.5; c.beginPath(); c.arc(mx, my, R, 0, 7); c.stroke(); });
  /* точки */
  D.forEach(d => {
    if (d === M) return; const [x, y] = P(d);
    const w = Math.min(1, d.w), f = d.f, h = d.hit;
    let col = mix([74, 74, 80], [255, 255, 255], Math.max(w, h * .9)); col = mix(col, [178, 178, 186], f * (1 - w));
    const a = w > .5 || f > .5 ? 1 : beat * (1 - .35 * e) + Math.max(w, f, h) * .5;
    c.fillStyle = rgb(col, Math.min(1, a)); c.beginPath(); c.arc(x, y, r0 * (1 + .3 * w + .25 * f + .6 * h), 0, 7); c.fill();
  });
  /* сайт: заказы летят к знаку по дуге, у знака становятся оранжевыми */
  parts.forEach(q => {
    const [x0, y0] = P(q.d), dx = mx - x0, dy = my - y0, kx = x0 + dx / 2 - dy * q.k, ky = y0 + dy / 2 + dx * q.k;
    for (let s = 0; s < 5; s++) {
      const u = Math.max(0, Math.min(1, (now - q.t) / q.T - s * .035)), v = u * u * (3 - 2 * u);
      const x = (1 - v) * (1 - v) * x0 + 2 * (1 - v) * v * kx + v * v * mx, y = (1 - v) * (1 - v) * y0 + 2 * (1 - v) * v * ky + v * v * my;
      c.fillStyle = rgb(mix([255, 255, 255], OR, v), (1 - s / 5) * (u > 0 ? 1 : 0)); c.beginPath(); c.arc(x, y, r0 * (1.05 - s * .14), 0, 7); c.fill();
    }
  });
  /* знак: точка → ромб, серый → оранжевый; не мигает в такт с остальными */
  if (e > 0) { const gr = c.createRadialGradient(mx, my, 0, mx, my, sp * 1.3); gr.addColorStop(0, rgb(OR, .22 * e)); gr.addColorStop(1, rgb(OR, 0)); c.fillStyle = gr; c.fillRect(mx - sp * 1.3, my - sp * 1.3, sp * 2.6, sp * 2.6); }
  if (pulse > 0) { c.strokeStyle = rgb(OR, .7 * pulse); c.lineWidth = 1.5; c.beginPath(); c.arc(mx, my, sp * (.32 + .45 * (1 - pulse)), 0, 7); c.stroke(); }
  const s = r0 * Math.SQRT2 + (sp * .27 - r0 * Math.SQRT2) * e, side = s * Math.SQRT2, rad = side / 2 * (1 - e);
  c.save(); c.translate(mx, my); c.rotate(Math.PI / 4 * e);
  c.fillStyle = rgb(mix([74, 74, 80], OR, e), e > .02 ? 1 : beat); c.beginPath();
  if (c.roundRect) c.roundRect(-side / 2, -side / 2, side, side, rad); else c.rect(-side / 2, -side / 2, side, side);
  c.fill(); c.restore();
  /* счётчики под полем */
  const nf = FOL.filter(d => d.w > .9).length, nr = NEAR.filter(d => d.f > .9).length;
  if (NF.textContent != nf) NF.textContent = nf; if (NR.textContent != nr) NR.textContent = nr; if (NO.textContent != orders) NO.textContent = orders;
}

function frame(now) {
  const dt = Math.min(64, now - last); last = now;
  step(now, dt); draw(now);
  raf = vis ? requestAnimationFrame(frame) : 0;
}
cap.textContent = CAP[0];
window.__svc = { set, get st() { return st; }, D, FOL, NEAR };
})();
