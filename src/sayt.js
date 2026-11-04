/* «Сайт»: пример сайта-абстракции на станции «Сайт» мира «Клиенты». Перенесён из maket/vitrina.html.
   Порядок: плохой сайт разваливается, телефон из обломков падает в воду, из воды встаёт пример.
   Колесо ведёт пример по формам: круг, бык, магнит, ключ. В конце вода стягивается в стрелку шкалы, дальше колесо крутит ручку.
   Связь с app.js: step() каждый кадр из updateAir, wheel() из колеса мира, onTalk открывает разговор. */
window.GTSAYT = (() => {
const R = document.getElementById('x1');
if (!R) return null;
const $ = s => R.querySelector(s), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
const vis = (el, a) => { el.style.opacity = a; el.style.visibility = a > .004 ? 'visible' : 'hidden'; };
const api = { onTalk: null };

/* Шейдеры */
const canvas = $('#x1-gl');
const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
if (!gl) R.classList.add('nogl');
const VS_FULL = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS_RING = `precision highp float;
/* Свет и шум круга взяты один в один из C:\\MIDGAME\\qtcapital (код QT Capital). Перед запуском сайта нужен свой код или согласие правообладателя. */
uniform vec2 uC,uP;uniform float uR,uT,uA,uCalm,uHov,uSplash,uTint,uShA,uShB,uMx,uRot;uniform vec4 uRip[4];uniform sampler2D uSdf;uniform vec3 uAv[3];
const float hue=0.;const vec3 backgroundColor=vec3(0.);
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  vec3 rgb2yiq(vec3 c) {
    float y = dot(c, vec3(0.299, 0.587, 0.114));
    float i = dot(c, vec3(0.596, -0.274, -0.322));
    float q = dot(c, vec3(0.211, -0.523, 0.312));
    return vec3(y, i, q);
  }

  vec3 yiq2rgb(vec3 c) {
    float r = c.x + 0.956 * c.y + 0.621 * c.z;
    float g = c.x - 0.272 * c.y - 0.647 * c.z;
    float b = c.x - 1.106 * c.y + 1.703 * c.z;
    return vec3(r, g, b);
  }

  vec3 adjustHue(vec3 color, float hueDeg) {
    float hueRad = hueDeg * 3.14159265 / 180.0;
    vec3 yiq = rgb2yiq(color);
    float cosA = cos(hueRad);
    float sinA = sin(hueRad);
    float i = yiq.y * cosA - yiq.z * sinA;
    float q = yiq.y * sinA + yiq.z * cosA;
    yiq.y = i;
    yiq.z = q;
    return yiq2rgb(yiq);
  }

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(
      p3.x + p3.y,
      p3.x + p3.z,
      p3.y + p3.z
    ) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(
      dot(d0, d0),
      dot(d1, d1),
      dot(d2, d2),
      dot(d3, d3)
    ), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(d0, hash33(i)),
      dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)),
      dot(d3, hash33(i + 1.0))
    );
    return dot(vec4(31.316), n);
  }

  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }

  const vec3 baseColor1 = vec3(0.000000, 0.150000, 0.400000);
  const vec3 baseColor2 = vec3(0.000000, 0.020000, 0.100000);
  const vec3 baseColor3 = vec3(0.000000, 0.000000, 0.000000);
  const float innerRadius = 0.6;
  const float noiseScale = 0.65;

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }

  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv, float len, float calm) {
    vec3 color1 = adjustHue(baseColor1, hue);
    vec3 color2 = adjustHue(baseColor2, hue);
    vec3 color3 = adjustHue(baseColor3, hue);

    float ang = atan(uv.y, uv.x);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;

    float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

    float n0 = snoise3(vec3(uv * noiseScale, uT * 0.35)) * 0.5 + 0.5;
    float r0 = mix(mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0), .8, calm);
    float d0 = abs(len - r0);
    float v0 = light1(1.0, mix(10.0, 70.0, calm), d0);

    v0 *= smoothstep(r0 * 1.05, r0, len);
    float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
    v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
    float cl = cos(ang + uT * 0.8) * 0.5 + 0.5;

    float a = uT * -0.4;
    float da = atan(sin(ang - a), cos(ang - a));
    float d = length(vec2(da * len, len - r0));
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);

    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

    vec3 colBase = mix(color1, color2, cl);
    float fadeAmount = mix(1.0, 0.1, bgLuminance);

    vec3 darkCol = mix(color3, colBase, v0);
    darkCol = (darkCol + v1) * v2 * v3;
    darkCol = clamp(darkCol, 0.0, 1.0);

    vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
    lightCol = mix(backgroundColor, lightCol, v0);
    lightCol = clamp(lightCol, 0.0, 1.0);

    vec3 finalCol = mix(darkCol, lightCol, bgLuminance);

    return extractAlpha(finalCol);
  }

/* Формы в покое, как на внутренних страницах образца: свет держится у контура и бежит вдоль него, сам контур не дышит.
   d0 считается как в их поле расстояний до контура: 0 на контуре, 0.5 на расстоянии 0.125 и дальше. */
vec4 drawShape(vec2 uv,float sd){
  vec3 color1=adjustHue(baseColor1,hue),color2=adjustHue(baseColor2,hue),color3=adjustHue(baseColor3,hue);
  float ang=atan(uv.y,uv.x),d0=min(abs(sd)*4.,.5);
  float v0=light1(1.,8.,d0)*smoothstep(.15,0.,d0);
  float cl=cos(ang+uT*.8)*.5+.5,a=uT*-.4;
  float v1=light2(1.5,5.,distance(uv,vec2(cos(a),sin(a))*.6))*light1(1.,30.,d0);
  float v2=smoothstep(.3,0.,d0),v3=smoothstep(-.2,.05,d0);
  return extractAlpha(clamp((mix(color3,mix(color1,color2,cl),v0)+v1)*v2*v3,0.,1.));
}

float smin(float a,float b,float k){float t=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,t)-k*t*(1.-t);}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float t=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*t);}
float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float tri(vec2 p,vec2 a,vec2 b,vec2 c){
  vec2 e0=b-a,e1=c-b,e2=a-c,v0=p-a,v1=p-b,v2=p-c;
  vec2 q0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.),q1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.),q2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
  float sg=sign(e0.x*e2.y-e0.y*e2.x);
  vec2 d=min(min(vec2(dot(q0,q0),sg*(v0.x*e0.y-v0.y*e0.x)),vec2(dot(q1,q1),sg*(v1.x*e1.y-v1.y*e1.x))),vec2(dot(q2,q2),sg*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);}
float quad(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d){return min(tri(p,a,b,c),tri(p,a,c,d));}
/* Формы: 0 круг, 1 трейдинг (бык), 2 маркетинг (магнит), 3 недвижимость (ключ) */
/* Формы берутся из поля расстояний готовых значков: R бык, G магнит, B ключ */
/* Люди у магнита: круг с вырезанным человечком */
float people(vec2 p){
  float d=9.;
  for(int i=0;i<3;i++){
    vec3 a=uAv[i]; if(a.z<.004) continue;
    vec2 l=p-a.xy;
    float h=(texture2D(uSdf,l*(.95/a.z)/2.3+.5).a-.5)*1.2*(a.z/.95);
    d=min(d,max(length(l)-a.z,-h));
  }
  return d;
}
float shape(float k,vec2 p){
  if(k<.5) return length(p)-1.;
  vec4 t=texture2D(uSdf,p/2.3+.5);
  float v=k<1.5?t.r:(k<2.5?t.g:t.b);
  float s=max((v-.5)*1.2,max(abs(p.x),abs(p.y))-1.1);
  return k>1.5&&k<2.5?smin(s,people(p),.12):s;
}
void main(){
  vec2 q=(gl_FragCoord.xy-uC)/uR;
  vec2 f=q-uP;float d=length(f)+1e-4;
  q-=f/d*(1.-smoothstep(0.,.875,d))*uHov*.4375;
  for(int i=0;i<4;i++){vec2 v=q-uRip[i].xy;float e=length(v)+1e-4,t=uRip[i].z;
    q+=v/e*sin(e*20.-t*10.)*.022*uRip[i].w*exp(-e*2.6)*exp(-t*1.5)*smoothstep(0.,.12,t);}
  float cs=cos(uRot),sn=sin(uRot);vec2 qr=vec2(cs*q.x-sn*q.y,sn*q.x+cs*q.y);
  float an0=atan(q.y,q.x),wob=(sin(an0*5.+uT*1.4)*.5+sin(an0*11.-uT*2.1)*.28)*.03*uSplash;
  float sh=mix(shape(uShA,q),shape(uShB,q),uMx);
  sh=mix(sh,length(q)-1.,uCalm)-wob;
  vec4 col=draw(qr*.8,(sh+1.)*.8,uCalm);
  vec3 c=col.rgb*col.a;
  /* Бык, магнит и ключ раздуваются, только пока над водой мышь. Круг всегда как был. */
  float rest=mix(step(.5,uShA),step(.5,uShB),uMx)*(1.-uHov)*(1.-uCalm);
  if(rest>.001){
    vec2 qn=q+vec2(snoise3(vec3(q*1.2,uT*.3)),snoise3(vec3(q*1.2+100.,uT*.3)))*.025;
    vec4 cs=drawShape(qr*.8,mix(shape(uShA,qn),shape(uShB,qn),uMx)*.8);
    c=mix(c,cs.rgb*cs.a,rest);
  }
  float sp2=uSplash*uSplash,s=sh;
  c+=vec3(.42,.72,1.)*exp(-abs(s)*(s>0.?46.:14.))*sp2*1.25;
  c+=vec3(.1,.28,.72)*exp(-max(s,0.)*2.6)*(s>0.?.55:smoothstep(.15,1.,length(q))*.5)*sp2;
  c=mix(c,vec3(.16,.72,.3)*(c.r+c.g+c.b)*.75,uTint);
  c+=(h(gl_FragCoord.xy+uT)-.5)/255.;
  c=max(c,0.)*uA*.9;
  gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));
}`;
function prog(vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
    gl.attachShader(p, o);
  }
  gl.linkProgram(p); return p;
}
const uni = (p, ...n) => Object.fromEntries(n.map(k => [k, gl.getUniformLocation(p, k)]));
let pR, uR, full;
if (gl) {
  pR = prog(VS_FULL, FS_RING); uR = uni(pR, 'uC', 'uP', 'uR', 'uT', 'uA', 'uCalm', 'uHov', 'uRip', 'uSplash', 'uTint', 'uShA', 'uShB', 'uMx', 'uRot', 'uSdf', 'uAv');
  full = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, full); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enable(gl.BLEND); gl.clearColor(0, 0, 0, 0);
}

