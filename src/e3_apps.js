
// ================= 申城银行 =================
function bankView(){
  const p=UI.page||'home';let body='';
  const head=`<div class="appbar bank"><span data-act="${p==='home'?'home':'page'}" data-arg="home" class="back">‹</span><span>申城银行</span><span></span></div>`;
  if(p==='home'){
    body=`<div class="bcard"><div class="muted w">借记卡 · 6217 **** **** 6621</div><div class="muted w" style="margin-top:12px">可用余额（元）</div><div class="big w">${S.cash.toFixed(2)}</div></div>
    <div class="bgrid">${[['xfer','转账'],['detail','明细'],['sec','银证转账'],['repay','还款']].map(([k,n])=>`<div data-act="page" data-arg="${k}"><span>${({xfer:'⇄',detail:'≡',sec:'↗',repay:'✓'})[k]}</span>${n}</div>`).join('')}</div>
    <div class="dcard"><div class="row"><b>代扣签约</b><span class="tag">车行车租</span></div><div class="row muted"><span>${S.rent.overdue?'<b style="color:#e33">扣款失败，待补缴</b>':'下次扣款 '+whenStr(S.rent.due)}</span><span>¥${S.rent.amt}</span></div>
      ${S.rent.overdue?`<button class="btn pri wide ${S.cash<S.rent.amt?'dis':''}" data-act="payRent">立即补缴车租</button>`:''}</div>
    <div class="dcard"><div class="row"><span>证券账户（浦江证券）</span><b>¥${secValue().toFixed(2)}</b></div><div class="row muted"><span>司机钱包待提现</span><span>¥${S.dw.toFixed(2)}</span></div></div>
    <div class="sect">最近交易</div><div class="dcard">${txList(5)}</div>`;
  }else if(p==='detail')body=`<div class="sect">收支明细</div><div class="dcard">${txList(40)}</div>`;
  else if(p==='sec'){const x=UI.xfer||(UI.xfer={dir:'in',amt:''});
    body=`<div class="dcard"><div class="seg"><span class="${x.dir==='in'?'on':''}" data-act="xdir" data-arg="in">银行 → 证券</span><span class="${x.dir==='out'?'on':''}" data-act="xdir" data-arg="out">证券 → 银行</span></div>
    <div class="row muted"><span>${x.dir==='in'?'银行卡可用':'证券可取'}</span><span>¥${(x.dir==='in'?S.cash:SEC.cash).toFixed(2)}</span></div>
    <div class="amt">¥ ${x.amt||'<span class="muted">0</span>'}</div>
    <div class="chips">${[100,200,500,1000].map(v=>`<span data-act="xamt" data-arg="${v}">${v}</span>`).join('')}<span data-act="xamt" data-arg="all">全部</span><span data-act="xamt" data-arg="clr">清空</span></div>
    <button class="btn pri wide" data-act="xgo">确认转账</button>
    <div class="muted c" style="margin-top:6px">服务时间：交易日 08:30–16:00${bankSecOpen()?'':' · <b style="color:#e33">当前不可用</b>'}</div></div>`;}
  else if(p==='xfer')body=`<div class="sect">常用收款人</div><div class="dcard">${L.contact?`<div class="row"><span>林晚 · 6228 **** 0917</span><span>${L.lent?`<button class="btn pri ${S.cash<L.lent?'dis':''}" data-act="repayLin">还她 ¥${L.lent}</button>`:'<span class="muted">无待还</span>'}</span></div>`:'<span class="muted">暂无</span>'}
    <div class="row" style="margin-top:6px"><span>车行 · 小周</span><button class="btn ${S.rent.overdue?'pri':'dis'}" data-act="payRent">补缴车租 ¥${S.rent.amt}</button></div></div>`;
  else if(p==='repay')body=`<div class="sect">待还款项</div>${S.debt?`<div class="dcard"><div class="row"><b>秒借钱包</b><b style="color:#e33">¥${S.debt.amt}</b></div><div class="muted">到期 ${whenStr(S.debt.due)}${S.debt.late?` · 已逾期 ${S.debt.late} 天`:''}</div><button class="btn pri wide ${S.cash<S.debt.amt?'dis':''}" data-act="payDebt">立即还款</button></div>`:''}
    ${L.lent?`<div class="dcard"><div class="row"><b>欠林晚</b><b>¥${L.lent}</b></div><button class="btn pri wide ${S.cash<L.lent?'dis':''}" data-act="repayLin">转账还款</button></div>`:''}${!S.debt&&!L.lent?'<div class="dcard muted">暂无待还款项</div>':''}`;
  return head+`<div class="abody">${body}</div>`;
}
function txList(n){return S.tx.slice(0,n).map(x=>`<div class="row"><span>${x.text}<br><span class="muted">${whenStr(x.t)} · 余额 ${x.bal.toFixed(2)}</span></span><b class="${x.amt>=0?'up2':'dn2'}">${x.amt>=0?'+':''}${x.amt.toFixed(2)}</b></div>`).join('')||'<span class="muted">暂无</span>';}

