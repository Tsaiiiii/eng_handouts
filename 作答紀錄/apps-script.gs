/* 英文講義作答紀錄：把這段程式貼到 Google 試算表的「擴充功能 → Apps Script」，
   部署成網頁應用程式後，單字講義和閱讀講義會把每次練習的成績寫進「作答紀錄」工作表。
   設定步驟見同資料夾的「設定說明.md」。 */

var SHEET = '作答紀錄';
var HEAD = ['時間', '學生', '類型', '講義', '練習', '答對', '題數', '正確率', '點錯次數', '提示次數', '花費秒數', '錯的地方'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var right = Number(d.right) || 0, total = Number(d.total) || 0;
    sheet_().appendRow([
      d.t ? new Date(d.t) : new Date(),
      text_(d.name),
      text_(d.kind) || '單字',
      text_(d.unit),
      text_(d.act),
      right,
      total,
      total ? right / total : '',
      Number(d.miss) || 0,
      Number(d.hint) || 0,
      d.secs === '' || d.secs == null ? '' : Number(d.secs) || 0,
      text_(d.wrong)
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// 用瀏覽器打開部署網址時會看到這句話，可以用來確認部署成功
function doGet() {
  return ContentService.createTextOutput('英文講義作答紀錄：服務正常運作');
}

// 學生輸入的文字一律當成文字存，不會被試算表當成公式
function text_(v) {
  return String(v == null ? '' : v).slice(0, 2000).replace(/^[=+\-@]/, "'$&");
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET, 0);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm');
    sh.getRange('H:H').setNumberFormat('0%');
  }
  return sh;
}
