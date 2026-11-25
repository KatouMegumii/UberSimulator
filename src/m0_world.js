
// ================= 真实地图（OSM：徐汇 / 静安 / 长宁交界）=================
const MAP=AS.map;
const KM=1,TR=.2; // 地图为真实米制；时间：现实 1 秒 = 游戏 0.2 分钟（12 秒）
const ZK=['res','com','night'],ZI={res:0,com:1,night:2};
const ZN={res:'居民区',com:'商圈',night:'酒吧街'};
// ---- 路网解码 ----
const RV=[];for(let i=0;i<MAP.V.length;i+=2)RV.push({x:MAP.V[i],z:MAP.V[i+1],e:[]});
const RE=MAP.E.map(([a,b,w,c,o,n,p],i)=>{const pts=[{x:RV[a].x,z:RV[a].z}];for(let k=0;k<p.length;k+=2)pts.push({x:p[k],z:p[k+1]});pts.push({x:RV[b].x,z:RV[b].z});
  const cum=[0];for(let k=1;k<pts.length;k++)cum.push(cum[k-1]+Math.hypot(pts[k].x-pts[k-1].x,pts[k].z-pts[k-1].z));
  const e={i,a,b,w,c,o,n,pts,cum,L:cum[cum.length-1]};RV[a].e.push(i);RV[b].e.push(i);return e;});
const BOUNDS=MAP.bounds;
// ---- 空间索引 ----
const GC=48,GIX=new Map();
const gkey=(cx,cz)=>cx*100003+cz;
for(const e of RE)for(let k=0;k<e.pts.length-1;k++){const p=e.pts[k],q=e.pts[k+1],r=e.w/2+2;
  const x0=Math.floor((Math.min(p.x,q.x)-r)/GC),x1=Math.floor((Math.max(p.x,q.x)+r)/GC),z0=Math.floor((Math.min(p.z,q.z)-r)/GC),z1=Math.floor((Math.max(p.z,q.z)+r)/GC);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){const kk=gkey(cx,cz);if(!GIX.has(kk))GIX.set(kk,[]);GIX.get(kk).push(e.i*1024+k);}}
function segDist(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1;let t=((p.x-a.x)*dx+(p.z-a.z)*dz)/L2;t=clamp(t,0,1);return{d:Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz),t};}
const _ne={e:null,k:0,t:0,d:1e9};
function nearestEdge(x,z,maxR=60,filter){
  let best=null,bd=1e9;const p={x,z};const rr=Math.ceil(maxR/GC);const cx=Math.floor(x/GC),cz=Math.floor(z/GC);
  for(let ring=0;ring<=rr;ring++){
    for(let ix=cx-ring;ix<=cx+ring;ix++)for(let iz=cz-ring;iz<=cz+ring;iz++){if(Math.max(Math.abs(ix-cx),Math.abs(iz-cz))!==ring)continue;const L=GIX.get(gkey(ix,iz));if(!L)continue;
      for(const v of L){const e=RE[v>>10],k=v&1023;if(filter&&!filter(e))continue;const r=segDist(p,e.pts[k],e.pts[k+1]);const dd=r.d-e.w/2*.0;if(dd<bd){bd=dd;best={e,k,t:r.t,d:r.d};}}}
    if(best&&best.d<(ring)*GC)break;}
  if(best){const e=best.e,a=e.pts[best.k],b=e.pts[best.k+1];best.s=e.cum[best.k]+best.t*(e.cum[best.k+1]-e.cum[best.k]);best.x=a.x+(b.x-a.x)*best.t;best.z=a.z+(b.z-a.z)*best.t;
    const L=Math.hypot(b.x-a.x,b.z-a.z)||1;best.dx=(b.x-a.x)/L;best.dz=(b.z-a.z)/L;}
  return best;}
function pointAt(e,s){s=clamp(s,0,e.L);let k=1;while(k<e.cum.length-1&&e.cum[k]<s)k++;const a=e.pts[k-1],b=e.pts[k],seg=e.cum[k]-e.cum[k-1]||1,t=(s-e.cum[k-1])/seg;
  const dx=(b.x-a.x)/seg,dz=(b.z-a.z)/seg;return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,dx,dz};}
const PILLARS=[];
function onRoadSurf(x,z,m){const cx=Math.floor(x/GC),cz=Math.floor(z/GC),L=GIX.get(gkey(cx,cz));if(!L)return false;const p={x,z};
  for(const v of L){const e=RE[v>>10],k=v&1023;if(segDist(p,e.pts[k],e.pts[k+1]).d<e.w/2-m+.6)return true;}return false;}
