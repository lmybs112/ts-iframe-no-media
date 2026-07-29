var reset;
var Route = "";
var Brand = "";
var MRID = "";
var GVID = "";
var LGVID = "";
var showOriginPrice = false;
/** true：features 選完依 RouteLinkedTags 過濾下一題；false：維持原本顯示全部 */
var useRouteLinkedTags = false;
var SpecifyTags = [];
var SpecifyKeywords = [];
var themeBackgroundImages = [];
var tags_chosen = {};
let startX, endX;
let current_route_path;
let current_Route;
let all_Route;
let isFirst = true;
let throttleTimer = null;
let formatTagGroupMap = {};
let isFetchCouponCalled = false;
let isForPreview = true || window.location.href
  .toLocaleLowerCase()
  .includes("myinffits")
var resList;
let isForReferral = window.location.href
  .toLocaleLowerCase()
  .includes("referral");
let firstResult = {};

// ===== GA4 事件追蹤（對齊 shirt-component：iframe 內不直接呼叫 gtag）=====
// 僅 postMessage 給父頁，由父頁 GTM（如 gtm_*.js）轉發 gtag
var GA4Key = ""; // measurement_id；空字串則交給父頁 GTM 預設 GA4KEY
var TRACK_EVENT_PREFIX = "no-media_v2_";
var TRACK_EVENT_CATEGORY = "inffits_route";
var TRACK_EVENT_DEBOUNCE_MS = 800; // 同一事件防連擊時間窗
var trackEventLastSent = {};

function getGa4KeyFromUrl() {
  try {
    var params = new URLSearchParams(window.location.search);
    return (params.get("ga") || "").trim();
  } catch (_) {
    return "";
  }
}

GA4Key = getGa4KeyFromUrl();

function isNoMediaGaDebug() {
  try {
    if (window.__NO_MEDIA_GA_DEBUG === true) return true;
    if (localStorage.getItem("NO_MEDIA_GA_DEBUG") === "1") return true;
  } catch (_) {}
  return false;
}

function isEmbeddedInIframe() {
  try {
    return window.parent && window.parent !== window;
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

function trackInffitsEvent(eventName, params) {
  var p = params || {};
  var fullEventName =
    eventName.indexOf(TRACK_EVENT_PREFIX) === 0
      ? eventName
      : TRACK_EVENT_PREFIX + eventName;

  var now = Date.now();
  var dedupeKey = getTrackEventDedupeKey(fullEventName, p);
  var last = trackEventLastSent[dedupeKey] || 0;
  if (now - last < TRACK_EVENT_DEBOUNCE_MS) return; // 防連擊
  trackEventLastSent[dedupeKey] = now;

  var eventLabel =
    p.event_label != null && p.event_label !== ""
      ? String(p.event_label)
      : "Track/NoMediaV2";

  var message = {
    header: "GA4Event",
    measurement_id: GA4Key || "",
    event_action: fullEventName,
    event_category: TRACK_EVENT_CATEGORY,
    event_label: eventLabel,
    value: typeof p.value === "number" ? p.value : 1,
  };

  // 開發對照用（父頁 GTM 若未接則不影響正式上報）
  if (p.action) message.action = p.action;
  if (Brand) message.brand = Brand;
  if (Route || current_Route) message.route = Route || current_Route || "";

  if (isNoMediaGaDebug()) {
    try {
      console.log("[NO_MEDIA_GA]", message, p);
    } catch (_) {}
  }

  // 非 iframe 嵌入：不送 GA（僅 debug log），對齊 shirt-component
  if (!isEmbeddedInIframe()) return;

  try {
    window.parent.postMessage(message, "*");
  } catch (_) {}
}

function throttle(fn, delay) {
  let isFirstCall = true; // 用來判斷是否是第一次調用
  return function (...args) {
    if (isFirstCall) {
      const messageData = {
        type: "removeLoading",
        value: true,
      };
      window.parent.postMessage(messageData, "*");
      fn.apply(this, args); // 第一次調用立即執行
      isFirstCall = false;
      throttleTimer = setTimeout(() => {
        throttleTimer = null; // 清除計時器
      }, delay);
    } else if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        fn.apply(this, args);
        throttleTimer = null;
      }, delay);
    }
  };
}

$(document).ready(function () {
  // 動態添加 Google 字體連結
  var googleFontLink = document.createElement("link");
  googleFontLink.rel = "preconnect";
  googleFontLink.href = "https://fonts.googleapis.com";
  document.head.appendChild(googleFontLink);

  var googleFontLink2 = document.createElement("link");
  googleFontLink2.rel = "preconnect";
  googleFontLink2.href = "https://fonts.gstatic.com";
  googleFontLink2.crossorigin = "anonymous";
  document.head.appendChild(googleFontLink2);

  var googleFontLink3 = document.createElement("link");
  googleFontLink3.rel = "stylesheet";
  googleFontLink3.href =
    "https://fonts.googleapis.com/css2?family=Chocolate+Classical+Sans&family=Figtree:ital,wght@0,300..900;1,300..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap";
  document.head.appendChild(googleFontLink3);
  $("#intro-page").on("pointerdown", function (e) {
    if ($(e.target).closest(".intro-content").length) {
      return; // 如果點擊在 .intro-content 內，則不執行後續操作
    }
    const messageData = {
      type: "closeModal",
      value: true,
    };
    $(".icon-reminder").removeClass("open");
    $(".text-reminder").removeClass("visible");
    $(".icon-inffits").removeClass("open");
    $(".text-inffits").removeClass("visible");
    window.parent.postMessage(messageData, "*");
  });
  $(".intro-content").on("pointerdown", function (e) {
    $(".icon-reminder").removeClass("open");
    $(".text-reminder").removeClass("visible");
    $(".icon-inffits").removeClass("open");
    $(".text-inffits").removeClass("visible");
  });
});

let isFetching = false; // 新增標誌
const get_recom_res = () => {
  if (isFetching) return;
  isFetching = true;
  $("#loadingbar_recom").show();
  if (isForReferral) {
    const messageData = {
      type: "loadingBar",
      value: true,
    };
    window.parent.postMessage(messageData, "*");
  }

  const formatTags = Object.fromEntries(
    Object.entries(tags_chosen)
      .map(([key, value]) => [
        key,
        value.filter((item) => item.Name !== "example"), // 過濾掉 Name 為 "example" 的項目
      ])
      .filter(([_, value]) => value.length > 0) // 移除值為空陣列的鍵
  );
  let options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      Brand: Brand,
      Tags: tags_chosen,
      NUM: 8,
      capsule: Brand === "AURASTRO" ? "材質" : true,
      SpecifyTags: {},
      SpecifyKeywords: [],
    }),
  };
  if (isForReferral) {
    const messageData = {
      type: "result_store",
      [`${Brand}_${current_route_path.Route}`]: tags_chosen,
    };
    window.parent.postMessage(messageData, "*");
  }

  var INFS_ROUTE_ORDER = !isForPreview
    ? JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) || []
    : [];
  INFS_ROUTE_ORDER.forEach((item, index) => {
    if (deepEqualWithoutKey(item, current_route_path, ["Record"])) {
      INFS_ROUTE_ORDER[index] = {
        ...item,
        Record: tags_chosen, // 修改 Record
      };
    }
  });
  var INFS_ROUTE_RES = !isForPreview
    ? JSON.parse(localStorage.getItem(`INFS_ROUTE_RES_${Brand}`)) || []
    : [];

  const matchIndex = INFS_ROUTE_ORDER.findIndex((item) =>
    deepEqualWithoutKey(item, current_route_path, ["Record"])
  );

  // 如果找到了，則將其移到 INFS_ROUTE_RES
  if ((matchIndex !== -1) & !isForPreview) {
    const matchedItem = INFS_ROUTE_ORDER.splice(matchIndex, 1)[0]; // 移除並取得物件
    INFS_ROUTE_RES.push(matchedItem); // 將物件推到 RES 陣列

    // 更新 localStorage
    if (!isForPreview) {
      localStorage.setItem(
        `INFS_ROUTE_ORDER_${Brand}`,
        JSON.stringify(INFS_ROUTE_ORDER)
      );
      localStorage.setItem(
        `INFS_ROUTE_RES_${Brand}`,
        JSON.stringify(INFS_ROUTE_RES)
      );
    }
  }
  // tags_chosen = {};

  fetch(
    "https://ldiusfc4ib.execute-api.ap-northeast-1.amazonaws.com/v0/extension/recom_product",
    options
  )
    .then((response) => response.json())
    .then(async (response) => {
      // setTimeout(() => {
      const messageData = {
        type: "result",
        value: true,
      };
      window.parent.postMessage(messageData, "*");
      firstResult = response;
      await show_results(response, true);
      // }, 1500);
    })
    .catch(() => {})
    .finally(() => {
      if (isForReferral) {
        const messageData = {
          type: "loadingBar",
          value: false,
        };
        window.parent.postMessage(messageData, "*");
      }
      setTimeout(() => {
        // 若結果頁尚未把 loading 收掉（例如仍在備援），此處保險關閉
        if ($("#container-recom").is(":visible")) {
          $("#loadingbar_recom").hide();
        }
        isFetching = false;
      }, 2200);
    });
};

const analyzeGenderInTags = (tags_chosen) => {
  let maleCount = 0;
  let femaleCount = 0;
  const maleNames = [];
  const femaleNames = [];
  
  // 遍歷所有標籤群組
  Object.values(tags_chosen).forEach(tagGroup => {
    tagGroup.forEach(tag => {
      const name = tag.Name;
      if (name.includes('男')) {
        maleCount++;
        maleNames.push(name);
      }
      if (name.includes('女')) {
        femaleCount++;
        femaleNames.push(name);
      }
    });
  });
  
  return {
    maleCount,
    femaleCount,
    maleNames,
    femaleNames,
    result: maleCount > femaleCount ?  "[\"男\"]" : femaleCount > maleCount ? "[\"女\"]" : null
  };
}

function getRandomElements(arr, count) {
  const result = [];
  const usedIndexes = new Set();
  if (!arr || arr.length === 0 || count <= 0) return result;

  while (result.length < count && result.length < arr.length) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!usedIndexes.has(randomIndex)) {
      result.push(arr[randomIndex]);
      usedIndexes.add(randomIndex);
    }
  }

  return result;
}

// 將第二支推薦 API（CDP）商品轉成拉霸用的格式
function formatCdpItemsToCapsule(dataSource) {
  if (!dataSource || dataSource.length === 0) return [];
  const pickCount = dataSource.length < 6 ? dataSource.length : 6;
  return getRandomElements(dataSource, pickCount).map(function (item) {
    var newItem = Object.assign({}, item);
    newItem.sale_price = item.sale_price
      ? parseInt(item.sale_price.replace(/\D/g, ""), 10).toLocaleString("en-US", {
          style: "currency",
          currency: "TWD",
          minimumFractionDigits: 0,
        })
      : "";
    newItem.price = parseInt(item.price.replace(/\D/g, ""), 10).toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "TWD",
        minimumFractionDigits: 0,
      }
    );
    return {
      Imgsrc: newItem.image_link,
      Link: newItem.link,
      ItemName: newItem.title,
      sale_price: newItem.sale_price,
      price: newItem.price,
      ...newItem,
    };
  });
}

function buildCdpRecommendRequest(isBackup) {
  var requestData = {
    Brand: Brand,
    LGVID: LGVID || "",
    MRID: MRID || "",
    GVID: GVID || "",
    recom_num: "12",
  };
  if (isBackup) {
    requestData.PID = "搭配商品的pid";
    requestData.SP_PID = "xxSOCIAL PROOF";
  } else {
    requestData.PID = "";
    requestData.SP_PID = "skip";
  }
  if (Brand.toLocaleUpperCase() === "VER") {
    var series_in = analyzeGenderInTags(tags_chosen).result;
    if (series_in) requestData.series_in = series_in;
  }
  return requestData;
}

