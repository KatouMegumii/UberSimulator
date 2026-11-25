
// ================= 程序化 PBR 纹理 =================
const TXS=512;
// --- 柏油路 ---
const asphaltC=canvasOf(1024,1024,(g,w,h)=>{g.fillStyle='#3a3b3d';g.fillRect(0,0,w,h);
  for(let k=0;k<90000;k++){const v=Math.random();g.fillStyle=v<.5?`rgba(20,20,22,${Math.random()*.35})`:`rgba(150,148,142,${Math.random()*.25})`;g.fillRect(Math.random()*w,Math.random()*h,Math.random()*2+.5,Math.random()*2+.5);}
  for(let k=0;k<14;k++){g.fillStyle=`rgba(${Math.random()<.5?'25,25,28':'70,70,72'},${rand(.15,.35)})`;const x=rand(0,w),y=rand(0,h);g.fillRect(x,y,rand(60,240),rand(40,200));}
  g.strokeStyle='rgba(15,15,15,.55)';for(let k=0;k<26;k++){g.lineWidth=rand(.6,1.6);g.beginPath();let x=rand(0,w),y=rand(0,h);g.moveTo(x,y);for(let s=0;s<rand(5,16);s++){x+=rand(-18,18);y+=rand(-18,18);g.lineTo(x,y);}g.stroke();}
  for(let k=0;k<10;k++){const gr=g.createRadialGradient(0,0,0,0,0,rand(10,40));gr.addColorStop(0,'rgba(10,10,12,.35)');gr.addColorStop(1,'rgba(10,10,12,0)');g.save();g.translate(rand(0,w),rand(0,h));g.fillStyle=gr;g.fillRect(-40,-40,80,80);g.restore();}
});
const asphaltTex=texFromCanvas(asphaltC,true);asphaltTex.repeat.set(1/14,1/14);
const asphaltH=canvasOf(512,512,(g,w,h)=>{g.drawImage(asphaltC,0,0,w,h);});
const asphaltN=normalFromHeight(asphaltH,3);asphaltN.repeat.copy(asphaltTex.repeat);
const asphaltR=texFromCanvas(canvasOf(256,256,(g,w,h)=>{g.fillStyle='rgb(0,225,0)';g.fillRect(0,0,w,h);for(let k=0;k<3000;k++){g.fillStyle=`rgba(0,${rand(140,255)|0},0,.6)`;g.fillRect(rand(0,w),rand(0,h),3,3);}}),true,false);asphaltR.repeat.copy(asphaltTex.repeat);
const roadMat=new THREE.MeshStandardMaterial({map:asphaltTex,normalMap:asphaltN,normalScale:new THREE.Vector2(.6,.6),roughnessMap:asphaltR,roughness:1,metalness:0});
// --- 人行道地砖 ---
const paveC=canvasOf(512,512,(g,w,h)=>{const n=8,s=w/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=rand(118,150);g.fillStyle=`rgb(${v},${v-4},${v-10})`;g.fillRect(x*s,y*s,s,s);noise(g,0,0,0,0);
  for(let k=0;k<160;k++){g.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${Math.random()*.09})`;g.fillRect(x*s+rand(0,s),y*s+rand(0,s),2,2);}}
  g.strokeStyle='#4a4640';g.lineWidth=3;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke();}
  for(let k=0;k<8;k++){g.fillStyle=`rgba(40,36,30,${rand(.05,.16)})`;g.beginPath();g.arc(rand(0,w),rand(0,h),rand(10,50),0,7);g.fill();}
  g.fillStyle='#c9a227';for(let y=0;y<h;y+=s){g.fillRect(s*6+4,y+4,s-8,s-8);}
  g.fillStyle='#a8861c';for(let y=0;y<h;y+=s)for(let k=0;k<4;k++)g.fillRect(s*6+10,y+10+k*14,s-20,4);
});
const paveTex=texFromCanvas(paveC,true);
const paveN=normalFromHeight(canvasOf(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.strokeStyle='#000';g.lineWidth=3;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32,h);g.stroke();g.beginPath();g.moveTo(0,i*32);g.lineTo(w,i*32);g.stroke();}}),4);
const paveMat=new THREE.MeshStandardMaterial({map:paveTex,normalMap:paveN,roughness:.92,metalness:0});
const curbMat=new THREE.MeshStandardMaterial({map:texFromCanvas(canvasOf(256,64,(g,w,h)=>{g.fillStyle='#9d9a94';g.fillRect(0,0,w,h);noise(g,w,h,3000,.15);g.fillStyle='rgba(0,0,0,.2)';for(let x=0;x<w;x+=64)g.fillRect(x,0,2,h);}),true),roughness:.8});
// --- 立面贴图：颜色 / 粗糙金属 / 发光 / 法线 ---
function facade(kind){
  const W=TXS,FL=4,BY=4,fh=W/FL,bw=W/BY;
  const col=document.createElement('canvas'),hgt=document.createElement('canvas'),rm=document.createElement('canvas'),em=document.createElement('canvas');
  for(const c of[col,hgt,rm,em]){c.width=c.height=W;}
  const g=col.getContext('2d'),hg=hgt.getContext('2d'),rg=rm.getContext('2d'),eg=em.getContext('2d');
  hg.fillStyle='#808080';hg.fillRect(0,0,W,W);rg.fillStyle='rgb(0,235,0)';rg.fillRect(0,0,W,W);eg.fillStyle='#000';eg.fillRect(0,0,W,W);
  // 墙面
  if(kind==='brick'){g.fillStyle='#8a4a38';g.fillRect(0,0,W,W);for(let y=0;y<W;y+=8)for(let x=(y/8%2)*8;x<W;x+=16){const v=rand(-18,18);g.fillStyle=`rgb(${130+v},${68+v*.6},${52+v*.5})`;g.fillRect(x,y,15,7);hg.fillStyle='#999';hg.fillRect(x,y,15,7);}
    g.fillStyle='rgba(210,200,185,.9)';for(let r=1;r<FL;r++)g.fillRect(0,r*fh-6,W,6);}
  else if(kind==='plaster'){g.fillStyle='#d6cbb5';g.fillRect(0,0,W,W);noise(g,W,W,9000,.08,3);
    for(let k=0;k<26;k++){const x=rand(0,W);const gr=g.createLinearGradient(0,0,0,W);gr.addColorStop(0,'rgba(60,55,45,.0)');gr.addColorStop(.3,'rgba(60,55,45,.12)');gr.addColorStop(1,'rgba(60,55,45,.02)');g.fillStyle=gr;g.fillRect(x,rand(0,W*.5),rand(3,14),W);}}
  else if(kind==='tile'){g.fillStyle='#e4e1da';g.fillRect(0,0,W,W);for(let y=0;y<W;y+=6)for(let x=0;x<W;x+=12){const v=rand(-8,8);g.fillStyle=`rgb(${226+v},${223+v},${215+v})`;g.fillRect(x,y,11,5);}
    for(let k=0;k<18;k++){g.fillStyle='rgba(70,65,55,.08)';g.fillRect(rand(0,W),rand(0,W),rand(2,8),rand(80,300));}}
  else if(kind==='glass'){g.fillStyle='#5d7286';g.fillRect(0,0,W,W);rg.fillStyle='rgb(0,20,200)';rg.fillRect(0,0,W,W);}
  else if(kind==='dark'){g.fillStyle='#5f5a58';g.fillRect(0,0,W,W);noise(g,W,W,9000,.1,3);}
  // 窗
  for(let r=0;r<FL;r++)for(let c=0;c<BY;c++){
    const y0=r*fh,x0=c*bw;let x,y,w,h;
    if(kind==='glass'){x=x0+3;y=y0+3;w=bw-6;h=fh-6;
      const v=rand(-12,12);g.fillStyle=`rgb(${78+v},${100+v},${120+v})`;g.fillRect(x,y,w,h);g.fillStyle='#2b3138';g.fillRect(x0,y0,bw,4);g.fillRect(x0,y0,4,fh);g.fillRect(x0,y0+fh*.8,bw,5);
      rg.fillStyle='rgb(0,12,230)';rg.fillRect(x,y,w,h);rg.fillStyle='rgb(0,140,200)';rg.fillRect(x0,y0,bw,4);rg.fillRect(x0,y0,4,fh);
      hg.fillStyle='#606060';hg.fillRect(x,y,w,h);
    }else{
      const narrow=kind==='brick';w=narrow?bw*.42:bw*.62;h=fh*(narrow?.56:.5);x=x0+(bw-w)/2;y=y0+fh*.2;
      hg.fillStyle='#202020';hg.fillRect(x,y,w,h);hg.fillStyle='#fff';hg.fillRect(x-4,y+h,w+8,5);
      g.fillStyle=kind==='brick'?'#d9d4c8':'#9aa0a4';g.fillRect(x-4,y-4,w+8,h+8);
      g.fillStyle='#2a2e33';g.fillRect(x,y,w,h);
      const gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'rgba(170,190,210,.45)');gr.addColorStop(.5,'rgba(60,70,80,.1)');gr.addColorStop(1,'rgba(140,160,180,.3)');g.fillStyle=gr;g.fillRect(x,y,w,h);
      g.fillStyle=kind==='brick'?'#6b4a32':'#b8bcbf';g.fillRect(x+w/2-2,y,4,h);g.fillRect(x,y+h*.35,w,3);
      rg.fillStyle='rgb(0,18,120)';rg.fillRect(x,y,w,h);
      if(Math.random()<.3){g.fillStyle=pick(['#e8e1cf','#c9b38a','#d8d0e0','#b8c9b0']);g.fillRect(x+2,y+2,w*.45,h-4);}
      if(kind!=='glass'&&Math.random()<(kind==='brick'?.55:.35)){ // 防盗窗
        g.strokeStyle='rgba(60,62,64,.95)';g.lineWidth=2;const ox=x-6,oy=y-4,ow=w+12,oh=h+10;g.strokeRect(ox,oy,ow,oh);for(let k=ox;k<ox+ow;k+=7){g.beginPath();g.moveTo(k,oy);g.lineTo(k,oy+oh);g.stroke();}
        hg.fillStyle='#b0b0b0';hg.fillRect(ox,oy+oh-3,ow,3);}
      if(kind==='brick'){g.fillStyle='#c9c2b4';g.fillRect(x-6,y-10,w+12,6);}
    }
    // 夜间灯光
    const lit=Math.random()<(kind==='glass'?.55:.45);
    if(lit){const warm=Math.random()<(kind==='glass'?.35:.78);const ex=kind==='glass'?x:x,ey=y,ew=w,eh=h;
      const gr=eg.createLinearGradient(0,ey,0,ey+eh);const c1=warm?[255,196,120]:[200,225,255];const s=rand(.55,1);gr.addColorStop(0,`rgba(${c1[0]*s|0},${c1[1]*s|0},${c1[2]*s|0},1)`);gr.addColorStop(1,`rgba(${c1[0]*s*.6|0},${c1[1]*s*.6|0},${c1[2]*s*.6|0},1)`);
      eg.fillStyle=gr;eg.fillRect(ex+2,ey+2,ew-4,eh-4);
      if(Math.random()<.5){eg.fillStyle='rgba(60,30,15,.9)';eg.fillRect(ex+2,ey+2,(ew-4)*rand(.2,.5),eh-4);}
      if(kind==='glass'&&Math.random()<.6){eg.fillStyle='rgba(0,0,0,.6)';for(let k=0;k<3;k++)eg.fillRect(ex,ey+eh*rand(.2,.9),ew,2);}}
  }
  // 屋顶用的角落像素
  g.fillStyle='#6d6a66';g.fillRect(0,W-6,6,6);rg.fillStyle='rgb(0,240,0)';rg.fillRect(0,W-6,6,6);eg.fillStyle='#000';eg.fillRect(0,W-6,6,6);
  const map=texFromCanvas(col,true),rough=texFromCanvas(rm,true,false),emi=texFromCanvas(em,true),nrm=normalFromHeight(hgt,kind==='glass'?2:5);
  return{map,rough,emi,nrm};
}
const FAC={brick:facade('brick'),plaster:facade('plaster'),tile:facade('tile'),glass:facade('glass'),dark:facade('dark')};
const BMATS=[];const _bm={};
function bmat(kind,tint){const k=kind+tint;if(_bm[k])return _bm[k];const f=FAC[kind];
  const m=new THREE.MeshStandardMaterial({color:tint,map:f.map,roughnessMap:f.rough,metalnessMap:f.rough,roughness:1,metalness:kind==='glass'?1:.6,normalMap:f.nrm,normalScale:new THREE.Vector2(.9,.9),emissive:0xffffff,emissiveMap:f.emi,emissiveIntensity:0,envMapIntensity:kind==='glass'?1.2:.8});
  BMATS.push(m);return _bm[k]=m;}
function bldGeo(w,h,d,x,y,z,T=12){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,F=[[d,h],[d,h],null,null,[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let v=0;v<4;v++){const k=f*4+v;if(!F[f])uv.setXY(k,.004,.996);else uv.setXY(k,uv.getX(k)*F[f][0]/T,uv.getY(k)*F[f][1]/T);}
  g.translate(x,y,z);return g;
}
// --- 屋瓦 ---
const roofTileC=canvasOf(256,256,(g,w,h)=>{g.fillStyle='#3d3936';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=(y/16%2)*8;x<w;x+=16){const v=rand(-10,14);g.fillStyle=`rgb(${66+v},${60+v},${56+v})`;g.beginPath();g.ellipse(x+8,y+10,8,9,0,0,Math.PI*2);g.fill();}noise(g,w,h,2000,.15);});
const roofMat=new THREE.MeshStandardMaterial({map:texFromCanvas(roofTileC,true),normalMap:normalFromHeight(roofTileC,3),roughness:.85});
// --- 商铺 ---
function interiorTex(kind){return ctex(256,128,(g,w,h)=>{
  const warm=kind!=='cold';g.fillStyle=warm?'#5a3a22':'#c9d2d8';g.fillRect(0,0,w,h);
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,warm?'rgba(255,220,160,.9)':'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(40,30,20,.6)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let k=0;k<5;k++){g.fillStyle=`rgba(${rand(40,200)|0},${rand(40,200)|0},${rand(40,200)|0},.75)`;g.fillRect(k*52+6,30,40,70);for(let s=0;s<4;s++){g.fillStyle='rgba(30,25,20,.6)';g.fillRect(k*52+6,40+s*16,40,2);}}
  g.fillStyle='rgba(255,255,240,.95)';for(let x=20;x<w;x+=60)g.fillRect(x,4,30,4);
  g.fillStyle='rgba(20,15,10,.55)';g.fillRect(rand(30,200),70,14,50);
});}
const INT_TEX=[interiorTex('warm'),interiorTex('cold'),interiorTex('warm'),interiorTex('cold')];
const INT_MATS=INT_TEX.map(t=>new THREE.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.25,roughness:.15,metalness:.1}));
const shutterMat=new THREE.MeshStandardMaterial({map:ctex(64,128,(g,w,h)=>{g.fillStyle='#9a9c9e';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=5){g.fillStyle='#6c6e70';g.fillRect(0,y,w,1.5);}noise(g,w,h,600,.2);}),roughness:.5,metalness:.7});
const _st={};const SIGNMATS=[];
function signMat(text,style,vertical){
  const k=text+'|'+style+'|'+!!vertical;if(_st[k])return _st[k];
  const SC={red:['#b8282e','#fff7e0'],green:['#1f6f4a','#ffffff'],blue:['#1d4f91','#ffffff'],yellow:['#f2c230','#2a1a00'],white:['#f4f2ec','#b8282e'],dark:['#17181c','#f2d39a'],orange:['#e86a1c','#fff']};
  const neon=style==='neon';const W=vertical?96:512,H=vertical?384:128;
  const t=ctex(W,H,(g,w,h)=>{
    const font=`bold ${vertical?64:76}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
    if(neon){g.fillStyle='#08080c';g.fillRect(0,0,w,h);const col=pick(['#ff4fd8','#4ff3ff','#ffe04f','#ff6a4f','#9d7bff','#7dff8a']);g.shadowColor=col;g.shadowBlur=18;g.strokeStyle=col;g.lineWidth=5;g.strokeRect(8,8,w-16,h-16);g.fillStyle=col;}
    else{const[bg,fg]=SC[style]||SC.red;const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,bg);gr.addColorStop(1,shade(bg,-.25));g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,w,h*.12);g.fillStyle=fg;}
    g.font=font;g.textAlign='center';g.textBaseline='middle';
    if(vertical){const ch=[...text];ch.forEach((c,i)=>g.fillText(c,w/2,h/2+(i-(ch.length-1)/2)*74));}else{let fs=76;while(g.measureText(text).width>w-40&&fs>30){fs-=4;g.font=`bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;}g.fillText(text,w/2,h/2+4);if(neon)g.fillText(text,w/2,h/2+4);}
  });
  const m=new THREE.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.15,roughness:.35});m.userData.neon=neon;SIGNMATS.push(m);return _st[k]=m;
}
function shade(hex,p){const c=new THREE.Color(hex);c.offsetHSL(0,0,p*.5);return'#'+c.getHexString();}
// --- 空调外机 ---
const acTex=ctex(128,96,(g,w,h)=>{g.fillStyle='#d9d8d2';g.fillRect(0,0,w,h);g.fillStyle='#3a3a3a';g.beginPath();g.arc(48,48,34,0,7);g.fill();g.strokeStyle='#bbb';g.lineWidth=2;for(let r=8;r<34;r+=5){g.beginPath();g.arc(48,48,r,0,7);g.stroke();}g.fillStyle='#c5c4be';g.fillRect(92,10,28,76);noise(g,w,h,800,.12);g.fillStyle='rgba(90,70,40,.25)';g.fillRect(0,h-14,w,14);});
const acMat=new THREE.MeshStandardMaterial({map:acTex,roughness:.6});
// --- 梧桐：树皮与叶片 ---
const barkC=canvasOf(128,256,(g,w,h)=>{g.fillStyle='#b7ad92';g.fillRect(0,0,w,h);for(let k=0;k<120;k++){g.fillStyle=pick(['#8c8a6a','#d6cfb8','#7a7558','#c4bb9c','#9aa07a']);g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(5,18),rand(8,26),rand(0,3),0,7);g.fill();}noise(g,w,h,2000,.12);});
const barkMat=new THREE.MeshStandardMaterial({map:texFromCanvas(barkC,true),normalMap:normalFromHeight(barkC,2),roughness:.9});
const leafC=canvasOf(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);
  for(let k=0;k<70;k++){const x=rand(20,236),y=rand(20,236),r=rand(10,20),a=rand(0,6.28);const hue=rand(78,108),l=rand(20,40);g.fillStyle=`hsl(${hue},${rand(35,55)}%,${l}%)`;g.save();g.translate(x,y);g.rotate(a);
    g.beginPath();for(let i=0;i<5;i++){const t=i/5*Math.PI*2;g.lineTo(Math.cos(t)*r,Math.sin(t)*r);g.lineTo(Math.cos(t+.63)*r*.45,Math.sin(t+.63)*r*.45);}g.closePath();g.fill();
    g.strokeStyle=`hsla(${hue},30%,${l+15}%,.6)`;g.lineWidth=1;g.beginPath();g.moveTo(0,0);g.lineTo(r*.8,0);g.stroke();g.restore();}
  const d=g.getImageData(0,0,w,h);for(let i=3;i<d.data.length;i+=4){const x=(i>>2)%w,y=(i>>2)/w|0;const r=Math.hypot(x-128,y-128)/128;if(r>.95)d.data[i]=0;}g.putImageData(d,0,0);});
const leafTex=texFromCanvas(leafC,false);
const leafMat=new THREE.MeshStandardMaterial({map:leafTex,alphaTest:.45,side:THREE.DoubleSide,roughness:.75,color:0xffffff});
const leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:leafTex,alphaTest:.45});
// --- 光晕贴图（假 bloom 补充 + 地面灯池）---
const glowTex=ctex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
const poolTex=ctex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,200,130,.8)');gr.addColorStop(.5,'rgba(255,180,110,.28)');gr.addColorStop(1,'rgba(255,170,100,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
const poolMat=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const manholeTex=ctex(128,128,(g)=>{g.clearRect(0,0,128,128);g.fillStyle='#2a2a2c';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.strokeStyle='#4a4a4c';g.lineWidth=4;for(let r=12;r<58;r+=10){g.beginPath();g.arc(64,64,r,0,7);g.stroke();}g.fillStyle='#555';g.font='bold 16px sans-serif';g.textAlign='center';g.fillText('污 水',64,70);});
const manholeMat=new THREE.MeshStandardMaterial({map:manholeTex,transparent:true,roughness:.4,metalness:.8,polygonOffset:true,polygonOffsetFactor:-1});
const concreteC=canvasOf(256,256,(g,w,h)=>{g.fillStyle='#9a9792';g.fillRect(0,0,w,h);noise(g,w,h,8000,.12,3);for(let k=0;k<10;k++){g.fillStyle='rgba(50,45,40,.08)';g.fillRect(rand(0,w),0,rand(4,20),h);}});
const concreteMat=new THREE.MeshStandardMaterial({map:texFromCanvas(concreteC,true),normalMap:normalFromHeight(concreteC,1.5),roughness:.9});
