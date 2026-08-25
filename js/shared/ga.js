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

  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  var DEFAULT_UTM_SOURCE = "inffits";
  var DEFAULT_UTM_MEDIUM = "iframe_ai_product";

  /** 組件內建 UTM：source／medium 固定；campaign 由 withReelCampaign 依有無拉霸填入 */
  function defaultUtm() {
    return {
      utm_source: DEFAULT_UTM_SOURCE,
      utm_medium: DEFAULT_UTM_MEDIUM,
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    };
  }

  function restoreDefaultSourceMedium(utm) {
    if (!utm) return utm;
    if (!String(utm.utm_source || "").trim()) utm.utm_source = DEFAULT_UTM_SOURCE;
    if (!String(utm.utm_medium || "").trim()) utm.utm_medium = DEFAULT_UTM_MEDIUM;
    return utm;
  }

  var activeGetUtm = null;

  /**
   * 依 from_preview 更新 UTM：鍵存在才覆寫（空字串＝清除），未出現的鍵維持原值。
   * source／medium 清空後回退組件預設，不必等宿主傳 utm_*。
   * @param {object} payload
   * @param {object} [current]
   */
  function applyUtmFromPayload(payload, current) {
    var next = defaultUtm();
    var prev = current || {};
    var src = payload || {};
    UTM_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(prev, key)) {
        next[key] = String(prev[key] == null ? "" : prev[key]);
      }
    });
    UTM_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        next[key] = String(src[key] == null ? "" : src[key]).trim();
      }
    });
    return restoreDefaultSourceMedium(next);
  }

  function appendNonEmptyUtm(message, utm) {
    if (!message || !utm) return;
    UTM_KEYS.forEach(function (key) {
      var val = utm[key] != null ? String(utm[key]).trim() : "";
      if (val) message[key] = val;
    });
  }

  /**
   * 把非空 utm_* 寫進商品 URL query（已有同名鍵則覆寫；保留其他參數與 hash）
   * @param {string} url
   * @param {{block?: string, utm?: object, hasReel?: boolean}} [options]
   */
  function appendUtmToProductUrl(url, options) {
    var raw = String(url == null ? "" : url).trim();
    if (!raw || /^javascript:/i.test(raw) || raw === "#") return raw;

    var opts = options || {};
    var utm = defaultUtm();
    if (typeof activeGetUtm === "function") {
      try {
        var current = activeGetUtm();
        if (current) utm = current;
      } catch (_) {}
    }
    if (opts.utm) {
      UTM_KEYS.forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(opts.utm, key)) {
          utm[key] = String(opts.utm[key] == null ? "" : opts.utm[key]).trim();
        }
      });
    }
    var click = productClickUtm({ block: opts.block });
    if (click.utm_content) utm.utm_content = click.utm_content;
    if (!String(utm.utm_campaign || "").trim()) {
      var hasReel = opts.hasReel;
      if (hasReel == null) {
        hasReel = global.TRACK_EVENT_PREFIX === "no-media_v2_";
      }
      utm = withReelCampaign(utm, !!hasReel);
      if (click.utm_content) utm.utm_content = click.utm_content;
    }
    restoreDefaultSourceMedium(utm);

    var pairs = [];
    UTM_KEYS.forEach(function (key) {
      var val = utm[key] != null ? String(utm[key]).trim() : "";
      if (val) pairs.push([key, val]);
    });
    if (!pairs.length) return raw;

    try {
      if (/^https?:\/\//i.test(raw) && typeof URL === "function") {
        var parsed = new URL(raw);
        pairs.forEach(function (kv) {
          parsed.searchParams.set(kv[0], kv[1]);
        });
        return parsed.toString();
      }
    } catch (_) {}

    var hash = "";
    var body = raw;
    var hashIdx = raw.indexOf("#");
    if (hashIdx >= 0) {
      hash = raw.slice(hashIdx);
      body = raw.slice(0, hashIdx);
    }
    var qIdx = body.indexOf("?");
    var path = qIdx >= 0 ? body.slice(0, qIdx) : body;
    var search = qIdx >= 0 ? body.slice(qIdx + 1) : "";
    var parts = [];
    if (search) {
      search.split("&").forEach(function (part) {
        if (!part) return;
        var eq = part.indexOf("=");
        var key = eq >= 0 ? part.slice(0, eq) : part;
        try {
          key = decodeURIComponent(key);
        } catch (_) {}
        if (UTM_KEYS.indexOf(key) >= 0) return;
        parts.push(part);
      });
    }
    pairs.forEach(function (kv) {
      parts.push(encodeURIComponent(kv[0]) + "=" + encodeURIComponent(kv[1]));
    });
    return (parts.length ? path + "?" + parts.join("&") : path) + hash;
  }

  /**
   * 商品點擊用的 UTM：只帶 content＝區塊；utm_term 不自動填
   * @param {{block?: string}} options
   */
  function productClickUtm(options) {
    var opts = options || {};
    var block = String(opts.block == null ? "" : opts.block).trim();
    var out = {};
    if (block) out.utm_content = block;
    return out;
  }

  /**
   * 依有無拉霸寫入 utm_campaign：無拉霸 no-media，有拉霸 no-media-reel
   * @param {object} utm
   * @param {boolean} hasReel
   */
  function withReelCampaign(utm, hasReel) {
    var next = defaultUtm();
    var src = utm || {};
    UTM_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        next[key] = String(src[key] == null ? "" : src[key]);
      }
    });
    next.utm_campaign = hasReel ? "no-media-reel" : "no-media";
    return restoreDefaultSourceMedium(next);
  }

  function utmFromEventParams(params) {
    var p = params || {};
    var out = {};
    UTM_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(p, key)) out[key] = p[key];
    });
    return out;
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
   * @param {function(): object} [options.getUtm]
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
      appendNonEmptyUtm(message, defaultUtm());
      if (typeof opts.getUtm === "function") {
        try {
          appendNonEmptyUtm(message, opts.getUtm() || {});
        } catch (_) {}
      }
      appendNonEmptyUtm(message, utmFromEventParams(p));

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
      getUtm: opts.getUtm,
    });
    activeGetUtm = typeof opts.getUtm === "function" ? opts.getUtm : null;
    return global.trackInffitsEvent;
  }

  global.NoMediaGa = {
    getGa4KeyFromUrl: getGa4KeyFromUrl,
    isNoMediaGaDebug: isNoMediaGaDebug,
    isEmbeddedInIframe: isEmbeddedInIframe,
    createTrackInffitsEvent: createTrackInffitsEvent,
    initNoMediaGa: initNoMediaGa,
    applyUtmFromPayload: applyUtmFromPayload,
    productClickUtm: productClickUtm,
    withReelCampaign: withReelCampaign,
    defaultUtm: defaultUtm,
    appendUtmToProductUrl: appendUtmToProductUrl,
    UTM_KEYS: UTM_KEYS,
  };
})(typeof window !== "undefined" ? window : this);
