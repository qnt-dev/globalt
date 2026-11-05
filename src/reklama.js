/* «Реклама»: пример на станции «Реклама» мира «Клиенты». Контекст и таргет показаны одним рассказом про кофейню ZERNO, такой кофейни нет.
   Порядок: человек ищет «кофе с доставкой бишкек», первой отвечает реклама ZERNO. Это контекст.
   Потом человек листает ленту, и среди постов встаёт пост ZERNO. Это таргет. Пост раскрывается в сайт кофейни.
   Сайт кофейни сделан в стиле красного сайта из maket/kontekst.html. В конце он распадается растром в сетку-сонар, возвращается надпись станции, дальше колесо крутит ручку.
   В начале сетка-сонар (sonar.js) слетается в линию поля поиска, прорастает в ней чёрточками, и линия становится линией поля.
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. Разметку модуль строит сам. */
window.GTREK = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
const api = { onTalk: null };

/* Разметка */
/* знак ZERNO: зерно разрезано буквой Z. Разрез — цвет фона под знаком (--zbg), знак стоит на красном. */
/* тот же знак для шапки: разрез вырезан маской, потому что под шапкой стекло, а не один цвет. Рамка обрезана по зерну. */
const HMARK = '<svg viewBox="16.5 8 67 84" aria-hidden="true"><mask id="x2-zcut"><rect x="-20" y="-20" width="140" height="140" fill="#fff"/><path d="M8 34H61L39 66H92" fill="none" stroke="#000" stroke-width="8" stroke-miterlimit="10"/></mask><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor" mask="url(#x2-zcut)"/></g></svg>';
const MARK = '<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor"/><path d="M8 34H61L39 66H92" fill="none" style="stroke:var(--zbg,#df1f12)" stroke-width="8" stroke-miterlimit="10"/></g></svg>';
const NZROW = '<li class="nz"><div class="u"></div><div class="t"></div><div class="d"></div></li>';
const NZPOST = '<div class="po nz"><div class="ph"><i></i><span class="nm"></span></div><div class="md"></div><div class="ac"><i></i><i></i><i></i></div><p class="tx"></p></div>';
const ADPOST = `<div class="po ad" id="x2-post"><div class="ph"><i class="lg">${MARK}</i><span class="nm"><b>zerno.kg</b><small>Реклама</small></span></div>
  <div class="md x2-md" id="x2-md"><canvas id="x2-pgl" aria-hidden="true"></canvas><div class="word" id="x2-p1"><canvas></canvas></div><div class="word" id="x2-p2"><canvas></canvas></div><span>минут до вашей двери</span></div>
  <div class="by">Заказать<i>›</i></div><p class="tx"><b>zerno.kg</b> Свежая обжарка. Привезём горячим, пока вы на работе.</p></div>`;
