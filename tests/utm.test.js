/**
 * UTM：from_preview 更新規則與 GA4Event 非空欄位
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
  var sandbox = { window: window, console: console };
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

function testApplyUtmFromPayload() {
  var loaded = loadNoMediaGa();
  var apply = loaded.NoMediaGa.applyUtmFromPayload;
  assert.strictEqual(typeof apply, "function", "applyUtmFromPayload 應存在");

  var empty = apply({}, null);
  assertUtmEqual(empty, {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  });

  var current = apply(
    {
      utm_source: " inffits ",
      utm_medium: "iframe_ai_product",
      utm_campaign: "no-media-v1",
    },
    empty
  );
  assert.strictEqual(current.utm_source, "inffits");
  assert.strictEqual(current.utm_medium, "iframe_ai_product");
  assert.strictEqual(current.utm_campaign, "no-media-v1");
  assert.strictEqual(current.utm_term, "");

  var cleared = apply({ utm_source: "   " }, current);
  assert.strictEqual(cleared.utm_source, "", "空字串應清除該欄");
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
  assert.ok(!Object.prototype.hasOwnProperty.call(msg, "utm_source"));
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

  var overwritten = withReel({ utm_campaign: "custom" }, true);
  assert.strictEqual(overwritten.utm_campaign, "no-media-reel");
}

testApplyUtmFromPayload();
testGa4EventOmitsEmptyUtm();
testGa4EventWithoutGetUtm();
testProductClickUtm();
testGa4EventProductClickOverridesTermContent();
testWithReelCampaign();
console.log("utm.test.js ok");
