function doGet(e) {

// ========================================
// 取得參數
// ========================================

const params =
  e && e.parameter
    ? e.parameter
    : {};

const action =
  String(
    params.action || 'member'
  ).trim();

const uid =
  String(
    params.uid || ''
  ).trim();


// ========================================
// GAS 預熱
//
// 不讀取試算表
// 保留原本前台 warmup=true
// ========================================

if (
  params.warmup === 'true'
) {

  /*
    預熱也做簡單限制，
    避免有人拿 warmup 狂刷 GAS 執行額度
  */

  if (
    !checkGlobalRateLimit(
      'warmup',
      30,
      60
    )
  ) {

    return json({
      success: false,
      message: '請稍後再試'
    });

  }


  return json({
    success: true,
    warmup: true
  });

}


// ========================================
// 兌換獎品
// action = rewards
// ========================================

if (
  action === 'rewards'
) {

  /*
    rewards 沒有會員 UID，
    因此使用全域限流。

    60 秒最多允許 30 次。
    超過就不讀取「兌換DM」工作表。
  */

  if (
    !checkGlobalRateLimit(
      'rewards',
      30,
      60
    )
  ) {

    return json({
      success: false,
      type: 'rewards',
      message: '請稍後再試'
    });

  }


  return getRewards();

}


// ========================================
// 兌換前同步會員點數
// action = sync
// ========================================

if (
  action === 'sync'
) {

  /*
    ★ 重要

    這是「兌換獎品前」的最新點數同步。

    不使用：

      checkMemberRateLimit(uid)

    因為會員剛剛完成查詢後，
    可能馬上點「兌換獎品」。

    如果使用會員 10 秒冷卻，
    就會被剛才的查詢擋住。

    因此 sync 使用獨立的
    全域限流。

    60 秒最多 30 次。
  */


  if (
    uid === ''
  ) {

    return json({
      success: false,
      type: 'sync',
      message: '系統暫時無法處理查詢'
    });

  }


  if (
    !checkGlobalRateLimit(
      'sync',
      30,
      60
    )
  ) {

    return json({
      success: false,
      type: 'sync',
      message: '請稍後再試'
    });

  }


  /*
    通過 sync 限流後，
    直接取得最新會員點數。
  */

  return getMember(uid);

}


// ========================================
// 預設：會員查詢
// ========================================

/*
  沒有 UID 時直接回傳空白。

  這樣直接開：
  /exec

  不會顯示：
  「缺少會員資料」

  也不會暴露 API 結構。
*/

if (
  uid === ''
) {

  return ContentService
    .createTextOutput('')
    .setMimeType(
      ContentService.MimeType.TEXT
    );

}


// ========================================
// 一般會員查詢限流
// ========================================

/*
  同一 UID：
  10 秒內最多查詢 1 次。

  全域：
  60 秒最多 60 次。

  兩層都通過才會進入試算表。
*/

if (
  !checkMemberRateLimit(uid)
) {

  return json({
    success: false,
    type: 'member',
    message: '查詢過於頻繁，請稍候再查詢'
  });

}


// ========================================
// 通過限流
// 才進入會員查詢
// ========================================

return getMember(uid);

}


// ========================================
// 會員查詢限流
// ========================================

function checkMemberRateLimit(uid) {

/*
  第一層：
  同一會員 UID 的短時間限制

  10 秒內只能查詢一次
*/

const uidHash =
  hashString(uid);

const uidKey =
  'member_rate_' +
  uidHash;

const cache =
  CacheService
    .getScriptCache();


// 已經在冷卻期間

if (
  cache.get(uidKey)
) {

  return false;

}


/*
  第二層：
  全域流量限制

  60 秒最多 60 次會員查詢
*/

if (
  !checkGlobalRateLimit(
    'member',
    60,
    60
  )
) {

  return false;

}


/*
  通過後才建立 UID 冷卻。

  10 秒後自動失效。
*/

cache.put(
  uidKey,
  '1',
  10
);

return true;

}


// ========================================
// 全域限流
//
// type：限制類型
// maxRequests：允許次數
// windowSeconds：時間窗口
// ========================================

