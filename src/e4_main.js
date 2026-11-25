
// ================= 车身阴影代理（不可见，只投影）=================
{const sm=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});const G=carGeos('sedan');
  const b=new THREE.Mesh(G.body,sm);b.castShadow=true;carG.add(b);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,1.5),sm);roof.position.set(0,1.46,.5);roof.castShadow=true;carG.add(roof);
  carG.traverse(o=>{if(o.isMesh&&o.material!==windM&&o.material!==sm)o.castShadow=true;});}
mountG.position.set(-.1,.99,-.34);

// ================= HUD =================
let hudT=0;
function hudUpdate(){
  $('#clock').textContent=fmt(S.t);$('#date').textContent=dateStr(S.t);
  $('#cash').textContent='¥'+S.cash.toFixed(0);$('#dw').textContent='¥'+S.dw.toFixed(0);
  $('#energyV').textContent=Math.round(S.energy);$('#energyFill').style.width=S.energy+'%';$('#energyFill').className=S.energy<20?'low':'';
  const kmh=Math.round(Math.abs(car.speed*3.6));
  $('#statusLine').textContent=(S.locked?'限制接单':S.online?(S.order?({toPickup:'接驾中',waiting:'等乘客',verify:'核验尾号',toDrop:'送客中',settle:'待结算'})[S.order.phase]:'听单中'):'未出车')+' · '+(S.loc==='car'?ZN[zoneOf(car.x)]:S.loc==='shop'?'老陈面馆':'家');
  $('#tscale').textContent=S.ts>1?'时间 ×'+S.ts:'';
  const n=S.loc==='car'&&!UI.modal?navInfo():null;
  $('#navBanner').classList.toggle('hidden',!n);
  if(n){$('#navArrow').textContent=n.arrow;$('#navDist').textContent=Math.round(n.dist*KM)+' 米';$('#navRoad').textContent=n.text;
    const o=S.order;if(o){const ddl=o.phase==='toDrop'?o.dropDdl:o.pickDdl,left=ddl-S.t;$('#navDdl').textContent=o.phase==='toPickup'||o.phase==='toDrop'?(left>=0?`${o.phase==='toPickup'?'接驾':'送达'}还剩 ${left} 分`:`已超时 ${-left} 分`):'';$('#navDdl').className=left<0?'late':left<4?'warn':'';}else $('#navDdl').textContent='';}
  car.blink=n&&n.dist*KM<160&&(n.arrow==='↰'||n.arrow==='↱')?(n.arrow==='↰'?-1:1):0;
}
function promptUpdate(){
  const p=$('#prompt');let txt='';
  if(S.loc==='car'&&!UI.modal){const it=nearInteract();if(it)txt=`<kbd>E</kbd>${it.label}`;
    else if(S.order&&(S.order.phase==='toPickup'||S.order.phase==='toDrop')){const tg=S.order.phase==='toPickup'?S.order.pickup:S.order.drop;if(dist(car,tg)<14&&Math.abs(car.speed)>1.2)txt='靠边停稳车';}
    else if(S.order&&S.order.phase==='verify')txt=S.order.mismatch?'尾号不符':'<kbd>0-9</kbd>输入乘客说的手机尾号';
    else if(S.offer)txt='<kbd>1</kbd>接单　<kbd>2</kbd>不接　<kbd>Tab</kbd>看手机';}
  p.innerHTML=txt;p.classList.toggle('hidden',!txt);
}
function nearInteract(){
  const o=S.order,slow=Math.abs(car.speed)<1.2;
  if(o&&o.phase==='settle')return{label:'确认账单',fn:confirmBill};
  if(!slow)return null;
  if(o&&o.phase==='toPickup'&&dist(car,o.pickup)<10)return{label:'到达上车点',fn:arrivePickup};
  if(o&&o.phase==='toDrop'&&dist(car,o.drop)<(o.far?18:10))return{label:'到达目的地',fn:arriveDrop};
  if(!o&&dist(car,PLACES.shop.spot)<10)return{label:'进入老陈面馆'+(shopOpen()?'':'（已打烊）'),fn:()=>enterPlace('shop')};
  if(!o&&dist(car,PLACES.home.spot)<10)return{label:'回家（永安里）',fn:()=>enterPlace('home')};
  return null;
}
function tryArrive(){const it=nearInteract();if(it&&(it.fn===arrivePickup||it.fn===arriveDrop||it.fn===confirmBill))it.fn();else toast('还没到，靠近标记点并停稳','warn');}

