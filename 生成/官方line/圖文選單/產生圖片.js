const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const {execSync}=require('child_process');
const DIR=__dirname;
const FONT=process.argv[2]||'LXGW WenKai TC';
const OUT=process.argv[3]||'/home/user/timo-orders/生成/官方line/圖文選單';
const SLICE=process.argv[4]!=='no';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');
const png=n=>'data:image/png;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

const W=2500,H=1686,CW=833,CH=843,WIDE=1667;
const WEEKLY={name:'雪花酥',photo:'snow',spec:'850g／包',price:'200元'};

/* ── 黑色剪影花藤語彙 ──────────────────────────────────
   捲鬚用「多段遞減線寬」模擬毛筆般的漸細，尖葉用填色路徑，
   末端綴串珠點。左半畫一次，右半鏡射，確保對稱。        */
const INK='#241F1B';
/* 尖葉：不對稱槍頭形 */
const LF=(x,y,L,rot,c,op)=>`<path transform="rotate(${rot} ${x} ${y})" opacity="${op||1}" fill="${c}"
 d="M${x} ${y} C${x+L*0.30} ${y-L*0.26},${x+L*0.72} ${y-L*0.30},${x+L} ${y-L*0.06}
    C${x+L*0.70} ${y+L*0.10},${x+L*0.32} ${y+L*0.16},${x} ${y} Z"/>`;
/* 漸細捲鬚：沿路徑分段，線寬由粗到細 */
const CURL=(c,segs)=>segs.map(([d,w])=>
 `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`).join('');
/* 串珠：由大到小 */
const BEADS=(pts,c)=>pts.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');

/* 對稱花藤（左半，右半由呼叫端鏡射）*/
const _half=(c)=>`
 ${CURL(c,[
  ["M200 72 C176 72 153 65 135 52",12],
  ["M135 52 C121 42 113 29 113 16",8],
  ["M113 16 C113 6 122 1 130 6 C138 11 135 22 125 21",5],
  ["M125 21 C119 20 118 14 122 11",3]])}
 ${LF(168,66,58,198,c)}
 ${LF(142,44,50,236,c)}
 ${LF(120,22,38,276,c,.9)}
 ${CURL(c,[
  ["M184 78 C169 88 158 101 154 116",8],
  ["M154 116 C152 127 160 134 168 130 C174 127 172 119 165 120",4.5]])}
 ${LF(160,100,42,142,c,.95)}
 ${LF(150,124,32,176,c,.8)}
 ${BEADS([[100,60,6.4],[86,64,4.6],[74,67,3.2],[64,69,2.1]],c)}`;

/* 標題上方／分線中央共用的對稱花藤 */
const SPRIG=(c,w)=>KNOT(c,w,false);

const _body=(c)=>`${_half(c)}<g transform="translate(400,0) scale(-1,1)">${_half(c)}</g>
 <path d="M200 44 C208 58 212 66 212 72 C212 79 206 84 200 84 C194 84 188 79 188 72
   C188 66 192 58 200 44 Z" fill="${c}"/>
 ${LF(200,96,30,76,c,.9)}${LF(200,96,30,104,c,.9)}
 <circle cx="200" cy="112" r="5" fill="${c}"/>`;
const KNOT=(c,s,vert)=>vert
 ? `<svg width="${s*0.36}" height="${s}" viewBox="128 -128 144 400">
     <g transform="rotate(90 200 72)">${_body(c)}</g></svg>`
 : `<svg width="${s}" height="${s*0.36}" viewBox="0 0 400 144">${_body(c)}</svg>`;

/* 分線藤蔓：波浪主莖＋交錯捲鬚與尖葉，重複鋪滿 */
const K='%23241F1B';
const VINE_H=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='48'>`
 +`<path d='M0 24 C26 10 52 10 75 24 C98 38 124 38 150 24' fill='none' stroke='${K}' stroke-width='4' stroke-linecap='round'/>`
 +`<path d='M37 15 C33 6 26 2 17 3 C21 12 29 16 37 15 Z' fill='${K}'/>`
 +`<path d='M113 33 C117 42 124 46 133 45 C129 36 121 32 113 33 Z' fill='${K}'/>`
 +`<path d='M75 24 C73 15 76 8 83 4 C86 12 83 20 75 24 Z' fill='${K}' opacity='.85'/>`
 +`<circle cx='57' cy='17' r='2.6' fill='${K}'/><circle cx='93' cy='31' r='2.6' fill='${K}'/></svg>")`;
const VINE_V=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='150'>`
 +`<path d='M24 0 C10 26 10 52 24 75 C38 98 38 124 24 150' fill='none' stroke='${K}' stroke-width='4' stroke-linecap='round'/>`
 +`<path d='M15 37 C6 33 2 26 3 17 C12 21 16 29 15 37 Z' fill='${K}'/>`
 +`<path d='M33 113 C42 117 46 124 45 133 C36 129 32 121 33 113 Z' fill='${K}'/>`
 +`<path d='M24 75 C15 73 8 76 4 83 C12 86 20 83 24 75 Z' fill='${K}' opacity='.85'/>`
 +`<circle cx='17' cy='57' r='2.6' fill='${K}'/><circle cx='31' cy='93' r='2.6' fill='${K}'/></svg>")`;

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=${FONT.replace(/ /g,'+')}:wght@300;400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#4A423C;--line:#9D8E85;--taupe:#857A73;
 --rose:#AD848A;--rose2:#8E6168;--bandc:#CBA67D;--paper:#FCF8EC;--sage:#A09A7C;--sage2:#7E7859;--cream:#FCF8EC}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"${FONT}","Noto Serif TC",serif;color:var(--ink);background:var(--cream)}
