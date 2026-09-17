/**
 * 父層選物進度 InfSelectionProgress 契約煙霧測試（純函式模擬）
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
  function handleMessage(data) {
    const brand = data.brand;
    const routeId = data.route;
    const orderKey = "INFS_ROUTE_ORDER_" + brand;
    const resKey = "INFS_ROUTE_RES_" + brand;
    const item = {
      Route: routeId,
      TagGroups_order: data.tagGroupsOrder || [],
      Record: data.record || {},
      Pinned: data.pinned || {},
    };
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
    if (data.status === "completed") {
      let o = readList(orderKey);
      let r = readList(resKey);
      const oi = findIndexByRoute(o, routeId);
      if (oi >= 0) o.splice(oi, 1);
      const ri = findIndexByRoute(r, routeId);
      if (ri >= 0) r[ri] = item;
      else r.push(item);
      writeList(orderKey, o);
      writeList(resKey, r);
      return;
    }
    let o = readList(orderKey);
    let r = readList(resKey);
    const ri = findIndexByRoute(r, routeId);
    if (ri >= 0) r.splice(ri, 1);
    const oi = findIndexByRoute(o, routeId);
    if (oi >= 0) o[oi] = item;
    else o.push(item);
    writeList(orderKey, o);
    writeList(resKey, r);
  }
  function getRestore(brand, routeId) {
    const order = readList("INFS_ROUTE_ORDER_" + brand);
    const oi = findIndexByRoute(order, routeId);
    if (oi >= 0) {
      return { ...order[oi], status: "in_progress" };
    }
    const res = readList("INFS_ROUTE_RES_" + brand);
    const ri = findIndexByRoute(res, routeId);
    if (ri >= 0) return { ...res[ri], status: "completed" };
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

api.handleMessage({
  type: "selection_progress",
  brand: "GTN",
  route: "route-a",
  record: { features: [{ Name: "A", Tag: "1" }] },
  pinned: { Tops: true },
  status: "completed",
});
const done = api.getRestore("GTN", "route-a");
assert.strictEqual(done.status, "completed");
assert.strictEqual(done.Pinned.Tops, true);

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
