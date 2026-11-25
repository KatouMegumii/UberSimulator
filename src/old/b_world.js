'use strict';
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div id="loadErr">无法加载 Three.js（需要联网访问 cdn.jsdelivr.net 或 unpkg.com）。<br>请联网后用 Chrome / Edge 打开本文件。</div>');throw new Error('THREE missing');}
// ================= 工具 =================
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function wpick(w){let s=0;for(const v of w)s+=v;let r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}return w.length-1;}
let _seed=20261124;
function srand(){_seed|=0;_seed=_seed+0x6D2B79F5|0;let t=Math.imul(_seed^_seed>>>15,1|_seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const sr=(a,b)=>a+srand()*(b-a);const spick=a=>a[Math.floor(srand()*a.length)];
const pad=n=>String(n).padStart(2,'0');
const fmt=m=>{m=((Math.floor(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60);};
const WD=['周一','周二','周三','周四','周五','周六','周日'];
const dayOf=t=>Math.floor(t/1440)+1;
const wdOf=t=>(4+Math.floor(t/1440))%7; // 第1天=周五
const dateStr=t=>`第${dayOf(t)}天 · ${WD[wdOf(t)]}`;
const whenStr=t=>{const d=dayOf(t)-dayOf(S.t);return (d===0?'今天':d===1?'明天':d===-1?'昨天':WD[wdOf(t)])+' '+fmt(t%1440);};

// ================= 城市常量 =================
const R=[-300,-200,-100,0,100,200,300], HW=7, LIM=307, KM=4;
const EW=['安顺路','延西路','长宁支路','新华路','梧桐路','复兴西路','桥西南路']; // z 固定，东西向
const NS=['武夷路','华山支路','乌鲁木齐路','常熟路','襄阳路','永福路','滨江路']; // x 固定，南北向
const ZK=['res','com','night'], ZI={res:0,com:1,night:2};
const ZN={res:'永安里住宅区',com:'常熟路商圈',night:'永福路酒吧街'};
const zoneOf=x=>{const i=clamp(Math.floor((x+300)/100),0,5);return i<2?'res':i<4?'com':'night';};
const nIdx=v=>clamp(Math.round((v+300)/100),0,6);
const PLACES={
  home:{name:'永安里 · 家',spot:{x:-205,z:50}},
  shop:{name:'老陈面馆',spot:{x:-150,z:-5}},
  bar:{name:'退潮酒吧',spot:{x:195,z:-50}},
  linHome:{name:'梧桐路 · 弄堂口',spot:{x:-140,z:105}},
  exit:{name:'外环入口（往虹桥）',spot:{x:-300,z:200}},
};
const PILLARS=[];for(let k=0;k<6;k++)PILLARS.push({x:-250+100*k,z:-200,r:1.3});
function onRoad(x,z,m){
  if(Math.abs(x)>LIM-m||Math.abs(z)>LIM-m)return false;
  return Math.abs(x-R[nIdx(x)])<HW-m||Math.abs(z-R[nIdx(z)])<HW-m;
}
function legal(x,z){const m=1.1;if(!onRoad(x,z,m))return false;for(const p of PILLARS)if((x-p.x)**2+(z-p.z)**2<(p.r+m)**2)return false;return true;}
function sidewalkOf(p){ // 乘客站的人行道位置
  const ix=nIdx(p.x),iz=nIdx(p.z);
  if(Math.abs(p.x-R[ix])<HW&&Math.abs(p.z-R[iz])>=HW){const s=Math.sign(p.x-R[ix])||1;return{x:R[ix]+s*8.6,z:p.z};}
  const s=Math.sign(p.z-R[iz])||1;return{x:p.x,z:R[iz]+s*8.6};
}
function placeName(p){
  for(const k in PLACES)if(dist(p,PLACES[k].spot)<7)return PLACES[k].name;
  const ix=nIdx(p.x),iz=nIdx(p.z);
  if(Math.abs(p.z-R[iz])<HW)return EW[iz]+' · 近'+NS[nIdx(p.x)];
  return NS[ix]+' · 近'+EW[nIdx(p.z)];
}
function randRoadPoint(zone){
  for(let k=0;k<60;k++){
    const ew=Math.random()<.5,line=randi(0,6),seg=randi(0,5),a=R[seg]+rand(16,84),side=Math.random()<.5?1:-1;
    const p=ew?{x:a,z:R[line]+side*5}:{x:R[line]+side*5,z:a};
    if(Math.abs(p.x)>305||Math.abs(p.z)>305)continue;
    if(zone&&zoneOf(p.x)!==zone)continue;
    let bad=false;for(const q in PLACES)if(dist(p,PLACES[q].spot)<14)bad=true;if(bad)continue;
    return p;
  }
  return{x:5,z:50};
}

// ================= 导航寻路 =================
function anchors(p){
  const ix=nIdx(p.x),iz=nIdx(p.z),res=[];
  const onEW=Math.abs(p.z-R[iz])<HW+1,onNS=Math.abs(p.x-R[ix])<HW+1;
  if(onEW){const a=clamp(Math.floor((p.x+300)/100),0,5);for(const k of[a,a+1])res.push({i:k,j:iz,cost:Math.abs(p.x-R[k]),ax:'x'});}
  if(onNS){const a=clamp(Math.floor((p.z+300)/100),0,5);for(const k of[a,a+1])res.push({i:ix,j:k,cost:Math.abs(p.z-R[k]),ax:'z'});}
  if(!res.length)res.push({i:ix,j:iz,cost:Math.hypot(p.x-R[ix],p.z-R[iz]),ax:'x'});
  return res;
}
function routeLen(path){let L=0;for(let k=1;k<path.length;k++)L+=dist(path[k-1],path[k]);return L;}
function findRoute(from,to,heading){
  // 同一路段直达
  const ix=nIdx(from.x),iz=nIdx(from.z),tx=nIdx(to.x),tz=nIdx(to.z);
  if(Math.abs(from.z-R[iz])<HW&&Math.abs(to.z-R[tz])<HW&&iz===tz&&Math.floor((from.x+300)/100)===Math.floor((to.x+300)/100))return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  if(Math.abs(from.x-R[ix])<HW&&Math.abs(to.x-R[tx])<HW&&ix===tx&&Math.floor((from.z+300)/100)===Math.floor((to.z+300)/100))return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  let best=null;
  for(const a of anchors(from))for(const b of anchors(to)){
    let c=a.cost+Math.abs(a.i-b.i)*100+Math.abs(a.j-b.j)*100+b.cost;
    if(heading!==undefined){const fx=-Math.sin(heading),fz=-Math.cos(heading);const dx=R[a.i]-from.x,dz=R[a.j]-from.z;const L=Math.hypot(dx,dz)||1;if((dx*fx+dz*fz)/L<-.3&&L>8)c+=140;}
    if(!best||c<best.c)best={a,b,c};
  }
  const {a,b}=best,pts=[{x:from.x,z:from.z},{x:R[a.i],z:R[a.j]}];
  if(a.i!==b.i&&a.j!==b.j){ // L 形，优先沿原方向继续
    if(a.ax==='x')pts.push({x:R[b.i],z:R[a.j]});else pts.push({x:R[a.i],z:R[b.j]});
  }
  pts.push({x:R[b.i],z:R[b.j]},{x:to.x,z:to.z});
  const out=[];for(const p of pts){const l=out[out.length-1];if(!l||dist(l,p)>.5)out.push(p);}
  // 去掉共线点
  for(let k=out.length-2;k>0;k--){const p=out[k-1],q=out[k],r=out[k+1];const cr=(q.x-p.x)*(r.z-q.z)-(q.z-p.z)*(r.x-q.x);const dt=(q.x-p.x)*(r.x-q.x)+(q.z-p.z)*(r.z-q.z);if(Math.abs(cr)<1e-3&&dt>0)out.splice(k,1);}
  return out;
}
function segDist(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1;let t=((p.x-a.x)*dx+(p.z-a.z)*dz)/L2;t=clamp(t,0,1);return{d:Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz),t};}
function roadNameOfSeg(a,b){if(Math.abs(a.z-b.z)<1)return EW[nIdx(a.z)];if(Math.abs(a.x-b.x)<1)return NS[nIdx(a.x)];return'';}

// ================= Three 场景 =================
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x9fb8cc,120,900);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,1600);
camera.rotation.order='YXZ';
const hemi=new THREE.HemisphereLight(0xdfe8f0,0x3a3530,.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dd,1);sun.position.set(200,300,100);scene.add(sun);
const MAXANI=renderer.capabilities.getMaxAnisotropy();
const GEO={box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,12,10),cyl:new THREE.CylinderGeometry(1,1,1,10),plane:new THREE.PlaneGeometry(1,1)};
const _mc={};function lam(c){return _mc[c]||(_mc[c]=new THREE.MeshLambertMaterial({color:c}));}
function bx(w,h,d,c,x,y,z,mat){const m=new THREE.Mesh(GEO.box,mat||lam(c));m.scale.set(w,h,d);m.position.set(x,y,z);return m;}
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=MAXANI;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}

