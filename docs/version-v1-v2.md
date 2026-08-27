# no-media 版本說明：v1 / v2

> 適用分支：`feature/version-switch`  
> 切換方式：iframe URL 的 `?v=` 參數

本文件說明 **v1（敘述導覽／列表推薦）** 與 **v2（釘選互動／拉霸推薦）** 的共同能力與差異。

---

## 如何切換

| URL | 載入版本 | 說明 |
|-----|----------|------|
| 不帶 `v` | **v1** | 預設 |
| `?v=v1` 或 `?v=1` | **v1** | 同預設 |
| `?v=v2` 或 `?v=2` | **v2** | 拉霸／釘選版 |
| 其他未知值 | **v1** | fallback |

可與 GA Measurement ID 並存：

```
iframe_container_module.html?v=v2&ga=G-XXXXXXX
```

本機父頁範例：

```
index.html?v=v2&ga=G-XXXXXXX
```

解析與組裝邏輯在 [`js/shared/version.js`](../js/shared/version.js)；實際載入由 [`js/bootstrap.js`](../js/bootstrap.js) 負責。

---

## 目錄對應

```
js/
  shared/
    version.js      # ?v= / ?ga= 解析、src 組裝
    ga.js           # 共用 GA4 postMessage
  bootstrap.js      # 依版本載入腳本；v2 另載 css/iframe_v2.css
  v1/               # 敘述導覽版（原 main）
    iframe.js
    embedded.js
    scroll-control.js
  v2/               # 釘選拉霸版（原 feature/tagrandom）
    iframe.js
    embedded.js
    scroll-control.js
css/
  iframe_style.min.css     # 兩版共用（容器 HTML 固定載入）
  iframe_ai_pd_style.css   # 兩版共用樣式
  iframe_v2.css            # 僅 v2（reel / 換組 / tag-slot）；由 bootstrap 依版載入
```

---

## 共同功能

兩邊都具備以下能力（流程與參數契約大致相同）：

### 導購主流程

1. 父頁 `postMessage({ header: "from_preview", id, brand, … })` 啟動
2. 介紹頁 → 標籤問答（typewriter 打字 + 標籤淡入；打字中可點擊跳過，全文與標籤一次顯示）
3. 作答完成 → 呼叫推薦 API → 結果頁
4. 可「重新開始」、開啟優惠券／優惠推薦

### iframe 內遮罩引導（`enable_guide` + `intro_mode`）

需父頁傳 `enable_guide: true`，且 `intro_mode` 為 `v1` 或 `v2`，iframe 才會顯示多步驟 spotlight 引導：

1. Intro 首屏「開始」按鈕
2. 問答頁選標籤／略過
3. （可選）「換一組試試」（僅該頁有換組鈕時）
4. 結果頁標題
5. 點推薦商品可跳轉商品頁
6. （可選）釘選圖釘（僅 v2 拉霸有 `.reel-pin-btn` 時）
7. 「再玩一次」`#startover`

- 實作：[`js/shared/intro-tour.js`](../js/shared/intro-tour.js)、[`css/intro_tour.css`](../css/intro_tour.css)
- 記住狀態：`localStorage` key `inf-marketing-iframe-intro-tour-dismissed`
- 父頁「再看一次」→ `postMessage({ header: "parent_start_intro", intro_mode, enable_guide: true })`：回到 intro 並強制重跑引導
- 父頁關閉彈窗 → `parent_close_modal`：僅關閉當次引導 UI（不寫 dismiss）
- **預設關閉**：未傳或 `enable_guide !== true` 時不跑引導（`intro_mode` 仍可控制 intro 版面）

### 共用參數（`from_preview`；`?ga=` 為 URL）

