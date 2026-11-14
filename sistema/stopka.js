/* «Клиенты» → «Услуги»: стопка. Глава липнет к экрану, пока идут четыре этапа; прокрутка ведёт камеру.
   Четыре графитовые плиты ложатся террасой, бренд внизу — фундамент. На каждой плите лежат и встают настоящие работы
   кейса ZERNO: знак и тон голоса; контент-план, лента и сторис; объявление в поиске и карточка на картах; сайт, телефон, заказ.
   Ритм этапа (u = q − k): новая плита падает уже с работой, камера быстро переходит, потом доски встают по одной,
   на торце загорается следствие — и держится, камера медленно подъезжает.
   Финал «Знак»: одной волной снизу вверх плиты отдают работы, приподнимаются, плывут к центру и ложатся по размеру;
   камера поворачивается на 45° и встаёт почти сверху — это знак «Одна команда» из левой колонки: ромбы друг в друге,
   оранжевая сердцевина, из знака наружу выходят четыре провода, по одному на этап.
   Всё движение и цвет — только от прокрутки. Вёрстка страницы не двигается: меняются сцена, цвета и прозрачность.
   Слева этапы на линии с ромбами; на большом экране колонка этапов растёт вместе со сценой (zoom до 1,6),
   стопка стоит от правого края текста на 7,5 % высоты сцены, на широком экране текст и стопка вместе — по центру. */
