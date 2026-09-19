function doGet(e) {

  // ========================================
  // 取得參數
  // ========================================
  const params = e.parameter || {};

  const action =
    String(params.action || 'member').trim();

  const uid =
    String(params.uid || '').trim();


  // ========================================
  // GAS 預熱
  // ========================================
  if (params.warmup === 'true') {

    return json({
      success: true,
      warmup: true
    });

  }


  // ========================================
  // 兌換獎品
  // action = rewards
  // 讀取「兌換DM」
  // ========================================
  if (action === 'rewards') {

    return getRewards();

  }


  // ========================================
  // 預設：會員查詢
  // ========================================
  return getMember(uid);

}


// ========================================
// 會員查詢
// 工作表：會員
// G欄 = 會員號＋貴賓本名
// C欄 = 點數
// ========================================
function getMember(uid) {

  // ========================================
  // 空白輸入
  // ========================================
  if (uid === '') {

    return json({
      success: false,
      type: 'member',
      message: '缺少會員資料'
    });

  }


  // ========================================
  // 取得「會員」工作表
  // ========================================
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('會員');


  if (!sheet) {

    return json({
      success: false,
      type: 'member',
      message: '找不到工作表：會員'
    });

  }


  // ========================================
  // 最後一列
  // ========================================
  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {

    return json({
      success: false,
      type: 'member',
      message: '沒有會員資料'
    });

  }


  // ========================================
  // 讀取 G 欄
  // 第2列開始
  // ========================================
  const values =
    sheet
      .getRange(
        2,
        7,
        lastRow - 1,
        1
      )
      .getDisplayValues();


  // ========================================
  // 完全一致比對
  // ========================================
  let foundRow = -1;


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    const cellValue =
      String(values[i][0]);


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
      type: 'member',
      message: '查無會員'
    });

  }


  // ========================================
  // 取得同列 C 欄點數
  // ========================================
  const points =
    sheet
      .getRange(
        foundRow,
        3
      )
      .getValue();


  // ========================================
  // 回傳會員資料
  // ========================================
  return json({

    success: true,

    type: 'member',

    uid: uid,

    points: points

  });

}


// ========================================
// 讀取兌換獎品
// 工作表：兌換DM
// A欄 = 獎品名稱
// 第1列 = 標題
// 第2列開始 = 獎品
// ========================================
function getRewards() {

  // ========================================
  // 取得「兌換DM」
  // ========================================
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('兌換DM');


  if (!sheet) {

    return json({

      success: false,

      type: 'rewards',

      message: '找不到工作表：兌換DM'

    });

  }


  // ========================================
  // 最後一列
  // ========================================
  const lastRow =
    sheet.getLastRow();


  // ========================================
  // 沒有獎品
  // ========================================
  if (lastRow < 2) {

    return json({

      success: true,

      type: 'rewards',

      rewards: []

    });

  }


  // ========================================
  // 讀取 A欄
  // ========================================
  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getDisplayValues();


  // ========================================
  // 整理獎品
  // ========================================
  const rewards = [];


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    const name =
      String(values[i][0]).trim();


    if (name !== '') {

      rewards.push(name);

    }

  }


  // ========================================
  // 回傳獎品
  // ========================================
  return json({

    success: true,

    type: 'rewards',

    rewards: rewards

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
