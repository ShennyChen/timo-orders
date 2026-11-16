/** 2026-11-16：商品小計滿2000宅配免運，未滿60；自取0；全額付款才接受及製作。 */
function timoPricing_(subtotal, delivery, pending) {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) throw new Error('商品小計必須是非負整數');
  if (pending || !['自取','宅配'].includes(delivery)) return {subtotal:subtotal,shipping:'',amount:0,pricingStatus:'待報價',shippingPolicyVersion:'20261116-2000'};
  var fee = delivery === '宅配' && subtotal < 2000 ? 60 : 0;
  return {subtotal:subtotal,shipping:fee,amount:subtotal+fee,pricingStatus:'已報價',shippingPolicyVersion:'20261116-2000'};
}
function timoCheckPayment_(order) {
  if (['已成立','製作中','待交付','已完成'].includes(order.status) && (order.payment !== '已付款' || order.pricingStatus !== '已報價')) {
    throw new Error('請先確認報價及收到全額款項，才能接受訂單或安排製作。');
  }
}
function timoEnsurePolicyColumns_(sheet) {
  var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  ['items','subtotal','shipping','pricingStatus','shippingPolicyVersion','paymentConsent'].forEach(function(h) {
    if (headers.indexOf(h)<0) { headers.push(h); sheet.getRange(1,headers.length).setValue(h); }
  });
  return headers;
}
