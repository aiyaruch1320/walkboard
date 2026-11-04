import {test} from "node:test";
import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {startServer} from "../skills/walkboard/lib/server.mjs";

const bin = new URL("../skills/walkboard/bin/walkboard.mjs", import.meta.url).pathname;
const run = (...args) => promisify(execFile)(process.execPath, [bin, ...args]).catch((e) => e);

const valid = (extra = {}) => ({title: "t", settings: {commit: "suggest"}, steps: [{id: "s", title: "S", nodes: ["a"]}], nodes: {a: {name: "A"}}, ...extra});

function planDir(plan = valid()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-cli-"));
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  return dir;
}

test("sets running at the same time all land in plan.json", async () => {
  const ids = Array.from({length: 8}, (_, i) => `n${i}`);
  const dir = planDir(valid({steps: [{id: "s", title: "S", nodes: ids}], nodes: Object.fromEntries(ids.map((id) => [id, {name: "x"}]))}));
  const results = await Promise.all(ids.map((id) => run("set", dir, `node:${id}`, "name=done")));
  for (const r of results) assert.equal(r.stdout.trim(), "ok", r.stderr);
  const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
  assert.deepEqual(ids.map((id) => plan.nodes[id].name), ids.map(() => "done"));
  assert.deepEqual(fs.readdirSync(dir).sort(), ["plan.json"], "no lock or temp file left");
});

test("poll prints the batch and acknowledges it; --timeout gives up quietly", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const base = `http://127.0.0.1:${s.port}`;
  await fetch(`${base}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({text: "hi"})});
  const r = await run("poll", dir, "--timeout", "5");
  assert.deepEqual(r.stdout.trim().split("\n").map((l) => JSON.parse(l).text), ["hi"]);
  const {items} = await (await fetch(`${base}/api/thread?token=${s.token}`)).json();
  assert.equal(items[0].delivered, true);
  const empty = await run("poll", dir, "--timeout", "1");
  assert.equal(empty.stdout.trim(), "[]");
});

test("a review reaches poll with the picture's geometry, view included", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const geometry = {view: "m", map: {w: 900, h: 500}, zones: {Cloud: {x: 0, y: 0, w: 400, h: 300, zone: null, inside: null}}, boxes: {a: {x: 600, y: 40, w: 150, h: 80, zone: "Cloud", inside: "On-prem"}}, moved: ["a"], outOfZone: ["a"], overlaps: [], linesOverBoxes: []};
  await fetch(`http://127.0.0.1:${s.port}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({kind: "review", text: "check", view: "m", geometry})});
  const r = await run("poll", dir, "--timeout", "5");
  const got = JSON.parse(r.stdout.trim());
  assert.equal(got.kind, "review");
  assert.deepEqual(got.geometry, geometry);
});

test("a reply that starts with text containing a slash is not taken for the folder", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const r = await promisify(execFile)(process.execPath, [bin, "reply", "use a/b testing"], {cwd: dir});
  assert.equal(r.stderr, "");
  const {items} = await (await fetch(`http://127.0.0.1:${s.port}/api/thread?token=${s.token}`)).json();
  assert.deepEqual(items.map((i) => i.text), ["use a/b testing"]);
});

test("export never writes over the plan or into .walkboard, and needs an .html name", async () => {
  const dir = planDir(valid({title: "My plan / v2"}));
  for (const out of ["plan.json", ".walkboard/x.html", "notes.txt"]) {
    const r = await run("export", dir, "--html", path.join(dir, out));
    assert.notEqual(r.code ?? 0, 0, out);
  }
  assert.notEqual((await run("export", dir, "--html")).code ?? 0, 0, "--html without a name");
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).title, "My plan / v2");
  const r = await run("export", dir);
  assert.equal(r.code ?? 0, 0, r.stderr);
  assert.ok(fs.readdirSync(dir).some((f) => /^my-plan-v2\.html$/i.test(f)), fs.readdirSync(dir).join(" "));
});

test("draft prints the sketch in words and clears it by picture or change", async () => {
  const dir = planDir();
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", nodes: {a: {name: "API"}}, views: [{id: "m", kind: "map", zones: [{label: "Cloud", nodes: ["a"]}, {label: "DC", nodes: []}]}]}));
  assert.equal((await run("draft", dir)).stdout.trim(), "no draft");
  fs.mkdirSync(path.join(dir, ".walkboard"), {recursive: true});
  fs.writeFileSync(path.join(dir, ".walkboard", "draft.json"), JSON.stringify({version: 1, views: {m: {ops: [
    {id: "op1", op: "addNode", node: "new:1", name: "Redis", zone: "Cloud"}, {id: "op2", op: "addLink", from: "a", to: "new:1"}, {id: "op3", op: "move", node: "a", to: "Gone"}]}}}));
  const out = (await run("draft", dir)).stdout;
  assert.match(out, /op1 {2}\+ box Redis \(new:1\) in "Cloud"/);
  assert.match(out, /op2 {2}\+ line API \(a\) → Redis \(new:1\)/);
  assert.match(out, /op3 .*no longer fits: no zone "Gone"/);
  const cleared = (await run("draft", dir, "clear", "m", "op1", "op3")).stdout;
  assert.match(cleared, /^cleared\nm:\n {2}op2 .*no longer fits: a box on this line is not in the picture/, "prints what is left");
  assert.doesNotMatch((await run("draft", dir)).stdout, /op1|op3/);
  await run("draft", dir, "clear");
  assert.equal(fs.existsSync(path.join(dir, ".walkboard", "draft.json")), false);
});
