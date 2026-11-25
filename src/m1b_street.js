
// ================= 街道细节：修树位、护栏、绿篱、公交站、路边停车、公园 =================
// ---- 建筑占地索引（点在多边形内）----
const BIDX=new Map(),BGC=40;
for(const[h,k,flat]of MAP.B){const r=[];let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<flat.length;i+=2){const x=flat[i],z=flat[i+1];r.push(x,z);x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
  const b={r,x0,z0,x1,z1};for(let cx=Math.floor(x0/BGC);cx<=Math.floor(x1/BGC);cx++)for(let cz=Math.floor(z0/BGC);cz<=Math.floor(z1/BGC);cz++){const kk=cx*100003+cz;if(!BIDX.has(kk))BIDX.set(kk,[]);BIDX.get(kk).push(b);}}
function inBuilding(x,z,pad=0){const L=BIDX.get(Math.floor(x/BGC)*100003+Math.floor(z/BGC));if(!L)return false;
  for(const b of L){if(x<b.x0-pad||x>b.x1+pad||z<b.z0-pad||z>b.z1+pad)continue;const r=b.r;let ins=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const xi=r[i],zi=r[i+1],xj=r[j],zj=r[j+1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))ins=!ins;}if(ins)return true;
    if(pad>0){for(let i=0,j=r.length-2;i<r.length;j=i,i+=2)if(segDist({x,z},{x:r[j],z:r[j+1]},{x:r[i],z:r[i+1]}).d<pad)return true;}}return false;}
// ---- 修树：不在路面上、不在楼里、不挡路口 ----
{const ok=[];for(const t of TREES){if(onRoadSurf(t.x,t.z,.1))continue;if(inBuilding(t.x,t.z,.9))continue;let bad=false;for(const k in PLACES)if(Math.hypot(PLACES[k].spot.x-t.x,PLACES[k].spot.z-t.z)<6)bad=true;if(!bad)ok.push(t);}TREES.length=0;TREES.push(...ok);}
for(const L of[TRASH,UTILS,CHAIRS,STOOLS]){const ok=L.filter(o=>!onRoadSurf(o.x,o.z,-.6)&&!inBuilding(o.x,o.z,.3));L.length=0;L.push(...ok);}
{const ok=LAMPS.filter(l=>!inBuilding(l.x,l.z,.4));LAMPS.length=0;LAMPS.push(...ok);}
// ---- 街坊内部绿化：远离道路、不在楼里的空地种树和灌木 ----
const YARD_BUSH=[],LOTS=[],LOTPARK=[];
{const x0=BOUNDS[0],z0=BOUNDS[1],x1=BOUNDS[2],z1=BOUNDS[3];let added=0;
  for(let x=x0;x<x1;x+=17)for(let z=z0;z<z1;z+=17){const jx=x+rand(-6,6),jz=z+rand(-6,6);const n=nearestEdge(jx,jz,40);if(!n)continue;const clear=n.d-n.e.w/2;if(clear<6.5)continue;if(inBuilding(jx,jz,2.2))continue;
    if(clear>13&&clear<60&&!inBuilding(jx,jz,13)&&Math.random()<.3&&LOTS.length<420){LOTS.push({x:jx,z:jz,dx:n.dx,dz:n.dz});continue;}
    const r=Math.random();if(r<0){const R=rand(4,7.5);if(clear>R+2&&!inBuilding(jx,jz,R*.7)){const g=new THREE.CircleGeometry(R,18);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*R/3,uv.getY(i)*R/3);g.rotateX(-Math.PI/2);g.translate(jx,.03,jz);addC(jx,jz,grassM,g,false);}}
    if(r<.36){TREES.push({x:jx,z:jz,y:0,s:rand(.75,1.15),r:rand(0,6.28)});added++;}else if(r<.46){for(let k=0;k<randi(2,5);k++)YARD_BUSH.push({x:jx+rand(-2,2),y:.02,z:jz+rand(-2,2),ry:rand(0,6.28),sx:rand(1,1.8),sy:rand(.9,1.4),sz:rand(1,1.8)});}}
  if(TREES.length>60000)TREES.length=60000;}
