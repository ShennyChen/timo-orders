/** 一次性設定既有表單區段。保留問題ID、回覆與原有試算表連結；可重跑。 */
function timoConfigureOrderSections() {
  var form = FormApp.openById('1QEQ5o4ZWBGvlae3E68pis8k_-jX4pq_Tn0cdrqqc4io');
  function find(title) { return form.getItems().filter(function(i) { return i.getTitle() === title; })[0]; }
  function need(title) { var i = find(title); if (!i) throw new Error('找不到問題：' + title); return i; }
  var choice = find('訂購類型') || need('訂購產品');
  choice = choice.asMultipleChoiceItem();
  var qty = need('雪花酥訂購包數').asListItem();
  var gift = need('節慶禮盒需求').asParagraphTextItem();
  var common = ['訂購人姓名','聯絡電話','LINE顯示名稱','希望交付日期','希望交付方式','備註',find('付款與運費同意') ? '付款與運費同意' : '訂購確認'].map(need);
  function page(title) { var i = find(title); return i ? i.asPageBreakItem() : form.addPageBreakItem().setTitle(title); }
  var weeklyPage = page('本週產品訂購');
  var giftPage = page('節慶禮盒訂購');
  var bothPage = page('本週產品＋節慶禮盒');
  var contactPage = page('聯絡與交付資料');
  var bothQty = find('雪花酥訂購包數（本週產品+節慶禮盒）') || find('雪花酥訂購包數（兩者都要）');
  bothQty = bothQty ? bothQty.asListItem() : form.addListItem().setTitle('雪花酥訂購包數（兩者都要）');
  var bothGift = find('節慶禮盒需求（本週產品+節慶禮盒）') || find('節慶禮盒需求（兩者都要）');
  bothGift = bothGift ? bothGift.asParagraphTextItem() : form.addParagraphTextItem().setTitle('節慶禮盒需求（兩者都要）');
  bothQty.setTitle('雪花酥訂購包數（本週產品+節慶禮盒）');
  bothGift.setTitle('節慶禮盒需求（本週產品+節慶禮盒）');
  var quantities = Array.from({length:10},function(_,i) { return (i+1)+'包'; });
  [qty,bothQty].forEach(function(i) { i.setChoiceValues(quantities).setRequired(true).setHelpText('雪花酥170g／包，NT$200。請選擇訂購包數。'); });
  [gift,bothGift].forEach(function(i) { i.setRequired(true).setHelpText('請填希望訂購的禮盒品項與盒數。當期品項、價格與供應情況請先透過官方 LINE 確認。'); });
  var ordered = [choice,weeklyPage,qty,giftPage,gift,bothPage,bothQty,bothGift,contactPage].concat(common);
  if (form.getItems().length !== ordered.length) throw new Error('表單有額外問題，請先檢查；未重新排序。');
  ordered.forEach(function(item,index) { form.moveItem(item.getIndex(),index); });
  choice.setTitle('訂購類型').setHelpText('選擇後按「下一步」，即可填寫對應的訂購欄位。').setRequired(true);
  choice.setChoices([choice.createChoice('本週產品',weeklyPage),choice.createChoice('節慶禮盒',giftPage),choice.createChoice('本週產品+節慶禮盒',bothPage)]);
  // PageBreak 的導航控制「它前一個區段」完成後的去向。
  weeklyPage.setGoToPage(FormApp.PageNavigationType.CONTINUE);
  giftPage.setGoToPage(contactPage);
  bothPage.setGoToPage(contactPage);
  contactPage.setGoToPage(FormApp.PageNavigationType.CONTINUE);
  weeklyPage.setHelpText('本週特賞：雪花酥170g／包，NT$200。');
  giftPage.setHelpText('此區只填節慶禮盒需求，不需填寫本週產品。');
  bothPage.setHelpText('請同時填寫本週產品數量與節慶禮盒需求。');
  form.setDescription('歡迎訂購 Timo 堤默烘焙！請先選擇訂購類型，再填寫對應商品。\n本週特賞：雪花酥170g／包，NT$200。\n節慶禮盒品項與價格請先透過官方 LINE 洽詢。\n送出後請回官方 LINE 告知訂購姓名；商品、金額與交付安排以 LINE 確認為準。客製蛋糕請直接透過 LINE 討論。');
  var consent=common[common.length-1].asCheckboxItem();
  var agreement='我同意宅配商品小計滿2000元免運，未滿2000元運費60元，自取免運費；並了解送出表單僅為訂購需求登記，須先支付全額商品款及應付運費，經確認收款後才接受訂單並安排製作。';
  consent.setTitle('付款與運費同意').setChoices([consent.createChoice(agreement)]).setRequired(true);
  consent.setHelpText('請先透過官方LINE確認完整品項、應付總額及付款資訊。尚未付款不會安排製作。');
  form.setDescription(form.getDescription()+'\n宅配：同一筆訂單商品小計滿2000元免運，未滿2000元收60元運費；自取免運費。\n請先支付全額款項（含應付運費），確認收款後才接受訂單並安排製作。');
  form.setConfirmationMessage('已收到您的訂購需求，這不是已接受訂單通知。請回官方 LINE 告知訂購姓名，確認商品、總額（含運費）及付款資訊。收到全額款項並確認後，才接受訂單及安排製作。請勿重複送出。');
  timoEnsurePolicyColumns_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders'));
  form.setProgressBar(true);
  console.log('區段設定完成：本週產品／節慶禮盒／兩者都要 → 對應商品 → 聯絡與交付資料。');
}
