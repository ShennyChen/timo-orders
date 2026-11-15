const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const {execSync}=require('child_process');
const DIR=__dirname;
const FONT=process.argv[2]||'LXGW WenKai TC';
const OUT=process.argv[3]||'/home/user/timo-orders/生成/官方line/圖文選單';
const SLICE=process.argv[4]!=='no';
const b64=n=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,n+'.b64'),'utf8');

const W=2500,H=1686,CW=833,CH=843,WIDE=1667;
const WEEKLY={name:'雪花酥',photo:'snow',spec:'850g／包',price:'200元'};

/* ── 巴洛克花草語彙（取自 logo 兩側裝飾）──────────────────
   六瓣花＋雙層尖葉＋藤蔓渦卷。長分線用繁版，短的用簡版。      */
const FLOWER=(cx,cy,r,c)=>{let p='';
  for(let k=0;k<6;k++){const a=k*60*Math.PI/180,
    x=(cx+Math.cos(a)*r*0.92).toFixed(1), y=(cy+Math.sin(a)*r*0.92).toFixed(1);
    p+=`<ellipse cx="${x}" cy="${y}" rx="${(r*0.64).toFixed(1)}" ry="${(r*0.44).toFixed(1)}" transform="rotate(${k*60} ${x} ${y})"/>`;}
  return `<g fill="${c}">${p}<circle cx="${cx}" cy="${cy}" r="${(r*0.46).toFixed(1)}"/></g>`;};

const _wing=(c,long)=>`
 <path d="M250 60 C228 53 204 40 178 19 C182 43 197 58 222 65 C236 68 245 66 250 60 Z"/>
 <path d="M250 60 C228 67 204 80 178 101 C182 77 197 62 222 55 C236 52 245 54 250 60 Z"/>
 <path d="M240 60 C224 51 209 38 196 19 C198 38 208 51 223 58 Z" opacity=".5"/>
 <path d="M240 60 C224 69 209 82 196 101 C198 82 208 69 223 62 Z" opacity=".5"/>
 ${long?`
 <path d="M178 60 C166 60 155 60 144 60" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
 ${FLOWER(128,60,16,c)}
 <path d="M112 60 C102 60 94 60 86 60" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
 <path d="M86 60 C60 60 42 45 42 26 C42 11 60 5 69 18 C77 30 62 45 48 38" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
 <path d="M86 60 C75 82 54 98 26 105 C42 80 62 65 86 60 Z"/>
 <path d="M72 60 C64 73 51 84 32 90 C42 73 55 64 72 60 Z" opacity=".45"/>
 ${FLOWER(16,60,11,c)}`:`
 <path d="M178 60 C166 60 156 60 146 60" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
 ${FLOWER(126,60,14,c)}`}`;

function ORN(c,{long=true,vert=false,scale=1}={}){
  const vx=long?0:98, vw=long?560:364, vh=120;
  const body=`${FLOWER(280,60,27,c)}
   <path d="M280 8 C289 26 294 37 294 45 C294 51 288 56 280 56 C272 56 266 51 266 45 C266 37 271 26 280 8 Z"/>
   <path d="M280 112 C289 94 294 83 294 75 C294 69 288 64 280 64 C272 64 266 69 266 75 C266 83 271 94 280 112 Z"/>
   ${_wing(c,long)}<g transform="translate(560,0) scale(-1,1)">${_wing(c,long)}</g>`;
  const w=vw*0.54*scale, h=vh*0.54*scale;
  if(!vert) return `<svg width="${w}" height="${h}" viewBox="${vx} 0 ${vw} ${vh}" fill="${c}" style="flex:0 0 auto">${body}</svg>`;
  const cx=vx+vw/2, cy=vh/2;
  return `<svg width="${h}" height="${w}" viewBox="${cx-vh/2} ${cy-vw/2} ${vh} ${vw}" fill="${c}" style="flex:0 0 auto">
    <g transform="rotate(90 ${cx} ${cy})">${body}</g></svg>`;
}
/* 標題下方：藤蔓飾線，中央花朵、兩側葉片、末端小花 */
const RULE=(c,w)=>`<svg width="${w}" height="${w*0.13}" viewBox="0 0 400 52" fill="${c}" style="opacity:.95">
 ${FLOWER(200,26,15,c)}
 <path d="M174 26 C158 16 142 10 122 8 C134 20 152 26 174 26 Z"/>
 <path d="M174 26 C158 36 142 42 122 44 C134 32 152 26 174 26 Z"/>
 <path d="M226 26 C242 16 258 10 278 8 C266 20 248 26 226 26 Z"/>
 <path d="M226 26 C242 36 258 42 278 44 C266 32 248 26 226 26 Z"/>
 <path d="M122 26 C106 26 92 26 78 26" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
 <path d="M278 26 C294 26 308 26 322 26" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
 ${FLOWER(62,26,10,c)}${FLOWER(338,26,10,c)}</svg>`;
