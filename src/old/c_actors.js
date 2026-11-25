
// ================= 玩家车辆与驾驶舱 =================
const car={x:-205,z:43,h:0,speed:0,steer:0,lookYaw:0,lookPitch:0};
const carG=new THREE.Group();scene.add(carG);
carG.add(camera);camera.position.set(-.37,1.18,.05);
const dashMat=lam('#1b1c1f');
carG.add(bx(1.78,.22,.62,0,0,.86,-.78,dashMat));
carG.add(bx(1.7,.08,.3,0,0,.99,-1.02,lam('#161719')));
{const hood=bx(1.76,.12,1.7,'#e9e9e6',0,.86,-1.95);hood.rotation.x=.04;carG.add(hood);}
for(const s of[-1,1]){const p=bx(.07,.96,.09,'#1d1e21',s*.77,1.3,-.7);p.rotation.x=.82;carG.add(p);
  carG.add(bx(.08,.12,1.7,'#202124',s*.86,1.0,.0));
  const mir=bx(.06,.14,.22,'#e9e9e6',s*1.02,1.12,-.5);carG.add(mir);}
carG.add(bx(1.6,.06,.14,'#1d1e21',0,1.62,-.36));
carG.add(bx(.26,.07,.03,'#111',0,1.5,-.55));
{const knot=bx(.06,.09,.02,'#c0262e',0,1.36,-.55);carG.add(knot);carG.add(bx(.008,.14,.008,'#c0262e',0,1.43,-.55));}
const wheelPivot=new THREE.Group();wheelPivot.position.set(-.37,.99,-.42);wheelPivot.rotation.x=.38;carG.add(wheelPivot);
const wheelSpin=new THREE.Group();wheelPivot.add(wheelSpin);
{const tor=new THREE.Mesh(new THREE.TorusGeometry(.19,.024,8,28),lam('#121212'));wheelSpin.add(tor);
  wheelSpin.add(bx(.36,.035,.02,'#1a1a1a',0,0,0));wheelSpin.add(bx(.035,.17,.02,'#1a1a1a',0,-.09,0));
  wheelSpin.add(bx(.09,.06,.03,'#2a2a2a',0,0,.01));}
const clusterCv=document.createElement('canvas');clusterCv.width=320;clusterCv.height=110;
const clusterTex=new THREE.CanvasTexture(clusterCv);
{const m=new THREE.Mesh(new THREE.PlaneGeometry(.38,.13),new THREE.MeshBasicMaterial({map:clusterTex}));m.position.set(-.37,1.03,-.66);m.rotation.x=-.15;carG.add(m);
  carG.add(bx(.44,.06,.12,'#141516',-.37,1.11,-.68));}
{const scr=ctex(256,160,(g,w,h)=>{g.fillStyle='#0d0f12';g.fillRect(0,0,w,h);g.fillStyle='#ff8a2a';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('顺路出行',w/2,h/2);g.fillStyle='#666';g.font='16px sans-serif';g.fillText('车载终端',w/2,h/2+30);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.26,.16),new THREE.MeshBasicMaterial({map:scr}));m.position.set(.08,1.0,-.66);m.rotation.x=-.25;carG.add(m);}
const headL=new THREE.SpotLight(0xfff1d6,0,95,.55,.55,1.2);headL.position.set(0,.8,-2.3);carG.add(headL);const hlT=new THREE.Object3D();hlT.position.set(0,-.5,-30);carG.add(hlT);headL.target=hlT;
const cabinL=new THREE.PointLight(0xffc89a,0,3);cabinL.position.set(0,1.4,-.3);carG.add(cabinL);
function drawCluster(){
  const g=clusterCv.getContext('2d'),w=320,h=110;g.fillStyle='#07080a';g.fillRect(0,0,w,h);
  const kmh=Math.abs(car.speed*3.6);
  g.fillStyle='#e8f4ff';g.font='bold 54px sans-serif';g.textAlign='center';g.fillText(Math.round(kmh),w/2,68);
  g.font='14px sans-serif';g.fillStyle='#7fa8c9';g.fillText('km/h',w/2,90);
  g.textAlign='left';g.fillStyle=car.speed<-.2?'#ff8a2a':'#9fe8b0';g.font='bold 22px sans-serif';g.fillText(car.speed<-.2?'R':'D',18,60);
  g.textAlign='right';g.fillStyle='#9ab';g.font='16px sans-serif';g.fillText('电量 '+Math.round(S.battery)+'%',w-14,40);g.fillText(fmt(S.t),w-14,66);
  g.fillStyle=S.online?'#3fe08a':'#666';g.fillText(S.online?'● 听单中':'○ 离线',w-14,92);
  const bw=Math.min(1,kmh/80);g.fillStyle='#1d2a36';g.fillRect(70,98,180,5);g.fillStyle='#4fb3ff';g.fillRect(70,98,180*bw,5);
  clusterTex.needsUpdate=true;
}