// ---------- 合并几何 ----------
function mergeGeos(list){
  let nP=0,nI=0;for(const g of list){nP+=g.attributes.position.count;nI+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(nP*3),nor=new Float32Array(nP*3),uv=new Float32Array(nP*2),idx=new Uint32Array(nI);let po=0,io=0;
  for(const g of list){const c=g.attributes.position.count;pos.set(g.attributes.position.array,po*3);nor.set(g.attributes.normal.array,po*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,po*2);
    if(g.index){const a=g.index.array;for(let k=0;k<a.length;k++)idx[io+k]=a[k]+po;io+=a.length;}else{for(let k=0;k<c;k++)idx[io+k]=po+k;io+=c;}po+=c;}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.setIndex(new THREE.BufferAttribute(idx,1));m.computeBoundingSphere();return m;
}
const BATCH=new Map();
function addB(mat,geo){if(!BATCH.has(mat))BATCH.set(mat,[]);BATCH.get(mat).push(geo);}
function flushB(target){for(const[mat,list]of BATCH){for(let k=0;k<list.length;k+=4000){target.add(new THREE.Mesh(mergeGeos(list.slice(k,k+4000)),mat));}}BATCH.clear();}
function boxG(w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g;}
function planeG(w,h,x,y,z,ry){const g=new THREE.PlaneGeometry(w,h);if(ry)g.rotateY(ry);g.translate(x,y,z);return g;}

// ---------- 纹理 ----------
function noiseTex(base,amt,size,rep){return ctex(size,size,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let k=0;k<w*h/6;k++){const v=Math.random()*amt|0;g.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${v/255})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}},rep);}
const asphaltTex=noiseTex('#34363a',40,256,true);asphaltTex.repeat.set(160,160);
const tileTex=ctex(128,128,(g)=>{g.fillStyle='#8c877f';g.fillRect(0,0,128,128);g.strokeStyle='#6e6a63';g.lineWidth=2;for(let i=0;i<=128;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke();}for(let k=0;k<400;k++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*128,Math.random()*128,3,3);}},true);
function winTex(kind){
  const N=256,cell=64;const maps=[];
  const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  const e=document.createElement('canvas');e.width=e.height=N;const ge=e.getContext('2d');
  g.fillStyle='#dedad2';g.fillRect(0,0,N,N);ge.fillStyle='#000';ge.fillRect(0,0,N,N);
  for(let k=0;k<1500;k++){g.fillStyle=`rgba(0,0,0,${srand()*.06})`;g.fillRect(srand()*N,srand()*N,3,3);}
  for(let r=0;r<4;r++)for(let col=0;col<4;col++){
    let x,y,w,h;
    if(kind==='res'){w=22;h=30;x=col*cell+21;y=r*cell+14;}else if(kind==='com'){w=56;h=48;x=col*cell+4;y=r*cell+8;}else{w=34;h=36;x=col*cell+15;y=r*cell+12;}
    g.fillStyle=kind==='com'?'#56636e':'#33363b';g.fillRect(x,y,w,h);
    if(kind==='com'){g.fillStyle='#38414a';g.fillRect(x+w/2-1,y,2,h);}
    if(kind==='res'){g.fillStyle='#9a958c';g.fillRect(x-3,y+h,w+6,4);if(srand()<.35){g.fillStyle='#ecebe6';g.fillRect(x+w+1,y+h-13,13,10);}}
    const lit=srand()<(kind==='res'?.42:kind==='com'?.5:.48);
    if(lit){ge.fillStyle=srand()<.72?'#ffcf8a':'#d4e6ff';ge.fillRect(x+1,y+1,w-2,h-2);if(srand()<.4){ge.fillStyle='#7a4a2a';ge.fillRect(x+1,y+1,(w-2)*.45,h-2);}}
  }
  for(const cv of[c,e]){const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=MAXANI;maps.push(t);}
  return maps;
}
const WT={res:winTex('res'),com:winTex('com'),night:winTex('night')};
const BMATS=[];
const _bm={};
function bmat(kind,tint){const k=kind+tint;if(_bm[k])return _bm[k];const m=new THREE.MeshLambertMaterial({color:tint,map:WT[kind][0],emissive:0xffffff,emissiveMap:WT[kind][1],emissiveIntensity:0});BMATS.push(m);return _bm[k]=m;}
function bldGeo(w,h,d,x,y,z){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,T=12,F=[[d,h],[d,h],null,null,[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let v=0;v<4;v++){const k=f*4+v;if(!F[f])uv.setXY(k,.004,.004);else uv.setXY(k,uv.getX(k)*F[f][0]/T,uv.getY(k)*F[f][1]/T);}
  g.translate(x,y,z);return g;
}
const _st={};
function signTex(text,style){
  const k=text+'|'+style;if(_st[k])return _st[k];
  const vertical=style==='v';
  const t=ctex(vertical?64:256,vertical?256:64,(g,w,h)=>{
    const S={red:['#b8282e','#fff'],green:['#1f6f4a','#fff'],blue:['#1d4f91','#fff'],yellow:['#e8c13a','#2a1a00'],white:['#f1efe8','#b8282e'],dark:['#15161b','#fff']};
    if(style==='neon'||vertical){g.fillStyle='#0d0d12';g.fillRect(0,0,w,h);const col=pick(['#ff4fd8','#4ff3ff','#ffe04f','#ff6a4f','#9d7bff']);g.shadowColor=col;g.shadowBlur=14;g.fillStyle=col;g.strokeStyle=col;g.lineWidth=3;g.strokeRect(5,5,w-10,h-10);
      g.font='bold '+(vertical?40:34)+'px "PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';
      if(vertical){const ch=[...text];ch.forEach((c,i)=>g.fillText(c,w/2,h/2+(i-(ch.length-1)/2)*46));}else{g.fillText(text,w/2,h/2+2);g.fillText(text,w/2,h/2+2);}return;}
    const [bg,fg]=S[style]||S.red;g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.font='bold 36px "PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+2);
  });
  return _st[k]=new THREE.MeshBasicMaterial({map:t});
}
const SIGNMATS=[];
function signMat(text,style){const m=signTex(text,style);if(!SIGNMATS.includes(m))SIGNMATS.push(m);return m;}
const shopGlass=new THREE.MeshLambertMaterial({color:0x2a2a2a,emissive:0xffd9a0,emissiveIntensity:.3});
const SHOPS={
  res:['烟纸店','生煎馒头','水果','理发','裁缝铺','五金','早点','药房','彩票','老虎灶','菜场','修鞋'],
  com:['便利店','咖啡','奶茶','银行','药房','眼镜','面包房','手机维修','健身房','房产中介','花店','火锅','书店','快餐'],
  night:['足浴按摩','烧烤','Live House','清吧','KTV','便利店','夜宵','小龙虾','台球','精酿','烤串','24h药房']
};
const TINT={res:['#a8644a','#b9a58a','#8d8478','#c9b9a0','#9b5d48','#d1c6b2'],com:['#9fb0be','#b8c2c8','#7d8b99','#cfd3d6','#a9a59e'],night:['#6f6460','#5d5a66','#857267','#6b6f78']};
const FACE_R={'-z':Math.PI,'+z':0,'-x':-Math.PI/2,'+x':Math.PI/2};
const FACE_N={'-z':[0,-1],'+z':[0,1],'-x':[-1,0],'+x':[1,0]};

// ================= 生成城市 =================
const city=new THREE.Group();scene.add(city);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshLambertMaterial({color:0x8a8a8a,map:asphaltTex}));
ground.rotation.x=-Math.PI/2;city.add(ground);
const swMat=new THREE.MeshLambertMaterial({map:tileTex,color:0xcfcac2});
const RESERVE=[ // 特殊建筑占位：block i,j, 朝向, 区间
  {i:0,j:3,face:'+x',a0:40,a1:60},{i:1,j:2,face:'+z',a0:-164,a1:-136},{i:4,j:2,face:'+x',a0:-64,a1:-36}];
