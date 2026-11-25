
// ================= 实例化道具：梧桐 / 路灯 / 空调 / 单车 / 信号灯 =================
const _M=new THREE.Matrix4(),_Q=new THREE.Quaternion(),_V=new THREE.Vector3(),_S=new THREE.Vector3(),_Y=new THREE.Vector3(0,1,0),_C=new THREE.Color();
// --- 梧桐 ---
function treeGeos(seed){
  const bark=[],leaf=[];
  const trunk=new THREE.CylinderGeometry(.2,.3,3.6,7,2);trunk.translate(0,1.8,0);bark.push(trunk);
  const tips=[];
  for(let b=0;b<4;b++){const a=b/4*Math.PI*2+seed,tilt=rand(.45,.75),len=rand(2.6,3.6);
    const g=new THREE.CylinderGeometry(.08,.16,len,5);g.translate(0,len/2,0);g.rotateZ(tilt);g.rotateY(a);g.translate(0,3.4,0);bark.push(g);
    const tip=new THREE.Vector3(-Math.sin(tilt)*len,3.4+Math.cos(tilt)*len,0).applyAxisAngle(_Y,a);tips.push(tip);
    const g2=new THREE.CylinderGeometry(.04,.08,1.8,4);g2.translate(0,.9,0);g2.rotateZ(tilt*.5);g2.rotateY(a+.6);g2.translate(tip.x*.7,tip.y*.95,tip.z*.7);bark.push(g2);}
  for(const tip of tips)for(let k=0;k<9;k++){
    const s=rand(1.6,2.6),g=new THREE.PlaneGeometry(s,s);g.rotateX(rand(0,Math.PI));g.rotateY(rand(0,Math.PI*2));g.rotateZ(rand(-.6,.6));
    g.translate(tip.x+rand(-1.6,1.6),tip.y+rand(-1,1.4),tip.z+rand(-1.6,1.6));leaf.push(g);}
  for(let k=0;k<7;k++){const s=rand(2,3),g=new THREE.PlaneGeometry(s,s);g.rotateX(rand(0,3));g.rotateY(rand(0,6));g.translate(rand(-1.5,1.5),rand(6,7.6),rand(-1.5,1.5));leaf.push(g);}
  return{bark:mergeGeos(bark),leaf:mergeGeos(leaf)};
}
if(TREES.length>60000)TREES.length=60000;
const TREE_V=[treeGeos(0),treeGeos(1.3)];const HI_TREES=!!AS.gltf.trees4k;
if(!HI_TREES){const V=TREE_V;
  for(let v=0;v<2;v++){const list=TREES.filter((t,k)=>k%2===v);
    const tm=new THREE.InstancedMesh(V[v].bark,barkMat,list.length),lm=new THREE.InstancedMesh(V[v].leaf,leafMat,list.length);
    list.forEach((t,k)=>{_M.compose(_V.set(t.x,t.y||0,t.z),_Q.setFromAxisAngle(_Y,t.r),_S.set(t.s,t.s*rand(.9,1.1),t.s));tm.setMatrixAt(k,_M);lm.setMatrixAt(k,_M);_C.setHSL(rand(.2,.27),rand(.3,.5),rand(.42,.6));lm.setColorAt(k,_C);});
    {const ag=new THREE.PlaneGeometry(7,7);ag.rotateX(-Math.PI/2);ag.translate(0,.03,0);const am=new THREE.InstancedMesh(ag,treeAoM,list.length);list.forEach((t,k)=>{_M.compose(_V.set(t.x,(t.y||0),t.z),_Q.identity(),_S.set(t.s,1,t.s));am.setMatrixAt(k,_M);});am.castShadow=false;am.receiveShadow=false;city.add(am);}
    tm.castShadow=lm.castShadow=true;tm.receiveShadow=lm.receiveShadow=true;lm.customDepthMaterial=leafDepth;city.add(tm,lm);}
}
// --- 路灯 ---
const lampHeadMat=new THREE.MeshStandardMaterial({color:0x777777,emissive:0xffd9a0,emissiveIntensity:0,roughness:.3});
{const pole=new THREE.CylinderGeometry(.08,.13,8,10);pole.translate(0,4,0);
  const arm=new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,7.6,0),new THREE.Vector3(0,8.6,0),new THREE.Vector3(1.8,8.4,0)),10,.05,6);
  const poleG=mergeGeos([pole,arm]);const head=rboxG(.9,.16,.4,.06);head.translate(1.9,8.3,0);
  const pm=new THREE.InstancedMesh(poleG,std('#3a3d41',.45,.7),LAMPS.length),hm=new THREE.InstancedMesh(head,lampHeadMat,LAMPS.length);
  const pg=new THREE.PlaneGeometry(14,14);pg.rotateX(-Math.PI/2);const gm=new THREE.InstancedMesh(pg,poolMat,LAMPS.length);
  LAMPS.forEach((l,k)=>{const ry=Math.atan2(-l.nz,l.nx);
    _M.compose(_V.set(l.x,l.y||0,l.z),_Q.setFromAxisAngle(_Y,ry),_S.set(1,1,1));pm.setMatrixAt(k,_M);hm.setMatrixAt(k,_M);
    const hp=new THREE.Vector3(1.9,8.3,0).applyAxisAngle(_Y,ry).add(new THREE.Vector3(l.x,0,l.z));l.hx=hp.x;l.hz=hp.z;
    _M.makeTranslation(hp.x,.03,hp.z);gm.setMatrixAt(k,_M);GLOWS.push({x:hp.x,y:8.15,z:hp.z,c:0xffcf90,s:2.6,lamp:1});});
  pm.castShadow=true;city.add(pm,hm,gm);
}
// --- 空调外机 ---
if(ACS.length>40000){for(let i=ACS.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ACS[i],ACS[j]]=[ACS[j],ACS[i]];}ACS.length=40000;}
{const g=new THREE.BoxGeometry(.85,.6,.32);const m=new THREE.InstancedMesh(g,acMat,ACS.length);
  ACS.forEach((a,k)=>{_M.compose(_V.set(a.x,a.y,a.z),_Q.setFromAxisAngle(_Y,a.ry),_S.set(1,1,1));m.setMatrixAt(k,_M);});m.castShadow=true;m.receiveShadow=true;city.add(m);}
