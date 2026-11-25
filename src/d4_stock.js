
// ================= 模拟股市（虚构公司，规则参照 A 股）=================
// 交易日周一至周五；09:15–09:25 集合竞价，09:30–11:30、13:00–14:57 连续竞价，14:57–15:00 收盘集合竞价
// 涨跌幅：主板 ±10%，创业板/科创板 ±20%，ST ±5%；T+1；100 股一手
// 费用：佣金 万2.5（最低 5 元），卖出印花税 0.05%，过户费 0.001%
const STOCKS=[
  {c:'603618',n:'申城出行',sec:'交通出行',p:8.42,b:1.1,s:.0016},
  {c:'601233',n:'浦江银行',sec:'银行',p:5.36,b:.6,s:.0007},
  {c:'600872',n:'江南酒业',sec:'白酒',p:46.8,b:.9,s:.0012},
  {c:'002413',n:'海纳传媒',sec:'传媒',p:3.12,b:1.3,s:.0021},
  {c:'300759',n:'临港芯片',sec:'半导体',p:27.65,b:1.5,s:.0027,lim:.2},
  {c:'600308',n:'虹桥物流',sec:'物流',p:11.07,b:1,s:.0013},
  {c:'000958',n:'长三角新能',sec:'新能源',p:15.9,b:1.3,s:.0019},
  {c:'600663',n:'外滩置业',sec:'房地产',p:4.05,b:1.1,s:.0015},
  {c:'688126',n:'东海医药',sec:'医药',p:63.2,b:1.2,s:.0024,lim:.2},
  {c:'002856',n:'苏河消费',sec:'消费',p:9.74,b:.9,s:.0014},
  {c:'600767',n:'ST金桥',sec:'ST',p:1.86,b:1,s:.0019,lim:.05},
];
const r2=v=>Math.round(v*100)/100;
const MK={idx:3218.46,idxPrev:3218.46,idxMin:[],mkt:0,mu:0,state:'closed',day:-1,news:[],orders:[],trades:[],seq:1,pumpDay:null};
const SEC={cash:0,frozen:0,pos:{},watch:['603618','002413','300759','601233','600872'],preset:[]};
for(const s of STOCKS){s.lim=s.lim||.1;s.prev=s.p;s.px=s.p;s.open=s.p;s.hi=s.p;s.lo=s.p;s.vol=0;s.amt=0;s.min=[];s.k=[];s.shock=0;s.seal=0;s.sealQ=0;s.susp=0;s.gap=0;
  let p=s.p;for(let d=0;d<60;d++){const c=p,o=r2(c*(1+rand(-.012,.012))),h=r2(Math.max(o,c)*(1+rand(0,.015))),l=r2(Math.min(o,c)*(1-rand(0,.015)));s.k.unshift({o,h,l,c,v:randi(20,180)*1e4});p=r2(p/(1+rand(-.025,.025)+(Math.random()-.5)*s.s*10));}
  s.ref=s.p;}
const SBY={};for(const s of STOCKS)SBY[s.c]=s;
const limUp=s=>r2(s.prev*(1+s.lim)),limDn=s=>r2(s.prev*(1-s.lim));
const chg=s=>(s.px-s.prev)/s.prev;
function isTradeDay(t){return wdOf(t)<5;}
function mState(t=S.t){if(!isTradeDay(t))return'weekend';const m=t%1440;
  if(m<555)return'pre';if(m<565)return'auction';if(m<570)return'quiet';if(m<690)return'cont';if(m<780)return'lunch';if(m<897)return'cont';if(m<900)return'closeAuction';return'closed';}
