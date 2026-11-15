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

/* ── 鮮花語彙 ───────────────────────────────────────────
   取自沁沁蛋糕上的擠花：奶油白底、粉玫瑰、薄荷綠葉。
   小尺寸下細節會消失、顏色不會，所以用色彩而不是筆觸堆疊。 */
const ROSE=(cx,cy,r,c,c2)=>{
  const ring=(n,rad,rx,ry,off,fill,op)=>{let p='';
    for(let k=0;k<n;k++){const a=(k*360/n+off)*Math.PI/180,
      x=(cx+Math.cos(a)*rad).toFixed(1), y=(cy+Math.sin(a)*rad).toFixed(1);
      p+=`<ellipse cx="${x}" cy="${y}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" opacity="${op}" transform="rotate(${(k*360/n+off).toFixed(0)} ${x} ${y})"/>`;}
    return p;};
  return `<g>${ring(6,r*0.74,r*0.52,r*0.40,0,c,1)}
   ${ring(5,r*0.40,r*0.36,r*0.28,36,c2,1)}
   <circle cx="${cx}" cy="${cy}" r="${(r*0.22).toFixed(1)}" fill="${c2}"/></g>`;};

const BUD=(cx,cy,r,rot,c,c2,g)=>`<g transform="rotate(${rot} ${cx} ${cy})">
 <path d="M${cx} ${cy-r*1.5} C${cx+r*0.9} ${cy-r*0.9},${cx+r*0.8} ${cy+r*0.5},${cx} ${cy+r*0.8}
   C${cx-r*0.8} ${cy+r*0.5},${cx-r*0.9} ${cy-r*0.9},${cx} ${cy-r*1.5} Z" fill="${c}"/>
 <path d="M${cx} ${cy+r*0.9} C${cx+r*0.7} ${cy+r*0.4},${cx+r*0.6} ${cy+r*1.4},${cx} ${cy+r*1.8}
   C${cx-r*0.6} ${cy+r*1.4},${cx-r*0.7} ${cy+r*0.4},${cx} ${cy+r*0.9} Z" fill="${g}"/></g>`;

const LEAF=(x,y,L,rot,g,g2)=>`<g transform="rotate(${rot} ${x} ${y})">
 <path d="M${x} ${y} C${x+L*0.34} ${y-L*0.30},${x+L*0.78} ${y-L*0.24},${x+L} ${y}
   C${x+L*0.78} ${y+L*0.24},${x+L*0.34} ${y+L*0.30},${x} ${y} Z" fill="${g}"/>
 <path d="M${x+L*0.08} ${y} L${x+L*0.88} ${y}" stroke="${g2}" stroke-width="${L*0.035}" fill="none" opacity=".8"/></g>`;

/* 角落花束：弧形枝＋葉＋玫瑰＋花苞 */
const SPRAY=(c,c2,g,g2)=>`<svg width="300" height="300" viewBox="0 0 300 300">
 <g fill="none" stroke="${g2}" stroke-width="5" stroke-linecap="round" opacity=".85">
  <path d="M26 26 C86 40 140 76 176 126"/>
  <path d="M26 26 C44 84 72 134 118 174"/>
  <path d="M60 44 C96 62 124 88 142 118"/>
 </g>
 ${LEAF(62,54,78,24,g,g2)}${LEAF(96,92,66,46,g,g2)}
 ${LEAF(48,86,70,66,g,g2)}${LEAF(118,66,58,6,g,g2)}
 ${LEAF(140,122,62,36,g,g2)}
 ${BUD(166,74,15,32,c,c2,g)}${BUD(86,160,14,-20,c,c2,g)}
 ${ROSE(178,128,40,c,c2)}
 ${ROSE(116,186,30,c,c2)}
 ${ROSE(44,36,26,c,c2)}
</svg>`;