function getCdpRecommendApiUrl() {
  var api_recom_product_url =
    Brand.toLocaleUpperCase() === "VER"
      ? "HTTP_stock_cdp_product_recommendation"
      : "HTTP_inf_bhv_cdp_product_recommendation";
  return (
    "https://api.inffits.com/" + api_recom_product_url + "/extension/recom_product"
  );
}

// 呼叫第二支推薦 API，回傳拉霸可用的商品陣列
async function fetchFallbackRecommendItems() {
  async function requestOnce(isBackup) {
    var response = await fetch(getCdpRecommendApiUrl(), {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(buildCdpRecommendRequest(isBackup)),
    });
    var data = await response.json();
    var dataSource =
      data["bhv"] && data["bhv"].length > 0 ? data["bhv"] : data["sp_atc"];
    return formatCdpItemsToCapsule(dataSource);
  }

  try {
    var primary = await requestOnce(false);
    if (primary.length > 0) return primary;
  } catch (_) {}

  try {
    return await requestOnce(true);
  } catch (_) {
    return [];
  }
}

// 空的分類池改用第二支推薦 API 補齊；補不到則移除該欄，避免出現空卡
async function fillEmptyCapsulePools(pools) {
  var cats = Object.keys(pools);
  var emptyCats = cats.filter(function (c) {
    return !pools[c] || pools[c].length === 0;
  });
  if (emptyCats.length === 0) return pools;

  var fallbackItems = await fetchFallbackRecommendItems();
  var next = {};
  cats.forEach(function (c) {
    if (pools[c] && pools[c].length > 0) next[c] = pools[c];
  });

  if (fallbackItems.length === 0) return next;

  var cursor = 0;
  emptyCats.forEach(function (cat) {
    var need = Math.max(
      1,
      Math.floor(fallbackItems.length / emptyCats.length)
    );
    var chunk = [];
    for (var i = 0; i < need; i++) {
      chunk.push(fallbackItems[cursor % fallbackItems.length]);
      cursor += 1;
    }
    next[cat] = chunk;
  });
  return next;
}

const getEmbedded = async () => {
  try {
    const formatItems = await fetchFallbackRecommendItems();
    if (!formatItems || formatItems.length === 0) {
      $("#startover").click();
      return;
    }

    const formatData = {
      Item: formatItems,
    };

    $("#recommend-title").text("猜你可能喜歡");
    $("#recommend-desc").text("目前無符合結果，推薦熱門商品給你。");
    $("#recommend-btn").text("刷新推薦");
    show_results(formatData);
  } catch (err) {
    $("#startover").click();
  }
};

// ===== 拉霸結果頁 (capsule slot machine) =====
// 預設三欄（capsule: true）；AURASTRO 等會改為 API 回傳的動態 key（如材質）
const DEFAULT_REEL_CATS = ["Tops", "Bottoms", "Dresses"];
let reelCats = DEFAULT_REEL_CATS.slice();
let capsulePools = {};
let capsuleIndex = {};
let capsulePinned = {};
let isSpinning = false;

// 判斷 Item 是否為「分類 → 商品陣列」的分組結構
function isGroupedCapsuleItem(item) {
  if (!item || Array.isArray(item) || typeof item !== "object") return false;
  const keys = Object.keys(item);
  if (keys.length === 0) return false;
  return keys.every(function (k) {
    return Array.isArray(item[k]);
  });
}

// 將 API 回傳整理成分類商品池；支援 Tops/Bottoms/Dresses 或動態材質 key
// 若為扁平陣列（備援熱門商品）則平均分配到預設三欄
function normalizeCapsulePools(response) {
  const item = response && response.Item;
  if (isGroupedCapsuleItem(item)) {
    const pools = {};
    Object.keys(item).forEach(function (k) {
      pools[k] = item[k] || [];
    });
    return pools;
  }
  const arr = Array.isArray(item) ? item : [];
  const pools = {};
  DEFAULT_REEL_CATS.forEach(function (c) {
    pools[c] = [];
  });
  arr.forEach(function (it, idx) {
    pools[DEFAULT_REEL_CATS[idx % DEFAULT_REEL_CATS.length]].push(it);
  });
  return pools;
}

// 以淡入方式載入圖片 (沿用原本 c-recom 淡入邏輯)
function setReelImage($img, src) {
  $img.css("opacity", 0);
  const realImg = new Image();
  realImg.src = src;
  $(realImg)
    .on("load", function () {
      $img.attr("src", src);
      $img.stop(true).animate({ opacity: 1 }, 600);
    })
    .on("error", function () {
      $img.attr("src", "./../../img/img-default-large.png");
      $img.stop(true).animate({ opacity: 1 }, 600);
    });
}

function formatRecomPrice(item) {
  if (!item) return "-";
  if (showOriginPrice) return item.price || item.sale_price || "-";
  return item.sale_price || item.price || "-";
}

// 渲染單一欄位目前選中的商品
function renderCapsuleReel(cat) {
  const $slot = $(`#container-recom .reel-slot[data-cat="${cat}"]`);
  if (!$slot.length) return;
  const pool = capsulePools[cat] || [];
  const $roller = $slot.find(".reel-roller");
  $roller.removeClass("spinning").css({ transition: "none", transform: "none" });
  $slot.find(".reel-window").css("height", "");

  if (pool.length === 0) {
    $slot.find(".reel-link").attr("href", "javascript:void(0)");
    $roller.html(`<div class="reel-empty">此類別暫無符合商品</div>`);
    $slot.find(".recom-text").text("—");
    $slot.find(".recom-price").text("");
    return;
  }

  const item = pool[capsuleIndex[cat]] || pool[0];
  const priceText = formatRecomPrice(item);
  const imgSrc = (item.Imgsrc || item.image_link || "").trim();
  const link = item.Link || item.link || "javascript:void(0)";

  $slot.find(".reel-link").attr("href", link);
  $roller.html(
    `<img loading="lazy" class="c-recom reel-img" data-item="0" src="./../../img/img-default-large.png" onerror="this.onerror=null;this.src='./../../img/img-default-large.png'">`
  );
  setReelImage($roller.find("img.reel-img"), imgSrc);
  $slot.find(".recom-text").text(item.ItemName || "");
  $slot.find(".recom-price").text(priceText);
}

// 建立拉霸欄位（欄位數與標題依 reelCats 動態決定）
function buildCapsuleReels() {
  const $sel = $("#container-recom").find(".axd_selections");
  $sel.html("");
  reelCats.forEach((cat) => {
    const pinned = capsulePinned[cat] ? " reel-pinned" : "";
    const safeCat = String(cat)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    $sel.append(`
      <div class="axd_selection cursor-pointer update_delete reel-slot${pinned}" data-cat="${safeCat}">
        <button type="button" class="reel-pin-btn" data-cat="${safeCat}" title="固定此欄" aria-label="固定此欄">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76V6a3 3 0 0 1 6 0v4.76a2 2 0 0 0 .55 1.38l1.94 2.06A1 1 0 0 1 16.77 17H7.23a1 1 0 0 1-.72-1.8l1.94-2.06A2 2 0 0 0 9 10.76z"/></svg>
        </button>
        <a href="javascript:void(0)" target="_blank" class="update_delete reel-link" style="text-decoration: none;" onclick="openDetailDialog()">
          <p class="reel-cat-label">${safeCat}</p>
          <div class="reel-window">
            <div class="reel-roller"></div>
          </div>
          <div class="recom-info">
            <p class="recom-text item-title line-ellipsis-2"></p>
            <div class="discount-content">
              <p class="item-price recom-price"></p>
            </div>
          </div>
        </a>
      </div>
    `);
  });

  reelCats.forEach((cat) => renderCapsuleReel(cat));

  const selectionContainer = document.querySelector(
    `#container-recom .selection`
  );
  if (selectionContainer) {
    selectionContainer.classList.toggle("three-elements", reelCats.length === 3);
  }
}

// Apple 風格的減速曲線 (easeOutExpo)，末段以近乎靜止的速度落定
const REEL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// 轉動圖磚：明確傳入每格高度，避免 aspect-ratio 在各裝置算出不同小數值
function reelStripImg(src, tileH) {
  return `<img class="c-recom reel-img" style="height:${tileH}px;min-height:${tileH}px" src="${src}" onerror="this.onerror=null;this.src='./../../img/img-default-large.png'">`;
}

// 單一欄位：以一次性減速動畫精準落定到 finalIdx，並做無縫收尾
function animateReel(cat, finalIdx, done) {
  const $slot = $(`#container-recom .reel-slot[data-cat="${cat}"]`);
  const pool = capsulePools[cat] || [];
  const $window = $slot.find(".reel-window");
  const $roller = $slot.find(".reel-roller");

  // getBoundingClientRect 回傳精確浮點數，避免 Math.round / offsetTop 造成的次像素誤差
  const h = $window[0].getBoundingClientRect().height;
  if (!h || pool.length === 0) {
    capsuleIndex[cat] = finalIdx;
    renderCapsuleReel(cat);
    done && done();
    return;
  }
  // 鎖定視窗高度，整段動畫採用統一高度的圖磚
  $window.css("height", h + "px");
  $slot.addClass("reel-spinning");

  // 組合滾輪：前段隨機填充圖 + 最後一張為最終商品
  // 每格明確設定 height = h，確保 FILLERS × h 精準等於最終圖磚頂部距離
  const FILLERS = 10;
  let html = "";
  for (let k = 0; k < FILLERS; k++) {
    const rnd = pool[Math.floor(Math.random() * pool.length)];
    html += reelStripImg((rnd.Imgsrc || rnd.image_link || "").trim(), h);
  }
  const fin = pool[finalIdx];
  html += reelStripImg((fin.Imgsrc || fin.image_link || "").trim(), h);

  // 轉動一開始就把名稱/價格換成最終商品 (趁模糊過程中切換)
  $slot.find(".recom-text").text(fin.ItemName || "");
  $slot.find(".recom-price").text(formatRecomPrice(fin));
  $slot
    .find(".reel-link")
    .attr("href", fin.Link || fin.link || "javascript:void(0)");

  // 起始歸零（無過場），強制 reflow 後於下一影格啟動位移
  const $link = $slot.find(".reel-link");
  $link.css({ animation: "", filter: "" });
  $roller
    .css({ transition: "none", transform: "translate3d(0,0,0)", animation: "", filter: "" })
    .html(html);
  void $roller[0].offsetHeight;

  // 距離 = FILLERS × h (精確浮點)，每格已明確設 height:h，兩者完全對齊
  const distance = FILLERS * h;
  const duration = 1150 + Math.floor(Math.random() * 300);

  requestAnimationFrame(() => {
    $roller.css({
      transition: `transform ${duration}ms ${REEL_EASE}`,
      transform: `translate3d(0, -${distance}px, 0)`,
    });
    // 輕微動態模糊：套在整張卡片，讓圖片、名稱與價格一起模糊→對焦
    $link.css("animation", `reelMotionBlur ${duration}ms ease-out`);
  });

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    $roller.off("transitionend.reel");
    capsuleIndex[cat] = finalIdx;

    // 無縫收尾：保留最終圖、移除其餘圖磚並把位移歸零 (視覺位置不變、不閃爍)
    const $imgs = $roller.children("img");
    const $finalImg = $imgs.last();
    $imgs.not($finalImg).remove();
    $roller.css({ transition: "none", transform: "none", animation: "", filter: "" });
    $link.css({ animation: "", filter: "" });
    $window.css("height", "");
    $slot.removeClass("reel-spinning");

    // 還原成靜止商品樣式 (重用同一張已載入的圖，避免重新淡入)
    $finalImg.css({ opacity: 1, height: "", minHeight: "" });

    done && done();
  };

  $roller.on("transitionend.reel", function (e) {
    if (e.target === $roller[0]) settle();
  });
  // 後備：避免 transitionend 偶發未觸發
  setTimeout(settle, duration + 220);
}

