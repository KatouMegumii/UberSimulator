
// ================= 交规：交警 / 电子眼 / 驾照记分 / 事故 / 交管 12123 =================
const LAW={pts:12,recs:[],acc:[],study:{need:false,done:0,exam:false},blinkT:0,lastLane:null,lastSide:null,lastV:null,inX:null,spdT:0,phoneT:-99,seq:1,cool:{},pull:null};
const RULES={red:{t:'驾驶机动车违反道路交通信号灯通行',pts:6,fine:200,code:'1625'},solid:{t:'机动车违反禁止标线指示（实线变道）',pts:3,fine:200,code:'1345'},
  noblink:{t:'机动车变更车道时未按规定使用转向灯',pts:1,fine:100,code:'1101'},yellow:{t:'机动车逆向行驶 / 跨越中心实线',pts:3,fine:200,code:'1301'},
  phone:{t:'驾驶时有拨打接听手持电话等妨碍安全驾驶的行为',pts:3,fine:200,code:'1223'},speed1:{t:'驾驶机动车超过规定时速 10% 以上未达 20%',pts:1,fine:100,code:'1352'},speed2:{t:'驾驶机动车超过规定时速 20% 以上未达 50%',pts:6,fine:200,code:'1636'}};
// ---- 电子眼与交警岗 ----
const CAMS=new Set(),COPS=[];const SIGL=[...SIGV];
for(const v of SIGL)if(Math.random()<.45)CAMS.add(v);
const SPEEDCAM=[];for(const e of RE)if(e.c<=2&&e.L>200)for(let s=80;s<e.L-60;s+=rand(600,1000)){const p=pointAt(e,s);SPEEDCAM.push({x:p.x,z:p.z,e:e.i,lim:e.c<=1?60:50});}
// 电子眼杆（立在路口一角，挂摄像头和补光灯）
{const camM=std('#e8e8e6',.4,.3),poleM=std('#5a5e64',.4,.7),lensM=new THREE.MeshStandardMaterial({color:0x111111,roughness:.1,metalness:.6});const P=[];
  for(const v of CAMS){const V=RV[v];P.push({x:V.x+vMaxW[v]/2+2.4,z:V.z-vMaxW[v]/2-2.4});}for(const c of SPEEDCAM)P.push({x:c.x+8,z:c.z});
  const pole=new THREE.CylinderGeometry(.1,.14,6.5,10);pole.translate(0,3.25,0);const arm=new THREE.BoxGeometry(3.2,.12,.12);arm.translate(-1.5,6.2,0);const box=new THREE.BoxGeometry(.55,.32,.32);box.translate(-2.8,5.9,0);const lens=new THREE.CylinderGeometry(.09,.09,.06,12);lens.rotateX(Math.PI/2);lens.translate(-2.8,5.9,-.18);
  for(const[g,m]of[[pole,poleM],[arm,poleM],[box,camM],[lens,lensM]]){const im=new THREE.InstancedMesh(g,m,P.length);P.forEach((p,i)=>{im.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3(p.x,.16,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28),new THREE.Vector3(1,1,1)));});im.castShadow=true;im.frustumCulled=false;scene.add(im);}}
// 交警：在若干信号路口执勤（真人模型 + 警车）
function placeCops(){for(const c of COPS){scene.remove(c.g);if(c.car)scene.remove(c.car);}COPS.length=0;
  const near=SIGL.filter(v=>{const d=Math.hypot(RV[v].x-car.x,RV[v].z-car.z);return d>150&&d<1400;}).sort(()=>Math.random()-.5).slice(0,4);
  for(const v of near){const V=RV[v],o=vMaxW[v]/2+2.5;const x=V.x-o,z=V.z+o;let g;if(typeof makeRealPed==='function'&&typeof PT_WALK!=='undefined'&&PT_WALK[1]){g=makeRealPed(PT_WALK[1]);g.userData.mixer&&g.userData.mixer.update(.3);g.userData.mixer=null;}else g=makePerson({top:'#1d2b4a',bottom:'#1d2433'});
    g.position.set(x,.16,z);g.rotation.y=rand(0,6.28);scene.add(g);
    // 反光背心
    const vest=new THREE.Mesh(new THREE.CylinderGeometry(.2,.19,.42,14,1,true),new THREE.MeshStandardMaterial({color:0xd8ff2a,emissive:0x5a6a00,roughness:.5,side:THREE.DoubleSide}));vest.position.y=1.25;g.add(vest);
    const pc=makeCar('#f2f2f2','sedan');const bar=new THREE.Group();const red=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.22),new THREE.MeshBasicMaterial({color:0xff2020})),blue=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.22),new THREE.MeshBasicMaterial({color:0x2050ff}));red.position.x=-.28;blue.position.x=.28;bar.add(red,blue);bar.position.set(0,1.56,.3);pc.add(bar);
    const n=nearestEdge(x+2,z+6,40);if(n){const p=pointAt(n.e,clamp(n.s+12,0,n.e.L));pc.position.set(p.x-p.dz*(n.e.w/2-1.2),0,p.z+p.dx*(n.e.w/2-1.2));pc.rotation.y=Math.atan2(-p.dx,-p.dz);}
    scene.add(pc);COPS.push({v,g,car:pc,bar:[red,blue]});}}