(() => {
'use strict';
const sf = document.querySelector('.sf'); if (!sf) return;
const st = sf.querySelector('.sf-st'), vb = sf.querySelector('.sf-v'), sEl = sf.querySelector('.sf-s'), ol = sf.querySelector('.sf-o'), lis = [...ol.children];
const tk = sf.querySelector('.sf-tk'), dEl = sf.querySelector('.sf-d'), pps = [...sf.querySelectorAll('.sf-p span')];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const ROW = matchMedia('(max-width:760px),(min-width:761px) and (max-aspect-ratio:4/5)'), FLOW = matchMedia('(min-width:761px) and (max-height:480px)');
const IMG = 'sistema/img/uslugi/';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const eIn = t => t * t * t;
const px = v => v.toFixed(2) + 'px';
const R = Math.PI / 180;
sf.classList.add('js');

/* ---------- мир: x вправо, y к зрителю (перед плиты), z вверх ---------- */
const T = 84;                 /* толщина плиты */
const TW = 8, TB = 12;        /* толщина лежащей работы и стоящей доски */
const S = 250;                /* шаг террасы: на сколько следующая плита сдвинута назад */
const DROP = 700, LAND = .11, SINK = [.03, .095];   /* доски уходят в пазы чуть позже начала этапа — пустая плита видна меньше */
/* контент-план: из смм-кадра берём только столбец плана и раскладываем две недели рядом (кусок: x, y, w, h исходника → dx, dy в карточке) */
const PLAN = { cw: 570, ch: 200, parts: [[547, 113, 253, 160, 18, 20], [547, 272, 253, 160, 299, 20]] };
/* сторис-опрос из смм-кейса ZERNO (та же вёрстка, что в src/smm.js, только неподвижная) */
const MARK = '<svg viewBox="0 0 100 100"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="#fff"/><path d="M8 34H61L39 66H92" fill="none" stroke="#df1f12" stroke-width="8" stroke-miterlimit="10"/></g></svg>';
const STORY = `<div class="sk-st"><div class="s-pr"><i style="--p:1"></i><i style="--p:.55"></i><i></i></div><div class="s-hd"><i class="s-av">${MARK}</i><b>zerno.kg</b><small>2 ч</small></div>
  <p>Овсяное или обычное?</p><div class="s-pl"><span style="--v:.64"><b>Овсяное</b><em>64%</em></span><span style="--v:.36"><b>Обычное</b><em>36%</em></span></div></div>`;
/* f — лежит на передней полосе (fy — отступ от переднего края); b — доска на петле: hy — линия петли от переднего края,
   at — когда встаёт (доля этапа), d — сколько встаёт; c — кадр исходника [x, y, w, h] */
const DESK = [
  { n: '01', t: 'Бренд', m: 'Фундамент', W: 780, D: 720, lit: .40, w: [
    { k: 'f', src: 'brand_logo.webp', iw: 660, ih: 400, c: [24, 0, 616, 200], x: 0, w: 560, lb: 'Знак' },
    { k: 'b', src: 'brand_voice.webp', iw: 680, ih: 490, c: [0, 0, 645, 490], x: 0, w: 520, at: .22, lb: 'Тон голоса' } ] },
  { n: '02', t: 'SMM', m: 'Подписчики', W: 760, D: 770, lit: .46, w: [
    { k: 'f', src: 'smm_plan.webp', iw: 800, ih: 440, parts: PLAN, x: 0, w: 520, lb: 'Контент-план · 2 недели' },
    { k: 'b', src: 'smm_feed.webp', iw: 460, ih: 650, c: [0, 0, 450, 594], fade: 1, x: -110, w: 340, at: .24, lb: 'Лента' },
    { k: 'b', html: STORY, iw: 9, ih: 16, x: 190, w: 220, at: .34, d: .08, lb: 'Сторис' } ] },
  { n: '03', t: 'Реклама', m: 'Находят рядом', W: 740, D: 720, lit: .44, w: [
    { k: 'f', src: 'ads_search.webp', iw: 730, ih: 600, c: [0, 0, 730, 198], x: 0, w: 640, lb: 'Поиск' },
    { k: 'b', src: 'ads_map.webp', iw: 780, ih: 520, c: [0, 0, 780, 500], x: 0, w: 560, at: .24, lb: 'Карты' } ] },
  { n: '04', t: 'Сайт', m: 'Заказы', W: 720, D: 700, lit: .46, w: [
    { k: 'f', src: 'site_order.webp', iw: 855, ih: 500, x: -150, w: 400, lb: 'Заказ' },
    { k: 'b', src: 'site_desk.webp', iw: 855, ih: 490, x: -70, w: 520, hy: 330, at: .22, lb: 'Сайт' },
    { k: 'b', src: 'site_phone.webp', iw: 245, ih: 490, x: 270, w: 120, hy: 150, at: .34, d: .08, lb: 'Телефон' } ] },
];
/* телефон: плиты уже, работы почти во всю плиту; на этап одна лежащая работа и одна доска */
const MOB = [
  { ...DESK[0], W: 660, D: 780, w: [{ ...DESK[0].w[0], w: 600 }, { ...DESK[0].w[1], w: 600, hy: 285 }] },
  { ...DESK[1], W: 640, D: 860, lit: .44, w: [{ ...DESK[1].w[0], w: 520, lb: 'Контент-план' }, { ...DESK[1].w[1], x: 0, w: 400, hy: 285 }] },
  { ...DESK[2], W: 640, D: 720, w: [{ ...DESK[2].w[0], w: 600 }, { ...DESK[2].w[1], w: 580, hy: 285 }] },
  { ...DESK[3], W: 640, D: 740, w: [{ ...DESK[3].w[0], x: 0, w: 520 }, { ...DESK[3].w[1], x: 0, w: 600, hy: 370 }] },
];

/* ---------- финал «Знак» ----------
   После «Сайта» работы уходят в пазы, плиты съезжают к одному центру и ложатся по размеру: бренд внизу, самый большой.
   Камера поворачивается на 45° и смотрит почти сверху: это знак «Одна команда» из левой колонки — ромбы друг в друге,
   сердцевина оранжевая, и к знаку по очереди сходятся четыре провода, по одному на этап */
const RAT = [1, .74, .5, .27];
/* ход финала по прокрутке q. Все движения и цвета идут только от прокрутки — без классов и переходов по времени.
   QF — конец удержания «Сайта». Плита k идёт своим ходом PK(k): снизу вверх, внахлёст, как строилась стопка;
   по пути приподнимается и плавно ложится. QC — сердцевина наливается оранжевым, QW — провода, по одному */
const QF = 3.5;
/* одна волна снизу вверх, внахлёст: плита k освобождается от работ (CL), сразу трогается и плывёт к центру (PK);
   ход у всех одинаковый, сдвиг 0,03 — следующая трогается, пока предыдущая ещё в пути. Верхняя плита («Сайт»)
   сначала складывает свои доски, её ход тоже в общей волне. Сердцевина наливается, когда верхняя плита садится,
   потом из знака наружу выходят провода */
const CL = k => [3.505 + .016 * k, 3.53 + .016 * k], PK = k => [3.535 + .03 * k, 3.695 + .03 * k];
const QC = [3.77, 3.83], QW = 3.835;
const sm = t => t * t * t * (t * (t * 6 - 15) + 10);           /* плавный разгон и плавная остановка */
const uOf = (k, q) => { const [a, b] = PK(k); return clamp((q - a) / (b - a)); }, tOf = (k, q) => sm(uOf(k, q));
const sOf = (k, q) => sm(clamp(uOf(k, q) / .75));                 /* размер — быстрее положения: плита уменьшается по пути, а не в конце */
let SIDE = 600, Y0 = 0, WIR = [];

/* ---------- сборка ---------- */
const mk = (cls, par, tag = 'div') => { const e = document.createElement(tag); if (cls) e.className = cls; par.appendChild(e); return e; };
function face(par, cls, w, h, tf) {
  const e = mk('sk-f ' + cls, par); e.style.cssText = `width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h / 2}px;transform:${tf}`; return e;
}
/* брусок w×d×h, низ в z=0, центр в 0,0: верх, перед, правый и левый бок */
function box(par, w, d, h, c) {
  return [face(par, c[0], w, d, `translateZ(${h}px)`),
    face(par, c[1], w, h, `translate3d(0,${d / 2}px,${h / 2}px) rotateX(-90deg)`),
    face(par, c[2], d, h, `translate3d(${w / 2}px,0,${h / 2}px) rotateZ(-90deg) rotateX(-90deg)`),
    face(par, c[2], d, h, `translate3d(${-w / 2}px,0,${h / 2}px) rotateZ(90deg) rotateX(-90deg)`)];
}
/* картинка работы шириной W: целиком, кадр c или карточка из кусков */
function pic(par, w, W) {
  if (w.html) { par.innerHTML = w.html; par.style.setProperty('--u', W / 100 + 'px'); return; }
  const src = w.abs ? w.src : IMG + w.src;
  const put = (host, cx, cy, k) => { const i = mk('', host, 'img'); i.decoding = 'sync'; i.src = src;
    Object.assign(i.style, { position: 'absolute', maxWidth: 'none', maxHeight: 'none', width: w.iw * k + 'px', height: w.ih * k + 'px', left: -cx * k + 'px', top: -cy * k + 'px' }); };
  if (w.parts) { const k = W / w.parts.cw;
    w.parts.parts.forEach(([sx, sy, sw, sh, dx, dy]) => { const d = mk('sk-pt', par); Object.assign(d.style, { left: dx * k + 'px', top: dy * k + 'px', width: sw * k + 'px', height: sh * k + 'px' }); put(d, sx, sy, k); });
    return; }
  const c = w.c || [0, 0, w.iw, w.ih]; put(par, c[0], c[1], W / c[2]);
  if (w.fade) mk('sk-fd', par);
}
const hOf = w => Math.round(w.parts ? w.w * w.parts.ch / w.parts.cw : w.w * (w.c ? w.c[3] / w.c[2] : w.ih / w.iw));

const sk = mk('sk', st), gl = mk('sk-gl', sk), vw = mk('sk-v', sk); sk.setAttribute('aria-hidden', 'true');
let SL = DESK, SLB = [], FR = [], floor, base, mob = false, built = null;
function build() {
  vw.textContent = ''; SLB = []; FR = [];
  SL = mob ? MOB : DESK;
  sk.classList.toggle('mob', mob);
  let f = SL[0].D / 2;
  SL.forEach((s, k) => { s.f = f - k * S; s.y = s.f - s.D / 2; s.z = k * T; });
  const s0 = SL[0];
  /* пол: едва заметное пятно под стопкой и плотная тень под фундаментом */
  floor = face(vw, 'sk-fl', s0.W + 1100, s0.D + 1100, `translate3d(0,${s0.y + 120}px,-1px)`);
  base = face(vw, 'sk-bt', s0.W + 26, s0.D + 26, `translate3d(0,${s0.y}px,-.5px)`);
  SL.forEach((s, k) => {
    const o = mk('sk-o', vw), { W, D } = s;
    box(o, W, D, T, ['sk-top', 'sk-fr', 'sk-sd']);
    const fr = o.children[1];
    if (k === 3) s.cf = face(o, 'sk-cf', W, D, `translateZ(${T + .3}px) scale(0)`);
    fr.innerHTML = `<div class="sk-n"><i>${s.n} ${s.t}</i><b>${s.m}</b></div>`;
    /* тень садящейся плиты — на верх нижней, только там, где они перекрываются */
    let sh = null;
    if (k) { const p = SL[k - 1], d = s.f - (p.f - p.D);
      sh = face(vw, 'sk-ss', Math.min(W, p.W) - 6, d - 6, `translate3d(0,${(s.f + p.f - p.D) / 2}px,${p.z + T + .4}px)`); }
    const ws = s.w.map(w0 => {
      const w = { ...w0, h: hOf(w0) }, ly = D / 2;   /* ly — передний край плиты в координатах плиты */
      if (w.k === 'f') {
        const fy = w.fy || 44, cy = ly - fy - w.h / 2;
        w.sh = face(o, 'sk-sh', w.w, w.h, `translate3d(${w.x}px,${cy}px,${T + .4}px)`);
        w.el = mk('sk-w', o); w.el.style.transform = `translate3d(${w.x}px,${cy}px,${T + .5}px)`;
        const im = face(w.el, 'sk-i', w.w, w.h, `translateZ(${TW}px)`); pic(im, w, w.w);
        face(w.el, 'sk-e', w.w, TW, `translate3d(0,${w.h / 2}px,${TW / 2}px) rotateX(-90deg)`);
        face(w.el, 'sk-e sk-e2', w.h, TW, `translate3d(${w.w / 2}px,0,${TW / 2}px) rotateZ(-90deg) rotateX(-90deg)`);
        face(w.el, 'sk-e sk-e2', w.h, TW, `translate3d(${-w.w / 2}px,0,${TW / 2}px) rotateZ(90deg) rotateX(-90deg)`);
        w.lx = w.x - w.w / 2; w.ly = ly - fy + 22;
      } else {
        const hy = w.hy || S + 40, yb = ly - hy - TB;          /* yb — задняя грань доски = петля */
        w.yb = yb; w.d = w.d || .1;
        w.gr = face(o, 'sk-gr', w.w + 16, TB + 8, `translate3d(${w.x}px,${yb + TB / 2}px,${T + .3}px)`);
        w.ao = face(o, 'sk-ao', w.w + 30, 44, `translate3d(${w.x}px,${yb + TB + 26}px,${T + .35}px)`);
        w.el = mk('sk-b', o);
        const H = w.h, im = face(w.el, 'sk-i', w.w, H, `translate3d(0,${TB}px,${H / 2}px) rotateX(-90deg)`); pic(im, w, w.w);
        face(w.el, 'sk-e', w.w, TB, `translate3d(0,${TB / 2}px,${H}px)`);
        face(w.el, 'sk-e sk-e2', TB, H, `translate3d(${w.w / 2}px,${TB / 2}px,${H / 2}px) rotateZ(-90deg) rotateX(-90deg)`);
        face(w.el, 'sk-e sk-e2', TB, H, `translate3d(${-w.w / 2}px,${TB / 2}px,${H / 2}px) rotateZ(90deg) rotateX(-90deg)`);
        w.lx = w.x - w.w / 2; w.ly = yb + TB + 30;
      }
      if (w.lb) { const p = mk('sk-p', o); p.style.transform = `translate3d(${w.lx}px,${w.ly}px,${T + 1}px)`; w.lbe = mk(w.k === 'b' ? 'sk-lb sk-b-lb' : 'sk-lb', p); w.lbe.textContent = w.lb; }
      return w;
    });
    SLB.push({ o, ws, sh, k, s });
  });
  /* знак: общий центр — центр фундамента, сторона — чуть меньше его короткой стороны */
  SIDE = Math.min(SL[0].W, SL[0].D) * .9; Y0 = SL[0].y;
  const h = SIDE / 2, r2 = Math.SQRT1_2;
  /* провода как у значка: два в боковые углы, два в середины верхних сторон (при повороте камеры на 45°) */
  WIR = [[-r2, r2, .42], [-1, 0, 1.15], [0, -1, 1.15], [r2, -r2, .42]].map(([dx, dy, lk]) => {
    const k = h / Math.max(Math.abs(dx), Math.abs(dy)), Px = dx * k, Py = dy * k, len = lk * h, Tx = Px + dx * len, Ty = Py + dy * len;
    const g = mk('sk-wg', vw); g.style.transform = `translate3d(${px(Tx)},${px(Y0 + Ty)},${T + .6}px) rotateZ(${(Math.atan2(-dy, -dx) / R).toFixed(3)}deg)`;   /* на высоте верха фундамента — провод входит в угол контура */
    const bar = mk('sk-f sk-wr', g); Object.assign(bar.style, { width: px(len), height: '2.4px', left: '0px', top: '-1.2px' });
    const rot = dx && dy ? '' : 'rotateZ(45deg) ';   /* клемма — ровный квадрат на экране, как на значке */
    const term = mk('sk-f sk-wt', g); Object.assign(term.style, { width: '13px', height: '13px', left: '-6.5px', top: '-6.5px', transform: rot + 'scale(0)' });
    return { g, bar, term, rot, T: [Tx, Y0 + Ty, T] };
  });
  built = mob;
}
/* где плита k на своём ходу t (0 — терраса, 1 — знак): центр, ширина, глубина, высота */
function geoAt(s, k, t, ts = t) { const side = SIDE * RAT[k]; return { yc: lerp(s.y, Y0, t), W: lerp(s.W, side, ts), D: lerp(s.D, side, ts), z: s.z + (k ? .36 : .15) * T * Math.sin(Math.PI * t) }; }   /* плиту переносят: по пути она чуть приподнимается */
const cornG = (g, top = 1) => { const z = g.z + (top ? T : 0); return [[-g.W / 2, g.yc - g.D / 2, z], [g.W / 2, g.yc - g.D / 2, z], [-g.W / 2, g.yc + g.D / 2, z], [g.W / 2, g.yc + g.D / 2, z]]; };
const signPts = () => [...SL.flatMap((s, k) => cornG(geoAt(s, k, 1))), ...cornG(geoAt(SL[0], 0, 1), 0), ...WIR.map(w => w.T)];

/* ---------- камера ---------- */
const P = 2600;
let Lw = 1, Lh = 1, BX = [0, 0, 1, 1], KF = [], FIN = [], FT = 0;
const bq = q => mob ? 2 + 1.5 * q : 6 + 3.25 * q;                 /* облёт: рыскание растёт через всю главу */
const DOLLY = 1.07;                                                 /* медленный подъезд к плите во время удержания */
/* смещение точки p на экране относительно точки взгляда при масштабе s */
function proj(c, p, s) {
  const x = p[0] - c.tx, y = p[1] - c.ty, z = p[2] - c.tz, cb = Math.cos(c.b * R), sb = Math.sin(c.b * R), ca = Math.cos(c.a * R), sa = Math.sin(c.a * R);
  const x1 = x * cb - y * sb, y1 = x * sb + y * cb, y2 = y1 * ca - z * sa, z2 = y1 * sa + z * ca, f = s / (1 - s * z2 / P);
  return [x1 * f, y2 * f];
}
function bbox(c, pts, s) { let a = 1e9, b = -1e9, d = 1e9, e = -1e9; for (const p of pts) { const [x, y] = proj(c, p, s); a = Math.min(a, x); b = Math.max(b, x); d = Math.min(d, y); e = Math.max(e, y); } return [a, b, d, e]; }
/* подогнать масштаб под рамку; на компьютере стопка прижата слева к шагам (отступ 100), на телефоне — по центру.
   sh > 1 — рамка уменьшена вокруг центра: так начало подъезда тоже целиком в рамке, а конец ровно по ней */
function fit(c, pts, sMax, sh = 1) {
  let [L, Tp, Wd, Ht] = BX; L += Wd * (1 - 1 / sh) / 2; Tp += Ht * (1 - 1 / sh) / 2; Wd /= sh; Ht /= sh;
  let s = .8;
  for (let i = 0; i < 5; i++) { const [a, b, d, e] = bbox(c, pts, s); s = Math.min(sMax, s * Math.min(Wd / (b - a), Ht / (e - d))); }
  const [a, b, d, e] = bbox(c, pts, s);
  return { ...c, s, ax: mob ? L + (Wd - (b - a)) / 2 - a : L - a, ay: Tp + (Ht - (e - d)) / 2 - d };
}
const topC = s => [[-s.W / 2, s.f, s.z + T], [s.W / 2, s.f, s.z + T], [-s.W / 2, s.f - s.D, s.z + T], [s.W / 2, s.f - s.D, s.z + T]];
const botC = s => [[-s.W / 2, s.f, s.z], [s.W / 2, s.f, s.z]];
const brdC = s => s.w.filter(w => w.k === 'b').flatMap(w => { const h = hOf(w), hy = w.hy || S + 40; return [[w.x - w.w / 2, s.f - hy, s.z + T + h], [w.x + w.w / 2, s.f - hy, s.z + T + h]]; });
const look = s => ({ tx: 0, ty: s.f - s.D / 2, tz: s.z + T });
function buildKF() {
  const sMax = mob ? 1 : 1.1, aS = mob ? 44 : 46, aA = mob ? 52 : 54, aF = mob ? 56 : 54;
  const pA = k => { const s = SL[k], p = SL[k - 1]; return [...topC(s), ...botC(s), ...brdC(s), ...(p ? [[-p.W / 2, p.f, s.z], [p.W / 2, p.f, s.z]] : [])]; };
  const st0 = fit({ a: aS, b: bq(0), ...look(SL[0]) }, [...topC(SL[0]), ...botC(SL[0])], sMax);
  KF = [{ q: 0, c: st0 }, { q: .02, c: st0 }];
  for (let k = 0; k < 4; k++) {
    const A = fit({ a: aA, b: bq(k + .2), ...look(SL[k]) }, pA(k), sMax, DOLLY), qB = k === 3 ? QF : k + 1;
    const B = fit({ a: aA - 2, b: bq(qB), ...look(SL[k]) }, pA(k), sMax * DOLLY);
    KF.push({ q: k + .2, c: A, e: 1 }, { q: qB, c: B });
    if (k < 3) KF.push({ q: k + 1.02, c: B });
  }
  /* финал: камера идёт одной плавной дугой. Ключи 3,6 и 3,7 подогнаны под то, где плиты на самом деле в эти моменты,
     угол и поворот между удержанием «Сайта» и знаком меняются равномерно — ничего не режется краем, ничего не дёргается */
  const lf = { tx: 0, ty: Y0, tz: 1.6 * T }, pts = signPts(), B0 = KF[KF.length - 1].c;
  const aEnd = mob ? 30 : 26, at = q => { const u = (q - QF) / (3.8 - QF); return { a: lerp(B0.a, aEnd, u), b: lerp(B0.b, 45, u) }; };
  const ptsAt = q => [...SL.flatMap((s, k) => cornG(geoAt(s, k, tOf(k, q), sOf(k, q)))), ...cornG(geoAt(SL[0], 0, tOf(0, q), sOf(0, q)), 0)];
  const ctr = q => { const g = SL.map((s, k) => geoAt(s, k, tOf(k, q), sOf(k, q))); return { tx: 0, ty: (g[0].yc + g[3].yc) / 2, tz: lerp(2 * T, 1.6 * T, tOf(3, q)) }; };
  const near = v => mob ? [-.04, -.02, 0, .02, .04].flatMap(d => ptsAt(v + d)) : ptsAt(v);
  const key = v => fit({ ...at(v), ...ctr(v) }, near(v), sMax, mob ? 1.1 : 1.06);
  const K6 = key(3.6), K7 = key(3.7);
  const S1 = fit({ a: aEnd, b: 45, ...lf }, pts, sMax, 1.04), S2 = fit({ a: mob ? 26 : 21, b: 45, ...lf }, pts, sMax * 1.04);
  FIN = mob ? [{ q: QF, c: B0 }, { q: 3.6, c: K6 }, { q: 3.65, c: key(3.65) }, { q: 3.7, c: K7 }, { q: 3.8, c: S1 }, { q: 4, c: S2 }]
            : [{ q: QF, c: B0 }, { q: 3.6, c: K6 }, { q: 3.7, c: K7 }, { q: 3.8, c: S1 }, { q: 4, c: S2 }];
}
/* финал: кубическая кривая через ключевые кадры (касательные Катмулла — Рома): из удержания трогается с места,
   дальше без изломов скорости */
function herm(K, q) {
  let i = 0; while (i < K.length - 2 && K[i + 1].q < q) i++;
  const A = K[i], B = K[i + 1], h = B.q - A.q, t = clamp((q - A.q) / h), t2 = t * t, t3 = t2 * t;
  const tan = (j, key) => { if (j === 0) return 0; const P0 = K[j - 1]; if (j === K.length - 1) return (K[j].c[key] - P0.c[key]) / (K[j].q - P0.q) * .5;
    const P1 = K[j + 1]; return (P1.c[key] - P0.c[key]) / (P1.q - P0.q); };
  const o = {};
  for (const key in B.c) { const m0 = tan(i, key) * h, m1 = tan(i + 1, key) * h;
    o[key] = (2 * t3 - 3 * t2 + 1) * A.c[key] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * B.c[key] + (t3 - t2) * m1; }
  return o;
}
function camAt(q) {
  q = clamp(q, 0, 4);
  if (q > QF && FIN.length) return herm(FIN, q);
  let i = 1; while (i < KF.length - 1 && KF[i].q < q) i++;
  const A = KF[i - 1], B = KF[i], t = clamp((q - A.q) / (B.q - A.q || 1)), e = B.e === 1 ? t * t * (3 - 2 * t) : B.e === 2 ? 1 - (1 - t) * (1 - t) : B.e === 3 ? t * t : t;
  const o = {}; for (const key in B.c) o[key] = lerp(A.c[key], B.c[key], e);
  return o;
}

/* ---------- размеры ---------- */
let PIN = 1, dK = [], ZK = 1;
function measure() {
  const sr = st.getBoundingClientRect(); if (!sr.width || !sr.height) return;   /* вид спрятан: ResizeObserver позовёт снова */
  PIN = Math.max(1, sf.offsetHeight - st.offsetHeight);
  mob = ROW.matches;
  const VW = document.documentElement.clientWidth;
  /* большой экран: колонка этапов растёт вместе со сценой (k от 1 при 1800×1000 до 1,6), иначе текст мелкий рядом с большой стопкой */
  const k = mob || FLOW.matches ? 1 : Math.round(clamp(Math.min(sr.width / 1800, sr.height / 1000), 1, 1.6) * 1000) / 1000;
  sEl.style.transform = ''; sEl.style.zoom = k === 1 ? '' : String(k); ZK = k;
  /* этапы с текстами и знак не входят по высоте — компактный список (только при смене размера, не при прокрутке) */
  if (!mob && !FLOW.matches) {
    const cs = getComputedStyle(st), room = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    sf.classList.remove('cmp'); sf.classList.toggle('cmp', dEl.getBoundingClientRect().bottom - ol.getBoundingClientRect().top > room + 1);
  } else sf.classList.remove('cmp');
  if (built !== mob) build();
  if (mob) {
    /* телефон: сцена во всю ширину экрана, от верха поля до ряда этапов */
    const vr = vb.getBoundingClientRect(), xr = sEl.getBoundingClientRect(), L = -sr.left, Tp = vr.top - sr.top - 6;
    Lw = VW; Lh = Math.max(120, xr.top - sr.top - 4 - Tp);
    Object.assign(sk.style, { left: L + 'px', top: Tp + 'px', width: Lw + 'px', height: Lh + 'px' });
    setMask(90, true); sk.style.webkitMaskComposite = ''; sk.style.maskComposite = ''; sk.style.perspective = P + 'px';
    BX = [16, 30, VW - 32, Lh - 64]; buildKF();
  } else {
    /* расстояние «этапы — стопка» одно на всех мониторах: стопка встаёт от правого края самого текста этапов (не колонки сетки)
       на G = 7,5 % высоты сцены (64…150 px). Если экран шире, чем нужно композиции, текст и стопка вместе встают по центру.
       Слой сцены начинается сразу за текстом, его левое затухание лежит в этом промежутке и стопку не задевает */
    const tb = textBox(), G = clamp(.075 * sr.height, 64, 150);
    /* низкое окно (глава не липнет): сцена высотой с окно, по середине главы */
    Lh = FLOW.matches ? Math.min(sr.height, innerHeight) : sr.height; FT = (sr.height - Lh) / 2; sk.style.perspective = P + 'px';
    const place = off => {
      const L = tb.r + off - sr.left + 12; Lw = VW - sr.left - L;
      Object.assign(sk.style, { left: L + 'px', top: FT + 'px', width: Lw + 'px', height: Lh + 'px' });
      /* левое затухание — весь промежуток до стопки: нижние плиты террасы гаснут, не доходя до текста */
      maskW = Math.max(40, G - 12); setMask(90, true); sk.style.webkitMaskComposite = 'source-in'; sk.style.maskComposite = 'intersect';
      const l = G - 12; BX = [l, 48, Math.max(200, sr.width - L - l), Lh - 112]; buildKF();
    };
    place(0);
    /* правый край стопки на удержаниях этапов и в финале (видимые плиты): композиция «текст — стопка» встаёт по центру
       по нему; левые нижние плиты уходят под затухание у текста и в ширину не считаются */
    const lay = sk.getBoundingClientRect().left;
    const rMax = Math.max(...[.62, 1.62, 2.62, 3.3, 3.45, 4].map(v => { const c = camAt(v);
      const pts = SL.flatMap((s, k) => v >= k ? cornG(geoAt(s, k, v > QF ? tOf(k, v) : 0, v > QF ? sOf(k, v) : 0)) : []); return lay + c.ax + bbox(c, pts, c.s)[1]; }));
    const gw = rMax - tb.l, free = sr.right - tb.l, off = Math.max(0, Math.round((free - gw) / 2));
    if (off > 0) { sEl.style.transform = `translateX(${(off / k).toFixed(1)}px)`; place(off); }
  }
  /* линия этапов: от первого ромба до верхнего угла знака «Одна команда». Колонка увеличена zoom, поэтому экранные
     расстояния делим на k — внутри колонки они снова умножатся */
  const s0 = sEl.getBoundingClientRect().top;
  dK = lis.map(li => (li.querySelector('.sf-k').getBoundingClientRect().top - s0) / ZK + 11);
  dK.push((tk.getBoundingClientRect().top - s0) / ZK);
  if (!mob) { sEl.style.setProperty('--lt', dK[0].toFixed(2) + 'px'); sEl.style.setProperty('--lh', (dK[4] - dK[0]).toFixed(2) + 'px'); }
  dirty = true; lastA = -1;
}

/* ---------- прокрутка → q от 0 до 4; последние 6 % — стоим на итоге ---------- */
function progress() {
  if (FLOW.matches) { const c = st.getBoundingClientRect().top + FT + Lh / 2; return 4 * clamp((1.05 * innerHeight - c) / (.55 * innerHeight)); }
  return 4 * clamp(-sf.getBoundingClientRect().top / (.94 * PIN));
}
function scrollFor(q) {
  if (FLOW.matches) { const c = st.getBoundingClientRect().top + FT + Lh / 2; return scrollY + c - (1.05 * innerHeight - q / 4 * .55 * innerHeight); }
  return scrollY + sf.getBoundingClientRect().top + q / 4 * .94 * PIN;
}

function textBox() {
  let l = 1e9, r = -1e9;
  sEl.querySelectorAll('.sf-o b, .sf-o p, .sf-p span, .sf-d b, .sf-d p, .sf-k, .sf-tk').forEach(e => {   /* в компактном списке — самый широкий из текстов этапов: место стопки не зависит от этапа */
    if (getComputedStyle(e).visibility === 'hidden' || e.getBoundingClientRect().width < 2) return;   /* спрятанный текст (компактный список) не в счёт */
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = e.children.length || e.tagName.toLowerCase() === 'svg' ? [e.getBoundingClientRect()] : [...rg.getClientRects()];   /* у текста — сами строки, не ширина блока */
    for (const b of rs) if (b.width > 1) { l = Math.min(l, b.left); r = Math.max(r, b.right); }
  });
  return { l, r };
}
/* края слоя: слева сцена растворяется у шагов; снизу нижние плиты уходят в чёрное, а не режутся краем экрана.
   В финале нижнего растворения нет: фундамент стоит на полу целиком */
let maskH = -1, maskW = 64;
function setMask(h, force) {
  h = Math.round(h); if (h === maskH && !mob && !force) return; maskH = h;
  sk.style.webkitMaskImage = sk.style.maskImage = mob ? 'linear-gradient(180deg,transparent 0,#000 26px,#000 calc(100% - 30px),transparent 100%)'
    : `linear-gradient(90deg,transparent 0,#000 ${maskW}px),linear-gradient(180deg,#000 calc(100% - ${h + 1}px),transparent 100%)`;
}
/* ---------- кадр ---------- */
let dirty = true, lastQ = -1, finWas = false;
const mixC = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
const ORC = [255, 92, 10], GRC = [34, 34, 38], BKC = [6, 6, 7], DOR = [176, 64, 10];
/* цвет кромки: от светлой (у прошлых плит) или оранжевой (у текущей) — к оранжевой */
const edgeC = (e, cur, a0) => cur ? 'rgba(255,92,10,1)' : `rgba(255,${Math.round(255 - 163 * e)},${Math.round(255 - 245 * e)},${(a0 + (1 - a0) * e).toFixed(3)})`;
function render(q) {
  q = clamp(q, 0, 4);
  const c = camAt(q), Zc = P * (1 - 1 / c.s);
  sk.style.perspectiveOrigin = `${px(c.ax)} ${px(c.ay)}`;
  vw.style.transform = `translate3d(${px(c.ax)},${px(c.ay)},0) translateZ(${px(Zc)}) rotateX(${c.a.toFixed(3)}deg) rotateZ(${c.b.toFixed(3)}deg) translate3d(${px(-c.tx)},${px(-c.ty)},${px(-c.tz)})`;
  const top = Math.min(3, Math.floor(q)), topIn = top === 0 || q - top >= LAND;
  const fin = q > QF, tk = SL.map((s, k) => fin ? tOf(k, q) : 0), tz = SL.map((s, k) => fin ? sOf(k, q) : 0);
  if (!mob) setMask(90 * (1 - sm(clamp((q - QF) / (PK(3)[1] - QF)))));
  /* свечение пола — под тем, что сейчас видно */
  { const pts = [...SL.flatMap((s, k) => q >= k ? cornG(geoAt(s, k, tk[k], tz[k])) : []), ...cornG(geoAt(SL[0], 0, tk[0], tz[0]), 0)], [a, b, d, e] = bbox(c, pts, c.s);
    let w = (b - a) * 1.55, h = (e - d) * 1.05, cx0 = c.ax + (a + b) / 2, cy0 = c.ay + d + (e - d) * .62;
    w = Math.min(w, 2 * Math.min(cx0 - 70, Lw - cx0)); h = Math.min(h, 2 * Math.min(cy0, Lh - cy0) - 8);   /* целиком внутри слоя: край свечения — уже чёрный */
    Object.assign(gl.style, { left: px(cx0 - w / 2), top: px(cy0 - h / 2), width: px(Math.max(0, w)), height: px(Math.max(0, h)) }); }
  const clr = k => fin ? sm(clamp((q - CL(k)[0]) / (CL(k)[1] - CL(k)[0]))) : 0;   /* плита k освобождается от работ */
  { const g0 = geoAt(SL[0], 0, tk[0], tz[0]); base.style.transform = `translate3d(0,${px(g0.yc)},${px(-.5 + g0.z)}) scale(${((g0.W + 26) / (SL[0].W + 26)).toFixed(4)},${((g0.D + 26) / (SL[0].D + 26)).toFixed(4)})`; }
  SLB.forEach(({ o, ws, sh, k, s }) => {
    const u = q - k, on = q >= k;
    o.style.visibility = on ? 'visible' : 'hidden';
    if (sh) { const d = clamp(1 - u / LAND), vis = on && u < LAND; sh.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) { sh.style.transform = sh.style.transform.replace(/ scale\([^)]*\)/, '') + ` scale(${(1 + .25 * d).toFixed(3)})`; sh.style.opacity = (.9 * (1 - d) * (1 - d)).toFixed(3); } }
    if (!on) return;
    const t = tk[k], g = geoAt(s, k, t, tz[k]), sx = g.W / s.W, sy = g.D / s.D;
    const z = s.z + (k ? DROP * (1 - eIn(clamp(u / LAND))) : 0) + (g.z - s.z);
    o.style.transform = `translate3d(0,${px(g.yc)},${px(z)}) scale3d(${sx.toFixed(4)},${sy.toFixed(4)},1)`;
    const isCur = (k === top && topIn) || (k === top - 1 && !topIn), lit = q >= k + s.lit;
    o.classList.toggle('cur', isCur); o.classList.toggle('lit', lit && isCur); o.classList.toggle('past', lit && !isCur);
    const [tf, fr, sr, sl] = o.children, nEl = fr.firstChild;
    if (fin) {
      /* кромка разгорается чуть раньше хода плиты, верх темнеет по ходу, верхняя плита наливается оранжевым, когда ложится */
      const e = clr(k), lw = 2 / Math.min(sx, sy), core = k === 3 ? sm(clamp((q - QC[0]) / (QC[1] - QC[0]))) : 0, cur = k === 3;
      tf.style.background = mixC(GRC, BKC, sm(clamp(t / .7)));                   /* верх темнеет по ходу своей плиты */
      tf.style.boxShadow = `inset 0 0 0 ${lw.toFixed(2)}px ${edgeC(e, cur, .14)}`;     /* кромка разгорается вместе с уходом работ */
      if (s.cf) s.cf.style.transform = `translateZ(${T + .3}px) scale(${core.toFixed(4)})`;   /* оранжевый разливается от центра */
      fr.style.borderTopColor = edgeC(e, cur, .17); sr.style.borderTopColor = sl.style.borderTopColor = edgeC(e, cur, .1);
      for (const f of [fr, sr, sl]) { f.style.background = core > 0 ? mixC([27, 27, 30], DOR, core) : ''; f.style.boxShadow = core > 0 ? `0 0 0 .6px ${mixC([27, 27, 30], [150, 54, 8], core)}` : ''; }
      nEl.style.opacity = (1 - clr(k)).toFixed(3);
      finWas = true;
    } else if (finWas) { for (const f of [tf, fr, sr, sl]) { f.style.background = f.style.boxShadow = f.style.borderTopColor = ''; } nEl.style.opacity = ''; if (s.cf) s.cf.style.transform = `translateZ(${T + .3}px) scale(0)`; }
    /* подписи — только у текущей плиты */
    const lbOn = k === 0 ? 1 : ss(k + LAND, k + LAND + .06, q), lbOff = k < 3 ? 1 - ss(k + 1, k + 1.05, q) : 1 - clr(k);
    const sink = k < 3 ? ss(k + 1 + SINK[0], k + 1 + SINK[1], q) : 0;              /* доски уходят в пазы перед посадкой следующей плиты */
    const wo = clr(k);                                                            /* лежащие работы гаснут волной снизу вверх, перед ходом своей плиты */
    const fade = (el, a) => { for (const f of el.children) f.style.opacity = a; };   /* прозрачность — граням, не объёмной группе: иначе Chrome её сплющивает */
    ws.forEach((w, i) => {
      if (w.k === 'f') { if (w.lbe) w.lbe.style.opacity = (lbOn * lbOff).toFixed(3); fade(w.el, (1 - wo).toFixed(3)); w.sh.style.opacity = (1 - wo).toFixed(3); return; }
      const r = ss(k + w.at, k + w.at + w.d, q), gone = sink >= 1;
      for (const e of [w.el, w.ao, w.gr]) e.style.visibility = gone ? 'hidden' : 'visible';
      if (w.lbe) w.lbe.style.opacity = (ss(k + w.at + w.d * .7, k + w.at + w.d * 1.4, q) * lbOff).toFixed(3);
      if (gone) return;
      /* финал: доски «Сайта» видимо ложатся обратно на плиту, как вставали; гаснут только в конце поворота, вместе с пазом */
      const b0 = CL(3)[0] - .012 + .012 * (i - 1), fo = fin ? sm(clamp((q - b0) / .035)) : 0, fa = fin ? 1 - sm(clamp((q - b0 - .021) / .016)) : 1;
      w.el.style.transform = `translate3d(${w.x}px,${w.yb}px,${px(T - w.h * sink)}) rotateX(${(90 * Math.max(1 - r, fo)).toFixed(2)}deg)`;
      fade(w.el, fa.toFixed(3)); w.gr.style.opacity = fa.toFixed(3);
      w.ao.style.opacity = (r * (1 - sink) * (1 - fo)).toFixed(3);
    });
  });
}
/* провода знака выходят из знака наружу, по очереди: левый, верхний левый, верхний правый, правый;
   клемма появляется, когда провод дошёл, с лёгким перелётом */
