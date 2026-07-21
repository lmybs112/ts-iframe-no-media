# no-media-v2 GA4 事件一覽

> 資料來源：`js/iframe.js`  
> 最後整理：2026-07-21

## 傳送機制

元件**不在 iframe 內直接呼叫 `gtag`**，僅對父頁送出 `postMessage`（對齊 `shirt-component.js`）：

```javascript
{
  header: "GA4Event",
  measurement_id: "<ga-measurement-id>", // 來自 GA4Key；可空，交給父頁 GTM 預設
  event_action: "<事件名稱>",              // 即下表 event_name（含 no-media_v2_ 前綴）
  event_category: "inffits_route",
  event_label: "<標籤名／商品名／Track/NoMediaV2>",
  value: 1,
  // 可選開發對照欄位（父頁 GTM 未必使用）
  action: "<細分動作>",
  brand: "<品牌>",
  route: "<路線 ID>"
}
```

父頁 GTM 腳本（如 `gtm_infshop_GTN.js`、`gtm_guten_test.js`）接收後轉發 `gtag('event', event_action, …)`。  
本機 `index.html` 亦有簡易 listener：console 印出，若父頁有 `gtag` 則一併轉發。

| 項目 | 說明 |
|------|------|
| 非 iframe 嵌入 | 不送 GA（僅 debug log） |
| 除錯 | `window.__NO_MEDIA_GA_DEBUG = true` 或 `localStorage.setItem('NO_MEDIA_GA_DEBUG','1')` |
| 防連擊 | 同一去重 key 於 **800ms** 內重複觸發會略過 |
| 前綴 | 程式可傳短名；送出前自動補上 `no-media_v2_` |

### 封裝方法

| 方法 | 用途 |
|------|------|
| `trackInffitsEvent(eventName, params)` | 底層送出（去重 + postMessage） |

### 去重 key

```
event_name | action | event_label | event_value | category | tag_group | step
```

---

## 事件一覽

| event_name | action | 觸發時機 | 備註 |
|------------|--------|----------|------|
| `no-media_v2_click_start` | `start_button` | 點擊介紹頁「開始」(`#start-button`) | — |
| `no-media_v2_click_tag` | `select_tag` | 點選題目中的某個標籤選項 | `event_label`=名稱、`event_value`=tagId；另有 `tag_group`、`step` |
| `no-media_v2_click_skip` | `skip_step` | 點擊「略過」 | 會寫入 example 佔位選項；含 `step` |
| `no-media_v2_click_back` | `back_to_intro` | 第一題返回箭頭 → 介紹頁 | 同一 event_name、不同 action |
| `no-media_v2_click_back` | `back_to_prev_step` | 返回上一題 | 同上 |
| `no-media_v2_click_change_group` | `change_tag_group` | 點擊「換一組試試」 | `from_group` / `to_group` |
| `no-media_v2_click_refresh_recommend` | `refresh_recommend_btn` | 點擊「刷新推薦」 | 接著可能觸發 `spin_capsule` |
| `no-media_v2_spin_capsule` | `spin_reels` | `spinCapsuleReels()` 實際開始轉動 | 全部釘選時不觸發 |
| `no-media_v2_click_reel_pin` | `pin` / `unpin` | 釘選／取消釘選拉霸欄位 | `event_label`=分類名（`Tops` 或材質如 `冰絲`） |
| `no-media_v2_click_reel_item` | `reel_item_click` | 點擊拉霸商品卡片 | `event_label`=商品名、`event_value`=連結 |
| `no-media_v2_click_startover` | `startover_btn` | 結果頁「重新開始」 | 清空選擇並重跑 |
| `no-media_v2_click_coupon` | `open_coupon` | 點擊優惠券按鈕 | — |
| `no-media_v2_click_coupon_recommend` | `open_coupon_recommend` | 點擊優惠推薦按鈕 | `event_value`=推薦商品數 |

---

## 流程對應

```
no-media_v2_click_start
  → click_tag / click_skip / click_back / click_change_group
  → click_refresh_recommend → spin_capsule
  → click_reel_pin / click_reel_item
  → click_startover / click_coupon / click_coupon_recommend
```

（上列短名皆等同加上 `no-media_v2_` 後的完整 `event_action`。）

---

## 本機測試（index.html）

1. 開啟 `index.html`，傳送參數並打開導購 iframe。
2. 父頁 Console 應看到 `[GA4Event from iframe] { header, event_action, … }`。
3. iframe Console 可開除錯：

```js
localStorage.setItem("NO_MEDIA_GA_DEBUG", "1");
// 或
window.__NO_MEDIA_GA_DEBUG = true;
```

4. 正式站：父頁載入 GTM 腳本即可，無需在 iframe 內放 gtag。

---

## 命名規則

```
no-media_v2_<動作>
```

同一 `event_name` 可搭配不同 `action` 區分來源（例如 `click_back` 的 `back_to_intro` / `back_to_prev_step`）。

---

## 相關程式位置

| 檔案 | 說明 |
|------|------|
| `js/iframe.js` | `trackInffitsEvent`、各點擊埋點 |
| `index.html` | 本機 `GA4Event` listener（除錯／可選轉發 gtag） |
| `gtm_infshop_GTN.js` 等（父站） | 正式環境轉發 `gtag` |
| `shirt-component.js`（另一專案） | 相同 `header: 'GA4Event'` 契約 |