// 轉動拉霸 (略過已釘選的欄位)；三欄略微錯開落定，做出 Apple 式層次感
function spinCapsuleReels(cats) {
  if (isSpinning) return;
  const active = cats.filter(
    (c) => !capsulePinned[c] && (capsulePools[c] || []).length > 0
  );
  if (active.length === 0) return;
  isSpinning = true;

  trackInffitsEvent("spin_capsule", {
    action: "spin_reels",
    event_label: "拉霸轉動",
    categories: active.join(","),
    pinned: cats
      .filter(function (c) {
        return capsulePinned[c];
      })
      .join(","),
  });

  let pending = active.length;
  const onOne = () => {
    pending -= 1;
    if (pending <= 0) isSpinning = false;
  };

  active.forEach((c, i) => {
    const finalIdx = Math.floor(Math.random() * capsulePools[c].length);
    setTimeout(() => animateReel(c, finalIdx, onOne), i * 110);
  });
}

// 釘選 / 取消釘選
function toggleCapsulePin(cat) {
  capsulePinned[cat] = !capsulePinned[cat];
  $(`#container-recom .reel-slot[data-cat="${cat}"]`).toggleClass(
    "reel-pinned",
    capsulePinned[cat]
  );
  trackInffitsEvent("click_reel_pin", {
    action: capsulePinned[cat] ? "pin" : "unpin",
    event_label: cat,
    event_value: capsulePinned[cat] ? "pin" : "unpin",
    pinned: capsulePinned[cat],
  });
}

// 釘選按鈕事件 (事件委託；button 在 <a> 之外，不會觸發跳轉)
$(document).on("click", "#container-recom .reel-pin-btn", function (e) {
  e.preventDefault();
  e.stopPropagation();
  const cat = $(this).attr("data-cat");
  if (cat) toggleCapsulePin(cat);
});

// 點擊拉霸商品
$(document).on("click", "#container-recom .reel-link", function () {
  const $slot = $(this).closest(".reel-slot");
  const cat = $slot.attr("data-cat") || "";
  const title = $slot.find(".recom-text").text() || "";
  const link = $(this).attr("href") || "";
  const price = $slot.find(".recom-price").text() || "";
  trackInffitsEvent("click_reel_item", {
    action: "reel_item_click",
    event_label: title,
    event_value: link,
    category: cat,
    price: price,
  });
});

const show_results = async (response, isFirst = false) => {
  let pools = normalizeCapsulePools(response);
  let cats = Object.keys(pools);
  let total = cats.reduce(function (sum, c) {
    return sum + (pools[c] || []).length;
  }, 0);

  if (total === 0 || !response) {
    getEmbedded();
    localStorage.setItem(`INFS_ROUTE_RES_${Brand}`, JSON.stringify([]));
    return;
  }

  // 任一分類為空：用第二支推薦 API 補齊；仍空則不顯示該欄
  const hasEmpty = cats.some(function (c) {
    return !pools[c] || pools[c].length === 0;
  });
  if (hasEmpty) {
    pools = await fillEmptyCapsulePools(pools);
    cats = Object.keys(pools);
    total = cats.reduce(function (sum, c) {
      return sum + (pools[c] || []).length;
    }, 0);
    if (total === 0) {
      getEmbedded();
      localStorage.setItem(`INFS_ROUTE_RES_${Brand}`, JSON.stringify([]));
      return;
    }
  }

  // container-recom 暫不顯示，等 preload 完成後再一起 show
  $("#container-recom").hide();
  reelCats = cats;
  capsulePools = pools;
  resList = cats.reduce(function (list, c) {
    return list.concat(pools[c] || []);
  }, []);

  const nextIndex = {};
  const nextPinned = {};
  cats.forEach(function (cat) {
    nextIndex[cat] = 0;
    nextPinned[cat] = isFirst ? false : !!capsulePinned[cat];
  });
  capsuleIndex = nextIndex;
  capsulePinned = nextPinned;

  buildCapsuleReels();

  // 預載各欄商品圖片，確保進入結果頁時已有圖可用
  // 每欄取 FILLERS(10) + 最終圖(1) + 1 緩衝 = 12 張
  const MAX_WAIT_MS = 4000; // 最長等待，避免網路慢時卡住

  // 先收集每欄「靜態預覽」那一張（capsuleIndex 對應的商品）並建立 preload Image 物件
  // key = src，value = Image 物件（已載入）；後續直接把 src 套進 DOM，不重新發請求
  const previewImgMap = {}; // src -> Image object
  const previewSrcs = [];   // 保持順序供 reel-roller 賦值用

  reelCats.forEach(function (cat) {
    const pool = capsulePools[cat] || [];
    // 靜態預覽圖：也預載全部 pool（供拉霸動畫隨機用）
    pool.forEach(function (item) {
      const src = (item.Imgsrc || item.image_link || "").trim();
      if (src && !previewImgMap[src]) {
        const imgObj = new Image();
        previewImgMap[src] = imgObj;
        imgObj.src = src; // 開始載入，瀏覽器快取
      }
    });
    // 記錄每欄靜態預覽圖的 src，方便等一下直接寫進 DOM
    const previewItem = pool[capsuleIndex[cat]] || pool[0];
    const previewSrc = previewItem ? (previewItem.Imgsrc || previewItem.image_link || "").trim() : "";
    previewSrcs.push({ cat, src: previewSrc });
  });

  // 等單張圖片「network 完成 + decode 完成」
  // img.decode() 確保 Safari 也完整 decode，比 onload 更嚴格
  const waitForImg = function (src) {
    const imgObj = previewImgMap[src];
    if (!imgObj) return Promise.resolve();
    const networkDone = imgObj.complete
      ? Promise.resolve()
      : new Promise(function (resolve) {
          imgObj.onload = resolve;
          imgObj.onerror = resolve;
        });
    return networkDone.then(function () {
      // decode() 確保像素已備妥，Safari 支援
      return typeof imgObj.decode === "function"
        ? imgObj.decode().catch(function () {})
        : Promise.resolve();
    });
  };

  // 只等靜態預覽那幾張（每欄一張）；拉霸隨機圖已在 previewImgMap 裡一併載入
  const previewOnlyUrls = previewSrcs.map(function (p) { return p.src; }).filter(Boolean);

  const timeoutPromise = new Promise(function (resolve) {
    setTimeout(resolve, MAX_WAIT_MS);
  });

  Promise.race([
    Promise.all(previewOnlyUrls.map(waitForImg)),
    timeoutPromise,
  ]).then(function () {
    // 把已 decode 的靜態預覽圖直接寫進 DOM，不觸發任何新請求
    previewSrcs.forEach(function (p) {
      if (!p.src) return;
      const $slot = $(`#container-recom .reel-slot[data-cat="${p.cat}"]`);
      const $img = $slot.find("img.reel-img");
      $img.stop(true).attr("src", p.src).css("opacity", 1);
    });

    // 等瀏覽器 paint 一幀後再切換畫面，確保圖片像素已上螢幕
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $("#loadingbar_recom").hide();
        $("#container-recom").show();
        requestAnimationFrame(function () {
          spinCapsuleReels(reelCats);
        });
      });
    });
  });
};

function openDetailDialog (){
  if(window.location.href.toLocaleLowerCase().includes("omo_v1")){
    event.preventDefault(); // 阻止 a 標籤的預設行為
    const messageData = {
      type: "openDetailDialog",
      value: true,
    };
    window.parent.postMessage(messageData, "*");
  }
}

// 深度比較函數（排除指定屬性）
function deepEqualWithoutKey(obj1, obj2, ignoreKeys = []) {
  const filteredObj1 = Object.fromEntries(
    Object.entries(obj1).filter(([key]) => !ignoreKeys.includes(key))
  );
  const filteredObj2 = Object.fromEntries(
    Object.entries(obj2).filter(([key]) => !ignoreKeys.includes(key))
  );
  return deepEqual(filteredObj1, filteredObj2);
}

// 通用深度比較函數
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
}

