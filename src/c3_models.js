
// ================= 写实车辆：交通车 LOD + 驾驶舱模型 =================
const PROC_COCKPIT=carG.children.filter(o=>o!==head&&o!==mirrorCam&&o!==sideCam&&o!==mountG&&!o.isLight&&o!==hlT&&o.name!=='rearMirror'&&o.name!=='shadowProxy');
let CAR_POOL=[],COCKPIT={mode:'proc',model:null,pivot:null,cfg:null};
const _glassT=new THREE.MeshPhysicalMaterial({color:0x0b1014,roughness:.03,metalness:0,transparent:true,opacity:.6,envMapIntensity:1.6,side:THREE.DoubleSide,depthWrite:false});
const isGlass=(m,o)=>/glass|window|szyb/i.test(m.name||'')||/window|glass/i.test(o.name||'')&&!/frame|gasket/i.test(o.name||'');
const isPaint=m=>/paint|primary|body_?col/i.test(m.name||'');
// 把模型统一成：车头朝 -z、车轮落地、居中
function normalizeCar(root,skip){
  root.updateMatrixWorld(true);let fz=0,fx=0,n=0;
  root.traverse(o=>{if(o.isMesh&&/front.?light|headlight|frontlights/i.test(o.name+(o.material.name||''))){const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new THREE.Vector3());fz+=c.z;fx+=c.x;n++;}});
  const w=new THREE.Group();w.add(root);
  if(n){if(Math.abs(fx)>Math.abs(fz))root.rotation.y=fx>0?Math.PI/2:-Math.PI/2;else root.rotation.y=fz>0?Math.PI:0;}
  w.updateMatrixWorld(true);const bb=new THREE.Box3(),wb=new THREE.Box3(),tb=new THREE.Box3();root.traverse(o=>{if(o.isMesh&&!(skip&&skip(o))){tb.setFromObject(o,true);if(/wheel|tyre|tire|rim/i.test(o.name+(o.parent&&o.parent.name||'')))wb.union(tb);if(!INTERIOR(o))bb.union(tb);}});
  const c=bb.getCenter(new THREE.Vector3());root.position.set(-c.x,-(wb.isEmpty()?bb.min.y:wb.min.y),-c.z);w.updateMatrixWorld(true);
  return{w,size:bb.getSize(new THREE.Vector3())};
}
const JUNK=o=>/^Cube|plane|shadow|ground/i.test(o.name||'')||/^Cube/.test(o.parent&&o.parent.name||'');
const INTERIOR=o=>{let p=o;while(p){if(/interior|furniture|dashboard|steering|seat|enginebay|engine|belt|carpet/i.test(p.name||''))return true;p=p.parent;}return false;};
function carTemplate(key){
  const g=AS.gltf[key];if(!g)return null;const root=g.scene.clone(true);
  root.traverse(o=>{if(o.isMesh&&(JUNK(o)||INTERIOR(o)))o.visible=false;});
  const N=normalizeCar(root,o=>!o.visible);N.w.updateMatrixWorld(true);
  const by=new Map();N.w.traverse(o=>{if(!o.isMesh||!o.visible)return;const geo=deinter(o.geometry.clone());geo.applyMatrix4(o.matrixWorld);if(!geo.attributes.normal)geo.computeVertexNormals();
    const m=o.material;const k=isGlass(m,o)?'glass':m.uuid;if(!by.has(k))by.set(k,{mat:k==='glass'?_glassT:m,geos:[],paint:isPaint(m)});by.get(k).geos.push(geo);});
  return{parts:[...by.values()].map(({mat,geos,paint})=>{let mm=mat;if(!paint&&mat!==_glassT){mm=mat.clone();if(mm.transmission)mm.transmission=0;}return{geo:mergeGeos(geos),mat:mm,paint};}),size:N.size};
}
const TPLS=['corolla','superb'].map(carTemplate).filter(Boolean);
if(!TPLS.length&&AS.gltf.car)TPLS.push(carTemplate('car'));
const PAINTS=['#e9e9e6','#e9e9e6','#e9e9e6','#15161a','#8a8f96','#c9ccd0','#1f3a63','#5a1a1a','#3fb8b0','#d9c9a0'];const _pm={};
function paintOf(base,c){const k=base.uuid+c;if(_pm[k])return _pm[k];const m=base.clone();m.color.set(c);if('clearcoat'in m){m.clearcoat=1;m.clearcoatRoughness=.08;}m.roughness=Math.min(m.roughness,.35);return _pm[k]=m;}
if(TPLS.length){for(let k=0;k<16;k++){const T=TPLS[k%4===3&&TPLS.length>1?1:0];const g=new THREE.Group();const col=pick(PAINTS);
  for(const t of T.parts){const m=new THREE.Mesh(t.geo,t.paint?paintOf(t.mat,col):t.mat);m.castShadow=true;m.receiveShadow=true;g.add(m);}
  const L=T.size.z,W=T.size.x;g.add(blobShadow(L,Math.min(W,2)));for(const s of[-1,1]){const h=new THREE.Mesh(rboxG(.32,.1,.05,.03),carLightMats.head);h.position.set(s*(W/2-.32),.72,-L/2+.04);g.add(h);const t=new THREE.Mesh(rboxG(.3,.1,.05,.03),carLightMats.tail);t.position.set(s*(W/2-.3),.9,L/2-.04);g.add(t);}
  g.visible=false;scene.add(g);CAR_POOL.push({g,owner:null});}}
