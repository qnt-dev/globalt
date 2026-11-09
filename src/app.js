(() => {
'use strict';
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
  const w = Math.max(1, Math.round(innerWidth * scale)), h = Math.max(1, Math.round(innerHeight * scale));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (gl) gl.viewport(0, 0, w, h);
  dirty = true;
}
let dirty = true;
/* карты Земли лежат на блоках текстур 5–7: блок 1 занимает «Сайт», блок 4 — переход «Распад» */
const EARTH = [];
let earthReady = 0;
if (gl) {
  prog('home', FS_HOME); prog('radio', FS_RADIO);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  ['assets/earth/day.webp', 'assets/earth/night.webp', 'assets/earth/clouds.webp'].forEach((url, i) => {
    const t = gl.createTexture(), e = new Image(); EARTH.push(t);
    e.onload = () => {
      gl.activeTexture(gl.TEXTURE5 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, e); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE0); earthReady++; dirty = true;
    };
    e.src = url;
  });
  const { p, u } = P.home; gl.useProgram(p); gl.uniform1i(u.DAY, 5); gl.uniform1i(u.NIGHT, 6); gl.uniform1i(u.CLOUD, 7);
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
const earthZ = () => innerWidth > innerHeight ? 1.08 : .96, earthY = () => innerWidth > innerHeight ? .08 : .17;
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
  const { p, u } = P.home; gl.useProgram(p);
  EARTH.forEach((t, i) => { gl.activeTexture(gl.TEXTURE5 + i); gl.bindTexture(gl.TEXTURE_2D, t); }); gl.activeTexture(gl.TEXTURE0);
  gl.uniform2f(u.R, cv.width, cv.height); gl.uniform1f(u.T, time); gl.uniform3f(u.GV, S.v[0], S.v[1], S.v[2]); gl.uniform1f(u.Z, earthZ()); gl.uniform1f(u.CY, earthY());
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if (D) dustDraw(D);
}
/* выбранное слово вырастает из мелкой сетки точек, как печатный растр */
const dotsIn = i => { tabs.forEach(x => x.classList.remove('play')); if (RM) return; void tabs[i].offsetWidth; tabs[i].classList.add('play'); };
/* кнопка берёт цвет раздела: новый цвет ложится мелкими плитками, как пазл, слева направо */
const tiles = document.createElement('span'); tiles.className = 'tiles'; tiles.setAttribute('aria-hidden', 'true'); hubGo.prepend(tiles);
function paint(k) {
  const c = HUB[k].c; clearTimeout(hubGo._t);
  if (hubGo.classList.contains('off')) hubGo.style.setProperty('--c0', 'transparent');
  if (RM) { hubGo.style.setProperty('--c0', c); return; }
  const r = hubGo.getBoundingClientRect(), cw = 12, ch = 13, nx = Math.ceil(r.width / cw), ny = Math.ceil(r.height / ch); let h = '';
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) h += `<i style="left:${x * cw}px;top:${y * ch}px;animation-delay:${Math.round(x * 22 + Math.random() * 70)}ms"></i>`;
  tiles.style.setProperty('--cn', c); tiles.innerHTML = h;
  hubGo._t = setTimeout(() => { hubGo.style.setProperty('--c0', c); tiles.innerHTML = ''; }, nx * 22 + 70 + 260);
}
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
  if (!drag || e.pointerId !== drag.id) return; const now = performance.now(), m = Math.min(innerWidth, innerHeight), dx = (e.clientX - drag.x) / m, dy = (e.clientY - drag.y) / m, K = 105;
  S.v[0] -= dx * K; S.v[1] = clamp(S.v[1] + dy * K, -20, 70); dirty = true;
  const dt = Math.max(.008, (now - drag.t) / 1000); drag.vel = drag.vel * .6 + (-dx * K / dt) * .4; drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
});
const drop = e => { if (!drag || (e && e.pointerId !== drag.id)) return; S.vel = performance.now() - drag.t < 90 ? clamp(drag.vel, -120, 120) : 0; S.lat = S.v[1]; S.drag = 0; drag = null; home.classList.remove('drag'); };
home.addEventListener('pointerup', drop); home.addEventListener('pointercancel', drop); home.addEventListener('lostpointercapture', drop);
/* бегущая строка: названия идут по дуге снаружи Земли, по воздуху вдоль её нижнего края, у середины они светлее, к краям гаснут */
const cisArc = $('#cis path'), cisTp = $('#cis textPath'), cisG = $('#cis linearGradient');
cisTp.textContent = (cisTp.textContent + ' ').repeat(4); let cisUnit = 0;
function cisLay() {
  const m = Math.min(innerWidth, innerHeight), R = .5 * earthZ() * m, cx = innerWidth / 2, cy = innerHeight / 2 - earthY() * m, r = R + clamp(R * .05, 14, 26), a0 = Math.PI * .22;
  cis.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
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
  if (e.key === 'Escape' && world === 'rabota' && vacCur && !talk.open) vacClose();
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
  const W = cv.width, H = cv.height, CS = Math.max(3, Math.round(4 * W / innerWidth)), NX = Math.ceil(W / CS), NY = Math.ceil(H / CS);
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
  const d = Math.min(devicePixelRatio || 1, 1.5), w = innerWidth, h = innerHeight, nx = Math.ceil(w / VB), ny = Math.ceil(h / VB);
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

/* ---------- Миры ---------- */
const WC = { home: '#000', rabota: '#f6f8fb', lyudi: '#fff', klienty: '#6f6f6f' };
let busy = false;
function show(w) {
  $$('.world').forEach(s => { s.hidden = s.id !== w; });
  world = w; document.body.dataset.w = w; document.body.classList.remove('ink', 'barhide'); document.body.classList.toggle('ink', w === 'lyudi'); document.body.style.background = WC[w];
  /* на главной слой Земли лежит внутри неё: так буквы разделов смешиваются с Землёй. В других мирах он возвращается на место */
  if (w === 'home') { if (cv.parentNode !== home) home.prepend(cv); } else if (cv.parentNode === home) document.body.insertBefore(cv, home);
  /* скрытая главная не даёт измерить строку компаний: длина выходит 0, и строка стоит. Поэтому меряем её каждый раз, когда главная открывается */
  if (w === 'home') cisLay();
  cv.style.display = gl && (w === 'home' || w === 'klienty') ? 'block' : 'none';
  $$('#nav a').forEach(a => { if (a.dataset.go === w) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  try { history.replaceState(null, '', w === 'home' ? '#top' : '#' + w); } catch (e) {}
  if (w === 'rabota') enterWork(); if (w === 'lyudi') enterPeople(); if (w === 'klienty') enterAir();
  /* «Работа» в палитре «Бумага»: цвет шапки зависит от того, что под ней (стена, фото вакансии, экран ленты) */
  if (window.__reel) window.__reel.sync();
  if (air.snd && w !== 'klienty') air.snd.ng.gain.setTargetAtTime(0, air.snd.ctx.currentTime, .1);
  dirty = true;
}
function go(w) {
  if (busy) return; if (w === world) { if (w === 'rabota') { if (vacCur) vacClose(); } if (w === 'lyudi') ly.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
  if (RM) { show(w); return; }
  busy = true; const done = () => { busy = false; };
  if (world === 'home') { if (gl) dustDive(w, done); else { show(w); done(); } }
  else if (w === 'home') { if (gl) dustRise(world, done); else { show('home'); done(); } }
  else dustSwap(w, done);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); go(a.dataset.go); return; }
});
$('#logo').addEventListener('click', e => { e.preventDefault(); go('home'); });

/* ---------- МИР 1: «Вас ищут». Стена профессий служит поиском. Профессия ведёт на табло объектов, объект на условия и отклик ---------- */
const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* примеры: объекты, суммы и условия выдуманы. Значения в скобках заполнит компания */
const ROAD = ['[Билет]', '[Оплачивает компания или нет.]'];
const SITES = [
  { n: 'Маркетплейс', live: ['Хостел', '4 человека в комнате. Бесплатно.'], food: ['Обед', 'На объекте.'], shift: ['30 смен', 'По 12 часов.'], money: ['Раз в неделю', 'Аванс.'] },
  { n: 'Распределительный центр', live: ['Общежитие', '6 человек в комнате. Бесплатно.'], food: ['2 раза в день', 'На объекте.'], shift: ['45 смен', 'По 12 часов.'], money: ['Раз в неделю', 'Аванс.'] },
  { n: 'Склад электроники', live: ['Квартира', 'На 4 человека. Бесплатно.'], food: ['Готовите сами', 'Кухня в квартире.'], shift: ['30 смен', 'По 11 часов.'], money: ['Раз в 2 недели', 'Аванс.'] },
  { n: 'Логистический склад', live: ['Хостел', '6 человек в комнате. Бесплатно.'], food: ['Обед', 'На объекте.'], shift: ['60 смен', 'По 12 часов.'], money: ['Раз в неделю', 'Аванс.'] },
  { n: 'Пищевое производство', live: ['Общежитие', '4 человека в комнате. Бесплатно.'], food: ['3 раза в день', 'В столовой завода.'], shift: ['30 смен', 'По 12 часов.'], money: ['Раз в 2 недели', 'Аванс.'] },
  { n: 'Кондитерская фабрика', live: ['Коттедж', '6 человек в доме. Бесплатно.'], food: ['2 раза в день', 'В столовой фабрики.'], shift: ['45 смен', 'По 11 часов.'], money: ['Раз в неделю', 'Аванс.'] },
  { n: 'Завод фурнитуры', live: ['Хостел', '4 человека в комнате. Бесплатно.'], food: ['Обед', 'На объекте.'], shift: ['30 смен', 'По 10 часов.'], money: ['Раз в 2 недели', 'Аванс.'] }
];
const VAC = [
  { id: 'komplektovshchik', wall: 'Комплектовщик', h: 'h_komplekt', p: '50% 40%', who: 'Вас ищут заказы.', title: 'Комплектовщик', sum: 'Можно без опыта.', tags: ['noexp', 'train', 'pair'], words: 'заказ сканер тсд сортировщик посылк бортов маркетплейс', does: 'Собирать заказы по списку на сканере.', reqs: ['Внимательность', 'Сканеру обучат на месте'], need: ['Без опыта', 'Сканеру обучат на месте.'], sites: [[0, 6000], [1, 5200], [2, 4600], [3, 4200], [4, 3900], [5, 3700], [6, 3500]] },
  { id: 'upakovshchik', wall: 'Стикеровщик, упаковщик', h: 'h_upak', p: '50% 55%', pm: '6% 50%', who: 'Вас ищут посылки.', title: 'Стикеровщик, упаковщик', sum: 'Можно без опыта.', tags: ['noexp', 'pair', 'sit'], words: 'стикер маркиров упаков этикет штрихкод наклейк', does: 'Клеить этикетки и штрихкоды, упаковывать заказы.', reqs: ['Аккуратность', 'Покажем всё на месте'], need: ['Без опыта', 'Покажем всё на месте.'], sites: [[0, 4200], [1, 4000], [3, 3800], [4, 3500], [5, 3300]] },
  { id: 'kladovshchik', wall: 'Кладовщик', h: 'h_sklad', p: '50% 70%', who: 'Вас ищет склад.', title: 'Кладовщик', sum: 'Вахта на склады.', tags: [], words: 'склад приёмщик приемщик приём накладн товар', does: 'Принимать товар, сверять накладные, размещать поставки.', reqs: ['Внимательность к документам', 'Опыт на складе будет плюсом'], need: ['Внимательность', 'Сверка товара по накладным.'], sites: [[1, 4500], [0, 4300], [3, 4000], [6, 3600]] },
  { id: 'gruzchik', wall: 'Грузчик', h: 'h_gruz', p: '50% 55%', who: 'Вас ищут паллеты.', title: 'Грузчик', sum: 'Можно без опыта.', tags: ['noexp'], words: 'рохл паллет паллетизатор опалетчик поддон разгрузк погрузк тележк', does: 'Разгружать и перемещать паллеты, готовить их к отгрузке.', reqs: ['Хорошая физическая форма', 'Покажем всё на месте'], need: ['Без опыта', 'Работа с тяжёлыми коробами.'], sites: [[3, 4500], [1, 4200], [0, 4000], [6, 3500]] },
  { id: 'vvsh', wall: 'ВВШ, погрузчик', h: 'h_vvsh', p: '50% 14%', who: 'Вас ищет погрузчик.', title: 'ВВШ, водитель погрузчика', sum: 'Нужно удостоверение.', tags: [], words: 'ричтрак штабел прт электротележк спецтехник водитель вилочн', does: 'Размещать и снимать паллеты на высотных стеллажах.', reqs: ['Удостоверение на технику', 'Опыт работы на погрузчике'], need: ['Удостоверение', 'И опыт работы на технике.'], sites: [[1, 6500], [0, 5500], [3, 4000]] },
  { id: 'fasovshchik', wall: 'Фасовщик', h: 'h_fasov', p: '74% 45%', who: 'Вас ищет цех.', title: 'Фасовщик', sum: 'Можно без опыта. Питание на объекте.', tags: ['noexp', 'pair'], words: 'укладчик упаков кондитер сладост колбас пищев производств', does: 'Фасовать и укладывать готовую продукцию.', reqs: ['Аккуратность', '[Медкнижка, если нужна]'], need: ['Без опыта', '[Медкнижка, если нужна.]'], sites: [[4, 4200], [5, 3800], [6, 3500]] },
  { id: 'operator', wall: 'Оператор линии', h: 'h_liniya', p: '50% 50%', who: 'Вас ищет линия.', title: 'Оператор линии', sum: 'С обучением.', tags: ['train'], words: 'конвейер производств завод', does: 'Следить за работой конвейера, подавать сырьё и упаковку.', reqs: ['Внимательность', 'Обучение на месте'], need: ['С обучением', 'Покажем работу линии.'], sites: [[4, 4200], [6, 3500]] },
  { id: 'sborshchik', wall: 'Сборщик', h: 'h_sborka', p: '50% 50%', pm: '30% 50%', who: 'Вас ищет сборка.', title: 'Сборщик', sum: 'Сидячая работа.', tags: ['sit'], words: 'сборка детал отк контролёр контролер брак завод', does: 'Собирать изделия за столом и проверять их на брак.', reqs: ['Аккуратность', 'Покажем всё на месте'], need: ['Без опыта', 'Работа сидя или стоя.'], sites: [[6, 4000], [2, 3600]] },
  { id: 'brigadir', wall: 'Бригадир', h: 'h_brigada', p: '50% 50%', pm: '60% 50%', who: 'Вас ищет бригада.', title: 'Бригадир', sum: 'Нужен опыт руководства.', tags: [], words: 'старший смен начальник смены', does: 'Вести смену: распределять людей и отвечать за план.', reqs: ['Опыт руководства сменой или бригадой', 'Опыт работы на складе или производстве'], need: ['Опыт', 'Руководство сменой или бригадой.'], sites: [[0], [1], [4]] },
  { id: 'menedzher', wall: 'Менеджер по клиентам', h: 'h_menedzher', p: '50% 50%', who: 'Вас ищут клиенты.', title: 'Менеджер по клиентам', remote: 1, pay: '[Зарплата]', place: 'Удалённая работа', sched: 'Полный день', tags: [], words: 'удал клиент звонк продаж', does: 'Отвечать клиентам и вести новые обращения.', reqs: ['Опыт общения с клиентами', 'Умение держать договорённости'], tiles: [['Где работаю', 'Из дома', 'Это не вахта.'], ['Какой график', 'Полный день', '[Дни и часы.]'], ['Когда деньги', '[Когда]', '[Как платит компания.]'], ['Что нужно', 'Опыт', 'Общение с клиентами.'], ['Чем работаю', '[Техника]', '[Компьютер свой или компании.]'], ['Кто ищет', '[Кто]', '[Должность, команда.]']] }
];
const rab = $('#rabota'), jobs = $('#jobs'), wall = $('#w-wall');
let jobsBuilt = false, vacCur = null, wallT = 0;
const FILTER = new Set();
const money = n => n ? String(n).replace(/\B(?=(\d{3})+$)/g, ' ') : '[Сумма]';
const objects = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'объект' : n % 10 > 1 && n % 10 < 5 && (n % 100 < 12 || n % 100 > 14) ? 'объекта' : 'объектов');
const vRange = V => { if (V.pay != null || !V.sites) return V.pay || '[Сумма]'; const a = V.sites.map(s => s[1]).filter(Boolean); return a.length ? money(Math.min(...a)) + ' – ' + money(Math.max(...a)) : '[Сумма]'; };
/* заголовок всегда на всю ширину: размер считается от длины фразы и самого длинного слова. Короче «вас ищет» слово не считается, поэтому на телефоне заголовки одного размера */
const fitVars = t => `--n:${t.length};--w:${Math.max(8, ...t.split(' ').map(x => x.length))}`;
const nearby = (V, s) => VAC.filter(x => x !== V && x.sites && x.sites.some(y => y[0] === s)).slice(0, 2).map(x => x.wall.toLowerCase());
function tilesOf(V, n) {
  if (!V.sites) return V.tiles;
  const s = SITES[V.sites[n][0]];
  return [['Где живу', ...s.live], ['Что ем', ...s.food], ['Какой график', ...s.shift], ['Когда деньги', ...s.money], ['Как доеду', ...ROAD], ['Что нужно', ...V.need]];
}
function objHTML(V, n) {
  const site = V.sites && V.sites[n], s = site && SITES[site[0]], near = site ? nearby(V, site[0]) : [];
  return `<div class="o-l"><div><p class="o-k">${esc(V.title)}${V.sites ? ', объект:' : ''}</p><h3 class="sg">${esc(s ? s.n : V.place)}</h3>
      <p class="o-pay sg${site && site[1] ? '' : ' ph'}${!site && V.pay && V.pay.length > 12 ? ' long' : ''}">${esc(site ? money(site[1]) : V.pay)}<small>${site ? (site[1] ? 'за смену. Пример, сумму уточнит компания.' : 'за смену. Значение заполнит компания.') : 'Значение заполнит компания.'}</small></p></div>
      <dl class="an">${tilesOf(V, n).map(([a, b, c]) => `<div><dt>${esc(a)}</dt><dd><b class="sg" style="--l:${Math.max(...b.split(' ').map(x => x.length))}">${esc(b)}</b><span>${esc(c)}</span></dd></div>`).join('')}</dl></div>
    <div class="o-r"><img data-i="${V.h}" alt="" style="--p:${V.p}${V.pm ? ';--pm:' + V.pm : ''}"><div class="o-in">${near.length ? `<small>Здесь же нужны: ${esc(near.join(', '))}.</small>` : ''}${V.mine ? '' : '<button class="btn job-me" type="button">Это я →</button>'}</div></div>`;
}
const answerLine = (V, n) => { const s = V.sites && V.sites[n]; return s ? `${V.title}. ${SITES[s[0]].n}. ${s[1] ? money(s[1]) + ' за смену.' : '[Сумма] за смену.'}` : `${V.title}. ${V.place}.`; };
function jobHTML(V, i) {
  const base = VAC.filter(x => !x.mine), next = base[(base.indexOf(V) + 1) % base.length], cnt = V.sites ? V.sites.length : 0;
  const cond = V.cond || [['Оформление', '[договор, дата начала]'], ['Испытательный срок', '[срок и условия]'], ['Кто ищет', '[должность, команда]']];
  const lead = V.remote ? `<b>Удалённо, это не вахта.</b> ${esc(V.pay)} · ${esc(V.sched)}. ${esc(V.does)}` : V.mine ? `<b>${esc(V.pay || '[Сумма]')}.</b> ${esc(V.does)}` : `<b>${esc(vRange(V))} за смену.</b> ${objects(cnt)}. Вахта. ${esc(V.sum)}`;
  const go = V.mine ? '<button class="btn job-fix" type="button" data-go="lyudi">Исправить</button>' : V.sites ? '<button class="btn v-pick" type="button">Выбрать объект ↓</button>' : `<button class="btn job-me" type="button" aria-label="Это я: откликнуться на вакансию ${esc(V.title)}">Это я →</button>`;
  return `<article class="vac" id="${V.id}" aria-labelledby="${V.id}-t" hidden>
    <section class="v-hero">
      <img class="v-bg" data-i="${V.h}" alt="" style="--p:${V.p}${V.pm ? ';--pm:' + V.pm : ''}"><div class="v-veil"></div>
      <h2 class="v-t sg" id="${V.id}-t" tabindex="-1" style="${fitVars(V.who)}">${esc(V.who)}</h2>
      <div class="v-foot">
        <div class="v-who"><button class="v-back" type="button">← Все вакансии</button><h3 class="sg">${esc(V.title)}</h3><p>${lead}</p></div>
        ${go}
      </div>
    </section>
    ${V.sites ? `<section class="v-board" style="--rc:${cnt}${cnt < 5 ? ';--m:min(8vw,15vh);--rk:1.7' : ''}" aria-label="Объекты">
      <div class="b-h"><h3 class="sg">${esc(V.wall)}: ${objects(cnt)}</h3><p>Примеры: объекты, суммы и условия выдуманы.<br>Сначала самые высокие ставки.</p></div>
      <div class="b-c" aria-hidden="true"><div>За смену</div><div>Объект</div><div>Где живу</div><div>Что ем</div><div>Вахта</div><div></div></div>
      <div class="rws">${V.sites.map(([x, pay], n) => { const s = SITES[x]; return `<button class="rw" type="button" data-n="${n}"${n ? '' : ' aria-current="true"'}><span class="m${pay ? '' : ' ph'}">${money(pay)}<small> за смену</small></span><span class="o">${esc(s.n)}</span><span class="c">${esc(s.live[0])}</span><span class="c">${esc(s.food[0])}</span><span class="c">${esc(s.shift[0])}</span><span class="a" aria-hidden="true">→</span><span class="ml">${esc(s.live[0])} · ${esc(s.food[0])} · ${esc(s.shift[0])}</span></button>`; }).join('')}</div>
    </section>` : ''}
    <section class="v-obj" aria-label="Условия">${objHTML(V, 0)}</section>
    <section class="v-reply">
      <div class="v-more">
        <p class="v-does sg">${esc(V.does)}</p>
        <ul>${V.reqs.map(x => `<li>${STAR}${esc(x)}</li>`).join('')}</ul>
        <dl class="job-cond">${cond.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
      </div>
      <div class="v-ans">
        ${V.mine ? '<p class="v-mine">Так кандидат увидит вашу вакансию. Прототип: объявление никуда не ушло.</p>' : `<form class="job-form" novalidate>
          <h3 class="sg">Это вы?</h3>
          <p class="r-o">${esc(answerLine(V, 0))}</p>
          <div class="fld"><label for="k-name${i}">Имя</label><input id="k-name${i}" class="k-name" autocomplete="name"><p class="err" hidden>Напишите имя.</p></div>
          <div class="fld"><label for="k-contact${i}">Телефон или почта</label><input id="k-contact${i}" class="k-contact"><p class="err" hidden>Укажите, куда ответить.</p></div>
          <button class="btn job-send" type="submit">Откликнуться</button>
          <p class="demo-note">[Кто] ответит [в какой срок], даже если ответ «нет». Прототип: данные никуда не отправляются. [Политика обработки данных.]</p>
        </form>
        <div class="job-done" hidden role="status" tabindex="-1"><p class="sg">Вы нашлись.</p><p>[Кто] напишет вам [в какой срок].</p><p class="demo-note">Прототип: отклик никуда не ушёл. Вакансия выдумана.</p></div>`}
      </div>
    </section>
    <button class="v-next" type="button" data-to="${next.id}"><small>Следующая профессия</small><b class="sg">${esc(next.who)} →</b></button>
  </article>`;
}
/* стена: шесть рядов, ряды едут навстречу друг другу. Кнопка в ряду работает мышью и пальцем, клавиатура идёт по скрытому списку */
function buildWall() {
  const list = VAC.map(V => V);
  $('#w-rows').innerHTML = Array.from({ length: 6 }, (_, r) => {
    const part = list.map((_, i) => list[(i + r * 3) % list.length]).map(V => `<button class="nm" type="button" tabindex="-1" data-to="${V.id}">${esc(V.wall)}</button><i>✦</i>`).join('');
    return `<div class="w-row" style="--t:${90 + r * 15}s"><div class="w-track${r % 2 ? ' rev' : ''}"><div>${part}</div><div aria-hidden="true">${part}</div></div></div>`;
  }).join('');
  $('#w-list').innerHTML = list.map(V => `<li><button type="button" data-to="${V.id}">${esc(V.wall)}: ${esc(V.who)}</button></li>`).join('');
}
function hitsShow(list) {
  $('#w-hits').innerHTML = list.map(V => `<button class="w-hit" type="button" data-to="${V.id}" tabindex="-1" style="--n:${V.wall.length};--c:${list.length}"><span class="sg">${esc(V.wall)}</span><small>${V.remote ? '<b>Удалённо</b>' : V.mine ? 'Ваша вакансия' : `<b>${esc(vRange(V))}</b> за смену`} <br><i>· </i>${V.sites ? objects(V.sites.length) + '. ' : ''}<em>Открыть </em>→</small></button>`).join('');
  wall.classList.toggle('dim', list.length > 0);
}
/* слова поиска это основы: «рохл» находит и «рохля», и «рохлю» */
const vacHit = q => V => (!q || (V.who + ' ' + V.title + ' ' + V.wall + ' ' + (V.words || '') + ' ' + V.does).toLowerCase().includes(q) || (V.words || '').split(' ').some(w => w.length > 2 && q.includes(w))) && [...FILTER].every(f => (V.tags || []).includes(f));
function jobFilter() {
  const q = $('#q').value.trim().toLowerCase(), hit = VAC.filter(vacHit(q)), n = hit.length, any = q || FILTER.size;
  $('#count').textContent = (any ? n + ' из ' + VAC.length + '. ' : 'Вахта на склады и производства. Менеджер по клиентам: удалённо. ') + 'Примеры: объекты, суммы и условия выдуманы.'; $('#none').hidden = n > 0;
  hitsShow(any ? hit.slice(0, 5) : []); if (any && !n) wall.classList.add('dim');
}
function vacImgs(j) { $$('img[data-i]', j).forEach(m => { if (!m.src) m.src = window.GT_IMG[m.dataset.i]; }); }
function objSet(j, n, smooth) {
  const V = VAC.find(x => x.id === j.id); if (!V || !V.sites || !V.sites[n]) return;
  $('.v-obj', j).innerHTML = objHTML(V, n); vacImgs(j);
  $$('.rw', j).forEach((r, k) => { if (k === n) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
  const line = $('.r-o', j); if (line) line.textContent = answerLine(V, n);
  try { history.replaceState(null, '', '#' + j.id + '-' + (n + 1)); } catch (e) {}
  if (smooth != null) $('.v-obj', j).scrollIntoView({ behavior: smooth && !RM ? 'smooth' : 'auto', block: 'start' });
}
function vacOpen(id, now) {
  const j = $('#' + id); if (!j) return; clearTimeout(wallT);
  $$('.vac', jobs).forEach(x => { x.hidden = x !== j; x.classList.remove('in'); }); vacImgs(j); jobs.hidden = false; vacCur = j; rab.classList.add('v'); rab.scrollTop = 0;
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
  if (now || RM || wall.hidden) { wall.hidden = true; wall.classList.add('out'); j.classList.add('in'); }
  else { void j.offsetWidth; wall.classList.add('out'); requestAnimationFrame(() => j.classList.add('in')); wallT = setTimeout(() => { wall.hidden = true; }, 720); }
  $('.v-t', j).focus({ preventScroll: true });
  if (window.__reel) window.__reel.sync();
}
function vacClose(now) {
  const j = vacCur; clearTimeout(wallT); vacCur = null; rab.classList.remove('v'); rab.scrollTop = 0; wall.hidden = false;
  try { history.replaceState(null, '', '#rabota'); } catch (e) {}
  void wall.offsetWidth; wall.classList.remove('out');
  if (window.__reel) window.__reel.sync();
  const done = () => { jobs.hidden = true; if (j) { j.hidden = true; j.classList.remove('in'); } };
  if (now || RM) done(); else wallT = setTimeout(done, 720);
  $('#q').focus({ preventScroll: true });
}
let barT = 0;
function barScroll() { document.body.classList.add('barhide'); clearTimeout(barT); barT = setTimeout(() => document.body.classList.remove('barhide'), 320); }
/* профессия со стены открывается в ленте под стеной (на компьютере). На телефоне ленты пока нет,
   там и из открытой вакансии («Следующая профессия») открывается страница вакансии */
function openJob(id) {
  if (!rab.classList.contains('v') && window.__reel && window.__reel.open(id)) return;
  vacOpen(id);
}
function buildJobs() {
  if (jobsBuilt) return; jobsBuilt = true;
  jobs.innerHTML = VAC.map(jobHTML).join(''); buildWall();
  rab.addEventListener('click', e => {
    const t = e.target.closest('[data-to]'); if (t) { openJob(t.dataset.to); return; }
    const f = e.target.closest('.chip'); if (f) { const k = f.dataset.f, on = !FILTER.has(k); if (on) FILTER.add(k); else FILTER.delete(k); f.setAttribute('aria-pressed', on); jobFilter(); return; }
    if (e.target.closest('.v-back')) { vacClose(); return; }
    const j = e.target.closest('.vac'); if (!j) return;
    if (e.target.closest('.job-fix')) { S.fix = 1; return; }
    if (e.target.closest('.v-pick')) { $('.v-board', j).scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); $('.rw[aria-current]', j).focus({ preventScroll: true }); return; }
    const r = e.target.closest('.rw'); if (r) { objSet(j, +r.dataset.n, true); return; }
    if (e.target.closest('.job-me')) {
      $('.v-ans', j).scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); const k = $('.k-name', j); if (k && !$('.job-form', j).hidden) k.focus({ preventScroll: true });
    }
  });
  rab.addEventListener('submit', e => {
    const f = e.target.closest('.job-form'); if (!f) return; e.preventDefault(); const j = f.closest('.vac');
    const nm = $('.k-name', f), ct = $('.k-contact', f), n = !nm.value.trim(), c2 = !ct.value.trim();
    nm.nextElementSibling.hidden = !n; ct.nextElementSibling.hidden = !c2; nm.setAttribute('aria-invalid', n); ct.setAttribute('aria-invalid', c2);
    if (n) { nm.focus(); return; } if (c2) { ct.focus(); return; }
    f.hidden = true; const d = $('.job-done', j); d.hidden = false; d.focus({ preventScroll: true });
  });
  rab.addEventListener('scroll', barScroll, { passive: true });
  $('#q').addEventListener('input', jobFilter);
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const h = $('.w-hit'); if (h) { e.preventDefault(); openJob(h.dataset.to); } } });
  $('#w-list').addEventListener('focusin', e => { const b = e.target.closest('[data-to]'); if (b) hitsShow(VAC.filter(V => V.id === b.dataset.to)); });
  $('#w-list').addEventListener('focusout', jobFilter);
  $('#none-clear').addEventListener('click', () => { $('#q').value = ''; FILTER.clear(); $$('.chip').forEach(c => c.setAttribute('aria-pressed', false)); jobFilter(); $('#q').focus(); });
  $('#none-talk').addEventListener('click', () => openTalk('Ищу работу: '));
  $('#end-talk').addEventListener('click', () => openTalk('Ищу работу: '));
  jobFilter();
}
/* черновик из мира «Люди» становится первой вакансией */
function syncMine() {
  const old = $('#moe'); if (old) { old.remove(); VAC.length = 10; buildWall(); }
  if (!S.mine) return;
  const m = S.mine, V = { id: 'moe', mine: 1, h: 'p4', p: '50% 30%', wall: m.role, who: m.role + '.', title: 'Так вас увидит кандидат', place: m.role, pay: m.pay, does: m.week || '[что этот человек сделает в первую неделю]', reqs: ['[что здесь сложного и кто поможет]', '[куда можно вырасти за год]'], tags: [], tiles: [['Что сложного', '[Что]', '[И кто поможет.]'], ['Какой график', '[Дни]', '[И часы.]'], ['Где', '[Адрес]', '[Или формат работы.]'], ['Первая неделя', m.week ? 'Задача' : '[Задача]', m.week || '[Что человек сделает.]'], ['Кто ищет', '[Кто]', '[Должность, команда.]'], ['Оформление', '[Договор]', '[Дата начала.]']] };
  VAC[10] = V; jobs.insertAdjacentHTML('afterbegin', jobHTML(V, 10)); buildWall();
  $('#q').value = ''; jobFilter();
}
function enterWork() {
  buildJobs(); syncMine(); rab.focus({ preventScroll: true }); $('#q').value = ''; FILTER.clear(); $$('.chip').forEach(c => c.setAttribute('aria-pressed', false)); jobFilter();
  clearTimeout(wallT); vacCur = null; rab.classList.remove('v'); rab.scrollTop = 0; wall.hidden = false; wall.classList.remove('out'); jobs.hidden = true; $$('.vac', jobs).forEach(x => { x.hidden = true; });
  if (S.mineGo) { S.mineGo = 0; vacOpen('moe', true); }
  if (S.deep) { const d = S.deep; S.deep = null; vacOpen(d.id, true); if (d.n != null) objSet($('#' + d.id), d.n, false); }
}