// ================= 同花顺 =================
const cls=v=>v>0?'up':v<0?'dn':'';
function thsView(){
  const p=UI.page||'market';
  const tabs=[['market','行情'],['pos','持仓'],['trade','交易'],['news','资讯']];
  const body=({market:thsMarket,stock:thsStock,trade:thsTrade,pos:thsPos,news:thsNews,xfer:thsXfer})[p]();
  return `<div class="appbar ths"><span data-act="${p==='stock'||p==='xfer'?'page':'home'}" data-arg="market" class="back">‹</span><span>同花顺</span><span class="mst ${mState()==='cont'?'on':''}">${STATE_TXT[mState()]}</span></div><div class="abody">${body}</div>
  <div class="atabs ths">${tabs.map(([k,n])=>`<div class="${p===k?'on':''}" data-act="page" data-arg="${k}">${n}</div>`).join('')}</div>`;
}
function sTag(s){return s.susp?'<span class="tag">停牌</span>':s.seal===1?'<span class="tag r">涨停</span>':s.seal===-1?'<span class="tag g2">跌停</span>':'';}
function thsMarket(){
  const ic=(MK.idx-MK.idxPrev)/MK.idxPrev;
  postRender.push(()=>{const c=$('#idxChart');if(c)lineChart(c,MK.idxMin,MK.idxPrev,true);});
  const rows=(UI.allStocks?STOCKS:SEC.watch.map(c=>SBY[c])).map(s=>`<div class="srow" data-act="stock" data-arg="${s.c}"><div><b>${s.n}</b>${sTag(s)}<div class="muted">${s.c}${s.lim===.2?' · 20%':s.lim===.05?' · ST':''}</div></div><div class="${cls(chg(s))} px">${s.px.toFixed(2)}</div><div class="chip ${cls(chg(s))}">${s.susp?'停牌':pct(chg(s))}</div></div>`).join('');
  return `<div class="icard" data-act="noop"><div class="row"><span>沪城指数</span><span class="muted">${STATE_TXT[mState()]}${mState()==='weekend'||mState()==='closed'||mState()==='pre'?' · 下次开盘 '+nextOpenStr():''}</span></div><div class="row"><b class="${cls(ic)} bigi">${MK.idx.toFixed(2)}</b><span class="${cls(ic)}">${pct(ic)}</span></div><canvas id="idxChart" width="600" height="160" class="chart"></canvas></div>
  <div class="row sect"><span>${UI.allStocks?'全部 A 股':'我的自选'}</span><span class="link" data-act="allst">${UI.allStocks?'看自选':'看全部'}</span></div>
  <div class="slist"><div class="srow hd"><div>名称</div><div>最新</div><div>涨跌幅</div></div>${rows}</div>
  <div class="muted c" style="padding:8px">交易时间 09:30–11:30 / 13:00–15:00（周一至周五）</div>`;
}
function thsStock(){
  const s=SBY[UI.sel],c=chg(s),p=SEC.pos[s.c],star=SEC.watch.includes(s.c);
  postRender.push(()=>{const cv=$('#sChart');if(!cv)return;if(UI.kline)kChart(cv,s);else lineChart(cv,s.min,s.prev,false,limUp(s),limDn(s));});
  const book=[];for(let k=5;k>=1;k--)book.push(['卖'+k,r2(Math.min(limUp(s),s.px+.01*k)),s.seal===1?0:randi(1,90)*(s.seal===-1?40:1)]);for(let k=1;k<=5;k++)book.push(['买'+k,r2(Math.max(limDn(s),s.px-.01*k)),s.seal===-1?0:randi(1,90)*(s.seal===1&&k===1?Math.round(s.sealQ/100):1)]);
  if(s.seal===1)book[5][2]=Math.round(s.sealQ);if(s.seal===-1)book[4][2]=Math.round(s.sealQ);
  return `<div class="shead"><div class="row"><span><b style="font-size:18px">${s.n}</b> <span class="muted">${s.c}</span> ${sTag(s)}</span><span class="link" data-act="star" data-arg="${s.c}">${star?'★ 已自选':'☆ 加自选'}</span></div>
  <div class="row"><span class="${cls(c)} bigp">${s.px.toFixed(2)}</span><span class="${cls(c)}">${(s.px-s.prev>=0?'+':'')+(s.px-s.prev).toFixed(2)}　${pct(c)}</span></div>
  <div class="kv"><span>今开 <b>${s.open.toFixed(2)}</b></span><span>最高 <b class="up">${s.hi.toFixed(2)}</b></span><span>最低 <b class="dn">${s.lo.toFixed(2)}</b></span><span>昨收 <b>${s.prev.toFixed(2)}</b></span><span>涨停 <b class="up">${limUp(s).toFixed(2)}</b></span><span>跌停 <b class="dn">${limDn(s).toFixed(2)}</b></span><span>成交量 <b>${fmtQ(s.vol/100)}手</b></span><span>${s.seal?'封单 <b>'+fmtQ(s.sealQ)+'手</b>':'板块 <b>'+s.sec+'</b>'}</span></div></div>
  ${s.susp?`<div class="dcard warn">该股票停牌中，预计 ${s.susp} 个交易日后复牌</div>`:''}
  <div class="seg sm"><span class="${!UI.kline?'on':''}" data-act="kl" data-arg="0">分时</span><span class="${UI.kline?'on':''}" data-act="kl" data-arg="1">日K</span></div>
  <canvas id="sChart" width="640" height="300" class="chart"></canvas>
  <div class="book">${book.map(([n,px,q],i)=>`<div class="${i<5?'ask':'bid'}"><span>${n}</span><span class="${cls(px-s.prev)}">${px.toFixed(2)}</span><span>${q}</span></div>`).join('')}</div>
  ${p?`<div class="dcard"><div class="row"><span>持有 ${p.qty} 股（可卖 ${p.avail}）</span><span class="${cls(s.px-p.cost)}">${((s.px-p.cost)*p.qty).toFixed(2)}</span></div><div class="muted">成本 ${p.cost.toFixed(3)}</div></div>`:''}
  <div class="row bs"><button class="btn buy" data-act="tside" data-arg="buy">买入</button><button class="btn sell" data-act="tside" data-arg="sell">卖出</button></div>`;
}
function thsTrade(){
  const s=SBY[UI.sel||SEC.watch[0]];UI.sel=s.c;if(UI.tradePx==null)UI.tradePx=s.px;
  const side=UI.tradeSide,p=SEC.pos[s.c],px=UI.market?(side==='buy'?limUp(s):limDn(s)):UI.tradePx,qty=UI.tradeQty*100,amt=px*qty;
  const maxBuy=Math.floor(SEC.cash/(px*100*1.0003+.0001))||0;
  return `<div class="seg"><span class="${side==='buy'?'on buy':''}" data-act="tside2" data-arg="buy">买入</span><span class="${side==='sell'?'on sell':''}" data-act="tside2" data-arg="sell">卖出</span></div>
  <div class="dcard"><div class="row" data-act="stock" data-arg="${s.c}"><span><b>${s.n}</b> <span class="muted">${s.c}</span> ${sTag(s)}</span><span class="${cls(chg(s))}">${s.px.toFixed(2)} ${pct(chg(s))} ›</span></div>
  <div class="pick">${SEC.watch.map(c=>`<span class="${c===s.c?'on':''}" data-act="tsel" data-arg="${c}">${SBY[c].n}</span>`).join('')}</div>
  <div class="row"><span>委托方式</span><span class="seg sm in"><span class="${!UI.market?'on':''}" data-act="mkt" data-arg="0">限价</span><span class="${UI.market?'on':''}" data-act="mkt" data-arg="1">市价</span></span></div>
  ${UI.market?`<div class="muted">市价单以 ${side==='buy'?'涨停价':'跌停价'} ${px.toFixed(2)} 冻结资金，按成交时价格结算</div>`:`<div class="step"><span data-act="pxd" data-arg="-1">－</span><b>${UI.tradePx.toFixed(2)}</b><span data-act="pxd" data-arg="1">＋</span></div><div class="muted c">跌停 ${limDn(s).toFixed(2)} · 涨停 ${limUp(s).toFixed(2)}　<span class="link" data-act="pxnow">用现价</span></div>`}
  <div class="step"><span data-act="qd" data-arg="-1">－</span><b>${UI.tradeQty} 手（${qty} 股）</b><span data-act="qd" data-arg="1">＋</span></div>
  <div class="row muted"><span>${side==='buy'?`可用 ¥${SEC.cash.toFixed(2)} · 最多 ${maxBuy} 手`:`可卖 ${p?p.avail:0} 股${p&&p.qty>p.avail?`（今日买入 ${p.qty-p.avail} 股 T+1）`:''}`}</span></div>
  <div class="row muted"><span>预估金额 ¥${amt.toFixed(2)}</span><span>费用约 ¥${fees(side,amt).toFixed(2)}</span></div>
  <button class="btn wide big2 ${side}" data-act="order">${side==='buy'?'买入':'卖出'} ${s.n}</button>
  ${UI.tradeMsg?`<div class="tmsg ${UI.tradeMsg.ok?'':'bad'}">${UI.tradeMsg.msg}</div>`:''}</div>
  <div class="muted c">${mState()==='cont'?'连续竞价中':'当前'+STATE_TXT[mState()]+(['closed','weekend','pre'].includes(mState())?'，委托将作为预埋单在下个交易日 09:15 报入':'')}</div>`;
}
function thsPos(){
  const tv=secValue();let fl=0;for(const c in SEC.pos){const p=SEC.pos[c];fl+=(SBY[c].px-p.cost)*p.qty;}
  const pos=Object.entries(SEC.pos).map(([c,p])=>{const s=SBY[c];return `<div class="srow" data-act="stock" data-arg="${c}"><div><b>${s.n}</b>${sTag(s)}<div class="muted">${p.qty} 股 · 可卖 ${p.avail}</div></div><div>${(s.px*p.qty).toFixed(2)}<div class="muted">成本 ${p.cost.toFixed(2)}</div></div><div class="${cls(s.px-p.cost)}">${((s.px-p.cost)*p.qty).toFixed(2)}<div>${pct((s.px-p.cost)/p.cost)}</div></div></div>`;}).join('');
  const ords=MK.orders.filter(o=>o.t>=S.t-1440*3).slice(0,12).map(o=>`<div class="row ord"><span>${fmt(o.t)} <b class="${o.side==='buy'?'up':'dn'}">${o.side==='buy'?'买':'卖'}</b> ${SBY[o.code].n} ${o.qty}股 @${o.market?'市价':o.px.toFixed(2)}</span><span>${({open:'已报',preset:'预埋',filled:'成交 '+(o.fpx||0).toFixed(2),canceled:'已撤',expired:'已失效'})[o.status]}${o.status==='open'||o.status==='preset'?` <span class="link" data-act="cancel" data-arg="${o.id}">撤单</span>`:''}</span></div>`).join('');
  return `<div class="icard"><div class="muted">总资产（元）</div><div class="bigi">${tv.toFixed(2)}</div><div class="row"><span class="muted">浮动盈亏</span><span class="${cls(fl)}">${fl>=0?'+':''}${fl.toFixed(2)}</span></div><div class="row muted"><span>可用 ${SEC.cash.toFixed(2)}</span><span>冻结 ${SEC.frozen.toFixed(2)}</span></div>
  <button class="btn wide" data-act="page" data-arg="xfer">银证转账</button></div>
  <div class="sect">持仓</div><div class="slist">${pos||'<div class="muted c" style="padding:12px">暂无持仓</div>'}</div><div class="sect">委托</div><div class="dcard">${ords||'<span class="muted">暂无委托</span>'}</div>`;
}
function thsNews(){return `<div class="sect">7×24 快讯</div>`+MK.news.slice(0,30).map(n=>`<div class="dcard news" data-act="stock" data-arg="${n.c}"><div class="row"><span class="tag ${n.good?'r':'g2'}">${n.tag}</span><span class="muted">${whenStr(n.t)}</span></div><b>${n.n}</b>：${n.title}</div>`).join('')+(MK.news.length?'':'<div class="dcard muted">暂无资讯，开盘前后会有公司公告</div>');}
function thsXfer(){const x=UI.xfer||(UI.xfer={dir:'in',amt:''});
  return `<div class="dcard"><div class="seg"><span class="${x.dir==='in'?'on':''}" data-act="xdir" data-arg="in">银行 → 证券</span><span class="${x.dir==='out'?'on':''}" data-act="xdir" data-arg="out">证券 → 银行</span></div>
  <div class="row muted"><span>${x.dir==='in'?'银行卡可用':'证券可取'}</span><span>¥${(x.dir==='in'?S.cash:SEC.cash).toFixed(2)}</span></div><div class="amt">¥ ${x.amt||'<span class="muted">0</span>'}</div>
  <div class="chips">${[100,200,500,1000].map(v=>`<span data-act="xamt" data-arg="${v}">${v}</span>`).join('')}<span data-act="xamt" data-arg="all">全部</span><span data-act="xamt" data-arg="clr">清空</span></div>
  <button class="btn pri wide" data-act="xgo">确认转账</button><div class="muted c" style="margin-top:6px">交易日 08:30–16:00${bankSecOpen()?'':' · <b style="color:#e33">当前不可用</b>'}</div></div>`;}
