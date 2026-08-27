/**
 * 依 URL ?v= 載入對應版本腳本與（v2）樣式。
 * 需先載入 js/shared/version.js
 */
(function (global) {
  function resolveVersion() {
    if (
      global.NoMediaVersion &&
      typeof global.NoMediaVersion.resolveNoMediaVersion === "function"
    ) {
      return global.NoMediaVersion.resolveNoMediaVersion();
    }
    try {
      var raw = (
        new URLSearchParams(global.location.search).get("v") || ""
      )
        .trim()
        .toLowerCase();
      if (raw === "v2" || raw === "2") return "v2";
    } catch (_) {}
    return "v1";
  }

  var version = resolveVersion();
  global.__NO_MEDIA_VERSION = version;

  function writeScript(src) {
    document.write('<script src="' + src + '"><\/script>');
  }

  function writeStylesheet(href) {
    document.write(
      '<link rel="stylesheet" type="text/css" href="' + href + '">'
    );
  }

  // 共用 GA（必須在 iframe / embedded 之前）
  writeScript("js/shared/ga.js");
  writeStylesheet("css/intro_tour.css");
  writeScript("js/shared/intro-tour.js");

  if (version === "v2") {
    writeStylesheet("css/iframe_v2.css");
    writeScript("js/shared/usage-record.js");
  }

  writeScript("js/" + version + "/scroll-control.js");
  writeScript("js/" + version + "/iframe.js");

  // swiper 由 HTML 固定插入於此之間
  global.__NO_MEDIA_EMBEDDED_SRC = "js/" + version + "/embedded.js";
})(typeof window !== "undefined" ? window : this);