// ================= 交通车流 =================
const AI=[];
function spawnAI(ax,line,dir,lane,pos,elev){
  const col=pick(['#e8e8e8','#222','#8a8f96','#2b4a7a','#7a1f1f','#d8d4c8','#3a5a3a','#f0c040']);
  const g=makeCar(col);scene.add(g);
  const off=(lane===0?2.4:5.4);let lat;
  if(ax==='x')lat=line+(dir>0?off:-off);else lat=line+(dir>0?-off:off);
  AI.push({g,ax,lat,dir,pos,speed:rand(8,13),vmax:rand(9,14),elev:!!elev});
}
for(let k=0;k<22;k++){const ax=Math.random()<.5?'x':'z';spawnAI(ax,R[randi(0,6)],Math.random()<.5?1:-1,randi(0,1),rand(-300,300));}
for(let k=0;k<7;k++){const d=Math.random()<.5?1:-1;spawnAI('x',-200,d,randi(0,1),rand(-330,330),true);}
function aiUpdate(dt){
  for(const a of AI){
    let target=a.vmax;
    if(!a.elev){
      const pa=a.ax==='x'?car.x:car.z,pl=a.ax==='x'?car.z:car.x;
      const ahead=(pa-a.pos)*a.dir;
      if(Math.abs(pl-a.lat)<2.4&&ahead>0&&ahead<14)target=0;
      for(const b of AI){if(b===a||b.elev||b.ax!==a.ax||Math.abs(b.lat-a.lat)>1||b.dir!==a.dir)continue;const d=(b.pos-a.pos)*a.dir;if(d>0&&d<10){target=Math.min(target,b.speed*.8);}}
    }
    a.speed+=(target-a.speed)*Math.min(1,dt*(target<a.speed?4:1.2));
    a.pos+=a.dir*a.speed*dt;
    const W=a.elev?340:318;if(a.pos>W)a.pos=-W;if(a.pos<-W)a.pos=W;
    const y=a.elev?10.2:0;
    if(a.ax==='x'){a.g.position.set(a.pos,y,a.lat);a.g.rotation.y=a.dir>0?-Math.PI/2:Math.PI/2;}
    else{a.g.position.set(a.lat,y,a.pos);a.g.rotation.y=a.dir>0?Math.PI:0;}
    if(!a.elev){const dx=car.x-a.g.position.x,dz=car.z-a.g.position.z,d=Math.hypot(dx,dz);
      if(d<2.5&&d>.01){const push=(2.5-d);car.x+=dx/d*push;car.z+=dz/d*push;if(!legal(car.x,car.z)){car.x-=dx/d*push;car.z-=dz/d*push;}if(Math.abs(car.speed)>2.5)bump('和别的车蹭了一下');car.speed*=-.25;}}
  }
}

// ================= 行人 =================
const PEDS=[];
for(let k=0;k<46;k++){
  const i=randi(0,5),j=randi(0,5),cx=-250+100*i,cz=-250+100*j,e=randi(0,3),g=makePerson();scene.add(g);
  const fixed=[cz-40,cz+40,cx-40,cx+40][e],ax=e<2?'x':'z',c=ax==='x'?cx:cz;
  PEDS.push({g,ax,fixed,a0:c-38,a1:c+38,pos:c+rand(-38,38),dir:Math.random()<.5?1:-1,spd:rand(1,1.6)});
}
function animPerson(g,dt,moving){const u=g.userData;if(moving)u.phase+=dt*7;const s=moving?Math.sin(u.phase)*.5:0;u.legs[0].rotation.x=s;u.legs[1].rotation.x=-s;u.arms[0].rotation.x=-s*.6;u.arms[1].rotation.x=s*.6;}
function pedUpdate(dt){for(const p of PEDS){p.pos+=p.dir*p.spd*dt;if(p.pos>p.a1||p.pos<p.a0){p.dir*=-1;p.pos=clamp(p.pos,p.a0,p.a1);}
  if(p.ax==='x'){p.g.position.set(p.pos,.18,p.fixed);p.g.rotation.y=p.dir>0?-Math.PI/2:Math.PI/2;}else{p.g.position.set(p.fixed,.18,p.pos);p.g.rotation.y=p.dir>0?Math.PI:0;}
  animPerson(p.g,dt,true);}}

