
// ================= 场所：面馆 / 家 =================
function shopOpen(){const m=S.t%1440;return(m>=390&&m<900)||m>=1290||m<180;}
function enterPlace(k){
  if(S.order){toast('服务中，先完成订单','warn');return;}
  if(k==='shop'&&!shopOpen()){toast('老陈面馆已打烊（06:30–15:00 / 宵夜 21:30–03:00）','warn');return;}
  if(S.online){S.online=false;S.offer=null;toast('已自动下线');}
  car.speed=0;
  fadeTo(k==='shop'?'老陈面馆':'永安里',()=>{
    S.loc=k;
    if(k==='shop'){UI.shop={say:[],linTalked:false,chenTalked:false};const iv=L.invite;
      if(iv&&iv.status==='accepted'&&S.t>=iv.start-10&&S.t<=iv.end&&!iv.attended){iv.attended=true;L.lastSeen=S.t;addAff(10);linHist(`赴约，一起吃了${iv.kind}`);UI.shop.say.push(['林晚','你还真来了。我还跟老陈打赌你会放我鸽子。']);UI.shop.linTalked=true;}
      shopCam.rotation.set(0,0,0);renderShop();}
    else renderHome();
  });
}
function leavePlace(){fadeTo('',()=>{S.loc='car';closeModal();renderPhone(true);});}
function renderShop(){
  const here=linAtShop();linShop.visible=here;linShop.userData.bowl.visible=here;
  const ate=S.ate.filter(t=>S.t-t<180).length;
  const sayHtml=UI.shop.say.slice(-3).map(([n,t])=>`<div class="say">${n?`<b>${n}</b>　`:''}${t}</div>`).join('');
  let linOpts='';
  if(here){
    if(!L.met)linOpts=`<button class="opt" data-act="shop" data-arg="linMeet">拼个桌？<small>靠窗那桌坐着个女人，面前一碗大排面，手机里在放调酒视频</small></button>`;
    else if(!UI.shop.linTalked&&L.chatDay!==dayOf(S.t))linOpts=`<button class="opt" data-act="shop" data-arg="linChat">和林晚聊几句<small>${linStage()} · 约 15 分钟</small></button>
      <button class="opt" data-act="shop" data-arg="linEgg">给她加个荷包蛋（¥3）</button>
      ${S.social>=4?`<button class="opt" data-act="shop" data-arg="linPromise">「下回你休息，我请你吃这的大排。」<small>需要社交 4</small></button>`:''}`;
    else linOpts=`<div class="muted" style="margin:6px 2px">林晚在低头吃面，偶尔看你一眼。</div>`;
    if(L.met&&!L.contact&&L.aff>=8)linOpts+=`<button class="opt" data-act="shop" data-arg="linContact">「我开网约车，夜里收工要车可以找我。」</button>`;
    if(L.aff>=80&&!L.flags.river)linOpts+=`<button class="opt" data-act="shop" data-arg="linRiver">听她把话说完</button>`;
  }
  openModal(`<h2>老陈面馆</h2><div class="muted">${dateStr(S.t)} ${fmt(S.t)} · 现金 ¥${Math.floor(S.cash)} · 精力 ${Math.round(S.energy)}</div>
    ${sayHtml}
    <button class="opt ${ate>=2||S.cash<16?'dis':''}" data-act="shop" data-arg="noodle1">葱油拌面 ¥16<small>精力 +10 · 20 分钟</small></button>
    <button class="opt ${ate>=2||S.cash<26?'dis':''}" data-act="shop" data-arg="noodle2">大排面 ¥26<small>精力 +18 · 25 分钟</small></button>
    ${!UI.shop.chenTalked?`<button class="opt" data-act="shop" data-arg="chen">和老陈搭两句<small>5 分钟</small></button>`:''}
    ${linOpts}
    <button class="opt" data-act="shop" data-arg="leave">离开，回到车上</button>`,true);
}
const CHEN_TIPS=['早上七八点，弄堂里出门上班的多，往商圈跑的单子多。','半夜两点酒吧街一打烊，永福路门口全是等车的。','下午三点以后我就收摊了，晚上九点半再开宵夜。','车租这东西，宁可少吃一顿也别拖，一拖就是利滚利。','傍晚五六点商圈下班，往住宅这边回的人多。','你们开车的，饭要按时吃。我这儿大排面管饱。'];
function shopAct(a){
  const sh=UI.shop;if(!sh)return;
  const say=(n,t)=>sh.say.push([n,t]);
  if(a==='leave'){leavePlace();return;}
  if(a==='noodle1'||a==='noodle2'){const p=a==='noodle1'?16:26;if(S.cash<p)return;spend(p,a==='noodle1'?'老陈面馆 · 葱油拌面':'老陈面馆 · 大排面');advance(a==='noodle1'?20:25);S.energy=Math.min(100,S.energy+(a==='noodle1'?10:18));S.ate.push(S.t);S.warned.e25=S.warned.e10=0;say('老陈',pick(['趁热吃。','葱油今天刚熬的。','大排给你挑了块厚的。']));}
  if(a==='chen'){sh.chenTalked=true;advance(5);let tip=pick(CHEN_TIPS);if(!L.met&&Math.random()<.6)tip='后面梧桐路有个调酒的小姑娘，下午一点半常来吃大排，人蛮好的。';say('老陈',tip);}
  if(a==='linMeet'){L.met=true;L.lastSeen=S.t;sh.linTalked=true;L.chatDay=dayOf(S.t);advance(15);addAff(6);linHist('在老陈面馆拼桌认识');say('','（她抬头看了你一眼，把手机往旁边挪了挪）');say('林晚','坐吧，这个点老陈这儿人少。我住后面梧桐路，晚上在永福路调酒。你呢？');}
  if(a==='linChat'){sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(15);addAff(4);const st=linStage();
    say('林晚',st==='见过面'?'又碰到了。你也是这个点吃饭？跑车的作息跟我们差不多乱。':st==='熟人'?pick(['昨晚有桌客人点了二十杯shot，喝完说没带钱。','老陈的葱油是全上海最好吃的，别告诉他我说的。','我在学做低度的酒，喝了不会第二天头疼的那种。']):pick(['你今天看起来累。少跑一点也饿不死。','我算了下，再干一年半，大概能盘下个小门面。','其实我挺喜欢坐你的车的。安静。']));linHist('在面馆聊了一会儿');}
  if(a==='linEgg'){if(S.cash<3)return;spend(3,'给林晚加荷包蛋');sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(10);addAff(5);say('林晚','这么客气。……那下次我请你。');linHist('请她加了个荷包蛋');}
  if(a==='linPromise'){sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(10);addAff(7);say('林晚','一言为定。别到时候说跑车忙。');linHist('约好下回请她吃大排');}
  if(a==='linContact'){L.contact=true;S.threads.lin.hidden=false;addAff(3);say('林晚','行啊，加个微信。收工我叫你。');linHist('加了联系方式');msg('lin','面馆那个开车的？我是林晚。');}
  if(a==='linRiver'){L.flags.river=1;say('林晚','下周二我休息……要不要一起去江边走走？就我们两个。');say('','（原型内容到这里为止。这段关系之后还会继续发展。）');linHist('她约你周二去江边');}
  renderShop();
}
function renderHome(){
  const m=S.t%1440;
  openModal(`<h2>永安里 · 亭子间</h2><div class="muted">${dateStr(S.t)} ${fmt(S.t)} · 精力 ${Math.round(S.energy)}</div>
  <p>十平米的亭子间，窗外是隔壁阿姨晾的被子。楼下有人在用煤炉烧水。</p>
  <button class="opt" data-act="home" data-arg="morning">睡到早上 7 点<small>${(m>=420?'明天':'今天')} 07:00 起床，结算这一天</small></button>
  <button class="opt" data-act="home" data-arg="eight">睡 8 小时<small>${fmt(m+480)} 起床，结算这一天</small></button>
  <button class="opt" data-act="home" data-arg="nap">小睡 1 小时<small>精力 +14，不结算</small></button>
  <button class="opt ${S.lessons>=6?'dis':''}" data-act="home" data-arg="lesson">在家上一节网课<small>《服务沟通入门》${S.lessons}/6 · 45 分钟 · 精力 -5 · 社交 +1</small></button>
  <button class="opt" data-act="home" data-arg="leave">出门，回到车上</button>`,true);
}
function homeAct(a){
  if(a==='leave'){leavePlace();return;}
  if(a==='lesson'){if(S.lessons<6&&S.energy>=8){advance(45);S.energy-=5;S.lessons++;S.social++;logEv(`在家上完网课第 ${S.lessons} 节`);toast(`网课第 ${S.lessons} 节完成，社交 ${S.social}`);}renderHome();return;}
  const start=S.t,m=S.t%1440;let mins;
  if(a==='nap')mins=60;else if(a==='eight')mins=480;else mins=m<420?420-m:1440-m+420;
  fadeTo(a==='nap'?'小睡一会儿……':'睡觉',()=>{
    S.asleep=true;advance(mins);S.asleep=false;
    S.energy=Math.min(100,S.energy+mins/60*(a==='nap'?14:12.5));S.battery=100;S.warned={};
    if(a==='nap'){renderHome();return;}
    showSummary(start);
  });
}
function showSummary(sleepT){
  const w=S.wake,st=linStage();
  const rec={label:dateStr(w.start),wake:fmt(w.start),sleep:fmt(sleepT),online:(w.onlineMin/60).toFixed(1),orders:w.orders,net:w.net,spend:w.spend,cash:Math.floor(S.cash),lin:L.met?`${st} ${Math.round(L.aff)}`:'未认识'};
  S.history.push(rec);
  const dAff=Math.round(L.aff-w.aff0);
  const hist=S.history.map(r=>`<tr><td>${r.label}</td><td>${r.wake}–${r.sleep}</td><td>${r.online}h</td><td>${r.orders}</td><td>¥${r.net}</td><td>¥${r.spend}</td><td>¥${r.cash}</td><td>${r.lin}</td></tr>`).join('');
  const ev=w.events.length?w.events.slice(-14).map(e=>`<div>· ${e}</div>`).join(''):'<div class="muted">平平淡淡的一天。</div>';
  openModal(`<h2>这一天 · ${rec.label}</h2><div class="muted">${rec.wake} 起床 → ${rec.sleep} 入睡</div>
  <table><tr><th>上线时长</th><th>完成订单</th><th>车费总额</th><th>平台抽成</th><th>到手收入</th><th>生活支出</th><th>现金余额</th></tr>
  <tr><td>${rec.online} 小时</td><td>${w.orders}</td><td>¥${w.gross}</td><td>¥${w.fee}</td><td><b>¥${w.net}</b></td><td>¥${w.spend}</td><td><b>¥${rec.cash}</b></td></tr></table>
  <p><b>林晚</b>：${L.met?`${w.stage0} → ${st}（好感 ${dAff>=0?'+':''}${dAff}）`:'还没认识'}　·　<b>下期车租</b>：${S.rent.overdue?'<span style="color:#ff8a8a">已逾期</span>':whenStr(S.rent.due)} ¥${S.rent.amt}${S.debt?`　·　<b style="color:#ff9a9a">网贷待还 ¥${S.debt.amt}</b>`:''}</p>
  <div style="font-size:13px;line-height:1.8;color:#cfcfd2;margin:8px 0">${ev}</div>
  <h2 style="margin-top:16px;font-size:16px">经历记录</h2>
  <table><tr><th>日子</th><th>作息</th><th>上线</th><th>单数</th><th>到手</th><th>支出</th><th>现金</th><th>林晚</th></tr>${hist}</table>
  <button class="btn pri wide" data-act="home" data-arg="leave">起床 · ${dateStr(S.t)} ${fmt(S.t)}</button>`);
  newWake();
}

