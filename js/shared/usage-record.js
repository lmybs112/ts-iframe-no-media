/**
 * 拉霸結果頁 usage_record（營運追蹤）
 * 需在 v2 iframe.js 之前載入。
 */
(function (global) {
  var USAGE_RECORD_URL =
    "https://api.inffits.com/mkt_extensions_usage_record/extension/usage_record";

  function getPinnedState(reelCats, capsulePinned) {
    var cats = reelCats || [];
    var pinned = capsulePinned || {};
    var productCategory = [];
    var actionPtr = [];
    cats.forEach(function (cat, idx) {
      if (pinned[cat]) {
        productCategory.push(cat);
        actionPtr.push(idx);
      }
    });
    return { ProductCategory: productCategory, ActionPtr: actionPtr };
  }

  function getVisibleProducts(reelCats, capsulePools, capsuleIndex) {
    var out = [];
    var pools = capsulePools || {};
    var indexMap = capsuleIndex || {};
    (reelCats || []).forEach(function (cat) {
      var pool = pools[cat] || [];
      var idx = indexMap[cat];
      if (idx == null || idx < 0) idx = 0;
      var item = pool[idx];
      if (item) out.push(item);
    });
    return out;
  }

  /**
   * @param {object} opts
   * @param {string} opts.Action
   * @param {string} [opts.Brand]
   * @param {string} [opts.GVID]
   * @param {string} [opts.LGVID]
   * @param {string} [opts.MRID]
   * @param {array} [opts.ProductInfo]
   * @param {array} [opts.ProductCategory]
   * @param {array} [opts.ActionPtr]
   * @param {number} [opts.RedirectPtr] Redirect 專用：被點欄位在 reelCats／ProductInfo 的 index
   */
  function buildUsageBody(opts) {
    var o = opts || {};
    var action = o.Action || "";
    var body = {
      Brand: o.Brand != null ? String(o.Brand) : "",
      GVID: o.GVID != null ? String(o.GVID) : "",
      LGVID: o.LGVID != null ? String(o.LGVID) : "",
      MRID: o.MRID != null ? String(o.MRID) : "",
      Action: action,
      ProductInfo: Array.isArray(o.ProductInfo) ? o.ProductInfo : [],
    };
    var productCategory = Array.isArray(o.ProductCategory)
      ? o.ProductCategory
      : [];
    var actionPtr = Array.isArray(o.ActionPtr) ? o.ActionPtr : [];
    if (action === "Recom") {
      actionPtr = [];
    }
    // 空陣列不寫進 body，避免送出無意義的 ProductCategory／ActionPtr
    if (productCategory.length) body.ProductCategory = productCategory;
    if (actionPtr.length) body.ActionPtr = actionPtr;
    // RedirectPtr：僅 Redirect，且須為有效的非負整數
    if (action === "Redirect" && typeof o.RedirectPtr === "number") {
      var redirectPtr = o.RedirectPtr;
      if (redirectPtr >= 0 && Math.floor(redirectPtr) === redirectPtr) {
        body.RedirectPtr = redirectPtr;
      }
    }
    return body;
  }

  function postUsageRecord(data) {
    try {
      var fetchFn = global.fetch;
      if (typeof fetchFn !== "function") return;
      fetchFn(USAGE_RECORD_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(data || {}),
      }).catch(function () {});
    } catch (_) {}
  }

  global.NoMediaUsageRecord = {
    USAGE_RECORD_URL: USAGE_RECORD_URL,
    getPinnedState: getPinnedState,
    getVisibleProducts: getVisibleProducts,
    buildUsageBody: buildUsageBody,
    postUsageRecord: postUsageRecord,
  };
})(typeof window !== "undefined" ? window : this);
