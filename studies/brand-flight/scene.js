/* Standalone CSS 3D study. No dependency on the live site's scene or routes.
   Visual reference: user-supplied 1080x1080.mp4, reviewed 2026-11-16.
   Native scroll owns the timeline; one camera transform owns the perspective.
   Coordinates are CSS pixels, +Y along the document and +Z above the ground. */
'use strict';
(() => {
  const embedded = window.parent !== window && new URLSearchParams(window.location.search).has('embed');
  document.documentElement.classList.toggle('embedded', embedded);
  document.body.classList.toggle('embedded', embedded);
  const sendParent = (action, data = {}) => { if (embedded) window.parent.postMessage({type:'gt-brand:' + action,...data}, window.location.origin); };
  let parentActive = !embedded;
  const $ = s => document.querySelector(s);
  const world = $('#world'), camera = $('#camera'), stage = $('#stage');
  const progress = $('#progress'), position = $('#position'), location = $('#location');
  const play = $('#play'), restart = $('#restart');
  const links = [...document.querySelectorAll('[data-stop]')];
  const chapters = [...document.querySelectorAll('.chapter')];
  const abort = new AbortController();
  const on = (el, name, fn, options = {}) => el.addEventListener(name, fn, { ...options, signal: abort.signal });
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const rad = d => d * Math.PI / 180;
  const stops = [.14, .39, .61, .88];
  const names = ['ИДЕНТИЧНОСТЬ', 'ЗНАК', 'ТИПОГРАФИКА', 'СИСТЕМА'];
  let width = innerWidth, height = innerHeight, maxScroll = 1;
  let target = 0, current = 0, raf = 0, lastTime = 0, playing = false;
  let cameraState = null, volume = null;

  // The letter assembly stands toward the viewer. Its cast shadow is a separate
  // flattened sibling on the ground, not a text-shadow attached to the face.
  document.querySelectorAll('[data-extrude]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label',text);
    el.textContent = '';
    const shadow = document.createElement('span');
    shadow.className = 'word-shadow'; shadow.textContent = text; shadow.setAttribute('aria-hidden', 'true');
    const solid = document.createElement('span'); solid.className = 'word-solid';
    for (let z = 0; z < 30; z += 1.5) {
      const face = document.createElement('span');
      face.className = 'extrusion'; face.textContent = text;
      face.setAttribute('aria-hidden', 'true'); face.style.transform = `translateZ(${z}px)`;
      const tone = Math.round(130 + z / 30 * 64);
      face.style.color = `rgb(${tone},${tone + 5},${Math.min(255,tone + 23)})`;
      solid.append(face);
    }
    const front = document.createElement('span');
    front.className = 'extrusion-front'; front.textContent = text; solid.append(front); el.append(shadow, solid);
  });
  const heroMark = $('.hero-symbol>img');
  const logoObject = document.createElement('div'); logoObject.className = 'logo-object'; heroMark.before(logoObject);
  for (let z = 0; z < 16; z += 2) {
    const edge = heroMark.cloneNode(); edge.alt = ''; edge.className = 'logo-edge'; edge.style.transform = `translateZ(${z}px)`; logoObject.append(edge);
  }
  heroMark.style.transform = 'translateZ(17px)'; logoObject.append(heroMark);
  for(let i=1;i<=14;i++){
    const cell=document.createElement('div');cell.className='symbol-cell';
    cell.innerHTML=`<img src="assets/symbol-${String(i).padStart(2,'0')}.svg" alt="Фирменный графический знак ${i}"><span>${String(i).padStart(2,'0')}</span>`;
    $('#symbol-gallery').append(cell);
  }

  function segment(parent, a, b, className) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz), line = document.createElement('i');
    line.className = className; line.style.width = len + 'px';
    line.style.transform = `translate3d(${a[0]}px,${a[1]}px,${a[2]}px) rotateZ(${Math.atan2(dy, dx)}rad) rotateY(${-Math.atan2(dz, Math.hypot(dx, dy))}rad)`;
    parent.append(line); return line;
  }
  const survey = $('#survey');
  for (let y = -1000; y <= 10000; y += 500) {
    for (const side of [-1, 1]) {
      const x = side * 850;
      segment(survey, [x - 45, y, 0], [x + 45, y, 0], 'survey-line');
      const label = document.createElement('span'); label.className = 'survey-label';
      label.textContent = String(y).padStart(4, '0');
      label.style.cssText = `left:${x + (side < 0 ? -100 : 58)}px;top:${y - 10}px;`;
      survey.append(label);
      if (y < 10000) segment(survey, [side * 1000, y, 0], [side * 1000, y + 500, 0], 'survey-line');
    }
  }
  function wireOrbit(cx, cy, radius, tilt) {
    const group = document.createElement('div'); group.className = 'wire-orbit';
    const n = 40, lat = 6, tiltR = rad(tilt);
    const point = (u, v) => {
      const rr = radius + Math.cos(v) * radius * .16;
      const x = rr * Math.cos(u), y = rr * Math.sin(u), z = Math.sin(v) * radius * .16;
      return [cx + x, cy + y * Math.cos(tiltR) - z * Math.sin(tiltR), 190 + y * Math.sin(tiltR) + z * Math.cos(tiltR)];
    };
    for (let j = 0; j < lat; j++) for (let i = 0; i < n; i++) {
      segment(group, point(i / n * Math.PI * 2, j / lat * Math.PI * 2), point((i + 1) / n * Math.PI * 2, j / lat * Math.PI * 2), 'wire-segment');
      if (i % 5 === 0) segment(group, point(i / n * Math.PI * 2, j / lat * Math.PI * 2), point(i / n * Math.PI * 2, (j + 1) / lat * Math.PI * 2), 'wire-segment');
    }
    $('#wire-objects').append(group);
  }
  wireOrbit(-1030, 1800, 200, 65);
  wireOrbit(1070, 4100, 230, -28);

  function wireBox(parent, cx, cy, cz, w, d, h) {
    const points = [];
    for (const z of [cz, cz + h]) for (const y of [cy - d / 2, cy + d / 2]) for (const x of [cx - w / 2, cx + w / 2]) points.push([x, y, z]);
    for (const [a, b] of [[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]]) segment(parent, points[a], points[b], 'wire-segment');
  }
  const wireObjects = $('#wire-objects');
  // A type specimen, an exploded set of print frames, and a digital display.
  // These are drawn as volumes, rather than images placed beside the ribbon.
  const outerA = [[-150,0],[-40,340],[45,340],[160,0],[85,0],[59,83],[-60,83],[-86,0]];
  const innerA = [[-40,145],[0,275],[40,145]];
  for(const centerY of [-950,4780]) for (const loop of [outerA, innerA]) {
    for (const depth of [-46,46]) for (let i=0; i<loop.length; i++) {
      const a=loop[i], b=loop[(i+1)%loop.length];
      segment(wireObjects,[-1000+a[0],centerY+depth,a[1]],[-1000+b[0],centerY+depth,b[1]],'wire-segment');
    }
    for (const p of loop) segment(wireObjects,[-1000+p[0],centerY-46,p[1]],[-1000+p[0],centerY+46,p[1]],'wire-segment');
  }
  for (let i=0;i<4;i++) {
    const x=1020+i*25, y=2750+i*85;
    wireBox(wireObjects,x,y,30,265,8,370);
    segment(wireObjects,[x-108,y-5,355],[x+108,y-5,355],'wire-segment');
    segment(wireObjects,[x-108,y-5,325],[x+60,y-5,325],'wire-segment');
    segment(wireObjects,[x-108,y-5,80],[x+108,y-5,80],'wire-segment');
  }
  wireBox(wireObjects,1050,7200,0,290,45,450);
  wireBox(wireObjects,1050,7176,48,252,2,340);
  for(let i=0;i<6;i++) segment(wireObjects,[940,7174,110+i*38],[1150-(i%2)*50,7174,110+i*38],'wire-segment');
  wireBox(wireObjects,-1020,6900,0,350,250,12);
  wireBox(wireObjects,-1020,6900,70,350,250,6);
  wireBox(wireObjects,-1020,6900,140,350,250,6);

  const networkRoot=document.createElement('div'); networkRoot.className='network-root';
  const networkBody=document.createElement('div'); networkBody.className='network-body';
  const networkShadow=document.createElement('div'); networkShadow.className='network-shadow';
  networkRoot.append(networkShadow,networkBody); world.append(networkRoot);
  const core=document.createElement('div');core.className='network-core';core.setAttribute('role','img');core.setAttribute('aria-label','Объёмный орбитальный логотип GLOBAL TRIUMPH');networkBody.append(core);
  const nodeLabels=['СМЫСЛ И ХАРАКТЕР','ЗНАК И ГРАФИКА','ВИЗУАЛЬНЫЙ ЯЗЫК','ПРИМЕНЕНИЕ'];
  const vertices=[[-430,-410,20],[430,-410,20],[-430,350,-20],[430,350,-20]];
  const nodeCards=[
    '<div class="nc-words">ХАРАКТЕР<br>ПРЕЖДЕ<br>ФОРМЫ<span>.</span></div><div class="nc-traits">ЯСНО / СМЕЛО / ПО ДЕЛУ</div>',
    '<div class="nc-construction"><img src="../../assets/mark-white.svg" alt=""><i></i></div><div class="nc-traits">ОРБИТЫ / ЗВЕЗДА / ОБЩИЙ ЦЕНТР</div>',
    '<div class="nc-type"><b>Аа</b><span>Science Gothic<br><em>Montserrat</em></span></div><div class="nc-palette"><i></i><i></i><i></i></div>',
    '<img class="nc-photo" src="assets/brandbook-phone.webp" alt=""><div class="nc-traits">ОДИН ХАРАКТЕР В КАЖДОМ КАСАНИИ</div>'
  ];
  const satelliteCards=[
    ['<small>ПОЗИЦИОНИРОВАНИЕ</small><strong>ДЛЯ КОГО.<br>ЗАЧЕМ.<br>ЧТО МЕНЯЕТСЯ.</strong>','<small>ГОЛОС</small><p>Расскажите о задаче.<br>Найдём решение вместе.</p>'],
    ['<img src="../../assets/logo-white.svg" alt=""><small>ЛОГОТИП / КОМПОНОВКА</small>','<div class="mini-symbols"><img src="assets/symbol-03.svg" alt=""><img src="assets/symbol-09.svg" alt=""><img src="assets/symbol-14.svg" alt=""></div><small>ГРАФИЧЕСКИЙ СЛОВАРЬ</small>'],
    ['<small>КОМПОЗИЦИЯ</small><div class="mini-layout"><b>ОДИН<br>ХАРАКТЕР.</b><i></i></div>','<small>РИТМ И МАСШТАБ</small><strong class="mini-alphabet">АБВГДЕЁ<br>ЖЗИЙКЛ<br>012345</strong>'],
    ['<img class="nc-photo" src="assets/brandbook-identity.webp" alt=""><small>ПОЛИГРАФИЯ</small>','<img class="nc-photo" src="assets/brandbook-merch.webp" alt=""><small>МЕРЧ</small>']
  ];
  vertices.forEach((point,i)=>{
    const dot=document.createElement('i');dot.className='network-dot';dot.style.transform=`translate3d(${point[0]}px,${point[1]}px,${point[2]}px)`;networkBody.append(dot);
    const card=document.createElement('div');card.className='network-card';card.setAttribute('aria-hidden','true');
    const n=i;
    card.innerHTML=`<div class="nc-kicker">${String(n+1).padStart(2,'0')} / ${nodeLabels[n]}</div>`+nodeCards[n];
    card.style.transform=`translate3d(${point[0]}px,${point[1]}px,${point[2]+8}px) rotateX(-90deg)`;
    networkBody.append(card);
    for(let j=0;j<2;j++){
      const sub=document.createElement('div');sub.className=`network-satellite ns-${n}`;sub.setAttribute('aria-hidden','true');
      sub.innerHTML=satelliteCards[n][j];
      const sx=point[0]+(j?110:-110),sy=point[1]+200,sz=point[2]-105;
      sub.style.transform=`translate3d(${sx}px,${sy}px,${sz}px)`;
      networkBody.append(sub);
      segment(networkBody,point,[sx,sy,sz],'network-line satellite-line');
    }
  });
  const graphEdges=vertices.map(p=>[[0,0,0],p]);
  const shadowEdges=[];
  graphEdges.forEach(([a,b])=>{
    segment(networkBody,a,b,'network-line');
    const shadow=segment(networkShadow,a,b,'network-line');shadow.style.background='#080c3e55';shadowEdges.push(shadow);
  });
  let networkYaw=0,networkPitch=0;
  function updateNetwork(){
    networkBody.style.transform=`rotateX(${networkPitch}rad) rotateZ(${networkYaw}rad)`;
    const ca=Math.cos(networkYaw),sa=Math.sin(networkYaw),cp=Math.cos(networkPitch),sp=Math.sin(networkPitch);
    const cast=p=>{
      const x=p[0]*ca-p[1]*sa,y=p[0]*sa+p[1]*ca;
      const yy=y*cp-p[2]*sp,z=y*sp+p[2]*cp+250;
      return[x+z*.5,yy+z*.65,-249];
    };
    graphEdges.forEach(([a,b],i)=>{
      const p=cast(a),q=cast(b),dx=q[0]-p[0],dy=q[1]-p[1];
      shadowEdges[i].style.width=Math.hypot(dx,dy)+'px';
      shadowEdges[i].style.transform=`translate3d(${p[0]}px,${p[1]}px,-249px) rotateZ(${Math.atan2(dy,dx)}rad)`;
    });
    networkRoot.dataset.rotation=`${networkYaw.toFixed(3)},${networkPitch.toFixed(3)}`;
    if(volume&&cameraState)volume.draw(cameraState,width,height);
  }
  updateNetwork();
  const networkControl=$('#network-control'); let dragState=null;
  on(networkControl,'pointerdown',e=>{pause();dragState={x:e.clientX,y:e.clientY,yaw:networkYaw,pitch:networkPitch};networkControl.setPointerCapture(e.pointerId);});
  on(networkControl,'pointermove',e=>{if(!dragState)return;networkYaw=dragState.yaw+(e.clientX-dragState.x)*.008;networkPitch=clamp(dragState.pitch-(e.clientY-dragState.y)*.006,-.75,.75);updateNetwork();});
  on(networkControl,'pointerup',()=>{dragState=null;});on(networkControl,'pointercancel',()=>{dragState=null;});
  on(networkControl,'keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();e.stopPropagation();pause();
    if(e.key==='ArrowLeft')networkYaw-=.18;if(e.key==='ArrowRight')networkYaw+=.18;
    if(e.key==='ArrowUp')networkPitch=clamp(networkPitch+.12,-.75,.75);if(e.key==='ArrowDown')networkPitch=clamp(networkPitch-.12,-.75,.75);updateNetwork();
  });

  // Construction rays live in the same coordinate system as the content.
  for (const [x, y, text] of [[-1450, 2350, 'ОРБИТА / ОБЩИЙ ЦЕНТР'], [1080, 5250, 'ШИРИНА / ПЛОТНОСТЬ'], [-1430, 7450, 'ОДНА СИСТЕМА']]) {
    const tag = document.createElement('span'); tag.className = 'wire-caption';
    tag.textContent = text; tag.style.left = x + 'px'; tag.style.top = y + 'px'; $('#wire-objects').append(tag);
  }

  const blocks = [...document.querySelectorAll('[data-center]')];
  blocks.forEach(b=>b.style.setProperty('--depth','3px'));
  const keyframes = [
    [0, -1230, 53, 0, 0, 1.26],
    [.085, -400, 54, 0, 0, 1.26],
    [.14, 620, 57, -2.0, -18, 1.04],
    [.28, 1660, 56, -1.4, 20, 1.05],
    [.39, 2800, 51, 2.8, -15, 1.01],
    [.49, 3600, 56, 1.5, 18, 1.07],
    [.61, 4660, 51, -2.0, 0, 1.03],
    [.73, 5610, 54, -1.2, -5, 1.02],
    [.86, 7180, 50, 2.4, -10, 1.05],
    [.94, 8140, 51, .8, 0, 1.08],
    [1, 9060, 47, 0, 0, 1.14]
  ];
  function pose(t) {
    let i = 1; while (i < keyframes.length - 1 && keyframes[i][0] < t) i++;
    const a = keyframes[i - 1], b = keyframes[i], s = clamp((t - a[0]) / (b[0] - a[0]));
    // Hermite tangents keep the forward velocity continuous at every waypoint.
    const previous = keyframes[Math.max(0, i - 2)], next = keyframes[Math.min(keyframes.length - 1, i + 1)];
    const h = b[0] - a[0], m0 = (b[1] - previous[1]) / (b[0] - previous[0]), m1 = (next[1] - a[1]) / (next[0] - a[0]);
    const s2 = s * s, s3 = s2 * s;
    const y = (2 * s3 - 3 * s2 + 1) * a[1] + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * b[1] + (s3 - s2) * h * m1;
    return [y, ...a.slice(2).map((v, k) => mix(v, b[k + 2], ease(s)))];
  }
  const annotationData = [
    { at: 1050, p: [620, 785, 64], top: '01 / ИДЕНТИЧНОСТЬ', label: 'Характер становится формой', side: 1 },
    { at: 2800, p: [170, 2560, 92], top: '02 / ЗНАК', label: 'Орбиты и общий центр', side: 1 },
    { at: 2800, p: [-620, 3030, 92], top: 'ГЕОМЕТРИЯ', label: 'Пропорции. Контраст. Масштаб.', side: -1 },
    { at: 4700, p: [620, 4500, 56], top: '03 / ТИПОГРАФИКА', label: 'Шрифт задаёт интонацию', side: 1 },
    { at: 5600, p: [-620, 5530, 104], top: 'ЦВЕТ', label: 'Серый / белый / чёрный', side: -1 },
    { at: 7200, p: [620, 6950, 152], top: '04 / СИСТЕМА', label: 'Один характер. Разные форматы.', side: 1 }
  ];
  const ns = 'http://www.w3.org/2000/svg';
  const annotations = annotationData.map(data => {
    const label = document.createElement('div'); label.className = 'annotation';
    const small = document.createElement('small'); small.textContent = data.top;
    label.append(small, document.createTextNode(data.label)); $('#annotations').append(label);
    const path = document.createElementNS(ns, 'path'), dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '2'); $('#leaders').append(path, dot);
    return { ...data, label, path, dot };
  });
  const navTargets = [[[-620, 700, 64], [-620, 1360, 64]], [[-620, 2530, 92], [-620, 3310, 92], [210, 2480, 38]], [[-620, 4420, 56], [-620, 5460, 104]], [[-620, 6930, 76], [240, 6920, 152]]];
  const navRays = Array.from({ length: 3 }, () => {
    const path = document.createElementNS(ns, 'path'), dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '2'); $('#leaders').append(path, dot); return { path, dot };
  });
  let navOrigins = [];

  function project(p, c) {
    const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z;
    const xx = c.ca * dx - c.sa * dy, yy = c.sa * dx + c.ca * dy;
    const ry = c.cp * yy - c.sp * dz, rz = c.sp * yy + c.cp * dz;
    const scale = 1200 / -rz;
    return { x: c.ox + xx * scale, y: c.oy + ry * scale, scale, depth: -rz };
  }
  function render() {
    const [y, pitch, yaw, x, lens] = pose(current);
    const p = rad(pitch), a = rad(yaw);
    const mobile = width < 700, origin = .5;
    const horizontalDistance=1200*1440/(width*(mobile?1.02:.78))*Math.max(1.22,lens);
    const introFit=1-ease(clamp((current-.055)/.085));
    const introDistance=mix(horizontalDistance,Math.max(horizontalDistance,1200*1200/(height*.66)),introFit);
    // Keep the finished physical edge above the controls on short viewports.
    const finalFit=ease(clamp((current-.94)/.06));
    const finalDistance=670*Math.sin(p)+1200*670*Math.cos(p)/Math.max(140,height*(mobile?.57:.52)-110);
    const distance=mix(introDistance,Math.max(introDistance,finalDistance),finalFit);
    const c = { x: x + distance * Math.sin(p) * Math.sin(a), y: y + distance * Math.sin(p) * Math.cos(a), z: distance * Math.cos(p), tx:x,ty:y, ca: Math.cos(a), sa: Math.sin(a), cp: Math.cos(p), sp: Math.sin(p), ox: width * origin, oy: height * (mobile ? .43 : .48) };
    cameraState = c;
    world.style.transform = `translateZ(1200px) rotateX(${pitch}deg) rotateZ(${yaw}deg) translate3d(${-c.x}px,${-c.y}px,${-c.z}px)`;
    volume?.draw(c,width,height);
    for (const block of blocks) {
      const by = Number(block.dataset.center), visible = by < y + distance * .6 && by > y - 7500;
      block.style.visibility = visible ? 'visible' : 'hidden';
    }
    const idx = current < .33 ? 0 : current < .53 ? 1 : current < .80 ? 2 : 3;
    links.forEach((link, i) => { if (idx === i) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
    progress.style.transform = `scaleX(${current})`;
    position.textContent = String(Math.round(current * 100)).padStart(3, '0');
    location.textContent = names[idx];
    document.body.dataset.chapter = String(idx); document.body.dataset.progress = current.toFixed(4);
    if(!playing&&$('#play-label').textContent!==(current>.995?'Повторить пролёт':'Смотреть пролёт'))updatePlay();
    const net=project([0,-950,270],c), netVisible=current<.105&&net.depth>400;
    networkControl.style.display=netVisible?'block':'none';
    if(netVisible){
      const w=clamp(1500*net.scale,180,width*.85),h=clamp(1200*net.scale,160,height*.79);
      Object.assign(networkControl.style,{left:(net.x-w/2)+'px',top:clamp(net.y-h/2,90,height-h-100)+'px',width:w+'px',height:h+'px'});
    }
    navRays.forEach((ray, i) => {
      const targetPoint = navTargets[idx][i], originPoint = navOrigins[idx];
      const point = targetPoint && project(targetPoint, c);
      const show = !mobile && originPoint && point && point.depth > 450 && point.y > 110 && point.y < height - 100;
      ray.path.style.display = show ? '' : 'none'; ray.dot.style.display = show ? '' : 'none';
      if (!show) return;
      const [sx, sy] = originPoint;
      ray.path.setAttribute('d', `M${sx},${sy} C${sx + 120},${sy} ${point.x - 100},${point.y} ${point.x},${point.y}`);
      ray.path.style.opacity = '.52'; ray.dot.setAttribute('cx', point.x); ray.dot.setAttribute('cy', point.y);
    });
    for (const item of annotations) {
      const point = project(item.p, c), proximity = 1 - Math.abs(y - item.at) / 1450;
      const show = !mobile && proximity > 0 && point.depth > 400 && point.y > 100 && point.y < height - 130;
      item.label.style.display = show ? '' : 'none'; item.path.style.display = show ? '' : 'none'; item.dot.style.display = show ? '' : 'none';
      if (!show) continue;
      const lx = item.side > 0 ? clamp(point.x + 50, width * .73, width - 260) : clamp(point.x - 250, 225, width * .38);
      const ly = clamp(point.y - 70, 120, height - 160);
      item.label.style.transform = `translate(${lx}px,${ly - 37}px)`;
      item.label.style.opacity = clamp(proximity * 2);
      const endX = item.side > 0 ? lx : lx + 180;
      item.path.setAttribute('d', `M${point.x},${point.y} C${point.x + item.side * 65},${point.y - 8} ${endX - item.side * 30},${ly} ${endX},${ly}`);
      item.path.style.opacity = clamp(proximity) * .65;
      item.dot.setAttribute('cx', point.x); item.dot.setAttribute('cy', point.y);
    }
  }
  function updatePlay() {
    $('#play-label').textContent = playing ? 'Пауза' : current > .995 ? 'Повторить пролёт' : 'Смотреть пролёт';
    $('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
    play.setAttribute('aria-label', playing ? 'Приостановить пролёт' : 'Запустить пролёт');
    play.setAttribute('aria-pressed', String(playing));
  }
  function tick(now) {
    raf = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60; lastTime = now;
    if (document.hidden || !parentActive) return;
    if (playing) {
      target = clamp(target + dt / 55);
      seek(target);
      if (target >= 1) { playing = false; updatePlay(); }
    }
    current = mix(current, target, 1 - Math.exp(-dt * 9));
    if (Math.abs(current - target) < .00001) current = target;
    render();
    if (playing || Math.abs(current - target) > .00001) schedule();
  }
  function schedule() { if (!raf && !document.hidden && parentActive) raf = requestAnimationFrame(tick); }
  function seek(value, behavior='instant') {
    if(embedded)sendParent('seek',{progress:clamp(value),behavior});
    else window.scrollTo({top:clamp(value)*maxScroll,behavior});
  }
  function pause() { if (playing) { playing = false; updatePlay(); } }
  function measure() {
    width = stage.clientWidth; height = innerHeight;
    navOrigins = links.map(link => { const box = link.getBoundingClientRect(); return [box.right - 1, box.top + box.height / 2]; });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if(!embedded)target = clamp(scrollY / maxScroll);
    render(); schedule();
  }
  on(window,'message',event=>{
    if(!embedded||event.origin!==window.location.origin||event.source!==window.parent)return;
    const data=event.data;if(!data)return;
    if(data.type!=='gt-brand:progress')return;
    parentActive=!!data.active;
    if(!parentActive){pause();if(raf)cancelAnimationFrame(raf);raf=0;return;}
    if(Number.isFinite(data.progress))target=clamp(data.progress);
    schedule();
  });
  if(embedded){
    on(window,'wheel',event=>{
      pause();sendParent('delta',{delta:event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1)});
      event.preventDefault();
    },{passive:false});
    on(window,'keydown',event=>{
      if(event.target.closest('input,textarea,select')||event.target===networkControl)return;
      const steps={PageDown:innerHeight*.85,PageUp:-innerHeight*.85,ArrowDown:80,ArrowUp:-80};
      if(event.key in steps){event.preventDefault();sendParent('delta',{delta:steps[event.key]});}
      else if(event.key==='Home'||event.key==='End'){event.preventDefault();seek(event.key==='Home'?0:1,'smooth');}
    });
    on($('[data-brand-talk]'),'click',event=>{event.preventDefault();sendParent('talk');});
  }
  on(window, 'scroll', () => { if (!embedded) { target = clamp(scrollY / maxScroll); schedule(); } }, { passive: true });
  on(window, 'resize', measure, { passive: true });
  on(window, 'wheel', pause, { passive: true }); on(window, 'touchstart', pause, { passive: true });
  on(window, 'keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) pause();
  });
  on(document, 'visibilitychange', () => { pause(); lastTime = 0; if (!document.hidden) schedule(); });
  on(play, 'click', () => {
    if (playing) { pause(); return; }
    if (current > .995) { target = current = 0; seek(0); }
    playing = true; lastTime = 0; updatePlay(); schedule();
  });
  on(restart, 'click', () => {
    pause(); if(embedded){seek(0,'smooth');return;} window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', locationURL('identity'));
  });
  function locationURL(id) { return window.location.pathname + window.location.search + '#' + id; }
  links.forEach((link, i) => on(link, 'click', event => {
    event.preventDefault(); pause();
    if(embedded){seek(stops[i],'smooth');return;}
    history.replaceState(null, '', locationURL(chapters[i].id));
    window.scrollTo({ top: stops[i] * maxScroll, behavior: 'smooth' });
  }));
  on($('.wordmark'), 'click', event => { event.preventDefault(); pause(); seek(0,'smooth'); });
  let volumePending=false;
  function ensureVolume(){
    if(volume||volumePending)return;volumePending=true;
    import('./volume.js?v=9').then(m=>m.createVolumeRenderer(stage,world)).then(v=>{volumePending=false;volume=v;render();}).catch(e=>{volumePending=false;document.body.dataset.volumeError=e.message;console.error('Volume scene:',e);});
  }
  document.fonts.ready.then(() => {
    measure();
    const idx = chapters.findIndex(ch => '#' + ch.id === window.location.hash);
    if (idx >= 0 && !embedded) {
      current = target = idx === 0 ? 0 : stops[idx]; window.scrollTo({ top: target * maxScroll, behavior: 'instant' }); render();
    }
    document.body.dataset.ready = 'true'; updatePlay();
    ensureVolume();
    sendParent('ready');
  });
  // No timers or animation frame survive navigation away from this standalone scene.
  on(window, 'pagehide', () => { pause(); if (raf) cancelAnimationFrame(raf); raf = 0; });
  on(window, 'pageshow', () => { lastTime = 0; measure(); schedule(); });
})();
