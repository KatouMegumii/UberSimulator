// ================= 写实树木（近处模型 / 远处简化）+ 真人扫描行人 =================
// ---- 树：近处高精度椴树（梧桐替身）/ 中距离 4k 面模型 / 远处用模型烘焙的公告板 ----
function treeMat(m){m=m.clone();if(m.transparent||m.alphaTest){m.transparent=false;m.alphaTest=.42;m.depthWrite=true;m.side=THREE.DoubleSide;m.roughness=.85;m.envMapIntensity=.7;}else m.roughness=Math.max(m.roughness||1,.8);return m;}
function splitTrees(key){const g=AS.gltf[key];if(!g)return[];const root=g.scene;root.updateMatrixWorld(true);
  // 先找树干根部位置：最低 1 米内的树皮顶点按 x、z 聚类
  const geos=[];root.traverse(o=>{if(!o.isMesh)return;const gg=deinter(o.geometry.clone());gg.applyMatrix4(o.matrixWorld);geos.push({gg,m:treeMat(o.material)});});
  let ymin=1e9;for(const{gg,m}of geos){if(m.alphaTest)continue;const a=gg.attributes.position;for(let i=0;i<a.count;i++)ymin=Math.min(ymin,a.getY(i));}
  const base=[];for(const{gg,m}of geos){if(m.alphaTest)continue;const a=gg.attributes.position;for(let i=0;i<a.count;i++)if(a.getY(i)<ymin+1)base.push([a.getX(i),a.getZ(i)]);}
  const C=[];for(const[x,z]of base){let c=C.find(c=>Math.hypot(c.x/c.n-x,c.z/c.n-z)<2.5);if(!c){c={x:0,z:0,n:0};C.push(c);}c.x+=x;c.z+=z;c.n++;}
  const cen=C.filter(c=>c.n>5).map(c=>({x:c.x/c.n,z:c.z/c.n}));if(!cen.length)return[];
  const parts=cen.map(()=>[]);
  for(const{gg,m}of geos){const pos=gg.attributes.position,idx=gg.index?gg.index.array:null,cnt=idx?idx.length:pos.count;const sel=cen.map(()=>[]);
    for(let i=0;i<cnt;i+=3){const a=idx?idx[i]:i,b=idx?idx[i+1]:i+1,c=idx?idx[i+2]:i+2;const x=(pos.getX(a)+pos.getX(b)+pos.getX(c))/3,z=(pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/3;let bi=0,bd=1e9;cen.forEach((q,k)=>{const d=(q.x-x)**2+(q.z-z)**2;if(d<bd){bd=d;bi=k;}});sel[bi].push(a,b,c);}
    for(let k=0;k<cen.length;k++)if(sel[k].length){const g2=gg.clone();g2.setIndex(sel[k]);parts[k].push({geo:g2,mat:m,leaf:!!m.alphaTest});}}
  return parts.map((P,k)=>{if(!P.length)return null;const bb=new THREE.Box3();for(const p of P){p.geo.computeBoundingBox();bb.union(p.geo.boundingBox);}const sc=9.5/(bb.max.y-bb.min.y),xz=.75;
    for(const p of P){p.geo.translate(-cen[k].x,-bb.min.y,-cen[k].z);p.geo.scale(sc*xz,sc,sc*xz);p.geo.computeBoundingSphere();}return P;}).filter(Boolean);}
const TREE_NEAR=[],TREE_MID=splitTrees('trees4k');console.log('树模板',TREE_MID.length);
function bakeImpostor(P){const sc=new THREE.Scene();const g=new THREE.Group();for(const p of P)g.add(new THREE.Mesh(p.geo,p.mat));sc.add(g);sc.add(new THREE.AmbientLight(0xffffff,1.15));
  const bb=new THREE.Box3().setFromObject(g),sz=bb.getSize(new THREE.Vector3()),w=Math.max(sz.x,sz.z)*1.04,h=sz.y*1.02;const W=384,H=Math.round(W*h/w/32)*32||512;
  const cam=new THREE.OrthographicCamera(-w/2,w/2,h,0,-80,80);cam.position.set(0,0,40);cam.lookAt(0,0,0);
  const rt=new THREE.WebGLRenderTarget(W,H);const tm=renderer.toneMapping,oe=renderer.outputEncoding,cc=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha();
  renderer.toneMapping=THREE.NoToneMapping;renderer.outputEncoding=THREE.LinearEncoding;renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(sc,cam);renderer.setRenderTarget(null);
  renderer.toneMapping=tm;renderer.outputEncoding=oe;renderer.setClearColor(cc,ca);
  const geo=new THREE.PlaneGeometry(w,h);geo.translate(0,h/2,0);const mat=new THREE.MeshStandardMaterial({map:rt.texture,alphaTest:.45,side:THREE.DoubleSide,roughness:.95});return{geo,mat};}
const IMP=TREE_NEAR.length?bakeImpostor(TREE_NEAR[0]):TREE_MID.length?bakeImpostor(TREE_MID[0]):null;
const TG=60,TGRID=new Map();
function rebuildTreeGrid(){TGRID.clear();for(const t of TREES){const k=Math.floor(t.x/TG)*100003+Math.floor(t.z/TG);if(!TGRID.has(k))TGRID.set(k,[]);TGRID.get(k).push(t);}}
rebuildTreeGrid();
const TLOD={near:[],mid:[],far:null,ao:null,last:{x:1e9,z:1e9},t:9};
const CAP_N=260,CAP_M=300,CAP_F=12000;
function tierMeshes(P,cap){return P.map(p=>{const m=new THREE.InstancedMesh(p.geo,p.mat,cap);m.count=0;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;if(p.leaf)m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:p.mat.map,alphaTest:.42});scene.add(m);return m;});}
if(HI_TREES&&(TREE_NEAR.length||TREE_MID.length)){
  for(const P of TREE_NEAR)TLOD.near.push(tierMeshes(P,CAP_N));for(const P of TREE_MID)TLOD.mid.push(tierMeshes(P,CAP_M));
  if(IMP){TLOD.far=new THREE.InstancedMesh(IMP.geo,IMP.mat,CAP_F);TLOD.far.count=0;TLOD.far.frustumCulled=false;TLOD.far.receiveShadow=true;scene.add(TLOD.far);}
  const ag=new THREE.PlaneGeometry(7,7);ag.rotateX(-Math.PI/2);ag.translate(0,.03,0);TLOD.ao=new THREE.InstancedMesh(ag,treeAoM,CAP_N+CAP_M*2+600);TLOD.ao.count=0;TLOD.ao.frustumCulled=false;scene.add(TLOD.ao);
}
const _tm=new THREE.Matrix4(),_tq=new THREE.Quaternion(),_tv=new THREE.Vector3(),_ts=new THREE.Vector3(),_ty=new THREE.Vector3(0,1,0);
function treeLOD(dt,px,pz){if(!TLOD.ao)return;TLOD.t+=dt;if(TLOD.t<.35&&Math.hypot(px-TLOD.last.x,pz-TLOD.last.z)<5)return;TLOD.t=0;TLOD.last={x:px,z:pz};
  const R1={low:45,mid:75,high:120}[SET.q]||75,R2=Math.max(LODR.tree,R1+50)+250;const r=Math.ceil(R2/TG),cx=Math.floor(px/TG),cz=Math.floor(pz/TG);
  const list=[];for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){const L=TGRID.get((cx+i)*100003+cz+j);if(!L)continue;for(const t of L){const d=(t.x-px)**2+(t.z-pz)**2;if(d<R2*R2)list.push([d,t]);}}
  list.sort((a,b)=>a[0]-b[0]);
  const nm=TLOD.mid.map(()=>0);let nf=0,na=0;const nv=Math.max(1,TLOD.mid.length);
  for(const[d2,t]of list){const d=Math.sqrt(d2),v=(t.r*1000|0)%nv;_tq.setFromAxisAngle(_ty,t.r);_ts.set(t.s,t.s*(.9+(t.r%1)*.2),t.s);_tm.compose(_tv.set(t.x,t.y||0,t.z),_tq,_ts);
    let live=false;if(d<R1&&TLOD.mid.length){let w=v;if(nm[w]>=CAP_M)w=nm.findIndex(n=>n<CAP_M);if(w>=0){for(const m of TLOD.mid[w])m.setMatrixAt(nm[w],_tm);nm[w]++;live=true;}}
    if(!live&&TLOD.far&&nf<CAP_F){_tq.setFromAxisAngle(_ty,Math.atan2(px-t.x,pz-t.z));_tm.compose(_tv,_tq,_ts.set(t.s,t.s,t.s));TLOD.far.setMatrixAt(nf++,_tm);}
    if(live&&na<TLOD.ao.instanceMatrix.count){_tm.compose(_tv.set(t.x,(t.y||0),t.z),_tq.identity(),_ts.set(t.s,1,t.s));TLOD.ao.setMatrixAt(na++,_tm);}}
  TLOD.mid.forEach((ms,k)=>{for(const m of ms){m.count=nm[k];m.instanceMatrix.needsUpdate=true;}});
  if(TLOD.far){TLOD.far.count=nf;TLOD.far.instanceMatrix.needsUpdate=true;}TLOD.ao.count=na;TLOD.ao.instanceMatrix.needsUpdate=true;
}
// ---- 行人：Renderpeople 扫描模型 ----
const PEDM=[];
function retarget(src){if(!src||!src.animations[0])return null;const c=src.animations[0].clone();for(const tr of c.tracks)tr.name=tr.name.replace(/^rp_[a-z]+_animated_\d+_[a-z]+_/,'');return c;}
function pedTemplate(key,h,clipFrom){const g=AS.gltf[key];if(!g)return null;const b=new THREE.Box3().setFromObject(g.scene,true);const clip=clipFrom!==undefined?retarget(AS.gltf[clipFrom]):(g.animations[0]&&g.animations[0].clone());
  if(clip){for(const tr of clip.tracks)if(/\.position$/.test(tr.name)&&/hips|pelvis|root|mixamorig|bip/i.test(tr.name)){const v=tr.values;const x0=v[0],z0=v[2];for(let i=0;i<v.length;i+=3){v[i]=x0;v[i+2]=z0;}}}
  return{g,h,clip,scale:h/(b.max.y-b.min.y),minY:b.min.y};}
