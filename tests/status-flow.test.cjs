/* 付款確認即代表接單，中間不再有「接受訂單」這一步。
   收款後下一顆按鈕必須直接是「開始製作」。 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('生成/訂單管理app/index.html','utf8');
const els=new Map();
function el(id){if(!els.has(id)){const classes=new Set();els.set(id,{value:'',textContent:'',innerHTML:'',classList:{toggle(n,s){if(s)classes.add(n);else classes.delete(n)},add(n){classes.add(n)},contains:n=>classes.has(n)},querySelectorAll:()=>[],reset(){}})}return els.get(id)}
const ctx={document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>'',removeItem(){}},sessionStorage:{removeItem(){}},fetch:()=>Promise.resolve({ok:false}),location:{search:'',pathname:'/'},window:{scrollTo(){}},console};
vm.createContext(ctx);
vm.runInContext(html.split('<script>')[1].split('</script>')[0],ctx);

const flow=vm.runInContext('flow',ctx);

// 1. 任何狀態都不該再出現「接受訂單」按鈕
for(const [status,step] of Object.entries(flow))
  assert.notEqual(step[0],'接受訂單',status+' 仍有「接受訂單」這一步');

// 2. 尚未開工的訂單，下一步一律是「開始製作」→「製作中」
for(const status of ['待確認','待付款','已成立'])
  assert.deepEqual([...flow[status]],['開始製作','製作中'],status+' 的下一步不是開始製作');

// 3. 製作之後的順序維持不變
assert.deepEqual([...flow["製作中"]],['完成製作','待交付']);
assert.deepEqual([...flow["待交付"]],['已交付','已完成']);

// 4. 已完成與已取消沒有下一步
for(const status of ['已完成','已取消'])
  assert.equal(flow[status],undefined,status+' 不該還有下一步');

// 5. 確認收款時，待付款／待確認要自動變成「已成立」
const saved=[];
ctx.capture=o=>{saved.push(o);return Promise.resolve()};
vm.runInContext('saveOrder=capture;noteIfArchived=()=>{}',ctx);
const order={id:'x',status:'待付款',payment:'未付款',pricingStatus:'已報價',delivery:'宅配'};
ctx.ordersForTest=[order];
vm.runInContext('data=ordersForTest;markPaid("x")',ctx);
assert.equal(saved.length,1,'markPaid 沒有存檔');
assert.equal(saved[0].payment,'已付款');
assert.equal(saved[0].status,'已成立','收款後訂單沒有自動成立');

// 6. 已經開工的訂單補登收款時，不可把狀態倒回「已成立」
saved.length=0;
ctx.ordersForTest=[{id:'y',status:'製作中',payment:'部分付款',pricingStatus:'已報價',delivery:'自取'}];
vm.runInContext('data=ordersForTest;markPaid("y")',ctx);
assert.equal(saved[0].status,'製作中','補登收款時狀態被改掉了');

console.log('status-flow: 6 項檢查全部通過');
