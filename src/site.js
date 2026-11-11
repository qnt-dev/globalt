/* «Сайт»: последняя станция мира «Клиенты». Пример — сайт кофейни ZERNO, такой кофейни нет.
   Мысль станции: сайт — место, где всё, что привели бренд, соцсети и реклама, становится заказами.
   Главы: 01 Было — в окне браузера тот самый шаблон из начала «Клиентов» (тот же код, window.GT_JUNK), красные пометки показывают, чем он плох;
   02 Структура — лишнее улетает, нужное сереет и встаёт в схему сайта ZERNO; 03 Дизайн — схема становится сайтом ZERNO.
   Сайт ZERNO — тот, что раньше стоял в «Рекламе» (git 620cf62): ленты света, слово из квадратов, стеклянная шапка, как у референса DeLorean.
   Окно в начале собирает сетка-сонар (sonar.js): точки садятся в пунктир рамки окна, как в SMM в клетки профиля. В конце пример распадается растром в сетку.
   Всё — функция положения на шкале примера: колесо назад проводит те же кадры обратно.
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. Разметку модуль строит сам. */
window.GTSITE = (() => {
const kl = document.getElementById('klienty');
if (!kl) return null;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
const api = { onTalk: null };

/* Шкала примера в щелчках колеса. 0–1,9 сетка-сонар собирает рамку окна, 1,9–2,5 в окне проявляется шаблон.
   01 Было: пометки 2,8–5,8, стоят до 6,4. 02 Структура: 6,5–10,2. 03 Дизайн: 10,3–13,4, сайт собирается 10,5–12,2.
   04 Заказ: 13,5–20,2 (меню выезжает, выбран капучино, курсор касается его и жмёт «Заказать», оплата, «Едем»).
   05 Телефон 20,3–24,4. 06 Скорость 24,5–29. 07 Заявки 29,1–34,5. Уход растром в сетку 34,7–36,3. */
const TOTAL = 36.3, EXIT = 34.7, B0 = 10.5, B1 = 12.2;
const STOPS = [0, 2.5, 6.4, 10.2, 13.4, 20.2, 24.4, 29, 34.5, TOTAL].map(n => n / TOTAL);
const CAPS = [
  [0, '01 · Было', 'Было', 'Шаблон, который не продаёт.'],
  [6.5, '02 · Структура', 'Структура', 'Сначала решаем, что человек должен сделать: выбрать и заказать.'],
  [10.3, '03 · Дизайн', 'Дизайн', 'Обещание бренда — первым экраном: кофе за 20 минут или быстрее.'],
  [13.5, '04 · Заказ', 'Заказ', 'Выбрать и заказать — в два касания.'],
  [20.3, '05 · Телефон', 'Телефон', 'Больше половины заказов — с телефона.'],
  [24.5, '06 · Скорость', 'Скорость', 'ZERNO открывается за 0,9 секунды. Шаблон — за 6,2.'],
  [29.1, '07 · Заявки', 'Заявки', 'Сайт собирает всё, что привели бренд, соцсети и реклама.']
];
/* 05 Телефон: страница прокручивается обратно к первому экрану (BK), окно браузера сужается в телефон, блоки встают в одну колонку (PH).
   06 Скорость: рядом встаёт телефон с шаблоном (T6), оба грузятся с T0; одна секунда — SP6 деления: ZERNO готов за 0,9 с, шаблон за 6,2 с.
   07 Заявки: шаблон падает, ZERNO встаёт в середину (T7), к нему из пяти каналов текут точки (EM — когда выходят, TR7 — путь), счётчик заказов растёт */
const BK = [20.4, 21.2], PH = [21.4, 22.8], T6 = [24.6, 25.4], T0 = 25.7, SP6 = .387, T7 = [29.2, 29.9], EM = [30.1, 33.4], TR7 = .5;
const SRC = [['SEO', 'поиск в Google и Яндексе', 52], ['Контекст', 'реклама в поиске', 47], ['Таргет', 'реклама в Instagram', 38], ['Карты', '2ГИС и Google Карты', 41], ['SMM', 'профиль @zerno.kg', 36]];
/* 04: меню кофейни, как было в «Рекламе». Цены придуманы для примера. Фото напитков без фона лежат в assets/zerno */
const MENU = [['Эспрессо', 120, 'espresso'], ['Американо', 140, 'americano'], ['Капучино', 190, 'cappuccino'], ['Латте', 200, 'latte'], ['Флэт уайт', 210, 'flatwhite'], ['Раф', 230, 'raf'], ['Колд брю', 220, 'coldbrew'], ['Матча', 240, 'matcha'], ['Какао', 180, 'cocoa'], ['Чай', 110, 'tea'], ['Круассан', 150, 'croissant'], ['Сырники', 260, 'syrniki']];
/* 04 по шкале: меню выезжает (LOT), курсор идёт к капучино и жмёт (T1), фото меняется мозаикой, курсор жмёт «Заказать» (T2),
   оплата сохранённой картой до OK, «Едем» (GO): фото рассыпается квадратами, квадраты собираются в «12» — минут до двери,
   кнопка становится полосой пути курьера (RT) */
const LOT = [13.6, 14.6], T1 = 15.55, T2 = 17.15, OK = 17.9, GO = 18.1, RT = 18.7;
/* 01: пометки на шаблоне — прямоугольник в единицах шаблона (1440 × 770) и подпись. Первая — на строке адреса */
/* телефон: шаблон «Ваша кофейня» в версии для телефона (app.js GT_JUNK_N) и пометки на нём — в единицах телефона шириной 390 */
const MARKS_M = [[2.8, null, 'Грузится 6,2 секунды'], [3.4, [28, 80, 334, 232], 'Окно подписки закрывает сайт'], [4.1, [206, 194, 168, 70], 'Стоковое фото, как у всех'],
  [4.8, [262, 66, 112, 112], 'Скидка кричит громче меню'], [5.5, [0, 262, 390, 330], 'Акции, звонок и куки — всё сразу']];
/* схема на телефоне: логотип — шапка, заголовок и фон первого экрана — ZERNO и 20, строка акции — подпись, «Смотреть меню» — главная кнопка */
const WIRE_M = { 12: '#x5-hd', 14: 'w1', 15: 'w2', 6: '#x5-meta', 7: '#x5-see' };
const MOB = matchMedia('(max-width:760px)');
const MARKS = [[2.8, null, 'Грузится 6,2 секунды'], [3.4, [462, 92, 516, 266], 'Окно подписки закрывает сайт'], [4.1, [92, 72, 1256, 52], '7 пунктов меню — глаза разбегаются'],
  [4.8, [942, 132, 236, 270], 'Стоковое фото, как у всех'], [5.5, [0, 212, 1440, 470], 'Скидки, звонок, чат и куки — всё кричит сразу']];
/* 02: куски шаблона по номерам в GT_JUNK и часть сайта ZERNO, на место которой кусок встаёт серым блоком. Место считается по самой части (layout).
   Синяя полоса становится шапкой, логотип — знаком, из семи пунктов меню остаются три, «Заказать звонок» — «Заказать».
   Заголовок и фон первого экрана — слово ZERNO и цифры 20, строка акции — подпись, «Смотреть меню» — главная кнопка, карточки — вкладки меню.
   Окно подписки, куки, чат, звонок, ленточка, звезда скидки, стоковое фото и четыре пункта меню улетают */
const WIRE = { 25: '#x5-hd', 22: '#x5-hd .lg', 20: '#x5-hd .t', 15: '[data-w=m]', 17: '[data-w=d]', 18: '[data-w=o]', 21: '#x5-buy',
  23: 'w1', 24: 'w2', 8: '#x5-meta', 9: '#x5-see', 10: '[data-w=t1]', 11: '[data-w=t2]', 12: '#x5-ff' };
/* новые блоки схемы (их не было в шаблоне) и подписи к частям */
const NEW = ['#x5-rule', '#x5-fs'];
const LABS = [['w1', 'Обещание'], ['#x5-see', 'Главная кнопка'], ['#x5-fil .tb', 'Меню']];

/* знак ZERNO в шапке: зерно разрезано буквой Z, разрез прозрачный */
const HMARK = '<svg viewBox="16.5 8 67 84" aria-hidden="true"><mask id="x5-zcut"><rect x="-20" y="-20" width="140" height="140" fill="#fff"/><path d="M8 34H61L39 66H92" fill="none" stroke="#000" stroke-width="8" stroke-miterlimit="10"/></mask><g transform="rotate(24 50 50)"><ellipse cx="50" cy="50" rx="31" ry="44" fill="currentColor" mask="url(#x5-zcut)"/></g></svg>';

const R = document.createElement('div');
R.id = 'x5'; R.setAttribute('role', 'region'); R.setAttribute('aria-label', 'Пример сайта. Такой кофейни нет');
R.innerHTML = `
<div id="x5-bg" aria-hidden="true"></div>
<div id="x5-scene">
  <div class="x5-cap" id="x5-cap"><small id="x5-n">${CAPS[0][1]}</small><h3 id="x5-h">${CAPS[0][2]}</h3><p id="x5-p">${CAPS[0][3]}</p></div>
  <div id="x5-stage">
    <i id="x5-ghost" aria-hidden="true"></i>
    <div id="x5-tp" aria-hidden="true"><div class="x5-bar"><span class="x5-url"><b>vasha-kofeynya.kg</b></span><i class="x5-pg"></i></div><div class="x5-tv"><i class="x5-sheet"></i><i class="x5-spin"></i></div></div>
    <div class="x5-st x5-bad" id="x5-s1" aria-hidden="true"><small>Загрузка</small><b class="x5-sv">0,0 с</b><div class="x5-ring"><svg viewBox="0 0 64 64"><circle class="tr" cx="32" cy="32" r="28"/><circle class="vl" cx="32" cy="32" r="28"/></svg><b>0</b></div><small>Оценка скорости</small></div>
    <div class="x5-st" id="x5-s2" aria-hidden="true"><small>Загрузка</small><b class="x5-sv">0,0 с</b><div class="x5-ring"><svg viewBox="0 0 64 64"><circle class="tr" cx="32" cy="32" r="28"/><circle class="vl" cx="32" cy="32" r="28"/></svg><b>0</b></div><small>Оценка скорости</small></div>
    <canvas id="x5-fx" aria-hidden="true"></canvas>
    <div id="x5-srcs" aria-hidden="true">${SRC.map(([a, b]) => `<div class="x5-src"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
    <div id="x5-cnt"><b>0</b><small>заказов за день</small><ul>${SRC.map(([a]) => `<li><span>${a}</span><em>0</em></li>`).join('')}</ul></div>
    <div id="x5-win">
      <i class="x5-dash" aria-hidden="true"></i>
      <div class="x5-bar" aria-hidden="true"><i></i><i></i><i></i><span class="x5-url"><b id="x5-url">vasha-kofeynya.kg</b></span><span class="x5-ld">Грузится 6,2 секунды</span><i class="x5-pg"></i></div>
      <div id="x5-view">
        <div id="x5-old" aria-hidden="true"><i class="x5-sheet"></i></div>
        <div id="x5-wire" aria-hidden="true">${NEW.map(() => '<i class="x5-w"></i>').join('')}${LABS.map(l => `<small class="x5-lab">${l[1]}</small>`).join('')}</div>
        <div id="x5-site">
          <i class="x5-sbg" aria-hidden="true"></i>
          <canvas id="x5-gl" aria-hidden="true"></canvas>
          <div id="x5-hero">
          <div class="x5-word" id="x5-w1" aria-label="ZERNO"><canvas></canvas></div><div class="x5-word" id="x5-w2" aria-label="20 минут или быстрее"><canvas></canvas></div>
          <div id="x5-deco" aria-hidden="true"><i class="m1"></i><i class="m2"></i><i class="d1"></i><i class="d2"></i><i class="d3"></i></div>
          <div id="x5-meta"><b>Кофе за 20 минут или&nbsp;быстрее</b><span><i></i>Бишкек, с 8:00 до 22:00</span></div>
          <div id="x5-rule"></div>
          <button class="x5-cta" type="button" id="x5-see">Выбрать<br>напиток<i>›</i></button>
          <div id="x5-fil" aria-hidden="true"><div class="tb"><span data-w="t1">Кофе</span><span data-w="t2">Выпечка</span></div>
            <div class="fb"><small><svg viewBox="0 0 12 12"><path d="M0 0H12L7.5 6V12L4.5 10V6Z" fill="currentColor"/></svg>Фильтр</small>
              <div id="x5-ff"><span>Горячие<i></i></span><span>Время до двери<em></em></span><span>Холодные<i></i></span><span>Цена, сом<em></em></span></div>
              <div id="x5-fs">Найти напиток<b>→</b></div></div></div>
          </div>
          <div id="x5-lots">
            <div><h2>Выберите напиток</h2><div id="x5-wall" role="group" aria-label="Меню">${MENU.map(([t, p]) => `<button type="button"><b>${t}</b><em>${p} с</em></button>`).join('')}</div></div>
            <div id="x5-pick"><button class="x5-back" type="button">‹ Меню</button><small>Кофейня · Бишкек</small><div class="x5-word" id="x5-w3" aria-hidden="true"><canvas></canvas></div><div id="x5-pic" aria-hidden="true"><canvas></canvas></div><div id="x5-price"><span>${MENU[2][0]}, ${MENU[2][1]} с</span><em>Привезём за 20 минут или быстрее. Пример, такой кофейни нет.</em></div><button class="x5-cta" type="button" id="x5-take" data-s="0"><s class="x5-tf" aria-hidden="true"></s><span class="x5-tl">Заказать</span><b class="x5-tm" aria-hidden="true"></b><i aria-hidden="true">›</i></button>
              <div class="x5-word" id="x5-w4" aria-hidden="true"><canvas></canvas></div><small id="x5-min" aria-hidden="true">минут до двери</small></div>
          </div>
          <div id="x5-taps" aria-hidden="true"><i class="x5-ring"></i><i class="x5-ring"></i><div id="x5-cur"><svg viewBox="-1 -1 16 22" aria-hidden="true"><path d="M0 0V17L4.5 12.6L7.4 19.6L10.4 18.3L7.6 11.4H13.6Z" fill="#fff" stroke="#000" stroke-width="1.1" stroke-linejoin="round"/></svg></div></div>
          <header id="x5-hd"><div class="lg">${HMARK}<div><b>ZERNO</b><small>Кофе с доставкой</small></div></div><nav><span class="t"><button type="button">Войти</button><button type="button">Регистрация</button></span><span class="m"><button type="button" class="on" data-w="m">Меню</button><button type="button" data-w="d">Доставка</button><span class="bx"><button type="button" class="k" data-w="o">Отзывы</button><button type="button" class="in" id="x5-buy">Заказать</button></span></span></nav></header>
          <p class="x5-tg">Пример. Такой кофейни нет.</p>
        </div>
        <div id="x5-marks" aria-hidden="true">${MARKS.slice(1).map(m => `<div class="x5-mk"><b>${m[2]}</b></div>`).join('')}</div>
      </div>
    </div>
  </div>
  <p class="tag">Пример. Такой кофейни нет.</p>
</div>`;
kl.insertBefore(R, document.getElementById('air'));
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
const OLD = $('#x5-old'), WN = $('#x5-win'), VW = $('#x5-view'), SITE = $('#x5-site'), MK = $$('#x5-marks .x5-mk'), NW = $$('#x5-wire .x5-w'), LB = $$('#x5-wire .x5-lab');
/* части сайта, которые проявляются по проходу края: фон, шапка, подпись, линия, кнопка, вкладки, пометка «Пример» */
const PARTS = ['.x5-sbg', '#x5-deco', '#x5-hd', '#x5-meta', '#x5-rule', '#x5-see', '#x5-fil', '.x5-tg'].map(s => ({ e: $(s), r: [0, 0, 1, 1] }));
const WB = $$('#x5-wall button'), CU = $('#x5-cur'), RG = $$('#x5-taps .x5-ring'), TK = $('#x5-take');

/* шаблон: куски из app.js в своих местах. У каждого номер в списке, место (единицы шаблона) и куда ему в схеме */
let PC = [];
function buildOld() {
  const src = G.mob ? window.GT_JUNK_N : window.GT_JUNK, list = src ? src() : [], WR = G.mob ? WIRE_M : WIRE, FW = G.mob ? 390 : 1440; G.built = G.mob;
  OLD.querySelectorAll('.jp').forEach(e => e.remove());
  PC = list.map(([cls, x, y, w, h, html], i) => {
    const e = document.createElement('div'); e.className = 'jp ' + cls; e.innerHTML = html; e.style.zIndex = 100 - i;
    OLD.append(e);
    const full = cls === 'fade' || cls === 'j-bar';
    return { e, i, x: full ? 0 : x, y: y - 50, w: full ? FW : w, h, sel: WR[i] || null, to: null, d: hash(i, 7) };
  });
}

/* ---------- Сайт ZERNO: ленты света. Свой шейдер из прототипа «Контекст», как было в «Рекламе» ---------- */
const GLC = $('#x5-gl');
let gl = null, RB = null, glOn = false;
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
/* ленты: белая верхняя, серый песок, красная сердцевина */
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
    /* F — рамка [x, y, ширина, высота] в пикселях холста без dpr. x0..x1 — какой кусок волны рисовать, в долях рамки */
    draw(F, a, T, x0 = -.12, x1 = 1.12) {
      const d = cv.width / (F[2] || 1), [fx, fy, fw, fh] = F, ap = ss(1.05, 1.6, fw / fh), b0 = cv.height / d - fy - fh;
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
  RB = ribbons(GLC); gl = !!RB;
  if (!gl) R.classList.add('nogl');
}
/* изгиб волны зависит от пропорций рамки: на широком экране широкий */
function wave(xf, H, T, ap) {
  const x = lerp(.57 + (xf - .5) * .62, xf, ap), e = .0045, k = lerp(.42, .62, ap);
  const g = x - 2 * Math.sqrt((x - .44) ** 2 + e) + 2 * Math.sqrt((x - .7) ** 2 + e);
  return H * k * (g - .46) + H * .006 * Math.sin(T * .22 + xf * 5);
}

/* ---------- Буквы из квадратов: блоки идут за скоростью курсора, нажатие разбрасывает слово. Как было в «Рекламе» ----------
   Здесь слово ещё и собирается по проходу края (edge): квадраты слева от края стоят на местах, у края подлетают справа, правее края их нет. */
class Word {
  constructor(box, text, fill) {
    this.box = box; this.c = box.querySelector('canvas'); this.x = this.c.getContext('2d'); this.text = text; this.fill = fill;
    this.src = document.createElement('canvas'); this.m = { x: -1, y: -1, vx: 0, vy: 0, t: 0 }; this.boom = 0; this.dirty = true; this.scat = -1; this.edge = null; this.ox = 0;
    if (!RM) {
      addEventListener('pointermove', e => this.move(e), { passive: true });
      box.addEventListener('pointerdown', () => { if (X.built) { this.boom = 1; this.dirty = true; } });
    }
  }
  fit() {
    const d = dpr(), bw = this.box.offsetWidth, bh = this.box.offsetHeight;
    if (!bw) return;
    const w = Math.round(bw * d), h = Math.round(bh * d);
    this.c.width = this.src.width = w; this.c.height = this.src.height = h;
    const s = this.src.getContext('2d', { willReadFrequently: true });
    s.clearRect(0, 0, w, h); s.textBaseline = 'alphabetic';
    let fs = h; s.font = `500 ${fs}px Tektur,Montserrat,sans-serif`;
    let mt = s.measureText(this.text);
    fs *= Math.min(w * .97 / mt.width, h * .94 / (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent));
    s.font = `500 ${fs}px Tektur,Montserrat,sans-serif`;
    mt = s.measureText(this.text);
    const y = (h + mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
    /* где стоят сами буквы внутри коробки, в пикселях экрана: туда встаёт серый блок схемы */
    this.g = { x: 0, y: (y - mt.actualBoundingBoxAscent) / d, w: mt.width / d, h: (mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent) / d };
    s.shadowColor = this.fill[this.fill.length - 1]; s.shadowBlur = 7 * G.u * d;
    if (this.fill.length > 1) { const g = s.createLinearGradient(w * .1, h * .1, w * .9, h * .9); this.fill.forEach((f, i) => g.addColorStop(i / (this.fill.length - 1), f)); s.fillStyle = g; } else s.fillStyle = this.fill[0];
    s.fillText(this.text, 0, y);
    /* квадрат 7 пикселей сайта шириной 1440: в окне он мельче вместе с сайтом */
    const b = this.b = Math.max(3, Math.round(7 * G.u * d)); this.gx = Math.ceil(w / b); this.gy = Math.ceil(h / b);
    const data = s.getImageData(0, 0, w, h).data; this.cells = [];
    for (let j = 0; j < this.gy; j++) for (let i = 0; i < this.gx; i++) {
      let on = false;
      for (let yy = j * b; yy < Math.min(h, (j + 1) * b) && !on; yy += 2) for (let xx = i * b; xx < Math.min(w, (i + 1) * b) && !on; xx += 2) if (data[(yy * w + xx) * 4 + 3] > 8) on = true;
      if (on) this.cells.push({ i, j, dx: 0, dy: 0, rx: Math.random() * 2 - 1, ry: Math.random() * 2 - 1, rd: Math.random() });
    }
    this.w = w; this.h = h; this.ox = this.box.offsetLeft; this.dirty = true;
  }
  move(e) {
    if (!X.on || !X.built) return;
    const r = this.box.getBoundingClientRect();
    if (r.width < 2) return;
    const x = (e.clientX - r.left) * dpr(), y = (e.clientY - r.top) * dpr(), now = performance.now();
    const m = this.m, inside = x > -20 && y > -20 && x < this.w + 20 && y < this.h + 20;
    if (inside && m.t && now - m.t < 120) { m.vx += x - m.x; m.vy += y - m.y; this.dirty = true; }
    m.x = x; m.y = y; m.t = inside ? now : 0;
  }
  /* edge — край сборки в пикселях окна, ramp — ширина полосы, где квадраты подлетают */
  step(edge, ramp) {
    if (!this.cells) return;
    const m = this.m, R2 = (this.w * .24) ** 2, hot = Math.abs(m.vx) + Math.abs(m.vy) > .4;
    let live = this.dirty || hot || edge !== this.edge;
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
    this.dirty = false; this.edge = edge;
    const x = this.x, b = this.b, d = this.w / (this.box.offsetWidth || 1);
    x.clearRect(0, 0, this.w, this.h);
    for (const c of this.cells) {
      const cx = this.ox + (c.i + .5) * b / d, s = clamp((cx - (edge - ramp)) / ramp), k = clamp(s * 1.5 - c.rd * .5);
      x.globalAlpha = 1 - k * k;
      if (x.globalAlpha <= .01) continue;
      x.drawImage(this.src, c.i * b, c.j * b, b, b, c.i * b + c.dx + Math.abs(c.rx) * k * this.w * .35, c.j * b + c.dy + c.ry * k * this.h * .7, b, b);
    }
    x.globalAlpha = 1;
  }
}
const GR = ['#ffb03a', '#ff5a1a', '#e2240f'];
const W1 = new Word($('#x5-w1'), 'ZERNO', ['#df1f12']), W2 = new Word($('#x5-w2'), '20', GR), W3 = new Word($('#x5-w3'), 'КАПУЧИНО', GR), W4 = new Word($('#x5-w4'), '12', GR);
W3.set = function (t) { if (t === this.text) return; this.text = t; this.fit(); this.boom = 1; this.dirty = true; };

/* ---------- Фото напитка, как было в «Рекламе». Смена — мозаика волной: старое фото распадается на квадраты,
   квадраты волной по диагонали берут цвет нового фото, потом мельчают, и проступает новое фото. Здесь смена — функция шкалы:
   draw(a, b, t, scroll) рисует переход от фото a к фото b на доле t; scroll — фото проступает из крупных квадратов, пока меню выезжает ---------- */
const ZIMG = 'assets/zerno/', PICS = [];
const ready = i => { const im = PICS[i]; return im && im.complete && im.naturalWidth ? im : null; };
function loadPics() {
  if (PICS.length) return;
  MENU.forEach(([, , f]) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { PIC.L = {}; PIC.C = {}; PIC.key = ''; X.key = ''; }; im.src = ZIMG + f + '.webp'; PICS.push(im); });
}
class Pic {
  constructor(box) { this.box = box; this.c = box.querySelector('canvas'); this.x = this.c.getContext('2d'); this.L = {}; this.C = {}; this.key = ''; this.tmp = document.createElement('canvas'); this.tc = this.tmp.getContext('2d', { willReadFrequently: true }); }
  fit() {
    const d = dpr(), w = this.box.offsetWidth, h = this.box.offsetHeight;
    if (!w || !h) return;
    this.w = this.c.width = Math.round(w * d); this.h = this.c.height = Math.round(h * d);
    this.bs = Math.max(8, Math.round(Math.min(this.w, this.h) / 24)); this.L = {}; this.C = {}; this.key = '';
  }
  /* напиток без фона целиком, стоит на нижнем крае */
  lay(i) {
    if (this.L[i]) return this.L[i];
    const img = ready(i); if (!img || !this.w) return null;
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const iw = img.naturalWidth, ih = img.naturalHeight, k = Math.min(this.w * .94 / iw, this.h * .9 / ih), dw = iw * k, dh = ih * k;
    cv.getContext('2d').drawImage(img, (this.w - dw) / 2, this.h - dh - this.h * .05, dw, dh);
    return (this.L[i] = cv);
  }
  /* средний цвет каждого квадрата */
  avg(i) {
    if (this.C[i]) return this.C[i];
    const cv = this.lay(i), nx = Math.ceil(this.w / this.bs), ny = Math.ceil(this.h / this.bs);
    this.tmp.width = nx; this.tmp.height = ny; this.tc.imageSmoothingQuality = 'high';
    this.tc.drawImage(cv, 0, 0, nx * this.bs, ny * this.bs, 0, 0, nx, ny);
    return (this.C[i] = { nx, ny, d: this.tc.getImageData(0, 0, nx, ny).data });
  }
  /* фото квадратами размера s; щели между квадратами режут фото, их сила — gap */
  pix(cv, s, gap) {
    const x = this.x, { w, h } = this;
    if (s <= 1.05) x.drawImage(cv, 0, 0);
    else {
      const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
      this.tmp.width = nx; this.tmp.height = ny; this.tc.imageSmoothingQuality = 'high';
      this.tc.drawImage(cv, 0, 0, nx * s, ny * s, 0, 0, nx, ny);
      x.imageSmoothingEnabled = false; x.drawImage(this.tmp, 0, 0, nx, ny, 0, 0, nx * s, ny * s); x.imageSmoothingEnabled = true;
    }
    if (gap > .02 && s > 3) {
      const lw = Math.max(1, dpr());
      x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = Math.min(1, gap);
      for (let p = s; p < w; p += s) x.fillRect(p - lw / 2, 0, lw, h);
      for (let p = s; p < h; p += s) x.fillRect(0, p - lw / 2, w, lw);
      x.restore();
    }
  }
  draw(a, b, t, scroll) {
    const key = a + '|' + b + '|' + t.toFixed(3) + '|' + scroll.toFixed(3);
    if (key === this.key || !this.w) return;
    const A = this.lay(a), B = this.lay(b); if (!A || !B) return;
    this.key = key;
    const x = this.x, bs = this.bs;
    x.clearRect(0, 0, this.w, this.h);
    if (t > 0 && t < 1) {
      if (t < .3) { const k = ss(0, .3, t); this.pix(A, lerp(1, bs, k), k); }
      else if (t > .7) { const k = 1 - ss(.7, 1, t); this.pix(B, lerp(1, bs, k), k); }
      else {
        /* волна по диагонали: квадрат складывается, как плитка, и раскрывается уже цветом нового фото */
        const p = (t - .3) / .4, cA = this.avg(a), cB = this.avg(b), { nx, ny } = cA, gp = Math.max(1, dpr());
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const dg = (i / nx + j / ny) / 2, f = ss(dg * .55, dg * .55 + .45, p), sy = Math.abs(1 - 2 * f), c = f < .5 ? cA.d : cB.d, o = (j * nx + i) * 4;
          if (c[o + 3] < 8) continue;
          const lift = (1 - sy) * .35;
          x.fillStyle = `rgba(${c[o] + (255 - c[o]) * lift | 0},${c[o + 1] + (255 - c[o + 1]) * lift | 0},${c[o + 2] + (255 - c[o + 2]) * lift | 0},${c[o + 3] / 255})`;
          const hh = Math.max(1, (bs - gp) * sy);
          x.fillRect(i * bs, j * bs + (bs - hh) / 2, bs - gp, hh);
        }
      }
    } else {
      const C = t >= 1 ? B : A;
      if (scroll > .001) { x.globalAlpha = 1 - scroll * scroll; this.pix(C, lerp(1, bs * 2.2, scroll), scroll); x.globalAlpha = 1; }
      else x.drawImage(C, 0, 0);
    }
  }
}
const PIC = new Pic($('#x5-pic'));

/* Геометрия: сцена между шапкой сайта и строкой над шкалой; окно справа, сайт внутри — 1440 × 770 единиц, единица u = ширина окна / 1440 */
const G = { W: 0, H: 0, top: 0, bot: 0, u: 1, vw: 0, vh: 0 };
function layout() {
  const foot = document.getElementById('air-foot'), bar = document.getElementById('bar'), kr = kl.getBoundingClientRect();
  G.W = innerWidth; G.H = Math.max(240, kr.height || innerHeight);
  G.top = Math.max(44, bar ? bar.getBoundingClientRect().bottom : 56); G.bot = foot.getBoundingClientRect().top - kr.top;
  R.style.setProperty('--top', G.top + 'px'); R.style.setProperty('--bot', Math.max(0, G.H - G.bot) + 'px');
  const st = $('#x5-stage'), sw = st.clientWidth, sh = st.clientHeight, barH = 30;
  G.mob = MOB.matches; R.classList.toggle('mob', G.mob);
  if (G.mob) {
    /* телефон: окно примера — экран телефона во всю ширину сцены, сайт шириной 390 единиц, высота экрана в единицах — VU.
       Окно компьютера для 05 — та же ширина, высота 770 / 1440 */
    G.vw = Math.floor(sw); G.vh = Math.floor(Math.min(sh - barH - 4, G.vw * 844 / 390)); G.u = G.vw / 390; G.VU = G.vh / G.u;
    G.du = G.vw / 1440; G.dh = Math.floor(G.vw * 770 / 1440);
  } else {
    let w = sw, h = w * 770 / 1440 + barH;
    if (h > sh * .94) { h = sh * .94; w = (h - barH) * 1440 / 770; }
    G.vw = Math.floor(w); G.vh = Math.floor(G.vw * 770 / 1440); G.u = G.vw / 1440; G.VU = 770;
  }
  X.vhc = G.vh; X.cw = G.vw;
  Object.assign(WN.style, { width: G.vw + 'px', height: G.vh + barH + 'px' });
  VW.style.setProperty('--u', G.u + 'px'); VW.style.height = G.vh + 'px';
  if (!PC.length || G.built !== G.mob) buildOld();
  const U = G.u, px = r => ({ left: r[0] * U + 'px', top: r[1] * U + 'px', width: r[2] * U + 'px', height: r[3] * U + 'px' });
  PC.forEach(p => Object.assign(p.e.style, { left: 0, top: 0, width: p.w * U + 'px', height: p.h * U + 'px' }));
  const MS = G.mob ? MARKS_M : MARKS; G.MS = MS;
  MK.forEach((m, k) => { Object.assign(m.style, px(MS[k + 1][1])); m.firstChild.textContent = MS[k + 1][2]; });
  /* холст лент держит размер окна компьютера: окно сужается в телефон, а ленты не сжимаются, рисуется только видимая часть */
  const d = dpr(); GLC.width = Math.round(G.vw * d); GLC.height = Math.round(G.vh * d); Object.assign(GLC.style, { width: G.vw + 'px', height: G.vh + 'px' });
  /* 05–07: телефон шириной 390 единиц, той же высоты, что окно. Окно компьютера стоит посередине сцены */
  G.sw = sw; G.sh = sh; G.PW = G.mob ? G.vw : Math.round(390 * U); G.wy = (sh - G.vh - barH) / 2;
  /* пунктир окна компьютера: на компьютере — само окно, на телефоне — окно компьютера той же ширины, ниже */
  const gh = G.mob ? G.dh + barH : G.vh + barH;
  Object.assign($('#x5-ghost').style, { left: (sw - G.vw) / 2 + 'px', top: (sh - gh) / 2 + 'px', width: G.vw + 'px', height: gh + 'px' });
  const Hf = G.vh + barH;
  if (G.mob) {
    /* 06: два телефона уменьшены и стоят рядом наверху, цифры загрузки под каждым. 07: ZERNO слева под строкой каналов, счётчик справа */
    G.s6 = Math.min((sw - 20) / 2 / G.vw, (sh - 96) / Hf); G.d6 = G.vw * G.s6 / 2 + 8; G.y6 = Hf * G.s6 / 2 + 4 - sh / 2;
    G.s7 = Math.min((sh - 84) / Hf, sw * .54 / G.vw); G.x7 = 4 + G.vw * G.s7 / 2; G.y7 = 62 + Hf * G.s7 / 2;
  } else G.d6 = G.PW / 2 + Math.max(36, sw * .05);
  const tp = $('#x5-tp'); Object.assign(tp.style, { left: (sw - G.PW) / 2 + 'px', top: G.wy + 'px', width: G.PW + 'px', height: G.vh + barH + 'px' });
  const tv = $('#x5-tp .x5-tv'); tv.style.setProperty('--u', U + 'px'); tv.style.height = G.vh + 'px';
  if (!TPC.length) buildTP();
  TPC.forEach(p => Object.assign(p.e.style, { left: 0, top: 0, width: p.w * U + 'px', height: p.h * U + 'px' }));
  const fx = $('#x5-fx'); fx.width = Math.round(sw * d); fx.height = Math.round(sh * d); Object.assign(fx.style, { width: sw + 'px', height: sh + 'px' });
  /* 07: каналы столбиком слева от телефона, счётчик справа */
  const pl = (sw - G.PW) / 2, pr = (sw + G.PW) / 2;
  const SE = $$('#x5-srcs .x5-src');
  if (G.mob) {
    /* на телефоне каналы — строка ярлыков наверху, точки текут вниз */
    G.src = SRC.map((s, i) => [sw * (i + .5) / 5, 30]);
    SE.forEach((e, i) => Object.assign(e.style, { left: G.src[i][0] + 'px', right: '', top: '4px' }));
    Object.assign($('#x5-cnt').style, { left: G.x7 + G.vw * G.s7 / 2 + 14 + 'px', top: G.y7 + 'px' });
    const yb = Hf * G.s6 + 14 + 'px';
    Object.assign($('#x5-s1').style, { left: sw / 2 - G.d6 + 'px', right: '', top: yb });
    Object.assign($('#x5-s2').style, { left: sw / 2 + G.d6 + 'px', top: yb });
  } else {
    G.src = SRC.map((s, i) => [pl - Math.max(80, sw * .09), sh * (.14 + i * .18)]);
    SE.forEach((e, i) => Object.assign(e.style, { right: sw - G.src[i][0] + 'px', left: '', top: G.src[i][1] + 'px' }));
    Object.assign($('#x5-cnt').style, { left: pr + Math.max(44, sw * .05) + 'px', top: sh / 2 + 'px' });
    Object.assign($('#x5-s1').style, { right: sw - (sw / 2 - G.d6 - G.PW / 2 - 28) + 'px', left: '', top: sh / 2 + 'px' });
    Object.assign($('#x5-s2').style, { left: sw / 2 + G.d6 + G.PW / 2 + 28 + 'px', top: sh / 2 + 'px' });
  }
  X.pk = -1;
  hero(); if (G.mob) { lay(1, G.u); X.pk = 1; }
  W1.fit(); W2.fit(); W3.fit(); PIC.fit();
  /* «12» стоят на месте фото, по центру, высотой 0,7 фото; подпись под ними */
  { const pc = $('#x5-pic'), m = document.createElement('canvas').getContext('2d'); m.font = '500 100px Tektur,Montserrat,sans-serif';
    const r = m.measureText('12'), bh = r.actualBoundingBoxAscent + r.actualBoundingBoxDescent, h = pc.offsetHeight * .7, w = h * .94 / bh * r.width / .97;
    const top = pc.offsetTop + pc.offsetHeight * .04;
    Object.assign($('#x5-w4').style, { left: pc.offsetLeft + (pc.offsetWidth - w) / 2 + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    $('#x5-min').style.top = top + h + 8 * U + 'px'; W4.fit(); }
  /* куда курсор жмёт: на слово «Капучино» и на «Заказать»; окно заказа растёт из кнопки на всю колонку */
  const kb = rel(WB[2]), tb = rel($('#x5-take'));
  G.p1 = [kb[0] + kb[2] * .55, kb[1] + kb[3] * .6]; G.p2 = [tb[0] + tb[2] * .62, tb[1] + tb[3] * .55];

  /* места частей сайта: куда встают серые блоки схемы и где проходит край сборки */
  PC.forEach(p => { if (p.sel) p.to = rel(p.sel).map(v => v / U); });
  PARTS.forEach(p => { p.r = rel(p.e); });
  NWR = NEW.map(rel); NW.forEach((b, k) => { Object.assign(b.style, pxr(NWR[k])); b.style.display = G.mob ? 'none' : ''; });
  LB.forEach((b, k) => { const r = rel(LABS[k][0]); Object.assign(b.style, { left: r[0] + 'px', top: r[1] - 6 * U + 'px' }); b.style.display = G.mob && k === 2 ? 'none' : ''; });
  X.key = '';
}
let NWR = [];
const pxr = r => ({ left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px' });
/* прямоугольник части сайта в пикселях окна, без сдвигов анимации. У слова — сами буквы, а не коробка */
function rel(t) {
  if (t === 'w1' || t === 'w2') { const W = t === 'w1' ? W1 : W2, b = W.box; return [b.offsetLeft + W.g.x, b.offsetTop + W.g.y, W.g.w, W.g.h]; }
  let e = typeof t === 'string' ? SITE.querySelector(t) : t, x = 0, y = 0;
  const w = e.offsetWidth, h = e.offsetHeight;
  while (e && e !== SITE && e !== VW) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return [x, y, w, h];
}
/* Раскладка «ZERNO 20» как «ALPHA 05» у референса DeLorean: цифры той же высоты, правый край вровень со словом,
   зазор — около трети высоты букв. Подпись слева стоит на уровне низа цифр. Всё в единицах сайта шириной 1440 */
const cu = v => `calc(var(--u)*${(+v).toFixed(3)})`;
function hero() {
  const U = G.u, m = document.createElement('canvas').getContext('2d'), hd = $('#x5-hd');
  /* мерить шапку в её обычном виде: в телефоне она меньше */
  hd.style.removeProperty('--hk'); ['left', 'top', 'width', 'right'].forEach(k => hd.style.removeProperty(k));
  const met = t => { m.font = '500 100px Tektur,Montserrat,sans-serif'; const r = m.measureText(t); return [r.width, r.actualBoundingBoxAscent + r.actualBoundingBoxDescent]; };
  const [aw, ah] = met('ZERNO'), [bw, bh] = met('20');
  const wOf = h => h * .94 / ah * aw / .97, w2Of = h => h * .94 / bh * bw / .97;
  const place = (x, y, h) => { const w = wOf(h), w2 = w2Of(h); return [[x, y, w, h], [x + .97 * (w - w2), y + 1.21 * h, w2, h]]; };
  const set = (el, b) => Object.assign(el.style, { left: b[0] * U + 'px', top: b[1] * U + 'px', width: b[2] * U + 'px', height: b[3] * U + 'px' });
  const meta = $('#x5-meta'), cta = $('#x5-see'), rule = $('#x5-rule');
  /* сайт держится в ширине 1313 по центру, как у референса; слово занимает около 0,45 этой ширины */
  const W = 1440, L = (W - 1313) / 2, ctaW = 288, hb = 24 + $('#x5-hd').offsetHeight / U, H = 770 - hb;
  let h = Math.min(H * .3, .45 * (W - 2 * L) / wOf(1));
  const room = W - ctaW - 2 * L - 60; if (wOf(h) > room) h = room / wOf(1);
  const [a, b] = place(L, hb + H * .08, h);
  set($('#x5-w1'), a); set($('#x5-w2'), b);
  const bot = b[1] + h * .97, yc = b[1] + h * .55;
  meta.style.maxWidth = Math.max(160, b[0] - L - 24) * U + 'px'; meta.style.top = bot * U - meta.offsetHeight + 'px'; cta.style.top = yc * U + 'px';
  const rl = b[0] + b[2] + 24, rr = W - L - ctaW - 18;
  Object.assign(rule.style, { left: cu(rl), width: cu(Math.max(0, rr - rl)), top: cu(yc + 76) });
  $('.x5-tg').style.top = cu(hb + 18);
  /* 05: те же части в телефоне шириной 390, как раскладка старого сайта для телефона: шапка без меню, слово во всю ширину,
     подпись над кнопкой, кнопка во всю ширину внизу. Шапка в телефоне на четверть меньше (--hk) */
  const hdu = hd.offsetHeight / U, mh = meta.offsetHeight / U, mw = parseFloat(meta.style.maxWidth) / U;
  meta.style.maxWidth = 366 * U + 'px'; const mhp = meta.offsetHeight / U; meta.style.maxWidth = mw * U + 'px';
  /* слово с цифрами кончается над подписью с зазором 14: подпись в телефоне в две строки и растёт вверх от кнопки (mhp) */
  const hph = hdu * .74, phb = 12 + hph, PHh = G.VU - phb, ph = Math.min(366 / wOf(1), (PHh * .95 - 118 - mhp) / 2.253), [pa, pb] = place(12, phb + PHh * .05, ph);
  G.D = { w1: a, w2: b, meta: [L, bot - mh, mw], see: [W - L - ctaW, yc, ctaW], hd: [L, 24, 1313] };
  G.P = { w1: pa, w2: pb, meta: [12, G.VU - 104 - mhp, 366], see: [12, G.VU - 16 - 78, 366, 78], hd: [12, 12, 366] };
  /* метки референса у слова: слева на уровне верха букв чёрточка с квадратом, справа у края квадрат с хвостом, под левой меткой три точки */
  const gy = a[1] + a[3] * .03, at = (s, x, y) => Object.assign($('#x5-deco .' + s).style, { left: cu(x), top: cu(y) });
  at('m1', 44, gy - 3.5); at('m2', 1407, gy - 20); at('d1', 45, gy + 45); at('d2', 68, gy + 50); at('d3', 82, gy + 55);
}

const X = { pk: -1, cw: 0, on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '', tr: trace(0), url: '', E: -1e4, E4: -1e4, built: false, n: 0, A: 0, sel: 2, pick: null, self: false, mt: null, gs: false, st: 0 };
function reset() {
  Object.assign(X, { on: false, u: 0, uc: 0, goal: null, edge: 0, hold: 0, tw: 0, auto: false, ph: 0, cap: -1, key: '', url: '', E: -1e4, built: false, n: 0, A: 0, sel: X.sel, pick: null, back: false, self: false, mt: null, gs: false });
  R.classList.remove('on');
  ['#x5-bg', '#x5-scene'].forEach(s => vis($(s), 0));
  if (glOn) { RB.clear(); glOn = false; }
  R.style.opacity = ''; window.GTSONAR?.halftone(R, 0);
  kl.classList.remove('ex', 'exd');
}
/* c: near — ручка у станции «Сайт», tuned — станция настроена, alpha — насколько станция слышна */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); initGl(); loadPics(); layout(); }
  if (!c.tuned) { X.tw = 0; if (X.u <= 0) X.goal = null; }
  else if (!X.auto && X.u <= 0 && X.goal == null) { X.tw += dt; if (X.tw > 6) { X.auto = true; X.goal = STOPS[1]; } }
  /* щелчок и сам запуск проигрывают отрезок со скоростью четыре щелчка в секунду; переходы с сеткой-сонаром медленнее, колесо в них мягче */
  const slow = v => v * TOTAL < 1.9 || v * TOTAL > EXIT;
  if (X.goal != null) { const sp = RM ? 9 : (X.gs ? 1.8 : slow(X.u) ? 1.3 : 4) / TOTAL * dt, d = X.goal - X.u; X.u = Math.abs(d) <= sp ? X.goal : X.u + Math.sign(d) * sp; if (X.u === X.goal) { X.goal = null; X.gs = false; } }
  X.uc = RM || X.goal != null || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * (slow(X.uc) ? 3.5 : 9)));
  const n = X.uc * TOTAL, A = c.alpha;
  X.ph = n <= .1 ? 0 : 1; X.tr = trace(n); X.n = n; X.A = A;
  const hz = ss(EXIT, EXIT + .8, n), wt = ss(EXIT + .8, EXIT + 1.6, n), gone = wt >= 1;
  vis($('#x5-bg'), ss(.1, 1, n) * (gone ? 0 : 1) * A);
  const sceneA = ss(.2, 1.4, n) * (gone ? 0 : 1) * A;
  vis($('#x5-scene'), sceneA);
  const key = n.toFixed(4) + '|' + A.toFixed(3);
  if (sceneA > .004 && key !== X.key) { X.key = key; scene(n); }
  /* сайт живёт каждый кадр: ленты переливаются песком, буквы идут за курсором */
  const live = sceneA > .004 && n > B0;
  if (live) { W1.step(X.E, 150 * G.u); W2.step(X.E, 150 * G.u); if (n > LOT[0]) W3.step(1e9, 1); if (n > GO) W4.step(X.E4, 140 * G.u); }
  if (live && X.mt) { const t = RM ? 1 : clamp((performance.now() - X.mt.t0) / 850); PIC.draw(X.mt.a, X.mt.b, t, 0); if (t >= 1) { X.mt = null; X.key = ''; } }
  if (gl) {
    if (live) { RB.clear(); const cw = X.cw || G.vw; RB.draw([0, 0, cw, X.vhc || G.vh], 1 - .5 * ss(LOT[0], LOT[1], n) * (1 - ss(BK[0], BK[1], n)), RM ? 8 : performance.now() * .001, -.12, Math.min(1.12, X.E / cw)); glOn = true; }
    else if (glOn) { RB.clear(); glOn = false; }
  }
  /* уход: пример распадается растром на кружки на местах точек сетки-сонара, кружки мельчают до точек, пример гаснет в сетку */
  if (window.GTSONAR) GTSONAR.halftone(R, hz);
  R.style.opacity = 1 - (window.GTSONAR ? wt : ss(EXIT, EXIT + 1.6, n));
  const done = n > TOTAL - .15;
  kl.classList.toggle('ex', X.ph === 1 && !done); kl.classList.toggle('exd', done);
}
/* адрес в строке перебирается буквами, как надпись станции */
const GLY = 'abcdefghijklmnopqrstuvwxyz-.';
function urlTo(t, k) {
  let s = ''; for (let i = 0; i < t.length; i++) s += k > ((i * 37) % 100) / 100 * .9 + .05 || t[i] === '.' ? t[i] : GLY[Math.floor(Math.random() * GLY.length)];
  if (s !== X.url) { X.url = s; $('#x5-url').textContent = s; }
}
function scene(n) {
  /* подпись: на границе отрезков старая гаснет, слова меняются, новая проявляется */
  let ci = 0; CAPS.forEach((cp, i) => { if (n >= cp[0]) ci = i; });
  const nb = CAPS.reduce((m, cp, i) => i ? Math.min(m, Math.abs(n - cp[0])) : m, 9);
  if (ci !== X.cap) { X.cap = ci; $('#x5-n').textContent = CAPS[ci][1]; $('#x5-h').textContent = CAPS[ci][2]; $('#x5-p').textContent = CAPS[ci][3]; }
  const cap = $('#x5-cap'), ca = ss(.6, 1.6, n) * clamp(nb / .22);
  cap.style.opacity = ca; cap.style.transform = `translateY(${(1 - ss(.6, 1.6, n)) * 16}px)`;
  $('#x5-stage').style.transform = `translateY(${(1 - ss(.2, 1.4, n)) * 30}px)`;
  $('#x5-scene .tag').style.opacity = .5 * ss(1, 2, n) * (1 - ss(B0, B0 + .5, n));

  /* окно: пунктир рамки собран сеткой (X.tr.out), потом проявляется окно с шаблоном */
  const fr = X.tr.out, win = ss(1.9, 2.5, n);
  WN.style.setProperty('--dash', fr * (1 - win)); WN.style.setProperty('--win', win);
  /* адрес: в 01–02 шаблон, в 03 zerno.kg */
  const zu = ss(10.3, 10.9, n); urlTo(zu > 0 ? 'zerno.kg' : 'vasha-kofeynya.kg', zu > 0 ? zu : 1);
  vis($('.x5-ld'), ss(2.8, 3.1, n) * (1 - ss(6.5, 6.9, n)));

  /* 01: пометки появляются по одной, в 02 гаснут */
  const mOut = 1 - ss(6.5, 6.9, n);
  MK.forEach((m, k) => {
    const t = ss(MARKS[k + 1][0], MARKS[k + 1][0] + .3, n), nx = MARKS[k + 2] ? ss(MARKS[k + 2][0], MARKS[k + 2][0] + .25, n) : 0;
    vis(m, t * mOut); m.style.transform = `scale(${(1.06 - .06 * t).toFixed(3)})`; m.style.setProperty('--ol', (1 - .6 * nx).toFixed(3)); m.firstChild.style.opacity = (1 - nx).toFixed(3);
  });

  /* 03: край сборки идёт по окну слева направо. Левее края — сайт ZERNO, правее — серая схема. Ленты тянутся за краем */
  const U = G.u, e = ss(B0, B1, n), ramp = 150 * U, E = n < B0 ? -1e4 : lerp(-ramp, G.vw + ramp, e);
  X.E = E; X.built = e >= 1;
  vis(SITE, n > B0 ? 1 : 0);
  /* сколько части уже за краем, от 0 до 1 */
  const past = r => clamp((E - r[0]) / Math.max(1, r[2]));
  PARTS.forEach(p => { const k = past(p.r); p.e.style.clipPath = k >= 1 ? '' : `inset(0 ${((1 - k) * 100).toFixed(2)}% 0 0${p.e.id === 'x5-hd' ? ` round ${8 * U}px` : ''})`; });

  /* 02: лишнее улетает вниз и в стороны; нужное сереет (wf) и встаёт в схему. Лист шаблона темнеет.
     В 03 серый блок срезается краем сборки слева: на его месте уже часть сайта */
  const wf = ss(7.2, 8, n);
  OLD.style.setProperty('--wf', wf); OLD.classList.toggle('wfx', wf > .3);
  PC.forEach(p => {
    const e = p.e;
    if (!p.to) {
      const f = ss(6.6 + p.d * .7, 7.3 + p.d * .7, n), dx = (p.d - .5) * 260 * f, dy = 520 * f * f, r = (p.d - .5) * 40 * f;
      e.style.opacity = (1 - ss(.4, 1, f)).toFixed(3);
      e.style.transform = `translate(${((p.x + dx) * U).toFixed(1)}px,${((p.y + dy) * U).toFixed(1)}px) rotate(${r.toFixed(2)}deg)`;
      return;
    }
    /* блок меняет сам размер, а не масштаб: так рамка схемы остаётся в один пиксель со всех сторон */
    const k = ss(7.3 + p.d * .5, 8.4 + p.d * .5, n), [tx, ty, tw, th] = p.to, x = lerp(p.x, tx, k), y = lerp(p.y, ty, k);
    e.style.transform = `translate(${(x * U).toFixed(1)}px,${(y * U).toFixed(1)}px)`;
    e.style.width = (lerp(p.w, tw, k) * U).toFixed(1) + 'px'; e.style.height = (lerp(p.h, th, k) * U).toFixed(1) + 'px';
    cut(e, past([tx * U, 0, tw * U]));
  });
  NW.forEach((b, k) => { b.style.opacity = ss(8.4 + k * .15, 8.9 + k * .15, n).toFixed(3); cut(b, past(NWR[k])); });
  LB.forEach((b, k) => { b.style.opacity = (ss(8.8 + k * .15, 9.2 + k * .15, n) * (1 - ss(10.3, 10.6, n))).toFixed(3); });
  order(n); phone(n); speed(n); leads(n);
}
/* 04 Заказ. Первый экран уезжает вверх, как при прокрутке, снизу выезжает меню, в нём выбран капучино. Курсор касается капучино (касание 1)
   и жмёт «Заказать» (касание 2): оплата сохранённой картой в кнопке, «ЕДЕМ», «12» из квадратов, полоса пути курьера.
   Человек может нажать любой напиток сам: фото меняется мозаикой */
const ease = t => t * t * (3 - 2 * t);
function order(n) {
  /* в 05 страница прокручивается обратно: меню уезжает вниз, первый экран возвращается сверху */
  const lot = ss(LOT[0], LOT[1], n) * (1 - ss(BK[0], BK[1], n)), hero = $('#x5-hero'), lots = $('#x5-lots');
  hero.style.transform = lot > 0 ? `translateY(${(-lot * 62).toFixed(2)}%)` : ''; hero.style.opacity = (1 - ss(.08, .92, lot)).toFixed(3); hero.style.visibility = lot > .95 ? 'hidden' : '';
  lots.style.transform = `translateY(${((1 - lot) * 102).toFixed(2)}%)`; lots.style.visibility = lot > .001 ? 'visible' : 'hidden';
  if (lot <= .001) { CU.style.opacity = 0; RG.forEach(r => { r.style.opacity = 0; }); return; }
  /* выбранный напиток: если человек выбрал сам — его, иначе капучино */
  const sel = cur(n);
  /* на телефоне меню — как в приложении: список напитков, касание открывает экран напитка, он выезжает справа; «‹ Меню» возвращает к списку */
  if (G.mob) {
    const pk = X.back ? 0 : X.pick != null ? 1 : ease(ss(T1 - .02, T1 + .38, n));
    lots.firstElementChild.style.transform = pk > 0 ? `translateX(${(-pk * 104).toFixed(2)}%)` : '';
    $('#x5-pick').style.transform = `translateX(${((1 - pk) * 104).toFixed(2)}%)`;
  } else { lots.firstElementChild.style.transform = ''; $('#x5-pick').style.transform = ''; }
  WB.forEach((b, i) => { b.classList.toggle('on', i === sel); b.classList.toggle('hov', !X.self && i === 2 && i !== sel && n > T1 - .2 && n < T1); });
  /* «Едем»: название напитка разлетается квадратами и собирается в «ЕДЕМ» */
  W3.set(n >= GO ? 'ЕДЕМ' : MENU[sel][0].toUpperCase());
  if (X.sel !== sel) { X.sel = sel; $('#x5-price span').textContent = `${MENU[sel][0]}, ${MENU[sel][1]} с`; }
  const scr = 1 - ss(LOT[0] + .3, LOT[1] + .2, n);
  /* на «Едем» фото рассыпается крупными квадратами и гаснет — из них встают «12» */
  const sc2 = Math.max(scr, ss(GO, GO + .6, n));
  if (!X.mt) { if (X.pick != null) PIC.draw(X.pick, X.pick, 1, sc2); else PIC.draw(2, 2, 1, sc2); }
  /* курсор: входит снизу справа, идёт к капучино, жмёт, идёт к «Заказать», жмёт, отходит и гаснет */
  const U = G.u, p0 = [1330 * U, 800 * U], p3 = [G.p2[0] + 60 * U, G.p2[1] + 70 * U];
  const m1 = ease(ss(14.7, T1 - .15, n)), m2 = ease(ss(T1 + .75, T2 - .15, n)), m3 = ease(ss(T2 + .15, T2 + .7, n));
  let cx = lerp(p0[0], G.p1[0], m1), cy = lerp(p0[1], G.p1[1], m1);
  cx = lerp(cx, G.p2[0], m2); cy = lerp(cy, G.p2[1], m2); cx = lerp(cx, p3[0], m3); cy = lerp(cy, p3[1], m3);
  const press = Math.max(ss(T1 - .12, T1, n) * (1 - ss(T1, T1 + .1, n)), ss(T2 - .12, T2, n) * (1 - ss(T2, T2 + .1, n)));
  /* человек нажимает сам — курсор показа не нужен */
  CU.style.opacity = (X.self ? 0 : ss(14.6, 14.9, n) * (1 - ss(T2 + .5, T2 + .8, n))).toFixed(3);
  CU.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${(1 - .14 * press).toFixed(3)})`;
  /* касание: от кончика курсора расходится кольцо */
  [[T1, G.p1], [T2, G.p2]].forEach(([t, p], k) => {
    const r = ss(t, t + .45, n);
    Object.assign(RG[k].style, { opacity: (r > 0 && !X.self ? 1 - r : 0).toFixed(3), transform: `translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) scale(${(.3 + 1.7 * r).toFixed(3)})` });
  });
  /* после «Заказать»: кнопка показывает оплату сохранённой картой, потом становится полосой пути курьера.
     Красное отступает влево до доли пути, под ним тёмная дорога, справа таймер до двери, в квадрате пульсирует точка курьера */
  const st = n < T2 + .05 ? 0 : n < OK ? 1 : n < RT ? 2 : 3;
  if (X.st !== st) {
    X.st = st; TK.dataset.s = st; TK.querySelector('.x5-tl').textContent = ['Заказать', 'Оплачиваем', 'Оплачено', 'Курьер в пути'][st];
    $('#x5-price em').innerHTML = ['Привезём за 20 минут или быстрее. Пример, такой кофейни нет.', 'Оплачиваем картой •• 4421…', 'Оплачено картой •• 4421 <b>✓</b>', 'Оплачено картой •• 4421 <b>✓</b>'][st];
  }
  TK.style.setProperty('--f', (lerp(1, .04, ease(ss(RT, RT + .6, n))) + .07 * ss(RT + .6, 20.2, n)).toFixed(4));
  const left = 720 - Math.round(18 * Math.max(0, n - RT - .4)), tm = TK.querySelector('.x5-tm');
  tm.textContent = st === 3 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : ''; tm.style.opacity = ss(RT + .3, RT + .6, n).toFixed(3);
  /* «12» собираются из квадратов краем слева направо, как слово ZERNO в 03 */
  const e4 = ss(GO + .3, GO + 1.1, n), r4 = 140 * U, w4 = W4.box.offsetWidth;
  X.E4 = n < GO + .3 ? -1e4 : lerp(W4.ox - r4, W4.ox + w4 + r4, e4);
  $('#x5-min').style.opacity = ss(GO + .9, GO + 1.3, n).toFixed(3);
}
/* ---------- 05 Телефон. Окно браузера сужается в телефон, части первого экрана переезжают в одну колонку.
   Рядом остаётся пунктир окна компьютера: видно, во сколько раз меньше экран ---------- */
/* раскладка частей первого экрана: q = 1 — телефон, 0 — компьютер; uu — пикселей в единице сайта */
function lay(q, uu) {
  const D = G.D, P = G.P; if (!D) return;
  const L = (a, b) => (lerp(a, b, q) * uu).toFixed(2) + 'px', box = (el, a, b, h) => { el.style.left = L(a[0], b[0]); el.style.top = L(a[1], b[1]); el.style.width = L(a[2], b[2]); if (h) el.style.height = L(a[3], b[3]); };
  box(W1.box, D.w1, P.w1, 1); box(W2.box, D.w2, P.w2, 1);
  const mt = $('#x5-meta'); mt.style.left = L(D.meta[0], P.meta[0]); mt.style.top = L(D.meta[1], P.meta[1]); mt.style.maxWidth = L(D.meta[2], P.meta[2]);
  const se = $('#x5-see'); se.style.right = 'auto'; box(se, D.see, P.see);
  const hd = $('#x5-hd'); hd.style.right = 'auto'; box(hd, D.hd, P.hd); hd.style.setProperty('--hk', lerp(1, .74, q).toFixed(3));
  $('#x5-hd nav').style.opacity = (1 - ss(0, .45, q)).toFixed(3);
  ['#x5-rule', '#x5-fil', '#x5-deco', '.x5-tg'].forEach(e => { $(e).style.opacity = (1 - ss(0, .4, q)).toFixed(3); });
}
function phone(n) {
  if (!G.D) return;
  if (G.mob) {
    /* на телефоне наоборот: экран телефона раскрывается в окно компьютера (пунктир), сайт встаёт в раскладку компьютера; к 06 — обратно в телефон */
    const k = ease(ss(PH[0], PH[1], n)) * (1 - ease(ss(T6[0] - .7, T6[0] - .05, n))), q = 1 - k;
    vis($('#x5-ghost'), .7 * ss(PH[0], PH[0] + .4, n) * (1 - ss(T6[0] - .7, T6[0] - .3, n)));
    if (q === X.pk) return;
    X.pk = q; const uu = lerp(G.du, G.u, q); X.vhc = lerp(G.dh, G.vh, q); X.cw = G.vw;
    VW.style.setProperty('--u', uu + 'px'); VW.style.height = X.vhc + 'px'; WN.style.height = X.vhc + 30 + 'px';
    WN.style.setProperty('--wr', lerp(10, 26, q).toFixed(2) + 'px');
    lay(q, uu); return;
  }
  const k = ease(ss(PH[0], PH[1], n));
  vis($('#x5-ghost'), .7 * ss(PH[0], PH[0] + .4, n) * (1 - ss(T6[0], T6[0] + .4, n)));
  if (k === 0 && X.pk === 0) return;
  X.pk = k; X.cw = lerp(G.vw, G.PW, k);
  WN.style.width = X.cw + 'px'; WN.style.setProperty('--wr', lerp(10, 26, k).toFixed(2) + 'px');
  $$('#x5-win .x5-bar>i:not(.x5-pg)').forEach(i => { i.style.width = (9 * (1 - k)).toFixed(2) + 'px'; i.style.opacity = (1 - k).toFixed(3); });
  /* плашка «Грузится» в телефоне не занимает места: адрес виден целиком */
  $('.x5-ld').style.display = k > 0 ? 'none' : '';
  lay(k, G.u);
}
/* где стоят телефоны в 06 и 07: сдвиг tx, ty и масштаб s окна ZERNO и сдвиг телефона шаблона. На компьютере телефоны в полный рост,
   на телефоне в 06 они уменьшаются и встают рядом наверху, в 07 ZERNO встаёт слева под строкой каналов */
function spot(n) {
  const kin = ease(ss(T6[0], T6[1], n)), kout = ease(ss(T7[0], T7[1], n));
  if (!G.mob) return { tx: G.d6 * kin * (1 - kout), ty: 0, s: 1, kin, kout };
  const s = lerp(lerp(1, G.s6, kin), G.s7, kout), tx = lerp(G.d6 * kin, G.x7 - G.sw / 2, kout), ty = lerp(G.y6 * kin, G.y7 - G.sh / 2, kout);
  return { tx, ty, s, kin, kout };
}
/* ---------- 06 Скорость. Слева встаёт телефон с шаблоном, оба сайта грузятся заново. Время — по шкале: секунда = SP6 деления.
   ZERNO проявляется слева направо за 0,9 секунды; шаблон сначала белый с колесом загрузки, куски вылезают по одному до 6,2 секунды,
   ниже большого фото всё прыгает вниз, когда фото догрузилось; в конце всплывает окно подписки. Рядом — время и оценка скорости ---------- */
let TPC = [];
function buildTP() {
  const list = window.GT_JUNK_N ? window.GT_JUNK_N() : [], tv = $('#x5-tp .x5-tv');
  tv.querySelectorAll('.jp').forEach(e => e.remove());
  TPC = list.map(([cls, x, y, w, h, html], i) => {
    const e = document.createElement('div'); e.className = 'jp ' + cls; e.innerHTML = html; e.style.zIndex = 100 - i; tv.append(e);
    const late = cls === 'fade' ? 5.5 : cls.includes('j-modal') ? 5.65 : null;
    return { e, cls, x, y: y - 50, w, h, t: late != null ? late : .9 + hash(i, 31) * 4.2 };
  });
  const hr = TPC.find(p => p.cls.includes('j-hero')); if (hr) hr.t = 3.1;
}
const sec1 = s => s.toFixed(1).replace('.', ',') + ' с';
function speed(n) {
  const kin = ease(ss(T6[0], T6[1], n)), kout = ease(ss(T7[0], T7[1], n)), U = G.u;
  const sp = spot(n);
  WN.style.transform = sp.tx || sp.ty || sp.s !== 1 ? `translate(${sp.tx.toFixed(1)}px,${sp.ty.toFixed(1)}px) scale(${sp.s.toFixed(4)})` : '';
  const tp = $('#x5-tp');
  /* телефон шаблона проявляется на своём месте, когда ZERNO уже отъехал вправо */
  vis(tp, ss(.45, 1, kin) * (1 - ss(T7[0] + .1, T7[1], n)));
  if (kin <= 0) { SITE.style.clipPath = ''; vis($('#x5-s1'), 0); vis($('#x5-s2'), 0); return; }
  tp.style.transform = `translate(${(-G.d6).toFixed(1)}px,${((G.mob ? G.y6 : 0) + kout * 160 + (1 - kin) * 24).toFixed(1)}px) rotate(${(-kout * 7).toFixed(2)}deg)${G.mob ? ` scale(${G.s6.toFixed(4)})` : ''}`;
  const s = (n - T0) / SP6;
  /* ZERNO: перед загрузкой экран пустеет, потом сайт проявляется слева направо */
  const rv = n < T0 - .15 ? 1 : n < T0 ? 0 : clamp(s / .9);
  SITE.style.clipPath = rv < 1 ? `inset(0 ${((1 - rv) * 100).toFixed(2)}% 0 0)` : '';
  const pg = (el, v, a) => { el.style.setProperty('--pg', v.toFixed(3)); el.style.setProperty('--pga', a.toFixed(3)); };
  pg($('#x5-win .x5-pg'), clamp(s / .9), s > 0 && s < 1.25 ? 1 : 0);
  pg($('#x5-tp .x5-pg'), clamp(s / 6.2) ** .6, s > 0 && s < 6.5 ? 1 : 0);
  /* шаблон: куски вылезают по одному; пока большое фото не догрузилось, всё ниже него стоит выше и потом прыгает вниз */
  const hr = TPC.find(p => p.cls.includes('j-hero')), jump = hr ? 1 - ss(hr.t, hr.t + .12, s) : 0;
  TPC.forEach(p => {
    const a = s > 0 ? ss(p.t, p.t + .1, s) : 0, dy = (p.y > 260 ? -46 * jump : 0) - 14 * (1 - a);
    p.e.style.opacity = a.toFixed(3); p.e.style.transform = `translate(${(p.x * U).toFixed(1)}px,${((p.y + dy) * U).toFixed(1)}px)`;
  });
  $('#x5-tp .x5-spin').style.opacity = (s > 0 ? 1 - ss(3.1, 3.4, s) : 0).toFixed(3);
  /* время и оценка: у ZERNO белые, у шаблона красные */
  const sa = ss(T0 - .4, T0, n) * (1 - ss(T7[0], T7[0] + .4, n));
  [[$('#x5-s1'), 6.2, 41], [$('#x5-s2'), .9, 98]].forEach(([el, lim, sc]) => {
    vis(el, sa); el.style.transform = `${G.mob ? 'translateX(-50%)' : 'translateY(-50%)'} translateY(${((1 - ss(T0 - .4, T0, n)) * 12).toFixed(1)}px)`;
    el.querySelector('.x5-sv').textContent = sec1(clamp(s, 0, lim));
    const r = ss(T0 + lim * SP6, T0 + lim * SP6 + .45, n), v = Math.round(sc * r);
    el.querySelector('.x5-ring>b').textContent = v; el.querySelector('.vl').style.strokeDasharray = `${(175.93 * v / 100).toFixed(2)} 176`;
  });
}
/* ---------- 07 Заявки. Шаблон падает, ZERNO встаёт посередине. К кнопке сайта по дугам текут точки из пяти каналов:
   у сайта точка краснеет — это заказ. Справа счётчик заказов за день и сколько пришло из каждого канала ---------- */
function leads(n) {
  const fx = $('#x5-fx'), c = fx.getContext('2d'), d = fx.width / (G.sw || 1), a = ss(T7[1] - .2, T7[1] + .3, n) * (1 - ss(EXIT - .1, EXIT + .4, n));
  if (!(a > .004)) { if (fx.dataset.on) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fx.width, fx.height); fx.dataset.on = ''; } vis($('#x5-cnt'), 0); $$('#x5-srcs .x5-src').forEach(e => vis(e, 0)); $('#x5-see').style.transform = ''; return; }
  fx.dataset.on = 1; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, G.sw, G.sh);
  const U = G.u, P = G.P, sp = spot(n), cx = G.sw / 2, cy = G.wy + (G.vh + 30) / 2;
  const tx = cx + ((G.sw - G.PW) / 2 + (P.see[0] + P.see[2] * .5) * U - cx) * sp.s + sp.tx, ty = cy + (G.wy + 30 + (P.see[1] + P.see[3] * .5) * U - cy) * sp.s + sp.ty;
  const cnt = [], bez = (p0, p1, p2, p3, t) => { const m = 1 - t; return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3; };
  let recent = 0;
  SRC.forEach(([nm, , N], si) => {
    const [sx0, sy] = G.src[si], sx = G.mob ? sx0 : sx0 + 10, ca = a * ss(29.8 + si * .08, 30.2 + si * .08, n);
    const el = $$('#x5-srcs .x5-src')[si]; vis(el, ca); el.style.transform = G.mob ? `translateX(-50%) translateY(${((1 - ca) * -8).toFixed(1)}px)` : `translateY(-50%) translateX(${((1 - ca) * -10).toFixed(1)}px)`;
    const c1 = G.mob ? [sx, sy + 70] : [sx + 110, sy], c2 = G.mob ? [tx + (sx - tx) * .3, ty - 90] : [tx - 150, ty + (sy - ty) * .25];
    c.globalAlpha = .14 * ca; c.strokeStyle = '#fff'; c.lineWidth = 1; c.setLineDash([2, 6]); c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], tx, ty); c.stroke(); c.setLineDash([]);
    let got = 0;
    for (let j = 0; j < N; j++) {
      const te = EM[0] + (j + hash(j, si + 3) * .8) / N * (EM[1] - EM[0]), p = (n - te) / TR7;
      if (p >= 1) { got++; if (p < 1 + .1 / TR7) recent++; continue; }
      if (p <= 0) continue;
      const e = ease(p), x = bez(sx, c1[0], c2[0], tx, e), y = bez(sy, c1[1], c2[1], ty, e), red = ss(.72, .9, p);
      c.globalAlpha = a * (.35 + .6 * ss(0, .15, p)); c.fillStyle = red > .5 ? '#ff5a45' : '#fff';
      c.beginPath(); c.arc(x, y, 1.8 + .9 * red, 0, 7); c.fill();
    }
    cnt.push(got);
  });
  /* у кнопки сайта — вспышка на каждый заказ, кнопка чуть вздрагивает */
  if (recent) { c.globalAlpha = a * Math.min(1, recent * .35); c.strokeStyle = '#ff5a45'; c.lineWidth = 1.5; c.beginPath(); c.arc(tx, ty, 10 + 6 * Math.min(1, recent * .3), 0, 7); c.stroke(); }
  $('#x5-see').style.transform = recent ? `scale(${(1 + .025 * Math.min(1, recent * .5)).toFixed(3)})` : '';
  c.globalAlpha = 1;
  const cb = $('#x5-cnt'), ka = a * ss(29.9, 30.3, n); vis(cb, ka); cb.style.transform = `translateY(-50%) translateX(${((1 - ka) * 10).toFixed(1)}px)`;
  const tot = cnt.reduce((x, y) => x + y, 0), key = cnt.join(',');
  if (cb.dataset.k !== key) { cb.dataset.k = key; cb.firstChild.textContent = tot; cb.querySelectorAll('li em').forEach((e, i) => { e.textContent = cnt[i]; }); }
}
/* какой напиток выбран на шкале n */
/* по умолчанию капучино; человек может выбрать другой напиток сам */
function cur(n) { return X.pick != null ? X.pick : 2; }
/* Меню кликабельно, как было в «Рекламе»: нажатие на напиток меняет слово, фото (мозаикой) и цену */
WB.forEach((b, i) => b.addEventListener('click', () => {
  if (!X.on || X.n < LOT[1] - .2 || X.n >= T2) return;
  const c = cur(X.n); X.self = true;
  if (i === c) { X.back = false; X.pick = i; X.key = ''; return; }
  X.back = false; X.mt = { a: c, b: i, t0: performance.now() }; X.pick = i; X.key = '';
}));
$('.x5-back').addEventListener('click', () => { X.back = true; X.self = true; X.key = ''; });
/* «Заказать»: заказ выбранного напитка проигрывается сам, без курсора показа */
$('#x5-take').addEventListener('click', () => {
  if (!X.on || X.n >= T2) return;
  if (X.pick == null) X.pick = cur(X.n);
  X.self = true; X.mt = null; X.u = Math.max(X.u, (T2 - .05) / TOTAL); X.uc = X.u; X.goal = 20.2 / TOTAL; X.gs = true; X.key = '';
});
/* серый блок срезан слева на долю k; срезан целиком — спрятан */
function cut(e, k) { e.style.clipPath = k > 0 && k < 1 ? `inset(0 0 0 ${(k * 100).toFixed(2)}%)` : ''; e.style.visibility = k >= 1 ? 'hidden' : ''; }

