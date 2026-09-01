/**
 * iframe UI 文案 i18n（zh-TW / en）
 * 需在 intro-tour、iframe.js 之前載入。
 */
(function (global) {
  "use strict";

  var DEFAULT_LANG = "zh-TW";
  var currentLang = DEFAULT_LANG;

  var MESSAGES = {
    "zh-TW": {
      "loading.text": "翻箱倒櫃找好物中，心動清單即將送上!",
      "recommend.title": "專屬商品推薦",
      "recommend.desc": "根據您的偏好，精選以下單品。",
      "recommend.descFallback": "目前無符合結果，推薦熱門商品給你。",
      "recommend.titleMore": "精選推薦商品",
      "recommend.descMore": "更多您可能喜愛的商品",
      "recommend.titleFallback": "猜你可能喜歡",
      "recommend.refresh": "刷新推薦",
      "intro.exclusiveInfo": "專屬資訊",
      "intro.hotSale": "熱銷排行榜",
      "intro.coupon": "優惠折扣",
      "intro.journey": "專屬旅程",
      "intro.footerDefault": "開啟個人化購物之旅",
      "intro.personalShop": "個人化購物",
      "intro.simpleTitle": "開啟精準購物之旅",
      "intro.start": "開始",
      "intro.privacy":
        '使用本服務，即代表您同意 infFITS <a href="https://inffits.com/Privacy.html" target="_blank">隱私權聲明</a> 及 <a href="https://inffits.com/Terms.html" target="_blank">使用條款</a>。',
      "intro.reminder":
        "您可以跳過部分提問，但我們建議完成整個選購流程，推薦結果將更精準。",
      "question.skip": "略過",
      "question.changeGroup": "換一組試試",
      "coupon.notStarted": "尚未開始",
      "tour.intro": "點「開始」進入個人化選購",
      "tour.introAdvanced": "點「個人化購物」開始體驗",
      "tour.introHotSale": "熱銷排行商品可以點擊查看詳情",
      "tour.question": "選一個最符合你的選項",
      "tour.questionBack": "上方左箭頭可以返回上一題",
      "tour.questionSkip": "上方右箭頭或右下方「略過」都可以略過這一題",
      "tour.changeGroup": "沒找到心儀選項？可以「換一組試試」",
      "tour.results": "這是依你的選擇精選的商品，點商品可查看詳情",
      "tour.resultsPin": "點圖釘可釘選喜歡的商品（可多選），刷新時會保留",
      "tour.resultsRefresh": "點「刷新推薦」可換一批商品；已釘選的會保留",
      "tour.resultsStartover": "想重新體驗？點這裡再玩一次",
      "tour.skip": "略過",
      "tour.gotIt": "知道了",
    },
    en: {
      "loading.text": "Finding great picks for you…",
      "recommend.title": "Picked for you",
      "recommend.desc": "Based on your preferences, here are our top picks.",
      "recommend.descFallback": "No exact matches — here are popular picks for you.",
      "recommend.titleMore": "More picks for you",
      "recommend.descMore": "Items you might also like",
      "recommend.titleFallback": "You might like",
      "recommend.refresh": "Refresh picks",
      "intro.exclusiveInfo": "For you",
      "intro.hotSale": "Best sellers",
      "intro.coupon": "Offers",
      "intro.journey": "Your journey",
      "intro.footerDefault": "Start your personalized shopping journey",
      "intro.personalShop": "Personalized shop",
      "intro.simpleTitle": "Start your tailored shopping journey",
      "intro.start": "Start",
      "intro.privacy":
        'By using this service, you agree to infFITS <a href="https://inffits.com/Privacy.html" target="_blank">Privacy Policy</a> and <a href="https://inffits.com/Terms.html" target="_blank">Terms of Use</a>.',
      "intro.reminder":
        "You can skip some questions, but completing the flow helps us recommend more accurately.",
      "question.skip": "Skip",
      "question.changeGroup": "Try another set",
      "coupon.notStarted": "Not started yet",
      "tour.intro": 'Tap "Start" for personalized shopping',
      "tour.introAdvanced": 'Tap "Personalized shop" to begin',
      "tour.introHotSale": "Tap a best seller to view details",
      "tour.question": "Choose the option that fits you best",
      "tour.questionBack": "Use the top-left arrow to go back",
      "tour.questionSkip": 'Use the top-right arrow or "Skip" below to skip',
      "tour.changeGroup": "Not finding a match? Tap \"Try another set\"",
      "tour.results": "Items picked for you — tap to view details",
      "tour.resultsPin": "Pin items you like (multi-select); pins stay when you refresh",
      "tour.resultsRefresh": 'Tap "Refresh picks" for new items; pinned ones stay',
      "tour.resultsStartover": "Want to start over? Tap here",
      "tour.skip": "Skip",
      "tour.gotIt": "Got it",
    },
  };

  function normalizeLang(raw) {
    var s = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!s) return DEFAULT_LANG;
    if (s === "en" || s.indexOf("en-") === 0) return "en";
    if (
      s === "zh-tw" ||
      s === "zh-hant" ||
      s === "zh" ||
      s.indexOf("zh-") === 0
    ) {
      return "zh-TW";
    }
    return DEFAULT_LANG;
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    currentLang = normalizeLang(lang);
    try {
      document.documentElement.lang =
        currentLang === "en" ? "en" : "zh-Hant";
    } catch (_) {}
    return currentLang;
  }

  function t(key) {
    var lang = currentLang;
    var table = MESSAGES[lang] || MESSAGES[DEFAULT_LANG] || {};
    if (Object.prototype.hasOwnProperty.call(table, key)) {
      return table[key];
    }
    var fallback = MESSAGES[DEFAULT_LANG] || {};
    return Object.prototype.hasOwnProperty.call(fallback, key)
      ? fallback[key]
      : key;
  }

  function applyDom(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (!scope.querySelectorAll) return;

    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });

    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (!key) return;
      el.innerHTML = t(key);
    });
  }

  function applyDynamicUi() {
    applyDom(document);
    try {
      if (global.IntroTour && typeof global.IntroTour.refreshUiCopy === "function") {
        global.IntroTour.refreshUiCopy();
      }
    } catch (_) {}
  }

  function initFromReady() {
    applyDom(document);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initFromReady);
    } else {
      initFromReady();
    }
  }

  global.NoMediaI18n = {
    DEFAULT_LANG: DEFAULT_LANG,
    MESSAGES: MESSAGES,
    normalizeLang: normalizeLang,
    getLang: getLang,
    setLang: setLang,
    t: t,
    applyDom: applyDom,
    applyDynamicUi: applyDynamicUi,
  };
})(typeof window !== "undefined" ? window : this);