const STATE_TXT={pre:'未开盘',auction:'集合竞价',quiet:'竞价撮合',cont:'交易中',lunch:'午间休市',closeAuction:'收盘竞价',closed:'已收盘',weekend:'周末休市'};
function nextOpenStr(){let t=S.t;for(let k=0;k<10;k++){const d=Math.floor(t/1440)*1440+570;if(isTradeDay(t)&&S.t<d)return whenStr(d);t=(Math.floor(t/1440)+1)*1440;}return'';}
function fees(side,amt){const com=Math.max(5,amt*.00025),tax=side==='sell'?amt*.0005:0,tr=amt*.00001;return r2(com+tax+tr);}
function secValue(){let v=SEC.cash+SEC.frozen;for(const c in SEC.pos)v+=SEC.pos[c].qty*SBY[c].px;return r2(v);}
function idxCalc(){let a=0;for(const s of STOCKS)a+=s.px/s.ref;return r2(3218.46*a/STOCKS.length);}
// ---- 新闻 ----
const GOOD=[['业绩预增','发布业绩预告，预计上半年净利润同比增长 %d%',.06],['中标','公告中标 %d 亿元重大项目',.05],['回购','拟以 %d 亿元回购公司股份',.035],['政策','行业利好政策出台，板块集体走强',.04],['合作','与头部企业签署战略合作协议',.03]];
const BAD=[['减持','控股股东拟减持不超过 %d% 股份',-.045],['业绩','预计上半年净利润同比下滑 %d%',-.05],['问询','收到交易所问询函，要求说明异常波动',-.03],['诉讼','涉及重大诉讼，涉案金额 %d 亿元',-.035]];
function addNews(s,good,big){const L2=good?GOOD:BAD,it=pick(L2);const title=it[1].replace('%d',randi(2,60));
  MK.news.unshift({t:S.t,c:s.c,n:s.n,title,good,tag:it[0]});if(MK.news.length>40)MK.news.pop();
  return it[2]*(big?2.2:1)*rand(.7,1.3);}
