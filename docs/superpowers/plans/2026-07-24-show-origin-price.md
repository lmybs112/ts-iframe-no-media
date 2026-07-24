# show_origin_price Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `from_preview` 的 `show_origin_price` 控制 `.recom-price` 顯示原價或特價優先。

**Architecture:** 在 `js/iframe.js` 新增模組變數 `showOriginPrice` 與共用函式 `formatRecomPrice(item)`；於 message handler 賦值，並替換兩處寫入 `.recom-price` 的字串邏輯。

**Tech Stack:** 既有 jQuery / vanilla JS（`js/iframe.js`），無單元測試框架；以 Node 一對一邏輯核對 + 瀏覽器手動驗證。

## Global Constraints

- 僅修改 `js/iframe.js`
- `show_origin_price` 省略或 `false` → `sale_price || price || "-"`
- `show_origin_price === true`（布林語意 `!!`）→ `price || sale_price || "-"`
- 不改 `embedded.js`、父頁、商品資料正規化

---

### Task 1: 變數、formatRecomPrice、接線 from_preview、替換兩處顯示

**Files:**
- Modify: `js/iframe.js`（檔案開頭變數區、`renderCapsuleReel`、`animateReel`、`from_preview` handler）
- Spec: `docs/superpowers/specs/2026-07-24-show-origin-price-design.md`

**Interfaces:**
- Consumes: `from_preview` message 的 `event.data.show_origin_price`
- Produces: `var showOriginPrice`（boolean）；`function formatRecomPrice(item)` → string

- [x] **Step 1: 在檔案頂部變數區新增 `showOriginPrice`**

於既有 `var LGVID = "";` 附近加入：

```js
var showOriginPrice = false;
```

- [x] **Step 2: 新增 `formatRecomPrice`（放在 `renderCapsuleReel` 之前）**

```js
function formatRecomPrice(item) {
  if (!item) return "-";
  if (showOriginPrice) return item.price || item.sale_price || "-";
  return item.sale_price || item.price || "-";
}
```

- [x] **Step 3: 替換 `renderCapsuleReel` 內價格字串**

將：

```js
const priceText = item.sale_price || item.price || "-";
```

改為：

```js
const priceText = formatRecomPrice(item);
```

- [x] **Step 4: 替換 `animateReel` 內價格字串**

將：

```js
$slot.find(".recom-price").text(fin.sale_price || fin.price || "-");
```

改為：

```js
$slot.find(".recom-price").text(formatRecomPrice(fin));
```

- [x] **Step 5: 在 `from_preview` handler 賦值**

於 `LGVID = event.data.LGVID || "";` 之後加入：

```js
showOriginPrice = !!event.data.show_origin_price;
```

- [x] **Step 6: Node 邏輯核對（無測試框架時的替身）**

Run:

```bash
node -e '
function formatRecomPrice(item, showOriginPrice) {
  if (!item) return "-";
  if (showOriginPrice) return item.price || item.sale_price || "-";
  return item.sale_price || item.price || "-";
}
const a = { price: "NT$100", sale_price: "NT$80" };
const b = { sale_price: "NT$80" };
const c = { price: "NT$100" };
const d = {};
const assert = (cond, msg) => { if (!cond) { console.error(msg); process.exit(1); } };
assert(formatRecomPrice(a, false) === "NT$80", "default prefers sale");
assert(formatRecomPrice(a, true) === "NT$100", "origin prefers price");
assert(formatRecomPrice(b, true) === "NT$80", "origin falls back to sale");
assert(formatRecomPrice(c, false) === "NT$100", "default falls back to price");
assert(formatRecomPrice(d, false) === "-", "empty dash");
assert(formatRecomPrice(null, true) === "-", "null dash");
console.log("PASS");
'
```

Expected: `PASS`

- [x] **Step 7: 靜態確認兩處皆已改用 `formatRecomPrice`**

Run:

```bash
rg -n "recom-price|formatRecomPrice|showOriginPrice|show_origin_price" js/iframe.js
```

Expected:
- 有 `var showOriginPrice`
- 有 `function formatRecomPrice`
- `from_preview` 區塊有 `showOriginPrice = !!event.data.show_origin_price`
- `.recom-price` 寫入處使用 `formatRecomPrice(...)`，不再直接 `sale_price || price`

- [ ] **Step 8: Commit（僅在用戶明確要求時執行）**

```bash
git add js/iframe.js docs/superpowers/specs/2026-07-24-show-origin-price-design.md docs/superpowers/plans/2026-07-24-show-origin-price.md
git commit -m "$(cat <<'EOF'
feat: 依 show_origin_price 切換 recom-price 顯示順序

EOF
)"
```

---

## 手動驗證（Task 1 完成後）

1. 父頁 `postMessage` 不帶 `show_origin_price` → 特價優先。
2. 帶 `show_origin_price: true` → 原價優先。
3. 帶 `show_origin_price: false` → 與未傳相同。
4. 確認靜止卡片與拉霸轉動過程中價格皆正確。
