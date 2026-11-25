
// ================= 城市生成（OSM 数据）=================
const city=new THREE.Group();scene.add(city);
const TREES=[],LAMPS=[],ACS=[],BIKES=[],GLOWS=[],SIGNALS=[],SHUTTERS=[],UTILS=[],TRASH=[],MANH=[],CHAIRS=[],STOOLS=[];
const CH=400,CHUNKS=new Map();
function chunkOf(x,z){const k=Math.floor(x/CH)+','+Math.floor(z/CH);if(!CHUNKS.has(k)){const g=new THREE.Group();g.userData.c={x:(Math.floor(x/CH)+.5)*CH,z:(Math.floor(z/CH)+.5)*CH};CHUNKS.set(k,g);city.add(g);}return CHUNKS.get(k);}
// 按块按材质合批
const CB=new Map();
function addC(x,z,mat,geo,cast=true){const k=Math.floor(x/CH)+','+Math.floor(z/CH)+'|'+mat.uuid+(cast?1:0);if(!CB.has(k))CB.set(k,{x,z,mat,cast,list:[]});CB.get(k).list.push(geo);}
function flushC(){for(const{x,z,mat,cast,list}of CB.values()){const g=chunkOf(x,z);for(let k=0;k<list.length;k+=4000){const m=new THREE.Mesh(mergeGeos(list.slice(k,k+4000)),mat);m.castShadow=cast;m.receiveShadow=true;g.add(m);}}CB.clear();}
// 简易几何构造器（避免为每个小块创建 BufferGeometry 对象）
function GB(){return{p:[],n:[],u:[],i:[]};}
function gbQuad(b,a,c,d,e,nx,ny,nz,uv){const o=b.p.length/3;for(const v of[a,c,d,e])b.p.push(v[0],v[1],v[2]);for(let k=0;k<4;k++)b.n.push(nx,ny,nz);b.u.push(...uv);b.i.push(o,o+1,o+2,o,o+2,o+3);}
function gbGeo(b){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setIndex(b.i);return g;}
// 地面：整片铺装（道路之外基本都是人行道 / 小区地面）
{const g=new THREE.PlaneGeometry(BOUNDS[2]-BOUNDS[0]+2000,BOUNDS[3]-BOUNDS[1]+2000);g.rotateX(-Math.PI/2);g.translate((BOUNDS[0]+BOUNDS[2])/2,0,(BOUNDS[1]+BOUNDS[3])/2);
  const gm=concreteMat.clone();gm.color=new THREE.Color(0x7d8186);if(applyPbr(gm,'ground',1)){gm.color.set(0xa4a4a2);}if(gm.map){for(const t of['map','normalMap','roughnessMap'])if(gm[t]){gm[t]=gm[t].clone();gm[t].repeat.set((BOUNDS[2]-BOUNDS[0]+2000)/6,(BOUNDS[3]-BOUNDS[1]+2000)/6);gm[t].needsUpdate=true;}}
  const m=new THREE.Mesh(g,gm);m.receiveShadow=true;city.add(m);}
// ---- 道路 ----
const roadW=roadMat.clone();for(const t of['map','normalMap','roughnessMap'])if(roadW[t]){roadW[t]=roadW[t].clone();roadW[t].repeat.set(1,1);roadW[t].needsUpdate=true;}
roadW.color=new THREE.Color(0x5c5c5c);roadW.polygonOffset=true;roadW.polygonOffsetFactor=-1;roadW.polygonOffsetUnits=-1;
const RT=3.5; // 柏油贴图世界尺寸（米）
const vMaxW=RV.map(v=>Math.max(...v.e.map(i=>RE[i].w)));
const SIGV=new Set();
for(let k=0;k<(MAP.S||[]).length;k+=2){let bi=-1,bd=22;const x=MAP.S[k],z=MAP.S[k+1];for(let i=0;i<RV.length;i++){const d=Math.abs(RV[i].x-x)+Math.abs(RV[i].z-z);if(d<bd){bd=d;bi=i;}}if(bi>=0&&RV[bi].e.length>=3)SIGV.add(bi);}
function ribbon(b,pts,off0,off1,y,uvWorld){ // 沿折线生成带状面（off 为相对中心线的左右偏移）
  for(let k=0;k<pts.length-1;k++){const a=pts[k],c=pts[k+1],dx=c.x-a.x,dz=c.z-a.z,L=Math.hypot(dx,dz);if(L<.05)continue;const nx=-dz/L,nz=dx/L;
    const A=[a.x+nx*off0,y,a.z+nz*off0],B=[a.x+nx*off1,y,a.z+nz*off1],C=[c.x+nx*off1,y,c.z+nz*off1],D=[c.x+nx*off0,y,c.z+nz*off0];
    const uv=uvWorld?[A[0]/RT,A[2]/RT,B[0]/RT,B[2]/RT,C[0]/RT,C[2]/RT,D[0]/RT,D[2]/RT]:[0,0,1,0,1,L,0,L];
    const o=b.p.length/3;for(const v of[A,B,C,D])b.p.push(...v);for(let q=0;q<4;q++)b.n.push(0,1,0);b.u.push(...uv);
    // 保证法线朝上
    const cr=(B[0]-A[0])*(C[2]-A[2])-(B[2]-A[2])*(C[0]-A[0]);if(cr<0)b.i.push(o,o+1,o+2,o,o+2,o+3);else b.i.push(o,o+2,o+1,o,o+3,o+2);}
}
function disc(b,x,z,r,y){const o=b.p.length/3,N=14;b.p.push(x,y,z);b.n.push(0,1,0);b.u.push(x/RT,z/RT);for(let k=0;k<=N;k++){const a=k/N*Math.PI*2;b.p.push(x+Math.cos(a)*r,y,z+Math.sin(a)*r);b.n.push(0,1,0);b.u.push((x+Math.cos(a)*r)/RT,(z+Math.sin(a)*r)/RT);}
  for(let k=0;k<N;k++)b.i.push(o,o+2+k,o+1+k);}