// ---- 驾驶舱：优先卡罗拉（带完整内饰），其次概念车 ----
function buildCockpit(){
  const key=AS.gltf.corolla?'corolla':AS.gltf.car?'car':null;if(!key)return;
  const root=AS.gltf[key].scene.clone(true);
  root.traverse(o=>{if(!o.isMesh)return;if(JUNK(o)){o.visible=false;return;}const m=o.material;
    if(isGlass(m,o))o.material=new THREE.MeshPhysicalMaterial({color:0xa8b8c0,roughness:0,metalness:0,transparent:true,opacity:.06,envMapIntensity:.8,side:THREE.DoubleSide,depthWrite:false});
    else if(key==='car'){const X=AS.gltf.car.extraMats||{},n=m.name||'';if(n==='Paint 1 Carmine')o.material=X['Paint 1 Pearl']||m;else if(n==='Interior 3 Carmine'){o.material=m.clone();o.material.color.setRGB(.035,.035,.04);}}
    else if(isPaint(m)&&!INTERIOR(o)){o.material=paintOf(m,'#ecebe6');}
    if(o.material.transmission)o.material.transmission=0;o.castShadow=true;o.receiveShadow=true;});
  const N=normalizeCar(root,o=>!o.visible);const mc=N.w;carG.add(mc);mc.visible=false;carG.updateMatrixWorld(true);
  let sw=null;root.traverse(o=>{if(!sw&&/steering_?wheel|SteeringWheel01/i.test(o.name))sw=o;});
  if(sw){const bb=new THREE.Box3().setFromObject(sw,true),c=bb.getCenter(new THREE.Vector3());mc.worldToLocal(c);
    const pv=new THREE.Group();pv.position.copy(c);pv.rotation.x=key==='corolla'?-.4:0;mc.add(pv);mc.updateMatrixWorld(true);
    const list=[];root.traverse(o=>{if(o.isMesh&&(key==='corolla'?/steering_wheel/i.test(o.name+'|'+(o.parent&&o.parent.name||'')):/^InteriorSteering(Wheel|Emblem|Handle)/.test(o.name)))list.push(o);});
    const spin=new THREE.Group();pv.add(spin);mc.updateMatrixWorld(true);for(const o of list)spin.attach(o);COCKPIT.pivot=spin;}
  COCKPIT.model=mc;COCKPIT.key=key;
  COCKPIT.cfg=key==='corolla'?{eye:[-.36,1.11,.14],mount:[-.02,.98,-.6],mrot:[-.32,-.38,0],rear:[.38,.08,.8]}:{eye:[0,1.13,-.2],mount:[.26,1.0,-.84],mrot:[-.3,-.42,0],rear:[.56,.2,.05]};
}
buildCockpit();
function setCockpit(mode){
  if(mode==='model'&&!COCKPIT.model)mode='proc';COCKPIT.mode=mode;const M=mode==='model';
  for(const o of PROC_COCKPIT)o.visible=!M;if(COCKPIT.model)COCKPIT.model.visible=M;
  const rm=carG.getObjectByName('rearMirror');const C=COCKPIT.cfg;
  if(M){EYE.set(...C.eye);mountG.position.set(...C.mount);mountG.rotation.set(...C.mrot);rearSeatSpot.set(...C.rear);if(rm)rm.visible=false;mirrorCam.position.set(C.eye[0]+.35,1.2,-.3);sideCam.position.set(-1.05,1.05,-.55);}
  else{EYE.set(-.37,1.19,.36);mountG.position.set(-.1,.99,-.34);mountG.rotation.set(-.15,-.32,0);rearSeatSpot.set(.36,.56,1.2);if(rm)rm.visible=true;mirrorCam.position.set(-.02,1.3,.2);sideCam.position.set(-1.02,1.05,-.6);}
  head.position.copy(EYE);
}
let lodT=0;
function carLOD(dt){if(!CAR_POOL.length)return;lodT+=dt;if(lodT<.3)return;lodT=0;
  const near=AI.filter(a=>!a.bus).map(a=>({a,d:(a.g.position.x-car.x)**2+(a.g.position.z-car.z)**2})).filter(o=>o.d<260*260).sort((p,q)=>p.d-q.d).slice(0,CAR_POOL.length).map(o=>o.a);
  for(const p of CAR_POOL)if(p.owner&&!near.includes(p.owner)){p.owner.g.visible=true;p.owner.m=null;p.owner=null;p.g.visible=false;}
  for(const a of near){if(a.m)continue;const p=CAR_POOL.find(q=>!q.owner);if(!p)break;p.owner=a;a.m=p.g;p.g.visible=true;a.g.visible=false;p.g.position.copy(a.g.position);p.g.rotation.y=a.g.rotation.y;}
}
function carModelLights(){}
setCockpit(COCKPIT.model?'model':'proc');
if(!COCKPIT.model)setTimeout(()=>toast('卡罗拉车内模型没有加载成功，暂时用简易驾驶舱。请按 F12 把控制台报错发给开发者','warn'),4000);
// ---- 路边停放的车：近处完整模型（按距离排序）、远处简化模型 ----
const PK={hi:[],lo:[],blob:null,t:9,last:{x:1e9,z:1e9}};
if(TPLS.length&&typeof PARKED!=='undefined'&&PARKED.length){
  const T=TPLS[0],CAP_HI=28,CAP_LO=900;const pw=paintOf(T.parts.find(t=>t.paint).mat,'#ffffff');
  for(const t of T.parts){const m=new THREE.InstancedMesh(t.geo,t.paint?pw:t.mat,CAP_HI);m.count=0;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);PK.hi.push({m,paint:t.paint});}
  // 简化模型：程序化车身合并（按材质）
  const proto=makeCar('#ffffff','sedan');proto.updateMatrixWorld(true);const by=new Map();proto.traverse(o=>{if(!o.isMesh||o.material===blobM)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const k=o.material.uuid;if(!by.has(k))by.set(k,{mat:o.material,geos:[]});by.get(k).geos.push(deinter(g));});
  for(const{mat,geos}of by.values()){const isP=mat.isMeshPhysicalMaterial;const m=new THREE.InstancedMesh(mergeGeos(geos),isP?std('#ffffff',.35,.4):mat,CAP_LO);m.count=0;m.castShadow=false;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);PK.lo.push({m,paint:isP});}
  const bg=new THREE.PlaneGeometry(2.3,5.2);bg.rotateX(-Math.PI/2);bg.translate(0,.02,0);PK.blob=new THREE.InstancedMesh(bg,blobM,CAP_HI+CAP_LO);PK.blob.count=0;PK.blob.frustumCulled=false;scene.add(PK.blob);
  PK.grid=new Map();for(const p of PARKED){const k=Math.floor(p.x/60)*100003+Math.floor(p.z/60);if(!PK.grid.has(k))PK.grid.set(k,[]);PK.grid.get(k).push(p);}
}
const _pm4=new THREE.Matrix4(),_pq=new THREE.Quaternion(),_pv4=new THREE.Vector3(),_ps=new THREE.Vector3(1,1,1),_py=new THREE.Vector3(0,1,0),_pcol=new THREE.Color();
function parkedLOD(dt,px,pz){if(!PK.blob)return;PK.t+=dt;if(PK.t<.4&&Math.hypot(px-PK.last.x,pz-PK.last.z)<4)return;PK.t=0;PK.last={x:px,z:pz};
  const R=LODR.car*2.2,r=Math.ceil(R/60),cx=Math.floor(px/60),cz=Math.floor(pz/60);const L=[];
  for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){const A=PK.grid.get((cx+i)*100003+cz+j);if(A)for(const p of A){const d=(p.x-px)**2+(p.z-pz)**2;if(d<R*R)L.push([d,p]);}}
  L.sort((a,b)=>a[0]-b[0]);let nh=0,nl=0,nb=0;const HI=PK.hi[0].m.instanceMatrix.count,LO=PK.lo[0].m.instanceMatrix.count;
  for(const[d,p]of L){_pm4.compose(_pv4.set(p.x,0,p.z),_pq.setFromAxisAngle(_py,p.h),_ps);_pcol.set(p.col);
    if(nh<HI&&d<70*70){for(const q of PK.hi){q.m.setMatrixAt(nh,_pm4);if(q.paint)q.m.setColorAt(nh,_pcol);}nh++;}else if(nl<LO){for(const q of PK.lo){q.m.setMatrixAt(nl,_pm4);if(q.paint)q.m.setColorAt(nl,_pcol);}nl++;}else continue;
    if(nb<PK.blob.instanceMatrix.count)PK.blob.setMatrixAt(nb++,_pm4);}
  for(const q of PK.hi){q.m.count=nh;q.m.instanceMatrix.needsUpdate=true;if(q.m.instanceColor)q.m.instanceColor.needsUpdate=true;}for(const q of PK.lo){q.m.count=nl;q.m.instanceMatrix.needsUpdate=true;if(q.m.instanceColor)q.m.instanceColor.needsUpdate=true;}PK.blob.count=nb;PK.blob.instanceMatrix.needsUpdate=true;}
// ---- 城市静态网格：上传到显卡后释放 CPU 端数组，降低内存占用 ----
{function drop(){this.array=null;}let n=0;for(const g of CHUNKS.values())g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const ge=o.geometry;if(!ge.boundingSphere)ge.computeBoundingSphere();for(const k in ge.attributes)ge.attributes[k].onUpload(drop);if(ge.index)ge.index.onUpload(drop);n++;}});console.log('静态网格',n);}