// ================= 对话框 =================
let dlgTimer=0;
function showDlg(name,text,choices,dur,after){
  UI.dlg={name,text,choices:choices&&choices.length?choices:null,dur:dur||0,after};dlgTimer=0;
  $('#dlgName').textContent=name||'';$('#dlgText').textContent=text||'';$('#dlgText').style.display=text?'':'none';
  const box=$('#dlgChoices');box.innerHTML='';
  if(UI.dlg.choices)UI.dlg.choices.forEach((c,i)=>{const lk=c.req&&S.social<c.req;const b=document.createElement('div');b.className='choice'+(lk?' locked':'');b.innerHTML=`<span class="kbd">${i+1}</span>${c.t}${c.req?`<span class="muted">　[社交 ${c.req}${lk?' · 未达到':''}]</span>`:''}`;b.onpointerdown=()=>chooseDlg(i);box.appendChild(b);});
  $('#dialog').classList.remove('hidden');
}
function hideDlg(){const a=UI.dlg&&UI.dlg.after;UI.dlg=null;$('#dialog').classList.add('hidden');if(a)a();}
function chooseDlg(i){const d=UI.dlg;if(!d||!d.choices||!d.choices[i])return;const c=d.choices[i];if(c.req&&S.social<c.req){toast('社交不足 '+c.req+'（可上网课提升）','warn');return;}UI.dlg=null;$('#dialog').classList.add('hidden');c.fn();}
function dlgUpdate(dt){if(UI.dlg&&!UI.dlg.choices&&UI.dlg.dur){dlgTimer+=dt;if(dlgTimer>UI.dlg.dur)hideDlg();}}