/* ---------- МИР 2: «Вы ищете человека». Чертёж от шага к шагу становится живым портретом, затем заявка одним письмом ---------- */
const FIELDS = [
  { k: 'role', before: 'Нам нужен', after: '.', ph: 'главный бухгалтер', label: 'Кто вам нужен' },
  { k: 'week', before: 'В первую неделю он', after: '.', ph: 'примет дела и закроет месяц', label: 'Что человек сделает в первую неделю' },
  { k: 'pay', before: 'На руки получит', after: '.', ph: 'сумма и от чего она зависит', label: 'Сколько человек получит на руки' },
  { k: 'contact', before: 'Ответьте нам:', after: '.', ph: 'телефон или почта', label: 'Куда вам написать' }
];
const CLICHE = [
  [/стрессоустойчив\w*/gi, 'Кандидат спросит: что здесь сложного и кто поможет?'],
  [/конкурентн\w* (зарплат|оплат)\w*/gi, 'Кандидат спросит: сколько на руки?'],
  [/дружн\w* коллектив\w*/gi, 'Кандидат спросит: кто мой руководитель?'],
  [/ответственн\w*|коммуникабельн\w*|обучаем\w*/gi, 'Так пишут все. Покажите, где это пригодится.'],
  [/карьерн\w* рост\w*|перспектив\w*/gi, 'Кандидат спросит: куда я вырасту за год?']
];
const ly = $('#lyudi'), mine = $('#ly-mine'), M = { role: '', week: '', pay: '', contact: '' };
let lyBuilt = false, plain = 'true';
function myNote() {
  const hl = window.CSS && CSS.highlights && window.Highlight, ranges = []; let note = '';
  $$('.bl').forEach(el => {
    const tn = el.firstChild; if (!tn || tn.nodeType !== 3) return;
    CLICHE.forEach(([re, msg]) => { re.lastIndex = 0; let m; while ((m = re.exec(tn.data))) { if (!note) note = msg; if (hl) { const r = new Range(); r.setStart(tn, m.index); r.setEnd(tn, m.index + m[0].length); ranges.push(r); } } });
  });
  if (hl) { if (ranges.length) CSS.highlights.set('cliche', new Highlight(...ranges)); else CSS.highlights.delete('cliche'); }
  $('#my-note').textContent = note;
}
function myFill(vals) { Object.assign(M, vals); $$('.bl').forEach(el => { el.textContent = M[el.dataset.k]; }); $('#my-err').hidden = true; myNote(); }
function myLock(on) { $$('.bl').forEach(el => { el.contentEditable = on ? 'false' : plain; el.tabIndex = on ? -1 : 0; }); $('.my-go').hidden = on; $('#my-done').hidden = !on; $('#my-demo').hidden = on; $('.my-msg').hidden = on; }
function myReveal(smooth) { ly.scrollTo({ top: mine.closest('.ly-f').offsetTop, behavior: smooth && !RM ? 'smooth' : 'auto' }); }
/* портрет: штрих проявляется полосой вдоль линий. На шаге «Покажем подходящих» фон уходит в чёрное и появляется живой человек */
const LP = { im: $$('.ly-im img'), frames: $$('.ly-f'), keys: [[0, 0], [.2, 1], [1.2, 2.7]], f: -1 };
function lyPaint() {
  if (world !== 'lyudi') return;
  const top = ly.scrollTop, fs = LP.frames, mid = top + ly.clientHeight * .5; let f = 0;
  for (let i = 0; i < fs.length; i++) { const a = fs[i].offsetTop, h = fs[i].offsetHeight; if (mid >= a + h / 2) f = i + (i < fs.length - 1 ? clamp((mid - a - h / 2) / (fs[i + 1].offsetTop + fs[i + 1].offsetHeight / 2 - a - h / 2)) : 0); }
  if (f === LP.f) return; LP.f = f;
  LP.im.slice(0, 3).forEach((m, i) => { const [a, b] = LP.keys[i], p = i === 0 ? 1 : sstep(a, b, f); m.style.setProperty('--p', p.toFixed(3)); m.style.visibility = p > .004 ? 'visible' : 'hidden'; });
  const dark = f >= 3.42; ly.classList.toggle('dark', dark); document.body.classList.toggle('ink', !dark); ly.classList.toggle('formy', f > 5.45);
}
function buildPeople() {
  if (lyBuilt) return; lyBuilt = true;
  LP.im.forEach(m => { m.src = window.GT_IMG[m.dataset.i]; });
  ly.addEventListener('scroll', () => { lyPaint(); barScroll(); }, { passive: true }); addEventListener('resize', () => { LP.f = -1; lyPaint(); });
  /* одно движение колеса — один экран, и портрет меняется сразу, а не через десяток щелчков. Экран выше окна сначала прокручивается до своего края */
  let lyAcc = 0, lyLock = 0;
  ly.addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    const fs = LP.frames, top = ly.scrollTop, H = ly.clientHeight, dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1);
    let i = 0; fs.forEach((f, k) => { if (f.offsetTop <= top + 2) i = k; });
    const f = fs[i]; if (dy > 0 ? f.offsetTop + f.offsetHeight > top + H + 2 : top > f.offsetTop + 2) return;
    e.preventDefault(); const now = performance.now(); if (now < lyLock) return;
    lyAcc += dy; if (Math.abs(lyAcc) < 30) return;
    const j = clamp(i + Math.sign(lyAcc), 0, fs.length - 1); lyAcc = 0; if (j === i) return;
    lyLock = now + (RM ? 150 : 800); ly.scrollTo({ top: fs[j].offsetTop, behavior: RM ? 'auto' : 'smooth' });
  }, { passive: false });
  const test = document.createElement('div'); try { test.contentEditable = 'plaintext-only'; if (test.contentEditable === 'plaintext-only') plain = 'plaintext-only'; } catch (e) {}
  $('#my-letter').innerHTML = FIELDS.map(f => `<span class="ln">${f.before} <span class="nb"><span class="bl" data-k="${f.k}" data-ph="${f.ph}" role="textbox" aria-label="${f.label}" tabindex="0" contenteditable="${plain}"></span><span class="dot">${f.after}</span></span></span>`).join(' ');
  $('#ly-skip').addEventListener('click', () => { myReveal(true); $('.bl').focus({ preventScroll: true }); });
  $$('.bl').forEach((el, i, all) => {
    el.addEventListener('input', () => { if (!el.textContent.trim()) el.textContent = ''; M[el.dataset.k] = el.textContent; $('#my-err').hidden = true; myNote(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (all[i + 1]) all[i + 1].focus(); else mine.requestSubmit(); } });
    el.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' ')); });
  });
  $('#my-sample').addEventListener('click', () => myFill({ role: 'главный бухгалтер', week: 'примет дела и закроет месяц', pay: '[сумма], оклад плюс премия за отчётность' }));
  mine.addEventListener('submit', e => {
    e.preventDefault(); const er = $('#my-err'), r = !M.role.trim(), c = !M.contact.trim();
    if (r || c) { er.textContent = r ? 'Напишите, кто вам нужен.' : 'Укажите, куда вам ответить.'; er.hidden = false; $(`.bl[data-k="${r ? 'role' : 'contact'}"]`).focus(); return; }
    er.hidden = true; myLock(true); const v = M.role.trim();
    S.mine = { role: v[0].toUpperCase() + v.slice(1), week: M.week.trim(), pay: M.pay.trim() };
    $('#my-see').focus({ preventScroll: true });
  });
  $('#my-see').addEventListener('click', () => { S.mineGo = 1; go('rabota'); });
  $('#my-again').addEventListener('click', () => { myLock(false); myFill({ role: '', week: '', pay: '', contact: '' }); S.mine = null; $('.bl').focus({ preventScroll: true }); });
}
/* «Исправить» возвращает к тому же черновику */
function enterPeople() {
  buildPeople(); ly.scrollTop = 0; ly.focus({ preventScroll: true }); LP.f = -1;
  if (S.fix) { S.fix = 0; myLock(false); myReveal(); $('.bl').focus({ preventScroll: true }); }
  lyPaint();
}

