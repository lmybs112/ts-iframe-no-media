# 選物進度父層持久化

**Goal:** 同電商站、同品牌可跨頁續選；各電商站互不干擾；重新開始清除；結果頁釘選與同一批展示商品一併保存。

## 協定

iframe → 父層 `selection_progress` 含 `result`：
- v1：`{ Item: [展示的商品…] }`
- v2：`{ pools, capsuleIndex, pinned, response }`

父層 → iframe `from_preview.selection_restore` 含 `Result`。

## 行為

- 出結果後寫入 `Result`；下次開啟若有 `Result` 則直接 `show_results`，**不重打推薦 API**。
- 無 `Result` 才 fallback 重抓。
- 重新開始清除含 `Result`。
