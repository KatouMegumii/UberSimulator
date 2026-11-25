
// ================= 生成城市 =================
const city=new THREE.Group();scene.add(city);
asphaltTex.repeat.set(2400/14,2400/14);asphaltN.repeat.copy(asphaltTex.repeat);asphaltR.repeat.copy(asphaltTex.repeat);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),roadMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;city.add(ground);
const SHOPS={res:['烟纸店','生煎馒头','水果店','美发','裁缝铺','五金交电','早点','大药房','福利彩票','老虎灶','菜场','修鞋配钥匙','粮油店','面包房'],
  com:['便利店','咖啡','奶茶','申城银行','大药房','眼镜','面包房','手机维修','健身房','房产中介','花店','火锅','书店','快餐','美甲','生鲜超市'],
  night:['足浴按摩','烧烤','LIVE HOUSE','清吧','KTV','便利店','夜宵','小龙虾','台球','精酿啤酒','烤串','24h药房','麻辣烫','沙县小吃']};
const FACE_R={'-z':Math.PI,'+z':0,'-x':-Math.PI/2,'+x':Math.PI/2};
const FACE_N={'-z':[0,-1],'+z':[0,1],'-x':[-1,0],'+x':[1,0]};
const RESERVE=[{i:0,j:3,face:'+x',a0:40,a1:60},{i:1,j:2,face:'+z',a0:-164,a1:-136},{i:4,j:2,face:'+x',a0:-64,a1:-36}];
function reserved(i,j,face,a0,a1){return RESERVE.some(r=>r.i===i&&r.j===j&&r.face===face&&a1>r.a0&&a0<r.a1);}
const TREES=[],LAMPS=[],ACS=[],BIKES=[],GLOWS=[],SIGNALS=[];
// 沿立面方向放置：along 为沿墙的偏移，out 为向外偏移
function fpos(face,fx,fz,along,out){const[nx,nz]=FACE_N[face];return nx?{x:fx+nx*out,z:fz+along}:{x:fx+along,z:fz+nz*out};}
function fbox(mat,face,fx,fz,along,out,y,wAlong,h,dOut,cast=true){const p=fpos(face,fx,fz,along,out);const[nx]=FACE_N[face];addB(mat,nx?boxG(dOut,h,wAlong,p.x,y,p.z):boxG(wAlong,h,dOut,p.x,y,p.z),cast);}
function fplane(mat,face,fx,fz,along,out,y,w,h){const p=fpos(face,fx,fz,along,out);addB(mat,planeG(w,h,p.x,y,p.z,FACE_R[face]),false);}
const frameMat=std('#2c2e31',.5,.6),awnMats=['#7a2626','#2b4f7a','#2f5a35','#4a4a4a','#8a5a1e','#6b6b6b'].map(c=>std(c,.7,0));
function addStorefront(face,fx,fz,w,zone,txt){
  const sw=w-1.2,closed=srand()<(zone==='com'?.12:.22);
  fbox(frameMat,face,fx,fz,0,.25,4.1,w,.5,.5);              // 门头框
  fbox(frameMat,face,fx,fz,-w/2+.25,.25,2,.3,4,.5);fbox(frameMat,face,fx,fz,w/2-.25,.25,2,.3,4,.5);
  if(closed)fplane(shutterMat,face,fx,fz,0,.08,1.9,sw,3.6);
  else{fplane(INT_MATS[srand()*4|0],face,fx,fz,0,.06,1.8,sw,3.4);
    const gm=std('#9fb4c0',.05,.9,{transparent:true,opacity:.22});fplane(gm,face,fx,fz,0,.42,1.8,sw,3.4);
    fbox(frameMat,face,fx,fz,0,.42,1.8,.08,3.4,.06);
    GLOWS.push({...fpos(face,fx,fz,0,1.2),y:2.2,c:0xffd8a0,s:3.5});}
  txt=txt||spick(SHOPS[zone]);
  const style=zone==='night'?(srand()<.6?'neon':'dark'):spick(['red','green','blue','yellow','white','dark','orange']);
  fplane(signMat(txt,style),face,fx,fz,0,.52,4.75,Math.min(sw,8),Math.min(sw,8)/4.2);
  if(srand()<.55){const[nx,nz]=FACE_N[face];const L=sw,D=1.4;const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(D,-.45);sh.lineTo(D,-.6);sh.lineTo(0,-.08);
    const g=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:false});g.translate(0,0,-L/2);g.rotateY(FACE_R[face]-Math.PI/2);const p=fpos(face,fx,fz,0,.5);g.translate(p.x,3.85,p.z);addB(spick(awnMats),g);}
  if(zone!=='com'&&srand()<.4){const p=fpos(face,fx,fz,sr(-w/3,w/3),1.1);BIKES.push({x:p.x,z:p.z,ry:FACE_R[face],n:randi(2,5),face});}
}
function addAC(face,fx,fz,fw,h){const[nx,nz]=FACE_N[face];for(let y=6.2;y<Math.min(h-1,40);y+=3)for(let a=-fw/2+2;a<fw/2-1.5;a+=3)if(srand()<.32){const p=fpos(face,fx,fz,a+.9,.2);ACS.push({x:p.x,y:y-1.4,z:p.z,ry:FACE_R[face]});}}
function addBuilding(zone,face,x0,x1,z0,z1,h){
  const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2,[nx,nz]=FACE_N[face];
  let kind;if(zone==='res')kind=h<14?'brick':h<34?'plaster':'tile';else if(zone==='com')kind=h>34?'glass':srand()<.5?'tile':'plaster';else kind=h<14?(srand()<.5?'brick':'dark'):'plaster';
  const tints={brick:['#ffffff','#e8d8d0','#d8cfc8'],plaster:['#ffffff','#f0e4d0','#e0e4e8','#f4dcc8'],tile:['#ffffff','#f0f0ea','#e6e0d6'],glass:['#ffffff','#d0e0ee','#e0e8e0'],dark:['#ffffff','#d8d0d8']}[kind];
  addB(bmat(kind,spick(tints)),bldGeo(w,h,d,cx,h/2,cz));
  const fx=nx?(nx>0?x1:x0):cx,fz=nz?(nz>0?z1:z0):cz,fw=nx?d:w;
  // 檐口/腰线
  fbox(concreteMat,face,fx,fz,0,.12,h-.2,fw+.2,.4,.3);
  if(kind!=='glass')fbox(concreteMat,face,fx,fz,0,.15,4.6,fw,.25,.35);
  if(kind==='brick'){ // 坡屋顶
    const along=w>=d?'x':'z',L=Math.max(w,d)+.8,B=Math.min(w,d)+1;const sh=new THREE.Shape();sh.moveTo(-B/2,0);sh.lineTo(B/2,0);sh.lineTo(0,2.6);sh.lineTo(-B/2,0);
    const rg=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:false});const uv=rg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/4,uv.getY(k)/4);rg.translate(0,0,-L/2);if(along==='x')rg.rotateY(Math.PI/2);rg.translate(cx,h,cz);addB(roofMat,rg);
    if(srand()<.5){ // 晾衣杆
      const py=h*.62;for(let k=0;k<2;k++){const a=(k-.5)*fw*.4;fbox(std('#888',.4,.8),face,fx,fz,a,.8,py,.04,.04,1.6);
        for(let q=0;q<4;q++){const cl=spick(['#c9483f','#f0f0f0','#4f7bc9','#e8c13a','#5faf63','#b87ac9','#333']);fbox(std(cl,.95),face,fx,fz,a+sr(-.2,.2),.3+q*.35,py-.4,.4,sr(.5,.8),.03,false);}}}
  }else{
    if(srand()<.7)addB(std('#8d8c88',.7,.3),boxG(sr(2,4),sr(1.5,3),sr(2,4),cx+sr(-w/4,w/4),h+1,cz+sr(-d/4,d/4)));
    if(kind==='plaster'&&srand()<.6)for(let y=7.5;y<h-2;y+=3)for(let a=-fw/2+2.5;a<fw/2-2;a+=6)if(srand()<.6){fbox(concreteMat,face,fx,fz,a,.6,y,2.6,.15,1.2);fbox(std('#d8d8d4',.6,.3),face,fx,fz,a,1.15,y+.55,2.6,1,.08);}
    if(zone==='com'&&h>44&&srand()<.35){const b=spick(['顺路出行','长江保险','好邻居超市','申城银行','云上咖啡','浦江证券']);fplane(signMat(b,'white'),face,fx,fz,0,.25,h-3.5,Math.min(fw-2,16),3.6);}
  }
  if(kind!=='glass')addAC(face,fx,fz,fw,h);
  if(zone==='night'&&srand()<.55){const t=spick(['酒','按摩','KTV','夜宵','烤串','台球','足浴']);const p=fpos(face,fx,fz,sr(-fw/3,fw/3),.9);addB(signMat(t,'neon',true),planeG(1.2,4.8,p.x,sr(6.5,Math.max(7,h-3)),p.z,FACE_R[face]+Math.PI/2),false);}
  return{fx,fz,fw,kind};
}
function sidewalk(cx,cz,w,d){
  const g=new THREE.BoxGeometry(w,.15,d),uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w/4,uv.getY(k)*d/4);g.translate(cx,.075,cz);addB(paveMat,g,false);
  for(const[ax,s]of[['x',-1],['x',1],['z',-1],['z',1]]){const gg=ax==='x'?new THREE.BoxGeometry(w+.3,.17,.3):new THREE.BoxGeometry(.3,.17,d+.3);const u=gg.attributes.uv;for(let k=0;k<u.count;k++)u.setXY(k,u.getX(k)*(ax==='x'?w:d)/4,u.getY(k));gg.translate(ax==='x'?cx:cx+s*(w/2),.085,ax==='x'?cz+s*(d/2):cz);addB(curbMat,gg,false);}
}
function genBlock(i,j){
  const cx=-250+100*i,cz=-250+100*j,zone=i<2?'res':i<4?'com':'night';
  sidewalk(cx,cz,86,86);
  const D=zone==='res'?14:zone==='com'?20:16,E=38.5;
  const rows=[{face:'-z',a0:cx-E,a1:cx+E},{face:'+z',a0:cx-E,a1:cx+E},{face:'-x',a0:cz-E+D,a1:cz+E-D},{face:'+x',a0:cz-E+D,a1:cz+E-D}];
  for(const row of rows){let a=row.a0;
    while(a<row.a1-5){let w=sr(9,22);if(a+w>row.a1-5)w=row.a1-a;if(w<6)break;
      if(!reserved(i,j,row.face,a,a+w)){
        const d=D*sr(.8,1),r=srand();let h;
        if(zone==='res')h=r<.7?sr(7.5,11):r<.88?sr(18,30):sr(48,80);else if(zone==='com')h=r<.3?sr(14,24):r<.75?sr(26,50):sr(55,95);else h=r<.6?sr(8,13):sr(15,24);
        let x0,x1,z0,z1;
        if(row.face==='-z'){x0=a;x1=a+w;z0=cz-E;z1=cz-E+d;}else if(row.face==='+z'){x0=a;x1=a+w;z0=cz+E-d;z1=cz+E;}else if(row.face==='-x'){z0=a;z1=a+w;x0=cx-E;x1=cx-E+d;}else{z0=a;z1=a+w;x0=cx+E-d;x1=cx+E;}
        const b=addBuilding(zone,row.face,x0,x1,z0,z1,h);
        if(b.kind!=='glass'||srand()<.5)addStorefront(row.face,b.fx,b.fz,Math.min(b.fw,sr(6,10)),zone);
      }
      a+=w+(srand()<.15?sr(1.5,3.5):0);}
  }
  const edges=[['x',cz-41,-1],['x',cz+41,1],['z',cx-41,-1],['z',cx+41,1]];
  for(const[ax,fix,s]of edges){const c0=ax==='x'?cx:cz;
    for(let a=-36;a<=36;a+=11){const x=ax==='x'?c0+a:fix,z=ax==='x'?fix:c0+a;if(Math.abs(z+200)<12)continue;
      let skip=false;for(const k in PLACES)if(Math.hypot(PLACES[k].spot.x-x,PLACES[k].spot.z-z)<10)skip=true;
      if(!skip&&(zone!=='night'||srand()<.35))TREES.push({x,z,s:sr(.85,1.2),r:srand()*6.28});}
    for(let a=-30;a<=30;a+=30){const x=ax==='x'?c0+a+5:fix+s*1.3,z=ax==='x'?fix+s*1.3:c0+a+5;LAMPS.push({x,z,ax,s});}
    if(srand()<.5){const x=ax==='x'?c0+sr(-30,30):fix+s*-.6,z=ax==='x'?fix+s*-.6:c0+sr(-30,30);addB(std('#2f5f3a',.6,.3),boxG(.5,.9,.5,x,.6,z));}
  }
}
for(let i=0;i<6;i++)for(let j=0;j<6;j++)genBlock(i,j);
// 外圈
sidewalk(-330,0,46,720);sidewalk(0,-330,620,46);sidewalk(0,330,620,46);
for(let k=-330;k<=330;k+=sr(14,24)){const h1=sr(12,50),h2=sr(14,60),h3=sr(12,50);
  addB(bmat(h1<30?'plaster':'tile','#ffffff'),bldGeo(16,h1,18,-325,h1/2,k));
  if(Math.abs(k)<320){addB(bmat(h2>40?'glass':'tile','#ffffff'),bldGeo(18,h2,16,k,h2/2,-325));addB(bmat('plaster','#f0e4d0'),bldGeo(18,h3,16,k,h3/2,325));}}