const fetchCoupon = async () => {
  if (isFetchCouponCalled) return;
  isFetchCouponCalled = true;
  const requestData = {
    Brand: Brand,
    Module: "Personalized_Landing_Widget",
  };

  const options = {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify(requestData),
  };
  const response = await fetch(
    "https://api.inffits.com/mkt_brand_config_proc/GetItems",
    options
  );
  const responseData = await response.json();
  const currentData = responseData.find(item => item.Module === 'Personalized_Landing_Widget');
  const data = currentData?.ConfigData?.Discount_Info || [{
    Title: '敬請期待',
    Description: '敬請期待',
    TimeValid: null,
    Code: '敬請期待',
    status: false,
  }];
  if (data && data.length > 0) {}
    $("#intro-coupon-modal__content-coupons").html(
      data
        .map((item) => {
          // 首先檢查 status
          if (item.status === false) {
            // 如果 status 為 false，顯示帶蒙層的優惠券
            return `
            <div class="intro-coupon-modal__content-container-content" style="position: relative;">
                <div class="intro-coupon-modal__content-container-content-icon">
                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet" style="width: 30px; height: 30px;">
                    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                      <path d="M78 4189 c-23 -12 -46 -35 -58 -59 -19 -38 -20 -58 -20 -520 0 -462 1 -482 20 -520 23 -46 81 -80 134 -80 111 0 228 -50 311 -134 71 -71 110 -147 127 -247 23 -131 -23 -277 -118 -379 -74 -79 -214 -140 -320 -140 -53 0 -111 -34 -134 -80 -19 -38 -20 -58 -20 -520 0 -462 1 -482 20 -520 13 -26 34 -47 60 -60 39 -20 53 -20 2480 -20 2427 0 2441 0 2480 20 26 13 47 34 60 60 20 39 20 56 20 1570 0 1514 0 1531 -20 1570 -13 26 -34 47 -60 60 -39 20 -53 20 -2482 20 -2413 -1 -2443 -1 -2480 -21z m1134 -378 c3 -107 13 -132 72 -175 40 -30 120 -29 165 3 47 34 61 75 61 181 l0 90 1655 0 1655 0 0 -1350 0 -1350 -1660 0 -1660 0 0 90 c0 112 -20 159 -80 190 -50 25 -90 25 -140 0 -60 -31 -80 -78 -80 -190 l0 -90 -450 0 -450 0 0 308 0 308 52 14 c196 50 374 200 471 395 56 115 71 183 71 325 0 129 -10 186 -56 295 -55 132 -183 276 -313 353 -67 39 -177 82 -210 82 -13 0 -15 38 -15 310 l0 310 454 0 454 0 4 -99z"></path>
                      <path d="M2765 3596 c-84 -21 -147 -57 -211 -121 -177 -176 -177 -453 1 -630 258 -259 695 -118 757 244 24 141 -22 281 -127 387 -112 113 -269 158 -420 120z m175 -306 c45 -23 80 -80 80 -130 0 -76 -74 -150 -151 -150 -46 0 -108 39 -130 82 -37 72 -14 151 57 194 48 29 92 30 144 4z"></path>
                      <path d="M4001 3592 c-28 -14 -139 -174 -654 -947 -678 -1017 -651 -969 -608 -1053 24 -46 80 -82 130 -82 84 0 59 -32 711 946 334 500 615 924 624 942 64 123 -76 257 -203 194z"></path>
                      <path d="M1278 3289 c-68 -35 -78 -71 -78 -279 0 -161 2 -185 20 -220 23 -45 80 -80 130 -80 50 0 107 35 130 80 18 35 20 59 20 220 0 161 -2 185 -20 220 -37 73 -127 99 -202 59z"></path>
                      <path d="M1278 2389 c-68 -35 -78 -71 -78 -279 0 -161 2 -185 20 -220 23 -45 80 -80 130 -80 50 0 107 35 130 80 18 35 20 59 20 220 0 161 -2 185 -20 220 -37 73 -127 99 -202 59z"></path>
                      <path d="M3965 2396 c-84 -21 -147 -57 -211 -121 -177 -176 -177 -453 1 -630 258 -259 695 -118 757 244 24 141 -22 281 -127 387 -112 113 -269 158 -420 120z m175 -306 c45 -23 80 -80 80 -130 0 -76 -74 -150 -151 -150 -46 0 -108 39 -130 82 -37 72 -14 151 57 194 48 29 92 30 144 4z"></path>
                    </g>
                  </svg>
                </div>
                <div class="intro-coupon-modal__content-container-content-line">
                  <svg xmlns="http://www.w3.org/2000/svg" width="2" height="44" viewBox="0 0 2 44" fill="none">
                    <path d="M1 1V43" stroke="#E0E0DF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 8"/>
                  </svg>
                </div>
                <div class="intro-coupon-modal__content-container-content-text">
                  <p>${item.Title}</p>
                  <div class="intro-coupon-modal__content-container-content-footer">
                    <p>${item.Description}</p>
                    <button class="intro-coupon-modal__btn--coupon intro-coupon-modal__btn--coupon--disabled">領取</button>
                  </div>
                </div>
                <!-- 蒙層 -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(255, 255, 255, 0.75);
                  backdrop-filter: blur(3px);
                  -webkit-backdrop-filter: blur(3px);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                  font-weight: bold;
                  color: #666;
                  border-radius: 8px;
                ">
                  敬請期待
                </div>
              </div>
        `;
          }
          
          // 如果 status 為 true，執行原本的日期判斷邏輯
          // 解析 TimeValid 日期範圍
          const timeValidParts = item.TimeValid ? item.TimeValid.split('~') : [];
          const startDate = timeValidParts[0] ? new Date(timeValidParts[0]) : null;
          const endDate = timeValidParts[1] ? new Date(timeValidParts[1]) : null;
          const currentDate = new Date();
          
          // 判斷按鈕狀態
          let buttonHtml = '';
          if (startDate && currentDate < startDate) {
            // 尚未開始
            buttonHtml = '<button class="intro-coupon-modal__btn--coupon intro-coupon-modal__btn--coupon--disabled">尚未開始</button>';
          } else if (endDate && currentDate > endDate) {
            // 已結束
            buttonHtml = '<button class="intro-coupon-modal__btn--coupon intro-coupon-modal__btn--coupon--disabled">已結束</button>';
          } else {
            // 可以領取
            buttonHtml = `
              <button class="intro-coupon-modal__btn--coupon intro-coupon-modal__btn--coupon--copy" onclick="copyCoupon('${item.Code}', this)">領取</button>
              <button class="intro-coupon-modal__btn--coupon intro-coupon-modal__btn--coupon--copied">已領取</button>
            `;
          }
          
          return `
          <div class="intro-coupon-modal__content-container-content">
              <div class="intro-coupon-modal__content-container-content-icon">
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet" style="width: 30px; height: 30px;">
                  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                    <path d="M78 4189 c-23 -12 -46 -35 -58 -59 -19 -38 -20 -58 -20 -520 0 -462 1 -482 20 -520 23 -46 81 -80 134 -80 111 0 228 -50 311 -134 71 -71 110 -147 127 -247 23 -131 -23 -277 -118 -379 -74 -79 -214 -140 -320 -140 -53 0 -111 -34 -134 -80 -19 -38 -20 -58 -20 -520 0 -462 1 -482 20 -520 13 -26 34 -47 60 -60 39 -20 53 -20 2480 -20 2427 0 2441 0 2480 20 26 13 47 34 60 60 20 39 20 56 20 1570 0 1514 0 1531 -20 1570 -13 26 -34 47 -60 60 -39 20 -53 20 -2482 20 -2413 -1 -2443 -1 -2480 -21z m1134 -378 c3 -107 13 -132 72 -175 40 -30 120 -29 165 3 47 34 61 75 61 181 l0 90 1655 0 1655 0 0 -1350 0 -1350 -1660 0 -1660 0 0 90 c0 112 -20 159 -80 190 -50 25 -90 25 -140 0 -60 -31 -80 -78 -80 -190 l0 -90 -450 0 -450 0 0 308 0 308 52 14 c196 50 374 200 471 395 56 115 71 183 71 325 0 129 -10 186 -56 295 -55 132 -183 276 -313 353 -67 39 -177 82 -210 82 -13 0 -15 38 -15 310 l0 310 454 0 454 0 4 -99z"></path>
                    <path d="M2765 3596 c-84 -21 -147 -57 -211 -121 -177 -176 -177 -453 1 -630 258 -259 695 -118 757 244 24 141 -22 281 -127 387 -112 113 -269 158 -420 120z m175 -306 c45 -23 80 -80 80 -130 0 -76 -74 -150 -151 -150 -46 0 -108 39 -130 82 -37 72 -14 151 57 194 48 29 92 30 144 4z"></path>
                    <path d="M4001 3592 c-28 -14 -139 -174 -654 -947 -678 -1017 -651 -969 -608 -1053 24 -46 80 -82 130 -82 84 0 59 -32 711 946 334 500 615 924 624 942 64 123 -76 257 -203 194z"></path>
                    <path d="M1278 3289 c-68 -35 -78 -71 -78 -279 0 -161 2 -185 20 -220 23 -45 80 -80 130 -80 50 0 107 35 130 80 18 35 20 59 20 220 0 161 -2 185 -20 220 -37 73 -127 99 -202 59z"></path>
                    <path d="M1278 2389 c-68 -35 -78 -71 -78 -279 0 -161 2 -185 20 -220 23 -45 80 -80 130 -80 50 0 107 35 130 80 18 35 20 59 20 220 0 161 -2 185 -20 220 -37 73 -127 99 -202 59z"></path>
                    <path d="M3965 2396 c-84 -21 -147 -57 -211 -121 -177 -176 -177 -453 1 -630 258 -259 695 -118 757 244 24 141 -22 281 -127 387 -112 113 -269 158 -420 120z m175 -306 c45 -23 80 -80 80 -130 0 -76 -74 -150 -151 -150 -46 0 -108 39 -130 82 -37 72 -14 151 57 194 48 29 92 30 144 4z"></path>
                  </g>
                </svg>
              </div>
              <div class="intro-coupon-modal__content-container-content-line">
                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="44" viewBox="0 0 2 44" fill="none">
                  <path d="M1 1V43" stroke="#E0E0DF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 8"/>
                </svg>
              </div>
                 <div class="intro-coupon-modal__content-container-content-text">
                <p>${item.Title}</p>
                <div class="intro-coupon-modal__content-container-content-footer">
                  <p>${item.Description}</p>
                  ${buttonHtml}
                </div>
              </div>
            </div>
      `;
        })
        .join("")
    );
    window.Product_Recommendation({
      brand: Brand,
      containerId: "hot-sale",
      customEdm: [],
      customPadding: "0px",
      backgroundColor: "#fff",
      title: "",
      arrowPosition: "none", // none, center, top (default: center)
      autoplay: false,
      hide_discount: true, // 隱藏折扣
      hide_size: true, // 隱藏尺寸
      bid: {
        HV: "165",
        WV: "45",
        CC: "97.5_97.5",
        DataItem: "0100",
        Shoulder: "",
        UpChest: "",
        DnChest: "",
        Waist: "",
        Hip: "",
        Brand: Brand,
        ClothID: "",
        Sizes: "",
        FitP: "0,0,0,0",
        Gender: "M",
        FMLpath: "FMLSep",
        BUS: "0",
        GVID: GVID || "",
        LGVID: LGVID || "",
        MRID: MRID || "INF",
        ga_id: "x",
        Pattern_Prefer: "1",
      },
      breakpoints: {
        480: {
          slidesPerView: 3.5,
          slidesPerGroup: 1,
          spaceBetween: 8,
          speed: 750,
          resistanceRatio: 0,
          grid: {
            rows: 1,
            fill: "row",
          },
        },
        0: {
          slidesPerView: 3.5,
          slidesPerGroup: 1,
          spaceBetween: 8,
          speed: 750,
          resistanceRatio: 0,
          grid: {
            rows: 1,
            fill: "row",
          },
        },
      },
    });
    // 响应父页面的高度请求
    window.addEventListener(
      "message",
      function (event) {
        if (event.data && event.data.type === "requestHeight") {
          // 获取当前文档高度
          const height =
            document.documentElement.offsetHeight || document.body.offsetHeight;
          // 发送高度信息给父页面
          window.parent.postMessage(
            {
              type: "setHeight",
              height: height,
            },
            "*"
          );
        }
      },
      false
    );

    // 页面加载和内容变化时也发送高度
    function sendHeight() {
      const height =
        document.documentElement.offsetHeight || document.body.offsetHeight;
      window.parent.postMessage(
        {
          type: "setHeight",
          height: height,
        },
        "*"
      );
    }

    // 页面加载完成后发送高度
    window.addEventListener("load", sendHeight);
    // 当窗口大小改变时发送高度
    window.addEventListener("resize", sendHeight);
    // 定期检查高度变化
    setInterval(sendHeight, 500);
  // } else {
  //   alert.log('沒有設置模組');
  //   $(".intro-content.intro-coupon-modal__content").show();
  //   $(".intro-content.intro-modal__content").hide();
  //   // $(".intro-content.intro-coupon-modal__content").hide();
  //   // $(".intro-content.intro-modal__content").show();
  // }
};

const CHANGE_GROUP_BTN_DELAY_MS = 0;
/** 與 CSS `tagFadeInSmooth` 時長一致 */
const TAG_FADE_IN_ANIMATION_MS = 400;
const changeGroupBtnTimers = {};
/** 重新開始／重渲染時遞增，讓過期 timer／animationend 失效 */
let changeGroupBtnGeneration = 0;

function clearAllChangeGroupBtnState() {
  Object.keys(changeGroupBtnTimers).forEach((key) => {
    clearTimeout(changeGroupBtnTimers[key]);
    delete changeGroupBtnTimers[key];
  });
  changeGroupBtnGeneration += 1;
  document.querySelectorAll(".change-group-btn").forEach((btn) => {
    btn.classList.add("change-group-btn--hidden");
  });
}

function hideChangeGroupBtn(target) {
  if (changeGroupBtnTimers[target]) {
    clearTimeout(changeGroupBtnTimers[target]);
    delete changeGroupBtnTimers[target];
  }
  const btn = document.querySelector(`#container-${target} .change-group-btn`);
  if (btn) btn.classList.add("change-group-btn--hidden");
}

/** 僅在選項已淡入且打字區已顯示時才允許出現按鈕 */
function canShowChangeGroupBtn(target) {
  const container = document.querySelector(`#container-${target}`);
  if (!container) return false;
  if (!container.querySelector(".change-group-btn")) return false;

  const slide = container.querySelector(".swiper-wrapper .swiper-slide");
  if (slide && !slide.classList.contains("typewriter-complete")) return false;

  const tags = getRouteTagElements(target);
  if (tags.length === 0) return false;
  return tags.every((tag) => tag.classList.contains("tag-fade-in"));
}

function showChangeGroupBtn(target, delayMs = CHANGE_GROUP_BTN_DELAY_MS) {
  if (changeGroupBtnTimers[target]) {
    clearTimeout(changeGroupBtnTimers[target]);
  }
  const generation = changeGroupBtnGeneration;
  changeGroupBtnTimers[target] = setTimeout(() => {
    delete changeGroupBtnTimers[target];
    if (generation !== changeGroupBtnGeneration) return;
    if (!canShowChangeGroupBtn(target)) return;
    const btn = document.querySelector(`#container-${target} .change-group-btn`);
    if (btn) btn.classList.remove("change-group-btn--hidden");
  }, delayMs);
}