// ================= 模态 / 提示 / 渐变 =================
function openModal(html,side){UI.modal=true;$('#modalCard').innerHTML=html;$('#modal').classList.remove('hidden');$('#modal').classList.toggle('side',!!side);}
function closeModal(){UI.modal=false;$('#modal').classList.add('hidden');}
function toast(html,cls){const d=document.createElement('div');d.className='toast '+(cls||'');d.innerHTML=html;$('#toasts').prepend(d);setTimeout(()=>d.remove(),5200);while($('#toasts').children.length>5)$('#toasts').lastChild.remove();}
let fading=false;
function fadeTo(text,cb){if(fading){cb();return;}fading=true;const f=$('#fade');f.textContent=text;f.style.opacity=1;setTimeout(()=>{cb();renderPhone(true);setTimeout(()=>{f.style.opacity=0;fading=false;},700);},650);}
function bump(t){if(performance.now()-(bump.l||0)<1500)return;bump.l=performance.now();thud();if(t)toast(t,'warn');}

// ================= 手机 =================
const TABS=[['driver','接单'],['nav','导航'],['msg','消息'],['wallet','钱包'],['plan','日程'],['study','学习'],['people','人物']];
const miniCv=document.createElement('canvas');miniCv.width=560;miniCv.height=560;miniCv.className='mini';
let phoneDirty=true,phoneT=0;
function renderPhone(now){phoneDirty=true;if(now)doRenderPhone();}
function doRenderPhone(){
  phoneDirty=false;
  const app=$('#pApp'),st=app.scrollTop;
  const moving=S.loc==='car'&&Math.abs(car.speed)>1.5;
  let h='';
  const lockView=moving&&!['driver','nav'].includes(UI.tab);
  if(lockView)h=`<div class="locked">行驶中<br>停车后再查看</div>`;
  else h=({driver:pDriver,nav:pNav,msg:pMsg,wallet:pWallet,plan:pPlan,study:pStudy,people:pPeople})[UI.tab]();
  app.innerHTML=h;
  const slot=app.querySelector('#mmSlot');if(slot){slot.appendChild(miniCv);drawMini();}
  app.scrollTop=UI.tab==='msg'&&UI.thread?1e5:st;
  const unread=Object.values(S.threads).reduce((a,t)=>a+t.unread,0);
  $('#pTabs').innerHTML=TABS.map(([k,n])=>`<div class="tab ${UI.tab===k?'on':''}" data-act="tab" data-arg="${k}">${n}${k==='msg'&&unread?`<span class="badge">${unread}</span>`:''}${k==='driver'&&S.offer?'<span class="badge">!</span>':''}</div>`).join('');
}
function hotHint(){const h=hourOf(),w=zoneW(h).p,i=w.indexOf(Math.max(...w));return ZN[ZK[i]];}
function pDriver(){
  let h=`<div class="ph1">司机端<div class="switch ${S.online?'on':''}" data-act="online"></div></div>`;
  if(S.locked)h+=`<div class="card" style="border-color:#ff5a5a"><b style="color:#ff9a9a">车辆已限制接单</b><div class="muted">车租逾期，补缴后恢复。去「钱包」处理。</div></div>`;
  if(S.offer){const o=S.offer;h+=`<div class="card hot"><div>${o.tag?`<span class="tag ${o.tag==='远单'?'p':'o'}">${o.tag}</span>`:''}<span class="tag">${o.private?'熟人私单':'实时单'}</span></div>
    <div class="row" style="margin-top:6px"><span class="big">¥${o.net}</span><span class="muted">接驾 ${o.appr.toFixed(1)}km · 全程 ${o.km.toFixed(1)}km</span></div>
    <div style="margin:6px 0;line-height:1.6"><span style="color:#3fe08a">●</span> ${o.pickName}<br><span style="color:#ffa03a">●</span> ${o.dropName}</div>
    <div class="row"><button class="btn" data-act="skip">跳过 [2]</button><button class="btn pri" data-act="accept" style="flex:1">接单 [1]</button></div>
    <div class="cd"><div id="offerCd" style="width:${o.expire/15*100}%"></div></div></div>`;}
  else if(S.order){const o=S.order;h+=`<div class="card"><div class="row"><b>${o.phase==='toPickup'?'前往上车点':'送乘客中'}</b><span class="tag ${o.private?'p':'g'}">${o.private?'私单':'进行中'}</span></div>
    <div style="margin:6px 0;line-height:1.6"><span style="color:#3fe08a">●</span> ${o.pickName}<br><span style="color:#ffa03a">●</span> ${o.dropName}</div>
    <div class="row"><span class="muted">预计到手</span><b>¥${o.net}</b></div>
    <div class="muted">到达标记处停稳，按 E ${o.phase==='toPickup'?'接乘客上车':'确认送达'}</div></div>`;}
  else h+=`<div class="card"><div class="muted">${S.online?'听单中…… 订单由时段和你附近的区域决定。':'下线中。打开右上角开关开始听单（或按 O）。'}</div></div>`;
  const w=S.wake;
  h+=`<div class="card"><div class="row"><span class="muted">今日到手</span><span class="big">¥${w.net}</span></div><div class="row"><span class="muted">完成 ${w.orders} 单 · 在线 ${(w.onlineMin/60).toFixed(1)}h</span><span class="muted">抽成 ¥${w.fee}</span></div></div>
  <div class="card"><div class="muted">当前热区</div><b>${hotHint()}</b><div class="muted" style="margin-top:4px">你在：${ZN[zoneOf(car.x)]}</div></div>`;
  return h;
}
function pNav(){
  const n=navInfo();
  return `<div class="ph1">导航</div><div id="mmSlot"></div>
  <div class="card" style="margin-top:8px">${n?`<div class="row"><b>${n.arrow} ${n.text}</b><span>${Math.round(n.dist)} m</span></div><div class="muted">剩余约 ${(n.remain*KM/1000).toFixed(1)} km · ${Math.max(1,Math.round(n.remain/11))} 分钟</div>`:'<div class="muted">没有导航任务。地图上：面＝老陈面馆，家＝永安里，酒＝退潮酒吧。</div>'}</div>`;
}
function drawMini(){
  const g=miniCv.getContext('2d'),W=miniCv.width,sc=W/680,P=(x,z)=>[(x+340)*sc,(z+340)*sc];
  g.fillStyle='#1b1e24';g.fillRect(0,0,W,W);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){const z=i<2?'#2a2723':i<4?'#232832':'#2c2333';g.fillStyle=z;const[a,b]=P(-293+100*i,-293+100*j);g.fillRect(a,b,86*sc,86*sc);}
  g.fillStyle='#1c3442';const[rx]=P(320,0);g.fillRect(rx,0,W-rx,W);
  g.strokeStyle='#4a4f59';g.lineWidth=12*sc;for(const r of R){let[a,b]=P(-307,r),[c,d]=P(307,r);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();[a,b]=P(r,-307);[c,d]=P(r,307);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();}
  g.strokeStyle='rgba(111,208,255,.35)';g.lineWidth=5*sc;{const[a,b]=P(-307,-200),[c,d]=P(307,-200);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();}
  if(ROUTE){g.strokeStyle='#3fe0c8';g.lineWidth=7;g.lineJoin='round';g.beginPath();ROUTE.forEach((p,k)=>{const[a,b]=P(p.x,p.z);k?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();}
  g.font='bold 20px sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const[k,t,c]of[['shop','面','#ff6a4f'],['home','家','#4fb3ff'],['bar','酒','#c98aff']]){const[a,b]=P(PLACES[k].spot.x,PLACES[k].spot.z);g.fillStyle=c;g.beginPath();g.arc(a,b,14,0,7);g.fill();g.fillStyle='#fff';g.fillText(t,a,b+1);}
  if(S.order){for(const[p,c]of[[S.order.pickup,'#3fe08a'],[S.order.drop,'#ffa03a']]){if(p===S.order.pickup&&S.order.phase!=='toPickup')continue;const[a,b]=P(p.x,p.z);g.fillStyle=c;g.beginPath();g.arc(a,b,10,0,7);g.fill();}}
  const[cx,cz]=P(car.x,car.z);g.save();g.translate(cx,cz);g.rotate(-car.h);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-14);g.lineTo(9,10);g.lineTo(0,5);g.lineTo(-9,10);g.closePath();g.fill();g.restore();
  g.fillStyle='#8a8f99';g.font='16px sans-serif';g.textAlign='left';g.fillText('住宅区',P(-290,0)[0],P(0,-318)[1]);g.fillText('商圈',P(-90,0)[0],P(0,-318)[1]);g.fillText('酒吧街',P(110,0)[0],P(0,-318)[1]);g.fillText('江',P(326,0)[0],P(0,0)[1]);
}
function pMsg(){
  const T=S.threads;
  if(UI.thread){const t=T[UI.thread];
    return `<div class="ph1"><span data-act="back" style="cursor:pointer">‹ ${t.name}</span></div>`+t.msgs.map(m=>`<div class="bub ${m.from==='me'?'me':''}">${m.text}${m.actions&&!m.done?`<div style="margin-top:6px;display:flex;gap:6px">${m.actions.map(a=>`<button class="btn ${a===m.actions[0]?'pri':''}" data-act="${a.act}">${a.label}</button>`).join('')}</div>`:''}<div class="t">${whenStr(m.t)}</div></div>`).join('');}
  return `<div class="ph1">消息</div>`+Object.entries(T).filter(([k,t])=>!t.hidden&&t.msgs.length).sort((a,b)=>b[1].msgs[b[1].msgs.length-1].t-a[1].msgs[a[1].msgs.length-1].t).map(([k,t])=>{const l=t.msgs[t.msgs.length-1];return `<div class="thread" data-act="thread" data-arg="${k}"><div class="ava" style="background:${t.color}">${t.ab}</div><div style="flex:1;min-width:0"><div class="row"><b>${t.name}</b><span class="muted">${fmt(l.t)}</span></div><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.text}</div></div>${t.unread?`<span class="tag r">${t.unread}</span>`:''}</div>`;}).join('');
}
function pWallet(){
  const r=S.rent;
  return `<div class="ph1">钱包</div><div class="card"><div class="muted">可用现金</div><div class="big">¥${Math.floor(S.cash)}</div></div>
  <div class="card ${r.overdue?'hot':''}"><div class="row"><b>车租</b><span class="tag ${r.overdue?'r':''}">${r.overdue?'已逾期':'待扣'}</span></div><div class="row"><span class="muted">${r.overdue?'应于 '+whenStr(r.due):'下次 '+whenStr(r.due)}</span><b>¥${r.amt}</b></div><div class="muted">¥150/天，每 3 天自动扣一次</div>${r.overdue?`<button class="btn pri wide ${S.cash<r.amt?'dis':''}" data-act="payRent">立即补缴</button>`:''}</div>
  ${S.debt?`<div class="card hot"><div class="row"><b>秒借 · 待还</b><b style="color:#ff9a9a">¥${S.debt.amt}</b></div><div class="muted">到期 ${whenStr(S.debt.due)}${S.debt.late?` · 已逾期 ${S.debt.late} 天`:''}</div><button class="btn wide ${S.cash<S.debt.amt?'dis':''}" data-act="payDebt">提前还款</button></div>`:''}
  ${L.lent?`<div class="card"><div class="row"><b>欠林晚</b><b>¥${L.lent}</b></div><button class="btn wide ${S.cash<L.lent?'dis':''}" data-act="repayLin">还给她</button></div>`:''}
  <div class="card"><div class="muted" style="margin-bottom:4px">流水</div>${S.tx.slice(0,14).map(x=>`<div class="row"><span style="font-size:12px">${x.text}<br><span class="muted">${whenStr(x.t)}</span></span><b style="color:${x.amt>0?'#7ef0b0':'#ff9a9a'}">${x.amt>0?'+':''}${x.amt}</b></div>`).join('')||'<div class="muted">暂无</div>'}</div>`;
}
function pPlan(){
  const it=[];const r=S.rent;it.push([r.due,`车租扣款 ¥${r.amt}`]);
  if(S.debt)it.push([S.debt.due,`网贷还款 ¥${S.debt.amt}`]);
  if(L.invite&&L.invite.status!=='ignored')it.push([L.invite.start,`${L.invite.status==='accepted'?'已约':'待回复'}：和林晚在老陈面馆吃${L.invite.kind}`]);
  it.sort((a,b)=>a[0]-b[0]);
  return `<div class="ph1">日程<span class="muted">${dateStr(S.t)}</span></div>
  <div class="card">${it.map(([t,s])=>`<div class="row"><span>${s}</span><span class="muted">${whenStr(t)}</span></div>`).join('')}</div>
  <div class="card"><b>地点</b>
   <div class="row"><span>老陈面馆 <span class="muted">新华路</span></span><span class="tag ${shopOpen()?'g':''}">${shopOpen()?'营业中':'已打烊'}</span></div><div class="muted">06:30–15:00 · 宵夜 21:30–03:00</div>
   <div class="row" style="margin-top:6px"><span>退潮酒吧 <span class="muted">永福路</span></span><span class="muted">18:00–02:00</span></div>
   <div class="row" style="margin-top:6px"><span>永安里 · 家 <span class="muted">华山支路</span></span><span class="muted">睡觉 / 网课</span></div></div>
  ${L.contact?`<div class="card"><b>林晚的作息</b><div class="muted">退潮酒吧上班 18:00–02:00，周二休息。中午常在老陈面馆吃饭。</div></div>`:''}
  <div class="card"><b>车辆</b><div class="row"><span class="muted">白色电动车 · 租赁</span><span>电量 ${Math.round(S.battery)}%</span></div></div>`;
}
function pStudy(){
  return `<div class="ph1">学习</div><div class="card"><b>网课《服务沟通入门》</b><div class="muted">每节 45 分钟 · 精力 -5 · 社交 +1</div><div class="relbar" style="margin:8px 0"><div style="width:${S.lessons/6*100}%;background:#4fb3ff"></div></div><div class="row"><span class="muted">进度 ${S.lessons}/6 · 当前社交 ${S.social}</span></div>
  <button class="btn pri wide ${S.lessons>=6||S.order?'dis':''}" data-act="lesson">${S.lessons>=6?'已完成':'现在上一节（需停车）'}</button></div>
  <div class="card"><b>社交有什么用</b><div class="muted">部分对话选项需要社交等级。更会聊天，更容易和熟人走近。</div></div>
  <div class="card" style="opacity:.5"><b>夜校 · 汽修与保养</b><div class="muted">固定时段，周二周四 19:00（原型未开放）</div></div>`;
}
function pPeople(){
  const st=linStage();
  const lin=L.met?`<div class="card"><div class="row"><span><div class="ava" style="background:#b07ad9;display:inline-flex;width:30px;height:30px;vertical-align:middle;margin-right:6px">晚</div><b>${L.contact||L.flags.bar||L.met?'林晚':'乘客'}</b></span><span class="tag p">${st}</span></div>
    <div class="muted" style="margin-top:4px">调酒师 · 退潮酒吧 · 住梧桐路</div><div class="relbar"><div style="width:${L.aff}%"></div></div><div class="muted">好感 ${Math.round(L.aff)} / 100${L.invite&&L.invite.status==='accepted'?` · 已约 ${whenStr(L.invite.start)}`:''}</div>
    ${STAGE_ORDER.indexOf(st)>=3&&!L.lent&&(S.rent.overdue||S.debt)?`<button class="btn wide" data-act="askLin">开口向她借 ¥300</button>`:''}
    <div class="muted" style="margin:6px 0 2px">相处经过</div><div class="hist">${L.hist.slice().reverse().map(e=>`<div>${whenStr(e.t)}　${e.text}</div>`).join('')}</div></div>`
    :`<div class="card"><div class="muted">还没认识什么人。夜里在酒吧街跑车，或者中午去面馆坐坐，可能会碰到谁。</div></div>`;
  return `<div class="ph1">人物</div>${lin}<div class="card"><div class="row"><b>老陈</b><span class="tag">面馆老板</span></div><div class="muted">新华路老陈面馆。话不多，消息很灵。</div></div>`;
}

