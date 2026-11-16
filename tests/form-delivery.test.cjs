const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='生成/訂單管理app/';
const src=fs.readFileSync(root+'TimoOrderPolicy.gs','utf8')+fs.readFileSync(root+'TimoFormImport.gs','utf8');
function submit(method,recipient){
 const answers={'訂購類型':'本週產品','雪花酥訂購包數':'5包','希望交付日期':'2026-11-22','希望交付方式':method,'LINE顯示名稱':'系統測試','訂購人姓名':'測試','聯絡電話':'0900000000','備註':'非實際訂單','付款與運費同意':'同意',...recipient};
 const labels=Object.keys(answers),values=Object.values(answers),rows=[['id','customer','contact','product','quantity','amount','due','delivery','payment','status','notes','updatedAt']];
 const orders={getLastColumn:()=>rows[0].length,getLastRow:()=>rows.length,getRange:(row,col,n=1,width=1)=>({getDisplayValues:()=>Array.from({length:n},(_,i)=>(rows[row-1+i]||[]).slice(col-1,col-1+width)),setValue:v=>rows[row-1][col-1]=v,setNumberFormat(){},setValues:vs=>vs.forEach((r,i)=>rows[row-1+i]=r)})};
 const source={getSheetId:()=>2087878160,getLastColumn:()=>labels.length,getRange:(row,col,n,width)=>({getDisplayValues:()=>[row===1?labels:values],getValue:()=>answers['希望交付日期'],setNote(){}})};
 const ctx={LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},SpreadsheetApp:{flush(){}},Utilities:{formatDate:()=> '2026-11-22'}};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 ctx.timoImportFormOrder({range:{getSheet:()=>source,getRow:()=>2},source:{getId:()=> '1z_b9lvF0I0ek9FkQK3v8YKxCZNsMxvN2IbRDqBuKuaA',getSheetByName:()=>orders},namedValues:Object.fromEntries(Object.entries(answers).map(([k,v])=>[k,[v]]))});
 return Object.fromEntries(rows[0].map((h,i)=>[h,rows[1][i]]));
}
for(const [method,recipient] of [['小七取貨',{'小七收件人大名':'取貨測試','小七取貨門市':'測試門市','小七收件人手機號碼':'0900000000'}],['郵局寄送',{'郵局收件人大名':'郵寄測試','郵局收件地址':'測試地址勿寄送','郵局收件人電話':'0200000000'}]]){
 const result=submit(method,recipient);assert.equal(result.delivery,'宅配');assert.equal(result.subtotal,1000);assert.equal(result.shipping,60);assert.equal(result.amount,1060);assert.equal(result.status,'待付款');
 for(const [key,value] of Object.entries(recipient))assert(result.notes.includes(key+'：'+value));
 assert.throws(()=>submit(method,{}),/缺少收件資料/);
}
assert.equal(submit('面交／自取',{}).shipping,0);
assert.equal(submit('宅配',{}).shipping,60);
console.log('PASS: small7/postal required recipient data imported into notes, freight, pickup and legacy compatibility.');