/* Значки форм. Бык: контур обведён по превью модели «Bull [Commissioned Sample]» (toscraft, Sketchfab), только для прототипа. Ключ-дом и люди у магнита обведены по картинкам, которые прислал заказчик, тоже только для прототипа.
   Магнит: ровная подкова с пропорциями магнита с той же картинки, полюсами вверх.
   У магнита: [0] рамка, [1] силуэт для воды, [2] значок для кнопки, [3] узкая рамка для значка в переключателе, [4] границы полюсов. */
const ICONS = { 1: ['4 4 738 907', 'M736 41L667 110L635 118L624 118L610 110L592 105L573 113L547 118L506 96L482 98L474 102L459 104L432 86L454 10L451 8L426 26L413 53L402 68L399 79L398 119L402 137L421 149L426 156L422 160L386 160L371 184L374 191L396 211L399 211L409 222L399 231L370 245L353 258L330 317L320 328L278 357L226 380L166 378L113 397L94 394L67 366L73 351L78 346L89 346L146 357L177 341L180 316L189 304L165 253L162 255L152 305L163 316L164 328L160 332L144 339L136 339L76 322L66 321L63 324L46 357L46 368L68 398L89 421L71 445L65 459L51 469L26 533L31 577L36 596L36 614L23 687L22 738L8 767L8 774L21 790L59 791L85 777L85 769L80 762L67 728L67 713L64 705L60 668L122 606L154 592L169 598L177 607L184 640L214 708L197 746L203 750L268 751L286 748L281 735L260 702L238 650L238 639L243 633L244 620L249 615L296 624L303 631L321 663L365 752L366 826L358 851L354 877L358 881L372 885L385 893L395 895L417 906L476 902L479 899L478 879L439 829L434 811L439 806L471 806L484 804L487 801L487 791L456 749L458 698L487 658L498 647L425 573L425 569L433 555L432 553L443 528L449 522L521 560L527 568L506 634L506 639L509 640L577 563L602 347L610 340L648 327L656 322L661 256L641 235L641 232L682 205L677 180L651 178L646 171L650 167L674 158L698 138L732 77Z'], 2: ['0 0 496 1000', 'M0 467.6V770.8A229.2 229.2 0 0 0 458.3 770.8V467.6H296.3V770.8A67.2 67.2 0 0 1 162 770.8V467.6Z', 'M0 467.6V770.8A229.2 229.2 0 0 0 458.3 770.8V467.6H296.3V770.8A67.2 67.2 0 0 1 162 770.8V467.6ZM0 597.2H162M296.3 597.2H458.3M69.8 102.5a102.5 102.5 0 1 0 205 0a102.5 102.5 0 1 0 -205 0ZM119.0 128.9L125.3 119.5L131.5 113.9L138.6 109.3L154.1 104.8L167.7 104.2L179.6 105.4L194.3 109.9L204.5 116.7L208.7 120.9L214.4 130.0L216.9 136.2L217.8 154.6L216.6 158.0L213.5 159.1L198.0 157.7L149.6 157.7L120.5 159.1L116.8 157.7L115.1 154.0L114.5 145.8L115.9 136.8ZM184.7 42.6L192.9 50.2L198.3 63.5L198.3 74.8L195.4 81.3L190.1 87.0L189.8 89.0L190.9 90.1L184.4 95.8L172.2 98.6L155.2 99.7L145.1 92.9L138.8 85.3L136.6 80.2L134.9 72.5L134.9 66.3L136.6 57.9L141.9 47.9L152.4 39.7L159.8 36.9L173.6 37.2ZM131.8 288.5a78.9 78.9 0 1 0 157.8 0a78.9 78.9 0 1 0 -157.8 0ZM169.7 308.8L174.5 301.6L179.3 297.2L184.7 293.8L196.7 290.3L207.1 289.8L216.3 290.7L227.6 294.2L235.5 299.4L238.7 302.7L243.1 309.7L245.1 314.5L245.7 328.6L244.8 331.2L242.4 332.1L230.5 331.0L193.2 331.0L170.8 332.1L168.0 331.0L166.6 328.2L166.2 321.9L167.3 314.9ZM220.2 242.4L226.5 248.2L230.7 258.5L230.7 267.2L228.5 272.2L224.4 276.6L224.1 278.1L225.0 279.0L220.0 283.3L210.6 285.5L197.6 286.4L189.7 281.1L184.9 275.2L183.2 271.3L181.9 265.4L181.9 260.7L183.2 254.1L187.3 246.5L195.4 240.2L201.1 238.0L211.7 238.2ZM286.9 234.8a104.6 104.6 0 1 0 209.2 0a104.6 104.6 0 1 0 -209.2 0ZM337.1 261.7L343.5 252.2L349.8 246.4L357.1 241.8L372.9 237.2L386.8 236.6L398.9 237.7L413.9 242.4L424.3 249.3L428.7 253.6L434.4 262.9L437.0 269.2L437.9 288.0L436.7 291.5L433.6 292.6L417.7 291.2L368.3 291.2L338.6 292.6L334.8 291.2L333.1 287.4L332.5 279.0L334.0 269.8ZM404.1 173.6L412.5 181.4L418.0 195.0L418.0 206.6L415.1 213.2L409.6 219.0L409.3 221.0L410.5 222.1L403.8 227.9L391.4 230.8L374.1 232.0L363.7 225.0L357.4 217.2L355.0 212.0L353.3 204.2L353.3 197.9L355.0 189.2L360.5 179.1L371.2 170.7L378.7 167.9L392.9 168.1Z', '-8 460 474 548', 'M0 597.2H162M296.3 597.2H458.3'], 3: ['0 0 459 1000', 'M456 197L459 202L442 204L399 204L396 206L395 397L392 402L314 459L312 504L309 506L297 506L293 511L293 658L287 665L256 685L253 688L253 693L256 709L258 713L291 727L294 732L293 761L262 777L259 779L258 786L262 816L289 823L293 827L293 849L265 875L264 878L293 896L294 918L290 925L220 1000L213 993L213 510L208 506L195 506L190 510L190 963L188 965L165 938L165 510L160 506L148 506L146 503L145 459L67 402L63 396L62 206L59 204L3 204L0 203L0 201L94 117L96 114L96 37L98 33L146 33L148 36L148 63L152 66L225 2L231 0ZM156 310L157 369L160 372L220 371L222 367L221 308L219 305L159 306ZM236 311L237 369L240 372L300 371L303 366L302 308L299 305L243 305L238 306ZM236 228L237 287L240 289L301 288L303 284L302 225L299 222L241 222L238 224ZM156 227L157 287L159 289L220 288L222 283L221 225L218 222L158 223Z'] };
/* Магнит притягивает людей: кружки с человечком летят к устью магнита и вливаются в воду.
   Координаты в рамке значка магнита, slit: ширина щели у полюсов. Человечек лежит в канале A поля расстояний. */