// ---- 用地：小区草坪、商业广场、围墙 ----
const lawnM=grassM.clone();applyPbr(lawnM,'lawn',1);lawnM.color.set(0xc8d0b8);lawnM.polygonOffset=true;lawnM.polygonOffsetFactor=-1;
const plazaM=paveMat.clone();applyPbr(plazaM,'plaza',1);plazaM.color.set(0xc4c0b8);plazaM.polygonOffset=true;plazaM.polygonOffsetFactor=-1;
const apronM=concreteMat.clone();applyPbr(apronM,'ground',1);apronM.color.set(0xb8b6b0);apronM.polygonOffset=true;apronM.polygonOffsetFactor=-2;
const wallM=std('#ece6da',.9,0);
const fenceC=canvasOf(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#202225';g.fillRect(0,0,w,4);g.fillRect(0,h-6,w,6);for(let x=2;x<w;x+=10){g.fillRect(x,0,3,h);g.beginPath();g.moveTo(x-2,6);g.lineTo(x+1.5,0);g.lineTo(x+5,6);g.fill();}});const fenceT=texFromCanvas(fenceC,true);const fenceGM=new THREE.MeshStandardMaterial({map:fenceT,alphaTest:.5,side:THREE.DoubleSide,roughness:.4,metalness:.6});
for(const[t,flat]of MAP.LU||[]){const ring=[];for(let i=0;i<flat.length;i+=2)ring.push({x:flat[i],z:flat[i+1]});if(ring.length<3)continue;
  const tri=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p.x,p.z)),[]);const b=GB();for(const p of ring){b.p.push(p.x,.022,p.z);b.n.push(0,1,0);b.u.push(p.x/3,p.z/3);}
  for(const[a,c,d]of tri){const A2=ring[a],C2=ring[c],D2=ring[d];const cr=(C2.x-A2.x)*(D2.z-A2.z)-(C2.z-A2.z)*(D2.x-A2.x);if(cr<0)b.i.push(a,c,d);else b.i.push(a,d,c);}
  let cx=0,cz=0;for(const p of ring){cx+=p.x;cz+=p.z;}cx/=ring.length;cz/=ring.length;addC(cx,cz,t===0?lawnM:plazaM,gbGeo(b),false);
  if(t===0){// 小区围墙：按连续段生成（避开道路留出大门、避开楼）
    const wb=GB(),fb=GB();
    const run=(x0,z0,x1,z1)=>{const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz);if(L<1)return;const nx=-dz/L*.11,nz=dx/L*.11;
      for(const sd of[1,-1]){const o=wb.p.length/3;wb.p.push(x0+nx*sd,0,z0+nz*sd,x1+nx*sd,0,z1+nz*sd,x1+nx*sd,1.15,z1+nz*sd,x0+nx*sd,1.15,z0+nz*sd);for(let q=0;q<4;q++)wb.n.push(nx*sd*9,0,nz*sd*9);wb.u.push(0,0,L/2,0,L/2,.6,0,.6);wb.i.push(o,o+1,o+2,o,o+2,o+3,o,o+2,o+1,o,o+3,o+2);}
      const o=wb.p.length/3;wb.p.push(x0+nx*1.5,1.15,z0+nz*1.5,x1+nx*1.5,1.15,z1+nz*1.5,x1-nx*1.5,1.15,z1-nz*1.5,x0-nx*1.5,1.15,z0-nz*1.5);for(let q=0;q<4;q++)wb.n.push(0,1,0);wb.u.push(0,0,L/2,0,L/2,.1,0,.1);wb.i.push(o,o+1,o+2,o,o+2,o+3,o,o+2,o+1,o,o+3,o+2);
      const f=fb.p.length/3;fb.p.push(x0,1.15,z0,x1,1.15,z1,x1,2.05,z1,x0,2.05,z0);for(let q=0;q<4;q++)fb.n.push(nx*9,0,nz*9);fb.u.push(0,0,L/1.2,0,L/1.2,1,0,1);fb.i.push(f,f+1,f+2,f,f+2,f+3,f,f+2,f+1,f,f+3,f+2);};
    for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],L=Math.hypot(q.x-p.x,q.z-p.z);if(L<2)continue;const n=Math.max(1,Math.round(L/3));let st=-1;
      for(let k=0;k<=n;k++){let ok=false;if(k<n){const t0=k/n,t1=(k+1)/n,mx=lerp(p.x,q.x,(t0+t1)/2),mz=lerp(p.z,q.z,(t0+t1)/2);ok=!(onRoadSurf(mx,mz,-2.2)||onRoadSurf(lerp(p.x,q.x,t0),lerp(p.z,q.z,t0),-1.5)||onRoadSurf(lerp(p.x,q.x,t1),lerp(p.z,q.z,t1),-1.5)||inBuilding(mx,mz,.6));}
        if(ok&&st<0)st=k;if(!ok&&st>=0){run(lerp(p.x,q.x,st/n),lerp(p.z,q.z,st/n),lerp(p.x,q.x,k/n),lerp(p.z,q.z,k/n));st=-1;}}}
    if(wb.p.length){addC(cx,cz,wallM,gbGeo(wb));addC(cx,cz,fenceGM,gbGeo(fb),false);}}}