| 參數 | 說明 |
|------|------|
| `brand` / `id`（Route） | 品牌與路線 |
| `MRID` / `GVID` / `LGVID` | 會員／訪客識別 |
| `intro_mode` | `v1` 簡化開始頁／`v2` 專屬資訊／省略則原規則 |
| `enable_guide` | `true` 才啟用 iframe 內多步驟遮罩引導（預設關閉；需搭配 `intro_mode`） |
| `use_route_linked_tags` | 是否依 `RouteLinkedTags` 過濾下一題 |
| `show_origin_price` | 結果是否顯示原價（來源限制見下註） |
| `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` / `utm_content` | **iframe 內建**，宿主不必傳：`utm_source=inffits`、`utm_medium=iframe_ai_product`；`utm_campaign` 依有無拉霸：v1（無）`no-media`、v2（有）`no-media-reel`；`utm_term` 空白；`utm_content` 空白（點商品時該次事件動態帶入區塊，見下）。若 `from_preview` 有帶 `utm_*` 則覆寫（source／medium 空字串會回退預設） |
| URL `?ga=` | GA4 Measurement ID，寫入事件的 `measurement_id`（非 `from_preview` 欄位） |

> `show_origin_price`：**v1** 只讀 `from_preview` 頂層布林 `show_origin_price`；**v2** 另支援巢狀物件、`showOriginPrice` 駝峰，以及 iframe URL query（`show_origin_price`／`showOriginPrice`）。

### 埋點機制

- iframe **不直接呼叫** `gtag`
- 透過 `postMessage({ header: "GA4Event", … })` 交給父頁／GTM 轉發
- 共用實作：[`js/shared/ga.js`](../js/shared/ga.js)
- 非空的 `utm_*` 會附在 `GA4Event` 上；父頁 `gtag` 對應為 `campaign_source`／`campaign_medium`／`campaign_name`／`campaign_term`／`campaign_content`（不重複傳 `utm_*`）
- 點擊商品時，該次事件另帶 `utm_content`（區塊），**不帶** `utm_term`：v1 結果列表為 `recom_item`；v2 拉霸為 `reel_{分類}`（無分類則 `reel_item`）；intro「熱銷排行榜」為 `hot_sale`（`click_embedded_item*`）。其他事件不帶 `utm_content`
- 點商品時，非空 `utm_*` 會寫進商品 `href` query（已有同名鍵則覆寫；`javascript:` 空連結不改）
- 除錯：`localStorage.setItem("NO_MEDIA_GA_DEBUG","1")` 或 `window.__NO_MEDIA_GA_DEBUG = true`

### 兩邊都有的 GA 事件（短名）

| 短名 | 觸發 |
|------|------|
| `click_start` | 介紹頁開始 |
| `click_tag` | 選標籤 |
| `click_skip` | 略過 |
| `click_back` | 返回 |
| `click_refresh_recommend` | 刷新推薦 |
| `click_startover` | 重新開始 |
| `click_coupon` | 開優惠券 |
| `click_coupon_recommend` | 優惠推薦 |

實際上報會自動加前綴（見下節）。

### 其他共同點

- 嵌入式推薦模組 `Product_Recommendation`（`embedded.js`）；結果為空時兩邊都會走備援推薦
- 滾動提示箭頭（`scroll-control.js`）；v2 多了可滾動判斷、`refreshScrollDownArrow`（換組後重算）
- Swiper、typewriter、優惠券 QR 等周邊能力
- 打字進行中可點擊跳過：立刻顯示全文，標籤一次全部到位（`finishTypewriter(true)`／`skipTypewriterOnTap`）
- `intro_mode`／`use_route_linked_tags` 兩邊契約相同（僅在 `from_preview` 明確傳入時更新）；`utm_*` 由 iframe 內建預設，宿主未傳時仍會附在 `GA4Event`

---

## 不同功能

### 一覽

| 面向 | v1 | v2 |
|------|----|----|
| 定位 | 敘述導覽＋列表推薦 | 釘選互動＋拉霸推薦 |
| 結果 UI | 最多 **3** 張商品卡列表 | 依分類／材質分欄的 **reel 拉霸**（預設 Tops／Bottoms／Dresses；如 AURASTRO 可為材質 key） |
| 刷新推薦 | `Item.length ≤ 3` → embedded 備援；否則從 `firstResult` 隨機重抽 | **轉動未釘選且有商品的欄位**（`spinCapsuleReels`） |
| 釘選 | 無 | 各欄可釘選，刷新時略過已釘選欄 |
| 標籤換組 | 無（該題標籤一次全渲染） | 僅當該題標籤 **> 8** 時啟用 8 槽位＋「換一組試試」；≤ 8 與 v1 相同一次全顯示 |
| GA 前綴 | `no-media_` | `no-media_v2_` |
| 專屬樣式 | 共用 CSS（`iframe_style.min.css` + `iframe_ai_pd_style.css`） | 另由 bootstrap 載入 [`css/iframe_v2.css`](../css/iframe_v2.css) |
| 程式目錄 | `js/v1/` | `js/v2/` |