// ---- 违法记录 ----
function lawNear(list,r){for(const c of list)if(Math.hypot(c.x-car.x,c.z-car.z)<r)return c;return null;}
function violate(kind,where){
  const now=performance.now();if(LAW.cool[kind]&&now-LAW.cool[kind]<8000)return;LAW.cool[kind]=now;
  const R=RULES[kind],place=placeName(car);
  const cop=COPS.find(c=>Math.hypot(RV[c.v].x-car.x,RV[c.v].z-car.z)<80);
  const camV=where&&where.v!==undefined&&CAMS.has(where.v);const camS=where&&where.cam;
  if(cop){LAW.pull={kind,place};copStop(kind,place);return;}
  if(camV||camS||kind==='speed1'||kind==='speed2'&&camS){const rec={id:LAW.seq++,kind,t:S.t,place,notify:S.t+3*1440,st:'pending',src:'电子监控'};LAW.recs.unshift(rec);ping(1400,.05,0,.04);if(camV||camS)flashCam();}
}
function flashCam(){const f=document.getElementById('fade');f.style.transition='none';f.style.background='#fff';f.style.opacity=.55;f.textContent='';setTimeout(()=>{f.style.transition='opacity .4s';f.style.opacity=0;setTimeout(()=>{f.style.background='#000';},420);},60);}
function copStop(kind,place){const R=RULES[kind];car.speed=0;
  openModal(`<h2>交警示意你靠边停车</h2><p>「你好，请出示驾驶证和行驶证。刚才在 ${place}，${R.t}。」</p>
  <div class="say"><b>处罚</b>　记 ${R.pts} 分，罚款 ¥${R.fine}（现场开具简易程序处罚决定书，可在交管 12123 缴纳）</div>
  <button class="opt" data-act="law" data-arg="copok">「好的，我接受处理。」<small>记分立即生效，罚款进入待缴</small></button>
  <button class="opt" data-act="law" data-arg="copplead">「警官，我是跑网约车的，第一次……」<small>态度好也没用，但能少耽误点时间</small></button>`);}
function applyPoints(n,why){LAW.pts=Math.max(0,LAW.pts-n);logEv(`驾照记 ${n} 分（${why}），剩余 ${LAW.pts} 分`);
  if(LAW.pts<=0&&!LAW.study.need){LAW.study={need:true,done:0,exam:false};if(S.online)setOnline(false);car.speed=0;
    notify('jg','交管12123','您的驾驶证记分已满 12 分，需参加满分学习并通过考试后才能驾驶。');
    openModal(`<h2>驾驶证记满 12 分</h2><p>按规定你不能再驾驶机动车，需要完成满分教育学习（7 课时）并通过考试。车辆已停在路边。</p><p class="muted">可以在交管 12123 里完成学习。也可以叫代驾把车开回家（¥80）。</p>
    <button class="opt" data-act="law" data-arg="daijia">叫代驾回家（¥80）</button><button class="opt" data-act="law" data-arg="ok">知道了</button>`);}}
