# show_origin_price 設計規格

日期：2026-07-24  
範圍：`js/iframe.js` 僅

## 目標

父頁透過 `from_preview` postMessage 可傳入 `show_origin_price`。  
為 `true` 時，`.recom-price` 優先顯示原價（`price`）；否則維持現況（特價優先）。

## 訊息契約

```js
{
  id, header, brand,
  MRID, GVID, LGVID,
  show_origin_price: true | false  // 可省略，省略視為 false
}
```

- `header` 必須為 `"from_preview"`
- `show_origin_price` 以布林語意處理：`!!event.data.show_origin_price`

## 行為

| `show_origin_price` | `.recom-price` 文字 |
|---------------------|---------------------|
| `true` | `price \|\| sale_price \|\| "-"` |
| `false` / 未傳 | `sale_price \|\| price \|\| "-"`（現況） |

## 實作要點

1. 新增模組層變數 `showOriginPrice`，預設 `false`。
2. 在 `from_preview` 處理器內賦值：`showOriginPrice = !!event.data.show_origin_price`。
3. 抽出共用函式 `formatRecomPrice(item)`，依 `showOriginPrice` 回傳上述字串。
4. 替換既有兩處寫入 `.recom-price` 的邏輯：
   - `renderCapsuleReel`
   - `animateReel`

## 非範圍

- 不修改 `embedded.js`、父頁 demo（如 `ts_brand_all_route.html`）或其它非 `.recom-price` 的價格顯示。
- 不改動商品資料正規化（不交換欄位語意）。

## 驗證

1. 不傳 `show_origin_price`：顯示與改前相同（特價優先）。
2. 傳 `show_origin_price: true`：有 `price` 時顯示 `price`；僅有 `sale_price` 時顯示特價；皆無則 `-`。
3. 傳 `show_origin_price: false`：與未傳相同。
4. 拉霸靜止渲染與轉動過程中名稱旁價格皆符合上述規則。
