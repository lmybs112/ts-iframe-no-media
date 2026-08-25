/**
 * UTM：組件內建 source／medium；from_preview 更新規則、GA4Event 非空欄位、商品 URL 帶 UTM
 * 執行：node tests/utm.test.js
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function loadNoMediaGa() {
  var messages = [];
  var window = {
    parent: {
      postMessage: function (msg) {
        messages.push(msg);
      },
    },
  };
  var sandbox = { window: window, console: console, URL: URL, URLSearchParams: URLSearchParams };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../js/shared/ga.js"), "utf8"),
    sandbox
  );
  return { NoMediaGa: sandbox.window.NoMediaGa, window: window, messages: messages };
}

function assertUtmEqual(actual, expected) {
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
    function (key) {
      assert.strictEqual(actual[key], expected[key], key);
    }
  );
}

function testDefaultUtm() {
  var loaded = loadNoMediaGa();
  var def = loaded.NoMediaGa.defaultUtm;
  assert.strictEqual(typeof def, "function", "defaultUtm 應存在");
  assertUtmEqual(def(), {
    utm_source: "inffits",
    utm_medium: "iframe_ai_product",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  });
}

function testApplyUtmFromPayload() {
  var loaded = loadNoMediaGa();
  var apply = loaded.NoMediaGa.applyUtmFromPayload;
  assert.strictEqual(typeof apply, "function", "applyUtmFromPayload 應存在");

  var empty = apply({}, null);
  assertUtmEqual(empty, {
    utm_source: "inffits",
    utm_medium: "iframe_ai_product",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  });

  var kept = apply({ header: "from_preview", id: "route-a" }, empty);
  assert.strictEqual(kept.utm_source, "inffits", "宿主未傳 utm_* 應維持組件預設");
  assert.strictEqual(kept.utm_medium, "iframe_ai_product");

  var current = apply(
    {
      utm_source: " other ",
      utm_campaign: "no-media-v1",
    },
    empty
  );
  assert.strictEqual(current.utm_source, "other");
  assert.strictEqual(current.utm_medium, "iframe_ai_product", "未傳入的鍵應維持原值");
  assert.strictEqual(current.utm_campaign, "no-media-v1");
  assert.strictEqual(current.utm_term, "");

  var cleared = apply({ utm_source: "   " }, current);
  assert.strictEqual(cleared.utm_source, "inffits", "空字串應回退預設 source");
  assert.strictEqual(cleared.utm_medium, "iframe_ai_product", "未傳入的鍵應維持原值");
}

function testGa4EventOmitsEmptyUtm() {
  var loaded = loadNoMediaGa();
  loaded.NoMediaGa.initNoMediaGa({
    prefix: "no-media_",
    defaultLabel: "Track/NoMedia",
    getUtm: function () {
      return {
        utm_source: "inffits",
        utm_medium: "iframe_ai_product",
        utm_campaign: "",
        utm_term: "",
        utm_content: "  ",
      };
    },
  });
  loaded.window.trackInffitsEvent("click_start", { event_label: "開始" });
  assert.strictEqual(loaded.messages.length, 1);
  var msg = loaded.messages[0];
  assert.strictEqual(msg.utm_source, "inffits");
  assert.strictEqual(msg.utm_medium, "iframe_ai_product");
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_campaign"));
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_term"));
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_content"));
}

function testGa4EventWithoutGetUtm() {
  var loaded = loadNoMediaGa();
  loaded.NoMediaGa.initNoMediaGa({ prefix: "no-media_" });
  loaded.window.trackInffitsEvent("click_start", { event_label: "開始" });
  var msg = loaded.messages[0];
  assert.strictEqual(msg.utm_source, "inffits", "無 getUtm 仍應帶組件預設 source");
  assert.strictEqual(msg.utm_medium, "iframe_ai_product");
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_campaign"));
}

function testProductClickUtm() {
  var loaded = loadNoMediaGa();
  var build = loaded.NoMediaGa.productClickUtm;
  assert.strictEqual(typeof build, "function", "productClickUtm 應存在");

  var withTitle = build({
    block: "recom_item",
    title: " 白襯衫 ",
    href: "https://example.com/p/1",
  });
  assert.strictEqual(withTitle.utm_content, "recom_item");
  assert.ok(!Object.prototype.hasOwnProperty.call(withTitle, "utm_term"));

  var hrefOnly = build({ block: "reel_Tops", title: "  ", href: "https://example.com/p/2" });
  assert.strictEqual(hrefOnly.utm_content, "reel_Tops");
  assert.ok(!Object.prototype.hasOwnProperty.call(hrefOnly, "utm_term"));

  var hotSale = build({
    block: "hot-sale".replace(/-/g, "_"),
    title: "(男女共穿款)條紋圓領肩鈕設計短袖",
    href: "https://example.com/p/hot",
  });
  assert.strictEqual(hotSale.utm_content, "hot_sale");
  assert.ok(!Object.prototype.hasOwnProperty.call(hotSale, "utm_term"));

  var empty = build({ block: "", title: "", href: "" });
  assert.ok(!Object.prototype.hasOwnProperty.call(empty, "utm_content"));
  assert.ok(!Object.prototype.hasOwnProperty.call(empty, "utm_term"));
}

function testGa4EventProductClickOverridesTermContent() {
  var loaded = loadNoMediaGa();
  loaded.NoMediaGa.initNoMediaGa({
    prefix: "no-media_",
    getUtm: function () {
      return {
        utm_source: "inffits",
        utm_medium: "iframe_ai_product",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
      };
    },
  });
  loaded.window.trackInffitsEvent("click_recom_item", {
    event_label: "白襯衫",
    utm_content: "recom_item",
  });
  var msg = loaded.messages[0];
  assert.strictEqual(msg.utm_source, "inffits");
  assert.strictEqual(msg.utm_content, "recom_item");
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_campaign"));
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_term"));
}

function testWithReelCampaign() {
  var loaded = loadNoMediaGa();
  var withReel = loaded.NoMediaGa.withReelCampaign;
  assert.strictEqual(typeof withReel, "function", "withReelCampaign 應存在");

  var noReel = withReel(
    { utm_source: "inffits", utm_medium: "iframe_ai_product", utm_campaign: "" },
    false
  );
  assert.strictEqual(noReel.utm_campaign, "no-media");
  assert.strictEqual(noReel.utm_source, "inffits");

  var reel = withReel({ utm_campaign: "" }, true);
  assert.strictEqual(reel.utm_campaign, "no-media-reel");
  assert.strictEqual(reel.utm_source, "inffits", "空 UTM 仍應補上預設 source");
  assert.strictEqual(reel.utm_medium, "iframe_ai_product");

  var overwritten = withReel({ utm_campaign: "custom" }, true);
  assert.strictEqual(overwritten.utm_campaign, "no-media-reel");
}

function testAppendUtmToProductUrl() {
  var loaded = loadNoMediaGa();
  var append = loaded.NoMediaGa.appendUtmToProductUrl;
  assert.strictEqual(typeof append, "function", "appendUtmToProductUrl 應存在");

  var url = append("https://shop.example/p/1", { block: "recom_item" });
  var parsed = new URL(url);
  assert.strictEqual(parsed.searchParams.get("utm_source"), "inffits");
  assert.strictEqual(parsed.searchParams.get("utm_medium"), "iframe_ai_product");
  assert.strictEqual(parsed.searchParams.get("utm_campaign"), "no-media");
  assert.strictEqual(parsed.searchParams.get("utm_content"), "recom_item");
  assert.strictEqual(parsed.searchParams.get("utm_term"), null, "空的 utm_term 不寫進 URL");
  assert.strictEqual(parsed.pathname, "/p/1");

  loaded.NoMediaGa.initNoMediaGa({
    prefix: "no-media_v2_",
    getUtm: function () {
      return loaded.NoMediaGa.withReelCampaign(loaded.NoMediaGa.defaultUtm(), true);
    },
  });
  var reelUrl = append("https://shop.example/p/2?color=red#gallery", {
    block: "reel_Tops",
  });
  var reelParsed = new URL(reelUrl);
  assert.strictEqual(reelParsed.searchParams.get("color"), "red", "原有 query 應保留");
  assert.strictEqual(reelParsed.searchParams.get("utm_campaign"), "no-media-reel");
  assert.strictEqual(reelParsed.searchParams.get("utm_content"), "reel_Tops");
  assert.strictEqual(reelParsed.hash, "#gallery");

  var overwritten = append("https://shop.example/p/3?utm_source=other", {
    block: "hot_sale",
  });
  assert.strictEqual(
    new URL(overwritten).searchParams.get("utm_source"),
    "inffits",
    "組件 UTM 應覆寫商品原有同名鍵"
  );

  assert.strictEqual(
    append("javascript:void(0)", { block: "recom_item" }),
    "javascript:void(0)"
  );
  assert.strictEqual(append("", { block: "recom_item" }), "");
}

testDefaultUtm();
testApplyUtmFromPayload();
testGa4EventOmitsEmptyUtm();
testGa4EventWithoutGetUtm();
testProductClickUtm();
testGa4EventProductClickOverridesTermContent();
testWithReelCampaign();
testAppendUtmToProductUrl();
console.log("utm.test.js ok");
