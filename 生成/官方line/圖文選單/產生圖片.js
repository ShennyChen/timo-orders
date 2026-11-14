const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const DIR=__dirname, OUT='/home/user/timo-orders/生成/官方line/圖文選單';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

/* 取自 logo 與菜單海報的實際配色 */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#5F554F;--taupe:#857A73;--rose:#C4848A;--rose-pale:#E2C4C7;--gold:#BFA571;--cream:#FDFBF8}
html,body{width:100%;height:100%}
body{background:var(--cream);font-family:"Noto Serif TC",serif;color:var(--ink);overflow:hidden}
.card{position:relative;width:100%;height:100%;background:var(--cream);display:flex;overflow:hidden}
.frame{position:absolute;inset:16px;border:4px solid var(--rose-pale);pointer-events:none}
.frame::after{content:"";position:absolute;inset:9px;border:2px solid var(--gold);opacity:.6}
.photo{position:absolute;inset:0;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.6)}
.photo::after{content:"";position:absolute;inset:0;background:rgba(253,251,248,.74)}
.mid{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;gap:var(--g,18px)}
.title{font-weight:900;line-height:1.06;white-space:nowrap;
  text-shadow:0 2px 18px rgba(253,251,248,.95),0 0 36px rgba(253,251,248,.9)}
.eyebrow{font-size:60px;font-weight:700;letter-spacing:.34em;text-indent:.34em;color:var(--rose)}
.rule{width:150px;height:2px;background:var(--gold);opacity:.85}
svg.flourish{display:block}
`;

const flourish=(w,c)=>`<svg class="flourish" width="${w}" height="${w*0.26}" viewBox="0 0 200 52" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round">
<path d="M100 40 C 100 26, 100 18, 100 10"/>
<path d="M100 20 C 84 20, 72 14, 62 6 C 76 4, 90 10, 100 20Z" fill="${c}" fill-opacity=".25"/>
<path d="M100 20 C 116 20, 128 14, 138 6 C 124 4, 110 10, 100 20Z" fill="${c}" fill-opacity=".25"/>
<path d="M100 32 C 88 32, 78 28, 70 22 C 82 20, 93 25, 100 32Z" fill="${c}" fill-opacity=".25"/>
<path d="M100 32 C 112 32, 122 28, 130 22 C 118 20, 107 25, 100 32Z" fill="${c}" fill-opacity=".25"/>
<path d="M22 44 C 44 44, 62 44, 84 44"/><path d="M116 44 C 138 44, 156 44, 178 44"/>
<circle cx="100" cy="44" r="4.2" fill="${c}" stroke="none"/></svg>`;

/* size 依字數調整，確保在框內不會被裁切 */
const square=(title,img)=>{const n=[...title].length, size=n<=2?250:n===3?195:160, ls=n<=2?.06:.04;
return `<style>${CSS}</style><div class="card">
${img?`<div class="photo"><img src="${img}"></div>`:''}
<div class="frame"></div>
<div class="mid" style="--g:30px">
  ${flourish(210,'var(--gold)')}
  <div class="title" style="font-size:${size}px;letter-spacing:${ls}em;text-indent:${ls}em">${title}</div>
  <div class="rule"></div>
</div></div>`;};

const weekly=(name,img,spec,price)=>`<style>${CSS}</style><div class="card">
<div style="position:relative;width:50%;height:100%;overflow:hidden">
  <div class="photo"><img src="${img}"></div>
  <div class="mid"><div class="title" style="font-size:200px;letter-spacing:.04em;text-indent:.04em">${name}</div></div>
</div>
<div style="position:relative;width:50%;height:100%;display:flex;flex-direction:column;
     align-items:center;justify-content:center;gap:22px;background:var(--cream)">
  <div style="position:absolute;left:0;top:13%;bottom:13%;width:2px;background:var(--rose-pale)"></div>
  <div class="eyebrow">每週特賞</div>
  ${flourish(190,'var(--gold)')}
  <div style="font-size:88px;font-weight:700;letter-spacing:.04em;color:var(--taupe);white-space:nowrap">${spec}</div>
  <div style="font-size:200px;font-weight:900;letter-spacing:.01em;line-height:1;white-space:nowrap">${price}</div>
</div>
<div class="frame"></div></div>`;

const JOBS=[
 {f:'1-1_1-2_每週特賞_雪花酥.png', w:1686,h:843, html:weekly('雪花酥',b64('snow'),'850g／包','200元')},
 {f:'1-3_節日禮盒.png',  w:843,h:843, html:square('節日禮盒',b64('gift'))},
 {f:'2-1_蛋糕.png',      w:843,h:843, html:square('蛋糕',b64('cake'))},
 {f:'2-2_訂購須知.png',  w:843,h:843, html:square('訂購須知',null)},
 {f:'2-3_聯絡我們.png',  w:843,h:843, html:square('聯絡我們',null)},
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
   // 確認文字沒有超出框線
   const over=await p.evaluate(()=>{const r=[];document.querySelectorAll('.title,.eyebrow').forEach(e=>{
     const b=e.getBoundingClientRect();if(b.left<26||b.right>innerWidth-26)r.push(e.textContent+' 超出');});return r;});
   if(over.length) console.log('   ⚠️', over.join('；'));
   await p.screenshot({path:path.join(OUT,j.f)});
   console.log('✅', j.f, j.w+'×'+j.h);
   await ctx.close();
 }
 await b.close();
})();