function trimPts(e,t0,t1){const out=[];if(t1-t0<1)return out;const a=pointAt(e,t0);out.push({x:a.x,z:a.z});for(let k=1;k<e.pts.length-1;k++)if(e.cum[k]>t0&&e.cum[k]<t1)out.push(e.pts[k]);const c=pointAt(e,t1);out.push({x:c.x,z:c.z});return out;}
const lineYm=new THREE.MeshStandardMaterial({color:0xd6a92a,roughness:.55,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
const lineWm=new THREE.MeshStandardMaterial({color:0xe6e6e2,roughness:.55,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
{const RB=new Map(),YB=new Map(),WB=new Map(),CBk=new Map(),SWB=new Map();
  const bk=(M,x,z)=>{const k=Math.floor(x/CH)+','+Math.floor(z/CH);if(!M.has(k))M.set(k,{x,z,b:GB()});return M.get(k).b;};
  for(const e of RE){const m=e.pts[Math.floor(e.pts.length/2)];const b=bk(RB,m.x,m.z);ribbon(b,e.pts,-e.w/2,e.w/2,.02,true);
    const ta=RV[e.a].e.length>=3?vMaxW[e.a]/2+2.5:0,tb=RV[e.b].e.length>=3?vMaxW[e.b]/2+2.5:0;const core=trimPts(e,ta,e.L-tb);
    if(core.length>=2&&e.c<=4){
      const yb=bk(YB,m.x,m.z),wb=bk(WB,m.x,m.z);
      if(!e.o&&e.w>=8.5){ribbon(yb,core,-.27,-.12,.03);ribbon(yb,core,.12,.27,.03);}
      if(e.w>=12){ // 车道虚线
        for(let s=ta+3;s<e.L-tb-3;s+=9){const seg=trimPts(e,s,Math.min(s+4,e.L-tb));for(const o of(e.o?[-e.w/6,e.w/6]:[-e.w/4,e.w/4]))ribbon(wb,seg,o-.07,o+.07,.03);}}
      if(e.c<=3){ribbon(wb,core,e.w/2-.45,e.w/2-.3,.03);ribbon(wb,core,-e.w/2+.3,-e.w/2+.45,.03);}
      // 人行道（抬高到路沿高度）
      if(e.c<=4){const sb=bk(SWB,m.x,m.z);ribbon(sb,core,e.w/2+.25,e.w/2+(e.c<=2?4.5:3.4),.16,true);ribbon(sb,core,-e.w/2-(e.c<=2?4.5:3.4),-e.w/2-.25,.16,true);}
      // 路沿石
      const cb=bk(CBk,m.x,m.z);const cp=trimPts(e,ta?ta-1:0,e.L-(tb?tb-1:0));
      for(const sd of[1,-1]){for(let k=0;k<cp.length-1;k++){const a=cp[k],c=cp[k+1],dx=c.x-a.x,dz=c.z-a.z,L=Math.hypot(dx,dz);if(L<.1)continue;const nx=-dz/L*sd,nz=dx/L*sd,o=e.w/2;
        const A=[a.x+nx*o,.02,a.z+nz*o],B=[a.x+nx*o,.16,a.z+nz*o],C=[c.x+nx*o,.16,c.z+nz*o],D=[c.x+nx*o,.02,c.z+nz*o];gbQuad(cb,A,B,C,D,-nx,0,-nz,[0,0,0,.25,L/2,.25,L/2,0]);
        const E=[a.x+nx*(o+.25),.16,a.z+nz*(o+.25)],F=[c.x+nx*(o+.25),.16,c.z+nz*(o+.25)];gbQuad(cb,B,E,F,C,0,1,0,[0,0,0,.1,L/2,.1,L/2,0]);}}
    }
    // 斑马线（信号灯路口）
    for(const[v,from0]of[[e.a,true],[e.b,false]]){if(!SIGV.has(v)||e.c>4)continue;const s0=vMaxW[v]/2+1.2;if(e.L<s0+6)continue;const s=from0?s0:e.L-s0-3.2;const p=pointAt(e,s+1.6);
      const wb=bk(WB,p.x,p.z);const seg=trimPts(e,s,s+3.2);for(let o=-e.w/2+.6;o<e.w/2-.5;o+=1.1)ribbon(wb,seg,o,o+.5,.031);}
  }
  for(let i=0;i<RV.length;i++){const v=RV[i];if(v.e.length<2)continue;const b=bk(RB,v.x,v.z);disc(b,v.x,v.z,vMaxW[i]/2+.3,.021);}
  const swM=paveMat.clone();for(const t of['map','normalMap','roughnessMap'])if(swM[t]){swM[t]=swM[t].clone();swM[t].repeat.set(RT/2.2,RT/2.2);swM[t].needsUpdate=true;}swM.color=new THREE.Color(0xa8a49c);swM.polygonOffset=true;swM.polygonOffsetFactor=-1;
  for(const[M,mat,cast]of[[SWB,swM,false],[RB,roadW,false],[YB,lineYm,false],[WB,lineWm,false],[CBk,curbMat,false]])for(const{x,z,b}of M.values()){const m=new THREE.Mesh(gbGeo(b),mat);m.receiveShadow=true;m.castShadow=cast;chunkOf(x,z).add(m);}
}
// ---- 建筑 ----
const BSEG=new Map(); // 墙段索引：用于店招
const roofFlatM=concreteMat.clone();roofFlatM.color=new THREE.Color(0x8c8c88);
const BALC=[];
const plinthM=new THREE.MeshStandardMaterial({color:0x6a6764,roughness:.8});applyPbr(plinthM,'plaza',1);plinthM.color.set(0x77736e);
const ledgeM=std('#d8d2c6',.85,0);
const gableM=roofMat.clone();applyPbr(gableM,'gable',1);
const KIND=['brick','plaster','tile','glass'];
const TINTS={brick:['#ffffff','#efe4dc','#e2d6cc'],plaster:['#ffffff','#f2e6d2','#e4e8ec','#f6e0cc','#ece4d8'],tile:['#ffffff','#f2f2ec','#e8e2d8'],glass:['#ffffff','#d6e4f0','#e4ece6'],dark:['#ffffff','#dcd4dc']};
let bseed=1;
// ---- 补楼：OSM 缺建筑数据的大片空地，按路网方向补六层新村住宅 ----
{const VG=new Map(),vk=(x,z)=>Math.floor(x/20)*100003+Math.floor(z/20);
  const addSeg=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(L/6));for(let q=0;q<=n;q++){const x=lerp(x0,x1,q/n),z=lerp(z0,z1,q/n),kk=vk(x,z);if(!VG.has(kk))VG.set(kk,[]);VG.get(kk).push(x,z);}};
  for(const[h,k,f]of MAP.B)for(let i=0;i<f.length;i+=2){const j=(i+2)%f.length;addSeg(f[i],f[i+1],f[j],f[j+1]);}
  const near=(x,z,r)=>{const c=Math.ceil(r/20);for(let i=-c;i<=c;i++)for(let j=-c;j<=c;j++){const L=VG.get((Math.floor(x/20)+i)*100003+Math.floor(z/20)+j);if(L)for(let q=0;q<L.length;q+=2)if((L[q]-x)**2+(L[q+1]-z)**2<r*r)return true;}return false;};
  const GB2=(MAP.G||[]).map(f=>{let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<f.length;i+=2){x0=Math.min(x0,f[i]);x1=Math.max(x1,f[i]);z0=Math.min(z0,f[i+1]);z1=Math.max(z1,f[i+1]);}return{f,x0,z0,x1,z1};});
  const inPoly=(x,z,f)=>{let ins=false;for(let i=0,j=f.length-2;i<f.length;j=i,i+=2){const xi=f[i],zi=f[i+1],xj=f[j],zj=f[j+1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))ins=!ins;}return ins;};
  const inPark=(x,z)=>GB2.some(g=>x>g.x0&&x<g.x1&&z>g.z0&&z<g.z1&&inPoly(x,z,g.f));
  const added=[];const AG=new Map();
  for(let x=BOUNDS[0]+40;x<BOUNDS[2]-40;x+=24)for(let z=BOUNDS[1]+40;z<BOUNDS[3]-40;z+=24){const jx=x+rand(-6,6),jz=z+rand(-6,6);
    if(near(jx,jz,15))continue;const n=nearestEdge(jx,jz,120);if(!n||n.d<n.e.w/2+12)continue;if(inPark(jx,jz))continue;
    const ak=Math.floor(jx/30)*100003+Math.floor(jz/30);if(AG.has(ak))continue;
    const tx=n.dx,tz=n.dz,nx=-tz,nz=tx,Lh=rand(14,24),Dh=rand(5.5,7);const C=[[-Lh,-Dh],[Lh,-Dh],[Lh,Dh],[-Lh,Dh]].map(([a,b])=>({x:jx+tx*a+nx*b,z:jz+tz*a+nz*b}));
    if(C.some(c=>near(c.x,c.z,4.5)||onRoadSurf(c.x,c.z,-5)||inPark(c.x,c.z)))continue;if(added.some(b=>Math.hypot(b.cx-jx,b.cz-jz)<Lh+10))continue;
    AG.set(ak,1);const fl=Math.random()<.7?6:Math.random()<.5?5:7;added.push(Object.assign([+(fl*3.05+.6).toFixed(1),Math.random()<.6?1:2,C.flatMap(c=>[+c.x.toFixed(1),+c.z.toFixed(1)])],{cx:jx,cz:jz}));for(const c2 of[[0,1],[1,2],[2,3],[3,0]])addSeg(C[c2[0]].x,C[c2[0]].z,C[c2[1]].x,C[c2[1]].z);}
  for(const b of added)MAP.B.push(b);if(window.console)console.log('补楼',added.length);}
