// ================= 林晚 =================
function makeLin(seated){if(!seated&&typeof PT_WALK!=='undefined'&&PT_WALK[3]&&window.SkeletonUtils){const g=makeRealPed(PT_WALK[3]);g.userData.mixer&&g.userData.mixer.update(.4);g.userData.mixer=null;return g;}return makePerson({top:'#1a1a1d',bottom:'#2a2a30',hair:'#120d0b',longHair:true,skin:'#ecc7a4',fem:true,seated:!!seated,h:1});}
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
  if(L.contact&&L.aff>=25&&m===118&&!S.order&&linWorksNight()&&L.rideShift!==shiftKey()&&!S.asleep&&S.loc==='car'&&Math.random()<.65){
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

function linOffer(){
  const m=S.t%1440;if(L.rideShift===shiftKey())return null;
  if(m>=115&&m<=160&&linWorksNight()&&dist(car,PLACES.bar.spot)<480&&Math.random()<.7)return mkOrder('rt',PLACES.bar.spot,PLACES.linHome.spot,{npc:'lin',kind:'bar',tag:'夜场',tail:'0917',pName:'林女士'});
  if(m>=1035&&m<=1070&&wdOf(S.t)!==1&&dist(car,PLACES.linHome.spot)<480&&Math.random()<.45)return mkOrder('rt',PLACES.linHome.spot,PLACES.bar.spot,{npc:'lin',kind:'commute',tail:'0917',pName:'林女士'});
  return null;
}