// ================= 音频 =================
let AC=null,engO,engO2,engG,nzG,nzF;
function initAudio(){try{AC=new (window.AudioContext||window.webkitAudioContext)();
  engO=AC.createOscillator();engO.type='sawtooth';engO2=AC.createOscillator();engO2.type='sine';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;engG=AC.createGain();engG.gain.value=0;engO.connect(f);engO2.connect(f);f.connect(engG).connect(AC.destination);engO.start();engO2.start();
  const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);let last=0;for(let k=0;k<len;k++){last=(last+(Math.random()*2-1)*.06)*.985;d[k]=last*4;}
  const src=AC.createBufferSource();src.buffer=buf;src.loop=true;nzF=AC.createBiquadFilter();nzF.type='lowpass';nzF.frequency.value=300;nzG=AC.createGain();nzG.gain.value=0;src.connect(nzF).connect(nzG).connect(AC.destination);src.start();}catch(e){AC=null;}}
function ping(f=880,d=.15,delay=0,vol=.07){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='sine';const t=AC.currentTime+delay;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.05);}
function ching(){ping(1046,.25);ping(1568,.35,.08);}
function door2(){if(!AC)return;thud(.18);setTimeout(()=>thud(.25),350);}
function thud(v=.25){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(90,AC.currentTime);o.frequency.exponentialRampToValueAtTime(40,AC.currentTime+.25);g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.3);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+.35);}
let tickPh=0;
function audioUpdate(){if(!AC)return;const v=Math.abs(car.speed),inCar=S.loc==='car'&&!UI.modal,t=AC.currentTime;
  engO.frequency.setTargetAtTime(38+v*3.2+Math.max(0,car.accel)*4,t,.08);engO2.frequency.setTargetAtTime(76+v*6,t,.08);engG.gain.setTargetAtTime(inCar?.01+v*.0012+Math.max(0,car.accel)*.004:0,t,.15);
  nzG.gain.setTargetAtTime(inCar?Math.min(.06,v*.004):0,t,.2);nzF.frequency.setTargetAtTime(220+v*25,t,.2);
  const bl=car.blink&&(performance.now()%800<400);if(bl!==tickPh){tickPh=bl;if(car.blink&&inCar)ping(bl?2400:1800,.02,0,.03);}}

// ================= 输入 =================
const keys={};
const KEYMAP={KeyW:'w',ArrowUp:'w',KeyS:'s',ArrowDown:'s',KeyA:'a',ArrowLeft:'a',KeyD:'d',ArrowRight:'d',Space:'space'};
addEventListener('keydown',e=>{
  if(KEYMAP[e.code]){keys[KEYMAP[e.code]]=true;e.preventDefault();}
  if(e.code==='Tab'){e.preventDefault();}
  if(e.repeat||!S.started)return;
  if(e.code==='Tab'&&S.loc==='car'){setPhoneMode(UI.phone==='glance'?'mount':'glance');}
  if(e.code==='KeyP'&&S.loc==='car'){setPhoneMode(UI.phone==='hand'?'mount':'hand');}
  if(e.code==='Escape'){if(UI.phone!=='mount'&&S.loc==='car')setPhoneMode('mount');else if(UI.app)goHome();}
  if(e.code==='KeyE'&&S.loc==='car'&&!UI.modal){const it=nearInteract();if(it)it.fn();}
  const dg=/^(Digit|Numpad)(\d)$/.exec(e.code);
  if(dg){const n=+dg[2];
    if(UI.dlg&&UI.dlg.choices&&n>=1&&n<=3)chooseDlg(n-1);
    else if(S.order&&S.order.phase==='verify'&&!S.order.mismatch)act('key',String(n));
    else if(S.offer&&!UI.modal){if(n===1)acceptOffer();else if(n===2)skipOffer();}}
  if(e.code==='Backspace'&&S.order&&S.order.phase==='verify')act('key','⌫');
  if(e.code==='KeyO'&&!UI.modal&&S.loc==='car')setOnline(!S.online);
  if(e.code==='KeyT'){S.ts=S.ts===1?3:S.ts===3?8:1;toast('时间倍速 ×'+S.ts);}
  if(e.code==='KeyH'){UI.helpHidden=!UI.helpHidden;$('#help').classList.toggle('hidden',UI.helpHidden);}
  if(e.code==='KeyV'){UI.voice=!UI.voice;toast('语音播报 '+(UI.voice?'开':'关'));}
  if(e.code==='KeyG'){POST.on=!POST.on;toast('后期效果 '+(POST.on?'开':'关'));}
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])keys[KEYMAP[e.code]]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;car.lookYaw=clamp(car.lookYaw-(e.clientX-drag.x)*.004,-2.2,2.2);car.lookPitch=clamp(car.lookPitch-(e.clientY-drag.y)*.003,-.7,.5);drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',()=>{drag=null;});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-act]');if(b&&!b.classList.contains('dis')){e.preventDefault();if(!AC&&S.started)initAudio();act(b.dataset.act,b.dataset.arg);return;}
  if(e.target.closest('#phone')&&UI.phone==='mount'&&S.loc==='car')setPhoneMode('glance');
  if(e.target.closest('#pBanner')){const a=$('#pBanner').dataset.app;if(a)openApp(a);}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=shopCam.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();shopCam.updateProjectionMatrix();POST.resize();});