// ---- 事故 ----
function accident(sev,other){if(LAW.acc.find(a=>a.st==='open'&&S.t-a.t<5))return;car.speed=0;
  const cost=sev>1?randi(1800,4200):randi(300,900);const fault=Math.random()<.7?'全责':'同等责任';const a={id:LAW.seq++,t:S.t,place:placeName(car),sev,cost,fault,st:'open'};LAW.acc.unshift(a);
  if(S.order&&S.order.phase==='toDrop'){S.order.bumps+=2;showDlg('乘客','啊！……你怎么开的车？',null,4);}
  if(sev>1){openModal(`<h2>发生交通事故</h2><p>你的车和一辆车追尾，对方司机下车了。现场有人报了警，交警十分钟后到场。</p><div class="say"><b>交警认定</b>　你负${fault}。维修费约 ¥${cost}，由你承担${fault==='全责'?'':'一半'}。</div>
    <button class="opt" data-act="law" data-arg="acc:${a.id}:insure">走保险（自付 ¥${Math.round(cost*.2)}，明年保费上涨）</button><button class="opt" data-act="law" data-arg="acc:${a.id}:cash">私了，直接转账 ¥${fault==='全责'?cost:Math.round(cost/2)}</button>`);
    applyPoints(0,'');advance(10);}
  else{notify('jg','交管12123','发生轻微剐蹭，可使用「事故快处」在线处理。');toast('轻微剐蹭：打开交管12123 →「事故快处」处理，否则对方会报警','warn');}
}
// ---- 每帧检测 ----
function lawUpdate(dt){
  if(S.loc!=='car')return;const v=Math.abs(car.speed);
  if(LAW.study.need&&v>.1){car.speed=0;}
  if(LAW.blinkT>0){LAW.blinkT-=dt;if(LAW.blinkT<=0)car.blink=0;}
  if(car.blink){if(Math.abs(car.steer)>.3)LAW.turned=true;else if(LAW.turned&&Math.abs(car.steer)<.05){car.blink=0;LAW.turned=false;}}
  const n=nearestEdge(car.x,car.z,30);if(!n||v<2)return;const e=n.e;
  const fx=-Math.sin(car.h),fz=-Math.cos(car.h),dir=Math.sign(fx*n.dx+fz*n.dz)||1;
  const lat=((car.x-n.x)*-n.dz+(car.z-n.z)*n.dx)*dir; // 右侧为正
  const s=n.s,rem=dir>0?e.L-s:s,vEnd=dir>0?e.b:e.a,vStart=dir>0?e.a:e.b,inX=rem<vMaxW[vEnd]/2+1;
  // 中心线
  if(!e.o&&e.w>=8.5&&rem>vMaxW[vEnd]/2+4&&(e.L-rem)>vMaxW[vStart]/2+4){if(LAW.lastSide===e.i+':1'&&lat<-.6)violate('yellow',{v:CAMS.has(vEnd)?vEnd:undefined});LAW.lastSide=e.i+':'+(lat>0?1:0);}
  // 变道
  const lanes=e.o?(e.w>=9?2:1):(e.w>=12?2:1);
  if(lanes>1){const bnd=e.o?0:e.w/4;const zone=lat>bnd+.5?1:lat<bnd-.5?0:null;const key=e.i+':'+dir;
    if(zone!==null){if(LAW.lastLane&&LAW.lastLane.k===key&&LAW.lastLane.z!==zone){if(rem<30)violate('solid',{v:vEnd});else if(!car.blink)violate('noblink',{v:CAMS.has(vEnd)?vEnd:undefined});}LAW.lastLane={k:key,z:zone};}}
  // 闯红灯：刚进入路口
  if(inX&&LAW.inX!==vEnd){LAW.inX=vEnd;if(SIGV.has(vEnd)){const ax=Math.abs(n.dx)>Math.abs(n.dz)?'x':'z';if(SIG.now[ax]==='r')violate('red',{v:vEnd});}
    if(SIGV.has(vEnd)&&(UI.phone!=='mount'||performance.now()-LAW.phoneT<2500))violate('phone',{v:vEnd});}
  if(!inX&&LAW.inX===vEnd&&rem>vMaxW[vEnd]/2+6)LAW.inX=null;
  // 超速（测速点 120m 内）
  const sc=lawNear(SPEEDCAM,120);const lim=sc?sc.lim:e.c<=1?60:e.c<=3?50:40;const kmh=v*3.6;
  if(kmh>lim*1.1){LAW.spdT+=dt;if(LAW.spdT>1.5){violate(kmh>lim*1.2?'speed2':'speed1',{cam:!!sc});LAW.spdT=0;}}else LAW.spdT=0;
}
// 电子眼通知：3 天后推送
function lawTick(){for(const r of LAW.recs)if(r.st==='pending'&&S.t>=r.notify){r.st='notified';notify('jg','交管12123',`您有一条交通违法记录待处理：${fmt(r.t%1440)} ${r.place}，${RULES[r.kind].t}`);}
  const m=S.t%1440;if(m===360||!COPS.length&&S.started)placeCops();}
