
// ================= 司机端：派单 / 抢单 / 预约 / 行程 =================
const SURN=['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','朱','马','胡','郭','林','何','高','罗'];
const tail4=()=>String(randi(0,9999)).padStart(4,'0');
function baseRate(h){if(h>=7&&h<9.5)return.17;if(h<11)return.09;if(h<14)return.11;if(h<17)return.08;if(h<20)return.16;if(h<23)return.12;if(h>=23||h<2.5)return.13;if(h<4.5)return.05;return.03;}
function zoneW(h){
  if(h>=7&&h<10)return{p:[.62,.28,.1],d:[.12,.78,.1]};
  if(h>=10&&h<17)return{p:[.25,.6,.15],d:[.4,.42,.18]};
  if(h>=17&&h<20)return{p:[.2,.6,.2],d:[.55,.2,.25]};
  if(h>=20&&h<23)return{p:[.15,.4,.45],d:[.35,.25,.4]};
  if(h>=23||h<4.5)return{p:[.08,.17,.75],d:[.75,.17,.08]};
  return{p:[.5,.3,.2],d:[.3,.5,.2]};
}
const isNight=t=>{const h=(t%1440)/60;return h>=23||h<5;};
// 快车计价：起步 ¥14（含 3 公里），里程 2.5/km（夜间 3.0），时长 0.5/分钟，15 公里以上远途费 1/km
function fareOf(km,min,t,extra=0){const night=isNight(t),base=14,dist=Math.max(0,km-3)*(night?3:2.5),dur=min*.1,far=Math.max(0,km-15)*1;
  const total=Math.round((base+dist+dur+far+extra)*100)/100;return{base,dist:Math.round(dist*100)/100,dur:Math.round(dur*100)/100,far:Math.round(far*100)/100,extra,total,night};}
const FEE_RATE=.2;
function estMinutes(len){return Math.ceil(len/8.5*TR);}
function mkOrder(type,pickup,drop,extra={}){
  const far=drop===PLACES.exit.spot;
  const path=findRoute(pickup,drop),len=routeLen(path),km=far?rand(18,22):len*KM/1000;
  const appr=routeLen(findRoute(car,pickup,car.h));
  const tripMin=far?42:estMinutes(len);const est=fareOf(km,tripMin,S.t,extra.bonus||0);
  const o={id:Math.random().toString(36).slice(2,8),type,pickup,drop,far,len,km,appr,apprKm:appr*KM/1000,tripMin,
    pickName:placeName(pickup),dropName:far?PLACES.exit.name:placeName(drop),est:est.total,estNet:Math.round(est.total*(extra.private?1:1-FEE_RATE)*100)/100,
    tail:extra.tail||tail4(),pName:(extra.pName||pick(SURN)+pick(['先生','女士'])),npc:extra.npc||null,kind:extra.kind||null,private:!!extra.private,bonus:extra.bonus||0,
    expire:15,comp:extra.comp||0,resvT:extra.resvT||null,wrong:!extra.npc&&!extra.private&&Math.random()<.08,noShow:!extra.npc&&Math.random()<.04,
    tag:extra.tag||(far?'远途':(isNight(S.t)&&zoneOf(pickup.x,pickup.z)==='night')?'夜场':''),bumps:0};
  return o;
}
// ---- 实时派单 ----
function maybeOffer(){
  const h=hourOf(),zw=zoneW(h);let rate=baseRate(h)*(.55+zw.p[ZI[zoneOf(car.x,car.z)]]*1.3)*(.6+S.score/200);
  if(S.energy<15)rate*=.5;
  if(S.queue.some(r=>r.resvT-S.t<40))return;
  if(Math.random()>rate)return;
  const lo=linOffer();if(lo){setOffer(lo);return;}
  const far=(h>=19||h<2||(h>=6.5&&h<10))&&Math.random()<.08;
  let best=null;for(let k=0;k<26;k++){const p=randRoadPoint(ZK[wpick(zw.p)]);const d=dist(p,car);if(d<50)continue;const sc=d+rand(0,160);if(!best||sc<best.s)best={p,s:sc};}
  if(!best)return;
  let drop;if(far)drop=PLACES.exit.spot;else for(let k=0;k<30;k++){drop=randRoadPoint(ZK[wpick(zw.d)]);if(dist(drop,best.p)>200)break;}
  setOffer(mkOrder('rt',best.p,drop));
}
function setOffer(o){S.offer=o;voice('您有新的订单');ping(988,.18);ping(1318,.18,.12);openApp('didi','home',true);}
function acceptOffer(){const o=S.offer;if(!o)return;S.offer=null;S.stats.accepted++;startOrder(o);}
function skipOffer(){if(!S.offer)return;S.offer=null;S.offerCd=5;S.stats.skipped++;renderPhone(true);}
function startOrder(o){
  o.phase='toPickup';o.acceptT=S.t;o.pickDdl=o.resvT?o.resvT+10:S.t+estMinutes(o.appr)+4;S.order=o;
  const sw=sidewalkOf(o.pickup);
  o.pMesh=o.npc==='lin'?makeLin():makePedVisual();o.pMesh.position.set(sw.x,.15,sw.z);o.pMesh.lookAt(o.pickup.x,.15,o.pickup.z);scene.add(o.pMesh);
  if(o.npc==='lin')L.rideShift=shiftKey();
  mkPick.position.set(o.pickup.x,0,o.pickup.z);mkPick.visible=true;mkDrop.visible=false;
  setRoute(o.pickup);voice(o.resvT?'预约行程开始，请前往上车点':'请前往上车点接乘客');openApp('didi','trip',true);ping(784);
}
function cancelOrder(why,sd=0){const o=S.order;if(!o)return;if(o.pMesh)scene.remove(o.pMesh);if(o.wMesh)scene.remove(o.wMesh);clearRearPax();S.order=null;mkPick.visible=mkDrop.visible=false;setRoute(null);
  notify('didi','滴滴车主',why);if(sd){S.score=clamp(S.score+sd,60,100);}if(o.npc==='lin'&&o.phase==='toPickup'){addAff(-4);linHist('没接上她');}ride=null;S.offerCd=4;activateQueued();renderPhone(true);}
