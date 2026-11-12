/* ---------- Макет: одна страница, четыре вида (главная, «Работа», «Люди», «Клиенты») и одна Земля ----------
   Вставляется в конец home.js скриптом tools/extract.py: ему нужны переменные главной (S, gl, cv, home, hub, pick, unpick, updateHome…).
   Земля не перезагружается между видами: переход — полёт камеры по той же Земле, адрес меняется через history (rabota.html и др.).
   Земля не останавливается: на главной крутится сама (3° в секунду) или стоит на выбранном слове, в разделе — 0,5° в секунду.
   Полёт ведёт это вращение: старт с той же скорости, посадка на той же скорости, после посадки Земля просто продолжает. */
const URLS = { home: 'index.html', rabota: 'rabota.html', lyudi: 'lyudi.html', klienty: 'klienty.html' };
const TITLES = { home: 'GLOBAL TRIUMPH', rabota: 'Работа вахтой — GLOBAL TRIUMPH', lyudi: 'Подбор персонала — GLOBAL TRIUMPH', klienty: 'Маркетинг для бизнеса — GLOBAL TRIUMPH' };
const VOF = f => ({ '': 'home', 'index.html': 'home', 'rabota.html': 'rabota', 'lyudi.html': 'lyudi', 'klienty.html': 'klienty' })[f];
const DIR = location.pathname.replace(/[^/]*$/, '');
const EG = gl ? new EV.EarthGL(gl) : null;
const MAINS = {}; document.querySelectorAll('main.view').forEach(m => { MAINS[m.dataset.view] = m; });
const SPIN = .5, HOMESPIN = 3;
let view = MAINS[document.body.dataset.w] ? document.body.dataset.w : 'home';
let busy = false, FLY = null, T0 = performance.now(), dmv = 0, lit = false;
const V = { lon: view !== 'home' ? GT_SEC[view].gv[0] : 0, vel: 0, drag: null };
const ctime = () => RM ? 2 : (performance.now() - T0) / 1000;
const heroOf = w => MAINS[w] && MAINS[w].querySelector('.hero');
/* на главной Земля лежит внутри неё (буквы разделов — окна в Землю); в разделах — под всей страницей */
function place() { if (view === 'home') { if (cv.parentNode !== home) home.prepend(cv); } else if (cv.parentNode === home) document.body.prepend(cv); }
function navMark(w) {
  document.querySelectorAll('#nav a, #mn-panel a').forEach(a => { const f = (a.getAttribute('href') || '').split('#')[0]; if (VOF(f) === w) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}

/* ---------- кадр Земли ---------- */
/* проверка плавности (tools/smooth.py): при window.__rec каждый нарисованный кадр пишет поворот, размер и место Земли */
const rec = v => { if (window.__rec) (window.__trace = window.__trace || []).push({ t: performance.now(), m: v.m, z: v.z, cy: v.cy, w: view, f: !!FLY }); };
function homeDraw(time) {
  if (!EG) return;
  gl.disable(gl.SCISSOR_TEST);
  if (FLY) { rec(FLY); EG.use(FLY.det); EG.draw(FLY, time, cv.width, cv.height); }
  else if (view === 'home') { const v = EV.homeView(S.v, innerWidth, innerHeight); rec(v); EG.use(null); EG.draw(v, time, cv.width, cv.height); }
  else {
    /* раздел: Земля на первом экране; страница листается — Земля уходит вверх вместе с ним, ниже первого экрана чёрное */
    const r = heroOf(view).getBoundingClientRect(), k = cv.height / innerHeight, mn = Math.min(innerWidth, innerHeight);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (r.bottom > 0) {
      /* дуга стоит у низа окна, как в конце полёта, и уходит вверх ровно на прокрутку (а не к низу первого экрана: на низком телефоне
         первый экран выше окна, и дуга после посадки сдвинулась бы) */
      const v = EV.secView(view, V.lon, innerWidth, innerHeight); v.dm = dmv; v.cy += scrollY / mn; rec(v);
      gl.enable(gl.SCISSOR_TEST); gl.scissor(0, Math.max(0, Math.round((innerHeight - r.bottom) * k)), cv.width, Math.round(Math.min(r.bottom, r.height) * k) + 1);
      EG.use(view); EG.draw(v, time, cv.width, cv.height); gl.disable(gl.SCISSOR_TEST);
    }
  }
  /* Земля нарисована с картами: заставки первых экранов (снимки той же Земли) уходят */
  if (!lit && EG.ready) { lit = true; requestAnimationFrame(() => document.body.classList.add('earth')); }
}

/* ---------- Земля раздела крутится мышью и пальцем (как на главной): вбок крутит, вверх-вниз листает страницу ---------- */
Object.values(MAINS).forEach(m => {
  const h = m.querySelector('.hero'); if (!h) return;
  h.addEventListener('pointerdown', e => { if (FLY || e.button || e.target.closest('a,button,input,select,textarea,.facts')) return; V.drag = { x: e.clientX, t: performance.now(), v: 0, h }; h.classList.add('drag'); });
});
addEventListener('pointermove', e => {
  const d = V.drag; if (!d) return; const now = performance.now(), dx = -(e.clientX - d.x) / Math.min(innerWidth, innerHeight) * 40;
  V.lon += dx; const dt = Math.max(.008, (now - d.t) / 1000); d.v = d.v * .6 + (dx / dt) * .4; d.x = e.clientX; d.t = now;
});
const dropSec = () => { const d = V.drag; if (!d) return; V.vel = performance.now() - d.t < 90 ? Math.max(-60, Math.min(60, d.v)) : 0; d.h.classList.remove('drag'); V.drag = null; };
addEventListener('pointerup', dropSec); addEventListener('pointercancel', dropSec);

/* ---------- полёт камеры между видами ---------- */
function go(to, hash, push) {
  if (push === undefined) push = true;
  if (!URLS[to]) return;
  if (to === view) { if (hash) jump(hash); return; }
  if (busy) return;
  if (RM || !EG || !EG.ready) { land(to, hash, push); return; }
  busy = true; if (to !== 'home') EG.detail(to);
  const W = innerWidth, H = innerHeight, from0 = view;
  const start = () => {
    const s0 = S.v.slice(), lonA = V.lon, dmA = dmv, lonB = to === 'home' ? 0 : GT_SEC[to].gv[0];
    /* главная до старта: без слова крутится сама (3° в секунду плюс разгон от руки) и возвращает широту; со словом — доворачивается
       к его месту. Полёт продолжает это же движение (те же формулы, что updateHome), поэтому на старте нет скачка скорости */
    const k0 = S.k, vel0 = S.vel, lat0 = S.lat, tgt = k0 >= 0 ? HUB[k0].v : null, dl = tgt ? (((s0[0] - tgt[0]) % 360 + 540) % 360 - 180) : 0;
    const homeAt = el => tgt ? [tgt[0] + dl * Math.exp(-2.4 * el), tgt[1] + (s0[1] - tgt[1]) * Math.exp(-2.4 * el), s0[2]]
      : [s0[0] + HOMESPIN * el + vel0 * (1 - Math.exp(-2.2 * el)) / 2.2, lat0 + (s0[1] - lat0) * Math.exp(-2.4 * el), s0[2]];
    /* на главную: Земля повёрнута к разделу, откуда летим, и сразу крутится сама, как на главной без выбранного слова */
    const hb = from0 !== 'home' ? EV.HUB[from0] : null;
    if (from0 === 'home') { home.classList.remove('arrive'); home.classList.add('leaving'); } else heroOf(from0).classList.add('leave');
    document.body.dataset.w = to; navMark(to); world = 'fly'; clearTimeout(hub._off);
    const dur = from0 !== 'home' && to !== 'home' ? 2.4 : 2.2, hop = from0 !== 'home' && to !== 'home' ? .8 : 0, t0 = performance.now();
    const st = now => {
      const el = (now - t0) / 1000, k = Math.min(1, el / dur), e = EV.ease(k);
      const a = from0 === 'home' ? EV.homeView(homeAt(el), W, H) : Object.assign(EV.secView(from0, lonA + SPIN * el, W, H), { dm: dmA });
      const b = to === 'home' ? EV.homeView([hb[0] + HOMESPIN * el, hb[1], hb[2]], W, H) : EV.secView(to, lonB + SPIN * el, W, H);
      const v = EV.mix(a, b, e, hop); v.dm = 0; v.det = null;
      if (from0 !== 'home' && e < .5) { v.det = from0; v.dm = dmA * (1 - Math.min(1, e / .35)); }
      if (to !== 'home' && e >= .5) { v.det = to; v.dm = EG.detailReady(to) ? Math.max(0, (e - .62) / .38) : 0; }
      FLY = v; drawHome(ctime());
      if (k < 1) { requestAnimationFrame(st); return; }
      /* посадка: Земля продолжает с того же поворота и с той же скоростью */
      /* на главной широта остаётся той, с которой сели (иначе главная тянула бы её к 30° рывком) */
      if (to === 'home') { unpick(); S.v = [hb[0] + HOMESPIN * el, hb[1], hb[2]]; S.vel = 0; S.lat = hb[1]; }
      else { V.lon = lonB + SPIN * el; V.vel = 0; dmv = EG.detailReady(to) ? 1 : 0; }
      FLY = null; land(to, hash, push); busy = false;
    };
    requestAnimationFrame(st);
  };
  /* первый экран раздела прокручен: сначала быстро поднимаемся к нему, Земля при этом крутится */
  const y0 = scrollY; if (from0 === 'home' || y0 < 4) { start(); return; }
  const t0 = performance.now(), D = Math.min(700, 300 + y0 * .1);
  const up = now => { const k = Math.min(1, (now - t0) / D); scrollTo(0, y0 * (1 - EV.ease(k))); if (k < 1) requestAnimationFrame(up); else start(); };
  requestAnimationFrame(up);
}
/* вид сменился: старое прячется, новое встаёт, адрес и заголовок вкладки — новые */
function land(to, hash, push) {
  const from = view; view = to; world = to;
  if (from === 'home') { home.hidden = true; home.classList.remove('leaving', 'arrive'); } else { MAINS[from].hidden = true; heroOf(from).classList.remove('leave', 'arrive'); }
  if (to === 'home') { home.hidden = false; home.classList.remove('arrive'); void home.offsetWidth; home.classList.add('arrive'); }
  else { MAINS[to].hidden = false; const h = heroOf(to); h.classList.remove('arrive', 'leave'); void h.offsetWidth; h.classList.add('arrive'); }
  place(); document.body.dataset.w = to; navMark(to); document.title = TITLES[to]; scrollTo(0, 0);
  if (to === 'home') cisLay();
  if (push) try { history.pushState({ v: to }, '', URLS[to] + (hash || '')); } catch (e) {}
  if (window.GTSYS) GTSYS.refresh();
  if (hash) setTimeout(() => jump(hash), 650);
  dirty = true;
}
function jump(hash) { const el = document.getElementById(hash.replace('#', '')); if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }

/* ссылки на виды и слова главной ведут полётом; кейс ZERNO и чужие адреса — обычным переходом */
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const g = e.target.closest('[data-go]'); if (g && URLS[g.dataset.go]) { e.preventDefault(); go(g.dataset.go); return; }
  const a = e.target.closest('a[href]'); if (!a || a.target) return;
  const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname.replace(/[^/]*$/, '') !== DIR) return;
  const to = VOF(u.pathname.split('/').pop()); if (!to) return;
  if (to === view && !u.hash) { e.preventDefault(); if (view !== 'home') scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
  e.preventDefault(); go(to, u.hash);
}, true);
addEventListener('popstate', () => { const to = VOF(location.pathname.split('/').pop()) || 'home'; go(to, location.hash, false); });
try { history.scrollRestoration = 'manual'; } catch (e) {}
/* наводят на слово или ссылку раздела — заранее грузим его чёткий кусок карты */
tabs.forEach((b, i) => b.addEventListener('pointerenter', () => { if (EG) EG.detail(HUB[i].w); }));
document.addEventListener('pointerover', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a || !EG) return; const to = VOF((a.getAttribute('href') || '').split('#')[0]); if (to && to !== 'home') EG.detail(to); });

