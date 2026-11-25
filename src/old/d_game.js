
linShop.rotation.y=Math.PI;chen.rotation.y=Math.PI;
// ================= 游戏状态 =================
const S={
  t:16*60+30,acc:0,ts:1,cash:180,energy:80,social:0,lessons:0,battery:86,
  online:false,offer:null,order:null,offerCd:3,locked:false,loc:'car',asleep:false,started:false,
  rent:{amt:450,due:3*1440+600,period:3,overdue:false,since:0},
  debt:null,tx:[],history:[],wake:null,warned:{},loanOffered:-99999,
  threads:{
    chehang:{name:'车行 · 小周',color:'#4f7bd9',ab:'车',msgs:[],unread:0},
    platform:{name:'顺路出行',color:'#ff8a2a',ab:'顺',msgs:[],unread:0},
    lin:{name:'林晚',color:'#b07ad9',ab:'晚',msgs:[],unread:0,hidden:true},
    loan:{name:'秒借钱包',color:'#d9a04f',ab:'借',msgs:[],unread:0,hidden:true},
  },
  lin:{met:false,contact:false,aff:0,hist:[],lastSeen:-99999,rideShift:-99,nextInvite:0,invite:null,req:null,chatDay:-1,lent:0,flags:{}},
  chenChat:-1,ate:[],
};
const L=S.lin;
const UI={tab:'driver',thread:null,modal:null,dlg:null,phoneHidden:false,helpHidden:false,shop:null};
function newWake(){S.wake={start:S.t,orders:0,gross:0,fee:0,net:0,spend:0,onlineMin:0,events:[],aff0:L.aff,stage0:linStage()};}
function logEv(text){if(S.wake)S.wake.events.push(fmt(S.t)+' '+text);}
function linHist(text){L.hist.push({t:S.t,text});logEv('【林晚】'+text);}
function linStage(){if(!L.met)return'陌生人';if(!L.contact)return'见过面';if(L.aff<45)return'熟人';if(L.aff<80)return'朋友';return'亲近';}
const STAGE_ORDER=['陌生人','见过面','熟人','朋友','亲近'];
function addAff(n){const before=linStage();L.aff=clamp(L.aff+n,0,100);const after=linStage();if(after!==before&&STAGE_ORDER.indexOf(after)>STAGE_ORDER.indexOf(before)){toast(`和林晚的关系：${after}`,'');linHist('关系变为「'+after+'」');}}
function spend(n,what){S.cash-=n;S.wake.spend+=n;S.tx.unshift({t:S.t,text:what,amt:-n});}
function earn(n,what){S.cash+=n;S.tx.unshift({t:S.t,text:what,amt:n});}
function msg(th,text,actions){const T=S.threads[th];T.hidden=false;const m={t:S.t,from:'them',text,actions:actions||null,done:false,id:Math.random().toString(36).slice(2)};T.msgs.push(m);
  if(!(UI.tab==='msg'&&UI.thread===th))T.unread++;if(S.started&&!S.asleep){toast(`<b>${T.name}</b>：${text.length>34?text.slice(0,34)+'…':text}`);ping(660);}return m;}
function myMsg(th,text){S.threads[th].msgs.push({t:S.t,from:'me',text});}

// ================= 时间推进 =================
function hourOf(){return(S.t%1440)/60;}
const shiftKey=()=>Math.floor((S.t-360)/1440);
const linWorksNight=()=>wdOf(S.t-360)!==1; // 周二休息
function tickMinute(){
  S.t++;const m=S.t%1440;
  if(m===0&&!S.asleep)toast('新的一天 · '+dateStr(S.t));
  let drain=S.asleep?0:.035;
  if(S.loc==='car'&&Math.abs(car.speed)>2){drain+=.05;S.battery=Math.max(5,S.battery-.06);}
  if(S.order)drain+=.012;
  S.energy=Math.max(0,S.energy-drain);
  if(S.online)S.wake.onlineMin++;
  if(S.online&&!S.order&&!S.offer&&!S.locked&&S.offerCd<=0&&S.loc==='car')maybeOffer();
  if(S.order&&S.order.phase==='toPickup'&&S.t-S.order.acceptT>45)cancelOrder('乘客等了太久，取消了订单。');
  economy();linTick();
  if(!S.asleep){
    if(S.energy<25&&!S.warned.e25){S.warned.e25=1;toast('有点累了。可以吃点东西或回家休息。','warn');}
    if(S.energy<10&&!S.warned.e10){S.warned.e10=1;toast('眼皮在打架。再开下去不安全。','warn');}
    if(S.energy<=0&&S.loc==='car')passOut();
  }
  if(S.battery<15&&!S.warned.bat){S.warned.bat=1;toast('电量偏低（原型中充电未开放，睡觉时车行代充）','warn');}
}
function advance(mins){for(let k=0;k<mins;k++)tickMinute();}