/* Меню кофейни: название, цена, фото из maket/img/zerno. Авторы фото в maket/PHOTOS.txt. */
const MENU = [['Эспрессо', 120, 'espresso'], ['Американо', 140, 'americano'], ['Капучино', 190, 'cappuccino'], ['Латте', 200, 'latte'], ['Флэт уайт', 210, 'flatwhite'], ['Раф', 230, 'raf'], ['Колд брю', 220, 'coldbrew'], ['Матча', 240, 'matcha'], ['Какао', 180, 'cocoa'], ['Чай', 110, 'tea'], ['Круассан', 150, 'croissant'], ['Сырники', 260, 'syrniki']];
const R = document.createElement('div');
R.id = 'x2'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример рекламы. Такой кофейни нет');
R.innerHTML = `
<div id="x2-bg" aria-hidden="true"></div>
<div id="x2-open" aria-hidden="true"></div>
<div id="x2-find">
  <div class="x2-cap" id="x2-c1"><small>01 · Контекст</small><h3>Ищет</h3><p>Человек ввёл запрос, и&nbsp;первыми ответили вы.</p></div>
  <div id="x2-sr"><span class="lb">Поиск</span>
    <div id="x2-fld"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg><span id="x2-q"></span><i class="cr"></i></div>
    <ol id="x2-res"><li class="ad" id="x2-ad"><div class="u"><b>Реклама</b><span>zerno.kg</span></div><div class="t">ZERNO — кофе за 20 минут</div><div class="d">Свежая обжарка. Привезём горячим по Бишкеку. Заказать →</div></li>${NZROW.repeat(5)}</ol>
  </div>
</div>
<div id="x2-feed">
  <div class="x2-cap" id="x2-c2"><small>02 · Таргет</small><h3>Листает</h3><p>Человек ничего не искал, но&nbsp;это было про него.</p></div>
  <div id="x2-stage">
    <svg id="x2-ln" aria-hidden="true"></svg>
    <ul id="x2-tags" aria-label="Кому показали пост"><li>Бишкек, 2 км от кофейни</li><li>25–40 лет</li><li>Любит кофе</li><li>Утро, будни</li></ul>
    <div id="x2-ph"><div class="scr"><div id="x2-roll">${NZPOST.repeat(3)}${ADPOST}${NZPOST.repeat(2)}</div></div></div>
  </div>
</div>
<div id="x2-th" role="radiogroup" aria-label="Фон примера"><div class="sl"><span>Фон</span><b id="x2-thn">Тёмный</b></div><div class="sk">
  <button type="button" role="radio" aria-checked="true" data-t="d" aria-label="Тёмный фон"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg></button>
  <button type="button" role="radio" aria-checked="false" data-t="l" aria-label="Светлый фон"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg></button>
  <i class="k"></i></div></div>
<canvas id="x2-gl" aria-hidden="true"></canvas>
<div id="x2-land">
  <div id="x2-hero">
    <div class="word" id="x2-w1" aria-label="ZERNO"><canvas></canvas></div><div class="word" id="x2-w2" aria-label="20 минут"><canvas></canvas></div>
    <div id="x2-meta"><b>Кофе за 20 минут</b>Свежая обжарка, привезём горячим</div>
    <div id="x2-rule"></div>
    <button class="cta" type="button" id="x2-see">Выбрать<br>напиток<i>›</i></button>
    <div id="x2-fil" aria-hidden="true"><div class="tb"><span>Кофе</span><span>Выпечка</span></div><div class="ck"><b>Доставка</b><span>Бишкек</span><span>С 8:00 до 22:00</span><span>Поиск</span></div></div>
  </div>
  <div id="x2-lots">
    <div><h2>Выберите напиток</h2><div id="x2-wall" role="group" aria-label="Меню"></div></div>
    <div id="x2-pick"><small>Кофейня · Бишкек</small><div class="word" id="x2-w3" aria-hidden="true"><canvas></canvas></div><div id="x2-pic" aria-hidden="true"><canvas></canvas></div><div class="x2-order"><div id="x2-price"></div><button class="cta" type="button" id="x2-take"><span>Заказать</span><i>›</i></button></div></div>
  </div>
  <header id="x2-hd"><div class="lg">${HMARK}<div><b>ZERNO</b><small>Кофе с доставкой</small></div></div><nav><span class="t"><button type="button">Войти</button><button type="button">Регистрация</button></span><span class="m"><button type="button" class="on" data-k="lots">Меню</button><button type="button" data-k="lots">Доставка</button><span class="bx"><button type="button" class="k" data-k="lots">Отзывы</button><button type="button" class="in" id="x2-buy">Заказать</button></span></span></nav></header>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>
<div id="x2-sd" role="dialog" aria-modal="true" aria-labelledby="x2-sd-t" hidden><div class="bx"><small>Пример</small><h3 id="x2-sd-t">Здесь человек оформит заказ</h3><p>Реклама привела его на&nbsp;сайт, сайт довёл до&nbsp;покупки.</p><div class="bt"><button type="button" id="x2-sd-x">Понятно</button><button type="button" id="x2-sd-go">Обсудить рекламу</button></div></div></div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];

/* Шум: серые строки выдачи и посты ленты всё время перебирают буквы, как эфир */
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

/* Ленты красного сайта: свой шейдер из maket/kontekst.html. Они живут уже в картинке поста и растут вместе с ним до сайта. */
const canvas = $('#x2-gl'), pcv = $('#x2-pgl');
let gl = null, RB = null, RP = null;
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
/* Ленты: белая верхняя, серый песок, красная сердцевина */
const LINES = [
  { c: [.105, .105, .13], w: .19, y: 0.700, sand: 1, wait: .10 },
  { c: [.2, .05, .04], w: .07, y: 0.580, sand: .95, wait: .05 },
  { c: [.1, .1, .125], w: .10, y: 0.470, sand: 1, wait: .14 },
  { c: [.46, .09, .055], w: .018, y: 0.680, sand: .65, wait: 0 },
  { c: [.95, .95, 1], w: .008, y: 0.720, sand: .35, wait: .02, hot: 1 },
  { c: [.075, .075, .095], w: .20, y: 0.330, sand: 1, wait: .18 },
  { c: [.24, .22, .25], w: .012, y: 0.660, sand: .7, wait: .07 }
];
const lineData = new Float32Array((M + 1) * 2 * 4);
/* Рисовальщик лент на своём холсте. Холстов два: в картинке поста и на весь экран. Оба рисуют одни и те же ленты. */
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
    /* F — рамка [x, y, ширина, высота] в пикселях холста. x0..x1 — какой кусок волны рисовать, в долях рамки: за краями рамки линии продолжаются. */
    draw(F, a, T, x0 = -.12, x1 = 1.12) {
      const d = dpr(), [fx, fy, fw, fh] = F, ap = ss(1.05, 1.6, fw / fh), b0 = cv.height / d - fy - fh;
      g.useProgram(p); g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.enableVertexAttribArray(la); g.enableVertexAttribArray(ld);
      g.vertexAttribPointer(la, 2, g.FLOAT, false, 16, 0); g.vertexAttribPointer(ld, 2, g.FLOAT, false, 16, 8);
      g.uniform2f(u.uRes, cv.width, cv.height); g.uniform1f(u.uT, T);
      g.blendFunc(g.ONE, g.ONE);
      for (const L of LINES) {
        let i2 = 0;
        for (let i = 0; i <= M; i++) {
          const xf = lerp(x0, x1, i / M);
          pts[i2++] = (fx + xf * fw) * d;
          pts[i2++] = (b0 + L.y * fh + wave(xf, fh, T, ap)) * d;
        }
        i2 = 0;
        const hw = Math.max(1.6 * d, L.w * fh * .5 * lerp(.62, 1, ap) * d);
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
  RB = ribbons(canvas); RP = RB && ribbons(pcv); gl = !!RB;
  if (!gl) R.classList.add('nogl');
}
/* Изгиб волны зависит от пропорций рамки: в квадратном посте узкий, на широком экране широкий, поэтому при росте ленты меняются плавно. */
function wave(xf, H, T, ap) {
  const x = lerp(.57 + (xf - .5) * .62, xf, ap), e = .0045, k = lerp(.42, .62, ap);
  const g = x - 2 * Math.sqrt((x - .44) ** 2 + e) + 2 * Math.sqrt((x - .7) ** 2 + e);
  return H * k * (g - .46) + H * .006 * Math.sin(T * .22 + xf * 5);
}

/* Буквы из квадратов: блоки идут за скоростью курсора, клик разбрасывает всё слово. Перенесено из maket/kontekst.html. */
class Word {
  constructor(box, text, fill) {
    this.box = box; this.c = box.querySelector('canvas'); this.x = this.c.getContext('2d'); this.text = text; this.fill = fill;
    this.src = document.createElement('canvas'); this.m = { x: -1, y: -1, vx: 0, vy: 0, t: 0 }; this.boom = 0; this.dirty = true; this.scat = -1;
    if (!RM) {
      addEventListener('pointermove', e => this.move(e), { passive: true });
      box.addEventListener('pointerdown', () => { this.boom = 1; this.dirty = true; });
    }
  }
  set(t) { this.text = t; this.fit(); this.boom = 1; this.dirty = true; }
  fit() {
    const r = this.box.getBoundingClientRect(), d = dpr();
    if (!r.width) return;
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    this.c.width = this.src.width = w; this.c.height = this.src.height = h;
    const s = this.src.getContext('2d', { willReadFrequently: true });
    s.clearRect(0, 0, w, h); s.textBaseline = 'alphabetic';
    let fs = h; s.font = `500 ${fs}px Mussels,Montserrat,sans-serif`;
    let mt = s.measureText(this.text);
    fs *= Math.min(w * .97 / mt.width, h * .94 / (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent));
    s.font = `500 ${fs}px Mussels,Montserrat,sans-serif`;
    mt = s.measureText(this.text);
    const y = (h + mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
    /* где стоят сами буквы внутри коробки, в пикселях экрана: туда прилетают буквы поста */
    this.g = { x: 0, y: (y - mt.actualBoundingBoxAscent) / d, w: mt.width / d, h: (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent) / d };
    s.shadowColor = this.fill[this.fill.length - 1]; s.shadowBlur = 7 * d;
    if (this.fill.length > 1) { const g = s.createLinearGradient(w * .1, h * .1, w * .9, h * .9); this.fill.forEach((f, i) => g.addColorStop(i / (this.fill.length - 1), f)); s.fillStyle = g; } else s.fillStyle = this.fill[0];
    s.fillText(this.text, 0, y);
    const b = this.b = Math.max(5, Math.round(7 * d)); this.gx = Math.ceil(w / b); this.gy = Math.ceil(h / b);
    const data = s.getImageData(0, 0, w, h).data; this.cells = [];
    for (let j = 0; j < this.gy; j++) for (let i = 0; i < this.gx; i++) {
      let on = false;
      for (let yy = j * b; yy < Math.min(h, (j + 1) * b) && !on; yy += 2) for (let xx = i * b; xx < Math.min(w, (i + 1) * b) && !on; xx += 2) if (data[(yy * w + xx) * 4 + 3] > 8) on = true;
      if (on) this.cells.push({ i, j, dx: 0, dy: 0, rx: Math.random() * 2 - 1, ry: Math.random() * 2 - 1, rd: Math.random() });
    }
    this.w = w; this.h = h; this.dirty = true;
  }
  move(e) {
    if (!X.on || X.landA < .5) return;
    const r = this.box.getBoundingClientRect();
    if (r.width < 2) return;
    const x = (e.clientX - r.left) * dpr(), y = (e.clientY - r.top) * dpr(), now = performance.now();
    const m = this.m, inside = x > -20 && y > -20 && x < this.w + 20 && y < this.h + 20;
    if (inside && m.t && now - m.t < 120) { m.vx += x - m.x; m.vy += y - m.y; this.dirty = true; }
    m.x = x; m.y = y; m.t = inside ? now : 0;
  }
  step(scatter) {
    if (!this.cells) return;
    const m = this.m, R2 = (this.w * .24) ** 2, hot = Math.abs(m.vx) + Math.abs(m.vy) > .4;
    let live = this.dirty || hot || Math.abs(scatter - this.scat) > 1e-3;
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
    this.dirty = false; this.scat = scatter;
    const x = this.x, b = this.b;
    x.clearRect(0, 0, this.w, this.h);
    for (const c of this.cells) {
      const k = clamp(scatter * 1.5 - c.rd * .5);
      x.globalAlpha = 1 - k * k;
      if (x.globalAlpha <= .01) continue;
      x.drawImage(this.src, c.i * b, c.j * b, b, b, c.i * b + c.dx + c.rx * k * this.w * .5, c.j * b + c.dy + c.ry * k * this.h * .9, b, b);
    }
    x.globalAlpha = 1;
  }
}
/* Фото напитка. Смена — мозаика волной: старое фото на месте распадается на квадраты, квадраты волной по диагонали
   берут цвет нового фото, потом мельчают, и проступает чёткое новое фото. Фото не пропадает ни на миг.
   Напитки вырезаны из фона нейросетью rembg и стоят прямо над лентами, под ними тень. */
class Pic {
  constructor(box) {
    this.box = box; this.c = box.querySelector('canvas'); this.x = this.c.getContext('2d');
    this.A = this.B = this.img = this.want = null; this.t = 1; this.key = ''; this.cover = false;
    this.tmp = document.createElement('canvas'); this.tc = this.tmp.getContext('2d', { willReadFrequently: true });
  }
  fit() {
    const r = this.c.getBoundingClientRect(), d = dpr();
    if (!r.width || !r.height) return;
    this.w = this.c.width = Math.round(r.width * d); this.h = this.c.height = Math.round(r.height * d);
    this.bs = Math.max(10, Math.round(Math.min(this.w, this.h) / 24));
    if (this.B) { this.A = this.B; this.img = this.want; this.B = null; this.t = 1; }
    if (this.img) this.A = this.lay(this.img);
    this.key = '';
  }
  /* картинка в размер холста: в карточке по меньшей стороне с обрезкой, без фона — целиком, стоит на нижнем крае */
  lay(img) {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const iw = img.naturalWidth, ih = img.naturalHeight, k = this.cover ? Math.max(this.w / iw, this.h / ih) : Math.min(this.w * .94 / iw, this.h * .9 / ih);
    const dw = iw * k, dh = ih * k;
    cv.getContext('2d').drawImage(img, (this.w - dw) / 2, this.cover ? (this.h - dh) / 2 : this.h - dh - this.h * .05, dw, dh);
    return cv;
  }
  /* средний цвет каждого квадрата */
  avg(cv) {
    const nx = Math.ceil(this.w / this.bs), ny = Math.ceil(this.h / this.bs);
    this.tmp.width = nx; this.tmp.height = ny; this.tc.imageSmoothingQuality = 'high';
    this.tc.drawImage(cv, 0, 0, nx * this.bs, ny * this.bs, 0, 0, nx, ny);
    return { nx, ny, d: this.tc.getImageData(0, 0, nx, ny).data };
  }
  /* фото квадратами размера s; щели между квадратами режут фото, их сила — gap от 0 до 1 */
  pix(cv, s, gap) {
    const x = this.x, { w, h } = this;
    if (s <= 1.05) x.drawImage(cv, 0, 0);
    else {
      const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
      this.tmp.width = nx; this.tmp.height = ny; this.tc.imageSmoothingQuality = 'high';
      this.tc.drawImage(cv, 0, 0, nx * s, ny * s, 0, 0, nx, ny);
      x.imageSmoothingEnabled = false; x.drawImage(this.tmp, 0, 0, nx, ny, 0, 0, nx * s, ny * s); x.imageSmoothingEnabled = true;
    }
    if (gap > .02 && s > 3) this.grid(s, gap);
  }
  grid(s, gap) {
    const x = this.x, lw = Math.max(1, dpr());
    x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = Math.min(1, gap);
    for (let p = s; p < this.w; p += s) x.fillRect(p - lw / 2, 0, lw, this.h);
    for (let p = s; p < this.h; p += s) x.fillRect(0, p - lw / 2, this.w, lw);
    x.restore();
  }
  set(img) {
    if (!img || img === this.want) return;
    if (this.B) { this.A = this.B; this.img = this.want; this.B = null; }
    this.want = img;
    if (!this.A || RM || !this.w) { this.img = img; this.A = this.w ? this.lay(img) : null; this.t = 1; this.key = ''; return; }
    this.B = this.lay(img); this.cA = this.avg(this.A); this.cB = this.avg(this.B); this.t = 0;
  }
  /* scroll — меню только выезжает: фото проступает из крупных квадратов */
  step(dt, scroll) {
    if (this.B) { this.t = Math.min(1, this.t + dt / .85); if (this.t >= 1) { this.A = this.B; this.img = this.want; this.B = null; } }
    if (!this.A) return;
    const key = this.t.toFixed(3) + '|' + scroll.toFixed(3);
    if (key === this.key) return;
    this.key = key;
    const x = this.x, bs = this.bs, t = this.t;
    x.clearRect(0, 0, this.w, this.h);
    if (this.B) {
      if (t < .3) { const k = ss(0, .3, t); this.pix(this.A, lerp(1, bs, k), k); }
      else if (t > .7) { const k = 1 - ss(.7, 1, t); this.pix(this.B, lerp(1, bs, k), k); }
      else {
        /* волна по диагонали: квадрат складывается, как плитка, и раскрывается уже цветом нового фото */
        const p = (t - .3) / .4, { nx, ny } = this.cA, a = this.cA.d, b = this.cB.d, gp = Math.max(1, dpr());
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const dg = (i / nx + j / ny) / 2, f = ss(dg * .55, dg * .55 + .45, p), sy = Math.abs(1 - 2 * f), c = f < .5 ? a : b, o = (j * nx + i) * 4;
          if (c[o + 3] < 8) continue;
          const lift = (1 - sy) * .35;
          x.fillStyle = `rgba(${c[o] + (255 - c[o]) * lift | 0},${c[o + 1] + (255 - c[o + 1]) * lift | 0},${c[o + 2] + (255 - c[o + 2]) * lift | 0},${c[o + 3] / 255})`;
          const hh = Math.max(1, (bs - gp) * sy);
          x.fillRect(i * bs, j * bs + (bs - hh) / 2, bs - gp, hh);
        }
      }
    } else if (scroll > .001) {
      x.globalAlpha = 1 - scroll * scroll; this.pix(this.A, lerp(1, bs * 2.2, scroll), scroll); x.globalAlpha = 1;
    } else x.drawImage(this.A, 0, 0);
  }
}
const PIC = new Pic($('#x2-pic'));
/* Фото грузятся, когда ручка подходит к станции. Целые фото лежат в maket/img/zerno, вырезанные — в maket/img/zerno-cut. */
const ZIMG = window.GT_ZERNO_CUT || 'img/zerno-cut/', PICS = [];
let pick = 2;
const cur = i => { const im = PICS[i]; return im && im.complete && im.naturalWidth ? im : null; };
function loadPics() {
  if (PICS.length) return;
  MENU.forEach(([, , f], i) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { if (i === pick) PIC.set(im); }; im.src = ZIMG + f + '.webp'; PICS.push(im); });
}
const GR = ['#ffb03a', '#ff5a1a', '#e2240f'];
const W1 = new Word($('#x2-w1'), 'ZERNO', ['#df1f12']), W2 = new Word($('#x2-w2'), '20', GR), W3 = new Word($('#x2-w3'), 'КАПУЧИНО', GR);
/* те же буквы в картинке поста */
const P1 = new Word($('#x2-p1'), 'ZERNO', ['#df1f12']), P2 = new Word($('#x2-p2'), '20', GR);
const WORDS = [W1, W2, W3, P1, P2];

/* Меню кофейни. Цены придуманы для примера. */
(function () {
  const wall = $('#x2-wall');
  MENU.forEach(([name, price], i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small><b>${name}</b><em>${price} с</em>`;
    if (i === 2) b.className = 'on';
    b.addEventListener('click', () => { wall.querySelector('.on')?.classList.remove('on'); b.classList.add('on'); W3.set(name.toUpperCase()); pick = i; const im = cur(i); if (im) PIC.set(im); $('#x2-price').innerHTML = `${name}, ${price} с<em>Привезём за 20 минут. Пример, такой кофейни нет.</em>`; });
    wall.append(b);
  });
  $('#x2-price').innerHTML = `Капучино, 190 с<em>Привезём за 20 минут. Пример, такой кофейни нет.</em>`;
})();

