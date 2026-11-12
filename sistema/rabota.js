/* «Работа»: список профессий из данных сайта (data.json — те же вакансии и объекты, что в src/app.js; суммы и условия выдуманы).
   Поиск по словам и фишки сужают список. Профессия раскрывается: что делать, объекты с суммой за смену и условиями, отклик на объект. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => n ? String(n).replace(/\B(?=(\d{3})+$)/g, ' ') : '[Сумма]';
const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 > 1 && n % 10 < 5 && (n % 100 < 12 || n % 100 > 14) ? b : c;
const D = JSON.parse($('#vac-data').textContent), V = D.VAC, S = D.SITES;
const list = $('#vl'), q = $('#q'), count = $('#count'), F = new Set();
const range = v => { if (!v.sites) return v.pay || '[Зарплата]'; const a = v.sites.map(s => s[1]).filter(Boolean); return a.length ? money(Math.min(...a)) + ' – ' + money(Math.max(...a)) + ' ₽' : '[Сумма]'; };
const TAG = { noexp: 'Без опыта', train: 'С обучением', pair: 'Можно парой', sit: 'Сидячая' };

/* сводка под описанием: сколько объектов, сколько за смену, жильё — если на всех объектах бесплатно */
function sum(v) {
  if (!v.sites) return [v.place, v.sched].filter(Boolean).map(esc).join(' · ');
  const n = v.sites.length, free = v.sites.every(([k]) => /Бесплатно/.test(S[k].live[1]));
  return [`<b>${n}</b> ${plural(n, 'объект', 'объекта', 'объектов')}`, `<b>${esc(range(v))}</b> за смену`, free ? 'жильё <b>бесплатно</b>' : ''].filter(Boolean).join('<i>·</i>');
}
function row(v, i) {
  const n = v.sites ? v.sites.length : 0;
  /* табло объектов: строка — объект, столбцы — сумма за смену и условия; на узком экране подписи столбцов встают над значениями */
  const cell = (t, x) => `<span data-t="${t}">${esc(x[0])}<small>${esc(x[1] || '')}</small></span>`;
  const go = o => `<button type="button" class="lnk ob-go" data-v="${esc(v.title)}" data-o="${esc(o)}">Откликнуться <i>→</i></button>`;
  const objs = v.sites ? v.sites.map(([k, p]) => {
    const s = S[k];
    return `<div class="tb-r" role="row"><b role="cell">${esc(s.n)}</b><em role="cell" data-t="За смену">${p ? money(p) + ' ₽' : '[Сумма]'}</em>${cell('Жильё', s.live)}${cell('Питание', s.food)}${cell('Вахта', s.shift)}${cell('Выплаты', s.money)}${go(s.n)}</div>`;
  }).join('') : `<div class="tb-r" role="row"><b role="cell">${esc(v.place || '')}</b><em role="cell" data-t="Зарплата">${esc(v.pay || '[Зарплата]')}</em>${cell('График', [v.sched || '', ''])}<span></span><span></span><span></span>${go(v.place || '')}</div>`;
  const head = '<div class="tb-r tb-h" role="row"><span>Объект</span><span>За смену</span><span>Жильё</span><span>Питание</span><span>Вахта</span><span>Выплаты</span><span></span></div>';
  return `<li class="vr" data-id="${v.id}">
    <button type="button" class="vr-h" aria-expanded="false">
      <i class="vr-i">${String(i + 1).padStart(2, '0')}</i>
      <span class="vr-ph"><img src="assets/photo/${v.h}.webp" alt="" loading="lazy" style="object-position:${v.p || '50% 50%'}"></span>
      <span class="vr-t"><b class="dsp grow">${esc(v.title)}</b><em class="voice">${esc(v.who || '')}</em></span>
      <span class="vr-m"><b>${esc(range(v))}</b><small>${v.sites ? 'за смену · ' + n + ' ' + plural(n, 'объект', 'объекта', 'объектов') : esc(v.place || '')}</small></span>
      <span class="vr-x" aria-hidden="true">+</span>
    </button>
    <div class="vr-b" hidden>
      <div class="vr-top">
        <figure class="vr-big"><img src="assets/photo/${v.h}.webp" alt="${esc(v.title)}: фото работы" loading="lazy" style="--p:${v.p || '50% 50%'};--pm:${v.pm || v.p || '50% 50%'}"></figure>
        <div class="vr-d">
          <p class="lab"><b>${String(i + 1).padStart(2, '0')}</b>Что делать</p>
          <p class="voice">${esc(v.does || '')}</p>
          <ul class="vr-req">${(v.reqs || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
          <p class="vr-tags">${(v.tags || []).map(t => `<span>${TAG[t]}</span>`).join('')}</p>
          <p class="vr-sum">${sum(v)}</p>
        </div>
      </div>
      <div class="tb" role="table" aria-label="Объекты: ${esc(v.title)}">${head}${objs}</div>
    </div></li>`;
}
list.innerHTML = V.map(row).join('');