/* 外框四角：雙弧藤蔓＋渦卷＋葉片＋花朵 */
const CORNER=c=>`<svg width="180" height="180" viewBox="0 0 180 180" fill="${c}">
 <g fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round">
   <path d="M12 92 C12 48 48 12 92 12"/>
   <path d="M12 128 C12 64 64 12 128 12" opacity=".5"/>
   <path d="M92 12 C110 12 124 19 134 31"/>
   <path d="M12 92 C12 110 19 124 31 134"/>
   <path d="M134 31 C146 31 154 24 154 14 C154 5 143 3 140 11 C137 19 146 22 152 18"/>
   <path d="M31 134 C31 146 24 154 14 154 C5 154 3 143 11 140 C19 137 22 146 18 152"/>
 </g>
 <path d="M92 12 C106 12 119 19 130 31 C112 33 98 26 92 12 Z"/>
 <path d="M12 92 C12 106 19 119 31 130 C33 112 26 98 12 92 Z"/>
 <path d="M62 20 C76 25 86 33 90 44 C75 45 63 37 62 20 Z" opacity=".6"/>
 <path d="M20 62 C25 76 33 86 44 90 C45 75 37 63 20 62 Z" opacity=".6"/>
 <path d="M52 27 C60 39 64 47 62 53 C60 59 52 65 40 73 C38 59 40 49 44 43 C47 38 49 32 52 27 Z" opacity=".65"/>
 ${FLOWER(42,42,14,c)}</svg>`;

