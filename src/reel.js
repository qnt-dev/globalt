/* «Работа»: лента профессий под стеной (см. reel.css). Перенесено из черновика professii-draft.html */
(() => {
'use strict';
/* ---------- данные: те же объекты и вакансии, что на сайте (src/app.js) ---------- */
const SITES = [
  { n: 'Маркетплейс', s: 'Маркетплейс', ab: 'МП', live: 'Хостел', ppl: 4, lv: '4 человека в комнате', food: 1, fdt: 'Обед', fdp: 'на объекте', shifts: 30, hours: 12, adv: 7 },
  { n: 'Распределительный центр', s: 'Распред. центр', ab: 'РЦ', live: 'Общежитие', ppl: 6, lv: '6 человек в комнате', food: 2, fdt: '2 раза в день', fdp: 'на объекте', shifts: 45, hours: 12, adv: 7 },
  { n: 'Склад электроники', s: 'Склад электр.', ab: 'ЭЛ', live: 'Квартира', ppl: 4, lv: 'на 4 человека', food: 0, fdt: 'Готовите сами', fdp: 'кухня в квартире', shifts: 30, hours: 11, adv: 7 },
  { n: 'Логистический склад', s: 'Логист. склад', ab: 'ЛС', live: 'Хостел', ppl: 6, lv: '6 человек в комнате', food: 1, fdt: 'Обед', fdp: 'на объекте', shifts: 60, hours: 12, adv: 7 },
  { n: 'Пищевое производство', s: 'Пищевое пр-во', ab: 'ПП', live: 'Общежитие', ppl: 4, lv: '4 человека в комнате', food: 3, fdt: '3 раза в день', fdp: 'в столовой завода', shifts: 30, hours: 12, adv: 7 },
  { n: 'Кондитерская фабрика', s: 'Кондит. фабр.', ab: 'КФ', live: 'Коттедж', ppl: 6, lv: '6 человек в доме', food: 2, fdt: '2 раза в день', fdp: 'в столовой фабрики', shifts: 45, hours: 11, adv: 7 },
  { n: 'Завод фурнитуры', s: 'Завод фурнит.', ab: 'ЗФ', live: 'Хостел', ppl: 4, lv: '4 человека в комнате', food: 1, fdt: 'Обед', fdp: 'на объекте', shifts: 30, hours: 10, adv: 7 }
];
// название объекта для узких строк телефона: до 20 знаков, без непонятных сокращений
['Маркетплейс', 'Распределит. центр', 'Склад электроники', 'Логистический склад', 'Пищевое производство', 'Кондитерская фабрика', 'Завод фурнитуры'].forEach((m, i) => { SITES[i].m = m; });
const money = n => n ? String(n).replace(/\B(?=(\d{3})+$)/g, ' ') : '[Сумма]';   // нет суммы — заглушка, как на сайте
const PANELS = [
  { eb: '01 · склад · вахта', tt: 'Комплектовщик', img: 'h_komplekt', pos: '56% 62%',
    bd: 'Собирать заказы по списку на сканере. Опыт не нужен: сканеру обучат на месте. Семь объектов, от маркетплейса до завода фурнитуры. Жильё на всех объектах бесплатно, а ставка зависит от объекта.',
    lb: '7 объектов · можно без опыта', fx: [['Ставка', '3 500 – 6 000 за смену'], ['Вахта', '30–60 смен'], ['Жильё', 'Бесплатно']] },
  { eb: '02 · склад · учёт', tt: 'Кладовщик', img: 'h_sklad', pos: '50% 62%',
    bd: 'Принимать товар, сверять накладные и размещать поставки. Нужна внимательность к документам, опыт на складе будет плюсом. Четыре объекта: распределительный центр, маркетплейс, логистический склад и завод фурнитуры.',
    lb: '4 объекта · вахта на склады', fx: [['Ставка', '3 600 – 4 500 за смену'], ['Вахта', '30–60 смен'], ['Аванс', 'Каждую неделю']] },
  { eb: '03 · производство', tt: 'Фасовщик', img: 'h_fasov', pos: '74% 32%',
    bd: 'Фасовать и укладывать готовую продукцию. Опыт не нужен. Три объекта: пищевое производство, кондитерская фабрика и завод фурнитуры. На пищевом производстве кормят три раза в день.',
    lb: '3 объекта · питание на объекте', fx: [['Ставка', '3 500 – 4 200 за смену'], ['Вахта', '30–45 смен'], ['Еда', 'От обеда до 3 раз в день']] },
  { eb: '04 · склад · вахта', tt: 'Грузчик', img: 'h_gruz', pos: '30% 58%',
    bd: 'Разгружать и перемещать паллеты, готовить их к отгрузке. Опыт не нужен, всё покажем на месте. Нужна хорошая физическая форма. Четыре объекта: логистический склад, распределительный центр, маркетплейс и завод фурнитуры.',
    lb: '4 объекта · можно без опыта', fx: [['Ставка', '3 500 – 4 500 за смену'], ['Вахта', '30–60 смен'], ['Опыт', 'Не нужен']] },
  { eb: '05 · склад · техника', tt: 'ВВШ, водитель погрузчика', img: 'h_vvsh', pos: '50% 34%',
    bd: 'Размещать и снимать паллеты на высотных стеллажах. Нужны удостоверение на технику и опыт работы на погрузчике. Три объекта: распределительный центр, маркетплейс и логистический склад.',
    lb: '3 объекта · нужно удостоверение', fx: [['Ставка', '4 000 – 6 500 за смену'], ['Вахта', '30–60 смен'], ['Аванс', 'Каждую неделю']] },
  { eb: '06 · склад и производство', tt: 'Стикеровщик, упаковщик', img: 'h_upak', pos: '40% 62%',
    bd: 'Клеить этикетки и штрихкоды, упаковывать заказы. Опыт не нужен, всё покажем на месте. Можно работать сидя. Пять объектов: маркетплейс, распределительный центр, логистический склад, пищевое производство и кондитерская фабрика.',
    lb: '5 объектов · можно без опыта', fx: [['Ставка', '3 300 – 4 200 за смену'], ['Вахта', '30–60 смен'], ['Опыт', 'Не нужен']] },
  { eb: '07 · производство', tt: 'Сборщик', img: 'h_sborka', pos: '50% 50%',
    bd: 'Собирать изделия за столом и проверять их на брак. Опыт не нужен, всё покажем на месте. Работа сидя или стоя. Два объекта: завод фурнитуры и склад электроники.',
    lb: '2 объекта · сидячая работа', fx: [['Ставка', '3 600 – 4 000 за смену'], ['Вахта', '30 смен'], ['Опыт', 'Не нужен']] },
  { eb: '08 · производство', tt: 'Оператор линии', img: 'h_liniya', pos: '50% 45%',
    bd: 'Следить за работой конвейера, подавать сырьё и упаковку. Обучим на месте. Два объекта: пищевое производство и завод фурнитуры.',
    lb: '2 объекта · с обучением', fx: [['Ставка', '3 500 – 4 200 за смену'], ['Вахта', '30 смен'], ['Обучение', 'На месте']] },
  { eb: '09 · склад и производство', tt: 'Бригадир', img: 'h_brigada', pos: '42% 50%',
    bd: 'Вести смену: распределять людей и отвечать за план. Нужен опыт руководства сменой или бригадой и опыт работы на складе или производстве. Три объекта: маркетплейс, распределительный центр и пищевое производство.',
    lb: '3 объекта · нужен опыт', fx: [['Ставка', '[Сумма] за смену'], ['Вахта', '30–45 смен'], ['Опыт', 'Руководство сменой']] },
  { eb: '10 · удалённо', tt: 'Менеджер по клиентам', img: 'h_menedzher', pos: '60% 50%',
    bd: 'Отвечать клиентам и вести новые обращения. Работа из дома, это не вахта. Нужен опыт общения с клиентами и умение держать договорённости.',
    lb: 'из дома · полный день', fx: [['Зарплата', '[Зарплата]'], ['График', 'Полный день'], ['Где', 'Из дома']] }
];

/* ---------- сетка символов: каждая клетка хранит знак и яркость ---------- */
const COLS = 50, ROWS = 60, IW = 40, IH = 54;
let CUR_K = 0;
const withAcc = fn => { const p = CUR_K; CUR_K = 1; try { return fn(); } finally { CUR_K = p; } };
const grid = (w, h) => Array.from({ length: h }, () => Array.from({ length: w }, () => ({ c: ' ', a: 0 })));
function put(g, r, c, ch, a) {
  if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || a <= 0 || !ch || ch === ' ') return;
  const o = g[r][c];
  if (o.c !== ' ' && o.a > a) return;
  g[r][c] = { c: ch, a, k: CUR_K };
}
const txt = (g, r, c, s, a = 1) => [...s].forEach((ch, i) => put(g, r, c + i, ch, a));
const rgt = (g, r, end, s, a = 1) => txt(g, r, end - [...s].length + 1, s, a);
const rule = (g, r, c, n, a = .22, ch = '─') => { for (let i = 0; i < n; i++) put(g, r, c + i, ch, a); };
const fill = (g, r, c, n, ch, a) => { for (let i = 0; i < n; i++) put(g, r, c + i, ch, a); };
function box(g, r, c, w, h, a) {
  put(g, r, c, '┌', a); put(g, r, c + w - 1, '┐', a); put(g, r + h - 1, c, '└', a); put(g, r + h - 1, c + w - 1, '┘', a);
  for (let i = 1; i < w - 1; i++) { put(g, r, c + i, '─', a); put(g, r + h - 1, c + i, '─', a); }
  for (let i = 1; i < h - 1; i++) { put(g, r + i, c, '│', a); put(g, r + i, c + w - 1, '│', a); }
}
function stamp(dst, src, r0, c0) {
  for (let r = 0; r < src.length; r++) for (let c = 0; c < src[0].length; c++) { const s = src[r][c]; if (s.a > 0 && s.c !== ' ') dst[r + r0][c + c0] = s; }
}
/* крупные цифры, названия и графики: фигура режется на клетки сетки.
   Каждая клетка хранит свой кусок фигуры маской 3×5, поэтому цифра рассыпается кусками вместе с экраном */
const SX = 3, SY = 5;
const rc = document.createElement('canvas'), rx = rc.getContext('2d', { willReadFrequently: true });
function cellSet(g, r, c, a, m) { if (m && r >= 0 && r < g.length && c >= 0 && c < g[0].length) g[r][c] = { c: '█', a, m, k: CUR_K }; }
// текст фирменным шрифтом Science Gothic высотой rows клеток
// текст фирменным шрифтом Science Gothic высотой rows клеток. Шрифт рисуется целиком с гладкими краями
// в отдельный холст, потом холст режется на плитки по клеткам: в покое текст виден целым, при распаде летит плитками
function art(g, r, c, rows, text, o = {}) {
  const { max = 38, weight = 640, stretch = 'condensed', a = 1, fit = .96, center = false, family = 'Science Gothic' } = o, D = V.dpr;
  const font = (x, px) => { x.font = `${weight} ${stretch} ${px}px "${family}"`; };
  rx.setTransform(1, 0, 0, 1, 0, 0); font(rx, 100);
  let m = rx.measureText(text);
  let size = 100 * rows * V.ch * fit / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
  let wpx = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) * size / 100;
  if (wpx > max * V.cw) { size *= max * V.cw / wpx; wpx = max * V.cw; }
  const cols = Math.min(max, Math.ceil(wpx / V.cw + .01));
  const src = document.createElement('canvas'), W = Math.round(cols * V.cw * D), H = Math.round(rows * V.ch * D);
  src.width = W; src.height = H;
  const x = src.getContext('2d', { willReadFrequently: true });
  x.scale(D, D); font(x, size); x.textBaseline = 'alphabetic'; x.fillStyle = '#fff';
  m = x.measureText(text);
  const ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  x.fillText(text, m.actualBoundingBoxLeft + (cols * V.cw - wpx) / 2, (rows * V.ch - ih) / 2 + m.actualBoundingBoxAscent);
  slice(g, r, center ? c + Math.floor((max - cols) / 2) : c, rows, cols, src, a);
  return cols;
}
// холст режется на плитки по клеткам сетки; клетки без краски пропускаются
function slice(g, r, c, rows, cols, src, a = 1) {
  const D = V.dpr, W = src.width, H = src.height, d = src.getContext('2d').getImageData(0, 0, W, H).data;
  for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
    const px0 = Math.round(cc * V.cw * D), px1 = Math.min(W, Math.round((cc + 1) * V.cw * D)), py0 = Math.round(rr * V.ch * D), py1 = Math.min(H, Math.round((rr + 1) * V.ch * D));
    let ink = 0;
    for (let py = py0; py < py1 && !ink; py++) for (let px = px0; px < px1; px++) if (d[(py * W + px) * 4 + 3] > 24) { ink = 1; break; }
    const R = r + rr, C = c + cc;
    if (ink && R >= 0 && R < g.length && C >= 0 && C < g[0].length)
      g[R][C] = { c: '█', a, k: CUR_K, t: { src, sx: px0, sy: py0, sw: px1 - px0, sh: py1 - py0, dr: rr, dc: cc } };
  }
}
// рисунок с гладкими краями на участке rows × cols клеток; draw рисует белым, яркость задаётся прозрачностью
function paint(g, r, c, rows, cols, draw) {
  const D = V.dpr, src = document.createElement('canvas');
  src.width = Math.round(cols * V.cw * D); src.height = Math.round(rows * V.ch * D);
  const x = src.getContext('2d', { willReadFrequently: true });
  x.scale(D, D); x.fillStyle = x.strokeStyle = '#fff';
  draw(x, cols * V.cw, rows * V.ch);
  slice(g, r, c, rows, cols, src);
}
// плитки красятся в текущий цвет знаков; перекраска нужна только при смене цвета
function tint(src) {
  const col = ctx.fillStyle;
  if (src._col !== col) {
    const t = src._t || (src._t = document.createElement('canvas')); t.width = src.width; t.height = src.height;
    const x = t.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, t.width, t.height);
    src._col = col;
  }
  return src._t;
}
// площадь под кривой f(t), t от 0 до 1: край кривой ярче, заливка под ним тусклее
function area(g, top, bot, x0, x1, f, aEdge = .95, aFill = .3, upto = 0) {
  const H = (bot - top + 1) * SY, n = (x1 - x0 + 1) * SX;
  for (let x = x0; x <= x1; x++) for (let r = top; r <= bot; r++) {
    let mask = 0, edge = false;
    for (let bx = 0; bx < SX; bx++) {
      const h = f(((x - x0) * SX + bx + .5) / n) * H;
      for (let by = 0; by < SY; by++) { const up = (bot - r) * SY + (SY - 1 - by) + .5; if (up <= h) { mask |= 1 << (by * SX + bx); if (h - up < 2.2) edge = true; } }
    }
    cellSet(g, r, x, edge ? aEdge : (x - x0 + .5) / (x1 - x0 + 1) <= upto ? .62 : aFill, mask);
  }
}
// кольцо из n сегментов с центром в клетке (cr, cc); сегменты из списка hi ярче
function ring(g, cr, cc, R1, R2, n, hi, aHi = 1, aLo = .38) {
  const cx = cc * V.cw, cy = cr * V.ch, gap = Math.min(.3, Math.max(.1, 1.3 / (Math.PI * (R1 + R2) / n)));   // щель между сменами около 2.6px при любом числе смен
  for (let r = Math.floor(cr - R2 / V.ch) - 1; r <= Math.ceil(cr + R2 / V.ch) + 1; r++)
    for (let c = Math.floor(cc - R2 / V.cw) - 1; c <= Math.ceil(cc + R2 / V.cw) + 1; c++) {
      let mask = 0, cnt = 0, hot = 0;
      for (let by = 0; by < SY; by++) for (let bx = 0; bx < SX; bx++) {
        const x = (c + (bx + .5) / SX) * V.cw - cx, y = (r + (by + .5) / SY) * V.ch - cy, dd = Math.hypot(x, y);
        if (dd < R1 || dd > R2) continue;
        let ang = Math.atan2(x, -y); if (ang < 0) ang += Math.PI * 2;
        const s = ang / (Math.PI * 2) * n, k = Math.floor(s), fr = s - k;
        if (fr < gap || fr > 1 - gap) continue;
        mask |= 1 << (by * SX + bx); cnt++; if (hi.includes(k + 1)) hot++;
      }
      if (cnt >= 2) cellSet(g, r, c, hot * 2 > cnt ? aHi : aLo, mask);   // одиночные точки на краю сегмента не рисуем
    }
}

