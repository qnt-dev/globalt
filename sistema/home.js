/* СКОПИРОВАНО из src/app.js скриптом tools/extract.py; хвост «Макет» — свой */
(() => {
'use strict';
/* ширина Земли — ширина её холста: documentElement.clientWidth на главной без полосы даёт полную ширину, хотя место под полосу оставлено */
const CW = () => { const c = document.getElementById('gl'); return (c && c.clientWidth) || document.documentElement.clientWidth || window.innerWidth; };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const STAR = '<svg class="st" viewBox="-1 -1 2 2" aria-hidden="true"><path d="M0-1Q.06-.06 1 0 .06.06 0 1-.06.06-1 0-.06-.06 0-1Z"/></svg>';
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = t => 1 - Math.pow(1 - t, 3);
let world = 'home';

/* ---------- WebGL ---------- */
const VS = `#version 300 es
in vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const COMMON = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float MA;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+7.1;a*=.5;}return v;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
`;
const FS_RADIO = COMMON + `
uniform float Q;uniform vec3 C;
void main(){
  float mn=min(R.x,R.y);vec2 uv=gl_FragCoord.xy/R;
  float t=mod(floor(T*24.),64.);
  vec2 cell=floor(gl_FragCoord.xy/max(1.,mn/480.));
  float s=hash(cell+t*vec2(3.1,1.7));
  float band=smoothstep(.0,.12,sin(uv.y*7.-T*2.3))*.22+smoothstep(.97,1.,sin(uv.y*90.+T*30.))*.3;
  vec3 stat=vec3(s*.62+band*.55+.06);
  vec3 c=mix(stat,C,smoothstep(.0,1.,Q));
  c=mix(c,stat,(1.-Q)*.85);
  o=vec4(c,1.);
}`;
/* Главная: Земля по картам NASA Earth Observatory (день, облака, ночные огни). Свет слева сверху. GV — поворот Земли: долгота и широта середины диска, наклон. Z — размер Земли, CY — высота её середины */
const FS_HOME = COMMON + `
uniform sampler2D DAY,NIGHT,CLOUD;uniform vec3 GV;uniform float Z,CY;
const vec3 ATM=vec3(.36,.62,1.);
vec3 C,L;mat3 WV;float CR;
mat3 vw(float lo,float la,float rl){float cy=cos(lo),sy=sin(lo),cx=cos(la),sx=sin(la),cz=cos(rl),sz=sin(rl);
  return mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)*mat3(1.,0.,0.,0.,cx,-sx,0.,sx,cx)*mat3(cz,-sz,0.,sz,cz,0.,0.,0.,1.);}
vec3 earth(vec2 p,float px,out float cov){
  vec2 q=(p-C.xy)/C.z;float r=length(q),aa=px/C.z;
  vec2 sd=normalize(L.xy+1e-4);float lit=dot(q/max(r,1e-4),sd),side=smoothstep(-.6,.8,lit)*.85+.15;
  /* воздух над краем: тонкий яркий слой и долгое слабое свечение, со стороны солнца ярче */
  float h=max(r-1.,0.)*C.z;
  vec3 c=ATM*(exp(-h/.006)*.75+exp(-h/.028)*.24+exp(-h/.11)*.05)*side;
  cov=smoothstep(1.+aa,1.-aa,r);
  /* координаты карты и их шаг между соседними пикселями считаются до ветвления. На стыке карты шаг берётся с другой стороны стыка, иначе там чёрная пунктирная линия */
  float z=sqrt(max(1.-r*r,0.));vec3 n=vec3(q,z);vec3 g=WV*n;
  float lat=asin(clamp(g.y,-1.,1.)),lon=atan(g.x,g.z);vec2 uv=vec2(lon/6.2831853+.5,.5-lat/3.1415927),uw=vec2(fract(uv.x+.5),uv.y);
  vec2 gx=dFdx(uv),gy=dFdy(uv),wx=dFdx(uw),wy=dFdy(uw);if(abs(wx.x)+abs(wy.x)<abs(gx.x)+abs(gy.x)){gx=wx;gy=wy;}
  if(cov>0.){
    vec3 day=pow(textureGrad(DAY,uv,gx,gy).rgb,vec3(2.2));
    vec2 cu=uv+vec2(CR,0.);float cl=smoothstep(.2,.8,textureGrad(CLOUD,cu,gx,gy).r);
    float csh=smoothstep(.2,.8,textureGrad(CLOUD,cu+vec2(.002,-.0015),gx,gy).r);
    float ndl=dot(n,L),lam=smoothstep(-.12,.5,ndl)*max(ndl+.12,0.)/1.12;
    float oc=smoothstep(.0,.05,day.b-max(day.r,day.g)*.9);
    vec3 surf=mix(day*(1.-.4*csh*(1.-cl)),vec3(.95),cl*.9);
    vec3 e=surf*lam*1.2+surf*.01;
    /* блик солнца на море и огни городов на ночной стороне */
    vec3 hv=normalize(L+vec3(0,0,1));e+=vec3(1.,.95,.85)*pow(max(dot(n,hv),0.),60.)*oc*(1.-cl)*.5*step(0.,ndl);
    float nl=textureGrad(NIGHT,uv,gx,gy).r;e+=vec3(1.,.78,.5)*pow(nl,1.4)*1.1*smoothstep(.08,-.2,ndl)*(1.-cl*.8);
    /* дымка у края: чем ближе к горизонту, тем больше воздуха между нами и землёй */
    float dl=(1.-r)*C.z;float hz=exp(-dl/.035)*.85+exp(-dl/.16)*.25;
    e=mix(e,ATM*(.35+.9*smoothstep(-.3,.5,ndl)),clamp(hz,0.,1.)*smoothstep(-.4,.3,ndl+.2));
    c=mix(c,e,cov);
  }
  return c;
}
float gn(vec2 c,float t){uvec2 u=uvec2(c)+uint(t)*uvec2(7919u,104729u);u*=uvec2(1597334677u,3812015801u);uint h=(u.x^u.y)*1597334677u;return float(h)/4294967295.;}
void main(){
  float mn=min(R.x,R.y);vec2 p=(gl_FragCoord.xy-.5*R)/mn;float px=1.3/mn;
  C=vec3(0.,CY,.5*Z);L=normalize(vec3(-.6,.45,.66));WV=vw(radians(GV.x),radians(GV.y),GV.z);CR=-T*.0006;
  float cov;vec3 e=pow(max(earth(p,px,cov),0.),vec3(1./2.2));
  /* диск приглушён, воздух у края ярче. Буквы разделов осветляют диск под собой и становятся окнами в Землю.
     Диск .36 (вариант C, было .24). Запасной вариант B — .30: над облаками в выбранном слове меньше белых пятен */
  vec3 c=e*mix(.55,.36,cov)+.004;
  c+=(gn(gl_FragCoord.xy,floor(T*14.)+5.)-.5)*.012;
  o=vec4(c,1.);
}`;
const cv = $('#gl');
let gl = null;
try { gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
if (!gl) document.body.classList.add('nogl');
const P = {};
function prog(name, fs) {
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(name, gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(name, gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); const nm = a.name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, a.name); }
  P[name] = { p, u };
}
let scale = Math.min(devicePixelRatio || 1, 1.5), slow = 0;
function resize() {
  const w = Math.max(1, Math.round(CW() * scale)), h = Math.max(1, Math.round(innerHeight * scale));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (gl) gl.viewport(0, 0, w, h);
  dirty = true;
}
let dirty = true;
/* карты Земли лежат на блоках текстур 5–7: блок 1 занимает «Сайт», блок 4 — переход «Распад» */
const EARTH = [];
let earthReady = 0;
if (gl) {
  
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  /* карты Земли грузит EV.EarthGL */
}
addEventListener('resize', resize);

/* ---------- ГЛАВНАЯ: Земля ведёт в разделы ---------- */
/* У каждого раздела своё место на Земле, и Земля поворачивается к нему: Работа — Казахстан и Урал, где объекты вахты, Люди — Москва и Европа,
   Клиенты — Индия, Китай и Восточная Азия. c — цвет кнопки «Перейти»: оранжевые огни, белые облака, голубой воздух */
const HUB = [
  { w: 'rabota', n: 'Работа', s: 'Вакансии и помощь с трудоустройством', v: [66, 36, -.2], c: '#ff5c0a' },
  { w: 'lyudi', n: 'Люди', s: 'Подбор персонала для вашей компании', v: [37, 48, -.2], c: '#fff' },
  { w: 'klienty', n: 'Клиенты', s: 'Сайты, реклама, SMM, брендбук и логотип', v: [100, 28, -.2], c: '#8ec3ff' }
];
/* k — выбранный раздел (-1: не выбран, Земля медленно вращается), v — поворот Земли, vel — инерция после вращения рукой, lat — широта, к которой Земля возвращается, dv — доля перехода «Распад» */
const S = { k: -1, v: [40, 30, -.2], vel: 0, lat: 30, drag: 0, dv: 0 };
/* размер Земли и высота её середины в долях меньшей стороны экрана. Стоя Земля во всю ширину и выше середины: слова встают на неё столбиком */
const earthZ = () => CW() > innerHeight ? 1.08 : .96, earthY = () => CW() > innerHeight ? .08 : .17;
const home = $('#home'), hub = $('#hub'), cis = $('#cis'), tabs = $$('#hub .hub-t button'), hubS = $('#hub .hub-s'), hubGo = $('#hub .hub-go');
function updateHome(dt) {
  const k = 1 - Math.exp(-dt * 2.4);
  if (S.k < 0) { if (!S.drag) { S.v[0] += dt * (3 + S.vel); S.vel *= Math.exp(-dt * 2.2); S.v[1] += (S.lat - S.v[1]) * k; } }
  else { const t = HUB[S.k].v; S.v[0] += (((t[0] - S.v[0]) % 360 + 540) % 360 - 180) * k; S.v[1] += (t[1] - S.v[1]) * k; }
}
function drawHome(time) {
  if (!gl) return;
  /* пока идёт «Распад», кадр Земли рисуется в память, а на экран его выводит распад */
  const D = S.dv > 0 ? dustTex() : null;
  if (D) { gl.bindFramebuffer(gl.FRAMEBUFFER, D.f); gl.viewport(0, 0, D.w, D.h); }
  homeDraw(time);
  if (D) dustDraw(D);
}
/* выбранное слово вырастает из мелкой сетки точек, как печатный растр */
const dotsIn = i => { tabs.forEach(x => x.classList.remove('play')); if (RM) return; void tabs[i].offsetWidth; tabs[i].classList.add('play'); };
/* кнопка «Перейти» белая, как раньше: главная держит один строгий характер на каждом шаге. Белое ложится мелкими плитками слева направо, когда кнопка появляется.
   Снаружи — рамка HUD по образцу: линия со срезами, белые треугольники в левом верхнем и правом нижнем углах, светлые отрезки крест-накрест:
   сверху у левого угла, снизу у правого. Рамку рисует SVG по размеру кнопки (на 7 пикселей шире с каждой стороны); при появлении линия прорисовывается.
   Знак раздела — чёрный на белом, его квадрат отделён от кнопки прозрачным прорезом в 3 пикселя: белое тело кнопки — маска (--bm) */
const tiles = document.createElement('span'); tiles.className = 'tiles'; tiles.setAttribute('aria-hidden', 'true'); hubGo.prepend(tiles);
const SVGN = 'http://www.w3.org/2000/svg', hf = document.createElementNS(SVGN, 'svg');
hf.setAttribute('class', 'hf'); hf.setAttribute('aria-hidden', 'true'); hubGo.prepend(hf);
function hubFrame() {
  const W = hubGo.offsetWidth + 14, H = hubGo.offsetHeight + 14;
  if (W <= 14 || H <= 14) return;
  const t = 14, q = .75, L = Math.round(W * .3);
  hf.setAttribute('viewBox', `0 0 ${W} ${H}`);
  hf.innerHTML = `<path class="o" d="M${t} ${q}H${W - q}V${H - t}L${W - t} ${H - q}H${q}V${t}Z"/>` +
    `<path class="t t1" d="M0 0H${t}L0 ${t}Z"/><path class="t t2" d="M${W} ${H}H${W - t}L${W} ${H - t}Z"/>` +
    `<path class="a a1" d="M${t + 6} ${q}H${t + 6 + L}"/><path class="a a2" d="M${W - t - 6} ${H - q}H${W - t - 6 - L}"/>`;
  hf.style.setProperty('--p', (2 * (W + H) - (4 - 2 * Math.SQRT2) * t).toFixed(1));
  /* белое тело: срезы в левом верхнем и правом нижнем углах, вокруг квадрата знака прорез g. Квадрат и прорез со срезами справа сверху и слева снизу */
  const w = W - 14, h = H - 14, gs = hubGo.querySelector('.go-s'), x = gs.offsetLeft, y = gs.offsetTop, S = gs.offsetWidth, c = 6, g = 3, C = c + g * (2 - Math.SQRT2);
  const sq = (x, y, s, k) => `M${x} ${y}H${x + s - k}L${x + s} ${y + k}V${y + s}H${x + k}L${x} ${y + s - k}Z`;
  const m = `<svg xmlns="${SVGN}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path fill="#fff" fill-rule="evenodd" d="M7 0H${w}V${h - 7}L${w - 7} ${h}H0V7Z${sq(x - g, y - g, S + 2 * g, C)}${sq(x, y, S, c)}"/></svg>`;
  hubGo.style.setProperty('--bm', `url("data:image/svg+xml,${encodeURIComponent(m)}")`);
}
function paint() {
  const c = '#fff'; clearTimeout(hubGo._t); hubFrame();
  if (hubGo.classList.contains('off')) hubGo.style.setProperty('--c0', 'transparent');
  if (RM) { hubGo.style.setProperty('--c0', c); return; }
  hf.classList.remove('draw'); hubGo.classList.remove('draw'); void hubGo.offsetWidth; hf.classList.add('draw'); hubGo.classList.add('draw');
  const r = hubGo.getBoundingClientRect(), cw = 12, ch = 13, nx = Math.ceil(r.width / cw), ny = Math.ceil(r.height / ch); let h = '';
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) h += `<i style="left:${x * cw}px;top:${y * ch}px;animation-delay:${Math.round(x * 22 + Math.random() * 70)}ms"></i>`;
  tiles.style.setProperty('--cn', c); tiles.innerHTML = h;
  hubGo._t = setTimeout(() => { hubGo.style.setProperty('--c0', c); tiles.innerHTML = ''; }, nx * 22 + 70 + 260);
}
if (window.ResizeObserver) new ResizeObserver(hubFrame).observe(hubGo);
function hubSay(t) { hubS.style.opacity = 0; setTimeout(() => { hubS.textContent = t; hubS.style.opacity = ''; }, RM ? 0 : 180); }
function pick(k) {
  k = clamp(k, 0, 2); clearTimeout(hub._off); if (S.k === k) return; S.k = k; S.lat = 30; S.vel = 0;
  tabs.forEach((b, i) => { b.classList.toggle('on', i === k); b.setAttribute('aria-selected', i === k); });
  dotsIn(k); hubSay(HUB[k].s); paint(k); hubGo.dataset.go = HUB[k].w; hubGo.href = '#' + HUB[k].w; hubGo.classList.remove('off'); dirty = true;
}
/* человек увёл указатель и ещё не решил: выбор снимается, Земля снова вращается с того же места */
function unpick() { S.k = -1; tabs.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-selected', false); }); hubSay('Что вы ищете?'); hubGo.classList.add('off'); }
hub.addEventListener('pointerleave', e => { if (e.pointerType === 'touch') return; clearTimeout(hub._off); hub._off = setTimeout(unpick, 1000); });
hub.addEventListener('pointerenter', () => clearTimeout(hub._off));
tabs.forEach((b, i) => {
  b.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') pick(i); }); b.addEventListener('focus', () => { if (b.matches(':focus-visible')) pick(i); });
  /* на телефоне первое касание выбирает раздел, второе ведёт в него */
  b.addEventListener('click', () => { if (S.k === i) go(HUB[i].w); else pick(i); });
});
/* Землю можно крутить мышью или пальцем: тянете — она поворачивается за рукой, отпустили — ещё немного крутится и идёт своим ходом */
let drag = null;
home.addEventListener('pointerdown', e => {
  if (world !== 'home' || e.target.closest('#hub,a,button')) return;
  if (S.k >= 0) unpick(); drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, vel: 0 }; S.drag = 1; S.vel = 0;
  try { home.setPointerCapture(e.pointerId); } catch (x) {} home.classList.add('drag');
});
home.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return; const now = performance.now(), m = Math.min(CW(), innerHeight), dx = (e.clientX - drag.x) / m, dy = (e.clientY - drag.y) / m, K = 105;
  S.v[0] -= dx * K; S.v[1] = clamp(S.v[1] + dy * K, -20, 70); dirty = true;
  const dt = Math.max(.008, (now - drag.t) / 1000); drag.vel = drag.vel * .6 + (-dx * K / dt) * .4; drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
});
const drop = e => { if (!drag || (e && e.pointerId !== drag.id)) return; S.vel = performance.now() - drag.t < 90 ? clamp(drag.vel, -120, 120) : 0; S.lat = S.v[1]; S.drag = 0; drag = null; home.classList.remove('drag'); };
home.addEventListener('pointerup', drop); home.addEventListener('pointercancel', drop); home.addEventListener('lostpointercapture', drop);
/* бегущая строка: названия идут по дуге снаружи Земли, по воздуху вдоль её нижнего края, у середины они светлее, к краям гаснут */
const cisArc = $('#cis path'), cisTp = $('#cis textPath'), cisG = $('#cis linearGradient');
cisTp.textContent = (cisTp.textContent + ' ').repeat(4); let cisUnit = 0;
function cisLay() {
  const m = Math.min(CW(), innerHeight), R = .5 * earthZ() * m, cx = CW() / 2, cy = innerHeight / 2 - earthY() * m, r = R + clamp(R * .05, 14, 26), a0 = Math.PI * .22;
  cis.setAttribute('viewBox', `0 0 ${CW()} ${innerHeight}`);
  const x0 = cx - r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a0);
  cisArc.setAttribute('d', `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${x1.toFixed(1)} ${y0.toFixed(1)}`);
  cisG.setAttribute('x1', x0); cisG.setAttribute('x2', x1);
  $('#cis text').style.fontSize = clamp(R * .03, 11, 15) + 'px';
  cisUnit = cisTp.getComputedTextLength() / 4;
}
document.fonts.ready.then(cisLay); addEventListener('resize', cisLay);
const cisRun = now => { if (world === 'home' && cisUnit) cisTp.setAttribute('startOffset', (-((now * .028) % cisUnit)).toFixed(1)); requestAnimationFrame(cisRun); };
if (!RM) requestAnimationFrame(cisRun);
/* колесо и стрелки листают разделы */
let hubAcc = 0, hubLock = 0;
home.addEventListener('wheel', e => { if (world !== 'home') return; e.preventDefault(); const now = performance.now(); if (now < hubLock) return; hubAcc += e.deltaY; if (Math.abs(hubAcc) > 40) { pick(S.k < 0 ? 0 : S.k + Math.sign(hubAcc)); hubAcc = 0; hubLock = now + 650; } }, { passive: false });
addEventListener('keydown', e => {
  if (world === 'home') { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') pick(S.k + 1); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') pick(S.k < 0 ? 0 : S.k - 1); }
});