// ================= 订单标记与导航线 =================
function makeMarker(color){
  const g=new THREE.Group();
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,70,16,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=35;g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(3.2,3.9,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;g.add(ring);
  g.visible=false;scene.add(g);return g;
}
const mkPick=makeMarker(0x3fe08a),mkDrop=makeMarker(0xffa03a);
const chevTex=ctex(128,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(80,230,200,.55)';g.fillRect(0,18,w,28);g.fillStyle='rgba(220,255,250,.95)';g.beginPath();g.moveTo(30,14);g.lineTo(70,32);g.lineTo(30,50);g.lineTo(44,32);g.closePath();g.fill();},true);
const routeGroup=new THREE.Group();scene.add(routeGroup);const routeTexs=[];
function drawRoute(path){
  while(routeGroup.children.length){const m=routeGroup.children.pop();m.geometry.dispose();m.material.dispose();}
  routeTexs.length=0;if(!path)return;
  for(let k=1;k<path.length;k++){
    const a=path[k-1],b=path[k],dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);if(L<1)continue;
    const rx=-dz/L,rz=dx/L; // 右侧（前进方向右手边）
    const off=k===1||k===path.length-1?0:3;
    const t=chevTex.clone();t.needsUpdate=true;t.repeat.set(L/5,1);routeTexs.push(t);
    const geo=new THREE.PlaneGeometry(L,2.2);geo.rotateX(-Math.PI/2);
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
    m.position.set((a.x+b.x)/2+rx*off,.07,(a.z+b.z)/2+rz*off);
    m.rotation.y=Math.atan2(-dz,dx);
    routeGroup.add(m);
  }
}

// ================= 面馆室内 =================
const shopScene=new THREE.Scene();shopScene.background=new THREE.Color(0x1a1512);
const shopCam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,100);shopCam.rotation.order='YXZ';shopCam.position.set(0,1.6,4.3);
{
  const wallTex=ctex(256,256,(g,w,h)=>{g.fillStyle='#e9dfc8';g.fillRect(0,0,w,h);g.fillStyle='#f4f4f1';g.fillRect(0,h*.62,w,h*.38);g.strokeStyle='#c9c9c4';g.lineWidth=2;for(let x=0;x<=w;x+=32){g.beginPath();g.moveTo(x,h*.62);g.lineTo(x,h);g.stroke();}for(let y=h*.62;y<=h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}g.fillStyle='#2f6b8a';g.fillRect(0,h*.6,w,6);},true);
  wallTex.repeat.set(3,1);
  const room=new THREE.Mesh(new THREE.BoxGeometry(8,3.3,11),new THREE.MeshLambertMaterial({map:wallTex,side:THREE.BackSide}));room.position.set(0,1.65,0);shopScene.add(room);
  const floorTex=ctex(128,128,(g)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#b9b2a5':'#8d867a';g.fillRect(x*32,y*32,32,32);}},true);floorTex.repeat.set(4,6);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(8,11),new THREE.MeshLambertMaterial({map:floorTex}));fl.rotation.x=-Math.PI/2;fl.position.y=.01;shopScene.add(fl);
  shopScene.add(new THREE.AmbientLight(0xffe8cc,.45));
  const pl=new THREE.PointLight(0xfff0d8,1.1,16);pl.position.set(0,3,0);shopScene.add(pl);
  for(const z of[-3,0,3]){const t=new THREE.Mesh(GEO.box,new THREE.MeshBasicMaterial({color:0xf8fbff}));t.scale.set(1.4,.06,.12);t.position.set(0,3.25,z);shopScene.add(t);}
  shopScene.add(bx(3.6,1.05,.8,'#8a5a3a',0,.52,-4.6));shopScene.add(bx(3.7,.06,.9,'#d8d0c2',0,1.07,-4.6));
  for(const x of[-1,.2]){const p=new THREE.Mesh(GEO.cyl,lam('#b9bcc0'));p.scale.set(.32,.45,.32);p.position.set(x,1.32,-4.7);shopScene.add(p);}
  const menu=ctex(512,200,(g,w,h)=>{g.fillStyle='#b8282e';g.fillRect(0,0,w,h);g.fillStyle='#fff3cf';g.font='bold 40px "PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.fillText('老陈面馆 · 现烧现卖',w/2,56);g.font='30px "PingFang SC","Microsoft YaHei",sans-serif';g.fillText('葱油拌面 16　大排面 26　小馄饨 14',w/2,120);g.font='22px sans-serif';g.fillText('营业 06:30–15:00　宵夜 21:30–03:00',w/2,170);});
  const mb=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.4),new THREE.MeshBasicMaterial({map:menu}));mb.position.set(0,2.35,-5.48);shopScene.add(mb);
  const fu=ctex(128,128,(g,w,h)=>{g.fillStyle='#c0262e';g.translate(64,64);g.rotate(Math.PI/4);g.fillRect(-42,-42,84,84);g.rotate(-Math.PI/4);g.fillStyle='#f2c94c';g.font='bold 60px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('福',0,4);});
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshBasicMaterial({map:fu,transparent:true}));fm.position.set(3.98,2.1,-2);fm.rotation.y=-Math.PI/2;shopScene.add(fm);
  shopScene.add(bx(.9,.55,.1,'#111',-3.6,2.7,-4.8));{const s=bx(.8,.46,.02,0,-3.6,2.7,-4.74,new THREE.MeshBasicMaterial({color:0x4a7ab8}));shopScene.add(s);}
  for(const[x,z]of[[-2.4,-1.6],[2.4,-1.6],[-2.4,1.4],[2.4,1.4]]){shopScene.add(bx(1.3,.06,.8,'#d9cdb4',x,.76,z));shopScene.add(bx(.08,.74,.08,'#555',x,.37,z));
    for(const s of[-1,1]){const st=new THREE.Mesh(GEO.cyl,lam('#c0262e'));st.scale.set(.18,.45,.18);st.position.set(x,.23,z+s*.7);shopScene.add(st);}
    shopScene.add(bx(.12,.16,.12,'#6a4a2a',x+.4,.86,z));}
  const win=new THREE.Mesh(new THREE.PlaneGeometry(5,1.8),new THREE.MeshBasicMaterial({color:0x223040}));win.position.set(0,1.6,5.48);win.rotation.y=Math.PI;shopScene.add(win);shopScene.userData.win=win;
}
const chen=makePerson({top:'#e8e6e0',bottom:'#333',apron:true,hat:true,skin:'#d6a984'});chen.position.set(-.4,0,-5.2);shopScene.add(chen);
const linShop=makePerson({top:'#5b6b7a',bottom:'#222',hair:'#120d0b',longHair:true,seated:true});linShop.position.set(2.4,.45,-2.3);linShop.rotation.y=0;shopScene.add(linShop);
{const bowl=new THREE.Mesh(GEO.sph,lam('#f2efe6'));bowl.scale.set(.14,.07,.14);bowl.position.set(2.4,.83,-1.75);shopScene.add(bowl);linShop.userData.bowl=bowl;}
const steam=[];for(let k=0;k<6;k++){const s=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.15,depthWrite:false}));s.scale.setScalar(.25);s.position.set(-1+(k%2)*1.2,1.7,-4.7);s.userData.t=k/6;shopScene.add(s);steam.push(s);}