/* ---------- МИР 3: эфир ---------- */
/* Номер станции — её место в ST, по нему подключены примеры. Порядок на шкале задаёт v: Сайт, Бренд, Реклама, SMM. */
const ST = [
  { wd: 100, v: 12, name: 'Сайт', full: 'Разработка сайта', go: 'Обсудить сайт', col: [0, 0, 0], line: 'Это лицо компании.', ask: 'Что вы хотите, чтобы человек видел, когда открывает ваш сайт?' },
  { wd: 72, v: 63, name: 'Реклама', full: 'Контекстная и таргетированная реклама', go: 'Обсудить рекламу', col: [.91, 1, .102], line: 'Её видят те, кто ищет, и те, кто ещё не искал.', ask: 'Кого реклама должна привести к вам?' },
  { wd: 120, v: 88, name: 'SMM', full: 'Ведение соцсетей', go: 'Обсудить SMM', col: [.208, .949, .608], line: 'Соцсети, к которым возвращаются.', ask: 'Зачем человеку подписаться на вас?' },
  { wd: 100, v: 37, name: 'Бренд', full: 'Брендбук и логотип', go: 'Обсудить бренд', col: [.95, .95, .95], line: 'Человек увидел один раз и узнал во второй.', ask: 'Что человек должен запомнить о вас с первого взгляда?' }
];
const NOISE = ['Лучшие цены', 'Индивидуальный подход', 'Команда профессионалов', 'Высокое качество', 'Динамично развиваемся', 'Только сегодня', 'Лидер рынка', 'Клиентоориентированность', 'Гарантия результата', 'Комплексные решения', 'Опыт и надёжность', 'Вы не пожалеете'];
/* станции слева направо по шкале */
const ORD = ST.map((s, i) => i).sort((a, b) => ST[a].v - ST[b].v);
const air = { v: 1, target: 1, q: 0, cur: -1, thr: [], snd: null, built: false };
const GLY = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ#%/*+=';
function buildAir() {
  if (air.built) return; air.built = true;
  $('#air-noise').innerHTML = NOISE.map((t, i) => {
    const y = (i * 8.2 + 2) % 92, x = (i * 37) % 70 - 8, fs = 6 + (i * 5) % 9, wd = 50 + (i * 23) % 90;
    return `<span style="left:${x}vw;top:${y}vh;font-size:${fs}vw;--wd:${wd};animation-delay:-${i * .07}s">${t}</span>`;
  }).join('');
  $('#presets').innerHTML = ORD.map(i => `<button type="button" style="left:${ST[i].v}%" data-i="${i}" aria-pressed="false" aria-label="${ST[i].full}">${ST[i].name}</button>`).join('');
  $$('#presets button').forEach(b => b.addEventListener('click', () => { const v = ST[+b.dataset.i].v; air.target = v; if (RM) air.v = v; $('#tun').value = v; dirty = true; }));
  const t = $('#tun'); t.addEventListener('input', () => { air.target = +t.value; if (RM) air.v = air.target; dirty = true; });
  $('#klienty').addEventListener('wheel', e => {
    /* На станциях с примером колесо сначала ведёт пример, потом ручку */
    const ex = air.cur === 0 ? window.GTSAYT : air.cur === 1 ? window.GTREK : air.cur === 2 ? window.GTSMM : air.cur === 3 ? window.GTBRD : null;
    if (ex && ex.wheel(e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1))) { e.preventDefault(); dirty = true; return; }
    /* ручка встаёт на каждой станции: быстрое колесо не проскакивает станцию, пока её пример не успел включиться.
       Ручка прыгает на отметку за 2,5 деления до неё: сигнал ловится за 2,1, и пример иначе забрал бы колесо, не дав ручке дойти до отметки */
    e.preventDefault(); dirty = true; const now = performance.now(); if (now < (air.lock || 0)) return;
    const dir = Math.sign(e.deltaY), nt = clamp(air.target + dir * 1.2, 0, 100), hit = ORD.map(i => ST[i]).find(st => (st.v - air.target) * dir > .01 && (st.v - nt) * dir <= 2.5);
    if (hit) { air.target = hit.v; air.lock = now + (RM ? 0 : 900); } else air.target = nt;
    t.value = air.target; }, { passive: false });
  $('#st-go').addEventListener('click', () => openTalk(air.cur >= 0 ? ST[air.cur].full : ''));
  $('#sound').addEventListener('click', toggleSound);
}
function enterAir() { buildAir(); air.v = air.target = +$('#tun').value; J.done = false; }
/* звук ручки приёмника: тихий мягкий шорох эфира с редким потрескиванием, тихий щелчок на каждом делении шкалы, мягкий глухой щелчок на каждой станции,
   на пойманной станции шорох стихает и звучит короткий мягкий аккорд — у каждой станции свой. Ровного гудка нет.
   Пока пример станции листают колесом или пальцем, на каждом делении его хода звучит тот же мягкий щелчок, только тише.
   Звук включён сразу. Браузер даёт его запустить только после первого нажатия на странице (щелчок, касание, клавиша; колесо не считается). Выключенный звук сайт помнит */
