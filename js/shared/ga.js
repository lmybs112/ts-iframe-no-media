/**
 * 共用 GA4 postMessage 追蹤（iframe 內不直接呼叫 gtag）
 * 需在 iframe 腳本之前載入。
 */
(function (global) {
  var DEBOUNCE_MS = 800;
  var trackEventLastSent = {};

  function getGa4KeyFromUrl(search) {
    try {
      if (
        global.NoMediaVersion &&
        typeof global.NoMediaVersion.getQueryParam === "function"
      ) {
        return global.NoMediaVersion.getQueryParam("ga", search);
      }
      var query =
        typeof search === "string"
          ? search
          : (global.location && global.location.search) || "";
      var params = new URLSearchParams(
        query.charAt(0) === "?" ? query : query ? "?" + query : ""
      );
      return (params.get("ga") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function isNoMediaGaDebug() {
    try {
      if (global.__NO_MEDIA_GA_DEBUG === true) return true;
      if (global.localStorage && global.localStorage.getItem("NO_MEDIA_GA_DEBUG") === "1") {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function isEmbeddedInIframe() {
    try {
      return global.parent && global.parent !== global;
    } catch (_) {
      return true;
    }
  }

  function getTrackEventDedupeKey(eventName, params) {
    var p = params || {};
    return [
      eventName,
      p.action || "",
      p.event_label || "",
      p.event_value || "",
      p.category || "",
      p.tag_group || "",
      p.step != null ? String(p.step) : "",
    ].join("|");
  }

  /**
   * @param {object} options
   * @param {string} options.prefix - 事件前綴，如 no-media_ / no-media_v2_
   * @param {string} [options.category=inffits_route]
   * @param {string} [options.defaultLabel=Track/NoMedia]
   * @param {function(): string} [options.getBrand]
   * @param {function(): string} [options.getRoute]
   * @param {string} [options.measurementId] - 可覆寫；預設讀 ?ga=
   */
  function createTrackInffitsEvent(options) {
    var opts = options || {};
    var prefix = opts.prefix || "no-media_";
    var category = opts.category || "inffits_route";
    var defaultLabel = opts.defaultLabel || "Track/NoMedia";
    var measurementId =
      opts.measurementId != null ? opts.measurementId : getGa4KeyFromUrl();

    return function trackInffitsEvent(eventName, params) {
      var p = params || {};
      var fullEventName =
        String(eventName || "").indexOf(prefix) === 0
          ? eventName
          : prefix + eventName;

      var now = Date.now();
      var dedupeKey = getTrackEventDedupeKey(fullEventName, p);
      var last = trackEventLastSent[dedupeKey] || 0;
      if (now - last < DEBOUNCE_MS) return;
      trackEventLastSent[dedupeKey] = now;

      var eventLabel =
        p.event_label != null && p.event_label !== ""
          ? String(p.event_label)
          : defaultLabel;

      var message = {
        header: "GA4Event",
        measurement_id: measurementId || "",
        event_action: fullEventName,
        event_category: p.event_category || category,
        event_label: eventLabel,
        value: typeof p.value === "number" ? p.value : 1,
      };

      if (p.action) message.action = p.action;

      var brand =
        typeof opts.getBrand === "function" ? opts.getBrand() : global.Brand;
      var route =
        typeof opts.getRoute === "function"
          ? opts.getRoute()
          : global.Route || global.current_Route || "";
      if (brand) message.brand = brand;
      if (route) message.route = route;

      if (isNoMediaGaDebug()) {
        try {
          console.log("[NO_MEDIA_GA]", message, p);
        } catch (_) {}
      }

      if (!isEmbeddedInIframe()) return;

      try {
        global.parent.postMessage(message, "*");
      } catch (_) {}
    };
  }

  function initNoMediaGa(options) {
    var opts = options || {};
    var measurementId =
      opts.measurementId != null ? opts.measurementId : getGa4KeyFromUrl();
    global.GA4Key = measurementId || "";
    global.TRACK_EVENT_PREFIX = opts.prefix || "no-media_";
    global.TRACK_EVENT_CATEGORY = opts.category || "inffits_route";
    global.trackInffitsEvent = createTrackInffitsEvent({
      prefix: global.TRACK_EVENT_PREFIX,
      category: global.TRACK_EVENT_CATEGORY,
      defaultLabel: opts.defaultLabel || "Track/NoMedia",
      measurementId: global.GA4Key,
      getBrand: opts.getBrand,
      getRoute: opts.getRoute,
    });
    return global.trackInffitsEvent;
  }

  global.NoMediaGa = {
    getGa4KeyFromUrl: getGa4KeyFromUrl,
    isNoMediaGaDebug: isNoMediaGaDebug,
    isEmbeddedInIframe: isEmbeddedInIframe,
    createTrackInffitsEvent: createTrackInffitsEvent,
    initNoMediaGa: initNoMediaGa,
  };
})(typeof window !== "undefined" ? window : this);