// ================= 昼夜 =================
const C_DAY=new THREE.Color(0xa9c0d2),C_DUSK=new THREE.Color(0xd99a6c),C_NIGHT=new THREE.Color(0x0c1220),_c=new THREE.Color();
let NIGHT=0;
function envUpdate(){
  const h=(S.t%1440+S.acc)/60;
  const day=Math.sin((h-6)/12*Math.PI);
  NIGHT=clamp(1-(day+.12)/.32,0,1);
  const dusk=clamp(1-Math.abs(day)/.28,0,1)*(1-Math.max(0,day)*1.5);
  _c.copy(C_DAY).lerp(C_NIGHT,NIGHT);_c.lerp(C_DUSK,clamp(dusk*.55,0,.6));
  scene.background=_c.clone();scene.fog.color.copy(_c);
  scene.fog.near=lerp(140,60,NIGHT);scene.fog.far=lerp(950,620,NIGHT);
  const sa=(h-6)/12*Math.PI;sun.position.set(Math.cos(sa)*300,Math.max(30,Math.sin(sa)*300),120);
  sun.intensity=Math.max(0,day)*.9+(1-NIGHT)*.1;sun.color.setHSL(.09,.6,lerp(.6,.92,clamp(day*2,0,1)));
  hemi.intensity=lerp(.75,.32,NIGHT);hemi.color.setHex(NIGHT>.5?0x7a8ab8:0xdfe8f0);
  for(const m of BMATS)m.emissiveIntensity=NIGHT*.95;
  poolMat.opacity=NIGHT*.55;
  lampHeadMat.color.setHex(NIGHT>.4?0xffe2a8:0x666666);
  shopGlass.emissiveIntensity=.25+NIGHT*.8;
  towerGlow.emissiveIntensity=NIGHT*.9;
  carLightMats.head.color.setHex(NIGHT>.4?0xfff4d8:0x888888);carLightMats.tail.color.setHex(NIGHT>.4?0xff2a2a:0x661414);
  elevLight.color.setHex(NIGHT>.4?0x6fd0ff:0x707070);bridgeLights.color.setHex(NIGHT>.4?0xffd27a:0x808080);
  for(const m of SIGNMATS)m.color.setScalar(lerp(.82,1,NIGHT));
  headL.intensity=NIGHT>.35?2.2:0;cabinL.intensity=NIGHT*.35;
  shopScene.userData.win.material.color.copy(_c);
}
