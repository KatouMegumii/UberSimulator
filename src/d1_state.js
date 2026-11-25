
// ================= 游戏状态 =================
const S={
  t:16*60+30,acc:0,ts:1,energy:80,social:0,lessons:0,battery:86,
  cash:180,   // 银行卡余额（申城银行）
  dw:0,       // 司机端钱包（车费到账，可提现）
  score:82,   // 服务分
  online:false,offer:null,order:null,queue:[],hall:[],hallT:0,offerCd:3,locked:false,loc:'car',asleep:false,started:false,
  stats:{accepted:0,skipped:0,done:0,late:0,stars:[]},
  rent:{amt:450,due:3*1440+600,period:3,overdue:false,since:0},
  debt:null,tx:[],dtx:[],history:[],wake:null,warned:{},loanOffered:-99999,
  threads:{
    chehang:{name:'车行 · 小周',color:'#4f7bd9',ab:'车',msgs:[],unread:0},
    lin:{name:'林晚',color:'#b07ad9',ab:'晚',msgs:[],unread:0,hidden:true},
    loan:{name:'秒借钱包',color:'#d9a04f',ab:'借',msgs:[],unread:0,hidden:true},
    group:{name:'申城财富交流群(318)',color:'#d94f4f',ab:'群',msgs:[],unread:0,hidden:true},
  },
  notes:[], // 通知中心
  lin:{met:false,contact:false,aff:0,hist:[],lastSeen:-99999,rideShift:-99,nextInvite:0,invite:null,req:null,chatDay:-1,lent:0,flags:{}},
  ate:[],
};
const L=S.lin;
const UI={app:null,page:null,thread:null,modal:null,dlg:null,helpHidden:false,shop:null,phone:'mount',glance:0,keypad:'',sel:null,tradeQty:1,tradeSide:'buy',tradePx:null,bankPage:'home',xfer:null};
function newWake(){S.wake={start:S.t,orders:0,gross:0,fee:0,net:0,spend:0,onlineMin:0,events:[],aff0:L.aff,stage0:linStage(),score0:S.score,pnl0:typeof secValue==='function'?secValue():0};}
function logEv(text){if(S.wake)S.wake.events.push(fmt(S.t)+' '+text);}
function linHist(text){L.hist.push({t:S.t,text});logEv('【林晚】'+text);}
function linStage(){if(!L.met)return'陌生人';if(!L.contact)return'见过面';if(L.aff<45)return'熟人';if(L.aff<80)return'朋友';return'亲近';}
const STAGE_ORDER=['陌生人','见过面','熟人','朋友','亲近'];
function addAff(n){const before=linStage();L.aff=clamp(L.aff+n,0,100);const after=linStage();if(after!==before&&STAGE_ORDER.indexOf(after)>STAGE_ORDER.indexOf(before)){toast(`和林晚的关系：${after}`,'');linHist('关系变为「'+after+'」');}}
// 银行卡收支
function spend(n,what){S.cash-=n;if(S.wake)S.wake.spend+=n;S.tx.unshift({t:S.t,text:what,amt:-n,bal:S.cash});}
function earn(n,what){S.cash+=n;S.tx.unshift({t:S.t,text:what,amt:n,bal:S.cash});}
function canPay(n){return S.cash>=n;}
function pay(n,what){if(S.cash<n){toast('银行卡余额不足','warn');return false;}spend(n,what);bankNote(`支出 ¥${n.toFixed?n.toFixed(2):n} · ${what}`);return true;}
function bankNote(t){notify('bank','申城银行',t,true);}
// 司机钱包
function dwAdd(n,what){S.dw+=n;S.dtx.unshift({t:S.t,text:what,amt:n});}
// 通知：手机横幅 + 屏幕提示
function notify(app,title,text,quiet){const n={t:S.t,app,title,text};S.notes.unshift(n);if(S.notes.length>40)S.notes.pop();
  if(S.started&&!S.asleep){phoneBanner(n);if(!quiet)ping(660);}}