function reserved(i,j,face,a0,a1){return RESERVE.some(r=>r.i===i&&r.j===j&&r.face===face&&a1>r.a0&&a0<r.a1);}
const TREES=[],LAMPS=[];
function sidewalkBox(cx,cz,w,d){const g=new THREE.BoxGeometry(w,.18,d);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w/4,uv.getY(k)*d/4);g.translate(cx,.09,cz);addB(swMat,g);}
function addStorefront(face,fx,fz,w,zone,forceSign){
  const [nx,nz]=FACE_N[face],ry=FACE_R[face];
  addB(shopGlass,planeG(w-1.4,2.8,fx+nx*.06,1.6,fz+nz*.06,ry));
  const aw=spick(['#8c2f2f','#2f5f8c','#3f6b3f','#5a5a5a','#a0702a']);
  const along=Math.abs(nx)>0?'z':'x';
  if(along==='x')addB(lam(aw),boxG(w-1,.12,1.3,fx,3.25,fz+nz*.65));else addB(lam(aw),boxG(1.3,.12,w-1,fx+nx*.65,3.25,fz));
  const txt=forceSign||spick(SHOPS[zone]);
  const style=zone==='night'?'neon':spick(['red','green','blue','yellow','white','dark']);
  const sw=Math.min(w-1.6,7.5);
  addB(signMat(txt,style),planeG(sw,sw/4,fx+nx*.14,4.2,fz+nz*.14,ry));
}
function addBuilding(zone,face,x0,x1,z0,z1,h){
  const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const kind=(zone==='res'&&h>16)?'com':zone;
  const tint=spick(TINT[zone==='res'&&h>16?'com':zone]);
  addB(bmat(kind,tint),bldGeo(w,h,d,cx,h/2,cz));
  // 前立面坐标
  const [nx,nz]=FACE_N[face];
  const fx=nx?(nx>0?x1:x0):cx,fz=nz?(nz>0?z1:z0):cz;
  const fw=nx?d:w;
  if(zone==='res'&&h<=16){
    // 坡屋顶（石库门/老洋房）
    const along=w>=d?'x':'z',L=Math.max(w,d)+.6,B=Math.min(w,d)+.8;
    const sh=new THREE.Shape();sh.moveTo(-B/2,0);sh.lineTo(B/2,0);sh.lineTo(0,2.4);sh.lineTo(-B/2,0);
    const rg=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:false});rg.translate(0,0,-L/2);if(along==='x')rg.rotateY(Math.PI/2);rg.translate(cx,h,cz);
    addB(lam(spick(['#5a3a32','#4a4f55','#6b4135'])),rg);
    if(srand()<.45){ // 晾衣杆
      const py=h*.55;for(let k=0;k<2;k++){const off=(k-.5)*fw*.4;
        const px=fx+(nx?nx*.7:off),pz=fz+(nz?nz*.7:off);
        if(nx)addB(lam('#777'),boxG(1.4,.05,.05,px,py,pz));else addB(lam('#777'),boxG(.05,.05,1.4,px,py,pz));
        for(let q=0;q<3;q++){const cl=spick(['#d9534f','#f0f0f0','#5b8bd9','#e8c13a','#6fbf73','#c98ad9']);const o=(q-1)*.35;
          addB(lam(cl),nx?boxG(.02,.6,.3,px+nx*o*.0+nx*(q*.35-.35),py-.35,pz):boxG(.3,.6,.02,px,py-.35,pz+nz*(q*.35-.35)));}
      }
    }
    if(srand()<.55)addStorefront(face,fx,fz,fw,zone);
  }else{
    if(zone!=='res'||srand()<.5)addStorefront(face,fx,fz,fw,zone);
    if(srand()<.5)addB(lam('#9a9a9a'),boxG(2.5,1.6,2.5,cx+sr(-w/4,w/4),h+.8,cz+sr(-d/4,d/4))); // 屋顶设备
    if(zone==='com'&&h>40&&srand()<.35){const b=spick(['顺路出行','长江保险','好邻居超市','申城银行','云上咖啡']);addB(signMat(b,'white'),planeG(Math.min(fw-2,16),4,fx+nx*.2,h-3,fz+nz*.2,FACE_R[face]));}
  }
  if(zone==='night'&&srand()<.5){ // 竖向霓虹
    const t=spick(['酒','按摩','KTV','夜宵','烤串','台球']);const off=sr(-fw/3,fw/3);
    addB(signMat(t,'v'),planeG(1.1,4.4,fx+nx*.5+(nx?0:off),sr(6,Math.max(7,h-3)),fz+nz*.5+(nz?0:off),FACE_R[face]+(nx?Math.PI/2:Math.PI/2)));
  }
}
function genBlock(i,j){
  const cx=-250+100*i,cz=-250+100*j,zone=i<2?'res':i<4?'com':'night';
  sidewalkBox(cx,cz,86,86);
  const D=zone==='res'?14:zone==='com'?20:16,E=39;
  const rows=[{face:'-z',a0:cx-E,a1:cx+E},{face:'+z',a0:cx-E,a1:cx+E},{face:'-x',a0:cz-E+D,a1:cz+E-D},{face:'+x',a0:cz-E+D,a1:cz+E-D}];
  for(const row of rows){
    let a=row.a0;
    while(a<row.a1-5){
      let w=sr(10,24);if(a+w>row.a1-5)w=row.a1-a;if(w<6)break;
      if(!reserved(i,j,row.face,a,a+w)){
        const d=D*sr(.8,1);let h;
        const r=srand();
        if(zone==='res')h=r<.72?sr(7,11):r<.88?sr(18,30):sr(48,80);
        else if(zone==='com')h=r<.3?sr(14,24):r<.75?sr(26,50):sr(55,90);
        else h=r<.6?sr(8,14):sr(15,24);
        let x0,x1,z0,z1;
        if(row.face==='-z'){x0=a;x1=a+w;z0=cz-E;z1=cz-E+d;}
        else if(row.face==='+z'){x0=a;x1=a+w;z0=cz+E-d;z1=cz+E;}
        else if(row.face==='-x'){z0=a;z1=a+w;x0=cx-E;x1=cx-E+d;}
        else{z0=a;z1=a+w;x0=cx+E-d;x1=cx+E;}
        addBuilding(zone,row.face,x0,x1,z0,z1,h);
      }
      a+=w+(srand()<.18?sr(1.5,4):0);
    }
  }
  // 行道树（梧桐）与路灯
  const edges=[['x',cz-41,-1],['x',cz+41,1],['z',cx-41,-1],['z',cx+41,1]];
  for(const[ax,fix,s]of edges){
    const nearElev=ax==='x'&&Math.abs(fix+s*(-41)+s*41-(-200))<15&&Math.abs((fix)-(-200))<12;
    const centerAlong=ax==='x'?cx:cz;
    for(let a=-36;a<=36;a+=12){
      const x=ax==='x'?centerAlong+a:fix,z=ax==='x'?fix:centerAlong+a;
      if(Math.abs(z+200)<12)continue; // 高架下不种树
      let skip=false;for(const k in PLACES)if(Math.hypot(PLACES[k].spot.x-x,PLACES[k].spot.z-z)<11)skip=true;
      if(!skip&&(zone!=='night'||srand()<.4))TREES.push({x,z,s:sr(.8,1.25)});
    }
    for(let a=-30;a<=30;a+=30){const x=ax==='x'?centerAlong+a+6:fix+s*1.4,z=ax==='x'?fix+s*1.4:centerAlong+a+6;LAMPS.push({x,z,ax,s});}
  }
}
for(let i=0;i<6;i++)for(let j=0;j<6;j++)genBlock(i,j);
// 外圈人行道与背景楼
sidewalkBox(-330,0,46,720);sidewalkBox(0,-330,620,46);sidewalkBox(0,330,620,46);
for(let k=-330;k<=330;k+=sr(14,24)){
  const h1=sr(12,50),h2=sr(12,50),h3=sr(12,50);
  addB(bmat('res',spick(TINT.res)),bldGeo(16,h1,18,-325,h1/2,k));
  if(Math.abs(k)<320){addB(bmat('com',spick(TINT.com)),bldGeo(18,h2,16,k,h2/2,-325));addB(bmat('res',spick(TINT.res)),bldGeo(18,h3,16,k,h3/2,325));}
}
// 东侧滨江步道 + 江 + 对岸
sidewalkBox(314,0,14,720);
addB(lam('#5d5b57'),boxG(1,1.1,700,320.5,.55,0));
const water=new THREE.Mesh(new THREE.PlaneGeometry(400,2400),new THREE.MeshPhongMaterial({color:0x253a44,shininess:90,specular:0x8899aa}));
water.rotation.x=-Math.PI/2;water.position.set(521,-1.4,0);city.add(water);
addB(lam('#4a4844'),boxG(4,3,2400,322,-1.4,0));
for(let k=0;k<46;k++){const h=sr(40,210),x=sr(730,880),z=sr(-600,600);addB(bmat('com',spick(TINT.com)),bldGeo(sr(20,40),h,sr(20,40),x,h/2,z));}
// 对岸电视塔
const towerGlow=new THREE.MeshLambertMaterial({color:0xd46a9a,emissive:0xff4f9a,emissiveIntensity:0});
city.add(bx(4,260,4,'#c9c6c0',760,130,120));
{const s1=new THREE.Mesh(GEO.sph,towerGlow);s1.scale.setScalar(16);s1.position.set(760,95,120);city.add(s1);const s2=new THREE.Mesh(GEO.sph,towerGlow);s2.scale.setScalar(10);s2.position.set(760,195,120);city.add(s2);}
// 跨江大桥
addB(lam('#7a7c80'),boxG(400,1.6,20,530,9,-150));
for(const x of[420,640]){addB(lam('#8a8c90'),boxG(4,50,4,x,25,-160));addB(lam('#8a8c90'),boxG(4,50,4,x,25,-140));}
const bridgeLights=new THREE.MeshBasicMaterial({color:0xffd27a});
addB(bridgeLights,boxG(400,.3,.3,530,10,-160.2));addB(bridgeLights,boxG(400,.3,.3,530,10,-139.8));
// 高架（延西路上方）
const elevMat=lam('#8d8b86');
addB(elevMat,boxG(700,1.4,18,0,9.5,-200));addB(lam('#6f6d69'),boxG(700,1.4,.3,0,11,-209));addB(lam('#6f6d69'),boxG(700,1.4,.3,0,11,-191));
for(const p of PILLARS){const g=new THREE.CylinderGeometry(p.r,p.r,9,12);g.translate(p.x,4.5,p.z);addB(elevMat,g);addB(elevMat,boxG(4,1.2,12,p.x,8.4,p.z));}
const elevLight=new THREE.MeshBasicMaterial({color:0x6fd0ff});
addB(elevLight,boxG(700,.15,.15,0,8.75,-208.8));addB(elevLight,boxG(700,.15,.15,0,8.75,-191.2));