// ---- 每分钟推进 ----
function stockTick(){
  const st=mState(),m=S.t%1440,prev=MK.state;MK.state=st;
  pumpScript(m);
  if(!isTradeDay(S.t))return;
  if(m===510)preOpen();
  if(m===555){thsNote('集合竞价开始 09:15','预埋单已报入交易所');for(const o of SEC.preset)o.status='open';SEC.preset=[];}
  if(st==='auction'){for(const s of STOCKS)if(!s.susp)s.px=r2(clamp(s.prev*(1+s.gap+(Math.random()-.5)*.004),limDn(s),limUp(s)));}
  if(m===565){for(const s of STOCKS)if(!s.susp){s.px=s.open=s.hi=s.lo=r2(clamp(s.prev*(1+s.gap),limDn(s),limUp(s)));checkSeal(s,true);}matchAll(true);}
  if(m===570){MK.idx=idxCalc();thsNote('A 股开盘',`沪城指数 ${MK.idx.toFixed(2)}（${pct((MK.idx-MK.idxPrev)/MK.idxPrev)}）`);}
  if(st==='cont'){stepMarket();matchAll(false);}
  if(m===690)thsNote('午间休市','11:30–13:00 休市，下午 13:00 开盘');
  if(m===780)thsNote('下午开盘','13:00 恢复连续竞价');
  if(m===897)thsNote('收盘集合竞价','14:57–15:00 不可撤单');
  if(m===900)closeDay();
  if(st!=='pre'&&st!=='closed'){MK.idx=idxCalc();if(st==='cont'||m===565)MK.idxMin.push(MK.idx);}
}
function preOpen(){
  MK.day=dayOf(S.t);MK.idxPrev=MK.idx;MK.idxMin=[];MK.mu=(Math.random()-.5)*.0001;
  const mg=(Math.random()-.5)*.012;
  for(const c in SEC.pos)SEC.pos[c].avail=SEC.pos[c].qty;  // T+1 解冻
  for(const s of STOCKS){s.min=[];s.vol=0;s.amt=0;s.seal=0;s.sealQ=0;s.shock=0;s.hard=0;
    if(s.susp>0){s.susp--;if(s.susp===0){s.gap=s.resume;MK.news.unshift({t:S.t,c:s.c,n:s.n,title:'公告复牌，重组方案出炉',good:s.resume>0,tag:'复牌'});}else{s.gap=0;continue;}}
    else s.gap=mg*s.b+(Math.random()-.5)*.01;
    if(Math.random()<.12&&s.c!=='002413'){const good=Math.random()<.52;s.gap+=addNews(s,good)*.8;s.shock=s.gap*.3;}
    if(Math.random()<.012&&s.c!=='002413'&&!s.susp){s.susp=randi(1,2);s.resume=(Math.random()<.6?1:-1)*s.lim*rand(.8,1);MK.news.unshift({t:S.t,c:s.c,n:s.n,title:'筹划重大资产重组，自今日起停牌',good:true,tag:'停牌'});thsNote(s.n+' 停牌','筹划重大资产重组，股票停牌');}
  }
}
function stepMarket(){
  MK.mkt=MK.mkt*.96+(Math.random()-.5)*.0012+MK.mu;
  if(Math.random()<.006){const s=pick(STOCKS);if(!s.susp&&s.c!=='002413'){const good=Math.random()<.5;s.shock+=addNews(s,good,Math.random()<.3);if(SEC.watch.includes(s.c)||SEC.pos[s.c])thsNote(s.n+(good?' 利好':' 利空'),MK.news[0].title);}}
  for(const s of STOCKS){if(s.susp)continue;
    if(s.seal){s.sealQ+=(s.seal>0?1:-1)*(MK.mkt*3e6)+ (Math.random()-.55)*s.sealQ*.12 - s.sealQ*.01;
      if(!s.hard&&(s.sealQ<=0||Math.random()<.004)){const was=s.seal;s.seal=0;s.px=r2(s.px*(1-was*rand(.008,.03)));if(SEC.watch.includes(s.c)||SEC.pos[s.c])thsNote(s.n+(was>0?' 炸板':' 打开跌停'),`现价 ${s.px.toFixed(2)}`);}
      else{s.vol+=randi(50,400)*100;continue;}}
    const r=s.b*MK.mkt+(Math.random()-.5)*2*s.s*1.7+s.shock*.07;s.shock*=.93;
    s.px=r2(clamp(s.px*Math.exp(r),limDn(s),limUp(s)));s.hi=Math.max(s.hi,s.px);s.lo=Math.min(s.lo,s.px);
    const v=randi(200,3000)*100*(1+Math.abs(r)*300);s.vol+=v;s.amt+=v*s.px;checkSeal(s);
    s.min.push(s.px);
  }
}
function checkSeal(s,auction){
  if(s.px>=limUp(s)&&s.seal!==1){s.seal=1;s.sealQ=randi(2,40)*1e4*(1+Math.max(0,s.shock)*20);if(!auction||true)if(SEC.watch.includes(s.c)||SEC.pos[s.c])thsNote(s.n+' 涨停封板',`封单 ${fmtQ(s.sealQ)} 手`);}
  else if(s.px<=limDn(s)&&s.seal!==-1){s.seal=-1;s.sealQ=randi(2,40)*1e4;if(SEC.watch.includes(s.c)||SEC.pos[s.c])thsNote(s.n+' 跌停封板',`封单 ${fmtQ(s.sealQ)} 手`);}
}
function fmtQ(q){return q>=1e4?(q/1e4).toFixed(1)+'万':Math.round(q)+'';}
function pct(v){return(v>=0?'+':'')+(v*100).toFixed(2)+'%';}
function closeDay(){
  for(const s of STOCKS){if(!s.susp){s.px=r2(clamp(s.px*(1+(Math.random()-.5)*.002),limDn(s),limUp(s)));s.k.push({o:s.open,h:s.hi,l:s.lo,c:s.px,v:s.vol});if(s.k.length>90)s.k.shift();}s.min.push(s.px);}
  matchAll(true);
  for(const o of MK.orders)if(o.status==='open'){o.status='expired';unfreeze(o);}
  for(const s of STOCKS){s.prev=s.px;}
  MK.idx=idxCalc();
  let pnl=0;for(const c in SEC.pos){const p=SEC.pos[c],s=SBY[c];pnl+=p.qty*(s.px-(s.k.length>1?s.k[s.k.length-2].c:s.prev));}
  const fri=wdOf(S.t)===4;
  thsNote('A 股收盘',`沪城指数 ${MK.idx.toFixed(2)}（${pct((MK.idx-MK.idxPrev)/MK.idxPrev)}）${Object.keys(SEC.pos).length?`，今日持仓盈亏 ${pnl>=0?'+':''}${pnl.toFixed(2)}`:''}${fri?'。周末休市，下周一 09:30 开盘':''}`);
  if(Object.keys(SEC.pos).length)logEv(`股票收盘，当日盈亏 ${pnl>=0?'+':''}${pnl.toFixed(0)}`);
}
// ---- 委托与撮合 ----
function placeOrder(code,side,px,qty,market){
  const s=SBY[code],st=mState();qty=Math.floor(qty/100)*100;
  if(qty<=0)return err('数量至少 1 手（100 股）');
  if(s.susp)return err('该股票停牌中，无法交易');
  if(st==='closeAuction')return err('收盘集合竞价阶段不接受新委托（原型简化）');
  px=market?(side==='buy'?limUp(s):limDn(s)):r2(px);
  if(!market&&(px>limUp(s)||px<limDn(s)))return err(`委托价超出涨跌停范围 ${limDn(s).toFixed(2)}–${limUp(s).toFixed(2)}`);
  const preset=st==='closed'||st==='weekend'||st==='pre';
  if(side==='buy'){const need=r2(qty*px+fees('buy',qty*px));if(SEC.cash<need)return err(`可用资金不足，需要 ¥${need.toFixed(2)}`);SEC.cash=r2(SEC.cash-need);SEC.frozen=r2(SEC.frozen+need);
    var o={id:MK.seq++,code,side,px,qty,filled:0,frz:need,t:S.t,status:preset?'preset':'open',market};}
  else{const p=SEC.pos[code];if(!p||p.avail<qty)return err(p&&p.qty>p.avail?'今日买入的股票需下一交易日才能卖出（T+1）':'可卖数量不足');p.avail-=qty;
    var o={id:MK.seq++,code,side,px,qty,filled:0,t:S.t,status:preset?'preset':'open',market};}
  MK.orders.unshift(o);if(preset)SEC.preset.push(o);
  if(!preset&&(st==='cont'))matchOrder(o,false);
  return{ok:true,msg:preset?`已提交预埋单，将于 ${nextOpenStr().replace('09:30','09:15')} 报入`:(o.status==='filled'?'委托已成交':'委托已报，等待成交')};
}
function err(m){return{ok:false,msg:m};}
function cancelOrder2(id){const o=MK.orders.find(x=>x.id===id);if(!o||(o.status!=='open'&&o.status!=='preset'))return;if(mState()==='closeAuction'||mState()==='quiet'){toast('当前阶段不可撤单','warn');return;}
  o.status='canceled';unfreeze(o);SEC.preset=SEC.preset.filter(x=>x!==o);}