const MAGNET = { av: [[172.3, 102.5, 102.5], [210.7, 288.5, 78.9], [391.5, 234.8, 104.6]], mouth: [229.2, 575.1], slit: 26, per: 'M240.2 628.6L270.5 583L300.9 555.4L335.4 533.4L411.3 511.3L477.5 508.5L535.5 514L607.3 536.1L657 569.2L677.7 589.9L705.3 634.1L717.7 664.5L721.8 754.2L716.3 770.8L701.1 776.3L625.2 769.4L389.2 769.4L247.1 776.3L229.1 769.4L220.8 751.4L218.1 711.4L225 667.2ZM560.4 207.6L600.4 244.9L626.6 309.8L626.6 365L612.8 396.7L586.6 424.3L585.2 434L590.7 439.5L559 467.1L499.6 480.9L416.8 486.4L367.1 453.3L336.8 416L325.7 391.2L317.4 353.9L317.4 323.6L325.7 282.2L351.9 233.9L403 193.8L438.9 180L506.5 181.4Z' };
/* Поле расстояний: значок рисуется на холсте, затем считается точное расстояние до края (алгоритм Фельценшвальба) */
const SDF = { tex: null };
function edt(f, w, h) {
  const n = Math.max(w, h), v = new Int32Array(n), z = new Float64Array(n + 1), g = new Float64Array(n), out = new Float64Array(n);
  const pass = (get, set, len) => {
    for (let i = 0; i < len; i++) g[i] = get(i);
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < len; q++) {
      let sv;
      do { const r = v[k]; sv = ((g[q] + q * q) - (g[r] + r * r)) / (2 * q - 2 * r); } while (sv <= z[k] && --k >= 0);
      k++; v[k] = q; z[k] = sv; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; const r = v[k]; out[q] = (q - r) * (q - r) + g[r]; }
    for (let i = 0; i < len; i++) set(i, out[i]);
  };
  for (let x = 0; x < w; x++) pass(y => f[y * w + x], (y, val) => { f[y * w + x] = val; }, h);
  for (let y = 0; y < h; y++) pass(x => f[y * w + x], (x, val) => { f[y * w + x] = val; }, w);
  return f;
}
function buildSdf() {
  if (!gl || SDF.tex) return;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d', { willReadFrequently: true }), px = new Uint8Array(S * S * 4), BIG = 1e12;
  [1, 2, 3, 4].forEach((k, ch) => {
    const [vb, d] = k < 4 ? ICONS[k] : ['0 0 1000 1000', MAGNET.per], [mx, my, vw, vh] = vb.split(' ').map(Number), sc = 1.9 / 2.3 * S / Math.max(vw, vh);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S, S);
    x.setTransform(sc, 0, 0, sc, (S - vw * sc) / 2 - mx * sc, (S - vh * sc) / 2 - my * sc); x.fillStyle = '#fff'; x.fill(new Path2D(d));
    /* Щель отделяет полюса магнита от ножек */
    if (k === 2) { x.globalCompositeOperation = 'destination-out'; x.lineWidth = MAGNET.slit; x.lineCap = 'square'; x.stroke(new Path2D(ICONS[2][4])); x.globalCompositeOperation = 'source-over'; }
    const a = x.getImageData(0, 0, S, S).data, inn = new Float64Array(S * S), out = new Float64Array(S * S);
    for (let i = 0; i < S * S; i++) { const on = a[i * 4 + 3] > 127; out[i] = on ? 0 : BIG; inn[i] = on ? BIG : 0; }
    edt(out, S, S); edt(inn, S, S);
    const toQ = 2.3 / S;
    for (let i = 0; i < S * S; i++) { const dq = (Math.sqrt(out[i]) - Math.sqrt(inn[i])) * toQ; px[i * 4 + ch] = Math.max(0, Math.min(255, Math.round((.5 + dq / 1.2) * 255))); }
  });
  SDF.tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, SDF.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0);
}
/* Поле расстояний считается около десятой доли секунды, поэтому заранее, пока браузер свободен */
(window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 6000 }) : f => setTimeout(f, 2000))(buildSdf);