/* Геометрия: сцены стоят между шапкой сайта и строкой над шкалой */
const G = { W: 0, H: 0, wide: true, top: 0, bot: 0 };
function layout() {
  const foot = document.getElementById('air-foot'), bar = document.getElementById('bar'), kr = kl.getBoundingClientRect();
  G.W = innerWidth; G.H = Math.max(240, kr.height || innerHeight); G.wide = G.W > 760;
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom : 56); G.bot = foot.getBoundingClientRect().top - kr.top;
  R.style.setProperty('--top', G.top + 'px'); R.style.setProperty('--bot', Math.max(0, G.H - G.bot) + 'px');
  const d = dpr();
  canvas.width = Math.round(G.W * d); canvas.height = Math.round(G.H * d);
  R.style.setProperty('--hh', $('#x2-hd').offsetHeight + 'px');
  hero(); WORDS.forEach(w => w.fit()); PIC.fit();
}
/* Раскладка «ZERNO 20» как «ALPHA 05» у референса DeLorean: цифры той же высоты, правый край вровень со словом,
   зазор — около трети высоты букв (замерено по референсу: 0,31). Подпись слева стоит на уровне низа цифр. Пост — маленькая копия этого экрана. */
function hero() {
  const { W, wide } = G, m = document.createElement('canvas').getContext('2d');
  const met = t => { m.font = '500 100px Mussels,Montserrat,sans-serif'; const r = m.measureText(t); return [r.width, r.actualBoundingBoxAscent + r.actualBoundingBoxDescent]; };
  const [aw, ah] = met('ZERNO'), [bw, bh] = met('20');
  /* ширина коробки слова по её высоте: буквы занимают 94% высоты и 97% ширины, как в Word.fit */
  const wOf = h => h * .94 / ah * aw / .97, w2Of = h => h * .94 / bh * bw / .97;
  const place = (x, y, h) => { const w = wOf(h), w2 = w2Of(h); return [[x, y, w, h], [x + .97 * (w - w2), y + 1.21 * h, w2, h]]; };
  const set = (el, b) => Object.assign(el.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[3] + 'px' });
  const md = $('#x2-md'), sz = md.offsetWidth;
  if (sz) { const [a, b] = place(sz * .08, sz * .12, sz * .84 / wOf(1)); set($('#x2-p1'), a); set($('#x2-p2'), b); }
  pcv.width = Math.round(sz * dpr()); pcv.height = Math.round(md.offsetHeight * dpr());
  const w1 = $('#x2-w1'), w2 = $('#x2-w2'), meta = $('#x2-meta'), cta = $('#x2-see'), rule = $('#x2-rule');
  const hb = G.top + 8 + $('#x2-hd').offsetHeight, H = G.bot - hb;
  if (!wide) {
    /* под цифрами остаётся место для подписи и кнопки */
    const h = Math.min((W - 24) / wOf(1), (H - 200) / 2.253), [a, b] = place(12, hb + H * .04, h);
    set(w1, a); set(w2, b);
    meta.style.top = cta.style.top = rule.style.top = meta.style.maxWidth = '';
    return;
  }
  /* сайт кофейни держится в ширине 1313 пикселей по центру, как у референса; слово занимает около 0,45 этой ширины */
  const L = Math.max(clamp(W * .044, 10, 64), (W - 1313) / 2), Rr = L, ctaW = Math.min(288, W * .3);
  let h = Math.min(H * .3, .45 * (W - 2 * L) / wOf(1));
  const room = W - ctaW - Rr - L - 60; if (wOf(h) > room) h = room / wOf(1);
  const [a, b] = place(L, hb + H * .08, h);
  set(w1, a); set(w2, b);
  const bot = b[1] + h * .97, yc = b[1] + h * .55;
  meta.style.maxWidth = Math.max(160, b[0] - L - 24) + 'px'; meta.style.top = bot - meta.offsetHeight + 'px'; cta.style.top = yc + 'px';
  const rl = b[0] + b[2] + 24, rr = W - Rr - ctaW - 18;
  Object.assign(rule.style, { left: rl + 'px', width: Math.max(0, rr - rl) + 'px', top: yc + 76 + 'px', display: rr - rl > 40 ? '' : 'none' });
}
/* Признаки, по которым пост нашёл человека, стоят по бокам телефона, линии идут к посту */
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

