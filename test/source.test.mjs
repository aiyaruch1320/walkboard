import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {excerpt, checkEvidence} from "../skills/walkboard/lib/source.mjs";

function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-src-"));
  fs.mkdirSync(path.join(root, "src"));
  fs.writeFileSync(path.join(root, "src", "a.go"), Array.from({length: 30}, (_, i) => `line ${i + 1}`).join("\n"));
  fs.writeFileSync(path.join(os.tmpdir(), "walkboard-outside.txt"), "secret");
  return root;
}

test("an excerpt shows the referenced lines", () => {
  const root = repo();
  const r = excerpt({root}, "src/a.go:10");
  assert.equal(r.focus, 10);
  assert.equal(r.lines[r.focus - r.from], "line 10");
  const range = excerpt({root}, "src/a.go:5-8");
  assert.deepEqual(range.lines, ["line 5", "line 6", "line 7", "line 8"]);
});

test("files outside the root, missing files and lines past the end are refused", () => {
  const root = repo();
  assert.match(excerpt({root}, "../walkboard-outside.txt:1").error, /outside root|not found/);
  assert.match(excerpt({root}, "src/nope.go:1").error, /not found/);
  assert.match(excerpt({root}, "src/a.go:99").error, /past the end/);
  assert.match(excerpt({}, "src/a.go:1").error, /no root/);
  assert.equal(excerpt({root: "."}, "src/a.go:2", {base: root}).lines[1], "line 2");
  fs.symlinkSync(path.join(os.tmpdir(), "walkboard-outside.txt"), path.join(root, "src", "link.txt"));
  assert.equal(excerpt({root}, "src/link.txt:1").error, "outside root");
});

test("explain plans are checked against the code", () => {
  const root = repo();
  const plan = {mode: "explain", root, nodes: {a: {name: "A", file: "src/a.go:3"}, b: {name: "B", file: "src/a.go:300"}, c: {name: "C", file: "src/x.go:1"}}};
  const out = checkEvidence(plan).join("\n");
  assert.doesNotMatch(out, /node "a"/);
  assert.match(out, /node "b".*past the end/);
  assert.match(out, /node "c".*not found/);
  assert.deepEqual(checkEvidence({...plan, mode: "build"}), []);
});

test("ranges must make sense and anchors must still be in them", () => {
  const root = repo();
  assert.match(excerpt({root}, "src/a.go:0").error, /start at 1/);
  assert.match(excerpt({root}, "src/a.go:3-1").error, /ends before/);
  assert.match(excerpt({root}, "src/a.go:2-9999").error, /past the end/);
  const plan = {mode: "explain", root, nodes: {
    ok: {name: "ok", file: "src/a.go:10-12", anchor: "line 11"},
    moved: {name: "moved", file: "src/a.go:10", anchor: "line 25"},
    gone: {name: "gone", file: "src/a.go:10", anchor: "nothing"},
  }};
  const out = checkEvidence(plan).join("\n");
  assert.doesNotMatch(out, /node "ok"/);
  assert.match(out, /node "moved".*at line 25/);
  assert.match(out, /node "gone".*not in the file/);
});

test("files inside .walkboard are never shown as code", () => {
  const root = repo();
  fs.mkdirSync(path.join(root, ".walkboard"));
  fs.writeFileSync(path.join(root, ".walkboard", "session.json"), '{"token":"t"}');
  const r = excerpt({root: "."}, ".walkboard/session.json:1", {base: root});
  assert.ok(r.error);
  assert.ok(!JSON.stringify(r).includes('"t"'));
});
