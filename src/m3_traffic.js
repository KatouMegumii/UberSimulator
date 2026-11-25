
// ================= 交通：沿真实路网行驶，遇红灯停车 =================
const AI=[];
const AICOL=['#e8e8e6','#1c1d20','#8a8f96','#2b4a7a','#7a1f1f','#d8d4c8','#3a4a3a','#5a5f66','#b9b3a6','#e8e8e6','#1c1d20'];
const VMAX=[16,14,12.5,11,9,7];
function laneOff(e){return e.w>=8?e.w/4:Math.max(.4,e.w/2-1.4);}
function nearEdgesAround(x,z,r0,r1){const out=[];for(const e of DRIVE_EDGES){const m=e.pts[Math.floor(e.pts.length/2)];const d=Math.hypot(m.x-x,m.z-z);if(d>r0&&d<r1)out.push(e);}return out;}
function placeAI(a,x,z,r0,r1){const L=nearEdgesAround(x,z,r0,r1);if(!L.length)return;const e=pick(L);a.e=e;a.dir=e.o?1:(Math.random()<.5?1:-1);a.s=rand(2,e.L-2);a.speed=rand(4,8);a.vmax=VMAX[e.c]*rand(.8,1.05);}
for(let k=0;k<34;k++){const r=Math.random(),kind=r<.2?'taxi':r<.4?'suv':'sedan';const g=makeCar(pick(AICOL),kind);scene.add(g);const a={g,m:null,elev:false};placeAI(a,PLACES.home.spot.x,PLACES.home.spot.z,20,520);AI.push(a);}
// 高架车流
const ELV=[];for(const el of MAP.EL||[]){const pts=[];for(let k=0;k<el.p.length;k+=2)pts.push({x:el.p[k],z:el.p[k+1]});if(pts.length<2)continue;const cum=[0];for(let k=1;k<pts.length;k++)cum.push(cum[k-1]+Math.hypot(pts[k].x-pts[k-1].x,pts[k].z-pts[k-1].z));if(cum[cum.length-1]>150)ELV.push({pts,cum,L:cum[cum.length-1],w:Math.max(10,el.w)});}
for(let k=0;k<Math.min(16,ELV.length*2);k++){const g=makeCar(pick(AICOL),'sedan');scene.add(g);const e=pick(ELV);AI.push({g,m:null,elev:true,e,dir:Math.random()<.5?1:-1,s:rand(0,e.L),speed:rand(14,20),vmax:rand(15,21)});}
function nextEdge(a){const v=a.dir>0?a.e.b:a.e.a;const opts=RV[v].e.map(i=>RE[i]).filter(e=>e!==a.e&&e.c>=1&&(e.c<5||a.e.c>=5||Math.random()<.15)&&(!e.o||e.a===v));
  if(!opts.length){if(!a.e.o){a.dir*=-1;return;}placeAI(a,car.x,car.z,250,550);return;}
  const e=pick(opts);a.e=e;a.dir=e.a===v?1:-1;a.s=a.dir>0?0:e.L;a.vmax=VMAX[e.c]*rand(.8,1.05);}