// 楼周散水 / 小路
for(const[h,k,flat]of MAP.B){const b=GB();const n=flat.length/2;let cx=0,cz=0;for(let i=0;i<flat.length;i+=2){cx+=flat[i];cz+=flat[i+1];}cx/=n;cz/=n;
  for(let i=0;i<n;i++){const j=(i+1)%n,px=flat[i*2],pz=flat[i*2+1],qx=flat[j*2],qz=flat[j*2+1];const dx=qx-px,dz=qz-pz,L=Math.hypot(dx,dz);if(L<.3)continue;let nx=dz/L,nz=-dx/L;const mx=(px+qx)/2,mz=(pz+qz)/2;if((mx+nx-cx)*nx+(mz+nz-cz)*nz<(mx-cx)*nx+(mz-cz)*nz){nx=-nx;nz=-nz;}const o=1.8;
    const A0=[px,.032,pz],B0=[qx,.032,qz],C0=[qx+nx*o,.032,qz+nz*o],D0=[px+nx*o,.032,pz+nz*o];const o2=b.p.length/3;for(const v of[A0,B0,C0,D0])b.p.push(...v);for(let t=0;t<4;t++)b.n.push(0,1,0);b.u.push(px/3,pz/3,qx/3,qz/3,C0[0]/3,C0[2]/3,D0[0]/3,D0[2]/3);b.i.push(o2,o2+2,o2+1,o2,o2+3,o2+2,o2,o2+1,o2+2,o2,o2+2,o2+3);}
  addC(cx,cz,apronM,gbGeo(b),false);}
// ---- 楼前绿化带：住宅楼长边外侧的草地条 + 灌木 ----
{for(const[h,k,flat]of MAP.B){if(k===3||h<6)continue;const n=flat.length/2;let cx=0,cz=0;for(let i=0;i<flat.length;i+=2){cx+=flat[i];cz+=flat[i+1];}cx/=n;cz/=n;if(zoneOf(cx,cz)!=='res'&&Math.random()<.6)continue;
  const edges=[];for(let i=0;i<n;i++){const j=(i+1)%n,px=flat[i*2],pz=flat[i*2+1],qx=flat[j*2],qz=flat[j*2+1],L=Math.hypot(qx-px,qz-pz);if(L>8)edges.push({px,pz,qx,qz,L});}
  edges.sort((a,b)=>b.L-a.L);for(const e of edges.slice(0,2)){let nx=(e.qz-e.pz)/e.L,nz=-(e.qx-e.px)/e.L;const mx=(e.px+e.qx)/2,mz=(e.pz+e.qz)/2;if((mx+nx-cx)*nx+(mz+nz-cz)*nz<(mx-cx)*nx+(mz-cz)*nz){nx=-nx;nz=-nz;}
    const o0=2.1,o1=o0+rand(2.2,3.6);const tx=(e.qx-e.px)/e.L,tz=(e.qz-e.pz)/e.L;const a0=1.2,a1=e.L-1.2;
    const test=(o)=>{for(const t of[.15,.5,.85]){const x=e.px+tx*e.L*t+nx*o,z=e.pz+tz*e.L*t+nz*o;if(onRoadSurf(x,z,-1.2)||inBuilding(x,z,.3))return false;}return true;};if(!test(o1)||!test((o0+o1)/2))continue;
    const b=GB();const P=(a,o)=>[e.px+tx*a+nx*o,.04,e.pz+tz*a+nz*o];const A0=P(a0,o0),B0=P(a1,o0),C0=P(a1,o1),D0=P(a0,o1);const q=b.p.length/3;for(const v of[A0,B0,C0,D0])b.p.push(...v);for(let t=0;t<4;t++)b.n.push(0,1,0);b.u.push(A0[0]/3,A0[2]/3,B0[0]/3,B0[2]/3,C0[0]/3,C0[2]/3,D0[0]/3,D0[2]/3);b.i.push(q,q+1,q+2,q,q+2,q+3,q,q+2,q+1,q,q+3,q+2);addC(cx,cz,lawnM,gbGeo(b),false);
    for(const o of[o0,o1]){const g=new THREE.BoxGeometry(e.L-2.4,.14,.12);g.rotateY(Math.atan2(-tz,tx));const c=P(e.L/2,o);g.translate(c[0],.07,c[2]);addC(cx,cz,curbMat,g,false);}
    for(let a=a0+1;a<a1;a+=rand(2.5,5))if(Math.random()<.6)YARD_BUSH.push({x:e.px+tx*a+nx*rand(o0+.6,o1-.6),y:.04,z:e.pz+tz*a+nz*rand(o0+.6,o1-.6),ry:rand(0,6.28),sx:rand(1,1.6),sy:rand(.9,1.3),sz:rand(1,1.6)});
    if(e.L>14&&Math.random()<.55)TREES.push({x:e.px+tx*e.L*rand(.2,.8)+nx*(o0+o1)/2,z:e.pz+tz*e.L*rand(.2,.8)+nz*(o0+o1)/2,y:.04,s:rand(.7,1),r:rand(0,6.28)});}}}