const SND = { want: (() => { try { return localStorage.getItem('gt-sound') !== 'off'; } catch (e) { return true; } })() };
function sndLabel() { $('#sound').textContent = SND.want ? 'Выключить звук' : 'Включить звук'; }
function toggleSound() {
  /* звук выбран, но браузер ещё не дал ему играть: первое нажатие на кнопку включает звук, а не выключает тишину */
  if (SND.want && !(air.snd && air.snd.ctx.state === 'running')) { if (air.snd) air.snd.ctx.resume(); else sndStart(); return; }
  SND.want = !SND.want; try { localStorage.setItem('gt-sound', SND.want ? 'on' : 'off'); } catch (e) {} if (SND.want) sndStart(); else if (air.snd) { air.snd.ctx.close(); air.snd = null; } sndLabel(); }
sndLabel();
/* касание на телефоне разрешает звук только на отпускании пальца, поэтому слушаем и pointerup, и touchend, и будим остановленный звук */
['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(t => addEventListener(t, e => {
  if (!SND.want || (e.target && e.target.closest && e.target.closest('#sound'))) return;
  if (!air.snd) sndStart(); else if (air.snd.ctx.state === 'suspended') air.snd.ctx.resume();
}, true));
function sndStart() {
  if (air.snd) return; const b = $('#sound');
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), R = ctx.sampleRate, out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
    const buf = ctx.createBuffer(1, R * 2, R), d = buf.getChannelData(0); let br = 0;
    /* шорох: шум с завалом верхов, через полосу 300–1800 Гц он звучит как далёкий эфир, а не как резкое шипение. Редкие тихие щелчки — потрескивание */
    for (let i = 0; i < d.length; i++) { br = br * .82 + (Math.random() * 2 - 1) * .18; d[i] = br * 2.4 + (Math.random() < .0004 ? (Math.random() - .5) * 1.6 : 0); }
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const ng = ctx.createGain(); ng.gain.value = 0; n.connect(hp).connect(lp).connect(ng).connect(out); n.start();
    /* щелчок деления: очень короткий шум через узкую полосу 2,6 кГц */
    const cb = ctx.createBuffer(1, Math.round(R * .012), R), cd = cb.getChannelData(0); for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (R * .0016));
    let last = 0;
    const click = () => { const t = ctx.currentTime; if (t - last < .022) return; last = t; const s1 = ctx.createBufferSource(); s1.buffer = cb; const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 2600; f1.Q.value = 2.2; const g = ctx.createGain(); g.gain.value = .12; s1.connect(f1).connect(g).connect(out); s1.start(t); air.snd.clicks++; };
    /* щелчок станции: мягкий глухой «тук», как у ручки с фиксацией — тон 380→150 Гц быстро падает и гаснет, под ним приглушённый шорох.
       Ниже 150 Гц не опускаемся: динамики ноутбука и телефона такие частоты почти не играют */
    let lastSoft = -1;
    const soft = (k = 1) => { const t = ctx.currentTime; if (t - lastSoft < .045) return; lastSoft = t; const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(150, t + .07);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14 * k, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + .12); o.connect(g).connect(out); o.start(t); o.stop(t + .14);
      const s2 = ctx.createBufferSource(); s2.buffer = cb; const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1400; const g2 = ctx.createGain(); g2.gain.value = .3 * k; s2.connect(f2).connect(g2).connect(out); s2.start(t); air.snd.softs++; };
    /* аккорд станции: основной тон, квинта и октава, мягкое начало и долгое затухание */
    const ROOT = [261.63, 293.66, 329.63, 392];
    const chord = st => {
      const t = ctx.currentTime, f0 = ROOT[ORD.indexOf(st)] || 261.63, g = ctx.createGain(), lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2400;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .03); g.gain.exponentialRampToValueAtTime(.0008, t + 1.6); g.connect(lpf).connect(out);
      [1, 1.5, 2].forEach((m, k) => { const o = ctx.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = f0 * m; o.connect(g); o.start(t + k * .04); o.stop(t + 1.7); });
      air.snd.chords++;
    };
    air.snd = { ctx, ng, click, soft, chord, clicks: 0, softs: 0, chords: 0, tk: Math.floor(air.v), pv: air.v, z: -1, en: null, ek: -1 };
  } catch (e) { b.hidden = true; }
}
function scramble(el, text, q, seed) {
  let s = ''; for (let i = 0; i < text.length; i++) {
    const c = text[i], th = ((i * 37 + seed * 11) % 100) / 100;
    s += (c === ' ' || q > th * .9 + .05) ? c : GLY[Math.floor(Math.random() * GLY.length)];
  }
  if (el.textContent !== s) el.textContent = s;
}
function updateAir(dt) {
  air.v = RM ? air.target : lerp(air.v, air.target, clamp(dt * 7));
  let best = 0, bd = 999; ST.forEach((s, i) => { const d = Math.abs(air.v - s.v); if (d < bd) { bd = d; best = i; } });
  const q = sstep(7, 1.1, bd); air.q = q;
  const s = ST[best], W = $('#klienty');
  const near = bd < 9;
  W.classList.toggle('tuned', q > .92);
  if (window.GTREK) GTREK.step(dt, { near: best === 1 && bd < 9, tuned: air.cur === 1, alpha: q });
  if (window.GTSMM) GTSMM.step(dt, { near: best === 2 && bd < 9, tuned: air.cur === 2, alpha: q });
  if (window.GTBRD) GTBRD.step(dt, { near: best === 3 && bd < 9, tuned: air.cur === 3, alpha: q });
  /* На тёмном сайте из примера «Реклама» буквы сайта снова белые */
  const js = junkStep(dt * (window.GTSAYT && GTSAYT.fast ? 3 : 1), best === 0 ? bd : 99, air.v - ST[0].v), dark = q > .55 && best !== 0 && !(window.GTREK && GTREK.dark) && !(window.GTSMM && GTSMM.dark) && !(window.GTBRD && GTBRD.dark);
  if (window.GTSAYT) GTSAYT.step(dt, { near: best === 0 && bd < 9, alpha: J.alpha, clean: J.clean, call: J.p.find(p => p.e.classList.contains('j-call')), v: air.v });
  document.body.classList.toggle('ink', dark || js);
  document.body.classList.toggle('jk', js);
  $('#air').style.setProperty('--air', dark ? '#000' : '#fff');
  W.style.setProperty('--air', dark ? '#000' : '#fff');
  $('#air-noise').style.opacity = (1 - q) * .95;
  $('#scale').style.setProperty('--p', (air.v / 100).toFixed(4)); $('#dial').style.setProperty('--g', (1 - q).toFixed(3));
  $('#st-name').style.setProperty('--wd', q > .92 ? (innerWidth <= 760 ? Math.max(50, s.wd * .6) : s.wd) : (innerWidth <= 760 ? 60 : 70));
  if (near) { scramble($('#st-name'), s.name, Math.min(1, q * 1.6), best + 1); scramble($('#st-line'), s.line, q, best + 3); }
  else { if ($('#st-name').textContent !== 'Шум') $('#st-name').textContent = 'Шум'; if ($('#st-line').textContent) $('#st-line').textContent = ''; }
  if (q > .92 && air.cur !== best) {
    if (air.snd) air.snd.chord(best);
    air.cur = best; W.dataset.st = best; if (s.ask) $('#st-ask').textContent = s.ask; $('#st-go span').textContent = s.go + ' →';
    $('#st-name').setAttribute('aria-label', s.full);
    $$('#presets button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === best));
  }
  if (q <= .92 && air.cur !== -1) { air.cur = -1; delete W.dataset.st; $$('#presets button').forEach(b => b.setAttribute('aria-pressed', false)); $('#st-name').removeAttribute('aria-label'); }
  /* Сетка-сонар под чёрной надписью станции: у «Сайта» после развала, у остальных, когда подключён пример. Она идёт после шагов примеров:
     по силе сигнала расходится в шум и собирается, в начале примера становится им, в конце встаёт из него. После развала «Сайта» встаёт за волной от телефона. */
  if (window.GTSONAR) { const mod = near ? [window.GTSAYT, window.GTREK, window.GTSMM, window.GTBRD][best] : null;
    GTSONAR.frame({ q: near ? q : 0, ok: best === 0 ? W.classList.contains('clean') : !!mod, at: best === 0 ? junkCall : null, mod: mod && 'grid' in mod ? mod : null }); }
  if (air.snd) {
    const A = air.snd, c = A.ctx.currentTime, tk = Math.floor(air.v); A.ng.gain.setTargetAtTime(world === 'klienty' ? (1 - q) * .045 : 0, c, .08); if (tk !== A.tk) { A.tk = tk; A.click(); }
    /* станция: ручка вошла в её отметку или проскочила её за один кадр */
    let z = -1; ST.forEach((st, k) => { if (Math.abs(air.v - st.v) < .3) z = k; });
    const jump = ST.some(st => (A.pv - st.v) * (air.v - st.v) < 0 && Math.abs(A.pv - st.v) > .3 && Math.abs(air.v - st.v) > .3);
    if ((z >= 0 && z !== A.z) || jump) A.soft(); A.z = z; A.pv = air.v;
    /* пример пойманной станции: щелчок на каждом делении его хода — колесом, пальцем или когда он сам доматывает до следующей части */
    const mod = air.cur >= 0 ? [window.GTSAYT, window.GTREK, window.GTSMM, window.GTBRD][air.cur] : null, ms = mod && mod.notch ? mod.state : null;
    /* деления стоят на целых: колесо ставит ход ровно на них, поэтому граница щелчка посередине между делениями */
    const en = ms && ms.on ? Math.round(ms.u * mod.notch) : null;
    if (en != null && A.en != null && A.ek === air.cur && en !== A.en) A.soft(.6); A.en = en; A.ek = air.cur;
  }
  air.col = best === 1 && window.GTREK ? GTREK.col : best === 2 && window.GTSMM ? GTSMM.col : best === 3 && window.GTBRD ? GTBRD.col : s.col;
}
function drawAir(time) {
  if (!gl) return;
  const { p, u } = P.radio; gl.useProgram(p);
  /* время по кругу: большие числа шейдер округляет, и шум гаснет. За 20π секунд все волны шейдера делают целое число оборотов, стыка не видно */
  gl.uniform2f(u.R, cv.width, cv.height); gl.uniform1f(u.T, time % (20 * Math.PI)); gl.uniform1f(u.Q, air.q); gl.uniform3f(u.C, air.col[0], air.col[1], air.col[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ---------- «Сайт»: плохой сайт разваливается от поворота ручки ---------- */
/* Физика прямоугольников: столкновения по разделяющей оси, импульсы, сон */
const PH = { b: [], g: 2600, tick: 1 / 60, acc: 0 };
function phBody(x, y, w, h, fixed) { const m = fixed ? 0 : w * h / 900, I = fixed ? 0 : m * (w * w + h * h) / 12; return { x, y, a: 0, vx: 0, vy: 0, va: 0, hw: w / 2, hh: h / 2, im: fixed ? 0 : 1 / m, iI: fixed ? 0 : 1 / I, fixed: !!fixed, ghost: false, still: 0, asleep: !!fixed }; }
function phAxes(b) { const c = Math.cos(b.a), s = Math.sin(b.a); return [[c, s], [-s, c]]; }
function phHits(A, B) {
  const ax = phAxes(A), bx = phAxes(B), dx = B.x - A.x, dy = B.y - A.y; let best = 1e9, nx = 0, ny = 0, ref = 0;
  const tests = [[ax[0], A.hw, 0], [ax[1], A.hh, 1], [bx[0], B.hw, 2], [bx[1], B.hh, 3]];
  for (const [n, , k] of tests) {
    const ra = A.hw * Math.abs(n[0] * ax[0][0] + n[1] * ax[0][1]) + A.hh * Math.abs(n[0] * ax[1][0] + n[1] * ax[1][1]), rb = B.hw * Math.abs(n[0] * bx[0][0] + n[1] * bx[0][1]) + B.hh * Math.abs(n[0] * bx[1][0] + n[1] * bx[1][1]);
    const d = n[0] * dx + n[1] * dy, o = ra + rb - Math.abs(d); if (o <= 0) return null;
    if (o < best - (k > 1 ? .5 : 0)) { best = o; const sg = d < 0 ? -1 : 1; nx = n[0] * sg; ny = n[1] * sg; ref = k; }
  }
  // опорная грань на одном теле, ребро-жертва на другом: обрезаем ребро гранью
  const R = ref < 2 ? A : B, I = ref < 2 ? B : A, fn = ref < 2 ? [nx, ny] : [-nx, -ny], ix = ref < 2 ? bx : ax, rx = ref < 2 ? ax : bx;
  const dots = [ix[0][0] * fn[0] + ix[0][1] * fn[1], ix[1][0] * fn[0] + ix[1][1] * fn[1]], useX = Math.abs(dots[0]) > Math.abs(dots[1]);
  const eN = useX ? ix[0] : ix[1], eT = useX ? ix[1] : ix[0], eH = useX ? I.hw : I.hh, tH = useX ? I.hh : I.hw, sign = (useX ? dots[0] : dots[1]) > 0 ? -1 : 1;
  const cx = I.x + eN[0] * eH * sign, cy = I.y + eN[1] * eH * sign, p = [[cx - eT[0] * tH, cy - eT[1] * tH], [cx + eT[0] * tH, cy + eT[1] * tH]];
  const rIsX = ref % 2 === 0, sT = rIsX ? rx[1] : rx[0], sH = rIsX ? R.hh : R.hw, fH = rIsX ? R.hw : R.hh, out = [];
  const pr = q => (q[0] - R.x) * sT[0] + (q[1] - R.y) * sT[1], a = pr(p[0]), b = pr(p[1]);
  [[p[0], a], [p[1], b]].forEach(([q, t], i) => {
    let c = q; const o = i ? a : b;
    if (t > sH) { if (o >= sH) return; const k = (sH - o) / (t - o), r = i ? p[0] : p[1]; c = [r[0] + (q[0] - r[0]) * k, r[1] + (q[1] - r[1]) * k]; }
    else if (t < -sH) { if (o <= -sH) return; const k = (-sH - o) / (t - o), r = i ? p[0] : p[1]; c = [r[0] + (q[0] - r[0]) * k, r[1] + (q[1] - r[1]) * k]; }
    const dep = fH - ((c[0] - R.x) * fn[0] + (c[1] - R.y) * fn[1]); if (dep >= 0) out.push({ x: c[0], y: c[1], d: dep });
  });
  return out.length ? { nx, ny, pts: out } : null;
}
function phStep(h) {
  const B = PH.b;
  for (const b of B) { if (b.asleep) continue; b.vy += PH.g * h; b.vx *= .999; b.va *= .995; }
  const C = [];
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], c = B[j]; if (a.ghost || c.ghost || (a.asleep && c.asleep)) continue;
    const ra = Math.hypot(a.hw, a.hh), rc = Math.hypot(c.hw, c.hh); if (!a.fixed && !c.fixed && (Math.abs(a.x - c.x) > ra + rc || Math.abs(a.y - c.y) > ra + rc)) continue;
    const m = phHits(a, c); if (!m) continue;
    const fast = q => !q.asleep && !q.fixed && Math.hypot(q.vx, q.vy) > 60;
    if (fast(a)) { c.asleep = c.fixed; c.still = 0; } if (fast(c)) { a.asleep = a.fixed; a.still = 0; }
    for (const p of m.pts) {
      const rax = p.x - a.x, ray = p.y - a.y, rcx = p.x - c.x, rcy = p.y - c.y, rn1 = rax * m.ny - ray * m.nx, rn2 = rcx * m.ny - rcy * m.nx;
      const tx = -m.ny, ty = m.nx, rt1 = rax * ty - ray * tx, rt2 = rcx * ty - rcy * tx;
      C.push({ a, c, nx: m.nx, ny: m.ny, tx, ty, rax, ray, rcx, rcy, mn: 1 / (a.im + c.im + a.iI * rn1 * rn1 + c.iI * rn2 * rn2), mt: 1 / (a.im + c.im + a.iI * rt1 * rt1 + c.iI * rt2 * rt2), bias: .22 / h * Math.max(0, p.d - .6), jn: 0, jt: 0 });
    }
  }
  for (let it = 0; it < 10; it++) for (const k of C) {
    const { a, c } = k, dvx = c.vx - c.va * k.rcy - a.vx + a.va * k.ray, dvy = c.vy + c.va * k.rcx - a.vy - a.va * k.rax;
    const vn = dvx * k.nx + dvy * k.ny; let dj = k.mn * (-vn + k.bias), nj = Math.max(k.jn + dj, 0); dj = nj - k.jn; k.jn = nj;
    let ix = dj * k.nx, iy = dj * k.ny;
    const vt = dvx * k.tx + dvy * k.ty, lim = .55 * k.jn; let tj = k.mt * -vt, tn = clamp(k.jt + tj, -lim, lim); tj = tn - k.jt; k.jt = tn;
    ix += tj * k.tx; iy += tj * k.ty;
    a.vx -= ix * a.im; a.vy -= iy * a.im; a.va -= a.iI * (k.rax * iy - k.ray * ix); c.vx += ix * c.im; c.vy += iy * c.im; c.va += c.iI * (k.rcx * iy - k.rcy * ix);
  }
  for (const b of B) {
    if (b.asleep) { b.vx = b.vy = b.va = 0; continue; }
    b.x += b.vx * h; b.y += b.vy * h; b.a += b.va * h;
    if (!b.ghost && !b.drag && Math.hypot(b.vx, b.vy) < 14 && Math.abs(b.va) < .25) { if (++b.still > 45) { b.asleep = true; b.vx = b.vy = b.va = 0; } } else b.still = 0;
  }
}
/* Плохой сайт. Всё выдумано нарочно: это пародия на шаблон, компании нет. Порядок в списке это порядок падения */
/* Плохой сайт — шаблон кофейни «как у всех»: та же кофейня, что дальше в примерах, только до ZERNO. Фото чашки стоковое. */
const JUNK_W = () => [
  ['fade', 0, 58, 1440, 800, '', { ghost: 1 }],
  ['j-modal', 470, 150, 500, 250, '<i class="j-x">×</i><b>Подпишитесь на рассылку!</b><p>И получите второй капучино в подарок. Только для новых гостей!</p><span class="j-in">Ваш e-mail</span><span class="j-btn j-red">ПОЛУЧИТЬ КОФЕ</span>'],
  ['j-cookie', 40, 700, 560, 56, 'Мы используем файлы cookie <span class="j-btn j-mini">Принять</span>'],
  ['j-chat', 1120, 540, 280, 170, '<b>Онлайн-бариста</b><p>Здравствуйте! Какой кофе вам посоветовать?</p><span class="j-in">Введите сообщение…</span>'],
  ['j-call', 1340, 440, 84, 84, '<i>☎</i>'],
  ['j-rib', 0, 270, 50, 190, 'ПОДАРОК'],
  ['j-star', 1120, 180, 170, 170, '<b>−50%</b><span>на второй<br>кофе</span>'],
  ['j-pic', 950, 190, 220, 254, `<img src="${window.GT_IMG ? GT_IMG.j_kofe : ''}" alt="">`],
  ['j-count', 410, 462, 620, 40, 'Только сегодня! До конца акции <b>00:14:59</b>'],
  ['j-btn j-big', 150, 392, 220, 46, 'Смотреть меню'],
  ['j-card', 90, 520, 300, 150, '<i>★</i><b>Лучший кофе в городе</b><span>Свежая обжарка</span>'], ['j-card', 400, 520, 300, 150, '<i>◆</i><b>Уютная атмосфера</b><span>Бесплатный Wi-Fi</span>'],
  ['j-card', 710, 520, 300, 150, '<i>✔</i><b>Лучшие цены</b><span>Кофе с собой</span>'],
  ...['Главная', 'О нас', 'Меню', 'Акции', 'Доставка', 'Отзывы', 'Контакты'].map((t, i) => ['j-nav', 100 + i * 178, 130, 160, 36, t]),
  ['j-tel', 880, 72, 240, 40, '8 (000) 000-00-00'], ['j-btn j-green', 1130, 72, 200, 42, 'Заказать звонок'], ['j-logo', 100, 66, 340, 54, '<b>ВАША КОФЕЙНЯ</b><span>Кофе с душой</span>'],
  ['j-head', 150, 210, 800, 170, 'Заезженный дизайн, как у всех!', { ghost: 1 }], ['j-hero', 90, 176, 1260, 276, '', { ghost: 1 }], ['j-bar', 0, 124, 1440, 48, '', { ghost: 1 }]
];
const JUNK_N = () => [
  ['fade', 0, 54, 390, 900, '', { ghost: 1 }],
  ['j-modal', 28, 130, 334, 232, '<i class="j-x">×</i><b>Подпишитесь на рассылку!</b><p>И получите второй капучино в подарок!</p><span class="j-in">Ваш e-mail</span><span class="j-btn j-red">ПОЛУЧИТЬ КОФЕ</span>'],
  ['j-cookie', 12, 590, 366, 50, 'Мы используем cookie <span class="j-btn j-mini">Принять</span>'],
  ['j-call', 306, 500, 66, 66, '<i>☎</i>'], ['j-star', 262, 116, 112, 112, '<b>−50%</b><span>на второй<br>кофе</span>'], ['j-pic', 206, 244, 168, 70, `<img src="${window.GT_IMG ? GT_IMG.j_kofe : ''}" alt="">`],
  ['j-count', 12, 318, 366, 36, 'До конца акции <b>00:14:59</b>'], ['j-btn j-big', 24, 262, 170, 42, 'Смотреть меню'],
  ['j-card', 12, 362, 178, 104, '<i>★</i><b>Лучший кофе в городе</b>'], ['j-card', 200, 362, 178, 104, '<i>◆</i><b>Уютная атмосфера</b>'],
  ['j-card', 12, 474, 178, 104, '<i>✔</i><b>Лучшие цены</b>'], ['j-card', 200, 474, 100, 104, '<i>♥</i><b>Кофе с собой</b>'],
  ['j-logo', 12, 58, 240, 46, '<b>ВАША КОФЕЙНЯ</b><span>Кофе с душой</span>'], ['j-btn j-green', 262, 62, 116, 36, 'Звонок'],
  ['j-head', 24, 126, 240, 130, 'Заезженный дизайн, как у всех!', { ghost: 1 }], ['j-hero', 0, 108, 390, 206, '', { ghost: 1 }]
];
/* sig: как поймался плохой сайт (1 — стоит целым), cov: сколько его полос пробилось сквозь шум, pop: сколько секунд он стоит целым,
   tx: его тексты, tvt: такт помех, roll: на сколько уползли полосы */
const J = { built: false, on: false, k: 0, hold: 0, p: [], floor: 0, clean: false, alpha: 0, drag: null, done: false, sig: 0, cov: 0, pop: 0, tx: [], tvt: 0, roll: 0 };
/* Полосы сигнала: картинка сайта пробивается сквозь шум полосами разной высоты. У каждой полосы свой порог r: она видна, когда сигнал выше порога.
   Пока сигнал слабый, полосы мигают и ползут по экрану, как кадр у телевизора без синхронизации. */
const BANDS = (() => { const b = [], f = v => v - Math.floor(v); let y = 0, i = 0; while (y < 2400) { const h = Math.round(6 + 58 * f(Math.sin(i * 12.9898) * 43758.5453) ** 2); b.push({ y, h, r: f(Math.sin(i * 78.233 + 4.1) * 12345.6789) }); y += h; i++; } return { b, H: y }; })();
function junkBands(box, cv) {
  const st = box.style;
  if (cv >= .999) { if (st.maskImage || st.webkitMaskImage) st.maskImage = st.webkitMaskImage = ''; return; }
  const g = BANDS.b.map(b => { const a = clamp((cv - b.r * .95) * 6 + (Math.random() - .5) * .8 * (1 - cv)).toFixed(2); return `rgba(0,0,0,${a}) ${b.y}px,rgba(0,0,0,${a}) ${b.y + b.h}px`; }).join(',');
  st.maskImage = st.webkitMaskImage = `linear-gradient(${g})`; st.maskSize = st.webkitMaskSize = `100% ${BANDS.H}px`; st.maskRepeat = st.webkitMaskRepeat = 'repeat-y';
}
/* Помехи плохого сайта: полосы страницы сдвигаются вбок на разное расстояние, красный канал отстаёт.
   Шум идёт только по высоте и ступенями, поэтому полосы горизонтальные и с ровными краями, как у телевизора при настройке. */
const TV = (() => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
  s.innerHTML = '<filter id="j-tv" x="-10%" y="0" width="120%" height="100%" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0 0.022" numOctaves="1" seed="1" result="n"/>'
    + '<feComponentTransfer in="n" result="m"><feFuncR type="discrete" tableValues=".5 .5 .2 .5 .74 .5 .5 .9 .36 .5 .5 .12 .62 .5"/><feFuncG type="linear" slope="0" intercept=".5"/></feComponentTransfer>'
    + '<feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>'
    + '<feColorMatrix in="d" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r0"/><feOffset in="r0" dx="0" result="r"/>'
    + '<feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="gb"/>'
    + '<feComposite in="r" in2="gb" operator="arithmetic" k2="1" k3="1"/></filter>';
  document.body.appendChild(s);
  return { t: s.querySelector('feTurbulence'), d: s.querySelector('feDisplacementMap'), o: s.querySelector('feOffset') };
})();
/* Буквы плохого сайта перебираются из шума, как название станции: чем лучше сигнал, тем больше букв встало на место. На sig = 1 тексты целые. */
function junkText(sig) {
  J.tx.forEach((o, k) => {
    let s = o.t;
    if (sig < 1) { s = ''; for (let i = 0; i < o.t.length; i++) { const c = o.t[i], th = ((i * 37 + k * 11) % 100) / 100; s += c === ' ' || sig > th * .9 + .05 ? c : GLY[Math.floor(Math.random() * GLY.length)]; } }
    if (o.n.nodeValue !== s) o.n.nodeValue = s;
  });
}
/* Плохой сайт ловится, как станция: сначала сквозь шум пробиваются редкие полосы картинки, их становится всё больше (cov).
   Пока сигнал слабый, полосы рвутся вбок, страница мигает, буквы перебираются (sig). Помехи меняются 20 раз в секунду. */
function junkTv(dt, box) {
  const k = 1 - J.sig;
  if (k < .002) { if (box.style.filter) { box.style.filter = ''; junkText(1); } junkBands(box, 1); box.style.opacity = J.alpha; return; }
  J.tvt += dt; J.roll = (J.roll + dt * 240 * (1 - J.cov)) % BANDS.H;
  if (J.tvt > .05 || !box.style.filter) { J.tvt = 0; TV.t.setAttribute('seed', 1 + Math.floor(Math.random() * 997)); junkText(J.sig); junkBands(box, J.cov); box.style.opacity = J.alpha * (1 - .3 * k * Math.random()); }
  if (box.style.maskImage || box.style.webkitMaskImage) box.style.maskPosition = box.style.webkitMaskPosition = `0 ${(-J.roll).toFixed(1)}px`;
  TV.d.setAttribute('scale', (260 * Math.pow(k, 1.3)).toFixed(1)); TV.o.setAttribute('dx', (10 * k).toFixed(1));
  box.style.filter = 'url(#j-tv)';
}
/* Сайт встал целым — через четверть секунды выскакивает окно подписки с отскоком, подложка под ним темнеет.
   Подложка не падает вместе с обломками, а гаснет на месте (junkFall, junkDraw). */
function junkPop() {
  const k = RM ? 1 : sstep(.25, .6, J.pop), o = k - 1, b = 1 + 2.7 * o * o * o + 1.7 * o * o;
  for (const p of J.p) {
    if (p.body) continue;
    if (p.e.classList.contains('j-modal')) { p.e.style.opacity = k; p.e.style.transform = `translate(${p.hx - p.pw / 2}px,${p.hy - p.ph / 2}px) scale(${.7 + .3 * b})`; }
    else if (p.still) p.e.style.opacity = RM ? 1 : sstep(.2, .55, J.pop);
  }
}
function junkFloor() { return $('#air-foot').getBoundingClientRect().top - $('#klienty').getBoundingClientRect().top; }
function junkBuild() {
  const box = $('#junk'), W = innerWidth, wide = W > 760, F = junkFloor(), list = wide ? JUNK_W() : JUNK_N(), u = wide ? Math.min(W / 1440, F / 770) : Math.min(W / 390, F / 650), ox = wide ? (W - 1440 * u) / 2 : (W - 390 * u) / 2;
  box.style.setProperty('--u', u + 'px'); box.querySelectorAll('.jp').forEach(e => e.remove());
  const sheet = $('#j-sheet'); sheet.style.height = F + 'px';
  J.floor = F; J.shrink = wide ? .54 : .46;
  J.p = list.map(([cls, x, y, w, h, html, o = {}], i) => {
    const e = document.createElement('div'); e.className = 'jp ' + cls; e.innerHTML = html; e.style.zIndex = 100 - i;
    const full = cls === 'fade' || cls === 'j-bar', pw = full ? W : w * u, ph = cls === 'fade' ? F : h * u, hx = full ? W / 2 : ox + x * u + pw / 2, hy = cls === 'fade' ? F / 2 : y * u + ph / 2; e.style.width = pw + 'px'; e.style.height = ph + 'px';
    e.style.transform = `translate(${hx - pw / 2}px,${hy - ph / 2}px)`; box.appendChild(e);
    return { e, hx, hy, pw, ph, ghost: !!o.ghost, still: cls === 'fade', thr: .03 + .78 * i / (list.length - 1), body: null, s: 1 };
  });
  J.tx = []; const tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) if (tw.currentNode.nodeValue.trim()) J.tx.push({ n: tw.currentNode, t: tw.currentNode.nodeValue });
  PH.b = []; [[W / 2, F + 200, W + 800, 400], [-200, F / 2, 400, 2 * F + 800], [W + 200, F / 2, 400, 2 * F + 800], [W / 2, -200, W + 800, 400]].forEach(([x, y, w, h]) => PH.b.push(phBody(x, y, w, h, true)));
  J.built = true; J.k = 0; J.hold = 0; J.pop = 0; J.clean = false; $('#klienty').classList.remove('clean', 'junk', 'junk2'); sheet.classList.remove('drop');
}
function junkFall(p, seed) {
  const s = p.ghost ? 1 : J.shrink, b = phBody(p.hx, p.hy, p.pw * s, p.ph * s); b.ghost = p.ghost; p.s = s; p.body = b;
  b.vx = (seed - .5) * 260; b.vy = -60 - seed * 120; b.va = (seed - .5) * 3.2; PH.b.push(b); b.p = p;
  if (p.e.classList.contains('fade')) p.e.style.opacity = 0; else if (!p.ghost) p.e.classList.add('fell');
  p.e.classList.remove('back');
  /* обломки задевают круг с телефоном: он раскручивается и потом крутится ровно, не останавливаясь */
  if (p.e.classList.contains('j-call') && !p.spin) p.spin = { a: 0, v: 9 };
}
function junkBack(p) { if (p.spin) { p.spin = null; p.e.firstChild.style.transform = ''; } PH.b.splice(PH.b.indexOf(p.body), 1); p.body = null; p.s = 1; p.e.classList.remove('fell'); p.e.classList.add('back'); if (p.e.classList.contains('fade')) p.e.style.opacity = ''; p.e.style.transform = `translate(${p.hx - p.pw / 2}px,${p.hy - p.ph / 2}px)`; }
function junkDraw() { for (const p of J.p) { const b = p.body; if (!b || b.asleep && b.drawn || p.still) continue; p.e.style.transform = `translate(${b.x - p.pw / 2}px,${b.y - p.ph / 2}px) rotate(${b.a}rad) scale(${p.s})`; b.drawn = b.asleep; } }
function junkSim(dt) { PH.acc = Math.min(.05, PH.acc + dt); while (PH.acc >= PH.tick) { phStep(PH.tick); PH.acc -= PH.tick; } for (let i = PH.b.length - 1; i >= 4; i--) { const b = PH.b[i]; if (b.ghost && b.y - Math.hypot(b.hw, b.hh) > J.floor + 900) { b.asleep = true; } } }
function junkNow() { J.p.forEach((p, i) => { if (!p.body) junkFall(p, ((i * 37) % 100) / 100); }); for (let i = 0; i < 420; i++) phStep(PH.tick); junkDraw(); J.k = 1; }
/* side: ручка правее «Сайта» (больше нуля) или левее. Развалившийся сайт не собирается, когда ручка уходит вправо к следующим станциям,
   и при возвращении справа сразу лежит кучей. Собирается он только при повороте ручки назад, левее «Сайта». */
