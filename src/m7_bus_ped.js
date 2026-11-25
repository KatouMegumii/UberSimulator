
// ================= 公交车 + 行人过马路 + 撞人 =================
// ---- 公交车：主干道上跑，到站停靠 ----
const BUSES=[];
{const P=typeof normParts==='function'?gltfParts('bus'):null;
  if(P&&P.length){const bb=new THREE.Box3();for(const p of P){p.geo.computeBoundingBox();bb.union(p.geo.boundingBox);}const sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());const along=sz.x>sz.z?'x':'z',L=Math.max(sz.x,sz.z),sc=11.8/L;
    for(const p of P){p.geo.translate(-c.x,-bb.min.y,-c.z);p.geo.scale(sc,sc,sc);if(along==='x')p.geo.rotateY(Math.PI/2);p.geo.computeBoundingSphere();}
    const mains=DRIVE_EDGES.filter(e=>e.c<=2&&e.L>150);
    for(let k=0;k<8&&mains.length;k++){const g=new THREE.Group();for(const p of P){const m=new THREE.Mesh(p.geo,p.mat);m.castShadow=true;m.receiveShadow=true;g.add(m);}g.add(blobShadow(12.5,2.7));scene.add(g);
      const a={g,m:null,bus:true,elev:false,stopT:0};placeAI(a,PLACES.home.spot.x,PLACES.home.spot.z,80,700);if(a.e&&a.e.c>2){const e=pick(mains);a.e=e;a.dir=e.o?1:pick([1,-1]);a.s=rand(5,e.L-5);}a.vmax=10;AI.push(a);BUSES.push(a);}}}
// 公交车：贴最外侧车道、到站停 8 秒；不参与 LOD 换模型
const _laneOff0=laneOff;
laneOff=function(e,a){return a&&a.bus?Math.max(1.6,e.w/2-1.9):_laneOff0(e);};
function busUpdate(dt){for(const a of BUSES){if(!a.e)continue;const P=pointAt(a.e,a.s),tx=P.dx*a.dir,tz=P.dz*a.dir;
    if(a.stopT>0){a.stopT-=dt;a.speed=0;a.vmax=0;if(a.stopT<=0){a.vmax=10;a.lastStop=a.s;}continue;}
    for(const b of BUSSTOPS){const dx=b.x-P.x,dz=b.z-P.z;const ahead=dx*tx+dz*tz,lat=Math.abs(dx*-tz+dz*tx);if(ahead>0&&ahead<6&&lat<a.e.w/2+4&&(a.lastStop===undefined||Math.abs(a.s-a.lastStop)>40)){a.stopT=8;a.lastStop=a.s;break;}}
    const d=Math.hypot(a.g.position.x-car.x,a.g.position.z-car.z);if(d>900&&Math.random()<.02)placeAI(a,car.x,car.z,300,700);}}
// ---- 行人：只走人行道，在有信号灯的斑马线过马路 ----
function pedRange(e){const a=RV[e.a].e.length>=3?vMaxW[e.a]/2+4.6:1.5,b=RV[e.b].e.length>=3?vMaxW[e.b]/2+4.6:1.5;return[a,Math.max(a+1,e.L-b)];}
function pedStep(p,dt,near){const e=p.e;if(!e)return;const[r0,r1]=pedRange(e);
  if(p.cross){const c=p.cross;const ax=Math.abs(c.dx)>Math.abs(c.dz)?'x':'z';c.t+=dt*p.spd/(2*p.off);const k=Math.min(1,c.t);const o=lerp(c.o0,-c.o0,k);
    p.g.position.set(c.x-c.dz*o,o*o<(e.w/2)**2?0:.16,c.z+c.dx*o);p.g.rotation.y=Math.atan2(c.dz*Math.sign(c.o0),-c.dx*Math.sign(c.o0));if(k>=1){p.side=-p.side;p.cross=null;p.dir*=-1;}return true;}
  p.s+=p.dir*p.spd*dt;
  if(p.s<r0||p.s>r1){const atA=p.s<r0,v=atA?e.a:e.b;p.s=clamp(p.s,r0,r1);
    if(SIGV.has(v)&&Math.random()<.7){const Q=pointAt(e,atA?r0-2.4:r1+2.4);const ax=Math.abs(Q.dx)>Math.abs(Q.dz)?'x':'z';
      if(SIG.now[ax]==='g'){p.wait=true;p.dir=atA?-1:1;}else{p.wait=false;p.cross={x:Q.x,z:Q.z,dx:Q.dx,dz:Q.dz,o0:p.side*p.off,t:0};return true;}}
    else p.dir*=-1;}
  return false;}
