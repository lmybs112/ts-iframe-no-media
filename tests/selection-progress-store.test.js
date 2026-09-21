/**
 * 選物進度 v3：站級 brand 快照 + 跨分頁鎖定
 */
const assert = require("assert");
const Store = require("../js/shared/selection-progress-store.js");

const sharedStorage = Store.createMemoryStorage();
const tabA = Store.create({ storage: sharedStorage });
const tabB = Store.create({ storage: sharedStorage });

const brand = "GTN";
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

// 商品頁 A（route-a）完成
assert.strictEqual(
  tabA.apply({
    type: "selection_progress",
    action: "complete",
    brand,
    route: "route-a",
    record,
    result: three,
  }).ok,
  true
);

// 商品頁 B（不同 route）讀到同一站級結果
const onB = tabB.get(brand);
assert.strictEqual(onB.status, "completed");
assert.strictEqual(onB.Result.Item[0].ItemName, "褲A");

// 商品頁 B 空 answer 不可覆寫
assert.strictEqual(
  tabB.apply({
    type: "selection_progress",
    action: "answer",
    brand,
    route: "route-b",
    record: {},
  }).action,
  "ignored_locked"
);
assert.strictEqual(tabA.get(brand).Result.Item[2].ItemName, "褲C");

// 鍵名為站級
assert.ok(sharedStorage.getItem("INFS_SEL_V3_GTN"));

// clear 後可重來
tabA.apply({ type: "selection_progress", action: "clear", brand });
assert.strictEqual(tabB.get(brand), null);

console.log("selection-progress-store.test.js OK");
