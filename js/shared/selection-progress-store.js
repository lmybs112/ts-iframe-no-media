/**
 * 選物進度儲存引擎 v3
 *
 * 唯一真相（站級）：INFS_SEL_V3_{brand}
 * - localStorage 已依 origin 隔離電商站
 * - 同站同品牌共用一份進度（不因商品頁 route 不同而丟失）
 * - completed 後忽略 answer，直到 clear
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SelectionProgressStore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var PROTOCOL_V = 3;
  var SNAP_PREFIX = "INFS_SEL_V3_";
  var LEGACY_V2_PREFIX = "INFS_SELECTION_";
  var LEGACY = {
    order: "INFS_ROUTE_ORDER_",
    res: "INFS_ROUTE_RES_",
    shown: "INFS_SHOWN_",
  };

  function createMemoryStorage() {
    var map = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
      },
      setItem: function (k, v) {
        map[k] = String(v);
      },
      removeItem: function (k) {
        delete map[k];
      },
      key: function (i) {
        return Object.keys(map)[i] || null;
      },
      get length() {
        return Object.keys(map).length;
      },
    };
  }

  function safeParse(raw, fallback) {
    try {
      if (raw == null || raw === "") return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function snapKey(brand) {
    return SNAP_PREFIX + brand;
  }

  function hasUsableResult(result) {
    if (!result || typeof result !== "object") return false;
    if (Array.isArray(result.Item) && result.Item.length > 0) return true;
    if (result.pools && typeof result.pools === "object") {
      return Object.keys(result.pools).some(function (k) {
        return Array.isArray(result.pools[k]) && result.pools[k].length > 0;
      });
    }
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

  function countAnswered(record) {
    if (!record || typeof record !== "object") return 0;
    var n = 0;
    Object.keys(record).forEach(function (k) {
      if (isAnsweredTagList(record[k])) n += 1;
    });
    return n;
  }

  function mergeRecord(previous, incoming) {
    var out = {};
    var prev = previous && typeof previous === "object" ? previous : {};
    var next = incoming && typeof incoming === "object" ? incoming : {};
    Object.keys(prev).forEach(function (k) {
      out[k] = prev[k];
    });
    Object.keys(next).forEach(function (k) {
      if (isAnsweredTagList(next[k])) {
        out[k] = next[k];
      } else if (!Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] = next[k];
      }
    });
    return out;
  }

  function cloneJson(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return null;
    }
  }

  function normalizeAction(data) {
    if (!data || typeof data !== "object") return "answer";
    if (data.action === "clear" || data.status === "cleared") return "clear";
    if (data.action === "complete" || data.status === "completed") {
      return "complete";
    }
    return "answer";
  }

  function create(options) {
    var storage =
      (options && options.storage) ||
      (typeof localStorage !== "undefined" ? localStorage : createMemoryStorage());

    function readRaw(key) {
      try {
        return storage.getItem(key);
      } catch (e) {
        return null;
      }
    }

    function writeRaw(key, value) {
      try {
        storage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    }

    function removeRaw(key) {
      try {
        storage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    }

    function readSnap(brand) {
      if (!brand) return null;
      var parsed = safeParse(readRaw(snapKey(brand)), null);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    }

    function writeSnap(brand, snap) {
      if (!brand || !snap) return false;
      var payload = cloneJson(snap) || snap;
      payload.brand = brand;
      payload.v = PROTOCOL_V;
      payload.updatedAt = Date.now();
      return writeRaw(snapKey(brand), JSON.stringify(payload));
    }

    function clearLegacyForBrand(brand) {
      removeRaw(LEGACY.order + brand);
      removeRaw(LEGACY.res + brand);
      // 清掉該品牌所有 v2 route 鍵與 SHOWN
      try {
        var keys = [];
        for (var i = 0; i < storage.length; i++) {
          var k = storage.key(i);
          if (!k) continue;
          if (
            k.indexOf(LEGACY_V2_PREFIX + brand + "_") === 0 ||
            k.indexOf(LEGACY.shown + brand + "_") === 0
          ) {
            keys.push(k);
          }
        }
        keys.forEach(removeRaw);
      } catch (e) {
        /* ignore */
      }
    }

    function migrateLegacy(brand) {
      var existing = readSnap(brand);
      if (existing) return existing;

      // v2：INFS_SELECTION_{brand}_{route} — 取最新／已完成優先
      var best = null;
      try {
        for (var i = 0; i < storage.length; i++) {
          var k = storage.key(i);
          if (!k || k.indexOf(LEGACY_V2_PREFIX + brand + "_") !== 0) continue;
          var cand = safeParse(readRaw(k), null);
          if (!cand || typeof cand !== "object") continue;
          if (!best) {
            best = cand;
            continue;
          }
          var bestDone = best.status === "completed" || hasUsableResult(best.Result);
          var candDone = cand.status === "completed" || hasUsableResult(cand.Result);
          if (candDone && !bestDone) best = cand;
          else if (candDone === bestDone && (cand.updatedAt || 0) > (best.updatedAt || 0)) {
            best = cand;
          }
        }
      } catch (e) {
        /* ignore */
      }

      // v1 lists
      if (!best) {
        var resList = safeParse(readRaw(LEGACY.res + brand), []);
        var orderList = safeParse(readRaw(LEGACY.order + brand), []);
        if (!Array.isArray(resList)) resList = [];
        if (!Array.isArray(orderList)) orderList = [];
        var fromRes = resList.length ? resList[resList.length - 1] : null;
        var fromOrder = orderList.length ? orderList[orderList.length - 1] : null;
        best = fromRes || fromOrder;
      }

      if (!best) return null;

      var result = hasUsableResult(best.Result) ? best.Result : null;
      var record = best.Record || {};
      var snap = {
        brand: brand,
        Route: best.Route || "",
        TagGroups_order: best.TagGroups_order || [],
        Record: record,
        Pinned: best.Pinned || {},
        Result: result,
        status: hasUsableResult(result) ? "completed" : "in_progress",
        v: PROTOCOL_V,
      };
      writeSnap(brand, snap);
      return snap;
    }

    function toRestore(snap) {
      if (!snap) return null;
      return {
        Route: snap.Route || "",
        TagGroups_order: snap.TagGroups_order || [],
        Record: snap.Record || {},
        Pinned: snap.Pinned || {},
        Result: snap.Result || null,
        status: snap.status || "in_progress",
        v: snap.v || PROTOCOL_V,
        updatedAt: snap.updatedAt || 0,
      };
    }

    /** 只依 brand 讀取（站級） */
    function get(brand) {
      if (!brand) return null;
      var snap = readSnap(brand) || migrateLegacy(brand);
      return toRestore(snap);
    }

    function apply(data) {
      if (!data || data.type !== "selection_progress") {
        return { ok: false, reason: "invalid_type" };
      }
      var brand = data.brand;
      if (!brand) return { ok: false, reason: "missing_brand" };

      var action = normalizeAction(data);
      if (action === "clear") {
        removeRaw(snapKey(brand));
        clearLegacyForBrand(brand);
        return { ok: true, action: "clear" };
      }

      var prev = readSnap(brand) || migrateLegacy(brand);

      if (prev && prev.status === "completed" && action === "answer") {
        return { ok: true, action: "ignored_locked", restore: toRestore(prev) };
      }

      var incomingResult = Object.prototype.hasOwnProperty.call(data, "result")
        ? data.result
        : Object.prototype.hasOwnProperty.call(data, "Result")
          ? data.Result
          : null;

      var mergedRecord = mergeRecord(prev && prev.Record, data.record || data.Record);
      var mergedResult = hasUsableResult(incomingResult)
        ? cloneJson(incomingResult) || incomingResult
        : prev && hasUsableResult(prev.Result)
          ? prev.Result
          : null;
      var mergedPinned = Object.assign(
        {},
        (prev && prev.Pinned) || {},
        data.pinned || data.Pinned || {}
      );
      var tagGroupsOrder =
        data.tagGroupsOrder ||
        data.TagGroups_order ||
        (prev && prev.TagGroups_order) ||
        [];
      var routeId = data.route || data.Route || (prev && prev.Route) || "";

      var nextStatus = action === "complete" ? "completed" : "in_progress";
      if (hasUsableResult(mergedResult)) nextStatus = "completed";

      if (
        nextStatus === "completed" &&
        countAnswered(mergedRecord) === 0 &&
        prev &&
        countAnswered(prev.Record) > 0
      ) {
        mergedRecord = prev.Record;
      }

      if (action === "complete" && !hasUsableResult(mergedResult)) {
        return { ok: false, reason: "complete_without_result" };
      }

      var snap = {
        brand: brand,
        Route: routeId,
        TagGroups_order: tagGroupsOrder,
        Record: mergedRecord,
        Pinned: mergedPinned,
        Result: mergedResult,
        status: nextStatus,
        v: PROTOCOL_V,
      };
      if (!writeSnap(brand, snap)) return { ok: false, reason: "write_failed" };
      return { ok: true, action: action, restore: toRestore(snap) };
    }

    return {
      PROTOCOL_V: PROTOCOL_V,
      snapKey: snapKey,
      hasUsableResult: hasUsableResult,
      get: get,
      apply: apply,
      clear: function (brand) {
        return apply({
          type: "selection_progress",
          action: "clear",
          brand: brand,
        });
      },
    };
  }

  return {
    PROTOCOL_V: PROTOCOL_V,
    create: create,
    createMemoryStorage: createMemoryStorage,
    hasUsableResult: hasUsableResult,
    mergeRecord: mergeRecord,
    normalizeAction: normalizeAction,
  };
});