// ---- 阳台（封闭式铝窗阳台，上海老小区常见）----
{const balC=canvasOf(256,128,(g,w,h)=>{g.fillStyle='#e6e2da';g.fillRect(0,0,w,h);g.fillStyle='#2c3238';g.fillRect(6,6,w-12,h*.55);const gr=g.createLinearGradient(0,0,w,h*.6);gr.addColorStop(0,'rgba(190,210,225,.55)');gr.addColorStop(1,'rgba(60,70,80,.2)');g.fillStyle=gr;g.fillRect(6,6,w-12,h*.55);g.fillStyle='#cfd2d4';for(let x=6;x<w;x+=w/4-3)g.fillRect(x,6,4,h*.55);g.fillRect(6,6,w-12,4);g.fillRect(6,h*.55+2,w-12,5);for(let k=0;k<300;k++){g.fillStyle=`rgba(0,0,0,${Math.random()*.05})`;g.fillRect(Math.random()*w,h*.6+Math.random()*h*.4,3,3);}});
  const balT=texFromCanvas(balC,false);balT.encoding=THREE.sRGBEncoding;const balM=new THREE.MeshStandardMaterial({map:balT,roughness:.5,metalness:.1});
  const slab=new THREE.BoxGeometry(3.1,.14,1.15);slab.translate(0,-1.45,.575);const front=new THREE.BoxGeometry(3.1,1.6,.06);front.translate(0,-.62,1.12);
  const sideL=new THREE.BoxGeometry(.06,1.6,1.1);sideL.translate(-1.52,-.62,.56);const sideR=sideL.clone();sideR.translate(3.04,0,0);
  const P=[{geo:mergeGeos([slab]),mat:concreteMat},{geo:mergeGeos([front,sideL,sideR]),mat:balM}];
  if(BALC.length>70000){for(let i=BALC.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[BALC[i],BALC[j]]=[BALC[j],BALC[i]];}BALC.length=70000;}
  instParts(P,BALC,city,false,'near');}