for(const[h,k,flat]of MAP.B){
  const ring=[];for(let i=0;i<flat.length;i+=2)ring.push({x:flat[i],z:flat[i+1]});if(ring.length<3)continue;
  let A=0;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];A+=p.x*q.z-q.x*p.z;}const sg=A>0?1:-1;
  let cx=0,cz=0;for(const p of ring){cx+=p.x;cz+=p.z;}cx/=ring.length;cz/=ring.length;
  bseed=(bseed*16807)%2147483647;const u=bseed/2147483647;
  let kind=KIND[k];if(kind==='brick'&&u<.3)kind='dark';const mat=bmat(kind,TINTS[kind][Math.floor(u*TINTS[kind].length)%TINTS[kind].length]);
  const b=GB();let per=0;
  for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],dx=q.x-p.x,dz=q.z-p.z,L=Math.hypot(dx,dz);if(L<.05)continue;
    const nx=dz/L*sg,nz=-dx/L*sg;const u0=per/12,u1=(per+L)/12;per+=L;
    const P0=[p.x,0,p.z],Q0=[q.x,0,q.z],Q1=[q.x,h,q.z],P1=[p.x,h,p.z];const o=b.p.length/3;for(const v of[P0,Q0,Q1,P1])b.p.push(...v);for(let t=0;t<4;t++)b.n.push(nx,0,nz);b.u.push(u0,0,u1,0,u1,h/12,u0,h/12);
    const cr=(dx)*(0)-0; // 计算面朝向
    const ax=Q0[0]-P0[0],az=Q0[2]-P0[2];const crossY=[az*h-0,0,-(ax*h)];if(crossY[0]*nx+crossY[2]*nz>0)b.i.push(o,o+1,o+2,o,o+2,o+3);else b.i.push(o,o+2,o+1,o,o+3,o+2);
    {const ah=Math.min(1.8,h*.35);const ab=GB();const A2=[p.x+nx*.03,0,p.z+nz*.03],B2=[q.x+nx*.03,0,q.z+nz*.03],C2=[q.x+nx*.03,ah,q.z+nz*.03],D2=[p.x+nx*.03,ah,p.z+nz*.03];for(const v of[A2,B2,C2,D2])ab.p.push(...v);for(let t=0;t<4;t++)ab.n.push(nx,0,nz);ab.u.push(0,0,1,0,1,1,0,1);ab.i.push(...(crossY[0]*nx+crossY[2]*nz>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]));addC(cx,cz,aoWallM,gbGeo(ab),false);}
    if(L>4&&h>5){const sk=Math.floor((p.x+q.x)/2/GC)*100003+Math.floor((p.z+q.z)/2/GC);if(!BSEG.has(sk))BSEG.set(sk,[]);BSEG.get(sk).push({p,q,nx,nz,L,h,kind,used:0});}
    if((kind==='plaster'||kind==='tile'||kind==='dark')&&h>8&&L>3)for(let y=6.2;y<Math.min(h-1,45);y+=3)for(let a=1.2;a<L-1;a+=3.2)if(((i*31+y*7+a*13+bseed)%100)<16){const t=a/L;ACS.push({x:p.x+dx*t+nx*.18,y:y-1.3,z:p.z+dz*t+nz*.18,ry:Math.atan2(nx,nz)});}
  }
  addC(cx,cz,mat,gbGeo(b));
  // ---- 立面细节：勒脚、腰线、阳台 ----
  {const pb=GB(),lb=GB();let longest=[];
    for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],dx=q.x-p.x,dz=q.z-p.z,L=Math.hypot(dx,dz);if(L<.3)continue;const nx=dz/L*sg,nz=-dx/L*sg,o=.07;
      const quad=(B,y0,y1,out,uvs)=>{const A0=[p.x+nx*out,y0,p.z+nz*out],B0=[q.x+nx*out,y0,q.z+nz*out],C0=[q.x+nx*out,y1,q.z+nz*out],D0=[p.x+nx*out,y1,p.z+nz*out];const ax=B0[0]-A0[0],az=B0[2]-A0[2];const ok=(az*(y1-y0))*nx+(-(ax*(y1-y0)))*nz>0;const o2=B.p.length/3;for(const v of[A0,B0,C0,D0])B.p.push(...v);for(let t=0;t<4;t++)B.n.push(nx,0,nz);B.u.push(...uvs);B.i.push(...(ok?[o2,o2+1,o2+2,o2,o2+2,o2+3]:[o2,o2+2,o2+1,o2,o2+3,o2+2]));};
      const top=(B,y,out)=>{const o2=B.p.length/3;B.p.push(p.x,y,p.z,q.x,y,q.z,q.x+nx*out,y,q.z+nz*out,p.x+nx*out,y,p.z+nz*out);for(let t=0;t<4;t++)B.n.push(0,1,0);B.u.push(0,0,L/2,0,L/2,.1,0,.1);const cr=((q.x-p.x)*(nz*out)-(q.z-p.z)*(nx*out));B.i.push(...(cr<0?[o2,o2+1,o2+2,o2,o2+2,o2+3]:[o2,o2+2,o2+1,o2,o2+3,o2+2]));};
      quad(pb,0,.9,o,[0,0,L/2.5,0,L/2.5,.36,0,.36]);
      if(kind!=='glass'&&h>6&&L>2.5&&Math.abs(A)>120){const ys=[4.6];if(h<24&&L>6)for(let y=10.6;y<h-1.5;y+=9)ys.push(y);ys.push(h-.15);for(const y of ys){quad(lb,y-.16,y,.17,[0,0,L/3,0,L/3,.05,0,.05]);if(y===4.6)top(lb,y,.17);}}
      if((kind==='plaster'||kind==='tile')&&h>=12&&h<=62&&L>7)longest.push({p,q,nx,nz,L,dx:dx/L,dz:dz/L});}
    addC(cx,cz,plinthM,gbGeo(pb));if(lb.p.length)addC(cx,cz,ledgeM,gbGeo(lb));
    longest.sort((a,b)=>b.L-a.L);if(Math.random()<.45)for(const w of longest.slice(0,1)){for(let y=7.4;y<Math.min(h-2.5,34);y+=3)for(let a=2.2;a<w.L-2;a+=3.6){if(Math.random()<.35)continue;BALC.push({x:w.p.x+w.dx*a+w.nx*.02,y,z:w.p.z+w.dz*a+w.nz*.02,ry:Math.atan2(w.nx,w.nz)});}}
  }
  // ---- 老式低层：双坡屋顶 ----
  let gabled=false;
  if((kind==='brick'||kind==='dark')&&h<12.5){let best=null;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];const th=Math.atan2(q.z-p.z,q.x-p.x),c=Math.cos(th),s2=Math.sin(th);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const r of ring){const X=(r.x-cx)*c+(r.z-cz)*s2,Z=-(r.x-cx)*s2+(r.z-cz)*c;x0=Math.min(x0,X);x1=Math.max(x1,X);z0=Math.min(z0,Z);z1=Math.max(z1,Z);}const ar=(x1-x0)*(z1-z0);if(!best||ar<best.ar)best={ar,th,x0,x1,z0,z1};}
    if(best&&Math.abs(A)/2/best.ar>.72&&Math.min(best.x1-best.x0,best.z1-best.z0)<20){gabled=true;let{th,x0,x1,z0,z1}=best;if(x1-x0<z1-z0){th+=Math.PI/2;[x0,x1,z0,z1]=[z0,z1,-x1,-x0];}
      const c=Math.cos(th),s2=Math.sin(th),W=(z1-z0)/2+.35,Lx=(x1-x0)/2+.35,mz=(z0+z1)/2,mx=(x0+x1)/2,rh=Math.min(3,W*.62);
      const P=(X,Y,Z)=>[cx+(X*c-Z*s2),Y,cz+(X*s2+Z*c)];const rb2=GB();const q4=(A0,B0,C0,D0,uv)=>{const o2=rb2.p.length/3;for(const v of[A0,B0,C0,D0])rb2.p.push(...v);for(let t=0;t<4;t++)rb2.n.push(0,1,0);rb2.u.push(...uv);rb2.i.push(o2,o2+1,o2+2,o2,o2+2,o2+3,o2,o2+2,o2+1,o2,o2+3,o2+2);};
      const ux=Lx*2/3.5,uz=W/3.5*1.15;q4(P(mx-Lx,h,mz-W),P(mx+Lx,h,mz-W),P(mx+Lx,h+rh,mz),P(mx-Lx,h+rh,mz),[0,0,ux,0,ux,uz,0,uz]);q4(P(mx-Lx,h,mz+W),P(mx+Lx,h,mz+W),P(mx+Lx,h+rh,mz),P(mx-Lx,h+rh,mz),[0,0,ux,0,ux,uz,0,uz]);
      const gg=gbGeo(rb2);gg.deleteAttribute('normal');gg.computeVertexNormals();addC(cx,cz,gableM,gg);
      const tb=GB();for(const sx of[-1,1]){const o2=tb.p.length/3;tb.p.push(...P(mx+sx*(Lx-.35),h,mz-W+.35),...P(mx+sx*(Lx-.35),h,mz+W-.35),...P(mx+sx*(Lx-.35),h+rh-.2,mz));for(let t=0;t<3;t++)tb.n.push(0,0,0);tb.u.push(0,0,1,0,.5,.5);tb.i.push(o2,o2+1,o2+2,o2,o2+2,o2+1);}const tg=gbGeo(tb);tg.computeVertexNormals();addC(cx,cz,mat,tg);}}
  // 屋顶
  const v2=ring.map(p=>new THREE.Vector2(p.x,p.z));const tri=THREE.ShapeUtils.triangulateShape(v2,[]);const rb=GB();for(const p of ring){rb.p.push(p.x,h,p.z);rb.n.push(0,1,0);rb.u.push(p.x/4,p.z/4);}
  for(const[a,c,d]of tri){const A2=ring[a],C2=ring[c],D2=ring[d];const cr=(C2.x-A2.x)*(D2.z-A2.z)-(C2.z-A2.z)*(D2.x-A2.x);if(cr<0)rb.i.push(a,c,d);else rb.i.push(a,d,c);}
  addC(cx,cz,roofFlatM,gbGeo(rb));
  if(!gabled&&h>9&&Math.abs(A)>80){const n=Math.min(4,Math.floor(Math.abs(A)/600)+1);for(let q=0;q<n;q++){const p=ring[Math.floor(bseed*7+q*3)%ring.length];const x=lerp(cx,p.x,.45),z=lerp(cz,p.z,.45);if(q%2===0&&q<2&&Math.random()<.5)addC(cx,cz,std('#9a9a96',.6,.4),(()=>{const g=new THREE.CylinderGeometry(1.1,1.1,1.8,8,1);g.translate(x,h+.9,z);return g;})());else ACS.push({x,y:h+.05,z,ry:bseed%6});}}
  if(!gabled){const pb=GB();for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],dx=q.x-p.x,dz=q.z-p.z,L=Math.hypot(dx,dz);if(L<.1)continue;const nx=dz/L*sg,nz=-dx/L*sg;gbQuad(pb,[p.x-nx*.25,h,p.z-nz*.25],[q.x-nx*.25,h,q.z-nz*.25],[q.x-nx*.25,h+.7,q.z-nz*.25],[p.x-nx*.25,h+.7,p.z-nz*.25],-nx,0,-nz,[0,0,L/3,0,L/3,.25,0,.25]);gbQuad(pb,[p.x,h+.7,p.z],[q.x,h+.7,q.z],[q.x-nx*.25,h+.7,q.z-nz*.25],[p.x-nx*.25,h+.7,p.z-nz*.25],0,1,0,[0,0,L/3,0,L/3,.1,0,.1]);}const g=gbGeo(pb);g.computeVertexNormals();addC(cx,cz,concreteMat,g);}
  if(h>20&&u<.5){const s=Math.min(4,Math.sqrt(Math.abs(A))/6);addC(cx,cz,std('#8d8c88',.7,.3),boxG(s,1.8,s,cx,h+.9,cz));}
}
// ---- 店铺 / 店招：OSM 店名优先 ----
const SIGN_ATLAS=[];let atlasCur=null,atlasN=0;const ACW=256,ACHt=64,AW=2048,PER=Math.floor(AW/ACW)*Math.floor(AW/ACHt);
const _scache=new Map();
function signCell(text,style){const ck=text+'|'+style;if(_scache.has(ck))return _scache.get(ck);const r=signCell0(text,style);_scache.set(ck,r);return r;}
function signCell0(text,style){
  if(!atlasCur||atlasN>=PER){const c=document.createElement('canvas');c.width=c.height=AW;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=MAXANI;
    const m=new THREE.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.15,roughness:.4});m.userData.neon=false;SIGNMATS.push(m);atlasCur={c,g:c.getContext('2d'),t,m};SIGN_ATLAS.push(atlasCur);atlasN=0;}
  const i=atlasN++,cx=(i%(AW/ACW))*ACW,cy=Math.floor(i/(AW/ACW))*ACHt,g=atlasCur.g;
  const SC={red:['#b8282e','#fff7e0'],green:['#1f6f4a','#fff'],blue:['#1d4f91','#fff'],yellow:['#f2c230','#2a1a00'],white:['#f4f2ec','#b8282e'],dark:['#17181c','#f2d39a'],orange:['#e86a1c','#fff'],neon:['#0b0a10','#ff5fd8']};
  const[bg,fg]=SC[style]||SC.red;g.fillStyle=bg;g.fillRect(cx,cy,ACW,ACHt);g.fillStyle='rgba(255,255,255,.1)';g.fillRect(cx,cy,ACW,6);
  if(style==='neon'){g.strokeStyle=fg;g.lineWidth=3;g.shadowColor=fg;g.shadowBlur=10;g.strokeRect(cx+4,cy+4,ACW-8,ACHt-8);}
  g.fillStyle=fg;let fs=38;g.font=`bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;while(g.measureText(text).width>ACW-20&&fs>14){fs-=2;g.font=`bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;}
  g.textAlign='center';g.textBaseline='middle';g.fillText(text,cx+ACW/2,cy+ACHt/2+2);g.shadowBlur=0;atlasCur.t.needsUpdate=true;
  const u0=cx/AW,u1=(cx+ACW)/AW,v0=1-(cy+ACHt)/AW,v1=1-cy/AW;return{m:atlasCur.m,uv:[u0,v0,u1,v0,u1,v1,u0,v1]};
}
function wallPlane(mat,uv,s,along,w,y0,y1,out){const t0=(along-w/2)/s.L,t1=(along+w/2)/s.L,dx=s.q.x-s.p.x,dz=s.q.z-s.p.z;
  const A=[s.p.x+dx*t0+s.nx*out,y0,s.p.z+dz*t0+s.nz*out],B=[s.p.x+dx*t1+s.nx*out,y0,s.p.z+dz*t1+s.nz*out],C=[B[0],y1,B[2]],D=[A[0],y1,A[2]];
  const b=GB();const o=0;for(const v of[A,B,C,D])b.p.push(...v);for(let k=0;k<4;k++)b.n.push(s.nx,0,s.nz);b.u.push(...uv);
  const cr=((B[2]-A[2])*(1)) ;const ok=((B[0]-A[0])*s.nz-(B[2]-A[2])*s.nx)<0; // 正面朝外
  b.i.push(...(ok?[0,1,2,0,2,3]:[0,2,1,0,3,2]));addC(A[0],A[2],mat,gbGeo(b),false);}