// --- 共享单车 ---
{const parts=[];for(const z of[-.52,.52]){const w=new THREE.TorusGeometry(.32,.035,6,18);w.translate(0,.35,z);w.rotateY(Math.PI/2);parts.push(w);}
  const f1=new THREE.BoxGeometry(.05,.05,1.0);f1.rotateX(.25);f1.translate(0,.62,0);parts.push(f1);
  const f2=new THREE.BoxGeometry(.04,.55,.04);f2.translate(0,.65,-.3);parts.push(f2);const f3=new THREE.BoxGeometry(.5,.04,.04);f3.translate(0,.95,.45);parts.push(f3);
  const seat=new THREE.BoxGeometry(.14,.05,.26);seat.translate(0,.95,-.3);parts.push(seat);const bsk=new THREE.BoxGeometry(.3,.2,.25);bsk.translate(0,.85,.62);parts.push(bsk);
  const geo=mergeGeos(parts.map(p=>{p.rotateY(0);return p;}));let n=0;for(const b of BIKES)n+=b.n;
  const m=new THREE.InstancedMesh(geo,std('#ffffff',.5,.3),n);let k=0;
  for(const b of BIKES){const col=pick(['#f2c230','#2e7be0','#3fb070']);const L=Math.hypot(b.dx,b.dz)||1;for(let q=0;q<b.n;q++){const off=(q-b.n/2)*.55;_M.compose(_V.set(b.x+b.dx/L*off,0,b.z+b.dz/L*off),_Q.setFromAxisAngle(_Y,b.ry+rand(-.15,.15)),_S.set(1,1,1));m.setMatrixAt(k,_M);m.setColorAt(k,_C.set(col));k++;}}
  m.castShadow=true;city.add(m);}