// ================= 收支 =================
function economy(){
  const r=S.rent;
  if(!r.overdue&&S.t===r.due-720)msg('chehang',`提醒：${whenStr(r.due)} 自动扣车租 ¥${r.amt}。当前余额 ¥${Math.floor(S.cash)}。`);
  if(!r.overdue&&S.t>=r.due){
    if(S.cash>=r.amt)payRent();
    else{r.overdue=true;r.since=S.t;msg('chehang',`车租 ¥${r.amt} 扣款失败，余额不足。请 24 小时内补缴，否则车辆会被远程限制上线。`);logEv('车租扣款失败');loanAd();}
  }
  if(r.overdue){
    if(S.t%60===0&&S.cash>=r.amt)payRent();
    else if(!S.locked&&S.t-r.since>=1440){S.locked=true;if(S.online)setOnline(false);msg('chehang','车租逾期超过 24 小时，车辆已限制接单。补缴后自动恢复。');logEv('车辆被限制接单');
      if(L.contact&&L.aff>=45&&!L.lent)msg('lin','听说你车被锁了？老陈说的。要是周转不开，跟我说一声。');}
  }
  if(!r.overdue&&S.cash<80&&r.due-S.t<1080&&r.due-S.t>0&&S.t-S.loanOffered>1440)loanAd();
  const d=S.debt;
  if(d&&S.t>=d.due){
    if(S.cash>=d.amt){S.cash-=d.amt;S.wake.spend+=d.amt;S.tx.unshift({t:S.t,text:'秒借 自动还款',amt:-d.amt});msg('loan',`已自动还款 ¥${d.amt}。期待再次为您服务。`);logEv('还清网贷');S.debt=null;}
    else{d.amt+=60;d.due+=1440;d.late++;msg('loan',d.late>1?`您的借款已逾期 ${d.late} 天，待还 ¥${d.amt}。我们将依约联系您的紧急联系人。`:`借款已逾期，产生逾期费 ¥60，待还 ¥${d.amt}。`);logEv('网贷逾期');}
  }
}
function payRent(){const r=S.rent;S.cash-=r.amt;S.wake.spend+=r.amt;S.tx.unshift({t:S.t,text:'车租（3 天）',amt:-r.amt});
  const was=r.overdue;r.overdue=false;S.locked=false;r.due+=r.period*1440;while(r.due<=S.t)r.due+=r.period*1440;
  msg('chehang',`${was?'已补缴':'已扣'}车租 ¥${r.amt}。下期 ${whenStr(r.due)}。`);logEv('支付车租 ¥'+r.amt);}
function loanAd(){S.loanOffered=S.t;msg('loan','急用钱？秒借 ¥500，最快 1 分钟到账，3 天后一次还清。',[{label:'借 ¥500',act:'loanTake'},{label:'不需要',act:'loanNo'}]);}

