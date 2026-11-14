const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const {execSync}=require('child_process');
const DIR=__dirname, OUT='/home/user/timo-orders/生成/官方line/圖文選單';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

const W=2500,H=1686,CW=833,CH=843,WIDE=1667; // LINE 大版面：3 欄 2 列
const WEEKLY={name:'雪花酥',photo:'snow',spec:'850g／包',price:'200元'};

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#4E463F;--line:#5A5049;--taupe:#7D726B;--rose:#B87880;--gold:#BFA571;--cream:#FCF9F5}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"Noto Serif TC",serif;color:var(--ink);background:var(--cream)}
.menu{position:relative;width:${W}px;height:${H}px;background:var(--cream)}
/* 全版共用的淡紙紋，讓六格看起來是同一塊材質 */
.grain{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(118deg,rgba(120,105,95,.045) 0 2px,transparent 2px 9px),
             radial-gradient(130% 95% at 50% 0%,rgba(255,255,255,.65),transparent 62%),
             radial-gradient(120% 90% at 50% 100%,rgba(176,152,140,.14),transparent 58%)}
.cell{position:absolute;overflow:hidden}
.photo{position:absolute;inset:0}
.photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.5)}
.photo::after{content:"";position:absolute;inset:0;background:rgba(252,249,245,.78)}
.mid{position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:26px}
.title{font-weight:900;line-height:1.06;white-space:nowrap;
  text-shadow:0 2px 20px rgba(252,249,245,.95),0 0 44px rgba(252,249,245,.92)}
.eyebrow{font-size:60px;font-weight:700;letter-spacing:.34em;text-indent:.34em;color:var(--rose)}
/* 內部分線：深色、夠粗，縮到手機上才看得見 */
.div{position:absolute;z-index:4;background:var(--line);border-radius:6px}
`;
const leaf=(w,c)=>`<svg width="${w}" height="${w*0.26}" viewBox="0 0 200 52" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round">
<path d="M100 40 C100 26,100 18,100 10"/>
<path d="M100 20 C84 20,72 14,62 6 C76 4,90 10,100 20Z" fill="${c}" fill-opacity=".3"/>
<path d="M100 20 C116 20,128 14,138 6 C124 4,110 10,100 20Z" fill="${c}" fill-opacity=".3"/>
<path d="M100 32 C88 32,78 28,70 22 C82 20,93 25,100 32Z" fill="${c}" fill-opacity=".3"/>
<path d="M100 32 C112 32,122 28,130 22 C118 20,107 25,100 32Z" fill="${c}" fill-opacity=".3"/>
<path d="M26 44 C46 44,64 44,84 44"/><path d="M116 44 C136 44,154 44,174 44"/>
<circle cx="100" cy="44" r="4.4" fill="${c}" stroke="none"/></svg>`;

const sz=t=>{const n=[...t].length;return n<=2?250:n===3?200:162};
const plain=(t,img)=>`<div class="cell" style="left:var(--x);top:var(--y);width:var(--w);height:var(--h)">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid">${leaf(200,'var(--gold)')}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.05em;text-indent:.05em">${t}</div>
    <div style="width:160px;height:3px;background:var(--gold);opacity:.85"></div>
  </div></div>`;

const cell=(t,img,x,y,w,h)=>plain(t,img).replace('var(--x)',x+'px').replace('var(--y)',y+'px')
  .replace('var(--w)',w+'px').replace('var(--h)',h+'px');

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(252,249,245,0),var(--cream) 88%)"></div>
   <div class="mid"><div class="title" style="font-size:200px;letter-spacing:.04em;text-indent:.04em">${WEEKLY.name}</div></div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:24px">
   <div class="eyebrow">每週特賞</div>${leaf(190,'var(--gold)')}
   <div style="font-size:90px;font-weight:700;letter-spacing:.04em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:205px;font-weight:900;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const T=10, M=62;                      // 分線粗細、兩端內縮
const html=`<style>${CSS}</style><div class="menu">
${weekly(0,0,WIDE,CH)}
${cell('節日禮盒',b64('gift'),WIDE,0,CW,CH)}
${cell('蛋糕',b64('cake'),0,CH,CW,CH)}
${cell('訂購須知',null,CW,CH,W-WIDE+ (WIDE-CW) - (W-WIDE-CW) ,CH).replace(/width:\d+px/,'width:'+(WIDE-CW)+'px')}
${cell('聯絡我們',null,WIDE,CH,CW,CH)}
<div class="div" style="left:${M}px;top:${CH-T/2}px;width:${W-M*2}px;height:${T}px"></div>
<div class="div" style="left:${WIDE-T/2}px;top:${M}px;width:${T}px;height:${CH-M*2}px"></div>
<div class="div" style="left:${CW-T/2}px;top:${CH+M}px;width:${T}px;height:${CH-M*2}px"></div>
<div class="div" style="left:${WIDE-T/2}px;top:${CH+M}px;width:${T}px;height:${CH-M*2}px"></div>
<div class="grain"></div></div>`;

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
 const p=await ctx.newPage();
 await p.setContent(html,{waitUntil:'load'});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(900);
 const over=await p.evaluate(()=>{const r=[];document.querySelectorAll('.title').forEach(e=>{
   const c=e.closest('.cell').getBoundingClientRect(),b=e.getBoundingClientRect();
   if(b.left<c.left+30||b.right>c.right-30)r.push(e.textContent);});return r;});
 if(over.length)console.log('⚠️ 文字太寬：',over.join('、'));
 const full=path.join(OUT,'_組合預覽_2500x1686.png');
 await p.screenshot({path:full});
 await b.close();
 // 從整張切出五塊，確保背景與分線完全接得起來
 const cuts=[['1-1_1-2_每週特賞_雪花酥.png',WIDE,CH,0,0],['1-3_節日禮盒.png',W-WIDE,CH,WIDE,0],
   ['2-1_蛋糕.png',CW,CH,0,CH],['2-2_訂購須知.png',WIDE-CW,CH,CW,CH],['2-3_聯絡我們.png',W-WIDE,CH,WIDE,CH]];
 for(const [f,w,h,x,y] of cuts){
   execSync(`convert ${JSON.stringify(full)} -crop ${w}x${h}+${x}+${y} +repage ${JSON.stringify(path.join(OUT,f))}`);
   console.log('✅',f,w+'×'+h);
 }
})();
