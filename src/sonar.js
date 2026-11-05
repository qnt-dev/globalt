/* Сетка-сонар под чёрными надписями станций мира «Клиенты»: «Сайт», «Бренд», «Реклама», SMM.
   Точки стоят сеткой, по ним расходятся кольца: само по себе раз в 2,4 секунды и от каждого нажатия.
   Точка на кольце растёт и светлеет. По мотивам Sonar Grid (NIMA MZ, 21st.dev, лицензия MIT): числа те же, точки белые.
   Сетка не гаснет и не вспыхивает, а меняет форму:
   — ручка уходит со станции: точки дрожат и расходятся в шум, как буквы надписи. У станции они снова встают в сетку. Идёт по силе сигнала;
   — начало примера: точки по дуге слетаются в первую линию примера (dots), прорастают в ней чёрточками (trace) и отдаются примеру;
   — конец примера: пример распадается растром на кружки на местах точек сетки (halftone), кружки белеют, и это уже сетка;
   — «Сайт»: сетка встаёт за волной сонара от телефона в куче (после развала) и от стрелки шкалы (в конце примера, ping).
   Переходы примеров идут по шкале самого примера, а не по часам, поэтому колесо назад проводит их теми же кадрами обратно.
   Пример даёт: grid — ход перехода от 0 (сетка) до 1 (сетки нет, есть пример);
   dots() → [[x, y, tx, ty, h], …] в координатах #klienty: точка, направление её чёрточки и половина чёрточки;
   trace — { g, th, w, a, rgb, out }: как выросли чёрточки, как линия стала линией примера (толщина w, яркость a, цвет rgb), как она отдалась примеру;
   ping — [x, y], откуда идёт волна, если сетка встаёт за волной.
   Связь с app.js: frame({ q, ok, at, mod }) каждый кадр из updateAir, после шагов примеров. */
window.GTSONAR = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const RM = matchMedia('(prefers-reduced-motion:reduce)');
/* шаг сетки, радиус точки, яркость точки, раз в сколько секунд кольцо, скорость и ширина кольца, во сколько раз растёт точка */
const P = { gap: 26, dot: 1.4, base: .28, every: 2.4, speed: 260, ring: 90, amp: 2.2, max: 6, area: [.15, .2, .85, .8] };
/* переход: самая большая задержка дальней точки, насколько дуга уводит точку вбок, яркость точки, севшей в точку примера */
const MV = { lag: .4, curl: .22, land: .7 };
/* шум: как далеко точка уходит в шум, при какой силе сигнала сетки ещё нет и с какой она ровная.
   Сетка расходится, пока фон станции ещё тёмный: дальше эфирный шум светлый, и белых точек на нём не видно. */
const NZ = { far: 70, lo: .5, hi: .99 };
/* волна после развала плохого сайта: за сколько секунд она проходит экран и за сколько уходит обратно, ширина края, на котором точка проявляется */
const EC = { up: 1.5, down: .8, edge: 18 };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2;
const cv = document.createElement('canvas');
cv.id = 'sonar'; cv.setAttribute('aria-hidden', 'true');
kl.prepend(cv);
const c = cv.getContext('2d');
/* OX, OY: первая точка сетки. src: пример, в который сетка складывается. ok, rev, at: сетка разрешена, ход волны после развала и откуда она идёт. */
let W = 1, H = 1, OX = 0, OY = 0, sized = false, rings = [], next = 0, seeded = false, D = [], drawn = false, live0 = false;
let src = null, asg = null, ok = false, rev = 0, at = null, last = 0, M = 0;
function size() {
  const r = kl.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  cv.width = Math.round(W * d); cv.height = Math.round(H * d); c.setTransform(d, 0, 0, d, 0, 0);
  /* точки сетки по столбцам, у каждой два своих случайных числа: для задержки, дуги и шума */
  const nx = Math.ceil(W / P.gap) + 1, ny = Math.ceil(H / P.gap) + 1, h = v => v - Math.floor(v);
  OX = (W - (nx - 1) * P.gap) / 2; OY = (H - (ny - 1) * P.gap) / 2;
  D = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) D.push({ x: OX + i * P.gap, y: OY + j * P.gap, b: h(Math.sin(i * 39.346 + j * 11.135) * 24634.6345), n: h(Math.sin(i * 12.989 + j * 78.233) * 43758.5453), u: i / Math.max(1, nx - 1), v: j / Math.max(1, ny - 1) });
  sized = true; asg = null;
}
function add(x, y, t) { rings.push({ x, y, t }); while (rings.length > P.max) rings.shift(); }
/* живые кольца и сила кольца в точке: 0 вдали, 1 на гребне */
function live(t) {
  const life = (Math.hypot(W, H) + P.ring) / P.speed;
  rings = rings.filter(r => (t - r.t) / 1000 < life);
  return rings.map(r => { const s = (t - r.t) / 1000, rad = s * P.speed; return { x: r.x, y: r.y, rad, reach: rad + P.ring, fade: 1 - s / life }; });
}
function hot(x, y, L) {
  let k = 0;
  for (const r of L) {
    if (Math.abs(x - r.x) > r.reach || Math.abs(y - r.y) > r.reach) continue;
    const e = Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad);
    if (e >= P.ring) continue;
    const h = 1 - e / P.ring, v = h * h * (3 - 2 * h) * r.fade; if (v > k) k = v;
  }
  return k;
}
/* Волна: сетка встаёт за краем волны, которая идёт из точки o. p — ход волны от 0 до 1, на 1 край ушёл за экран.
   Точка проявляется на краю и за краем светится и растёт, как на гребне кольца. Q — яркость и радиус точки, волна их меняет. */
