
// ================= 玩家车辆与驾驶舱 =================
// 车身局部坐标：前方 -z，左舵，驾驶员 x=-0.37
const car={x:-205,z:43,h:0,speed:0,steer:0,lookYaw:0,lookPitch:0,accel:0,roll:0,pitch:0,shake:0,blink:0,blinkT:0};
const EYE=new THREE.Vector3(-.37,1.19,.36);
const carG=new THREE.Group();carG.rotation.order='YXZ';scene.add(carG);
const head=new THREE.Group();head.position.copy(EYE);carG.add(head);head.add(camera);
// 材质
const grainC=canvasOf(256,256,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let k=0;k<9000;k++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.18)`;g.beginPath();g.arc(rand(0,w),rand(0,h),rand(.6,2),0,7);g.fill();}});
const grainN=normalFromHeight(grainC,1.2);grainN.repeat.set(6,6);
const dashM=new THREE.MeshStandardMaterial({color:0x1c1d20,roughness:.75,metalness:0,normalMap:grainN,normalScale:new THREE.Vector2(.4,.4)});
const dashTopM=new THREE.MeshStandardMaterial({color:0x232427,roughness:.85,normalMap:grainN,normalScale:new THREE.Vector2(.5,.5)});
const leatherM=new THREE.MeshStandardMaterial({color:0x17181a,roughness:.55,normalMap:grainN,normalScale:new THREE.Vector2(.6,.6)});
const fabricC=canvasOf(128,128,(g,w,h)=>{g.fillStyle='#8c8a86';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(x,y,2,2);}});
const fabricM=new THREE.MeshStandardMaterial({map:texFromCanvas(fabricC,true),roughness:.95});fabricM.map.repeat.set(8,8);
const seatC=canvasOf(128,256,(g,w,h)=>{g.fillStyle='#2b2b2e';g.fillRect(0,0,w,h);g.fillStyle='#232326';for(let y=8;y<h;y+=22)g.fillRect(10,y,w-20,14);g.strokeStyle='#3a3a3e';g.lineWidth=1;for(let y=8;y<h;y+=22)g.strokeRect(10,y,w-20,14);});
const seatM=new THREE.MeshStandardMaterial({map:texFromCanvas(seatC,false),roughness:.7,normalMap:grainN});
const pianoM=new THREE.MeshStandardMaterial({color:0x08090a,roughness:.15,metalness:.3});
const satinM=std('#8d9094',.35,.9);
const hoodPaint=paintMat('#e9e9e6');
function add(mesh,parent=carG){mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function M(geo,mat,x,y,z,rx=0,ry=0,rz=0,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);return add(m,parent);}
// --- 引擎盖（带弧度的曲面）---
{const g=new THREE.PlaneGeometry(1.76,1.4,16,8);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,-Math.pow(x/.9,2)*.06-(y+.7)*.0);}g.computeVertexNormals();
  const m=M(g,hoodPaint,0,.97,-1.72,-Math.PI/2-.09);m.castShadow=true;
  M(new THREE.CylinderGeometry(.012,.012,.62,6),trimMat,-.42,1.0,-1.08,0,0,Math.PI/2+.15);M(new THREE.CylinderGeometry(.012,.012,.62,6),trimMat,.25,1.0,-1.1,0,0,Math.PI/2+.1);
  M(new THREE.BoxGeometry(1.7,.04,.12),trimMat,0,.985,-1.03);}
// --- 仪表台 ---
add(new THREE.Mesh(profileX([[-1.04,1.0],[-.8,1.045],[-.55,1.065],[-.42,1.06],[-.35,1.03],[-.31,.96],[-.32,.84],[-.36,.7],[-.48,.52],[-.7,.42],[-1.04,.42]],1.52,null,.03),dashM));
add(new THREE.Mesh(profileX([[-1.02,1.004],[-.6,1.05],[-.45,1.064],[-.6,1.066],[-1.02,1.02]],1.5,null,.005),dashTopM));
// 仪表罩 + 数字仪表
add(new THREE.Mesh(profileX([[-.58,1.06],[-.5,1.12],[-.38,1.12],[-.34,1.1],[-.36,1.06]],.46,null,.015),dashM)).position.x=-.37;
const clusterCv=document.createElement('canvas');clusterCv.width=512;clusterCv.height=180;const clusterTex=texFromCanvas(clusterCv,false);
const clusterScr=M(new THREE.PlaneGeometry(.34,.12),new THREE.MeshBasicMaterial({map:clusterTex,toneMapped:false}),-.37,1.045,-.43,-.32);
// 中控大屏
const ccCv=document.createElement('canvas');ccCv.width=640;ccCv.height=400;const ccTex=texFromCanvas(ccCv,false);
M(rboxG(.33,.21,.018,.012),pianoM,.06,1.08,-.45,-.28);const ccScr=M(new THREE.PlaneGeometry(.31,.19),new THREE.MeshBasicMaterial({map:ccTex,toneMapped:false}),.06,1.08,-.439,-.28);
// 出风口
for(const x of[-.7,-.02,.14,.68]){M(rboxG(.14,.05,.03,.01),pianoM,x,.93,-.335,-.1);for(let k=0;k<3;k++)M(new THREE.BoxGeometry(.13,.004,.03),satinM,x,.915+k*.015,-.325,-.1);}
// 中控台 + 档把 + 杯架 + 扶手
add(new THREE.Mesh(profileX([[-.45,.5],[-.36,.7],[-.2,.62],[.55,.62],[.6,.5],[.6,.2],[-.45,.2]],.26,null,.02),dashM));
M(rboxG(.24,.3,.02,.01),pianoM,0,.625,-.05,-Math.PI/2);
const gear=M(new THREE.CylinderGeometry(.025,.03,.06,14),satinM,0,.67,-.12);M(new THREE.SphereGeometry(.035,14,10),leatherM,0,.71,-.12);
for(const z of[.08,.2]){M(new THREE.CylinderGeometry(.04,.04,.02,16),pianoM,0,.625,z);}
const bottle=M(new THREE.CylinderGeometry(.032,.032,.2,14),new THREE.MeshStandardMaterial({color:0xcfe8ff,roughness:.05,metalness:0,transparent:true,opacity:.55}),0,.72,.2);M(new THREE.CylinderGeometry(.018,.018,.025,10),std('#2a6fd6',.4),0,.83,.2);
M(rboxG(.22,.1,.38,.04),leatherM,0,.7,.5);
// --- 方向盘 ---
const wheelPivot=new THREE.Group();wheelPivot.position.set(-.37,.95,-.2);wheelPivot.rotation.x=-.42;carG.add(wheelPivot);
M(new THREE.CylinderGeometry(.03,.04,.32,12),dashM,0,0,.16,Math.PI/2,0,0,wheelPivot).position.z=-.16;
const wheelSpin=new THREE.Group();wheelPivot.add(wheelSpin);
{const rim=new THREE.Mesh(new THREE.TorusGeometry(.185,.017,14,48),leatherM);add(rim,wheelSpin);
  const hub=new THREE.Mesh(rboxG(.12,.09,.05,.03),leatherM);hub.position.z=.01;add(hub,wheelSpin);
  const logo=new THREE.Mesh(new THREE.TorusGeometry(.014,.003,6,20),satinM);logo.position.z=.04;add(logo,wheelSpin);
  for(const[a,l]of[[0,.13],[Math.PI,.13],[-Math.PI/2,.11]]){const s=new THREE.Mesh(rboxG(l,.03,.018,.008),dashM);s.position.set(Math.cos(a)*(.07+l/2-.06),Math.sin(a)*(.07+l/2-.06),.005);s.rotation.z=a;add(s,wheelSpin);}
  for(const s of[-1,1]){const b=new THREE.Mesh(rboxG(.035,.025,.01,.006),satinM);b.position.set(s*.085,.012,.022);add(b,wheelSpin);}
  // 拨杆
  const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.007,.009,.14,8),dashM);stalk.rotation.z=Math.PI/2;stalk.position.set(-.13,.02,-.07);add(stalk,wheelPivot);
}
// --- A 柱、车顶、遮阳板、车门 ---
function strut(a,b,w,d,mat){const v=new THREE.Vector3().subVectors(b,a),L=v.length();const m=new THREE.Mesh(rboxG(w,L,d,.02),mat);m.position.copy(a).addScaledVector(v,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return add(m);}
strut(new THREE.Vector3(-.73,1.0,-1.0),new THREE.Vector3(-.66,1.43,-.18),.09,.07,fabricM);
strut(new THREE.Vector3(.73,1.0,-1.0),new THREE.Vector3(.66,1.43,-.18),.09,.07,fabricM);
strut(new THREE.Vector3(-.76,.98,.62),new THREE.Vector3(-.68,1.43,.58),.1,.09,fabricM);strut(new THREE.Vector3(.76,.98,.62),new THREE.Vector3(.68,1.43,.58),.1,.09,fabricM);
strut(new THREE.Vector3(-.72,.98,1.7),new THREE.Vector3(-.62,1.4,1.2),.22,.08,fabricM);strut(new THREE.Vector3(.72,.98,1.7),new THREE.Vector3(.62,1.4,1.2),.22,.08,fabricM);
M(new THREE.PlaneGeometry(1.38,1.5),fabricM,0,1.44,.5,Math.PI/2);
M(rboxG(1.4,.06,.1,.02),fabricM,0,1.42,-.17);M(rboxG(1.4,.08,.1,.02),fabricM,0,1.41,1.22);
for(const s of[-1,1])M(rboxG(.38,.17,.02,.02),fabricM,s*.36,1.405,-.1,Math.PI/2-.12);
// 车门
for(const s of[-1,1]){
  add(new THREE.Mesh(profileX([[-.95,1.0],[.62,.99],[.62,.45],[-.6,.45],[-.95,.7]],.06,null,.015),dashM)).position.x=s*.78;
  M(rboxG(.08,.06,.45,.02),leatherM,s*.73,.8,.05);
  M(new THREE.BoxGeometry(.02,.03,1.5),satinM,s*.76,.995,-.15);
  add(new THREE.Mesh(profileX([[.62,.99],[1.8,.98],[1.8,.45],[.62,.45]],.06,null,.01),dashM)).position.x=s*.78;
}
// 后视镜（外）
for(const s of[-1,1]){const g=new THREE.Group();g.position.set(s*.96,1.06,-.72);carG.add(g);M(rboxG(.08,.12,.2,.04),hoodPaint,s*.02,0,0,0,Math.PI/2,0,g);g.userData.s=s;if(s<0)carG.userData.lm=g;else carG.userData.rm=g;}
// --- 座椅 ---
function seat(x,z){const g=new THREE.Group();g.position.set(x,0,z);carG.add(g);
  M(rboxG(.5,.12,.5,.05),seatM,0,.48,0,-.08,0,0,g);const back=M(rboxG(.5,.62,.12,.05),seatM,0,.82,.28,-.2,0,0,g);
  M(rboxG(.26,.18,.09,.04),seatM,0,1.22,.38,-.12,0,0,g);for(const s of[-1,1])M(new THREE.CylinderGeometry(.006,.006,.08,6),satinM,s*.07,1.12,.37,0,0,0,g);return g;}
seat(.37,.45);seat(-.37,.62).visible=false;
M(rboxG(1.36,.14,.5,.05),seatM,0,.5,1.25);M(rboxG(1.36,.58,.12,.05),seatM,0,.84,1.5,-.15);
M(rboxG(1.3,.06,.35,.02),dashM,0,.96,1.72);
// --- 挡风玻璃（轻微反光 + 污渍）---
const dirtTex=ctex(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let k=0;k<500;k++){g.fillStyle=`rgba(200,200,190,${rand(.02,.09)})`;g.beginPath();g.arc(rand(0,w),rand(0,h),rand(.5,3),0,7);g.fill();}
  g.strokeStyle='rgba(220,220,210,.05)';g.lineWidth=3;for(const cx of[150,360]){g.beginPath();g.arc(cx,h+20,190,Math.PI*1.1,Math.PI*1.9);g.stroke();}const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(30,50,60,.25)');gr.addColorStop(.2,'rgba(30,50,60,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},false);
const windM=new THREE.MeshStandardMaterial({color:0xffffff,map:dirtTex,transparent:true,opacity:1,roughness:.05,metalness:1,envMapIntensity:.18,depthWrite:false});
{const a=new THREE.Vector3(0,1.0,-1.02),b=new THREE.Vector3(0,1.43,-.17),v=b.clone().sub(a);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.46,v.length()),windM);m.position.copy(a).addScaledVector(v,.5);m.rotation.x=Math.atan2(v.z,v.y);add(m);m.renderOrder=5;}
// --- 后视镜（中央，实时渲染）---
const mirrorRT=new THREE.WebGLRenderTarget(320,96,{type:THREE.HalfFloatType});const sideRT=new THREE.WebGLRenderTarget(160,128,{type:THREE.HalfFloatType});
mirrorRT.texture.wrapS=sideRT.texture.wrapS=THREE.RepeatWrapping;mirrorRT.texture.repeat.x=sideRT.texture.repeat.x=-1;
const mirrorCam=new THREE.PerspectiveCamera(22,320/96,.2,600),sideCam=new THREE.PerspectiveCamera(26,160/128,.5,500);
{const g=new THREE.Group();g.position.set(-.02,1.32,-.36);carG.add(g);M(new THREE.CylinderGeometry(.008,.008,.08,6),dashM,0,.06,0,0,0,0,g);
  M(rboxG(.27,.085,.035,.02),dashM,0,0,0,0,0,0,g);const s=M(new THREE.PlaneGeometry(.25,.07),new THREE.MeshBasicMaterial({map:mirrorRT.texture}),0,0,.0185,0,0,0,g);g.rotation.set(-.05,.12,0);
  carG.add(mirrorCam);mirrorCam.position.set(-.02,1.3,.2);mirrorCam.rotation.set(-.03,Math.PI,0);}
{const lm=carG.userData.lm;M(new THREE.PlaneGeometry(.17,.1),new THREE.MeshBasicMaterial({map:sideRT.texture}),-.03,0,0,0,Math.PI/2+.25,0,lm);lm.rotation.y=-.0;
  carG.add(sideCam);sideCam.position.set(-1.02,1.05,-.6);sideCam.rotation.set(-.04,Math.PI-.18,0);}
// --- 车内乘客（后排）---
const rearSeatSpot=new THREE.Vector3(.36,.56,1.2);
// --- 手机支架 + 手机 ---
const PHONE_W=.074,PHONE_H=PHONE_W*760/360;
const mountG=new THREE.Group();mountG.position.set(-.125,.985,-.345);mountG.rotation.set(-.15,-.32,0);carG.add(mountG);
M(new THREE.CylinderGeometry(.012,.012,.05,8),dashM,0,-.04,-.02,.4,0,0,mountG);
M(rboxG(.09,.02,.03,.008),dashM,0,-PHONE_H/2-.005,.004,0,0,0,mountG);for(const s of[-1,1])M(rboxG(.012,.05,.03,.005),dashM,s*(PHONE_W/2+.006),0,.004,0,0,0,mountG);
const phoneBody=new THREE.Mesh(rboxG(PHONE_W+.006,PHONE_H+.006,.009,.01),new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:.2,metalness:.6}));phoneBody.position.z=-.004;
const phoneG=new THREE.Group();phoneG.add(phoneBody);mountG.add(phoneG);
const phoneScreen=new THREE.Object3D();phoneScreen.position.z=.0006;phoneG.add(phoneScreen);
// --- 车内灯光 ---
const headL=new THREE.SpotLight(0xfff1d6,0,110,.5,.5,1.2);headL.position.set(0,.8,-2.4);carG.add(headL);const hlT=new THREE.Object3D();hlT.position.set(0,-1.2,-30);carG.add(hlT);headL.target=hlT;
const cabinL=new THREE.PointLight(0xffc89a,0,2.2,2);cabinL.position.set(0,1.38,-.1);carG.add(cabinL);
const screenL=new THREE.PointLight(0x9fc8ff,.15,1.2,2);screenL.position.set(-.1,1.06,-.32);carG.add(screenL);
const cabFill=new THREE.HemisphereLight(0xffffff,0x444444,0);carG.add(cabFill);
// --- 仪表绘制 ---
function drawCluster(){
  const g=clusterCv.getContext('2d'),w=512,h=180;g.fillStyle='#04060a';g.fillRect(0,0,w,h);
  const kmh=Math.abs(car.speed*3.6);const gr=g.createRadialGradient(w/2,h,10,w/2,h,260);gr.addColorStop(0,'rgba(40,90,160,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#eef6ff';g.font='bold 78px "Helvetica Neue",Arial,sans-serif';g.textAlign='center';g.fillText(Math.round(kmh),w/2,104);
  g.font='18px Arial';g.fillStyle='#7fa8c9';g.fillText('km/h',w/2,130);
  g.strokeStyle='#1a2a3a';g.lineWidth=6;g.beginPath();g.arc(w/2,96,84,Math.PI*.8,Math.PI*2.2);g.stroke();g.strokeStyle='#4fb3ff';g.beginPath();g.arc(w/2,96,84,Math.PI*.8,Math.PI*(.8+1.4*Math.min(1,kmh/100)));g.stroke();
  g.textAlign='left';g.font='bold 30px Arial';['P','R','N','D'].forEach((c,i)=>{const on=(c==='D'&&car.speed>=-.2&&Math.abs(car.speed)>.05)||(c==='R'&&car.speed<-.2)||(c==='P'&&Math.abs(car.speed)<=.05);g.fillStyle=on?'#ffffff':'#3a4552';g.fillText(c,24+i*26,62);});
  g.font='20px Arial';g.fillStyle='#9ab';g.fillText(fmt(S.t),24,100);
  g.fillStyle=S.battery<20?'#ff6a4f':'#3fe08a';g.fillRect(24,130,90*S.battery/100,10);g.strokeStyle='#4a5560';g.lineWidth=1;g.strokeRect(24,130,90,10);g.fillStyle='#9ab';g.font='16px Arial';g.fillText(Math.round(S.battery)+'%  '+Math.round(S.battery*3.6)+'km',24,162);
  g.textAlign='right';g.font='18px "PingFang SC","Microsoft YaHei",sans-serif';
  const o=S.order;g.fillStyle=S.online?'#ff8a2a':'#556';g.fillText(o?({toPickup:'去接乘客',waiting:'等待乘客',verify:'核验尾号',toDrop:'行程中'})[o.phase]||'':S.online?'听单中':'未出车',w-22,56);
  const n=navInfo();if(n){g.fillStyle='#e8f4ff';g.font='bold 30px Arial';g.fillText(n.arrow+' '+Math.round(n.dist*KM)+'m',w-22,100);g.font='16px "PingFang SC","Microsoft YaHei",sans-serif';g.fillStyle='#9ab';g.fillText(n.text.slice(0,12),w-22,128);}
  const bl=car.blink&&(performance.now()%800<400);g.fillStyle=bl&&car.blink<0?'#3fe08a':'#1a2a20';g.beginPath();g.moveTo(150,30);g.lineTo(170,18);g.lineTo(170,42);g.fill();g.fillStyle=bl&&car.blink>0?'#3fe08a':'#1a2a20';g.beginPath();g.moveTo(362,30);g.lineTo(342,18);g.lineTo(342,42);g.fill();
  if(S.energy<20){g.fillStyle='#ffb020';g.font='16px "PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.fillText('☕ 检测到疲劳驾驶，请注意休息',w/2,168);}
  clusterTex.needsUpdate=true;
}
function drawCC(){
  const g=ccCv.getContext('2d'),w=640,h=400;
  g.fillStyle='#0b0e13';g.fillRect(0,0,w,h);
  g.save();g.beginPath();g.rect(0,0,w*.66,h);g.clip();g.translate(-60,0);drawMiniTo(g,w*.66+120,h,true);g.restore();
  g.fillStyle='#111722';g.fillRect(w*.66,0,w*.34,h);
  g.fillStyle='#fff';g.font='bold 34px Arial';g.textAlign='left';g.fillText(fmt(S.t),w*.66+18,52);
  g.font='18px "PingFang SC","Microsoft YaHei",sans-serif';g.fillStyle='#8a97a8';g.fillText(dateStr(S.t),w*.66+18,80);
  const o=S.order;
  if(o){g.fillStyle='#ff8a2a';g.fillText(o.phase==='toDrop'?'送乘客至':'接乘客',w*.66+18,128);g.fillStyle='#fff';g.font='20px "PingFang SC","Microsoft YaHei",sans-serif';wrapText(g,o.phase==='toDrop'?o.dropName:o.pickName,w*.66+18,156,w*.3,26);
    g.fillStyle='#8a97a8';g.font='17px "PingFang SC","Microsoft YaHei",sans-serif';g.fillText((o.phase==='toDrop'?'送达截止 ':'接驾截止 ')+fmt(o.phase==='toDrop'?o.dropDdl:o.pickDdl),w*.66+18,230);
    const late=S.t>(o.phase==='toDrop'?o.dropDdl:o.pickDdl);if(late){g.fillStyle='#ff6a4f';g.fillText('已超时',w*.66+18,256);}}
  else{g.fillStyle='#8a97a8';g.fillText(S.online?'听单中…':'未出车',w*.66+18,128);}
  g.fillStyle='#3a4552';g.fillRect(w*.66+18,h-64,w*.3,1);g.fillStyle='#8a97a8';g.font='16px "PingFang SC","Microsoft YaHei",sans-serif';g.fillText('空调 22°C  ·  外循环',w*.66+18,h-30);
  ccTex.needsUpdate=true;
}
function wrapText(g,t,x,y,mw,lh){let line='';for(const ch of t){if(g.measureText(line+ch).width>mw){g.fillText(line,x,y);y+=lh;line=ch;}else line+=ch;}g.fillText(line,x,y);}