/* корпус телефона: двойная рамка из блоков, кнопки по бокам, «капля» сверху */
function phone(g) {
  const L = 2, R = COLS - 3;
  put(g, 0, L, '▗', 1); put(g, 0, R, '▖', 1); fill(g, 0, L + 1, R - L - 1, '▄', 1);
  put(g, ROWS - 1, L, '▝', 1); put(g, ROWS - 1, R, '▘', 1); fill(g, ROWS - 1, L + 1, R - L - 1, '▀', 1);
  for (let r = 1; r < ROWS - 1; r++) { put(g, r, L, '█', 1); put(g, r, R, '█', 1); }
  for (let r = 3; r < ROWS - 3; r++) { put(g, r, L - 1, '│', .5); put(g, r, R + 1, '│', .5); }
  for (const [a, b] of [[9, 10], [14, 17], [19, 22]]) for (let r = a; r <= b; r++) put(g, r, 0, '▐', 1);
  for (let r = 16; r <= 21; r++) put(g, r, COLS - 1, '▌', 1);
  const k = Math.floor((COLS - 12) / 2);
  put(g, 2, k, '▐', 1); fill(g, 2, k + 1, 10, '█', 1); put(g, 2, k + 11, '▌', 1); put(g, 2, k + 8, '▪', .2);
  txt(g, 2, 6, '9:41', .85);
  txt(g, 2, 34, '▂▄▆█', .55); txt(g, 2, 39, '82%', .8); put(g, 2, 43, '▮', .85);
}
const homebar = g => fill(g, 53, 15, 10, '▬', .45);
function wrap(s, n) { const out = []; let l = ''; for (const w of s.split(' ')) { if ((l ? l.length + 1 : 0) + w.length <= n) l = l ? l + ' ' + w : w; else { if (l) out.push(l); l = w; } } if (l) out.push(l); return out; }
function heavy(g, r, c, w, h, a) {
  put(g, r, c, '┏', a); put(g, r, c + w - 1, '┓', a); put(g, r + h - 1, c, '┗', a); put(g, r + h - 1, c + w - 1, '┛', a);
  for (let i = 1; i < w - 1; i++) { put(g, r, c + i, '━', a); put(g, r + h - 1, c + i, '━', a); }
  for (let i = 1; i < h - 1; i++) { put(g, r + i, c, '┃', a); put(g, r + i, c + w - 1, '┃', a); }
}
// кнопка: при наведении рамка становится жирной, по краям появляются стрелки
function btn(g, r, c, w, label, on, hv) {
  (hv ? heavy : box)(g, r, c, w, 3, hv ? 1 : on ? .95 : .5);
  txt(g, r + 1, c + Math.floor((w - [...label].length) / 2), label, hv || on ? 1 : .62);
  if (hv) { put(g, r + 1, c + 2, '▸', 1); put(g, r + 1, c + w - 3, '◂', 1); }
}
// кликабельная область в клетках внутреннего экрана
const hit = (H, r, c, w, h, id) => H.push({ r, c, w, h, id });

