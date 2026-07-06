(function (global) {
  "use strict";

  var TOTAL_DAYS = 7;
  var MILESTONES = [
    { day: 3, label: "驚喜小禮" },
    { day: 5, label: "專屬優惠" },
    { day: 7, label: "品牌大禮" },
  ];

  var currentBrand = "";

  function storageKey(brand) {
    return "INFS_CHECKIN_" + brand;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function dateStr(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function todayStr() {
    return dateStr(new Date());
  }

  function yesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return dateStr(d);
  }

  function loadState(brand) {
    try {
      var raw = localStorage.getItem(storageKey(brand));
      if (raw) {
        var s = JSON.parse(raw);
        if (!s.claimedGifts) s.claimedGifts = [];
        if (!s.giftPrizes) s.giftPrizes = {};
        return s;
      }
    } catch (_) {}
    return { streak: 0, cycle: 0, lastDate: null, claimedGifts: [], giftPrizes: {} };
  }

  function saveState(brand, state) {
    try {
      localStorage.setItem(storageKey(brand), JSON.stringify(state));
    } catch (_) {}
  }

  function getMilestoneLabel(day) {
    var found = MILESTONES.find(function (m) {
      return m.day === day;
    });
    return found ? found.label : "";
  }

  function getPendingGift(state) {
    for (var i = MILESTONES.length - 1; i >= 0; i--) {
      var d = MILESTONES[i].day;
      if (state.cycle >= d && state.claimedGifts.indexOf(d) === -1) {
        return d;
      }
    }
    return null;
  }

  function buildStamps(state) {
    var cycle = state.cycle;
    var claimed = state.claimedGifts || [];
    var prizes = state.giftPrizes || {};
    var stamps = [];
    for (var i = 1; i <= TOTAL_DAYS; i++) {
      var isGift = MILESTONES.some(function (m) {
        return m.day === i;
      });
      var filled = i <= cycle;
      var claimedGift = isGift && claimed.indexOf(i) !== -1;
      var prize = claimedGift ? prizes[String(i)] || prizes[i] || null : null;
      var hasPrize = !!(prize && prize.label);
      stamps.push({
        day: i,
        filled: filled,
        gift: isGift,
        claimable: isGift && filled && (!claimedGift || !hasPrize),
        claimed: claimedGift && hasPrize,
        viewable: claimedGift && hasPrize,
        prize: hasPrize ? prize : null,
      });
    }
    return stamps;
  }

  function publishState(state, toast) {
    var doneToday = state.lastDate === todayStr();
    var pendingGift = getPendingGift(state);
    var nextMilestone = MILESTONES.find(function (m) {
      return m.day > state.cycle;
    });

    var status;
    if (pendingGift) {
      status = "禮物已解鎖 · 點擊禮物圖示抽優惠";
    } else if (
      doneToday &&
      state.claimedGifts &&
      state.claimedGifts.length > 0
    ) {
      status = "今日已完成 · 點擊禮物圖示查看優惠";
    } else if (doneToday) {
      status = nextMilestone
        ? "今日已完成 · 再 " + (nextMilestone.day - state.cycle) + " 天得" + nextMilestone.label
        : "今日已完成 · 集點達標";
    } else {
      status = "體驗選物看到推薦即完成今日打卡";
    }

    window.parent.postMessage(
      {
        type: "checkin:state",
        brand: currentBrand,
        streak: state.streak,
        cycle: state.cycle,
        stamps: buildStamps(state),
        giftPrizes: state.giftPrizes || {},
        pendingGift: pendingGift,
        doneToday: doneToday,
        status: status,
        toast: toast || null,
      },
      "*"
    );
  }

  function claimGift(day, prize) {
    if (!currentBrand || !day) return;
    var state = loadState(currentBrand);
    var hasPrize = !!(prize && prize.label);
    var alreadyHasPrize =
      state.claimedGifts.indexOf(day) !== -1 &&
      state.giftPrizes &&
      state.giftPrizes[String(day)] &&
      state.giftPrizes[String(day)].label;

    if (alreadyHasPrize) return;

    if (!state.giftPrizes) state.giftPrizes = {};
    if (hasPrize) {
      state.giftPrizes[String(day)] = {
        label: prize.label,
        desc: prize.desc || "",
        code: prize.code || "",
      };
    }

    if (state.claimedGifts.indexOf(day) === -1) {
      state.claimedGifts.push(day);
    }

    if (day === TOTAL_DAYS) {
      state.cycle = 0;
      state.claimedGifts = [];
      state.giftPrizes = {};
    }

    saveState(currentBrand, state);
    publishState(state);
  }

  // 當使用者看到最後推薦結果時呼叫：記錄當日打卡（每天僅一次）
  function markCheckinComplete() {
    if (!currentBrand) return;

    var state = loadState(currentBrand);
    var today = todayStr();

    if (state.lastDate === today) {
      publishState(state);
      return;
    }

    if (state.lastDate === yesterdayStr()) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    state.cycle += 1;
    state.lastDate = today;

    var milestoneLabel = getMilestoneLabel(state.cycle);
    var toast = null;

    if (milestoneLabel) {
      toast = {
        message: "打卡成功 · 解鎖「" + milestoneLabel + "」",
        gift: true,
        openWheel: true,
        day: state.cycle,
      };
    } else {
      toast = { message: "打卡成功 · 連續 " + state.streak + " 天", gift: false };
    }

    saveState(currentBrand, state);
    publishState(state, toast);
  }

  function initCheckin(brand) {
    if (!brand) return;
    currentBrand = brand;
    publishState(loadState(brand));
  }

  window.addEventListener("message", function (event) {
    if (!event.data) return;
    if (event.data.type === "checkin:request" && currentBrand) {
      publishState(loadState(currentBrand));
    }
    if (event.data.type === "checkin:claim-gift" && currentBrand) {
      claimGift(event.data.day, event.data.prize);
    }
  });

  global.initCheckin = initCheckin;
  global.markCheckinComplete = markCheckinComplete;
})(window);