/* Геометрия: пример занимает экран от верха до строки под шкалой, шапка примера стоит под шапкой сайта */
const G = { W: 0, H: 0, wide: true, cx: 0, cy: 0, R: 0, top: 0 };
function layout() {
  const kl = document.getElementById('klienty'), foot = document.getElementById('air-foot'), bar = document.getElementById('bar');
  const W = innerWidth, wide = W > 760, H = Math.max(240, foot.getBoundingClientRect().top - kl.getBoundingClientRect().top);
  G.W = W; G.H = H; G.wide = wide; G.top = bar ? bar.getBoundingClientRect().bottom : 56;
  R.style.setProperty('--f', H + 'px'); R.style.setProperty('--top', G.top + 'px');
  const d = dpr();
  canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
  if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  site1();
}
/* Подпись и кнопки форм стоят одним блоком. На широком экране блок по центру круга, на телефоне круг под кнопками. */
function site1() {
  const { W, H, wide } = G, cap = $('#x1-cap'), forms = $('#x1-forms'), sk = $('#x1-skin');
  const hb = G.top + $('#x1-hd').offsetHeight, capH = cap.offsetHeight, gap = wide ? 44 : 34;
  if (wide) {
    G.R = Math.min((H - hb) * .36, W * .19); G.cx = W * .71; G.cy = hb + (H - hb) * .5;
    const capTop = Math.max(hb + 16, G.cy - (capH + gap + forms.offsetHeight) / 2);
    cap.style.top = capTop + 'px'; forms.style.top = capTop + capH + gap + 'px'; sk.style.top = '';
  } else {
    /* на низком телефоне вода не помещается под кнопками: подпись под заголовком прячется, остаются заголовок и кнопки */
    const room = () => (H - (hb + 14 + cap.offsetHeight + gap) - forms.offsetHeight - 60) / 2;
    R.classList.remove('short'); if (room() < 80) R.classList.add('short');
    const capTop = hb + 14, ft = capTop + cap.offsetHeight + gap;
    cap.style.top = capTop + 'px'; forms.style.top = ft + 'px'; sk.style.top = ft - 22 + 'px';
    G.R = Math.max(48, Math.min(W * .36, room())); G.cx = W * .5;
    G.cy = Math.min(H - G.R - 10, Math.max(H - G.R - 30, ft + forms.offsetHeight + G.R + 14));
  }
  layoutHdr();
}