/* профессии, их объекты и ставки */
const PROF = [
  { id: 'komplektovshchik', name: 'Комплектовщик', title: 'КОМПЛЕКТОВЩИК', sub: 'склад · можно без опыта', type: 'list', S: [[0, 6000], [1, 5200], [2, 4600], [3, 4200], [4, 3900], [5, 3700], [6, 3500]] },
  { id: 'kladovshchik', name: 'Кладовщик', title: 'КЛАДОВЩИК', sub: 'приёмка и учёт товара', type: 'cal', S: [[1, 4500], [0, 4300], [3, 4000], [6, 3600]] },
  { id: 'fasovshchik', name: 'Фасовщик', title: 'ФАСОВЩИК', sub: 'производство · можно без опыта', type: 'ring', dark: 1, S: [[4, 4200], [5, 3800], [6, 3500]] },
  { id: 'gruzchik', name: 'Грузчик', title: 'ГРУЗЧИК', sub: 'склад · можно без опыта', type: 'list', S: [[3, 4500], [1, 4200], [0, 4000], [6, 3500]] },
  { id: 'vvsh', name: 'ВВШ', title: 'ВВШ · ПОГРУЗЧИК', sub: 'нужно удостоверение', type: 'cal', S: [[1, 6500], [0, 5500], [3, 4000]] },
  { id: 'upakovshchik', name: 'Упаковщик', title: 'УПАКОВЩИК', sub: 'стикеровка · можно без опыта', type: 'ring', dark: 1, S: [[0, 4200], [1, 4000], [3, 3800], [4, 3500], [5, 3300]] },
  { id: 'sborshchik', name: 'Сборщик', title: 'СБОРЩИК', sub: 'производство · можно без опыта', type: 'list', S: [[6, 4000], [2, 3600]] },
  { id: 'operator', name: 'Оператор линии', title: 'ОПЕРАТОР ЛИНИИ', sub: 'производство · с обучением', type: 'cal', S: [[4, 4200], [6, 3500]] },
  { id: 'brigadir', name: 'Бригадир', title: 'БРИГАДИР', sub: 'нужен опыт руководства', type: 'ring', dark: 1, S: [[0], [1], [4]] },
  { id: 'menedzher', name: 'Менеджер', title: 'МЕНЕДЖЕР', sub: 'по клиентам · удалённо', type: 'remote', pay: '[Зарплата]', S: [],
    tiles: [['ГДЕ РАБОТАЮ', 'Из дома', 'Это не вахта.'], ['ГРАФИК', 'Полный день', '[Дни и часы.]'], ['КОГДА ДЕНЬГИ', '[Когда]', '[Как платит компания.]'],
      ['ЧТО НУЖНО', 'Опыт', 'Общение с клиентами.'], ['ЧЕМ РАБОТАЮ', '[Техника]', '[Компьютер свой или компании.]'], ['КТО ИЩЕТ', '[Кто]', '[Должность, команда.]']] }
];
// у удалённой работы нет объекта: отклик и «готово» подписываются так
const REMOTE = { n: 'Удалённая работа', m: 'удалённо' };
const NP = PROF.length;
const ST = PROF.map(() => ({ page: 'main', obj: 0, tab: 0, hov: null, err: '', call: false, foc: null, name: '', contact: '' }));
const HITS = PROF.map(() => []);
const advText = s => s.adv === 7 ? 'каждую неделю' : 'раз в 2 недели';
const mealLine = s => s.food === 0 ? 'еду готовите сами' : s.food === 1 ? 'обед на объекте' : `еда ${s.food} раза в день`;
const liveLine = s => `${s.live.toLowerCase()}, ${s.ppl} чел. · бесплатно`;
const foodLine = s => s.food ? `${s.fdt.toLowerCase()} · ${s.fdp}` : 'готовите сами · кухня в квартире';

