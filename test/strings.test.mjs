import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const asset = (f) => fs.readFileSync(new URL(`../skills/walkboard/assets/${f}`, import.meta.url), "utf8");
const STRINGS = new Function(`${asset("strings.js")};return STRINGS`)();

test("both languages have the same labels", () => {
  assert.deepEqual(Object.keys(STRINGS.th).sort(), Object.keys(STRINGS.en).sort());
});

test("every label the page asks for exists", () => {
  const page = asset("viewer.html"), keys = Object.keys(STRINGS.en);
  for (const [, k, built] of page.matchAll(/\bt\("(\w+)"( \+)?/g)) {
    if (built) assert.ok(keys.some((x) => x.startsWith(k)), `no label starts with ${k}`);
    else assert.ok(keys.includes(k), `no label ${k}`);
  }
});