// ================= HUD =================
let hudT=0;
function hudUpdate(){
  $('#clock').textContent=fmt(S.t);$('#date').textContent=dateStr(S.t);$('#pTime').textContent=fmt(S.t);
  $('#cash').textContent='¥'+Math.floor(S.cash);$('#cash').style.color=S.cash<0?'#ff8a8a':'';
  $('#energyV').textContent=Math.round(S.energy);$('#energyFill').style.width=S.energy+'%';$('#energyFill').style.background=S.energy<20?'linear-gradient(90deg,#ff5a5a,#ff9a5a)':'';
  $('#socialV').textContent=S.social;
  const kmh=Math.round(Math.abs(car.speed*3.6));
  $('#statusLine').textContent=(S.locked?'限制接单':S.online?(S.order?(S.order.phase==='toPickup'?'接驾中':'送客中'):'听单中'):'离线')+' · '+(S.loc==='car'?(kmh>1?kmh+' km/h':'停车')+' · '+ZN[zoneOf(car.x)]:S.loc==='shop'?'在面馆':'在家');
  $('#tscale').textContent='时间 ×'+S.ts+'（T 切换）';
  $('#vignette').style.opacity=S.energy<10?.85:S.energy<20?.45:0;
  const n=S.loc==='car'?navInfo():null;
  $('#navBanner').classList.toggle('hidden',!n);
  if(n){$('#navArrow').textContent=n.arrow;$('#navDist').textContent=Math.round(n.dist)+' m';$('#navRoad').textContent=n.text;}
}
function promptUpdate(){
  const p=$('#prompt');let txt='';
  if(S.loc==='car'&&!UI.modal){const it=nearInteract();if(it)txt=`<kbd>E</kbd>${it.label}`;else if(S.order&&Math.abs(car.speed)>1.2){const tg=S.order.phase==='toPickup'?S.order.pickup:S.order.drop;if(dist(car,tg)<12)txt='停稳车';}}
  p.innerHTML=txt;p.classList.toggle('hidden',!txt);
}
function nearInteract(){
  if(Math.abs(car.speed)>1.2)return null;
  const o=S.order;
  if(o){const tg=o.phase==='toPickup'?o.pickup:o.drop;if(dist(car,tg)<(o.type==='far'&&o.phase==='toDrop'?16:9))return{label:o.phase==='toPickup'?'接乘客上车':'确认送达，结算车费',fn:o.phase==='toPickup'?pickupPassenger:dropPassenger};}
  if(dist(car,PLACES.shop.spot)<10)return{label:o?'老陈面馆（服务中不可进入）':'进入老陈面馆'+(shopOpen()?'':'（已打烊）'),fn:()=>enterPlace('shop')};
  if(dist(car,PLACES.home.spot)<10)return{label:o?'永安里（服务中）':'回家（永安里）',fn:()=>enterPlace('home')};
  return null;
}