/* Вода под мышью */
const P = { x: 0, y: 0, sx: 0, sy: 0, hov: 0, tHov: 0, rip: [0, 1, 2, 3].map(() => ({ x: 0, y: 0, t: 9, a: 0 })), n: 0 };
const S = { cx: 0, cyGl: 0, r: 0, ringA: 0 };
function water(e) {
  if (RM || !X.on) return;
  const y = G.H - e.clientY, qx = (e.clientX - S.cx) / S.r, qy = (y - S.cyGl) / S.r;
  /* Как у образца: позиция обновляется только над холстом круга, поэтому вмятина приходит из центра */
  const inside = Math.abs(qx) < 1.25 && Math.abs(qy) < 1.25 && S.ringA > .4;
  if (inside) { P.x = qx; P.y = qy; }
  P.tHov = inside ? 1 : 0;
}
addEventListener('pointermove', water, { passive: true });
addEventListener('pointerdown', water, { passive: true });
document.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') P.tHov = 0; }, { passive: true });

/* Формы воды и кнопки к ним. Вид кнопок выбирает посетитель, по умолчанию «Знаки». */
const SH = { a: 0, b: 0, m: 1, rot: 0 };
const FORMS = [[1, 'Трейдинг'], [2, 'Маркетинг'], [3, 'Недвижимость']];
const SKINS = [
  ['e', 'Знаки', `<svg viewBox="${ICONS[2][3]}"><path d="${ICONS[2][1] + ICONS[2][4]}" vector-effect="non-scaling-stroke" opacity=".45"/><path class="run2" d="${ICONS[2][1] + ICONS[2][4]}" vector-effect="non-scaling-stroke" pathLength="128"/></svg>`],
  ['b', 'Терминал', '<span class="mono">&gt;_</span>'],
  ['c', 'Панель', '<svg viewBox="0 0 26 22"><rect x="2" y="5" width="22" height="12" rx="1"/><path d="M9.3 5v12M16.6 5v12"/><circle cx="20.3" cy="8.5" r="1.1" fill="currentColor"/></svg>']
];
const TPL = {
  b: (t, i) => `<span class="k">0${i + 1}</span><span class="t" data-scr>${t.toUpperCase()}</span>`,
  c: (t, i) => `<span class="row"><span class="ix">0${i + 1}</span><span class="led"></span></span><span class="lb">${t}</span>`,
  e: (t, i) => `<svg class="ic" viewBox="${ICONS[i + 1][0]}" aria-hidden="true"><path class="base" d="${ICONS[i + 1][2] || ICONS[i + 1][1]}" vector-effect="non-scaling-stroke"/><path class="run" d="${ICONS[i + 1][2] || ICONS[i + 1][1]}" vector-effect="non-scaling-stroke" pathLength="422"/></svg><span class="lb">${t}</span>`
};
const SCR = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789#/_';
function scramble(el) {
  if (RM) return;
  const fin = el.dataset.fin || (el.dataset.fin = el.textContent); let f = 0;
  clearInterval(el._t); el._t = setInterval(() => { el.textContent = [...fin].map((c, i) => (i < f / 2 || c === ' ') ? c : SCR[Math.floor(Math.random() * SCR.length)]).join(''); if (++f > fin.length * 2) { clearInterval(el._t); el.textContent = fin; } }, 28);
}
let skin = 'e';
try { skin = localStorage.getItem('gt-skin') || 'e'; } catch (e) {}
if (!SKINS.some(x => x[0] === skin)) skin = 'e';
/* Смена формы воды: по колесу и по кнопке */
function setShape(nk) {
  if (nk === SH.b) return;
  SH.a = SH.b; SH.b = nk; SH.m = RM ? 1 : 0;
  markForms();
}
function markForms() {
  markIx();
  const g = $('#x1-forms > div'); if (!g) return;
  g.querySelectorAll('button').forEach(o => { const v = +o.dataset.k === SH.b; o.classList.toggle('on', v); o.setAttribute('aria-pressed', v); });
  if (skin === 'c') { g.style.setProperty('--i', Math.max(0, SH.b - 1)); g.style.setProperty('--o', SH.b ? 1 : 0); }
}
function paintForms() {
  const box = $('#x1-forms'), g = document.createElement('div'); g.className = 'g' + skin;
  box.innerHTML = '<span class="fl">Форма под отрасль</span>'; box.append(g);
  FORMS.forEach(([k, t], i) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.innerHTML = TPL[skin](t, i);
    b.addEventListener('pointerenter', () => b.querySelectorAll('[data-scr]').forEach(scramble));
    /* Повторное нажатие возвращает круг */
    b.addEventListener('click', () => setShape(k === SH.b ? 0 : k));
    g.append(b);
  });
  if (skin === 'c') g.insertAdjacentHTML('beforeend', '<span class="tk" aria-hidden="true"></span>');
  markForms();
}
(function () {
  const sk = $('#x1-skin .sk');
  SKINS.forEach(([id, name, glyph]) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', name); b.title = name; b.innerHTML = glyph;
    b.addEventListener('pointerenter', () => { $('#x1-skn').textContent = name; });
    b.addEventListener('pointerleave', () => { $('#x1-skn').textContent = SKINS.find(x => x[0] === skin)[1]; });
    b.addEventListener('click', () => setSkin(id));
    sk.append(b);
  });
  sk.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = SKINS.findIndex(x => x[0] === skin), n = (i + (e.key === 'ArrowRight' ? 1 : SKINS.length - 1)) % SKINS.length;
    setSkin(SKINS[n][0]); sk.querySelectorAll('button')[n].focus(); e.preventDefault();
  });
})();
function markSkin() {
  const i = SKINS.findIndex(x => x[0] === skin);
  $('#x1-skin .sk').style.setProperty('--i', i); $('#x1-skn').textContent = SKINS[i][1];
  $('#x1-skin').querySelectorAll('button').forEach((b, n) => { b.setAttribute('aria-checked', n === i); b.tabIndex = n === i ? 0 : -1; });
}
function setSkin(id) {
  if (id === skin) return;
  skin = id; try { localStorage.setItem('gt-skin', id); } catch (e) {}
  markSkin();
  const f = $('#x1-forms'); f.classList.add('sw');
  setTimeout(() => { paintForms(); site1(); requestAnimationFrame(() => f.classList.remove('sw')); }, RM ? 0 : 220);
}