function legal(x,z){if(!onRoadSurf(x,z,1))return false;for(const p of PILLARS)if(Math.abs(p.x-x)<4&&Math.abs(p.z-z)<4&&(x-p.x)**2+(z-p.z)**2<(p.r+1)**2)return false;return true;}
// ---- 区域 ----
function zoneOf(x,z){const Z=MAP.Z;const i=Math.floor((x-Z.x0)/Z.cell),j=Math.floor((z-Z.z0)/Z.cell);const row=Z.d[clamp(j,0,Z.h-1)];const ch=row?row[clamp(i,0,Z.w-1)]:'r';return ch==='n'?'night':ch==='c'?'com':'res';}
// ---- 地点 ----
function curbSpot(x,z,side=1,along=0,filter){const n=nearestEdge(x,z,200,filter||(e=>e.c>=2));const p=pointAt(n.e,n.s+along);const nx=-p.dz*side,nz=p.dx*side,off=n.e.w/2-1.4;return{x:p.x+nx*off,z:p.z+nz*off,h:Math.atan2(-p.dx,-p.dz),e:n.e.i};}
const _exitE=RE.filter(e=>e.c<=1).sort((a,b)=>Math.min(a.pts[0].x,a.pts[a.pts.length-1].x)-Math.min(b.pts[0].x,b.pts[b.pts.length-1].x))[0];
const PLACES={
  home:{name:'五原路 · 永安里',spot:curbSpot(370,62,1,0,e=>e.n==='五原路')},
  shop:{name:'老陈面馆（乌鲁木齐中路）',spot:curbSpot(442,290,1,30,e=>e.n==='乌鲁木齐中路')},
  bar:{name:'退潮酒吧（永福路）',spot:curbSpot(190,282,-1,-60,e=>e.n==='永福路')},
  linHome:{name:'安福路 · 弄堂口',spot:curbSpot(174,-98,1,0,e=>e.n==='安福路')},
  exit:{name:'延安高架 · 往虹桥机场',spot:(()=>{const e=_exitE,p=e.pts[0].x<e.pts[e.pts.length-1].x?e.pts[0]:e.pts[e.pts.length-1];return{x:p.x,z:p.z};})()},
};
const POI=(MAP.POI||[]).map(([x,z,n,t])=>({x,z,n,t}));
const POIX=new Map();for(const p of POI){const k=gkey(Math.floor(p.x/GC),Math.floor(p.z/GC));if(!POIX.has(k))POIX.set(k,[]);POIX.get(k).push(p);}
function nearPOI(x,z,r){let best=null,bd=r;const cx=Math.floor(x/GC),cz=Math.floor(z/GC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=POIX.get(gkey(cx+i,cz+j));if(L)for(const p of L){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;best=p;}}}return best;}
function crossName(e,s){const v=s<e.L/2?RV[e.a]:RV[e.b];for(const ei of v.e){const o=RE[ei];if(o.n&&o.n!==e.n)return o.n;}const v2=s<e.L/2?RV[e.b]:RV[e.a];for(const ei of v2.e){const o=RE[ei];if(o.n&&o.n!==e.n)return o.n;}return '';}
function placeName(p){
  for(const k in PLACES)if(dist(p,PLACES[k].spot)<12)return PLACES[k].name;
  const n=nearestEdge(p.x,p.z,80);const po=nearPOI(p.x,p.z,30);
  const road=n&&n.e.n?n.e.n:'小路';if(po)return road+' · '+po.n;const cr=n?crossName(n.e,n.s):'';return road+(cr?' · 近'+cr:'');
}
function roadNameOfSeg(a,b){const n=nearestEdge((a.x+b.x)/2,(a.z+b.z)/2,40);return n&&n.e.n||'小路';}
const DRIVE_EDGES=RE.filter(e=>e.c>=1&&e.c<=5&&e.L>25),DRIVE_W=[];{let s=0;for(const e of DRIVE_EDGES){s+=e.L*(e.c<=3?1.4:1);DRIVE_W.push(s);}}
function randRoadPoint(zone){
  const tot=DRIVE_W[DRIVE_W.length-1];
  for(let k=0;k<80;k++){const r=Math.random()*tot;let lo=0,hi=DRIVE_W.length-1;while(lo<hi){const m=(lo+hi)>>1;if(DRIVE_W[m]<r)lo=m+1;else hi=m;}
    const e=DRIVE_EDGES[lo];const p=pointAt(e,rand(8,e.L-8));const side=Math.random()<.5?1:-1,off=e.w/2-1.4;const q={x:p.x-p.dz*side*off,z:p.z+p.dx*side*off};
    if(zone&&zoneOf(q.x,q.z)!==zone)continue;if(Math.hypot(q.x-car.x,q.z-car.z)>2600)continue;
    let bad=false;for(const s in PLACES)if(dist(q,PLACES[s].spot)<20)bad=true;if(bad)continue;return q;}
  return pointAt(DRIVE_EDGES[0],10);
}
function sidewalkOf(p){const n=nearestEdge(p.x,p.z,80);if(!n)return{x:p.x,z:p.z};const side=Math.sign((p.x-n.x)*-n.dz+(p.z-n.z)*n.dx)||1;const off=n.e.w/2+1.8;return{x:n.x-n.dz*side*off,z:n.z+n.dx*side*off};}
// ---- 导航：A* ----
function heapPush(h,it){h.push(it);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p;}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;}}return top;}
function edgePts(e,fromA,s0,s1){ // 沿边取点（s0→s1，含端点）
  const out=[];const lo=Math.min(s0,s1),hi=Math.max(s0,s1);const a=pointAt(e,lo);out.push({x:a.x,z:a.z});for(let k=1;k<e.pts.length-1;k++)if(e.cum[k]>lo&&e.cum[k]<hi)out.push({x:e.pts[k].x,z:e.pts[k].z});const b=pointAt(e,hi);out.push({x:b.x,z:b.z});
  return s0<=s1?out:out.reverse();}