/* Шкала примера в щелчках колеса: один щелчок (100 пикселей колеса) — одно деление.
   Поиск 0–10, лента 9–17, из поста выходят линии 17,4–18,8, набирают толщину 18,6–20,2, сайт обрастает частями до 22,4 и стоит три щелчка,
   меню выезжает 25,2–26,8 и стоит три щелчка, перед уходом пауза, уход растром в сетку 29,8–31,5.
   Первые два щелчка — сетка-сонар слетается в линию поля поиска — и уход идут медленнее, колесо в них мягче. */
const TOTAL = 32.4, EXIT = 29.8;
const STOPS = [0, 7.8, 16.4, 22.6, 27.2, TOTAL].map(n => n / TOTAL);
const X = { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, landA: 0, dark: false, ring: null, tr: trace(0) };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, landA: 0, dark: false, ring: null });
  R.classList.remove('on'); $('#x2-sd').hidden = true;
  ['#x2-bg', '#x2-find', '#x2-feed', '#x2-open', '#x2-land', '#x2-th'].forEach(s => vis($(s), 0));
  if (gl) { RB.clear(); RP?.clear(); }
  R.style.opacity = ''; window.GTSONAR?.halftone(R, 0);
  kl.classList.remove('ex', 'exd');
}
/* c: near — ручка у станции «Реклама», tuned — станция настроена, alpha — насколько станция слышна */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); initGl(); layout(); loadPics(); }
  const T = RM ? 8 : performance.now() * .001;
  if (!c.tuned) { X.tw = 0; if (X.u <= 0) X.goal = null; }
  else if (!X.auto && X.u <= 0 && X.goal == null) { X.tw += dt; if (X.tw > 6) { X.auto = true; X.goal = STOPS[1]; } }
  /* Щелчок и сам запуск проигрывают отрезок со скоростью четыре щелчка в секунду, колесо ведёт пример само */
  const slow = v => v * TOTAL < 2.3 || v * TOTAL > EXIT;
  if (X.goal != null) { const sp = RM ? 9 : (slow(X.u) ? 1.3 : 4) / TOTAL * dt, d = X.goal - X.u; X.u = Math.abs(d) <= sp ? X.goal : X.u + Math.sign(d) * sp; if (X.u === X.goal) X.goal = null; }
  X.uc = RM || X.goal != null || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * (slow(X.uc) ? 3.5 : 9)));
  const n = X.uc * TOTAL, A = c.alpha;
  X.ph = n <= .1 ? 0 : 1; X.tr = trace(n);
  const tick = flicker(dt);

  /* Свой фон примера: тёмный или светлый. Под ним чёрная станция, она возвращается в конце.
     Светлый фон светлеет, когда линия поля уже собралась: белые точки сетки на светлом не видны. */
  const light = R.classList.contains('lt'), bgA = (light ? ss(1.5, 2.1, n) : ss(.1, 1, n)) * A;
  vis($('#x2-bg'), bgA);

  /* 1. Поиск: запрос печатается сам, выдача шумит, первой настраивается реклама */
  /* поиск проявляется вокруг линии поля, которую собрала сетка; сама линия поля (--fb) видна, когда сетка её отдала */
  const out1 = ss(8.6, 10.4, n), findA = ss(.8, 1.6, n) * (1 - out1) * A;
  $('#x2-fld').style.setProperty('--fb', X.tr.out);
  vis($('#x2-find'), findA);
  if (findA > .004) {
    $('#x2-find').style.transform = `translateY(${-out1 * 40}px)`;
    const k = Math.round(Q.length * clamp((n - 2) / 2.2)), qe = $('#x2-q');
    if (qe.textContent.length !== k) qe.textContent = Q.slice(0, k);
    R.classList.toggle('typed', k >= Q.length);
    $$('#x2-res li').forEach((li, i) => { const k = ss(3.9 + i * .31, 5.2 + i * .31, n); li.style.opacity = k; li.style.transform = `translateY(${(1 - k) * 12}px)`; });
    const tq = ss(5.2, 7.3, n); if (tick || tq >= 1 || RM) tune(tq); $('#x2-ad').classList.toggle('lit', tq > .98); $('#x2-ad').style.setProperty('--q', tq);
    const c1 = ss(5.7, 7.3, n); vis($('#x2-c1'), c1); $('#x2-c1').style.transform = `translateY(${(1 - c1) * 16}px)`;
  }

  /* 2. Лента: посты поднимаются, лента листается и встаёт на посте ZERNO, к посту сходятся признаки.
     В конце всё, кроме картинки поста, гаснет (rest), картинка остаётся на месте. */
  const rest = 1 - ss(17, 17.8, n), feedA = ss(9.4, 10.9, n) * (1 - ss(19.4, 19.8, n)) * A;
  vis($('#x2-feed'), feedA); $('#x2-feed').style.setProperty('--rest', rest);
  const md = $('#x2-md');
  if (feedA > .004) {
    $('#x2-ph').style.transform = `${G.wide ? 'translateX(-50%) ' : ''}translateY(${(1 - ss(9.4, 11.7, n)) * 70}px)`;
    const roll = $('#x2-roll'), scr = $('#x2-ph .scr');
    /* картинка поста ровно посередине ленты, offsetTop считается от ленты */
    const end = md.offsetTop + md.offsetHeight / 2 - scr.clientHeight / 2;
    roll.style.transform = `translateY(${-ss(10.4, 14.3, n) * end}px)`;
    tags([0, 1, 2, 3].map(i => ss(14 + i * .4, 15 + i * .4, n)));
    const c2 = ss(13.5, 15.1, n); vis($('#x2-c2'), c2 * rest); $('#x2-c2').style.transform = `translateY(${(1 - c2) * 16}px)`;
    /* пост рассыпается квадратами, пока линии набирают толщину */
    const dz = ss(18.6, 19.6, n);
    P1.step(dz); P2.step(dz); md.style.opacity = 1 - ss(18.9, 19.7, n);
  }

  /* 3. Линии выходят из картинки поста влево и вправо до краёв экрана (e1), потом набирают толщину лент сайта (e2),
     и от поста растекается тёмный фон сайта */
  const e1 = ss(17.4, 18.8, n), e2 = ss(18.6, 20.2, n), hz = ss(EXIT, EXIT + .8, n), wt = ss(EXIT + .8, EXIT + 1.6, n), gone = wt >= 1, mr = md.getBoundingClientRect();
  if (n < 17.4 || !X.ring) X.ring = [mr.left, mr.top, mr.width, mr.height];
  const r = X.ring, open = $('#x2-open');
  /* тёмный фон растекается вместе с линиями: на светлом фоне ленты видны только на тёмном */
  const spread = ss(17.4, 19.6, n);
  if (spread > 0 && !gone) {
    /* мягкий край: тёмное пятно лежит под постом и растёт от его середины */
    const rad = spread * (Math.hypot(G.W, G.H) + 260), mk = spread < 1 ? `radial-gradient(circle at ${r[0] + r[2] / 2}px ${r[1] + r[3] / 2}px,#000 ${Math.max(0, rad - 260)}px,transparent ${rad}px)` : 'none';
    open.style.maskImage = open.style.webkitMaskImage = mk; vis(open, A);
  } else vis(open, 0);
  const landA = ss(19.2, 19.8, n) * (gone ? 0 : 1) * A; X.landA = landA;
  vis($('#x2-land'), landA);

  /* 4. Сайт обрастает частями: слова собираются из квадратов, рамка шапки, подпись, линия, кнопка, фильтры */
  if (landA > .004) { const sc = 1 - ss(19.6, 20.8, n); W1.step(sc); W2.step(sc); W3.step(0); PIC.step(dt, 1 - ss(25.6, 26.8, n)); }
  const hd = $('#x2-hd'), hk = ss(20, 21, n);
  hd.style.opacity = ss(20, 20.4, n); hd.style.clipPath = hk < 1 ? `inset(0 ${(1 - hk) * 100}% 0 0 round 8px)` : '';
  const grow = (sel, a, b, f) => { const k = ss(a, b, n), e = $(sel); e.style.opacity = k; e.style.transform = f(k); };
  grow('#x2-meta', 20.6, 21.4, k => `translateY(${(1 - k) * 14}px)`);
  grow('#x2-see', 21.2, 22, k => `translateX(${(1 - k) * 28}px)`);
  grow('#x2-fil', 21.6, 22.4, k => `translateY(${(1 - k) * 12}px)`);
  $('#x2-rule').style.transform = `scaleX(${ss(21, 21.8, n)})`;
  $('#x2-land .tag').style.opacity = .5 * ss(21.6, 22.4, n);
  const lot = ss(25.2, 26.8, n);
  $('#x2-hero').style.transform = `translateY(${-lot * 62}%)`; $('#x2-hero').style.opacity = 1 - ss(25.3, 26.5, n); $('#x2-hero').style.visibility = lot > .95 ? 'hidden' : 'inherit';
  const lots = $('#x2-lots'); lots.style.transform = `translateY(${(1 - lot) * 102}%)`; lots.style.visibility = lot > .001 ? 'inherit' : 'hidden';

  /* Ленты. До раскрытия их рисует холст в картинке поста, за ленточками поста стоят буквы.
     Пока линии выходят, верхний холст рисует только то, что вне картинки. Когда линии толстеют, всё рисует верхний холст. */
  if (gl) {
    RB.clear(); RP.clear();
    const swell = n >= 18.6;
    if (feedA > .004 && !swell) RP.draw([0, 0, md.offsetWidth, md.offsetHeight], feedA, T);
    if (n >= 17.4 && !gone) {
      const d = dpr(), pl = -.08 * G.W, pr = G.W * 1.08;
      const L0 = lerp(-.12, (pl - r[0]) / r[2], e1), R0 = lerp(1.12, (pr - r[0]) / r[2], e1);
      const F = [lerp(r[0], 0, e2), lerp(r[1], 0, e2), lerp(r[2], G.W, e2), lerp(r[3], G.H, e2)];
      const xl = (lerp(r[0] + L0 * r[2], -.12 * G.W, e2) - F[0]) / F[2], xr = (lerp(r[0] + R0 * r[2], 1.12 * G.W, e2) - F[0]) / F[2];
      const a = A * (1 - .5 * lot);
      if (swell) RB.draw(F, a, T, xl, xr);
      else {
        /* две полосы: слева и справа от картинки поста */
        RB.g.enable(RB.g.SCISSOR_TEST);
        for (const [x, w] of [[0, r[0]], [r[0] + r[2], G.W - r[0] - r[2]]]) { RB.g.scissor(Math.round(x * d), 0, Math.max(0, Math.round(w * d)), canvas.height); RB.draw(F, a, T, xl, xr); }
        RB.g.disable(RB.g.SCISSOR_TEST);
      }
    }
  }

  /* 5. Выход: сайт распадается растром на кружки на местах точек сетки-сонара (hz), кружки мельчают до точек,
     на них проявляются белые точки сетки (grid), потом пример гаснет (wt): картинка белеет в сетку. */
  if (window.GTSONAR) GTSONAR.halftone(R, hz);
  R.style.opacity = 1 - (window.GTSONAR ? wt : ss(EXIT, EXIT + 1.6, n));
  vis($('#x2-th'), Math.max(findA, feedA * rest));
  /* Станция чёрная, как «Сайт», поэтому буквы сайта белые. Тёмные они только на светлом фоне поиска и ленты. */
  X.dark = !(light && bgA > .5 && spread < .6);

  /* Пока идёт пример, надпись станции спрятана. После примера она возвращается. */
  const done = n > TOTAL - .15;
  kl.classList.toggle('ex', X.ph === 1 && !done); kl.classList.toggle('exd', done);
}
/* Колесо: сначала пример, потом ручка. У края пример держит колесо ещё 0,45 секунды, чтобы ручка не уехала по инерции.
   Так же колесо держится перед уходом в сетку, чтобы меню не пролетело. */
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
kl.addEventListener('click', e => { if (X.on && !e.target.closest('button,a,input,#air-foot,#dial,#x2-hd,#x2-wall,#x2-pick,#x2-sd,#x2-th,.word')) next(); });
/* На телефоне пример листается пальцем вверх и вниз */
let ty = null;
R.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.target.closest('button,a')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) { X.ring = null; layout(); } });
/* Холст букв не просит шрифт сам, поэтому шрифт грузится заранее, и буквы пересобираются */
document.fonts?.load('500 100px Mussels').then(() => { if (X.on) layout(); }).catch(() => {});
/* высота фото зависит от места под меню, поэтому холст фото подгоняется при каждом её изменении */
if (window.ResizeObserver) new ResizeObserver(() => { if (X.on) PIC.fit(); }).observe($('#x2-pic'));

