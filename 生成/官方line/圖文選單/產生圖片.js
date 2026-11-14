const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const {execSync}=require('child_process');
const DIR=__dirname;
const FONT=process.argv[2]||'LXGW WenKai TC';
const OUT=process.argv[3]||'/home/user/timo-orders/生成/官方line/圖文選單';
const SLICE=process.argv[4]!=='no';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

const W=2500,H=1686,CW=833,CH=843,WIDE=1667;
const WEEKLY={name:'雪花酥',photo:'snow',spec:'850g／包',price:'200元'};

/* ── 巴洛克捲葉語彙（取自 logo 兩側裝飾）────────────────── */
const _wing=(c,long)=>`
 <path d="M254 60 C232 54 208 42 182 22 C186 44 200 58 224 64 C238 67 250 65 254 60 Z"/>
 <path d="M254 60 C232 66 208 78 182 98 C186 76 200 62 224 56 C238 53 250 55 254 60 Z"/>
 ${long?`
 <path d="M182 60 C166 60 152 60 138 60" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
 <path d="M138 60 C110 60 92 46 92 27 C92 12 109 6 118 19 C126 31 112 45 98 38" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
 <path d="M138 60 C127 80 108 94 82 101 C96 79 115 65 138 60 Z"/>
 <circle cx="58" cy="60" r="7"/>`:`
 <path d="M182 60 C170 60 160 60 150 60" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
 <circle cx="132" cy="60" r="7.5"/>`}`;

function ORN(c,{long=true,vert=false,scale=1}={}){
  const vx=long?0:106, vw=long?560:348, vh=120;
  const body=`<path d="M280 18 C293 39 301 52 301 60 C301 68 293 81 280 102 C267 81 259 68 259 60 C259 52 267 39 280 18 Z"/>
   ${_wing(c,long)}<g transform="translate(560,0) scale(-1,1)">${_wing(c,long)}</g>`;
  const w=vw*0.54*scale, h=vh*0.54*scale;
  if(!vert) return `<svg width="${w}" height="${h}" viewBox="${vx} 0 ${vw} ${vh}" fill="${c}" style="flex:0 0 auto">${body}</svg>`;
  const cx=vx+vw/2, cy=vh/2;
  return `<svg width="${h}" height="${w}" viewBox="${cx-vh/2} ${cy-vw/2} ${vh} ${vw}" fill="${c}" style="flex:0 0 auto">
    <g transform="rotate(90 ${cx} ${cy})">${body}</g></svg>`;
}
/* 標題下方的細飾線 */
const RULE=(c,w)=>`<svg width="${w}" height="${w*0.085}" viewBox="0 0 400 34" fill="${c}" style="opacity:.9">
 <path d="M200 7 L209 17 L200 27 L191 17 Z"/>
 <path d="M178 17 C158 17 138 17 112 17" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
 <path d="M222 17 C242 17 262 17 288 17" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
 <circle cx="96" cy="17" r="5"/><circle cx="304" cy="17" r="5"/></svg>`;
/* 整幅外框的四角花飾 */
const CORNER=c=>`<svg width="208" height="208" viewBox="0 0 180 180" fill="${c}">
 <g fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round">
   <path d="M12 92 C12 48 48 12 92 12"/>
   <path d="M12 128 C12 64 64 12 128 12" opacity=".45"/>
   <path d="M92 12 C110 12 124 19 134 31"/>
   <path d="M12 92 C12 110 19 124 31 134"/>
   <path d="M134 31 C146 31 154 24 154 14 C154 5 143 3 140 11 C137 19 146 22 152 18"/>
   <path d="M31 134 C31 146 24 154 14 154 C5 154 3 143 11 140 C19 137 22 146 18 152"/>
 </g>
 <path d="M92 12 C106 12 119 19 130 31 C112 33 98 26 92 12 Z"/>
 <path d="M12 92 C12 106 19 119 31 130 C33 112 26 98 12 92 Z"/>
 <path d="M50 26 C58 38 62 46 60 52 C58 58 50 64 38 72 C36 58 38 48 42 42 C45 37 47 31 50 26 Z" opacity=".75"/>
 <circle cx="40" cy="40" r="6.5"/></svg>`;

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=${FONT.replace(/ /g,'+')}:wght@300;400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#4A423C;--line:#5A5049;--taupe:#7D726B;--rose:#A8646D;--gold:#B9A06A;--cream:#FCF9F5}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"${FONT}","Noto Serif TC",serif;color:var(--ink);background:var(--cream)}
.menu{position:relative;width:${W}px;height:${H}px;background:var(--cream)}
.grain{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(118deg,rgba(120,105,95,.045) 0 2px,transparent 2px 9px),
             radial-gradient(130% 95% at 50% 0%,rgba(255,255,255,.65),transparent 62%),
             radial-gradient(120% 90% at 50% 100%,rgba(176,152,140,.14),transparent 58%)}
