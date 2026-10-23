import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeProgress, mergeWatched, unionIds } from "./merge.ts";

test("lists keep everything from both sides, once", () => {
  assert.deepEqual(unionIds([1, 2, 3], [3, 4]), [1, 2, 3, 4]);
  assert.deepEqual(unionIds([], [5]), [5]);
});

test("the newer watch position wins, and a guest position without a time loses to a saved one", () => {
  const account = { 7: { ep: 3, pct: 40, t: 2000 }, 8: { ep: 1, pct: 10, t: 500 } };
  const device = { 7: { ep: 5, pct: 80, t: 3000 }, 8: { ep: 2, pct: 20 }, 9: { ep: 1, pct: 5 } };
  const merged = mergeProgress(account, device);
  assert.deepEqual(merged[7], { ep: 5, pct: 80, t: 3000 });
  assert.deepEqual(merged[8], { ep: 1, pct: 10, t: 500 });
  assert.deepEqual(merged[9], { ep: 1, pct: 5 });
});

test("watched keeps the furthest episode per show", () => {
  assert.deepEqual(mergeWatched({ 1: 4, 2: 9 }, { 1: 6, 3: 2 }), { 1: 6, 2: 9, 3: 2 });
});