// ================= 派单 =================
function baseRate(h){if(h>=7&&h<9.5)return.17;if(h<11)return.09;if(h<14)return.11;if(h<17)return.08;if(h<20)return.16;if(h<23)return.12;if(h>=23||h<2.5)return.13;if(h<4.5)return.05;return.03;}
function zoneW(h){
  if(h>=7&&h<10)return{p:[.62,.28,.1],d:[.12,.78,.1]};
  if(h>=10&&h<17)return{p:[.25,.6,.15],d:[.4,.42,.18]};
  if(h>=17&&h<20)return{p:[.2,.6,.2],d:[.55,.2,.25]};
  if(h>=20&&h<23)return{p:[.15,.4,.45],d:[.35,.25,.4]};
  if(h>=23||h<4.5)return{p:[.08,.17,.75],d:[.75,.17,.08]};
  return{p:[.5,.3,.2],d:[.3,.5,.2]};
}
function mkOrder(type,pickup,drop,extra={}){
  const path=findRoute(pickup,drop),len=routeLen(path),km=len*KM/1000;
  const appr=routeLen(findRoute(car,pickup,car.h))*KM/1000;
  const h=hourOf(),nightMul=(h>=22||h<6)?1.2:1;
  let gross=type==='far'?randi(82,98):Math.round((13+km*2.7)*nightMul);
  const feeRate=extra.private?0:.2,fee=Math.round(gross*feeRate);
  return{type,pickup,drop,pickName:placeName(pickup),dropName:type==='far'?PLACES.exit.name:placeName(drop),km:type==='far'?18+rand(0,4):km,appr,gross,fee,net:gross-fee,expire:15,npc:extra.npc||null,kind:extra.kind||null,private:!!extra.private,tag:extra.tag||(type==='far'?'远单':(h>=22||h<4.5)&&zoneOf(pickup.x)==='night'?'夜场':'')};
}
function maybeOffer(){
  const h=hourOf(),zw=zoneW(h);let rate=baseRate(h)*(.55+zw.p[ZI[zoneOf(car.x)]]*1.3);
  if(S.energy<15)rate*=.5;
  if(Math.random()>rate)return;
  const lo=linOffer();if(lo){setOffer(lo);return;}
  let type='normal';if((h>=19||h<2||(h>=6.5&&h<10))&&Math.random()<.09)type='far';
  let best=null;
  for(let k=0;k<26;k++){const p=randRoadPoint(ZK[wpick(zw.p)]);const d=dist(p,car);if(d<50)continue;const sc=d+rand(0,160);if(!best||sc<best.s)best={p,s:sc};}
  if(!best)return;
  let drop;
  if(type==='far')drop=PLACES.exit.spot;
  else{for(let k=0;k<30;k++){drop=randRoadPoint(ZK[wpick(zw.d)]);if(dist(drop,best.p)>200)break;}}
  setOffer(mkOrder(type,best.p,drop));
}
function linOffer(){
  const m=S.t%1440;if(L.rideShift===shiftKey())return null;
  if(m>=115&&m<=160&&linWorksNight()&&dist(car,PLACES.bar.spot)<480&&Math.random()<.7)return mkOrder('normal',PLACES.bar.spot,PLACES.linHome.spot,{npc:'lin',kind:'bar',tag:'夜场'});
  if(m>=1035&&m<=1070&&wdOf(S.t)!==1&&dist(car,PLACES.linHome.spot)<480&&Math.random()<.45)return mkOrder('normal',PLACES.linHome.spot,PLACES.bar.spot,{npc:'lin',kind:'commute'});
  return null;
}
function setOffer(o){S.offer=o;ping(988,.18);ping(1318,.18,.12);if(UI.tab!=='nav')UI.tab='driver';renderPhone(true);}
function acceptOffer(){
  const o=S.offer;if(!o)return;S.offer=null;
  o.phase='toPickup';o.acceptT=S.t;S.order=o;
  const sw=sidewalkOf(o.pickup);
  o.pMesh=o.npc==='lin'?makeLin():makePerson();o.pMesh.position.set(sw.x,.18,sw.z);o.pMesh.lookAt(o.pickup.x,.18,o.pickup.z);o.pMesh.rotateY(Math.PI);scene.add(o.pMesh);
  if(o.npc==='lin')L.rideShift=shiftKey();
  mkPick.position.set(o.pickup.x,0,o.pickup.z);mkPick.visible=true;mkDrop.visible=false;
  setRoute(o.pickup);UI.tab='nav';renderPhone(true);ping(784);
}
function skipOffer(){if(!S.offer)return;S.offer=null;S.offerCd=5;renderPhone(true);}
function cancelOrder(why){const o=S.order;if(!o)return;if(o.pMesh)scene.remove(o.pMesh);S.order=null;mkPick.visible=mkDrop.visible=false;setRoute(null);msg('platform',why);if(o.npc==='lin'&&o.phase==='toPickup'){addAff(-4);linHist('没接上她');}ride=null;S.offerCd=4;renderPhone(true);}
const PLINES={
  day:['师傅，走高架下面那条，快一点。','麻烦空调开小一点，谢谢。','（乘客一直在打电话，说的是方案和报价）','你好，到地铁站附近放我下来也行。','这边新开了家咖啡店，你喝过吗？'],
  night:['（乘客戴上耳机，一路没说话）','师傅辛苦，这么晚还在跑。','开慢点没事，我有点晕。','刚加完班……这周第四天了。','这条路晚上挺安静的。'],
};
function pickupPassenger(){
  const o=S.order;if(o.pMesh){scene.remove(o.pMesh);o.pMesh=null;}
  o.phase='toDrop';o.pickT=S.t;mkPick.visible=false;mkDrop.position.set(o.drop.x,0,o.drop.z);mkDrop.visible=true;
  setRoute(o.drop);door();
  if(o.npc==='lin')linRideStart(o);
  else showDlg('乘客',pick(NIGHT>.5?PLINES.night:PLINES.day),null,5);
  renderPhone(true);
}
function dropPassenger(){
  const o=S.order;door();
  S.order=null;mkPick.visible=mkDrop.visible=false;setRoute(null);
  earn(o.net,(o.private?'林晚 · 私下约车':'车费 · '+o.dropName));S.wake.orders++;S.wake.gross+=o.gross;S.wake.fee+=o.fee;S.wake.net+=o.net;
  toast(`订单完成 <b>+¥${o.net}</b>${o.fee?`（车费 ¥${o.gross}，平台抽成 ¥${o.fee}）`:'（私单，无抽成）'}`,'money');ching();
  const sw=sidewalkOf(o.drop);const p=o.npc==='lin'?makeLin():makePerson();p.position.set(sw.x,.18,sw.z);scene.add(p);setTimeout(()=>scene.remove(p),9000);
  if(o.npc==='lin')linRideEnd(o);
  S.offerCd=3;
  if(o.type==='far'){
    fadeTo('送客上外环……空驶返回桥西',()=>{advance(55);S.energy=Math.max(0,S.energy-4);car.x=-293;car.z=203;car.h=-Math.PI/2;car.speed=0;logEv('跑了一趟远单 +¥'+o.net);});
  }
  renderPhone(true);
}
function setOnline(v){
  if(v&&S.locked){toast('车辆已被车行限制接单，先补缴车租。','warn');return;}
  if(v&&S.loc!=='car')return;
  S.online=v;if(!v){S.offer=null;}else S.offerCd=2;
  toast(v?'已上线，开始听单':'已下线');renderPhone(true);
}