/* 整幅外框：雙線＋四角花飾 */
.edge{position:absolute;z-index:5;pointer-events:none;border:3px solid var(--gold);opacity:.85}
.edge.o{inset:24px;border-width:4px}.edge.i{inset:40px;border-width:1.5px;opacity:.65}.edge.t{inset:53px;border-width:1px;opacity:.38}
.cnr{position:absolute;z-index:5;pointer-events:none;opacity:.92}.eo{position:absolute;z-index:5;pointer-events:none;display:grid;place-items:center;background:transparent}
.cell{position:absolute;overflow:hidden}
.photo{position:absolute;inset:0}
.photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.5)}
.photo::after{content:"";position:absolute;inset:0;background:rgba(252,249,245,.78)}
.mid{position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:24px}
.title{font-weight:700;line-height:1.08;white-space:nowrap;
  text-shadow:0 2px 20px rgba(252,249,245,.95),0 0 44px rgba(252,249,245,.92)}
.eyebrow{font-size:88px;font-weight:700;letter-spacing:.22em;text-indent:.22em;color:var(--rose)}
.div{position:absolute;z-index:4;display:flex;align-items:center;justify-content:center;gap:20px}
.div.v{flex-direction:column}
.bar{flex:1;background:var(--line);border-radius:4px}
.div.h .bar{height:7px}
.div.v .bar{width:7px}
`;

const sz=t=>160;   // 五格一律同字級，不因字數少就放大
const cell=(t,img,x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid">${ORN('var(--gold)',{long:false,scale:1.05})}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.14em;text-indent:.14em">${t}</div>
    ${RULE('var(--gold)',330)}
  </div></div>`;

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(252,249,245,0),var(--cream) 88%)"></div>
   <div class="mid"><div class="title" style="font-size:196px;letter-spacing:.1em;text-indent:.1em">${WEEKLY.name}</div>
     ${RULE('var(--gold)',300)}</div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:20px">
   <div class="eyebrow">本週特賞</div>${ORN('var(--gold)',{long:false,scale:1.05})}
   <div style="font-size:78px;font-weight:400;letter-spacing:.1em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:138px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const M=76, PAD=70;
const vdiv=(x,y)=>`<div class="div v" style="left:${x-PAD/2}px;top:${y+M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${ORN('var(--line)',{long:false,vert:true})}<span class="bar"></span></div>`;
const EC=39, EW=168, EH=62;   // 框線中心、襯底長短邊
const edgeOrn=[
  `left:${W/2-EW/2}px;top:${EC-EH/2}px;width:${EW}px;height:${EH}px`,
  `left:${W/2-EW/2}px;top:${H-EC-EH/2}px;width:${EW}px;height:${EH}px`,
  `left:${EC-EH/2}px;top:${H/2-EW/2}px;width:${EH}px;height:${EW}px`,
  `left:${W-EC-EH/2}px;top:${H/2-EW/2}px;width:${EH}px;height:${EW}px`]
 .map((st,i)=>`<div class="eo" style="${st}">${ORN('var(--gold)',{long:false,scale:0.6,vert:i>1})}</div>`).join('');
const corners=[[26,26,0],[W-176,26,90],[W-176,H-176,180],[26,H-176,270]]
  .map(([l,t,r])=>`<div class="cnr" style="left:${l}px;top:${t}px;transform:rotate(${r}deg)">${CORNER('var(--gold)')}</div>`).join('');

const html=`<style>${CSS}</style><div class="menu">
${weekly(0,0,WIDE,CH)}
${cell('節慶禮盒',b64('gift'),WIDE,0,W-WIDE,CH)}
${cell('蛋糕',b64('cake'),0,CH,CW,CH)}
${cell('訂購須知',null,CW,CH,WIDE-CW,CH)}
${cell('聯絡我們',null,WIDE,CH,W-WIDE,CH)}
<div class="div h" style="left:${M}px;top:${CH-PAD/2}px;width:${W-M*2}px;height:${PAD}px">
  <span class="bar"></span>${ORN('var(--line)',{long:true})}<span class="bar"></span></div>
${vdiv(WIDE,0)}${vdiv(CW,CH)}${vdiv(WIDE,CH)}
<div class="edge o"></div><div class="edge i"></div><div class="edge t"></div>${corners}${edgeOrn}
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
 const cuts=[['1-1_1-2_本週特賞_雪花酥.png',WIDE,CH,0,0],['1-3_節慶禮盒.png',W-WIDE,CH,WIDE,0],
   ['2-1_蛋糕.png',CW,CH,0,CH],['2-2_訂購須知.png',WIDE-CW,CH,CW,CH],['2-3_聯絡我們.png',W-WIDE,CH,WIDE,CH]];
 if(!SLICE)return;
 for(const [f,w,h,x,y] of cuts){
   execSync(`convert ${JSON.stringify(full)} -crop ${w}x${h}+${x}+${y} +repage ${JSON.stringify(path.join(OUT,f))}`);
   console.log('✅',f);
 }
})();