function wave(w, d, Q) {
  const e = w[1] - Math.hypot(d.x - w[0][0], d.y - w[0][1]);
  if (e <= 0) { Q[0] = 0; return; }
  const k = 1 - ss(0, P.ring * 1.3, e), a = ss(0, EC.edge, e);
  Q[0] = a * (Q[0] + (1 - Q[0]) * k * .85); Q[1] *= 1 + P.amp * k * a;
}
const reach = o => Math.max(Math.hypot(o[0], o[1]), Math.hypot(W - o[0], o[1]), Math.hypot(o[0], H - o[1]), Math.hypot(W - o[0], H - o[1])) + P.ring * 1.3 + EC.edge;
/* Точки рисуются пачками одной яркости: 64 ступени */
const B = [];
function put(x, y, r, a) { if (a < .008) return; const k = Math.min(64, Math.round(a * 64)); (B[k] || (B[k] = [])).push(x, y, r); }
function flush() {
  for (let k = 1; k < B.length; k++) {
    const b = B[k]; if (!b || !b.length) continue;
    c.globalAlpha = k / 64; c.beginPath();
    for (let i = 0; i < b.length; i += 3) { c.moveTo(b[i] + b[i + 2], b[i + 1]); c.arc(b[i], b[i + 1], b[i + 2], 0, Math.PI * 2); }
    c.fill(); b.length = 0;
  }
  c.globalAlpha = 1;
}
/* Сетка складывается в пример. Кто куда летит: экран сжимается в рамку точек примера, и каждая точка сетки берёт ближнюю точку примера на своём месте.
   Левые точки летят в левые, верхние в верхние: сетка не перемешивается, а сжимается в пример. Точке примера без своей точки сетки отдаётся точка у соседа,
   у которого их несколько. В каждую точку примера садится одна точка сетки, та, что прилетает первой. Остальные долетают и сливаются с ней.
   Считается один раз на переход. */
function assign(T) {
  asg = null;
  if (!T.length || !D.length) return;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cx = 0, cy = 0;
  for (const [x, y] of T) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); cx += x; cy += y; }
  cx /= T.length; cy /= T.length;
  const n = T.length, cnt = new Array(n).fill(0), at = D.map(d => [x0 + d.u * (x1 - x0), y0 + d.v * (y1 - y0)]);
  const to = at.map(([px, py]) => { let bi = 0, bd = Infinity; for (let k = 0; k < n; k++) { const q = (T[k][0] - px) ** 2 + (T[k][1] - py) ** 2; if (q < bd) { bd = q; bi = k; } } return bi; });
  to.forEach(k => cnt[k]++);
  for (let k = 0; k < n; k++) {
    if (cnt[k]) continue;
    let bi = -1, bd = Infinity;
    at.forEach(([px, py], i) => { if (cnt[to[i]] < 2) return; const q = (T[k][0] - px) ** 2 + (T[k][1] - py) ** 2; if (q < bd) { bd = q; bi = i; } });
    if (bi >= 0) { cnt[to[bi]]--; to[bi] = k; cnt[k]++; }
  }
  const lag = D.map(d => lagOf(d, cx, cy)), best = new Array(n).fill(-1), car = new Uint8Array(D.length);
  to.forEach((k, i) => { if (best[k] < 0 || lag[i] < lag[best[k]]) best[k] = i; });
  best.forEach(i => { if (i >= 0) car[i] = 1; });
  asg = { n, to, car };
}
/* дальние от примера точки летят позже ближних */
const lagOf = (d, cx, cy) => MV.lag * (.7 * Math.min(1, Math.hypot(d.x - cx, d.y - cy) / (Math.hypot(W, H) * .6)) + .3 * d.b);
/* Чёрточки на местах точек примера: на g = 0 это точки размером с точку сетки, потом они вытягиваются вдоль линии примера,
   на th = 1 у них толщина и яркость линии примера, out — линия отдалась примеру, у которого на том же месте такая же линия. */