/* ---------- начало: вид из адреса страницы ---------- */
document.body.classList.add('spa');
Object.entries(MAINS).forEach(([w, m]) => { m.hidden = w !== view; }); home.hidden = view !== 'home';
world = view; place(); navMark(view); cv.style.display = gl ? 'block' : 'none'; if (view === 'home') cisLay();
if (view !== 'home' && EG) EG.detail(view);
/* чёткие куски всех разделов подгружаются заранее, пока человек смотрит: во время полёта грузить уже нечего */
setTimeout(() => { if (EG) ['rabota', 'lyudi', 'klienty'].forEach(w => EG.detail(w)); }, 1200);
try { history.replaceState({ v: view }, '', location.href); } catch (e) {}
if (!gl) document.body.classList.add('nogl');

let last = performance.now(), acc = 0, cnt = 0; const T00 = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!document.hidden && !FLY) {
    if (view === 'home') updateHome(RM ? 0 : dt);
    else {
      if (!RM && !V.drag) { V.lon += dt * (SPIN + V.vel); V.vel *= Math.exp(-dt * 2.2); }
      if (EG && EG.detailReady(view)) dmv = RM ? 1 : Math.min(1, dmv + dt * 2);
    }
    if (!RM || dirty || view !== 'home') drawHome(ctime()); dirty = false;
    /* карты из очереди грузятся в видеокарту полосами, по одной за кадр и только когда Земля не летит */
    if (EG) EG.pump();
    /* слабая машина: Земля рисуется реже точек. Первые 4 секунды не считаем: там грузятся карты */
    const fd = now - (frame.p || now); frame.p = now;
    if (!RM && gl && now - T00 > 4000 && fd < 100) { acc += fd; cnt++; if (cnt > 40) { const ms = acc / cnt; acc = 0; cnt = 0; if (ms > 34 && scale > .6) { scale = Math.max(.6, scale * .8); resize(); } } }
  }
  requestAnimationFrame(frame);
}
resize(); window.__gt = { S, pick, go, V, earth: () => EG && EG.ready, view: () => view };
requestAnimationFrame(frame);
