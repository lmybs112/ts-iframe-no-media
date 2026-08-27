/**
 * iframe 內多步驟遮罩引導（intro_mode 為 v1 / v2 時啟用）
 * 步驟：intro → 問答選標籤 → 返回／略過箭頭 →（可選）換一組 → 結果頁 → 點商品 →（可選）釘選 → 再玩一次
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "inf-marketing-iframe-intro-tour-dismissed";
  var PAD = 8;

  var state = {
    enabled: false,
    featureEnabled: false,
    introModeOk: false,
    active: false,
    forced: false,
    step: null,
    questionTourDone: false,
    changeGroupTourDone: false,
    pendingChangeGroupRoute: null,
    changeGroupTimer: null,
    questionTimer: null,
    resultsTimer: null,
  };

  var STEP_COPY = {
    intro: "點「開始」進入個人化選購",
    question: "選一個最符合你的選項",
    questionBack: "上方左箭頭可以返回上一題",
    questionSkip: "上方右箭頭或右下方「略過」都可以略過這一題",
    changeGroup: "沒找到心儀選項？可以「換一組試試」",
    results: "這是依你的選擇精選的商品",
    resultsProduct: "點商品可以開啟商品頁查看詳情",
    resultsPin: "點圖釘可釘選喜歡的商品（可多選），刷新時會保留",
    resultsStartover: "想重新體驗？點這裡再玩一次",
  };

  function isDismissedStored() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markDismissedStored() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  function clearDismissedStored() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function refreshEnabled() {
    state.enabled = state.featureEnabled && state.introModeOk;
  }

  function shouldRun() {
    return state.enabled && (state.forced || !isDismissedStored());
  }

  function ensureDom() {
    if (document.getElementById("intro-tour-root")) return;

    var root = document.createElement("div");
    root.id = "intro-tour-root";
    root.className = "intro-tour";
    root.hidden = true;
    root.innerHTML =
      '<div class="intro-tour__spotlight" hidden></div>' +
      '<div class="intro-tour__spotlight intro-tour__spotlight--secondary" hidden></div>' +
      '<div class="intro-tour__card" hidden>' +
      '  <p class="intro-tour__text"></p>' +
      '  <div class="intro-tour__actions">' +
      '    <button type="button" class="intro-tour__btn intro-tour__btn--skip">略過</button>' +
      '    <button type="button" class="intro-tour__btn intro-tour__btn--next">知道了</button>' +
      "  </div>" +
      "</div>";
    document.body.appendChild(root);

    var skipBtn = root.querySelector(".intro-tour__btn--skip");
    var nextBtn = root.querySelector(".intro-tour__btn--next");
    if (skipBtn) {
      skipBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dismissTour(true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        onNextClick();
      });
    }

    global.addEventListener("resize", scheduleLayout, { passive: true });
    global.addEventListener("scroll", scheduleLayout, true);
  }

  function getRoot() {
    return document.getElementById("intro-tour-root");
  }

  function scheduleLayout() {
    if (!state.active || !state.step) return;
    global.requestAnimationFrame(updateLayout);
  }

  function getTargetForStep(step) {
    if (step === "intro") {
      return document.querySelector("#start-button");
    }
    if (step === "question") {
      var container = getVisibleQuestionContainer();
      if (!container) return null;
      return (
        container.querySelector(".axd_selections.selection") ||
        container.querySelector(".selection_scroll") ||
        container.querySelector(".axd_selection")
      );
    }
    if (step === "questionBack") {
      return getQuestionBackArrowTarget();
    }
    if (step === "questionSkip") {
      return getQuestionSkipArrowTarget();
    }
    if (step === "changeGroup") {
      var qContainer = getVisibleQuestionContainer();
      if (!qContainer) return null;
      var btn = qContainer.querySelector(".change-group-btn");
      if (!btn || btn.classList.contains("change-group-btn--hidden")) return null;
      return btn;
    }
    if (step === "results") {
      return (
        document.querySelector("#container-recom .c_header") ||
        document.querySelector("#container-recom")
      );
    }
    if (step === "resultsProduct") {
      return getProductTourTarget();
    }
    if (step === "resultsPin") {
      return getPinTourTarget();
    }
    if (step === "resultsStartover") {
      return document.querySelector("#startover");
    }
    return null;
  }

  function isTourTargetVisible(el) {
    if (!el) return false;
    var style = global.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    var rect = el.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1;
  }

  /** 上方左箭頭：返回上一題（或回 intro） */
  function getQuestionBackArrowTarget() {
    var container = getVisibleQuestionContainer();
    if (!container) return null;
    var back =
      container.querySelector(".c_header .type_backarrow:not(.skip)") ||
      container.querySelector("img.type_backarrow:not(.skip)");
    return isTourTargetVisible(back) ? back : null;
  }

  /** 略過引導：回傳上方右箭頭；右下方「略過」由 secondary spotlight 一併標出 */
  function getQuestionSkipArrowTarget() {
    var parts = getQuestionSkipTargets();
    return parts.primary || null;
  }

  function getQuestionSkipTargets() {
    var container = getVisibleQuestionContainer();
    if (!container) return { primary: null, secondary: null };

    var topSkip =
      container.querySelector(".c_header .type_backarrow.skip") ||
      container.querySelector("img.type_backarrow.skip") ||
      container.querySelector(".c_header img.skip");
    var bottomSkip =
      container.querySelector(".con-footer a.skip") ||
      container.querySelector("a.skip");

    var topOk = isTourTargetVisible(topSkip);
    var bottomOk = isTourTargetVisible(bottomSkip);

    if (topOk && bottomOk) {
      return { primary: topSkip, secondary: bottomSkip };
    }
    if (topOk) return { primary: topSkip, secondary: null };
    if (bottomOk) return { primary: bottomSkip, secondary: null };
    return { primary: null, secondary: null };
  }

  /** 商品卡引導：涵蓋結果頁商品區 */
  function getProductTourTarget() {
    var area =
      document.querySelector("#container-recom .axd_selections") ||
      document.querySelector("#container-recom .selection") ||
      document.querySelector("#container-recom .reel-link") ||
      document.querySelector("#container-recom .axd_selection a.update_delete") ||
      document.querySelector("#container-recom .axd_selection");
    return area || null;
  }

  /** 釘選引導：涵蓋可見圖釘區域；無釘選鈕則回 null（v1 會跳過） */
  function getPinTourTarget() {
    var pins = document.querySelectorAll("#container-recom .reel-pin-btn");
    if (!pins.length) return null;

    var minL = Infinity;
    var minT = Infinity;
    var maxR = -Infinity;
    var maxB = -Infinity;
    var found = false;
    for (var i = 0; i < pins.length; i++) {
      var rect = pins[i].getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      found = true;
      minL = Math.min(minL, rect.left);
      minT = Math.min(minT, rect.top);
      maxR = Math.max(maxR, rect.right);
      maxB = Math.max(maxB, rect.bottom);
    }
    if (!found) return pins[0];

    var proxy = pins[0];
    proxy.__introTourUnionRect = {
      left: minL,
      top: minT,
      width: maxR - minL,
      height: maxB - minT,
      right: maxR,
      bottom: maxB,
    };
    return proxy;
  }

  function getVisibleQuestionContainer() {
    var list = document.querySelectorAll(".update_delete[id^='container-']");
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.id === "container-recom") continue;
      var style = global.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      return el;
    }
    return null;
  }

  function updateLayout() {
    var root = getRoot();
    if (!root || root.hidden || !state.step) return;

    var target = getTargetForStep(state.step);
    var spotlight = root.querySelector(".intro-tour__spotlight:not(.intro-tour__spotlight--secondary)");
    var spotlight2 = root.querySelector(".intro-tour__spotlight--secondary");
    var card = root.querySelector(".intro-tour__card");
    if (!spotlight || !card) return;

    if (spotlight2) spotlight2.hidden = true;

    if (!target) {
      spotlight.hidden = true;
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.transform = "translate(-50%, -50%)";
      return;
    }

    var rect = target.__introTourUnionRect
      ? target.__introTourUnionRect
      : target.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      spotlight.hidden = true;
      return;
    }

    spotlight.hidden = false;
    spotlight.style.top = rect.top - PAD + "px";
    spotlight.style.left = rect.left - PAD + "px";
    spotlight.style.width = rect.width + PAD * 2 + "px";
    spotlight.style.height = rect.height + PAD * 2 + "px";

    // 略過步驟：同時標出右下方「略過」
    if (state.step === "questionSkip" && spotlight2) {
      var skipParts = getQuestionSkipTargets();
      if (skipParts.secondary && isTourTargetVisible(skipParts.secondary)) {
        var rect2 = skipParts.secondary.getBoundingClientRect();
        spotlight2.hidden = false;
        spotlight2.style.top = rect2.top - PAD + "px";
        spotlight2.style.left = rect2.left - PAD + "px";
        spotlight2.style.width = rect2.width + PAD * 2 + "px";
        spotlight2.style.height = rect2.height + PAD * 2 + "px";
      }
    }

    var cardRect = card.getBoundingClientRect();
    var cardWidth = cardRect.width || 240;
    var cardHeight = cardRect.height || 100;
    var gap = 12;
    var top = rect.top - cardHeight - gap;
    var left = rect.left + rect.width / 2 - cardWidth / 2;

    if (top < 12) {
      top = rect.bottom + gap;
    }
    left = Math.max(12, Math.min(left, global.innerWidth - cardWidth - 12));
    top = Math.max(12, Math.min(top, global.innerHeight - cardHeight - 12));

    card.style.transform = "none";
    card.style.left = left + "px";
    card.style.top = top + "px";
  }

  function showStep(step) {
    if (!state.active) return;

    ensureDom();
    var root = getRoot();
    var card = root.querySelector(".intro-tour__card");
    var text = root.querySelector(".intro-tour__text");
    var nextBtn = root.querySelector(".intro-tour__btn--next");
    if (!card || !text) return;

    state.step = step;
    root.hidden = false;
    card.hidden = false;
    text.textContent = STEP_COPY[step] || "";

    if (step === "intro") {
      if (nextBtn) nextBtn.hidden = true;
    } else if (nextBtn) {
      nextBtn.hidden = false;
    }

    global.requestAnimationFrame(function () {
      updateLayout();
      global.requestAnimationFrame(updateLayout);
    });
  }

  function hideTourUi() {
    var root = getRoot();
    if (!root) return;
    root.hidden = true;
    var spotlight = root.querySelector(".intro-tour__spotlight:not(.intro-tour__spotlight--secondary)");
    var spotlight2 = root.querySelector(".intro-tour__spotlight--secondary");
    var card = root.querySelector(".intro-tour__card");
    if (spotlight) spotlight.hidden = true;
    if (spotlight2) spotlight2.hidden = true;
    if (card) card.hidden = true;
    state.step = null;
  }

  function clearTimers() {
    if (state.changeGroupTimer) {
      clearTimeout(state.changeGroupTimer);
      state.changeGroupTimer = null;
    }
    if (state.questionTimer) {
      clearTimeout(state.questionTimer);
      state.questionTimer = null;
    }
    if (state.resultsTimer) {
      clearTimeout(state.resultsTimer);
      state.resultsTimer = null;
    }
  }

  function dismissTour(persist) {
    clearTimers();
    state.active = false;
    state.forced = false;
    hideTourUi();
    if (persist) {
      markDismissedStored();
    }
  }

  function resetSessionFlags() {
    state.questionTourDone = false;
    state.changeGroupTourDone = false;
    state.pendingChangeGroupRoute = null;
  }

  function startTour(options) {
    if (options && options.force) {
      state.forced = true;
      clearDismissedStored();
    }
    if (!shouldRun()) return;

    clearTimers();
    resetSessionFlags();
    state.active = true;
    showStep("intro");
  }

  function onNextClick() {
    if (!state.active) return;

    if (state.step === "question") {
      state.questionTourDone = true;
      return advanceAfterQuestionSelect();
    }
    if (state.step === "questionBack") {
      return advanceAfterQuestionBack();
    }
    if (state.step === "questionSkip") {
      return advanceAfterQuestionSkip();
    }
    if (state.step === "changeGroup") {
      state.changeGroupTourDone = true;
      hideTourUi();
      return;
    }
    if (state.step === "results") {
      if (getTargetForStep("resultsProduct")) {
        showStep("resultsProduct");
        return;
      }
      return advanceAfterResultsProduct();
    }
    if (state.step === "resultsProduct") {
      return advanceAfterResultsProduct();
    }
    if (state.step === "resultsPin") {
      showStep("resultsStartover");
      return;
    }
    if (state.step === "resultsStartover") {
      dismissTour(true);
    }
  }

  function advanceAfterQuestionSelect() {
    if (getTargetForStep("questionBack")) {
      showStep("questionBack");
      return;
    }
    return advanceAfterQuestionBack();
  }

  function advanceAfterQuestionBack() {
    if (getTargetForStep("questionSkip")) {
      showStep("questionSkip");
      return;
    }
    return advanceAfterQuestionSkip();
  }

  function advanceAfterQuestionSkip() {
    if (!state.changeGroupTourDone && getTargetForStep("changeGroup")) {
      showStep("changeGroup");
      return;
    }
    hideTourUi();
  }

  function advanceAfterResultsProduct() {
    if (getTargetForStep("resultsPin")) {
      showStep("resultsPin");
      return;
    }
    showStep("resultsStartover");
  }

  function maybeShowChangeGroupStep(routeKey) {
    // 僅記錄；實際顯示在問答「知道了」之後
    state.pendingChangeGroupRoute = String(routeKey || "").replaceAll(/[\s\.]/g, "");
  }

  global.IntroTour = {
    setIntroModeEnabled: function (mode, featureEnabled) {
      state.introModeOk = mode === "v1" || mode === "v2";
      if (typeof featureEnabled !== "undefined") {
        state.featureEnabled = !!featureEnabled;
      }
      refreshEnabled();
      if (!state.enabled && state.active) {
        dismissTour(false);
      }
    },

    setGuideFeatureEnabled: function (enabled) {
      state.featureEnabled = !!enabled;
      refreshEnabled();
      if (!state.enabled && state.active) {
        dismissTour(false);
      }
    },

    start: startTour,

    restart: function () {
      resetSessionFlags();
      startTour({ force: true });
    },

    dismiss: function (persist) {
      dismissTour(persist !== false);
    },

    isActive: function () {
      return state.active;
    },

    /** intro 版面就緒（showIntroSimple / showIntroAdvanced 後） */
    onIntroPageReady: function () {
      if (!shouldRun()) return;
      if (state.active && state.step === "intro") {
        scheduleLayout();
        return;
      }
      startTour();
    },

    /** 使用者點 intro「開始」 */
    notifyIntroStartClicked: function () {
      if (!state.active) return;
      if (state.step === "intro") {
        hideTourUi();
      }
    },

    /** 問答頁顯示且打字／標籤就緒後 */
    onQuestionPageReady: function (routeKey) {
      if (!state.active || state.questionTourDone) return;

      if (state.questionTimer) {
        clearTimeout(state.questionTimer);
      }
      state.questionTimer = setTimeout(function () {
        state.questionTimer = null;
        if (!state.active || state.questionTourDone) return;
        if (!getVisibleQuestionContainer()) return;
        showStep("question");
        maybeShowChangeGroupStep(routeKey);
      }, 500);
    },

    /** 換一組按鈕剛顯示時（可選 hook） */
    onChangeGroupRevealed: function (routeKey) {
      if (!state.active || state.changeGroupTourDone || state.questionTourDone) return;
      maybeShowChangeGroupStep(routeKey);
    },

    /** 使用者選標籤或略過 */
    notifyQuestionAnswered: function () {
      if (!state.active) return;
      state.questionTourDone = true;
      state.changeGroupTourDone = true;
      if (state.step === "question" || state.step === "changeGroup") {
        hideTourUi();
      }
      clearTimers();
    },

    /** 結果頁顯示 */
    onResultsReady: function () {
      if (!state.active) return;
      clearTimers();
      hideTourUi();

      if (state.resultsTimer) {
        clearTimeout(state.resultsTimer);
      }
      state.resultsTimer = setTimeout(function () {
        state.resultsTimer = null;
        if (!state.active) return;
        if (!document.querySelector("#container-recom") ||
            global.getComputedStyle(document.querySelector("#container-recom")).display === "none") {
          return;
        }
        showStep("results");
      }, 600);
    },
  };
})(typeof window !== "undefined" ? window : this);
