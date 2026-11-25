'use strict';
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div id="loadErr">无法加载 Three.js，请检查网络。</div>');throw new Error('THREE missing');}
const AS=window.ASSETS||{hdr:{},img:{},gltf:{}};const HAS=k=>!!(AS.img[k+'_diff']);
// ================= 工具 =================
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function wpick(w){let s=0;for(const v of w)s+=v;let r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}return w.length-1;}
let _seed=20261124;
function srand(){_seed|=0;_seed=_seed+0x6D2B79F5|0;let t=Math.imul(_seed^_seed>>>15,1|_seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const sr=(a,b)=>a+srand()*(b-a);const spick=a=>a[Math.floor(srand()*a.length)];
const pad=n=>String(n).padStart(2,'0');
const fmt=m=>{m=((Math.floor(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60);};
const WD=['周一','周二','周三','周四','周五','周六','周日'];
const dayOf=t=>Math.floor(t/1440)+1;
const wdOf=t=>(4+Math.floor(t/1440))%7; // 第1天=周五
const dateStr=t=>`第${dayOf(t)}天 · ${WD[wdOf(t)]}`;
const whenStr=t=>{const d=dayOf(t)-dayOf(S.t);return (d===0?'今天':d===1?'明天':d===-1?'昨天':WD[wdOf(t)])+' '+fmt(t%1440);};

const SET={q:'mid',voice:false,post:true,cockpit:'model'};