/** 等最後一個標籤淡入動畫結束後再顯示「換一組試試」 */
function revealChangeGroupBtnAfterTagsVisible(targetRoute, tagElements) {
  const lastTag =
    Array.isArray(tagElements) && tagElements.length > 0
      ? tagElements[tagElements.length - 1]
      : null;
  const generation = changeGroupBtnGeneration;

  if (!lastTag) {
    // 沒有可顯示選項時維持隱藏
    hideChangeGroupBtn(targetRoute);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      lastTag.removeEventListener("animationend", onAnimationEnd);
      if (generation !== changeGroupBtnGeneration) {
        resolve();
        return;
      }
      showChangeGroupBtn(targetRoute);
      resolve();
    };

    const onAnimationEnd = (event) => {
      if (event.target !== lastTag && !lastTag.contains(event.target)) {
        return;
      }
      if (
        event.animationName &&
        event.animationName !== "tagFadeInSmooth"
      ) {
        return;
      }
      finish();
    };

    lastTag.addEventListener("animationend", onAnimationEnd);

    // 若動畫已跑完（例如 listener 掛上前就結束），立即顯示
    const opacity = parseFloat(window.getComputedStyle(lastTag).opacity);
    if (
      lastTag.classList.contains("tag-fade-in") &&
      !Number.isNaN(opacity) &&
      opacity >= 0.99
    ) {
      finish();
      return;
    }

    // animationend 未觸發時的後備
    setTimeout(finish, TAG_FADE_IN_ANIMATION_MS + 80);
  });
}

function formatCssBackgroundUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return `url("${encodeURI(trimmed)}")`;
}

function buildContainerBackgroundImage(imageUrl) {
  const cssUrl = formatCssBackgroundUrl(imageUrl);
  if (!cssUrl) return "none";
  return `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), ${cssUrl}`;
}

function buildTagGroups(routeItems) {
  const groups = [];
  for (let i = 0; i < routeItems.length; i += 8) {
    groups.push(
      routeItems.slice(i, i + 8).map((item) => ({
        Name: item.Name.S,
        Tag: item.Tag.S,
      }))
    );
  }
  return groups;
}

