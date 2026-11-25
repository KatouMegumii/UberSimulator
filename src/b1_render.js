
// ================= 渲染器 / 光照 / 环境 =================
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const DPR=Math.min(window.devicePixelRatio||1,1.5);
renderer.setPixelRatio(DPR);renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x9fb8cc,80,700);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.03,2000);
camera.rotation.order='YXZ';
const hemi=new THREE.HemisphereLight(0xcfdcec,0x4a4038,.45);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dc,2.2);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
{const c=sun.shadow.camera;c.left=-70;c.right=70;c.top=70;c.bottom=-70;c.near=10;c.far=600;}
sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
scene.add(sun);scene.add(sun.target);
const MAXANI=renderer.capabilities.getMaxAnisotropy();

// ---------- 天空 ----------
const skyU={top:{value:new THREE.Color(0x4f86c6)},hor:{value:new THREE.Color(0xcfe0ee)},bot:{value:new THREE.Color(0x8b8f94)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(0xfff2d0)},night:{value:0},time:{value:0}};
const skyMat=new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w*.9999;}`,
  fragmentShader:`uniform vec3 top,hor,bot,sunDir,sunCol;uniform float night,time;varying vec3 vD;
  float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.55)):mix(hor,bot,clamp(-y*4.,0.,1.));
   float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(s,900.)*14.+pow(s,12.)*.35)*(1.-night);
   vec3 md=normalize(-sunDir+vec3(.2,.3,0.));float m=max(dot(d,md),0.);c+=vec3(.9,.92,1.)*(smoothstep(.9994,.9996,m)*1.6+pow(m,60.)*.08)*night;
   if(y>.05&&night>.3){vec3 q=floor(d*420.);float st=h(q);if(st>.9985)c+=vec3(.7)*night*(.5+.5*sin(time*3.+st*90.))*smoothstep(.05,.3,y);}
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`});
const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat);sky.frustumCulled=false;scene.add(sky);
// 环境贴图：几个时段预烘焙，按时间切换
const pmrem=new THREE.PMREMGenerator(renderer);
function bakeEnv(top,hor,bot,sunDir,sunCol,night,cityGlow){
  const sc=new THREE.Scene();const m=skyMat.clone();m.uniforms=THREE.UniformsUtils.clone(skyU);
  m.uniforms.top.value.set(top);m.uniforms.hor.value.set(hor);m.uniforms.bot.value.set(bot);m.uniforms.sunDir.value.copy(sunDir);m.uniforms.sunCol.value.set(sunCol);m.uniforms.night.value=night;
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),m));
  // 城市灯光在环境里的反射：一圈暖色/冷色亮块
  if(cityGlow){for(let k=0;k<40;k++){const a=k/40*Math.PI*2,b=new THREE.Mesh(new THREE.PlaneGeometry(rand(4,12),rand(2,9)),new THREE.MeshBasicMaterial({color:pick([0xffb860,0xffd9a0,0x9fd0ff,0xff5fae,0x6fe8ff]),side:THREE.DoubleSide}));b.material.color.multiplyScalar(cityGlow*rand(.6,1.6));b.position.set(Math.cos(a)*60,rand(-6,10),Math.sin(a)*60);b.lookAt(0,0,0);sc.add(b);}}
  else{for(let k=0;k<26;k++){const a=k/26*Math.PI*2,b=new THREE.Mesh(new THREE.PlaneGeometry(rand(8,20),rand(10,30)),new THREE.MeshBasicMaterial({color:new THREE.Color(bot).multiplyScalar(rand(.6,1.1)),side:THREE.DoubleSide}));b.position.set(Math.cos(a)*60,rand(0,12),Math.sin(a)*60);b.lookAt(0,0,0);sc.add(b);}}
  const rt=pmrem.fromScene(sc,.02);return rt.texture;
}
const ENV={
  day:bakeEnv(0x4f86c6,0xd4e2ee,0x8a8780,new THREE.Vector3(.5,.8,.3),0xfff2d0,0,0),
  dusk:bakeEnv(0x2e3f6e,0xf0a070,0x5a4a44,new THREE.Vector3(.9,.08,.3),0xffa060,.2,.4),
  night:bakeEnv(0x050a16,0x1a2236,0x15151a,new THREE.Vector3(-.5,-.6,.2),0x000000,1,1),
};
scene.environment=ENV.day;

// ---------- 通用工具 ----------
const GEO={box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,20,14),cyl:new THREE.CylinderGeometry(1,1,1,20),plane:new THREE.PlaneGeometry(1,1)};
const _mc={};
function std(c,r=.8,m=0,extra){const k=c+'|'+r+'|'+m+(extra?JSON.stringify(extra):'');if(_mc[k])return _mc[k];const o=Object.assign({color:c,roughness:r,metalness:m},extra||{});return _mc[k]=new THREE.MeshStandardMaterial(o);}
const lam=c=>std(c,.85,0);
function bx(w,h,d,c,x,y,z,mat){const m=new THREE.Mesh(GEO.box,mat||std(c));m.scale.set(w,h,d);m.position.set(x,y,z);return m;}
function ctex(w,h,draw,rep,color=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=MAXANI;if(color)t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.userData.canvas=c;return t;}
// 由灰度高度图生成法线贴图
function normalFromHeight(src,strength=2,rep=true){
  const w=src.width,h=src.height,g=src.getContext('2d'),d=g.getImageData(0,0,w,h).data;
  const c=document.createElement('canvas');c.width=w;c.height=h;const o=c.getContext('2d'),img=o.createImageData(w,h),od=img.data;
  const H=(x,y)=>d[(((y+h)%h)*w+((x+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*strength,dy=(H(x,y+1)-H(x,y-1))*strength;const l=Math.hypot(dx,dy,1),i=(y*w+x)*4;od[i]=(-dx/l*.5+.5)*255;od[i+1]=(dy/l*.5+.5)*255;od[i+2]=(1/l*.5+.5)*255;od[i+3]=255;}
  o.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.anisotropy=MAXANI;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
function canvasOf(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
function texFromCanvas(c,rep,color=true){const t=new THREE.CanvasTexture(c);t.anisotropy=MAXANI;if(color)t.encoding=THREE.sRGBEncoding;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function noise(g,w,h,n,a,size=2){for(let k=0;k<n;k++){g.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${Math.random()*a})`;const s=Math.random()*size+1;g.fillRect(Math.random()*w,Math.random()*h,s,s);}}
// 合并几何（按材质批处理）
function mergeGeos(list){
  let nP=0,nI=0;for(const g of list){nP+=g.attributes.position.count;nI+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(nP*3),nor=new Float32Array(nP*3),uv=new Float32Array(nP*2),idx=new Uint32Array(nI);let po=0,io=0;
  for(const g of list){const c=g.attributes.position.count;pos.set(g.attributes.position.array,po*3);nor.set(g.attributes.normal.array,po*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,po*2);
    if(g.index){const a=g.index.array;for(let k=0;k<a.length;k++)idx[io+k]=a[k]+po;io+=a.length;}else{for(let k=0;k<c;k++)idx[io+k]=po+k;io+=c;}po+=c;}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.setIndex(new THREE.BufferAttribute(idx,1));m.computeBoundingSphere();m.computeBoundingBox();return m;
}
const BATCH=new Map();
function addB(mat,geo,cast=true){const k=mat.uuid+(cast?'c':'n');if(!BATCH.has(k))BATCH.set(k,{mat,cast,list:[]});BATCH.get(k).list.push(geo);}
// 按 100m 网格分块合并，便于视锥裁剪
function flushB(target){
  for(const{mat,cast,list}of BATCH.values()){const cells=new Map();
    for(const g of list){g.computeBoundingBox();const b=g.boundingBox,cx=Math.floor(((b.min.x+b.max.x)/2+400)/100),cz=Math.floor(((b.min.z+b.max.z)/2+400)/100),k=cx+','+cz;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(g);}
    for(const arr of cells.values())for(let k=0;k<arr.length;k+=3000){const m=new THREE.Mesh(mergeGeos(arr.slice(k,k+3000)),mat);m.castShadow=cast;m.receiveShadow=true;target.add(m);}
  }BATCH.clear();
}
function boxG(w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g;}
function planeG(w,h,x,y,z,ry){const g=new THREE.PlaneGeometry(w,h);if(ry)g.rotateY(ry);g.translate(x,y,z);return g;}
// 圆角盒（用于车身、手机、内饰件）
function rboxG(w,h,d,r,seg=3){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2-.001,h/2-.001);
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const b=Math.min(r*.6,d/2-.001);const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-b*2),bevelEnabled:true,bevelThickness:b,bevelSize:b*.9,bevelSegments:seg,curveSegments:seg*2});
  g.translate(0,0,-(d-b*2)/2);g.computeVertexNormals();return g;
}
// 侧面轮廓挤出（沿 x 方向），点为 [z,y]
function profileX(pts,width,mat,bevel=.01){const s=new THREE.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const g=new THREE.ExtrudeGeometry(s,{depth:width,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:12});
  g.rotateY(-Math.PI/2);g.translate(width/2,0,0);g.computeVertexNormals();return g;}

