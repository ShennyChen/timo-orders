/**
 * 堤默烘焙 ‧ 記帳功能後端擴充
 * ---------------------------------------------------------------
 * 這不是完整的 Code.gs，是要「併入」現有 Code.gs 的片段。
 * 原本的 Code.gs 不在這個儲存庫裡，所以我沒看過它的實際寫法，
 * 合併時請對照你的 doPost 結構調整。
 *
 * 合併步驟：
 *   1. 把本檔全部內容貼到 Code.gs 最後面。
 *   2. 在 doPost 既有的 action 判斷中，加入 listExpenses 與 saveExpense
 *      兩個分支（見檔案最後的範例）。
 *   3. 重新部署網頁應用程式（部署 → 管理部署作業 → 編輯 → 新版本）。
 *
 * 部署後 App 的記帳才能儲存；在那之前記帳畫面只會顯示訂單營收，
 * 並提示後端尚未支援。
 */

var EXPENSE_SHEET = 'Expenses';
var EXPENSE_HEADERS = ['id', 'date', 'category', 'item', 'amount', 'notes', 'updatedAt'];

/**
 * 取得（必要時建立）支出工作表。
 *
 * 重點：date 欄位強制設為純文字格式。
 * 若不這樣做，Google 試算表會把 "2026-11-15" 自動轉成日期型別儲存格，
 * 讀回時變成帶時區的 ISO 字串（台北午夜 = 前一天 16:00 UTC，日期差一天），
 * 前端的 <input type="date"> 無法接受而靜默清空。
 * 訂單的 due 欄位就是踩到這個坑（見 規則/訂單資料分析.md 第 3 節）。
 */
function getExpenseSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EXPENSE_SHEET);
    sheet.getRange(1, 1, 1, EXPENSE_HEADERS.length).setValues([EXPENSE_HEADERS]);
    sheet.setFrozenRows(1);
  }
  // date 欄（第 2 欄）固定為純文字，避免自動轉型
  sheet.getRange(1, 2, sheet.getMaxRows(), 1).setNumberFormat('@');
  return sheet;
}

/**
 * 讀出全部支出。
 * 使用 getDisplayValues() 而非 getValues()：回傳的一律是字串，
 * 不會出現 Date 物件，因此不會被 JSON.stringify 轉成帶時區的 ISO 字串。
 */
function listExpenses_() {
  var sheet = getExpenseSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, EXPENSE_HEADERS.length).getDisplayValues();
  var out = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;              // 跳過沒有 id 的空列
    out.push({
      id: row[0],
      date: row[1],
      category: row[2],
      item: row[3],
      amount: Number(row[4]) || 0,
      notes: row[5],
      updatedAt: row[6]
    });
  }
  return out;
}

/**
 * 新增或更新一筆支出，回傳新的 updatedAt。
 * 以 id 比對：找得到就覆寫該列，找不到就附加到最後。
 */
function saveExpense_(expense) {
  if (!expense || !expense.id) throw new Error('缺少支出 id');
  if (!expense.date) throw new Error('缺少支出日期');

  var sheet = getExpenseSheet_();
  var updatedAt = new Date().toISOString();

  var row = [
    String(expense.id),
    String(expense.date).slice(0, 10),   // 只留 YYYY-MM-DD
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
 * 在 doPost 裡要加的分支（範例，請對照你現有的寫法調整）
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
 *
 *     return json_({ ok: false, error: '未知的 action：' + action });
 *   }
 *
 * 注意：回應一定要帶 apiVersion: 2，前端會檢查這個欄位。
 *
 * ===============================================================
 * 順便：訂單 due 欄位的根治做法
 * ===============================================================
 *
 * 現有的訂單讀取若使用 getValues()，日期欄會回傳 Date 物件，
 * 這就是交付日期被清空的根因。前端目前已加了防護（normDate），
 * 但根治應該在這裡：把訂單的讀取也改成 getDisplayValues()，
 * 並對 Orders 的 due 欄做一次 setNumberFormat('@')。
 */
