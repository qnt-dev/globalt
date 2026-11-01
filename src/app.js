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
uniform float Q,W0;uniform vec3 C;
void main(){
  float mn=min(R.x,R.y);vec2 uv=gl_FragCoord.xy/R;vec2 p=(gl_FragCoord.xy-.5*R)/mn;
  float t=floor(T*24.);
  vec2 cell=floor(gl_FragCoord.xy/max(1.,mn/480.));
  float s=hash(cell+t*vec2(3.1,1.7));
  float band=smoothstep(.0,.12,sin(uv.y*7.-T*2.3))*.22+smoothstep(.97,1.,sin(uv.y*90.+T*30.))*.3;
  vec3 stat=vec3(s*.62+band*.55+.06);
  vec3 c=mix(stat,C,smoothstep(.0,1.,Q));
  c=mix(c,stat,(1.-Q)*.85);
  float y0=-.5*R.y/mn+W0;
  float yy=sin(p.x*18.+T*2.6)*.03*smoothstep(.2,1.,Q)+(hash(vec2(floor(gl_FragCoord.x/2.),t))-.5)*.11*(1.-Q);
  float l=smoothstep(.0035,.001,abs(p.y-y0-yy));
  c=mix(c,Q>.5?vec3(0.):vec3(1.),l*.9);
  o=vec4(c,1.);
}`;
/* Большой знак: чёрная форма на фоне белого света. При наведении на слово свет принимает цвет мира. */
const MARK_BASE = `
uniform vec4 A,B;uniform vec2 TL,TH,LP;uniform float MO,BW,FL;uniform vec3 MK,W;uniform vec4 RP[8];uniform vec2 FP;uniform sampler2D SD;
float ell(vec2 p,vec4 e,float t){p-=e.xy;float c=cos(t),s=sin(t);p=vec2(c*p.x+s*p.y,-s*p.x+c*p.y);vec2 r=e.zw;float k0=length(p/r),k1=length(p/(r*r));return k1<1e-4?-min(r.x,r.y):k0*(k0-1.)/k1;}
float field(vec2 p){
  vec2 dm=p-M;float g=exp(-dot(dm,dm)*16.);vec2 q=p+dm*g*MA*PUSH;
  q+=WOB*vec2(sin(q.y*9.+T*.8),cos(q.x*8.-T*.7));
  float d=9.;
  if(A.z>.001)d=abs(ell(q,A,TL.x))-TH.x;
  if(B.z>.001)d=smin(d,abs(ell(q,B,TL.y))-TH.y,.03);
  if(MO>0.){vec2 uv=(q-MK.xy)/MK.z+.5;uv.y=1.-uv.y;
    float s=texture(SD,clamp(uv,.002,.998)).r*MK.z;
    vec2 ov=max(abs(uv-.5)-.498,0.);s+=length(ov)*MK.z;
    d=mix(d,s,MO);}
  return d;
}
float rip(vec2 p){float s=0.;for(int i=0;i<8;i++){vec4 r=RP[i];if(r.w<=.001)continue;float d=length(p-r.xy)-r.z;s+=r.w*sin(d*70.)*exp(-d*d*160.);}return s*.0065;}
float sig(vec2 p,float k){float s=0.;for(int i=0;i<8;i++){vec4 r=RP[i];if(r.w<=.001)continue;float d=length(p-r.xy)-r.z;s+=r.w*exp(-d*d*k);}return s;}
float prof(float d){float w=BW;float x=clamp(-d/w,0.,1.);return w*sqrt(1.-(1.-x)*(1.-x));}
vec3 nrm(vec2 p,float e){float h0=prof(field(p)),hx=prof(field(p+vec2(e,0))),hy=prof(field(p+vec2(0,e)));return normalize(vec3(-(hx-h0)/e,-(hy-h0)/e,1.));}
vec3 wcol(){return W.x*vec3(1.,.36,.04)+W.y*vec3(.3,.5,1.)+W.z*vec3(1.,.2,.06);}
float wamt(){return clamp(W.x+W.y+W.z,0.,1.);}
float gn(vec2 c,float t){uvec2 u=uvec2(c)+uint(t)*uvec2(7919u,104729u);u*=uvec2(1597334677u,3812015801u);uint h=(u.x^u.y)*1597334677u;return float(h)/4294967295.;}
`;
const mark = (defs, main) => COMMON + defs + MARK_BASE + main;
const FS_ECLIPSE = mark('#define PUSH .08\n#define WOB .0008\n', `
void main(){
  float mn=min(R.x,R.y);vec2 p=(gl_FragCoord.xy-.5*R)/mn;float px=1.3/mn;
  float d=field(p),ins=smoothstep(px,-px,d);
  vec3 tint=vec3(1.,.965,.92);float wa=wamt();if(wa>.001)tint=mix(tint,wcol()/wa,wa);
  vec2 sc=mix(FP,MK.xy+vec2(-.004,.01)*MK.z+(LP-MK.xy)*.035,MO);
  float rs=.40*MK.z*MO*MO;vec2 f=p-sc;float x=length(f)/max(rs,.001);
  float I=MO>0.?exp(-x*x*1.55):0.;
  vec2 g=p-FP;I+=FL*exp(-dot(g,g)*90.);
  I=clamp(I,0.,1.);
  float gr=gn(gl_FragCoord.xy,floor(T*14.))-.5;
  vec3 sun=tint*pow(I,1.35)*(1.+gr*.34*(1.-I*.7));
  sun+=tint*.018*smoothstep(1.9,.4,x)*MO;
  vec3 n=nrm(p,1.5/mn);vec2 to=normalize(sc-p+1e-4);
  float rim=pow(max(dot(n.xy,to),0.),1.6)*pow(1.-n.z,.5);
  vec3 body=vec3(.004)+tint*rim*(.7*exp(-length(f)*1.25)+.018);
  body=mix(vec3(.96),body,smoothstep(.05,.6,MO));
  vec3 c=mix(sun+vec3(.004),body,ins);
  c+=sig(p,9000.)*.3*(1.-MO);
  c+=(gn(gl_FragCoord.xy,floor(T*14.)+5.)-.5)*.012;
  o=vec4(c,1.);
}`);
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
if (gl) {
  prog('mark', FS_ECLIPSE); prog('radio', FS_RADIO);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]));
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, f = new Float32Array(c.width * c.height);
    for (let i = 0; i < f.length; i++) f[i] = (((d[i * 4] << 8 | d[i * 4 + 1]) / 65535) - .5) * 2 * .25;
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, c.width, c.height, 0, gl.RED, gl.FLOAT, f); dirty = true; sdfReady = true;
  };
  im.src = window.GT_SDF;
}
let sdfReady = false;
addEventListener('resize', resize);

/* указатель: координаты как в шейдере */
const ptr = { x: 9, y: 9, amp: 0, lx: 0, ly: 0, tr: 0 };
function toP(e) { const m = Math.min(innerWidth, innerHeight); return [(e.clientX - innerWidth / 2) / m, -(e.clientY - innerHeight / 2) / m]; }
addEventListener('pointermove', e => { const [x, y] = toP(e); ptr.x = x; ptr.y = y; ptr.amp = 1; if (RM) dirty = true; });

/* ---------- ПРОЛОГ: история про два поиска ---------- */
const say = $('#say'), hint = $('#hint'), skip = $('#skip');
const S = { phase: 'dark', t: 0, a: { x: 0, y: 0, r: 0 }, b: { x: 0, y: 0, r: 0 }, tl: [0, 0], th: [.0048, .0048], mo: 0, fl: 0, fp: [0, 0], hold: false, rip: [], w: [0, 0, 0], wt: [0, 0, 0], em: 0, from: null, lp: [-.2, .6], clock: 0 };
const LINES = {
  you: 'Это вы. Вы тоже ищете.',
  him: 'А это тот, кто ищет вас. Вы друг друга ещё не видите.',
  hit: 'Вот эта точка.',
  morph: 'В ней работаем мы.'
};
function sayNow(t) { if (!t) { say.classList.add('out'); return; } say.classList.add('out'); setTimeout(() => { say.textContent = t; say.classList.remove('out'); }, RM ? 0 : 280); }
function mkAim() { const land = innerWidth > innerHeight, asp = land ? innerWidth / innerHeight : innerHeight / innerWidth; return land ? { x: asp * .5 - .5, y: .035, z: 1.08 } : { x: 0, y: asp * .5 - .58, z: .74 }; }
function addRip(x, y, a) { S.rip.push({ x, y, r: 0, a }); if (S.rip.length > 8) S.rip.shift(); }
function startYou(x, y) {
  if (S.phase !== 'dark') return;
  S.phase = 'you'; S.a = { x, y, r: .01 }; hint.style.opacity = 0; sayNow(LINES.you); addRip(x, y, .9);
  $('#hint-t').textContent = '';
}
if (matchMedia('(pointer:coarse)').matches) $('#hint-t').textContent = 'Коснитесь и держите';
const home = $('#home');
home.addEventListener('pointerdown', e => {
  if (e.target.closest('a,button') || S.phase === 'choice') return;
  const [x, y] = toP(e); S.hold = true; if (S.phase === 'dark') startYou(x, y); else addRip(x, y, .7);
});
addEventListener('pointerup', () => { S.hold = false; });
addEventListener('keydown', e => {
  if (world === 'home' && S.phase === 'dark' && (e.key === 'Enter' || e.key === ' ') && (document.activeElement === document.body)) { e.preventDefault(); startYou(-.22, -.08); }
  if (e.key === 'Escape' && world === 'rabota' && vacCur && !talk.open) vacClose();
});
function toChoice(fast) {
  S.phase = 'choice'; S.mo = 1; S.a.r = 0; S.b.r = 0; S.th = [.0048, .0048];
  say.classList.add('out'); hint.style.display = 'none'; skip.hidden = true; $('#what').hidden = true;
  $('#choice').classList.add('on'); home.style.cursor = 'default'; home.style.touchAction = 'auto';
  try { sessionStorage.setItem('gt-seen', '1'); } catch (e) {}
  dirty = true;
}
skip.addEventListener('click', e => { e.stopPropagation(); beginMorph(); });
function beginMorph() {
  if (S.phase === 'morph' || S.phase === 'choice') return;
  if (S.a.r < .02) { S.a = { x: -.24, y: -.08, r: .3 }; S.b = { x: .28, y: .12, r: .3 }; }
  if (S.b.r < .02) { S.b = { x: -S.a.x * .9, y: -S.a.y * .9 + .05, r: .24 }; }
  S.phase = 'morph'; S.t = 0; S.from = { ax: S.a.x, ay: S.a.y, ar: S.a.r, bx: S.b.x, by: S.b.y, br: S.b.r }; sayNow(LINES.morph); hint.style.opacity = 0; skip.hidden = true;
}
function updateHome(dt) {
  S.t += dt;
  const aim = mkAim();
  ptr.amp = Math.max(0, ptr.amp - dt * .75);
  if (S.phase === 'dark' && S.t > 5.5) startYou(-.22, -.08);
  if (S.phase === 'you' || S.phase === 'him') {
    S.a.r += dt * (S.hold ? .135 : .085);
    S.em += dt; if (S.em > .55) { S.em = 0; addRip(S.a.x, S.a.y, .45); if (S.b.r > 0) addRip(S.b.x, S.b.y, .45); }
  }
  if (S.phase === 'you' && S.a.r > .17) {
    const land = innerWidth > innerHeight, asp = Math.max(innerWidth, innerHeight) / Math.min(innerWidth, innerHeight), ex = land ? asp * .5 - .2 : .3, ey = land ? .3 : asp * .5 - .22;
    S.b = { x: clamp(-S.a.x * 1.1 + .1, -ex, ex), y: clamp(-S.a.y * 1.1 + .12, -ey, ey), r: .006 };
    S.phase = 'him'; sayNow(LINES.him); addRip(S.b.x, S.b.y, .9);
  }
  if (S.phase === 'him') {
    S.b.r += dt * .125;
    const dx = S.b.x - S.a.x, dy = S.b.y - S.a.y, L = Math.hypot(dx, dy) || 1;
    if (L <= S.a.r + S.b.r) {
      S.phase = 'hit'; S.t = 0; const k = S.a.r / L;
      S.fp = [S.a.x + dx * k, S.a.y + dy * k]; S.fl = 1.5; addRip(S.fp[0], S.fp[1], 1.4); sayNow(LINES.hit); skip.hidden = true;
    }
  }
  if (S.phase === 'hit') {
    S.a.r += dt * .02; S.b.r += dt * .02; S.th[0] = lerp(S.th[0], .006, dt * 2); S.th[1] = lerp(S.th[1], .006, dt * 2);
    if (S.t > 1.75) beginMorph();
  }
  if (S.phase === 'morph') {
    const k = clamp(S.t / 2.6), e = k * k * (3 - 2 * k), F = S.from;
    S.a.x = lerp(F.ax, aim.x, e); S.a.y = lerp(F.ay, aim.y + .02, e); S.a.r = lerp(F.ar, .36, e);
    S.b.x = lerp(F.bx, aim.x, e); S.b.y = lerp(F.by, aim.y - .03, e); S.b.r = lerp(F.br, .3, e);
    S.tl = [lerp(0, -.1, e), lerp(0, .85, e)]; S.th = [lerp(.005, .02, e), lerp(.005, .012, e)];
    S.mo = sstep(.45, 1, k);
    S.fp = [lerp(S.fp[0], aim.x - .03 * aim.z, dt * 3), lerp(S.fp[1], aim.y + .16 * aim.z, dt * 3)];
    if (k > .86 && S.fl < .4 && !S.flashed) { S.flashed = 1; S.fl = 1.1; S.fp = [aim.x - .022 * aim.z, aim.y + .155 * aim.z]; }
    if (k >= 1) toChoice();
  }
  S.fl = Math.max(0, S.fl - dt * (S.phase === 'hit' ? .9 : 1.25));
  S.rip.forEach(r => { r.r += dt * .34; r.a *= Math.pow(.42, dt); });
  S.rip = S.rip.filter(r => r.a > .01);
  if (ptr.tr > 0) ptr.tr -= dt;
  if (ptr.tr <= 0 && (Math.hypot(ptr.x - ptr.lx, ptr.y - ptr.ly) > .045) && ptr.x < 9) { addRip(ptr.x, ptr.y, .2); ptr.lx = ptr.x; ptr.ly = ptr.y; ptr.tr = .12; }
  for (let i = 0; i < 3; i++) S.w[i] = lerp(S.w[i], S.wt[i], clamp(dt * 3.5));
  S.clock += dt;
  const lx = ptr.amp > .02 ? ptr.x : aim.x + Math.cos(S.clock * .23 + 2.2) * .5 * aim.z, ly = ptr.amp > .02 ? ptr.y : aim.y + Math.sin(S.clock * .23 + 2.2) * .5 * aim.z;
  S.lp[0] = lerp(S.lp[0], lx, clamp(dt * 1.6)); S.lp[1] = lerp(S.lp[1], ly, clamp(dt * 1.6));
}
function drawHome(time) {
  if (!gl) return;
  const { p, u } = P.mark, aim = mkAim(); gl.useProgram(p); gl.uniform2f(u.LP, S.lp[0], S.lp[1]);
  gl.uniform2f(u.R, cv.width, cv.height); gl.uniform1f(u.T, time); gl.uniform2f(u.M, ptr.x, ptr.y); gl.uniform1f(u.MA, ptr.amp);
  gl.uniform4f(u.A, S.a.x, S.a.y, S.a.r, S.phase === 'morph' ? lerp(S.a.r, .21, S.mo) : S.a.r);
  gl.uniform4f(u.B, S.b.x, S.b.y, S.b.r, S.phase === 'morph' ? lerp(S.b.r, .17, S.mo) : S.b.r);
  gl.uniform2f(u.TL, S.tl[0], S.tl[1]); gl.uniform2f(u.TH, S.th[0], S.th[1]);
  gl.uniform1f(u.BW, lerp(.011, .042, S.mo)); gl.uniform1f(u.MO, sdfReady ? S.mo : 0); gl.uniform3f(u.MK, aim.x, aim.y, aim.z);
  const r = new Float32Array(32); S.rip.forEach((x, i) => { r.set([x.x, x.y, x.r, x.a], i * 4); }); gl.uniform4fv(u.RP, r);
  gl.uniform3f(u.W, S.w[0], S.w[1], S.w[2]); gl.uniform1f(u.FL, S.fl); gl.uniform2f(u.FP, S.fp[0], S.fp[1]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
$$('.pick').forEach(a => {
  const i = +a.dataset.t, on = () => { if (world !== 'home') return; S.wt = [0, 0, 0]; S.wt[i] = 1; dirty = true; if (RM) S.w = S.wt.slice(); }, off = () => { if (world !== 'home') return; S.wt = [0, 0, 0]; dirty = true; if (RM) S.w = [0, 0, 0]; };
  a.addEventListener('pointerenter', on); a.addEventListener('focus', on); a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
});

/* ---------- Переход сквозь звезду ---------- */
const WC = { home: '#000', rabota: '#000', lyudi: '#fff', klienty: '#6f6f6f' }, WF = { home: '#000', rabota: '#ff5c0a', lyudi: '#fff', klienty: '#6f6f6f' };
const wipe = $('#wipe'), wp = $('#wipe-p');
let busy = false, lastClick = [innerWidth / 2, innerHeight / 2];
addEventListener('pointerdown', e => { lastClick = [e.clientX, e.clientY]; }, true);
function show(w) {
  $$('.world').forEach(s => { s.hidden = s.id !== w; });
  world = w; document.body.dataset.w = w; document.body.classList.remove('ink', 'barhide'); document.body.classList.toggle('ink', w === 'lyudi'); document.body.style.background = WC[w];
  cv.style.display = gl && (w === 'home' || w === 'klienty') ? 'block' : 'none';
  $$('#nav a').forEach(a => { if (a.dataset.go === w) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  try { history.replaceState(null, '', w === 'home' ? '#top' : '#' + w); } catch (e) {}
  if (w === 'rabota') enterWork(); if (w === 'lyudi') enterPeople(); if (w === 'klienty') enterAir(); if (w === 'home') { $('#home').scrollTop = 0; }
  S.wt = [0, 0, 0]; S.w = [0, 0, 0];
  dirty = true;
}
function go(w) {
  if (busy) return; if (w === world) { if (w === 'rabota') { if (vacCur) vacClose(); } if (w === 'lyudi') ly.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
  if (w === 'home' && S.phase !== 'choice') toChoice();
  if (RM) { show(w); return; }
  busy = true; wipe.style.display = 'block'; wipe.style.opacity = 1; wp.setAttribute('fill', WF[w]);
  const vb = Math.max(innerWidth, innerHeight) / 2, cx = (lastClick[0] - innerWidth / 2) / vb, cy = (lastClick[1] - innerHeight / 2) / vb;
  const t0 = performance.now(), D = 820;
  const step = now => {
    const k = clamp((now - t0) / D), e = k * k * k, s = lerp(.001, 11, e), rot = lerp(0, .9, ease(k));
    wp.setAttribute('transform', `translate(${cx * (1 - e)} ${cy * (1 - e)}) rotate(${rot * 57.3}) scale(${s})`);
    if (k < 1) requestAnimationFrame(step); else {
      show(w); const t1 = performance.now();
      const fade = n2 => { const q = clamp((n2 - t1) / 340); wipe.style.opacity = 1 - q; if (q < 1) requestAnimationFrame(fade); else { wipe.style.display = 'none'; busy = false; } };
      requestAnimationFrame(fade);
    }
  };
  requestAnimationFrame(step);
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
  { id: 'upakovshchik', wall: 'Стикеровщик, упаковщик', h: 'h_upak', p: '50% 50%', who: 'Вас ищут посылки.', title: 'Стикеровщик, упаковщик', sum: 'Можно без опыта.', tags: ['noexp', 'pair', 'sit'], words: 'стикер маркиров упаков этикет штрихкод наклейк', does: 'Клеить этикетки и штрихкоды, упаковывать заказы.', reqs: ['Аккуратность', 'Покажем всё на месте'], need: ['Без опыта', 'Покажем всё на месте.'], sites: [[0, 4200], [1, 4000], [3, 3800], [4, 3500], [5, 3300]] },
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
}
function vacClose(now) {
  const j = vacCur; clearTimeout(wallT); vacCur = null; rab.classList.remove('v'); rab.scrollTop = 0; wall.hidden = false;
  try { history.replaceState(null, '', '#rabota'); } catch (e) {}
  void wall.offsetWidth; wall.classList.remove('out');
  const done = () => { jobs.hidden = true; if (j) { j.hidden = true; j.classList.remove('in'); } };
  if (now || RM) done(); else wallT = setTimeout(done, 720);
  $('#q').focus({ preventScroll: true });
}
let barT = 0;
function barScroll() { document.body.classList.add('barhide'); clearTimeout(barT); barT = setTimeout(() => document.body.classList.remove('barhide'), 320); }
function buildJobs() {
  if (jobsBuilt) return; jobsBuilt = true;
  jobs.innerHTML = VAC.map(jobHTML).join(''); buildWall();
  rab.addEventListener('click', e => {
    const t = e.target.closest('[data-to]'); if (t) { vacOpen(t.dataset.to); return; }
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
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const h = $('.w-hit'); if (h) { e.preventDefault(); vacOpen(h.dataset.to); } } });
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
const ST = [
  { wd: 100, v: 12, name: 'Сайт', full: 'Разработка сайта', col: [1, .231, .078], line: 'Человек зашёл и сразу понял, что вы делаете.', get: 'Структура, тексты, дизайн, вёрстка и форма заявки.', need: 'Описание услуг, фотографии, доступ к домену.' },
  { wd: 66, v: 31, name: 'Контекст', full: 'Контекстная реклама', col: [.91, 1, .102], line: 'Человек ввёл запрос, и первыми ответили вы.', get: 'Подбор запросов, объявления, настройка и отчёт.', need: 'Адрес сайта и список услуг.' },
  { wd: 84, v: 50, name: 'Таргет', full: 'Таргетированная реклама', col: [1, .36, .8], line: 'Человек ничего не искал, но это было про него.', get: 'Настройка кампаний, объявления и отчёт.', need: 'Доступ к рекламным кабинетам.' },
  { wd: 120, v: 69, name: 'SMM', full: 'Ведение соцсетей', col: [.208, .949, .608], line: 'Человек зашёл проверить вас, и вам поверили.', get: 'План публикаций, тексты и оформление.', need: 'Человек с вашей стороны, который согласует.' },
  { wd: 100, v: 88, name: 'Бренд', full: 'Брендбук и логотип', col: [.95, .95, .95], line: 'Человек увидел один раз и узнал во второй.', get: 'Логотип, цвета, шрифты, правила и примеры применения.', need: 'Разговор о компании и конкурентах.' }
];
const NOISE = ['Лучшие цены', 'Индивидуальный подход', 'Команда профессионалов', 'Высокое качество', 'Динамично развиваемся', 'Только сегодня', 'Лидер рынка', 'Клиентоориентированность', 'Гарантия результата', 'Комплексные решения', 'Опыт и надёжность', 'Вы не пожалеете'];
const air = { v: 1, target: 1, q: 0, cur: -1, thr: [], snd: null, built: false };
const GLY = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ#%/*+=';
function buildAir() {
  if (air.built) return; air.built = true;
  $('#air-noise').innerHTML = NOISE.map((t, i) => {
    const y = (i * 8.2 + 2) % 92, x = (i * 37) % 70 - 8, fs = 6 + (i * 5) % 9, wd = 50 + (i * 23) % 90;
    return `<span style="left:${x}vw;top:${y}vh;font-size:${fs}vw;--wd:${wd};animation-delay:-${i * .07}s">${t}</span>`;
  }).join('');
  $('#presets').innerHTML = ST.map((s, i) => `<button type="button" style="left:${s.v}%" data-i="${i}" aria-pressed="false" aria-label="${s.full}">${s.name}</button>`).join('');
  $$('#presets button').forEach(b => b.addEventListener('click', () => { const v = ST[+b.dataset.i].v; air.target = v; if (RM) air.v = v; $('#tun').value = v; dirty = true; }));
  const t = $('#tun'); t.addEventListener('input', () => { air.target = +t.value; if (RM) air.v = air.target; dirty = true; });
  $('#klienty').addEventListener('wheel', e => { if (e.target.closest('#st-more')) return; air.target = clamp(air.target + Math.sign(e.deltaY) * 1.2, 0, 100); t.value = air.target; e.preventDefault(); dirty = true; }, { passive: false });
  $('#st-cta').addEventListener('click', () => openTalk(air.cur >= 0 ? ST[air.cur].full : ''));
  $('#sound').addEventListener('click', toggleSound);
}
function enterAir() { buildAir(); air.v = air.target = +$('#tun').value; }
function toggleSound() {
  const b = $('#sound');
  if (air.snd) { air.snd.ctx.close(); air.snd = null; b.textContent = 'Включить звук'; return; }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; const ng = ctx.createGain(); ng.gain.value = .05; n.connect(ng).connect(ctx.destination); n.start();
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 330; const og = ctx.createGain(); og.gain.value = 0; o.connect(og).connect(ctx.destination); o.start();
    air.snd = { ctx, ng, og, o }; b.textContent = 'Выключить звук';
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
  document.body.classList.toggle('ink', q > .55);
  $('#air').style.setProperty('--air', q > .55 ? '#000' : '#fff');
  W.style.setProperty('--air', q > .55 ? '#000' : '#fff');
  $('#air-noise').style.opacity = (1 - q) * .95;
  $('#st-name').style.setProperty('--wd', q > .92 ? (innerWidth <= 760 ? Math.max(50, s.wd * .6) : s.wd) : (innerWidth <= 760 ? 60 : 70));
  if (near) { scramble($('#st-name'), s.name, Math.min(1, q * 1.6), best + 1); scramble($('#st-line'), s.line, q, best + 3); }
  else { if ($('#st-name').textContent !== 'Шум') $('#st-name').textContent = 'Шум'; if ($('#st-line').textContent) $('#st-line').textContent = ''; }
  if (q > .92 && air.cur !== best) {
    air.cur = best; $('#st-get').innerHTML = `<b>${s.full}. Что получите:</b> ${s.get}`; $('#st-need').innerHTML = `<b>Что нужно от вас:</b> ${s.need}`;
    $('#st-name').setAttribute('aria-label', s.full);
    $$('#presets button').forEach((b, i) => b.setAttribute('aria-pressed', i === best));
  }
  if (q <= .92 && air.cur !== -1) { air.cur = -1; $$('#presets button').forEach(b => b.setAttribute('aria-pressed', false)); $('#st-name').removeAttribute('aria-label'); }
  if (air.snd) { const c = air.snd.ctx.currentTime; air.snd.ng.gain.setTargetAtTime((1 - q) * .05, c, .05); air.snd.og.gain.setTargetAtTime(q * .035, c, .05); air.snd.o.frequency.setTargetAtTime(220 + best * 55, c, .05); }
  air.col = s.col;
}
function drawAir(time) {
  if (!gl) return;
  const { p, u } = P.radio; gl.useProgram(p);
  gl.uniform2f(u.R, cv.width, cv.height); gl.uniform1f(u.T, time); gl.uniform1f(u.Q, air.q); gl.uniform1f(u.W0, (innerHeight - $('#air-foot').getBoundingClientRect().top + 36) / Math.min(innerWidth, innerHeight)); gl.uniform3f(u.C, air.col[0], air.col[1], air.col[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ---------- Разговор ---------- */
const talk = $('#talk');
function openTalk(topic) {
  $('#talk-f').hidden = false; $('#talk-done').hidden = true; $('#t-contact-e').hidden = true; $('#t-what').value = topic || ''; $('#t-contact').value = '';
  if (talk.showModal) talk.showModal(); else talk.setAttribute('open', '');
  $('#t-what').focus();
}
$('#contact-open').addEventListener('click', () => openTalk(''));
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
    else if (world === 'klienty') { updateAir(dt); if (!RM || dirty) drawAir(RM ? 2 : time); }
    dirty = false;
    if (!RM && gl && !window.__fixed) { acc += now - (frame.p || now); cnt++; frame.p = now; if (cnt > 40) { const ms = acc / cnt; acc = 0; cnt = 0; if (ms > 34 && scale > .6) { scale = Math.max(.6, scale * .8); resize(); } } }
  }
  requestAnimationFrame(frame);
}
resize();
const h0 = (location.hash || '').slice(1);
const seen = (() => { try { return sessionStorage.getItem('gt-seen'); } catch (e) { return null; } })();
if (RM) { S.mo = 1; toChoice(); }
else if (seen) toChoice();
const dm = h0.match(/^([a-z]+)(?:-(\d+))?$/), dv = dm && VAC.find(V => V.id === dm[1]);
if (dv) { S.deep = { id: dv.id, n: dm[2] ? dm[2] - 1 : null }; toChoice(); show('rabota'); }
else if (h0 === 'obyavlenie') { toChoice(); show('lyudi'); myReveal(); }
else if (['rabota', 'lyudi', 'klienty'].includes(h0)) { toChoice(); show(h0); }
else show('home');
window.__gt = { objSet, hi() { window.__fixed = 1; scale = 1.5; resize(); }, LP, vacOpen, vacClose, go, show, S, air, beginMorph, toChoice };
requestAnimationFrame(frame);
})();