/* 標題上方：對稱小花枝 */
const SPRIG=(c,c2,g,g2,w)=>`<svg width="${w}" height="${w*0.30}" viewBox="0 0 400 120">
 <g fill="none" stroke="${g2}" stroke-width="5" stroke-linecap="round" opacity=".85">
  <path d="M200 60 C160 60 126 54 92 40"/><path d="M200 60 C240 60 274 54 308 40"/>
 </g>
 ${LEAF(150,58,60,194,g,g2)}${LEAF(250,58,60,-14,g,g2)}
 ${LEAF(126,70,48,150,g,g2)}${LEAF(274,70,48,30,g,g2)}
 ${BUD(96,40,13,-34,c,c2,g)}${BUD(304,40,13,34,c,c2,g)}
 ${ROSE(200,60,34,c,c2)}
</svg>`;

/* 細藤蔓：波浪細莖＋交錯小葉，重複鋪滿分線 */
const S2='%237E7859', SG='%23A09A7C';
const VINE_H=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='132' height='38'>`
 +`<path d='M0 19 C22 7 44 7 66 19 C88 31 110 31 132 19' fill='none' stroke='${S2}' stroke-width='3.2' stroke-linecap='round'/>`
 +`<path d='M33 12 C30 4 24 1 16 2 C19 10 26 13 33 12 Z' fill='${SG}'/>`
 +`<path d='M99 26 C102 34 108 37 116 36 C113 28 106 25 99 26 Z' fill='${SG}'/>`
 +`<path d='M66 19 C64 12 66 6 71 2 C74 9 72 15 66 19 Z' fill='${SG}' opacity='.8'/></svg>")`;
const VINE_V=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='38' height='132'>`
 +`<path d='M19 0 C7 22 7 44 19 66 C31 88 31 110 19 132' fill='none' stroke='${S2}' stroke-width='3.2' stroke-linecap='round'/>`
 +`<path d='M12 33 C4 30 1 24 2 16 C10 19 13 26 12 33 Z' fill='${SG}'/>`
 +`<path d='M26 99 C34 102 37 108 36 116 C28 113 25 106 26 99 Z' fill='${SG}'/>`
 +`<path d='M19 66 C12 64 6 66 2 71 C9 74 15 72 19 66 Z' fill='${SG}' opacity='.8'/></svg>")`;
/* 分線中央：單朵玫瑰配兩片葉 */
const KNOT=(c,c2,g,g2,s,vert)=>vert
 ? `<svg width="${s*0.52}" height="${s}" viewBox="0 0 104 200">${LEAF(52,80,46,276,g,g2)}${LEAF(52,120,46,84,g,g2)}${ROSE(52,100,30,c,c2)}</svg>`
 : `<svg width="${s}" height="${s*0.52}" viewBox="0 0 200 104">${LEAF(80,52,46,186,g,g2)}${LEAF(120,52,46,-6,g,g2)}${ROSE(100,52,30,c,c2)}</svg>`;

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

const FL=["var(--rose)","var(--rose2)","var(--sage)","var(--sage2)"];
const BAND=62, SAFE=22;   // 色帶寬、標題與色帶的最小間距
const sz=t=>142;
const cell=(t,img,x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid" style="gap:14px">${SPRIG(...FL,330)}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.10em;text-indent:.10em">${t}</div>
  </div></div>`;

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(253,250,247,0),var(--cream) 88%)"></div>
   <div class="mid" style="gap:14px">${SPRIG(...FL,300)}
     <div class="title" style="font-size:180px;letter-spacing:.1em;text-indent:.1em">${WEEKLY.name}</div></div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px">
   <div class="eyebrow">本週特賞</div>${SPRIG(...FL,300)}
   <div style="font-size:78px;font-weight:400;letter-spacing:.1em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:138px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const M=190, PAD=72;
const vdiv=(x,y)=>`<div class="div v" style="left:${x-PAD/2}px;top:${y+M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${KNOT(...FL,112,true)}<span class="bar"></span></div>`;
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
  <span class="bar"></span>${KNOT(...FL,122,false)}<span class="bar"></span></div>
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
   const BAND=62, SAFE=22, W=document.querySelector('.menu').clientWidth;
   document.querySelectorAll('.title,.eyebrow').forEach(e=>{const c=e.closest('.cell').getBoundingClientRect(),b=e.getBoundingClientRect();
     if(b.left<c.left+20||b.right>c.right-20)r.push('文字超出格子：'+e.textContent);
     if(b.left<BAND+SAFE||b.right>W-BAND-SAFE)r.push('文字太靠近色帶：'+e.textContent);});
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
