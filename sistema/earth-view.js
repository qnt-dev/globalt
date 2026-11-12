/* ЗЕМЛЯ МАКЕТА: одна Земля на всех страницах. Шейдер — главной (src/app.js, FS_HOME) с добавками для разделов:
   WV — поворот готовой матрицей (его можно плавно вести кватернионами), LD — солнце, NLC — цвет огней, DIM — приглушение диска,
   CLA — сколько облаков, PF — облака гаснут у полюсов, KC — карта у полюсов не размывается, DMIX — сила чёткого куска карты раздела.
   На главной PF, KC, DMIX = 0, и кадр точно как на сайте. Между страницами камера летит: вид главной → вид раздела и обратно (fly).
   Последний кадр полёта уходит в sessionStorage (gt-bridge), новая страница стоит на нём, пока её Земля не нарисует тот же кадр. */
(() => {
'use strict';
const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 R;uniform float T;
uniform sampler2D DAY,NIGHT,CLOUD,DDAY,DNIGHT;uniform mat3 WV;uniform vec3 LD,NLC;uniform float Z,CY,DIM,CLA,PF,KC,DMIX;uniform vec4 DW;uniform vec2 DH;
const vec3 ATM=vec3(.36,.62,1.);
vec3 C,L;float CR;
vec3 earth(vec2 p,float px,out float cov){
  vec2 q=(p-C.xy)/C.z;float r=length(q),aa=px/C.z;
  vec2 sd=normalize(L.xy+1e-4);float lit=dot(q/max(r,1e-4),sd),side=smoothstep(-.6,.8,lit)*.85+.15;
  float h=max(r-1.,0.)*C.z;
  vec3 c=ATM*(exp(-h/.006)*.75+exp(-h/.028)*.24+exp(-h/.11)*.05)*side;
  cov=smoothstep(1.+aa,1.-aa,r);
  float z=sqrt(max(1.-r*r,0.));vec3 n=vec3(q,z);vec3 g=WV*n;
  float lat=asin(clamp(g.y,-1.,1.)),lon=atan(g.x,g.z);vec2 uv=vec2(lon/6.2831853+.5,.5-lat/3.1415927),uw=vec2(fract(uv.x+.5),uv.y);
  vec2 gx=dFdx(uv),gy=dFdy(uv),wx=dFdx(uw),wy=dFdy(uw);if(abs(wx.x)+abs(wy.x)<abs(gx.x)+abs(gy.x)){gx=wx;gy=wy;}
  float kc=mix(1.,max(cos(lat),.04),KC);gx.x*=kc;gy.x*=kc;
  vec2 du=vec2((lon-DW.x)/(DW.y-DW.x),(DW.w-lat)/(DW.w-DW.z)),dx=dFdx(du),dy=dFdy(du);dx.x*=kc;dy.x*=kc;
  float dw=smoothstep(0.,.04,du.x)*smoothstep(1.,.96,du.x)*smoothstep(0.,.04,du.y)*smoothstep(1.,.96,du.y)*DMIX;
  if(cov>0.){
    vec3 d0=textureGrad(DAY,uv,gx,gy).rgb;if(DH.x>.5&&dw>0.)d0=mix(d0,textureGrad(DDAY,du,dx,dy).rgb,dw);
    vec3 day=pow(d0,vec3(2.2));
    vec2 cu=uv+vec2(CR,0.);float cl=smoothstep(.2,.8,textureGrad(CLOUD,cu,gx,gy).r);
    float pf=mix(1.,1.-smoothstep(1.1,1.35,abs(lat)),PF)*CLA;cl*=pf;
    float csh=smoothstep(.2,.8,textureGrad(CLOUD,cu+vec2(.002,-.0015),gx,gy).r)*pf;
    float ndl=dot(n,L),lam=smoothstep(-.12,.5,ndl)*max(ndl+.12,0.)/1.12;
    float oc=smoothstep(.0,.05,day.b-max(day.r,day.g)*.9);
    vec3 surf=mix(day*(1.-.4*csh*(1.-cl)),vec3(.95),cl*.9);
    vec3 e=surf*lam*1.2+surf*.01;
    vec3 hv=normalize(L+vec3(0,0,1));e+=vec3(1.,.95,.85)*pow(max(dot(n,hv),0.),60.)*oc*(1.-cl)*.5*step(0.,ndl);
    float nl=textureGrad(NIGHT,uv,gx,gy).r;if(DH.y>.5&&dw>0.)nl=mix(nl,textureGrad(DNIGHT,du,dx,dy).r,dw);
    e+=NLC*pow(nl,1.4)*1.1*smoothstep(.08,-.2,ndl)*(1.-cl*.8);
    float dl=(1.-r)*C.z;float hz=exp(-dl/.035)*.85+exp(-dl/.16)*.25;
    e=mix(e,ATM*(.35+.9*smoothstep(-.3,.5,ndl)),clamp(hz,0.,1.)*smoothstep(-.4,.3,ndl+.2));
    c=mix(c,e,cov);
  }
  return c;
}
float gn(vec2 c,float t){uvec2 u=uvec2(c)+uint(t)*uvec2(7919u,104729u);u*=uvec2(1597334677u,3812015801u);uint h=(u.x^u.y)*1597334677u;return float(h)/4294967295.;}
void main(){
  float mn=min(R.x,R.y);vec2 p=(gl_FragCoord.xy-.5*R)/mn;float px=1.3/mn;
  C=vec3(0.,CY,.5*Z);L=normalize(LD);CR=-T*.0006;
  float cov;vec3 e=pow(max(earth(p,px,cov),0.),vec3(1./2.2));
  vec3 c=e*mix(.55,DIM,cov)+.004;
  c+=(gn(gl_FragCoord.xy,floor(T*14.)+5.)-.5)*.012;
  o=vec4(c,1.);
}`;

/* ---------- поворот: та же матрица, что vw() в шейдере главной (GLSL mat3 — по столбцам) ---------- */
const D2R = Math.PI / 180;
const mul = (a, b) => a.map((r, i) => [0, 1, 2].map(j => r[0] * b[0][j] + r[1] * b[1][j] + r[2] * b[2][j]));
function vw(lo, la, rl) {
  lo *= D2R; la *= D2R;
  const cy = Math.cos(lo), sy = Math.sin(lo), cx = Math.cos(la), sx = Math.sin(la), cz = Math.cos(rl), sz = Math.sin(rl);
  return mul(mul([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], [[1, 0, 0], [0, cx, sx], [0, -sx, cx]]), [[cz, sz, 0], [-sz, cz, 0], [0, 0, 1]]);
}
const col = m => new Float32Array([m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
function quat(m) {
  const t = m[0][0] + m[1][1] + m[2][2]; let w, x, y, z;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; w = s / 4; x = (m[2][1] - m[1][2]) / s; y = (m[0][2] - m[2][0]) / s; z = (m[1][0] - m[0][1]) / s; }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; w = (m[2][1] - m[1][2]) / s; x = s / 4; y = (m[0][1] + m[1][0]) / s; z = (m[0][2] + m[2][0]) / s; }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; w = (m[0][2] - m[2][0]) / s; x = (m[0][1] + m[1][0]) / s; y = s / 4; z = (m[1][2] + m[2][1]) / s; }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; w = (m[1][0] - m[0][1]) / s; x = (m[0][2] + m[2][0]) / s; y = (m[1][2] + m[2][1]) / s; z = s / 4; }
  return [w, x, y, z];
}
function qmat([w, x, y, z]) {
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]];
}
function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map(v => -v); d = -d; }
  if (d > .9995) { const r = a.map((v, i) => v + (b[i] - v) * t), l = Math.hypot(...r); return r.map(v => v / l); }
  const th = Math.acos(d), s = Math.sin(th), k0 = Math.sin((1 - t) * th) / s, k1 = Math.sin(t * th) / s;
  return a.map((v, i) => v * k0 + b[i] * k1);
}

/* ---------- кадры: главная (вся Земля, как на сайте) и раздел (дуга у низа экрана, как на снимке-заставке) ---------- */
const HOME = { ld: [-.6, .45, .66], nlc: [1, .78, .5], dim: .36, cla: 1, pf: 0, kc: 0 };
const HUB = { rabota: [66, 36, -.2], lyudi: [37, 48, -.2], klienty: [100, 28, -.2] };   // как HUB в src/app.js
function homeView(v, W, H) { const wide = W > H; return Object.assign({ m: vw(v[0], v[1], v[2]), z: wide ? 1.08 : .96, cy: wide ? .08 : .17, dm: 0 }, HOME); }
function secView(name, lon, W, H) {
  const s = window.GT_SEC[name], wide = W > H, Hv = wide ? Math.max(H, W / 2) : Math.max(H, W * 4 / 3), R = (wide ? 2.5 : 1.05) * Hv, A = (wide ? .40 : .39) * Hv, mn = Math.min(W, H);
  return { m: vw(lon == null ? s.gv[0] : lon, s.gv[1], s.gv[2]), z: 2 * R / mn, cy: (A - R - H / 2) / mn, ld: s.ld, nlc: s.nlc || HOME.nlc, dim: s.dim, cla: s.cla == null ? 1 : s.cla, pf: 1, kc: 1, dm: 1 };
}
/* промежуточный кадр: поворот — по дуге (кватернионы), размер — равномерно в логарифме, верх дуги — прямо; hop — насколько камера
   поднимается посередине пути (между разделами); солнце и цвета — плавно */
const L = (a, b, t) => a + (b - a) * t, LV = (a, b, t) => a.map((v, i) => L(v, b[i], t));
function mix(a, b, t, hop) {
  const lz = L(Math.log(a.z), Math.log(b.z), t) - (hop || 0) * Math.sin(Math.PI * t), z = Math.exp(lz), top = L(a.cy + a.z / 2, b.cy + b.z / 2, t) - (hop ? .25 * Math.sin(Math.PI * t) : 0);
  const ld = LV(a.ld, b.ld, t), l = Math.hypot(...ld) || 1;
  return { m: qmat(slerp(quat(a.m), quat(b.m), t)), z, cy: top - z / 2, ld: ld.map(v => v / l), nlc: LV(a.nlc, b.nlc, t), dim: L(a.dim, b.dim, t), cla: L(a.cla, b.cla, t), pf: L(a.pf, b.pf, t), kc: L(a.kc, b.kc, t) };
}
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ---------- рисовальщик: свой холст или уже открытый WebGL2 главной ---------- */
class EarthGL {
  constructor(gl, base) {
    this.gl = gl; this.base = base || '';   /* страницы лежат в корне сайта, карты — в assets/earth */ this.ok = 0; this.det = {}; this.cur = null;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error('earth', gl.getShaderInfoLog(x)); return x; };
    const p = this.p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    this.u = {}; ['R', 'T', 'DAY', 'NIGHT', 'CLOUD', 'DDAY', 'DNIGHT', 'WV', 'LD', 'NLC', 'Z', 'CY', 'DIM', 'CLA', 'PF', 'KC', 'DMIX', 'DW', 'DH'].forEach(n => { this.u[n] = gl.getUniformLocation(p, n); });
    this.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.queue = [];
    this.tex = ['day', 'night', 'clouds'].map(n => this.load(this.base + 'assets/earth/' + n + '.webp', gl.REPEAT, () => { this.ok++; }, n === 'night', true));
  }
  /* Карта раскодируется в фоне (createImageBitmap), а в видеокарту попадает одним куском. Загрузка большой карты занимает
     десятки миллисекунд главного потока, и Земля на это время стоит — поэтому чёткие куски разделов ждут в очереди и
     загружаются по одному, только когда Земля не летит (pump). Серые ночные карты — в одном канале: втрое меньше видеопамяти */
  load(src, wrap, done, gray, now) {
    const gl = this.gl, t = gl.createTexture();
    const put = bmp => {
      const a = gl.getParameter(gl.ACTIVE_TEXTURE); gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (gray) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, bmp); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, bmp);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(a); if (bmp.close) bmp.close(); done();
    };
    /* в очереди карта идёт полосами по 128 строк за кадр (по 1–2 мс), иначе загрузка 4096 × 2000 — один длинный кадр */
    const strips = bmp => {
      const W = bmp.width, H = bmp.height, S = 128, lv = Math.floor(Math.log2(Math.max(W, H))) + 1, a0 = gl.getParameter(gl.ACTIVE_TEXTURE);
      gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, lv, gray ? gl.R8 : gl.RGB8, W, H); gl.activeTexture(a0);
      let y = 0;
      const step = () => {
        if (y >= H) {
          const a = gl.getParameter(gl.ACTIVE_TEXTURE); gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.generateMipmap(gl.TEXTURE_2D);
          gl.activeTexture(a); if (bmp.close) bmp.close(); done(); return;
        }
        const y0 = y, h = Math.min(S, H - y); y += h;
        createImageBitmap(bmp, 0, y0, W, h).then(part => this.queue.push(() => {
          const a = gl.getParameter(gl.ACTIVE_TEXTURE); gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, W, h, gray ? gl.RED : gl.RGB, gl.UNSIGNED_BYTE, part); gl.activeTexture(a); if (part.close) part.close(); step();
        }));
      };
      step();
    };
    const got = bmp => { if (now) put(bmp); else if (bmp.close && window.createImageBitmap) strips(bmp); else this.queue.push(() => put(bmp)); };
    if (window.createImageBitmap) fetch(src).then(r => r.blob()).then(b => createImageBitmap(b)).then(got).catch(() => { const im = new Image(); im.onload = () => got(im); im.src = src; });
    else { const im = new Image(); im.onload = () => got(im); im.src = src; }
    return t;
  }
  /* одна карта из очереди за кадр — зовут, когда Земля не летит */
  pump() { const f = this.queue.shift(); if (f) f(); return this.queue.length; }
  get ready() { return this.ok === 3; }
  /* чёткий кусок карты раздела: грузится один раз, потом только подключается */
  detail(name) {
    const s = window.GT_SEC[name]; if (!s || !s.detail) return null; if (this.det[name]) return this.det[name];
    const d = this.det[name] = { win: s.detail.win, day: 0, night: 0, need: [!!s.detail.day, !!s.detail.night] };
    if (s.detail.day) d.tday = this.load(s.detail.day, this.gl.CLAMP_TO_EDGE, () => { d.day = 1; });
    if (s.detail.night) d.tnight = this.load(s.detail.night, this.gl.CLAMP_TO_EDGE, () => { d.night = 1; }, true);
    return d;
  }
  detailReady(name) { const d = name && this.det[name]; return !d || ((!d.need[0] || d.day) && (!d.need[1] || d.night)); }
  use(name) { this.cur = name || null; if (name) this.detail(name); }
  draw(v, T, w, h) {
    const gl = this.gl, u = this.u, d = this.cur && this.det[this.cur];
    gl.useProgram(this.p); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + 10 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    gl.uniform1i(u.DAY, 10); gl.uniform1i(u.NIGHT, 11); gl.uniform1i(u.CLOUD, 12);
    gl.activeTexture(gl.TEXTURE13); gl.bindTexture(gl.TEXTURE_2D, d && d.day ? d.tday : null); gl.uniform1i(u.DDAY, 13);
    gl.activeTexture(gl.TEXTURE14); gl.bindTexture(gl.TEXTURE_2D, d && d.night ? d.tnight : null); gl.uniform1i(u.DNIGHT, 14);
    gl.activeTexture(gl.TEXTURE0);
    if (d) gl.uniform4f(u.DW, d.win[0] * D2R, d.win[1] * D2R, d.win[2] * D2R, d.win[3] * D2R); else gl.uniform4f(u.DW, 0, 1, 0, 1);
    gl.uniform2f(u.DH, d && d.day ? 1 : 0, d && d.night ? 1 : 0);
    gl.uniform2f(u.R, w, h); gl.uniform1f(u.T, T); gl.uniformMatrix3fv(u.WV, false, col(v.m));
    gl.uniform3f(u.LD, ...v.ld); gl.uniform3f(u.NLC, ...v.nlc); gl.uniform1f(u.Z, v.z); gl.uniform1f(u.CY, v.cy);
    gl.uniform1f(u.DIM, v.dim); gl.uniform1f(u.CLA, v.cla); gl.uniform1f(u.PF, v.pf); gl.uniform1f(u.KC, v.kc); gl.uniform1f(u.DMIX, v.dm || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/* ---------- полёт камеры ----------
   from, to — кадры; dur — секунды; hop — подъём камеры посередине; step(v, k) рисует кадр; end() — после последнего кадра.
   Чёткие куски: до середины пути гаснет кусок, с которого летим (det0), после середины проявляется кусок, куда летим (det1). */
function fly(o) {
  const t0 = performance.now(), D = o.dur * 1000;
  const st = now => {
    const k = Math.min(1, (now - t0) / D), e = ease(k), v = mix(o.from, o.to, e, o.hop);
    v.dm = 0; v.det = null;
    if (o.det0 && e < .5) { v.det = o.det0; v.dm = 1 - Math.min(1, e / .35); }
    if (o.det1 && e >= .5) { v.det = o.det1; v.dm = Math.max(0, (e - .62) / .38); }
    o.step(v, k);
    if (k < 1) requestAnimationFrame(st); else o.end();
  };
  requestAnimationFrame(st);
}
/* мост между страницами: последний кадр полёта и куда летели. Кадр — WebP без потерь (точно до пикселя, с тем же зерном плёнки):
   со сжатием с потерями зерно пропадало, и на стыке Земля дважды меняла рисунок — это и были микроблики. 1440 px — около 1,5 МБ.
   Не влез в хранилище — мост не ставится, страница раздела открывается обычным проявлением */
function bridge(canvas, cam) {
  try { sessionStorage.removeItem('gt-bridge'); sessionStorage.setItem('gt-cam', JSON.stringify(cam)); sessionStorage.setItem('gt-bridge', canvas.toDataURL('image/webp', 1)); } catch (e) { try { sessionStorage.removeItem('gt-bridge'); } catch (x) {} }
}
function arrived(page) {
  let c = null; try { c = JSON.parse(sessionStorage.getItem('gt-cam') || 'null'); } catch (e) {}
  if (!c || c.to !== page || Date.now() - (c.at || 0) > 15000) return null;
  try { sessionStorage.removeItem('gt-cam'); sessionStorage.removeItem('gt-bridge'); } catch (e) {}
  return c;
}
window.EV = { EarthGL, homeView, secView, mix, fly, bridge, arrived, HUB, vw, ease };
})();
