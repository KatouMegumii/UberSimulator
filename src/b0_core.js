'use strict';
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div id="loadErr">无法加载 Three.js（需要联网访问 cdn.jsdelivr.net 或 unpkg.com）。<br>请联网后用 Chrome / Edge 打开本文件。</div>');throw new Error('THREE missing');}
// ================= 工具 =================
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function wpick(w){let s=0;for(const v of w)s+=v;let r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}return w.length-1;}
let _seed=20261124;
function srand(){_seed|=0;_seed=_seed+0x6D2B79F5|0;let t=Math.imul(_seed^_seed>>>15,1|_seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const sr=(a,b)=>a+srand()*(b-a);const spick=a=>a[Math.floor(srand()*a.length)];
const pad=n=>String(n).padStart(2,'0');
const fmt=m=>{m=((Math.floor(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60);};
const WD=['周一','周二','周三','周四','周五','周六','周日'];
const dayOf=t=>Math.floor(t/1440)+1;
const wdOf=t=>(4+Math.floor(t/1440))%7; // 第1天=周五
const dateStr=t=>`第${dayOf(t)}天 · ${WD[wdOf(t)]}`;
const whenStr=t=>{const d=dayOf(t)-dayOf(S.t);return (d===0?'今天':d===1?'明天':d===-1?'昨天':WD[wdOf(t)])+' '+fmt(t%1440);};

// ================= 城市常量 =================
const R=[-300,-200,-100,0,100,200,300], HW=7, LIM=307, KM=4;
const EW=['安顺路','延西路','长宁支路','新华路','梧桐路','复兴西路','桥西南路']; // z 固定，东西向
const NS=['武夷路','华山支路','乌鲁木齐路','常熟路','襄阳路','永福路','滨江路']; // x 固定，南北向
const ZK=['res','com','night'], ZI={res:0,com:1,night:2};
const ZN={res:'永安里住宅区',com:'常熟路商圈',night:'永福路酒吧街'};
const zoneOf=x=>{const i=clamp(Math.floor((x+300)/100),0,5);return i<2?'res':i<4?'com':'night';};
const nIdx=v=>clamp(Math.round((v+300)/100),0,6);
const PLACES={
  home:{name:'永安里 · 家',spot:{x:-205,z:50}},
  shop:{name:'老陈面馆',spot:{x:-150,z:-5}},
  bar:{name:'退潮酒吧',spot:{x:195,z:-50}},
  linHome:{name:'梧桐路 · 弄堂口',spot:{x:-140,z:105}},
  exit:{name:'外环入口（往虹桥）',spot:{x:-300,z:200}},
};
const PILLARS=[];for(let k=0;k<6;k++)PILLARS.push({x:-250+100*k,z:-200,r:1.3});
function onRoad(x,z,m){
  if(Math.abs(x)>LIM-m||Math.abs(z)>LIM-m)return false;
  return Math.abs(x-R[nIdx(x)])<HW-m||Math.abs(z-R[nIdx(z)])<HW-m;
}
function legal(x,z){const m=1.1;if(!onRoad(x,z,m))return false;for(const p of PILLARS)if((x-p.x)**2+(z-p.z)**2<(p.r+m)**2)return false;return true;}
function sidewalkOf(p){ // 乘客站的人行道位置
  const ix=nIdx(p.x),iz=nIdx(p.z);
  if(Math.abs(p.x-R[ix])<HW&&Math.abs(p.z-R[iz])>=HW){const s=Math.sign(p.x-R[ix])||1;return{x:R[ix]+s*8.6,z:p.z};}
  const s=Math.sign(p.z-R[iz])||1;return{x:p.x,z:R[iz]+s*8.6};
}
function placeName(p){
  for(const k in PLACES)if(dist(p,PLACES[k].spot)<7)return PLACES[k].name;
  const ix=nIdx(p.x),iz=nIdx(p.z);
  if(Math.abs(p.z-R[iz])<HW)return EW[iz]+' · 近'+NS[nIdx(p.x)];
  return NS[ix]+' · 近'+EW[nIdx(p.z)];
}
function randRoadPoint(zone){
  for(let k=0;k<60;k++){
    const ew=Math.random()<.5,line=randi(0,6),seg=randi(0,5),a=R[seg]+rand(16,84),side=Math.random()<.5?1:-1;
    const p=ew?{x:a,z:R[line]+side*5}:{x:R[line]+side*5,z:a};
    if(Math.abs(p.x)>305||Math.abs(p.z)>305)continue;
    if(zone&&zoneOf(p.x)!==zone)continue;
    let bad=false;for(const q in PLACES)if(dist(p,PLACES[q].spot)<14)bad=true;if(bad)continue;
    return p;
  }
  return{x:5,z:50};
}

// ================= 导航寻路 =================
function anchors(p){
  const ix=nIdx(p.x),iz=nIdx(p.z),res=[];
  const onEW=Math.abs(p.z-R[iz])<HW+1,onNS=Math.abs(p.x-R[ix])<HW+1;
  if(onEW){const a=clamp(Math.floor((p.x+300)/100),0,5);for(const k of[a,a+1])res.push({i:k,j:iz,cost:Math.abs(p.x-R[k]),ax:'x'});}
  if(onNS){const a=clamp(Math.floor((p.z+300)/100),0,5);for(const k of[a,a+1])res.push({i:ix,j:k,cost:Math.abs(p.z-R[k]),ax:'z'});}
  if(!res.length)res.push({i:ix,j:iz,cost:Math.hypot(p.x-R[ix],p.z-R[iz]),ax:'x'});
  return res;
}
function routeLen(path){let L=0;for(let k=1;k<path.length;k++)L+=dist(path[k-1],path[k]);return L;}
function findRoute(from,to,heading){
  // 同一路段直达
  const ix=nIdx(from.x),iz=nIdx(from.z),tx=nIdx(to.x),tz=nIdx(to.z);
  if(Math.abs(from.z-R[iz])<HW&&Math.abs(to.z-R[tz])<HW&&iz===tz&&Math.floor((from.x+300)/100)===Math.floor((to.x+300)/100))return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  if(Math.abs(from.x-R[ix])<HW&&Math.abs(to.x-R[tx])<HW&&ix===tx&&Math.floor((from.z+300)/100)===Math.floor((to.z+300)/100))return[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  let best=null;
  for(const a of anchors(from))for(const b of anchors(to)){
    let c=a.cost+Math.abs(a.i-b.i)*100+Math.abs(a.j-b.j)*100+b.cost;
    if(heading!==undefined){const fx=-Math.sin(heading),fz=-Math.cos(heading);const dx=R[a.i]-from.x,dz=R[a.j]-from.z;const L=Math.hypot(dx,dz)||1;if((dx*fx+dz*fz)/L<-.3&&L>8)c+=140;}
    if(!best||c<best.c)best={a,b,c};
  }
  const {a,b}=best,pts=[{x:from.x,z:from.z},{x:R[a.i],z:R[a.j]}];
  if(a.i!==b.i&&a.j!==b.j){ // L 形，优先沿原方向继续
    if(a.ax==='x')pts.push({x:R[b.i],z:R[a.j]});else pts.push({x:R[a.i],z:R[b.j]});
  }
  pts.push({x:R[b.i],z:R[b.j]},{x:to.x,z:to.z});
  const out=[];for(const p of pts){const l=out[out.length-1];if(!l||dist(l,p)>.5)out.push(p);}
  // 去掉共线点
  for(let k=out.length-2;k>0;k--){const p=out[k-1],q=out[k],r=out[k+1];const cr=(q.x-p.x)*(r.z-q.z)-(q.z-p.z)*(r.x-q.x);const dt=(q.x-p.x)*(r.x-q.x)+(q.z-p.z)*(r.z-q.z);if(Math.abs(cr)<1e-3&&dt>0)out.splice(k,1);}
  return out;
}
function segDist(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1;let t=((p.x-a.x)*dx+(p.z-a.z)*dz)/L2;t=clamp(t,0,1);return{d:Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz),t};}
function roadNameOfSeg(a,b){if(Math.abs(a.z-b.z)<1)return EW[nIdx(a.z)];if(Math.abs(a.x-b.x)<1)return NS[nIdx(a.x)];return'';}