function tabbar(g, sel, H, st) {
  rule(g, 50, 1, 38, .18);
  [['вакансия', 'nav:main'], ['отклик', 'nav:reply'], ['дальше', 'next']].forEach(([l, id], i) => {
    const x = [6, 19, 32][i], on = i === sel, hv = st.hov === id;
    if (on) withAcc(() => put(g, 51, x, '◆', 1)); else put(g, 51, x, hv ? '◈' : '◇', hv ? 1 : .42);
    txt(g, 52, x - Math.floor(l.length / 2), l, on ? .95 : hv ? .85 : .32);
    hit(H, 50, x - 5, 11, 3, id);
  });
}
// шапка: назад, профессия фирменным шрифтом, строка пояснения
function head(g, title, sub, H, st) {
  put(g, 1, 1, '←', H && st.hov === 'back' ? 1 : .85); if (H) hit(H, 0, 0, 3, 3, 'back');
  art(g, 0, 3, 3, title, { max: 33, weight: 640, fit: .82 }); put(g, 1, 38, '⋯', .7); txt(g, 3, 3, sub, .5);
}
// главная цифра и строка под ней
const NUM = { family: 'Montserrat', weight: 800, stretch: 'normal' };
function hero(g, value, line) { withAcc(() => art(g, 5, 1, 8, value, NUM)); put(g, 14, 1, '▲', .95); txt(g, 14, 3, line, .9); }
// список объектов полными названиями: выбранный отмечен точкой, справа ставка
function objList(g, r0, P, st, H) {
  P.S.forEach(([k, pay], i) => {
    const r = r0 + i, on = i === st.obj, hv = st.hov === 'obj:' + i, o = SITES[k];
    if (on) withAcc(() => put(g, r, 1, '●', 1)); else put(g, r, 1, '○', hv ? .85 : .45);
    txt(g, r, 3, o.n, on ? 1 : hv ? .9 : .6);
    rgt(g, r, 38, money(pay), on ? 1 : hv ? .9 : .6);
    hit(H, r, 0, 40, 1, 'obj:' + i);
  });
}
// кольцо смен: гладкие сегменты одного размера, по одному на смену. Смены с деньгами яркие и рисуются
// акцентным цветом, снаружи у них номер смены
function dial(g, r, c, rows, cols, N, hi) {
  const geo = (w, h) => { const cx = w / 2, cy = h / 2, R = Math.min(cx, cy) - V.ch * 1.8; return { cx, cy, R, th: Math.max(7, R * .13), gap: 2.6 / R }; };
  const ang = d => -Math.PI / 2 + d / N * Math.PI * 2;
  paint(g, r, c, rows, cols, (x, w, h) => {
    const { cx, cy, R, th, gap } = geo(w, h);
    x.lineWidth = th; x.lineCap = 'butt'; x.globalAlpha = .34;
    for (let d = 1; d <= N; d++) if (!hi.includes(d)) { x.beginPath(); x.arc(cx, cy, R, ang(d - 1) + gap / 2, ang(d) - gap / 2); x.stroke(); }
  });
  withAcc(() => paint(g, r, c, rows, cols, (x, w, h) => {
    const { cx, cy, R, th, gap } = geo(w, h);
    x.lineWidth = th; x.lineCap = 'butt';
    hi.forEach(d => { x.beginPath(); x.arc(cx, cy, R, ang(d - 1) + gap / 2, ang(d) - gap / 2); x.stroke(); });
    x.font = `500 ${Math.round(.92 * V.ch)}px "JetBrains Mono", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
    hi.forEach(d => { const a = ang(d - .5), q = R + th / 2 + V.ch * .8; x.fillText(String(d), cx + Math.cos(a) * q, cy + Math.sin(a) * q); });
  }));
}

/* ---------- вид «список»: ставка и условия зависят от объекта, вкладки сортируют объекты ---------- */
const TABS1 = [
  { t: 'СТАВКА', u: 'за смену', sort: (a, b) => b[1] - a[1], draw: (g, r, o, pay, on, mx) => { fill(g, r, 22, Math.round(pay / mx * 10), on ? '▓' : '░', on ? .95 : .55); rgt(g, r, 38, money(pay), on ? 1 : .8); } },
  { t: 'ЖИЛЬЁ', u: 'человек в комнате', sort: (a, b) => SITES[a[0]].ppl - SITES[b[0]].ppl || b[1] - a[1], draw: (g, r, o, pay, on) => { txt(g, r, 22, o.ppl + ' чел.', on ? 1 : .8); rgt(g, r, 38, o.live, on ? .9 : .6); } },
  { t: 'ЕДА', u: 'раз в день', sort: (a, b) => SITES[b[0]].food - SITES[a[0]].food || b[1] - a[1], draw: (g, r, o, pay, on) => { if (o.food) for (let m = 0; m < o.food; m++) put(g, r, 22 + m * 2, '●', on ? .95 : .6); else put(g, r, 22, '○', .5); rgt(g, r, 38, ['сами', 'обед', '2 раза', '3 раза'][o.food], on ? 1 : .8); } },
  { t: 'СРОК', u: 'смен', sort: (a, b) => SITES[a[0]].shifts - SITES[b[0]].shifts || b[1] - a[1], draw: (g, r, o, pay, on) => { fill(g, r, 22, Math.round(o.shifts / 60 * 9), on ? '▓' : '▒', on ? .95 : .5); rgt(g, r, 38, o.shifts + ' смен', on ? 1 : .8); } }
];
function listScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj], o = SITES[k], mx = Math.max(...P.S.map(x => x[1]));
  head(g, P.title, P.sub);
  hero(g, money(pay), 'за смену · ' + o.m);
  TABS1.forEach((T, j) => { const x = [1, 9, 16, 21][j], on = j === st.tab, hv = st.hov === 'tab:' + j; txt(g, 16, x, T.t, on ? 1 : hv ? .8 : .42); if (on) withAcc(() => rule(g, 17, x, T.t.length, .95)); hit(H, 16, x - 1, T.t.length + 2, 2, 'tab:' + j); });
  const T = TABS1[st.tab];
  txt(g, 19, 1, 'ОБЪЕКТЫ', .95); rgt(g, 19, 38, T.u, .4); rule(g, 20, 1, 38, .2);
  P.S.map((x, j) => j).sort((a, b) => T.sort(P.S[a], P.S[b])).forEach((j, n) => {
    const [kk, pp] = P.S[j], oo = SITES[kk], r = 22 + n * 2, on = j === st.obj, hv = st.hov === 'row:' + j;
    if (on || hv) withAcc(() => put(g, r, 0, '▸', on ? .95 : .55));
    txt(g, r, 1, oo.m, on ? 1 : hv ? .95 : .7);
    if (on) withAcc(() => T.draw(g, r, oo, pp, true, mx)); else T.draw(g, r, oo, pp, hv, mx);
    hit(H, r, 0, 40, 1, 'row:' + j);
  });
  rule(g, 36, 1, 38, .2);
  put(g, 37, 1, '⌂', .85); txt(g, 37, 3, liveLine(o), .75);
  put(g, 38, 1, '●', .85); txt(g, 38, 3, foodLine(o), .75);
  put(g, 39, 1, '◆', .85); txt(g, 39, 3, `${o.shifts} смен × ${o.hours} ч · аванс ${advText(o)}`, .75);
  btn(g, 41, 1, 19, 'ОТКЛИКНУТЬСЯ', true, st.hov === 'reply'); hit(H, 41, 1, 19, 3, 'reply');
  btn(g, 41, 21, 18, 'ПОЗВОНИТЬ', st.call, st.hov === 'call'); hit(H, 41, 21, 18, 3, 'call');
  if (st.call) { put(g, 45, 21, '→', 1); txt(g, 45, 23, '[телефон]', .9); txt(g, 46, 21, 'заполнит компания', .45); }
  tabbar(g, 0, H, st); homebar(g);
  return g;
}

/* ---------- вид «календарь»: вахта по неделям, аванс каждую неделю, деньги растут за вахту ---------- */
function calScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj], o = SITES[k], N = o.shifts, adv = o.adv, D = P.S.length - 3;
  head(g, P.title, P.sub);
  hero(g, money(pay), 'за смену · ' + o.m);
  objList(g, 16, P, st, H); rule(g, 19 + D, 1, 38, .2);
  txt(g, 20 + D, 1, `ВАХТА · ${N} СМЕН`, .95); rgt(g, 20 + D, 38, `по ${o.hours} часов`, .4); rule(g, 21 + D, 1, 38, .2);
  // неделя в строку: аванс приходится на последнюю смену недели, поэтому авансы стоят одним столбцом справа
  const rows = Math.ceil(N / 7), sp = rows <= 6 ? 2 : 1, day = st.hov && st.hov.startsWith('day:') ? +st.hov.slice(4) : 0;
  for (let w = 0; w < rows; w++) txt(g, 23 + D + w * sp, 1, 'н' + (w + 1), .3);
  for (let d = 1; d <= N; d++) {
    const r = 23 + D + Math.floor((d - 1) / 7) * sp, x = 6 + ((d - 1) % 7) * 5, pd = d % adv === 0, on = d <= day;
    if (d === day || pd) withAcc(() => put(g, r, x, d === day ? '■' : '◆', 1)); else put(g, r, x, '▪', on ? .85 : .45);
    hit(H, r, x - 2, 5, 1, 'day:' + d);
  }
  withAcc(() => put(g, 35 + D, 1, '◆', 1)); txt(g, 35 + D, 3, 'аванс ' + advText(o), .75); put(g, 35 + D, 27, '▪', .5); txt(g, 35 + D, 29, 'одна смена', .5);
  txt(g, 36 + D, 1, day ? `смена ${day} из ${N} · заработано ${money(pay * day)}` : 'наведите на смену', day ? 1 : .35);
  txt(g, 38 + D, 1, 'ДЕНЬГИ ЗА ВАХТУ', .95); rgt(g, 38 + D, 38, money(pay * N), 1); rule(g, 39 + D, 1, 38, .2);
  area(g, 40 + D, 42 + D, 5, 38, t => .08 + .92 * t, .95, .3, day ? day / N : 0);
  txt(g, 40 + D, 0, String(Math.floor(pay * N / 1000)), .4); txt(g, 42 + D, 2, '0', .4);
  rule(g, 43 + D, 5, 34, .2);
  for (let d = adv; d < N; d += adv) put(g, 43 + D, 5 + Math.round((d - .5) / N * 33), '┴', .55);
  if (day) put(g, 43 + D, 5 + Math.round((day - .5) / N * 33), '▲', 1);
  txt(g, 44 + D, 5, '1', .4); rgt(g, 44 + D, 38, String(N), .4); txt(g, 44 + D, 14, '┴ аванс', .45);
  btn(g, 46 + D, 1, 19, 'ОТКЛИКНУТЬСЯ', true, st.hov === 'reply'); hit(H, 46 + D, 1, 19, 3, 'reply');
  btn(g, 46 + D, 21, 18, 'УСЛОВИЯ', false, st.hov === 'cond'); hit(H, 46 + D, 21, 18, 3, 'cond');
  tabbar(g, 0, H, st); homebar(g);
  return g;
}

/* ---------- вид «кольцо»: смены по кругу, сколько авансов, еда и жильё ---------- */
function ringScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj], o = SITES[k], N = o.shifts, adv = o.adv, D = P.S.length - 3;
  head(g, P.title, P.sub);
  hero(g, money(pay), 'за смену · ' + mealLine(o));
  objList(g, 16, P, st, H); rule(g, 19 + D, 1, 38, .2);
  txt(g, 20 + D, 1, `ВАХТА · ${N} СМЕН`, .95); rgt(g, 20 + D, 38, `по ${o.hours} часов`, .4);
  const hi = []; for (let d = adv; d < N; d += adv) hi.push(d); hi.push(N);
  dial(g, 21 + D, 2, 17, 36, N, hi);
  // в середине кольца словами: сколько смен и сколько раз платят. Яркие сегменты снаружи — эти выплаты
  const na = hi.length - 1, word = na % 10 === 1 && na % 100 !== 11 ? 'аванс' : [2, 3, 4].includes(na % 10) && ![12, 13, 14].includes(na % 100) ? 'аванса' : 'авансов';
  art(g, 25 + D, 1, 3, String(N), { ...NUM, max: 38, center: true });
  txt(g, 28 + D, 18, 'смен', .6);
  art(g, 30 + D, 12, 2, `${na} ${word}`, { ...NUM, max: 16, center: true, fit: .9 });
  txt(g, 32 + D, 12, 'и расчёт в конце', .6);
  withAcc(() => put(g, 39 + D, 1, '█', 1)); txt(g, 39 + D, 3, 'яркие — смены, после которых платят', .75);
  rule(g, 40 + D, 1, 38, .2);
  txt(g, 41 + D, 1, o.food ? '●'.repeat(o.food) : '○', .9); txt(g, 41 + D, 5, foodLine(o), .75);
  put(g, 42 + D, 1, '⌂', .9); txt(g, 42 + D, 5, liveLine(o), .75);
  btn(g, 45 + D, 1, 38, 'ОТКЛИКНУТЬСЯ', true, st.hov === 'reply'); hit(H, 45 + D, 1, 38, 3, 'reply');
  tabbar(g, 0, H, st); homebar(g);
  return g;
}

/* ---------- вид «удалённо»: у менеджера нет объектов и вахты, только условия работы из дома ---------- */
function remoteScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i];
  head(g, P.title, P.sub);
  hero(g, 'ИЗ ДОМА', 'это не вахта · ' + P.tiles[1][1].toLowerCase());
  txt(g, 16, 1, 'УСЛОВИЯ', .95); rgt(g, 16, 38, 'удалённая работа', .4); rule(g, 17, 1, 38, .2);
  P.tiles.forEach(([a, b, c], n) => { const r = 19 + n * 4; txt(g, r, 1, a, .45); txt(g, r + 1, 1, b, .95); txt(g, r + 2, 1, c, .5); });
  btn(g, 44, 1, 38, 'ОТКЛИКНУТЬСЯ', true, st.hov === 'reply'); hit(H, 44, 1, 38, 3, 'reply');
  tabbar(g, 0, H, st); homebar(g);
  return g;
}

/* ---------- общие страницы телефона: условия, отклик, готово ---------- */
function condScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj], s = SITES[k];
  head(g, 'УСЛОВИЯ', `${P.name} · ${s.n.toLowerCase()}`, H, st);
  const L = [['СТАВКА', `${money(pay)} за смену. Пример, сумму уточнит компания.`], ['ВАХТА', `${s.shifts} смен по ${s.hours} часов.`], ['ЖИЛЬЁ', `${s.live}, ${s.lv}. Бесплатно.`],
    ['ЕДА', s.food ? `${s.fdt}. ${s.fdp[0].toUpperCase() + s.fdp.slice(1)}.` : 'Готовите сами. Кухня в квартире.'], ['АВАНС', `${advText(s)[0].toUpperCase() + advText(s).slice(1)}. Остальное в конце вахты.`], ['ДОРОГА', '[Билет. Оплачивает компания или нет.]']];
  let r = 6;
  L.forEach(([a, b]) => { txt(g, r, 1, a, .45); wrap(b, 38).forEach((l, n) => txt(g, r + 1 + n, 1, l, .95)); r += 2 + wrap(b, 38).length + 1; });
  btn(g, 40, 1, 38, 'ОТКЛИКНУТЬСЯ', true, st.hov === 'reply'); hit(H, 40, 1, 38, 3, 'reply');
  btn(g, 44, 1, 38, 'НАЗАД', false, st.hov === 'back2'); hit(H, 44, 1, 38, 3, 'back2');
  tabbar(g, 0, H, st); homebar(g);
  return g;
}
function field(g, r, label, key, ph, st, H) {
  txt(g, r, 1, label, .6);
  const foc = st.foc === key, hv = st.hov === 'f:' + key, v = st[key];
  (foc ? heavy : box)(g, r + 1, 1, 38, 3, foc || hv ? 1 : .55);
  if (v) txt(g, r + 2, 3, v, 1); else if (!foc) txt(g, r + 2, 3, ph, .35);
  hit(H, r + 1, 1, 38, 3, 'f:' + key);
  H.f = H.f || {}; H.f[key] = { r: r + 2, c: 3, w: 34 };
}
function replyScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj] || [], s = SITES[k] || REMOTE;
  head(g, 'ОТКЛИК', `${P.name} · ${s.n.toLowerCase()}`, H, st);
  hero(g, P.pay || money(pay), (P.pay ? 'зарплата · ' : 'за смену · ') + s.m);
  field(g, 16, 'ИМЯ', 'name', 'ваше имя', st, H);
  field(g, 21, 'ТЕЛЕФОН ИЛИ ПОЧТА', 'contact', 'куда вам ответить', st, H);
  if (st.err) { put(g, 26, 1, '▲', 1); txt(g, 26, 3, st.err, 1); }
  btn(g, 28, 1, 38, 'ОТПРАВИТЬ', true, st.hov === 'send'); hit(H, 28, 1, 38, 3, 'send');
  btn(g, 32, 1, 38, 'НАЗАД', false, st.hov === 'back2'); hit(H, 32, 1, 38, 3, 'back2');
  txt(g, 37, 1, 'прототип: отклик никуда не уйдёт', .4);
  tabbar(g, 1, H, st); homebar(g);
  return g;
}
function doneScr(i, st, H) {
  const g = grid(IW, IH), P = PROF[i], [k, pay] = P.S[st.obj] || [], s = SITES[k] || REMOTE;
  head(g, 'ОТКЛИК', `${P.name} · ${s.n.toLowerCase()}`, H, st);
  withAcc(() => art(g, 6, 1, 6, 'ВЫ НАШЛИСЬ.'));
  txt(g, 14, 1, '[Кто] напишет вам [в какой срок].', .9);
  rule(g, 16, 1, 38, .2);
  txt(g, 18, 1, 'ВАКАНСИЯ', .45); txt(g, 19, 1, `${P.name} · ${s.m}`, .95); txt(g, 20, 1, P.pay ? `${P.pay} в месяц` : `${money(pay)} за смену`, .8);
  txt(g, 22, 1, 'ИМЯ', .45); txt(g, 23, 1, st.name.slice(0, 38), .95);
  txt(g, 25, 1, 'КУДА ОТВЕТИТЬ', .45); txt(g, 26, 1, st.contact.slice(0, 38), .95);
  btn(g, 30, 1, 38, 'ДРУГИЕ ПРОФЕССИИ', true, st.hov === 'next'); hit(H, 30, 1, 38, 3, 'next');
  btn(g, 34, 1, 38, 'К ВАКАНСИИ', false, st.hov === 'nav:main'); hit(H, 34, 1, 38, 3, 'nav:main');
  txt(g, 38, 1, 'прототип: отклик никуда не ушёл', .4);
  tabbar(g, 1, H, st); homebar(g);
  return g;
}
const MAIN = { list: listScr, cal: calScr, ring: ringScr, remote: remoteScr };
function screenOf(i) {
  const st = ST[i], H = HITS[i] = [];
  return st.page === 'reply' ? replyScr(i, st, H) : st.page === 'done' ? doneScr(i, st, H) : st.page === 'cond' ? condScr(i, st, H) : MAIN[PROF[i].type](i, st, H);
}
function full(inner) { const g = grid(COLS, ROWS); phone(g); stamp(g, inner, 4, 5); return g; }
let FRAMES = PROF.map(() => null);

/* ---------- частицы: каждая клетка экрана летит отдельно ---------- */
function rnd(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const ASH = ['.', ':', '·', '*', '+', '◦', '▪', '✦', '✧'];
// уход: край, который смотрит по ветру, срывается первым; пепел собирается в облако у центра
function outSet(g, at, dir, seed) {
  const R = rnd(seed), P = [], cx = V.w * .5 + 60 * dir, cy = V.h * .5;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const s = g[r][c]; if (s.a < .04 || s.c === ' ') continue;
    const reach = 60 + 110 * R(), dy = (R() - .5) * 180, side = R() < .5 ? -.4 : 1, b = c / (COLS - 1);
    const begin = (dir > 0 ? (1 - b) * .55 : b * .55) + .04 * R(), dur = .28 + .1 * R();
    P.push({ ch: s.c, m: s.m, t: s.t, k: s.k | 0, x0: at.x + c * V.cw, y0: at.y + r * V.ch, x1: cx + dir * reach * side, y1: cy + dy, a0: s.a, a1: 0, b: begin, e: Math.min(.72, begin + dur), s: Math.floor(R() * 1e7) });
  }
  return P;
}
// приход: облако с другой стороны оседает в новый экран; первым собирается край, к которому летит облако
function inSet(g, at, dir, seed) {
  const R = rnd(seed), P = [], cx = V.w * .5 - 60 * dir, cy = V.h * .5;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const s = g[r][c]; if (s.a < .04 || s.c === ' ') continue;
    const reach = 60 + 110 * R(), dy = (R() - .5) * 180, side = R() < .5 ? -.4 : 1, b = c / (COLS - 1);
    const begin = .35 + (dir > 0 ? b * .5 : (1 - b) * .5) + .04 * R(), dur = .28 + .1 * R();
    P.push({ ch: s.c, m: s.m, t: s.t, k: s.k | 0, x0: cx - dir * reach * side, y0: cy + dy, x1: at.x + c * V.cw, y1: at.y + r * V.ch, a0: 0, a1: s.a, b: begin, e: Math.min(.96, begin + dur), s: Math.floor(R() * 1e7) });
  }
  return P;
}
// появление при загрузке: знаки слетаются с кольца вокруг центра, середина экрана собирается первой
function enterSet(g, at, seed) {
  const R = rnd(seed), P = [], mx = at.x + COLS * V.cw / 2, my = at.y + ROWS * V.ch / 2, half = Math.hypot(COLS * V.cw, ROWS * V.ch) / 2;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const s = g[r][c]; if (s.a < .04 || s.c === ' ') continue;
    const x = at.x + c * V.cw, y = at.y + r * V.ch, ang = R() * Math.PI * 2, rad = .5 * Math.min(V.w, V.h) + 320 * R();
    const ox = mx + (R() - .5) * 220, oy = V.h * .5 + (R() - .5) * 180;
    const begin = (1 - Math.min(1, Math.hypot(x - mx, y - my) / half)) * .5 + .1 * R(), dur = .34 + .16 * R();
    P.push({ ch: s.c, m: s.m, t: s.t, k: s.k | 0, x0: ox + Math.cos(ang) * rad, y0: oy + Math.sin(ang) * rad, x1: x, y1: y, a0: 0, a1: s.a, b: begin, e: Math.min(.98, begin + dur), s: Math.floor(R() * 1e7) });
  }
  return P;
}
// завихрение пути: две синусоиды со своей фазой у каждой частицы
const swirl = (s, h, k) => { const p = .0173 * s + 7.91 * k; return .6 * Math.sin(p + 5.21 * h) + .4 * Math.sin(1.6 * p + 11.4 * h); };
const ease = h => h < .5 ? 4 * h * h * h : 1 - Math.pow(-2 * h + 2, 3) / 2;
// куски клетки ложатся точно на пиксели экрана: соседние куски стыкуются без щелей и без двойных полос
const snap = v => Math.round(v * V.dpr) / V.dpr;
function drawMask(x, y, m) {
  const w = V.cw / SX, h = V.ch / SY;
  for (let by = 0; by < SY; by++) {
    const y0 = snap(y + by * h), y1 = snap(y + (by + 1) * h);
    for (let bx = 0; bx < SX; bx++) {
      if (!(m >> (by * SX + bx) & 1)) continue;
      let e = bx; while (e + 1 < SX && (m >> (by * SX + e + 1) & 1)) e++;
      const x0 = snap(x + bx * w), x1 = snap(x + (e + 1) * w);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0); bx = e;
    }
  }
}
// плитка ложится точно на пиксели: соседние плитки стыкуются без щелей
function tile(t, x, y) { const X = snap(x), Y = snap(y); ctx.drawImage(tint(t.src), t.sx, t.sy, t.sw, t.sh, X, Y, snap(x + V.cw) - X, snap(y + V.ch) - Y); }
const glyph = (ch, m, x, y, t) => t ? tile(t, x, y) : m ? drawMask(x, y, m) : ctx.fillText(ch, x, y);
let KK = -1;
const ink = k => { if (k !== KK) { KK = k; ctx.fillStyle = k ? COL.acc : COL.fg; } };
function drawSet(P, prog, curl, ash) {
  const t = Math.min(1, Math.max(0, prog));
  KK = -1;
  for (let i = 0; i < P.length; i++) {
    const p = P[i]; ink(p.k);
    if (t <= p.b) { if (p.a0 > 0) { ctx.globalAlpha = p.a0; glyph(p.ch, p.m, p.x0, p.y0, p.t); } continue; }
    if (t >= p.e) { if (p.a1 > 0) { ctx.globalAlpha = p.a1; glyph(p.ch, p.m, p.x1, p.y1, p.t); } continue; }
    const h = (t - p.b) / (p.e - p.b), u = ease(h);
    const x = p.x0 + (p.x1 - p.x0) * u + swirl(p.s, h, 0) * curl, y = p.y0 + (p.y1 - p.y0) * u + swirl(p.s, h, 1) * curl * .7;
    const al = p.a1 === 0 ? (h < .7 ? p.a0 : p.a0 * (1 - (h - .7) / .3)) : (h < .25 ? p.a1 * (h / .25) : p.a1);
    let ch = p.ch, m = p.m, tl = p.t;
    if (ash > 0 && h > .32 && h < .72) { const k = Math.imul(p.s, 0x9E3779B1) >>> 0; if (((k >>> 8) & 255) / 255 < ash) { ch = ASH[(k + Math.floor(h * 64)) % ASH.length]; m = 0; tl = null; } }
    ctx.globalAlpha = al; glyph(ch, m, x, y, tl);
  }
  ctx.globalAlpha = 1;
}
function drawGrid(g, at) {
  const done = new Set();
  KK = -1;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const s = g[r][c]; if (s.a < .04 || s.c === ' ') continue;
    ctx.globalAlpha = s.a; ink(s.k | 0);
    if (s.t) { if (done.has(s.t.src)) continue; done.add(s.t.src); ctx.drawImage(tint(s.t.src), snap(at.x + (c - s.t.dc) * V.cw), snap(at.y + (r - s.t.dr) * V.ch), s.t.src.width / V.dpr, s.t.src.height / V.dpr); }
    else glyph(s.c, s.m, at.x + c * V.cw, at.y + r * V.ch);
  }
  ctx.globalAlpha = 1;
}

/* ---------- цвет: палитры. На третьем экране цвета плавно меняются на вторую половину палитры, как в Cipher ---------- */
const PALS = {
  a: { name: 'оранжевый', n: { bg: '#ff5c0a', fg: '#1a0700', acc: '#1a0700', on: '#ff5c0a' }, i: { bg: '#1a0700', fg: '#ff5c0a', acc: '#ff5c0a', on: '#1a0700' } },
  p: { name: 'персик', n: { bg: '#f8bf9c', fg: '#5a1f0d', acc: '#5a1f0d', on: '#f8bf9c' }, i: { bg: '#5a1f0d', fg: '#f8bf9c', acc: '#f8bf9c', on: '#5a1f0d' } },
  w: { name: 'холодный белый', n: { bg: '#f6f8fb', fg: '#0e141b', acc: '#ff5c0a', on: '#0e141b' }, i: { bg: '#151b22', fg: '#eaeff4', acc: '#ff5c0a', on: '#0e141b' } },
  d: { name: 'тёплый тёмный', n: { bg: '#231d18', fg: '#eee5d8', acc: '#ff5c0a', on: '#211a15' }, i: { bg: '#eee5d8', fg: '#231d18', acc: '#ff5c0a', on: '#211a15' } },
  b: { name: 'чёрный', n: { bg: '#1a0700', fg: '#ff5c0a', acc: '#ff5c0a', on: '#1a0700' }, i: { bg: '#ff5c0a', fg: '#1a0700', acc: '#1a0700', on: '#ff5c0a' } }
};
const PAL_KEYS = ['a', 'p', 'w', 'd', 'b'];
// палитра «Холодный белый»; тёмные экраны — холодный графит (выбор 2026-11-09, бежевый «Бумаги» не подошёл)
const PAL = 'w';
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixA = (A, B, t) => A.map((v, i) => Math.round(v + (B[i] - v) * t));
const css = A => `rgb(${A.join(',')})`;
const sstep = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
let COL = { fg: '#000', acc: '#000' };
function colors(p) { return colorsDk(darkness(p)); }
function colorsDk(t) {
  const A = PALS[PAL].n, B = PALS[PAL].i, out = {};
  for (const k of ['bg', 'fg', 'acc', 'on']) out[k] = mixA(hex(A[k]), hex(B[k]), t);
  return { bg: css(out.bg), fg: css(out.fg), acc: css(out.acc), on: css(out.on), sh: css(mixA(out.acc, [0, 0, 0], .45)) };
}

/* ---------- раскладка: те же пропорции, что у референса ---------- */
const cv = document.getElementById('cy-cv'), ctx = cv.getContext('2d'), stage = document.querySelector('#cy .cy-stage'), sec = document.getElementById('cy'), rab = document.getElementById('rabota');
const V = {};
let SETS = null;
function layout() {
  V.w = innerWidth; V.h = innerHeight;
  V.ch = Math.max(9, Math.min(16, Math.floor(Math.min(.7 * V.h, V.h - 80) / ROWS)));
  V.cw = Math.round(.572 * V.ch * 100) / 100;
  V.pw = COLS * V.cw; V.ph = ROWS * V.ch;
  const m = Math.max(64, .06 * V.w), cw = Math.min(1440, V.w - 2 * m), x0 = (V.w - cw) / 2, col = Math.max(V.pw + 16, .28 * cw);
  V.left = { x: x0 + (col - V.pw) / 2, y: (V.h - V.ph) / 2 };
  V.right = { x: x0 + cw - col + (col - V.pw) / 2, y: (V.h - V.ph) / 2 };
  V.txR = x0 + col + 56; V.txL = x0; V.tw = cw - col - 56; V.ty = (V.h - V.ph) / 2;
  const dpr = V.dpr = Math.min(2.5, devicePixelRatio || 1);
  cv.width = V.w * dpr; cv.height = V.h * dpr; cv.style.width = V.w + 'px'; cv.style.height = V.h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.textBaseline = 'top';
  const AT = PROF.map((x, i) => i % 2 ? V.right : V.left);
  SETS = { at: AT, out: [], inn: [] };
  for (let i = 0; i < NP; i++) rebuild(i);
  SETS.en = enterSet(FRAMES[0], AT[0], 90210);
  sec.style.height = (SEG.total + 1) * 100 + 'vh';
  PN.forEach((el, i) => { const L = i % 2 === 1; Object.assign(el.style, { top: V.ty + 'px', bottom: V.ty + 'px', width: V.tw + 'px', left: (L ? V.txL : V.txR) + 'px' }); });
  dirty = true;
}

/* ---------- колонки текста ---------- */
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
document.getElementById('cy-panels').innerHTML = PANELS.map((p, i) => `<div class="cy-pn">
  <div>
    <p class="cy-eb cy-mono">${esc(p.eb)}</p>
    <h2 class="cy-tt">${esc(p.tt)}</h2>
    <p class="cy-bd">${esc(p.bd)}</p>
  </div>
  <div>
    <p class="cy-lb cy-mono">${esc(p.lb)}</p>
    <div class="cy-row">
      <figure class="cy-ph"><img src="${(window.GT_IMG && GT_IMG[p.img]) || 'assets/photo/' + p.img + '.webp'}" alt="" style="object-position:${p.pos}"></figure>
      <dl class="cy-fx">${p.fx.map(([a, b]) => `<div><dt class="cy-mono">${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
    </div>
    <button class="cy-cta" type="button" data-reply="${i}">Откликнуться <span aria-hidden="true">→</span></button>
    <p class="cy-mt cy-mono">пример · суммы уточнит компания</p>
  </div>
</div>`).join('');
const PN = [...document.querySelectorAll('.cy-pn')];

// время ленты в долях высоты окна: первый экран держится коротко, средние дольше, переход длинный
const T_FIRST = .12, T_HOLD = .7, T_LAST = .6, T_TRANS = 1.2;
const SEG = (() => {
  const L = [], total = T_FIRST + (NP - 2) * T_HOLD + T_LAST + (NP - 1) * T_TRANS;
  let t = 0;
  for (let i = 0; i < NP; i++) {
    const h = i === 0 ? T_FIRST : i === NP - 1 ? T_LAST : T_HOLD;
    L.push({ hold: i, a: t / total, b: (t + h) / total }); t += h;
    if (i < NP - 1) { L.push({ from: i, to: i + 1, a: t / total, b: (t + T_TRANS) / total }); t += T_TRANS; }
  }
  L.total = total;
  return L;
})();
const TR = SEG.filter(x => x.from != null);
const HOLD_P = SEG.filter(x => x.hold != null).map((x, i) => i === 0 ? 0 : i === NP - 1 ? 1 : (x.a + x.b) / 2);
function phase(p) {
  for (const x of SEG) if (p <= x.b) return x.hold != null ? { hold: x.hold } : { from: x.from, to: x.to, t: (p - x.a) / (x.b - x.a) };
  return { hold: NP - 1 };
}
// колонки текста: гаснут, размываются и уезжают на 80px; входят с той же стороны. Доли — как у Cipher
function pnAlpha(i, p) {
  let a = 1;
  const tin = TR[i - 1], tout = TR[i];
  if (tin) { const L = tin.b - tin.a; a *= sstep((p - (tin.a + .82 * L)) / (.3 * L)); }
  if (tout) { const L = tout.b - tout.a; a *= 1 - sstep((p - (tout.a - .06 * L)) / (.3 * L)); }
  return a;
}
function pnShift(i, p) {
  const sg = i % 2 ? 1 : -1, tin = TR[i - 1], tout = TR[i];
  if (tout && p > tout.a) { const L = tout.b - tout.a; return sg * 80 * sstep((p - tout.a) / (.36 * L)); }
  if (tin) { const L = tin.b - tin.a; return sg * 80 * (1 - sstep((p - (tin.a + .82 * L)) / (.3 * L))); }
  return 0;
}
// насколько экран «тёмный»: на тёмных экранах палитра меняется на вторую половину. Смена цвета в конце перехода
function darkness(p) {
  const ph = phase(p), dk = i => PROF[i].dark ? 1 : 0;
  if (ph.hold != null) return dk(ph.hold);
  return dk(ph.from) + (dk(ph.to) - dk(ph.from)) * sstep((ph.t - .75) / .25);
}

/* ---------- цвет шапки сайта ---------- */
function syncInk() {
  if (document.body.dataset.w !== 'rabota') return;
  let ink = true;
  if (rab.classList.contains('v')) { const h = rab.querySelector('.vac:not([hidden]) .v-hero'); ink = !!h && rab.scrollTop > h.offsetHeight - 60; }
  else { const r = sec.getBoundingClientRect(); if (r.top < 60 && r.bottom > 60) ink = darkness(prog) < .5; }
  document.body.classList.toggle('ink', ink);
}

/* ---------- кадр ---------- */
const hn = document.getElementById('cy-hn'), lf = document.getElementById('cy-lf'), bgc = document.getElementById('cy-bgc');
let target = 0, prog = 0, dirty = true, t0 = 0, entered = false, enter = 0, last = 0;
function readScroll() { const r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight; target = Math.min(1, Math.max(0, -r.top / span)); }
// лента видна: открыт мир «Работа», не открыта вакансия, секция на экране
function active() { if (document.body.dataset.w !== 'rabota' || rab.classList.contains('v')) return false; const r = sec.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
function frame(now) {
  if (!active()) { last = 0; requestAnimationFrame(frame); return; }
  if (!entered && !t0 && sec.getBoundingClientRect().top > innerHeight * .45) { requestAnimationFrame(frame); return; }
  const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
  const d = target - prog;
  if (Math.abs(d) > 1e-4) { prog += d * (1 - Math.exp(-dt / .14)); dirty = true; } else if (prog !== target) { prog = target; dirty = true; }
  if (!entered) { if (!t0) t0 = now; enter = Math.min(1, (now - t0) / 2000); if (enter >= 1) entered = true; dirty = true; }
  if (JUMP) { if (now - JUMP.t0 >= JUMP_MS) JUMP = null; dirty = true; }
  if (dirty) { draw(); dirty = false; }
  requestAnimationFrame(frame);
}
// кадр прямого перехода: старый экран и его текст уходят, новый собирается; цвет меняется в конце, как при прокрутке
function drawJump() {
  const J = JUMP, t = Math.min(1, (performance.now() - J.t0) / JUMP_MS), dk = i => PROF[i].dark ? 1 : 0;
  const C = colorsDk(dk(J.from) + (dk(J.to) - dk(J.from)) * sstep((t - .75) / .25));
  bgc.style.backgroundColor = C.bg; stage.style.color = C.fg;
  stage.style.setProperty('--fg', C.fg); stage.style.setProperty('--bg', C.bg); stage.style.setProperty('--sh', C.sh); stage.style.setProperty('--acc', C.acc); stage.style.setProperty('--on', C.on);
  COL = C;
  ctx.clearRect(0, 0, V.w, V.h);
  ctx.font = `500 ${Math.round(.92 * V.ch)}px "JetBrains Mono", ui-monospace, Consolas, monospace`;
  ctx.textBaseline = 'top'; ctx.fillStyle = C.fg;
  drawSet(J.out, t, 22, .45); drawSet(J.inn, t, 22, .45);
  hn.textContent = `${String(J.to + 1).padStart(2, '0')} / ${String(NP).padStart(2, '0')}`;
  PN.forEach((el, i) => {
    const sg = i % 2 ? 1 : -1, out = i === J.from, inn = i === J.to;
    const a = out ? 1 - sstep(t / .3) : inn ? sstep((t - .72) / .28) : 0, x = out ? sg * 80 * sstep(t / .36) : inn ? sg * 80 * (1 - sstep((t - .72) / .28)) : 0, b = a < 1 ? (1 - a) * 6 : 0;
    el.style.opacity = a; el.style.transform = `translate3d(${x}px,0,0)`; el.style.filter = b > .1 ? `blur(${b.toFixed(2)}px)` : 'none';
    el.style.pointerEvents = 'none'; el.style.zIndex = inn ? 3 : 1;
  });
  placeInput(); navDraw(1);
}
function draw() {
  if (JUMP) { drawJump(); return; }
  const C = colors(prog);
  bgc.style.backgroundColor = C.bg; stage.style.color = C.fg;
  stage.style.setProperty('--fg', C.fg); stage.style.setProperty('--bg', C.bg); stage.style.setProperty('--sh', C.sh); stage.style.setProperty('--acc', C.acc); stage.style.setProperty('--on', C.on);
  COL = C;
  ctx.clearRect(0, 0, V.w, V.h);
  ctx.font = `500 ${Math.round(.92 * V.ch)}px "JetBrains Mono", ui-monospace, Consolas, monospace`;
  ctx.textBaseline = 'top'; ctx.fillStyle = C.fg;
  const ph = phase(prog);
  if (!entered) drawSet(SETS.en, enter, 52.8, .585);
  else if (ph.hold != null) drawGrid(FRAMES[ph.hold], SETS.at[ph.hold]);
  else { drawSet(SETS.out[ph.from], ph.t, 22, .45); drawSet(SETS.inn[ph.to], ph.t, 22, .45); }
  const k = ph.hold != null ? ph.hold : ph.t < .5 ? ph.from : ph.to;
  hn.textContent = `${String(k + 1).padStart(2, '0')} / ${String(NP).padStart(2, '0')}`;
  lf.style.transform = `scaleY(${prog})`;
  const f = entered ? 1 : enter < .5 ? 0 : (enter - .5) / .5;
  PN.forEach((el, i) => {
    const a = pnAlpha(i, prog) * f, x = pnShift(i, prog), b = a < 1 ? (1 - a) * 6 : 0;
    el.style.opacity = a; el.style.transform = `translate3d(${x}px,0,0)`; el.style.filter = b > .1 ? `blur(${b.toFixed(2)}px)` : 'none';
    el.style.pointerEvents = a > .55 && entered ? 'auto' : 'none'; el.style.zIndex = a > .55 ? 3 : 1;
  });
  placeInput(); navDraw(f); syncInk();
  document.getElementById('cy-hc').style.opacity = .55 * f; document.getElementById('cy-hs').style.opacity = .4 * f;
}

/* ---------- экраны телефона живые: наведение, клики, отклик ---------- */
function rebuild(i) {
  FRAMES[i] = full(screenOf(i));
  const AT = SETS.at;
  const dir = j => j % 2 ? -1 : 1;   // экран слева улетает вправо, экран справа — влево
  if (i < NP - 1) SETS.out[i] = outSet(FRAMES[i], AT[i], dir(i), 1337 + i * 977);
  if (i > 0) SETS.inn[i] = inSet(FRAMES[i], AT[i], dir(i - 1), 2024 + i * 613);
  dirty = true;
}
function holdNow() { const ph = phase(prog); return !JUMP && entered && ph.hold != null && Math.abs(target - prog) < .003 ? ph.hold : -1; }
// клетка внутреннего экрана под курсором
function cellAt(i, x, y) { const at = SETS.at[i]; return { r: Math.floor((y - at.y) / V.ch) - 4, c: Math.floor((x - at.x) / V.cw) - 5 }; }
function hitAt(i, x, y) {
  const { r, c } = cellAt(i, x, y);
  for (let k = HITS[i].length - 1; k >= 0; k--) { const h = HITS[i][k]; if (r >= h.r && r < h.r + h.h && c >= h.c && c < h.c + h.w) return h.id; }
  return null;
}
let hovI = -1;
function setHover(i, id) {
  if (hovI >= 0 && hovI !== i && ST[hovI].hov) { ST[hovI].hov = null; rebuild(hovI); }
  hovI = i;
  if (i >= 0 && ST[i].hov !== id) { ST[i].hov = id; rebuild(i); }
  stage.style.cursor = id && !id.startsWith('day:') ? 'pointer' : '';
}
const fi = document.getElementById('cy-fi');
let FOC = null;   // { i, key } — поле, в котором стоит курсор
function placeInput() {
  const i = holdNow();
  if (!FOC || i !== FOC.i || ST[i].page !== 'reply') { if (fi.style.display !== 'none') { fi.style.display = 'none'; fi.blur(); } return; }
  const f = HITS[i].f && HITS[i].f[FOC.key]; if (!f) return;
  const at = SETS.at[i], fs = Math.round(.92 * V.ch);
  ctx.font = `500 ${fs}px "JetBrains Mono", ui-monospace, Consolas, monospace`;
  Object.assign(fi.style, { display: 'block', left: at.x + (5 + f.c) * V.cw + 'px', top: at.y + (4 + f.r) * V.ch + 'px', width: f.w * V.cw + 'px', height: V.ch + 'px', fontSize: fs + 'px', lineHeight: V.ch + 'px', letterSpacing: (V.cw - ctx.measureText('0').width) + 'px' });
}
function focusField(i, key) {
  FOC = { i, key }; ST[i].foc = key; fi.value = ST[i][key]; rebuild(i); placeInput();
  fi.focus({ preventScroll: true }); fi.setSelectionRange(fi.value.length, fi.value.length);
}
function send(i) {
  const st = ST[i];
  st.err = !st.name.trim() ? 'Напишите имя.' : !st.contact.trim() ? 'Укажите, куда ответить.' : '';
  if (st.err) { focusField(i, !st.name.trim() ? 'name' : 'contact'); return; }
  st.page = 'done'; st.foc = null; FOC = null; fi.blur(); rebuild(i); placeInput();
}
let JUMP = null;
const JUMP_MS = 1500;
function goTo(k) {
  const ph = phase(prog), i = JUMP ? JUMP.to : ph.hold != null ? ph.hold : ph.t < .5 ? ph.from : ph.to;
  const top = sec.getBoundingClientRect().top - rab.getBoundingClientRect().top + rab.scrollTop, span = sec.offsetHeight - innerHeight;
  if (k !== i && entered && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const dir = i % 2 ? -1 : 1;   // экран слева улетает вправо, справа — влево, как при прокрутке
    JUMP = { from: i, to: k, t0: performance.now(), out: outSet(FRAMES[i], SETS.at[i], dir, 3101 + i), inn: inSet(FRAMES[k], SETS.at[k], dir, 4202 + k) };
    if (FOC) { ST[FOC.i].foc = null; FOC = null; fi.blur(); }
    setHover(-1, null);
  }
  rab.scrollTo({ top: top + HOLD_P[k] * span, behavior: 'instant' });
  readScroll(); prog = target; dirty = true;
}
function act(i, id) {
  const st = ST[i];
  if (id.startsWith('tab:')) st.tab = +id.slice(4);
  else if (id.startsWith('row:') || id.startsWith('obj:')) { st.obj = +id.slice(4); st.call = false; }
  else if (id === 'reply' || id === 'nav:reply') { if (st.page !== 'done') { st.page = 'reply'; st.err = ''; } else return; }
  else if (id === 'nav:main' || id === 'back' || id === 'back2') { st.page = 'main'; st.foc = null; st.err = ''; FOC = null; }
  else if (id === 'cond') st.page = 'cond';
  else if (id === 'call') st.call = !st.call;
  else if (id === 'next') { goTo((i + 1) % NP); return; }
  else if (id.startsWith('f:')) { focusField(i, id.slice(2)); return; }
  else if (id === 'send') { send(i); }
  else return;
  if (st.page !== 'reply') { FOC = null; st.foc = null; }
  st.hov = null; rebuild(i); placeInput();
}
addEventListener('mousemove', e => {
  if (!e.target.closest || !e.target.closest('#cy') || e.target.closest('.cy-pn, #cy-fi, #cy-nav')) { if (hovI >= 0) setHover(-1, null); return; }
  const i = holdNow(); if (i < 0) { setHover(-1, null); return; }
  setHover(i, hitAt(i, e.clientX, e.clientY));
});
addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#cy') || e.target.closest('.cy-pn, #cy-fi, #cy-nav')) return;
  const i = holdNow(); if (i < 0) return;
  const id = hitAt(i, e.clientX, e.clientY);
  if (id) act(i, id);
  else if (FOC) { ST[FOC.i].foc = null; const k = FOC.i; FOC = null; rebuild(k); placeInput(); }
});
fi.addEventListener('input', () => { if (!FOC) return; ST[FOC.i][FOC.key] = fi.value; ST[FOC.i].err = ''; rebuild(FOC.i); });
fi.addEventListener('keydown', e => {
  if (!FOC) return;
  if (e.key === 'Enter') { e.preventDefault(); if (FOC.key === 'name') focusField(FOC.i, 'contact'); else send(FOC.i); }
  if (e.key === 'Tab') { e.preventDefault(); focusField(FOC.i, FOC.key === 'name' ? 'contact' : 'name'); }
  if (e.key === 'Escape') { const k = FOC.i; ST[k].foc = null; FOC = null; fi.blur(); rebuild(k); placeInput(); }
});

/* ---------- навигация слева: чёрточки профессий, список при наведении ---------- */
const nav = document.getElementById('cy-nav');
const navPay = i => { const a = PROF[i].S.map(x => x[1]).filter(Boolean); return a.length ? 'от ' + money(Math.min(...a)) : PROF[i].pay ? 'удалённо' : '[ставка]'; };
nav.querySelector('ol').insertAdjacentHTML('beforebegin', '<i class="cy-hl" aria-hidden="true"></i>');
nav.querySelector('ol').innerHTML = PANELS.map((p, i) => `<li><button type="button" data-i="${i}" style="--k:${i}" aria-label="${esc(p.tt)}"><i class="cy-d" aria-hidden="true"></i><span class="cy-nn">${String(i + 1).padStart(2, '0')}</span><span class="cy-nm" data-t="${esc(p.tt)}">${esc(p.tt)}</span><span class="cy-np">${navPay(i)}</span></button></li>`).join('');
const NB = [...nav.querySelectorAll('button')];
// положение в ленте числом: на экране i — ровно i, в переходе — между двумя экранами. Метка едет плавно
const NAVSEG = PROF.map((x, i) => { const h = SEG.find(z => z.hold === i); return { a: h.a, b: i < NP - 1 ? TR[i].b : h.b }; });
let navCur = -1;
function navDraw(f) {
  nav.style.opacity = f;
  const ph = phase(prog), cur = ph.hold != null ? ph.hold : ph.t < .5 ? ph.from : ph.to;
  NB.forEach((b, i) => {
    const p = Math.min(1, Math.max(0, (prog - NAVSEG[i].a) / (NAVSEG[i].b - NAVSEG[i].a))), now = (p > 0 && p < 1) || (i === 0 && p === 0) || (i === NP - 1 && p >= 1);
    b.style.setProperty('--p', p.toFixed(4)); b.style.setProperty('--cur', now ? 1 : 0);
    b.style.setProperty('--fc', now ? 'var(--acc)' : 'color-mix(in srgb, var(--fg) 70%, transparent)');
  });
  if (cur !== navCur) { navCur = cur; NB.forEach((b, i) => b.setAttribute('aria-current', String(i === cur))); }
}
// названия проявляются из символов, как экран телефона: буквы встают слева направо
const SCR = '░▒▓▪/\\|-+=*#';
function scramble(el, delay) {
  const t = el.dataset.t, n = t.length, t0 = performance.now() + delay;
  cancelAnimationFrame(el._raf);
  const step = now => {
    const k = Math.max(0, (now - t0) / 420);
    let out = '';
    for (let j = 0; j < n; j++) out += t[j] === ' ' || j < k * n * 1.15 - 2 ? t[j] : SCR[(j * 7 + Math.floor(now / 45)) % SCR.length];
    el.textContent = out;
    if (k < 1) el._raf = requestAnimationFrame(step); else el.textContent = t;
  };
  el._raf = requestAnimationFrame(step);
}
function navOpen(on) {
  if (nav.classList.contains('open') === on) return;
  nav.classList.toggle('open', on); clearTimeout(nav._rt);
  if (on) nav._rt = setTimeout(() => nav.classList.add('ready'), 450); else nav.classList.remove('ready');
  if (on && !matchMedia('(prefers-reduced-motion: reduce)').matches) nav.querySelectorAll('.cy-nm').forEach((el, i) => scramble(el, 60 + i * 35));
}
nav.addEventListener('mouseenter', () => navOpen(true));
const HL = nav.querySelector('.cy-hl');
nav.addEventListener('mousemove', e => {
  const y = e.clientY;
  NB.forEach(b => { const r = b.getBoundingClientRect(), d = Math.abs(y - (r.top + r.height / 2)); b.style.setProperty('--hv', Math.max(0, 1 - d / 75).toFixed(3)); });
  const b = e.target.closest('button');
  if (b) { HL.style.transform = `translateY(${b.parentElement.offsetTop}px)`; HL.classList.add('on'); }
});
nav.addEventListener('mouseleave', () => { navOpen(false); HL.classList.remove('on'); NB.forEach(b => b.style.setProperty('--hv', 0)); });
nav.addEventListener('focusin', e => { const b = e.target.closest('button'); if (b) { HL.style.transform = `translateY(${b.parentElement.offsetTop}px)`; HL.classList.add('on'); } });
nav.addEventListener('focusin', () => navOpen(true));
nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) navOpen(false); });
NB.forEach(b => b.addEventListener('click', () => goTo(+b.dataset.i)));


rab.addEventListener('scroll', () => { readScroll(); syncInk(); }, { passive: true });
addEventListener('resize', () => { layout(); readScroll(); });
const font = `500 ${12}px "JetBrains Mono"`;
Promise.all([document.fonts.load(font, 'AЖжё0'), document.fonts.load('640 40px "Science Gothic"', 'КОМ'), document.fonts.load('600 16px Montserrat', 'Жж'), document.fonts.load('800 40px Montserrat', '0123456789'), document.fonts.load('640 condensed 40px "Science Gothic"', 'КОМ')]).catch(() => {}).then(() => {
  layout(); readScroll(); prog = target; requestAnimationFrame(frame);
});
// клик по профессии на стене: страница сразу встаёт на эту профессию в ленте, телефон собирается из частиц.
// Возвращает false, если ленты нет (телефон) или профессии в ленте нет: тогда сайт открывает старую страницу вакансии
function openProf(id) {
  const i = PROF.findIndex(p => p.id === id);
  if (i < 0 || getComputedStyle(sec).display === 'none') return false;
  JUMP = null; if (FOC) { ST[FOC.i].foc = null; FOC = null; fi.blur(); }
  const top = sec.getBoundingClientRect().top - rab.getBoundingClientRect().top + rab.scrollTop, span = sec.offsetHeight - innerHeight;
  rab.scrollTo({ top: top + HOLD_P[i] * span, behavior: 'instant' });
  readScroll(); prog = target;
  SETS.en = enterSet(FRAMES[i], SETS.at[i], 90210 + i); entered = false; enter = 0; t0 = 0; dirty = true;
  return true;
}
document.getElementById('cy-panels').addEventListener('click', e => {
  const b = e.target.closest('[data-reply]'); if (!b) return;
  const i = +b.dataset.reply; if (holdNow() !== i) return;
  act(i, 'reply'); focusField(i, 'name');
});
window.__reel = { sync: syncInk, open: openProf };
// мир «Работа» мог открыться по адресу раньше, чем загрузилась лента: сразу ставим цвет шапки
window.__cy = { get prog() { return prog; }, set prog(v) { target = prog = v; dirty = true; }, skipEnter() { entered = true; enter = 1; dirty = true; }, V, ST, HITS, act, holdNow, HOLD_P, SEG, PALS, redraw() { dirty = true; } };
syncInk();
})();