/* Шапка примера: знак из воды слева, номера форм над шкалой. Отметка идёт по шкале вместе с колесом. */
const MK = { cx: 0, cyGl: 0, r: 13 };
[[0, 'Круг'], ...FORMS].forEach(([k, t], i) => {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.innerHTML = `<em>0${i + 1}</em><span>${t}</span>`;
  b.addEventListener('click', () => setShape(k)); $('#x1-hd .ix').append(b);
});
function markIx() {
  $('#x1-hd .ix').querySelectorAll('button').forEach(b => { const v = +b.dataset.k === SH.b; b.classList.toggle('on', v); b.setAttribute('aria-pressed', v); });
  $('#x1-hd .sc').style.setProperty('--s', SH.b);
}
function layoutHdr() {
  const r = $('#x1-hd .mk').getBoundingClientRect();
  MK.cx = r.left + r.width / 2; MK.cyGl = G.H - (r.top + r.height / 2);
}
/* «Контакт» примера ведёт в настоящий разговор с GT */
$('#x1-hd .h3c').addEventListener('click', () => { if (api.onTalk) api.onTalk(); });
markSkin(); paintForms();

/* Каждый человек появляется вдали, медленно тянется к магниту, у полюсов разгоняется, тает и вливается в воду */
function people(T) {
  const [, , vw, vh] = ICONS[2][0].split(' ').map(Number), k = 1.9 / Math.max(vw, vh);
  const mx = (MAGNET.mouth[0] - vw / 2) * k, my = -(MAGNET.mouth[1] - vh / 2) * k;
  return MAGNET.av.flatMap(([x, y, r], i) => {
    const ux = (x - vw / 2) * k - mx, uy = -(y - vh / 2) * k - my, rq = r * k;
    if (RM) return [mx + ux, my + uy, rq];
    const f = (T / 6.5 + i / 3) % 1, s = 1.25 * (1 - f * f);
    return [mx + ux * s, my + uy * s, rq * ss(0, .14, f) * ss(0, .6, s)];
  });
}
/* o: где рисовать. По умолчанию большая вода. Для знака в шапке передаётся его круг: без ряби и вмятины,
   всегда в раздутом виде, иначе тонкий контур в 26 пикселях не виден. Рисуется только в своей рамке. */