/* Кнопки сайта кофейни */
/* Переключатель фона поиска и ленты */
$$('#x2-th button').forEach((b, i) => b.addEventListener('click', () => {
  R.classList.toggle('lt', b.dataset.t === 'l');
  $$('#x2-th button').forEach(o => o.setAttribute('aria-checked', o === b));
  $('#x2-th .sk').style.setProperty('--i', i); $('#x2-thn').textContent = i ? 'Светлый' : 'Тёмный';
}));
const sd = $('#x2-sd');
let sdBack = null;
const sdOpen = e => { sdBack = e.currentTarget; sd.hidden = false; $('#x2-sd-x').focus(); };
const sdClose = () => { sd.hidden = true; sdBack?.focus(); };
['#x2-take', '#x2-buy'].forEach(s => $(s).addEventListener('click', sdOpen));
$('#x2-sd-x').addEventListener('click', sdClose);
$('#x2-sd-go').addEventListener('click', () => { sd.hidden = true; api.onTalk?.(); });
sd.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); sdClose(); } });
$$('#x2-hd [data-k],#x2-see').forEach(b => b.addEventListener('click', () => { X.goal = STOPS[4]; }));

/* цвет станции для эфира: чёрный, как у «Сайта» */
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
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0] });
/* dark и state читаются каждый раз заново, поэтому это свойства с геттером, а не копия.
   grid: 0 сетка на надписи, 1 сетки нет. В начале сетка слетается в линию поля, в уходе встаёт из растра. */
Object.defineProperties(api, {
  grid: { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } },
  trace: { get: () => X.on && X.uc * TOTAL < 3 ? X.tr : null },
  dark: { get: () => X.dark }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on, land: +X.landA.toFixed(2) }) } });
return api;
})();