// ---------- 路面标线 ----------
const lineY=new THREE.MeshBasicMaterial({color:0xd9b23a}),lineW=new THREE.MeshBasicMaterial({color:0xd8d8d8});
for(let l=0;l<7;l++)for(let s=0;s<6;s++){
  const a0=R[s]+HW,a1=R[s+1]-HW,mid=(a0+a1)/2,L=a1-a0,c=R[l];
  // 东西向路
  addB(lineY,boxG(L,.02,.14,mid,.02,c-.16));addB(lineY,boxG(L,.02,.14,mid,.02,c+.16));
  addB(lineY,boxG(.14,.02,L,c-.16,.02,mid));addB(lineY,boxG(.14,.02,L,c+.16,.02,mid));
  for(let a=a0+4;a<a1-4;a+=9){addB(lineW,boxG(3,.02,.12,a,.02,c-3.5));addB(lineW,boxG(3,.02,.12,a,.02,c+3.5));addB(lineW,boxG(.12,.02,3,c-3.5,.02,a));addB(lineW,boxG(.12,.02,3,c+3.5,.02,a));}
  for(const e of[a0+1.8,a1-1.8])for(let q=-6;q<=6;q+=1.2){addB(lineW,boxG(3,.021,.55,e,.021,c+q));addB(lineW,boxG(.55,.021,3,c+q,.021,e));}
}
// ---------- 特殊建筑 ----------
// 永安里弄堂口（家）
{const x=-211,z=50;
  addB(lam('#7b4a3a'),boxG(1.4,7,1.4,x,3.5,43));addB(lam('#7b4a3a'),boxG(1.4,7,1.4,x,3.5,57));
  addB(lam('#6b3d30'),boxG(1.6,1.6,15.4,x,7.2,50));
  addB(signMat('永 安 里','white'),planeG(7,1.6,x-.0+.82,7.2,50,Math.PI/2));
  addB(lam('#5a5652'),boxG(30,.05,12,x-15,.2,50));
  for(let k=0;k<3;k++){const h=8.5;addB(bmat('res','#9b5d48'),bldGeo(9,h,5,x-6-k*10,h/2,41.5));addB(bmat('res','#a8644a'),bldGeo(9,h,5,x-6-k*10,h/2,58.5));}
  addB(new THREE.MeshBasicMaterial({color:0xffd9a0}),boxG(.2,.2,.2,x-.6,6,50));
}
// 老陈面馆
{const x0=-162,x1=-138,z1=-11;
  addB(bmat('res','#c9b9a0'),bldGeo(24,8,14,-150,4,z1-7));
  const sh=new THREE.Shape();sh.moveTo(-7.4,0);sh.lineTo(7.4,0);sh.lineTo(0,2.4);sh.lineTo(-7.4,0);const rg=new THREE.ExtrudeGeometry(sh,{depth:24.6,bevelEnabled:false});rg.translate(0,0,-12.3);rg.rotateY(Math.PI/2);rg.translate(-150,8,z1-7);addB(lam('#4a4f55'),rg);
  addB(new THREE.MeshLambertMaterial({color:0x332211,emissive:0xffc070,emissiveIntensity:.9}),planeG(14,2.8,-150,1.6,z1+.07,0));
  addB(signMat('老陈面馆','red'),planeG(10,2.5,-150,4.4,z1+.15,0));
  addB(lam('#b8282e'),boxG(16,.15,1.8,-150,3.2,z1+.9));
  addB(signMat('葱油拌面 大排面 小馄饨','white'),planeG(6,1.5,-158,1.9,z1+.1,0));
}
// 退潮酒吧
{const x1=189,z=-50;
  addB(bmat('night','#3a3a46'),bldGeo(16,12,24,x1-8,6,z));
  addB(new THREE.MeshLambertMaterial({color:0x221133,emissive:0x8a4fff,emissiveIntensity:.9}),planeG(10,2.8,x1+.07,1.6,z,Math.PI/2));
  addB(signMat('退潮 LOW TIDE','neon'),planeG(10,2.5,x1+.15,4.6,z,Math.PI/2));
  addB(signMat('酒','v'),planeG(1.3,5.2,x1+.6,8,z-10,Math.PI));
}
// 外环指示牌
addB(lam('#666'),boxG(.4,7,.4,-293,3.5,210.5));addB(lam('#666'),boxG(.4,7,.4,-293,3.5,189.5));
addB(signMat('外环 → 虹桥','green'),planeG(14,3.5,-292.7,6.5,200,Math.PI/2));
flushB(city);

