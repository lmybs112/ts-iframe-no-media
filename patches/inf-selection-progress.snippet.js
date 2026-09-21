var InfSelectionProgress = (function () {
    // 內嵌與 iframe 相同的 SelectionProgressStore（單一快照＋跨分頁鎖定）
/**
 * 選物進度儲存引擎（純邏輯，可在 Node / Browser 共用）
 *
 * 唯一真相：INFS_SELECTION_{brand}_{route}
 * 跨分頁規則：status=completed 後忽略 answer，直到 clear
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SelectionProgressStore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var PROTOCOL_V = 2;
  var SNAP_PREFIX = "INFS_SELECTION_";
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

  function snapKey(brand, routeId) {
    return SNAP_PREFIX + brand + "_" + routeId;
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

    function readList(prefix, brand) {
      var parsed = safeParse(readRaw(prefix + brand), []);
      return Array.isArray(parsed) ? parsed : [];
    }

    function findByRoute(list, routeId) {
      if (!Array.isArray(list) || !routeId) return null;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].Route) === String(routeId)) return list[i];
      }
      return null;
    }

    function readSnap(brand, routeId) {
      if (!brand || !routeId) return null;
      var parsed = safeParse(readRaw(snapKey(brand, routeId)), null);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    }

    function writeSnap(brand, routeId, snap) {
      if (!brand || !routeId || !snap) return false;
      var payload = cloneJson(snap) || snap;
      payload.Route = String(routeId);
      payload.v = PROTOCOL_V;
      payload.updatedAt = Date.now();
      return writeRaw(snapKey(brand, routeId), JSON.stringify(payload));
    }

    function clearAllKeys(brand, routeId) {
      removeRaw(snapKey(brand, routeId));
      removeRaw(LEGACY.shown + brand + "_" + routeId);
      // 清 legacy list 內同 Route
      ["order", "res"].forEach(function (which) {
        var prefix = which === "res" ? LEGACY.res : LEGACY.order;
        var list = readList(prefix, brand).filter(function (item) {
          return !(item && String(item.Route) === String(routeId));
        });
        writeRaw(prefix + brand, JSON.stringify(list));
      });
    }

    function migrateLegacy(brand, routeId) {
      var existing = readSnap(brand, routeId);
      if (existing) return existing;

      var orderItem = findByRoute(readList(LEGACY.order, brand), routeId);
      var resItem = findByRoute(readList(LEGACY.res, brand), routeId);
      var shown = safeParse(readRaw(LEGACY.shown + brand + "_" + routeId), null);
      var base = resItem || orderItem;
      if (!base && !hasUsableResult(shown)) return null;

      var result =
        (hasUsableResult(shown) && shown) ||
        (base && hasUsableResult(base.Result) && base.Result) ||
        null;
      var record = (base && base.Record) || {};
      var status =
        hasUsableResult(result) || countAnswered(record) > 0
          ? hasUsableResult(result)
            ? "completed"
            : resItem
              ? "completed"
              : "in_progress"
          : "in_progress";
      if (hasUsableResult(result)) status = "completed";

      var snap = {
        Route: routeId,
        TagGroups_order: (base && base.TagGroups_order) || [],
        Record: record,
        Pinned: (base && base.Pinned) || {},
        Result: result,
        status: status,
        v: PROTOCOL_V,
      };
      writeSnap(brand, routeId, snap);
      return snap;
    }

    function toRestore(snap, routeId) {
      if (!snap) return null;
      return {
        Route: snap.Route || routeId,
        TagGroups_order: snap.TagGroups_order || [],
        Record: snap.Record || {},
        Pinned: snap.Pinned || {},
        Result: snap.Result || null,
        status: snap.status || "in_progress",
        v: snap.v || PROTOCOL_V,
        updatedAt: snap.updatedAt || 0,
      };
    }

    function get(brand, routeId) {
      if (!brand || !routeId) return null;
      var snap = readSnap(brand, routeId) || migrateLegacy(brand, routeId);
      return toRestore(snap, routeId);
    }

    function apply(data) {
      if (!data || data.type !== "selection_progress") {
        return { ok: false, reason: "invalid_type" };
      }
      var brand = data.brand;
      var routeId = data.route;
      if (!brand || !routeId) return { ok: false, reason: "missing_ids" };

      var action = normalizeAction(data);
      if (action === "clear") {
        clearAllKeys(brand, routeId);
        return { ok: true, action: "clear" };
      }

      var prev = readSnap(brand, routeId) || migrateLegacy(brand, routeId);

      // 完成態鎖定：任何分頁的 answer 都不可覆寫
      if (prev && prev.status === "completed" && action === "answer") {
        return { ok: true, action: "ignored_locked", restore: toRestore(prev, routeId) };
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

      // complete 必須有 Result；沒有就拒絕（避免寫入空完成態）
      if (action === "complete" && !hasUsableResult(mergedResult)) {
        return { ok: false, reason: "complete_without_result" };
      }

      var snap = {
        Route: routeId,
        TagGroups_order: tagGroupsOrder,
        Record: mergedRecord,
        Pinned: mergedPinned,
        Result: mergedResult,
        status: nextStatus,
        v: PROTOCOL_V,
      };
      var written = writeSnap(brand, routeId, snap);
      if (!written) return { ok: false, reason: "write_failed" };
      return { ok: true, action: action, restore: toRestore(snap, routeId) };
    }

    return {
      PROTOCOL_V: PROTOCOL_V,
      snapKey: snapKey,
      hasUsableResult: hasUsableResult,
      get: get,
      apply: apply,
      clear: function (brand, routeId) {
        return apply({
          type: "selection_progress",
          action: "clear",
          brand: brand,
          route: routeId,
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

    var store = SelectionProgressStore.create({
        storage: typeof localStorage !== 'undefined' ? localStorage : SelectionProgressStore.createMemoryStorage()
    });

    function getRestore(brand, routeId) {
        return store.get(brand, routeId);
    }

    function attachRestore(payload) {
        if (!payload || typeof payload !== 'object') return payload;
        var restore = store.get(payload.brand || '', payload.id || '');
        if (restore) payload.selection_restore = restore;
        else delete payload.selection_restore;
        return payload;
    }

    function handleMessage(data) {
        store.apply(data);
    }

    if (typeof window !== 'undefined' && !window.__INFS_SELECTION_PROGRESS_BOUND__) {
        window.__INFS_SELECTION_PROGRESS_BOUND__ = true;
        window.addEventListener('message', function (event) {
            try {
                if (event.data && event.data.type === 'selection_progress') {
                    handleMessage(event.data);
                }
            } catch (e) {
                console.warn('InfSelectionProgress listener 錯誤:', e);
            }
        });
    }

    return {
        getRestore: getRestore,
        attachRestore: attachRestore,
        handleMessage: handleMessage,
        _store: store
    };
})();