// --- 信号灯 ---
const SIG={phase:0,lens:null};
{const pole=new THREE.CylinderGeometry(.11,.14,6.2,10);pole.translate(0,3.1,0);const arm=new THREE.CylinderGeometry(.07,.07,5.5,8);arm.rotateZ(Math.PI/2);arm.translate(-2.75,5.9,0);
  const house=rboxG(.42,1.25,.35,.06);house.translate(-4.8,5.3,0);const hood=new THREE.BoxGeometry(.5,.05,.25);hood.translate(-4.8,5.95,.2);
  const geo=mergeGeos([pole,arm,house,hood]);const list=SIGNALS.slice();SIGNALS.length=0;
  const pm=new THREE.InstancedMesh(geo,std('#2a2c2f',.5,.6),list.length);
  const lg=new THREE.CircleGeometry(.13,16);
  const lens=new THREE.InstancedMesh(lg,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),list.length*3);
  list.forEach((s,k)=>{_Q.setFromAxisAngle(_Y,s.ry);_M.compose(_V.set(s.x,.16,s.z),_Q,_S.set(1,1,1));pm.setMatrixAt(k,_M);
    for(let q=0;q<3;q++){const p=new THREE.Vector3(-4.8,5.68-q*.38,.18).applyQuaternion(_Q).add(new THREE.Vector3(s.x,0,s.z));_M.compose(p,_Q,_S.set(1,1,1));lens.setMatrixAt(k*3+q,_M);lens.setColorAt(k*3+q,_C.set(0x222222));}
    SIGNALS.push(s);});
  pm.castShadow=true;city.add(pm,lens);SIG.lens=lens;
}
// 东西向绿灯时 ax:'x' 的车可行。周期 36 秒（现实时间）
function sigState(ax,t){const c=t%36;const ew=c<15?'g':c<18?'y':'r',ns=c<18?'r':c<33?'g':c<36?'y':'r';return ax==='x'?ew:ns;}
function sigUpdate(){const t=performance.now()/1000,st={x:sigState('x',t),z:sigState('z',t)};const key=st.x+st.z;if(key===SIG.last)return;SIG.last=key;SIG.now=st;
  const OFF=0x1c1c1c;SIGNALS.forEach((s,k)=>{const v=st[s.ax];SIG.lens.setColorAt(k*3,_C.set(v==='r'?0xff2a1a:OFF));SIG.lens.setColorAt(k*3+1,_C.set(v==='y'?0xffb020:OFF));SIG.lens.setColorAt(k*3+2,_C.set(v==='g'?0x20ff70:OFF));});SIG.lens.instanceColor.needsUpdate=true;}
SIG.now={x:'g',z:'r'};
// --- 光晕（点精灵，夜间显示）---
const glowMat=new THREE.PointsMaterial({map:glowTex,size:1,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,opacity:0});
{const pos=new Float32Array(GLOWS.length*3),col=new Float32Array(GLOWS.length*3);GLOWS.forEach((g,k)=>{pos.set([g.x,g.y,g.z],k*3);_C.set(g.c);col.set([_C.r,_C.g,_C.b],k*3);});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  glowMat.size=4;const pts=new THREE.Points(geo,glowMat);city.add(pts);}
// --- 真实点光源池：跟随玩家取最近的路灯 ---
const LPOOL=[];for(let k=0;k<6;k++){const l=new THREE.PointLight(0xffc98a,0,26,1.6);l.position.set(0,-100,0);scene.add(l);LPOOL.push(l);}
let lpT=0;
function lampLightsUpdate(px,pz,night){lpT++;if(lpT%20&&night===lampLightsUpdate.n)return;lampLightsUpdate.n=night;
  const near=LAMPS.map(l=>({l,d:(l.hx-px)**2+(l.hz-pz)**2})).sort((a,b)=>a.d-b.d).slice(0,LPOOL.length);
  LPOOL.forEach((p,k)=>{const n=near[k];if(!n){p.intensity=0;return;}p.position.set(n.l.hx,7.6,n.l.hz);p.intensity=night*1.1;});}

