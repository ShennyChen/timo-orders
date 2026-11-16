/** Timo 表單回覆 → Orders。安裝「試算表／提交表單時」觸發條件。 */
function timoImportFormOrder(e) {
  if (!e || !e.range || !e.source) throw new Error('請使用試算表提交表單觸發條件。');
  if (e.source.getId() !== '1z_b9lvF0I0ek9FkQK3v8YKxCZNsMxvN2IbRDqBuKuaA') return;
  var source = e.range.getSheet();
  if (source.getSheetId() !== 2087878160 || e.range.getRow() < 2) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var rowIndex = e.range.getRow();
    var width = source.getLastColumn();
    var labels = source.getRange(1, 1, 1, width).getDisplayValues()[0];
    var cells = source.getRange(rowIndex, 1, 1, width).getDisplayValues()[0];
    function answer(label, optional) {
      var i = labels.indexOf(label);
      if (i < 0) {
        if (optional) return '';
        throw new Error('表單缺少欄位：' + label);
      }
      var submitted = e.namedValues && e.namedValues[label];
      return String(submitted && submitted.length ? submitted[0] : cells[i]).trim();
    }
    var orders = e.source.getSheetByName('Orders');
    if (!orders) throw new Error('找不到 Orders 工作表');
    var headers = timoEnsurePolicyColumns_(orders);
    var required = ['id','customer','contact','product','quantity','amount','due','delivery','payment','status','notes','updatedAt'];
    required.forEach(function(h) { if (headers.indexOf(h) < 0) throw new Error('Orders 缺少欄位：' + h); });
    var id = 'FORM-' + source.getSheetId() + '-' + rowIndex;
    var idCol = headers.indexOf('id') + 1;
    if (orders.getLastRow() > 1) {
      var ids = orders.getRange(2, idCol, orders.getLastRow()-1, 1).getDisplayValues();
      if (ids.some(function(r) { return r[0] === id; })) return;
    }
    var category = answer('訂購類型', true) || answer('訂購產品', true);
    var both = category === '本週產品+節慶禮盒' || category === '兩者都要' || category === '本週特賞＋節慶禮盒';
    var giftOnly = category === '節慶禮盒';
    var quantityText = giftOnly ? '0包' : both ? answer('雪花酥訂購包數（本週產品+節慶禮盒）', true) || answer('雪花酥訂購包數（兩者都要）', true) || answer('雪花酥訂購包數', true) : answer('雪花酥訂購包數', true);
    if (!/^([0-9]|10)包$/.test(quantityText)) throw new Error('包數格式錯誤');
    var q = parseInt(quantityText, 10);
    var gift = both ? answer('節慶禮盒需求（本週產品+節慶禮盒）', true) || answer('節慶禮盒需求（兩者都要）', true) || answer('節慶禮盒需求', true) : giftOnly || !category ? answer('節慶禮盒需求', true) : '';
    if ((both || giftOnly) && !gift) throw new Error('請填寫節慶禮盒需求');
    if (category && !giftOnly && q < 1) throw new Error('本週產品至少訂購1包');
    var dueIndex = labels.indexOf('希望交付日期');
    var rawDue = source.getRange(rowIndex, dueIndex + 1).getValue();
    var due = rawDue instanceof Date ? Utilities.formatDate(rawDue, 'Asia/Taipei', 'yyyy-MM-dd') : answer('希望交付日期').replace(/\//g, '-');
    var requestedDelivery = answer('希望交付方式');
    var notes = ['來源：LINE 共用訂購表單', '訂購類型：' + (category || '舊版表單'), 'LINE顯示名稱：' + answer('LINE顯示名稱'), '希望交付方式：' + requestedDelivery];
    notes = notes.concat(timoDeliveryNotes_(requestedDelivery, answer));
    if (q) notes.push('雪花酥170g／包，NT$200 × ' + q + '，小計 NT$' + (q * 200));
    if (gift) notes.push('節慶禮盒需求：' + gift, '完整商品金額及運費待報價；目前金額0僅為待報價佔位，並非免費。');
    notes.push('宅配商品小計滿2000元免運，未滿2000元運費60元；自取免運費。', '先全額付款，確認收款後才接受訂單並安排製作。');
    if (!q && !gift) notes.push('未選購商品，請透過LINE確認需求。');
    if (answer('備註')) notes.push('顧客備註：' + answer('備註'));
    var product = [q ? '雪花酥170g' : '', gift ? '節慶禮盒（待確認）' : ''].filter(Boolean).join('、') || '訂購需求待確認';
    var delivery = ['宅配','小七取貨','郵局寄送'].indexOf(requestedDelivery) >= 0 ? '宅配' : requestedDelivery === '面交／自取' ? '自取' : '';
    var paymentConsent = answer('付款與運費同意',true) || answer('訂購確認',true);
    if (!paymentConsent) throw new Error('缺少付款及運費同意勾選');
    var pricing = timoPricing_(q*200,delivery,!!gift || (!q && !gift));
    var order = Object.assign({id:id, customer:answer('訂購人姓名'), contact:answer('聯絡電話'), product:product,
      quantity:q || 1, due:due, delivery:delivery,
      payment:'未付款', status:'待付款', paymentConsent:paymentConsent, notes:notes.join('\n'), updatedAt:new Date().toISOString()},pricing);
    var items=[];
    if(q) items.push({product:'雪花酥170g',quantity:q,price:200,amount:q*200});
    if(gift) items.push({product:'節慶禮盒（待報價，需求詳見備註）',quantity:1,price:0,amount:0});
    order.items=JSON.stringify(items);
    var values = headers.map(function(h) {
      var value = order[h] == null ? '' : order[h];
      return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value;
    });
    var target = orders.getRange(orders.getLastRow()+1, 1, 1, headers.length);
    target.setNumberFormat('@');
    target.setValues([values]);
    SpreadsheetApp.flush();
    source.getRange(rowIndex,1).setNote('已匯入訂單：' + id);
  } catch (err) {
    source.getRange(e.range.getRow(),1).setNote('匯入失敗，原始回覆仍保留：' + err.message);
    throw err;
  } finally { lock.releaseLock(); }
}

/** 將分流收件資料存入訂單備註，保留舊表單的相容性。 */
function timoDeliveryNotes_(method, answer) {
  var fields = method === '小七取貨' ? ['小七收件人大名','小七取貨門市','小七收件人手機號碼'] : method === '郵局寄送' ? ['郵局收件人大名','郵局收件地址','郵局收件人電話'] : [];
  return fields.map(function(label) {
    var value=answer(label,true);
    if(!value) throw new Error('缺少收件資料：'+label);
    return label+'：'+value;
  });
}
