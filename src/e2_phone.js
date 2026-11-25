
// ================= 手机系统 =================
const APPS={didi:{name:'滴滴车主',ic:'D',bg:'linear-gradient(135deg,#ff9a3c,#ff6a00)'},bank:{name:'申城银行',ic:'银',bg:'linear-gradient(135deg,#d8333f,#a51624)'},ths:{name:'同花顺',ic:'同',bg:'linear-gradient(135deg,#e8402a,#c41a12)'},msg:{name:'信息',ic:'信',bg:'linear-gradient(135deg,#4cd964,#2ab14a)'}};
let phoneT=0,postRender=[];
function openApp(app,page,soft){if(soft&&UI.app&&UI.app!==app&&!['didi'].includes(app)){renderPhone(true);return;}UI.app=app;if(page)UI.page=page;else UI.page=({didi:'home',bank:'home',ths:'market',msg:null})[app];if(app==='msg')UI.thread=null;renderPhone(true);}
function goHome(){UI.app=null;UI.page=null;UI.thread=null;renderPhone(true);}
function renderPhone(now){if(now)doRenderPhone();}
const moving=()=>S.loc==='car'&&Math.abs(car.speed)>1.5;
function badge(app){if(app==='msg')return Object.values(S.threads).reduce((a,t)=>a+t.unread,0);if(app==='didi')return S.offer?1:0;return 0;}
function doRenderPhone(){
  const scr=$('#pScreen'),st=scr.scrollTop;postRender=[];
  $('#pStatus').innerHTML=`<span>${fmt(S.t)}</span><span class="isl"></span><span>5G ▮▮▮ ${Math.round(S.battery)}%</span>`;
  let h;
  if(S.offer)h=offerView();
  else if(!UI.app)h=homeView();
  else if(UI.app!=='didi'&&moving())h=`<div class="appbar" style="background:#111"><span>${APPS[UI.app].name}</span></div><div class="locked">🚗<br>驾驶中<br><span class="muted">为了安全，请停车后使用</span></div>`;
  else h=({didi:didiView,bank:bankView,ths:thsView,msg:msgView})[UI.app]();
  scr.innerHTML=h;scr.className=UI.app?'app-'+UI.app:'home';
  if(UI.app==='msg'&&UI.thread)scr.scrollTop=1e5;else scr.scrollTop=st;
  for(const f of postRender)f();
}
// ---- 桌面 ----
function homeView(){
  const r=S.rent,o=S.order,nx=S.queue[0];
  const icon=k=>{const a=APPS[k],b=badge(k);return `<div class="icon" data-act="app" data-arg="${k}"><div class="ico" style="background:${a.bg}">${a.ic}${b?`<span class="bdg">${b}</span>`:''}</div><div class="iname">${a.name}</div></div>`;};
  return `<div class="wall"><div class="wclock">${fmt(S.t)}</div><div class="wdate">${dateStr(S.t).replace(' · ','　')}　上海 ${NIGHT>.5?'晴 14°':'多云 19°'}</div>
  <div class="widget"><div class="row"><span>${o?'进行中的订单':nx?'下一个预约':'今日收入'}</span><b>${o?({toPickup:'去接乘客',waiting:'等待乘客',verify:'核验尾号',toDrop:'行程中',settle:'待确认账单'})[o.phase]:nx?fmt(nx.resvT):'¥'+S.wake.net.toFixed(2)}</b></div>
   <div class="row muted"><span>车租 ${r.overdue?'<b style="color:#ff7a7a">已逾期</b>':whenStr(r.due)}</span><span>¥${r.amt}</span></div>
   <div class="row muted"><span>A股 ${STATE_TXT[mState()]}</span><span class="${MK.idx>=MK.idxPrev?'up':'dn'}">${MK.idx.toFixed(2)}</span></div></div>
  <div class="grid">${icon('didi')}${icon('bank')}${icon('ths')}</div>
  <div class="dock">${icon('msg')}</div></div>`;
}
// ---- 派单弹窗（滴滴风格）----
function offerView(){const o=S.offer;return `<div class="offer">
  <div class="otop"><span class="tag o">${o.npc==='lin'||!o.tag?'实时':o.tag}</span><span class="tag">${o.type==='rt'?'系统派单':'抢单'}</span>${o.far?'<span class="tag p">远途</span>':''}</div>
  <div class="odist">距你 <b>${o.apprKm.toFixed(1)}</b> 公里</div>
  <div class="oroute"><div><i class="dot g"></i>${o.pickName}</div><div class="vline"></div><div><i class="dot o"></i>${o.dropName}</div></div>
  <div class="row" style="margin:10px 0"><span class="muted">全程约 ${o.km.toFixed(1)} 公里 · ${o.tripMin} 分钟</span><span class="ofare">预估 ¥${o.est.toFixed(1)}</span></div>
  <div class="muted" style="font-size:12px">需在 ${fmt(S.t+estMinutes(o.appr)+4)} 前到达上车点 · 预计收入 ¥${o.estNet.toFixed(2)}</div>
  <div class="obtns"><button class="btn" data-act="skip">不接 [2]</button><button class="btn big pri" data-act="accept">抢单 [1]<span id="offerCd">${Math.ceil(o.expire)}s</span></button></div></div>`;}
