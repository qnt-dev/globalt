/* «Реклама»: пример на станции «Реклама» мира «Клиенты». Четыре канала рекламы на одной кофейне ZERNO, такой кофейни нет.
   01 Контекст «Ищет»: человек ищет «кофе с доставкой бишкек», первой отвечает реклама ZERNO.
   02 SEO «Находит»: та же выдача без рекламы. Колесо двигает время от старта до полугода, ZERNO поднимается с 27-го места на 1-е.
      Выдача становится графиком мест: линии соседей серые, линия ZERNO красная.
   03 Таргет «Листает»: лента, среди постов встаёт пост ZERNO, к нему сходятся признаки, по которым он нашёл человека.
   04 Карты «Рядом»: тёмная карта Бишкека, метка ZERNO, круг «10 мин пешком», люди в круге идут к кофейне, карточка с рейтингом и отзывы.
   Итог «Приходит»: четыре канала сходятся линиями в одну точку — сайт кофейни. Сайт показывает следующая станция, «Сайт».
   В конце пример распадается растром в сетку-сонар, возвращается надпись станции, дальше колесо крутит ручку.
   В начале сетка-сонар (sonar.js) слетается в линию поля поиска, прорастает в ней чёрточками, и линия становится линией поля.
   Всё, что движется, — чистая функция положения на шкале примера: колесо назад проигрывает те же шаги в обратном порядке.
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. Разметку модуль строит сам. */
window.GTREK = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr = () => Math.min(devicePixelRatio || 1, 2);
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
const api = { onTalk: null };

/* Разметка */
/* знак ZERNO: зерно разрезано буквой Z. Разрез — цвет фона под знаком (--zbg), знак стоит на красном. */
const MARK = '<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor"/><path d="M8 34H61L39 66H92" fill="none" style="stroke:var(--zbg,#df1f12)" stroke-width="8" stroke-miterlimit="10"/></g></svg>';
const NZROW = '<li class="nz"><div class="u"></div><div class="t"></div><div class="d"></div></li>';
const NZPOST = '<div class="po nz"><div class="ph"><i></i><span class="nm"></span></div><div class="md"></div><div class="ac"><i></i><i></i><i></i></div><p class="tx"></p></div>';
const ADPOST = `<div class="po ad" id="x2-post"><div class="ph"><i class="lg">${MARK}</i><span class="nm"><b>zerno.kg</b><small>Реклама</small></span></div>
  <div class="md x2-md" id="x2-md"><canvas id="x2-pgl" aria-hidden="true"></canvas><div class="word" id="x2-p1"><canvas></canvas></div><div class="word" id="x2-p2"><canvas></canvas></div><span>минут до вашей двери</span></div>
  <div class="by">Заказать<i>›</i></div><p class="tx"><b>zerno.kg</b> Свежая обжарка. Привезём горячим, пока вы на работе.</p></div>`;
