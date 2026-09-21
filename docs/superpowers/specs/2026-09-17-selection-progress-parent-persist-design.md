# 選物進度持久化 v3

**舊方法（依 route 分鍵 + iframe 重用）已廢棄，不可再使用。**

## 新方法

| 項目 | 作法 |
|---|---|
| 儲存鍵 | `INFS_SEL_V3_{brand}`（站級；origin 已隔離電商） |
| 開啟 iframe | **每次強制銷毀重建**，禁止重用 |
| 還原 | `from_preview.selection_restore` + `selection_bridge_ready` 握手再推一次 |
| 鎖定 | `completed` 後忽略所有 `answer`，只有「重新開始」`clear` |

## 為何舊方法失敗

1. 不同商品頁可能對到不同 `route` → 讀不到進度 → 跳回專屬資訊  
2. 同 URL 重用 iframe 不重送 restore → 記憶體狀態過期卡住  
3. 只靠 Record 判斷續選 → Result 在、Record 空就 fadeIn intro  

## 驗收

```js
localStorage.getItem('INFS_SEL_V3_GTN')
// 需有 status:"completed" 與 Result.Item 三件
```

多開任意商品頁再開 widget → 必須直接結果頁、同一三件商品。
