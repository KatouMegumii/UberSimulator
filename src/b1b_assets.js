
// ================= 外部资源：HDR 天空 / 照片贴图 / glTF =================
const BG={},HDRI={};
function hdrInfo(t){
  const im=t.image,w=im.width,h=im.height,d=im.data,half=d instanceof Uint16Array,ch=Math.round(d.length/(w*h));
  const get=i=>half?THREE.DataUtils.fromHalfFloat(d[i]):d[i];
  let r=0,g=0,b=0,n=0;
  for(let y=Math.floor(h*.46);y<h*.5;y++)for(let x=0;x<w;x+=3){const i=(y*w+x)*ch;r+=get(i);g+=get(i+1);b+=get(i+2);n++;}
  let best=0,bi=0;for(let y=0;y<h*.5;y+=2)for(let x=0;x<w;x+=2){const i=(y*w+x)*ch,l=get(i)+get(i+1)+get(i+2);if(l>best){best=l;bi=y*w+x;}}
  const px=bi%w,py=Math.floor(bi/w),u=(px+.5)/w,v=1-(py+.5)/h,lat=(v-.5)*Math.PI,phi=(u-.5)*2*Math.PI;
  return{fog:new THREE.Color(r/n,g/n,b/n),sun:new THREE.Vector3(Math.cos(lat)*Math.cos(phi),Math.sin(lat),Math.cos(lat)*Math.sin(phi)).normalize(),peak:best/3};
}
const ENV0=Object.assign({},ENV);
function clampHDR(t,mx,ground){const im=t.image,d=im.data,half=d instanceof Uint16Array,W=im.width,H=im.height,ch=Math.round(d.length/(W*H));const g=half?THREE.DataUtils.fromHalfFloat:(v=>v),s=half?THREE.DataUtils.toHalfFloat:(v=>v);
  for(let y=0;y<H;y++){const below=y>H/2;const f=below?Math.max(.12,.5-(y-H/2)/(H/2)*.6):1;for(let x=0;x<W;x++){const i=(y*W+x)*ch;for(let c=0;c<3;c++){let v=g(d[i+c]);if(v>mx)v=mx;if(ground&&below){const base=[.34,.3,.26][c]*.55;v=v*f*.35+base*(1-f*.35);}d[i+c]=s(v);}}}t.needsUpdate=true;}
for(const k of['day','dusk','night']){const t=AS.hdr[k];if(!t)continue;t.mapping=THREE.EquirectangularReflectionMapping;HDRI[k]=hdrInfo(t);if(k!=='night')clampHDR(t,k==='day'?7:5,true);BG[k]=t;ENV[k]=pmrem.fromEquirectangular(t).texture;}
const USE_HDR=!!BG.day;if(USE_HDR)sky.visible=false;
// 照片贴图
function asTex(key,rx,ry,color){const im=AS.img[key];if(!im)return null;const t=new THREE.Texture(im);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=MAXANI;if(color)t.encoding=THREE.sRGBEncoding;t.repeat.set(rx,ry??rx);t.needsUpdate=true;return t;}
function pbr(key,rx,ry){const map=asTex(key+'_diff',rx,ry,true);if(!map)return null;return{map,normalMap:asTex(key+'_nor',rx,ry),roughnessMap:asTex(key+'_rough',rx,ry)};}
function applyPbr(mat,key,rx,ry,extra){const p=pbr(key,rx,ry);if(!p)return false;Object.assign(mat,p,{roughness:1,metalness:0},extra||{});mat.color&&mat.color.set(0xffffff);mat.needsUpdate=true;return true;}
// glTF → 可实例化的（几何, 材质）列表，变换已烘焙
function gltfParts(key,filter){const g=AS.gltf[key];if(!g)return null;const root=g.scene;root.updateMatrixWorld(true);const out=[];
  root.traverse(o=>{if(o.isMesh&&(!filter||filter(o))){const geo=deinter(o.geometry.clone());geo.applyMatrix4(o.matrixWorld);out.push({geo,mat:o.material,name:o.name});}});return out;}
function deinter(g){for(const k in g.attributes){const a=g.attributes[k];if(a.isInterleavedBufferAttribute||!(a.array instanceof Float32Array)){const n=a.count,s=a.itemSize,arr=new Float32Array(n*s);for(let i=0;i<n;i++){arr[i*s]=a.getX(i);if(s>1)arr[i*s+1]=a.getY(i);if(s>2)arr[i*s+2]=a.getZ(i);if(s>3)arr[i*s+3]=a.getW(i);}g.setAttribute(k,new THREE.BufferAttribute(arr,s,false));}}return g;}
function instParts(parts,list,parent,cast=true,cls){ // list: [{x,y,z,ry,sx,sy,sz}]
  if(!parts||!list.length)return;const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),P=new THREE.Vector3(),Sc=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
  for(const p of parts){const m=new THREE.InstancedMesh(p.geo,p.mat,list.length);m.userData.prop=cls||1;list.forEach((t,i)=>{M.compose(P.set(t.x,t.y||0,t.z),Q.setFromAxisAngle(Y,t.ry||0),Sc.set(t.sx||1,t.sy||t.sx||1,t.sz||t.sx||1));m.setMatrixAt(i,M);});m.castShadow=cast;m.receiveShadow=true;parent.add(m);}
}