// ---- 停车场（空地上）----
{const lm=roadMat.clone();lm.color=new THREE.Color(0x606060);if(lm.map){for(const t of['map','normalMap','roughnessMap'])if(lm[t]){lm[t]=lm[t].clone();lm[t].repeat.set(1,1);lm[t].needsUpdate=true;}}lm.polygonOffset=true;lm.polygonOffsetFactor=-2;
 for(const L of LOTS){const lb=GB(),mb=GB();const tx=L.dx,tz=L.dz,nx=-tz,nz=tx,W=11,H=8;const P=(a,b,y)=>[L.x+tx*a+nx*b,y,L.z+tz*a+nz*b];
  const A0=P(-W,-H,.03),B0=P(W,-H,.03),C0=P(W,H,.03),D0=P(-W,H,.03);const o=lb.p.length/3;for(const v of[A0,B0,C0,D0])lb.p.push(...v);for(let t=0;t<4;t++)lb.n.push(0,1,0);lb.u.push(A0[0]/RT,A0[2]/RT,B0[0]/RT,B0[2]/RT,C0[0]/RT,C0[2]/RT,D0[0]/RT,D0[2]/RT);lb.i.push(o,o+1,o+2,o,o+2,o+3,o,o+2,o+1,o,o+3,o+2);
  for(const side of[-1,1])for(let a=-W+1.3;a<W-1;a+=2.6){const q=mb.p.length/3;const E0=P(a-.06,side*H,.04),E1=P(a+.06,side*H,.04),E2=P(a+.06,side*(H-5),.04),E3=P(a-.06,side*(H-5),.04);for(const v of[E0,E1,E2,E3])mb.p.push(...v);for(let t=0;t<4;t++)mb.n.push(0,1,0);mb.u.push(0,0,1,0,1,1,0,1);mb.i.push(q,q+1,q+2,q,q+2,q+3,q,q+2,q+1,q,q+3,q+2);
    if(Math.random()<.4&&a<W-2.4){const c=P(a+1.3,side*(H-2.5),0);const h=Math.atan2(-nx*side,-nz*side);LOTPARK.push({x:c[0],z:c[2],h,col:pick(['#e9e9e6','#e9e9e6','#15161a','#8a8f96','#c9ccd0','#1f3a63','#5a1a1a'])});}}
  for(const sd of[-1,1])for(let a=-W;a<=W;a+=7)TREES.push({x:P(a,sd*(H+1.4),0)[0],z:P(a,sd*(H+1.4),0)[2],y:0,s:rand(.75,1),r:rand(0,6.28)});
  addC(L.x,L.z,lm,gbGeo(lb),false);addC(L.x,L.z,lineWm,gbGeo(mb),false);}}