// ---- 图表 ----
function lineChart(cv,data,prev,isIdx,up,dn){
  const g=cv.getContext('2d'),W=cv.width,H=cv.height;g.fillStyle='#fff';g.fillRect(0,0,W,H);
  let hi=up||prev*1.02,lo=dn||prev*.98;if(isIdx){for(const v of data){hi=Math.max(hi,v);lo=Math.min(lo,v);}const pad=(hi-lo)*.1;hi+=pad;lo-=pad;}
  else if(data.length){let mx=0;for(const v of data)mx=Math.max(mx,Math.abs(v-prev));const span=Math.max(mx*1.15,prev*.01);hi=prev+span;lo=prev-span;}
  const Y=v=>H-(v-lo)/(hi-lo)*H,X=i=>i/240*W;
  g.strokeStyle='#eee';g.lineWidth=1;for(let k=1;k<4;k++){g.beginPath();g.moveTo(0,H*k/4);g.lineTo(W,H*k/4);g.stroke();g.beginPath();g.moveTo(W*k/4,0);g.lineTo(W*k/4,H);g.stroke();}
  g.setLineDash([6,4]);g.strokeStyle='#bbb';g.beginPath();g.moveTo(0,Y(prev));g.lineTo(W,Y(prev));g.stroke();g.setLineDash([]);
  if(data.length){const last=data[data.length-1],col=last>=prev?'#e8392a':'#13a05a';
    const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,col+'40');gr.addColorStop(1,col+'00');g.fillStyle=gr;g.beginPath();g.moveTo(0,H);data.forEach((v,i)=>g.lineTo(X(i),Y(v)));g.lineTo(X(data.length-1),H);g.fill();
    g.strokeStyle=col;g.lineWidth=2.5;g.beginPath();data.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));g.stroke();
    if(!isIdx){let s=0;g.strokeStyle='#f0a020';g.lineWidth=1.5;g.beginPath();data.forEach((v,i)=>{s+=v;const a=s/(i+1);i?g.lineTo(X(i),Y(a)):g.moveTo(X(i),Y(a));});g.stroke();}}
  g.fillStyle='#999';g.font='20px Arial';g.fillText(hi.toFixed(2),4,20);g.fillText(lo.toFixed(2),4,H-6);g.textAlign='right';g.fillText('15:00',W-4,H-6);g.textAlign='left';
}
function kChart(cv,s){const g=cv.getContext('2d'),W=cv.width,H=cv.height;g.fillStyle='#fff';g.fillRect(0,0,W,H);
  const k=s.k.slice(-40);if(!k.length)return;let hi=-1e9,lo=1e9;for(const d of k){hi=Math.max(hi,d.h);lo=Math.min(lo,d.l);}const Y=v=>8+(hi-v)/(hi-lo)*(H-16),bw=W/k.length;
  k.forEach((d,i)=>{const up=d.c>=d.o,col=up?'#e8392a':'#13a05a';g.strokeStyle=g.fillStyle=col;const x=i*bw+bw/2;g.beginPath();g.moveTo(x,Y(d.h));g.lineTo(x,Y(d.l));g.stroke();
    const y1=Y(Math.max(d.o,d.c)),y2=Y(Math.min(d.o,d.c));if(up){g.lineWidth=1.5;g.strokeRect(x-bw*.35,y1,bw*.7,Math.max(1,y2-y1));}else g.fillRect(x-bw*.35,y1,bw*.7,Math.max(1,y2-y1));});
  for(const[n,c]of[[5,'#f0a020'],[10,'#3a7bd5']]){g.strokeStyle=c;g.lineWidth=1.5;g.beginPath();let st=false;k.forEach((d,i)=>{const all=s.k.slice(0,s.k.length-k.length+i+1);if(all.length<n)return;const a=all.slice(-n).reduce((x,y)=>x+y.c,0)/n;const x=i*bw+bw/2;st?g.lineTo(x,Y(a)):g.moveTo(x,Y(a));st=true;});g.stroke();}
  g.fillStyle='#999';g.font='20px Arial';g.fillText(hi.toFixed(2),4,22);g.fillText(lo.toFixed(2),4,H-6);}

