# 拉霸 usage_record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v2 結果頁對 `usage_record` 發送 Recom／Pin／Refersh／Redirect／Restart／Close。

**Architecture:** 純函式放 `js/shared/usage-record.js`（可測）；`bootstrap.js` 於 v2 載入；`js/v2/iframe.js` 掛觸發點。

**Tech Stack:** Vanilla JS、fetch、既有拉霸狀態（`reelCats`／`capsulePools`／`capsuleIndex`／`capsulePinned`）

## Global Constraints

- Action 拼字：`Refersh`（不改正）
- `ProductCategory` 用欄位 key 原樣
- `Recom` 的 Category／Ptr 固定 `[]`
- `Close` 僅結果頁可見時
- fire-and-forget，失敗不重試

---

### Task 1: shared helper + 單元測試

**Files:**
- Create: `js/shared/usage-record.js`
- Create: `tests/usage-record.test.js`

- [x] 寫失敗測試：`getPinnedState`／`getVisibleProducts`／`buildUsageBody`
- [x] 實作 helper 使測試通過
- [x] `node tests/usage-record.test.js`

### Task 2: bootstrap + v2 觸發

**Files:**
- Modify: `js/bootstrap.js`（v2 載入 usage-record.js）
- Modify: `js/v2/iframe.js`

- [x] `recordReelUsage(action)` 組狀態並呼叫 shared post
- [x] flag：`usageRecomSentThisRound`（Initial／startover 重設）
- [x] Close debounce flag
- [x] 掛 Recom／Pin／Refersh／Redirect（商品）／Restart（startover）／Close
- [x] 更新 `docs/version-v1-v2.md` 一句

### Task 3: 驗證

- [x] 單元測試全綠
- [x] 語法 check iframe.js／usage-record.js
