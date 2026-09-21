# 選物進度父層持久化

**Goal:** 同電商站、同品牌可跨頁續選；各電商站互不干擾；重新開始清除；結果頁與同一批展示商品一併保存。

## 穩定寫法（單一快照）

父層唯一真相：`INFS_SELECTION_{brand}_{route}`

```json
{
  "Route": "...",
  "TagGroups_order": [],
  "Record": {},
  "Pinned": {},
  "Result": { "Item": [/* 畫面三件 */] },
  "status": "completed",
  "updatedAt": 0
}
```

### 鎖定規則

- `status === "completed"` 後，**忽略所有 `in_progress`**（多商品頁／多頁簽不可覆寫）
- 只有 iframe 送 `cleared`（使用者按重新開始）才刪快照
- Record 合併時，空／example 不可蓋掉已作答

### 協定

iframe → 父層 `selection_progress` 含 `result`：
- v1：`{ Item: [展示的商品…] }`
- v2：`{ pools, capsuleIndex, pinned, response }`

父層 → iframe `from_preview.selection_restore` 含 `Record` + `Result` + `status`。

### 行為

- 出結果後寫入快照 `completed` + `Result`
- 下次開啟直接還原結果頁與同一批商品，不重打推薦 API
- 無快照才從頭開始
