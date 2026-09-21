/**
 * 父層選物進度：單一快照鎖定契約
 * - INFS_SELECTION_{brand}_{route} 為唯一真相
 * - completed 後忽略 in_progress（多商品頁／多頁簽不可洗掉）
 * - 只有 cleared 才解除鎖定
 */
const assert = require("assert");

function createProgressStore() {
  const store = {};
  function snapKey(brand, routeId) {
    return "INFS_SELECTION_" + brand + "_" + routeId;
  }
  function hasUsableResult(result) {
    if (!result || typeof result !== "object") return false;
    if (Array.isArray(result.Item) && result.Item.length > 0) return true;
    return false;
  }
  function isAnsweredTagList(list) {
    return (
      Array.isArray(list) &&
      list.length > 0 &&
      list[0] &&
      list[0].Name &&
      list[0].Name !== "example"
    );
  }
  function mergeRecord(previous, incoming) {
    const out = { ...(previous || {}) };
    const next = incoming || {};
    Object.keys(next).forEach((k) => {
      if (isAnsweredTagList(next[k])) out[k] = next[k];
      else if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = next[k];
    });
    return out;
  }
  function readSnap(brand, routeId) {
    try {
      return JSON.parse(store[snapKey(brand, routeId)] || "null");
    } catch (_) {
      return null;
    }
  }
  function writeSnap(brand, routeId, snap) {
    store[snapKey(brand, routeId)] = JSON.stringify({
      ...snap,
      Route: routeId,
      updatedAt: Date.now(),
    });
  }
  function handleMessage(data) {
    const brand = data.brand;
    const routeId = data.route;
    if (data.status === "cleared") {
      delete store[snapKey(brand, routeId)];
      return;
    }
    const prev = readSnap(brand, routeId);
    if (prev && prev.status === "completed" && data.status === "in_progress") {
      return; // locked
    }
    const mergedRecord = mergeRecord(prev && prev.Record, data.record);
    const mergedResult = hasUsableResult(data.result)
      ? data.result
      : prev && hasUsableResult(prev.Result)
        ? prev.Result
        : null;
    const nextStatus =
      data.status === "completed" || hasUsableResult(mergedResult)
        ? "completed"
        : data.status || "in_progress";
    writeSnap(brand, routeId, {
      Route: routeId,
      TagGroups_order: data.tagGroupsOrder || (prev && prev.TagGroups_order) || [],
      Record: mergedRecord,
      Pinned: data.pinned || (prev && prev.Pinned) || {},
      Result: mergedResult,
      status: nextStatus,
    });
  }
  function getRestore(brand, routeId) {
    const snap = readSnap(brand, routeId);
    if (!snap) return null;
    return {
      Route: snap.Route || routeId,
      TagGroups_order: snap.TagGroups_order || [],
      Record: snap.Record || {},
      Pinned: snap.Pinned || {},
      Result: snap.Result || null,
      status: snap.status || "in_progress",
    };
  }
  return { handleMessage, getRestore, store };
}

const api = createProgressStore();
const record = {
  features: [{ Name: "修身", Tag: "1" }],
  style: [{ Name: "休閒", Tag: "2" }],
};
const threeItems = {
  Item: [
    { ItemName: "A", Link: "1" },
    { ItemName: "B", Link: "2" },
    { ItemName: "C", Link: "3" },
  ],
};

api.handleMessage({
  brand: "GTN",
  route: "route-a",
  record,
  result: threeItems,
  status: "completed",
});
assert.strictEqual(api.getRestore("GTN", "route-a").status, "completed");
assert.strictEqual(api.getRestore("GTN", "route-a").Result.Item[0].ItemName, "A");

// 多開商品頁送空 in_progress：必須被鎖定忽略
api.handleMessage({
  brand: "GTN",
  route: "route-a",
  record: {},
  result: null,
  status: "in_progress",
});
const locked = api.getRestore("GTN", "route-a");
assert.strictEqual(locked.status, "completed");
assert.strictEqual(locked.Record.features[0].Name, "修身");
assert.strictEqual(locked.Result.Item[2].ItemName, "C");

// 只有 cleared 才能解除
api.handleMessage({
  brand: "GTN",
  route: "route-a",
  status: "cleared",
  record: {},
});
assert.strictEqual(api.getRestore("GTN", "route-a"), null);

console.log("selection-progress-parent.test.js OK");