const _pedUpdate0=pedUpdate;
pedUpdate=function(dt){for(const p of PEDS){if(!p.e||p.idle)continue;
    const near=Math.abs(p.g.position.x-car.x)+Math.abs(p.g.position.z-car.z)<140;p.g.visible=near;
    if(p.hit){p.hitT-=dt;if(p.hitT<0){p.hit=false;p.g.rotation.x=0;placePed(p,car.x,car.z,80,220);}continue;}
    if(p.wait){const[r0,r1]=pedRange(p.e);const atA=p.s<=r0+.01;const Q=pointAt(p.e,atA?r0-2.4:r1+2.4);const ax=Math.abs(Q.dx)>Math.abs(Q.dz)?'x':'z';if(SIG.now[ax]!=='g'){p.wait=false;p.cross={x:Q.x,z:Q.z,dx:Q.dx,dz:Q.dz,o0:p.side*p.off,t:0};}else{if(near&&p.g.userData.mixer)p.g.userData.mixer.update(0);continue;}}
    if(pedStep(p,dt,near)){}else{const Q=pointAt(p.e,p.s);p.g.position.set(Q.x-Q.dz*p.side*p.off,.16,Q.z+Q.dx*p.side*p.off);p.g.rotation.y=Math.atan2(-Q.dx*p.dir,-Q.dz*p.dir);}
    // 撞到行人
    const dx=p.g.position.x-car.x,dz=p.g.position.z-car.z;if(S.loc==='car'&&dx*dx+dz*dz<1.6&&Math.abs(car.speed)>1.5)hitPed(p);
    if(Math.hypot(p.g.position.x-car.x,p.g.position.z-car.z)>260&&Math.random()<.02&&!p.cross)placePed(p,car.x,car.z,60,220);}
  // 站着的行人沿用原逻辑
  for(const p of PEDS)if(p.idle){if(!p.placed){const Q=pointAt(p.e,clamp(p.s,...pedRange(p.e)));p.g.position.set(Q.x-Q.dz*p.side*(p.off+.6),.16,Q.z+Q.dx*p.side*(p.off+.6));p.g.rotation.y=Math.atan2(Q.dz*p.side,-Q.dx*p.side)+rand(-.6,.6);p.placed=1;}
    if(Math.hypot(p.g.position.x-car.x,p.g.position.z-car.z)>260&&Math.random()<.02){placePed(p,car.x,car.z,60,220);p.placed=0;}}};
function hitPed(p){const v=Math.abs(car.speed);car.speed=0;car.shake=1.5;p.hit=true;p.hitT=30;p.cross=null;p.g.rotation.x=-Math.PI/2*.9;p.g.position.y=.25;if(p.g.userData.mixer)p.g.userData.mixer.update(0);thud(.4);
  const cost=v>8?randi(8000,20000):randi(1500,4000),pts=v>8?6:3;if(S.order&&S.order.phase==='toDrop')S.order.bumps+=3;if(S.online)setOnline(false);
  openModal(`<h2>撞到了行人</h2><p>${v>8?'对方倒地不起，周围的人围了上来。120 和 110 都到了。':'对方被撞倒在斑马线上，还好能站起来，坚持要去医院检查。'}</p>
  <div class="say"><b>交警认定</b>　机动车未礼让斑马线上的行人，你负主要责任。记 ${pts} 分，医疗和误工费约 ¥${cost}。</div>
  <button class="opt" data-act="law" data-arg="ped:${cost}:${pts}:ins">走交强险和商业险（自付 ¥${Math.round(cost*.15)}）</button><button class="opt" data-act="law" data-arg="ped:${cost}:${pts}:cash">自己全额赔付 ¥${cost}</button>`);}