function findRoute(from,to,heading){
  const A=nearestEdge(from.x,from.z,150),B=nearestEdge(to.x,to.z,150);if(!A||!B)return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  if(A.e===B.e){const pts=edgePts(A.e,true,A.s,B.s);return[{x:from.x,z:from.z},...pts,{x:to.x,z:to.z}];}
  let fdir=null;if(heading!==undefined)fdir={x:-Math.sin(heading),z:-Math.cos(heading)};
  const along=fdir?(A.dx*fdir.x+A.dz*fdir.z):0; // >0 朝 b
  const g=new Map(),prev=new Map(),h=[];const H=v=>Math.hypot(RV[v].x-to.x,RV[v].z-to.z);
  const st=[[A.e.a,A.s+(along>.3?120:0)],[A.e.b,A.e.L-A.s+(along<-.3?120:0)]];
  for(const[v,c]of st){g.set(v,c);prev.set(v,null);heapPush(h,[c+H(v),v]);}
  const goal=new Map([[B.e.a,B.s],[B.e.b,B.e.L-B.s]]);let end=null,endCost=1e18;
  while(h.length){const[f,v]=heapPop(h);const gv=g.get(v);if(f-H(v)>gv+1e-6)continue;if(gv>=endCost)break;
    if(goal.has(v)){const c=gv+goal.get(v);if(c<endCost){endCost=c;end=v;}}
    for(const ei of RV[v].e){const e=RE[ei];if(e.c>=5&&e!==B.e&&e!==A.e&&e.L>0&&Math.random()<0)continue;const u=e.a===v?e.b:e.a;const c=gv+e.L*(e.c===5?1.6:e.c<=1?.85:1);
      if(c<(g.has(u)?g.get(u):1e18)){g.set(u,c);prev.set(u,[v,ei]);heapPush(h,[c+H(u),u]);}}}
  if(end===null)return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  const chain=[];let v=end;while(prev.get(v)){const[pv,ei]=prev.get(v);chain.push([pv,v,ei]);v=pv;}chain.reverse();
  const out=[{x:from.x,z:from.z}];
  const startV=v;out.push(...edgePts(A.e,true,A.s,startV===A.e.a?0:A.e.L));
  for(const[a,b,ei]of chain){const e=RE[ei];out.push(...edgePts(e,true,e.a===a?0:e.L,e.a===a?e.L:0));}
  out.push(...edgePts(B.e,true,end===B.e.a?0:B.e.L,B.s));out.push({x:to.x,z:to.z});
  if(out.length>3&&Math.hypot(out[1].x-out[0].x,out[1].z-out[0].z)<9)out.splice(1,1);if(out.length>3){const n=out.length;if(Math.hypot(out[n-2].x-out[n-1].x,out[n-2].z-out[n-1].z)<9)out.splice(n-2,1);}
  const o2=[];for(const p of out){const l=o2[o2.length-1];if(!l||Math.hypot(l.x-p.x,l.z-p.z)>.8)o2.push(p);}
  for(let k=o2.length-2;k>0;k--){const p=o2[k-1],q=o2[k],r=o2[k+1];const cr=(q.x-p.x)*(r.z-q.z)-(q.z-p.z)*(r.x-q.x),L1=Math.hypot(q.x-p.x,q.z-p.z),L2=Math.hypot(r.x-q.x,r.z-q.z);if(Math.abs(cr)/(L1*L2+1e-6)<.03&&(q.x-p.x)*(r.x-q.x)+(q.z-p.z)*(r.z-q.z)>0)o2.splice(k,1);}
  return o2;
}
function routeLen(path){let L=0;for(let k=1;k<path.length;k++)L+=dist(path[k-1],path[k]);return L;}