.menu{position:relative;width:${W}px;height:${H}px;background:var(--cream)}
.grain{position:absolute;inset:0;z-index:7;pointer-events:none;opacity:.45;
  background:radial-gradient(130% 95% at 50% 0%,rgba(255,255,255,.7),transparent 60%),
             radial-gradient(120% 90% at 50% 100%,rgba(196,160,152,.12),transparent 56%)}
.band{position:absolute;z-index:5;pointer-events:none;inset:0;border:62px solid var(--bandc);box-shadow:inset 0 0 0 1px rgba(120,92,62,.22)}
.spray{position:absolute;z-index:6;pointer-events:none;display:block}
.cell{position:absolute;overflow:hidden}
.photo{position:absolute;inset:0}
.photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.72)}
.photo::after{content:"";position:absolute;inset:0;background:rgba(253,250,247,.74)}
.mid{position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:26px}
.title{font-weight:700;line-height:1.08;white-space:nowrap;
  text-shadow:0 2px 20px rgba(253,250,247,.95),0 0 44px rgba(253,250,247,.92)}
.eyebrow{font-size:88px;font-weight:700;letter-spacing:.22em;text-indent:.22em;color:#8A6A55}
.div{position:absolute;z-index:4;display:flex;align-items:center;justify-content:center;gap:22px}
.div.v{flex-direction:column}
.bar{flex:1;opacity:.9}
.div.h .bar{height:38px;background-image:${VINE_H};background-repeat:repeat-x;background-position:center}
.div.v .bar{width:38px;background-image:${VINE_V};background-repeat:repeat-y;background-position:center}
`;

const FL=[INK];
const sz=t=>160;
const cell=(t,img,x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid" style="gap:14px">${SPRIG(INK,360)}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.14em;text-indent:.14em">${t}</div>
  </div></div>`;

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(253,250,247,0),var(--cream) 88%)"></div>
   <div class="mid" style="gap:14px">${SPRIG(INK,330)}
     <div class="title" style="font-size:196px;letter-spacing:.1em;text-indent:.1em">${WEEKLY.name}</div></div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px">
   <div class="eyebrow">本週特賞</div>${SPRIG(INK,330)}
   <div style="font-size:78px;font-weight:400;letter-spacing:.1em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:138px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const M=190, PAD=124;
const vdiv=(x,y)=>`<div class="div v" style="left:${x-PAD/2}px;top:${y+M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${KNOT(INK,250,true)}<span class="bar"></span></div>`;
const CN={tl:png('corner_tl'),tr:png('corner_tr'),bl:png('corner_bl'),br:png('corner_br')};
const sprays=`<img class="spray" src="${CN.tl}" style="left:0;top:0;width:428px">`
 +`<img class="spray" src="${CN.tr}" style="right:0;top:0;width:428px">`
 +`<img class="spray" src="${CN.bl}" style="left:0;bottom:0;width:447px">`
 +`<img class="spray" src="${CN.br}" style="right:0;bottom:0;width:447px">`;

const html=`<style>${CSS}</style><div class="menu">
${weekly(0,0,WIDE,CH)}
${cell('節慶禮盒',b64('gift'),WIDE,0,W-WIDE,CH)}
${cell('蛋糕',b64('cake'),0,CH,CW,CH)}
${cell('訂購須知',null,CW,CH,WIDE-CW,CH)}
${cell('聯絡我們',null,WIDE,CH,W-WIDE,CH)}
<div class="div h" style="left:${M}px;top:${CH-PAD/2}px;width:${W-M*2}px;height:${PAD}px">
  <span class="bar"></span>${KNOT(INK,330,false)}<span class="bar"></span></div>
${vdiv(WIDE,0)}${vdiv(CW,CH)}${vdiv(WIDE,CH)}
<div class="band"></div>${sprays}
<div class="grain"></div></div>`;

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
 const p=await ctx.newPage();
 await p.setContent(html,{waitUntil:'load'});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(4000);
 const bad=await p.evaluate(()=>{const r=[];
   document.querySelectorAll('.title,.eyebrow').forEach(e=>{const c=e.closest('.cell').getBoundingClientRect(),b=e.getBoundingClientRect();
     if(b.left<c.left+34||b.right>c.right-34)r.push('文字太寬：'+e.textContent);});
   document.querySelectorAll('.div').forEach(d=>{const db=d.getBoundingClientRect();
     d.querySelectorAll('svg').forEach(s=>{const sb=s.getBoundingClientRect();
       if(sb.left<db.left-1||sb.right>db.right+1||sb.top<db.top-1||sb.bottom>db.bottom+1)r.push('紋飾超出分線框');});});
   return [...new Set(r)];});
 console.log(bad.length?'⚠️ '+bad.join('；'):'檢查通過');
 const full=path.join(OUT,'_組合預覽_2500x1686.png');
 await p.screenshot({path:full});
 await b.close();
 if(!SLICE)return;
 const cuts=[['1-1_1-2_本週特賞_雪花酥.png',WIDE,CH,0,0],['1-3_節慶禮盒.png',W-WIDE,CH,WIDE,0],
   ['2-1_蛋糕.png',CW,CH,0,CH],['2-2_訂購須知.png',WIDE-CW,CH,CW,CH],['2-3_聯絡我們.png',W-WIDE,CH,WIDE,CH]];
 for(const [f,w,h,x,y] of cuts){
   execSync(`convert ${JSON.stringify(full)} -crop ${w}x${h}+${x}+${y} +repage ${JSON.stringify(path.join(OUT,f))}`);
   console.log('✅',f);}
})();