function trace(T, tr, s) {
  const a = lerp(MV.land, tr.a, tr.th) * (1 - tr.out) * s;
  if (a <= .004) return;
  c.strokeStyle = tr.rgb ? `rgb(${tr.rgb.map(v => Math.round(lerp(255, v, tr.th))).join(',')})` : '#fff';
  c.globalAlpha = a; c.lineWidth = lerp(P.dot * 2, tr.w, tr.th); c.lineCap = 'round'; c.beginPath();
  for (const p of T) { const h = Math.max(.01, (p[4] || 0) * tr.g), dx = (p[2] ?? 1) * h, dy = (p[3] ?? 0) * h; c.moveTo(p[0] - dx, p[1] - dy); c.lineTo(p[0] + dx, p[1] + dy); }
  c.stroke(); c.globalAlpha = 1; c.strokeStyle = '#fff';
}
/* m — ход перехода примера, s — сила сигнала (1 ровная сетка, 0 шум) */
function paint(t, m, s, mod, tr) {
  c.clearRect(0, 0, W, H); c.fillStyle = '#fff';
  const T = m > 0 && mod.dots ? mod.dots() : null, has = T && T.length;
  if (has && (!asg || asg.n !== T.length || asg.to.length !== D.length)) assign(T);
  const fly = has && asg && m < 1, pg = m > 0 && !T && mod.ping || null;
  const wp = pg && [pg, (1 - m) * reach(pg)], wa = rev < 1 && at && [at, rev * reach(at)];
  /* растр на месте: пример рассыпался на точки сетки, сетка проявляется на тех же местах */
  const keep = m > 0 && !T && !pg ? 1 - m : 1, out = tr ? 1 : 1 - ss(.86, 1, m), cool = 1 - ss(0, .25, m);
  const L = cool > 0 ? live(t) : [], Q = [0, 0], f = 1 - s, fn = f, w = t * .001;
  let cx = 0, cy = 0;
  if (fly) { for (const p of T) { cx += p[0]; cy += p[1]; } cx /= T.length; cy /= T.length; }
  if (m < 1) for (let i = 0; i < D.length; i++) {
    const d = D[i];
    const k = L.length ? hot(d.x, d.y, L) * cool : 0;
    Q[0] = P.base + (1 - P.base) * k; Q[1] = P.dot * (1 + P.amp * k);
    if (wa) wave(wa, d, Q);
    if (wp) wave(wp, d, Q);
    let x = d.x, y = d.y, a = Q[0] * keep, r = Q[1];
    /* Шум: точка ходит по своей петле, дрожит и мерцает, как помехи. Чем хуже сигнал, тем дальше она уходит.
       Сначала точки ярче, как искры, у края шума тают. Дрожь меняется 20 раз в секунду. */
    if (f > 0) {
      const ph = d.b * 6.283 + w * (.8 + d.n * 1.4), j = Math.floor(w * 20), q = v => v - Math.floor(v);
      x += Math.cos(ph) * NZ.far * fn * (.35 + .65 * d.n) + (q(Math.sin(d.b * 91.7 + j * 12.9) * 4375.85) - .5) * 5 * f;
      y += Math.sin(ph * 1.37 + d.n * 3) * NZ.far * fn * (.35 + .65 * d.b) + (q(Math.sin(d.n * 57.3 + j * 7.3) * 2817.13) - .5) * 5 * f;
      a *= (1 + 1.4 * f) * ss(0, .4, s) * lerp(1, .45 + .55 * Math.sin(w * (9 + 14 * d.n) + d.b * 50), Math.min(1, f * 2.2)); r *= lerp(1, .6 + .9 * d.n, f);
    }
    /* полёт: по дуге в одну сторону, в полёте точка ярче */
    if (fly) {
      const [tx, ty] = T[asg.to[i]], aL = asg.car[i] ? MV.land : 0;
      const e = ease(clamp((m - lagOf(d, cx, cy)) / (1 - MV.lag))), fl = Math.sin(Math.PI * e), vx = tx - x, vy = ty - y, cu = fl * MV.curl * (.6 + .4 * d.b);
      x += vx * e - vy * cu; y += vy * e + vx * cu;
      a = Math.min(1, a + (aL * s - a) * e + .45 * fl * s) * out; r = lerp(r, P.dot, e) * (1 + .5 * fl);
    }
    put(x, y, r, a);
  }
  flush();
  if (tr && has && m >= 1) trace(T, tr, s);
}
const ping = () => { const [a, b, e, f] = P.area; return [W * (a + Math.random() * (e - a)), H * (b + Math.random() * (f - b))]; };
/* Кадр. q — сила сигнала станции от 0 до 1. ok — у станции есть сетка (у «Сайта» после развала). at() — откуда идёт волна, когда ok включился.
   mod — пример станции. */
