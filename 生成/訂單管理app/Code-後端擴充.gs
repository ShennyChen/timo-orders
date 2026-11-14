/**
 * 堤默烘焙 ‧ Apps Script 後端擴充（合併版）
 * ===============================================================
 * 這不是完整的 Code.gs，是要「併入」現有 Code.gs 的片段。
 * 原本的 Code.gs 不在這個儲存庫裡，所以以下是依前端契約寫的做法，
 * 合併時請對照你實際的 doPost / 讀寫函式調整。
 *
 * 一次處理四件事：
 *   1. 收支紀錄   —— 新增 Expenses 工作表與 listExpenses / saveExpense
 *   2. 多品項訂單 —— Orders 多一個 items 欄，存每筆訂單的商品明細
 *   3. 刪除訂單   —— 新增 delete
 *   4. 日期根治   —— 改掉交付日期被清空的根因（見最後一節）
 *
 * 做完這一份，App 目前所有「後端尚未支援」的提示都會消失。
 *
 * 合併步驟：
 *   1. 把本檔全部內容貼到 Code.gs 最後面。
 *   2. 依最後兩節的說明，改 doPost 與訂單的讀寫。
 *   3. 重新部署（部署 → 管理部署作業 → 編輯 → 新版本）。
 */

var ORDER_SHEET = 'Orders';
var EXPENSE_SHEET = 'Expenses';
var ITEMS_HEADER = 'items';
var EXPENSE_HEADERS = ['id', 'date', 'category', 'item', 'amount', 'notes', 'updatedAt'];


/* ===============================================================
 * 1. 收支紀錄
 * =============================================================== */

/**
 * 取得（必要時建立）支出工作表。
 *
 * date 欄強制設為純文字格式：否則試算表會把 "2026-11-15" 自動轉成
 * 日期型別，讀回時變成帶時區的 ISO 字串而被前端的日期欄位拒收。
 * 訂單的 due 欄就是踩到這個坑（見第 4 節）。
 */
function getExpenseSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EXPENSE_SHEET);
    sheet.getRange(1, 1, 1, EXPENSE_HEADERS.length).setValues([EXPENSE_HEADERS]);
    sheet.setFrozenRows(1);
  }
  sheet.getRange(1, 2, sheet.getMaxRows(), 1).setNumberFormat('@');
  return sheet;
}

/** 讀出全部支出。用 getDisplayValues 確保回傳字串而非 Date 物件。 */
function listExpenses_() {
  var sheet = getExpenseSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, EXPENSE_HEADERS.length).getDisplayValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    out.push({
      id: row[0], date: row[1], category: row[2], item: row[3],
      amount: Number(row[4]) || 0, notes: row[5], updatedAt: row[6]
    });
  }
  return out;
}

/** 新增或更新一筆支出（以 id 比對），回傳新的 updatedAt。 */
function saveExpense_(expense) {
  if (!expense || !expense.id) throw new Error('缺少支出 id');
  if (!expense.date) throw new Error('缺少支出日期');

  var sheet = getExpenseSheet_();
  var updatedAt = new Date().toISOString();
  var row = [
    String(expense.id),
    String(expense.date).slice(0, 10),
    String(expense.category || '其他'),
    String(expense.item || ''),
    Number(expense.amount) || 0,
    String(expense.notes || ''),
    updatedAt
  ];

  var lastRow = sheet.getLastRow();
  var targetRow = 0;
  if (lastRow >= 2) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === String(expense.id)) { targetRow = i + 2; break; }
    }
  }
  if (!targetRow) targetRow = lastRow + 1;

  sheet.getRange(targetRow, 1, 1, EXPENSE_HEADERS.length).setValues([row]);
  return updatedAt;
}


/* ===============================================================
 * 2. 多品項訂單
 * =============================================================== */

/** 確保 Orders 有 items 欄；沒有就補在最後一欄。回傳欄號，失敗回 0。 */
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
  // 整欄純文字，避免 JSON 被當成公式或數字
  sheet.getRange(1, col, sheet.getMaxRows(), 1).setNumberFormat('@');
  return col;
}