// ---- 中央隔离护栏（主干道双向）+ 碰撞 ----
const MED=[],MEDIX=new Map(),RAILS=[],HEDGE=[],BUSSTOPS=[],PARKED=[],OBST=[],OBIX=new Map();
PARKED.push(...LOTPARK);
function obstAdd(o){OBST.push(o);const k=Math.floor(o.x/20)*100003+Math.floor(o.z/20);if(!OBIX.has(k))OBIX.set(k,[]);OBIX.get(k).push(o);}
for(const e of RE){
  const ta=(RV[e.a].e.length>=3?vMaxW[e.a]/2+7:2),tb=(RV[e.b].e.length>=3?vMaxW[e.b]/2+7:2);
  if(e.c<=2&&!e.o&&e.w>=11&&e.L-ta-tb>20){const core=trimPts(e,ta,e.L-tb);MED.push({e,s0:ta,s1:e.L-tb});
    for(let k=0;k<core.length-1;k++){const a=core[k],c=core[k+1],L=Math.hypot(c.x-a.x,c.z-a.z);const n=Math.max(1,Math.round(L/2.5));for(let q=0;q<n;q++){const t0=q/n,t1=(q+1)/n;RAILS.push({x:a.x+(c.x-a.x)*(t0+t1)/2,z:a.z+(c.z-a.z)*(t0+t1)/2,ry:Math.atan2(c.x-a.x,c.z-a.z),len:L/n,kind:'med'});}
      const kk=Math.floor(a.x/GC)*100003+Math.floor(a.z/GC);if(!MEDIX.has(kk))MEDIX.set(kk,[]);MEDIX.get(kk).push({a,c});const kk2=Math.floor(c.x/GC)*100003+Math.floor(c.z/GC);if(kk2!==kk){if(!MEDIX.has(kk2))MEDIX.set(kk2,[]);MEDIX.get(kk2).push({a,c});}}}
  // 路口人行护栏（主干道转角）
  if(e.c<=2&&e.L>50)for(const[v,s0,dir]of[[e.a,vMaxW[e.a]/2+4.5,1],[e.b,e.L-vMaxW[e.b]/2-4.5,-1]]){if(RV[v].e.length<3)continue;for(const sd of[1,-1])for(let s=s0;Math.abs(s-s0)<22;s+=2.5*dir){const p=pointAt(e,s+1.25*dir);const o=e.w/2+.45;RAILS.push({x:p.x-p.dz*sd*o,z:p.z+p.dx*sd*o,ry:Math.atan2(p.dx,p.dz),len:2.5,kind:'side',y:.16});}}
  // 绿篱：次干道、支路，人行道外侧
  if(e.c>=2&&e.c<=4&&e.L>40){const z0=zoneOf(e.pts[0].x,e.pts[0].z);if(z0!=='night'||Math.random()<.3)for(const sd of[1,-1]){if(Math.random()<.72)continue;const ow=e.w/2+(e.c<=2?4.2:3.1);
    for(let s=ta+4;s<e.L-tb-4;s+=rand(10,16)){const L=rand(4,8);if(s+L>e.L-tb)break;const p=pointAt(e,s+L/2);const x=p.x-p.dz*sd*ow,z=p.z+p.dx*sd*ow;if(inBuilding(x,z,1.2)||onRoadSurf(x,z,-.5))continue;HEDGE.push({x,z,ry:Math.atan2(p.dx,p.dz),len:L});}}}
  // 公交站：主干道每 ~450m
  if(e.c<=2&&e.L>120)for(let s=ta+30;s<e.L-tb-30;s+=rand(380,520)){const sd=1;const p=pointAt(e,s);const o=e.w/2+2.2;const x=p.x-p.dz*sd*o,z=p.z+p.dx*sd*o;if(inBuilding(x,z,2))continue;BUSSTOPS.push({x,z,ry:Math.atan2(p.dx,p.dz)+Math.PI/2*sd,dx:p.dx,dz:p.dz,sd});}
  // 路边停车：居民区支路
  if(e.c>=3&&e.c<=4&&e.w>=6.5&&e.L>40)for(const sd of(e.o?[1]:[1,-1])){if(Math.random()<.55)continue;for(let s=ta+6;s<e.L-tb-6;s+=rand(7,16)){if(Math.random()<.55)continue;const p=pointAt(e,s);const o=e.w/2-1.15;const x=p.x-p.dz*sd*o,z=p.z+p.dx*sd*o;let bad=false;for(const k in PLACES)if(Math.hypot(PLACES[k].spot.x-x,PLACES[k].spot.z-z)<14)bad=true;if(bad)continue;
      const h=Math.atan2(-p.dx*sd,-p.dz*sd);PARKED.push({x,z,h,col:pick(['#e9e9e6','#e9e9e6','#15161a','#8a8f96','#c9ccd0','#1f3a63','#5a1a1a'])});obstAdd({x:x+p.dx*1.2,z:z+p.dz*1.2,r:1.05});obstAdd({x:x-p.dx*1.2,z:z-p.dz*1.2,r:1.05});}}
}
for(const b of BUSSTOPS){const o={x:b.x,z:b.z,r:.1};}
// legal：追加中央护栏、路边停车的碰撞
const _legal0=legal;
legal=function(x,z){if(!_legal0(x,z))return false;
  const L=MEDIX.get(Math.floor(x/GC)*100003+Math.floor(z/GC));if(L)for(const s of L)if(segDist({x,z},s.a,s.c).d<1.05)return false;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const O=OBIX.get((Math.floor(x/20)+i)*100003+Math.floor(z/20)+j);if(O)for(const o of O)if((x-o.x)**2+(z-o.z)**2<(o.r+.95)**2)return false;}return true;};