// ---- 抢单大厅 ----
function hallRefresh(){
  S.hall=S.hall.filter(o=>!o.gone&&(o.resvT?o.resvT-S.t>50:S.t-o.born<14));
  const h=hourOf(),zw=zoneW(h);
  while(S.hall.length<5){
    let o;
    if(Math.random()<.35){const T=S.t+randi(90,720);const tt=Math.round(T/10)*10;const toAir=Math.random()<.5;const p=randRoadPoint(ZK[randi(0,2)]);
      o=mkOrder('resv',p,toAir?PLACES.exit.spot:randRoadPoint(ZK[randi(0,2)]),{resvT:tt,bonus:toAir?0:3,comp:randi(1,6)});o.tag='预约';}
    else{const p=randRoadPoint(ZK[wpick(zw.p)]);let d;for(let k=0;k<20;k++){d=randRoadPoint(ZK[wpick(zw.d)]);if(dist(d,p)>220)break;}
      o=mkOrder('grab',p,d,{bonus:randi(2,8),comp:randi(2,9)});o.tag='抢单';}
    o.born=S.t;S.hall.push(o);
  }
  S.hall.sort((a,b)=>(a.resvT||0)-(b.resvT||0));
}
function grabChance(o){const near=o.resvT?.15:clamp(1-o.apprKm/3,0,1)*.3;return clamp(.18+(S.score-70)/55+near-o.comp*.03,.08,.92);}
function grab(id){
  const o=S.hall.find(x=>x.id===id);if(!o||o.grabbing)return;
  if(!o.resvT&&S.order){toast('当前有进行中的订单，只能抢预约单','warn');return;}
  if(o.resvT&&S.queue.some(r=>Math.abs(r.resvT-o.resvT)<90)){toast('与已有预约时间冲突','warn');return;}
  o.grabbing=true;renderPhone(true);
  setTimeout(()=>{o.grabbing=false;o.gone=true;S.hall=S.hall.filter(x=>x!==o);
    if(Math.random()<grabChance(o)){ching();S.stats.accepted++;
      if(o.resvT){S.queue.push(o);S.queue.sort((a,b)=>a.resvT-b.resvT);notify('didi','滴滴车主',`抢单成功：${whenStr(o.resvT)} ${o.pickName} → ${o.dropName}`);logEv('抢到预约单 '+whenStr(o.resvT));}
      else{notify('didi','滴滴车主','抢单成功，请尽快前往上车点');startOrder(o);}}
    else{thud();notify('didi','滴滴车主','手慢了，订单已被其他司机抢走');}
    renderPhone(true);},1200);
}
function activateQueued(){if(S.order||!S.queue.length)return;const r=S.queue[0];if(S.t>=r.resvT-25){S.queue.shift();r.acceptT=S.t;startOrder(r);}}
// ---- 每分钟 ----
function driverTick(){
  if(S.online&&!S.order&&!S.offer&&!S.locked&&S.offerCd<=0&&S.loc==='car')maybeOffer();
  if(S.online&&S.t-S.hallT>=8){S.hallT=S.t;hallRefresh();}
  for(const r of S.queue.slice()){
    if(r.resvT-S.t===60)notify('didi','滴滴车主',`预约提醒：1 小时后 ${fmt(r.resvT)} 在 ${r.pickName} 接 ${r.pName}`);
    if(S.t>r.resvT+10){S.queue.splice(S.queue.indexOf(r),1);S.score=clamp(S.score-5,60,100);dwAdd(-20,'预约单爽约 违约金');notify('didi','滴滴车主',`你错过了 ${fmt(r.resvT)} 的预约单，服务分 -5，违约金 ¥20`);logEv('预约单爽约');}
  }
  activateQueued();
  const o=S.order;
  if(o&&o.phase==='toPickup'){
    if(S.t===o.pickDdl-3)voice('距离接驾截止还有 3 分钟');
    if(S.t>o.pickDdl+12)cancelOrder('司机迟到过久，乘客已取消订单。服务分 -2',-2);
  }
  if(o&&o.phase==='waiting'&&o.noShow&&S.t-o.arriveT>=5&&!o.noShowReady){o.noShowReady=true;notify('didi','滴滴车主','乘客超过 5 分钟未上车，可免责取消并获得等候费');}
  if(o&&o.phase==='toDrop'&&S.t===o.dropDdl)voice('已超过预计送达时间');
}
function setOnline(v){
  if(v&&typeof LAW!=='undefined'&&LAW.study.need){toast('驾驶证已记满 12 分，完成满分学习前不能出车','warn');return;}
  if(v&&S.locked){toast('车辆已被车行限制接单，先补缴车租。','warn');return;}
  if(v&&S.loc!=='car')return;
  S.online=v;if(!v){S.offer=null;}else{S.offerCd=2;S.hallT=S.t;hallRefresh();}
  voice(v?'开始听单':'已收车');renderPhone(true);
}
// ---- 行程流程 ----
const PLINES={day:['师傅，走高架下面那条，快一点。','麻烦空调开小一点，谢谢。','（乘客一直在打电话，说的是方案和报价）','你好，到地铁站附近放我下来也行。','这边新开了家咖啡店，你喝过吗？'],
  night:['（乘客戴上耳机，一路没说话）','师傅辛苦，这么晚还在跑。','开慢点没事，我有点晕。','刚加完班……这周第四天了。','这条路晚上挺安静的。']};