/* ---------- Переход «Распад» (по образцу motionin.design/gallery/cipher) ----------
   Земля распадается на квадратики своих цветов, граница идёт справа налево, квадратики уносит вправо, как пыль. Раздел собирается из квадратиков.
   Обратно — тем же путём назад. Между разделами текущий рассыпается в квадратики, новый собирается из них */
let DT = null;
function dustTex() {
  const w = cv.width, h = cv.height; if (DT && DT.w === w && DT.h === h) return DT;
  if (DT) { gl.deleteTexture(DT.t); gl.deleteFramebuffer(DT.f); }
  gl.activeTexture(gl.TEXTURE4); const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE0); DT = { t, f, w, h }; return DT;
}
/* когда квадратик отрывается: граница идёт справа налево с рваным краем. 0 и меньше — ещё на месте, дальше — возраст полёта */
const DUSTF = `
float hs(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}
float rel(vec2 cell){vec2 cc=(cell+.5)*CS;float n=hs(cell),n2=hs(cell+17.3),xf=R.x*(.92-1.25*K);
  return (cc.x-xf+(n-.5)*R.x*.1+sin(cc.y/R.y*9.+n2*.8)*R.x*.035)/(R.x*.4);}`;
let DP = null;
if (gl) {
  /* фон: где квадратик ещё на месте — сама Земля во всю резкость, где оторвался — пустой космос */
  prog('dustbg', `#version 300 es
precision highp float;uniform sampler2D S0;uniform vec2 R;uniform float K,CS;out vec4 o;${DUSTF}
void main(){vec2 fc=gl_FragCoord.xy;float a=rel(floor(fc/CS));o=vec4(a>0.?vec3(0.):texture(S0,fc/R).rgb,1.);}`);
  /* частицы: по одной на квадратик. Цвет — цвет Земли в этом месте, полёт вправо с лёгким вихрем, к концу частица мельче и гаснет */
  const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error('dust', gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, `#version 300 es
precision highp float;uniform sampler2D S0;uniform vec2 R;uniform float K,CS;uniform int NX;out vec4 vc;${DUSTF}
void main(){int id=gl_VertexID;vec2 cell=vec2(float(id%NX),float(id/NX)),cc=(cell+.5)*CS;float a=rel(cell);
  vec3 c=textureLod(S0,cc/R,log2(CS)).rgb;float L=dot(c,vec3(.3,.59,.11));
  if(a<=0.||a>=1.||L<.012){gl_Position=vec4(2.,2.,0.,1.);gl_PointSize=0.;vc=vec4(0.);return;}
  float n=hs(cell+3.1),n2=hs(cell+9.7),e=pow(a,1.45);
  vec2 off=vec2(1.,(n2-.5)*.5+.1)*e*R.x*.34+vec2(sin(a*7.+n*9.),cos(a*5.+n2*7.))*a*R.y*.035;
  gl_Position=vec4((cc+off)/R*2.-1.,0.,1.);gl_PointSize=max(1.,CS*(1.-.6*a)*(.7+.5*n));
  float al=1.-smoothstep(.5,1.,a);vc=vec4(min(c*2.2+.02,vec3(1.))*al,al);}`));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;in vec4 vc;out vec4 o;void main(){o=vc;}'));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error('dust', gl.getProgramInfoLog(p));
  DP = { p, vao: gl.createVertexArray(), u: n => gl.getUniformLocation(p, n) };
}
function dustDraw(D) {
  const W = cv.width, H = cv.height, CS = Math.max(3, Math.round(4 * W / CW())), NX = Math.ceil(W / CS), NY = Math.ceil(H / CS);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, D.t); gl.generateMipmap(gl.TEXTURE_2D);
  const bg = P.dustbg; gl.useProgram(bg.p); gl.uniform1i(bg.u.S0, 4); gl.uniform2f(bg.u.R, W, H); gl.uniform1f(bg.u.K, S.dv); gl.uniform1f(bg.u.CS, CS); gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(DP.p); gl.uniform1i(DP.u('S0'), 4); gl.uniform2f(DP.u('R'), W, H); gl.uniform1f(DP.u('K'), S.dv); gl.uniform1f(DP.u('CS'), CS); gl.uniform1i(DP.u('NX'), NX);
  gl.bindVertexArray(DP.vao); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.POINTS, 0, NX * NY); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
}
/* завеса из квадратиков поверх раздела: раздел собирается из них и рассыпается в них. q=0 — всё закрыто, q=1 — всё открыто */
const veil = $('#veil'), vx = veil.getContext('2d'), VB = 6; let VR = null;
function veilDraw(q) {
  const d = Math.min(devicePixelRatio || 1, 1.5), w = CW(), h = innerHeight, nx = Math.ceil(w / VB), ny = Math.ceil(h / VB);
  if (veil.width !== Math.round(w * d) || veil.height !== Math.round(h * d)) { veil.width = Math.round(w * d); veil.height = Math.round(h * d); }
  if (!VR || VR.n !== nx * ny) { VR = new Float32Array(nx * ny); VR.n = nx * ny; for (let k = 0; k < VR.length; k++) VR[k] = Math.random(); }
  vx.setTransform(d, 0, 0, d, 0, 0); vx.clearRect(0, 0, w, h); vx.fillStyle = '#000'; vx.beginPath();
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { const v = (x / nx) * .72 + VR[y * nx + x] * .28; if (1 - v > q * 1.02) vx.rect(x * VB, y * VB, VB, VB); }
  vx.fill();
}
function veilRun(q0, q1, D, done) { veil.style.display = 'block'; const t0 = performance.now(); const st = now => { const k = clamp((now - t0) / D); veilDraw(q0 + (q1 - q0) * sstep(0, 1, k)); if (k < 1) requestAnimationFrame(st); else done(); }; requestAnimationFrame(st); }
const hubFade = o => { hub.style.opacity = cis.style.opacity = o; };
/* в раздел: Земля распадается, раздел собирается из квадратиков */
function dustDive(w, done) {
  const t0 = performance.now(), D = 1500;
  const st = now => {
    const k = clamp((now - t0) / D); S.dv = Math.max(k, 1e-4); dirty = true; hubFade(1 - sstep(0, .18, k));
    /* последние пылинки уже почти погасли: раздел начинает собираться, не дожидаясь пустого экрана */
    if (k < .88) { requestAnimationFrame(st); return; }
    veilDraw(0); veil.style.display = 'block'; show(w); S.dv = 0; hubFade('');
    veilRun(0, 1, 760, () => { veil.style.display = 'none'; done(); });
  };
  requestAnimationFrame(st);
}
/* на главную: раздел рассыпается в квадратики, частицы летят назад и собирают Землю, слово раздела проступает точками */
function dustRise(from, done) {
  const i = HUB.findIndex(h => h.w === from);
  veilRun(1, 0, 620, () => {
    if (i >= 0) { S.k = i; S.v = HUB[i].v.slice(); }
    S.dv = 1; hubFade(0); show('home'); requestAnimationFrame(() => { veil.style.display = 'none'; });
    const t0 = performance.now(), D = 1500; let shown = false;
    const st = now => {
      const k = 1 - clamp((now - t0) / D); S.dv = Math.max(k, 1e-4); dirty = true; hubFade(1 - sstep(0, .2, k));
      if (!shown && k < .2) { shown = true; if (i >= 0) { S.k = -1; pick(i); } }
      if (k > 0) { requestAnimationFrame(st); return; }
      S.dv = 0; hubFade(''); done();
    };
    requestAnimationFrame(st);
  });
}
function dustSwap(w, done) { veilRun(1, 0, 560, () => { show(w); requestAnimationFrame(() => veilRun(0, 1, 700, () => { veil.style.display = 'none'; done(); })); }); }

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
  else if (view === 'home') { const v = EV.homeView(S.v, CW(), innerHeight); rec(v); EG.use(null); EG.draw(v, time, cv.width, cv.height); }
  else {
    /* раздел: Земля на первом экране; страница листается — Земля уходит вверх вместе с ним, ниже первого экрана чёрное */
    const r = heroOf(view).getBoundingClientRect(), k = cv.height / innerHeight, mn = Math.min(CW(), innerHeight);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (r.bottom > 0) {
      /* дуга стоит у низа окна, как в конце полёта, и уходит вверх ровно на прокрутку (а не к низу первого экрана: на низком телефоне
         первый экран выше окна, и дуга после посадки сдвинулась бы) */
      const v = EV.secView(view, V.lon, CW(), innerHeight); v.dm = dmv; v.cy += scrollY / mn; rec(v);
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
  const d = V.drag; if (!d) return; const now = performance.now(), dx = -(e.clientX - d.x) / Math.min(CW(), innerHeight) * 40;
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
  const W = CW(), H = innerHeight, from0 = view;
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

})();
