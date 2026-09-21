/**
 * iframe 選物進度客戶端：統一對父層 postMessage
 * 依賴：SelectionProgressStore（sanitize／規則常數）
 */
(function (root) {
  var locked = false;
  var lastBrand = "";
  var lastRoute = "";

  function getRouteId() {
    try {
      if (typeof current_route_path !== "undefined" && current_route_path && current_route_path.Route) {
        return current_route_path.Route;
      }
      if (typeof current_Route !== "undefined" && current_Route) return current_Route;
      if (typeof Route !== "undefined" && Route) return Route;
    } catch (e) {
      /* ignore */
    }
    return lastRoute || "";
  }

  function getBrandId() {
    try {
      if (typeof Brand !== "undefined" && Brand) return Brand;
    } catch (e) {
      /* ignore */
    }
    return lastBrand || "";
  }

  function getTagGroupsOrder() {
    try {
      if (
        typeof current_route_path !== "undefined" &&
        current_route_path &&
        current_route_path.TagGroups_order
      ) {
        return current_route_path.TagGroups_order;
      }
      if (typeof all_Route !== "undefined" && all_Route) return all_Route;
    } catch (e) {
      /* ignore */
    }
    return [];
  }

  function sanitizeV1Result(payload) {
    if (!payload || !Array.isArray(payload.Item) || payload.Item.length === 0) {
      return null;
    }
    try {
      return JSON.parse(
        JSON.stringify({
          Item: payload.Item.map(function (item) {
            if (!item || typeof item !== "object") return null;
            return {
              ItemName: item.ItemName || item.title || "",
              Link: item.Link || item.link || "",
              Imgsrc: item.Imgsrc || item.image_link || "",
              sale_price: item.sale_price,
              price: item.price,
              COMMON: item.COMMON,
            };
          }).filter(Boolean),
        })
      );
    } catch (e) {
      return null;
    }
  }

  function sanitizeV2Result(payload) {
    if (!payload || typeof payload !== "object") return null;
    try {
      return JSON.parse(JSON.stringify(payload));
    } catch (e) {
      return null;
    }
  }

  function sanitizeResult(payload) {
    if (!payload) return null;
    if (Array.isArray(payload.Item)) return sanitizeV1Result(payload);
    if (payload.pools) return sanitizeV2Result(payload);
    return null;
  }

  function post(action, fields) {
    var brand = getBrandId();
    var route = getRouteId();
    if (!brand || !route) return false;
    lastBrand = brand;
    lastRoute = route;
    var body = {
      type: "selection_progress",
      v: 2,
      action: action,
      brand: brand,
      route: route,
      tagGroupsOrder: getTagGroupsOrder(),
      record: (fields && fields.record) || {},
      pinned: (fields && fields.pinned) || {},
      result: fields && Object.prototype.hasOwnProperty.call(fields, "result")
        ? fields.result
        : null,
      // 相容舊父層
      status:
        action === "clear" ? "cleared" : action === "complete" ? "completed" : "in_progress",
    };
    try {
      window.parent.postMessage(body, "*");
      return true;
    } catch (e) {
      console.warn("SelectionProgress post 失敗:", e);
      return false;
    }
  }

  root.SelectionProgress = {
    isLocked: function () {
      return locked;
    },
    lock: function () {
      locked = true;
    },
    unlock: function () {
      locked = false;
    },
    /** iframe 載入後通知父層再推 restore */
    notifyReady: function () {
      try {
        window.parent.postMessage({ type: "selection_bridge_ready", v: 3 }, "*");
        return true;
      } catch (e) {
        return false;
      }
    },
    /** 答題中：完成鎖定後不再上報 */
    answer: function (record, pinned) {
      if (locked) return false;
      return post("answer", {
        record: record || {},
        pinned: pinned || {},
        result: null,
      });
    },
    /** 結果頁：寫入 Record + Result，並本地鎖定 */
    complete: function (record, result, pinned) {
      var safe = sanitizeResult(result);
      if (!safe) return false;
      var ok = post("complete", {
        record: record || {},
        pinned: pinned || {},
        result: safe,
      });
      if (ok) locked = true;
      return ok;
    },
    /** 重新開始 */
    clear: function () {
      locked = false;
      return post("clear", { record: {}, pinned: {}, result: null });
    },
    sanitizeResult: sanitizeResult,
  };

  // 腳本載入後立刻握手（onload 也可能再送 from_preview）
  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        root.SelectionProgress.notifyReady();
      });
    } else {
      root.SelectionProgress.notifyReady();
    }
  } catch (e) {
    /* ignore */
  }
})(typeof window !== "undefined" ? window : globalThis);