/* ── 古典證書框：四邊連續捲草鏈＋上下大型花冠 ───────────── */
const G='%23BE9F56';
const TILE_V=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='96'><g fill='none' stroke='${G}' stroke-width='5.5' stroke-linecap='round'><path d='M36 0 L36 26'/><path d='M36 26 C22 26 13 35 13 46 C13 55 25 57 28 49 C31 41 22 37 15 42'/><path d='M36 26 L36 60'/><path d='M36 60 C50 60 59 69 59 80 C59 89 47 91 44 83 C41 75 50 71 57 76'/><path d='M36 60 L36 96'/></g><g fill='${G}' opacity='.75'><path d='M36 31 C29 35 24 42 22 51 C31 47 36 40 36 31 Z'/><path d='M36 65 C43 69 48 76 50 85 C41 81 36 74 36 65 Z'/></g></svg>")`;
const TILE_H=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='72'><g fill='none' stroke='${G}' stroke-width='5.5' stroke-linecap='round'><path d='M0 36 L26 36'/><path d='M26 36 C26 22 35 13 46 13 C55 13 57 25 49 28 C41 31 37 22 42 15'/><path d='M26 36 L60 36'/><path d='M60 36 C60 50 69 59 80 59 C89 59 91 47 83 44 C75 41 71 50 76 57'/><path d='M60 36 L96 36'/></g><g fill='${G}' opacity='.75'><path d='M31 36 C35 29 42 24 51 22 C47 31 40 36 31 36 Z'/><path d='M65 36 C69 43 76 48 85 50 C81 41 74 36 65 36 Z'/></g></svg>")`;
/* 上下中央的大型花冠 */
const CREST=(c,flip)=>`<svg width="620" height="150" viewBox="0 0 620 150" fill="${c}"
  style="${flip?'transform:scaleY(-1);':''}">
 <g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round">
  <path d="M310 118 C258 118 224 104 196 82 C172 63 146 52 118 56 C96 59 88 76 100 88 C112 100 132 92 128 76"/>
  <path d="M310 118 C362 118 396 104 424 82 C448 63 474 52 502 56 C524 59 532 76 520 88 C508 100 488 92 492 76"/>
  <path d="M196 82 C178 94 158 102 136 104"/>
  <path d="M424 82 C442 94 462 102 484 104"/>
 </g>
 <path d="M310 112 C292 104 276 90 266 70 C286 78 302 92 310 112 Z"/>
 <path d="M310 112 C328 104 344 90 354 70 C334 78 318 92 310 112 Z"/>
 <path d="M238 96 C224 94 210 88 198 78 C214 76 228 82 238 96 Z" opacity=".8"/>
 <path d="M382 96 C396 94 410 88 422 78 C406 76 392 82 382 96 Z" opacity=".8"/>
 ${FLOWER(310,60,30,c)}
 <path d="M310 14 C320 32 326 44 326 53 C326 60 319 66 310 66 C301 66 294 60 294 53 C294 44 300 32 310 14 Z"/>
 ${FLOWER(246,80,15,c)}${FLOWER(374,80,15,c)}
 ${FLOWER(112,76,13,c)}${FLOWER(508,76,13,c)}
 <circle cx="166" cy="98" r="6"/><circle cx="454" cy="98" r="6"/>
</svg>`;

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=${FONT.replace(/ /g,'+')}:wght@300;400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#4A423C;--line:#5A5049;--taupe:#7D726B;--rose:#A8646D;--gold:#BE9F56;--cream:#FCF9F5}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:"${FONT}","Noto Serif TC",serif;color:var(--ink);background:var(--cream)}
.menu{position:relative;width:${W}px;height:${H}px;background:var(--cream)}
.grain{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(118deg,rgba(120,105,95,.045) 0 2px,transparent 2px 9px),
             radial-gradient(130% 95% at 50% 0%,rgba(255,255,255,.65),transparent 62%),
             radial-gradient(120% 90% at 50% 100%,rgba(176,152,140,.14),transparent 58%)}
/* 整幅外框：雙線＋四角花飾 */
.edge{position:absolute;z-index:5;pointer-events:none;border:3px solid var(--gold);opacity:.85}
.edge.o{inset:18px;border-width:3px;opacity:.8}.edge.i{inset:112px;border-width:2px;opacity:.7}.edge.t{inset:122px;border-width:1px;opacity:.45}.chain{position:absolute;z-index:5;pointer-events:none;opacity:.95}.chain.h{height:72px;background-image:${TILE_H};background-repeat:repeat-x;background-position:center}.chain.v{width:72px;background-image:${TILE_V};background-repeat:repeat-y;background-position:center}.crest{position:absolute;z-index:6;pointer-events:none;left:50%;transform:translateX(-50%)}
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
.bar{flex:1}
.div.h .bar{height:17px;background:linear-gradient(to bottom,var(--gold) 0 2.5px,transparent 2.5px 6px,var(--line) 6px 11px,transparent 11px 14.5px,var(--gold) 14.5px 17px)}
.div.v .bar{width:17px;background:linear-gradient(to right,var(--gold) 0 2.5px,transparent 2.5px 6px,var(--line) 6px 11px,transparent 11px 14.5px,var(--gold) 14.5px 17px)}
`;

const sz=t=>160;   // 五格一律同字級，不因字數少就放大
const cell=(t,img,x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  ${img?`<div class="photo"><img src="${img}"></div>`:''}
  <div class="mid">${ORN('var(--gold)',{long:false,scale:1.05})}
    <div class="title" style="font-size:${sz(t)}px;letter-spacing:.14em;text-indent:.14em">${t}</div>
    ${RULE('var(--gold)',380)}
  </div></div>`;

