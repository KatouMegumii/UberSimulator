
// ================= 人物模型 =================
const CLOTH=['#3d5a80','#98473e','#e6e3dc','#3f6b3f','#26272b','#c9a227','#7a4f8a','#506070','#a8a29a','#1f3550','#8a6a4a'];
const PANTS=['#2a2f3a','#33343a','#4a4036','#1e2a44','#5a5650','#22242a'];
const SKIN=['#e8c4a0','#dcb08a','#c99a74','#f0d0b0'];
function cap(r,len,c,rough=.85){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,10),std(c,rough));m.castShadow=true;return m;}
function makePerson(o={}){
  const g=new THREE.Group(),skin=o.skin||pick(SKIN),top=o.top||pick(CLOTH),bot=o.bottom||pick(PANTS),hair=o.hair||pick(['#14100d','#1c1612','#2a1f18','#3a2e24']);
  const fem=o.fem??Math.random()<.5,sc=fem?.94:1;
  const body=new THREE.Group();g.add(body);
  // 躯干：车削轮廓
  const prof=fem?[[0,0],[.15,0],[.17,.08],[.14,.25],[.16,.42],[.19,.52],[.13,.6],[.06,.64],[0,.64]]:[[0,0],[.16,0],[.17,.1],[.16,.28],[.2,.46],[.22,.54],[.14,.62],[.06,.65],[0,.65]];
  const tg=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),18);tg.scale(1,1,.68);
  const torso=new THREE.Mesh(tg,std(top,.9));torso.position.y=.92;torso.castShadow=true;body.add(torso);
  const hip=new THREE.Mesh(new THREE.SphereGeometry(.17,14,10),std(bot,.9));hip.scale.set(1,.6,.72);hip.position.y=.93;body.add(hip);
  const neck=cap(.05,.06,skin);neck.position.y=1.6;body.add(neck);
  const head=new THREE.Group();head.position.y=1.72;body.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.105,20,16),std(skin,.6));skull.scale.set(.92,1.12,1);skull.castShadow=true;head.add(skull);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),std(skin,.6));nose.position.set(0,-.01,-.1);nose.scale.set(1,1.4,1);head.add(nose);
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.011,8,6),std('#1a1410',.3));e.position.set(s*.035,.02,-.094);head.add(e);const ear=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),std(skin,.6));ear.scale.set(.5,1,.8);ear.position.set(s*.098,0,0);head.add(ear);}
  const hm=std(hair,.7);const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.112,20,14,0,Math.PI*2,0,Math.PI*.55),hm);hairCap.position.set(0,.012,.008);hairCap.scale.set(.95,1.12,1.04);head.add(hairCap);
  if(o.longHair||fem&&Math.random()<.7){const back=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.18,4,10),hm);back.scale.set(1.05,1,.6);back.position.set(0,-.12,.05);head.add(back);}
  if(o.hat){const h=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.16,16),std('#f4f4f4',.9));h.position.y=.14;head.add(h);}
  if(o.apron){const a=new THREE.Mesh(new THREE.PlaneGeometry(.34,.55),std('#f2f2ee',.95,0,{side:THREE.DoubleSide}));a.position.set(0,1.05,-.13);body.add(a);}
  const legs=[],arms=[];
  for(const s of[-1,1]){
    const hp=new THREE.Group();hp.position.set(s*.09*sc,.93,0);body.add(hp);
    const th=cap(.072,.36,bot,.9);th.position.y=-.22;hp.add(th);
    const kn=new THREE.Group();kn.position.y=-.45;hp.add(kn);const sh=cap(.058,.36,bot,.9);sh.position.y=-.21;kn.add(sh);
    const shoe=new THREE.Mesh(rboxG(.1,.08,.24,.035),std(pick(['#1a1a1a','#e8e8e8','#5a4030']),.6));shoe.position.set(0,-.43,-.04);kn.add(shoe);
    legs.push(hp);hp.userData.knee=kn;
    const sp=new THREE.Group();sp.position.set(s*.2*sc,1.43,0);body.add(sp);
    const ua=cap(.05,.24,top,.9);ua.position.y=-.15;sp.add(ua);
    const el=new THREE.Group();el.position.y=-.3;sp.add(el);const fa=cap(.042,.22,o.sleeve==='short'?skin:top,.9);fa.position.y=-.13;el.add(fa);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),std(skin,.6));hand.scale.set(.8,1.1,.6);hand.position.y=-.29;el.add(hand);
    arms.push(sp);sp.userData.elbow=el;sp.rotation.z=s*.06;
  }
  if(o.seated){legs.forEach(l=>{l.rotation.x=-1.45;l.userData.knee.rotation.x=1.5;});body.position.y=-.47;arms.forEach(a=>{a.rotation.x=-.5;a.userData.elbow.rotation.x=-.6;});}
  g.scale.setScalar(sc*(o.h||rand(.95,1.05)));
  g.userData={legs,arms,head,phase:Math.random()*6,seated:!!o.seated};
  return g;
}
function animPerson(g,dt,moving){const u=g.userData;if(u.mixer){u.mixer.update(moving?dt:0);return;}if(u.seated||!u.legs)return;if(moving)u.phase+=dt*6.5;const s=moving?Math.sin(u.phase):0;
  u.legs[0].rotation.x=s*.5;u.legs[1].rotation.x=-s*.5;u.legs[0].userData.knee.rotation.x=Math.max(0,-s)*.7;u.legs[1].userData.knee.rotation.x=Math.max(0,s)*.7;
  u.arms[0].rotation.x=-s*.4;u.arms[1].rotation.x=s*.4;u.arms[0].userData.elbow.rotation.x=-.25;u.arms[1].userData.elbow.rotation.x=-.25;}