// ================= 音频 =================
let AC=null,engO,engG,nzG;
function initAudio(){try{AC=new (window.AudioContext||window.webkitAudioContext)();engO=AC.createOscillator();engO.type='triangle';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;engG=AC.createGain();engG.gain.value=0;engO.connect(f).connect(engG).connect(AC.destination);engO.start();
  const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let k=0;k<len;k++)d[k]=Math.random()*2-1;const src=AC.createBufferSource();src.buffer=buf;src.loop=true;const nf=AC.createBiquadFilter();nf.type='lowpass';nf.frequency.value=380;nzG=AC.createGain();nzG.gain.value=0;src.connect(nf).connect(nzG).connect(AC.destination);src.start();}catch(e){AC=null;}}
function ping(f=880,d=.15,delay=0){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='sine';const t=AC.currentTime+delay;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.05);}
function ching(){ping(1046,.25);ping(1568,.35,.08);}
function door(){if(!AC)return;ping(180,.12);ping(120,.18,.08);}
function thud(){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(90,AC.currentTime);o.frequency.exponentialRampToValueAtTime(40,AC.currentTime+.25);g.gain.setValueAtTime(.25,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.3);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+.35);}
function audioUpdate(){if(!AC)return;const v=Math.abs(car.speed),inCar=S.loc==='car'&&!UI.modal;engO.frequency.setTargetAtTime(110+v*26,AC.currentTime,.1);engG.gain.setTargetAtTime(inCar?.012+v*.0016:0,AC.currentTime,.2);nzG.gain.setTargetAtTime(inCar?v*.004:0,AC.currentTime,.2);}

