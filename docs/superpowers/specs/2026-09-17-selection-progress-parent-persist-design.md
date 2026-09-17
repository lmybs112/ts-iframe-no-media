# 選物進度父層持久化

**Goal:** 同電商站、同品牌可跨頁續選；各電商站互不干擾；重新開始清除；結果頁釘選一併保存。

## 協定

### iframe → 父層

```js
{
  type: 'selection_progress',
  brand: string,
  route: string,
  tagGroupsOrder: string[],
  record: object,       // tags_chosen
  pinned: object,       // capsulePinned（v1 為 {}）
  status: 'in_progress' | 'completed' | 'cleared'
}
```

### 父層 → iframe（既有 from_preview 擴充）

```js
selection_restore: {
  Route, TagGroups_order, Record, Pinned, status
} | null
```

## 存儲

- 位置：父站 `localStorage`
- Key：`INFS_ROUTE_ORDER_${brand}`、`INFS_ROUTE_RES_${brand}`
- `in_progress` → upsert ORDER；`completed` → ORDER 移 RES；`cleared` → 兩邊刪除該 Route

## 行為

1. 選題／略過 → `in_progress`（含目前 record）
2. 出推薦結果 → `completed`（含 pinned）
3. 釘選切換 → `completed`（更新 Pinned；若尚在 ORDER 則仍 `in_progress`）
4. 重新開始 → `cleared` 後重跑
5. 父層每次 `sendIframeMessage`／`getIframeConfigPayload` 附上對應 restore