function frame(o) {
  const t = performance.now(), dt = clamp((t - (last || t)) / 1000, 0, .1), rm = RM.matches; last = t;
  /* сетка, разрешённая не у настроенной станции, сразу целая: её покажет сигнал */
  if (o.ok !== ok) { ok = o.ok; if (ok && (rm || o.q < .92 || !o.at)) rev = 1; }
  rev = rm ? +ok : clamp(rev + (ok ? dt / EC.up : -dt / EC.down));
  if (o.at && rev < 1 && ok) { const p = o.at(); if (p) at = p; }
  const mod = o.mod || null;
  if (mod !== src) { src = mod; asg = null; }
  const m = mod ? clamp(mod.grid) : 0, tr = m > 0 && mod.trace || null, s = rm ? +(o.q > .92) : ss(NZ.lo, NZ.hi, o.q);
  M = m;
  if (!(s > 0 && rev > 0 && (m < 1 || (tr && tr.out < 1)))) {
    if (drawn) { c.clearRect(0, 0, W, H); drawn = false; }
    cv.classList.remove('on', 'mv'); live0 = false; asg = null; return;
  }
  if (!sized) size();
  if (!live0) {
    live0 = true; cv.classList.add('on');
    /* одно кольцо уже летит, когда сетка появилась */
    if (!seeded && !rm) { seeded = true; const [a, b, e, f] = P.area; add(W * (a + (e - a) * .68), H * (b + (f - b) * .34), t - 500); }
    next = Math.max(next, t + P.every * 1000);
  }
  cv.classList.toggle('mv', m > 0);
  if (m <= 0) asg = null;
  if (rm) rings = [];
  else if (m <= 0 && s > .9 && t >= next) { add(...ping(), t); next = t + P.every * 1000; }
  paint(t, m, s, mod, tr);
  drawn = true;
}
/* Растр для конца примера: el виден только в кружках на местах точек сетки. k 0 — растра нет, 1 — кружки размером с точку сетки.
   Площадь кружка убывает ровно, поэтому картинка тает в точки без рывка. */
function halftone(el, k) {
  const st = el.style;
  if (!(k > 0) || RM.matches) { if (st.maskImage || st.webkitMaskImage) st.maskImage = st.webkitMaskImage = ''; return; }
  if (!sized) size();
  const r0 = P.gap * .75, r = Math.sqrt(lerp(r0 * r0, P.dot * P.dot, k)), kr = kl.getBoundingClientRect(), er = el.getBoundingClientRect();
  st.maskImage = st.webkitMaskImage = `radial-gradient(circle at center,#000 ${r.toFixed(2)}px,transparent ${(r + .9).toFixed(2)}px)`;
  st.maskSize = st.webkitMaskSize = `${P.gap}px ${P.gap}px`; st.maskRepeat = st.webkitMaskRepeat = 'repeat';
  st.maskPosition = st.webkitMaskPosition = `${(OX - P.gap / 2 - er.left + kr.left).toFixed(2)}px ${(OY - P.gap / 2 - er.top + kr.top).toFixed(2)}px`;
}
kl.addEventListener('pointerdown', e => { if (!live0 || M > 0 || RM.matches) return; const r = kl.getBoundingClientRect(); add(e.clientX - r.left, e.clientY - r.top, performance.now()); });
addEventListener('resize', () => { sized = false; if (live0) size(); });
return { frame, halftone, MV };
})();