// ---- 滴滴车主 ----
function didiView(){
  const tabs=[['home','首页'],['hall','抢单'],['trip','行程'],['wallet','钱包']];
  const body=({home:didiHome,hall:didiHall,trip:didiTrip,wallet:didiWallet})[UI.page]||didiHome;
  return `<div class="appbar didi"><span data-act="home" class="back">‹</span><span>滴滴车主</span><span class="muted" style="color:#fff9">服务分 ${S.score.toFixed(0)}</span></div>
  <div class="abody">${body()}</div><div class="atabs">${tabs.map(([k,n])=>`<div class="${UI.page===k?'on':''}" data-act="page" data-arg="${k}">${n}${k==='trip'&&S.order?'<i class="pip"></i>':''}${k==='hall'&&S.queue.length?`<i class="pip"></i>`:''}</div>`).join('')}</div>`;
}
function didiHome(){
  const w=S.wake,stars=S.stats.stars,avg=stars.length?(stars.reduce((a,b)=>a+b,0)/stars.length).toFixed(2):'5.00';
  const rate=S.stats.accepted+S.stats.skipped?Math.round(S.stats.accepted/(S.stats.accepted+S.stats.skipped)*100):100;
  return `<div class="dcard hero"><div class="muted">今日流水（预估）</div><div class="big">¥${w.net.toFixed(2)}</div><div class="row muted"><span>完成 ${w.orders} 单</span><span>在线 ${(w.onlineMin/60).toFixed(1)} 小时</span></div></div>
  ${S.locked?`<div class="dcard warn">车辆已被车行限制接单，请先补缴车租</div>`:''}
  ${S.order?`<div class="dcard hot" data-act="page" data-arg="trip"><b>进行中：</b>${S.order.phase==='toDrop'?'送 '+S.order.pName+' 去 '+S.order.dropName:'接 '+S.order.pName+' · '+S.order.pickName}<div class="muted">点击查看行程 ›</div></div>`:''}
  <div class="dcard"><div class="row"><span>服务分</span><b>${S.score.toFixed(1)}</b></div><div class="row muted"><span>乘客评分</span><span>${avg} ★</span></div><div class="row muted"><span>接单率</span><span>${rate}%</span></div><div class="row muted"><span>迟到</span><span>${S.stats.late} 次</span></div></div>
  <div class="dcard"><div class="muted">附近热区</div><b>${hotHint()}</b><div class="muted" style="margin-top:2px">当前位置：${ZN[zoneOf(car.x)]}</div></div>
  <button class="go ${S.online?'off':''}" data-act="online">${S.online?'收车':'出车'}<small>${S.online?'听单中…':'按 O 也可以'}</small></button>`;
}
function hotHint(){const w=zoneW(hourOf()).p,i=w.indexOf(Math.max(...w));return ZN[ZK[i]];}
function didiHall(){
  const q=S.queue.map(r=>`<div class="dcard"><div class="row"><span class="tag p">我的预约</span><b>${whenStr(r.resvT)}</b></div><div class="oroute sm"><div><i class="dot g"></i>${r.pickName}</div><div><i class="dot o"></i>${r.dropName}</div></div><div class="row muted"><span>${r.pName} · 尾号需上车后核验</span><span>¥${r.est.toFixed(1)}</span></div><div class="muted">请在 ${fmt(r.resvT-10)}–${fmt(r.resvT+10)} 到达上车点，爽约扣服务分 5 分</div></div>`).join('');
  const list=S.online?S.hall.map(o=>`<div class="dcard"><div class="row"><span>${o.resvT?`<span class="tag p">预约 ${whenStr(o.resvT)}</span>`:`<span class="tag o">实时</span>`}${o.far?'<span class="tag r">机场</span>':''}${o.bonus?`<span class="tag g">加价 ¥${o.bonus}</span>`:''}</span><b class="ofare sm">¥${o.est.toFixed(1)}</b></div>
    <div class="oroute sm"><div><i class="dot g"></i>${o.pickName}<span class="muted"> · 距你 ${o.apprKm.toFixed(1)}km</span></div><div><i class="dot o"></i>${o.dropName}</div></div>
    <div class="row"><span class="muted">${o.comp} 位司机在抢 · 成功率约 ${Math.round(grabChance(o)*100)}%</span><button class="btn pri ${o.grabbing?'dis':''}" data-act="grab" data-arg="${o.id}">${o.grabbing?'抢单中…':'抢单'}</button></div></div>`).join(''):`<div class="dcard muted">出车后可以看到抢单大厅</div>`;
  return `${q?`<div class="sect">我的预约</div>${q}`:''}<div class="sect">抢单大厅 <span class="muted">（服务分越高越容易抢到）</span></div>${list}`;
}
function didiTrip(){
  const o=S.order;
  if(!o)return `<div class="dcard muted" style="margin-top:30px;text-align:center">暂无进行中的行程</div>${S.queue.length?`<div class="dcard">下一个预约 ${whenStr(S.queue[0].resvT)} · ${S.queue[0].pickName}</div>`:''}`;
  const n=navInfo();
  postRender.push(()=>{const c=$('#tripMap');if(c)drawMiniTo(c.getContext('2d'),c.width,c.height);});
  const ddl=o.phase==='toDrop'?o.dropDdl:o.pickDdl,left=ddl-S.t;
  let top=`<canvas id="tripMap" width="640" height="420" class="tmap"></canvas>`;
  if(n)top+=`<div class="nav"><div class="narr">${n.arrow}</div><div><div class="nd">${Math.round(n.dist*KM)} 米</div><div class="nr">${n.text}</div></div><div class="neta">剩余 ${(n.remain*KM/1000).toFixed(1)}km<br>${Math.max(1,Math.round(n.remain/8.5))} 分钟</div></div>`;
  const ddlBox=(o.phase==='toPickup'||o.phase==='toDrop')?`<div class="ddl ${left<0?'late':left<4?'warn':''}">${o.phase==='toPickup'?'接驾截止':'预计送达'} ${fmt(ddl)}　${left>=0?`还剩 ${left} 分钟`:`已超时 ${-left} 分钟`}</div>`:'';
  const pax=`<div class="row"><span><b>${o.pName}</b>${o.private?' <span class="tag p">熟人私单</span>':''}</span><span><button class="btn sm2" data-act="call">☎ 联系</button></span></div>`;
  let main='';
  if(o.phase==='toPickup')main=`${pax}<div class="oroute sm"><div><i class="dot g"></i>${o.pickName}</div><div><i class="dot o"></i>${o.dropName}</div></div>
    <button class="btn wide big2 ${n&&n.remain<10&&Math.abs(car.speed)<1.2?'pri':'dis2'}" data-act="arrive">到达上车点 [E]</button>`;
  else if(o.phase==='waiting')main=`${pax}<div class="muted" style="margin:6px 0">已到达，等待乘客上车（免费等待 5 分钟）</div><div class="waitbar"><div style="width:${Math.min(100,(S.t-o.arriveT)/5*100)}%"></div></div>
    ${o.noShowReady?`<button class="btn wide" data-act="noshow">乘客未到 · 免责取消（+¥6 等候费）</button>`:''}`;
  else if(o.phase==='verify'){const k=UI.keypad;
    main=`${pax}<div class="vtitle">请输入乘客手机尾号</div><div class="vbox">${[0,1,2,3].map(i=>`<span class="${k[i]?'f':''}">${k[i]||''}</span>`).join('')}</div>
    ${o.mismatch?`<div class="vwarn">尾号不符！请确认乘客身份<div class="row" style="margin-top:6px"><button class="btn" data-act="kclear">重新输入</button><button class="btn pri" data-act="wrongout">请乘客下车</button></div></div>`:
    `<div class="kpad">${[1,2,3,4,5,6,7,8,9,'清除',0,'⌫'].map(x=>`<div data-act="key" data-arg="${x}">${x}</div>`).join('')}</div><div class="muted c">也可以直接按键盘数字输入</div>`}`;}
  else if(o.phase==='toDrop')main=`${pax}<div class="oroute sm"><div><i class="dot o"></i>${o.dropName}</div></div><div class="row muted"><span>已行驶 ${S.t-o.pickT} 分钟</span><span>颠簸 ${o.bumps} 次</span></div>
    <button class="btn wide big2 ${n&&n.remain<10&&Math.abs(car.speed)<1.2?'pri':'dis2'}" data-act="arriveDrop">到达目的地 [E]</button>`;
  else if(o.phase==='settle'){const b=o.bill;
    main=`<div class="vtitle">确认账单</div><table class="bill"><tr><td>起步价（含 3 公里）</td><td>¥${b.base.toFixed(2)}</td></tr><tr><td>里程费 ${o.km.toFixed(1)}km${b.night?'（夜间）':''}</td><td>¥${b.dist.toFixed(2)}</td></tr><tr><td>时长费 ${Math.max(1,o.dropT-o.pickT)} 分钟</td><td>¥${b.dur.toFixed(2)}</td></tr>${b.far?`<tr><td>远途费</td><td>¥${b.far.toFixed(2)}</td></tr>`:''}${b.extra?`<tr><td>加价</td><td>¥${b.extra.toFixed(2)}</td></tr>`:''}
    <tr class="tot"><td>乘客支付</td><td>¥${b.total.toFixed(2)}</td></tr><tr><td>信息服务费 ${o.private?'0%':'20%'}</td><td>-¥${o.fee.toFixed(2)}</td></tr><tr class="tot"><td>本单收入</td><td class="up2">¥${o.net.toFixed(2)}</td></tr></table>
    <div class="row muted"><span>乘客评价</span><span style="color:#ffb020">${'★'.repeat(o.stars)}${'☆'.repeat(5-o.stars)}</span></div>
    <button class="btn wide big2 pri" data-act="bill">确认账单并发起收款 [E]</button>`;}
  return `${top}${ddlBox}<div class="dcard">${main}</div>`;
}
function didiWallet(){
  return `<div class="dcard hero"><div class="muted">司机钱包 · 可提现</div><div class="big">¥${S.dw.toFixed(2)}</div><button class="btn pri wide ${S.dw<=0?'dis':''}" data-act="withdraw">全部提现到 申城银行(6621)</button><div class="muted c" style="margin-top:4px">实时到账 · 不收手续费</div></div>
  <div class="sect">收支明细</div><div class="dcard">${S.dtx.slice(0,20).map(x=>`<div class="row"><span>${x.text}<br><span class="muted">${whenStr(x.t)}</span></span><b class="${x.amt>=0?'up2':'dn2'}">${x.amt>=0?'+':''}${x.amt.toFixed(2)}</b></div>`).join('')||'<span class="muted">暂无</span>'}</div>`;
}
// ---- 小地图（共用）----
function drawMiniTo(g,W,H,dark){
  const span=260,sc=Math.min(W,H)/span,cx=car.x,cz=car.z,P=(x,z)=>[W/2+(x-cx)*sc,H*.58+(z-cz)*sc];
  g.save();g.fillStyle=dark?'#141820':'#eef0f2';g.fillRect(0,0,W,H);
  g.translate(W/2,H*.58);g.rotate(car.h);g.translate(-W/2,-H*.58);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){const zo=i<2?0:i<4?1:2;g.fillStyle=dark?['#22252b','#1f2430','#272231'][zo]:['#e2ddd2','#dde3ea','#e6dde8'][zo];const[a,b]=P(-293+100*i,-293+100*j);g.fillRect(a,b,86*sc,86*sc);}
  g.fillStyle=dark?'#14303c':'#a9cfe0';const[rx]=P(320,0);g.fillRect(rx,-H,4000,H*3);
  g.strokeStyle=dark?'#3a3f49':'#ffffff';g.lineWidth=13*sc;g.lineCap='butt';for(const r of R){let[a,b]=P(-310,r),[c,d]=P(310,r);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();[a,b]=P(r,-310);[c,d]=P(r,310);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();}
  if(ROUTE){g.strokeStyle='#1fa3ff';g.lineWidth=Math.max(5,6*sc);g.lineJoin='round';g.beginPath();ROUTE.forEach((p,k)=>{const[a,b]=P(p.x,p.z);k?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();}
  g.font=`bold ${Math.round(16*sc*1.2)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';
  for(const[k,t,c]of[['shop','面','#ff6a4f'],['home','家','#4f8fff'],['bar','酒','#a96aff']]){const[a,b]=P(PLACES[k].spot.x,PLACES[k].spot.z);g.fillStyle=c;g.beginPath();g.arc(a,b,10*sc*1.3,0,7);g.fill();g.fillStyle='#fff';g.fillText(t,a,b+1);}
  if(S.order){const o=S.order;for(const[p,c,show]of[[o.pickup,'#21c065',o.phase==='toPickup'],[o.drop,'#ff7a1a',o.phase!=='settle']]){if(!show)continue;const[a,b]=P(p.x,p.z);g.fillStyle=c;g.beginPath();g.arc(a,b,9,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();}}
  g.restore();
  g.save();g.translate(W/2,H*.58);g.fillStyle='#1f7bff';g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(0,-14);g.lineTo(10,10);g.lineTo(0,5);g.lineTo(-10,10);g.closePath();g.fill();g.stroke();g.restore();
}
// ---- 信息 ----
function msgView(){
  const T=S.threads;
  if(UI.thread==='linProfile')return linProfile();
  if(UI.thread){const t=T[UI.thread];
    return `<div class="appbar msgb"><span data-act="back" class="back">‹</span><span>${t.name}</span>${UI.thread==='lin'?`<span data-act="thread" data-arg="linProfile" class="back">ⓘ</span>`:'<span></span>'}</div><div class="abody chat">`+t.msgs.map(m=>`<div class="bub ${m.from==='me'?'me':''}">${m.text}${m.actions&&!m.done?`<div class="acts">${m.actions.map((a,i)=>`<button class="btn ${i===0?'pri':''}" data-act="${a.act}">${a.label}</button>`).join('')}</div>`:''}<div class="t">${whenStr(m.t)}</div></div>`).join('')+`</div>`;}
  return `<div class="appbar msgb"><span data-act="home" class="back">‹</span><span>信息</span><span></span></div><div class="abody">`+Object.entries(T).filter(([k,t])=>!t.hidden&&t.msgs.length).sort((a,b)=>b[1].msgs[b[1].msgs.length-1].t-a[1].msgs[a[1].msgs.length-1].t).map(([k,t])=>{const l=t.msgs[t.msgs.length-1];return `<div class="thread" data-act="thread" data-arg="${k}"><div class="ava" style="background:${t.color}">${t.ab}</div><div style="flex:1;min-width:0"><div class="row"><b>${t.name}</b><span class="muted">${fmt(l.t)}</span></div><div class="muted ell">${l.text}</div></div>${t.unread?`<span class="bdg2">${t.unread}</span>`:''}</div>`;}).join('')+`</div>`;
}
function linProfile(){const st=linStage();
  return `<div class="appbar msgb"><span data-act="thread" data-arg="lin" class="back">‹</span><span>林晚</span><span></span></div><div class="abody">
  <div class="dcard"><div class="row"><b>林晚</b><span class="tag p">${st}</span></div><div class="muted">调酒师 · 退潮酒吧 · 住梧桐路<br>上班 18:00–02:00，周二休息，中午常去老陈面馆</div>
  <div class="relbar"><div style="width:${L.aff}%"></div></div><div class="muted">好感 ${Math.round(L.aff)} / 100${L.invite&&L.invite.status==='accepted'?` · 已约 ${whenStr(L.invite.start)} ${L.invite.kind}`:''}</div>
  ${STAGE_ORDER.indexOf(st)>=3&&!L.lent&&(S.rent.overdue||S.debt)?`<button class="btn wide" data-act="askLin">开口向她借 ¥300</button>`:''}</div>
  <div class="sect">相处经过</div><div class="dcard hist">${L.hist.slice().reverse().map(e=>`<div>${whenStr(e.t)}　${e.text}</div>`).join('')}</div></div>`;}
// ---- 横幅通知 ----
let bannerT=null;
function phoneBanner(n){const b=$('#pBanner');const a=APPS[n.app]||APPS.msg;b.innerHTML=`<div class="ico s" style="background:${a.bg}">${a.ic}</div><div style="min-width:0;flex:1"><div class="row"><b>${n.title}</b><span class="muted">现在</span></div><div class="ell2">${n.text}</div></div>`;b.dataset.app=n.app;b.classList.add('on');clearTimeout(bannerT);bannerT=setTimeout(()=>b.classList.remove('on'),3800);
  if(UI.phone==='mount'&&S.loc==='car')toast(`<b>${n.title}</b>　${n.text.length>40?n.text.slice(0,40)+'…':n.text}`,n.app==='bank'?'money':'');}
function voice(t){if(S.started&&!S.asleep)toast('🔊 '+t,'voice');if(window.speechSynthesis&&S.started&&!S.asleep&&UI.voice){try{const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';u.rate=1.15;u.volume=.8;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}}
