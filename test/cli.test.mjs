import {test} from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {startServer} from "../skills/walkboard/lib/server.mjs";

const bin = fileURLToPath(new URL("../skills/walkboard/bin/walkboard.mjs", import.meta.url));
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

test("poll --now reads what waits at once, and only a waiting poll makes the page say the agent listens", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const base = `http://127.0.0.1:${s.port}`;
  const thread = async () => (await fetch(`${base}/api/thread?token=${s.token}`)).json();
  // Nothing waits: [] right away, not after a wait.
  const t0 = Date.now();
  assert.equal((await run("poll", dir, "--now")).stdout.trim(), "[]");
  assert.ok(Date.now() - t0 < 4000, "returns at once");
  await fetch(`${base}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({text: "hi"})});
  await fetch(`${base}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({text: "and this"})});
  const r = await run("poll", dir, "--now");
  assert.deepEqual(r.stdout.trim().split("\n").map((l) => JSON.parse(l).text), ["hi", "and this"]);
  const after = await thread();
  assert.ok(after.items.every((m) => m.delivered), "acknowledged like any batch");
  // An agent that only ever reads with --now is not woken by clicks: the page tells the user to say so in chat.
  assert.equal(after.listens, false);
  assert.equal((await run("poll", dir, "--timeout", "1")).stdout.trim(), "[]");
  assert.equal((await thread()).listens, true);
  assert.ok(fs.existsSync(path.join(dir, ".walkboard", "listens")), "kept across restarts");
});

test("an agent that stopped polling a while ago no longer counts as listening", async (t) => {
  const dir = planDir();
  const s = await startServer(dir, {recentMs: 400});
  t.after(s.close);
  const listens = async () => (await (await fetch(`http://127.0.0.1:${s.port}/api/thread?token=${s.token}`)).json()).listens;
  assert.equal((await run("poll", dir, "--timeout", "1")).stdout.trim(), "[]");
  assert.equal(await listens(), true, "just polled: answering, or about to poll again");
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(await listens(), false, "gone quiet: the page tells the user to say so in the agent's chat");
});

test("poll --now says so when the server is not running", async () => {
  const r = await run("poll", planDir(), "--now");
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /not running/);
});

test("poll gives the agent an attached image as a path it can read", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const base = `http://127.0.0.1:${s.port}`;
  const png = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.alloc(20)]);
  const {name} = await (await fetch(`${base}/api/image?token=${s.token}`, {method: "POST", body: png})).json();
  await fetch(`${base}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({text: "see", images: [name]})});
  const m = JSON.parse((await run("poll", dir, "--timeout", "5")).stdout.trim());
  assert.deepEqual(fs.readFileSync(m.images[0]), png);
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
  assert.equal(got.view, "m");
  assert.deepEqual(got.geometry, {moved: geometry.moved, outOfZone: geometry.outOfZone});
  await fetch(`http://127.0.0.1:${s.port}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({kind: "review", text: "check again", view: "m", geometry})});
  const full = JSON.parse((await run("poll", dir, "--full", "--timeout", "5")).stdout.trim());
  assert.deepEqual(full.geometry, geometry);
});

test("a reply is for a person: no draft ids, and its links lead somewhere", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
  const node = Object.keys(plan.nodes)[0];
  fs.mkdirSync(path.join(dir, ".walkboard"), {recursive: true});
  fs.writeFileSync(path.join(dir, ".walkboard", "draft.json"), JSON.stringify({version: 1, views: {m: {ops: [{id: "o3fk2ab", op: "addNode", node: "new:abc", name: "Cache", zone: "Data"}]}}}));
  assert.match((await run("reply", dir, "o3fk2ab needs a port")).stderr, /does not know o3fk2ab/);
  assert.match((await run("reply", dir, "see new:abc please")).stderr, /does not know new:abc/);
  assert.match((await run("reply", dir, "see [[node:nope]]")).stderr, /no node "nope"/);
  assert.match((await run("reply", dir, `see [[node:${node}]] and [[plan]]`)).stdout, /sent/);
});

test("every reference a skill file links to exists", () => {
  const root = fileURLToPath(new URL("../skills/walkboard/", import.meta.url));
  const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".md") ? [path.join(d, e.name)] : []));
  const missing = [];
  for (const f of [path.join(root, "SKILL.md"), ...walk(path.join(root, "references"))]) {
    const text = fs.readFileSync(f, "utf8");
    for (const [, to] of text.matchAll(/\]\(([^)#\s]+\.md)\)/g)) if (!fs.existsSync(path.resolve(path.dirname(f), to))) missing.push(`${f}: ${to}`);
    for (const [, to] of text.matchAll(/`?(references\/[\w/-]+\.md)`?/g)) if (!fs.existsSync(path.join(root, to))) missing.push(`${f}: ${to}`);
  }
  assert.deepEqual(missing, []);
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

// Another copy of the skill, as the plugin manager installs it: <version>/skills/walkboard beside <version>/.claude-plugin.
function copyAt(version) {
  const root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-copy-")), version);
  fs.cpSync(fileURLToPath(new URL("../skills/walkboard", import.meta.url)), path.join(root, "skills", "walkboard"), {recursive: true});
  fs.mkdirSync(path.join(root, ".claude-plugin"));
  fs.writeFileSync(path.join(root, ".claude-plugin", "plugin.json"), JSON.stringify({version}));
  return (...args) => promisify(execFile)(process.execPath, [path.join(root, "skills", "walkboard", "bin", "walkboard.mjs"), ...args]).catch((e) => e);
}
const served = (dir) => JSON.parse(fs.readFileSync(path.join(dir, ".walkboard", "server.json"), "utf8"));

test("open takes over a page an older copy serves, on the same address; a newer copy's page stays", async (t) => {
  const dir = planDir();
  t.after(() => run("stop", dir));
  const old = copyAt("0.0.1");
  const first = (await old("open", dir, "--no-browser")).stdout.trim();
  assert.equal(served(dir).version, "0.0.1");
  const r = await run("open", dir, "--no-browser");
  assert.equal(r.stdout.trim(), first, "same address and token, so the open tab finds it");
  assert.notEqual(served(dir).version, "0.0.1");
  assert.equal(served(dir).skill, fileURLToPath(new URL("../skills/walkboard", import.meta.url)));

  await run("stop", dir);
  const newer = copyAt("99.0.0");
  await newer("open", dir, "--no-browser");
  const kept = await run("open", dir, "--no-browser");
  assert.equal(served(dir).version, "99.0.0");
  assert.match(kept.stderr, /newer than this session/);
  await newer("stop", dir);
});