function wallBox(mat,s,along,w,y,hh,depth){const t=along/s.L,x=s.p.x+(s.q.x-s.p.x)*t+s.nx*depth/2,z=s.p.z+(s.q.z-s.p.z)*t+s.nz*depth/2;const g=new THREE.BoxGeometry(w,hh,depth);g.rotateY(Math.atan2(s.nx,s.nz));g.translate(x,y,z);addC(x,z,mat,g);}
function nearWall(x,z,r){let best=null,bd=r;const cx=Math.floor(x/GC),cz=Math.floor(z/GC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=BSEG.get((cx+i)*100003+cz+j);if(L)for(const s of L){const d=segDist({x,z},s.p,s.q).d;if(d<bd&&s.used<2){bd=d;best=s;}}}return best;}
const frameM=std('#2c2e31',.5,.6),awnM=['#7a2626','#2b4f7a','#2f5a35','#4a4a4a','#8a5a1e'].map(c=>std(c,.7,0));
function storefront(s,along,w,text,zone,poiType){
  s.used++;const closed=!text&&Math.random()<.25;
  wallBox(frameM,s,along,w+.3,4.15,.5,.45);
  if(closed&&AS.gltf.rollershutter_door){const t=along/s.L;SHUTTERS.push({x:s.p.x+(s.q.x-s.p.x)*t+s.nx*.03,y:0,z:s.p.z+(s.q.z-s.p.z)*t+s.nz*.03,ry:Math.atan2(s.nx,s.nz),sx:w/1.08,sy:3.6/2.4,sz:1});}
  else{wallPlane(INT_MATS[Math.floor(Math.random()*4)],[0,0,1,0,1,1,0,1],s,along,w-.2,.05,3.85,.04);wallPlane(std('#9fb4c0',.05,.9,{transparent:true,opacity:.2}),[0,0,1,0,1,1,0,1],s,along,w-.2,.05,3.85,.3);
    const t=along/s.L;GLOWS.push({x:s.p.x+(s.q.x-s.p.x)*t+s.nx*1.2,y:2.2,z:s.p.z+(s.q.z-s.p.z)*t+s.nz*1.2,c:0xffd8a0,s:3.2});}
  const style=zone==='night'||poiType==='bar'||poiType==='pub'||poiType==='nightclub'?(Math.random()<.6?'neon':'dark'):pick(['red','green','blue','yellow','white','dark','orange']);
  const sc=signCell(text||pick(SHOPS_G[zone]),style);const sw=Math.min(w,7);wallPlane(sc.m,sc.uv,s,along,sw,4.45,4.45+sw/4,.5);
  if(Math.random()<.45){const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(1.3,-.45);sh.lineTo(1.3,-.6);sh.lineTo(0,-.08);const g=new THREE.ExtrudeGeometry(sh,{depth:w-.4,bevelEnabled:false});g.translate(0,0,-(w-.4)/2);g.rotateY(Math.atan2(s.nx,s.nz)-Math.PI/2);const t=along/s.L;const x=s.p.x+(s.q.x-s.p.x)*t+s.nx*.45,z=s.p.z+(s.q.z-s.p.z)*t+s.nz*.45;g.translate(x,3.85,z);addC(x,z,pick(awnM),g);}
  if(/烧烤|夜宵|小龙虾|烤串|麻辣烫|小吃|面|馄饨|生煎/.test(text||'')){for(let k=0;k<randi(2,4);k++){const t=(along+rand(-w/2,w/2))/s.L;(Math.random()<.6?CHAIRS:STOOLS).push({x:s.p.x+(s.q.x-s.p.x)*t+s.nx*rand(1.6,3),y:0,z:s.p.z+(s.q.z-s.p.z)*t+s.nz*rand(1.6,3),ry:rand(0,6.28)});}}
  if(zone!=='com'&&Math.random()<.3){const t=(along+rand(-w/3,w/3))/s.L;BIKES.push({x:s.p.x+(s.q.x-s.p.x)*t+s.nx*1.2,z:s.p.z+(s.q.z-s.p.z)*t+s.nz*1.2,ry:Math.atan2(s.nx,s.nz),dx:s.q.x-s.p.x,dz:s.q.z-s.p.z,n:randi(2,5)});}
}
const SHOPS_G={res:['烟纸店','生煎馒头','水果店','美发','裁缝铺','五金交电','早点','大药房','福利彩票','菜场','修鞋配钥匙','粮油店'],com:['便利店','咖啡','奶茶','银行','大药房','眼镜','面包房','手机维修','健身房','房产中介','花店','火锅','书店','快餐'],night:['足浴按摩','烧烤','清吧','KTV','便利店','夜宵','小龙虾','台球','精酿啤酒','烤串','麻辣烫','沙县小吃']};
{let n=0;for(const p of POI){if(n>1000)break;const s=nearWall(p.x,p.z,18);if(!s||s.h<4)continue;const t=segDist(p,s.p,s.q).t*s.L;const w=Math.min(s.L-1,rand(5,8));if(w<3.5)continue;storefront(s,clamp(t,w/2+.2,s.L-w/2-.2),w,p.n.slice(0,12),zoneOf(p.x,p.z),p.t);n++;}
  // 临街的普通店面：商圈和老街
  for(const e of RE){if(e.c>4||e.L<40)continue;for(let sd=-1;sd<=1;sd+=2)for(let s0=15;s0<e.L-15;s0+=rand(14,30)){const p=pointAt(e,s0),z=zoneOf(p.x,p.z);if(z==='res'&&Math.random()<.6)continue;const q={x:p.x-p.dz*sd*(e.w/2+5),z:p.z+p.dx*sd*(e.w/2+5)};const s=nearWall(q.x,q.z,8);if(!s||s.used||s.h<4||s.L<6)continue;const w=Math.min(s.L-1,rand(5,8));storefront(s,s.L/2,w,null,z);}}
}
// ---- 行道树、路灯、垃圾桶、配电箱 ----
for(let k=0;k<MAP.T.length;k+=2)TREES.push({x:MAP.T[k],z:MAP.T[k+1],s:rand(.85,1.2),r:rand(0,6.28)});
for(const e of RE){
  if(e.c<1||e.c>4)continue;const ta=RV[e.a].e.length>=3?vMaxW[e.a]/2+6:4,tb=RV[e.b].e.length>=3?vMaxW[e.b]/2+6:4;
  const tree=e.c>=2;const step=e.c<=2?12:10;
  for(const sd of[1,-1]){for(let s=ta;s<e.L-tb;s+=step){const p=pointAt(e,s);const o=e.w/2+1.3;const x=p.x-p.dz*sd*o,z=p.z+p.dx*sd*o;
      if(tree&&!onRoadSurf(x,z,-.5)&&!nearWall(x,z,1.6))TREES.push({x,z,y:.16,s:rand(.85,1.25),r:rand(0,6.28)});}
    if(e.c<=2)for(let s=ta+6;s<e.L-tb;s+=44){const p=pointAt(e,s);const o=e.w/2+.6;LAMPS.push({y:.16,x:p.x-p.dz*sd*o,z:p.z+p.dx*sd*o,ry:Math.atan2(p.dz*sd,-p.dx*sd)+Math.PI/2*0,nx:p.dz*sd,nz:-p.dx*sd});}
    if(Math.random()<.14){const s=rand(ta,Math.max(ta+1,e.L-tb)),p=pointAt(e,s),o=e.w/2+.9;const x=p.x-p.dz*sd*o,z=p.z+p.dx*sd*o;if(Math.random()<.5)TRASH.push({x,y:.16,z,ry:rand(0,6.28)});else UTILS.push({x,y:.16,z,ry:Math.atan2(-p.dz*sd,p.dx*sd),k:Math.random()<.5?1:2});}
  }
  if(e.c<=4&&Math.random()<.5){const p=pointAt(e,rand(0,e.L));const g=new THREE.CircleGeometry(.4,16);g.rotateX(-Math.PI/2);g.translate(p.x+rand(-1,1),.035,p.z+rand(-1,1));addC(p.x,p.z,manholeMat,g,false);}
}

