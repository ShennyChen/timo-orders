/**
 * 堤默烘焙 ‧ 多品項訂單後端擴充
 * ---------------------------------------------------------------
 * 一張訂單可以有多個商品，每個商品有自己的名稱、數量、金額。
 * 前端會多送一個 items 欄位（陣列），需要在 Orders 工作表多存一欄。
 *
 * 原本的 Code.gs 不在這個儲存庫裡，所以以下是依前端契約寫的做法，
 * 合併時請對照你實際的 doPost / 讀寫函式調整。
 *
 * 【沒做這一步會怎樣】
 * App 仍可正常使用，多品項也能輸入與加總，而且 product / quantity / amount
 * 三個欄位會存下正確的「摘要與合計」：
 *     product  = "雪花餅 ×6、蛋黃酥6入 ×1"
 *     quantity = 7
 *     amount   = 1680
 * 只是「拆開成幾項、各多少錢」的明細不會保留，下次編輯時會併成一個商品區塊。
 * App 偵測到這種情況會在同步列直接告訴你，不會默默吃掉資料。
 */

var ORDER_SHEET = 'Orders';
var ITEMS_HEADER = 'items';

/**
 * 確保 Orders 工作表有 items 欄；沒有就補在最後一欄。
 * 回傳 items 欄的欄號（1 起算），找不到也建不出來時回傳 0。
 */
function ensureItemsColumn_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sheet) return 0;

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];

  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === ITEMS_HEADER) return i + 1;
  }

  var col = lastCol + 1;
  sheet.getRange(1, col).setValue(ITEMS_HEADER);
  // 整欄設為純文字，避免試算表把 JSON 當成公式或數字解讀
  sheet.getRange(1, col, sheet.getMaxRows(), 1).setNumberFormat('@');
  return col;
}

/**
 * 寫入一筆訂單的 items（在既有的存檔流程之後呼叫）。
 * rowIndex 是該筆訂單所在的列號。
 */
function writeOrderItems_(rowIndex, items) {
  var col = ensureItemsColumn_();
  if (!col || !rowIndex) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  var json = '';

  if (Array.isArray(items) && items.length) {
    var clean = items.map(function (x) {
      return {
        product: String(x.product == null ? '' : x.product),
        quantity: Number(x.quantity) || 0,
        amount: Number(x.amount) || 0
      };
    });
    json = JSON.stringify(clean);
  }
  sheet.getRange(rowIndex, col).setValue(json);
}

/**
 * 讀出一筆訂單的 items，回傳陣列；沒有或解析失敗時回傳 null。
 */
function readOrderItems_(rowValues, headers) {
  var idx = headers.indexOf(ITEMS_HEADER);
  if (idx < 0) return null;

  var raw = rowValues[idx];
  if (!raw) return null;

  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (e) {
    return null;    // 內容壞掉就當作沒有明細，不讓整次讀取失敗
  }
}


/* ===============================================================
 * 合併方式
 * ===============================================================
 *
 * 1) 存檔：在既有的 save 流程寫完該列之後，多呼叫一次
 *
 *        writeOrderItems_(targetRow, payload.order.items);
 *
 *    targetRow 就是你原本用來寫入訂單的那一列列號。
 *
 * 2) 讀取：在組出每一筆訂單物件時，多帶一個 items
 *
 *        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
 *                           .getDisplayValues()[0];
 *        // …逐列組物件時…
 *        order.items = readOrderItems_(row, headers);
 *
 *    前端收到 items 為 null 或缺少時，會自動退回用
 *    product / quantity / amount 組成單一商品，不會出錯。
 *
 * 3) 重新部署網頁應用程式（部署 → 管理部署作業 → 編輯 → 新版本）。
 *
 * ===============================================================
 * 一併建議：根治訂單日期問題
 * ===============================================================
 *
 * 若訂單讀取仍在用 getValues()，日期欄會回傳 Date 物件，
 * JSON 序列化後變成帶時區的字串（台北午夜 = 前一天 16:00 UTC），
 * 這是交付日期被清空的根因。改成 getDisplayValues() 並對 due 欄
 * 做一次 setNumberFormat('@') 即可根治。
 * 詳見 規則/訂單資料分析.md 第 3 節。
 */