// ---- 交管 12123 App ----
function jgView(){const p=UI.page||'home',pend=LAW.recs.filter(r=>r.st==='notified'||r.st==='cop'),fines=LAW.recs.filter(r=>r.st==='cop');
  const head=`<div class="appbar" style="background:linear-gradient(90deg,#1554c0,#2a7be8)"><span data-act="${p==='home'?'home':'law'}" data-arg="page:home" class="back">‹</span><span>交管12123</span><span></span></div>`;
  let b='';
  if(p==='home')b=`<div class="dcard hero" style="background:linear-gradient(135deg,#1d3f7a,#0f2347)"><div class="muted">机动车驾驶证 · C1</div><div class="big">${LAW.pts} <span style="font-size:16px">分</span></div><div class="row muted"><span>${LAW.study.need?'<b style="color:#ff8a8a">记满 12 分 · 暂停驾驶</b>':'状态：正常'}</span><span>累积记分 ${12-LAW.pts}</span></div></div>
    <div class="bgrid">${[['wf','违法处理',pend.length],['acc','事故快处',LAW.acc.filter(a=>a.st==='open').length],['study','满分学习',0],['rec','抓拍记录',0]].map(([k,n,c])=>`<div data-act="law" data-arg="page:${k}"><span style="color:#1554c0">${({wf:'⚠',acc:'⚑',study:'✎',rec:'◉'})[k]}</span>${n}${c?` <b style="color:#e33">${c}</b>`:''}</div>`).join('')}</div>
    <div class="dcard muted">电子监控抓拍的违法记录，会在 3 天后推送到这里，需要你确认并缴纳罚款，确认后才扣分。现场被交警查处的，当场记分。</div>`;
  else if(p==='wf')b=`<div class="sect">待处理违法</div>`+(pend.length?pend.map(r=>{const R=RULES[r.kind];return `<div class="dcard"><div class="row"><b>${R.t}</b></div><div class="muted">${whenStr(r.t)} · ${r.place} · ${r.src}</div><div class="row"><span>记 ${R.pts} 分 · 罚款 ¥${R.fine}</span><button class="btn pri" data-act="law" data-arg="pay:${r.id}">${r.st==='cop'?'缴纳罚款':'确认并缴款'}</button></div></div>`;}).join(''):'<div class="dcard muted">没有待处理的违法记录</div>');
  else if(p==='rec')b=`<div class="sect">电子监控抓拍记录</div>`+(LAW.recs.length?LAW.recs.map(r=>`<div class="dcard"><div class="row"><b>${RULES[r.kind].t}</b><span class="tag ${r.st==='done'?'g':r.st==='pending'?'':'r'}">${({pending:'审核中',notified:'待处理',cop:'待缴款',done:'已处理'})[r.st]}</span></div><div class="muted">${whenStr(r.t)} · ${r.place}${r.st==='pending'?` · 预计 ${whenStr(r.notify)} 推送`:''}</div></div>`).join(''):'<div class="dcard muted">暂无记录</div>');
  else if(p==='acc')b=`<div class="sect">事故快处</div>`+(LAW.acc.length?LAW.acc.map(a=>`<div class="dcard"><div class="row"><b>${a.sev>1?'追尾事故':'轻微剐蹭'}</b><span class="tag ${a.st==='open'?'r':'g'}">${a.st==='open'?'待处理':'已处理'}</span></div><div class="muted">${whenStr(a.t)} · ${a.place} · 你方${a.fault}</div>${a.st==='open'?`<div class="row" style="margin-top:6px"><span>维修约 ¥${a.cost}</span><span><button class="btn" data-act="law" data-arg="acc:${a.id}:insure">走保险</button> <button class="btn pri" data-act="law" data-arg="acc:${a.id}:cash">赔付 ¥${a.fault==='全责'?a.cost:Math.round(a.cost/2)}</button></span></div>`:''}</div>`).join(''):'<div class="dcard muted">没有事故记录</div>');
  else if(p==='study'){const st=LAW.study;b=`<div class="sect">满分教育学习</div><div class="dcard">${st.need?`<div class="row"><b>学习进度</b><span>${st.done} / 7 课时</span></div><div class="waitbar" style="margin:8px 0"><div style="width:${st.done/7*100}%"></div></div>
    <button class="btn pri wide ${st.done>=7?'dis':''}" data-act="law" data-arg="learn">学习一课时（游戏内 1 小时，需停车）</button>
    <button class="btn wide ${st.done<7?'dis':''}" data-act="law" data-arg="exam">参加考试</button>`:'<div class="muted">驾驶证状态正常，无需满分学习。</div>'}</div>`;
    if(UI.examQ!=null)b+=examView();}
  return head+`<div class="abody">${b}</div>`;}
