import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function extractFunctionBlock(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`找不到函式：${functionName}`);
  }

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let idx = bodyStart; idx < source.length; idx++) {
    const char = source[idx];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = idx + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error(`函式結尾解析失敗：${functionName}`);
  }

  return source.slice(start, end);
}

function loadHelpers() {
  const source = readFileSync(new URL("../js/iframe.js", import.meta.url), "utf8");
  const helperNames = [
    "normalizeShowOriginPriceFlag",
    "resolveShowOriginPriceFromPayload",
    "resolveShowOriginPriceFromSearch",
  ];

  const blocks = helperNames.map((name) => extractFunctionBlock(source, name));
  const script = `
${blocks.join("\n\n")}
globalThis.__showOriginHelpers = {
  normalizeShowOriginPriceFlag,
  resolveShowOriginPriceFromPayload,
  resolveShowOriginPriceFromSearch,
};
`;

  const context = {
    URLSearchParams,
    globalThis: {},
  };

  vm.createContext(context);
  vm.runInContext(script, context);
  return context.globalThis.__showOriginHelpers;
}

const {
  resolveShowOriginPriceFromPayload,
  resolveShowOriginPriceFromSearch,
} = loadHelpers();

test("show_origin_price: !0（true）應優先顯示原價", () => {
  const next = resolveShowOriginPriceFromPayload(
    {
      show_origin_price: !0,
    },
    false
  );

  assert.equal(next, true);
});

test("巢狀 config.show_origin_price 也應被解析", () => {
  const next = resolveShowOriginPriceFromPayload(
    {
      config: {
        show_origin_price: true,
      },
    },
    false
  );

  assert.equal(next, true);
});

test("駝峰 showOriginPrice 字串 true 也應解析為 true", () => {
  const next = resolveShowOriginPriceFromPayload(
    {
      showOriginPrice: "true",
    },
    false
  );

  assert.equal(next, true);
});

test("query 參數 show_origin_price=!0 應解析為 true", () => {
  const next = resolveShowOriginPriceFromSearch("?show_origin_price=!0", false);
  assert.equal(next, true);
});

test("query 參數 showOriginPrice=0 應解析為 false", () => {
  const next = resolveShowOriginPriceFromSearch("?showOriginPrice=0", true);
  assert.equal(next, false);
});

test("未傳值時保留既有值", () => {
  const next = resolveShowOriginPriceFromPayload({}, true);
  assert.equal(next, true);
});
