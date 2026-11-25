
// ================= 暂停 / 设置菜单（Esc）=================

const KEYS=[['驾驶',[['W / S','油门 / 刹车（停稳后 S 倒车）'],['A / D','转向'],['空格','急刹'],['Z / X','左 / 右转向灯（变道前要打灯）'],['鼠标拖动','环顾四周']]],
  ['接单',[['O','出车 / 收车'],['1 / 2','派单来时：接单 / 不接'],['E','到达上车点 / 到达目的地 / 确认账单'],['0–9','乘客上车后输入手机尾号']]],
  ['手机',[['Tab','低头看手机（行驶中看不到路）'],['P','把手机拿在手上'],['点击屏幕','操作 App'],['Esc','放下手机']]],
  ['其他',[['E','进面馆 / 回家'],['1–3','对话选项'],['T','时间倍速 ×1 / ×5 / ×20'],['V','语音播报'],['Esc','打开 / 关闭本菜单']]]];
let MENU={tab:'resume',open:false};
function menuTabs(){return[['resume','继续游戏'],['keys','操作说明'],['gfx','画面'],['about','关于与署名']];}
function renderMenu(){
  const m=$('#menu');m.querySelector('.mtabs').innerHTML=menuTabs().map(([k,n])=>`<div class="${MENU.tab===k?'on':''}" data-act="mtab" data-arg="${k}">${n}</div>`).join('');
  let h='';
  if(MENU.tab==='resume')h=`<h3>暂停</h3><div style="font-size:30px;font-weight:300;margin-bottom:6px">${dateStr(S.t)} · ${fmt(S.t)}</div><div class="credit">银行卡 ¥${S.cash.toFixed(2)}　滴滴钱包 ¥${S.dw.toFixed(2)}　服务分 ${S.score.toFixed(1)}</div><div class="mbtn" data-act="mclose">继续游戏</div>`;
  else if(MENU.tab==='keys')h=KEYS.map(([g,l])=>`<h3 style="margin-top:26px">${g}</h3>`+l.map(([k,d])=>`<div class="krow"><span>${d}</span><span>${k.split(' / ').map(x=>`<span class="kbd">${x}</span>`).join('')}</span></div>`).join('')).join('');
  else if(MENU.tab==='gfx')h=`<h3>画面</h3>
    <div class="krow"><span>画质<div class="credit">低：轻薄本 · 中：默认 · 高：独立显卡</div></span><span class="seg2">${[['low','低'],['mid','中'],['high','高']].map(([k,n])=>`<span class="${SET.q===k?'on':''}" data-act="mq" data-arg="${k}">${n}</span>`).join('')}</span></div>
    <div class="krow"><span>后期效果（泛光、调色、暗角）</span><span class="seg2"><span class="${SET.post?'on':''}" data-act="mpost" data-arg="1">开</span><span class="${!SET.post?'on':''}" data-act="mpost" data-arg="0">关</span></span></div>
    <div class="krow"><span>驾驶舱</span><span class="seg2"><span class="${COCKPIT.mode==='model'?'on':''}" data-act="mcock" data-arg="model">写实模型</span><span class="${COCKPIT.mode!=='model'?'on':''}" data-act="mcock" data-arg="proc">简易</span></span></div>
    <div class="krow"><span>语音播报</span><span class="seg2"><span class="${UI.voice?'on':''}" data-act="mvoice" data-arg="1">开</span><span class="${!UI.voice?'on':''}" data-act="mvoice" data-arg="0">关</span></span></div>`;
  else if(MENU.tab==='about')h=`<h3>关于</h3><div class="credit">桥西夜班 · 首轮验证 Demo<br>地图：© OpenStreetMap contributors（ODbL），徐汇 / 静安 / 长宁交界一带。<br>
    车辆：2014 Toyota Corolla E180 EU (with interior) by Armored Wave；2017 Skoda Superb by BHP3D（Sketchfab，CC BY 4.0）。<br>行人：Renderpeople Nathan / Sophia（CC BY 4.0）。树木：Trees (low-Poly, 4k Tris / Tree)（Sketchfab，CC BY 4.0）。<br>
    HDR 天空、照片扫描贴图、街道道具：Poly Haven（CC0）。<br>字体：Inter（OFL）。引擎：three.js r149。<br>股票、公司、新闻、人物均为虚构。</div>`;
  m.querySelector('.mbody').innerHTML=h;
}
function toggleMenu(open){MENU.open=open??!MENU.open;$('#menu').classList.toggle('hidden',!MENU.open);if(MENU.open){MENU.tab='resume';renderMenu();}UI.modal=MENU.open||!$('#modal').classList.contains('hidden');}
function applyQuality(q){SET.q=q;const dpr={low:1,mid:Math.min(devicePixelRatio,1.25),high:Math.min(devicePixelRatio,1.75)}[q];renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight);POST.resize();
  const sm={low:1024,mid:2048,high:3072}[q];if(sun.shadow.mapSize.x!==sm){sun.shadow.mapSize.set(sm,sm);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  LODR.tree={low:260,mid:420,high:600}[q];LODR.prop={low:120,mid:190,high:260}[q];LODR.near={low:180,mid:300,high:420}[q];LODR.car={low:70,mid:110,high:170}[q];chunkT=9;}
function menuAct(a,arg){
  if(a==='mtab'){if(arg==='resume'&&MENU.tab==='resume'){toggleMenu(false);return;}MENU.tab=arg;}
  if(a==='mclose'){toggleMenu(false);return;}
  if(a==='mq')applyQuality(arg);
  if(a==='mpost'){POST.on=arg==='1';SET.post=POST.on;}
  if(a==='mcock')setCockpit(arg);
  if(a==='mvoice')UI.voice=arg==='1';
  renderMenu();
}
