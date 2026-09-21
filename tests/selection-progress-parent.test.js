/**
 * 相容舊 status 欄位 + 站級 brand
 */
const assert = require("assert");
const Store = require("../js/shared/selection-progress-store.js");

const storage = Store.createMemoryStorage();
const api = Store.create({ storage });

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  status: "in_progress",
});
assert.strictEqual(api.get("GTN").status, "in_progress");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  result: { Item: [{ ItemName: "X", Link: "1" }] },
  status: "completed",
});
assert.strictEqual(api.get("GTN").status, "completed");

// 換 route 仍讀得到
assert.strictEqual(api.get("GTN").Result.Item[0].ItemName, "X");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "other-route",
  record: {},
  status: "in_progress",
});
assert.strictEqual(api.get("GTN").Result.Item[0].ItemName, "X");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  status: "cleared",
});
assert.strictEqual(api.get("GTN"), null);

console.log("selection-progress-parent.test.js OK");