const weekly=(x,y,w,h)=>`<div class="cell" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex">
 <div style="position:relative;width:${CW}px;height:100%;overflow:hidden">
   <div class="photo"><img src="${b64(WEEKLY.photo)}"></div>
   <div style="position:absolute;right:0;top:0;width:300px;height:100%;z-index:1;
     background:linear-gradient(to right,rgba(252,249,245,0),var(--cream) 88%)"></div>
   <div class="mid"><div class="title" style="font-size:196px;letter-spacing:.1em;text-indent:.1em">${WEEKLY.name}</div>
     ${RULE('var(--gold)',350)}</div>
 </div>
 <div style="position:relative;flex:1;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:20px">
   <div class="eyebrow">本週特賞</div>${ORN('var(--gold)',{long:false,scale:1.05})}
   <div style="font-size:78px;font-weight:400;letter-spacing:.1em;color:var(--taupe);white-space:nowrap">${WEEKLY.spec}</div>
   <div style="font-size:138px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap">${WEEKLY.price}</div>
 </div></div>`;

const M=150, PAD=70;
const vdiv=(x,y)=>`<div class="div v" style="left:${x-PAD/2}px;top:${y+M}px;width:${PAD}px;height:${CH-M*2}px">
  <span class="bar"></span>${ORN('var(--line)',{long:false,vert:true})}<span class="bar"></span></div>`;
const EC=39, EW=168, EH=62;   // 框線中心、襯底長短邊
const edgeOrn=[
  `left:${W/2-EW/2}px;top:${EC-EH/2}px;width:${EW}px;height:${EH}px`,
  `left:${W/2-EW/2}px;top:${H-EC-EH/2}px;width:${EW}px;height:${EH}px`,
  `left:${EC-EH/2}px;top:${H/2-EW/2}px;width:${EH}px;height:${EW}px`,
  `left:${W-EC-EH/2}px;top:${H/2-EW/2}px;width:${EH}px;height:${EW}px`]
 .map((st,i)=>`<div class="eo" style="${st}">${ORN('var(--gold)',{long:false,scale:0.6,vert:i>1})}</div>`).join('');
const corners=[[22,22,0],[W-202,22,90],[W-202,H-202,180],[22,H-202,270]]
  .map(([l,t,r])=>`<div class="cnr" style="left:${l}px;top:${t}px;width:180px;height:180px;transform:rotate(${r}deg)">${CORNER('var(--gold)')}</div>`).join('');

const html=`<style>${CSS}</style><div class="menu">
${weekly(0,0,WIDE,CH)}
${cell('節慶禮盒',b64('gift'),WIDE,0,W-WIDE,CH)}
${cell('蛋糕',b64('cake'),0,CH,CW,CH)}
${cell('訂購須知',null,CW,CH,WIDE-CW,CH)}
${cell('聯絡我們',null,WIDE,CH,W-WIDE,CH)}
<div class="div h" style="left:${M}px;top:${CH-PAD/2}px;width:${W-M*2}px;height:${PAD}px">
  <span class="bar"></span>${ORN('var(--line)',{long:true})}<span class="bar"></span></div>
${vdiv(WIDE,0)}${vdiv(CW,CH)}${vdiv(WIDE,CH)}
<div class="edge o"></div><div class="edge i"></div><div class="edge t"></div><div class="chain h" style="left:96px;top:26px;right:96px"></div><div class="chain h" style="left:96px;bottom:26px;right:96px"></div><div class="chain v" style="top:96px;left:26px;bottom:96px"></div><div class="chain v" style="top:96px;right:26px;bottom:96px"></div><div class="crest" style="top:4px">${CREST('var(--gold)',false)}</div><div class="crest" style="bottom:4px">${CREST('var(--gold)',true)}</div>${corners}${edgeOrn}
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
