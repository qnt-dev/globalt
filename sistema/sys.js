/* СИСТЕМА: общий код всех страниц макета. Меню и завеса — как на главной (src/app.js), остальное своё:
   шапка прячется при прокрутке вниз, кнопка в рамке HUD, появление глав, фишки и формы. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches, HOME = document.body.dataset.w === 'home';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- завеса «Распад»: страница собирается из квадратиков и рассыпается в них (как разделы на сайте) ---------- */
const veil = $('#veil'), vx = veil.getContext('2d'), VB = 6; let VR = null;
function veilDraw(q) {
  const d = Math.min(devicePixelRatio || 1, 1.5), w = innerWidth, h = innerHeight, nx = Math.ceil(w / VB), ny = Math.ceil(h / VB);
  if (veil.width !== Math.round(w * d) || veil.height !== Math.round(h * d)) { veil.width = Math.round(w * d); veil.height = Math.round(h * d); }
  if (!VR || VR.n !== nx * ny) { VR = new Float32Array(nx * ny); VR.n = nx * ny; for (let k = 0; k < VR.length; k++) VR[k] = Math.random(); }
  vx.setTransform(d, 0, 0, d, 0, 0); vx.clearRect(0, 0, w, h); vx.fillStyle = '#000'; vx.beginPath();
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { const v = (x / nx) * .72 + VR[y * nx + x] * .28; if (1 - v > q * 1.02) vx.rect(x * VB, y * VB, VB, VB); }
  vx.fill();
}
function veilRun(q0, q1, D, done) { veil.style.display = 'block'; const t0 = performance.now(); const st = now => { const k = clamp((now - t0) / D); veilDraw(q0 + (q1 - q0) * sstep(0, 1, k)); if (k < 1) requestAnimationFrame(st); else done(); }; requestAnimationFrame(st); }
/* Завеса из квадратиков между страницами больше не нужна: Земля одна на всех страницах, переход — полёт камеры
   (earth-view.js, earth-hero.js, хвост home.js). Код завесы остаётся: его зовёт перенесённый код главной. */

/* ---------- меню справа: как на сайте ---------- */
(() => {
  const mn = $('#mn'), chip = $('#mn-chip'); if (!mn) return;
  const fit = () => mn.style.setProperty('--cw', chip.offsetWidth + 'px'); fit(); addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit);
  const set = on => { mn.dataset.open = on; chip.setAttribute('aria-expanded', on); if (on) { document.body.classList.remove('barhide'); setTimeout(() => mn.querySelector('.mn-list a').focus({ preventScroll: true }), 180); } };
  chip.addEventListener('click', () => set(true));
  mn.querySelector('.mn-x').addEventListener('click', () => { set(false); chip.focus({ preventScroll: true }); });
  mn.addEventListener('click', e => { if (e.target.closest('.mn-list a')) set(false); if (e.target.closest('[data-talk]')) { set(false); talk(); } });
  document.addEventListener('pointerdown', e => { if (mn.dataset.open === 'true' && !mn.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mn.dataset.open === 'true') { set(false); chip.focus({ preventScroll: true }); } });
})();
/* «Напишите нам»: на странице раздела — к форме этой страницы; на главной — выбор, о чём разговор */
function talk() {
  const f = $('main.view:not([hidden]) [id$="-svyaz"]'); if (f) { f.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(() => { const i = f.querySelector('input,textarea,select'); if (i) i.focus({ preventScroll: true }); }, RM ? 0 : 700); return; }
  const d = $('#talk'); if (d && d.showModal) d.showModal();
}
$$('[data-talk]').forEach(b => { if (!b.closest('#mn')) b.addEventListener('click', talk); });
const tx = $('#talk-x'); if (tx) tx.addEventListener('click', () => $('#talk').close());

/* ---------- шапка: вниз — уходит, вверх — возвращается ---------- */
{
  let ly = scrollY;
  const on = () => {
    const y = scrollY, open = $('#mn') && $('#mn').dataset.open === 'true';
    document.body.classList.toggle('scrolled', y > 8);
    if (Math.abs(y - ly) > 6) { document.body.classList.toggle('barhide', y > ly && y > 240 && !open); ly = y; }
  };
  addEventListener('scroll', on, { passive: true }); on();
}

