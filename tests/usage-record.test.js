/**
 * usage_record 純函式：釘選狀態、畫面商品、請求 body
 * 執行：node tests/usage-record.test.js
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function loadUsageRecord(fetchImpl) {
  var fetches = [];
  var window = {
    fetch:
      fetchImpl ||
      function (url, opts) {
        fetches.push({ url: url, opts: opts });
        return Promise.resolve({ json: function () { return Promise.resolve({}); } });
      },
  };
  var sandbox = { window: window, console: console };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../js/shared/usage-record.js"), "utf8"),
    sandbox
  );
  return { api: sandbox.window.NoMediaUsageRecord, fetches: fetches, window: window };
}

function assertJsonEqual(actual, expected, msg) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), msg);
}

function testGetPinnedState() {
  var api = loadUsageRecord().api;
  assert.strictEqual(typeof api.getPinnedState, "function");

  var empty = api.getPinnedState(["Tops", "Bottoms", "Dresses"], {});
  assertJsonEqual(empty.ProductCategory, []);
  assertJsonEqual(empty.ActionPtr, []);

  var pinned = api.getPinnedState(
    ["Tops", "Bottoms", "Dresses"],
    { Tops: true, Bottoms: false, Dresses: true }
  );
  assertJsonEqual(pinned.ProductCategory, ["Tops", "Dresses"]);
  assertJsonEqual(pinned.ActionPtr, [0, 2]);
}

function testGetVisibleProducts() {
  var api = loadUsageRecord().api;
  var a = { id: "a" };
  var b = { id: "b" };
  var c = { id: "c" };
  var products = api.getVisibleProducts(
    ["Tops", "Bottoms", "Dresses"],
    {
      Tops: [a, { id: "a2" }],
      Bottoms: [b],
      Dresses: [{ id: "c0" }, c],
    },
    { Tops: 0, Bottoms: 0, Dresses: 1 }
  );
  assertJsonEqual(products, [a, b, c]);

  var skipEmpty = api.getVisibleProducts(
    ["Tops", "Bottoms"],
    { Tops: [a], Bottoms: [] },
    { Tops: 0, Bottoms: 0 }
  );
  assertJsonEqual(skipEmpty, [a]);
}

function testBuildUsageBody() {
  var api = loadUsageRecord().api;
  var item = { Link: "https://x", ItemName: "t" };
  var recom = api.buildUsageBody({
    Brand: "OB91",
    GVID: "g",
    LGVID: "l",
    MRID: "",
    Action: "Recom",
    ProductInfo: [item],
    ProductCategory: ["Tops"],
    ActionPtr: [0],
  });
  assert.strictEqual(recom.Action, "Recom");
  assert.strictEqual(recom.Brand, "OB91");
  assertJsonEqual(recom.ProductInfo, [item]);
  assertJsonEqual(recom.ProductCategory, ["Tops"], "Recom 可帶 ProductCategory");
  assert.ok(
    !Object.prototype.hasOwnProperty.call(recom, "ActionPtr"),
    "空 ActionPtr 不寫入 body"
  );

  var recomNoCat = api.buildUsageBody({
    Brand: "OB91",
    Action: "Recom",
    ProductInfo: [item],
    ProductCategory: [],
    ActionPtr: [],
  });
  assert.ok(
    !Object.prototype.hasOwnProperty.call(recomNoCat, "ProductCategory"),
    "空 ProductCategory 不寫入 body"
  );

  var pin = api.buildUsageBody({
    Brand: "OB91",
    GVID: "",
    LGVID: "",
    MRID: "m",
    Action: "Pin",
    ProductInfo: [item],
    ProductCategory: ["Tops"],
    ActionPtr: [0],
  });
  assertJsonEqual(pin.ProductCategory, ["Tops"]);
  assertJsonEqual(pin.ActionPtr, [0]);

  var pinNone = api.buildUsageBody({
    Brand: "OB91",
    Action: "Pin",
    ProductInfo: [item],
    ProductCategory: [],
    ActionPtr: [],
  });
  assert.ok(!Object.prototype.hasOwnProperty.call(pinNone, "ProductCategory"));
  assert.ok(!Object.prototype.hasOwnProperty.call(pinNone, "ActionPtr"));
}

function testPostUsageRecord() {
  var loaded = loadUsageRecord();
  loaded.api.postUsageRecord({
    Brand: "OB91",
    Action: "Recom",
    ProductInfo: [],
    ProductCategory: [],
    ActionPtr: [],
  });
  assert.strictEqual(loaded.fetches.length, 1);
  assert.ok(
    loaded.fetches[0].url.indexOf(
      "mkt_extensions_usage_record/extension/usage_record"
    ) >= 0
  );
  assert.strictEqual(loaded.fetches[0].opts.method, "POST");
  var body = JSON.parse(loaded.fetches[0].opts.body);
  assert.strictEqual(body.Action, "Recom");
}

testGetPinnedState();
testGetVisibleProducts();
testBuildUsageBody();
testPostUsageRecord();
console.log("usage-record.test.js ok");