const backOut = x => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function wires(q) {
  WIR.forEach((w, i) => { const a = QW + .012 * i, t = sm(clamp((q - a) / .03)), tt = clamp((q - (a + .022)) / .014);
    w.g.style.visibility = t > 0 ? 'visible' : 'hidden'; if (!(t > 0)) return;
    w.bar.style.transform = `scaleX(${t.toFixed(4)})`;
    w.term.style.opacity = tt > 0 ? '1' : '0'; w.term.style.transform = `${w.rot}scale(${backOut(tt).toFixed(4)})`; });
}
/* ---------- этапы слева: текущий и пройденные, линия с заливкой, провода значка «Одна команда» ---------- */
let lastA = -1, q = 0;
function ui(q) {
  const ai = Math.min(3, Math.floor(q));
  if (ai !== lastA) { lis.forEach((li, k) => { li.classList.toggle('on', k === ai); li.classList.toggle('past', k < ai); }); pps.forEach((c, k) => c.classList.toggle('on', k === ai)); lastA = ai; }
  for (let k = 0; k < 4; k++) tk.classList.toggle('l' + (k + 1), q >= k + .86);          /* провод этапа загорается, когда его шаги пройдены */
  const rmF = RM && q > QF, fin = q > QF, full = rmF || q >= PK(3)[1];
  lis.forEach((li, k) => li.classList.toggle('sk-l', rmF || (fin && q >= PK(k)[1] - .02)));      /* в финале этап загорается, когда его плита легла */
  sf.classList.toggle('sk-all', full); sf.classList.toggle('full', full);                 /* знак сложился — «Одна команда» горит */
  let f; if (full) f = 1; else if (mob) f = q / 4; else { const i = Math.min(3, Math.floor(q)), y = dK[i] + (dK[i + 1] - dK[i]) * (q - i); f = (y - dK[0]) / Math.max(1, dK[4] - dK[0]); }
  sEl.style.setProperty('--f', clamp(f).toFixed(4));
}

