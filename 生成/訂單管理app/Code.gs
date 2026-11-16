/** Timo 訂單 API。部署前在「專案設定 > 指令碼屬性」建立 TIMO_SECRET。 */
const SHEET_NAME = 'Orders';
const HEADERS = ['id','customer','contact','product','quantity','amount','due','delivery','payment','status','notes','updatedAt','items','subtotal','shipping','pricingStatus','shippingPolicyVersion','paymentConsent'];
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 20000) throw Error('請求格式錯誤');
    const body = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('TIMO_SECRET');
    if (!expected || expected.length < 16 || body.secret !== expected) throw Error('授權失敗');
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) { sheet=ss.insertSheet(SHEET_NAME);sheet.appendRow(HEADERS); }
      timoEnsurePolicyColumns_(sheet);
      if (HEADERS.some((h,i)=>sheet.getRange(1,1,1,HEADERS.length).getValues()[0][i]!==h)) throw Error('Orders 標題不符，請先檢查試算表');
      if (body.action === 'list') {
        const rows = sheet.getDataRange().getValues().slice(1);
        return json({ok:true,orders:rows.filter(r=>r[0]).map(r=>Object.fromEntries(HEADERS.map((h,i)=>[h,cellValue(h,r[i])])))});
      }
      if (body.action === 'save') {
        const o=body.order||{};
        if (!o.id || !o.customer || !o.product || !Number.isFinite(Number(o.quantity)) || Number(o.quantity)<1 || !Number.isFinite(Number(o.amount)) || Number(o.amount)<0) throw Error('訂單欄位不完整');
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(o.id) || !Number.isSafeInteger(o.quantity) || !Number.isSafeInteger(o.amount)) throw Error('編號、數量或金額格式錯誤');
        for (const [key,max] of Object.entries({customer:100,contact:100,product:200,due:10,delivery:10,payment:10,status:10,notes:2000})) {
          if (typeof o[key] !== 'string' || o[key].length>max) throw Error('欄位格式錯誤：'+key);
        }
        if (!o.customer.trim() || !o.product.trim() || !['自取','宅配',''].includes(o.delivery) || !['未付款','部分付款','已付款','已退款'].includes(o.payment) || !['待確認','待付款','已成立','製作中','待交付','已完成','已取消'].includes(o.status)) throw Error('名稱或狀態格式錯誤');
        if (o.due && (!/^\d{4}-\d{2}-\d{2}$/.test(o.due) || !Number.isFinite(Date.parse(o.due)) || new Date(o.due).toISOString().slice(0,10)!==o.due)) throw Error('交付日期不正確');
        var lines=[];
        if (Array.isArray(o.items) && o.items.length) {
          if(o.items.length>50) throw Error('商品項目過多');
          lines=o.items.map(function(it){
            if(!it || typeof it.product!=='string' || !it.product.trim() || it.product.length>200 || !Number.isSafeInteger(it.quantity) || it.quantity<1 || !Number.isSafeInteger(it.price) || it.price<0) throw Error('商品明細格式錯誤');
            var amount=it.quantity*it.price;
            if(!Number.isSafeInteger(amount)) throw Error('商品金額過大');
            return {product:it.product,quantity:it.quantity,price:it.price,amount:amount};
          });
        }
        var subtotal=lines.length?lines.reduce(function(t,it){return t+it.amount},0):Number(o.subtotal==null||o.subtotal===''?o.amount:o.subtotal);
        Object.assign(o,timoPricing_(subtotal,o.delivery,o.pricingStatus==='待報價'));
        if(lines.length){o.quantity=lines.reduce(function(t,it){return t+it.quantity},0);o.product=lines.map(function(it){return it.product}).join('、');}
        if(o.product.length>200) throw Error('商品名稱摘要過長');
        o.items=lines.length?JSON.stringify(lines):'';
        o.paymentConsent=String(o.paymentConsent||'');
        timoCheckPayment_(o);
        const safe=v=>{const s=String(v??'');return /^[\s\u0000-\u001f]*[=+\-@]/.test(s)?"'"+s:s};
        const ids=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat():[];
        const index=ids.findIndex(id=>id===o.id);
        const previous=index>=0?cellValue('updatedAt',sheet.getRange(index+2,12).getValues()[0][0]):'';
        if(index>=0 && (!o.updatedAt || o.updatedAt!==previous)) throw Error('此訂單已有更新，請先同步並重新開啟訂單，再套用修改');
        if(index<0 && o.updatedAt) throw Error('原訂單不存在，請先同步確認');
        const updatedAt=new Date(Math.max(Date.now(),(Date.parse(previous)||0)+1)).toISOString();
        const row=HEADERS.map(h=>h==='updatedAt'?updatedAt:['quantity','amount','subtotal','shipping'].includes(h) && o[h]!==''?Number(o[h]):safe(o[h]));
        if(index>=0)sheet.getRange(index+2,1,1,HEADERS.length).setValues([row]);else sheet.appendRow(row);
        SpreadsheetApp.flush();
        return json({ok:true,id:o.id,updatedAt});
      }
      throw Error('不支援的操作');
    } finally {lock.releaseLock()}
  } catch(err){return json({ok:false,error:String(err.message||err)})}
}
function cellValue(h,v){return v instanceof Date ? (h==='updatedAt'?v.toISOString():Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd')) : v}
function json(obj){return ContentService.createTextOutput(JSON.stringify({...obj,apiVersion:2,shippingPolicyVersion:'20261116-2000'})).setMimeType(ContentService.MimeType.JSON)}