// ================= 动作分发 =================
function act(a,arg){
  const T=S.threads;
  switch(a){
    case 'app':openApp(arg);return;
    case 'home':goHome();return;
    case 'page':UI.page=arg;if(arg==='trade'){UI.tradeMsg=null;}break;
    case 'thread':UI.thread=arg;if(T[arg])T[arg].unread=0;break;
    case 'back':UI.thread=null;break;
    case 'online':setOnline(!S.online);break;
    case 'accept':acceptOffer();break;
    case 'skip':skipOffer();break;
    case 'grab':grab(arg);break;
    case 'arrive':tryArrive();break;
    case 'arriveDrop':tryArrive();break;
    case 'noshow':noShowCancel();break;
    case 'key':{const o=S.order;if(!o||o.phase!=='verify'||o.mismatch)break;if(arg==='清除')UI.keypad='';else if(arg==='⌫')UI.keypad=UI.keypad.slice(0,-1);else if(UI.keypad.length<4){UI.keypad+=arg;ping(1200,.04);}if(UI.keypad.length===4)verifyTail(UI.keypad);break;}
    case 'kclear':if(S.order){S.order.mismatch=false;UI.keypad='';}break;
    case 'wrongout':wrongPaxOut();break;
    case 'bill':confirmBill();break;
    case 'call':toast('（虚拟号码拨号中……乘客：「我看到你了，马上过来。」）');break;
    case 'withdraw':if(S.dw>0){const n=Math.round(S.dw*100)/100;S.dtx.unshift({t:S.t,text:'提现到银行卡',amt:-n});S.dw=0;earn(n,'滴滴出行 · 司机提现');bankNote(`收入 ¥${n.toFixed(2)} · 滴滴出行提现`);ching();}break;
    case 'payRent':if(S.cash>=S.rent.amt)payRent();else toast('余额不足','warn');break;
    case 'payDebt':if(S.debt&&S.cash>=S.debt.amt){spend(S.debt.amt,'秒借钱包 还款');S.debt=null;msg('loan','已还清，感谢使用。');}else toast('余额不足','warn');break;
    case 'repayLin':if(L.lent&&S.cash>=L.lent){spend(L.lent,'转账给 林晚');myMsg('lin',`钱转你了，${L.lent}，谢谢你。`);msg('lin','这么快？行，收到了。');addAff(4);linHist('按时还了她的钱');L.lent=0;}break;
    case 'askLin':if(STAGE_ORDER.indexOf(linStage())>=3&&!L.lent&&(S.rent.overdue||S.debt)){L.lent=300;earn(300,'林晚 转账');myMsg('lin','有点不好意思开口……能先借我 300 吗？车租差一点。');msg('lin','转你了。别去碰那些网贷。');addAff(-2);linHist('向她借了 300 元');}break;
    case 'loanTake':if(!S.debt){earn(500,'秒借钱包 放款');S.debt={amt:620,due:S.t+3*1440,late:0};closeActions('loan');myMsg('loan','借 ¥500');msg('loan',`¥500 已到账。${whenStr(S.debt.due)} 需还 ¥620（含服务费）。`);logEv('借了网贷 ¥500');}break;
    case 'loanNo':closeActions('loan');myMsg('loan','不需要');break;
    case 'linReqYes':if(S.order){toast('还在服务中，先送完这一单','warn');break;}if(!L.req)break;L.req=null;closeActions('lin');myMsg('lin','马上到，门口等我。');
      startOrder(mkOrder('private',PLACES.bar.spot,PLACES.linHome.spot,{npc:'lin',kind:'private',private:true,tail:'0917',pName:'林晚'}));L.rideShift=shiftKey();break;
    case 'linReqNo':L.req=null;closeActions('lin');myMsg('lin','今天不太行，抱歉。');msg('lin','没事。');break;
    case 'invYes':if(L.invite&&L.invite.status==='pending'){L.invite.status='accepted';closeActions('lin');myMsg('lin','好，我去。');msg('lin','那说定了。');linHist(`答应了${whenStr(L.invite.start)}的${L.invite.kind}`);}break;
    case 'invNo':if(L.invite&&L.invite.status==='pending'){closeActions('lin');myMsg('lin','这次不太巧，改天吧。');msg('lin','好，那改天。');L.invite=null;addAff(-1);}break;
    case 'xdir':UI.xfer.dir=arg;break;
    case 'xamt':{const x=UI.xfer;if(arg==='clr')x.amt='';else if(arg==='all')x.amt=String(Math.floor(x.dir==='in'?S.cash:SEC.cash));else x.amt=String((+x.amt||0)+(+arg));break;}
    case 'xgo':{const x=UI.xfer,n=+x.amt||0,r=x.dir==='in'?xferToSec(n):xferToBank(n);toast(r.msg,r.ok?'money':'warn');if(r.ok)x.amt='';break;}
    case 'stock':UI.sel=arg;UI.page='stock';UI.tradePx=null;break;
    case 'star':{const i=SEC.watch.indexOf(arg);if(i>=0)SEC.watch.splice(i,1);else SEC.watch.push(arg);break;}
    case 'allst':UI.allStocks=!UI.allStocks;break;
    case 'kl':UI.kline=arg==='1';break;
    case 'tside':UI.tradeSide=arg;UI.page='trade';UI.tradePx=SBY[UI.sel].px;UI.tradeMsg=null;break;
    case 'tside2':UI.tradeSide=arg;UI.tradeMsg=null;break;
    case 'tsel':UI.sel=arg;UI.tradePx=SBY[arg].px;UI.tradeMsg=null;break;
    case 'mkt':UI.market=arg==='1';break;
    case 'pxd':{const s=SBY[UI.sel];UI.tradePx=r2(clamp(UI.tradePx+(+arg)*.01,limDn(s),limUp(s)));break;}
    case 'pxnow':UI.tradePx=SBY[UI.sel].px;break;
    case 'qd':UI.tradeQty=Math.max(1,UI.tradeQty+(+arg));break;
    case 'order':{const r=placeOrder(UI.sel,UI.tradeSide,UI.tradePx,UI.tradeQty*100,UI.market);UI.tradeMsg=r;if(r.ok)ping(880);else thud();break;}
    case 'cancel':cancelOrder2(+arg);break;
    case 'lesson':doLesson();break;
    case 'shop':shopAct(arg);break;
    case 'home2':homeAct(arg);break;
    case 'closeModal':closeModal();break;
    case 'start':startGame();break;
    case 'dlg':chooseDlg(+arg);break;
    case 'noop':return;
    case 'law':lawAct(arg);return;
    case 'ev':evAct(arg);return;
    case 'mq0':applyQuality(arg);document.querySelectorAll('[data-act=mq0]').forEach(e=>e.classList.toggle('on',e.dataset.arg===arg));return;
    case 'mtab':case 'mclose':case 'mq':case 'mpost':case 'mcock':case 'mvoice':menuAct(a,arg);return;
  }
  renderPhone(true);
}
function closeActions(th){for(const m of S.threads[th].msgs)if(m.actions)m.done=true;}
function doLesson(){
  if(S.lessons>=6)return;
  if(S.energy<8){toast('太累了，听不进去','warn');return;}
  advance(45);S.energy=Math.max(0,S.energy-5);S.lessons++;S.social++;logEv(`上完网课第 ${S.lessons} 节，社交 +1`);toast(`《服务沟通入门》第 ${S.lessons} 节完成，社交 ${S.social}`);
}
