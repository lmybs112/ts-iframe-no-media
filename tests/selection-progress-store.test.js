/**
 * 選物進度儲存引擎：跨分頁鎖定契約測試
 */
const assert = require("assert");
const Store = require("../js/shared/selection-progress-store.js");

function tabStore() {
  // 模擬同站多個分頁共用同一個 localStorage
  return Store.create({ storage: sharedStorage });
}

const sharedStorage = Store.createMemoryStorage();

const tabA = Store.create({ storage: sharedStorage });
const tabB = Store.create({ storage: sharedStorage });
const tabC = Store.create({ storage: sharedStorage });

const brand = "GTN";
const route = "2025-07-28-09-29-44-4";
const record = {
  features: [{ Name: "修身", Tag: "1" }],
  style: [{ Name: "休閒", Tag: "2" }],
};
const three = {
  Item: [
    { ItemName: "褲A", Link: "/a" },
    { ItemName: "褲B", Link: "/b" },
    { ItemName: "褲C", Link: "/c" },
  ],
};

// Tab A 完成選物
const done = tabA.apply({
  type: "selection_progress",
  action: "complete",
  brand,
  route,
  record,
  result: three,
  pinned: {},
});
assert.strictEqual(done.ok, true);
assert.strictEqual(tabA.get(brand, route).status, "completed");
assert.strictEqual(tabA.get(brand, route).Result.Item[0].ItemName, "褲A");

// Tab B / C 開商品頁送空 answer → 必須被鎖定忽略
const ignoredB = tabB.apply({
  type: "selection_progress",
  action: "answer",
  brand,
  route,
  record: {},
  result: null,
});
assert.strictEqual(ignoredB.action, "ignored_locked");

const ignoredC = tabC.apply({
  type: "selection_progress",
  status: "in_progress", // 舊協定
  brand,
  route,
  record: { features: [{ Name: "example", Tag: "x" }] },
  result: null,
});
assert.strictEqual(ignoredC.action, "ignored_locked");

// 所有分頁讀到的仍是同一批商品與答題
[tabA, tabB, tabC].forEach((tab, i) => {
  const r = tab.get(brand, route);
  assert.strictEqual(r.status, "completed", "tab" + i);
  assert.strictEqual(r.Record.features[0].Name, "修身", "tab" + i);
  assert.strictEqual(r.Result.Item[2].ItemName, "褲C", "tab" + i);
});

// attachRestore 等價
const restore = tabB.get(brand, route);
assert.ok(restore.Result.Item.length === 3);

// 只有 clear 才能解除
tabB.apply({
  type: "selection_progress",
  action: "clear",
  brand,
  route,
});
assert.strictEqual(tabA.get(brand, route), null);
assert.strictEqual(tabC.get(brand, route), null);

// clear 後可重新作答
tabC.apply({
  type: "selection_progress",
  action: "answer",
  brand,
  route,
  record: { features: [{ Name: "寬鬆", Tag: "9" }] },
});
assert.strictEqual(tabA.get(brand, route).status, "in_progress");
assert.strictEqual(tabA.get(brand, route).Record.features[0].Name, "寬鬆");

// complete 沒 Result 必須失敗
const bad = tabA.apply({
  type: "selection_progress",
  action: "complete",
  brand,
  route,
  record,
  result: null,
});
assert.strictEqual(bad.ok, false);
assert.strictEqual(bad.reason, "complete_without_result");

console.log("selection-progress-store.test.js OK");
