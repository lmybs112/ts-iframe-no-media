/**
 * 父層選物進度 InfSelectionProgress 契約煙霧測試（對齊現行父層行為）
 * - completed + Result 優先還原
 * - in_progress 不刪 RES（避免多頁簽洗掉結果）
 * - 新訊息無 Result 時保留既有 Result
 */
const assert = require("assert");

function createProgressStore() {
  const store = {};
  function readList(key) {
    try {
      return JSON.parse(store[key] || "[]");
    } catch (_) {
      return [];
    }
  }
  function writeList(key, list) {
    store[key] = JSON.stringify(list);
  }
  function findIndexByRoute(list, routeId) {
    return list.findIndex((item) => item && String(item.Route) === String(routeId));
  }
  function hasUsableResult(result) {
    if (!result || typeof result !== "object") return false;
    if (Array.isArray(result.Item) && result.Item.length > 0) return true;
    if (result.pools && typeof result.pools === "object") return true;
    return false;
  }
  function normalizeItem(data, previous) {
    let result;
    if (Object.prototype.hasOwnProperty.call(data || {}, "result")) {
      result = data.result;
    } else if (Object.prototype.hasOwnProperty.call(data || {}, "Result")) {
      result = data.Result;
    } else {
      result = previous && previous.Result != null ? previous.Result : null;
    }
    if (!hasUsableResult(result) && previous && hasUsableResult(previous.Result)) {
      result = previous.Result;
    }
    return {
      Route: data.route || data.Route || "",
      TagGroups_order: data.tagGroupsOrder || data.TagGroups_order || [],
      Record: data.record || data.Record || {},
      Pinned: data.pinned || data.Pinned || {},
      Result: result,
    };
  }
  function handleMessage(data) {
    const brand = data.brand;
    const routeId = data.route;
    const orderKey = "INFS_ROUTE_ORDER_" + brand;
    const resKey = "INFS_ROUTE_RES_" + brand;
    if (data.status === "cleared") {
      let o = readList(orderKey);
      let r = readList(resKey);
      const oi = findIndexByRoute(o, routeId);
      const ri = findIndexByRoute(r, routeId);
      if (oi >= 0) o.splice(oi, 1);
      if (ri >= 0) r.splice(ri, 1);
      writeList(orderKey, o);
      writeList(resKey, r);
      return;
    }
    const prevOrder = readList(orderKey);
    const prevRes = readList(resKey);
    const prev =
      (findIndexByRoute(prevOrder, routeId) >= 0
        ? prevOrder[findIndexByRoute(prevOrder, routeId)]
        : null) ||
      (findIndexByRoute(prevRes, routeId) >= 0
        ? prevRes[findIndexByRoute(prevRes, routeId)]
        : null);
    const item = normalizeItem(data, prev);
    if (data.status === "completed") {
      let o = readList(orderKey);
      let r = readList(resKey);
      const oi = findIndexByRoute(o, routeId);
      if (oi >= 0) o.splice(oi, 1);
      const ri = findIndexByRoute(r, routeId);
      if (ri >= 0) r[ri] = normalizeItem(item, r[ri]);
      else r.push(item);
      writeList(orderKey, o);
      writeList(resKey, r);
      return;
    }
    // in_progress：只更新 ORDER，不刪 RES
    let o = readList(orderKey);
    const oi = findIndexByRoute(o, routeId);
    if (oi >= 0) o[oi] = normalizeItem(item, o[oi]);
    else o.push(item);
    writeList(orderKey, o);
  }
  function getRestore(brand, routeId) {
    const order = readList("INFS_ROUTE_ORDER_" + brand);
    const res = readList("INFS_ROUTE_RES_" + brand);
    const oi = findIndexByRoute(order, routeId);
    const ri = findIndexByRoute(res, routeId);
    const inProgress = oi >= 0 ? order[oi] : null;
    const done = ri >= 0 ? res[ri] : null;
    if (done && hasUsableResult(done.Result)) {
      return { ...done, status: "completed" };
    }
    if (inProgress) {
      return { ...inProgress, status: "in_progress" };
    }
    if (done) {
      return { ...done, status: "completed" };
    }
    return null;
  }
  return { handleMessage, getRestore, store };
}

const api = createProgressStore();
api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  tagGroupsOrder: ["features"],
  record: { features: [{ Name: "A", Tag: "1" }] },
  pinned: {},
  status: "in_progress",
});
assert.strictEqual(api.getRestore("GTN", "route-a").status, "in_progress");
assert.strictEqual(api.getRestore("OTHER", "route-a"), null, "他站／他品牌不應讀到");

const threeItems = {
  Item: [
    { ItemName: "A", Link: "1" },
    { ItemName: "B", Link: "2" },
    { ItemName: "C", Link: "3" },
  ],
};
api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  pinned: { Tops: true },
  result: threeItems,
  status: "completed",
});
const done = api.getRestore("GTN", "route-a");
assert.strictEqual(done.status, "completed");
assert.strictEqual(done.Pinned.Tops, true);
assert.strictEqual(done.Result.Item.length, 3);
assert.strictEqual(done.Result.Item[0].ItemName, "A");

// 多頁簽又送 in_progress：不可洗掉 RES／Result
api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  pinned: {},
  result: null,
  status: "in_progress",
});
const stillDone = api.getRestore("GTN", "route-a");
assert.strictEqual(stillDone.status, "completed");
assert.strictEqual(stillDone.Result.Item[1].ItemName, "B");

// completed 但沒帶 Result：應保留既有三件
api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  pinned: {},
  result: null,
  status: "completed",
});
const kept = api.getRestore("GTN", "route-a");
assert.strictEqual(kept.Result.Item[2].ItemName, "C");

api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  status: "cleared",
  record: {},
  pinned: {},
});
assert.strictEqual(api.getRestore("GTN", "route-a"), null);

console.log("selection-progress-parent.test.js OK");