const EXAM=[['在信号灯为红灯时，右转车辆应当？',['直接右转','在不妨碍被放行车辆和行人通行的情况下通过','停车等待绿灯'],1],['变更车道时，驾驶人应当？',['提前开启转向灯，确认安全后变道','直接变道，速度要快','鸣喇叭后变道'],0],['驾驶中使用手持手机会被？',['口头警告','记 3 分并罚款','不处罚'],1]];
function examView(){const q=EXAM[UI.examQ];return `<div class="dcard"><b>第 ${UI.examQ+1} 题　${q[0]}</b>${q[1].map((o,i)=>`<button class="opt" style="color:#111;background:#f2f3f5" data-act="law" data-arg="ans:${i}">${o}</button>`).join('')}</div>`;}
function lawAct(arg){const[a,b,c,d]=String(arg).split(':');
  if(a==='ped'){const cost=+b,pts=+c;const amt=d==='ins'?Math.round(cost*.15):cost;if(!pay(amt,'交通事故赔付（行人）'))return;closeModal();applyPoints(pts,'未礼让行人');LAW.acc.unshift({id:LAW.seq++,t:S.t,place:placeName(car),sev:3,cost,fault:'主要责任',st:'done'});advance(90);logEv(`撞到行人，赔付 ¥${amt}，记 ${pts} 分`);renderPhone(true);return;}
  if(a==='page'){UI.page=b;UI.examQ=null;}
  else if(a==='pay'){const r=LAW.recs.find(x=>x.id==b);if(!r)return;const R=RULES[r.kind];if(!pay(R.fine,'交通违法罚款 · '+R.code))return;if(r.st!=='cop')applyPoints(R.pts,R.t);r.st='done';toast(`已缴纳罚款 ¥${R.fine}${r.st!=='cop'?`，记 ${R.pts} 分`:''}`);}
  else if(a==='copok'||a==='copplead'){const P=LAW.pull;if(!P)return;const R=RULES[P.kind];closeModal();advance(a==='copok'?15:25);applyPoints(R.pts,R.t);LAW.recs.unshift({id:LAW.seq++,kind:P.kind,t:S.t,place:P.place,notify:S.t,st:'cop',src:'交警现场'});notify('jg','交管12123',`现场处罚：记 ${R.pts} 分，罚款 ¥${R.fine} 待缴纳`);LAW.pull=null;}
  else if(a==='acc'){const x=LAW.acc.find(q=>q.id==b);if(!x||x.st!=='open')return;const amt=c==='insure'?Math.round(x.cost*.2):(x.fault==='全责'?x.cost:Math.round(x.cost/2));if(!pay(amt,c==='insure'?'事故维修自付':'事故赔付'))return;x.st='done';closeModal();toast('事故已处理');logEv(`处理交通事故，花费 ¥${amt}`);}
  else if(a==='learn'){if(Math.abs(car.speed)>.5)return;advance(60);LAW.study.done++;toast(`满分学习 ${LAW.study.done}/7 课时`);}
  else if(a==='exam'){UI.examQ=0;UI.examOK=0;}
  else if(a==='ans'){if(+b===EXAM[UI.examQ][2])UI.examOK++;UI.examQ++;if(UI.examQ>=EXAM.length){const ok=UI.examOK===EXAM.length;UI.examQ=null;if(ok){LAW.pts=12;LAW.study={need:false,done:0,exam:false};notify('jg','交管12123','满分学习考试通过，驾驶证记分已清零，恢复驾驶。');}else toast('考试未通过，再学习一遍','warn');}}
  else if(a==='daijia'){if(pay(80,'代驾回家')){closeModal();fadeTo('代驾师傅把车开回了永安里',()=>{car.x=PLACES.home.spot.x;car.z=PLACES.home.spot.z;car.h=PLACES.home.spot.h;car.speed=0;advance(40);});}}
  else if(a==='ok')closeModal();
  renderPhone(true);}