// ================= 输入 =================
const keys={};
const KEYMAP={KeyW:'w',ArrowUp:'w',KeyS:'s',ArrowDown:'s',KeyA:'a',ArrowLeft:'a',KeyD:'d',ArrowRight:'d',Space:'space'};
addEventListener('keydown',e=>{
  if(KEYMAP[e.code]){keys[KEYMAP[e.code]]=true;e.preventDefault();}
  if(e.repeat||!S.started)return;
  if(e.code==='KeyE'&&S.loc==='car'&&!UI.modal){const it=nearInteract();if(it)it.fn();}
  if(/^Digit[123]$/.test(e.code)){const n=+e.code.slice(5)-1;
    if(UI.dlg&&UI.dlg.choices)chooseDlg(n);
    else if(S.offer&&!UI.modal){if(n===0)acceptOffer();else if(n===1)skipOffer();}
  }
  if(e.code==='KeyO'&&!UI.modal)setOnline(!S.online);
  if(e.code==='KeyT'){S.ts=S.ts===1?3:S.ts===3?8:1;toast('时间倍速 ×'+S.ts);}
  if(e.code==='KeyP'){UI.phoneHidden=!UI.phoneHidden;$('#phone').classList.toggle('collapsed',UI.phoneHidden);}
  if(e.code==='KeyH'){UI.helpHidden=!UI.helpHidden;$('#help').classList.toggle('hidden',UI.helpHidden);}
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])keys[KEYMAP[e.code]]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;car.lookYaw=clamp(car.lookYaw-(e.clientX-drag.x)*.004,-1.9,1.9);car.lookPitch=clamp(car.lookPitch-(e.clientY-drag.y)*.003,-.6,.5);drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',()=>{drag=null;});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-act]');if(b&&!b.classList.contains('dis')){e.preventDefault();act(b.dataset.act,b.dataset.arg);}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=shopCam.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();shopCam.updateProjectionMatrix();});