function checkGlobalRateLimit(
  type,
  maxRequests,
  windowSeconds
) {

const lock =
  LockService
    .getScriptLock();

try {

  /*
    最多等待 3 秒。

    避免大量同時請求時，
    LockService 本身造成長時間等待。
  */

  if (
    !lock.tryLock(3000)
  ) {

    return false;

  }


  const properties =
    PropertiesService
      .getScriptProperties();


  const now =
    Date.now();


  const timestampKey =
    'rate_' +
    type +
    '_timestamp';


  const countKey =
    'rate_' +
    type +
    '_count';


  const oldTimestamp =
    Number(
      properties.getProperty(
        timestampKey
      ) || 0
    );


  const oldCount =
    Number(
      properties.getProperty(
        countKey
      ) || 0
    );


  /*
    如果已經超過時間窗口，
    重新開始計算。
  */

  if (
    !oldTimestamp ||
    now - oldTimestamp >=
      windowSeconds * 1000
  ) {

    properties.setProperties({

      [timestampKey]:
        String(now),

      [countKey]:
        '1'

    });


    return true;

  }


  /*
    尚未超過時間窗口，
    檢查目前次數。
  */

  if (
    oldCount >=
    maxRequests
  ) {

    return false;

  }


  /*
    增加請求次數。
  */

  properties.setProperty(
    countKey,
    String(
      oldCount + 1
    )
  );


  return true;


} catch (error) {

  console.error(
    '限流系統錯誤：',
    error
  );


  /*
    如果限流系統本身發生錯誤，
    這裡選擇拒絕請求。

    安全性優先，
    避免限流失效後直接大量讀取試算表。
  */

  return false;

} finally {

  try {

    lock.releaseLock();

  } catch (e) {

    // 忽略 Lock 釋放錯誤

  }

}

}


// ========================================
// 字串雜湊
//
// 不直接把會員 UID 存進
// PropertiesService 的 key。
//
// 只用雜湊值做短時間限流識別。
// ========================================

function hashString(value) {

const bytes =
  Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );


return bytes
  .map(
    function(byte) {

      const v =
        byte < 0
          ? byte + 256
          : byte;


      return v
        .toString(16)
        .padStart(2, '0');

    }
  )
  .join('');

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

if (
  uid === ''
) {

  return ContentService
    .createTextOutput('')
    .setMimeType(
      ContentService.MimeType.TEXT
    );

}


// ========================================
// 取得「會員」工作表
// ========================================

const sheet =
  SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('會員');


if (
  !sheet
) {

  /*
    不暴露：
    找不到工作表：會員

    外部只看到一般錯誤。
  */

  return json({

    success: false,

    type: 'member',

    message:
      '系統暫時無法處理查詢'

  });

}


// ========================================
// 最後一列
// ========================================

const lastRow =
  sheet.getLastRow();


if (
  lastRow < 2
) {

  /*
    不暴露：
    沒有會員資料
  */

  return json({

    success: false,

    type: 'member',

    message:
      '系統暫時無法處理查詢'

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

let foundRow =
  -1;


for (
  let i = 0;
  i < values.length;
  i++
) {

  const cellValue =
    String(
      values[i][0]
    );


  if (
    cellValue === uid
  ) {

    foundRow =
      i + 2;

    break;

  }

}


// ========================================
// 查無會員
// ========================================

if (
  foundRow === -1
) {

  /*
    這個訊息保留，
    因為你的前台需要顯示查無會員。
  */

  return json({

    success: false,

    type: 'member',

    message:
      '查無會員'

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


if (
  !sheet
) {

  /*
    不暴露工作表名稱。
  */

  return json({

    success: false,

    type: 'rewards',

    message:
      '系統暫時無法讀取資料'

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

if (
  lastRow < 2
) {

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

const rewards =
  [];


for (
  let i = 0;
  i < values.length;
  i++
) {

  const name =
    String(
      values[i][0]
    ).trim();


  if (
    name !== ''
  ) {

    rewards.push(
      name
    );

  }

}


// ========================================
// 回傳獎品
// ========================================

return json({

  success: true,

  type: 'rewards',

  rewards:
    rewards

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