const PT_WALK=[pedTemplate('nathan',1.78),pedTemplate('eric',1.8,'nathan'),pedTemplate('carla',1.68,'nathan'),pedTemplate('claudia',1.7,'nathan')].filter(Boolean);
const PT_IDLE=[pedTemplate('sophia',1.66)].filter(Boolean);
const PT=PT_WALK.length?[PT_WALK[0],PT_IDLE[0]||PT_WALK[0]]:[];
function makeRealPed(T){const w=new THREE.Group();const inner=SkeletonUtils.clone(T.g.scene);inner.scale.setScalar(T.scale);inner.position.y=-T.minY*T.scale;inner.rotation.y=Math.PI;w.add(inner);
  inner.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});const mx=T.clip?new THREE.AnimationMixer(inner):null;if(mx){const a=mx.clipAction(T.clip);a.play();a.time=Math.random()*T.clip.duration;}
  w.userData.mixer=mx;w.userData.real=true;return w;}
if(PT.length&&window.SkeletonUtils){
  const N={low:18,mid:34,high:52}[SET.q]||34;
  // 替换掉一部分程序化行人
  for(let k=0;k<PEDS.length;k++){const p=PEDS[k];if(k>=N){p.g.visible=false;p.off2=true;continue;}const idle=k%5===4&&PT_IDLE.length;const T=idle?PT_IDLE[k%PT_IDLE.length]:PT_WALK[k%PT_WALK.length];const ng=makeRealPed(T);ng.position.copy(p.g.position);scene.remove(p.g);p.g=ng;scene.add(ng);p.spd=rand(1.15,1.35);if(idle){p.idle=true;p.spd=0;}}
  for(let k=PEDS.length-1;k>=0;k--)if(PEDS[k].off2)PEDS.splice(k,1);
}
function pedAnim(dt){for(const p of PEDS){const mx=p.g.userData.mixer;if(mx&&p.g.visible&&!(p.stop>0&&p.g.userData.real&&p.g===p.g&&false))mx.update(dt*(p.stop>0?.0:1));}}

function makePedVisual(){if(!PT_IDLE.length||!window.SkeletonUtils)return makePerson();return makeRealPed(pick(PT_IDLE.concat(PT_WALK.slice(0,1))));}