function junkStep(dt, d, side = 0) {
  const box = $('#junk'), W = $('#klienty'), near = d < 9;
  if (!near) { if (J.on) { J.on = false; box.style.display = 'none'; box.style.filter = ''; junkBands(box, 1); J.built = false; J.sig = J.cov = J.pop = 0; W.style.removeProperty('--jt'); PH.b = []; W.classList.remove('clean', 'junk', 'junk2'); $('#j-sheet').classList.remove('drop'); } return false; }
  if (!J.on) {
    J.on = true; box.style.display = 'block'; if (!J.built) junkBuild();
    if (RM || (J.done && side > 0)) { junkNow(); J.clean = true; $('#j-sheet').classList.add('drop'); W.classList.add('clean'); }
  }
  /* Сначала сайт ловится: ручка в 9–5 от станции, полосы картинки пробиваются сквозь шум к 5,8, буквы и полосы встают на место к 5.
     Потом сайт стоит целым и выскакивает окно подписки, и только через секунду после этого ручка ближе 4,4 валит его.
     Пока сайт валится, он пойман целиком. */
  const got = RM || J.k > .02;
  J.sig = got ? 1 : sstep(9, 5, d); J.cov = got ? 1 : sstep(9, 5.8, d); J.alpha = sstep(9, 7.2, d);
  junkTv(dt, box);
  J.pop = J.sig >= 1 ? J.pop + dt : Math.max(0, J.pop - 3 * dt);
  junkPop();
  let want = J.pop > 1.1 ? sstep(4.4, 1.6, d) : 0;
  if (side > 0) want = Math.max(want, J.k);
  if (!RM) J.k += clamp(want - J.k, -2 * dt, .56 * dt); else J.k = want > 0 || d < 8 ? 1 : J.k;
  J.p.forEach((p, i) => { if (!p.body && J.k > p.thr) junkFall(p, ((i * 37) % 100) / 100); else if (p.body && J.k < p.thr - .02 && !RM) junkBack(p); });
  if (!RM) { junkSim(dt); junkDraw(); }
  for (const p of J.p) if (p.spin && !RM) { p.spin.v = lerp(p.spin.v, 2.2, clamp(dt * .6)); p.spin.a += p.spin.v * dt; p.e.firstChild.style.transform = `rotate(${p.spin.a}rad)`; }
  if (J.k > .84) J.done = true; else if (J.k < .02) J.done = false;
  const clean = J.k > .84; if (clean !== J.clean) { J.clean = clean; $('#j-sheet').classList.toggle('drop', clean); W.classList.toggle('clean', clean); }
  /* надпись станции гаснет, пока полосы сайта закрывают шум (--jt), шапка мира темнеет, когда сайт закрыл экран наполовину */
  const seen = J.alpha * J.cov;
  W.classList.toggle('junk', J.alpha > .02 && !clean); W.classList.toggle('junk2', seen > .75 && !clean);
  W.style.setProperty('--jt', (1 - sstep(.2, .7, seen)).toFixed(3));
  return seen > .55 && !clean;
}
/* где сейчас телефон в куче, в координатах #klienty: от него идёт волна сетки после развала */
function junkCall() {
  const p = J.p.find(q => q.e.classList.contains('j-call')); if (!p) return null;
  const r = p.e.getBoundingClientRect(), k = $('#klienty').getBoundingClientRect();
  return [r.left + r.width / 2 - k.left, r.top + r.height / 2 - k.top];
}
/* обломки можно хватать и бросать */
function junkPointer() {
  const box = $('#junk'); let drag = null, tx = 0, ty = 0, raf = 0;
  const pull = () => { if (!drag) return; const b = drag, dx = tx - (b.x + Math.cos(b.a) * b.lx - Math.sin(b.a) * b.ly), dy = ty - (b.y + Math.sin(b.a) * b.lx + Math.cos(b.a) * b.ly); b.vx = clamp(dx * 14, -1800, 1800); b.vy = clamp(dy * 14, -1800, 1800); b.va *= .86; b.asleep = false; b.still = 0; raf = requestAnimationFrame(pull); };
  box.addEventListener('pointerdown', e => {
    const el = e.target.closest('.fell'); if (!el) return; const p = J.p.find(q => q.e === el); if (!p || !p.body) return;
    e.preventDefault(); const b = p.body, rx = e.clientX - b.x, ry = e.clientY - b.y, c = Math.cos(-b.a), s = Math.sin(-b.a); b.lx = c * rx - s * ry; b.ly = s * rx + c * ry; b.drag = true; drag = b; tx = e.clientX; ty = e.clientY; el.classList.add('held'); el.setPointerCapture(e.pointerId); cancelAnimationFrame(raf); pull();
  });
  box.addEventListener('pointermove', e => { if (drag) { tx = e.clientX; ty = e.clientY; } });
  const end = () => { if (!drag) return; drag.drag = false; drag.p.e.classList.remove('held'); drag = null; };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  addEventListener('resize', () => { if (!J.on) return; const was = J.clean; J.built = false; junkBuild(); if (was || RM) { junkNow(); J.clean = true; $('#j-sheet').classList.add('drop'); $('#klienty').classList.add('clean'); } });
}
junkPointer();

