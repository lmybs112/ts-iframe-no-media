# 拉霸結果頁 usage_record 追蹤

日期：2026-08-26  
狀態：已核准，待寫實作計畫

## 背景

v2 拉霸結果頁已有 GA `postMessage` 埋點，但營運端需要另一支 usage API，記錄使用者在結果頁的後續動作（推薦出現、釘選、刷新、重開、關閉），並帶上當下畫面三件商品與釘選狀態。對應 lambda：`mkt_extensions_usage_record` → `{Brand}_Extensions_Record`。

## 目標

- 僅 **v2** 結果頁（`#container-recom`）發送 usage_record。
- 五種 Action：`Recom`／`Pin`／`Refersh`／`Redirect`／`Close`（拼字依契約，不改正為 Refresh）。
- 每次帶 `Brand`、`GVID`、`LGVID`、`MRID` 與畫面相關商品／釘選資訊。
- 不阻擋 UI；失敗不重試、不影響導購流程。

## 非目標

- 不改 v1、不改 GA／`trackInffitsEvent` 契約。
- 不新增 `Unpin` Action（取消釘選仍用 `Pin`，以操作後狀態表達）。
- 不在 intro 頁關閉時打 `Close`。
- 不驗證後端回傳內容。

## 架構

```
v2/iframe.js
  getVisibleReelProducts() / getPinnedState()
    → recordUsage(action)
        → POST usage_record（fire-and-forget）
```

觸發點掛在既有拉霸流程：`show_results`、`toggleCapsulePin`、`#recommend-btn`、`#startover`、結果頁 `closeModal`／`pagehide`／`beforeunload`。

## API

- Method：`POST`
- URL：`https://api.inffits.com/mkt_extensions_usage_record/extension/usage_record`
- Headers：`accept: application/json`、`content-type: application/json`

### 共用 body

| 欄位 | 來源 |
|------|------|
| `Brand` | 模組變數 `Brand` |
| `GVID` | `GVID \|\| ""` |
| `LGVID` | `LGVID \|\| ""` |
| `MRID` | `MRID \|\| ""` |
| `Action` | 見下表 |

### 依 Action 附加欄位

| Action | `ProductInfo` | `ProductCategory` | `ActionPtr` |
|--------|---------------|-------------------|-------------|
| `Recom` | 畫面三件商品整包（陣列） | 畫面三欄 key（如 `Tops`／`Bottoms`／`Dresses`） | 省略（不送） |
| `Pin` | 畫面三件 | 畫面三欄 key（同上） | 操作**後**仍釘選的 index |
| `Refersh` | **刷新前**畫面三件 | 畫面三欄 key（同上） | 當下釘選 index |
| `Redirect` | **重開前**畫面三件 | 畫面三欄 key（同上） | 當下釘選 index |
| `Close` | **關閉前**畫面三件 | 畫面三欄 key（同上） | 當下釘選 index |

### 資料組裝規則

- `ProductInfo`：依 `reelCats` 順序，各取 `capsulePools[cat][capsuleIndex[cat]]`（缺則略過該欄）；商品物件原樣帶入。
- `ProductCategory`：**所有 Action** 都帶畫面有商品的欄位 key（通常三個），key **原樣**（如 `Tops`／`Bottoms`／`Dresses`，或動態材質名）。
- `ActionPtr`：釘選欄位在 `reelCats` 的 0-based index；可多個。無釘選或 `Recom` 時不寫入 body。
- `Pin`：釘選與取消釘選都打 `Action: "Pin"`；`ActionPtr` 為點擊後仍釘選的 index。

## 觸發時機

| Action | 時機 |
|--------|------|
| `Recom` | 每次進入結果頁、三欄定案並顯示後打一次（含「猜你可能喜歡」備援）。同一輪結果內「刷新推薦」**不再**打 `Recom`。`#startover`／`Initial` 後若再次進結果頁，再打一次 `Recom`。 |
| `Pin` | `toggleCapsulePin` 更新狀態與 UI 之後。 |
| `Refersh` | `#recommend-btn` 點擊後、`spinCapsuleReels` **之前**。 |
| `Redirect` | `#startover` 點擊後、`Initial`／`reset` **之前**。 |
| `Close` | 僅當結果頁可見（`#container-recom` 為顯示中）：(1) 父頁關閉彈窗時 `postMessage({ header: "parent_close_modal" })`（預覽 `index.html` 點遮罩／關閉鈕會送）；(2) intro 外側觸發的 `closeModal`（結果頁時 intro 已藏，通常不走此路）；(3) `pagehide`／`beforeunload`。intro 關閉不打。 |

`Close` 防重複：同一次離開若 `closeModal` 與 `pagehide` 連續觸發，以短時間 flag／debounce 只送一筆。

## 錯誤與邊界

- `fetch` 不 await 阻斷 UI；`.catch` 吞錯（可 `console`）。
- 無結果可顯示時不打 `Recom`。
- 結果頁不可見時不打 `Close`。
- 不重試，避免重複計數。

## 實作範圍

- `js/v2/iframe.js`：helper + 五個觸發點
- 可選：`docs/version-v1-v2.md` 補一句 usage_record（僅 v2）

## 驗證

1. 進結果頁 → Network 一筆 `Recom`，`ProductCategory` 為畫面欄位 key、`ActionPtr` 為 `[]`，`ProductInfo` 長度為畫面欄數。
2. 釘兩欄 → 兩筆 `Pin`，`ActionPtr` 漸增。
3. 取消一欄 → 再一筆 `Pin`，`ActionPtr` 變少。
4. 刷新 → 一筆 `Refersh`（刷新前三件＋當下釘選），無第二筆 `Recom`。
5. 重新開始 → 一筆 `Redirect`。
6. 結果頁關彈窗或重整 → 一筆 `Close`；intro 關閉無 `Close`。
7. UI 流程不受 API 失敗影響。
