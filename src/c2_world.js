
// ================= 订单标记与导航线 =================
function makeMarker(color){const g=new THREE.Group();
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,40,20,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=20;g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.6,3.0,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;g.add(ring);
  const pin=new THREE.Mesh(new THREE.ConeGeometry(.45,1,16),new THREE.MeshBasicMaterial({color}));pin.rotation.x=Math.PI;pin.position.y=3.4;g.add(pin);g.userData.pin=pin;
  g.visible=false;scene.add(g);return g;}
const mkPick=makeMarker(0x3fe08a),mkDrop=makeMarker(0xff8a2a);
const chevTex=ctex(128,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(40,200,255,.35)';g.fillRect(0,16,w,32);g.fillStyle='rgba(200,245,255,.95)';g.beginPath();g.moveTo(34,16);g.lineTo(70,32);g.lineTo(34,48);g.lineTo(46,32);g.closePath();g.fill();},true);
const routeGroup=new THREE.Group();scene.add(routeGroup);const routeTexs=[];
function drawRoute(path){
  while(routeGroup.children.length){const m=routeGroup.children.pop();m.geometry.dispose();m.material.dispose();}
  routeTexs.length=0;if(!path)return;
  for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k],dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);if(L<1)continue;
    const off=k===1||k===path.length-1?0:3.5;const t=chevTex.clone();t.needsUpdate=true;t.repeat.set(L/5,1);routeTexs.push(t);
    const geo=new THREE.PlaneGeometry(L,1.8);geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));
    m.position.set((a.x+b.x)/2+(-dz/L)*off,.06,(a.z+b.z)/2+(dx/L)*off);m.rotation.y=Math.atan2(-dz,dx);routeGroup.add(m);}
}
// ================= 面馆室内 =================
const STOOL_IN=[];const shopScene=new THREE.Scene();shopScene.background=new THREE.Color(0x1a1512);shopScene.environment=ENV.dusk;
const shopCam=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.05,100);shopCam.rotation.order='YXZ';shopCam.position.set(0,1.6,4.3);
{
  const wallC=canvasOf(512,512,(g,w,h)=>{g.fillStyle='#e6dcc4';g.fillRect(0,0,w,h);noise(g,w,h*.6,6000,.06,3);for(let k=0;k<20;k++){g.fillStyle='rgba(120,90,50,.05)';g.fillRect(rand(0,w),0,rand(4,30),h*.6);}
    for(let y=h*.6;y<h;y+=24)for(let x=(y/24%2)*12;x<w;x+=24){const v=rand(232,246);g.fillStyle=`rgb(${v},${v},${v-4})`;g.fillRect(x+1,y+1,22,22);}g.fillStyle='#2f6b8a';g.fillRect(0,h*.6-8,w,8);});
  const wallTex=texFromCanvas(wallC,true);wallTex.repeat.set(3,1);
  const room=new THREE.Mesh(new THREE.BoxGeometry(8,3.3,11),new THREE.MeshStandardMaterial({map:wallTex,side:THREE.BackSide,roughness:.7,normalMap:normalFromHeight(wallC,1)}));room.position.set(0,1.65,0);room.receiveShadow=true;shopScene.add(room);
  const flC=canvasOf(256,256,(g)=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=(x+y)%2?rand(178,190):rand(120,132);g.fillStyle=`rgb(${v},${v-6},${v-14})`;g.fillRect(x*32,y*32,32,32);}noise(g,256,256,3000,.08);});
  const floorTex=texFromCanvas(flC,true);floorTex.repeat.set(2,3);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(8,11),new THREE.MeshStandardMaterial({map:floorTex,roughness:.35,metalness:0}));fl.rotation.x=-Math.PI/2;fl.position.y=.01;fl.receiveShadow=true;shopScene.add(fl);
  applyPbr(room.material,'shopwall',4,1.3,{side:THREE.BackSide});applyPbr(fl.material,'shopfloor',4,5.5,{roughness:.6});
  shopScene.add(new THREE.HemisphereLight(0xfff0dd,0x403020,.35));
  for(const z of[-3,0,3]){const t=new THREE.Mesh(new THREE.BoxGeometry(1.4,.05,.14),new THREE.MeshBasicMaterial({color:0xfaffff,toneMapped:false}));t.position.set(0,3.27,z);shopScene.add(t);
    const l=new THREE.PointLight(0xfff4e4,.7,9,1.5);l.position.set(0,3.1,z);l.castShadow=z===0;shopScene.add(l);}
  const s=(o)=>{o.castShadow=o.receiveShadow=true;shopScene.add(o);return o;};
  s(bx(3.6,1.05,.8,0,0,.52,-4.6,std('#7a4a2e',.55,0)));s(bx(3.7,.05,.9,0,0,1.07,-4.6,std('#cfd3d4',.25,.8)));
  for(const x of[-1,.2]){const p=s(new THREE.Mesh(new THREE.CylinderGeometry(.32,.3,.5,24,1,true),std('#b9bcc0',.25,.9,{side:THREE.DoubleSide})));p.position.set(x,1.34,-4.7);}
  const menu=ctex(1024,400,(g,w,h)=>{g.fillStyle='#a8232a';g.fillRect(0,0,w,h);g.fillStyle='#fff3cf';g.font='bold 80px "PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.fillText('老陈面馆 · 现烧现卖',w/2,110);g.font='58px "PingFang SC","Microsoft YaHei",sans-serif';g.fillText('葱油拌面 16　大排面 26　小馄饨 14',w/2,240);g.font='42px sans-serif';g.fillText('营业 06:30–15:00　宵夜 21:30–03:00',w/2,340);});
  const mb=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.4),new THREE.MeshStandardMaterial({map:menu,emissive:0xffffff,emissiveMap:menu,emissiveIntensity:.25,roughness:.5}));mb.position.set(0,2.35,-5.48);shopScene.add(mb);
  const fu=ctex(128,128,(g,w,h)=>{g.fillStyle='#c0262e';g.translate(64,64);g.rotate(Math.PI/4);g.fillRect(-42,-42,84,84);g.rotate(-Math.PI/4);g.fillStyle='#f2c94c';g.font='bold 60px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('福',0,4);});
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshStandardMaterial({map:fu,transparent:true,roughness:.8}));fm.position.set(3.98,2.1,-2);fm.rotation.y=-Math.PI/2;shopScene.add(fm);
  s(bx(.9,.55,.06,0,-3.6,2.7,-5.45,std('#111',.3,.4)));shopScene.add(bx(.82,.47,.01,0,-3.6,2.7,-5.41,new THREE.MeshBasicMaterial({color:0x4a7ab8})));
  for(const[x,z]of[[-2.4,-1.6],[2.4,-1.6],[-2.4,1.4],[2.4,1.4]]){s(new THREE.Mesh(rboxG(1.3,.8,.05,.03),std('#d9cdb4',.4))).position.set(x,.77,z);shopScene.children[shopScene.children.length-1].rotation.x=Math.PI/2;
    s(bx(.06,.74,.06,0,x,.37,z,std('#555',.4,.8)));
    for(const q of[-1,1]){if(AS.gltf.chinese_stool)STOOL_IN.push({x,y:0,z:z+q*.72,ry:q>0?0:Math.PI,sx:.8,sy:.75,sz:.8});else{const st=s(new THREE.Mesh(new THREE.CylinderGeometry(.17,.15,.45,20),std('#b8232a',.35)));st.position.set(x,.23,z+q*.7);}}
    s(new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.15,12),std('#6a3a1a',.3))).position.set(x+.42,.87,z);s(new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.12,12),std('#e8e0d0',.2))).position.set(x+.32,.86,z);}
  const win=new THREE.Mesh(new THREE.PlaneGeometry(5,1.8),new THREE.MeshBasicMaterial({color:0x223040}));win.position.set(0,1.6,5.48);win.rotation.y=Math.PI;shopScene.add(win);shopScene.userData.win=win;
}
instParts(gltfParts('chinese_stool'),STOOL_IN,shopScene);
const chen=makePerson({top:'#e8e6e0',bottom:'#333',apron:true,hat:true,skin:'#d6a984',fem:false});chen.position.set(-.4,0,-5.2);chen.rotation.y=0;shopScene.add(chen);
const linShop=makePerson({top:'#1a1a1d',bottom:'#2a2a30',hair:'#120d0b',longHair:true,seated:true,fem:true,skin:'#ecc7a4'});linShop.position.set(2.4,.12,-2.3);shopScene.add(linShop);
{const bowl=new THREE.Mesh(new THREE.SphereGeometry(.13,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2),std('#f2efe6',.2,0,{side:THREE.DoubleSide}));bowl.position.set(2.4,.95,-1.75);shopScene.add(bowl);linShop.userData.bowl=bowl;}
const steam=[];for(let k=0;k<6;k++){const s=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.15,depthWrite:false}));s.scale.setScalar(.25);s.position.set(-1+(k%2)*1.2,1.7,-4.7);s.userData.t=k/6;shopScene.add(s);steam.push(s);}
shopScene.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;}});