// ================= 手机定位：车载支架 / 低头看 / 拿在手上 =================
function setPhoneMode(m){UI.phone=m;$('#phone').className='ph-'+m;$('#phoneHint').textContent=m==='glance'?'Tab / Esc 抬头看路':m==='hand'?'P 放回支架':'Tab 低头看手机 · P 拿在手上';renderPhone(true);}
function adj(m){return[m[4]*m[8]-m[5]*m[7],m[2]*m[7]-m[1]*m[8],m[1]*m[5]-m[2]*m[4],m[5]*m[6]-m[3]*m[8],m[0]*m[8]-m[2]*m[6],m[2]*m[3]-m[0]*m[5],m[3]*m[7]-m[4]*m[6],m[1]*m[6]-m[0]*m[7],m[0]*m[4]-m[1]*m[3]];}
function mmm(a,b){const c=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){let s=0;for(let k=0;k<3;k++)s+=a[3*i+k]*b[3*k+j];c[3*i+j]=s;}return c;}
function mmv(m,v){return[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];}
function basis(p){const m=[p[0],p[2],p[4],p[1],p[3],p[5],1,1,1],v=mmv(adj(m),[p[6],p[7],1]);return mmm(m,[v[0],0,0,0,v[1],0,0,0,v[2]]);}
function proj2d(src,dst){return mmm(basis(dst),adj(basis(src)));}
const _pc=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
function placePhoneDOM(){
  const el=$('#phone');if(UI.phone==='hand'||S.loc!=='car'){el.style.transform=`scale(${Math.min(1,(innerHeight-40)/790)})`;el.style.visibility='visible';return;}
  carG.updateMatrixWorld(true);const W=360,H=760,hw=PHONE_W/2,hh=PHONE_H/2;const loc=[[-hw,hh],[hw,hh],[-hw,-hh],[hw,-hh]];
  const dst=[];let behind=false;
  for(let k=0;k<4;k++){_pc[k].set(loc[k][0],loc[k][1],.0007);phoneScreen.localToWorld(_pc[k].set(loc[k][0],loc[k][1],0));_pc[k].project(camera);if(_pc[k].z>1)behind=true;dst.push((_pc[k].x+1)/2*innerWidth,(1-_pc[k].y)/2*innerHeight);}
  if(behind){el.style.visibility='hidden';return;}el.style.visibility='visible';
  const t=proj2d([0,0,W,0,0,H,W,H],dst);for(let k=0;k<9;k++)t[k]/=t[8];
  el.style.transform=`matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
}
const _pv=new THREE.Vector3();
function glanceTarget(){mountG.updateMatrixWorld(true);_pv.set(0,0,0);phoneScreen.localToWorld(_pv);carG.worldToLocal(_pv);_pv.sub(head.position);return{yaw:Math.atan2(-_pv.x,-_pv.z),pitch:Math.atan2(_pv.y,Math.hypot(_pv.x,_pv.z))};}

// ================= 驾驶 =================
function drive(dt){
  let thr=0,brk=0;const v0=car.speed;
  if(keys.w)thr=1;
  if(keys.s){if(car.speed>.5)brk=1;else thr=-1;}
  if(UI.modal){thr=0;brk=1;}
  if(thr>0)car.speed+=(car.speed<0?9:3.6*(1-car.speed/17.5))*dt;
  else if(thr<0)car.speed-=2.6*(1+car.speed/5)*dt;
  if(brk){const s=Math.sign(car.speed);car.speed-=s*8.5*dt;if(Math.sign(car.speed)!==s)car.speed=0;}
  if(keys.space){const s=Math.sign(car.speed);car.speed-=s*12*dt;if(Math.sign(car.speed)!==s)car.speed=0;}
  if(!thr&&!brk)car.speed*=1-.25*dt;
  if(Math.abs(car.speed)<.04&&!thr)car.speed=0;
  let target=(keys.a?1:0)-(keys.d?1:0);
  if(S.energy<8)target+=Math.sin(performance.now()/700)*.35;
  const sm=.62/(1+Math.abs(car.speed)*.08);
  car.steer+=(target*sm-car.steer)*Math.min(1,dt*(target?3.2:5));
  car.h+=car.speed/2.75*Math.tan(car.steer)*dt;
  const fx=-Math.sin(car.h),fz=-Math.cos(car.h),nx=car.x+fx*car.speed*dt,nz=car.z+fz*car.speed*dt;
  if(legal(nx,nz)){car.x=nx;car.z=nz;}
  else if(legal(nx,car.z)){car.x=nx;car.speed*=.97;if(Math.abs(car.speed)>7)bump();}
  else if(legal(car.x,nz)){car.z=nz;car.speed*=.97;if(Math.abs(car.speed)>7)bump();}
  else{if(Math.abs(car.speed)>3)bump('撞上了路沿');car.speed*=-.2;}
  car.accel=lerp(car.accel,(car.speed-v0)/Math.max(dt,1e-3),Math.min(1,dt*4));
}
let glanceK=0;
function placeCar(dt){
  const lat=car.speed*car.speed/2.75*Math.tan(car.steer);
  car.pitch=lerp(car.pitch,clamp(-car.accel*.004,-.03,.03),Math.min(1,dt*5));car.roll=lerp(car.roll,clamp(lat*.0016,-.035,.035),Math.min(1,dt*4));
  car.shake=Math.max(0,car.shake-dt*2.5);
  const tm=performance.now()/1000,vib=Math.min(1,Math.abs(car.speed)/14),road=(Math.sin(tm*31)*.5+Math.sin(tm*47.3)*.3+Math.sin(tm*13.1)*.6)*.0012*vib;
  carG.position.set(car.x,road+car.shake*.02*Math.sin(tm*60),car.z);carG.rotation.set(car.pitch,car.h,car.roll);
  wheelSpin.rotation.z=car.steer*3.4;
  // 头部：惯性前后倾、转弯侧倾
  head.position.set(EYE.x-clamp(lat*.004,-.05,.05),EYE.y+road*.6+car.shake*.015*Math.sin(tm*45),EYE.z+clamp(car.accel*.006,-.05,.04));
  const g=UI.phone==='glance';glanceK=lerp(glanceK,g?1:0,Math.min(1,dt*7));
  if(!drag&&!g){car.lookYaw*=1-Math.min(1,dt*3);car.lookPitch*=1-Math.min(1,dt*3);}
  const into=clamp(car.steer*Math.min(1,Math.abs(car.speed)/6)*.55,-.35,.35);
  const gt=glanceTarget();
  const yaw=lerp(car.lookYaw+into,gt.yaw,glanceK),pitch=lerp(car.lookPitch-.045,gt.pitch,glanceK);
  camera.rotation.set(pitch,yaw,-car.roll*.4);
  const fov=lerp(62,16,glanceK);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();}
}

// ================= 主循环 =================
let last=performance.now(),clusterT=0,ccT=0,mirT=0,frame=0;
function update(dt){
  if(S.started&&!UI.modal&&!fading){S.acc+=dt*S.ts;while(S.acc>=1){S.acc-=1;tickMinute();}}
  if(S.loc==='car'){drive(dt);aiUpdate(dt);placeCar(dt);}
  pedUpdate(dt);paxWalk(dt);
  if(S.offer&&!UI.modal){S.offer.expire-=dt;if(S.offer.expire<=0){S.offer=null;S.offerCd=4;S.stats.skipped++;renderPhone(true);}else{const c=$('#offerCd');if(c)c.textContent=Math.ceil(S.offer.expire)+'s';}}
  if(S.offerCd>0)S.offerCd-=dt;
  linRideUpdate(dt);dlgUpdate(dt);
  for(const t of routeTexs)t.offset.x-=dt*1.4;
  if(ROUTE&&routeTarget){rerouteT+=dt;if(rerouteT>1){rerouteT=0;const n=navInfo();if(n&&n.off>14){setRoute(routeTarget);voice('已为您重新规划路线');}}}
  if(S.order&&S.order.pMesh&&S.order.phase==='toPickup')animPerson(S.order.pMesh,dt,false);
  for(const m of[mkPick,mkDrop]){m.rotation.y+=dt;m.userData.pin=m.children[2];m.children[2].position.y=3.4+Math.sin(performance.now()/300)*.25;}
  if(S.loc==='shop'){linShop.rotation.y=Math.sin(performance.now()/2000)*.15;for(const s of steam){s.userData.t=(s.userData.t+dt*.25)%1;s.position.y=1.6+s.userData.t*1.2;s.material.opacity=.18*(1-s.userData.t);s.scale.setScalar(.2+s.userData.t*.4);}
    if(!drag){car.lookYaw*=.95;car.lookPitch*=.95;}shopCam.rotation.set(car.lookPitch-.08,car.lookYaw,0);}
  envUpdate();
  hudT+=dt;if(hudT>.1){hudT=0;hudUpdate();promptUpdate();audioUpdate();}
  phoneT+=dt;if(phoneT>.5){phoneT=0;doRenderPhone();}
  clusterT+=dt;if(clusterT>.1){clusterT=0;drawCluster();}
  ccT+=dt;if(ccT>.25){ccT=0;drawCC();}
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;frame++;update(dt);
  const tired=S.energy<20?(20-S.energy)/20:0;
  if(S.loc==='shop'){renderer.shadowMap.needsUpdate=true;renderPost(shopScene,shopCam,{th:1.6,str:.35,tired,exp:1.05});}
  else{
    if(frame%2===0){routeGroup.visible=false;renderer.setRenderTarget(mirrorRT);renderer.toneMapping=THREE.NoToneMapping;renderer.render(scene,mirrorCam);renderer.setRenderTarget(sideRT);renderer.render(scene,sideCam);renderer.setRenderTarget(null);routeGroup.visible=true;}
    renderer.shadowMap.needsUpdate=true;renderPost(scene,camera,{th:lerp(1.4,.9,NIGHT),str:lerp(.25,.85,NIGHT),tired,exp:lerp(1,1.25,NIGHT)});
  }
  placePhoneDOM();
  requestAnimationFrame(loop);}

// ================= 开始 =================
function startGame(){
  closeModal();S.started=true;initAudio();newWake();
  earn(0,'—');S.tx.length=0;S.tx.push({t:S.t,text:'期初余额',amt:180,bal:180});
  msg('chehang','车已交付：白色电动车，沪A·D3***。车租 ¥150/天，每 3 天从你尾号 6621 的银行卡代扣一次，首期 ¥450 周一 10:00 扣款。车费进滴滴钱包，记得提现到卡里。');
  notify('didi','滴滴车主','欢迎加入。出车后系统会按你的位置和时段派单，也可以去「抢单」大厅抢实时单和预约单。');
  notify('ths','同花顺','周末休市。A 股下次开盘：'+nextOpenStr());
  setPhoneMode('mount');renderPhone(true);
}
newWake();
openModal(`<h1>桥西夜班</h1><div class="muted">首轮验证 Demo · 一台车 · 一片街区 · 一家面馆 · 一个人</div>
<p>你刚从车行租下一台白色电动车。车租 ¥150 一天，每 3 天从银行卡自动扣一次，第一期 ¥450 在<b>周一上午 10 点</b>扣款。卡里还有 ¥180。</p>
<p>现在是周五下午 4 点半，你停在永安里弄堂口。手机架在中控上，有滴滴车主、申城银行、同花顺三个 App。车费先进滴滴钱包，要提现到银行卡才能付车租；银行卡里的钱可以转进证券账户炒股。A 股周一到周五开盘，周末休市。</p>
<div class="ctrls"><span class="kbd">W / S</span><span>油门 / 刹车，停稳后按 S 倒车　<span class="kbd">空格</span> 急刹</span><span class="kbd">A / D</span><span>转向</span>
<span class="kbd">Tab</span><span>低头看手机（镜头会对准支架，行驶中看手机会看不到路）</span><span class="kbd">P</span><span>把手机拿在手上（屏幕右下角，方便操作）</span>
<span class="kbd">1 / 2</span><span>派单来时：接单 / 不接；对话时选 1–3</span><span class="kbd">0–9</span><span>乘客上车后输入手机尾号</span>
<span class="kbd">E</span><span>到达上车点、到达目的地、确认账单、进面馆、回家</span><span class="kbd">O</span><span>出车 / 收车</span>
<span class="kbd">T</span><span>时间倍速 ×1 / ×3 / ×8</span><span class="kbd">鼠标拖动</span><span>环顾车内外</span><span class="kbd">V / G</span><span>语音播报开关 / 后期效果开关（卡顿时关掉）</span></div>
<p class="muted">现实 1 秒 = 游戏 1 分钟。地图距离按 4 倍换算成里程。股票、公司和新闻都是虚构的，规则参照 A 股：涨跌停、T+1、集合竞价、停牌。</p>
<button class="btn pri wide" data-act="start" style="padding:12px;font-size:15px">开始 · 周五 16:30</button>`);
setPhoneMode('mount');renderPhone(true);envUpdate();
requestAnimationFrame(loop);