// ================= 导航 =================
let ROUTE=null,routeTarget=null,rerouteT=0;
function setRoute(target){routeTarget=target;ROUTE=target?findRoute(car,target,car.h):null;drawRoute(ROUTE);}
function navInfo(){
  if(!ROUTE||ROUTE.length<2)return null;
  let bi=0,bd=1e9,bt=0;for(let k=0;k<ROUTE.length-1;k++){const r=segDist(car,ROUTE[k],ROUTE[k+1]);if(r.d<bd){bd=r.d;bi=k;bt=r.t;}}
  const remain=dist(car,ROUTE[bi+1])+routeLen(ROUTE.slice(bi+1));
  const v=ROUTE[bi+1],dTo=dist(car,v);
  if(bi+1>=ROUTE.length-1)return{off:bd,arrow:'◎',dist:dTo,text:'到达 '+(S.order?(S.order.phase==='toPickup'?'上车点':'目的地'):''),remain};
  const a=ROUTE[bi],c=ROUTE[bi+2],d1x=v.x-a.x,d1z=v.z-a.z,d2x=c.x-v.x,d2z=c.z-v.z;
  const cr=d1x*d2z-d1z*d2x,dot=d1x*d2x+d1z*d2z;
  let arrow='↑',txt='直行';if(Math.abs(cr)>1e-3){if(cr>0){arrow='↱';txt='右转';}else{arrow='↰';txt='左转';}}else if(dot<0){arrow='⤺';txt='掉头';}
  return{off:bd,arrow,dist:dTo,text:txt+' 进入 '+roadNameOfSeg(v,c),remain};
}

