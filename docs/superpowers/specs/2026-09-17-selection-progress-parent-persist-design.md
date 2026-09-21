# 選物進度父層持久化（重構）

**Goal:** 同電商站、同品牌跨商品頁／分頁續選；結果頁與同一批商品鎖定；只有「重新開始」可清除。

## 架構

| 層 | 檔案 | 職責 |
|---|---|---|
| 儲存引擎 | `js/shared/selection-progress-store.js` | 唯一真相 `INFS_SELECTION_{brand}_{route}` |
| iframe 客戶端 | `js/shared/selection-progress.js` | `answer` / `complete` / `clear` + 本地 lock |
| 父層 | `InfSelectionProgress`（內嵌同一 store） | 收 postMessage、attachRestore |

## 協定 v2

```js
{
  type: 'selection_progress',
  v: 2,
  action: 'answer' | 'complete' | 'clear',
  brand, route,
  tagGroupsOrder, record, pinned, result,
  status: 'in_progress' | 'completed' | 'cleared' // 相容舊欄位
}
```

## 跨分頁鎖定規則

1. `complete` 寫入 Record + Result，`status=completed`
2. 之後任何分頁的 `answer`／`in_progress` → **忽略**
3. 只有 `clear`（重新開始）刪快照
4. `complete` 若無可用 Result → 拒絕寫入
5. Record 合併：空／example 不可蓋掉已作答

## 驗收

1. 走完結果頁 → `localStorage['INFS_SELECTION_GTN_'+route]` 有 `status:completed` 與三件 `Item`
2. 多開商品頁再開 widget → 仍停在同一結果、同一三件
3. 按重新開始 → 鍵消失，可重選
