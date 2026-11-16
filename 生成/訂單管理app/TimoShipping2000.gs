/** 只更新免運門檻，不重建區段、不重算既有訂單、不移動商品照片。 */
function timoUpdateFreeShipping2000() {
  var form=FormApp.openById('1QEQ5o4ZWBGvlae3E68pis8k_-jX4pq_Tn0cdrqqc4io');
  function revised(text) {
    return String(text||'').replace(/((?:未)?滿\s*)(?:1,000|1000)(\s*元)/g,function(_,prefix,suffix){return prefix+'2,000'+suffix;});
  }
  var desc=revised(form.getDescription());
  var consent=form.getItems(FormApp.ItemType.CHECKBOX).filter(function(i){return i.getTitle()==='付款與運費同意';});
  if(consent.length!==1) throw new Error('找不到唯一的付款與運費同意，未更新表單。');
  var item=consent[0].asCheckboxItem();
  var oldChoices=item.getChoices();
  if(oldChoices.length!==1) throw new Error('同意選項數量已改變，未更新表單。');
  var agreement=revised(oldChoices[0].getValue());
  if(!agreement.includes('2,000')) throw new Error('無法確認同意文字中的2000元門檻。');
  var cases=[[999,'宅配',60],[1000,'宅配',60],[1999,'宅配',60],[2000,'宅配',0],[2001,'宅配',0],[1000,'自取',0]];
  cases.forEach(function(c){var p=timoPricing_(c[0],c[1],false);if(p.shipping!==c[2]||p.amount!==c[0]+c[2])throw new Error('運費門檻測試失敗：'+c[0]);});
  form.setDescription(desc);
  item.setChoices([item.createChoice(agreement)]).setRequired(true);
  form.setConfirmationMessage(revised(form.getConfirmationMessage()));
  console.log('表單門檻及必勾同意已更新為滿2,000元免運；自取免運。');
  console.log('運費測試通過：宅配1000→1060、1999→2059、2000→2000；既有訂單未重算。');
}
