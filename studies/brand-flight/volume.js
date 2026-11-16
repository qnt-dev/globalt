import * as THREE from 'three';
import {SVGLoader} from './vendor/SVGLoader.js';
import {buildBrandExhibits} from './exhibit-models.js';

export async function createVolumeRenderer(stage, world) {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setClearColor(0x090c12); renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.className='volume-canvas'; renderer.domElement.setAttribute('aria-hidden','true'); stage.prepend(renderer.domElement);
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(40,1,10,40000);
  cam.up.set(0,0,1);
  scene.add(new THREE.AmbientLight(0xe1e8ff,1.5));
  const key=new THREE.DirectionalLight(0xffffff,2.2); key.position.set(-1200,-1800,2400);scene.add(key);
  const fill=new THREE.DirectionalLight(0x9aafff,.8);fill.position.set(1800,-1000,800);scene.add(fill);
  const white=new THREE.MeshStandardMaterial({color:0xf2f4ff,roughness:.47,metalness:.08,side:THREE.DoubleSide});
  const edge=new THREE.MeshStandardMaterial({color:0xa6afc9,roughness:.58,metalness:.13,side:THREE.DoubleSide});
  const wireMaterial=new THREE.LineBasicMaterial({color:0xe1e9ff,transparent:true,opacity:.78});

  function gridTexture(color,line) {
    const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');
    ctx.fillStyle=color;ctx.fillRect(0,0,1024,1024);
    ctx.strokeStyle='rgba(181,201,239,.18)';ctx.lineWidth=1.6;
    for(let i=1;i<5;i++){const n=i*1024/5;ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n,1024);ctx.moveTo(0,n);ctx.lineTo(1024,n);ctx.stroke();}
    ctx.strokeStyle=line;ctx.lineWidth=3.6;ctx.strokeRect(1,1,1022,1022);
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
  }
  function floor(x,y,w,h,color,grid=false,z=0) {
    const map=grid?gridTexture(color,'rgba(180,198,240,.43)'):null;
    if(map)map.repeat.set(w/500,h/500);
    const material=new THREE.MeshBasicMaterial({color:map?0xffffff:color,map});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,-y,z);scene.add(mesh);return mesh;
  }
  floor(0,2800,8400,20000,'#090c12',true,-3);
  floor(0,1680,1440,9360,'#3025d9',true);
  floor(0,7285,1440,1850,'#12151b',false,.1);
  floor(0,8970,1440,1520,'#a8add7',false,.1);

  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d');sc.scale(1,.25);const grad=sc.createRadialGradient(128,128,10,128,128,120);
  grad.addColorStop(0,'rgba(3,6,24,.45)');grad.addColorStop(.5,'rgba(3,6,24,.25)');grad.addColorStop(1,'rgba(3,6,24,0)');sc.fillStyle=grad;sc.fillRect(0,0,256,256);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas);
  function softShadow(x,y,w,h,z=1) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
    mesh.position.set(x,-y,z);scene.add(mesh);
  }
  const loader=new SVGLoader();
  const [textData,logoText]=await Promise.all([fetch('./text-outlines.json').then(r=>r.json()),fetch('../../assets/mark-white.svg').then(r=>r.text())]);
  function shapes(svg){return loader.parse(svg).paths.flatMap(p=>SVGLoader.createShapes(p));}
  function extrude(svg,scale,baseline,depth=22){
    const g=new THREE.ExtrudeGeometry(shapes(svg),{depth:depth/scale,bevelEnabled:true,bevelThickness:.9/scale,bevelSize:.8/scale,bevelSegments:2,curveSegments:10,steps:1});
    g.scale(scale,scale,scale);g.translate(0,-baseline*scale,0);g.rotateX(-Math.PI/2);g.computeBoundingBox();return g;
  }
  function worldPosition(el){
    let x=0,y=0,z=0,n=el;
    while(n&&n!==world){x+=n.offsetLeft;y+=n.offsetTop;if(n.classList?.contains('block'))z+=parseFloat(n.style.getPropertyValue('--z'))||0;n=n.offsetParent;}
    return{x,y,z};
  }
  document.querySelectorAll('[data-extrude]').forEach(el=>{
    if(el.classList.contains('specimen-aa'))return;
    const text=el.querySelector('.extrusion-front').textContent,data=textData.words[text];if(!data)return;
    const size=parseFloat(getComputedStyle(el).fontSize),scale=size/textData.upm;
    const depth=Math.min(26,size*.18),laid=el.dataset.orientation==='flat';
    const geometry=extrude(data.svg,scale,textData.cap,depth);
    if(laid){geometry.rotateX(-Math.PI/2);geometry.translate(0,0,depth);}
    const p=worldPosition(el),width=geometry.boundingBox.max.x-geometry.boundingBox.min.x;
    let x=p.x;
    if(getComputedStyle(el).textAlign==='center')x+=(el.clientWidth-width)/2;
    const baseline=p.y+el.clientHeight;
    const mesh=new THREE.Mesh(geometry,[white,edge]);mesh.position.set(x,-baseline,p.z+(laid?2:8));scene.add(mesh);
    if(laid)softShadow(x+width/2+3,baseline-size*.32+5,width*1.02,size*.88,p.z+1);
    else softShadow(x+width/2+12,baseline+20,width*1.11,58,p.z+1);
  });
  // The orbital mark uses its original vector outline, not stacked image copies.
  const logoShapes=shapes(logoText), logoFlat=new THREE.ShapeGeometry(logoShapes);logoFlat.computeBoundingBox();
  const lb=logoFlat.boundingBox, ls=264/(lb.max.x-lb.min.x);
  const logoGeometry=new THREE.ExtrudeGeometry(logoShapes,{depth:11/ls,bevelEnabled:true,bevelSize:.3/ls,bevelThickness:.5/ls,bevelSegments:2,curveSegments:20});
  logoGeometry.translate(-lb.min.x,-lb.max.y,0);logoGeometry.scale(ls,ls,ls);logoGeometry.rotateX(-Math.PI/2);
  const logoDOM=document.querySelector('.logo-object'), lp=worldPosition(logoDOM);
  const logoMesh=new THREE.Mesh(logoGeometry,[white,edge]);logoMesh.position.set(lp.x,-(lp.y+logoDOM.clientHeight),lp.z+6);scene.add(logoMesh);
  softShadow(lp.x+132,lp.y+logoDOM.clientHeight+15,310,60,lp.z+1);
  logoFlat.dispose();

  const endGeometry=logoGeometry.clone();endGeometry.scale(1.42,1.6,1.42);
  const endMark=new THREE.Mesh(endGeometry,[white,edge]);
  endMark.position.set(240,-9020,8);scene.add(endMark);
  softShadow(425,9040,425,90,1);

  const centralGeometry=logoGeometry.clone();centralGeometry.scale(1.14,2.1,1.14);centralGeometry.computeBoundingBox();
  const cb=centralGeometry.boundingBox;
  centralGeometry.translate(-(cb.min.x+cb.max.x)/2,-(cb.min.y+cb.max.y)/2,-(cb.min.z+cb.max.z)/2);
  const centralAssembly=new THREE.Group();centralAssembly.name='Central 3D orbital logo';centralAssembly.matrixAutoUpdate=false;
  centralAssembly.add(new THREE.Mesh(centralGeometry,[white,edge]));scene.add(centralAssembly);
  softShadow(0,-940,390,120,1);
  const rx=new THREE.Matrix4(),rz=new THREE.Matrix4();
  document.body.dataset.centralLogo='mesh';

  const ag=extrude(textData.words['А'].svg,310/textData.upm,textData.cap,50);
  const drawings=buildBrandExhibits(scene,{material:wireMaterial,logoGeometry,letterGeometry:ag});
  document.body.dataset.exhibits=String(drawings.userData.objectCount);

  let lastW=0,lastH=0;
  document.body.classList.add('volume-on');document.body.dataset.volume='ready';
  return {
    draw(c,w,h){
      if(w!==lastW||h!==lastH){lastW=w;lastH=h;renderer.setSize(w,h,false);cam.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/2400));cam.aspect=w/h;cam.setViewOffset(w,h,0,h*(w<700?.07:.02),w,h);cam.updateProjectionMatrix();}
      const [yaw,pitch]=(document.querySelector('.network-root')?.dataset.rotation||'0,0').split(',').map(Number);
      centralAssembly.matrix.makeTranslation(0,950,270).multiply(rx.makeRotationX(-pitch)).multiply(rz.makeRotationZ(-yaw));
      centralAssembly.matrixWorldNeedsUpdate=true;
      cam.position.set(c.x,-c.y,c.z);cam.lookAt(c.tx,-c.ty,0);renderer.render(scene,cam);
    },
    dispose(){renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();});renderer.domElement.remove();}
  };
}