// ================= 驾驶 =================
function drive(dt){
  let thr=0,brk=0;
  if(keys.w)thr=1;
  if(keys.s){if(car.speed>.5)brk=1;else thr=-1;}
  if(UI.modal){thr=0;brk=1;}
  if(thr>0)car.speed+=(car.speed<0?9:4.4*(1-car.speed/18))*dt;
  else if(thr<0)car.speed-=3*(1+car.speed/5)*dt;
  if(brk){const s=Math.sign(car.speed);car.speed-=s*10*dt;if(Math.sign(car.speed)!==s)car.speed=0;}
  if(keys.space)car.speed*=1-3*dt;
  if(!thr&&!brk)car.speed*=1-.35*dt;
  if(Math.abs(car.speed)<.04&&!thr)car.speed=0;
  let target=(keys.a?1:0)-(keys.d?1:0);
  if(S.energy<8)target+=Math.sin(performance.now()/700)*.35;
  const sm=.6/(1+Math.abs(car.speed)*.07);
  car.steer+=(target*sm-car.steer)*Math.min(1,dt*6);
  car.h+=car.speed/2.7*Math.tan(car.steer)*dt;
  const fx=-Math.sin(car.h),fz=-Math.cos(car.h),nx=car.x+fx*car.speed*dt,nz=car.z+fz*car.speed*dt;
  if(legal(nx,nz)){car.x=nx;car.z=nz;}
  else if(legal(nx,car.z)){car.x=nx;car.speed*=.97;if(Math.abs(car.speed)>8)bump();}
  else if(legal(car.x,nz)){car.z=nz;car.speed*=.97;if(Math.abs(car.speed)>8)bump();}
  else{if(Math.abs(car.speed)>3)bump('撞上了路沿');car.speed*=-.2;}
}
function placeCar(){
  carG.position.set(car.x,0,car.z);carG.rotation.y=car.h;
  wheelSpin.rotation.z=car.steer*3.2;
  if(!drag){car.lookYaw*=.92;car.lookPitch*=.92;}
  const bob=Math.sin(performance.now()/90)*Math.min(1,Math.abs(car.speed)/15)*.004;
  camera.rotation.set(car.lookPitch-.05+bob,car.lookYaw,-car.steer*Math.abs(car.speed)*.004);
}