function unfreeze(o){if(o.side==='buy'){SEC.frozen=r2(SEC.frozen-o.frz);SEC.cash=r2(SEC.cash+o.frz);o.frz=0;}else{const p=SEC.pos[o.code];if(p)p.avail+=o.qty-o.filled;}}
function matchAll(auction){for(const o of MK.orders)if(o.status==='open')matchOrder(o,auction);}
function matchOrder(o,auction){const s=SBY[o.code];if(s.susp)return;
  if(o.side==='buy'){if(s.px>o.px)return;if(s.seal===1&&Math.random()>(o.code==='002413'&&MK.pumpDay!==null?.18:.05))return;fill(o,s.px);}
  else{if(s.px<o.px)return;if(s.seal===-1&&Math.random()>(s.hard?.002:.03))return;fill(o,s.px);}}
function fill(o,px){const s=SBY[o.code],amt=r2(px*o.qty),fee=fees(o.side,amt);o.status='filled';o.fpx=px;o.filled=o.qty;o.fee=fee;
  if(o.side==='buy'){SEC.frozen=r2(SEC.frozen-o.frz);SEC.cash=r2(SEC.cash+o.frz-amt-fee);o.frz=0;const p=SEC.pos[o.code]||(SEC.pos[o.code]={qty:0,avail:0,cost:0});p.cost=r2((p.cost*p.qty+amt+fee)/(p.qty+o.qty)*1000)/1000;p.qty+=o.qty;}
  else{const p=SEC.pos[o.code];SEC.cash=r2(SEC.cash+amt-fee);const realized=r2(amt-fee-p.cost*o.qty);o.pnl=realized;p.qty-=o.qty;if(p.qty<=0)delete SEC.pos[o.code];logEv(`卖出 ${s.n} ${o.qty} 股，盈亏 ${realized>=0?'+':''}${realized.toFixed(0)}`);}
  MK.trades.unshift({t:S.t,code:o.code,n:s.n,side:o.side,px,qty:o.qty,fee});
  thsNote('委托成交',`${o.side==='buy'?'买入':'卖出'} ${s.n} ${o.qty} 股 @ ${px.toFixed(2)}`);
}
function thsNote(title,text){notify('ths',title,text,true);}
// ---- 银证转账（交易日 08:30–16:00）----
function bankSecOpen(){const m=S.t%1440;return isTradeDay(S.t)&&m>=510&&m<960;}
function xferToSec(n){if(!bankSecOpen())return err('银证转账服务时间：交易日 08:30–16:00');if(n<=0)return err('请输入金额');if(S.cash<n)return err('银行卡余额不足');spend(n,'银证转账 → 浦江证券');SEC.cash=r2(SEC.cash+n);return{ok:true,msg:`已转入证券账户 ¥${n}`};}
function xferToBank(n){if(!bankSecOpen())return err('银证转账服务时间：交易日 08:30–16:00');if(n<=0)return err('请输入金额');if(SEC.cash<n)return err('证券账户可取资金不足');SEC.cash=r2(SEC.cash-n);earn(n,'银证转账 ← 浦江证券');return{ok:true,msg:`已转回银行卡 ¥${n}`};}
// ---- 荐股群（灰色机会：拉高出货）----
function pumpScript(m){
  const s=SBY['002413'],d=dayOf(S.t);
  // 第一个周日晚上拉人进群
  if(MK.pumpDay===null&&wdOf(S.t)===6&&m===1230){MK.pumpDay=d+1;S.threads.group.hidden=false;
    msg('group','【王老师】欢迎新朋友！本群每天免费分享主力动向，跟着老师吃肉。');
    setTimeout(()=>msg('group','【王老师】@所有人 明天早盘重点关注 海纳传媒(002413)，主力已吸筹完毕，目标价 6 元。9:15 前挂单，名额有限！'),50);}
  if(MK.pumpDay===null)return;
  const k=d-MK.pumpDay;
  if(k===0&&m===575){s.shock=.14;}
  if(k===0&&s.seal===1&&m>575&&m<900)s.hard=1;
  if(k===0&&m===620)msg('group','【王老师】看到没有？封死涨停！没上车的明天还有机会，我们的目标是翻倍！');
  if(k===0&&m===560){s.gap=.035;}
  if(k===1&&m===510){s.gap=.06;}
  if(k===1&&m===560)s.gap=.06;
  if(k===1&&m===600){s.shock=-.18;s.hard=1;MK.news.unshift({t:S.t,c:s.c,n:s.n,title:'股东大宗交易减持 4.8%，接盘方为个人',good:false,tag:'减持'});}
  if(k===1&&m===700)msg('group','【群公告】本群因违规已被限制发言。');
  if(k===2&&m===560){s.gap=-.1;s.hard=1;MK.news.unshift({t:S.t,c:s.c,n:s.n,title:'公司收到证监会立案告知书，涉嫌信息披露违法',good:false,tag:'立案'});}
  if(k===2&&m===575)s.shock=-.1;
  if(k===3&&m===560)s.gap=-.06;
}
