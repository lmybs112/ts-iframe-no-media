/**
 * iframe 內多步驟遮罩引導（intro_mode 為 v1 / v2 時啟用）
 * 步驟：intro → 問答選標籤 → 返回／略過箭頭 →（可選）換一組 → 結果頁 → 點商品 →（可選）釘選 → 刷新推薦 → 再玩一次
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "inf-marketing-iframe-intro-tour-dismissed";
  var PAD = 8;

  var state = {
    enabled: false,
    featureEnabled: false,
    introModeOk: false,
    introMode: null,
    active: false,
    forced: false,
    step: null,
    questionTourDone: false, // 選標籤介紹是否已過
    questionBackSeen: false,
    questionSkipSeen: false,
    changeGroupTourDone: false,
    pendingChangeGroupRoute: null,
    changeGroupTimer: null,
    questionTimer: null,
    resultsTimer: null,
    resultsTourStarted: false,
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
    resultsRefresh: "點「刷新推薦」可換一批商品；已釘選的會保留",
    resultsStartover: "想重新體驗？點這裡再玩一次",
  };

  function getStepCopy(step) {
    if (step === "intro") {
      if (state.introMode === "v2") {
        return "點「個人化購物」開始體驗";
      }
      return STEP_COPY.intro;
    }
    return STEP_COPY[step] || "";
  }

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
      '<div class="intro-tour__blocker"></div>' +
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

    var blocker = root.querySelector(".intro-tour__blocker");
    if (blocker) {
      function swallowMaskPointer(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      blocker.addEventListener("click", swallowMaskPointer, true);
      blocker.addEventListener("touchend", swallowMaskPointer, true);
    }

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
    // 點 spotlight 目標即推進（touchend／click 皆聽，避免漏接）
    document.addEventListener("click", onDocTargetInteract, true);
    document.addEventListener("touchend", onDocTargetInteract, true);
  }

  /** 文案要求「點 X」的步驟：點目標等同「知道了」／關閉該步 */
  var TARGET_CLICK_STEPS = {
    intro: true,
    changeGroup: true,
    questionBack: true,
    questionSkip: true,
    resultsProduct: true,
    resultsPin: true,
    resultsRefresh: true,
    resultsStartover: true,
  };

  var lastTargetAdvanceAt = 0;

  function onDocTargetInteract(e) {
    if (!state.active || !state.step) return;
    if (!TARGET_CLICK_STEPS[state.step]) return;
    if (!isEventOnCurrentSpotlight(e)) return;
    var now = Date.now();
    if (now - lastTargetAdvanceAt < 400) return;
    lastTargetAdvanceAt = now;
    onSpotlightTargetClicked();
  }

  function isEventOnCurrentSpotlight(e) {
    var el = e.target;
    if (!el || !el.closest) return false;
    // 引導卡按鈕自行處理，勿當成目標互動
    if (el.closest("#intro-tour-root .intro-tour__card")) return false;

    var step = state.step;
    if (step === "intro") {
      return !!el.closest("#start-button");
    }
    if (step === "changeGroup") {
      return !!el.closest(".change-group-btn");
    }
    if (step === "questionBack") {
      var back = getTargetForStep("questionBack");
      return !!(back && (back === el || back.contains(el)));
    }
    if (step === "questionSkip") {
      var skipParts = getQuestionSkipTargets();
      if (skipParts.primary && (skipParts.primary === el || skipParts.primary.contains(el))) {
        return true;
      }
      if (skipParts.secondary && (skipParts.secondary === el || skipParts.secondary.contains(el))) {
        return true;
      }
      return false;
    }
    if (step === "resultsProduct") {
      return !!(
        el.closest("#container-recom .reel-link") ||
        el.closest("#container-recom .axd_selection a") ||
        el.closest("#container-recom .recom-item") ||
        el.closest("#container-recom .axd_selection")
      );
    }
    if (step === "resultsPin") {
      return !!el.closest("#container-recom .reel-pin-btn");
    }
    if (step === "resultsRefresh") {
      return !!el.closest("#recommend-btn");
    }
    if (step === "resultsStartover") {
      return !!el.closest("#startover");
    }
    return false;
  }

  function onSpotlightTargetClicked() {
    if (!state.active || !state.step) return;

    if (state.step === "intro") {
      hideTourUi();
      return;
    }
    if (state.step === "changeGroup") {
      state.changeGroupTourDone = true;
      hideTourUi();
      return;
    }
    // 點返回會換頁，只標記已看過並收起，勿在當頁開下一步
    if (state.step === "questionBack") {
      state.questionBackSeen = true;
      hideTourUi();
      return;
    }
    if (state.step === "questionSkip") {
      state.questionSkipSeen = true;
      return advanceAfterQuestionSkip();
    }
    if (state.step === "resultsProduct") {
      return advanceAfterResultsProduct();
    }
    if (state.step === "resultsPin") {
      return advanceAfterResultsPin();
    }
    if (state.step === "resultsRefresh") {
      showStep("resultsStartover");
      return;
    }
    if (state.step === "resultsStartover") {
      dismissTour(true);
    }
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
      return isTourTargetVisible(btn) ? btn : null;
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
    if (step === "resultsRefresh") {
      return document.querySelector("#recommend-btn");
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

  function updateBlockerClip(blocker, holeRects) {
    if (!blocker) return;
    if (!holeRects || !holeRects.length) {
      blocker.style.clipPath = "none";
      blocker.style.webkitClipPath = "none";
      return;
    }
    var w = global.innerWidth;
    var h = global.innerHeight;
    var parts =
      "polygon(evenodd, 0px 0px, " + w + "px 0px, " + w + "px " + h + "px, 0px " + h + "px";
    for (var i = 0; i < holeRects.length; i++) {
      var r = holeRects[i];
      var right = r.left + r.width;
      var bottom = r.top + r.height;
      parts += ", " + r.left + "px " + r.top + "px";
      parts += ", " + right + "px " + r.top + "px";
      parts += ", " + right + "px " + bottom + "px";
      parts += ", " + r.left + "px " + bottom + "px";
    }
    parts += ")";
    blocker.style.clipPath = parts;
    blocker.style.webkitClipPath = parts;
  }

  function hasChangeGroupFeatureOnCurrentQuestion() {
    var qContainer = getVisibleQuestionContainer();
    if (!qContainer) return false;
    return !!qContainer.querySelector(".change-group-btn");
  }

  function isChangeGroupTargetReady() {
    return !!getTargetForStep("changeGroup");
  }

  function tryShowChangeGroupStep() {
    if (!state.active || state.changeGroupTourDone) return false;
    if (!isChangeGroupTargetReady()) return false;
    showStep("changeGroup");
    return true;
  }

  function updateLayout() {
    var root = getRoot();
    if (!root || root.hidden || !state.step) return;

    var target = getTargetForStep(state.step);
    var blocker = root.querySelector(".intro-tour__blocker");
    var spotlight = root.querySelector(".intro-tour__spotlight:not(.intro-tour__spotlight--secondary)");
    var spotlight2 = root.querySelector(".intro-tour__spotlight--secondary");
    var card = root.querySelector(".intro-tour__card");
    if (!spotlight || !card) return;

    if (blocker) blocker.hidden = false;

    if (spotlight2) spotlight2.hidden = true;

    var holeRects = [];

    if (!target) {
      spotlight.hidden = true;
      if (state.step === "changeGroup") {
        hideTourUi();
        return;
      }
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.transform = "translate(-50%, -50%)";
      updateBlockerClip(blocker, []);
      return;
    }

    var rect = target.__introTourUnionRect
      ? target.__introTourUnionRect
      : target.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      spotlight.hidden = true;
      updateBlockerClip(blocker, []);
      return;
    }

    var sl = rect.left - PAD;
    var st = rect.top - PAD;
    var sw = rect.width + PAD * 2;
    var sh = rect.height + PAD * 2;

    spotlight.hidden = false;
    spotlight.style.top = st + "px";
    spotlight.style.left = sl + "px";
    spotlight.style.width = sw + "px";
    spotlight.style.height = sh + "px";

    holeRects.push({ left: sl, top: st, width: sw, height: sh });

    // 略過步驟：同時標出右下方「略過」
    if (state.step === "questionSkip" && spotlight2) {
      var skipParts = getQuestionSkipTargets();
      if (skipParts.secondary && isTourTargetVisible(skipParts.secondary)) {
        var rect2 = skipParts.secondary.getBoundingClientRect();
        var s2l = rect2.left - PAD;
        var s2t = rect2.top - PAD;
        var s2w = rect2.width + PAD * 2;
        var s2h = rect2.height + PAD * 2;
        spotlight2.hidden = false;
        spotlight2.style.top = s2t + "px";
        spotlight2.style.left = s2l + "px";
        spotlight2.style.width = s2w + "px";
        spotlight2.style.height = s2h + "px";
        holeRects.push({ left: s2l, top: s2t, width: s2w, height: s2h });
      }
    }

    updateBlockerClip(blocker, holeRects);

    var cardRect = card.getBoundingClientRect();
    var cardWidth = cardRect.width || 240;
    var cardHeight = cardRect.height || 100;
    var gap = 12;
    // 僅「選標籤」固定下方，避免擋住標題；箭頭／換一組仍貼近目標
    var pinCardToBottom = state.step === "question";

    var top;
    var left = rect.left + rect.width / 2 - cardWidth / 2;

    if (pinCardToBottom) {
      top = global.innerHeight - cardHeight - 24;
      left = (global.innerWidth - cardWidth) / 2;
    } else {
      top = rect.top - cardHeight - gap;
      if (top < 12) {
        top = rect.bottom + gap;
      }
    }

    left = Math.max(12, Math.min(left, global.innerWidth - cardWidth - 12));
    top = Math.max(12, Math.min(top, global.innerHeight - cardHeight - 12));

    card.style.transform = "none";
    card.style.left = left + "px";
    card.style.top = top + "px";
  }

  function showStep(step) {
    if (!state.active) return;

    // 換一組按鈕尚未露出時不顯示引導卡（避免只有文案、無高亮）
    if (step === "changeGroup" && !isChangeGroupTargetReady()) {
      hideTourUi();
      return;
    }

    ensureDom();
    var root = getRoot();
    var card = root.querySelector(".intro-tour__card");
    var text = root.querySelector(".intro-tour__text");
    var nextBtn = root.querySelector(".intro-tour__btn--next");
    if (!card || !text) return;

    state.step = step;
    root.hidden = false;
    card.hidden = false;
    text.textContent = getStepCopy(step) || "";

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
    notifyParentTourActive(false);
  }

  function notifyParentTourActive(active) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { header: "iframe_intro_tour", active: !!active },
          "*"
        );
      }
    } catch (e) {}
  }

  function resetSessionFlags() {
    state.questionTourDone = false;
    state.questionBackSeen = false;
    state.questionSkipSeen = false;
    state.changeGroupTourDone = false;
    state.pendingChangeGroupRoute = null;
    state.resultsTourStarted = false;
  }

  function startTour(options) {
    if (options && options.force) {
      state.forced = true;
      clearDismissedStored();
    }
    if (!shouldRun()) {
      notifyParentTourActive(false);
      return;
    }

    clearTimers();
    resetSessionFlags();
    state.active = true;
    notifyParentTourActive(true);
    showStep("intro");
  }

  function onNextClick() {
    if (!state.active) return;

    if (state.step === "question") {
      state.questionTourDone = true;
      return advanceAfterQuestionSelect();
    }
    if (state.step === "questionBack") {
      state.questionBackSeen = true;
      return advanceAfterQuestionBack();
    }
    if (state.step === "questionSkip") {
      state.questionSkipSeen = true;
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
      return advanceAfterResultsPin();
    }
    if (state.step === "resultsRefresh") {
      showStep("resultsStartover");
      return;
    }
    if (state.step === "resultsStartover") {
      dismissTour(true);
    }
  }

  function advanceAfterQuestionSelect() {
    return resumeQuestionChromeTour();
  }

  function advanceAfterQuestionBack() {
    if (!state.questionSkipSeen && getTargetForStep("questionSkip")) {
      showStep("questionSkip");
      return;
    }
    state.questionSkipSeen = true;
    return advanceAfterQuestionSkip();
  }

  function advanceAfterQuestionSkip() {
    if (!state.changeGroupTourDone && isChangeGroupTargetReady()) {
      showStep("changeGroup");
      return;
    }
    if (!state.changeGroupTourDone && hasChangeGroupFeatureOnCurrentQuestion()) {
      hideTourUi();
      return;
    }
    hideTourUi();
  }

  /** 補播尚未看過的：返回箭頭 → 略過 → 換一組 */
  function resumeQuestionChromeTour() {
    if (!state.questionBackSeen && getTargetForStep("questionBack")) {
      showStep("questionBack");
      return true;
    }
    state.questionBackSeen = true;

    if (!state.questionSkipSeen && getTargetForStep("questionSkip")) {
      showStep("questionSkip");
      return true;
    }
    state.questionSkipSeen = true;

    if (!state.changeGroupTourDone && isChangeGroupTargetReady()) {
      showStep("changeGroup");
      return true;
    }
    if (!state.changeGroupTourDone && hasChangeGroupFeatureOnCurrentQuestion()) {
      hideTourUi();
      return true;
    }
    hideTourUi();
    return false;
  }

  function hasPendingQuestionChrome() {
    return (
      !state.questionBackSeen ||
      !state.questionSkipSeen ||
      !state.changeGroupTourDone
    );
  }

  function advanceAfterResultsProduct() {
    if (getTargetForStep("resultsPin")) {
      showStep("resultsPin");
      return;
    }
    return advanceAfterResultsPin();
  }

  function advanceAfterResultsPin() {
    if (getTargetForStep("resultsRefresh")) {
      showStep("resultsRefresh");
      return;
    }
    showStep("resultsStartover");
  }

  function maybeShowChangeGroupStep(routeKey) {
    state.pendingChangeGroupRoute = String(routeKey || "").replaceAll(/[\s\.]/g, "");
  }

  global.IntroTour = {
    setIntroModeEnabled: function (mode, featureEnabled) {
      state.introMode = mode === "v1" || mode === "v2" ? mode : null;
      state.introModeOk = state.introMode !== null;
      if (typeof featureEnabled !== "undefined") {
        state.featureEnabled = !!featureEnabled;
      }
      refreshEnabled();
      if (state.active && state.step === "intro") {
        var root = getRoot();
        var textEl = root && root.querySelector(".intro-tour__text");
        if (textEl) textEl.textContent = getStepCopy("intro");
        scheduleLayout();
      }
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
      if (!state.active) return;

      maybeShowChangeGroupStep(routeKey);

      // 換頁後若換一組鈕尚未就緒，收起引導避免空提示框
      if (state.step === "changeGroup" && !isChangeGroupTargetReady()) {
        hideTourUi();
      }

      if (state.questionTimer) {
        clearTimeout(state.questionTimer);
      }
      state.questionTimer = setTimeout(function () {
        state.questionTimer = null;
        if (!state.active) return;
        if (!getVisibleQuestionContainer()) return;

        // 尚未介紹「選標籤」
        if (!state.questionTourDone) {
          showStep("question");
          return;
        }

        // 已選過標籤但還沒看完左右箭頭／換一組 → 在這一題補播
        if (hasPendingQuestionChrome()) {
          resumeQuestionChromeTour();
        }
      }, 500);
    },

    /** 換一組按鈕剛顯示時（iframe showChangeGroupBtn 呼叫） */
    onChangeGroupRevealed: function (routeKey) {
      if (!state.active || state.changeGroupTourDone) return;
      maybeShowChangeGroupStep(routeKey);
      if (!state.questionTourDone || !state.questionBackSeen || !state.questionSkipSeen) {
        return;
      }
      tryShowChangeGroupStep();
    },

    /** 使用者點「換一組試試」：結束此步，避免按鈕隱藏後引導框仍留著 */
    notifyChangeGroupClicked: function () {
      if (!state.active) return;
      state.changeGroupTourDone = true;
      if (state.step === "changeGroup") {
        hideTourUi();
      }
    },

    /** 使用者選標籤或略過：不略過尚未介紹的箭頭／換一組，下一題再補 */
    notifyQuestionAnswered: function () {
      if (!state.active) return;
      state.questionTourDone = true;
      clearTimers();
      // 目標點擊可能已推進到略過／換一組；勿再 hide 蓋掉下一步
      if (
        state.step === "questionSkip" ||
        state.step === "questionBack" ||
        state.step === "changeGroup"
      ) {
        return;
      }
      hideTourUi();
    },

    /** 結果頁顯示（同一輪引導只開一次；刷新推薦勿從頭重播） */
    onResultsReady: function () {
      if (!state.active) return;
      if (state.resultsTourStarted) return;

      state.resultsTourStarted = true;
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