// ---- 公交站（程序化：顶棚、玻璃、灯箱广告、站牌）----
{const glassM=new THREE.MeshStandardMaterial({color:0xa8c0cc,roughness:.05,metalness:.2,transparent:true,opacity:.28,depthWrite:false});const steel=std('#3a3e44',.4,.8);const roofM=std('#2b2f35',.5,.6);
  const ADS=['顺路出行 · 夜里回家也安心','申城银行 · 信用卡 0 元年费','浦江证券 · 开户送 Level-2','江南酒业 · 一口江南','苏河消费 · 双十二大促','好邻居超市 · 24 小时'];
  for(const b of BUSSTOPS){const tx=b.dx,tz=b.dz,nx=-b.dz*b.sd,nz=b.dx*b.sd;const P=(a,o,y)=>[b.x+tx*a+nx*o,y,b.z+tz*a+nz*o];
    const box=(w,h,d,a,o,y,m)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateY(Math.atan2(tx,tz));const p=P(a,o,y);g.translate(...p);addC(b.x,b.z,m,g);};
    box(.08,2.6,.08,-2.6,.9,1.46,steel);box(.08,2.6,.08,2.6,.9,1.46,steel);box(.08,2.6,.08,-2.6,-.6,1.46,steel);box(.08,2.6,.08,2.6,-.6,1.46,steel);
    box(1.9,.08,5.6,0,.15,2.8,roofM);box(.02,2.2,5.2,0,.9,1.36,glassM);
    box(.4,.45,4.2,0,.7,.38,std('#6a6e74',.5,.6));
    const sc=signCell(pick(ADS),pick(['blue','white','orange','dark']));const pl=new THREE.PlaneGeometry(1.6,2.1);const uv=pl.attributes.uv;const U=sc.uv;uv.setXY(0,U[6],U[7]);uv.setXY(1,U[4],U[5]);uv.setXY(2,U[0],U[1]);uv.setXY(3,U[2],U[3]);
    pl.rotateY(Math.atan2(nx,nz)+Math.PI);const p=P(2.62,.2,1.5);pl.translate(...p);addC(b.x,b.z,sc.m,pl,false);GLOWS.push({x:p[0],y:1.5,z:p[2],c:0xdde8ff,s:2.4});
    box(.1,3.2,.1,-3.6,-1.1,1.76,steel);const st=signCell(pick(['71路','925路','49路','26路','920路','45路'])+' · 公交站','blue');const sp=new THREE.PlaneGeometry(.9,.24);const su=sp.attributes.uv;const S2=st.uv;su.setXY(0,S2[6],S2[7]);su.setXY(1,S2[4],S2[5]);su.setXY(2,S2[0],S2[1]);su.setXY(3,S2[2],S2[3]);sp.rotateY(Math.atan2(tx,tz)+Math.PI/2);const q=P(-3.6,-1.1,3.1);sp.translate(...q);addC(b.x,b.z,st.m,sp,false);
  }}
// ---- 绿篱（叶片质感的方块，按块合批）----
const hedgeC=canvasOf(256,256,(g,w,h)=>{g.fillStyle='#24361a';g.fillRect(0,0,w,h);for(let k=0;k<2600;k++){const x=rand(0,w),y=rand(0,h),r=rand(2,6);g.fillStyle=`hsl(${rand(80,110)},${rand(30,50)}%,${rand(14,34)}%)`;g.beginPath();g.ellipse(x,y,r,r*.6,rand(0,3),0,7);g.fill();}});
const hedgeM=new THREE.MeshStandardMaterial({map:texFromCanvas(hedgeC,true),normalMap:normalFromHeight(hedgeC,4),roughness:.9});
const HB=[];
for(const hd of HEDGE){if(!AS.gltf.bushes){const g=new THREE.BoxGeometry(.8,.75,hd.len,1,1,1);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*hd.len/2,uv.getY(i)*.5);g.rotateY(hd.ry);g.translate(hd.x,.16+.375,hd.z);addC(hd.x,hd.z,hedgeM,g);}
  else{const tx=Math.sin(hd.ry),tz=Math.cos(hd.ry);for(let a=-hd.len/2+.4;a<hd.len/2;a+=1.5)HB.push({x:hd.x+tx*a+rand(-.08,.08),y:.2,z:hd.z+tz*a+rand(-.08,.08),ry:rand(0,6.28),sx:rand(.9,1.2),sy:rand(.8,1.15),sz:rand(.9,1.2)});}
  const c=new THREE.BoxGeometry(.95,.18,hd.len+.15);c.rotateY(hd.ry);c.translate(hd.x,.25,hd.z);addC(hd.x,hd.z,curbMat,c);}
