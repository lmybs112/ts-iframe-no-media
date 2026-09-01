/**
 * i18n：lang 正規化、翻譯、DOM 套用
 * 執行：node tests/i18n.test.js
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function loadI18n() {
  var window = { document: { documentElement: { lang: "" } } };
  var sandbox = { window: window, document: window.document, console: console };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../js/shared/i18n.js"), "utf8"),
    sandbox
  );
  return sandbox.window.NoMediaI18n;
}

function testNormalizeLang() {
  var api = loadI18n();
  assert.strictEqual(api.normalizeLang("en"), "en");
  assert.strictEqual(api.normalizeLang("en-US"), "en");
  assert.strictEqual(api.normalizeLang("zh-TW"), "zh-TW");
  assert.strictEqual(api.normalizeLang("zh"), "zh-TW");
  assert.strictEqual(api.normalizeLang(""), "zh-TW");
}

function testTranslate() {
  var api = loadI18n();
  api.setLang("zh-TW");
  assert.strictEqual(api.t("recommend.refresh"), "刷新推薦");
  api.setLang("en");
  assert.strictEqual(api.t("recommend.refresh"), "Refresh picks");
  assert.strictEqual(api.t("missing.key"), "missing.key");
}

function testApplyDom() {
  var api = loadI18n();
  var el = { textContent: "", innerHTML: "", getAttribute: function () { return null; } };
  el.setAttribute = function (name, val) {
    if (name === "data-i18n") this._i18n = val;
    if (name === "data-i18n-html") this._i18nHtml = val;
  };
  el.getAttribute = function (name) {
    if (name === "data-i18n") return this._i18n;
    if (name === "data-i18n-html") return this._i18nHtml;
    return null;
  };
  el._i18n = "recommend.title";
  var root = {
    querySelectorAll: function (sel) {
      if (sel === "[data-i18n]") return [el];
      if (sel === "[data-i18n-html]") return [];
      return [];
    },
  };
  api.setLang("en");
  api.applyDom(root);
  assert.strictEqual(el.textContent, "Picked for you");
}

testNormalizeLang();
testTranslate();
testApplyDom();
console.log("i18n.test.js ok");