const NO_RIP = new Float32Array(16);
function drawRing(A, calm, splash, tint, T, o = S) {
  const d = dpr(), mark = o !== S;
  gl.useProgram(pR); gl.bindBuffer(gl.ARRAY_BUFFER, full);
  const a = gl.getAttribLocation(pR, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform2f(uR.uC, o.cx * d, o.cyGl * d); gl.uniform2f(uR.uP, mark ? 99 : P.sx, mark ? 99 : P.sy);
  gl.uniform1f(uR.uR, o.r * d); gl.uniform1f(uR.uT, T); gl.uniform1f(uR.uA, A); gl.uniform1f(uR.uCalm, calm); gl.uniform1f(uR.uHov, mark ? 1 : P.hov);
  gl.uniform1f(uR.uSplash, splash); gl.uniform1f(uR.uTint, tint);
  const m = SH.m < 1 ? ss(0, 1, SH.m) : 1; gl.uniform1f(uR.uShA, SH.a); gl.uniform1f(uR.uShB, SH.b); gl.uniform1f(uR.uMx, m); gl.uniform1f(uR.uRot, SH.rot);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, SDF.tex); gl.uniform1i(uR.uSdf, 1); gl.activeTexture(gl.TEXTURE0);
  gl.uniform4fv(uR.uRip, mark ? NO_RIP : P.rip.flatMap(r => [r.x, r.y, r.t, r.a]));
  gl.uniform3fv(uR.uAv, people(T));
  if (mark) { const b = o.r * 2.4; gl.enable(gl.SCISSOR_TEST); gl.scissor(Math.floor((o.cx - b) * d), Math.floor((o.cyGl - b) * d), Math.ceil(2 * b * d), Math.ceil(2 * b * d)); }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if (mark) gl.disable(gl.SCISSOR_TEST);
}

/* Ход примера. Всё идёт по одной шкале u, её двигают колесо, палец и щелчок, поэтому назад рассказ идёт теми же шагами.
   u от U0 до 0: вступление. Куча уходит вниз, телефон падает в воду, вода рождается. Обратно телефон вылетает из воды в кучу.
   u от 0 до 1: пример. Шкала z та же, что в прототипе: 1,53 круг, 2,4 бык, 3,4 магнит, 4,4 ключ, 5,4 круг, 6,55 стрелка на шкале.
   Пока плохой сайт разваливается, u стоит в U0. Если после развала 6 секунд ничего не трогать, вступление проигрывается само один раз. */
