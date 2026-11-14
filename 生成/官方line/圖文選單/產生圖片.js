const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const DIR=__dirname, OUT='/home/user/timo-orders/生成/官方line/圖文選單';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

/* 取自 logo 與菜單海報的實際配色 */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#6B615C;--taupe:#8E837D;--rose:#CE9398;--rose-pale:#E6CDCF;--gold:#C8B183;--cream:#FDFBF8}
html,body{width:100%;height:100%}
body{background:var(--cream);font-family:"Noto Serif TC",serif;color:var(--ink);overflow:hidden}
.card{position:relative;width:100%;height:100%;background:var(--cream);display:flex;overflow:hidden}
.frame{position:absolute;inset:18px;border:2px solid var(--rose-pale);pointer-events:none}
.frame::after{content:"";position:absolute;inset:7px;border:1px solid var(--gold);opacity:.55}
.photo{position:absolute;inset:0;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.75)}
.photo::after{content:"";position:absolute;inset:0;background:rgba(253,251,248,.66)}
.mid{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;gap:var(--g,16px)}
.title{font-weight:700;letter-spacing:.1em;text-indent:.1em;line-height:1.1;text-shadow:0 1px 10px rgba(253,251,248,.9)}
.eyebrow{font-size:30px;font-weight:600;letter-spacing:.42em;text-indent:.42em;color:var(--rose)}
.rule{width:92px;height:1px;background:var(--gold);opacity:.8}
svg.flourish{display:block}
`;

const flourish=(w,c)=>`<svg class="flourish" width="${w}" height="${w*0.26}" viewBox="0 0 200 52" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round">
<path d="M100 40 C 100 26, 100 18, 100 10"/>
<path d="M100 20 C 84 20, 72 14, 62 6 C 76 4, 90 10, 100 20Z" fill="${c}" fill-opacity=".2"/>
<path d="M100 20 C 116 20, 128 14, 138 6 C 124 4, 110 10, 100 20Z" fill="${c}" fill-opacity=".2"/>
<path d="M100 32 C 88 32, 78 28, 70 22 C 82 20, 93 25, 100 32Z" fill="${c}" fill-opacity=".2"/>
<path d="M100 32 C 112 32, 122 28, 130 22 C 118 20, 107 25, 100 32Z" fill="${c}" fill-opacity=".2"/>
<path d="M20 44 C 44 44, 62 44, 84 44"/><path d="M116 44 C 138 44, 156 44, 180 44"/>
<circle cx="100" cy="44" r="3.4" fill="${c}" stroke="none"/></svg>`;

const square=(title,img,size)=>`<style>${CSS}</style><div class="card">
${img?`<div class="photo"><img src="${img}"></div>`:''}
<div class="frame"></div>
<div class="mid" style="--g:26px">
  ${flourish(190,'var(--gold)')}
  <div class="title" style="font-size:${size}px">${title}</div>
  <div class="rule"></div>
</div></div>`;

const weekly=(name,img,spec,price)=>`<style>${CSS}</style><div class="card">
<div style="position:relative;width:50%;height:100%;overflow:hidden">
  <div class="photo"><img src="${img}"></div>
  <div class="mid"><div class="title" style="font-size:112px">${name}</div></div>
</div>
<div style="position:relative;width:50%;height:100%;display:flex;flex-direction:column;
     align-items:center;justify-content:center;gap:26px;background:var(--cream)">
  <div style="position:absolute;left:0;top:14%;bottom:14%;width:1px;background:var(--rose-pale)"></div>
  <div class="eyebrow">每週特賞</div>
  ${flourish(170,'var(--gold)')}
  <div style="font-size:58px;font-weight:600;letter-spacing:.06em;color:var(--taupe)">${spec}</div>
  <div style="font-size:132px;font-weight:900;letter-spacing:.02em;line-height:1">${price}</div>
</div>
<div class="frame"></div></div>`;

const JOBS=[
 {f:'1-1_1-2_每週特賞_雪花酥.png', w:1686,h:843, html:weekly('雪花酥',b64('snow'),'850g／包','200元')},
 {f:'1-3_節日禮盒.png',  w:843,h:843, html:square('節日禮盒',b64('gift'),100)},
 {f:'2-1_蛋糕.png',      w:843,h:843, html:square('蛋糕',b64('cake'),140)},
 {f:'2-2_訂購須知.png',  w:843,h:843, html:square('訂購須知',null,100)},
 {f:'2-3_聯絡我們.png',  w:843,h:843, html:square('聯絡我們',null,100)},
];

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch();
 for(const j of JOBS){
   const ctx=await b.newContext({viewport:{width:j.w,height:j.h},deviceScaleFactor:1});
   const p=await ctx.newPage();
   await p.setContent(j.html,{waitUntil:'load'});
   await p.evaluate(()=>document.fonts.ready);
   await p.waitForTimeout(700);
   await p.screenshot({path:path.join(OUT,j.f)});
   console.log('✅', j.f, j.w+'×'+j.h);
   await ctx.close();
 }
 await b.close();
})();