// ================= 林晚 =================
function makeLin(){return makePerson({top:'#1a1a1d',bottom:'#2a2a30',hair:'#120d0b',longHair:true,skin:'#ecc7a4'});}
let ride=null;
function linRideStart(o){
  const first=!L.met;ride={t:0,step:0,first,kind:o.kind,o};
  if(first){L.met=true;linHist(o.kind==='bar'?'凌晨在退潮酒吧门口接到她':'傍晚从梧桐路送她去上班');}
  else linHist('又坐上了你的车');
  L.lastSeen=S.t;
  if(first&&o.kind==='bar')showDlg('',`（一个穿黑衬衫的女人拉开后门，带进来一点柠檬皮和烟的味道）`,null,4,()=>showDlg('乘客','师傅，去梧桐路，弄堂口停就行。……开慢点没关系，今天站了九个小时。',null,6));
  else if(first)showDlg('乘客','去永福路，退潮酒吧门口。七点前要把料备好，麻烦快一点。',null,6);
  else showDlg('林晚',{见过面:'……又是你？上海这么大，还挺巧。',熟人:'还是你开的车舒服。今天店里来了一桌喝多的，头疼。',朋友:'累死了。你吃饭没？',亲近:'（她这次坐在了副驾）今天想坐前面。'}[linStage()]||'嗨。',null,6);
}
function linRideUpdate(dt){
  if(!ride||!S.order||S.order.phase!=='toDrop')return;
  ride.t+=dt;const o=S.order;
  const prog=1-dist(car,o.drop)/Math.max(1,dist(o.pickup,o.drop));
  if(ride.step===0&&ride.t>9&&!(UI.dlg&&UI.dlg.choices)){ride.step=1;linChoicesA();}
  if(ride.step===2&&prog>.45&&!(UI.dlg&&UI.dlg.choices)){ride.step=3;linChoicesB();}
}
function nm(){return ride&&ride.first?'乘客':'林晚';}
function linChoicesA(){
  const nx=()=>{ride&&(ride.step=2);};
  if(ride.first){
    const ch=ride.kind==='bar'?[
      {t:'收工了？这个点。',fn:()=>{addAff(5);showDlg(nm(),'两点打烊，擦完杯子就这个点了。你们也是熬夜的命。',null,6);nx();}},
      {t:'（把音乐关小，安静开车）',fn:()=>{addAff(4);showDlg('','（她靠着车窗，闭了一会儿眼睛。）……谢谢。',null,6);nx();}},
      {t:'身上有柠檬皮的味道，调酒的？',req:2,fn:()=>{addAff(9);L.flags.bar=1;showDlg(nm(),'鼻子挺灵。永福路，退潮。你要是来，我给你少放点冰。',null,7);nx();}},
    ]:[
      {t:'在酒吧上班？',fn:()=>{addAff(5);showDlg(nm(),'调酒。白天睡觉，晚上上班，日夜颠倒习惯了。',null,6);nx();}},
      {t:'（安静开车）',fn:()=>{addAff(3);showDlg('','（她低头回消息，偶尔抬头看一眼路。）',null,5);nx();}},
      {t:'这个点常熟路堵，我走支路。',req:2,fn:()=>{addAff(7);showDlg(nm(),'你还挺熟这片。那就交给你了。',null,6);nx();}},
    ];
    showDlg(nm(),'',ch);return;
  }
  const st=linStage();
  showDlg('林晚','',[
    {t:'今天店里怎么样？',fn:()=>{addAff(4);showDlg('林晚',st==='见过面'?'老样子。周五人多，小费也多一点。':st==='熟人'?'有个老客又想加我微信，我说手机没电了。':'还行。就是想早点下班，跟你说会儿话。',null,7);nx();}},
    {t:'（递过去一瓶水）',fn:()=>{addAff(L.flags.water?2:5);L.flags.water=1;showDlg('林晚','……你车上还备这个。谢了。',null,5);nx();}},
    {t:'要不要绕江边开一段？不打表。',req:3,fn:()=>{addAff(8);linHist('一起沿滨江路兜了一段');showDlg('林晚','好啊。就一小段。（你们沿着滨江路慢慢开，对岸的灯还亮着。）',null,8);advance(12);nx();}},
  ]);
}
function linChoicesB(){
  const nx=()=>{ride&&(ride.step=4);};
  const st=linStage();
  if(ride.first||st==='见过面'||st==='熟人'){
    showDlg(nm(),'',[
      {t:ride.first?'我刚开始跑，还在认路。':'你老家哪儿的？',fn:()=>{addAff(5);showDlg(nm(),ride.first?'我刚来上海那年也这样，地铁坐错过三次。慢慢就熟了。':'安徽，宣城。小地方，冬天比这儿冷。',null,7);nx();}},
      {t:'以后下班要车，可以叫我。',fn:()=>{addAff(4);showDlg(nm(),'平台上派到谁算谁的吧。不过你开得挺稳。',null,6);nx();}},
      {t:'调酒调久了，会不会想自己开一家？',req:4,fn:()=>{addAff(L.flags.dream?3:10);L.flags.dream=1;linHist('聊起她想开一家自己的小酒馆');showDlg(nm(),'……你怎么知道。在攒着呢，攒够了再说。',null,7);nx();}},
    ]);
  }else{
    showDlg('林晚','',[
      {t:'下次休息想干嘛？',fn:()=>{addAff(4);showDlg('林晚','睡到下午，去老陈那吃碗面，然后什么都不干。',null,6);nx();}},
      {t:'你笑起来跟在店里不一样。',fn:()=>{addAff(6);showDlg('林晚','店里那是营业用的。……这个不是。',null,6);nx();}},
      {t:'我在攒钱，想以后不用租车。',req:5,fn:()=>{addAff(8);linHist('互相说了各自在攒钱的事');showDlg('林晚','那我们比比，谁先攒够。',null,6);nx();}},
    ]);
  }
}
function linRideEnd(o){
  const r=ride;ride=null;L.lastSeen=S.t;
  if(!L.contact&&L.aff>=9){
    showDlg(r&&r.first?'乘客':'林晚','欸，加个微信吧。以后收工直接找你，省得平台抽成。我叫林晚。',[
      {t:'好啊',fn:()=>{L.contact=true;S.threads.lin.hidden=false;linHist('加了联系方式');msg('lin','我是林晚。今天谢啦，开得挺稳。');addAff(3);hideDlg();}},
      {t:'不太方便',fn:()=>{showDlg('林晚','行，那看缘分。',null,4);}},
    ]);
  }else if(!L.contact){showDlg('乘客','谢了师傅，晚安。',null,4);}
  else showDlg('林晚',L.aff>=45?'到了。到家给我发个消息。':'到了，路上小心。',null,5);
}
function linTick(){
  const m=S.t%1440;
  if(L.contact&&L.aff>=25&&m===118&&linWorksNight()&&L.rideShift!==shiftKey()&&!S.asleep&&S.loc==='car'&&Math.random()<.65){
    L.req={t:S.t};msg('lin','收工了，在店门口。方便来接一下吗？',[{label:'马上到',act:'linReqYes'},{label:'今天不行',act:'linReqNo'}]);
  }
  if(L.req&&S.t-L.req.t>30){L.req=null;closeActions('lin');msg('lin','算了，我叫到车了。');}
  if(L.contact&&!L.invite&&S.t>=L.nextInvite&&m>=660&&m<=1200&&Math.random()<.012)sendInvite();
  const iv=L.invite;
  if(iv){
    if(iv.status==='pending'&&S.t>=iv.start){iv.status='ignored';closeActions('lin');linHist('没回她的邀约');L.invite=null;}
    else if(iv.status==='accepted'&&S.t>iv.end&&!iv.attended){addAff(-10);linHist('约好了却没去（失约）');msg('lin','等了你半个小时。算了，下次吧。');L.invite=null;}
    else if(iv.attended&&S.t>iv.end)L.invite=null;
  }
  if(m===360&&L.met&&S.t-L.lastSeen>3*1440){L.aff=Math.max(0,L.aff-3);linHist('好几天没见，关系淡了一些');}
}
function sendInvite(){
  L.nextInvite=S.t+2*1440;
  const supper=L.aff>=40&&Math.random()<.5;
  let start,end,text;
  if(supper){start=(dayOf(S.t))*1440+130;end=start+40;text='今晚收工去老陈那吃宵夜？两点一刻，我先到。';}
  else{start=(dayOf(S.t))*1440+800;end=start+70;text='明天中午一点半，老陈面馆。我请你吃大排，来不来？';}
  L.invite={start,end,status:'pending',attended:false,kind:supper?'宵夜':'午饭'};
  msg('lin',text,[{label:'好，我去',act:'invYes'},{label:'改天吧',act:'invNo'}]);
}
function linAtShop(){
  const m=S.t%1440,iv=L.invite;
  if(iv&&iv.status==='accepted'&&S.t>=iv.start-10&&S.t<=iv.end)return true;
  if(m>=810&&m<=860)return true;
  if(STAGE_ORDER.indexOf(linStage())>=3&&m>=130&&m<=170&&linWorksNight()&&[4,5].includes(wdOf(S.t-360)))return true;
  return false;
}
function closeActions(th){for(const m of S.threads[th].msgs)if(m.actions)m.done=true;}