let rearPax=null;
function clearRearPax(){if(rearPax){carG.remove(rearPax);rearPax=null;}}
function arrivePickup(){
  const o=S.order;o.phase='waiting';o.arriveT=S.t;mkPick.visible=false;setRoute(null);
  const late=S.t-o.pickDdl;if(late>0){S.stats.late++;S.score=clamp(S.score-1,60,100);o.lateP=late;notify('didi','滴滴车主',`接驾迟到 ${late} 分钟，服务分 -1`);}
  voice('已到达上车点，请等待乘客');
  if(!o.noShow){o.walk=o.wrong?'wrong':'pax';if(o.wrong){o.wMesh=makePedVisual();o.wMesh.position.copy(o.pMesh.position).add(new THREE.Vector3(1.2,0,1.2));scene.add(o.wMesh);}}
  openApp('didi','trip',true);
}
function paxWalk(dt){const o=S.order;if(!o||o.phase!=='waiting'||!o.walk)return;
  const m=o.walk==='wrong'?o.wMesh:o.pMesh;if(!m)return;
  const door=new THREE.Vector3(1.05,0,.95).applyAxisAngle(_Y,car.h).add(new THREE.Vector3(car.x,.15,car.z));
  const d=m.position.distanceTo(door);
  if(d>.5){const v=door.clone().sub(m.position).setY(0).normalize();m.position.addScaledVector(v,Math.min(d,1.5*dt));m.rotation.y=Math.atan2(-v.x,-v.z);animPerson(m,dt,true);}
  else{scene.remove(m);door2();o.walk=null;
    o.onBoard=m===o.wMesh?'wrong':'pax';
    rearPax=o.npc==='lin'&&o.onBoard==='pax'?makeLin(true):makePerson({seated:true});
    rearPax.position.copy(rearSeatSpot);rearPax.position.y=.12;carG.add(rearPax);
    o.phase='verify';UI.keypad='';o.saidTail=o.onBoard==='wrong'?tail4():o.tail;
    const who=o.npc==='lin'&&o.onBoard==='pax'?(L.met?'林晚':'乘客'):'乘客';
    showDlg(who,(o.npc==='lin'&&!L.met)?'（后门拉开）师傅，尾号 '+o.saidTail+'。':pick(['你好，尾号 ','师傅好，手机尾号 ','尾号 '])+o.saidTail+'。',null,7);
    voice('请核对乘客手机尾号');openApp('didi','trip',true);}
}
function verifyTail(code){
  const o=S.order;if(!o||o.phase!=='verify')return;
  if(code===o.tail){
    if(o.onBoard==='wrong'){o.mismatch=true;renderPhone(true);return;}
    o.phase='toDrop';o.pickT=S.t;o.dropDdl=S.t+o.tripMin+4;mkDrop.position.set(o.drop.x,0,o.drop.z);mkDrop.visible=true;setRoute(o.drop);
    voice('行程开始，请系好安全带');
    if(o.npc==='lin')linRideStart(o);else if(!UI.dlg)showDlg('乘客',pick(NIGHT>.5?PLINES.night:PLINES.day),null,5);
  }else{o.mismatch=true;toast('尾号不符，请确认乘客身份','warn');thud();}
  UI.keypad='';renderPhone(true);
}
function wrongPaxOut(){const o=S.order;if(!o)return;o.mismatch=false;clearRearPax();door2();
  if(o.onBoard==='wrong'){showDlg('乘客','啊？不好意思不好意思，我叫的是另一辆白车……',null,4);o.wrong=false;o.walk='pax';o.phase='waiting';
    const p=makePerson();p.position.copy(sidewalkOf({x:car.x,z:car.z})).setY(.15);scene.add(p);setTimeout(()=>scene.remove(p),8000);}
  else{showDlg('乘客','尾号就是 '+o.tail+' 啊，你再看看？',null,4);o.phase='verify';rearPax=makePerson({seated:true});rearPax.position.copy(rearSeatSpot);rearPax.position.y=.12;carG.add(rearPax);}
  renderPhone(true);}