// ================= 昼夜 =================
let NIGHT=0,DUSK=0;
const C={dayTop:new THREE.Color(0x3f7ac0),dayHor:new THREE.Color(0xcfdff0),duskTop:new THREE.Color(0x2a3a6a),duskHor:new THREE.Color(0xf09a68),nTop:new THREE.Color(0x03060e),nHor:new THREE.Color(0x141c2e)};
const _c1=new THREE.Color(),_c2=new THREE.Color();
function envUpdate(){
  const h=(S.t%1440+S.acc)/60,day=Math.sin((h-6)/12*Math.PI);
  NIGHT=clamp(1-(day+.1)/.3,0,1);DUSK=clamp(1-Math.abs(day-.04)/.22,0,1);
  _c1.copy(C.dayTop).lerp(C.duskTop,DUSK).lerp(C.nTop,NIGHT);_c2.copy(C.dayHor).lerp(C.duskHor,DUSK*.9).lerp(C.nHor,NIGHT);
  skyU.top.value.copy(_c1);skyU.hor.value.copy(_c2);skyU.bot.value.copy(_c2).multiplyScalar(.6);skyU.night.value=NIGHT;skyU.time.value=performance.now()/1000;
  const sa=(h-6)/12*Math.PI,sd=new THREE.Vector3(Math.cos(sa),Math.max(.06,Math.sin(sa)),.35).normalize();skyU.sunDir.value.copy(sd);
  skyU.sunCol.value.setHSL(.08,.8,lerp(.55,.8,clamp(day*3,0,1)));
  sky.position.set(car.x,0,car.z);
  scene.fog.color.copy(_c2).multiplyScalar(lerp(1,.6,NIGHT));scene.fog.near=lerp(90,40,NIGHT);scene.fog.far=lerp(800,520,NIGHT);
  const cx=S.loc==='car'?car.x:0,cz=S.loc==='car'?car.z:0;
  sun.position.set(cx+sd.x*220,sd.y*220,cz+sd.z*220);sun.target.position.set(cx,0,cz);
  sun.intensity=Math.max(0,day)*(USE_HDR?3.1:2.4)*(1-NIGHT);sun.color.setHSL(.09,.7,lerp(.62,.95,clamp(day*2,0,1)));sun.castShadow=day>.02;
  hemi.intensity=USE_HDR?lerp(.12,.06,NIGHT):lerp(.55,.12,NIGHT);hemi.color.copy(_c2).lerp(new THREE.Color(0x8aa0c8),.4);
  const ek=NIGHT>.6?'night':DUSK>.5||NIGHT>.25?'dusk':'day';scene.environment=ek==='night'?ENV0.night:ENV[ek];
  if(USE_HDR&&BG[ek]){const wN=NIGHT,wK=clamp(DUSK*1.4,0,1)*(1-NIGHT),wD=Math.max(0,1-wN-wK);
    if(!window.SKYB){const m=new THREE.ShaderMaterial({uniforms:{tD:{value:BG.day},tK:{value:BG.dusk||BG.day},tN:{value:BG.night||BG.day},w:{value:new THREE.Vector3(1,0,0)},ex:{value:1}},side:THREE.BackSide,depthWrite:false,fog:false,
      vertexShader:'varying vec3 vW;void main(){vec4 p=modelMatrix*vec4(position,1.);vW=p.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*p;gl_Position.z=gl_Position.w*.99999;}',
      fragmentShader:'uniform sampler2D tD,tK,tN;uniform vec3 w;uniform float ex;varying vec3 vW;vec2 eq(vec3 d){return vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,-1.,1.))*.31830989+.5);}void main(){vec3 d=normalize(vW);vec2 uv=eq(d);vec3 c=texture2D(tD,uv).rgb*w.x+texture2D(tK,uv).rgb*w.y+texture2D(tN,uv).rgb*w.z;gl_FragColor=vec4(c*ex,1.);}'});
      window.SKYB=new THREE.Mesh(new THREE.SphereGeometry(1400,48,24),m);SKYB.frustumCulled=false;SKYB.renderOrder=-10;scene.add(SKYB);scene.background=null;}
    SKYB.position.copy(camera.getWorldPosition(new THREE.Vector3()));SKYB.material.uniforms.w.value.set(wD,wK,wN*1.15);SKYB.material.uniforms.ex.value=lerp(1,.9,NIGHT);
    const fo=new THREE.Color(0,0,0);fo.add(HDRI.day.fog.clone().multiplyScalar(wD));if(HDRI.dusk)fo.add(HDRI.dusk.fog.clone().multiplyScalar(wK*.8));if(HDRI.night)fo.add(HDRI.night.fog.clone().multiplyScalar(wN*.18));scene.fog.color.copy(fo);const hi=HDRI[ek];
    if(ek!=='night'&&hi.sun.y>.04){sun.position.set(cx+hi.sun.x*220,hi.sun.y*220,cz+hi.sun.z*220);}scene.environmentIntensity=1;}
  for(const m of BMATS)m.emissiveIntensity=NIGHT*(m.userData.kind==='glass'?.28:.75);
  lampHeadMat.emissiveIntensity=NIGHT*2.5;poolMat.opacity=NIGHT*.5;glowMat.opacity=NIGHT*.5;
  for(const m of SIGNMATS)m.emissiveIntensity=lerp(.12,m.userData.neon?3.2:1.4,NIGHT);
  for(const m of INT_MATS)m.emissiveIntensity=lerp(.25,1.5,NIGHT);
  towerGlow.emissiveIntensity=NIGHT*2.5;if(typeof carModelLights==='function')carModelLights();
  carLightMats.head.emissiveIntensity=NIGHT>.4?5:0;carLightMats.tail.emissiveIntensity=NIGHT>.4?3:.15;
  elevLight.color.setHex(NIGHT>.4?0x6fd0ff:0x606060);bridgeLights.color.setHex(NIGHT>.4?0xffd27a:0x707070);
  roadMat.roughness=lerp(1,.62,NIGHT);roadMat.envMapIntensity=lerp(.6,1.4,NIGHT);
  headL.intensity=NIGHT>.35?3.2:0;cabinL.intensity=NIGHT*.25;cabFill.intensity=lerp(.25,.05,NIGHT);screenL.intensity=lerp(.05,.35,NIGHT);
  lampLightsUpdate(cx,cz,NIGHT>.3?NIGHT:0);sigUpdate();
  shopScene.userData.win.material.color.copy(_c2);
}
