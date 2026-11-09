/* SI-LIAISONS — moteur cinématique 3D léger, sans bibliothèque externe.
   Chaque solide mobile subit une transformation rigide 3D autour de O.
   La projection isométrique est calculée par le moteur. Modèles didactiques simplifiés. */
(function(){
'use strict';
const COLORS={fix:'#1681b7',move:'#ed9a42',steel:'#becedb',dark:'#294e68',mint:'#40dfb0',red:'#f56b61'};
const keys=['Tx','Ty','Tz','Rx','Ry','Rz'];
const labels={Tx:'Translation selon X',Ty:'Translation selon Y',Tz:'Translation selon Z',Rx:'Rotation autour de X',Ry:'Rotation autour de Y',Rz:'Rotation autour de Z'};
const V=(x=0,y=0,z=0)=>[x,y,z];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>a.map(t=>t*s);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(...a)||1;
const norm=a=>mul(a,1/len(a));
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const toRgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const sh=(color,k)=>'rgb('+toRgb(color).map(x=>Math.round(clamp(x*k,0,255))).join(',')+')';
const C={canvas:null,ctx:null,joint:null,motion:'Tx',allowed:false,playing:true,raf:0,start:0,w:0,h:0,reduced:false,frame:0,speed:1,amplitude:1,preview:false};
const faces=[],paths=[];
function face(points,color,alpha=1,details=false){
 if(points.length<3)return;
 faces.push({points,color,alpha,details});
}
function line(points,color='#d6eef6',width=2,dash=[]){paths.push({points,color,width,dash});}
function putBox(center,size,color){
 const [x,y,z]=center,[a,b,c]=size.map(t=>t/2);
 const p=[[x-a,y-b,z-c],[x+a,y-b,z-c],[x+a,y+b,z-c],[x-a,y+b,z-c],[x-a,y-b,z+c],[x+a,y-b,z+c],[x+a,y+b,z+c],[x-a,y+b,z+c]];
 for(const idx of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[3,2,1,0],[4,5,6,7]])face(idx.map(i=>p[i]),color);
}
function cylinder(center,axis,length,radius,color,segments=18,open=false){
 const u=norm(axis),helper=Math.abs(u[2])>.8?V(0,1,0):V(0,0,1);
 const e1=norm(cross(helper,u)),e2=cross(u,e1);
 const ends=[add(center,mul(u,-length/2)),add(center,mul(u,length/2))],rings=[[],[]];
 for(let a=0;a<2;a++)for(let k=0;k<segments;k++){
  const t=2*Math.PI*k/segments;
  rings[a].push(add(ends[a],add(mul(e1,radius*Math.cos(t)),mul(e2,radius*Math.sin(t)))));
 }
 for(let k=0;k<segments;k++){
  const n=(k+1)%segments;
  face([rings[0][n],rings[1][n],rings[1][k],rings[0][k]],color);
 }
 if(!open){face([...rings[0]].reverse(),color);face(rings[1],color);}
 return {rings,ends,e1,e2,u};
}
function tube(center,axis,length,r1,r0,color,n=20){
 const a=cylinder(center,axis,length,r1,color,n,true);
 const u=a.u,ends=a.ends;
 const inner=[[],[]];
 for(let j=0;j<2;j++)for(let k=0;k<n;k++){
  const t=2*Math.PI*k/n;
  inner[j].push(add(ends[j],add(mul(a.e1,r0*Math.cos(t)),mul(a.e2,r0*Math.sin(t)))));
 }
 for(let k=0;k<n;k++){
  const next=(k+1)%n;
  face([inner[0][k],inner[1][k],inner[1][next],inner[0][next]],color);
  face([a.rings[0][next],a.rings[0][k],inner[0][k],inner[0][next]],color);
  face([a.rings[1][k],a.rings[1][next],inner[1][next],inner[1][k]],color);
 }
}
function sphere(center,radius,color,rows=11,cols=20){
 const verts=[];
 for(let j=0;j<=rows;j++){
  const ph=-Math.PI/2+j*Math.PI/rows,row=[];
  for(let k=0;k<cols;k++){const t=2*Math.PI*k/cols;row.push(add(center,V(radius*Math.cos(ph)*Math.cos(t),radius*Math.cos(ph)*Math.sin(t),radius*Math.sin(ph))));}
  verts.push(row);
 }
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
  const next=(k+1)%cols;
  face([verts[j][k],verts[j][next],verts[j+1][next],verts[j+1][k]],color);
 }
}
function rod(start,end,r,color){
 const axis=sub(end,start);
 cylinder(mul(add(start,end),.5),axis,len(axis),r,color,12);
 sphere(start,r*1.12,color,6,10);sphere(end,r*1.12,color,6,10);
}
function screwThread(start=-2.1,end=2.1,rad=.31,turns=10){
 const pts=[];let n=turns*24;
 for(let i=0;i<=n;i++){const t=i/n;pts.push(V(start+(end-start)*t,rad*Math.cos(t*turns*Math.PI*2),rad*Math.sin(t*turns*Math.PI*2)));}
 line(pts,'#ebf3fb',2.2);
}
function basePlate(){
 putBox(V(0,0,-.48),[4.45,2.65,.42],COLORS.fix);
 for(const x of [-1.75,1.75])for(const y of [-.85,.85]){
  cylinder(V(x,y,-.22),V(0,0,1),.16,.14,COLORS.steel,8);
 }
}
function plateBolts(){
 for(const x of [-.6,.6])for(const y of [-.45,.45]){
  cylinder(V(x,y,.53),V(0,0,1),.2,.115,COLORS.steel,6);
  cylinder(V(x,y,.65),V(0,0,1),.07,.12,COLORS.dark,6);
 }
}
function fixedModel(kind){
 switch(kind){
 case 'fixed':basePlate();putBox(V(0,0,-.05),[1.6,1.35,.65],COLORS.fix);break;
 case 'shaft':
  if(C.joint && C.joint.id==='pivot'){putBox(V(0,0,-.65),[2.2,1.25,.7],COLORS.fix);putBox(V(-.65,0,-.04),[.3,1.3,1.05],COLORS.fix);putBox(V(.65,0,-.04),[.3,1.3,1.05],COLORS.fix);cylinder(V(0,0,0),V(1,0,0),1.9,.23,COLORS.steel);break;}
  putBox(V(0,0,-.58),[1.25,1.5,.58],COLORS.fix);
  tube(V(0,0,0),V(1,0,0),1.15,.64,.41,COLORS.fix);break;
 case 'rail':
  putBox(V(0,-.7,-.50),[4.8,.33,.34],COLORS.fix);
  putBox(V(0,.7,-.50),[4.8,.33,.34],COLORS.fix);
  putBox(V(0,0,-.78),[5,1.95,.24],COLORS.dark);
  for(const x of [-2,0,2])for(const y of [-.7,.7])cylinder(V(x,y,-.25),V(0,0,1),.09,.10,COLORS.steel,6);
  break;
 case 'screw':
  putBox(V(-2.4,0,-.7),[.48,1.5,1.5],COLORS.fix);
  putBox(V(2.4,0,-.7),[.48,1.5,1.5],COLORS.fix);
  cylinder(V(0,0,0),V(1,0,0),4.7,.31,COLORS.steel,22);
  screwThread();
  break;
 case 'ball':
 case 'ball-stop':
  putBox(V(0,0,-1.1),[1.55,1.55,.42],COLORS.fix);
  cylinder(V(0,0,-.6),V(0,0,1),.7,.74,COLORS.fix,22);
  sphere(V(0,0,0),.69,COLORS.dark,9,20);
  if(kind==='ball-stop')putBox(V(.54,0,.12),[.2,.28,.32],COLORS.steel);
  break;
 case 'plane':
 case 'point':
 case 'line':basePlate();break;
 case 'annular':
  putBox(V(0,0,-.65),[2.6,1.7,.55],COLORS.fix);
  tube(V(0,0,0),V(1,0,0),2.6,.79,.58,COLORS.fix);
  break;
 }
}
function movingModel(kind){
 switch(kind){
 case 'fixed':
   putBox(V(0,0,.66),[1.6,1.35,.78],COLORS.move);plateBolts();
   putBox(V(.12,.1,1.25),[1.15,1,.37],COLORS.steel);break;
 case 'shaft':
   if(C.joint && C.joint.id==='pivot'){
     putBox(V(0,.95,.30),[.82,2.2,.38],COLORS.move);
     putBox(V(0,1.96,.42),[1,1.22,.46],COLORS.move);
     cylinder(V(0,0,0),V(1,0,0),1.65,.3,COLORS.move,18);
     cylinder(V(.95,0,0),V(1,0,0),.12,.35,COLORS.steel,20);
   }else{
     cylinder(V(0,0,0),V(1,0,0),4.05,.39,COLORS.steel,21);
     cylinder(V(1.95,0,0),V(1,0,0),.19,.65,COLORS.move,20);
     rod(V(1.96,0,0),V(1.96,.85,.55),.13,COLORS.move);
     cylinder(V(-1.95,0,0),V(1,0,0),.09,.49,COLORS.move);
   }
   break;
 case 'rail':
   putBox(V(0,0,-.06),[1.35,2.00,.52],COLORS.move);
   putBox(V(0,0,.49),[1.75,1.65,.56],COLORS.move);
   for(const x of [-.45,.45])for(const y of [-.48,.48])cylinder(V(x,y,.84),V(0,0,1),.12,.11,COLORS.steel,8);
   break;
 case 'screw':
   tube(V(0,0,0),V(1,0,0),.87,.66,.34,COLORS.move,6);
   for(const a of [-.44,.44])cylinder(V(a,0,0),V(1,0,0),.07,.7,COLORS.move,6);
   rod(V(0,0,.57),V(0,0,1.25),.11,COLORS.move);
   break;
 case 'ball':
 case 'ball-stop':
   sphere(V(0,0,0),.59,COLORS.steel,12,22);
   rod(V(0,0,.42),V(0,0,1.9),.19,COLORS.move);
   rod(V(0,0,1.72),V(.47,0,1.92),.1,COLORS.move);
   break;
 case 'plane':
   putBox(V(0,0,.11),[1.65,1.35,.29],COLORS.move);
   putBox(V(.32,0,.43),[.24,.28,.36],COLORS.steel);break;
 case 'point':
   sphere(V(0,0,.65),.63,COLORS.move,12,24);
   rod(V(0,0,1.12),V(.46,.18,2),.11,COLORS.move);break;
 case 'annular':
   sphere(V(0,0,0),.56,COLORS.move,12,22);
   rod(V(-1.7,0,0),V(1.7,0,0),.19,COLORS.move);
   rod(V(1.72,0,0),V(1.72,.55,.3),.12,COLORS.move);break;
 case 'line':
   cylinder(V(0,0,.64),V(1,0,0),3.4,.63,COLORS.move,25);
   cylinder(V(1.78,0,.64),V(1,0,0),.17,.76,COLORS.steel,22);
   rod(V(1.77,0,.64),V(1.77,.46,.98),.11,COLORS.move);break;
 }
}
function rot(p,axis,angle){
 const [x,y,z]=p,c=Math.cos(angle),s=Math.sin(angle);
 if(axis===0)return V(x,y*c-z*s,y*s+z*c);
 if(axis===1)return V(x*c+z*s,y,-x*s+z*c);
 return V(x*c-y*s,x*s+y*c,z);
}
function matrixMove(p,k,q,j){
 if(!k)return p;
 if(j.id==='helicoidale'&&(k==='Tx'||k==='Rx')){
  return add(rot(p,0,q*1.5),V(q*.65,0,0));
 }
 const axis=keys.indexOf(k)%3;
 if(k.charAt(0)==='T'){
  return add(p,mul([V(1,0,0),V(0,1,0),V(0,0,1)][axis],q*1.10));
 }
 return rot(p,axis,q*.75);
}
function proj(v){
 const scale=Math.min(C.w/12.2,C.h/6.3);
 return [C.w*.53+(v[0]-v[1])*.96*scale,C.h*.58+(v[0]+v[1])*.42*scale-v[2]*1.08*scale];
}
function depth(v){return v[0]+v[1]+v[2]*1.12;}
function normal(p){
 const n=norm(cross(sub(p[1],p[0]),sub(p[2],p[0])));
 return n;
}
function renderFace(f,transform,ghost=false){
 const points=f.points.map(transform);
 const n=normal(points);
 if(dot(n,V(1,1,1.2))<=.015)return null;
 const brightness=.53+.35*Math.max(0,dot(n,norm(V(-.25,-.55,1.8))))+.11*Math.max(0,dot(n,norm(V(1,1,1))));
 return {pts:points.map(proj),z:points.reduce((a,v)=>a+depth(v),0)/points.length,fill:ghost?'#e8b880':sh(f.color,brightness),stroke:ghost?'#f8e9d8':sh(f.color,Math.min(brightness*1.27,1.4)),alpha:ghost?.18:f.alpha};
}
function drawFaces(transform,ghost=false){
 const out=faces.map(f=>renderFace(f,transform,ghost)).filter(Boolean).sort((a,b)=>a.z-b.z);
 const g=C.ctx;
 for(const f of out){
   g.globalAlpha=f.alpha;g.beginPath();g.moveTo(...f.pts[0]);
   for(const p of f.pts.slice(1))g.lineTo(...p);
   g.closePath();g.fillStyle=f.fill;g.strokeStyle=f.stroke;g.lineWidth=1.15;g.fill();g.stroke();
 }
 g.globalAlpha=1;
 if(!ghost)for(const path of paths){
  const pts=path.points.map(transform).map(proj);
  g.beginPath();g.setLineDash(path.dash);g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);
  g.strokeStyle=path.color;g.lineWidth=path.width;g.stroke();
 }
 g.setLineDash([]);
}
function round(x,y,w,h,r,fill,stroke){
 const g=C.ctx;g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}
}
function text(str,x,y,color,size=17,weight='700',align='left'){
 const g=C.ctx;g.textAlign=align;g.font=weight+' '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';g.fillStyle=color;g.fillText(str,x,y);
}
function arrow(from,to,color,width=4,head=12){
 const g=C.ctx,dx=to[0]-from[0],dy=to[1]-from[1],ang=Math.atan2(dy,dx);
 g.beginPath();g.moveTo(...from);g.lineTo(...to);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();
 g.beginPath();g.moveTo(...to);g.lineTo(to[0]-head*Math.cos(ang-.55),to[1]-head*Math.sin(ang-.55));g.lineTo(to[0]-head*Math.cos(ang+.55),to[1]-head*Math.sin(ang+.55));g.closePath();g.fillStyle=color;g.fill();
}
function badge(txt,x,y,color){
 const g=C.ctx;g.font='800 15px system-ui,Segoe UI,sans-serif';
 const w=g.measureText(txt).width+26;
 round(x,y,w,33,16,'#0b2940',color);
 text(txt,x+13,y+23,color,15,'800');
}
function drawAxes(){
 const O=[C.w<520?Math.min(72,C.w*.25):92,C.h-70],axes=[
  {v:C.w<520?[43,19]:[66,26],name:'X',color:'#ffb174'},
  {v:C.w<520?[-34,17]:[-51,25],name:'Y',color:'#65e6c0'},
  {v:C.w<520?[0,-50]:[0,-76],name:'Z',color:'#83b6ff'}
 ];
 const g=C.ctx;
 g.beginPath();g.arc(...O,4,0,2*Math.PI);g.fillStyle='#fff';g.fill();
 text('O',O[0]-22,O[1]-9,'#f6fcff',16,'800');
 for(const a of axes){
  const t=[O[0]+a.v[0],O[1]+a.v[1]];
  arrow(O,t,a.color,3.6,10);text(a.name,t[0]+(a.name==='Y'?-15:9),t[1]+(a.name==='Z'?-11:8),a.color,20,'900');
 }
 round(12,C.h-34,Math.min(242,C.w-24),25,7,'#0c3048c9');
 text('Repère local O · X · Y · Z',21,C.h-16,'#e1f4ff',C.w<520?12:14,'750');
}
function drawBackground(){
 const g=C.ctx;
 const gr=g.createLinearGradient(0,0,C.w,C.h);gr.addColorStop(0,'#123d57');gr.addColorStop(1,'#081b2d');
 g.fillStyle=gr;g.fillRect(0,0,C.w,C.h);
 g.strokeStyle='rgba(112,166,198,.11)';g.lineWidth=1;
 for(let x=0;x<=C.w;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,C.h);g.stroke();}
 for(let y=0;y<=C.h;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(C.w,y);g.stroke();}
 const halo=g.createRadialGradient(C.w*.55,C.h*.52,10,C.w*.55,C.h*.52,C.w*.5);
 halo.addColorStop(0,'#35627d55');halo.addColorStop(1,'#071c2a00');
 g.fillStyle=halo;g.fillRect(0,0,C.w,C.h);
}
function motionVector(k,q,allowed){
 const axis=keys.indexOf(k)%3;
 if(k.charAt(0)==='T'){
  const unit=[V(1,0,0),V(0,1,0),V(0,0,1)][axis];
  const p=proj(V(1.6,-1.05,1.35));
  const d=sub(proj(mul(unit,1.35)),proj(V(0,0,0)));
  const a=mul(d,C.w<520?.53:.9),end=add(p,a);
  arrow(p,end,allowed?'#5ee8bb':'#fa7464',5,15);
  text(k,end[0]+12,end[1]+8,allowed?'#8cffe0':'#ff9c98',22,'900');
 }else{
  const g=C.ctx,c=proj(V(0,0,0)),r=(C.w<520?Math.min(49,C.w*.17):75)+22*q;
  const start=-2.5,end=.66+q*.2;
  g.beginPath();g.arc(c[0],c[1],r,start,end);
  g.strokeStyle=allowed?'#64e8bd':'#ff8074';g.lineWidth=6;g.stroke();
  const p=[c[0]+r*Math.cos(end),c[1]+r*Math.sin(end)],tangent=[Math.sin(end),-Math.cos(end)];
  arrow(sub(p,mul(tangent,20)),p,allowed?'#64e8bd':'#ff8074',4,11);
  text(k,Math.min(C.w-28,c[0]+r+8),c[1]-r/2,allowed?'#8cffe0':'#ff9c98',C.w<520?16:22,'900');
 }
}
function blockedSign(){
 const g=C.ctx,c=proj(V(.2,-.3,.5));const x=Math.min(C.w-78,c[0]+115),y=c[1]-75;
 g.beginPath();g.arc(x,y,33,0,2*Math.PI);g.fillStyle='#822a32e6';g.fill();g.strokeStyle='#ffb0a2';g.lineWidth=4;g.stroke();
 g.beginPath();g.moveTo(x-12,y-12);g.lineTo(x+12,y+12);g.moveTo(x+12,y-12);g.lineTo(x-12,y+12);g.strokeStyle='#fff';g.lineWidth=5;g.stroke();
 text('BLOQUÉ',x,y+63,'#ffc6b4',C.w<520?16:22,'900','center');
}
function drawFrame(ts){
 if(!C.canvas||!C.joint)return;
 if(document.getElementById('view-detail')?.hidden){C.raf=0;return;}
 if(document.visibilityState==='hidden'){C.raf=requestAnimationFrame(drawFrame);return;}
 const w=C.canvas.clientWidth||900;
 const height=w<560?Math.max(255,Math.round(w*.93)):Math.round(w*430/920);
 if(w!==C.w||height!==C.h){
  C.w=w;C.h=height;
  const ratio=Math.min(window.devicePixelRatio||1,2);
  C.canvas.width=Math.round(C.w*ratio);C.canvas.height=Math.round(C.h*ratio);
  C.ctx.setTransform(ratio,0,0,ratio,0,0);
 }
 if(!C.start)C.start=ts;
 if(!C.playing)C.start=ts-C.frame*(2750/C.speed);
 const phase=(ts-C.start)/(2750/C.speed);
 const progress=C.reduced?.72:((1-Math.cos(phase*2*Math.PI))/2);
 if(C.playing)C.frame=phase;
 const q=C.preview?0:(C.allowed?progress*C.amplitude:.08*(Math.sin(phase*12)*Math.max(0,1-progress)));
 drawBackground();
 faces.length=0;paths.length=0;
 fixedModel(C.joint.kind);
 drawFaces(p=>p);
 faces.length=0;paths.length=0;
 movingModel(C.joint.kind);
 // position de départ fantôme : voir le déplacement relatif sans perspective erronée
 if(C.allowed&&q>.035)drawFaces(p=>p,true);
 const trans=p=>matrixMove(p,C.motion,q,C.joint);
 drawFaces(trans);
 if(!C.preview)motionVector(C.motion,q,C.allowed);
 drawAxes();
 if(C.w<520){
  badge('BLEU · FIXE',12,12,'#8bdfff');
  badge('ORANGE · MOBILE',12,51,'#ffc38d');
  badge(C.preview?'OBSERVATION':(C.allowed?'AUTORISÉ':'BLOQUÉ'),C.w-137,12,C.preview?'#d1e1f1':(C.allowed?'#78ecc8':'#ff958a'));
 }else{
  badge('BLEU · SOLIDE 1',20,17,'#8bdfff');
  badge('ORANGE · SOLIDE 2',197,17,'#ffc38d');
  const status=C.preview?'OBSERVATION':(C.allowed?'● AUTORISÉ':'✕ BLOQUÉ'),color=C.preview?'#d1e1f1':(C.allowed?'#78ecc8':'#ff958a');
  badge(status,C.w-175,17,color);
 }
 if(!C.preview&&C.joint.id==='helicoidale'&&C.allowed){
  round(C.w*.31,C.h-41,C.w*.48,30,8,'#0c304ad8');
  text('Rotation + translation liées : 1 DDL',C.w*.55,C.h-21,'#fff0ce',Math.max(12,Math.min(17,C.w/53)),'800','center');
 }
 if(!C.preview&&(C.joint.ddl===0||!C.allowed))blockedSign();
 if(C.playing&&!C.reduced)C.raf=requestAnimationFrame(drawFrame);
 else C.raf=0;
}
function render(j,motion,preview=false){
 C.canvas=document.getElementById('motionCanvas');
 if(!C.canvas)return;
 C.ctx=C.canvas.getContext('2d');
 C.joint=j;C.motion=motion||'Tx';C.preview=preview;C.allowed=preview?false:Boolean(j.m[keys.indexOf(C.motion)]);
 C.playing=!preview;C.frame=0;C.start=0;
 C.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(C.raf)cancelAnimationFrame(C.raf);
 C.raf=requestAnimationFrame(drawFrame);
 const replay=document.getElementById('playMotion');if(replay)replay.textContent=C.reduced?'Voir la position finale':'Pause ▌▌';
 const label=document.getElementById('motionState');
 if(label){label.textContent=C.preview?'OBSERVER LES DEUX SOLIDES':(C.allowed?'MOUVEMENT AUTORISÉ':'MOUVEMENT BLOQUÉ')+' — '+(C.preview?'':labels[C.motion]);label.className=C.preview?'motion-state':'motion-state '+(C.allowed?'state-yes':'state-no');}
 const description=document.getElementById('motionExplainer');
 if(description){
  description.textContent=C.preview?'Repère la pièce bleue, la pièce orange et le repère OXYZ. Tu testeras les mouvements à l’étape suivante.':(C.allowed?(j.id==='helicoidale'?'Observe : la pièce tourne ET se déplace. Ces mouvements sont liés, donc 1 DDL.':'La pièce orange se déplace par rapport au solide bleu. La trajectoire est répétée pour mieux l’observer.'):'La flèche rouge indique une tentative. La liaison s’oppose au mouvement : la position reste quasiment inchangée.');
 }
}
function toggle(){
 if(!C.canvas)return;
 if(C.reduced){C.frame=.65;C.reduced=false;C.playing=false;drawFrame(performance.now());document.getElementById('playMotion').textContent='Rejouer ▶';return;}
 C.playing=!C.playing;
 const btn=document.getElementById('playMotion');
 if(btn)btn.textContent=C.playing?'Pause ▌▌':'Rejouer ▶';
 if(C.playing){C.start=0;C.frame=0;if(!C.raf)C.raf=requestAnimationFrame(drawFrame);}
}
window.SI_MOTION={
 render,observe:j=>render(j,null,true),toggle,refresh:()=>{if(C.joint)render(C.joint,C.motion,C.preview);},
 speed:value=>{C.speed=clamp(Number(value)||1,.25,2);C.start=0;C.frame=0;if(C.joint)render(C.joint,C.motion,C.preview);},
 amplitude:value=>{C.amplitude=clamp(Number(value)||1,.25,1.5);C.start=0;C.frame=0;if(C.joint)render(C.joint,C.motion,C.preview);}
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&C.joint&&!document.getElementById('view-detail')?.hidden&&!C.raf)C.raf=requestAnimationFrame(drawFrame);});
window.addEventListener('resize',()=>{if(C.joint&&!document.getElementById('view-detail')?.hidden&&!C.raf)C.raf=requestAnimationFrame(drawFrame);});
})();