/* ---------- кнопка системы: рамка HUD и белое тело с прорезью вокруг знака (как «Перейти» на главной) ---------- */
const SVGN = 'http://www.w3.org/2000/svg';
function hudFrame(b) {
  let hf = b.querySelector('.hf'); if (!hf) { hf = document.createElementNS(SVGN, 'svg'); hf.setAttribute('class', 'hf'); hf.setAttribute('aria-hidden', 'true'); b.prepend(hf); }
  const W = b.offsetWidth + 14, H = b.offsetHeight + 14; if (W <= 14 || H <= 14) return;
  const t = 14, q = .75, L = Math.round(W * .3);
  hf.setAttribute('viewBox', `0 0 ${W} ${H}`);
  hf.innerHTML = `<path class="o" d="M${t} ${q}H${W - q}V${H - t}L${W - t} ${H - q}H${q}V${t}Z"/>` +
    `<path class="t t1" d="M0 0H${t}L0 ${t}Z"/><path class="t t2" d="M${W} ${H}H${W - t}L${W} ${H - t}Z"/>` +
    `<path class="a a1" d="M${t + 6} ${q}H${t + 6 + L}"/><path class="a a2" d="M${W - t - 6} ${H - q}H${W - t - 6 - L}"/>`;
  b.style.setProperty('--p', (2 * (W + H) - (4 - 2 * Math.SQRT2) * t).toFixed(1));
  const gs = b.querySelector('.go-s'); if (!gs) return;
  const w = W - 14, h = H - 14, x = gs.offsetLeft, y = gs.offsetTop, S = gs.offsetWidth, c = 6, g = 3, C = c + g * (2 - Math.SQRT2);
  const sq = (x, y, s, k) => `M${x} ${y}H${x + s - k}L${x + s} ${y + k}V${y + s}H${x + k}L${x} ${y + s - k}Z`;
  const m = `<svg xmlns="${SVGN}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path fill="#fff" fill-rule="evenodd" d="M7 0H${w}V${h - 7}L${w - 7} ${h}H0V7Z${sq(x - g, y - g, S + 2 * g, C)}${sq(x, y, S, c)}"/></svg>`;
  b.style.setProperty('--bm', `url("data:image/svg+xml,${encodeURIComponent(m)}")`);
}
const huds = $$('.hud'); const hudAll = () => huds.forEach(hudFrame);
hudAll(); if (document.fonts) document.fonts.ready.then(hudAll); addEventListener('resize', hudAll);

/* ---------- появление: блоки поднимаются, слова глав вырастают из точек, рамка кнопки прорисовывается ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; io.unobserve(el);
  el.classList.add('on'); if (el.classList.contains('dots') && !RM) el.classList.add('play'); if (el.classList.contains('hud')) { hudFrame(el); el.classList.add('in'); }
}), { rootMargin: '0px 0px -8% 0px' });
$$('[data-r],.dots,.hud').forEach(el => io.observe(el));

/* ---------- фишки: одна из группы (data-one) или несколько ---------- */
document.addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c || c.dataset.free) return;
  const g = c.closest('.chips'); const on = c.getAttribute('aria-pressed') !== 'true';
  if (g && g.hasAttribute('data-one')) $$('.chip', g).forEach(x => x.setAttribute('aria-pressed', 'false'));
  c.setAttribute('aria-pressed', on || (g && g.hasAttribute('data-one')) ? 'true' : 'false');
  g && g.dispatchEvent(new Event('change', { bubbles: true }));
});
/* ---------- формы макета: проверяем контакт и показываем ответ. Никуда не отправляют ---------- */
$$('form.form').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault(); const need = f.querySelector('[data-need]'), err = f.querySelector('.err');
  if (need && !need.value.trim()) { if (err) err.hidden = false; need.focus(); return; }
  if (err) err.hidden = true; f.hidden = true; const d = document.getElementById(f.dataset.done); if (d) { d.hidden = false; d.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); }
}));
/* ---------- заголовок первого экрана во всю ширину: размер от длины слова (как заголовки на сайте) ---------- */
function fit() {
  $$('.hero h1').forEach(h => {
    const L = h.querySelectorAll('span'); if (!L.length) return; const W = h.clientWidth, max = innerWidth > 760 ? 176 : 120;
    if (!W) return;   /* вид спрятан: подгоним, когда покажется (GTSYS.refresh) */
    h.style.fontSize = '100px';
    if (innerWidth > 760) {
      L.forEach(s => { s.style.whiteSpace = ''; s.style.width = ''; });
      const w0 = L[0].offsetWidth, w1 = L[1] ? L[1].offsetWidth : 0;
      /* слово раздела — до 86 % ширины; вторая строка вдвое мельче и тоже помещается */
      let fs = Math.min(max, 100 * W * .86 / w0); if (w1) fs = Math.min(fs, 100 * W / w1);
      h.style.fontSize = fs.toFixed(1) + 'px'; return;
    }
    /* телефон: слова раздела идут столбиком, размер — по самому длинному слову; вторая строка переносится */
    const t = document.createElement('span'); t.className = L[0].className; t.style.cssText = 'position:absolute;visibility:hidden;font-size:100px'; h.appendChild(t);
    let wm = 0; L[0].textContent.split(' ').forEach(w => { t.textContent = w; wm = Math.max(wm, t.offsetWidth); }); t.remove();
    L.forEach(s => { s.style.whiteSpace = 'normal'; s.style.width = 'auto'; });
    h.style.fontSize = Math.min(max, 100 * W / wm).toFixed(1) + 'px';
  });
  /* заголовки глав: самое длинное слово не шире колонки (на телефоне «производство» иначе выходило за экран и сдвигало страницу вбок) */
  $$('.ch-h h2').forEach(h => {
    h.style.fontSize = ''; const W = h.clientWidth; if (!W) return;
    const over = h.scrollWidth / W; if (over > 1.001) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) / over * .985).toFixed(1) + 'px';
  });
}
fit(); if (document.fonts) document.fonts.ready.then(fit); addEventListener('resize', fit);
/* вид сменился без перезагрузки: заголовок и рамки кнопок нового вида считаются заново (раньше он был спрятан) */
const refresh = () => { fit(); hudAll(); };
window.GTSYS = { veilRun, hudFrame, talk, refresh };
})();