// ---- 信号灯 ----
for(const v of SIGV){const V=RV[v];for(const ei of V.e){const e=RE[ei];if(e.c>4)continue;const fromA=e.a===v;const s=fromA?vMaxW[v]/2+2.5:e.L-vMaxW[v]/2-2.5;if(s<0||s>e.L)continue;const p=pointAt(e,s);
  const dirx=fromA?-p.dx:p.dx,dirz=fromA?-p.dz:p.dz; // 车辆驶向路口的方向
  const rx=-dirz,rz=dirx; // 右手侧
  const off=e.w/2+1.2;SIGNALS.push({x:V.x-dirx*(vMaxW[v]/2+2)+rx*off*0+(-rx)*0+(p.x-V.x)*0,z:0,ax:Math.abs(dirx)>Math.abs(dirz)?'x':'z',dir:1,ry:0,_p:p,_d:[dirx,dirz],_r:[rx,rz],_o:off});}}
for(const s of SIGNALS){const[dx,dz]=s._d,[rx,rz]=s._r;s.x=s._p.x+(-rx)*s._o*-1;s.z=s._p.z+(-rz)*s._o*-1;s.x=s._p.x+rx*s._o;s.z=s._p.z+rz*s._o;s.ry=Math.atan2(-dx,-dz);}
// ---- 高架 ----
const elevLight=new THREE.MeshBasicMaterial({color:0x6fd0ff}),bridgeLights=new THREE.MeshBasicMaterial({color:0xffd27a});
for(const el of MAP.EL||[]){const pts=[];for(let k=0;k<el.p.length;k+=2)pts.push({x:el.p[k],z:el.p[k+1]});if(pts.length<2)continue;const w=Math.max(10,el.w),Y=9.5;
  const b=GB();ribbon(b,pts,-w/2,w/2,Y,false);const bb=GB();ribbon(bb,pts,-w/2,w/2,Y-1.4,false);for(let k=0;k<bb.i.length;k+=3){const t=bb.i[k+1];bb.i[k+1]=bb.i[k+2];bb.i[k+2]=t;}for(let k=1;k<bb.n.length;k+=3)bb.n[k]=-1;
  const m=pts[Math.floor(pts.length/2)];addC(m.x,m.z,roadW,gbGeo(b));addC(m.x,m.z,concreteMat,gbGeo(bb));
  let acc=0;for(let k=0;k<pts.length-1;k++){const a=pts[k],c=pts[k+1],L=Math.hypot(c.x-a.x,c.z-a.z);const dx=(c.x-a.x)/L,dz=(c.z-a.z)/L;
    for(const sd of[1,-1]){const g=new THREE.BoxGeometry(.3,1.1,L);g.rotateY(Math.atan2(dx,dz));g.translate((a.x+c.x)/2-dz*sd*w/2,Y+.55,(a.z+c.z)/2+dx*sd*w/2);addC(a.x,a.z,concreteMat,g);
      const g2=new THREE.BoxGeometry(.12,.12,L);g2.rotateY(Math.atan2(dx,dz));g2.translate((a.x+c.x)/2-dz*sd*(w/2-.3),Y-1.45,(a.z+c.z)/2+dx*sd*(w/2-.3));addC(a.x,a.z,elevLight,g2,false);}
    for(let s=(30-acc%30);s<L;s+=30){const x=a.x+dx*s,z=a.z+dz*s;const g=new THREE.CylinderGeometry(1.1,1.2,Y-1.4,14);g.translate(x,(Y-1.4)/2,z);addC(x,z,concreteMat,g);const cap=new THREE.BoxGeometry(w*.7,1.2,2.2);cap.rotateY(Math.atan2(dx,dz));cap.translate(x,Y-2,z);addC(x,z,concreteMat,cap);PILLARS.push({x,z,r:1.2});}
    acc+=L;}
}
// ---- 绿地 / 水面 ----
const grassC=canvasOf(256,256,(g,w,h)=>{g.fillStyle='#4f6b32';g.fillRect(0,0,w,h);for(let k=0;k<9000;k++){g.fillStyle=`hsla(${rand(70,105)},${rand(30,50)}%,${rand(18,40)}%,.7)`;g.fillRect(rand(0,w),rand(0,h),1.5,rand(2,5));}});
const grassM=new THREE.MeshStandardMaterial({map:texFromCanvas(grassC,true),normalMap:normalFromHeight(grassC,2),roughness:.95,polygonOffset:true,polygonOffsetFactor:-1});
const waterM=new THREE.MeshStandardMaterial({color:0x1d2d33,roughness:.12,metalness:.6});
for(const[list,mat,y]of[[MAP.G||[],grassM,.025],[MAP.W||[],waterM,.015]])for(const flat of list){const ring=[];for(let i=0;i<flat.length;i+=2)ring.push({x:flat[i],z:flat[i+1]});if(ring.length<3)continue;
  const tri=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p.x,p.z)),[]);const b=GB();for(const p of ring){b.p.push(p.x,y,p.z);b.n.push(0,1,0);b.u.push(p.x/6,p.z/6);}
  for(const[a,c,d]of tri){const A2=ring[a],C2=ring[c],D2=ring[d];const cr=(C2.x-A2.x)*(D2.z-A2.z)-(C2.z-A2.z)*(D2.x-A2.x);if(cr<0)b.i.push(a,c,d);else b.i.push(a,d,c);}
  let cx=0,cz=0;for(const p of ring){cx+=p.x;cz+=p.z;}addC(cx/ring.length,cz/ring.length,mat,gbGeo(b),false);
  if(mat===grassM){let A=0;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];A+=p.x*q.z-q.x*p.z;}const n=Math.min(40,Math.abs(A)/2/180);for(let k=0;k<n;k++){const a=ring[randi(0,ring.length-1)],c=ring[randi(0,ring.length-1)],t=Math.random();const x=lerp(a.x,c.x,t)*.6+cx/ring.length*.4,z=lerp(a.z,c.z,t)*.6+cz/ring.length*.4;if(!onRoadSurf(x,z,-1))TREES.push({x,z,s:rand(.9,1.4),r:rand(0,6.28)});}}}