/* остановки щелчка стоят чуть внутри каждой формы: бык, магнит, ключ, снова круг, конец */
const U0 = -.18, STOPS = [0, .19, .39, .59, .79, 1];
const X = { on: false, u: U0, uc: U0, boost: 0, zone: -1, call: null, edge: 0, clean: false, run: false, tw: 0, auto: false, ph: 0 };
function grabCall(p) {
  if (p && p.body) { X.call = { x: p.body.x, y: p.body.y, s: p.pw * p.s, e: p.e }; p.e.style.visibility = 'hidden'; }
  else X.call = { x: G.W * .78, y: G.H * .34, s: 84, e: null };
}
function dropCall() { if (X.call && X.call.e) X.call.e.style.visibility = ''; X.call = null; }
function reset() {
  dropCall();
  Object.assign(X, { on: false, u: U0, uc: U0, boost: 0, zone: -1, edge: 0, clean: false, run: false, tw: 0, auto: false, ph: 0 });
  R.classList.remove('on'); vis($('#x1-site'), 0); $('#x1-call').style.visibility = 'hidden'; $('#x1-needle').style.visibility = 'hidden';
  if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
  const junk = document.getElementById('junk'); if (junk) { junk.style.transform = ''; junk.style.clipPath = ''; }
  SH.a = SH.b = 0; SH.m = 1; markForms();
  document.getElementById('klienty').classList.remove('ex', 'exd');
}
/* c: near — ручка на станции «Сайт», alpha — насколько станция слышна, clean — плохой сайт развалился, call — обломок с телефоном, v — положение ручки */
function step(dt, c) {
  if (!c.near) { if (X.on) reset(); return; }
  if (!X.on) { X.on = true; R.classList.add('on'); layout(); buildSdf(); }
  const T = RM ? 8 : performance.now() * .001;
  X.boost = Math.max(0, X.boost - dt);
  X.clean = c.clean;
  if (!c.clean) { X.u = X.uc = U0; X.run = false; }
  else if (!X.auto && X.u <= U0) { X.tw += dt; if (X.tw > 6) { X.auto = X.run = true; } }
  if (X.run) { X.u = Math.min(0, X.u - U0 * dt / 1.8); if (X.u >= 0) X.run = false; }
  X.uc = RM || X.run || Math.abs(X.uc - X.u) < 2e-4 ? X.u : lerp(X.uc, X.u, clamp(dt * 9));
  const ip = clamp((X.uc - U0) / -U0), ph = X.uc <= U0 + .0015 ? 0 : X.uc < 0 ? 1 : 2;
  if (ph >= 1 && X.ph === 0) grabCall(c.call);
  if (ph === 0 && X.ph >= 1) dropCall();
  X.ph = ph;
  const z = 1.53 + Math.max(0, X.uc) * 5.02, td = ip * 1.8;

  /* Куча уходит под пол кадра и не заезжает на шкалу, телефон падает в глубину, как камень в воду */
  const drop = clamp(td / .7), dr = drop * drop * drop, birth = clamp((td - .7) / 1.1), sink = ss(0, .6, td), junk = document.getElementById('junk');
  if (ph >= 1) { junk.style.opacity = c.alpha * (1 - sink); junk.style.transform = `translateY(${sink * G.H * .3}px)`; junk.style.clipPath = `inset(0 0 ${Math.max(0, innerHeight - G.H + sink * G.H * .3)}px 0)`; }
  else { junk.style.transform = ''; junk.style.clipPath = ''; }
  const call = $('#x1-call');
  if (ph >= 1 && drop < 1 && X.call) {
    const k = X.call.s / 84;
    call.style.visibility = 'visible';
    call.style.transform = `translate(${lerp(X.call.x, G.cx, drop * drop)}px,${lerp(X.call.y, G.cy, dr)}px) scale(${lerp(k, k * .1, dr)})`;
    call.firstChild.style.opacity = 1 - ss(0, .43, drop);
  } else call.style.visibility = 'hidden';
  const back = 1 + 2.2 * Math.pow(birth - 1, 3) + 1.2 * Math.pow(birth - 1, 2), ex = ss(5.8, 6.2, z);
  S.cx = G.cx; S.cyGl = G.H - G.cy; S.r = Math.max(4, G.R * back * (birth > 0 ? 1 : .01) * lerp(1, .2, ex));
  const splash = 1 - ss(.05, .9, birth), tint = 1 - ss(0, .42, birth);

  /* Пример. Формы сменяются по ходу колеса. Кнопка меняет форму до следующей смены. */
  const s1v = ss(.6, 1, birth) * (1 - ss(5.7, 6, z)) * c.alpha;
  vis($('#x1-site'), s1v);
  const zn = birth < .6 ? 0 : z < 2.4 ? 0 : z < 3.4 ? 1 : z < 4.4 ? 2 : z < 5.4 ? 3 : 0;
  if (zn !== X.zone) { X.zone = zn; setShape(zn); }

  /* Вода. Как у образца: шаг за кадр, а не за секунду */
  P.sx += (P.x - P.sx) * .08; P.sy += (P.y - P.sy) * .08; P.hov += (P.tHov - P.hov) * .06;
  if (SH.m < 1) SH.m = Math.min(1, SH.m + dt / .9);
  if (!RM) SH.rot += Math.min(.05, dt) * .08;
  P.rip.forEach(r => { r.t += dt; });
  const calm = ss(5.4, 5.8, z), ringA = (birth > 0 ? 1 : 0) * (1 - ex) * c.alpha; S.ringA = ringA;
  if (gl) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (ringA > .001) drawRing(ringA, calm, splash, tint, T);
    if (s1v > .004) drawRing(s1v * 1.5, calm, 0, 0, T, MK);
  } else {
    $('#x1-fake').style.cssText = `left:${S.cx - S.r}px;top:${G.cy - S.r}px;width:${S.r * 2}px;height:${S.r * 2}px;opacity:${ringA}`;
  }

  /* Шапка примера: отметка на шкале. Каждая форма занимает четверть шкалы. */
  const E = [1.53, 2.4, 3.4, 4.4, 5.4], ei = Math.max(0, Math.min(3, E.findIndex((e, n) => z < E[n + 1])));
  $('#x1-hd .sc').style.setProperty('--p', clamp((ei + clamp((z - E[ei]) / (E[ei + 1] - E[ei]))) / 4));

  /* Выход: вода стягивается в стрелку и ложится на стрелку настоящей шкалы. Дальше колесо крутит ручку. */
  const nt = ss(6.2, 6.55, z), needle = $('#x1-needle');
  if (ex > 0 && nt < 1) {
    const sc = document.getElementById('scale').getBoundingClientRect(), tx = sc.left + 15 + (sc.width - 30) * c.v / 100;
    const h0 = 2 * G.R * ex, nh = lerp(h0, sc.height, nt);
    needle.style.visibility = 'visible'; needle.style.opacity = c.alpha;
    needle.style.transform = `translate(${lerp(G.cx, tx, nt) - 1.5}px,${lerp(G.cy - h0 / 2, sc.top, nt)}px) scale(.3,${nh / 10})`;
  } else needle.style.visibility = 'hidden';

  /* Пока идёт пример, надпись станции спрятана. После примера она возвращается. */
  const done = ph === 2 && X.uc > .995, kl = document.getElementById('klienty');
  kl.classList.toggle('ex', ph >= 1 && !done); kl.classList.toggle('exd', done);
}
/* Колесо: сначала пример, потом ручка. У края пример держит колесо ещё 0,45 секунды, чтобы ручка не уехала по инерции. */
function wheel(dy) {
  if (!X.on || !dy) return false;
  if (!X.clean) { if (dy < 0) return false; X.boost = .5; return true; }
  const now = performance.now();
  X.run = false;
  if ((dy > 0 && X.u >= 1) || (dy < 0 && X.u <= U0)) return now - X.edge < 450;
  X.u = clamp(X.u + dy / 2600, U0, 1);
  if (X.u >= 1 || X.u <= U0) X.edge = now;
  return true;
}
/* Щелчок по пустому месту: вступление проигрывается до примера, в примере следующая форма */
function next() {
  if (!X.on || !X.clean) return;
  if (X.u < 0) { X.run = true; X.auto = true; return; }
  const n = STOPS.find(v => v > X.u + .01); if (n != null) X.u = n;
}
document.getElementById('klienty').addEventListener('click', e => { if (!e.target.closest('button,a,input,.jp,#air-foot,#dial,#x1-hd,#x1-forms,#x1-skin')) next(); });
/* На телефоне пример листается пальцем вверх и вниз */
let ty = null;
$('#x1-site').addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.target.closest('button,a')) ty = e.clientY; });
addEventListener('pointermove', e => { if (ty == null) return; const d = ty - e.clientY; ty = e.clientY; wheel(d * 2.4); }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { ty = null; }, { passive: true }));
addEventListener('resize', () => { if (X.on) layout(); });

Object.assign(api, { step, wheel, reset, next });
/* fast и state читаются каждый раз заново, поэтому это свойства с геттером, а не копия */
Object.defineProperties(api, { fast: { get: () => X.boost > 0 }, state: { get: () => ({ ph: X.ph, u: +X.u.toFixed(3), shape: SH.b, on: X.on, c: [Math.round(G.cx), Math.round(G.cy)] }) } });
return api;
})();