// --- 写实道具（glTF 实例化）---
instParts(gltfParts('rollershutter_door',o=>!/graffiti/.test(o.name)),SHUTTERS,city,false);
instParts(gltfParts('utility_box_01'),UTILS.filter(u=>u.k===1),city);instParts(gltfParts('utility_box_02'),UTILS.filter(u=>u.k===2),city);
instParts(gltfParts('metal_trash_can',o=>!/rust/.test(o.name)),TRASH,city);

instParts(gltfParts('plastic_monobloc_chair_01'),CHAIRS,city);instParts(gltfParts('chinese_stool'),STOOLS,city);
// --- 把全城的实例化网格按 400m 分块，远处整块隐藏 ---
(function chunkify(){const keep=new Set([SIG.lens]);const list=city.children.filter(o=>o.isInstancedMesh&&!keep.has(o));
  const m4=new THREE.Matrix4(),p=new THREE.Vector3(),c=new THREE.Color();
  const cls=im=>im.material===leafMat||im.material===barkMat||im.material===treeAoM?'tree':im.material===acMat?'near':im.userData.prop==='near'?'near':im.userData.prop?'prop':'far';
  for(const im of list){const by=new Map();const C=cls(im);im.geometry.computeBoundingSphere();const gr=im.geometry.boundingSphere.radius;for(let i=0;i<im.count;i++){im.getMatrixAt(i,m4);p.setFromMatrixPosition(m4);const k=Math.floor(p.x/CH)+','+Math.floor(p.z/CH);if(!by.has(k))by.set(k,{x:p.x,z:p.z,ids:[]});by.get(k).ids.push(i);}
    for(const{x,z,ids}of by.values()){
      // 共享顶点缓冲的几何包装，只为了给每块设置正确的包围球（视锥 / 阴影剔除）
      const g=new THREE.BufferGeometry();for(const k in im.geometry.attributes)g.setAttribute(k,im.geometry.attributes[k]);g.setIndex(im.geometry.index);
      const n=new THREE.InstancedMesh(g,im.material,ids.length);const bb=new THREE.Box3();ids.forEach((id,j)=>{im.getMatrixAt(id,m4);n.setMatrixAt(j,m4);p.setFromMatrixPosition(m4);bb.expandByPoint(p);if(im.instanceColor){im.getColorAt(id,c);n.setColorAt(j,c);}});
      g.boundingSphere=new THREE.Sphere(bb.getCenter(new THREE.Vector3()),bb.getSize(new THREE.Vector3()).length()/2+gr*2);
      n.castShadow=im.castShadow&&C!=='prop';n.receiveShadow=im.receiveShadow;n.customDepthMaterial=im.customDepthMaterial;n.userData.lod=C;if(C==='prop'||C==='near')n.layers.set(1);chunkOf(x,z).add(n);}
    city.remove(im);}
  for(const o of city.children)if(o.isInstancedMesh)o.frustumCulled=false;camera.layers.enable(1);
})();
let chunkT=9;const VIS=850;
const LODR={tree:420,near:300,prop:190,car:110};
function chunkVis(dt,px,pz){chunkT+=dt;if(chunkT<.5)return;chunkT=0;for(const g of CHUNKS.values()){const c=g.userData.c,d=Math.hypot(c.x-px,c.z-pz);g.visible=d<VIS;if(g.visible)for(const o of g.children)if(o.userData.lod&&LODR[o.userData.lod])o.visible=d<LODR[o.userData.lod];}}
