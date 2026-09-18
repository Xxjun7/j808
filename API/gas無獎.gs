function doGet(e) {

  // ========================================
  // GAS 預熱
  // ========================================
  if (e.parameter.warmup === 'true') {
    return json({
      success: true,
      warmup: true
    });
  }


  // ========================================
  // 取得使用者輸入
  // ========================================
//  const uid = String(e.parameter.uid || '');
  const uid = String(e.parameter.uid || '').trim();
  const sheetName = String(e.parameter.sheetName || '會員');


  // ========================================
  // 空白輸入
  // ========================================
  if (uid === '') {
    return json({
      success: false,
      message: '缺少會員資料'
    });
  }


  // ========================================
  // 取得工作表
  // ========================================
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);


  if (!sheet) {
    return json({
      success: false,
      message: '找不到工作表：' + sheetName
    });
  }


  // ========================================
  // 取得最後一列
  // ========================================
  const lastRow = sheet.getLastRow();


  if (lastRow < 2) {
    return json({
      success: false,
      message: '沒有會員資料'
    });
  }


  // ========================================
  // 讀取 G 欄
  // 第 2 列開始
  // ========================================
  const values = sheet
    .getRange(2, 7, lastRow - 1, 1)
    .getDisplayValues();


  // ========================================
  // G 欄完全一致比對
  //
  // === 代表：
  // 1. 大小寫必須一致
  // 2. 字元必須一致
  // 3. 順序必須一致
  // 4. 前後空白也必須一致
  // ========================================
  let foundRow = -1;


  for (let i = 0; i < values.length; i++) {

    const cellValue = String(values[i][0]);

    if (cellValue === uid) {

      foundRow = i + 2;

      break;
    }
  }


  // ========================================
  // 查無會員
  // ========================================
  if (foundRow === -1) {
    return json({
      success: false,
      message: '查無會員'
    });
  }


  // ========================================
  // 取得同列 C 欄點數
  // ========================================
  const points = sheet
    .getRange(foundRow, 3)
    .getValue();


  // ========================================
  // 回傳結果
  // ========================================
  return json({
    success: true,
    uid: uid,
    points: points
  });
}


// ========================================
// JSON 回傳
// ========================================
function json(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
