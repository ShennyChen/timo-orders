/** 保留既有商品區段及照片，新增依配送方式分流的必填收件資料。 */
function timoSetDeliverySections() {
  var form = FormApp.openById('1QEQ5o4ZWBGvlae3E68pis8k_-jX4pq_Tn0cdrqqc4io');
  function unique(title,type) {
    var matches=form.getItems(type).filter(function(i){return i.getTitle()===title;});
    if(matches.length!==1) throw new Error('欄位數量不符：'+title);
    return matches[0];
  }
  var delivery=unique('希望交付方式',FormApp.ItemType.MULTIPLE_CHOICE).asMultipleChoiceItem();
  var storeTitle='小七取貨｜收件資料';
  var postalTitle='郵局寄送｜收件資料';
  var storePages=form.getItems(FormApp.ItemType.PAGE_BREAK).filter(function(i){return i.getTitle()===storeTitle;});
  var postalPages=form.getItems(FormApp.ItemType.PAGE_BREAK).filter(function(i){return i.getTitle()===postalTitle;});
  var store,postal;
  if(!storePages.length && !postalPages.length) {
    store=form.addPageBreakItem().setTitle(storeTitle).setHelpText('請填寫收件人大名、小七門市及手機號碼。');
    form.addTextItem().setTitle('小七收件人大名').setRequired(true);
    form.addTextItem().setTitle('小七取貨門市').setHelpText('請填寫完整門市名稱及所在縣市；知道店號也可一併填寫。').setRequired(true);
    form.addTextItem().setTitle('小七收件人手機號碼').setRequired(true);
    postal=form.addPageBreakItem().setTitle(postalTitle).setHelpText('請填寫收件人大名、完整地址及聯絡電話。');
    form.addTextItem().setTitle('郵局收件人大名').setRequired(true);
    form.addParagraphTextItem().setTitle('郵局收件地址').setHelpText('請填寫郵遞區號、縣市、鄉鎮市區、路名、門牌及樓層。').setRequired(true);
    form.addTextItem().setTitle('郵局收件人電話').setRequired(true);
  } else {
    store=unique(storeTitle,FormApp.ItemType.PAGE_BREAK).asPageBreakItem();
    postal=unique(postalTitle,FormApp.ItemType.PAGE_BREAK).asPageBreakItem();
  }
  // PageBreak 的導覽設定控制其前一個區段：郵局前面的「小七」填完直接提交。
  postal.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  delivery.setChoices([
    delivery.createChoice('面交／自取',FormApp.PageNavigationType.SUBMIT),
    delivery.createChoice('小七取貨',store),
    delivery.createChoice('郵局寄送',postal),
    delivery.createChoice('先透過LINE討論',FormApp.PageNavigationType.SUBMIT)
  ]).setHelpText('小七或郵局：商品小計滿2,000元免運，未滿運費60元；自取免運。選擇配送方式後按下一步，填寫對應收件資料。').setRequired(true);
  Logger.log('配送分流已完成：小七／郵局各3個必填收件欄位，自取不填寄送資料。商品照片、付款同意及2000元免運門檻保留。');
}