flushC();
// ---- 剧情地点 ----
function landmark(spot,text,style,glow){const sw=sidewalkOf(spot);const n=nearWall(sw.x,sw.z,30);if(n){n.used=0;const t=segDist(sw,n.p,n.q).t*n.L;storefront(n,clamp(t,4,n.L-4),Math.min(8,n.L-1),text,'res');n.used=9;}
  if(glow)GLOWS.push({x:sw.x,y:2.4,z:sw.z,c:glow,s:6});}
landmark(PLACES.shop.spot,'老陈面馆','red',0xffc070);landmark(PLACES.bar.spot,'退潮 LOW TIDE','neon',0x9a6fff);
{const sw=sidewalkOf(PLACES.home.spot);const n=nearestEdge(PLACES.home.spot.x,PLACES.home.spot.z,40);const nx=sw.x-n.x,nz=sw.z-n.z,L=Math.hypot(nx,nz)||1;const ux=nx/L,uz=nz/L,tx=-uz,tz=ux;
  const stoneM=std('#6e4a3c',.85,0);const X=sw.x+ux*4.5,Z=sw.z+uz*4.5;
  for(const s of[-1,1]){const g=new THREE.BoxGeometry(.75,5.6,.75);g.translate(X+tx*s*3,2.8,Z+tz*s*3);addC(X,Z,stoneM,g);}
  const top=new THREE.BoxGeometry(7,1,.8);top.rotateY(Math.atan2(tx,tz)+Math.PI/2);top.translate(X,6.1,Z);addC(X,Z,stoneM,top);
  const sc=signCell('永 安 里','white');const pl=new THREE.PlaneGeometry(4.5,1.1);const b={p:[],n:[],u:[],i:[]};
  const m=new THREE.Mesh(pl,sc.m);const uv=pl.attributes.uv;const U=sc.uv;uv.setXY(0,U[6],U[7]);uv.setXY(1,U[4],U[5]);uv.setXY(2,U[0],U[1]);uv.setXY(3,U[2],U[3]);
  m.position.set(X-ux*.42,6.1,Z-uz*.42);m.rotation.y=Math.atan2(-ux,-uz);city.add(m);GLOWS.push({x:X-ux,y:5.8,z:Z-uz,c:0xffd9a0,s:2.2});}
flushC();
const towerGlow=new THREE.MeshStandardMaterial({color:0xc85a8a,emissive:0xff4f9a,emissiveIntensity:0});
const shutterMat0=shutterMat;
