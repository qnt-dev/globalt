import * as THREE from 'three';

// All models share the exhibition's Z-up coordinates. Their wire outlines
// describe actual volumes; no screenshot or flat icon substitutes for a model.
export function buildBrandExhibits(scene,{material,logoGeometry,letterGeometry}){
  const collection=new THREE.Group();collection.name='Brand exhibition';scene.add(collection);
  let count=0;
  function edges(g,parent,x=0,y=0,z=0){const e=new THREE.LineSegments(new THREE.EdgesGeometry(g,28),material);e.position.set(x,y,z);parent.add(e);return e;}
  function box(parent,w,d,h,x=0,y=0,z=0){return edges(new THREE.BoxGeometry(w,d,h),parent,x,y,z);}
  function line(parent,points){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const l=new THREE.Line(g,material);parent.add(l);return l;}
  function curve(parent,points){const c=new THREE.CubicBezierCurve3(...points.map(p=>new THREE.Vector3(...p)));return line(parent,c.getPoints(40).map(p=>[p.x,p.y,p.z]));}
  function cylinder(parent,radius,depth,x=0,y=0,z=0){return edges(new THREE.CylinderGeometry(radius,radius,depth,48),parent,x,y,z);}
  function label(parent,text,z=-20){
    const cv=document.createElement('canvas');cv.width=1024;cv.height=96;
    const cx=cv.getContext('2d');cx.font='26px monospace';cx.fillStyle='#bdcde8';cx.textAlign='center';cx.fillText(text,512,58);
    const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
    sprite.scale.set(390,36,1);sprite.position.set(0,-110,z);parent.add(sprite);
  }
  function group(x,y,name){const g=new THREE.Group();g.position.set(x,-y,0);g.name=name;collection.add(g);count++;return g;}
  function emblem(parent,width,y,z){
    const geo=logoGeometry.clone();geo.computeBoundingBox();const b=geo.boundingBox;
    const scale=width/(b.max.x-b.min.x);
    geo.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-(b.max.z+b.min.z)/2);geo.scale(scale,scale,scale);
    edges(geo,parent,0,y,z);
  }
  function roundSign(x,y){
    const g=group(x,y,'Круглая объёмная вывеска');
    cylinder(g,119,20,0,0,337);cylinder(g,109,1,0,-11,337);
    box(g,16,22,215,0,12,112);box(g,160,115,12,0,0,7);
    emblem(g,161,-14,337);label(g,'ВЫВЕСКА / ОБЪЁМНЫЙ ЗНАК');
  }
  function totem(x,y){
    const g=group(x,y,'Навигационный световой пилон');
    box(g,210,38,380,0,0,218);box(g,182,1,350,0,-20,218);box(g,245,125,14,0,0,8);
    emblem(g,132,-22,310);
    for(let i=0;i<3;i++)line(g,[[-67,-23,186-i*38],[67-i*18,-23,186-i*38]]);
    label(g,'ПИЛОН / НАВИГАЦИЯ');
  }
  function book(x,y){
    const g=group(x,y,'Открытый брендбук');g.position.z=20;
    for(const side of [-1,1]){
      const page=new THREE.Group();page.position.set(side*74,0,24);page.rotation.y=side*.16;g.add(page);
      box(page,150,250,12);
      for(let i=0;i<5;i++)line(page,[[-55,75-i*30,7],[55-(i%2)*18,75-i*30,7]]);
    }
    box(g,8,260,15,0,0,8);label(g,'БРЕНДБУК / РАЗВОРОТ',-35);
  }
  function folder(x,y){
    const g=group(x,y,'Папка с комплектом полиграфии');
    box(g,250,320,17,0,0,14);box(g,231,300,3,0,0,29);
    line(g,[[-103,-135,32],[-103,135,32],[103,135,32]]);
    box(g,170,105,2,8,-25,33);label(g,'ПАПКА / ФИРМЕННЫЙ КОМПЛЕКТ',-25);
  }
  function cards(x,y){
    const g=group(x,y,'Стопка визиток');
    for(let i=0;i<5;i++)box(g,240,140,2,i*3,i*4,5+i*3);
    box(g,240,140,2,42,-50,23);
    line(g,[[-56,-93,25],[104,-93,25]]);line(g,[[-56,-78,25],[45,-78,25]]);
    label(g,'ВИЗИТКИ / БУМАГА',-30);
  }
  function roll(x,y){
    const g=group(x,y,'Рулон с развёрнутым постером');
    cylinder(g,47,240,-113,0,51);cylinder(g,36,1,-113,-121,51);
    for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])line(g,[[-113+47*Math.cos(angle),-120,51+47*Math.sin(angle)],[-113+47*Math.cos(angle),120,51+47*Math.sin(angle)]]);
    line(g,[[-95,-120,8],[160,-120,8],[160,120,8],[-95,120,8]]);
    for(let i=0;i<3;i++)line(g,[[-30,-65+i*40,9],[110,-65+i*40,9]]);
    label(g,'ПОСТЕР / ПЕЧАТЬ',-25);
  }
  function cap(x,y){
    const g=group(x,y,'Кепка с конструкцией купола и козырька');
    for(let j=0;j<5;j++){
      const theta=j/5*Math.PI/2,rr=100*Math.cos(theta),zz=100*Math.sin(theta)+18;
      line(g,Array.from({length:73},(_,i)=>[rr*Math.cos(i/72*Math.PI*2),rr*Math.sin(i/72*Math.PI*2),zz]));
    }
    for(let j=0;j<8;j++){
      const phi=j/8*Math.PI*2;
      line(g,Array.from({length:25},(_,i)=>{const t=i/24*Math.PI/2;return[100*Math.cos(t)*Math.cos(phi),100*Math.cos(t)*Math.sin(phi),18+100*Math.sin(t)];}));
    }
    for(const r of [97,132,170])line(g,Array.from({length:45},(_,i)=>{const a=Math.PI+i/44*Math.PI;return[r*Math.cos(a),r*Math.sin(a)-20,18-9*Math.sin(a)**2];}));
    line(g,[[-97,-20,18],[-170,-20,18]]);line(g,[[97,-20,18],[170,-20,18]]);
    box(g,12,12,7,0,0,122);label(g,'КЕПКА / ВЫШИВКА',-25);
  }
  function tote(x,y){
    const g=group(x,y,'Тканевый шоппер с ручками');
    const s=new THREE.Shape();s.moveTo(-110,255);s.lineTo(110,255);s.lineTo(100,20);s.quadraticCurveTo(0,-2,-100,20);s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:72,bevelEnabled:true,bevelSize:8,bevelThickness:5,bevelSegments:3,steps:1,curveSegments:16});geo.translate(0,0,-36);geo.rotateX(Math.PI/2);edges(geo,g);
    for(const yy of [-45,45])for(const inset of [0,9])curve(g,[[-66+inset,yy,253],[-72+inset,yy,413],[72-inset,yy,413],[66-inset,yy,253]]);
    line(g,[[-90,-45,239],[90,-45,239]]);line(g,[[-87,-43,36],[87,-43,36]]);
    emblem(g,115,-49,142);label(g,'ШОППЕР / ТКАНЬ',-25);
  }
  function shirt(x,y){
    const g=group(x,y,'Футболка с горловиной, рукавами и швами');
    const s=new THREE.Shape();s.moveTo(-45,350);s.bezierCurveTo(-25,311,25,311,45,350);s.lineTo(91,345);s.lineTo(182,271);s.lineTo(140,214);s.lineTo(106,239);s.lineTo(105,30);s.quadraticCurveTo(0,17,-105,30);s.lineTo(-106,239);s.lineTo(-140,214);s.lineTo(-182,271);s.lineTo(-91,345);s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:32,bevelEnabled:true,bevelThickness:5,bevelSize:5,bevelSegments:2,curveSegments:20});geo.translate(0,0,-16);geo.rotateX(Math.PI/2);edges(geo,g);
    curve(g,[[-44,-23,347],[-25,-25,309],[25,-25,309],[44,-23,347]]);
    curve(g,[[-99,-24,42],[-40,-29,34],[40,-29,34],[99,-24,42]]);
    line(g,[[-166,-22,259],[-137,-22,225]]);line(g,[[166,-22,259],[137,-22,225]]);
    emblem(g,87,-26,231);label(g,'ФУТБОЛКА / ФИРМЕННЫЙ МЕРЧ',-25);
  }

  roundSign(-930,-1450);cap(930,-1320);cards(-940,-2020);
  folder(-930,100);totem(940,380);book(-940,1370);shirt(940,1410);
  cards(-940,2440);roundSign(940,2530);tote(-940,3370);
  edges(letterGeometry,collection,940,-4200,10);count++;
  roll(-940,4990);cap(940,5220);book(-940,6890);shirt(940,6890);
  folder(-940,7700);tote(940,7830);
  collection.userData.objectCount=count;
  return collection;
}