### 結果頁（最明顯差異）

**v1**

- `show_results()` 抽樣最多 3 筆：首次依 `Item.COMMON` 降冪取前最多 3；其後隨機
- 渲染 `.axd_selection` 商品卡列表
- 「刷新推薦」：`firstResult.Item.length ≤ 3` 呼叫 `getEmbedded()`；否則再跑 `show_results(firstResult)` 隨機重抽

**v2**

- `normalizeCapsulePools()` 將結果整理成多欄商品池；空欄會先 `fillEmptyCapsulePools()`，仍全空才 `getEmbedded()`
- 每欄為 `.axd_selection.reel-slot`，含轉動軌道、釘選按鈕
- 首次／更新結果時 `spinCapsuleReels()` 執行拉霸動畫
- 「刷新推薦」= 再呼叫 `spinCapsuleReels(reelCats)`（略過已釘選／空池欄）

### 標籤問答差異

| | v1 | v2 |
|--|----|----|
| 標籤呈現 | 該題全部標籤一次渲染後淡入 | ≤ 8：同 v1；> 8：固定 8 個 `axd_tag-slot`，其餘分組 |
| 換組 | — | `itemCount > 8` 才出現「換一組試試」；`flipTagsToGroup()` + `click_change_group` |

> 打字與點擊跳過行為兩邊相同，見上方「共同功能」。

### GA 事件差異

**僅 v1**

| 短名（加前綴後） | 說明 |
|------------------|------|
| `no-media_click_recom_item` | 點擊結果列表商品 |

**僅 v2**

| 短名（加前綴後） | 說明 |
|------------------|------|
| `no-media_v2_spin_capsule` | 拉霸開始轉動 |
| `no-media_v2_click_reel_pin` | 釘選／取消釘選 |
| `no-media_v2_click_reel_item` | 點擊拉霸商品 |
| `no-media_v2_click_change_group` | 換一組試試 |

另：v2 結果頁會打營運 `usage_record`（`Recom`／`Pin`／`Refresh`／`Redirect`＝點商品／`Restart`＝重新開始／`Close`），見 [`js/shared/usage-record.js`](../js/shared/usage-record.js)。

共用事件在 v1 為 `no-media_*`，在 v2 為 `no-media_v2_*`（例如 `no-media_click_start` vs `no-media_v2_click_start`）。

---

## 使用建議

| 情境 | 建議版本 |
|------|----------|
| 傳統敘事導購、結果只要靜態清單 | **v1** |
| 要強調互動、分類／材質對比、可釘選再刷新 | **v2** |
| 同一部署要 A/B 或依路線切 UI | URL `?v=` 切換即可，不必分兩套 host |

正式環境請由父頁接收 `GA4Event`（通常經 GTM／gtag 轉發）；本機 `index.html` 會依 `?ga=` 直接 `gtag`，僅供除錯。

---

## 相關檔案

| 檔案 | 角色 |
|------|------|
| [`js/shared/version.js`](../js/shared/version.js) | 版本／GA query |
| [`js/shared/ga.js`](../js/shared/ga.js) | 共用追蹤 |
| [`js/shared/usage-record.js`](../js/shared/usage-record.js) | v2 拉霸 usage_record |
| [`js/bootstrap.js`](../js/bootstrap.js) | 依版載入 |
| [`js/v1/iframe.js`](../js/v1/iframe.js) | v1 主邏輯 |
| [`js/v2/iframe.js`](../js/v2/iframe.js) | v2 主邏輯 |
| [`css/iframe_v2.css`](../css/iframe_v2.css) | v2 專屬樣式 |
| [`iframe_container_module.html`](../iframe_container_module.html) | 容器入口 |
