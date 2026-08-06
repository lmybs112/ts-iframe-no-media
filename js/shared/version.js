/**
 * URL 版本與 iframe src 組裝（v1 / v2）
 * - 空 / v1 / 1 → v1
 * - v2 / 2 → v2
 * - 其餘 → fallback v1
 */
(function (global) {
  function getSearchParams(search) {
    try {
      var query = typeof search === "string" ? search : "";
      if (!query && global.location) query = global.location.search || "";
      return new URLSearchParams(
        query.charAt(0) === "?" ? query : query ? "?" + query : ""
      );
    } catch (_) {
      return null;
    }
  }

  function getQueryParam(name, search) {
    var params = getSearchParams(search);
    if (!params) return "";
    return (params.get(name) || "").trim();
  }

  function resolveNoMediaVersion(search) {
    var raw = getQueryParam("v", search).toLowerCase();
    if (raw === "v2" || raw === "2") return "v2";
    return "v1";
  }

  function buildIframeContainerSrc(base, options) {
    var src = base || "./iframe_container_module.html";
    var opts = options || {};
    var query = [];
    var version = opts.v != null ? String(opts.v).trim() : "";
    var ga = opts.ga != null ? String(opts.ga).trim() : "";
    if (version) query.push("v=" + encodeURIComponent(version));
    if (ga) query.push("ga=" + encodeURIComponent(ga));
    if (query.length) src += (src.indexOf("?") >= 0 ? "&" : "?") + query.join("&");
    return src;
  }

  function getIframeContainerSrcFromLocation(base, search) {
    return buildIframeContainerSrc(base, {
      v: getQueryParam("v", search),
      ga: getQueryParam("ga", search),
    });
  }

  global.NoMediaVersion = {
    getQueryParam: getQueryParam,
    resolveNoMediaVersion: resolveNoMediaVersion,
    buildIframeContainerSrc: buildIframeContainerSrc,
    getIframeContainerSrcFromLocation: getIframeContainerSrcFromLocation,
  };
})(typeof window !== "undefined" ? window : this);