/* ---------- Разговор ---------- */
const talk = $('#talk');
function openTalk(topic) {
  $('#talk-f').hidden = false; $('#talk-done').hidden = true; $('#t-contact-e').hidden = true; $('#t-what').value = topic || ''; $('#t-contact').value = '';
  if (talk.showModal) talk.showModal(); else talk.setAttribute('open', '');
  $('#t-what').focus();
}
$('#contact-open').addEventListener('click', () => openTalk(''));
if (window.GTSAYT) GTSAYT.onTalk = () => openTalk(ST[0].full);
if (window.GTREK) GTREK.onTalk = () => openTalk(ST[1].full);
if (window.GTSMM) GTSMM.onTalk = () => openTalk(ST[2].full);
if (window.GTBRD) GTBRD.onTalk = () => openTalk(ST[3].full);
$('#talk-x').addEventListener('click', () => talk.close());
$('#talk-f').addEventListener('submit', e => {
  e.preventDefault(); const c = !$('#t-contact').value.trim(); $('#t-contact-e').hidden = !c; if (c) { $('#t-contact').focus(); return; }
  $('#talk-f').hidden = true; $('#talk-done').hidden = false;
});

/* ---------- Цикл ---------- */
let last = performance.now(), T0 = last, acc = 0, cnt = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; const time = (now - T0) / 1000;
  if (!document.hidden) {
    if (world === 'home') { updateHome(RM ? 0 : dt); if (!RM || dirty) drawHome(RM ? 2 : time); }
    else if (world === 'klienty') { updateAir(dt); const drew = !RM || dirty; if (drew) drawAir(RM ? 2 : time); }
    dirty = false;
    if (!RM && gl && !window.__fixed) { acc += now - (frame.p || now); cnt++; frame.p = now; if (cnt > 40) { const ms = acc / cnt; acc = 0; cnt = 0; if (ms > 34 && scale > .6) { scale = Math.max(.6, scale * .8); resize(); } } }
  }
  requestAnimationFrame(frame);
}
resize();
const h0 = (location.hash || '').slice(1);
const dm = h0.match(/^([a-z]+)(?:-(\d+))?$/), dv = dm && VAC.find(V => V.id === dm[1]);
if (dv) { S.deep = { id: dv.id, n: dm[2] ? dm[2] - 1 : null }; show('rabota'); }
else if (h0 === 'obyavlenie') { show('lyudi'); myReveal(); }
else if (['rabota', 'lyudi', 'klienty'].includes(h0)) show(h0);
else show('home');
window.__gt = { objSet, hi() { window.__fixed = 1; scale = 1.5; resize(); }, LP, vacOpen, vacClose, go, show, S, air, pick, earth: () => earthReady };
requestAnimationFrame(frame);
})();