function msg(th,text,actions){const T=S.threads[th];T.hidden=false;const m={t:S.t,from:'them',text,actions:actions||null,done:false};T.msgs.push(m);
  if(!(UI.app==='msg'&&UI.thread===th))T.unread++;notify('msg',T.name,text);return m;}
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
  if(S.online&&S.wake)S.wake.onlineMin++;
  driverTick();economy();linTick();stockTick();
  if(!S.asleep){
    if(S.energy<25&&!S.warned.e25){S.warned.e25=1;toast('有点累了。可以吃点东西或回家休息。','warn');}
    if(S.energy<10&&!S.warned.e10){S.warned.e10=1;toast('眼皮在打架。再开下去不安全。','warn');}
    if(S.energy<=0&&S.loc==='car')passOut();
  }
  if(S.battery<15&&!S.warned.bat){S.warned.bat=1;toast('电量偏低（原型中充电未开放，睡觉时车行代充）','warn');}
}
function advance(mins){for(let k=0;k<mins;k++)tickMinute();}

// ================= 收支：车租 / 网贷 =================
function economy(){
  const r=S.rent;
  if(!r.overdue&&S.t===r.due-720)msg('chehang',`提醒：${whenStr(r.due)} 从尾号 6621 的银行卡代扣车租 ¥${r.amt}。当前卡内余额 ¥${Math.floor(S.cash)}${S.dw>0?`，司机钱包还有 ¥${S.dw.toFixed(2)} 未提现`:''}。`);
  if(!r.overdue&&S.t>=r.due){
    if(S.cash>=r.amt)payRent();
    else{r.overdue=true;r.since=S.t;msg('chehang',`车租 ¥${r.amt} 代扣失败，银行卡余额不足。请 24 小时内补缴，否则车辆会被远程限制接单。`);logEv('车租扣款失败');loanAd();}
  }
  if(r.overdue){
    if(S.t%60===0&&S.cash>=r.amt)payRent();
    else if(!S.locked&&S.t-r.since>=1440){S.locked=true;if(S.online)setOnline(false);msg('chehang','车租逾期超过 24 小时，车辆已限制接单。补缴后自动恢复。');logEv('车辆被限制接单');
      if(L.contact&&L.aff>=45&&!L.lent)msg('lin','听说你车被锁了？老陈说的。要是周转不开，跟我说一声。');}
  }
  if(!r.overdue&&S.cash+S.dw<80&&r.due-S.t<1080&&r.due-S.t>0&&S.t-S.loanOffered>1440)loanAd();
  const d=S.debt;
  if(d&&S.t>=d.due){
    if(S.cash>=d.amt){spend(d.amt,'秒借 自动还款');msg('loan',`已自动还款 ¥${d.amt}。期待再次为您服务。`);logEv('还清网贷');S.debt=null;}
    else{d.amt+=60;d.due+=1440;d.late++;msg('loan',d.late>1?`您的借款已逾期 ${d.late} 天，待还 ¥${d.amt}。我们将依约联系您的紧急联系人。`:`借款已逾期，产生逾期费 ¥60，待还 ¥${d.amt}。`);logEv('网贷逾期');}
  }
}
function payRent(){const r=S.rent;spend(r.amt,'车行代扣 · 车租（3 天）');bankNote(`代扣 ¥${r.amt} · 车行车租`);
  const was=r.overdue;r.overdue=false;S.locked=false;r.due+=r.period*1440;while(r.due<=S.t)r.due+=r.period*1440;
  msg('chehang',`${was?'已补缴':'已扣'}车租 ¥${r.amt}。下期 ${whenStr(r.due)}。`);logEv('支付车租 ¥'+r.amt);}
function loanAd(){S.loanOffered=S.t;msg('loan','急用钱？秒借 ¥500，最快 1 分钟到账，3 天后一次还清。',[{label:'借 ¥500',act:'loanTake'},{label:'不需要',act:'loanNo'}]);}
function passOut(){
  if(S.order)cancelOrder('司机长时间未移动，订单已改派。平台提醒：请勿疲劳驾驶。',-3);
  if(S.online)setOnline(false);car.speed=0;
  fadeTo('你在车里睡着了……',()=>{S.asleep=true;advance(240);S.asleep=false;S.energy=32;logEv('在车里累到睡着');toast('被交警敲窗叫醒。脖子很酸。','warn');S.warned.e25=S.warned.e10=0;});
}