// ---------- 后期：Bloom + 暗角 + 颗粒 ----------
const POST={on:true};
{
  const p={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,type:THREE.HalfFloatType};
  POST.rtMain=new THREE.WebGLRenderTarget(1,1,p);POST.rtMain.samples=4;
  POST.rtA=new THREE.WebGLRenderTarget(1,1,p);POST.rtB=new THREE.WebGLRenderTarget(1,1,p);
  POST.rtA2=new THREE.WebGLRenderTarget(1,1,p);POST.rtB2=new THREE.WebGLRenderTarget(1,1,p);
  const vs=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
  POST.bright=new THREE.ShaderMaterial({uniforms:{t:{value:null},th:{value:1}},vertexShader:vs,fragmentShader:`uniform sampler2D t;uniform float th;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(th,th*1.8,l),1.);}`,depthTest:false});
  POST.blur=new THREE.ShaderMaterial({uniforms:{t:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:vs,fragmentShader:`uniform sampler2D t;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*.227;c+=texture2D(t,vUv+dir*1.385).rgb*.316;c+=texture2D(t,vUv-dir*1.385).rgb*.316;c+=texture2D(t,vUv+dir*3.231).rgb*.07;c+=texture2D(t,vUv-dir*3.231).rgb*.07;gl_FragColor=vec4(c,1.);}`,depthTest:false});
  POST.comp=new THREE.ShaderMaterial({uniforms:{t:{value:null},b1:{value:null},b2:{value:null},str:{value:.6},vig:{value:.35},tired:{value:0},time:{value:0},exp:{value:1}},vertexShader:vs,
    fragmentShader:`uniform sampler2D t,b1,b2;uniform float str,vig,tired,time,exp;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec2 uv=vUv;if(tired>0.){uv+=vec2(sin(time*1.3+uv.y*4.),cos(time*1.1))*.004*tired;}
     vec3 c=texture2D(t,uv).rgb;if(tired>.3){c=mix(c,(texture2D(t,uv+vec2(.006,0)).rgb+texture2D(t,uv-vec2(.006,0)).rgb)*.5,tired*.6);}
     c+=(texture2D(b1,uv).rgb*.6+texture2D(b2,uv).rgb*.9)*str;
     c*=exp;
     c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
     c=pow(clamp(c,0.,1.),vec3(1./2.2));
     float d=distance(vUv,vec2(.5));c*=1.-smoothstep(.35,.85,d)*(vig+tired*.6);
     c+=(h(vUv*1000.+time)-.5)*.025;
     gl_FragColor=vec4(c,1.);}`,depthTest:false});
  POST.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),POST.comp);POST.quad.frustumCulled=false;
  POST.scene=new THREE.Scene();POST.scene.add(POST.quad);POST.cam=new THREE.Camera();
  POST.resize=()=>{const w=Math.floor(innerWidth*DPR),h=Math.floor(innerHeight*DPR);POST.rtMain.setSize(w,h);POST.rtA.setSize(w>>2,h>>2);POST.rtB.setSize(w>>2,h>>2);POST.rtA2.setSize(w>>3,h>>3);POST.rtB2.setSize(w>>3,h>>3);};
  POST.resize();
}
function pass(mat,src,dst){POST.quad.material=mat;if(mat.uniforms.t)mat.uniforms.t.value=src;renderer.setRenderTarget(dst);renderer.render(POST.scene,POST.cam);}
function renderPost(sc,cam,opts){
  if(!POST.on){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.setRenderTarget(null);renderer.render(sc,cam);return;}
  renderer.toneMapping=THREE.NoToneMapping;const oe=renderer.outputEncoding;renderer.outputEncoding=THREE.LinearEncoding;
  renderer.setRenderTarget(POST.rtMain);renderer.render(sc,cam);
  POST.bright.uniforms.th.value=opts.th;pass(POST.bright,POST.rtMain.texture,POST.rtA);
  const w=POST.rtA.width,h=POST.rtA.height;
  POST.blur.uniforms.dir.value.set(1/w,0);pass(POST.blur,POST.rtA.texture,POST.rtB);POST.blur.uniforms.dir.value.set(0,1/h);pass(POST.blur,POST.rtB.texture,POST.rtA);
  POST.blur.uniforms.dir.value.set(2/w,0);pass(POST.blur,POST.rtA.texture,POST.rtB2);POST.blur.uniforms.dir.value.set(0,2/h);pass(POST.blur,POST.rtB2.texture,POST.rtA2);
  POST.blur.uniforms.dir.value.set(2/w,0);pass(POST.blur,POST.rtA2.texture,POST.rtB2);POST.blur.uniforms.dir.value.set(0,2/h);pass(POST.blur,POST.rtB2.texture,POST.rtA2);
  const u=POST.comp.uniforms;u.b1.value=POST.rtA.texture;u.b2.value=POST.rtA2.texture;u.str.value=opts.str;u.tired.value=opts.tired;u.time.value=performance.now()/1000;u.exp.value=opts.exp||1;
  pass(POST.comp,POST.rtMain.texture,null);
  renderer.outputEncoding=oe;
}