// ================= 主循环 =================
let last=performance.now(),clusterT=0;
function update(dt){
  if(S.started&&!UI.modal&&!fading){S.acc+=dt*S.ts;while(S.acc>=1){S.acc-=1;tickMinute();}}
  if(S.loc==='car'){drive(dt);aiUpdate(dt);placeCar();}
  pedUpdate(dt);
  if(S.offer&&!UI.modal){S.offer.expire-=dt;if(S.offer.expire<=0){S.offer=null;S.offerCd=4;renderPhone(true);}else{const c=$('#offerCd');if(c)c.style.width=(S.offer.expire/15*100)+'%';}}
  if(S.offerCd>0)S.offerCd-=dt;
  linRideUpdate(dt);dlgUpdate(dt);
  for(const t of routeTexs)t.offset.x-=dt*1.2;
  if(ROUTE&&routeTarget){rerouteT+=dt;if(rerouteT>1){rerouteT=0;const n=navInfo();if(n&&n.off>14)setRoute(routeTarget);}}
  if(S.order&&S.order.pMesh)animPerson(S.order.pMesh,dt,false);
  mkPick.rotation.y+=dt;mkDrop.rotation.y+=dt;
  if(S.loc==='shop'){linShop.rotation.y=Math.PI+Math.sin(performance.now()/2000)*.15;for(const s of steam){s.userData.t=(s.userData.t+dt*.25)%1;s.position.y=1.6+s.userData.t*1.2;s.material.opacity=.18*(1-s.userData.t);s.scale.setScalar(.2+s.userData.t*.4);}
    if(!drag){car.lookYaw*=.95;car.lookPitch*=.95;}shopCam.rotation.set(car.lookPitch-.08,car.lookYaw,0);}
  envUpdate();
  hudT+=dt;if(hudT>.1){hudT=0;hudUpdate();promptUpdate();audioUpdate();}
  phoneT+=dt;if(phoneT>.35){phoneT=0;doRenderPhone();}else if(UI.tab==='nav'&&miniCv.isConnected)drawMini();
  clusterT+=dt;if(clusterT>.1){clusterT=0;drawCluster();}
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);
  if(S.loc==='shop')renderer.render(shopScene,shopCam);else renderer.render(scene,camera);
  requestAnimationFrame(loop);}

// ================= 开始 =================
function startGame(){
  closeModal();S.started=true;initAudio();newWake();
  msg('chehang','车已交付：白色电动车，沪A·D3***。车租 ¥150/天，每 3 天扣一次，首期 ¥450 周一 10:00 自动扣款。');
  msg('platform','欢迎加入顺路出行。上线后，系统按你所在区域和时段派单。落客位置会影响下一单。');
  renderPhone(true);
}
newWake();
openModal(`<h1>桥西夜班</h1><div class="muted">首轮验证 Demo · 一台车 · 一片街区 · 一家面馆 · 一个人</div>
<p>你刚从车行租下一台白色电动车。车租 ¥150 一天，每 3 天自动扣一次，第一期 ¥450 在<b>周一上午 10 点</b>扣款。口袋里还有 ¥180。</p>
<p>现在是周五下午 4 点半，你停在永安里弄堂口。什么时候出车、在哪片跑、去不去面馆、回不回林晚的消息，都由你决定。城市的时间不会等你。</p>
<div class="ctrls"><span class="kbd">W / S</span><span>油门 / 刹车，停稳后按 S 倒车</span><span class="kbd">A / D</span><span>转向</span><span class="kbd">E</span><span>接乘客、确认送达、进面馆、回家</span><span class="kbd">1 / 2</span><span>接单 / 跳过；对话时选 1-3</span><span class="kbd">O</span><span>上线 / 下线（手机里也能点）</span><span class="kbd">T</span><span>时间倍速 ×1 / ×3 / ×8，等单或测试时用</span><span class="kbd">鼠标拖动</span><span>环顾四周</span></div>
<p class="muted">时间：现实 1 秒 = 游戏 1 分钟。行驶中手机只显示接单和导航，停车后才能看消息、钱包、日程。距离按城市比例放大 4 倍计费。</p>
<button class="btn pri wide" data-act="start" style="padding:12px;font-size:15px">开始 · 周五 16:30</button>`);
renderPhone(true);envUpdate();
requestAnimationFrame(loop);
