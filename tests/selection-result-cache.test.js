/**
 * 選物結果快取契約：v1 / v2 還原不可重抽
 * （純邏輯模擬，對齊現行 iframe 行為）
 */
const assert = require("assert");

function pickV1Items(responseItem, opts) {
  const restoreMode = !!(opts && opts.restore);
  const displayCount = Math.min(responseItem.length, 3);
  if (restoreMode) {
    return responseItem.slice(0, displayCount);
  }
  // 首次／換一批：random（此處用固定種子模擬抽出 [2,0,1]）
  const picked = [2, 0, 1].slice(0, displayCount);
  return picked.map((i) => responseItem[i]);
}

function pickV2FinalIdx(cats, pools, opts) {
  const restoreMode = !!(opts && opts.restore);
  const restoreIdx = (opts && opts.capsuleIndex) || null;
  const map = {};
  cats.forEach((cat) => {
    const pool = pools[cat] || [];
    if (restoreIdx && restoreIdx[cat] != null && pool.length > 0) {
      const ri = Number(restoreIdx[cat]);
      map[cat] = Number.isFinite(ri) && ri >= 0 && ri < pool.length ? ri : 0;
    } else if (restoreMode) {
      map[cat] = 0; // 還原绝不 random
    } else {
      map[cat] = 1; // 模擬 random 抽到 1
    }
  });
  return map;
}

// --- v1：還原必須是畫面那三件，順序不變 ---
const pool = [
  { ItemName: "A", Link: "a" },
  { ItemName: "B", Link: "b" },
  { ItemName: "C", Link: "c" },
  { ItemName: "D", Link: "d" },
];
const shown = pickV1Items(pool, { restore: false });
assert.deepStrictEqual(
  shown.map((x) => x.ItemName),
  ["C", "A", "B"]
);
const restored = pickV1Items(shown, { restore: true });
assert.deepStrictEqual(
  restored.map((x) => x.ItemName),
  ["C", "A", "B"],
  "v1 還原不可重抽"
);

// --- v2：還原必須用保存的 capsuleIndex，不可 random ---
const pools = {
  Tops: [{ id: "t0" }, { id: "t1" }, { id: "t2" }],
  Bottoms: [{ id: "b0" }, { id: "b1" }],
  Shoes: [{ id: "s0" }, { id: "s1" }, { id: "s2" }],
};
const idx = pickV2FinalIdx(Object.keys(pools), pools, { restore: false });
assert.strictEqual(idx.Tops, 1);
const savedIdx = { Tops: 2, Bottoms: 0, Shoes: 1 };
const restoredIdx = pickV2FinalIdx(Object.keys(pools), pools, {
  restore: true,
  capsuleIndex: savedIdx,
});
assert.deepStrictEqual(restoredIdx, savedIdx, "v2 還原必須鎖 capsuleIndex");
const restoreNoIdx = pickV2FinalIdx(Object.keys(pools), pools, {
  restore: true,
});
assert.strictEqual(restoreNoIdx.Tops, 0, "v2 還原缺 index 也不可 random");

console.log("selection-result-cache.test.js OK");