/* Колесо: сначала пример, потом ручка. У края пример держит колесо ещё 0,45 секунды. Так же колесо держится перед уходом в сетку. */
function wheel(dy) {
  if (!X.on || !dy) return false;
  const now = performance.now(), ex = EXIT / TOTAL, du = dy / (100 * TOTAL);
  X.goal = null; X.gs = false;
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
kl.addEventListener('click', e => { if (X.on && !e.target.closest('button,a,input,#air-foot,#dial,#x5-hd,.x5-word,#x5-lots')) next(); });
/* кнопки сайта кофейни ведут рассказ дальше */
$$('#x5-hd nav button,#x5-see').forEach(b => b.addEventListener('click', () => { if (X.built) { X.goal = (LOT[1] + .05) / TOTAL; X.auto = true; } }));
/* на телефоне пример листается пальцем вверх и вниз */
let ty = null;
kl.addEventListener('pointerdown', e => { if (X.on && e.pointerType === 'touch' && !e.target.closest('button,a,input,#dial,#air-foot')) ty = e.clientY; });
/* пока идёт финал «Каждый день» (final.js), палец ведёт его, а не пример */
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; if (window.GTFIN && GTFIN.on) return; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) layout(); });
/* холст букв не просит шрифт сам, поэтому шрифт грузится заранее, и буквы пересобираются */
document.fonts?.load('500 100px Tektur').then(() => { if (X.on) layout(); }).catch(() => {});
document.fonts?.ready.then(() => { if (X.on) layout(); });