function noShowCancel(){const o=S.order;if(!o||!o.noShowReady)return;dwAdd(6,'乘客未上车 等候费');S.order=null;if(o.pMesh)scene.remove(o.pMesh);setRoute(null);notify('didi','滴滴车主','订单已免责取消，等候费 ¥6 已到账');S.offerCd=3;activateQueued();renderPhone(true);}
function arriveDrop(){
  const o=S.order;o.phase='settle';o.dropT=S.t;mkDrop.visible=false;setRoute(null);
  const min=Math.max(1,o.dropT-o.pickT),km=o.far?o.km:Math.max(.5,o.km);o.bill=fareOf(km,o.far?o.tripMin:min,o.pickT,o.bonus);
  o.fee=o.private?0:Math.round(o.bill.total*FEE_RATE*100)/100;o.net=Math.round((o.bill.total-o.fee)*100)/100;
  let stars=5;if(o.lateP>3)stars--;if(S.t>o.dropDdl)stars--;stars-=Math.min(2,o.bumps);if(o.npc==='lin')stars=5;o.stars=clamp(stars,1,5);
  voice('已到达目的地，请提醒乘客带好随身物品');door2();clearRearPax();
  const sw=sidewalkOf(o.drop);const p=o.npc==='lin'?makeLin():makePedVisual();p.position.set(sw.x,.15,sw.z);scene.add(p);setTimeout(()=>scene.remove(p),9000);
  if(o.npc==='lin')linRideEnd(o);
  openApp('didi','trip',true);
}
function confirmBill(){
  const o=S.order;if(!o||o.phase!=='settle')return;S.order=null;
  dwAdd(o.net,(o.private?'私单 · ':'')+o.dropName);S.wake.orders++;S.wake.gross+=o.bill.total;S.wake.fee+=o.fee;S.wake.net+=o.net;S.stats.done++;S.stats.stars.push(o.stars);
  S.score=clamp(S.score+(o.stars===5?.4:o.stars===4?0:-1),60,100);
  toast(`本单收入 <b>+¥${o.net.toFixed(2)}</b>　乘客评价 ${'★'.repeat(o.stars)}${'☆'.repeat(5-o.stars)}`,'money');ching();
  S.offerCd=3;
  if(o.far)fadeTo('送客上外环……空驶返回桥西',()=>{advance(55);S.energy=Math.max(0,S.energy-4);{const p=curbSpot(PLACES.home.spot.x+rand(-400,400),PLACES.home.spot.z+rand(-400,400));car.x=p.x;car.z=p.z;car.h=p.h;car.speed=0;}logEv('跑了一趟远途 +¥'+o.net.toFixed(0));});
  activateQueued();openApp('didi','home',true);
}
// ================= 导航 =================
let ROUTE=null,routeTarget=null,rerouteT=0;
function setRoute(target){routeTarget=target;ROUTE=target?findRoute(car,target,car.h):null;drawRoute(ROUTE);}
let _navC=null,_navT=0;
function navInfo(){
  if(!ROUTE||ROUTE.length<2)return null;
  const now=performance.now();if(_navC&&now-_navT<120&&_navC.route===ROUTE)return _navC.v;
  let bi=0,bd=1e9;for(let k=0;k<ROUTE.length-1;k++){const r=segDist(car,ROUTE[k],ROUTE[k+1]);if(r.d<bd){bd=r.d;bi=k;}}
  const remain=dist(car,ROUTE[bi+1])+routeLen(ROUTE.slice(bi+1));
  let acc=dist(car,ROUTE[bi+1]),res=null;
  for(let k=bi+1;k<ROUTE.length-1;k++){const a=ROUTE[k-1],v=ROUTE[k],c=ROUTE[k+1];const d1x=v.x-a.x,d1z=v.z-a.z,d2x=c.x-v.x,d2z=c.z-v.z,L1=Math.hypot(d1x,d1z)||1,L2=Math.hypot(d2x,d2z)||1;
    const sn=(d1x*d2z-d1z*d2x)/(L1*L2),cs=(d1x*d2x+d1z*d2z)/(L1*L2),ang=Math.atan2(sn,cs);
    if(Math.abs(ang)>.55&&L2>6&&L1>5){let arrow,txt;if(Math.abs(ang)>2.5){arrow='⤺';txt='掉头';}else if(ang>0){arrow='↱';txt='右转';}else{arrow='↰';txt='左转';}
      const road=roadNameOfSeg(v,c);res={off:bd,arrow,dist:acc,text:txt+' 进入 '+road,remain,road};break;}
    acc+=L2;}
  if(!res){const end=ROUTE[ROUTE.length-1];res={off:bd,arrow:remain<60?'◎':'↑',dist:remain,text:'到达'+(S.order?(S.order.phase==='toPickup'?'上车点':'目的地'):''),remain,road:remain<60?'到达':roadNameOfSeg(ROUTE[bi],ROUTE[bi+1])};}
  _navC={route:ROUTE,v:res};_navT=now;return res;
}