// ---------- 树木与路灯（实例化） ----------
{const trunkG=new THREE.CylinderGeometry(.18,.26,4.4,6);trunkG.translate(0,2.2,0);
  const canG=new THREE.IcosahedronGeometry(2.6,1);canG.translate(0,6,0);
  const tm=new THREE.InstancedMesh(trunkG,new THREE.MeshLambertMaterial({color:0xb5aa94}),TREES.length);
  const cm=new THREE.InstancedMesh(canG,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),TREES.length);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),col=new THREE.Color();
  TREES.forEach((t,k)=>{M.compose(new THREE.Vector3(t.x,0,t.z),Q.setFromAxisAngle(new THREE.Vector3(0,1,0),srand()*6),new THREE.Vector3(t.s,t.s,t.s));tm.setMatrixAt(k,M);
    M.compose(new THREE.Vector3(t.x,0,t.z),Q,new THREE.Vector3(t.s*sr(.9,1.3),t.s*sr(.8,1.1),t.s*sr(.9,1.3)));cm.setMatrixAt(k,M);
    col.setHSL(sr(.2,.3),sr(.35,.55),sr(.24,.36));cm.setColorAt(k,col);});
  city.add(tm,cm);
}
const lampHeadMat=new THREE.MeshBasicMaterial({color:0x666666});
const poolTex=ctex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,210,140,.9)');gr.addColorStop(.5,'rgba(255,190,110,.35)');gr.addColorStop(1,'rgba(255,180,100,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
const poolMat=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
{const poleG=new THREE.CylinderGeometry(.09,.12,7,6);poleG.translate(0,3.5,0);
  const headG=new THREE.BoxGeometry(.5,.18,1.6);
  const poolG=new THREE.PlaneGeometry(16,16);poolG.rotateX(-Math.PI/2);
  const pm=new THREE.InstancedMesh(poleG,lam('#3c3f44'),LAMPS.length),hm=new THREE.InstancedMesh(headG,lampHeadMat,LAMPS.length),gm=new THREE.InstancedMesh(poolG,poolMat,LAMPS.length);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1);
  LAMPS.forEach((l,k)=>{M.makeTranslation(l.x,0,l.z);pm.setMatrixAt(k,M);
    const ox=l.ax==='x'?0:l.s*1.2,oz=l.ax==='x'?l.s*1.2:0;
    Q.setFromAxisAngle(new THREE.Vector3(0,1,0),l.ax==='x'?0:Math.PI/2);M.compose(new THREE.Vector3(l.x+ox,6.9,l.z+oz),Q,one);hm.setMatrixAt(k,M);
    M.makeTranslation(l.x+ox*3,.04,l.z+oz*3);gm.setMatrixAt(k,M);});
  city.add(pm,hm,gm);
}

