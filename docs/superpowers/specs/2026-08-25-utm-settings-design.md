# UTM 設置（預覽面板 → iframe → GA4）

日期：2026-08-25  
狀態：已核准，待寫實作計畫

## 背景

預覽父頁 `index.html` 已能設定品牌／路線、`intro_mode`、`use_route_linked_tags`、`show_origin_price`，並以 `postMessage({ header: "from_preview" })` 傳入 iframe。專案尚無 UTM 欄位。本功能讓預覽頁可設定一組預設追蹤，經同一契約進入 iframe，並附在每次 `GA4Event` 上，父頁轉發 `gtag` 時對應成 GA4 活動參數。

## 目標

- 父頁可編輯五個標準 UTM 欄位，載入時帶預設值。
- `utm_campaign` 預設依父頁 `?v=` 分為 v1／v2。
- iframe 存下收到的值；重新開始不丟失。
- 每次埋點只帶非空 UTM；父頁 `gtag` 對應 `campaign_*`。
- 未傳 UTM 的既有嵌入頁不受影響（iframe 預設為空，不主動填預設）。

## 非目標

- 不從父頁或 iframe URL 自動讀取既有 `utm_*` query（不採用 URL 方案）。
- 不為 `embedded.js` 另做 UTM 面板。若該腳本與 iframe 同窗且走 `trackInffitsEvent`，會自動帶上已存 UTM；獨立商品頁沒有 `from_preview` 則不帶。
- 不驗證 UTM 字串格式或長度。
- 不改 GA 事件名稱、前綴或既有 `event_category`／`event_label`。

## 架構

```
index.html 參數面板
    → postMessage from_preview（五個 utm_* 頂層鍵，含空字串）
        → v1/v2 iframe.js 模組變數（鍵存在才更新）
            → ga.js 組 GA4Event（只附非空 utm_*）
                → 父頁 gtag（utm_* → campaign_*）
```

內部「重新開始」同樣 dispatch `from_preview`，必須帶上當下五欄，避免被當成未傳入。

## 父頁面板

位置：`index.html` 參數區，接在 `show_origin_price` 下方。標題「UTM」，五個文字欄，樣式對齊現有 `intro_mode`／自訂品牌欄。input id：`utm-source`、`utm-medium`、`utm-campaign`、`utm-term`、`utm-content`。

| 欄位（`from_preview` 鍵／input） | 載入預設 |
|----------------------------------|----------|
| `utm_source` | `inffits` |
| `utm_medium` | `iframe_ai_product` |
| `utm_campaign` | 見下表 |
| `utm_term` | 空 |
| `utm_content` | 空 |

`utm_campaign` 只在**父頁載入時**依 `NoMediaVersion.resolveNoMediaVersion()`（即 `?v=`）寫入 input，之後以使用者輸入為準，傳送時不再依版本覆寫。

| 父頁版本 | 預設 `utm_campaign` |
|----------|---------------------|
| v1（無 `v`、`v=v1`、`v=1`、未知值） | `no-media-v1` |
| v2（`v=v2` 或 `v=2`） | `no-media-v2` |

傳送規則：

- 五欄都 `trim`；只含空白視為空字串。
- **五個鍵一律寫入** `from_preview`（空字串表示清除該欄）。這樣才能拿掉預設的 source／medium／campaign。
- `recreateIframe` 把這五欄放進現有 `iframe_preview_obj` 頂層，不另包 `utm` 物件。

## iframe 儲存（v1 與 v2 相同契約）

`js/v1/iframe.js`、`js/v2/iframe.js` 各維持五個模組字串，初始為 `""`。

收到 `header === "from_preview"` 時：對 `utm_source`、`utm_medium`、`utm_campaign`、`utm_term`、`utm_content` 分別用 `hasOwnProperty`；鍵存在則寫入 `trim` 後的字串（可為空）。未出現的鍵不改。此規則與 `intro_mode` 一致，讓尚未升級的宿主頁不會被預設 UTM 污染。

`reset` 組成的內部 `from_preview` 必須包含這五個鍵，值為當下已存內容。

`NoMediaGa.initNoMediaGa` 增加 `getUtm`，回傳目前五欄物件（可含空字串）。`ga.js` 只把非空欄寫進訊息。

## GA4Event 與 gtag

`js/shared/ga.js` 在既有訊息（`header`、`event_action`、`brand`、`route` 等）上，附上非空的 `utm_*`。空欄省略，不送 `null`。

父頁現有 `GA4Event` 處理（`index.html`）在呼叫 `gtag("event", …)` 時，將非空欄對應為：

| `GA4Event` | gtag 參數 |
|------------|-----------|
| `utm_source` | `campaign_source` |
| `utm_medium` | `campaign_medium` |
| `utm_campaign` | `campaign_name` |
| `utm_term` | `campaign_term` |
| `utm_content` | `campaign_content` |

`gtag` 事件參數只用上表 `campaign_*`，不再重複傳 `utm_*`。父頁無 `gtag`（網址無 `?ga=`）時行為不變：可 `console.log` 整包訊息，不呼叫 `gtag`。iframe 仍照常 `postMessage`。

不把空的 `campaign_*` 傳給 `gtag`，避免蓋掉其他歸因。

## 錯誤與邊界

- 無格式／長度檢查。
- `from_preview` 缺 `utm_*` 鍵：該欄維持原值（初次為空）。
- 將某欄從有值改為空再傳送：iframe 清空該欄，後續事件不再帶它。
- 非 `from_preview` 或非 `GA4Event` 的訊息不讀 UTM。
- 不在 iframe URL 組裝 `utm_*`（`version.js` 的 `buildIframeContainerSrc` 不變）。

## 文件

實作時更新 `docs/version-v1-v2.md` 的共用 `from_preview` 參數表，列入五個 `utm_*`、campaign 預設隨 `?v=` 變化，以及 GA 事件會帶非空 UTM／父頁對應 `campaign_*`。

## 驗證

1. 開 `index.html`：source／medium 為預設，campaign 為 `no-media-v1`。開 `index.html?v=v2`：campaign 為 `no-media-v2`。
2. 不改欄位直接傳送，點開始：`GA4Event` 含三個非空 `utm_*`，`gtag` 對應三個 `campaign_*`；term／content 不出現。
3. 清掉 `utm_source` 再傳：後續事件沒有 source／`campaign_source`。
4. 把 campaign 改成自訂字串再傳：事件使用新值，不依 `?v=` 覆寫。
5. 重新開始後，事件仍帶同一組 UTM。
6. v1、v2 各走一次上述流程。
7. 控制台無新增錯誤。

## 實作範圍（檔案）

- `index.html`：面板、預設 campaign、`from_preview`、`gtag` 對應
- `js/shared/ga.js`：`getUtm`、非空 `utm_*` 寫入 `GA4Event`
- `js/v1/iframe.js`、`js/v2/iframe.js`：儲存、`reset`、`initNoMediaGa({ getUtm })`
- `docs/version-v1-v2.md`：參數說明