/* поиск: основы слов, как на сайте («рохл» находит «рохля») */
function filter() {
  const s = q.value.trim().toLowerCase(); let n = 0;
  $$('.vr', list).forEach((li, i) => {
    const v = V[i], hay = (v.title + ' ' + v.wall + ' ' + (v.words || '') + ' ' + (v.does || '')).toLowerCase();
    const ok = (!s || hay.includes(s) || (v.words || '').split(' ').some(w => w.length > 2 && s.includes(w))) && [...F].every(f => (v.tags || []).includes(f));
    li.hidden = !ok; if (ok) n++;
  });
  count.textContent = n ? n + ' ' + plural(n, 'профессия', 'профессии', 'профессий') : 'Нет такой профессии';
  $('#none').hidden = !!n;
}
q.addEventListener('input', filter);
$('#vf').addEventListener('change', () => { F.clear(); $$('#vf .chip[aria-pressed=true]').forEach(c => F.add(c.dataset.t)); filter(); });
filter();

/* раскрыть профессию; на компьютере остальные закрываются, чтобы список не уезжал */
list.addEventListener('click', e => {
  const h = e.target.closest('.vr-h');
  if (h) {
    const li = h.closest('.vr'), open = h.getAttribute('aria-expanded') !== 'true';
    $$('.vr-h[aria-expanded=true]', list).forEach(x => { if (x !== h) { x.setAttribute('aria-expanded', 'false'); x.nextElementSibling && (x.closest('.vr').querySelector('.vr-b').hidden = true); x.closest('.vr').classList.remove('open'); } });
    h.setAttribute('aria-expanded', open); li.querySelector('.vr-b').hidden = !open; li.classList.toggle('open', open);
    /* маленькое фото из строки вырастает в большое: большое стартует на месте маленького (сдвиг, масштаб, обрезка снизу до его высоты) */
    if (open && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
      const fig = li.querySelector('.vr-big'), a = li.querySelector('.vr-ph').getBoundingClientRect(), b = fig.getBoundingClientRect();
      if (a.width && b.width && fig.animate) {
        const s = a.width / b.width, cut = Math.max(0, b.height - a.height / s);
        fig.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${s})`, clipPath: `inset(0 0 ${cut}px 0)` }, { transform: 'none', clipPath: 'inset(0 0 0 0)' }],
          { duration: 700, easing: 'cubic-bezier(.2,.75,.2,1)' });
        li.querySelectorAll('.vr-d>*, .tb').forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 180 + k * 50, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
      }
    }
    if (open) setTimeout(() => { const r = li.getBoundingClientRect(); if (r.top < 70 || r.top > innerHeight * .45) scrollTo({ top: scrollY + r.top - 80, behavior: 'smooth' }); }, 60);
    return;
  }
  const go = e.target.closest('.ob-go');
  if (go) { $('#f-who').value = go.dataset.v + ' — ' + go.dataset.o; GTSYS.talk(); }
});
/* из первого экрана: фишка или поиск сразу ведут в список */
$$('[data-to-list]').forEach(b => b.addEventListener('click', () => document.getElementById('r-vakansii').scrollIntoView({ behavior: 'smooth' })));
})();
