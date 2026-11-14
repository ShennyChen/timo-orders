const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const {execSync}=require('child_process');
const DIR=__dirname, OUT='/home/user/timo-orders/生成/官方line/圖文選單';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

const W=2500,H=1686,CW=833,CH=843,WIDE=1667;   // LINE 大版面：3 欄 2 列
const WEEKLY={name:'雪花酥',photo:'snow',spec:'850g／包',price:'200元'};

/* ── 巴洛克捲葉紋 ───────────────────────────────────────────
   取自 logo 兩側的裝飾語彙：中央棕櫚葉、飽滿尖葉、外側渦卷。
   長分線用繁版，短的直分線用簡版，格內飾紋用金色簡版。
   直向不是把橫向的轉 90 度（那樣佔位框不會跟著轉，渦卷會跑出線外），
   而是在 SVG 內部旋轉內容並交換 viewBox 與寬高。            */
const _wing=(c,long)=>`
 <path d="M254 60 C232 54 208 42 182 22 C186 44 200 58 224 64 C238 67 250 65 254 60 Z"/>
 <path d="M254 60 C232 66 208 78 182 98 C186 76 200 62 224 56 C238 53 250 55 254 60 Z"/>
 ${long?`
 <path d="M182 60 C166 60 152 60 138 60" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
 <path d="M138 60 C110 60 92 46 92 27 C92 12 109 6 118 19 C126 31 112 45 98 38" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
 <path d="M138 60 C127 80 108 94 82 101 C96 79 115 65 138 60 Z"/>
 <circle cx="58" cy="60" r="7.5"/>`:`
 <path d="M182 60 C170 60 160 60 150 60" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
 <circle cx="132" cy="60" r="8"/>`}`;

function ORN(c,{long=true,vert=false,scale=1}={}){
  const vx=long?0:106, vw=long?560:348, vh=120;
  const body=`<path d="M280 16 C294 38 302 52 302 60 C302 68 294 82 280 104 C266 82 258 68 258 60 C258 52 266 38 280 16 Z"/>
   ${_wing(c,long)}<g transform="translate(560,0) scale(-1,1)">${_wing(c,long)}</g>`;
  const w=(long?560:348)*0.54*scale, h=120*0.54*scale;
  if(!vert) return `<svg width="${w}" height="${h}" viewBox="${vx} 0 ${vw} ${vh}" fill="${c}" style="flex:0 0 auto">${body}</svg>`;
  const cx=vx+vw/2, cy=vh/2;
  return `<svg width="${h}" height="${w}" viewBox="${cx-vh/2} ${cy-vw/2} ${vh} ${vw}" fill="${c}" style="flex:0 0 auto">
    <g transform="rotate(90 ${cx} ${cy})">${body}</g></svg>`;
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#4E463F;--line:#5A5049;--taupe:#7D726B;--rose:#A8646D;--gold:#BFA571;--cream:#FCF9F5}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"Noto Serif TC",serif;color:var(--ink);background:var(--cream)}
.menu{position:relative;width:${W}px;height:${H}px;background:var(--cream)}
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
.eyebrow{font-size:88px;font-weight:900;letter-spacing:.2em;text-indent:.2em;color:var(--rose)}
.div{position:absolute;z-index:4;display:flex;align-items:center;justify-content:center;gap:20px}
.div.v{flex-direction:column}
.bar{flex:1;background:var(--line);border-radius:5px}
.div.h .bar{height:9px}
.div.v .bar{width:9px}
`;

const sz=t=>{const n=[...t].length;return n<=2?250:n===3?200:162};
const cell=(t,img,x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid">${ORN('var(--gold)',{long:false,scale:1.15})}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.05em;text-indent:.05em">${t}</div>
  </div></div>`;

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(252,249,245,0),var(--cream) 88%)"></div>
   <div class="mid"><div class="title" style="font-size:200px;letter-spacing:.04em;text-indent:.04em">${WEEKLY.name}</div></div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:22px">
   <div class="eyebrow">每週特賞</div>${ORN('var(--gold)',{long:false,scale:1.15})}
   <div style="font-size:90px;font-weight:700;letter-spacing:.04em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:205px;font-weight:900;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const M=62, PAD=70;   // 分線兩端內縮、紋飾佔位高度
const vdiv=x=>`<div class="div v" style="left:${x-PAD/2}px;top:${CH+M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${ORN('var(--line)',{long:false,vert:true})}<span class="bar"></span></div>`;

const html=`<style>${CSS}</style><div class="menu">
${weekly(0,0,WIDE,CH)}
${cell('節日禮盒',b64('gift'),WIDE,0,W-WIDE,CH)}
${cell('蛋糕',b64('cake'),0,CH,CW,CH)}
${cell('訂購須知',null,CW,CH,WIDE-CW,CH)}
${cell('聯絡我們',null,WIDE,CH,W-WIDE,CH)}
<div class="div h" style="left:${M}px;top:${CH-PAD/2}px;width:${W-M*2}px;height:${PAD}px">
  <span class="bar"></span>${ORN('var(--line)',{long:true})}<span class="bar"></span></div>
<div class="div v" style="left:${WIDE-PAD/2}px;top:${M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${ORN('var(--line)',{long:false,vert:true})}<span class="bar"></span></div>
${vdiv(CW)}${vdiv(WIDE)}
<div class="grain"></div></div>`;

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
 const p=await ctx.newPage();
 await p.setContent(html,{waitUntil:'load'});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(900);
 const bad=await p.evaluate(()=>{const r=[];
   document.querySelectorAll('.title').forEach(e=>{const c=e.closest('.cell').getBoundingClientRect(),b=e.getBoundingClientRect();
     if(b.left<c.left+30||b.right>c.right-30)r.push('文字太寬：'+e.textContent);});
   document.querySelectorAll('.div').forEach(d=>{const db=d.getBoundingClientRect();
     d.querySelectorAll('svg').forEach(s=>{const sb=s.getBoundingClientRect();
       if(sb.left<db.left-1||sb.right>db.right+1||sb.top<db.top-1||sb.bottom>db.bottom+1)
         r.push('紋飾超出分線框');});});
   return r;});
 if(bad.length)console.log('⚠️',[...new Set(bad)].join('；')); else console.log('檢查通過：文字與紋飾都在框內');
 const full=path.join(OUT,'_組合預覽_2500x1686.png');
 await p.screenshot({path:full});
 await b.close();
 const cuts=[['1-1_1-2_每週特賞_雪花酥.png',WIDE,CH,0,0],['1-3_節日禮盒.png',W-WIDE,CH,WIDE,0],
   ['2-1_蛋糕.png',CW,CH,0,CH],['2-2_訂購須知.png',WIDE-CW,CH,CW,CH],['2-3_聯絡我們.png',W-WIDE,CH,WIDE,CH]];
 for(const [f,w,h,x,y] of cuts){
   execSync(`convert ${JSON.stringify(full)} -crop ${w}x${h}+${x}+${y} +repage ${JSON.stringify(path.join(OUT,f))}`);
   console.log('✅',f,w+'×'+h);
 }
})();