/* Сетка-сонар: точки садятся в пунктир рамки окна — чёрточка 4 пикселя, промежуток 4 (site.css .x5-dash) */
function dots() {
  if (!X.on || X.uc * TOTAL > 3) return null;
  const k = kl.getBoundingClientRect(), r = WN.getBoundingClientRect(), x0 = r.left - k.left, y0 = r.top - k.top, T = [];
  for (let d = 2; d + 2 <= r.width; d += 8) T.push([x0 + d, y0 + .5, 1, 0, 1.5], [x0 + d, y0 + r.height - .5, 1, 0, 1.5]);
  for (let d = 2; d + 2 <= r.height; d += 8) T.push([x0 + .5, y0 + d, 0, 1, 1.5], [x0 + r.width - .5, y0 + d, 0, 1, 1.5]);
  return T;
}
/* точки вытягиваются в чёрточки (g), чёрточки становятся пунктиром рамки (th), потом отдаются рамке (out) */
function trace(n) { return { g: ss(1, 1.4, n), th: ss(1.2, 1.7, n), w: 1, a: .2, out: ss(1.6, 1.9, n) }; }
Object.assign(api, { step, wheel, reset, next, dots, col: [0, 0, 0], notch: TOTAL });
Object.defineProperties(api, {
  grid: { get: () => { if (!X.on) return 1; const n = X.uc * TOTAL; return n < EXIT ? clamp((n - .1) / .9) : 1 - ss(EXIT + .6, EXIT + 1.2, n); } },
  trace: { get: () => X.on && X.uc * TOTAL < 3 ? X.tr : null },
  dark: { get: () => X.on }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), on: X.on }) } });
return api;
})();