const _ap={x:0,z:0};
function aiUpdate(dt){
  for(const a of AI){
    if(a.elev){const e=a.e;a.s+=a.dir*a.speed*dt;if(a.s>e.L||a.s<0){a.dir*=-1;a.s=clamp(a.s,0,e.L);}let k=1;while(k<e.cum.length-1&&e.cum[k]<a.s)k++;const p=e.pts[k-1],q=e.pts[k],t=(a.s-e.cum[k-1])/((e.cum[k]-e.cum[k-1])||1);
      const dx=(q.x-p.x)*a.dir,dz=(q.z-p.z)*a.dir,L=Math.hypot(dx,dz)||1,tx=dx/L,tz=dz/L,o=e.w/4;a.g.position.set(p.x+(q.x-p.x)*t-tz*o,10.4,p.z+(q.z-p.z)*t+tx*o);a.g.rotation.y=Math.atan2(-tx,-tz);
      if(a.m){a.m.position.copy(a.g.position);a.m.rotation.y=a.g.rotation.y;}continue;}
    const e=a.e;if(!e)continue;
    const P=pointAt(e,a.s),tx=P.dx*a.dir,tz=P.dz*a.dir,rx=-tz,rz=tx,lo=laneOff(e,a);
    let target=a.vmax;
    // 玩家在前方
    const px=car.x-P.x,pz=car.z-P.z,ahead=px*tx+pz*tz,lat=px*rx+pz*rz;
    if(ahead>0&&ahead<15&&Math.abs(lat-lo)<2.4)target=Math.min(target,Math.max(0,(ahead-6.5)*.8));
    for(const b of AI){if(b===a||b.elev||b.e!==e||b.dir!==a.dir)continue;const d=(b.s-a.s)*a.dir;if(d>0&&d<16)target=Math.min(target,Math.max(0,(d-6.5)*.9));}
    // 路口信号灯
    const rem=a.dir>0?e.L-a.s:a.s,v=a.dir>0?e.b:e.a;
    if(SIGV.has(v)&&rem<36){const stop=rem-(vMaxW[v]/2+3.5);const st=SIG.now[Math.abs(tx)>Math.abs(tz)?'x':'z'];if(st!=='g'&&stop>-1&&!(st==='y'&&stop<6))target=Math.min(target,Math.max(0,stop*.45));}
    else if(rem<12&&RV[v].e.length>=3)target=Math.min(target,7);
    a.speed+=(target-a.speed)*Math.min(1,dt*(target<a.speed?3.5:1));a.s+=a.dir*a.speed*dt;
    if(a.s>e.L||a.s<0){const over=a.dir>0?a.s-e.L:-a.s;nextEdge(a);if(a.e)a.s+=a.dir*Math.min(over,1);}
    const Q=pointAt(a.e,a.s),qx=Q.dx*a.dir,qz=Q.dz*a.dir,lo2=laneOff(a.e,a);
    a.g.position.set(Q.x-qz*lo2,0,Q.z+qx*lo2);
    const want=Math.atan2(-qx,-qz);let dh=want-a.g.rotation.y;dh=Math.atan2(Math.sin(dh),Math.cos(dh));a.g.rotation.y+=dh*Math.min(1,dt*8);
    if(a.m){a.m.position.copy(a.g.position);a.m.rotation.y=a.g.rotation.y;}
    let dx=car.x-a.g.position.x,dz=car.z-a.g.position.z,d=Math.hypot(dx,dz);
    if(a.bus){const al=dx*qx+dz*qz;if(Math.abs(al)<6.2){const ex=dx-qx*al,ez=dz-qz*al;d=Math.hypot(ex,ez)*1.6;dx=ex;dz=ez;}else d=99;}
    if(d<2.6&&d>.01&&S.loc==='car'){const push=2.6-d;const nx2=car.x+dx/d*push,nz2=car.z+dz/d*push;if(legal(nx2,nz2)){car.x=nx2;car.z=nz2;}if(Math.abs(car.speed)>2.5){bump('和别的车蹭了一下');car.shake=1;if(typeof accident==='function'){const sp=Math.abs(car.speed);if(sp>8)accident(2);else if(sp>3.5)accident(1);}}car.speed*=-.25;}
    if(!a.bus&&d>700&&Math.random()<.05){placeAI(a,car.x,car.z,280,600);if(a.m){a.m.visible=false;}}
  }
}
// ================= 行人：沿人行道 =================
const PEDS=[];
function placePed(p,x,z,r0,r1){const L=nearEdgesAround(x,z,r0,r1).filter(e=>e.c>=2);if(!L.length)return;p.e=pick(L);p.side=Math.random()<.5?1:-1;p.s=rand(0,p.e.L);p.dir=Math.random()<.5?1:-1;p.spd=rand(1,1.5);p.off=p.e.w/2+rand(1.6,3.2);}
for(let k=0;k<80;k++){const g=makePerson();scene.add(g);const p={g,stop:0};placePed(p,PLACES.home.spot.x,PLACES.home.spot.z,0,260);PEDS.push(p);}
function pedUpdate(dt){for(const p of PEDS){if(!p.e)continue;
  const near=Math.abs(p.g.position.x-car.x)+Math.abs(p.g.position.z-car.z)<140;p.g.visible=near;
  if(p.idle){if(!p.placed){const Q=pointAt(p.e,p.s);p.g.position.set(Q.x-Q.dz*p.side*(p.off+.6),.16,Q.z+Q.dx*p.side*(p.off+.6));p.g.rotation.y=Math.atan2(Q.dz*p.side,-Q.dx*p.side)+rand(-.6,.6);p.placed=1;}if(Math.hypot(p.g.position.x-car.x,p.g.position.z-car.z)>260&&Math.random()<.02){placePed(p,car.x,car.z,60,220);p.placed=0;}continue;}
  if(p.stop>0){p.stop-=dt;if(near&&!p.g.userData.real)animPerson(p.g,dt,false);}else{p.s+=p.dir*p.spd*dt;if(Math.random()<.001)p.stop=rand(2,6);if(near&&!p.g.userData.real)animPerson(p.g,dt,true);}
  if(p.s<0||p.s>p.e.L){p.dir*=-1;p.s=clamp(p.s,0,p.e.L);}
  const Q=pointAt(p.e,p.s);p.g.position.set(Q.x-Q.dz*p.side*p.off,.16,Q.z+Q.dx*p.side*p.off);p.g.rotation.y=Math.atan2(-Q.dx*p.dir,-Q.dz*p.dir);
  if(Math.hypot(p.g.position.x-car.x,p.g.position.z-car.z)>260&&Math.random()<.02)placePed(p,car.x,car.z,60,220);}}