/** 解析 RouteConfig.RouteLinkedTags（DynamoDB 字串，如 "['1','2','10']"） */
function parseRouteLinkedTags(raw) {
  if (raw == null || raw === "") return [];
  const str = typeof raw === "string" ? raw : String(raw);
  try {
    const parsed = JSON.parse(str.replace(/'/g, '"'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function filterItemsByLinkedTags(items, linkedIds) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!Array.isArray(linkedIds) || linkedIds.length === 0) return items.slice();
  const byTag = new Map(
    items.map((item) => [String(item?.Tag?.S ?? ""), item])
  );
  return linkedIds
    .map((id) => byTag.get(String(id)))
    .filter(Boolean);
}

function buildTagSlotHtml(target, slotIndex, tag) {
  const inactiveClass = tag ? "" : " axd_tag-slot--inactive";
  const innerClass = tag
    ? `axd_tag_inner c-${target} tagId-${tag.Tag}`
    : `axd_tag_inner c-${target}`;
  const tagName = tag ? tag.Name : "";

  return `
    <div class="axd_selection axd_tag axd_tag-slot${inactiveClass}" data-slot="${slotIndex}">
      <div class="axd_tag-flip">
        <div class="${innerClass}">
          <p>${tagName}</p>
        </div>
      </div>
    </div>
  `;
}

function setTagInnerContent(innerEl, target, tag) {
  if (!innerEl) return;
  if (!tag || !tag.Tag) {
    innerEl.className = `axd_tag_inner c-${target}`;
    innerEl.innerHTML = "<p></p>";
    return;
  }
  innerEl.className = `axd_tag_inner c-${target} tagId-${tag.Tag}`;
  innerEl.innerHTML = `<p>${tag.Name}</p>`;
}

function getRouteTagElements(targetRoute) {
  const container = document.querySelector(`#container-${targetRoute}`);
  if (!container) return [];

  // >8 標籤：使用卡槽模式
  const slots = container.querySelectorAll(
    ".axd_tag-slot:not(.axd_tag-slot--inactive)"
  );
  if (slots.length > 0) return Array.from(slots);

  // ≤8 標籤：舊 DOM 無 axd_tag-slot / data-group，改抓全部標籤
  const grouped = container.querySelectorAll(
    '.axd_selection.axd_tag[data-group="0"]'
  );
  if (grouped.length > 0) return Array.from(grouped);

  return Array.from(container.querySelectorAll(".axd_selection.axd_tag"));
}

const tagFlipLock = {};
const TAG_FADE_IN_DELAY_MS = 200;

function resetTagSlotVisual($slot) {
  $slot.removeClass("tag-fade-in axd_tag-slot--swapping");
  const inner = $slot.find(".axd_tag_inner")[0];
  if (!inner) return;
  inner.getAnimations?.().forEach((animation) => animation.cancel());
  inner.style.opacity = "";
}

function flipTagsToGroup(target, nextGroup) {
  if (tagFlipLock[target]) return Promise.resolve();

  const $container = $(`#container-${target}`);
  const groups = $container.data("tag-groups");
  if (!groups?.[nextGroup]) return Promise.resolve();

  tagFlipLock[target] = true;
  hideChangeGroupBtn(target);
  $container.find(".tag-selected").removeClass("tag-selected");

  const nextTags = groups[nextGroup];
  const slots = $container.find(".axd_tag-slot").toArray();
  const visibleSlots = [];

  slots.forEach((slotEl, index) => {
    const $slot = $(slotEl);
    const tag = nextTags[index];
    const inner = $slot.find(".axd_tag-flip .axd_tag_inner")[0];

    resetTagSlotVisual($slot);

    if (!tag) {
      $slot.addClass("axd_tag-slot--inactive");
      return;
    }

    setTagInnerContent(inner, target, tag);
    $slot.removeClass("axd_tag-slot--inactive");
    visibleSlots.push(slotEl);
  });

  return fadeInTagsSequentially(target, visibleSlots, TAG_FADE_IN_DELAY_MS).finally(() => {
    tagFlipLock[target] = false;
    if (typeof window.refreshScrollDownArrow === "function") {
      window.refreshScrollDownArrow();
    }
  });
}

function fadeInTagsSequentially(targetRoute, tagElements, delay = TAG_FADE_IN_DELAY_MS) {
  hideChangeGroupBtn(targetRoute);

  return new Promise((resolve) => {
    if (tagElements.length === 0) {
      hideChangeGroupBtn(targetRoute);
      resolve();
      return;
    }

    const optionsContainer = document.querySelector(`#container-${targetRoute} .axd_selections.selection`);

    let index = 0;
    function fadeInNext() {
      if (index < tagElements.length) {
        const currentTag = tagElements[index];
        currentTag.classList.add("tag-fade-in");

        if (optionsContainer && currentTag && index >= 2) {
          // 用 rAF 批次讀 layout，避免在 setTimeout 內連續觸發 reflow
          setTimeout(() => {
            requestAnimationFrame(() => {
              const tagOffsetTop = currentTag.offsetTop;
              const tagOffsetBottom = tagOffsetTop + currentTag.offsetHeight;
              const containerHeight = optionsContainer.clientHeight;
              const scrollTop = optionsContainer.scrollTop;

              if (tagOffsetBottom > scrollTop + containerHeight) {
                optionsContainer.scrollTo({
                  top: Math.max(0, tagOffsetTop - containerHeight + currentTag.offsetHeight + 10),
                  behavior: "smooth",
                });
              } else if (tagOffsetTop < scrollTop) {
                optionsContainer.scrollTo({
                  top: Math.max(0, tagOffsetTop - 10),
                  behavior: "smooth",
                });
              }
            });
          }, 400);
        }

        index++;
        setTimeout(fadeInNext, delay);
      } else {
        if (typeof window.refreshScrollDownArrow === "function") {
          setTimeout(() => window.refreshScrollDownArrow(), 100);
        }
        revealChangeGroupBtnAfterTagsVisible(targetRoute, tagElements).then(
          resolve
        );
      }
    }
    fadeInNext();
  });
}

// 啟動特定容器的打字效果
function startTypewriterEffect(containerRoute) {
  const targetRoute = containerRoute.replaceAll(/[\s\.]/g, "");
  const typewriterContainer = document.querySelector(`.typewriter-${targetRoute}`);
  // 進場／重播時先藏按鈕，避免舊 timer 或未淡入完成就露出
  hideChangeGroupBtn(targetRoute);
  
  if (typewriterContainer && typeof Typewriter !== 'undefined') {
    // 獲取要顯示的內容
    let content = typewriterContainer.getAttribute('data-content');
    
    // 如果沒有 data-content 屬性，嘗試從其他地方獲取
    if (!content) {
      content = typewriterContainer.textContent || typewriterContainer.innerText || '';
    }
    
    // 如果還是沒有內容，嘗試從描述容器獲取
    if (!content) {
      const descContainer = document.querySelector(`#container-${targetRoute} .desc-container`);
      if (descContainer) {
        content = descContainer.textContent || descContainer.innerText || '';
      }
    }

    // 檢查標籤是否已經完成了動畫
    const tagElements = getRouteTagElements(targetRoute);
    const allTagsHaveFadeIn = Array.from(tagElements).every(tag => tag.classList.contains('tag-fade-in'));
    
    // 如果所有標籤都已經有 tag-fade-in 類，說明動畫已經完成，不需要重新播放
    if (allTagsHaveFadeIn && tagElements.length > 0) {
      
      // 確保打字效果容器也是完成狀態
      const swiperSlides = document.querySelectorAll(`#container-${targetRoute} .swiper-wrapper .swiper-slide`);
      swiperSlides.forEach(slide => {
        slide.classList.add('typewriter-complete');
      });
      
      // 直接顯示內容，不重新打字
      if (content && content.trim() !== '' && content !== 'undefined') {
        typewriterContainer.innerHTML = content.trim();
      } else {
        typewriterContainer.innerHTML = "";
      }
      showChangeGroupBtn(targetRoute);
      return;
    }

    // 檢查是否需要滾動的函數
    function checkAndScrollIfNeeded() {
      if (typewriterContainer.scrollHeight > typewriterContainer.clientHeight) {
        // 如果內容超出容器高度，滾動到底部
        typewriterContainer.scrollTop = typewriterContainer.scrollHeight - typewriterContainer.clientHeight;
      }
    }
    
    // 確保有內容才啟動打字效果
    if (content && content.trim() !== '' && content !== 'undefined') {
      // 只有在動畫未完成時才重置狀態
      hideChangeGroupBtn(targetRoute);
      
      // 清空容器內容，準備重新打字
      typewriterContainer.innerHTML = '';
      
      // 重置所有標籤狀態
      const swiperSlides = document.querySelectorAll(`#container-${targetRoute} .swiper-wrapper .swiper-slide`);
      
      swiperSlides.forEach(slide => {
        slide.classList.remove('typewriter-complete');
      });
      
      tagElements.forEach(tag => {
        tag.classList.remove('tag-fade-in');
      });
      
      // scroll 檢查以 rAF 節流，避免每字觸發 reflow
      let scrollRafPending = false;
      function scheduleScrollCheck() {
        if (scrollRafPending) return;
        scrollRafPending = true;
        requestAnimationFrame(() => {
          scrollRafPending = false;
          checkAndScrollIfNeeded();
        });
      }

      // 創建打字機實例
      const typewriter = new Typewriter(typewriterContainer, {
        delay: 75,
        cursor: '',  // 不顯示游標
        loop: false,
      });
      
      // 開始打字效果，並在完成後顯示 swiper-slide 元素和標籤依序淡入
      typewriter
        .typeString(content.trim())
        .pauseFor(500)
        .callFunction(() => {
          // 最終滾動檢查
          checkAndScrollIfNeeded();
          
          // 打字效果完成後，先顯示容器
          const swiperSlides = document.querySelectorAll(`#container-${targetRoute} .swiper-wrapper .swiper-slide`);
          swiperSlides.forEach(slide => {
            slide.classList.add('typewriter-complete');
          });
          
          // 然後讓標籤按順序依序淡入
          const tagElements = getRouteTagElements(targetRoute);
          fadeInTagsSequentially(targetRoute, tagElements, 200);
        })
        .start();

      // 以 MutationObserver + rAF 節流取代直接在 onType 讀 layout
      // 避免每字觸發 reflow 造成 iPhone Safari 卡頓
      const observer = new MutationObserver(scheduleScrollCheck);
      observer.observe(typewriterContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      // 打字完成後停止觀察
      setTimeout(() => {
        observer.disconnect();
      }, content.length * 95 + 1000); // 根據打字速度估算完成時間
      
    } else {
      // 如果沒有內容，檢查標籤是否已經完成了動畫
      if (allTagsHaveFadeIn && tagElements.length > 0) {
        
        // 確保容器狀態正確
        const swiperSlides = document.querySelectorAll(`#container-${targetRoute} .swiper-wrapper .swiper-slide`);
        swiperSlides.forEach(slide => {
          slide.classList.add('typewriter-complete');
        });
        
        typewriterContainer.innerHTML = "";
        showChangeGroupBtn(targetRoute);
        return;
      }
      
      // 如果動畫未完成，直接顯示空內容並顯示 swiper-slide 元素和標籤
      hideChangeGroupBtn(targetRoute);
      typewriterContainer.innerHTML = '';
      
      const swiperSlides = document.querySelectorAll(`#container-${targetRoute} .swiper-wrapper .swiper-slide`);
      swiperSlides.forEach(slide => {
        slide.classList.add('typewriter-complete');
      });
      
      // 標籤按順序依序淡入
      fadeInTagsSequentially(targetRoute, tagElements, 200);
    }
  }
}

const fetchData = async () => {
  // 背景圖片懶加載
  function lazyLoadBackgroundImage() {
    const bgImage = new Image();
    // bgImage.src = 'https://images.unsplash.com/photo-1533750204176-3b0d38e9ac1e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=480';
    bgImage.src = 'https://picsum.photos/600';
    bgImage.onload = function() {
      // 圖片加載完成後，為所有 animX 容器添加 bg-loaded 類別
      const animXContainers = document.querySelectorAll('.container.mbinfo.animX');
      animXContainers.forEach(container => {
        container.classList.add('bg-loaded');
      });
    };
  }
  
  // 延遲一點時間再開始加載背景圖片，確保不影響初始加載速度
  setTimeout(lazyLoadBackgroundImage, 500);
  
  const options = { method: "GET", headers: { accept: "application/json" } };
  try {
    var obj;
    // 塞空值
    const response = await fetch(
      "https://xjsoc4o2ci.execute-api.ap-northeast-1.amazonaws.com/v0/extension/run_routeproduct?Brand=" +
        Brand +
        "&Route=" +
        Route,
      options
    );
    
    // 檢查狀態碼，如果是 200 則發送 postMessage
    if (response.status == 200) {
      const messageData = {
        type: "run_routeproduct_success",
        status: response.status,
        brand: Brand,
        route: Route
      };
      window.parent.postMessage(messageData, "*");
    }
    
    const data = await response.json();
    // $("#loadingbar").hide();
    $("#pback").show();
    $("#containerback").show();
    $("#intro_page").show();
    obj = data;
    if (!obj.Product) return;
    current_Route = obj.Product["Route"] || "";
    all_Route = obj.Product["TagGroups_order"] || [];
    SpecifyTags = obj.Product["SpecifyTags"] || [];
    SpecifyKeywords = obj.Product["SpecifyKeywords"] || [];
    themeBackgroundImages = ['https://images.unsplash.com/photo-1743630738181-b0e26c76c74c?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D','https://images.unsplash.com/photo-1606335567422-09b986cc47bb?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D','https://plus.unsplash.com/premium_photo-1664301332055-8792841f3dc7?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1630945386735-372fbe731e3f?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1593504197189-c0dafb6f2e92?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D']

    const themeBackgroundImagesMap = (() => {
      const product = obj?.Product;
      const order = Array.isArray(product?.TagGroups_order)
        ? product.TagGroups_order
        : [];
      const productMedias = Array.isArray(product?.TagGroups_Medias)
        ? product.TagGroups_Medias
        : [];
      
      // 建立補充後的背景圖片陣列
      const backgroundImages = order.map((key, index) => {
        // 如果 productMedias 中對應位置的值是空字串、null、undefined 或不存在
        const productMedia = productMedias[index];
        if (!productMedia || productMedia.trim() === '') {
          // 隨機從 themeBackgroundImages 中選擇一張圖片補充
          const randomIndex = Math.floor(Math.random() * themeBackgroundImages.length);
          return themeBackgroundImages[randomIndex] || themeBackgroundImages[0];
        }
        return productMedia;
      });
      
      return order.reduce((map, key, index) => {
        if (backgroundImages[index] != null) {
          // 排除 undefined 或 null
          map[key] = backgroundImages[index];
        }
        return map;
      }, {});
    })();
    const formatTagGroupMap = (() => {
      const product = obj?.Product;
      $("#intro-coupon-modal__footer-content-text").text(product?.Name || "開啟個人化購物之旅");

      const order = Array.isArray(product?.TagGroups_order)
        ? product.TagGroups_order
        : [];
      const descriptions = Array.isArray(product?.TagGroups_Description)
        ? product.TagGroups_Description
        : [];
      return order.reduce((map, key, index) => {
        if (descriptions[index] != null) {
          // 排除 undefined 或 null
          map[key] = descriptions[index];
        }
        return map;
      }, {});
    })();
    // 比較當前路線是否已存在
    var INFS_ROUTE_ORDER = !isForPreview
      ? JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) || []
      : [];
    var INFS_ROUTE_RES = !isForPreview
      ? JSON.parse(localStorage.getItem(`INFS_ROUTE_RES_${Brand}`)) || []
      : [];
    // 當前路線
    current_route_path = {
      Route: current_Route,
      TagGroups_order: all_Route,
      Record: {},
    };
    // 過濾相符的物件
    let match;
    if (isFirst && !isForPreview) {
      isFirst = false;
      match = INFS_ROUTE_RES.find((item) =>
        deepEqualWithoutKey(item, current_route_path, ["Record"])
      );
      if (!match) {
        match = INFS_ROUTE_ORDER.find((item) =>
          deepEqualWithoutKey(item, current_route_path, ["Record"])
        );
      }

      if (match) {
        tags_chosen = match.Record;
      } else {
        INFS_ROUTE_ORDER.push(current_route_path);
        if (!isForPreview) {
          localStorage.setItem(
            `INFS_ROUTE_ORDER_${Brand}`,
            JSON.stringify(INFS_ROUTE_ORDER)
          );
        }
      }
    }

    let Route_in_frame = {};
    let Route_in_frame_all = {};
    for (var n = 0; n < all_Route.length; n++) {
      Route_in_frame[all_Route[n]] = [];
      Route_in_frame_all[all_Route[n]] = [];
    }
    for (var j = 0; j < obj.RouteConfig.length; j++) {
      let item = obj.RouteConfig[j];
      // let idx = all_Route.indexOf(item.TagGroup.S)
      if (!Route_in_frame[item.TagGroup.S]) {
        Route_in_frame[item.TagGroup.S] = [];
        Route_in_frame_all[item.TagGroup.S] = [];
      }
      Route_in_frame[item.TagGroup.S].push(item);
      Route_in_frame_all[item.TagGroup.S].push(item);
    }

    /** features 選完後，依 RouteLinkedTags 過濾下一題可選標籤；略過或無連結則還原全部 */
    function prepareNextRouteOptions(selectedGroup, tagId, nextGroup, options = {}) {
      if (!nextGroup || !Route_in_frame_all[nextGroup]) return;

      const restoreAll = options.restoreAll === true || selectedGroup !== "features";
      if (restoreAll) {
        Route_in_frame[nextGroup] = Route_in_frame_all[nextGroup].slice();
        return;
      }

      const selectedItem = Route_in_frame_all[selectedGroup]?.find(
        (item) => String(item?.Tag?.S) === String(tagId)
      );
      const linked = parseRouteLinkedTags(selectedItem?.RouteLinkedTags?.S);
      if (linked.length === 0) {
        Route_in_frame[nextGroup] = Route_in_frame_all[nextGroup].slice();
        return;
      }

      const filtered = filterItemsByLinkedTags(
        Route_in_frame_all[nextGroup],
        linked
      );
      Route_in_frame[nextGroup] =
        filtered.length > 0
          ? filtered
          : Route_in_frame_all[nextGroup].slice();
    }
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipod|phone/.test(userAgent);

    const iconNext = isMobile
      ? "data:image/svg+xml;charset=UTF-8,%3csvg width='36' height='37' viewBox='0 0 36 37' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M18 11.0264L10.8 18.2264L18 25.4264' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3cpath d='M25.2 18.2266H10.8' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e"
      : "data:image/svg+xml;charset=UTF-8,%3csvg width='36' height='37' viewBox='0 0 36 37' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M18 11.0264L10.8 18.2264L18 25.4264' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3cpath d='M25.2 18.2266H10.8' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e";

    function renderRouteTags(tar) {
      var target = tar.replaceAll(/[\s\.]/g, "");
      $(`#container-${target}`).find(".selection").remove();
      $(`#container-${target}`).find(".remove-button").remove();
      $(`#container-${target}`).find(`.pagination-${target}`).empty();
      $(`#container-${target}`).find(`.change-group-btn`).remove();

      const items = Route_in_frame[tar] || [];
      const itemCount = items.length;
      const useTagSlots = itemCount > 8;

      $(`#container-${target}`)
        .find(".swiper-wrapper")
        .append(
          '<div class="selection swiper-slide"><div class="axd_selections selection"></div></div>'
        );

      if (useTagSlots) {
        const groups = buildTagGroups(items);
        $(`#container-${target}`).data("tag-groups", groups);

        for (let slot = 0; slot < 8; slot++) {
          $(`#container-${target}`)
            .find(".axd_selections")
            .append(buildTagSlotHtml(target, slot, groups[0][slot]));
        }
      } else {
        for (let rr = 0; rr < itemCount; rr++) {
          $(`#container-${target}`).find(".axd_selections").append(`
                             <div class="axd_selection axd_tag">
                                 <div class="axd_tag_inner c-${target} tagId-${items[rr].Tag.S}">
                                     <p>${items[rr].Name.S}</p>
                                 </div>
                             </div>
                         `);
        }
      }

      if (useTagSlots) {
        $(`#container-${target}`).find(`.swiper-container-${target}`).append(`
            <div class="change-group-btn change-group-btn--hidden" data-current-group="0" data-total-groups="${Math.ceil(itemCount / 8)}" data-target="${target}">
              <svg class="change-group-btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M15.2 2.8V6.8H11.2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.8 15.2V11.2H6.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.8 8.3C2.8 5.2 5.3 2.8 8.4 2.8C10.6 2.8 12.5 4.2 13.4 6.2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.2 9.7C15.2 12.8 12.7 15.2 9.6 15.2C7.4 15.2 5.5 13.8 4.6 11.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="change-group-btn__text">換一組試試</span>
            </div>
          `);
      }
    }

    function init(tar) {
      renderRouteTags(tar);
    }

    for (var r in Route_in_frame) {
      document.getElementById("pback").insertAdjacentHTML(
        "beforebegin",
        `<div class='container mbinfo animX animFadeIn update_delete' id="container-${r.replaceAll(/[\s\.]/g, "")}">
                    <div class="c_header" id="container-x-header">
                        
                        <img class="type_backarrow" id="container-${r.replaceAll(/[\s\.]/g, "")}-backarrow" src="${iconNext}" width="100%"
                        height="100%" >
                        <div class="header-text" style="opacity: 0;" >
                            <span style="margin-bottom: 0.3em">${r}</span>
                            <p class="desc-container">${
                              formatTagGroupMap?.[r] ??
                              (Array.isArray(Route_in_frame?.[r]) &&
                              Route_in_frame[r].length > 0
                                ? Route_in_frame[r][0]?.Description?.S ?? ""
                                : "")
                            }</p>
                        </div>
                        <img class='c-${r.replaceAll(
                          " ",
                          ""
                        )} skip icon-next type_backarrow flipped-image' src="${iconNext}" width="100%"
                        height="100%" >
                    </div>

                        <div style="margin: auto" class="selection_scroll slide swiper-container-${r.replaceAll(/[\s\.]/g, "")}">
                            <div class="swiper-wrapper" >
                            </div>         
                        </div>
                    
                         <div class="pagination-${r.replaceAll(/[\s\.]/g, "")} pag-margin dot-btns" style="text-align: center; ">
                        </div>
                     <div class="con-footer">
                        <a class='c-${r.replaceAll(/[\s\.]/g, "")} skip'>略過</a>
                     </div>
                       
                    </div>`
      );
      $(`#container-${r.replaceAll(/[\s\.]/g, "")}`).find(`.swiper-container-${r.replaceAll(/[\s\.]/g, "")}`).prepend(`
          <p class="tag-desc-container typewriter typewriter-${r.replaceAll(/[\s\.]/g, "")}" data-content="${
            formatTagGroupMap?.[r] && formatTagGroupMap[r] !== ""
            ? formatTagGroupMap[r]
            : (
                Array.isArray(Route_in_frame?.[r]) && Route_in_frame[r].length > 0
                  ? (Route_in_frame[r][0]?.Description?.S?.trim() ? Route_in_frame[r][0].Description.S : r)
                  : ""
              )
     }"></p>`)
     $(`#container-${r.replaceAll(/[\s\.]/g, "")}`).css({backgroundImage: buildContainerBackgroundImage(themeBackgroundImagesMap[r])});
      //first route hide type_backarrow
      if (r === all_Route[0]) {
        // document.getElementById(
        //   `container-${r.replaceAll(/[\s\.]/g, "")}-backarrow`
        // ).style.visibility = "hidden";

       const backarrow = document.getElementById(
          `container-${r.replaceAll(/[\s\.]/g, "")}-backarrow`
        )
        $(backarrow).on(tap, function () {
          trackInffitsEvent("click_back", {
            action: "back_to_intro",
            event_label: "返回介紹頁",
            event_value: all_Route[0] || "",
          });
          $("#intro-page").show();
          $("#container-" + all_Route[0]).hide();
          tags_chosen = {};
        });
      }

      init(r);
    }

    var mytap = window.ontouchstart === null ? "touchend" : "click";

    var suppressPresetResume = false;

    function refreshNextRouteAfterSelection(fs, tagId, options = {}) {
      if (!useRouteLinkedTags) return;
      if (fs >= all_Route.length - 1) return;
      const nextGroup = all_Route[fs + 1];
      prepareNextRouteOptions(all_Route[fs], tagId, nextGroup, options);
      renderRouteTags(nextGroup);
      // 重綁事件；略過 resume 自動點擊，避免遞迴
      suppressPresetResume = true;
      bind();
      suppressPresetResume = false;
    }

    function bind() {
      // 檢查是否所有問題都已完成，如果是則直接跳到結果頁面
      var INFS_ROUTE_ORDER = !isForPreview
        ? JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) || []
        : [];
      const match = INFS_ROUTE_ORDER.find((item) =>
        deepEqualWithoutKey(item, current_route_path, ["Record"])
      );
      const skipShowResult = isForPreview || isForReferral;
      
      if (match && !skipShowResult && !suppressPresetResume) {
        tags_chosen = match.Record;
        
        // 檢查是否所有路由都有有效的選擇
        const allRoutesCompleted = all_Route.every(route => {
          const routeKey = route.replaceAll(/[\s\.]/g, "");
          return tags_chosen[routeKey] && 
                 tags_chosen[routeKey].length > 0 && 
                 tags_chosen[routeKey][0].Name !== "example";
        });
        
        if (allRoutesCompleted) {
          // 所有問題都已完成，直接跳到結果頁面
          $("#intro-page").hide();
          const hasRes = document.querySelector("#container-recom .update_delete") !== null;
          const get_recom_res_throttled = throttle(get_recom_res, 3000);
          
          if (!hasRes) {
            get_recom_res_throttled();
          }
          return; // 提前返回，不執行後續的 for 循環
        }
      }
      
      for (var fs = 0; fs < all_Route.length; fs++) {
        (function (fs) {
          const currentRoute = all_Route[fs].replaceAll(/[\s\.]/g, "");
          // 檢查並設定預設值
          var INFS_ROUTE_ORDER = !isForPreview
            ? JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) ||
              []
            : [];
          const match = INFS_ROUTE_ORDER.find((item) =>
            deepEqualWithoutKey(item, current_route_path, ["Record"])
          );
          const skipShowResult = isForPreview || isForReferral;
          if (match && !skipShowResult && !suppressPresetResume) {
            tags_chosen = match.Record;
          }
          if (skipShowResult) {
            tags_chosen = {};
          }
          
          // 檢查當前路由是否已完成
          const currentRouteCompleted = tags_chosen[currentRoute] && 
                                      tags_chosen[currentRoute].length > 0 && 
                                      tags_chosen[currentRoute][0].Name !== "example";
          
          if (
            !suppressPresetResume &&
            ((Object.keys(tags_chosen).length > 0 && !isForPreview) ||
            (Object.keys(tags_chosen).length > 0 && !isForReferral))
          ) {
            if (currentRouteCompleted) {
              // 如果當前路由已完成，跳過顯示，直接觸發點擊
              if (fs === 0) {
                $("#intro-page").hide();
              }
              const preset = tags_chosen[currentRoute][0];
              const tagIdClass = `tagId-${preset.Tag}`;
              const container = $(`#container-${currentRoute}`);
              const presetElement = container.find(
                `.c-${currentRoute}.${tagIdClass}`
              );
              if (presetElement.length > 0) {
                presetElement.addClass("tag-selected");
                // 直接觸發點擊，不顯示容器
                setTimeout(() => {
                  presetElement.trigger("click");
                }, 100);
              } else {
                $(".c-" + currentRoute + ".skip").click();
              }
            } else if (fs === 0 || !currentRouteCompleted) {
              // 只顯示第一個未完成的問題
              const firstIncompleteIndex = all_Route.findIndex(route => {
                const routeKey = route.replaceAll(/[\s\.]/g, "");
                return !(tags_chosen[routeKey] && 
                        tags_chosen[routeKey].length > 0 && 
                        tags_chosen[routeKey][0].Name !== "example");
              });
              
              if (fs === firstIncompleteIndex) {
                $("#intro-page").hide();
                $("#container-" + currentRoute).show();
                startTypewriterEffect(all_Route[fs]);
              }
            }
          } else if (fs === 0) {
            // 沒有預設選擇時，顯示第一個問題
            // 這個邏輯會在 start-button 點擊時處理
          }

          $(".c-" + currentRoute + ".skip")
            .off(mytap)
            .on(mytap, function (e) {
              // if ($(this).text() == "略過") {
              trackInffitsEvent("click_skip", {
                action: "skip_step",
                event_label: all_Route[fs],
                event_value: currentRoute,
                step: fs + 1,
              });
              var tag = `c-${all_Route[fs]}`;
              $(`.${tag}.tag-selected`).removeClass("tag-selected");
              $(".tag-selected").removeClass("tag-selected");
              tags_chosen[all_Route[fs].replaceAll(/[\s\.]/g, "")] = [
                {
                  Description: "example",
                  Imgsrc: "https://example.com/imageB1.png",
                  Name: "example",
                  Tag: tag,
                  TagGroup: all_Route[fs],
                },
              ];
              // 修改符合條件的物件後更新 INFS_ROUTE_ORDER
              var INFS_ROUTE_ORDER = !isForPreview
                ? JSON.parse(
                    localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)
                  ) || []
                : [];
              INFS_ROUTE_ORDER.forEach((item, index) => {
                if (deepEqualWithoutKey(item, current_route_path, ["Record"])) {
                  INFS_ROUTE_ORDER[index] = {
                    ...item,
                    Record: tags_chosen, // 修改 Record
                  };
                }
              });
              if (!isForPreview) {
                localStorage.setItem(
                  `INFS_ROUTE_ORDER_${Brand}`,
                  JSON.stringify(INFS_ROUTE_ORDER)
                );
              }
              // }
              if (fs == all_Route.length - 1) {
                $("#container-" + currentRoute).hide();
                if ($.isEmptyObject(tags_chosen)) {
                  var firstEl = $("#container-" + all_Route[fs])
                    .find(".image-container")
                    .first();
                  var tagid = firstEl.attr("class").match(/tagId-(\d+)/)[1];
                  tags_chosen[all_Route[fs].replaceAll(/[\s\.]/g, "")] = [
                    {
                      Description: "example",
                      Imgsrc: "https://example.com/imageB1.png",
                      Name: "example",
                      Tag: tagid,
                      TagGroup: all_Route[fs],
                    },
                  ];
                }
                get_recom_res();
              } else {
                refreshNextRouteAfterSelection(fs, null, { restoreAll: true });
                $("#container-" + currentRoute).hide();
                $("#container-" + all_Route[fs + 1].replaceAll(/[\s\.]/g, "")).show();
                // 啟動下一個容器的打字效果
                startTypewriterEffect(all_Route[fs + 1]);
              }
            });

          $(".c-" + currentRoute + ":not(.skip)")
            .off("click")
            .on("click", function (e) {
              var tagid = $(this)
                .attr("class")
                .match(/tagId-(\d+)/)[1];

              var tag = `c-${all_Route[fs]}`;
              $(`.${tag}.tag-selected`).removeClass("tag-selected");
              $(this).addClass("tag-selected");
              trackInffitsEvent("click_tag", {
                action: "select_tag",
                event_label: $(this).find("p").text() || "",
                event_value: tagid,
                tag_group: all_Route[fs],
                step: fs + 1,
              });
              if (fs == all_Route.length - 1) {
                $("#container-" + currentRoute).hide();

                tags_chosen[all_Route[fs].replaceAll(/[\s\.]/g, "")] = [
                  {
                    Description: $(
                      `#container-${all_Route[fs]} .desc-container`
                    )
                      .first()
                      .text(),
                    Imgsrc: $(this).find("img").attr("src"),
                    Name: $(this).find("p").text(),
                    Tag: tagid,
                    TagGroup: all_Route[fs],
                  },
                ];
                const hasRes =
                  document.querySelector("#container-recom .update_delete") !==
                  null;
                const get_recom_res_throttled = throttle(get_recom_res, 3000);

                if (!hasRes) {
                  get_recom_res_throttled();
                }
              } else {
                refreshNextRouteAfterSelection(fs, tagid);
                $("#container-" + currentRoute).hide();
                $("#container-" + all_Route[fs + 1].replaceAll(/[\s\.]/g, "")).show();
                // 啟動下一個容器的打字效果
                startTypewriterEffect(all_Route[fs + 1]);
                tags_chosen[all_Route[fs].replaceAll(/[\s\.]/g, "")] = [
                  {
                    Description: $(
                      `#container-${all_Route[fs]} .desc-container`
                    )
                      .first()
                      .text(),
                    Imgsrc: $(this).find("img").attr("src"),
                    Name: $(this).find("p").text(),
                    Tag: tagid,
                    TagGroup: all_Route[fs],
                  },
                ];
              }
              // 修改符合條件的物件後更新 INFS_ROUTE_ORDER
              var INFS_ROUTE_ORDER =
                JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) ||
                [];
              INFS_ROUTE_ORDER.forEach((item, index) => {
                if (deepEqualWithoutKey(item, current_route_path, ["Record"])) {
                  INFS_ROUTE_ORDER[index] = {
                    ...item,
                    Record: tags_chosen, // 修改 Record
                  };
                }
              });
              if (!isForPreview) {
                localStorage.setItem(
                  `INFS_ROUTE_ORDER_${Brand}`,
                  JSON.stringify(INFS_ROUTE_ORDER)
                );
              }
            });
          $(`#container-${all_Route[fs].replaceAll(/[\s\.]/g, "")}-backarrow`)
            .off(mytap)
            .on(mytap, function (e) {
              if (fs != 0) {
                trackInffitsEvent("click_back", {
                  action: "back_to_prev_step",
                  event_label: all_Route[fs - 1],
                  event_value: all_Route[fs],
                  step: fs + 1,
                });
                $("#container-" + currentRoute).hide();
                $("#container-" + all_Route[fs - 1].replaceAll(/[\s\.]/g, "")).show();
                // 啟動上一個容器的打字效果
                startTypewriterEffect(all_Route[fs - 1]);
              }
            });

          if (fs == 0) {
            reset = async function () {
              const message = {
                header: "from_preview",
                id: Route,
                brand: Brand,
                MRID: MRID,
                GVID: GVID,
                LGVID: LGVID,
                show_origin_price: showOriginPrice,
                use_route_linked_tags: useRouteLinkedTags,
              };

              // 發送消息到接收窗口
              window.dispatchEvent(
                new MessageEvent("message", { data: message })
              );
              const messageData = {
                type: "result",
                value: false,
              };
              window.parent.postMessage(messageData, "*");
              tags_chosen = {};
            };
          }
        })(fs);
      }
    }
    bind();

    var pass_data = {
      MsgHeader: "fetchDone",
    };
    window.parent.postMessage(pass_data, "*");
  } catch (error) {}
};
var tap = window.ontouchstart === null ? "touchend" : "click";

