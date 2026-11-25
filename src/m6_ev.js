
// ================= 充电：真实充电站 + 特来电 App =================
const EV={cap:53,kwh:53*.86,charging:null,warned:{}};
// 充电站：OSM 里的真实充电站 + 主干道旁的停车场补点（特来电 / 国家电网 / 星星充电）
const CSTN=[];
{const OP=['特来电','特来电','国家电网','星星充电'];let id=1;
  for(const[x,z,n]of MAP.CS||[]){const sp=curbSpot(x,z,1,0,e=>e.c>=2&&e.c<=4);CSTN.push({id:id++,x:sp.x,z:sp.z,h:sp.h,sx:x,sz:z,name:(/充电/.test(n)?n:n+'充电站'),op:/特来电|TELD/i.test(n)?'特来电':pick(OP),piles:randi(4,10),real:true});}
  const cand=RE.filter(e=>e.c>=2&&e.c<=3&&e.L>120);for(let k=0;k<22&&cand.length;k++){const e=cand[Math.floor(Math.random()*cand.length)];const p=pointAt(e,e.L/2);if(CSTN.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<500))continue;const sp=curbSpot(p.x,p.z,1,0,q=>q===e);
    const nm=(e.n||'路边')+' '+pick(['停车场','公共停车场','地面停车场','园区'])+'充电站';CSTN.push({id:id++,x:sp.x,z:sp.z,h:sp.h,name:nm,op:pick(OP),piles:randi(4,12),real:false});}
  for(const c of CSTN){c.free=randi(1,c.piles);c.kw=pick([60,120,120,160]);}
}
function evPrice(t){const m=t%1440,h=m/60;const peak=(h>=8&&h<11)||(h>=13&&h<15)||(h>=18&&h<21),valley=h>=22||h<6;return{ele:peak?1.07:valley?.31:.66,svc:valley?.4:.8,tag:peak?'峰时':valley?'谷时':'平时'};}
// 充电桩模型 + 车位标线
{const P=typeof normParts==='function'?normParts('charger',1.9):null;const list=[],sb=GB();
  for(const c of CSTN){const nx=Math.sin(c.h),nz=Math.cos(c.h);const ox=-nz,oz=nx; // 朝人行道方向
    for(let k=0;k<4;k++){const a=(k-1.5)*3.2;const x=c.x+(-Math.sin(c.h))*a+ox*-2.6,z=c.z+(-Math.cos(c.h))*a+oz*-2.6;if(inBuilding(x,z,.4))continue;list.push({x,y:.16,z,ry:c.h+Math.PI});}
    GLOWS.push({x:c.x,y:2.2,z:c.z,c:0x6fe0ff,s:3});}
  if(P){instParts(P,list,city,true,'near');for(const m of city.children.slice(-P.length))m.frustumCulled=false;}
  const signs=CSTN.map(c=>{const sc=signCell(c.op+' 充电','blue');const pl=new THREE.PlaneGeometry(2.6,.7);const uv=pl.attributes.uv;const U=sc.uv;uv.setXY(0,U[6],U[7]);uv.setXY(1,U[4],U[5]);uv.setXY(2,U[0],U[1]);uv.setXY(3,U[2],U[3]);pl.rotateY(c.h+Math.PI);const ox=Math.cos(c.h),oz=-Math.sin(c.h);pl.translate(c.x+ox*3.6,3.4,c.z+oz*3.6);addC(c.x,c.z,sc.m,pl,false);
    const post=new THREE.CylinderGeometry(.06,.06,3.2,8);post.translate(c.x+ox*3.62,1.6,c.z+oz*3.62);addC(c.x,c.z,std('#4a4e54',.4,.7),post);});
  flushC();}
// ---- 电量消耗（按里程）----
let _evLast=null;
function evUpdate(dt){if(S.loc!=='car')return;
  if(_evLast){const d=Math.hypot(car.x-_evLast.x,car.z-_evLast.z);if(d<50){const kwh=d/1000*(.14+Math.abs(car.accel)*.004+(Math.abs(car.speed)>16?.03:0));EV.kwh=Math.max(0,EV.kwh-kwh);}}
  _evLast={x:car.x,z:car.z};S.battery=EV.kwh/EV.cap*100;
  for(const lv of[20,10,5])if(S.battery<lv&&!EV.warned[lv]){EV.warned[lv]=1;notify('ev','特来电',`电量剩余 ${lv}%，附近有 ${CSTN.filter(c=>Math.hypot(c.x-car.x,c.z-car.z)<2500).length} 个充电站，打开特来电查看`);}
  if(S.battery>25)EV.warned={};
  if(EV.kwh<=0&&Math.abs(car.speed)>.1){car.speed*=.9;if(!EV.dead){EV.dead=1;if(S.online)setOnline(false);
    openModal(`<h2>电量耗尽</h2><p>车停在了路边，没法再开了。</p><button class="opt" data-act="ev" data-arg="tow">叫拖车送到最近的充电站（¥200）</button><button class="opt" data-act="ev" data-arg="close">先等等</button>`);}}
  if(EV.kwh>0)EV.dead=0;
  const ch=EV.charging;if(ch){if(Math.hypot(car.x-ch.x,car.z-ch.z)>25){evStop('车辆驶离，充电已结束');}}
}
function evTick(){const ch=EV.charging;if(!ch)return;const c=CSTN.find(q=>q.id===ch.id);const kw=Math.min(c.kw,S.battery<80?90:30);const add=kw/60;const need=EV.cap*ch.target/100-EV.kwh;
  if(need<=0){evStop('已充到 '+ch.target+'%');return;}const k=Math.min(add,need);EV.kwh+=k;const pr=evPrice(S.t);ch.kwh+=k;ch.cost+=k*(pr.ele+pr.svc);ch.min++;S.battery=EV.kwh/EV.cap*100;}
