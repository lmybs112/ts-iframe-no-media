/**
 * 相容煙霧：舊 status 欄位仍可驅動新 store
 */
const assert = require("assert");
const Store = require("../js/shared/selection-progress-store.js");

const storage = Store.createMemoryStorage();
const api = Store.create({ storage });

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  tagGroupsOrder: ["features"],
  record: { features: [{ Name: "A", Tag: "1" }] },
  status: "in_progress",
});
assert.strictEqual(api.get("GTN", "route-a").status, "in_progress");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  result: { Item: [{ ItemName: "X", Link: "1" }] },
  status: "completed",
});
assert.strictEqual(api.get("GTN", "route-a").status, "completed");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: {},
  status: "in_progress",
});
assert.strictEqual(api.get("GTN", "route-a").Result.Item[0].ItemName, "X");

api.apply({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  status: "cleared",
});
assert.strictEqual(api.get("GTN", "route-a"), null);

console.log("selection-progress-parent.test.js OK");