// 使用事件委託來處理動態創建的圖標元素
$(document).on(tap, ".icon-inffits", function () {
  $(".icon-inffits").toggleClass("open");
  $(".text-inffits").toggleClass("visible");
  $(".icon-reminder").removeClass("open");
  $(".text-reminder").removeClass("visible");
});
$(document).on(tap, ".icon-reminder", function () {
  $(".icon-reminder").toggleClass("open");
  $(".text-reminder").toggleClass("visible");
  $(".icon-inffits").removeClass("open");
  $(".text-inffits").removeClass("visible");
});

// 換一組試試按鈕點擊事件
$(document).on(tap, ".change-group-btn", function () {
  const $btn = $(this);
  const target = $btn.data("target");

  if ($btn.hasClass("rotating") || tagFlipLock[target]) return;

  const currentGroup = parseInt($btn.attr("data-current-group"), 10);
  const totalGroups = parseInt($btn.data("total-groups"), 10);
  const nextGroup = (currentGroup + 1) % totalGroups;

  trackInffitsEvent("click_change_group", {
    action: "change_tag_group",
    event_label: target,
    event_value: String(nextGroup),
    from_group: currentGroup,
    to_group: nextGroup,
  });

  $btn.addClass("rotating change-group-btn--hidden");
  $btn.attr("data-current-group", nextGroup);

  flipTagsToGroup(target, nextGroup).finally(() => {
    $btn.removeClass("rotating");
  });

  $btn.find("svg").one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function () {
    $btn.removeClass("rotating");
  });
});

