const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='生成/訂單管理app/';
const policy=fs.readFileSync(root+'TimoOrderPolicy.gs','utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(policy,ctx);
for(const [subtotal,delivery,fee,total] of [[0,'宅配',60,60],[999,'宅配',60,1059],[1000,'宅配',60,1060],[1001,'宅配',60,1061],[1999,'宅配',60,2059],[2000,'宅配',0,2000],[2001,'宅配',0,2001],[200,'自取',0,200]]){
  const r=ctx.timoPricing_(subtotal,delivery,false);assert.equal(r.shipping,fee);assert.equal(r.amount,total);
}
assert.equal(ctx.timoPricing_(600,'宅配',true).shipping,'');
assert.equal(ctx.timoPricing_(600,'',false).pricingStatus,'待報價');
for(const status of ['已成立','製作中','待交付','已完成']){
  for(const payment of ['未付款','部分付款','已退款'])assert.throws(()=>ctx.timoCheckPayment_({status,payment,pricingStatus:'已報價'}));
  assert.doesNotThrow(()=>ctx.timoCheckPayment_({status,payment:'已付款',pricingStatus:'已報價'}));
  assert.throws(()=>ctx.timoCheckPayment_({status,payment:'已付款',pricingStatus:'待報價'}));
}
const base=['id','customer','contact','product','quantity','amount','due','delivery','payment','status','notes','updatedAt'];
function api(order){
  const rows=[base.slice()];
  const sheet={getLastColumn:()=>rows[0].length,getLastRow:()=>rows.length,
    getRange:(row,col,numRows=1,numCols=1)=>({getValues:()=>Array.from({length:numRows},(_,i)=>(rows[row-1+i]||[]).slice(col-1,col-1+numCols)),getDisplayValues:()=>Array.from({length:numRows},(_,i)=>(rows[row-1+i]||[]).slice(col-1,col-1+numCols).map(String)),setValue:v=>{rows[row-1][col-1]=v},setValues:values=>values.forEach((r,i)=>{rows[row-1+i]=r})}),
    appendRow:row=>rows.push(row),getDataRange:()=>({getValues:()=>rows})};
  const c={PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-only-secret-12345'})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>sheet}),flush(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this}})},Utilities:{formatDate:()=> '2026-11-22'},Session:{getScriptTimeZone:()=> 'Asia/Taipei'}};
  vm.createContext(c);vm.runInContext(policy+fs.readFileSync(root+'Code.gs','utf8'),c);
  const result=c.doPost({postData:{contents:JSON.stringify({action:'save',secret:'test-only-secret-12345',order})}});
  return {result:JSON.parse(result.text),rows};
}
const order={id:'test-order',customer:'測試',contact:'0900000000',product:'雪花酥',quantity:1,amount:200,due:'2026-11-22',delivery:'宅配',payment:'未付款',status:'待付款',notes:'',updatedAt:'',items:[{product:'雪花酥170g',quantity:1,price:200}],shipping:0,pricingStatus:'已報價'};
let r=api(order);assert.equal(r.result.ok,true);assert.equal(r.rows[1][5],260);assert.equal(r.rows[1][14],60);
r=api({...order,status:'製作中'});assert.equal(r.result.ok,false);assert.match(r.result.error,/全額/);
r=api({...order,status:'已成立',payment:'部分付款'});assert.equal(r.result.ok,false);
r=api({...order,status:'製作中',payment:'已付款'});assert.equal(r.result.ok,true);
r=api({...order,pricingStatus:'待報價'});assert.equal(r.result.ok,true);assert.equal(r.rows[1][5],0);assert.equal(r.rows[1][14],'');
const html=fs.readFileSync(root+'index.html','utf8');
const els=new Map();
function el(id){if(!els.has(id))els.set(id,{value:'',textContent:'',innerHTML:'',classList:{toggle(){},add(){}},querySelectorAll:()=>[],reset(){}});return els.get(id)}
const app={document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>'',removeItem(){}},sessionStorage:{removeItem(){}},fetch:()=>Promise.resolve({ok:false}),location:{search:'',pathname:'/'},window:{scrollTo(){}},alert:message=>{app.warning=message},console};
vm.createContext(app);vm.runInContext(html.split('<script>')[1].split('</script>')[0],app);
el('delivery').value='宅配';el('pricingStatus').value='已報價';vm.runInContext("orderItems=[{product:'雪花酥',quantity:4,price:200}];recalcTotal()",app);assert.equal(el('orderTotal').textContent,'NT$ 860');
vm.runInContext("orderItems=[{product:'雪花酥',quantity:5,price:200}];recalcTotal()",app);assert.equal(el('orderTotal').textContent,'NT$ 1,060');
vm.runInContext("orderItems=[{product:'雪花酥',quantity:9,price:200}];recalcTotal()",app);assert.equal(el('orderTotal').textContent,'NT$ 1,860');
vm.runInContext("orderItems=[{product:'雪花酥',quantity:10,price:200}];recalcTotal()",app);assert.equal(el('orderTotal').textContent,'NT$ 2,000');
el('pricingStatus').value='待報價';vm.runInContext('recalcTotal()',app);assert.equal(el('orderTotal').textContent,'待報價');
assert(!vm.runInContext("nextAction({status:'待付款',payment:'未付款',delivery:'宅配',pricingStatus:'已報價'})",app).includes('data-next'));
console.log('PASS: freight thresholds, pickup, pending quotes, API payment guards, server totals, App totals and blocked unpaid actions.');