// ================= 人物与车辆模型 =================
function makePerson(o={}){
  const g=new THREE.Group(),skin=o.skin||'#e3bd98',top=o.top||pick(['#3d5a80','#98473e','#e0e0e0','#3f6b3f','#222','#c9a227','#7a4f8a','#506070']),bot=o.bottom||pick(['#2a2f3a','#333','#4a4036','#1e2a44']),hair=o.hair||'#17120f';
  const legs=[];
  for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.1,.82,0);const l=bx(.16,.82,.18,bot,0,-.41,0);p.add(l);g.add(p);legs.push(p);}
  if(o.seated)legs.forEach(p=>p.visible=false);
  const by=o.seated?.45:0;
  g.add(bx(.44,.62,.25,top,0,1.13-by,0));
  const arms=[];for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.29,1.4-by,0);p.add(bx(.11,.6,.12,top,0,-.3,0));g.add(p);arms.push(p);}
  const head=new THREE.Mesh(GEO.sph,lam(skin));head.scale.set(.13,.15,.14);head.position.y=1.6-by;g.add(head);
  const hr=new THREE.Mesh(GEO.sph,lam(hair));hr.scale.set(.14,.12,.15);hr.position.set(0,1.66-by,.02);g.add(hr);
  if(o.longHair)g.add(bx(.27,.4,.07,hair,0,1.45-by,.12));
  if(o.apron)g.add(bx(.46,.5,.02,'#f4f4f4',0,1.0-by,-.135));
  if(o.hat){const h=new THREE.Mesh(GEO.cyl,lam('#f4f4f4'));h.scale.set(.13,.16,.13);h.position.y=1.8-by;g.add(h);}
  g.userData={legs,arms,phase:Math.random()*6};
  return g;
}
const carLightMats={head:new THREE.MeshBasicMaterial({color:0x777777}),tail:new THREE.MeshBasicMaterial({color:0x551010})};
const wheelMat=lam('#151515');
function makeCar(color){
  const g=new THREE.Group();
  g.add(bx(1.82,.7,4.5,color,0,.62,0));
  g.add(bx(1.62,.58,2.3,'#22262c',0,1.25,.25));
  g.add(bx(1.5,.05,2.0,color,0,1.56,.25));
  for(const[x,z]of[[-.85,-1.4],[.85,-1.4],[-.85,1.4],[.85,1.4]]){const w=new THREE.Mesh(GEO.cyl,wheelMat);w.scale.set(.34,.24,.34);w.rotation.z=Math.PI/2;w.position.set(x,.34,z);g.add(w);}
  for(const s of[-1,1]){g.add(bx(.4,.14,.05,0,s*.6,.74,-2.26,carLightMats.head));g.add(bx(.4,.14,.05,0,s*.6,.78,2.26,carLightMats.tail));}
  return g;
}