// ---- 公园：长椅、灌木、园灯 ----
const BENCH=[],BUSH=[],PLAMP=[];
for(const flat of MAP.G||[]){const ring=[];for(let i=0;i<flat.length;i+=2)ring.push({x:flat[i],z:flat[i+1]});let A=0;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];A+=p.x*q.z-q.x*p.z;}A=Math.abs(A)/2;if(A<400)continue;
  let cx=0,cz=0;for(const p of ring){cx+=p.x;cz+=p.z;}cx/=ring.length;cz/=ring.length;
  const nB=Math.min(60,A/120);for(let k=0;k<nB;k++){const p=ring[randi(0,ring.length-1)],t=rand(.15,.85);const x=lerp(p.x,cx,t),z=lerp(p.z,cz,t);if(inBuilding(x,z,.8)||onRoadSurf(x,z,-1))continue;BUSH.push({x,y:.02,z,ry:rand(0,6.28),sx:rand(1.2,2.2),sy:rand(1,1.8),sz:rand(1.2,2.2)});}
  const nS=Math.min(14,A/700);for(let k=0;k<nS;k++){const i=randi(0,ring.length-1),p=ring[i],q=ring[(i+1)%ring.length];const t=rand(.2,.8);const ex=lerp(p.x,q.x,t),ez=lerp(p.z,q.z,t);const x=lerp(ex,cx,.12),z=lerp(ez,cz,.12);if(inBuilding(x,z,.8)||onRoadSurf(x,z,-.8))continue;BENCH.push({x,y:.02,z,ry:Math.atan2(cx-x,cz-z)});if(k%2===0)PLAMP.push({x:x+1.5,z:z+1.5});}
}
// 园灯（短杆）
{const pole=new THREE.CylinderGeometry(.05,.07,3.4,8);pole.translate(0,1.7,0);const head=new THREE.SphereGeometry(.22,12,10);head.translate(0,3.5,0);
  const pm=new THREE.InstancedMesh(pole,std('#2c2f33',.4,.7),PLAMP.length),hm=new THREE.InstancedMesh(head,new THREE.MeshStandardMaterial({color:0xeeeeee,emissive:0xffe2b0,emissiveIntensity:0,roughness:.3}),PLAMP.length);
  PLAMP.forEach((l,i)=>{const M4=new THREE.Matrix4().makeTranslation(l.x,0,l.z);pm.setMatrixAt(i,M4);hm.setMatrixAt(i,M4);GLOWS.push({x:l.x,y:3.5,z:l.z,c:0xffe2b0,s:1.6});});
  city.add(pm,hm);window.PLAMP_HEAD=hm.material;}
// ---- 写实道具实例化（模型按真实尺寸归一）----
function normParts(key,targetH,filter){const P=gltfParts(key,filter);if(!P)return null;const bb=new THREE.Box3();for(const p of P){p.geo.computeBoundingBox();bb.union(p.geo.boundingBox);}const c=bb.getCenter(new THREE.Vector3()),s=targetH/(bb.max.y-bb.min.y);
  for(const p of P){p.geo.translate(-c.x,-bb.min.y,-c.z);p.geo.scale(s,s,s);p.geo.computeBoundingSphere();}P.len=(bb.max.x-bb.min.x)*s;return P;}
{const gr=normParts('grail',1.1),mb=normParts('mbarrier',1.05);
  {const panC=canvasOf(256,64,(g,w,h)=>{g.fillStyle='#f2f2ee';g.fillRect(0,0,w,h);g.fillStyle='#f2c230';for(let x=-h;x<w;x+=36){g.beginPath();g.moveTo(x,h);g.lineTo(x+18,h);g.lineTo(x+18+h,0);g.lineTo(x+h,0);g.fill();}});const panT=texFromCanvas(panC,false);panT.encoding=THREE.sRGBEncoding;
    const post=new THREE.CylinderGeometry(.04,.04,1.15,8);post.translate(0,.575,-1.25);const r1=new THREE.CylinderGeometry(.025,.025,2.5,6);r1.rotateX(Math.PI/2);const r2=r1.clone();r1.translate(0,1.1,0);r2.translate(0,.18,0);
    const bars=[];for(let z=-1.1;z<1.2;z+=.16){const b=new THREE.CylinderGeometry(.012,.012,.85,4);b.translate(0,.6,z);bars.push(b);}
    const pan=new THREE.BoxGeometry(.03,.32,2.3);pan.translate(0,.92,0);
    const P=[{geo:mergeGeos([post,r1,r2,...bars]),mat:std('#f4f4f0',.35,.6)},{geo:mergeGeos([pan]),mat:new THREE.MeshStandardMaterial({map:panT,roughness:.4,metalness:.1})}];
    instParts(P,RAILS.filter(r=>r.kind==='med').map(r=>({x:r.x,y:.02,z:r.z,ry:r.ry,sx:1,sy:1,sz:r.len/2.5})),city,true,'near');}
  if(mb)instParts(mb,RAILS.filter(r=>r.kind==='side').map(r=>({x:r.x,y:.16,z:r.z,ry:r.ry+Math.PI/2,sx:r.len/mb.len,sy:1,sz:1})),city);
  const bu=normParts('bushes',.75);if(bu){instParts(bu,HB,city);instParts(bu,BUSH.concat(YARD_BUSH),city);}
  const be=normParts('bench',.85);if(be)instParts(be,BENCH,city);}
flushC();