function copyCoupon(couponCode, btn) {
  navigator.clipboard
    .writeText(couponCode)
    .then(() => {
      const $btn = $(btn);
      const $parent = $btn.closest(
        ".intro-coupon-modal__content-container-content-footer"
      );
      const $copiedBtn = $parent.find(
        ".intro-coupon-modal__btn--coupon--copied"
      );

      // 切換按鈕顯示
      $btn.hide();
      $copiedBtn.show();

      setTimeout(() => {
        $btn.show();
        $copiedBtn.hide();
      }, 3000);
    })
    .catch((err) => {
      alert("無法複製優惠碼，請手動複製。");
    });
}

// 使用事件委託來處理動態創建的元素
$(document).on(tap, "#start-button", function () {
  trackInffitsEvent("click_start", {
    action: "start_button",
    event_label: "開始導購",
  });
  $("#recommend-title").text("專屬商品推薦");
  $("#recommend-desc").text("根據您的偏好，精選以下單品。"); // 使用淡入動畫
  $("#recommend-btn").text("刷新推薦");
  
  // 檢查是否所有問題都已完成
  var INFS_ROUTE_ORDER = !isForPreview
    ? JSON.parse(localStorage.getItem(`INFS_ROUTE_ORDER_${Brand}`)) || []
    : [];
  const match = INFS_ROUTE_ORDER.find((item) =>
    deepEqualWithoutKey(item, current_route_path, ["Record"])
  );
  
  if (match && !isForPreview && !isForReferral) {
    const savedTags = match.Record;
    const allRoutesCompleted = all_Route.every(route => {
      const routeKey = route.replaceAll(/[\s\.]/g, "");
      return savedTags[routeKey] && 
             savedTags[routeKey].length > 0 && 
             savedTags[routeKey][0].Name !== "example";
    });
    
    if (allRoutesCompleted) {
      // 所有問題都已完成，直接跳到結果頁面
      $("#intro-page").hide();
      tags_chosen = savedTags;
      const hasRes = document.querySelector("#container-recom .update_delete") !== null;
      const get_recom_res_throttled = throttle(get_recom_res, 3000);
      
      if (!hasRes) {
        get_recom_res_throttled();
      }
      return; // 提前返回，不顯示第一個問題
    }
  }
  
  // 隱藏介紹頁面，顯示第一個推薦內容頁面
  $("#intro-page").hide();
  $("#container-" + all_Route[0]).show();
  // 啟動第一個容器的打字效果
  startTypewriterEffect(all_Route[0]);
});


$("#coupon-btn").on(tap, function () {
  trackInffitsEvent("click_coupon", {
    action: "open_coupon",
    event_label: "開啟優惠券",
  });
  $("#loadingbar_recom").show();
  const $couponOverlay = $(`<div id="coupon-overlay"></div>`)
    .css({
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.20)",
      zIndex: 9999,
    })
    .appendTo("#container-recom");
  const $couponContent = $(`<div id="coupon-content">
  <div id="qrcode-container"></div>
<div class="coupon-text">2025 XYZ 優惠 (限今日使用)</div></div>`).css({
    position: "absolute",
    bottom: "-231px", // 先隱藏在畫面外
    left: 0,
    width: "100%",
    height: "231px",
    background: "rgba(255, 255, 255, 0.90)",
    borderRadius: '18px 18px 0px 0px',
    backdropFilter: 'blur(12.25px)',
    paddingTop: '16px',
    paddingBottom: '16px',
    zIndex: 99991,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: '8px'
  })
    .appendTo("#container-recom");
  
  // 動態生成 QR code（使用 "XYZ" 文字）
  const qrText = "XYZ"; // 要轉換成 QR code 的文字
  const qrcodeContainer = document.getElementById("qrcode-container");
  
  // 確保 QRCode 庫已載入的函數
  const generateQRCode = function() {
    if (qrcodeContainer && typeof QRCode !== 'undefined') {
      try {
        // 使用 qrcodejs 庫生成 QR code
        const qrcode = new QRCode(qrcodeContainer, {
          text: qrText,
          width: 140,
          height: 140,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (error) {
        qrcodeContainer.innerHTML = '<div style="color: red;">QR code 生成失敗</div>';
      }
    } else {
      // 如果庫未載入，嘗試動態載入
      if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = function() {
          generateQRCode();
        };
        script.onerror = function() {
          if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '<div style="color: red;">QR code 庫載入失敗</div>';
          }
        };
        document.head.appendChild(script);
      } else {
        if (qrcodeContainer) {
          qrcodeContainer.innerHTML = '<div style="color: red;">QR code 容器不存在</div>';
        }
      }
    }
  };
  
  // 延遲執行以確保 DOM 已準備好
  setTimeout(generateQRCode, 100);
  
  $couponContent.animate({ bottom: "0px" }, 500);
})

$("#coupon-recommend-btn").on(tap, function () {
  trackInffitsEvent("click_coupon_recommend", {
    action: "open_coupon_recommend",
    event_label: "優惠推薦",
    event_value: String((resList && resList.length) || 0),
  });
  const messageData = {
    type: "openCouponDialog",
    list: resList,
    value: true,
  };
  window.parent.postMessage(messageData, "*");
})

// 刷新推薦 = SPIN：重新轉動未釘選的拉霸欄位
$("#recommend-btn").on(tap, function () {
  trackInffitsEvent("click_refresh_recommend", {
    action: "refresh_recommend_btn",
    event_label: "刷新推薦",
    event_value: "spin",
    categories: (reelCats || []).join(","),
  });
  $("#loadingbar_recom").hide();

  window.parent.postMessage({ type: "result", value: true }, "*");

  spinCapsuleReels(reelCats);
});

$(document).on("click", function (event) {
  if ($("#coupon-content").css("bottom") === "0px") {
    $("#coupon-content").animate({ bottom: "-231px" }, 500, function () {
      $("#coupon-content").remove(); // 動畫結束後移除 DOM
      $("#coupon-overlay").remove();
    });
  }
});

$("#startover").on(tap, function () {
  trackInffitsEvent("click_startover", {
    action: "startover_btn",
    event_label: "重新開始",
  });
  $("#loadingbar_recom").hide();
  Initial();
  reset();
});

const Initial = () => {
  clearAllChangeGroupBtnState();
  $(".update_delete").remove();
  $("#container-recom").hide();

  tags_chosen = {};
};

window.addEventListener("message", async (event) => {
  if (event.data.header == "from_preview") {

    Route = event.data.id;
    Brand = event.data.brand;
    MRID = event.data.MRID || "";
    GVID = event.data.GVID || "";
    LGVID = event.data.LGVID || "";
    // 僅在明確傳入時更新，避免重新開始未帶欄位時被重設成 false
    if (Object.prototype.hasOwnProperty.call(event.data, "show_origin_price")) {
      showOriginPrice = !!event.data.show_origin_price;
    }
    if (Object.prototype.hasOwnProperty.call(event.data, "use_route_linked_tags")) {
      useRouteLinkedTags = !!event.data.use_route_linked_tags;
    }
    await Initial();
    await fetchData();
    await fetchCoupon();

    $("#intro-page").fadeIn(800);
  }

  if (event.data.header == "close_coupon") {
    if (
      !$(event.target).closest("#coupon-content").length && // 點擊 #coupon-content 外部
      !$(event.target).is("#coupon-btn") // 不是點擊 #coupon-btn
    ) {
      if ($("#coupon-content") && $("#coupon-overlay")) {
        $("#coupon-content").animate({ bottom: "-231px" }, 500, function () {
          $("#coupon-content").remove(); // 動畫結束後移除 DOM
          $("#coupon-overlay").remove();
        });
      }
    }
  }
  if (event.data.header == "close_coupon_recommend") {
    if (
      !$(event.target).closest("#coupon-content").length && // 點擊 #coupon-content 外部
      !$(event.target).is("#coupon-recommend-btn") // 不是點擊 #coupon-recommend-btn
    ) {
      if ($("#coupon-content") && $("#coupon-overlay")) {
        $("#coupon-content").animate({ bottom: "-231px" }, 500, function () {
          $("#coupon-content").remove(); // 動畫結束後移除 DOM
          $("#coupon-overlay").remove();
        });
      }
    }
  }
});
