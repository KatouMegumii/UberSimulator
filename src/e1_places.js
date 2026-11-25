
// ================= 场所：面馆 / 家 =================
function shopOpen(){const m=S.t%1440;return(m>=390&&m<900)||m>=1290||m<180;}
function enterPlace(k){
  if(S.order){toast('服务中，先完成订单','warn');return;}
  if(k==='shop'&&!shopOpen()){toast('老陈面馆已打烊（06:30–15:00 / 宵夜 21:30–03:00）','warn');return;}
  if(S.online){S.online=false;S.offer=null;toast('已自动下线');}
  car.speed=0;
  fadeTo(k==='shop'?'老陈面馆':'永安里',()=>{
    S.loc=k;setPhoneMode('hand');
    if(k==='shop'){UI.shop={say:[],linTalked:false,chenTalked:false};const iv=L.invite;
      if(iv&&iv.status==='accepted'&&S.t>=iv.start-10&&S.t<=iv.end&&!iv.attended){iv.attended=true;L.lastSeen=S.t;addAff(10);linHist(`赴约，一起吃了${iv.kind}`);UI.shop.say.push(['林晚','你还真来了。我还跟老陈打赌你会放我鸽子。']);UI.shop.linTalked=true;}
      shopCam.rotation.set(0,0,0);renderShop();}
    else renderHome();
  });
}
function leavePlace(){fadeTo('',()=>{S.loc='car';closeModal();setPhoneMode('mount');renderPhone(true);});}
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
  openModal(`<h2>老陈面馆</h2><div class="muted">${dateStr(S.t)} ${fmt(S.t)} · 银行卡 ¥${S.cash.toFixed(2)} · 精力 ${Math.round(S.energy)}</div>
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
  if(a==='noodle1'||a==='noodle2'){const p=a==='noodle1'?16:26;if(!pay(p,a==='noodle1'?'老陈面馆 · 葱油拌面':'老陈面馆 · 大排面'))return;advance(a==='noodle1'?20:25);S.energy=Math.min(100,S.energy+(a==='noodle1'?10:18));S.ate.push(S.t);S.warned.e25=S.warned.e10=0;say('老陈',pick(['趁热吃。','葱油今天刚熬的。','大排给你挑了块厚的。']));}
  if(a==='chen'){sh.chenTalked=true;advance(5);let tip=pick(CHEN_TIPS);if(!L.met&&Math.random()<.6)tip='后面梧桐路有个调酒的小姑娘，下午一点半常来吃大排，人蛮好的。';say('老陈',tip);}
  if(a==='linMeet'){L.met=true;L.lastSeen=S.t;sh.linTalked=true;L.chatDay=dayOf(S.t);advance(15);addAff(6);linHist('在老陈面馆拼桌认识');say('','（她抬头看了你一眼，把手机往旁边挪了挪）');say('林晚','坐吧，这个点老陈这儿人少。我住后面梧桐路，晚上在永福路调酒。你呢？');}
  if(a==='linChat'){sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(15);addAff(4);const st=linStage();
    say('林晚',st==='见过面'?'又碰到了。你也是这个点吃饭？跑车的作息跟我们差不多乱。':st==='熟人'?pick(['昨晚有桌客人点了二十杯shot，喝完说没带钱。','老陈的葱油是全上海最好吃的，别告诉他我说的。','我在学做低度的酒，喝了不会第二天头疼的那种。']):pick(['你今天看起来累。少跑一点也饿不死。','我算了下，再干一年半，大概能盘下个小门面。','其实我挺喜欢坐你的车的。安静。']));linHist('在面馆聊了一会儿');}
  if(a==='linEgg'){if(!pay(3,'老陈面馆 · 加荷包蛋'))return;sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(10);addAff(5);say('林晚','这么客气。……那下次我请你。');linHist('请她加了个荷包蛋');}
  if(a==='linPromise'){sh.linTalked=true;L.chatDay=dayOf(S.t);L.lastSeen=S.t;advance(10);addAff(7);say('林晚','一言为定。别到时候说跑车忙。');linHist('约好下回请她吃大排');}
  if(a==='linContact'){L.contact=true;S.threads.lin.hidden=false;addAff(3);say('林晚','行啊，加个微信。收工我叫你。');linHist('加了联系方式');msg('lin','面馆那个开车的？我是林晚。');}
  if(a==='linRiver'){L.flags.river=1;say('林晚','下周二我休息……要不要一起去江边走走？就我们两个。');say('','（原型内容到这里为止。这段关系之后还会继续发展。）');linHist('她约你周二去江边');}
  renderShop();
}
function renderHome(){
  const m=S.t%1440;
  openModal(`<h2>永安里 · 亭子间</h2><div class="muted">${dateStr(S.t)} ${fmt(S.t)} · 精力 ${Math.round(S.energy)}</div>
  <p>十平米的亭子间，窗外是隔壁阿姨晾的被子。楼下有人在用煤炉烧水。</p>
  <button class="opt" data-act="home2" data-arg="morning">睡到早上 7 点<small>${(m>=420?'明天':'今天')} 07:00 起床，结算这一天</small></button>
  <button class="opt" data-act="home2" data-arg="eight">睡 8 小时<small>${fmt(m+480)} 起床，结算这一天</small></button>
  <button class="opt" data-act="home2" data-arg="nap">小睡 1 小时<small>精力 +14，不结算</small></button>
  <button class="opt ${S.lessons>=6?'dis':''}" data-act="home2" data-arg="lesson">在家上一节网课<small>《服务沟通入门》${S.lessons}/6 · 45 分钟 · 精力 -5 · 社交 +1</small></button>
  <button class="opt" data-act="home2" data-arg="leave">出门，回到车上</button>`,true);
}
function homeAct(a){
  if(a==='leave'){leavePlace();return;}
  if(a==='lesson'){if(S.lessons<6&&S.energy>=8){advance(45);S.energy-=5;S.lessons++;S.social++;logEv(`在家上完网课第 ${S.lessons} 节`);toast(`网课第 ${S.lessons} 节完成，社交 ${S.social}`);}renderHome();return;}
  const start=S.t,m=S.t%1440;let mins;
  if(a==='nap')mins=60;else if(a==='eight')mins=480;else mins=m<420?420-m:1440-m+420;
  fadeTo(a==='nap'?'小睡一会儿……':'睡觉',()=>{
    S.asleep=true;advance(mins);S.asleep=false;
    S.energy=Math.min(100,S.energy+mins/60*(a==='nap'?14:12.5));S.warned={};
    if(a==='nap'){renderHome();return;}
    showSummary(start);
  });
}
function showSummary(sleepT){
  const w=S.wake,st=linStage();
  const sv=secValue();const rec={label:dateStr(w.start),wake:fmt(w.start),sleep:fmt(sleepT),online:(w.onlineMin/60).toFixed(1),orders:w.orders,net:Math.round(w.net),spend:Math.round(w.spend),cash:Math.round(S.cash+S.dw+sv),score:S.score.toFixed(1),stock:Math.round(sv),lin:L.met?`${st} ${Math.round(L.aff)}`:'未认识'};
  S.history.push(rec);
  const dAff=Math.round(L.aff-w.aff0);
  const hist=S.history.map(r=>`<tr><td>${r.label}</td><td>${r.wake}–${r.sleep}</td><td>${r.online}h</td><td>${r.orders}</td><td>¥${r.net}</td><td>¥${r.spend}</td><td>¥${r.cash}</td><td>¥${r.stock}</td><td>${r.score}</td><td>${r.lin}</td></tr>`).join('');
  const ev=w.events.length?w.events.slice(-14).map(e=>`<div>· ${e}</div>`).join(''):'<div class="muted">平平淡淡的一天。</div>';
  openModal(`<h2>这一天 · ${rec.label}</h2><div class="muted">${rec.wake} 起床 → ${rec.sleep} 入睡</div>
  <table><tr><th>上线时长</th><th>完成订单</th><th>车费总额</th><th>平台抽成</th><th>到手收入</th><th>生活支出</th><th>总资产</th></tr>
  <tr><td>${rec.online} 小时</td><td>${w.orders}</td><td>¥${w.gross.toFixed(2)}</td><td>¥${w.fee.toFixed(2)}</td><td><b>¥${w.net.toFixed(2)}</b></td><td>¥${w.spend.toFixed(2)}</td><td><b>¥${rec.cash}</b></td></tr></table>
  <p class="muted">银行卡 ¥${S.cash.toFixed(2)} · 司机钱包 ¥${S.dw.toFixed(2)} · 证券账户 ¥${sv.toFixed(2)}（当日变动 ${(sv-w.pnl0>=0?'+':'')+(sv-w.pnl0).toFixed(2)}，含转入转出）· 服务分 ${w.score0.toFixed(1)} → ${S.score.toFixed(1)}</p>
  <p><b>林晚</b>：${L.met?`${w.stage0} → ${st}（好感 ${dAff>=0?'+':''}${dAff}）`:'还没认识'}　·　<b>下期车租</b>：${S.rent.overdue?'<span style="color:#ff8a8a">已逾期</span>':whenStr(S.rent.due)} ¥${S.rent.amt}${S.debt?`　·　<b style="color:#ff9a9a">网贷待还 ¥${S.debt.amt}</b>`:''}</p>
  <div style="font-size:13px;line-height:1.8;color:#cfcfd2;margin:8px 0">${ev}</div>
  <h2 style="margin-top:16px;font-size:16px">经历记录</h2>
  <table><tr><th>日子</th><th>作息</th><th>上线</th><th>单数</th><th>到手</th><th>支出</th><th>总资产</th><th>股票账户</th><th>服务分</th><th>林晚</th></tr>${hist}</table>
  <button class="btn pri wide" data-act="home2" data-arg="leave">起床 · ${dateStr(S.t)} ${fmt(S.t)}</button>`);
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
function toast(html,cls){const d=document.createElement('div');d.className='toast '+(cls||'');d.innerHTML=html;$('#toasts').prepend(d);setTimeout(()=>d.remove(),5200);while($('#toasts').children.length>3)$('#toasts').lastChild.remove();}
let fading=false;
function fadeTo(text,cb){if(fading){cb();return;}fading=true;const f=$('#fade');f.textContent=text;f.style.opacity=1;setTimeout(()=>{cb();renderPhone(true);setTimeout(()=>{f.style.opacity=0;fading=false;},700);},650);}
function bump(t){car.shake=Math.max(car.shake,.6);if(performance.now()-(bump.l||0)<1500)return;bump.l=performance.now();thud();if(S.order&&S.order.phase==='toDrop'){S.order.bumps++;if(S.order.npc!=='lin'&&S.order.bumps===1)showDlg('乘客','哎哟——师傅开稳一点。',null,3);}if(t)toast(t,'warn');}