function evStop(why){const ch=EV.charging;if(!ch)return;EV.charging=null;const amt=Math.round(ch.cost*100)/100;const c=CSTN.find(q=>q.id===ch.id);if(c)c.free++;
  EV.bill={amt,kwh:ch.kwh,min:ch.min,name:c?c.name:'',t:S.t};if(amt>0){if(S.cash>=amt){spend(amt,'特来电 充电 · '+(c?c.name:''));notify('ev','特来电',`${why}。本次充电 ${ch.kwh.toFixed(1)} 度，${ch.min} 分钟，已从银行卡扣款 ¥${amt.toFixed(2)}`);}else{EV.debt=(EV.debt||0)+amt;notify('ev','特来电',`${why}。待支付 ¥${amt.toFixed(2)}（余额不足，请在特来电 App 补缴）`);}}logEv(`充电 ${ch.kwh.toFixed(1)} 度，花费 ¥${amt.toFixed(0)}`);renderPhone(true);}
// ---- 特来电 App ----
function evView(){const p=UI.page||'home';const pr=evPrice(S.t);
  const head=`<div class="appbar" style="background:linear-gradient(90deg,#00a0e9,#0068b7)"><span data-act="${p==='home'?'home':'ev'}" data-arg="page:home" class="back">‹</span><span>特来电</span><span></span></div>`;
  const near=CSTN.map(c=>({c,d:Math.hypot(c.x-car.x,c.z-car.z)})).sort((a,b)=>a.d-b.d).slice(0,12);
  let b=`<div class="dcard hero" style="background:linear-gradient(135deg,#0d3f6e,#082440)"><div class="muted">我的车 · 剩余电量</div><div class="big">${Math.round(S.battery)}%</div><div class="row muted"><span>约可行驶 ${Math.round(EV.kwh/.15)} 公里</span><span>${pr.tag} ¥${(pr.ele+pr.svc).toFixed(2)}/度</span></div>
    <div class="waitbar" style="margin-top:8px;background:#0f3355"><div style="width:${S.battery}%;background:${S.battery<20?'#ff6a5a':'#3fe08a'}"></div></div></div>`;
  const ch=EV.charging;
  if(ch){const c=CSTN.find(q=>q.id===ch.id);b+=`<div class="dcard hot"><div class="row"><b>正在充电 · ${c.name}</b><span class="tag g">${c.kw}kW</span></div><div class="row muted"><span>已充 ${ch.kwh.toFixed(1)} 度 · ${ch.min} 分钟</span><span>¥${ch.cost.toFixed(2)}</span></div><div class="muted">目标 ${ch.target}%</div><button class="btn pri wide" data-act="ev" data-arg="stop">结束充电并支付</button></div>`;}
  if(EV.debt)b+=`<div class="dcard warn"><div class="row"><b>待支付充电费</b><b>¥${EV.debt.toFixed(2)}</b></div><button class="btn pri wide" data-act="ev" data-arg="paydebt">立即支付</button></div>`;
  b+=`<div class="sect">附近充电站</div>`+near.map(({c,d})=>{const here=d<30&&Math.abs(car.speed)<1;return `<div class="dcard"><div class="row"><b>${c.name}</b><span class="tag ${c.free?'g':'r'}">${c.free?'空闲 '+c.free+'/'+c.piles:'已满'}</span></div>
    <div class="row muted"><span>${c.op} · 直流 ${c.kw}kW · ${(d/1000).toFixed(1)}km</span><span>¥${(pr.ele+pr.svc).toFixed(2)}/度</span></div>
    <div class="row" style="margin-top:6px">${here&&!ch?`<button class="btn pri" data-act="ev" data-arg="start:${c.id}:80">充到 80%</button><button class="btn" data-act="ev" data-arg="start:${c.id}:100">充满</button>`:`<button class="btn" data-act="ev" data-arg="nav:${c.id}">导航过去</button><span class="muted">${here?'':'到站停好后可扫码充电'}</span>`}</div></div>`;}).join('');
  b+=`<div class="dcard muted">电价分时段：谷时 22:00–06:00 最便宜，峰时 08–11、13–15、18–21 点最贵。服务费另计。</div>`;
  return head+`<div class="abody">${b}</div>`;}
function evAct(arg){const[a,b,c]=String(arg).split(':');
  if(a==='page')UI.page=b;
  else if(a==='nav'){const s=CSTN.find(q=>q.id==b);if(s&&!S.order){setRoute({x:s.x,z:s.z});toast('已导航到 '+s.name);}else if(S.order)toast('有订单进行中，送完再去充电','warn');}
  else if(a==='start'){const s=CSTN.find(q=>q.id==b);if(!s||EV.charging)return;if(!s.free){toast('这个站没有空闲的桩','warn');return;}if(S.online)setOnline(false);s.free--;EV.charging={id:s.id,x:car.x,z:car.z,target:+c,kwh:0,cost:0,min:0};setRoute(null);toast('已开始充电，可以去旁边吃个饭');}
  else if(a==='stop')evStop('手动结束充电');
  else if(a==='paydebt'){if(EV.debt&&pay(EV.debt,'特来电 补缴充电费'))EV.debt=0;}
  else if(a==='tow'){if(!pay(200,'道路救援 拖车'))return;closeModal();const s=CSTN.map(c=>({c,d:Math.hypot(c.x-car.x,c.z-car.z)})).sort((x,y)=>x.d-y.d)[0].c;fadeTo('拖车把你送到了 '+s.name,()=>{car.x=s.x;car.z=s.z;car.h=s.h;car.speed=0;EV.kwh=Math.max(EV.kwh,1);advance(50);});}
  else if(a==='close')closeModal();
  renderPhone(true);}