/** 寫入一筆訂單的商品明細（在既有存檔流程寫完該列之後呼叫）。 */
function writeOrderItems_(rowIndex, items) {
  var col = ensureItemsColumn_();
  if (!col || !rowIndex) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  var json = '';
  if (Array.isArray(items) && items.length) {
    json = JSON.stringify(items.map(function (x) {
      return {
        product: String(x.product == null ? '' : x.product),
        quantity: Number(x.quantity) || 0,
        price: Number(x.price) || 0,
        amount: Number(x.amount) || 0
      };
    }));
  }
  sheet.getRange(rowIndex, col).setValue(json);
}

/** 讀出一筆訂單的商品明細；沒有或壞掉時回傳 null（前端會自動退回單一商品）。 */
function readOrderItems_(rowValues, headers) {
  var idx = headers.indexOf(ITEMS_HEADER);
  if (idx < 0) return null;
  var raw = rowValues[idx];
  if (!raw) return null;
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (e) {
    return null;
  }
}


/* ===============================================================
 * 3. 刪除訂單
 * =============================================================== */

/**
 * 依 id 刪除一列訂單。
 *
 * expectedUpdatedAt 是前端手上那筆的版本；若與試算表現況不同，
 * 代表另一支手機剛改過，這時拒絕刪除而不是蓋掉對方的修改。
 * 傳空字串則略過這項檢查。
 */
function deleteOrder_(id, expectedUpdatedAt) {
  if (!id) throw new Error('缺少訂單 id');

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sheet) throw new Error('找不到 Orders 工作表');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('找不到這筆訂單');

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var idCol = headers.indexOf('id');
  var updCol = headers.indexOf('updatedAt');
  if (idCol < 0) throw new Error('Orders 缺少 id 欄');

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][idCol] !== String(id)) continue;

    if (expectedUpdatedAt && updCol >= 0 && values[i][updCol] &&
        values[i][updCol] !== String(expectedUpdatedAt)) {
      throw new Error('這筆訂單已被另一支手機修改，請先重新整理再刪除');
    }
    sheet.deleteRow(i + 2);
    return true;
  }
  throw new Error('找不到這筆訂單');
}


/* ===============================================================
 * 4. 要在 doPost 加的分支（範例，請對照你現有的寫法調整）
 * ===============================================================
 *
 *   function doPost(e) {
 *     var payload = JSON.parse(e.postData.contents);
 *
 *     if (payload.secret !== PROPS.getProperty('TIMO_SECRET')) {
 *       return json_({ ok: false, error: '授權失敗' });
 *     }
 *
 *     var action = payload.action;
 *
 *     // …原本的 list / save…
 *
 *     if (action === 'listExpenses') {
 *       return json_({ ok: true, apiVersion: 2, expenses: listExpenses_() });
 *     }
 *     if (action === 'saveExpense') {
 *       return json_({ ok: true, apiVersion: 2, updatedAt: saveExpense_(payload.expense) });
 *     }
 *     if (action === 'delete') {
 *       deleteOrder_(payload.id, payload.updatedAt);
 *       return json_({ ok: true, apiVersion: 2 });
 *     }
 *
 *     return json_({ ok: false, error: '未知的 action：' + action });
 *   }
 *
 * 回應一定要帶 apiVersion: 2，前端會檢查這個欄位。
 *
 *
 * 訂單的存檔流程，在寫完該列之後多一行：
 *
 *     writeOrderItems_(targetRow, payload.order.items);
 *
 * 訂單的讀取流程，組物件時多帶一個 items：
 *
 *     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
 *                        .getDisplayValues()[0];
 *     // …逐列組物件時…
 *     order.items = readOrderItems_(row, headers);
 *
 *
 * ===============================================================
 * 5. 根治交付日期被清空的問題
 * ===============================================================
 *
 * 若訂單讀取仍在用 getValues()，日期欄會回傳 Date 物件，
 * JSON 序列化後變成帶時區的字串（台北午夜 = 前一天 16:00 UTC），
 * 前端的 <input type="date"> 無法接受而靜默清空。
 *
 * 兩個動作即可根治：
 *
 *   a) 訂單讀取改用 getDisplayValues()，不要用 getValues()
 *   b) 對 Orders 的 due 欄執行一次：
 *
 *        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
 *        sheet.getRange(1, 7, sheet.getMaxRows(), 1).setNumberFormat('@');
 *        // 第 7 欄 = due，若欄位順序不同請自行調整
 *
 * 前端目前已有 normDate() 防護，做完這兩步後它就只是保險。
 * 詳見 規則/訂單資料分析.md 第 3 節。
 */