// ================= 车辆模型 =================
const carLightMats={head:new THREE.MeshStandardMaterial({color:0xdddddd,emissive:0xfff4d8,emissiveIntensity:0,roughness:.1,metalness:.5}),tail:new THREE.MeshStandardMaterial({color:0x661010,emissive:0xff2010,emissiveIntensity:.15,roughness:.2})};
const tireMat=std('#141414',.85,0),rimMat=std('#b8bcc0',.3,.9),glassMat=new THREE.MeshStandardMaterial({color:0x10151a,roughness:.05,metalness:.9,envMapIntensity:1.4}),trimMat=std('#111214',.5,.2),chromeMat=std('#d0d4d8',.15,1);
const _paint={};function paintMat(c){return _paint[c]||(_paint[c]=new THREE.MeshPhysicalMaterial({color:c,roughness:.32,metalness:.55,clearcoat:1,clearcoatRoughness:.08}));}
const CAR_BODY=[[-2.32,.32],[-2.38,.55],[-2.3,.74],[-2.0,.86],[-1.0,.97],[-.85,1.0],[1.55,1.02],[2.18,.98],[2.34,.78],[2.36,.52],[2.28,.32]];
const CAR_CAB=[[-.86,.99],[-.15,1.44],[.95,1.46],[1.58,1.01]];
const _carGeo={};
function carGeos(kind){if(_carGeo[kind])return _carGeo[kind];
  const s=kind==='suv'?1.12:1;const bp=CAR_BODY.map(([z,y])=>[z,y*s]),cp=CAR_CAB.map(([z,y])=>[z,y*s+(kind==='suv'?.08:0)]);
  const body=profileX(bp,1.72,null,.06),cab=profileX(cp,1.44,null,.04);
  const tire=new THREE.CylinderGeometry(.33,.33,.22,22);tire.rotateZ(Math.PI/2);const rim=new THREE.CylinderGeometry(.22,.22,.24,14);rim.rotateZ(Math.PI/2);
  return _carGeo[kind]={body,cab,tire,rim};}
function makeCar(color,kind='sedan'){
  const g=new THREE.Group(),G=carGeos(kind);
  const taxi=kind==='taxi';const pm=paintMat(taxi?pick(['#3fb8b0','#e8c43a']):color);
  const b=new THREE.Mesh(G.body,pm);b.castShadow=true;b.receiveShadow=true;g.add(b);
  const c=new THREE.Mesh(G.cab,glassMat);c.castShadow=true;g.add(c);
  const roof=new THREE.Mesh(rboxG(1.3,1.0,.04,.2),pm);roof.position.set(0,(kind==='suv'?1.6:1.46)+.005,.42);roof.rotation.x=Math.PI/2;g.add(roof);
  for(const[x,z]of[[-.82,-1.42],[.82,-1.42],[-.82,1.42],[.82,1.42]]){const t=new THREE.Mesh(G.tire,tireMat);t.position.set(x,.33,z);t.castShadow=true;g.add(t);const r=new THREE.Mesh(G.rim,rimMat);r.position.set(x,.33,z);g.add(r);}
  g.add(bx(1.74,.16,.12,0,0,.42,-2.36,trimMat));g.add(bx(1.74,.16,.12,0,0,.42,2.36,trimMat));
  for(const s of[-1,1]){const h=new THREE.Mesh(rboxG(.42,.13,.06,.03),carLightMats.head);h.position.set(s*.6,.76,-2.33);g.add(h);const t=new THREE.Mesh(rboxG(.42,.12,.06,.03),carLightMats.tail);t.position.set(s*.6,.82,2.35);g.add(t);
    const m=new THREE.Mesh(rboxG(.06,.1,.18,.03),pm);m.position.set(s*.93,1.05,-.72);g.add(m);}
  g.add(bx(1.0,.18,.05,0,0,.55,-2.39,chromeMat));
  g.add(blobShadow());
  if(taxi){const sign=new THREE.Mesh(rboxG(.6,.2,.25,.04),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2b0,emissiveIntensity:.2}));sign.position.set(0,1.58,.4);g.add(sign);g.userData.taxiSign=sign.material;}
  return g;
}