// 滨江
sidewalk(314,0,14,720);
for(let z=-340;z<340;z+=2.5)addB(std('#3f4144',.4,.8),boxG(.06,1.1,.06,320.6,.7,z));
addB(std('#3f4144',.4,.8),boxG(.08,.08,700,320.6,1.25,0));addB(concreteMat,boxG(4,3,2400,322.8,-1.4,0));
const waterN=normalFromHeight(canvasOf(256,256,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let k=0;k<400;k++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.12)`;g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(6,30),rand(2,6),0,0,7);g.fill();}}),2);waterN.repeat.set(40,200);
const water=new THREE.Mesh(new THREE.PlaneGeometry(400,2400),new THREE.MeshStandardMaterial({color:0x1d2d33,roughness:.12,metalness:.6,normalMap:waterN,normalScale:new THREE.Vector2(.5,.5)}));
water.rotation.x=-Math.PI/2;water.position.set(525,-1.3,0);city.add(water);
for(let k=0;k<60;k++){const h=sr(40,240),x=sr(730,900),z=sr(-700,700);addB(bmat(h>80?'glass':'tile','#ffffff'),bldGeo(sr(20,44),h,sr(20,44),x,h/2,z,16));}
const towerGlow=new THREE.MeshStandardMaterial({color:0xc85a8a,emissive:0xff4f9a,emissiveIntensity:0,roughness:.3,metalness:.4});
city.add(bx(5,280,5,'#c9c6c0',760,140,120));for(const[y,r]of[[95,17],[200,11],[262,5]]){const s=new THREE.Mesh(GEO.sph,towerGlow);s.scale.setScalar(r);s.position.set(760,y,120);city.add(s);}
for(const a of[0,2.1,4.2]){const g=new THREE.Mesh(GEO.cyl,std('#c9c6c0',.5,.3));g.scale.set(2,110,2);g.position.set(760+Math.cos(a)*12,52,120+Math.sin(a)*12);g.rotation.set(Math.sin(a)*.12,0,-Math.cos(a)*.12);city.add(g);}
// 大桥
addB(concreteMat,boxG(400,1.8,22,530,9,-150));
for(const x of[420,640]){addB(concreteMat,boxG(4,56,4,x,28,-161));addB(concreteMat,boxG(4,56,4,x,28,-139));addB(concreteMat,boxG(4,3,26,x,55,-150));}
const bridgeLights=new THREE.MeshBasicMaterial({color:0xffd27a});
addB(bridgeLights,boxG(400,.25,.25,530,10.2,-161.2),false);addB(bridgeLights,boxG(400,.25,.25,530,10.2,-138.8),false);
// 高架（延西路上方）
addB(concreteMat,boxG(700,1.6,19,0,9.6,-200));addB(concreteMat,boxG(700,1.3,.35,0,11,-209.3));addB(concreteMat,boxG(700,1.3,.35,0,11,-190.7));
for(const p of PILLARS){const g=new THREE.CylinderGeometry(p.r,p.r*1.1,9,20);g.translate(p.x,4.5,p.z);addB(concreteMat,g);addB(concreteMat,boxG(3.2,1.4,14,p.x,8.4,p.z));}
const elevLight=new THREE.MeshBasicMaterial({color:0x6fd0ff});
addB(elevLight,boxG(700,.12,.12,0,8.75,-209),false);addB(elevLight,boxG(700,.12,.12,0,8.75,-191),false);
// 路面标线
const lineY=std('#d8ad2e',.6,0),lineW=std('#e0e0dc',.6,0);
for(let l=0;l<7;l++)for(let s=0;s<6;s++){
  const a0=R[s]+HW,a1=R[s+1]-HW,mid=(a0+a1)/2,L=a1-a0,c=R[l];
  addB(lineY,boxG(L,.02,.13,mid,.012,c-.16),false);addB(lineY,boxG(L,.02,.13,mid,.012,c+.16),false);addB(lineY,boxG(.13,.02,L,c-.16,.012,mid),false);addB(lineY,boxG(.13,.02,L,c+.16,.012,mid),false);
  for(let a=a0+6;a<a1-4;a+=9){addB(lineW,boxG(3,.02,.12,a,.012,c-3.5),false);addB(lineW,boxG(3,.02,.12,a,.012,c+3.5),false);addB(lineW,boxG(.12,.02,3,c-3.5,.012,a),false);addB(lineW,boxG(.12,.02,3,c+3.5,.012,a),false);}
  for(const e of[a0+2.2,a1-2.2])for(let q=-6.2;q<=6.2;q+=1.1){addB(lineW,boxG(3.2,.02,.5,e,.013,c+q),false);addB(lineW,boxG(.5,.02,3.2,c+q,.013,e),false);}
  addB(lineW,boxG(.35,.02,6.6,a0+4.3,.013,c+3.4),false);addB(lineW,boxG(.35,.02,6.6,a1-4.3,.013,c-3.4),false);
  addB(lineW,boxG(6.6,.02,.35,c-3.4,.013,a0+4.3),false);addB(lineW,boxG(6.6,.02,.35,c+3.4,.013,a1-4.3),false);
  if(srand()<.6){const g=new THREE.CircleGeometry(.4,20);g.rotateX(-Math.PI/2);g.translate(mid+sr(-30,30),.014,c+sr(-5,5));addB(manholeMat,g,false);}
  if(srand()<.6){const g=new THREE.CircleGeometry(.4,20);g.rotateX(-Math.PI/2);g.translate(c+sr(-5,5),.014,mid+sr(-30,30));addB(manholeMat,g,false);}
}
// 特殊建筑：永安里弄堂口（家）
const stoneMat=new THREE.MeshStandardMaterial({map:texFromCanvas(canvasOf(256,256,(g,w,h)=>{g.fillStyle='#8f8576';g.fillRect(0,0,w,h);noise(g,w,h,6000,.15,3);g.strokeStyle='rgba(50,45,40,.35)';for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}),true),roughness:.85});
{const x=-211.5;
  addB(stoneMat,boxG(1.4,7,1.6,x,3.5,42.5));addB(stoneMat,boxG(1.4,7,1.6,x,3.5,57.5));addB(stoneMat,boxG(1.8,1.8,17,x,7.6,50));
  addB(stoneMat,boxG(1.2,1.4,4,x,9.2,50));addB(signMat('永 安 里','white'),planeG(5.6,1.3,x+.92,7.6,50,Math.PI/2),false);
  addB(std('#6a6560',.9),boxG(30,.04,12,x-15,.17,50),false);
  for(let k=0;k<3;k++){addB(bmat('brick','#ffffff'),bldGeo(9,8.5,5,x-6-k*10,4.25,41));addB(bmat('brick','#e8d8d0'),bldGeo(9,8.5,5,x-6-k*10,4.25,59));}
  GLOWS.push({x:x+.8,y:6.2,z:50,c:0xffd9a0,s:2});addB(new THREE.MeshBasicMaterial({color:0xffe0b0}),boxG(.25,.25,.25,x+.8,6.2,50),false);
}
// 老陈面馆
{const z1=-11;
  addB(bmat('plaster','#f0e4d0'),bldGeo(24,8,14,-150,4,z1-7));
  const sh=new THREE.Shape();sh.moveTo(-7.5,0);sh.lineTo(7.5,0);sh.lineTo(0,2.6);sh.lineTo(-7.5,0);const rg=new THREE.ExtrudeGeometry(sh,{depth:24.8,bevelEnabled:false});const uv=rg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/4,uv.getY(k)/4);rg.translate(0,0,-12.4);rg.rotateY(Math.PI/2);rg.translate(-150,8,z1-7);addB(roofMat,rg);
  const intM=new THREE.MeshStandardMaterial({map:INT_TEX[0],emissive:0xffffff,emissiveMap:INT_TEX[0],emissiveIntensity:.9,roughness:.2});
  addB(intM,planeG(13,3.2,-150,1.8,z1+.06,0),false);
  addStorefront('+z',-150,z1,14.5,'res','老陈面馆');
  addB(signMat('葱油拌面 · 大排面 · 小馄饨','white'),planeG(5,1.2,-156.5,2.6,z1+.5,0),false);
  GLOWS.push({x:-150,y:2.2,z:z1+1.5,c:0xffc070,s:6});
}
// 退潮酒吧
{const x1=189,z=-50;
  addB(bmat('dark','#ffffff'),bldGeo(16,12,24,x1-8,6,z));
  addB(new THREE.MeshStandardMaterial({color:0x221133,emissive:0x8a4fff,emissiveIntensity:1.2}),planeG(10,2.8,x1+.07,1.6,z,Math.PI/2),false);
  addB(signMat('退潮 LOW TIDE','neon'),planeG(10,2.4,x1+.2,4.6,z,Math.PI/2),false);
  addB(signMat('酒','neon',true),planeG(1.3,5.2,x1+.7,8,z-10,Math.PI),false);
  GLOWS.push({x:x1+1.5,y:2.2,z,c:0x9a6fff,s:6});
}
// 外环指示牌
addB(std('#555',.4,.8),boxG(.4,7,.4,-293,3.5,210.5));addB(std('#555',.4,.8),boxG(.4,7,.4,-293,3.5,189.5));
addB(signMat('外环 → 虹桥机场','green'),planeG(14,3.5,-292.7,6.5,200,Math.PI/2),false);
flushB(city);
