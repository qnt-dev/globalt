/* Сетка-сонар под чёрными надписями станций мира «Клиенты»: «Сайт», «Реклама», SMM, «Бренд».
   Точки стоят сеткой, по ним расходятся кольца: само по себе раз в 2,4 секунды и от каждого нажатия.
   Точка на кольце растёт и светлеет. По мотивам Sonar Grid (NIMA MZ, 21st.dev, лицензия MIT): числа те же, точки белые.
   Связь с app.js: show(true/false) каждый кадр из updateAir. Пока сетка не видна, она не рисуется. */
window.GTSONAR = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const RM = matchMedia('(prefers-reduced-motion:reduce)');
/* шаг сетки, радиус точки, яркость точки, раз в сколько секунд кольцо, скорость и ширина кольца, во сколько раз растёт точка */
const P = { gap: 26, dot: 1.4, base: .28, every: 2.4, speed: 260, ring: 90, amp: 2.2, max: 6, area: [.15, .2, .85, .8] };
const cv = document.createElement('canvas');
cv.id = 'sonar'; cv.setAttribute('aria-hidden', 'true');
kl.prepend(cv);
const c = cv.getContext('2d');
let W = 1, H = 1, rings = [], next = 0, raf = 0, on = false, seeded = false;
function size() {
  const r = kl.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  cv.width = Math.round(W * d); cv.height = Math.round(H * d); c.setTransform(d, 0, 0, d, 0, 0);
}
function add(x, y, t) { rings.push({ x, y, t }); while (rings.length > P.max) rings.shift(); }
function draw(t) {
  const life = (Math.hypot(W, H) + P.ring) / P.speed;
  rings = rings.filter(r => (t - r.t) / 1000 < life);
  const live = rings.map(r => { const s = (t - r.t) / 1000, rad = s * P.speed; return { x: r.x, y: r.y, rad, reach: rad + P.ring, fade: 1 - s / life }; });
  c.clearRect(0, 0, W, H); c.fillStyle = '#fff';
  const nx = Math.ceil(W / P.gap) + 1, ny = Math.ceil(H / P.gap) + 1, ox = (W - (nx - 1) * P.gap) / 2, oy = (H - (ny - 1) * P.gap) / 2, hot = [];
  c.globalAlpha = P.base; c.beginPath();
  for (let i = 0; i < nx; i++) {
    const x = ox + i * P.gap;
    for (let j = 0; j < ny; j++) {
      const y = oy + j * P.gap; let k = 0;
      for (const r of live) {
        if (Math.abs(x - r.x) > r.reach || Math.abs(y - r.y) > r.reach) continue;
        const e = Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad);
        if (e >= P.ring) continue;
        const h = 1 - e / P.ring, v = h * h * (3 - 2 * h) * r.fade; if (v > k) k = v;
      }
      if (k < .01) { c.moveTo(x + P.dot, y); c.arc(x, y, P.dot, 0, Math.PI * 2); } else hot.push(x, y, k);
    }
  }
  c.fill();
  for (let i = 0; i < hot.length; i += 3) {
    const k = hot[i + 2]; c.globalAlpha = P.base + (1 - P.base) * k;
    c.beginPath(); c.arc(hot[i], hot[i + 1], P.dot * (1 + P.amp * k), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
const ping = () => { const [a, b, e, f] = P.area; return [W * (a + Math.random() * (e - a)), H * (b + Math.random() * (f - b))]; };
function tick(t) {
  raf = 0;
  if (!on) return;
  /* без анимации стоит одна ровная сетка */
  if (RM.matches) { rings = []; draw(t); return; }
  if (t >= next) { add(...ping(), t); next = t + P.every * 1000; }
  draw(t); raf = requestAnimationFrame(tick);
}
function show(v) {
  if (v === on) return;
  on = v; cv.classList.toggle('on', v);
  if (!v) { cancelAnimationFrame(raf); raf = 0; return; }
  size();
  const t = performance.now();
  /* одно кольцо уже летит, когда сетка появилась */
  if (!seeded && !RM.matches) { seeded = true; const [a, b, e, f] = P.area; add(W * (a + (e - a) * .68), H * (b + (f - b) * .34), t - 500); }
  next = Math.max(next, t + P.every * 1000);
  raf = requestAnimationFrame(tick);
}
kl.addEventListener('pointerdown', e => { if (!on || RM.matches) return; const r = kl.getBoundingClientRect(); add(e.clientX - r.left, e.clientY - r.top, performance.now()); });
addEventListener('resize', () => { if (on) size(); });
return { show };
})();