// ================= 动作分发 =================
function act(a,arg){
  const T=S.threads;
  switch(a){
    case 'tab':UI.tab=arg;if(arg!=='msg')UI.thread=null;break;
    case 'thread':UI.thread=arg;T[arg].unread=0;break;
    case 'back':UI.thread=null;break;
    case 'online':setOnline(!S.online);break;
    case 'accept':acceptOffer();break;
    case 'skip':skipOffer();break;
    case 'payRent':if(S.cash>=S.rent.amt)payRent();else toast('余额不足','warn');break;
    case 'payDebt':if(S.debt&&S.cash>=S.debt.amt){spend(S.debt.amt,'秒借 提前还款');S.debt=null;msg('loan','已还清，感谢使用。');}else toast('余额不足','warn');break;
    case 'repayLin':if(L.lent&&S.cash>=L.lent){spend(L.lent,'还林晚的钱');myMsg('lin',`钱转你了，${L.lent}，谢谢你。`);msg('lin','这么快？行，收到了。');addAff(4);linHist('按时还了她的钱');L.lent=0;}break;
    case 'askLin':if(STAGE_ORDER.indexOf(linStage())>=3&&!L.lent&&(S.rent.overdue||S.debt)){L.lent=300;earn(300,'林晚 转账');myMsg('lin','有点不好意思开口……能先借我 300 吗？车租差一点。');msg('lin','转你了。别去碰那些网贷。');addAff(-2);linHist('向她借了 300 元');}break;
    case 'loanTake':if(!S.debt){earn(500,'秒借 放款');S.debt={amt:620,due:S.t+3*1440,late:0};closeActions('loan');myMsg('loan','借 ¥500');msg('loan',`¥500 已到账。${whenStr(S.debt.due)} 需还 ¥620（含服务费）。`);logEv('借了网贷 ¥500');}break;
    case 'loanNo':closeActions('loan');myMsg('loan','不需要');break;
    case 'linReqYes':if(S.order){toast('还在服务中，先送完这一单','warn');break;}if(!L.req)break;L.req=null;closeActions('lin');myMsg('lin','马上到，门口等我。');
      S.offer=null;S.offer=mkOrder('normal',PLACES.bar.spot,PLACES.linHome.spot,{npc:'lin',kind:'private',private:true});acceptOffer();L.rideShift=shiftKey();break;
    case 'linReqNo':L.req=null;closeActions('lin');myMsg('lin','今天不太行，抱歉。');msg('lin','没事。');break;
    case 'invYes':if(L.invite&&L.invite.status==='pending'){L.invite.status='accepted';closeActions('lin');myMsg('lin','好，我去。');msg('lin','那说定了。');linHist(`答应了${whenStr(L.invite.start)}的${L.invite.kind}`);}break;
    case 'invNo':if(L.invite&&L.invite.status==='pending'){closeActions('lin');myMsg('lin','这次不太巧，改天吧。');msg('lin','好，那改天。');L.invite=null;addAff(-1);}break;
    case 'lesson':doLesson();break;
    case 'shop':shopAct(arg);break;
    case 'home':homeAct(arg);break;
    case 'closeModal':closeModal();break;
    case 'start':startGame();break;
    case 'dlg':chooseDlg(+arg);break;
  }
  renderPhone(true);
}
function doLesson(){
  if(S.lessons>=6)return;
  if(S.order||Math.abs(car.speed)>.5){toast('停稳车、没有订单时才能上课','warn');return;}
  if(S.energy<8){toast('太累了，听不进去','warn');return;}
  const wasOnline=S.online;if(wasOnline)setOnline(false);
  fadeTo('网课 · 第 '+(S.lessons+1)+' 节',()=>{advance(45);S.energy=Math.max(0,S.energy-5);S.lessons++;S.social++;logEv(`上完网课第 ${S.lessons} 节，社交 +1`);
    toast(`《服务沟通入门》第 ${S.lessons} 节完成，社交 ${S.social}`);
    if(S.lessons===6)msg('platform','恭喜完成《服务沟通入门》。后续可申请专车资格（原型未开放）。');});
}
function passOut(){
  const had=S.order;if(had)cancelOrder('司机长时间未移动，订单已改派。平台提醒：请勿疲劳驾驶。');
  if(S.online)setOnline(false);car.speed=0;
  fadeTo('你在车里睡着了……',()=>{S.asleep=true;advance(240);S.asleep=false;S.energy=32;logEv('在车里累到睡着');toast('被交警敲窗叫醒。脖子很酸。','warn');S.warned.e25=S.warned.e10=0;});
}