const ICO = {
  find: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg>',
  post: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M4 15.5h16M8 18h5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>'
};
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z"/></svg>';
const STARS = `<span class="x2-st" aria-hidden="true">${STAR.repeat(5)}</span>`;
/* Отзывы придуманы для примера, как и кофейня */
const REV = [['Айгерим', 'Капучино лучший на районе.'], ['Тимур', 'Привезли за 17 минут, ещё горячий.'], ['Нурлан', 'Тихо, можно поработать с ноутбуком.']];
const R = document.createElement('div');
R.id = 'x2'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример рекламы. Такой кофейни нет');
R.innerHTML = `
<div id="x2-bg" aria-hidden="true"></div>
<canvas id="x2-tcv" aria-hidden="true"></canvas>
<div id="x2-fly" aria-hidden="true">Бишкек, 2 км от кофейни</div><i id="x2-flyd" aria-hidden="true"></i>
<div id="x2-find">
  <div class="x2-caps">
    <div class="x2-cap" id="x2-c1"><small>01 · Контекст</small><h3>Ищет</h3><p>Человек ввёл запрос, и&nbsp;первыми ответили вы.</p></div>
    <div class="x2-cap" id="x2-c3"><small>02 · SEO</small><h3>Находит</h3><p>Без платы за&nbsp;клик. Сайт сам поднимается в&nbsp;поиске.</p></div>
  </div>
  <div id="x2-sr"><span class="lb">Поиск</span>
    <div id="x2-fld"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg><span id="x2-q"></span><i class="cr"></i></div>
    <div class="x2-body">
      <ol id="x2-res"><li class="ad" id="x2-ad"><div class="u"><b>Реклама</b><span>zerno.kg</span></div><div class="t">ZERNO — кофе за 20 минут</div><div class="d">Свежая обжарка. Привезём горячим по Бишкеку. Заказать →</div></li>${NZROW.repeat(5)}</ol>
      <div id="x2-bump" role="img" aria-label="Места в выдаче за полгода: ZERNO поднимается с 27-го места на первое"><canvas></canvas></div>
    </div>
  </div>
</div>
<div id="x2-feed">
  <div class="x2-cap" id="x2-c2"><small>03 · Таргет</small><h3>Листает</h3><p>Человек ничего не искал, но&nbsp;это было про него.</p></div>
  <div id="x2-stage">
    <svg id="x2-ln" aria-hidden="true"></svg>
    <ul id="x2-tags" aria-label="Кому показали пост"><li>Бишкек, 2 км от кофейни</li><li>25–40 лет</li><li>Любит кофе</li><li>Утро, будни</li></ul>
    <div id="x2-ph"><div class="scr"><div id="x2-roll">${NZPOST.repeat(3)}${ADPOST}${NZPOST.repeat(2)}</div></div></div>
  </div>
</div>
<div id="x2-map">
  <div class="x2-cap" id="x2-c4"><small>04 · Карты</small><h3>Рядом</h3><p>Человек рядом, и&nbsp;карта ведёт его к&nbsp;вам.</p></div>
  <div id="x2-mv">
    <canvas id="x2-mcv" aria-hidden="true"></canvas>
    <div id="x2-pin" aria-hidden="true"><i>${MARK}</i></div>
    <div id="x2-side">
      <div id="x2-card"><div class="hd"><i class="lg">${MARK}</i><div><b>ZERNO</b><small>Кофейня · Бишкек</small></div></div>
        <div class="rt">${STARS}<b id="x2-rate">4,8</b><span id="x2-rcnt">309 отзывов</span></div>
        <div class="ln"><span>6 мин пешком</span><span>Открыто до 22:00</span></div>
        <div class="x2-bt"><span class="x2-go">Маршрут</span><span>Позвонить</span></div></div>
      <ul id="x2-rev" aria-label="Отзывы">${REV.map(([a, b]) => `<li><div>${STARS}<small>${a}</small></div><p>${b}</p></li>`).join('')}</ul>
      <p class="tag">Пример. Такой кофейни нет.</p>
    </div>
  </div>
</div>
<div id="x2-fin">
  <div class="x2-cap" id="x2-c5"><small>Итог</small><h3>Приходит</h3><p>Каждая дорога ведёт на&nbsp;ваш сайт.</p></div>
  <div id="x2-fv">
    <canvas id="x2-fcv" aria-hidden="true"></canvas>
    <ul id="x2-nodes" aria-label="Откуда приходят люди">
      <li data-f="ctx"><b class="x2-wd">Контекст</b><div class="x2-wr"><small>01</small><p>Первые в поиске</p></div></li>
      <li data-f="seo"><b class="x2-wd">SEO</b><div class="x2-wr"><small>02</small><p>№1 без платы за клик</p></div></li>
      <li data-f="tg"><b class="x2-wd">Таргет</b><div class="x2-wr"><small>03</small><p>Тем, кто не искал</p></div></li>
      <li data-f="map"><b class="x2-wd">Карты</b><div class="x2-wr"><small>04</small><p>Тем, кто рядом</p></div></li>
    </ul>
    <div id="x2-hub"><div class="x2-bw">
      <div class="x2-br"><i></i><i></i><i></i><span>zerno.kg</span></div>
      <div class="x2-site">
        <div class="x2-shd"><i class="x2-mk">${MARK}</i><b>ZERNO</b><span>Меню</span><span>Доставка</span></div>
        <div class="x2-shero"><b>ZERNO</b><b class="o">20</b></div>
        <p class="x2-ssub">Кофе за 20 минут</p>
        <span class="x2-by">Заказать<i>›</i></span>
      </div>
      <div class="x2-cntr"><span>Заказы сегодня</span><b id="x2-cnt">31</b></div>
    </div><small>сайт кофейни · пример</small></div>
  </div>
</div>
<div id="x2-th" role="radiogroup" aria-label="Фон примера"><div class="sl"><span>Фон</span><b id="x2-thn">Тёмный</b></div><div class="sk">
  <button type="button" role="radio" aria-checked="true" data-t="d" aria-label="Тёмный фон"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg></button>
  <button type="button" role="radio" aria-checked="false" data-t="l" aria-label="Светлый фон"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg></button>
  <i class="k"></i></div></div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];

/* Шум: серые строки выдачи, соседи по выдаче и посты ленты всё время перебирают буквы, как эфир */
const GLY = 'абвгдежзиклмнопрстуфхцчшэюяАБВГДЕКМНОПРСТ0123456789';
const NOISE = [];
$$('#x2-res .nz .u').forEach((e, i) => NOISE.push([e, 14 + i * 3 % 9]));
$$('#x2-res .nz .t').forEach((e, i) => NOISE.push([e, 26 + i * 7 % 14]));
$$('#x2-res .nz .d').forEach((e, i) => NOISE.push([e, 58 + i * 11 % 20]));
$$('.po.nz .nm').forEach((e, i) => NOISE.push([e, 9 + i * 5 % 7]));
$$('.po.nz .tx').forEach((e, i) => NOISE.push([e, 64 + i * 13 % 30]));
function noise(n) { let s = ''; for (let i = 0; i < n; i++) s += (i % 7 === 6 && hash(i, n) > .3) ? ' ' : GLY[Math.random() * GLY.length | 0]; return s; }
NOISE.forEach(([e, n]) => { e.textContent = noise(n); });
let nzT = 0;
function flicker(dt) {
  if (RM) return false;
  nzT += dt; if (nzT < .09) return false; nzT = 0;
  NOISE.forEach(([e, n]) => { if (Math.random() < .35) e.textContent = noise(n); });
  BUMP.names.forEach((s, i) => { if (Math.random() < .35) BUMP.names[i] = noise(s.length); });
  return true;
}
/* Реклама настраивается из шума, как станция на ручке */
const AD = $$('#x2-ad .u span,#x2-ad .t,#x2-ad .d').map(e => [e, e.textContent]);
function tune(q) {
  AD.forEach(([el, text], k) => {
    let s = ''; for (let i = 0; i < text.length; i++) { const c = text[i], th = ((i * 37 + k * 11) % 100) / 100; s += (c === ' ' || q > th * .9 + .05) ? c : GLY[Math.random() * GLY.length | 0]; }
    if (el.textContent !== s) el.textContent = s;
  });
}
const Q = 'кофе с доставкой бишкек';

/* Цвета холстов берутся из переменных темы: тёмный фон или светлый */
const P = {};
function pal() {
  const lt = R.classList.contains('lt');
  Object.assign(P, { lt, ink: lt ? '0,0,0' : '255,255,255', red: lt ? '#df1f12' : '#ff3a22', glow: lt ? 0 : 1, star: '#ffb03a' });
}
pal();

/* Ленты в картинке поста: свой шейдер из прототипа «Контекст». Белая верхняя, серый песок, красная сердцевина. */
const pcv = $('#x2-pgl');
let gl = null, RP = null;
const VS_LINE = `attribute vec2 a;attribute vec2 d;uniform vec2 uRes;varying vec2 vD;
void main(){vD=d;gl_Position=vec4(a/uRes*2.-1.,0.,1.);}`;
const FS_LINE = `precision highp float;
uniform vec3 uCol;uniform float uSand,uT;varying vec2 vD;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  float e=exp(-vD.x*vD.x*3.2);
  float g=h(floor(gl_FragCoord.xy)+floor(uT*12.));
  float k=mix(1.,.3+step(g,e)*1.05,uSand);
  gl_FragColor=vec4(uCol*e*k*vD.y,0.);
}`;
const M = 220;
const LINES = [
  { c: [.105, .105, .13], w: .19, y: 0.700, sand: 1 },
  { c: [.2, .05, .04], w: .07, y: 0.580, sand: .95 },
  { c: [.1, .1, .125], w: .10, y: 0.470, sand: 1 },
  { c: [.46, .09, .055], w: .018, y: 0.680, sand: .65 },
  { c: [.95, .95, 1], w: .008, y: 0.720, sand: .35, hot: 1 },
  { c: [.075, .075, .095], w: .20, y: 0.330, sand: 1 },
  { c: [.24, .22, .25], w: .012, y: 0.660, sand: .7 }
];
const lineData = new Float32Array((M + 1) * 2 * 4);
function ribbons(cv) {
  const g = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!g) return null;
  const p = g.createProgram();
  for (const [t, src] of [[g.VERTEX_SHADER, VS_LINE], [g.FRAGMENT_SHADER, FS_LINE]]) {
    const o = g.createShader(t); g.shaderSource(o, src); g.compileShader(o);
    if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o));
    g.attachShader(p, o);
  }
  g.linkProgram(p);
  const u = Object.fromEntries(['uRes', 'uCol', 'uSand', 'uT'].map(k => [k, g.getUniformLocation(p, k)]));
  const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, lineData.byteLength, g.DYNAMIC_DRAW);
  g.enable(g.BLEND); g.clearColor(0, 0, 0, 0);
  const la = g.getAttribLocation(p, 'a'), ld = g.getAttribLocation(p, 'd'), pts = new Float32Array((M + 1) * 2);
  return {
    g, clear() { g.viewport(0, 0, cv.width, cv.height); g.clear(g.COLOR_BUFFER_BIT); },
    draw(F, a, T) {
      const d = dpr(), [fx, fy, fw, fh] = F, b0 = cv.height / d - fy - fh, x0 = -.12, x1 = 1.12;
      g.useProgram(p); g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.enableVertexAttribArray(la); g.enableVertexAttribArray(ld);
      g.vertexAttribPointer(la, 2, g.FLOAT, false, 16, 0); g.vertexAttribPointer(ld, 2, g.FLOAT, false, 16, 8);
      g.uniform2f(u.uRes, cv.width, cv.height); g.uniform1f(u.uT, T);
      g.blendFunc(g.ONE, g.ONE);
      for (const L of LINES) {
        let i2 = 0;
        for (let i = 0; i <= M; i++) { const xf = lerp(x0, x1, i / M); pts[i2++] = (fx + xf * fw) * d; pts[i2++] = (b0 + L.y * fh + wave(xf, fh, T)) * d; }
        i2 = 0;
        const hw = Math.max(1.6 * d, L.w * fh * .5 * .62 * d);
        for (let i = 0; i <= M; i++) {
          const a0 = Math.max(0, i - 1), a1 = Math.min(M, i + 1);
          let tx = pts[a1 * 2] - pts[a0 * 2], ty = pts[a1 * 2 + 1] - pts[a0 * 2 + 1];
          const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
          const t = i / M, xf = lerp(x0, x1, t), end = Math.min(1, Math.min(t, 1 - t) / .1);
          const fade = L.hot ? lerp(1, .22, ss(.22, .62, xf)) : 1, lf = lerp(.5, 1, ss(.12, .6, xf));
          const I = fade * (L.hot ? 1 : lf) * a * .85 * end * end;
          const x = pts[i * 2], y = pts[i * 2 + 1], nx = -ty * hw, ny = tx * hw;
          lineData[i2++] = x + nx; lineData[i2++] = y + ny; lineData[i2++] = -1; lineData[i2++] = I;
          lineData[i2++] = x - nx; lineData[i2++] = y - ny; lineData[i2++] = 1; lineData[i2++] = I;
        }
        g.bufferSubData(g.ARRAY_BUFFER, 0, lineData);
        g.uniform3f(u.uCol, L.c[0], L.c[1], L.c[2]); g.uniform1f(u.uSand, L.sand);
        g.drawArrays(g.TRIANGLE_STRIP, 0, (M + 1) * 2);
      }
      g.disableVertexAttribArray(ld);
    }
  };
}
function initGl() {
  if (gl !== null) return;
  RP = ribbons(pcv); gl = !!RP;
  if (!gl) R.classList.add('nogl');
}
/* Изгиб волны в квадратной картинке поста */
function wave(xf, H, T) {
  const x = .57 + (xf - .5) * .62, e = .0045;
  const g = x - 2 * Math.sqrt((x - .44) ** 2 + e) + 2 * Math.sqrt((x - .7) ** 2 + e);
  return H * .42 * (g - .46) + H * .006 * Math.sin(T * .22 + xf * 5);
}

/* Буквы из квадратов в картинке поста: блоки идут за скоростью курсора, клик разбрасывает слово. Перенесено из прототипа «Контекст». */
class Word {
  constructor(box, text, fill) {
    this.box = box; this.c = box.querySelector('canvas'); this.x = this.c.getContext('2d'); this.text = text; this.fill = fill;
    this.src = document.createElement('canvas'); this.m = { x: -1, y: -1, vx: 0, vy: 0, t: 0 }; this.boom = 0; this.dirty = true;
    if (!RM) {
      addEventListener('pointermove', e => this.move(e), { passive: true });
      box.addEventListener('pointerdown', () => { this.boom = 1; this.dirty = true; });
    }
  }
  fit() {
    const r = this.box.getBoundingClientRect(), d = dpr();
    if (!r.width) return;
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    this.c.width = this.src.width = w; this.c.height = this.src.height = h;
    const s = this.src.getContext('2d', { willReadFrequently: true });
    s.clearRect(0, 0, w, h); s.textBaseline = 'alphabetic';
    let fs = h; s.font = `500 ${fs}px Tektur,Montserrat,sans-serif`;
    let mt = s.measureText(this.text);
    fs *= Math.min(w * .97 / mt.width, h * .94 / (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent));
    s.font = `500 ${fs}px Tektur,Montserrat,sans-serif`;
    mt = s.measureText(this.text);
    const y = (h + mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
    s.shadowColor = this.fill[this.fill.length - 1]; s.shadowBlur = 7 * d;
    if (this.fill.length > 1) { const g = s.createLinearGradient(w * .1, h * .1, w * .9, h * .9); this.fill.forEach((f, i) => g.addColorStop(i / (this.fill.length - 1), f)); s.fillStyle = g; } else s.fillStyle = this.fill[0];
    s.fillText(this.text, 0, y);
    const b = this.b = Math.max(4, Math.round(5 * d)); this.gx = Math.ceil(w / b); this.gy = Math.ceil(h / b);
    const data = s.getImageData(0, 0, w, h).data; this.cells = [];
    for (let j = 0; j < this.gy; j++) for (let i = 0; i < this.gx; i++) {
      let on = false;
      for (let yy = j * b; yy < Math.min(h, (j + 1) * b) && !on; yy += 2) for (let xx = i * b; xx < Math.min(w, (i + 1) * b) && !on; xx += 2) if (data[(yy * w + xx) * 4 + 3] > 8) on = true;
      if (on) this.cells.push({ i, j, dx: 0, dy: 0, rx: Math.random() * 2 - 1, ry: Math.random() * 2 - 1 });
    }
    this.w = w; this.h = h; this.dirty = true;
  }
  move(e) {
    if (!X.on) return;
    const r = this.box.getBoundingClientRect();
    if (r.width < 2) return;
    const x = (e.clientX - r.left) * dpr(), y = (e.clientY - r.top) * dpr(), now = performance.now();
    const m = this.m, inside = x > -20 && y > -20 && x < this.w + 20 && y < this.h + 20;
    if (inside && m.t && now - m.t < 120) { m.vx += x - m.x; m.vy += y - m.y; this.dirty = true; }
    m.x = x; m.y = y; m.t = inside ? now : 0;
  }
  step() {
    if (!this.cells) return;
    const m = this.m, R2 = (this.w * .24) ** 2, hot = Math.abs(m.vx) + Math.abs(m.vy) > .4;
    let live = this.dirty || hot;
    const blast = this.boom;
    for (const c of this.cells) {
      c.dx *= .87; c.dy *= .87;
      if (blast) { c.dx += c.rx * this.w * .3; c.dy += c.ry * this.h * .2; }
      if (hot) {
        const px = c.i * this.b - m.x, py = c.j * this.b - m.y, q = px * px + py * py;
        if (q < R2) { const a = Math.pow(1 - q / R2, 2.4); c.dx += (m.vx * 1.15 + c.rx * Math.abs(m.vx) * 1.5) * a; c.dy += (c.ry * Math.abs(m.vy) * .35) * a; }
      }
      if (Math.abs(c.dx) + Math.abs(c.dy) > .4) live = true; else if (!blast && !hot) { c.dx = 0; c.dy = 0; }
    }
    this.boom = 0; m.vx *= .72; m.vy *= .72;
    if (!live) return;
    this.dirty = false;
    const x = this.x, b = this.b;
    x.clearRect(0, 0, this.w, this.h);
    for (const c of this.cells) x.drawImage(this.src, c.i * b, c.j * b, b, b, c.i * b + c.dx, c.j * b + c.dy, b, b);
  }
}
const GR = ['#ffb03a', '#ff5a1a', '#e2240f'];
const P1 = new Word($('#x2-p1'), 'ZERNO', ['#df1f12']), P2 = new Word($('#x2-p2'), '20', GR);

/* Геометрия: сцены стоят между шапкой сайта и строкой над шкалой */
const G = { W: 0, H: 0, wide: true, top: 0, bot: 0 };
function layout() {
  const foot = document.getElementById('air-foot'), bar = document.getElementById('bar'), kr = kl.getBoundingClientRect();
  G.W = innerWidth; G.H = Math.max(240, kr.height || innerHeight); G.wide = G.W > 760;
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom : 56); G.bot = foot.getBoundingClientRect().top - kr.top;
  R.style.setProperty('--top', G.top + 'px'); R.style.setProperty('--bot', Math.max(0, G.H - G.bot) + 'px');
  const tc = $('#x2-tcv'), dd = dpr(); tc.width = Math.round(G.W * dd); tc.height = Math.round(G.H * dd);
  post(); P1.fit(); P2.fit(); bumpFit(); cityFit(); finFit();
}
/* Картинка поста — маленький экран «ZERNO 20»: цифры той же высоты, правый край вровень со словом, зазор около трети высоты букв */
function post() {
  const m = document.createElement('canvas').getContext('2d');
  const met = t => { m.font = '500 100px Tektur,Montserrat,sans-serif'; const r = m.measureText(t); return [r.width, r.actualBoundingBoxAscent + r.actualBoundingBoxDescent]; };
  const [aw, ah] = met('ZERNO'), [bw, bh] = met('20');
  const wOf = h => h * .94 / ah * aw / .97, w2Of = h => h * .94 / bh * bw / .97;
  const set = (el, b) => Object.assign(el.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[3] + 'px' });
  const md = $('#x2-md'), sz = md.offsetWidth;
  if (sz) { const h = sz * .84 / wOf(1), w = wOf(h), w2 = w2Of(h), x = sz * .08, y = sz * .12; set($('#x2-p1'), [x, y, w, h]); set($('#x2-p2'), [x + .97 * (w - w2), y + 1.21 * h, w2, h]); }
  pcv.width = Math.round(sz * dpr()); pcv.height = Math.round(md.offsetHeight * dpr());
}
/* Признаки, по которым пост нашёл человека, стоят по бокам ленты, линии идут к посту */
function tags(a) {
  const st = $('#x2-stage'), sr = st.getBoundingClientRect(), md = $('#x2-md').getBoundingClientRect(), ph = $('#x2-ph').getBoundingClientRect();
  const T = $$('#x2-tags li'), svg = $('#x2-ln');
  if (!G.wide) { T.forEach((t, i) => vis(t, a[i])); svg.innerHTML = ''; return; }
  const cy = md.top + md.height / 2 - sr.top, side = [-1, -1, 1, 1], dy = [-.62, .28, -.36, .56];
  let d = '';
  T.forEach((t, i) => {
    const y = cy + dy[i] * md.height, s = side[i], w = t.offsetWidth;
    const x = s < 0 ? ph.left - sr.left - 26 - w : ph.right - sr.left + 26;
    t.style.transform = `translate(${x}px,${y - t.offsetHeight / 2 + (1 - a[i]) * 10}px)`; vis(t, a[i]);
    const x0 = s < 0 ? x + w : x, x1 = s < 0 ? md.left - sr.left + 8 : md.right - sr.left - 8, y1 = cy + dy[i] * md.height * .5;
    const k = ss(.3, 1, a[i]);
    if (k > 0) d += `<path d="M${x0} ${y}L${lerp(x0, x1, k)} ${lerp(y, y1, k)}"/><circle cx="${x0}" cy="${y}" r="2.5"/>` + (k > .99 ? `<circle cx="${x1}" cy="${y1}" r="3.5" class="hit"/>` : '');
  });
  svg.innerHTML = d;
}

/* ---------- 02 SEO: выдача становится графиком мест ----------
   По горизонтали время (старт … полгода), по вертикали место в выдаче. Справа — выдача в эту минуту: строки едут за своими линиями.
   Места соседей по выдаче и ZERNO (последний столбец) по месяцам. Больше 8 — вторая страница, туда не листают. */
const COLS = ['Старт', 'Месяц 1', 'Месяц 2', 'Месяц 3', 'Месяц 4', 'Полгода'];
const RANK = [
  [1, 2, 3, 4, 5, 6, 7, 8, 27],
  [2, 1, 3, 5, 4, 6, 8, 7, 15],
  [2, 1, 4, 5, 3, 7, 6, 9, 8],
  [1, 2, 5, 6, 3, 8, 7, 10, 4],
  [1, 3, 5, 7, 4, 8, 6, 11, 2],
  [2, 3, 6, 7, 4, 8, 5, 12, 1]
];
const NE = 9, ZE = 8;
const BUMP = { c: null, x: null, w: 0, h: 0, L: null, names: Array.from({ length: 8 }, (_, i) => noise(11 + i * 5 % 9)) };
function bumpFit() {
  const box = $('#x2-bump'), c = BUMP.c = box.querySelector('canvas'), r = box.getBoundingClientRect(), d = dpr();
  if (!r.width) return;
  BUMP.w = r.width; BUMP.h = r.height; c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
  BUMP.x = c.getContext('2d');
  const narrow = r.width < 520, lab = narrow ? Math.min(150, r.width * .4) : Math.min(250, r.width * .36);
  const row = r.height / 12.6, top = row * .35;
  BUMP.L = { row, top, x0: 28, x1: r.width - lab - 22, lx: r.width - lab, sep: top + 8.25 * row, ax: r.height - row * .5, narrow };
}
const yOf = (r, L) => r <= 8 ? L.top + (r - .5) * L.row : L.top + 8 * L.row + L.row * (.62 + .5 * Math.log2(r - 7));
function yAt(e, T, L) { const i = Math.min(4, Math.floor(T)), f = clamp(T - i), k = f * f * (3 - 2 * f); return lerp(yOf(RANK[i][e], L), yOf(RANK[i + 1][e], L), k); }
function rankAt(e, T) { const i = Math.min(4, Math.floor(T)), f = clamp(T - i), k = f * f * (3 - 2 * f); return lerp(RANK[i][e], RANK[i + 1][e], k); }
const xAt = (T, L) => lerp(L.x0, L.x1, T / 5);
function bump(n, a) {
  const L = BUMP.L, c = BUMP.x;
  if (!L || !c) return;
  const d = dpr(), T = 5 * clamp((n - 10.4) / 5.2), ink = P.ink;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, BUMP.w, BUMP.h);
  c.globalAlpha = a; c.textBaseline = 'middle';
  /* места 01–08 слева и тонкие строки */
  c.font = '500 11px "JetBrains Mono",monospace'; c.textAlign = 'left';
  for (let r = 1; r <= 8; r++) {
    const y = yOf(r, L);
    c.fillStyle = `rgba(${ink},.42)`; c.fillText(String(r).padStart(2, '0'), 0, y);
    c.fillStyle = `rgba(${ink},.05)`; c.fillRect(L.x0, Math.round(y), L.lx - L.x0 - 8, 1);
  }
  /* вторая страница: туда не листают */
  c.strokeStyle = `rgba(${ink},.3)`; c.setLineDash([3, 5]); c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, L.sep); c.lineTo(BUMP.w, L.sep); c.stroke(); c.setLineDash([]);
  c.fillStyle = `rgba(${ink},.42)`; c.font = '500 10px "JetBrains Mono",monospace';
  c.fillText(L.narrow ? '2-я страница' : '2-я страница · сюда не листают', 0, L.sep + L.row * .55);
  /* время внизу: прошедшие месяцы ярче, текущий — красный */
  c.textAlign = 'center';
  COLS.forEach((t, i) => {
    const x = xAt(i, L), on = Math.abs(T - i) < .5;
    c.fillStyle = on ? P.red : `rgba(${ink},${i <= T + .01 ? .62 : .3})`;
    c.font = `${on ? 600 : 500} ${L.narrow ? 9 : 11}px "JetBrains Mono",monospace`;
    if (!L.narrow || i % 5 === 0 || on) c.fillText(t.toUpperCase(), x, L.ax);
    c.fillStyle = `rgba(${ink},.18)`; c.fillRect(x, L.ax - L.row * .62, 1, 5);
  });
  /* «сейчас»: тонкая вертикаль */
  const xn = xAt(T, L);
  c.fillStyle = `rgba(${ink},.14)`; c.fillRect(Math.round(xn), L.top - 4, 1, L.ax - L.row * .7 - L.top + 4);
  /* линии соседей, потом линия ZERNO поверх. Ниже второй страницы линии гаснут. */
  const path = e => { c.beginPath(); const st = Math.max(.02, T / 120); for (let t = 0; t <= T + 1e-6; t += st) { const x = xAt(t, L), y = yAt(e, t, L); t ? c.lineTo(x, y) : c.moveTo(x, y); } };
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let e = 0; e < 8; e++) { path(e); c.strokeStyle = `rgba(${ink},${.2 + .05 * (e % 3)})`; c.lineWidth = 2; c.stroke(); }
  const fade = c.createLinearGradient(0, L.sep, 0, L.sep + L.row * 1.4);
  c.globalCompositeOperation = 'destination-out'; fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = fade; c.fillRect(0, L.sep, L.lx - 4, BUMP.h - L.sep - L.row); c.globalCompositeOperation = 'source-over';
  path(ZE); c.strokeStyle = P.red; c.lineWidth = 3.5;
  if (P.glow) { c.shadowColor = P.red; c.shadowBlur = 12; }
  c.stroke(); c.shadowBlur = 0;
  /* головы линий и выдача справа: строка стоит на высоте своей линии. Когда линии сходятся, строки раздвигаются,
     а пунктир от головы линии идёт к своей строке с изломом. */
  const labs = [];
  for (let e = 0; e < NE; e++) {
    const y = yAt(e, T, L), z = e === ZE, al = z ? 1 : 1 - clamp((y - L.sep) / L.row);
    if (al > .01) labs.push({ e, y, ly: y, z, al, h: z ? (L.narrow ? 28 : 32) : 17 });
  }
  labs.sort((p, q) => p.y - q.y);
  for (let it = 0; it < 6; it++) for (let i = 1; i < labs.length; i++) {
    const p = labs[i - 1], q = labs[i], need = (p.h + q.h) / 2 + 3, ov = need - (q.ly - p.ly);
    if (ov > 0) { p.ly -= ov / 2; q.ly += ov / 2; }
  }
  c.textAlign = 'left';
  for (const { e, y, ly, z, al } of labs) {
    c.globalAlpha = a * al;
    const kx = L.lx - Math.min(26, (L.lx - xn) * .3);
    c.strokeStyle = z ? P.red : `rgba(${ink},.25)`; c.setLineDash([1, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(xn + 7, y); c.lineTo(kx, y); c.lineTo(L.lx - 8, ly); c.stroke(); c.setLineDash([]);
    c.fillStyle = z ? P.red : `rgba(${ink},.55)`;
    c.beginPath(); c.arc(xn, y, z ? 5 : 3, 0, Math.PI * 2); c.fill();
    if (z && P.glow) { c.strokeStyle = P.red; c.globalAlpha = a * .35; c.beginPath(); c.arc(xn, y, 10, 0, Math.PI * 2); c.stroke(); c.globalAlpha = a; }
    if (z) {
      const rk = Math.max(1, Math.round(rankAt(ZE, T)));
      c.font = `700 ${L.narrow ? 13 : 15}px Montserrat,sans-serif`; c.fillStyle = P.red; c.fillText('zerno.kg', L.lx, ly - (L.narrow ? 6 : 7));
      c.font = `600 ${L.narrow ? 10 : 11}px Montserrat,sans-serif`;
      c.fillText(L.narrow ? `№ ${rk}` : `№ ${rk} · кофе с доставкой`, L.lx, ly + (L.narrow ? 8 : 10));
    } else {
      c.font = `600 ${L.narrow ? 12 : 14}px Montserrat,sans-serif`; c.fillStyle = `rgba(${ink},.3)`;
      c.fillText(L.narrow ? BUMP.names[e].slice(0, 12) : BUMP.names[e], L.lx, ly);
    }
  }
  c.globalAlpha = 1;
}

/* ---------- 04 Карты: город в псевдо-3D ----------
   Сначала это карта сверху: кварталы и улицы прорастают от кофейни. Потом камера наклоняется и поворачивается, дома поднимаются
   из земли, ближние раньше дальних. Кофейня ZERNO — красное здание на углу двух проспектов, над крышей метка и луч света.
   Люди — точки на улицах. Те, кто внутри круга «10 мин пешком», загораются и идут к кофейне по улицам.
   Город строится один раз в единицах квартала, каждый кадр только проецируется на экран.
   Всё, кроме машин на проспектах, — функция положения на шкале: колесо назад опускает дома обратно. */
const CITY = { ok: false, boxes: null };
const SWD = j => j % 4 === 0 ? .34 : .2;
function cityBuild() {
  const N = 6, boxes = [];
  for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) {
    const x0 = i + SWD(i) / 2, x1 = i + 1 - SWD(i + 1) / 2, y0 = j + SWD(j) / 2, y1 = j + 1 - SWD(j + 1) / 2;
    if ((i === 1 && j === -3) || (i === -3 && j === 1) || (i === 2 && j === 2)) { boxes.push({ park: 1, x0, x1, y0, y1, h: 0, s: hash(i, j) }); continue; }
    const nx = hash(i * 31 + j, 1) > .45 ? 2 : 1, ny = hash(i * 17 + j, 2) > .4 ? 2 : 1, g = .07;
    for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
      const lx0 = lerp(x0, x1, a / nx) + (a ? g / 2 : 0), lx1 = lerp(x0, x1, (a + 1) / nx) - (a < nx - 1 ? g / 2 : 0);
      const ly0 = lerp(y0, y1, b / ny) + (b ? g / 2 : 0), ly1 = lerp(y0, y1, (b + 1) / ny) - (b < ny - 1 ? g / 2 : 0);
      const r = hash(i * 7 + a * 3, j * 13 + b * 5), d = Math.hypot((lx0 + lx1) / 2, (ly0 + ly1) / 2);
      boxes.push({ x0: lx0, x1: lx1, y0: ly0, y1: ly1, h: (.16 + r * r * .85) * (1.2 - .5 * Math.min(1, d / 6)), s: hash(i * 3 + a, j * 5 + b + 9) });
    }
  }
  /* кофейня — угловой участок квартала у перекрёстка проспектов (0, 0) */
  const cafe = boxes.filter(b => !b.park && b.x1 < 0 && b.y1 < 0 && b.x1 > -1 && b.y1 > -1).sort((p, q) => (q.x1 + q.y1) - (p.x1 + p.y1))[0];
  cafe.cafe = 1; cafe.h = .5;
  const C = CITY.c = [(cafe.x0 + cafe.x1) / 2, (cafe.y0 + cafe.y1) / 2];
  /* соседи кофейни ниже неё, чтобы она стояла заметно */
  boxes.forEach(b => {
    b.d = Math.hypot((b.x0 + b.x1) / 2 - C[0], (b.y0 + b.y1) / 2 - C[1]);
    if (!b.cafe && !b.park && b.d < 1.5) b.h = Math.min(b.h, .2 + .1 * b.d);
  });
  CITY.boxes = boxes; CITY.cafe = cafe;
  /* люди на улицах; ходоки — внутри круга, не у самой кофейни. Путь по улицам: до проспекта, к перекрёстку, к двери */
  const people = [], RW = CITY.R = 2.7, door = [(cafe.x0 + cafe.x1) / 2, cafe.y1];
  for (let i = 0; people.length < 170 && i < 2000; i++) {
    const vert = hash(i, 7) > .5, line = Math.round((hash(i, 8) * 2 - 1) * 6), t = (hash(i, 9) * 2 - 1) * 6;
    const x = vert ? line : t, y = vert ? t : line, d = Math.hypot(x - C[0], y - C[1]);
    people.push({ x, y, vert, d, walk: false });
  }
  people.filter(p => p.d > .9 && p.d < RW * .97).sort((a, b) => a.d - b.d).slice(0, 30).forEach((p, j) => {
    p.walk = true;
    const pts = [[p.x, p.y], p.vert ? [p.x, 0] : [0, p.y], [0, 0], [door[0], 0], door];
    const len = [0]; for (let q = 1; q < pts.length; q++) len.push(len[q - 1] + Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]));
    Object.assign(p, { pts, len, t0: 31.2 + (p.d / RW) * .8 + hash(j, 11) * .3 });
    p.t1 = p.t0 + 1.3;
  });
  CITY.people = people;
  /* машины на проспектах: огни едут туда и обратно */
  CITY.cars = Array.from({ length: 22 }, (_, i) => ({ line: [-4, 0, 4][i % 3], vert: i % 2 === 0, dir: hash(i, 21) > .5 ? 1 : -1, sp: .25 + hash(i, 22) * .35, ph: hash(i, 23) * 12, side: hash(i, 24) > .5 ? .07 : -.07 }));
}
function cityFit() {
  const box = $('#x2-mv'), cv = $('#x2-mcv'), r = box.getBoundingClientRect(), d = dpr();
  if (!r.width || !r.height) return;
  if (!CITY.boxes) cityBuild();
  const w = r.width, h = r.height, side = $('#x2-side').getBoundingClientRect();
  cv.width = Math.round(w * d); cv.height = Math.round(h * d);
  const room = G.wide ? side.left - r.left : w;
  Object.assign(CITY, { ok: true, w, h, cx: G.wide ? room * .52 : w * .5, cy: G.wide ? h * .6 : h * .45, k: clamp(Math.min(w / 8.2, h / 5.6), 56, 150) });
}
const walkAt = (p, k) => {
  const L = p.len[p.len.length - 1] * k; let q = 1;
  while (q < p.len.length - 1 && p.len[q] < L) q++;
  const a = p.pts[q - 1], b = p.pts[q], t = clamp((L - p.len[q - 1]) / ((p.len[q] - p.len[q - 1]) || 1));
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
};
function city(n, a) {
  if (!CITY.ok) return;
  const cv = $('#x2-mcv'), c = cv.getContext('2d'), d = dpr(), { w, h, boxes, cafe, people, cars, R: RW } = CITY, C = CITY.c, ink = P.ink, lt = P.lt;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); c.globalAlpha = a;
  /* камера: сверху — наклон и поворот — медленный дрейф до конца главы */
  const tilt = ss(26.4, 28.1, n), pitch = .96 * tilt, yaw = lerp(-.17, .52, ss(26.4, 28.8, n)) + .16 * ss(28.8, 34.8, n) + .35 * ss(34.8, 45, n);
  const V = { c: Math.cos(yaw), s: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch), per: .055 * Math.sin(pitch), k: CITY.k * lerp(.92, 1.08, tilt), cx: CITY.cx, cy: CITY.cy };
  const PJ = (x, y, z) => { const X = x - C[0], Y = y - C[1], xr = X * V.c - Y * V.s, yr = X * V.s + Y * V.c, f = 1 / (1 - yr * V.per); return [V.cx + xr * V.k * f, V.cy + (yr * V.cp - z * V.sp) * V.k * f, yr]; };
  const rev = ss(25.5, 27, n) * 9.5, seen = dd => clamp((rev - dd) / 1.3), fog = dd => 1 - .84 * ss(2.2, 6.2, dd);
  const al = dd => seen(dd) * fog(dd);
  const T = RM ? 8 : performance.now() * .001;
  /* улицы: центральные линии, проспекты ярче. Отрезками, чтобы гасли вдали */
  c.lineCap = 'round';
  for (let i = -6; i <= 6; i++) {
    const av = i % 4 === 0;
    c.lineWidth = av ? 1.4 : 1;
    for (const vert of [true, false]) for (let q = -6; q < 6; q++) {
      const x0 = vert ? i : q, y0 = vert ? q : i, x1 = vert ? i : q + 1, y1 = vert ? q + 1 : i;
      const k = al(Math.hypot((x0 + x1) / 2 - C[0], (y0 + y1) / 2 - C[1]));
      if (k < .01) continue;
      const A = PJ(x0, y0, 0), B = PJ(x1, y1, 0);
      c.strokeStyle = `rgba(${ink},${(av ? .22 : .09) * k})`; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
    }
  }
  /* подписи проспектов на земле, пока город плоский */
  const lab = 1 - ss(26.6, 27.4, n);
  if (lab > .01) {
    c.font = '500 10px "JetBrains Mono",monospace'; c.fillStyle = `rgba(${ink},${.42 * lab * seen(3)})`; c.textBaseline = 'bottom';
    const put = (x, y, dx, dy, t) => { const A = PJ(x, y, 0), B = PJ(x + dx, y + dy, 0); c.save(); c.translate(A[0], A[1]); c.rotate(Math.atan2(B[1] - A[1], B[0] - A[0])); c.fillText(t, 0, -4); c.restore(); };
    put(-3.6, 0, 1, 0, 'ПР. ЧУЙ'); put(0, 1.6, 0, 1, 'УЛ. МАНАСА');
  }
  /* метка бьёт в крышу (30,1), от удара по земле расходится волна и встаёт кругом «10 мин пешком» */
  const wl = clamp((n - 30.1) / 1.1), rr = RW * (1 - (1 - wl) ** 3), wave = wl > 0 && wl < 1;
  CITY.rp = []; for (let q = 0; q < 72; q++) { const an = q / 72 * Math.PI * 2; CITY.rp.push(PJ(C[0] + Math.cos(an) * RW, C[1] + Math.sin(an) * RW, 0)); }
  if (rr > .05) {
    c.beginPath();
    let left = null;
    for (let q = 0; q <= 72; q++) { const an = q / 72 * Math.PI * 2, A = PJ(C[0] + Math.cos(an) * rr, C[1] + Math.sin(an) * rr, 0); q ? c.lineTo(A[0], A[1]) : c.moveTo(A[0], A[1]); if (!left || A[1] < left[1]) left = A; }
    c.fillStyle = P.red; c.globalAlpha = a * .09 * (1 - ss(34.9, 35.6, n)); c.fill(); c.globalAlpha = a;
    CITY.ring = left;
  }
  /* дома, люди и машины рисуются от дальних к ближним, чтобы ближние дома заслоняли дальние и людей за собой */
  const items = [];
  for (const b of boxes) {
    const k = al(b.d); if (k < .01) continue;
    const hk = b.cafe ? ss(27.4, 28.2, n) : ss(26.7 + b.d * .1, 27.45 + b.d * .1, n);
    items.push({ t: 0, b, k, hh: b.h * hk, z: PJ((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0)[2] });
  }
  const walkA = ss(27, 27.8, n);
  const top3 = [];
  if (walkA > .01) for (const p of people) {
    const k = al(p.d) * walkA; if (k < .01) continue;
    let x = p.x, y = p.y, wk = 0;
    if (p.walk) { wk = ss(p.t0, p.t1, n); if (wk >= .999) continue; if (wk > 0) [x, y] = walkAt(p, wk); }
    (p.walk ? top3 : items).push({ t: 1, p, k, x, y, wk, z: PJ(x, y, 0)[2] });
  }
  const carA = ss(27.6, 28.4, n);
  if (carA > .01 && !RM) for (const cr of cars) {
    const u = ((T * cr.sp * cr.dir + cr.ph) % 12 + 12) % 12 - 6, x = cr.vert ? cr.line + cr.side : u, y = cr.vert ? u : cr.line + cr.side;
    const k = al(Math.hypot(x - C[0], y - C[1])) * carA; if (k < .01) continue;
    items.push({ t: 2, cr, k, x, y, z: PJ(x, y, 0)[2] });
  }
  items.sort((p, q) => p.z - q.z);
  const NRM = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const sh = lt ? (f => { const v = Math.round(lerp(214, 242, f)); return `rgb(${v},${v},${v - 3})`; }) : (f => { const v = Math.round(lerp(15, 31, f)); return `rgb(${v},${v},${v + 6})`; });
  for (const it of items) {
    if (it.t === 0) {
      const { b, k, hh } = it;
      const Bs = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]], BB = Bs.map(([x, y]) => PJ(x, y, 0)), TT = Bs.map(([x, y]) => PJ(x, y, hh));
      c.globalAlpha = a * k;
      if (b.park) {
        c.beginPath(); BB.forEach((p, q) => q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
        c.fillStyle = `rgba(${ink},.035)`; c.fill();
        c.fillStyle = `rgba(${ink},.16)`;
        for (let q = 0; q < 14; q++) { const tx = lerp(b.x0 + .08, b.x1 - .08, hash(q, b.s * 50)), ty = lerp(b.y0 + .08, b.y1 - .08, hash(q, b.s * 70)), A = PJ(tx, ty, .04 * tilt); c.beginPath(); c.arc(A[0], A[1], V.k * .035, 0, Math.PI * 2); c.fill(); }
        continue;
      }
      const cafe = b.cafe;
      if (hh > .003) for (let e = 0; e < 4; e++) {
        const [nx, ny] = NRM[e], nyr = nx * V.s + ny * V.c; if (nyr <= 0) continue;
        const nxr = nx * V.c - ny * V.s, f = clamp(.5 - nxr * .5), q = (e + 1) % 4;
        c.beginPath(); c.moveTo(BB[e][0], BB[e][1]); c.lineTo(BB[q][0], BB[q][1]); c.lineTo(TT[q][0], TT[q][1]); c.lineTo(TT[e][0], TT[e][1]); c.closePath();
        c.fillStyle = cafe ? (f > .5 ? '#c9170b' : '#8f1007') : sh(f * .8); c.fill();
        if (!lt || cafe) {
          /* окна: тёплые огни на стенах выше двух этажей */
          const rows = Math.floor(hh / .095), ln = e % 2 ? b.y1 - b.y0 : b.x1 - b.x0, cols = Math.max(2, Math.floor(ln / .13)), ws = Math.max(1.2, V.k * .014);
          for (let r = 0; r < rows; r++) for (let m = 0; m < cols; m++) {
            if (!cafe && hash(b.s * 977 + e * 31 + r, m + 3) < .72) continue;
            const u = (m + .5) / cols, v = (r + .55) / (rows + .3);
            const x = lerp(lerp(BB[e][0], BB[q][0], u), lerp(TT[e][0], TT[q][0], u), v), y = lerp(lerp(BB[e][1], BB[q][1], u), lerp(TT[e][1], TT[q][1], u), v);
            c.fillStyle = cafe ? 'rgba(255,214,170,.85)' : CITY.mono ? 'rgba(255,255,255,.28)' : `rgba(255,${190 + (m * 13 % 30)},120,.5)`; c.fillRect(x - ws / 2, y - ws / 2, ws, ws * 1.3);
          }
        }
      }
      c.beginPath(); TT.forEach((p, q) => q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      if (cafe) {
        const lit = ss(27.8, 28.5, n);
        c.fillStyle = '#ff3d24'; if (P.glow) { c.shadowColor = '#ff3d24'; c.shadowBlur = 30 * lit; } c.fill(); c.shadowBlur = 0;
        c.strokeStyle = `rgba(255,220,200,${.6 * lit})`; c.lineWidth = 1; c.stroke();
      } else {
        c.fillStyle = sh(hh > .003 ? .95 : .55); c.fill();
        /* волна проходит по крышам: крыша вспыхивает красным */
        if (wave) { const tt = Math.max(0, 1 - Math.abs(b.d - rr) / .55) * (1 - wl * .5); if (tt > .01) { c.fillStyle = `rgba(255,61,36,${.6 * tt})`; c.fill(); } }
        c.strokeStyle = `rgba(${ink},${lt ? .14 : .1})`; c.lineWidth = 1; c.stroke();
      }
    } else if (it.t === 1) {
      const { p, k, x, y, wk } = it, lit = p.walk ? clamp((rr - p.d) / .5) : 0, A = PJ(x, y, .02);
      if (p.walk && wk > .02) {
        /* след: короткий хвост по пройденным улицам */
        c.globalAlpha = a * .5 * k; c.strokeStyle = P.red; c.lineWidth = 1.6; c.beginPath();
        for (let q = 0; q <= 8; q++) { const [tx, ty] = walkAt(p, Math.max(0, wk - .2 + q * .025)), B = PJ(tx, ty, .02); q ? c.lineTo(B[0], B[1]) : c.moveTo(B[0], B[1]); }
        c.stroke();
      }
      const fade = p.walk ? 1 - ss(.92, 1, wk) : 1;
      c.globalAlpha = a * k * fade * (p.walk ? lerp(.6, 1, lit) : .55);
      c.fillStyle = lit > .5 ? P.red : `rgb(${ink})`;
      if (lit > .5 && P.glow) { c.shadowColor = P.red; c.shadowBlur = 8; }
      c.beginPath(); c.arc(A[0], A[1], lerp(1.6, 2.8, lit), 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
    } else {
      const { cr, k, x, y } = it, A = PJ(x, y, .02), B = PJ(x - (cr.vert ? 0 : cr.dir * .06), y - (cr.vert ? cr.dir * .06 : 0), .02);
      c.globalAlpha = a * k * .9; c.fillStyle = lt ? '#000' : '#fff'; c.fillRect(A[0] - 1, A[1] - 1, 2, 2);
      c.fillStyle = CITY.mono ? 'rgba(255,255,255,.4)' : '#ff3d24'; c.fillRect(B[0] - 1, B[1] - 1, 2, 2);
    }
  }
  c.globalAlpha = a;
  if (rr > .05) {
    c.beginPath();
    for (let q = 0; q <= 72; q++) { const an = q / 72 * Math.PI * 2, A = PJ(C[0] + Math.cos(an) * rr, C[1] + Math.sin(an) * rr, 0); q ? c.lineTo(A[0], A[1]) : c.moveTo(A[0], A[1]); }
    c.globalAlpha = a * .75 * ss(30.9, 31.3, n) * (1 - ss(34.9, 35.6, n)); c.strokeStyle = P.red; c.lineWidth = 1.3; c.setLineDash([5, 6]); c.stroke(); c.setLineDash([]);
    const la = ss(31, 31.4, n) * (1 - ss(34.9, 35.6, n)), L0 = CITY.ring;
    if (la > 0 && L0) {
      c.globalAlpha = a * la; c.font = '600 11px "JetBrains Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const tw = c.measureText('10 МИН ПЕШКОМ').width; c.fillStyle = lt ? 'rgba(243,243,241,.9)' : 'rgba(9,9,11,.85)'; c.fillRect(L0[0] - tw / 2 - 8, L0[1] - 10, tw + 16, 20);
      c.strokeStyle = P.red; c.lineWidth = 1; c.strokeRect(L0[0] - tw / 2 - 8, L0[1] - 10, tw + 16, 20);
      c.fillStyle = P.red; c.fillText('10 МИН ПЕШКОМ', L0[0], L0[1] + .5); c.textAlign = 'left';
    }
    c.globalAlpha = a;
  }
  if (wave) {
    /* фронт волны: яркое кольцо и два слабых следом; в точке удара вспышка */
    const ring = (r, w, al2) => { c.beginPath(); for (let q = 0; q <= 72; q++) { const an = q / 72 * Math.PI * 2, A = PJ(C[0] + Math.cos(an) * r, C[1] + Math.sin(an) * r, 0); q ? c.lineTo(A[0], A[1]) : c.moveTo(A[0], A[1]); } c.globalAlpha = a * al2; c.lineWidth = w; c.stroke(); };
    c.strokeStyle = P.red; if (P.glow) { c.shadowColor = P.red; c.shadowBlur = 18; }
    ring(rr, 3.2, 1 - wl * .7); c.shadowBlur = 0; ring(rr * .8, 1.6, .5 * (1 - wl)); ring(rr * .62, 1, .3 * (1 - wl));
    const base = PJ(C[0], C[1], 0), fl = 1 - ss(30.1, 30.8, n), g = c.createRadialGradient(base[0], base[1], 0, base[0], base[1], V.k * 1.3);
    g.addColorStop(0, `rgba(255,90,60,${.55 * fl})`); g.addColorStop(1, 'rgba(255,61,36,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(base[0] - V.k * 1.3, base[1] - V.k * 1.3, V.k * 2.6, V.k * 2.6);
    c.globalAlpha = a;
  }
  for (const it of top3) {
    const { p, k, x, y, wk } = it, lit = clamp((rr - p.d) / .5), A = PJ(x, y, .02);
    if (wk > .02) {
      c.globalAlpha = a * .7 * k; c.strokeStyle = P.red; c.lineWidth = 2; c.beginPath();
      for (let q = 0; q <= 10; q++) { const [tx, ty] = walkAt(p, Math.max(0, wk - .25 + q * .025)), B = PJ(tx, ty, .02); q ? c.lineTo(B[0], B[1]) : c.moveTo(B[0], B[1]); }
      c.stroke();
    }
    c.globalAlpha = a * k * (1 - ss(.92, 1, wk)) * lerp(.55, 1, lit);
    c.fillStyle = lit > .5 ? P.red : `rgb(${ink})`;
    if (lit > .5 && P.glow) { c.shadowColor = P.red; c.shadowBlur = 10; }
    c.beginPath(); c.arc(A[0], A[1], lerp(1.8, 3.2, lit), 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
  }
  c.globalAlpha = a;
  /* луч над кофейней и кольца, когда человек пришёл */
  const ch = cafe.h * ss(27.4, 28.2, n), top = PJ(C[0], C[1], ch), beam = ss(30.1, 30.6, n);
  CITY.top = top;
  if (beam > 0) {
    const up = V.k * 1.9 * V.sp, g = c.createLinearGradient(0, top[1], 0, top[1] - up);
    g.addColorStop(0, `rgba(255,61,36,${.32 * beam})`); g.addColorStop(1, 'rgba(255,61,36,0)');
    c.fillStyle = g; const bw = V.k * .16; c.fillRect(top[0] - bw / 2, top[1] - up, bw, up);
  }
  for (const p of people) if (p.walk) {
    const q = ss(p.t1 - .1, p.t1 + .5, n); if (q <= 0 || q >= 1) continue;
    c.globalAlpha = a * (1 - q) * .7; c.strokeStyle = P.red; c.lineWidth = 1; c.beginPath();
    for (let s = 0; s <= 40; s++) { const an = s / 40 * Math.PI * 2, A = PJ(C[0] + Math.cos(an) * (.3 + q * .7), C[1] + Math.sin(an) * (.3 + q * .7), 0); s ? c.lineTo(A[0], A[1]) : c.moveTo(A[0], A[1]); }
    c.stroke();
  }
  c.globalAlpha = 1;
  /* метка падает на крышу два щелчка колеса, разгоняясь, и в ударе приседает */
  const pf = clamp((n - 28.1) / 2), bq = clamp((n - 30.1) / .4), sq = Math.sin(bq * Math.PI) * (1 - bq), pin = $('#x2-pin');
  pin.style.transform = `translate(${top[0] - 22}px,${top[1] - 60 - (1 - pf * pf) * Math.min(320, top[1] + 80)}px) scale(${1 + .2 * sq},${1 - .24 * sq})`; vis(pin, ss(28.1, 28.4, n) * a);
}

/* ---------- Итог: четыре канала сливаются в один поток и входят в сайт ----------
   Слева четыре карточки глав с маленькой картинкой каждой. От карточек идут линии, у сайта они сливаются в один красный поток.
   По линиям всё время бегут точки — это люди. Когда поток доходит, сайт загорается, счётчик заказов растёт. */
const FIN = { trib: [], trunk: null, M: [0, 0], slot: [] };
/* удары карточек каналов о табличку, в щелчках шкалы */
const IMPC = [36.6, 37.2, 37.8, 38.4];
function samp(f, m = 56) {
  const pts = [], len = [0];
  for (let i = 0; i <= m; i++) { pts.push(f(i / m)); if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); }
  return { pts, len, L: len[m] };
}
function along(P0, u) {
  const L = P0.L * clamp(u); let q = 1;
  while (q < P0.len.length - 1 && P0.len[q] < L) q++;
  const a = P0.pts[q - 1], b = P0.pts[q], t = clamp((L - P0.len[q - 1]) / ((P0.len[q] - P0.len[q - 1]) || 1));
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}
const bez = (a, b, c, e) => t => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * e[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * e[1]]; };
/* Заливки букв-окон: в каждом слове — кадр своей главы. Рисуются на холсте под размер слова.
   Контекст — выдача с рекламой ZERNO, SEO — ленты мест и красная лента ZERNO вверх, Таргет — мишень с признаками,
   Карты — снимок нашего же города с кофейней. Фон окон тёмный при любой теме. */
const RED = '#ff3a22';
const FILL = {
  /* серая выдача, красная только строка рекламы ZERNO */
  ctx(x, w, h) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    const u = h / 10; x.textBaseline = 'middle';
    x.fillStyle = RED; x.fillRect(u * .4, u * .7, u * 3.2, u * 1.3); x.fillStyle = '#120605'; x.font = `600 ${u * .8}px "JetBrains Mono",monospace`; x.fillText('Реклама', u * .65, u * 1.37);
    x.fillStyle = RED; x.font = `700 ${u * 1.9}px Montserrat,sans-serif`; x.fillText('ZERNO — кофе за 20 минут', u * .4, u * 3.4);
    x.fillRect(u * .4, u * 4.5, w * .78, u * .3);
    x.fillStyle = 'rgba(255,255,255,.42)'; x.font = `500 ${u * 1.05}px Montserrat,sans-serif`; x.fillText('Свежая обжарка. Привезём горячим по Бишкеку. Заказать →', u * .4, u * 5.6);
    x.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 3; i++) { x.fillRect(u * .4, u * (7 + i * 1.1), w * (.4 + (i * 37 % 40) / 100), u * .55); }
  },
  /* серые ленты соседей, красная лента ZERNO уходит вверх */
  seo(x, w, h) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    const rib = (ys, col, lw, glow) => { const n = ys.length - 1; x.beginPath(); ys.forEach((y, i) => { const px = w * i / n, py = h * y; if (!i) x.moveTo(px - 20, py); else { const qx = w * (i - 1) / n, qy = h * ys[i - 1], mx = (qx + px) / 2; x.bezierCurveTo(mx, qy, mx, py, px, py); } }); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; if (glow) { x.shadowColor = col; x.shadowBlur = glow; } x.stroke(); x.shadowBlur = 0; };
    const k = h / 104;
    rib([.15, .3, .15, .3], 'rgba(255,255,255,.45)', 13 * k); rib([.45, .2, .45, .55], 'rgba(255,255,255,.3)', 13 * k); rib([.7, .6, .75, .8], 'rgba(255,255,255,.22)', 13 * k);
    rib([1.1, .82, .5, .1], RED, 30 * k, 26 * k);
  },
  /* серая мишень, красный центр: человек, которого нашли */
  tg(x, w, h) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    const cx = w * .53, cy = h * .52, st = h / 6;
    for (let r = st * .8, i = 0; r < w * .7; r += st, i++) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); const inner = i < 2; x.strokeStyle = inner ? RED : i % 2 ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.16)'; x.lineWidth = i % 2 ? st * .36 : st * .12; if (inner) { x.shadowColor = RED; x.shadowBlur = st * .8; } x.stroke(); x.shadowBlur = 0; }
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, cy); x.lineTo(w, cy); x.moveTo(cx, 0); x.lineTo(cx, h); x.stroke();
    x.fillStyle = RED; x.shadowColor = RED; x.shadowBlur = 16; x.beginPath(); x.arc(cx, cy, h * .07, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
    x.font = `600 ${h * .1}px "JetBrains Mono",monospace`; x.fillStyle = 'rgba(255,255,255,.6)';
    [['25–40 ЛЕТ', .05, .3], ['ЛЮБИТ КОФЕ', .62, .25], ['2 КМ', .3, .82], ['УТРО, БУДНИ', .7, .8]].forEach(([t, px, py]) => x.fillText(t, w * px, h * py));
  },
  /* серый город, красная кофейня: снимок нашего же города в конце главы «Рядом» */
  map(x, w, h) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    if (!CITY.ok) return;
    CITY.mono = true; city(33.6, 1); CITY.mono = false; vis($('#x2-pin'), 0);
    const src = $('#x2-mcv'), d = dpr(), cw = CITY.k * 5.2, ch = cw * h / w, top = CITY.top || [CITY.cx, CITY.cy];
    const sx = (top[0] - cw * .62) * d, sy = (top[1] - ch * .42) * d;
    x.drawImage(src, sx, sy, cw * d, ch * d, 0, 0, w, h);
    const px = w * .62, py = h * .42 - h * .16;
    x.fillStyle = RED; x.shadowColor = RED; x.shadowBlur = 14; x.beginPath(); x.arc(px, py, h * .11, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py, h * .035, 0, Math.PI * 2); x.fill();
  }
};
/* Живые буквы. Каждое слово — холст под буквами: в нём каждый кадр рисуется картинка канала, и она обрезается по самим буквам
   (тот же шрифт на холсте даёт ту же ширину, что и на странице). Обводку рисуют буквы страницы поверх холста.
   Контекст — страница выдачи медленно уезжает вверх и приходит снова, реклама ZERNO снова первая; SEO — серые ленты текут,
   по красной ленте вверх бегут огни; Таргет — круги мишени расходятся от центра, как радар; Карты — люди идут по улицам к кофейне */
const WDS = {};
function fills() {
  $$('#x2-nodes li').forEach(li => {
    const b = li.querySelector('.x2-wd'), w = b.offsetWidth, h = b.offsetHeight, d = Math.min(devicePixelRatio || 1, 2), f = li.dataset.f;
    if (!w || !h) return;
    let c = b.querySelector('canvas'); if (!c) { c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); b.append(c); }
    c.width = Math.round(w * d); c.height = Math.round(h * d);
    const x = c.getContext('2d'), cs = getComputedStyle(b), fs = parseFloat(cs.fontSize);
    x.font = `800 ${fs}px "Science Gothic"`; x.fontStretch = 'ultra-condensed'; x.letterSpacing = cs.letterSpacing;
    const m = x.measureText(b.firstChild.textContent.toUpperCase()), by = (h + m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
    /* у карты подложка — снимок нашего же города, его рисуем один раз */
    let base = null;
    if (f === 'map') { base = document.createElement('canvas'); base.width = c.width; base.height = c.height; const bx = base.getContext('2d'); bx.scale(d, d); FILL.map(bx, w, h); }
    WDS[f] = { c, x, w, h, d, fs, ls: cs.letterSpacing, t: b.firstChild.textContent.toUpperCase(), by, base };
  });
}
const ANIM = {
  ctx(x, w, h, T) {
    const off = RM ? 0 : (T * h / 7) % h;
    for (const y0 of [-off, h - off]) { x.save(); x.translate(0, y0); FILL.ctx(x, w, h); x.restore(); }
  },
  seo(x, w, h, T) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    const k = h / 104, ph = RM ? 0 : T;
    const path = ys => { const n = ys.length - 1; x.beginPath(); ys.forEach((y, i) => { const px = w * i / n, py = h * y; if (!i) x.moveTo(px - 20, py); else { const qx = w * (i - 1) / n, qy = h * ys[i - 1], mx = (qx + px) / 2; x.bezierCurveTo(mx, qy, mx, py, px, py); } }); };
    const rib = (ys, col, lw, glow) => { path(ys); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; if (glow) { x.shadowColor = col; x.shadowBlur = glow; } x.stroke(); x.shadowBlur = 0; };
    /* серые ленты соседей покачиваются, каждая в своём ритме */
    const wob = (ys, s) => ys.map((y, i) => y + .06 * Math.sin(ph * .9 + i * 1.7 + s));
    rib(wob([.15, .3, .15, .3], 0), 'rgba(255,255,255,.45)', 13 * k); rib(wob([.45, .2, .45, .55], 2), 'rgba(255,255,255,.3)', 13 * k); rib(wob([.7, .6, .75, .8], 4), 'rgba(255,255,255,.22)', 13 * k);
    /* красная лента ZERNO уходит вверх, по ней вверх бегут огни */
    const red = [1.1, .82, .5, .1];
    rib(red, RED, 30 * k, 26 * k);
    path(red); x.strokeStyle = '#ffd2c4'; x.lineWidth = 9 * k; x.setLineDash([w * .1, w * .55]); x.lineDashOffset = -ph * w * .32; x.shadowColor = '#ff8a6a'; x.shadowBlur = 14 * k; x.stroke(); x.setLineDash([]); x.shadowBlur = 0;
  },
  tg(x, w, h, T) {
    x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h);
    const cx = w * .53, cy = h * .52, st = h / 6, q = RM ? 0 : T * .45, fr = q % 1, base = Math.floor(q);
    /* круги расходятся от центра; у каждого свой номер, поэтому цвет круга не мигает, пока он едет */
    for (let j = 0; ; j++) {
      const r = st * .8 + (j + fr) * st; if (r > w * .75) break;
      const id = j - base, odd = ((id % 2) + 2) % 2, inner = r < st * 2.3, fade = 1 - ss(w * .45, w * .75, r);
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
      x.strokeStyle = inner ? RED : odd ? `rgba(255,255,255,${.42 * fade})` : `rgba(255,255,255,${.16 * fade})`; x.lineWidth = odd ? st * .36 : st * .12;
      if (inner) { x.shadowColor = RED; x.shadowBlur = st * .8; } x.stroke(); x.shadowBlur = 0;
    }
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, cy); x.lineTo(w, cy); x.moveTo(cx, 0); x.lineTo(cx, h); x.stroke();
    const pr = h * .07 * (1 + .18 * Math.sin((RM ? 0 : T) * 4));
    x.fillStyle = RED; x.shadowColor = RED; x.shadowBlur = 16; x.beginPath(); x.arc(cx, cy, pr, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
    x.font = `600 ${h * .1}px "JetBrains Mono",monospace`; x.fillStyle = 'rgba(255,255,255,.6)';
    [['25–40 ЛЕТ', .05, .3], ['ЛЮБИТ КОФЕ', .62, .25], ['2 КМ', .3, .82], ['УТРО, БУДНИ', .7, .8]].forEach(([t, px, py]) => x.fillText(t, w * px, h * py));
  },
  map(x, w, h, T, base) {
    if (base) x.drawImage(base, 0, 0, w, h); else { x.fillStyle = '#1d1d24'; x.fillRect(0, 0, w, h); }
    const px = w * .62, py = h * .42 - h * .16, t = RM ? 0 : T;
    /* люди идут к кофейне по улицам: сначала вдоль, потом поперёк; у кофейни краснеют */
    for (let i = 0; i < 18; i++) {
      const p = (t * .11 + i / 18) % 1, sx = w * (.04 + .92 * hash(i, 61)), sy = h * (.15 + .8 * hash(i, 62)), a = ss(0, .08, p) * (1 - ss(.9, 1, p));
      const xx = p < .62 ? lerp(sx, px, ease3(p / .62)) : px, yy = p < .62 ? sy : lerp(sy, py, ease3((p - .62) / .38)), rd = ss(.75, .9, p);
      x.globalAlpha = a; x.fillStyle = rd > .5 ? RED : '#fff'; x.beginPath(); x.arc(xx, yy, h * (.022 + .01 * rd), 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    /* у метки кофейни расходится кольцо */
    const rp = (t % 1.4) / 1.4; x.globalAlpha = .7 * (1 - rp); x.strokeStyle = RED; x.lineWidth = 2; x.beginPath(); x.arc(px, py, h * .11 * (1 + 1.6 * rp), 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
  }
};
const ease3 = t => t * t * (3 - 2 * t);
/* кадр живых букв: картинка канала, потом обрезка по буквам */
function wordsTick(T) {
  Object.entries(WDS).forEach(([f, W]) => {
    const { x, w, h, d } = W;
    x.setTransform(d, 0, 0, d, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h);
    if (f === 'map' && !W.base && CITY.ok) { const b = document.createElement('canvas'); b.width = W.c.width; b.height = W.c.height; const bx = b.getContext('2d'); bx.scale(d, d); FILL.map(bx, w, h); W.base = b; }
    ANIM[f](x, w, h, T, W.base);
    x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1;
    x.font = `800 ${W.fs}px "Science Gothic"`; x.fontStretch = 'ultra-condensed'; x.letterSpacing = W.ls; x.textBaseline = 'alphabetic'; x.fillStyle = '#000';
    x.fillText(W.t, 0, W.by);
    x.globalCompositeOperation = 'source-over';
  });
}
/* Раскладка: четыре слова во всю ширину столбца, размер шрифта — чтобы влезли и по высоте, и по ширине.
   После четвёртого удара столбик сжимается влево (FIN.sc), справа из потока открывается окно сайта. */
function finFit() {
  const box = $('#x2-fv'), r = box.getBoundingClientRect(), cv = $('#x2-fcv'), d = dpr();
  if (!r.width) return;
  const w = box.offsetWidth, h = box.offsetHeight, N = $$('#x2-nodes li'), hub = $('#x2-hub'), bw = hub.querySelector('.x2-bw'), hw = hub.offsetWidth;
  cv.width = Math.round(w * d); cv.height = Math.round(h * d);
  /* на телефоне подпись канала стоит под словом, слово во всю ширину */
  const mob = innerWidth <= 760, gap = clamp(h * .025, 8, 22), fs = mob ? Math.round(Math.min((h * .9 - gap * 3 - 4 * 30) / 3.2, (w - 6) / 4.7, 96)) : Math.round(Math.min((h * .92 - gap * 3 - 30) / 3.25, (w - 200) / 4.7, 150));
  $('#x2-nodes').style.setProperty('--fs', fs + 'px');
  const bh = N.map(li => li.offsetHeight), tot = bh.reduce((p, q) => p + q, 0) + gap * 3;
  let y = (h - tot) / 2;
  const pos = N.map((li, i) => { const p = [0, y]; y += bh[i] + gap; return p; });
  N.forEach((li, i) => { li.dataset.x = pos[i][0]; li.dataset.y = pos[i][1]; });
  FIN.slot = N.map((li, i) => [0, pos[i][1], w, bh[i]]);
  /* после сжатия: слова в масштабе sc от левого края, по центру высоты */
  const wmax = Math.max(...N.map(li => li.querySelector('.x2-wd').offsetWidth));
  const sc = FIN.sc = clamp((w - hw - 170) / wmax, .3, .62);
  const S = N.map((li, i) => [li.querySelector('.x2-wd').offsetWidth * sc + 12, h / 2 + (pos[i][1] + bh[i] * .45 - h / 2) * sc]);
  const hx = w - hw, hy = (h - bw.offsetHeight) / 2, E = [hx - 6, hy + bw.offsetHeight * .5], M = [lerp(Math.max(...S.map(p => p[0])), E[0], .55), E[1]];
  FIN.trib = S.map(p => samp(bez(p, [lerp(p[0], M[0], .55), p[1]], [lerp(p[0], M[0], .7), M[1]], M)));
  hub.style.left = hx + 'px'; hub.style.top = hy + 'px';
  FIN.trunk = samp(t => [lerp(M[0], E[0], t), lerp(M[1], E[1], t)], 12); FIN.M = M; FIN.S = S; FIN.w = w; FIN.h = h;
  fills();
}
function fin(n, a) {
  const N = $$('#x2-nodes li'), now = performance.now();
  wordsTick(RM ? 8 : now * .001);
  /* карточка падает сверху с разгоном и бьёт в свой слот; после удара — короткая вспышка рамки (по времени) */
  N.forEach((li, i) => {
    /* падает «на экран»: сначала крупная, будто ближе к зрителю, с разгоном садится в слот, после удара чуть пружинит */
    const ti = IMPC[i], f = clamp((n - (ti - .5)) / .5), bq = clamp((n - ti) / .3), sc = lerp(1.35, 1, f * f) * (1 - .03 * Math.sin(bq * Math.PI) * (1 - bq));
    li.style.transform = `translate(${+li.dataset.x}px,${+li.dataset.y - (1 - f * f) * 26}px) scale(${sc})`; vis(li, ss(0, .35, f) * a);
    li.style.setProperty('--wr', 1 - ss(38.7, 39.1, n));
    const age = (now - (X.hit[i] || -1e9)) / 1000; li.style.setProperty('--hit', n >= ti ? Math.max(0, 1 - age / .7) : 0);
  });
  /* табличка трясётся от удара */
  let dx = 0, dy = 0;
  N.forEach((li, i) => { const age = (now - (X.hit[i] || -1e9)) / 1000; if (age < .42 && n >= IMPC[i]) { const k = 1 - age / .42; dy += 7 * Math.sin(age * 58) * k; dx += 3 * Math.sin(age * 43) * k; } });
  $('#x2-fv').style.transform = dx || dy ? `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)` : '';
  /* все четыре на месте — столбик сжимается влево, освобождая место потоку и сайту */
  const shr = ss(38.7, 39.5, n); $('#x2-nodes').style.transform = `scale(${lerp(1, FIN.sc || .5, shr)})`;
  /* окно сайта раскрывается слева направо оттуда, куда входит поток */
  const hk = ss(40.7, 41.3, n), lit = ss(41.4, 42, n), hub = $('#x2-hub');
  vis(hub, ss(40.65, 40.8, n) * a); hub.style.setProperty('--g', lit); hub.style.transform = ''; hub.style.clipPath = hk < 1 ? `inset(-80px ${(1 - hk) * 100}% -80px -80px)` : '';
  $('#x2-cnt').textContent = Math.round(lerp(31, 48, ss(41.3, 42.5, n)));
  const cv = $('#x2-fcv'), c = cv.getContext('2d'), d = dpr(), { w, h, M, S } = FIN, red = P.red, ink = P.ink;
  if (!FIN.trunk) return;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); c.lineCap = 'round'; c.lineJoin = 'round';
  const T = RM ? 8 : performance.now() * .001;
  /* слоты таблички: пунктир из прилетевших точек, гаснет, когда карточка встала */
  FIN.slot.forEach(([x, y, sw, sh], i) => {
    const k = ss(35.9, 36.3, n) * (1 - ss(IMPC[i] - .12, IMPC[i], n)); if (k <= .01) return;
    c.globalAlpha = a * k; c.strokeStyle = red; c.lineWidth = 1.2; c.setLineDash([3, 5]); c.strokeRect(x + .5, y + .5, sw - 1, sh - 1); c.setLineDash([]);
  });
  /* пыль из-под карточки при ударе (по времени) */
  FIN.slot.forEach(([x, y, sw, sh], i) => {
    const age = (now - (X.hit[i] || -1e9)) / 1000; if (age > .75 || n < IMPC[i]) return;
    c.fillStyle = `rgb(${ink})`;
    for (let j = 0; j < 22; j++) {
      const u = j / 21, side = u < .5 ? -1 : 1, vx = (u - .5) * 220 * (1 + hash(j, i)), vy = -30 - hash(j, i + 7) * 90;
      const px = x + sw * u + vx * age, py = y + sh + vy * age + 260 * age * age;
      c.globalAlpha = a * .5 * (1 - age / .75); c.beginPath(); c.arc(px, py, 1.4 + hash(j, i + 3), 0, Math.PI * 2); c.fill();
    }
  });
  c.globalAlpha = a;
  /* притоки: от серого у карточки к красному у слияния */
  const part = (P0, k) => { c.beginPath(); const m = P0.pts.length - 1, e = Math.max(1, Math.round(m * k)); for (let i = 0; i <= e; i++) { const p = i === e ? along(P0, k) : P0.pts[i]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } };
  const kr = FIN.trib.map((P0, i) => ss(39.4 + i * .15, 40.3 + i * .15, n));
  FIN.trib.forEach((P0, i) => {
    if (kr[i] <= 0) return;
    const g = c.createLinearGradient(S[i][0], S[i][1], M[0], M[1]);
    g.addColorStop(0, `rgba(${ink},.3)`); g.addColorStop(1, red);
    c.globalAlpha = a; c.strokeStyle = g; c.lineWidth = 1.8; part(P0, kr[i]); c.stroke();
    c.fillStyle = `rgba(${ink},.7)`; c.beginPath(); c.arc(S[i][0], S[i][1], 3, 0, Math.PI * 2); c.fill();
  });
  /* слияние и поток в сайт */
  const kt = ss(40.3, 40.8, n);
  if (kt > 0) {
    c.globalAlpha = a; c.strokeStyle = red; c.lineWidth = 5;
    if (P.glow) { c.shadowColor = red; c.shadowBlur = 16; }
    part(FIN.trunk, kt); c.stroke(); c.shadowBlur = 0;
    c.fillStyle = red; c.beginPath(); c.arc(M[0], M[1], 6, 0, Math.PI * 2); c.fill();
    c.globalAlpha = a * .35; c.beginPath(); c.arc(M[0], M[1], 12 + 3 * Math.sin(T * 3), 0, Math.PI * 2); c.strokeStyle = red; c.lineWidth = 1; c.stroke();
  }
  /* точки-люди бегут по притокам и по потоку */
  const fa = ss(40.9, 41.5, n);
  if (fa > 0) {
    c.fillStyle = red; if (P.glow) { c.shadowColor = red; c.shadowBlur = 8; }
    FIN.trib.forEach((P0, i) => { for (let j = 0; j < 5; j++) { const u = (T * .28 + j / 5 + i * .17) % 1; if (u > kr[i]) continue; const p = along(P0, u); c.globalAlpha = a * fa * Math.sqrt(Math.sin(u * Math.PI)) ; c.beginPath(); c.arc(p[0], p[1], 2.3, 0, Math.PI * 2); c.fill(); } });
    for (let j = 0; j < 7; j++) { const u = (T * .7 + j / 7) % 1; if (u > kt) continue; const p = along(FIN.trunk, u); c.globalAlpha = a * fa; c.fillStyle = '#ffd2c4'; c.beginPath(); c.arc(p[0], p[1], 2.4, 0, Math.PI * 2); c.fill(); }
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
}

/* Переход «Рядом» → «Приходит»: точки красного круга срываются с карты и летят вправо, из них встают слоты таблички.
   Чистая функция шкалы: колесо назад возвращает точки на круг. */
function parts(n, a) {
  const cv = $('#x2-tcv'), c = cv.getContext('2d'), d = dpr();
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, G.W, G.H);
  if (n < 34.8 || n > 36.6 || !CITY.rp || !FIN.slot.length) return;
  const r0 = R.getBoundingClientRect(), mv = $('#x2-mv').getBoundingClientRect(), fv = $('#x2-fv').getBoundingClientRect();
  const ox = mv.left - r0.left, oy = mv.top - r0.top, fx = fv.left - r0.left, fy = fv.top - r0.top;
  const per = ([x, y, w, h], u) => { const L = 2 * (w + h); let t = u * L; if (t < w) return [x + t, y]; t -= w; if (t < h) return [x + w, y + t]; t -= h; if (t < w) return [x + w - t, y + h]; t -= w; return [x, y + h - t]; };
  c.fillStyle = P.red; if (P.glow) { c.shadowColor = P.red; c.shadowBlur = 8; }
  const NP = 112, out = 1 - ss(36.1, 36.5, n);
  for (let i = 0; i < NP; i++) {
    const h1 = hash(i, 41), k = ss(34.9 + h1 * .4, 35.85 + h1 * .4, n); if (k <= 0) continue;
    const src = i < 96 ? CITY.rp[Math.floor(i * 72 / 96)] : CITY.top, sx = ox + src[0] + (i < 96 ? 0 : (hash(i, 5) - .5) * 30), sy = oy + src[1] + (i < 96 ? 0 : (hash(i, 6) - .5) * 20);
    const sl = FIN.slot[i % 4], [tx0, ty0] = per(sl, (Math.floor(i / 4) + hash(i, 2) * .3) / (NP / 4)), tx = fx + tx0, ty = fy + ty0;
    const cx = lerp(sx, tx, .5) + (hash(i, 8) - .5) * 160, cy = Math.min(sy, ty) - 80 - hash(i, 9) * 140, u = 1 - k;
    const x = u * u * sx + 2 * u * k * cx + k * k * tx, y = u * u * sy + 2 * u * k * cy + k * k * ty;
    c.globalAlpha = a * out; c.beginPath(); c.arc(x, y, lerp(2.6, 1.6, k), 0, Math.PI * 2); c.fill();
  }
  c.shadowBlur = 0; c.globalAlpha = 1;
}
/* Переход «Листает» → «Рядом»: метка «Бишкек, 2 км от кофейни» срывается с поста, летит на карту и становится точкой кофейни */
function fly(n, a) {
  const f = $('#x2-fly'), dot = $('#x2-flyd');
  if (!X.tagR || !CITY.ok || n < 24.45 || n > 26.5) { vis(f, 0); vis(dot, 0); return; }
  const r0 = R.getBoundingClientRect(), mv = $('#x2-mv').getBoundingClientRect(), [sx, sy, sw, sh] = X.tagR;
  const tx = mv.left - r0.left + CITY.cx, ty = mv.top - r0.top + CITY.cy, k = ss(24.5, 25.4, n);
  const x = lerp(sx, tx, k), y = lerp(sy, ty, k) - Math.sin(k * Math.PI) * 70, sc = lerp(1, .3, ss(.55, 1, k));
  f.style.transform = `translate(${x - sw / 2}px,${y - sh / 2}px) scale(${sc})`; vis(f, a * (1 - ss(25.25, 25.45, n)));
  const dk = ss(25.25, 25.6, n);
  dot.style.transform = `translate(${tx}px,${ty}px) scale(${dk})`; dot.style.setProperty('--p', ss(25.4, 26.3, n)); vis(dot, a * dk * (1 - ss(26, 26.5, n)));
}

/* Шкала примера в щелчках колеса: один щелчок (100 пикселей колеса) — одно деление.
   Поиск 0–8,6, SEO 8,6–17,8, лента 17,4–25,4, карта 25–33,4, итог 33–37,2, уход растром в сетку 37,2–38,8.
   Первые два щелчка — сетка-сонар слетается в линию поля поиска — и уход идут медленнее, колесо в них мягче. */
const TOTAL = 45.6, EXIT = 43;
const STOPS = [0, 7.8, 16.2, 24.2, 34.4, 42.4, TOTAL].map(n => n / TOTAL);
/* удары: метка о крышу и четыре карточки о табличку. Звук и тряска — только когда колесо идёт вперёд */
const IMP = [[30.1, .6, 'pin'], [36.6, 1, 0], [37.2, 1, 1], [37.8, 1, 2], [38.4, 1, 3]];
const X = { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, dark: true, ch: 0, tr: trace(0), pn: null, hit: {}, tagR: null };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, dark: true, ch: 0, pn: null, hit: {} });
  R.classList.remove('on');
  ['#x2-bg', '#x2-find', '#x2-feed', '#x2-map', '#x2-fin', '#x2-th', '#x2-fly', '#x2-flyd'].forEach(s => vis($(s), 0));
  if (gl) RP.clear();
  R.style.opacity = ''; window.GTSONAR?.halftone(R, 0);
  kl.classList.remove('ex', 'exd');
}
const cap = (sel, k) => { const e = $(sel); vis(e, k); e.style.transform = `translateY(${(1 - k) * 16}px)`; };
/* c: near — ручка у станции «Реклама», tuned — станция настроена, alpha — насколько станция слышна */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); initGl(); layout(); }
  const T = RM ? 8 : performance.now() * .001;
  if (!c.tuned) { X.tw = 0; if (X.u <= 0) X.goal = null; }
  else if (!X.auto && X.u <= 0 && X.goal == null) { X.tw += dt; if (X.tw > 6) { X.auto = true; X.goal = STOPS[1]; } }
  /* Щелчок и сам запуск проигрывают отрезок со скоростью четыре щелчка в секунду, колесо ведёт пример само */
  const slow = v => v * TOTAL < 2.3 || v * TOTAL > EXIT;
  if (X.goal != null) { const sp = RM ? 9 : (slow(X.u) ? 1.3 : 4) / TOTAL * dt, d = X.goal - X.u; X.u = Math.abs(d) <= sp ? X.goal : X.u + Math.sign(d) * sp; if (X.u === X.goal) X.goal = null; }
  X.uc = RM || X.goal != null || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * (slow(X.uc) ? 3.5 : 9)));
  const n = X.uc * TOTAL, A = c.alpha;
  X.ph = n <= .1 ? 0 : 1; X.tr = trace(n);
  X.ch = n < 8.9 ? 1 : n < 17.6 ? 2 : n < 25 ? 3 : n < 35.4 ? 4 : 5;
  /* удар при переходе отметки вперёд: звук тяжёлого и время удара для тряски и пыли */
  if (X.pn != null && n > X.pn && n - X.pn < 1.6) for (const [t, k, id] of IMP) if (X.pn < t && n >= t) { X.hit[id] = performance.now(); try { const sd = window.__gt?.air?.snd; id === 'pin' ? sd?.sonar?.(1) : sd?.sonarHit?.(id); } catch (e) {} }
  X.pn = n;
  const tick = flicker(dt);

  /* Свой фон примера: тёмный или светлый. Под ним чёрная станция, она возвращается в конце.
     Светлый фон светлеет, когда линия поля уже собралась: белые точки сетки на светлом не видны. */
  const light = R.classList.contains('lt'), bgA = (light ? ss(1.5, 2.1, n) : ss(.1, 1, n)) * A;
  vis($('#x2-bg'), bgA);

  /* 01 Поиск: запрос печатается сам, выдача шумит, первой настраивается реклама.
     02 SEO: подпись меняется, строки выдачи уходят снизу вверх, на их месте встаёт график мест, время идёт до полугода. */
  const push = ss(16.8, 18.2, n), travel = Math.max(200, (G.bot - G.top) * .86), out1 = ss(17.7, 18.2, n), findA = ss(.8, 1.6, n) * (1 - out1) * A;
  $('#x2-fld').style.setProperty('--fb', X.tr.out);
  vis($('#x2-find'), findA);
  if (findA > .004) {
    $('#x2-find .x2-caps').style.transform = $('#x2-sr').style.transform = `translateY(${-push * travel}px)`;
    const k = Math.round(Q.length * clamp((n - 2) / 2.2)), qe = $('#x2-q');
    if (qe.textContent.length !== k) qe.textContent = Q.slice(0, k);
    R.classList.toggle('typed', k >= Q.length);
    const rows = $$('#x2-res li'), nr = rows.length;
    rows.forEach((li, i) => { const k = ss(3.9 + i * .31, 5.2 + i * .31, n) * (1 - ss(8.6 + (nr - 1 - i) * .12, 9.3 + (nr - 1 - i) * .12, n)); vis(li, k); li.style.transform = `translateY(${(1 - k) * 12}px)`; });
    const tq = ss(5.2, 7.3, n); if (tick || tq >= 1 || RM) tune(tq); $('#x2-ad').classList.toggle('lit', tq > .98); $('#x2-ad').style.setProperty('--q', tq);
    cap('#x2-c1', ss(5.7, 7.3, n) * (1 - ss(8.6, 9.3, n)));
    cap('#x2-c3', ss(9.2, 10.2, n));
    const ba = ss(9.4, 10.4, n); vis($('#x2-bump'), ba);
    if (ba > .004) bump(n, 1);
  }

  /* 03 Лента: посты поднимаются, лента листается и встаёт на посте ZERNO, к посту сходятся признаки */
  const out2 = ss(24.4, 25.2, n), feedA = ss(16.9, 17.3, n) * (1 - out2) * A;
  vis($('#x2-feed'), feedA);
  const md = $('#x2-md');
  if (feedA > .004) {
    $('#x2-stage').style.transform = `translateY(${(1 - push) * travel - out2 * 40}px)`; $('#x2-c2').style.marginTop = `${-out2 * 80}px`;
    $('#x2-ph').style.transform = G.wide ? 'translateX(-50%)' : '';
    const roll = $('#x2-roll'), scr = $('#x2-ph .scr');
    /* картинка поста ровно посередине ленты, offsetTop считается от ленты */
    const end = md.offsetTop + md.offsetHeight / 2 - scr.clientHeight / 2;
    roll.style.transform = `translateY(${-ss(18.4, 22.3, n) * end}px)`;
    tags([0, 1, 2, 3].map(i => i === 0 && n > 24.45 ? 0 : ss(22 + i * .4, 23 + i * .4, n)));
    if (n <= 24.45) { const t0 = $('#x2-tags li').getBoundingClientRect(), r0 = R.getBoundingClientRect(); if (t0.width) X.tagR = [t0.left - r0.left + t0.width / 2, t0.top - r0.top + t0.height / 2, t0.width, t0.height]; }
    cap('#x2-c2', ss(21.5, 23.1, n));
    P1.step(); P2.step();
  }

  /* 04 Карта: карта сверху, камера наклоняется, дома поднимаются, кофейня загорается, круг, люди идут, карточка, отзывы */
  fly(n, A);
  const out3 = ss(34.8, 35.8, n), keep = .4 * ss(35.2, 36.2, n) * (1 - ss(EXIT, EXIT + .8, n)), mapA = Math.max(ss(25.2, 25.8, n) * (1 - out3), keep) * A;
  R.classList.toggle('fdeep', keep > .01 && out3 > .5);
  vis($('#x2-map'), mapA);
  if (mapA > .004) {
    city(n, 1);
    cap('#x2-c4', ss(26.2, 27.6, n) * (1 - out3));
    const ck = ss(31, 31.8, n) * (1 - out3), card = $('#x2-card'); vis(card, ck); card.style.transform = `translateY(${(1 - ck) * 18}px)`;
    let got = 0;
    $$('#x2-rev li').forEach((li, i) => { const k = ss(31.8 + i * .65, 32.5 + i * .65, n) * (1 - out3); if (k > .5) got++; vis(li, k); li.style.transform = `translateY(${(1 - k) * 14}px)`; });
    $('#x2-rcnt').textContent = `${309 + got} отзывов`;
    $('#x2-side .tag').style.opacity = .55 * ck;
  }

  /* Итог: четыре канала, линии к сайту, по линиям бегут точки, сайт загорается */
  parts(n, A);
  const finA = ss(35.3, 35.8, n) * A;
  vis($('#x2-fin'), finA);
  if (finA > .004) { fin(n, 1); cap('#x2-c5', ss(35.6, 36.6, n)); }

  /* Ленты в картинке поста */
  if (gl) { RP.clear(); if (feedA > .004) RP.draw([0, 0, md.offsetWidth, md.offsetHeight], feedA, T); }

  /* Выход: пример распадается растром на кружки на местах точек сетки-сонара (hz), кружки мельчают до точек,
     на них проявляются белые точки сетки, потом пример гаснет (wt): картинка белеет в сетку. */
  const hz = ss(EXIT, EXIT + .8, n), wt = ss(EXIT + .8, EXIT + 1.6, n);
  if (window.GTSONAR) GTSONAR.halftone(R, hz);
  R.style.opacity = 1 - (window.GTSONAR ? wt : ss(EXIT, EXIT + 1.6, n));
  vis($('#x2-th'), Math.max(findA, feedA, mapA, finA * (1 - hz)));
  /* Буквы шапки сайта тёмные только на светлом фоне примера */
  X.dark = !(light && bgA > .5);

  /* Пока идёт пример, надпись станции спрятана. После примера она возвращается. */
  const done = n > TOTAL - .15;
  kl.classList.toggle('ex', X.ph === 1 && !done); kl.classList.toggle('exd', done);
}
/* Колесо: сначала пример, потом ручка. У края пример держит колесо ещё 0,45 секунды, чтобы ручка не уехала по инерции.
   Так же колесо держится перед уходом в сетку, чтобы итог не пролетел. */
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
kl.addEventListener('click', e => { if (X.on && !e.target.closest('button,a,input,#air-foot,#dial,#x2-th,.word')) next(); });
/* На телефоне пример листается пальцем вверх и вниз */
let ty = null;
/* слой примера не ловит касания (pointer-events: none), поэтому палец ловим на всём экране «Клиентов», кроме кнопок, ссылок и шкалы */
kl.addEventListener('pointerdown', e => { if (X.on && e.pointerType === 'touch' && !e.target.closest('button,a,input,#dial,#air-foot')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) layout(); });
/* Холсты букв и графиков не просят шрифты сами, поэтому шрифты грузятся заранее, и холсты пересобираются */
Promise.all(['500 100px Tektur', '600 14px Montserrat', '700 15px Montserrat', '500 11px "JetBrains Mono"'].map(f => document.fonts?.load(f))).then(() => { if (X.on) layout(); }).catch(() => {});

/* Переключатель фона */
$$('#x2-th button').forEach((b, i) => b.addEventListener('click', () => {
  R.classList.toggle('lt', b.dataset.t === 'l');
  $$('#x2-th button').forEach(o => o.setAttribute('aria-checked', o === b));
  $('#x2-th .sk').style.setProperty('--i', i); $('#x2-thn').textContent = i ? 'Светлый' : 'Тёмный';
  pal();
}));

/* Сетка-сонар (sonar.js): точки на линии поля поиска, по одной на отрезок длиной около шага сетки. Чёрточки дорастают до краёв отрезков, и линия сплошная. */
function dots() {
  /* только в начале: в уходе сетка встаёт из растра на своих местах */
  if (!X.on || X.uc * TOTAL > 3) return null;
  const f = $('#x2-fld').getBoundingClientRect(), k = kl.getBoundingClientRect(), n = Math.max(4, Math.round(f.width / 26)), sp = f.width / n, y = f.bottom - 1 - k.top;
  return Array.from({ length: n }, (_, i) => [f.left - k.left + sp * (i + .5), y, 1, 0, sp / 2]);
}
/* Чёрточки растут (g), линия становится линией поля: 2 пикселя цвета --rule (th), потом отдаётся полю (out). На светлом фоне линия чернеет вместе с фоном. */
function trace(n) {
  const lt = R.classList.contains('lt');
  return { g: ss(1, 1.5, n), th: lt ? ss(1.6, 2.1, n) : ss(1.4, 1.9, n), w: 2, a: lt ? 1 : .349, rgb: lt ? [0, 0, 0] : null, out: lt ? ss(2, 2.3, n) : ss(1.8, 2.1, n) };
}
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0], notch: TOTAL, STOPS, TOTAL });
/* dark и state читаются каждый раз заново, поэтому это свойства с геттером, а не копия.
   grid: 0 сетка на надписи, 1 сетки нет. В начале сетка слетается в линию поля, в уходе встаёт из растра. */
Object.defineProperties(api, {
  grid: { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } },
  trace: { get: () => X.on && X.uc * TOTAL < 3 ? X.tr : null },
  dark: { get: () => X.dark }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on, ch: X.ch }) } });
return api;
})();