/* ---------- кадр: только когда глава видна и что-то изменилось ---------- */
let raf = 0, vis = false;
function frame() {
  if (!KF.length || dK.length < 5) return;                                   /* вид спрятан и ещё не измерен (переход с другой страницы) */
  q = progress(); ui(q);
  /* без движения: сцена стоит на итоге этапа, перехода и полёта нет; этапы слева идут по настоящей прокрутке */
  const qs = RM ? (q > QF ? 4 : [.62, 1.62, 2.62, 3.48][Math.min(3, Math.floor(q))]) : q;
  if (dirty || qs !== lastQ) { render(qs); wires(clamp(qs, 0, 4)); lastQ = qs; dirty = false; }
}
function loop() { raf = 0; frame(); }
new IntersectionObserver(es => es.forEach(en => { vis = en.isIntersecting; if (vis) { measure(); if (!raf) raf = requestAnimationFrame(loop); } }), { rootMargin: '50% 0px' }).observe(sf);
addEventListener('scroll', () => { if (vis && !raf) raf = requestAnimationFrame(loop); }, { passive: true });
new ResizeObserver(() => { measure(); frame(); }).observe(st);
if (document.fonts) document.fonts.ready.then(() => { measure(); frame(); });
/* этап по нажатию: страница плавно встаёт туда, где этап почти завершён (обычная прокрутка, колесо не перехватываем) */
ol.addEventListener('click', ev => { const li = ev.target.closest('li'); if (!li) return; const k = lis.indexOf(li); measure(); scrollTo({ top: Math.max(0, scrollFor(k + .86)), behavior: RM ? 'instant' : 'smooth' }); });
/* для проверок */
window.__sf = { get q() { return q; }, measure, frame, scrollFor, geo: () => ({ PIN, flow: FLOW.matches, top: scrollY + sf.getBoundingClientRect().top }) };
window.__sk = { camAt, get KF() { return KF; }, get BX() { return BX; },
  dbg: q => { const c = camAt(q); return SL.flatMap((s, k) => q >= k ? cornG(geoAt(s, k, q > QF ? tOf(k, q) : 0, q > QF ? sOf(k, q) : 0)).map(p => { const [x, y] = proj(c, p, c.s); return [x + c.ax, y + c.ay]; }) : []); } };
measure(); frame();
})();
