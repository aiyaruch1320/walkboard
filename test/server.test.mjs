import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import {startServer} from "../skills/walkboard/lib/server.mjs";

function planDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-"));
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", views: [], nodes: {}}));
  return dir;
}

const call = (s, route, init) => fetch(`http://127.0.0.1:${s.port}${route}${route.includes("?") ? "&" : "?"}token=${s.token}`, init);
const post = (s, route, body) => call(s, route, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});

async function nextEvent(s, name, trigger) {
  const ctrl = new AbortController();
  const res = await call(s, "/api/events", {signal: ctrl.signal});
  const reader = res.body.getReader();
  await trigger();
  let buf = "";
  for (;;) {
    const {value, done} = await reader.read();
    if (done) throw new Error("stream ended");
    buf += new TextDecoder().decode(value);
    const m = buf.match(new RegExp(`event: ${name}\\ndata: (.*)\\n`));
    if (m) {
      ctrl.abort();
      return JSON.parse(m[1]);
    }
  }
}

test("a wrong token is refused", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  assert.equal((await fetch(`http://127.0.0.1:${s.port}/?token=nope`)).status, 403);
  assert.equal((await call(s, "/")).status, 200);
});

test("the page arrives as one file", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const html = await (await call(s, "/")).text();
  assert.doesNotMatch(html, /<link rel="stylesheet"|<script src=/);
  assert.match(html, /const STRINGS = \{/);
  assert.match(html, /--new-bd/);
});

test("a double click sends one message", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const a = await (await post(s, "/api/feedback", {kind: "approve", text: "go"})).json();
  const b = await (await post(s, "/api/feedback", {kind: "approve", text: "go"})).json();
  assert.equal(a.id, b.id);
  const items = await (await call(s, "/api/poll")).json();
  assert.equal(items.length, 1);
});

test("feedback reaches a waiting poll", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const polled = call(s, "/api/poll").then((r) => r.json());
  await post(s, "/api/feedback", {node: "a", kind: "confused", text: "why?"});
  const items = await polled;
  assert.equal(items.length, 1);
  assert.equal(items[0].node, "a");
  assert.ok(items[0].id && items[0].at);
});

test("an empty poll round answers [] so the client can wait again", async (t) => {
  const s = await startServer(planDir(), {pollMs: 50});
  t.after(s.close);
  assert.deepEqual(await (await call(s, "/api/poll")).json(), []);
});

test("feedback waits for a later poll when nobody is polling", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const ctrl = new AbortController();
  call(s, "/api/poll", {signal: ctrl.signal}).catch(() => {});
  await new Promise((r) => setTimeout(r, 50));
  ctrl.abort();
  await new Promise((r) => setTimeout(r, 50));
  await post(s, "/api/feedback", {text: "after a dropped poll"});
  const items = await (await call(s, "/api/poll")).json();
  assert.deepEqual(items.map((i) => i.text), ["after a dropped poll"]);
});

test("pending feedback survives a restart, delivered feedback is not repeated", async (t) => {
  const dir = planDir();
  const first = await startServer(dir);
  await post(first, "/api/feedback", {text: "one"});
  const got = await (await call(first, "/api/poll")).json();
  assert.equal(got.length, 1);
  await post(first, "/api/ack", {ids: got.map((i) => i.id)});
  await post(first, "/api/feedback", {text: "two"});
  await first.close();

  const s = await startServer(dir);
  t.after(s.close);
  assert.equal(s.port, first.port);
  assert.equal(s.token, first.token);
  // The first request may reuse a pooled socket of the old server.
  const poll = () => call(s, "/api/poll").catch(() => call(s, "/api/poll"));
  assert.deepEqual((await (await poll()).json()).map((i) => i.text), ["two"]);
});

test("bad feedback is rejected", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  assert.equal((await post(s, "/api/feedback", {node: "a"})).status, 400);
  assert.equal((await call(s, "/api/feedback", {method: "POST", body: "not json"})).status, 400);
  assert.equal((await post(s, "/api/feedback", ["x"])).status, 400);
});

test("a reply is stored and pushed to the page", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const ev = await nextEvent(s, "reply", () => post(s, "/api/reply", {node: "a", text: "because"}));
  assert.equal(ev.text, "because");
  const {items} = await (await call(s, "/api/thread")).json();
  assert.deepEqual(items.map((r) => r.text), ["because"]);
});

test("the page learns when the agent picks feedback up", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const item = await (await post(s, "/api/feedback", {node: "a", text: "q"})).json();
  let thread = await (await call(s, "/api/thread")).json();
  assert.equal(thread.items[0].delivered, false);
  assert.equal(thread.waiting, 0);
  // Picked up means acknowledged: a poll that dies before the agent reads it does not count.
  const ev = await nextEvent(s, "delivered", async () => {
    const got = await (await call(s, "/api/poll")).json();
    assert.equal((await (await call(s, "/api/thread")).json()).items[0].delivered, false);
    await post(s, "/api/ack", {ids: got.map((i) => i.id)});
  });
  assert.deepEqual(ev.ids, [item.id]);
  thread = await (await call(s, "/api/thread")).json();
  assert.equal(thread.items[0].delivered, true);
  assert.equal(thread.items[0].from, "user");
});

test("the page learns whether the agent is listening", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const ctrl = new AbortController();
  const ev = await nextEvent(s, "agent", () => {
    call(s, "/api/poll", {signal: ctrl.signal}).catch(() => {});
  });
  assert.equal(ev.waiting, 1);
  ctrl.abort();
});

test("editing plan.json tells the page to reload", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  await new Promise((r) => setTimeout(r, 50));
  const ev = await nextEvent(s, "plan", async () => {
    await new Promise((r) => setTimeout(r, 20));
    fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "changed"}));
  });
  assert.ok(ev.at);
  assert.equal((await (await call(s, "/api/plan")).json()).title, "changed");
});

test("a torn feedback line is skipped instead of stopping the server", async (t) => {
  const dir = planDir();
  fs.mkdirSync(path.join(dir, ".walkboard"));
  fs.writeFileSync(path.join(dir, ".walkboard", "feedback.jsonl"), '{"id":"1","text":"kept"}\n{"kind":"question","te\n');
  fs.writeFileSync(path.join(dir, ".walkboard", "session.json"), "{oops");
  const s = await startServer(dir);
  t.after(s.close);
  assert.deepEqual((await (await call(s, "/api/poll")).json()).map((i) => i.text), ["kept"]);
});

test("long Thai text arrives intact and an oversized body gets 413", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  const text = "ทดสอบภาษาไทย".repeat(1500);
  const item = await (await post(s, "/api/feedback", {text})).json();
  assert.equal(item.text, text);
  assert.equal((await post(s, "/api/feedback", {text: "ก".repeat(30000)})).status, 413);
});

test("only one server runs per plan folder", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  assert.throws(() => startServer(dir), /already running/);
  assert.equal((await (await call(s, "/api/status")).json()).pid, process.pid);
  assert.equal(fs.statSync(path.join(dir, ".walkboard", "session.json")).mode & 0o777, 0o600);
});

test("a lock left by a dead process is taken over", async (t) => {
  const dir = planDir();
  fs.mkdirSync(path.join(dir, ".walkboard"));
  fs.writeFileSync(path.join(dir, ".walkboard", "server.lock"), "999999");
  const s = await startServer(dir);
  t.after(s.close);
  assert.equal((await call(s, "/")).status, 200);
});

test("a waiting poll is told when the server stops", async () => {
  const s = await startServer(planDir());
  const polled = call(s, "/api/poll");
  await new Promise((r) => setTimeout(r, 50));
  await s.close();
  const r = await polled;
  assert.equal(r.status, 410);
});

test("the page can read a short excerpt of a box's code, only inside the root", async (t) => {
  const dir = planDir();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-root-"));
  fs.writeFileSync(path.join(root, "a.go"), "package a\n\nfunc A() {}\n");
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", root, nodes: {a: {name: "A", file: "a.go:3"}, x: {name: "X", file: "../../etc/hosts:1"}}}));
  const s = await startServer(dir);
  t.after(s.close);
  const ok = await (await call(s, "/api/source?node=a")).json();
  assert.equal(ok.lines[ok.focus - ok.from], "func A() {}");
  assert.equal((await call(s, "/api/source?node=x")).status, 404);
  assert.equal((await call(s, "/api/source?node=constructor")).status, 404);
});

test("a switch on the page saves the setting without waking the agent", async (t) => {
  const dir = planDir();
  const s = await startServer(dir, {pollMs: 300});
  t.after(s.close);
  const quiet = call(s, "/api/poll").then((r) => r.json());
  const r = await post(s, "/api/settings", {teachBack: false, commit: "auto", extra: 1});
  assert.equal(r.status, 200);
  const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
  assert.deepEqual(plan.settings, {teachBack: false, commit: "auto"});
  assert.equal(plan.title, "t");
  assert.deepEqual(await quiet, []);
  const polled = call(s, "/api/poll").then((r) => r.json());
  await post(s, "/api/feedback", {kind: "question", text: "why?"});
  const items = await polled;
  assert.deepEqual(items.map((i) => i.kind), ["settings", "question"]);
  assert.deepEqual(items[0].settings, {teachBack: false, commit: "auto"});
  const thread = await (await call(s, "/api/thread")).json();
  assert.equal(thread.items.length, 1);
  assert.equal((await post(s, "/api/settings", {commit: "sometimes"})).status, 400);
  assert.equal((await post(s, "/api/settings", {teachBack: "yes"})).status, 400);
});

test("design weights are saved from the page and reach the agent with its next message", async (t) => {
  const dir = planDir();
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", mode: "design", criteria: [{id: "cost", label: "Cost", weight: 1}], views: [], nodes: {}}));
  const s = await startServer(dir);
  t.after(s.close);
  assert.equal((await post(s, "/api/settings", {weights: {cost: 3, nope: 2}})).status, 400);
  assert.equal((await post(s, "/api/settings", {weights: [3, 3]})).status, 400);
  assert.equal((await post(s, "/api/settings", {weights: {cost: 9}})).status, 400);
  assert.equal((await post(s, "/api/settings", {weights: {cost: 3}})).status, 200);
  const saved = fs.readFileSync(path.join(dir, "plan.json"), "utf8");
  assert.equal(JSON.parse(saved).criteria[0].weight, 3);
  assert.equal(saved.trim().includes("\n"), false, "a compact plan stays compact");
  const polled = call(s, "/api/poll").then((r) => r.json());
  await post(s, "/api/feedback", {kind: "question", text: "?"});
  const [first] = await polled;
  assert.deepEqual(first.weights, {cost: 3});
});

test("a batch whose poll died before the ack goes out again", async (t) => {
  const s = await startServer(planDir());
  t.after(s.close);
  await post(s, "/api/feedback", {text: "lost?"});
  const first = await (await call(s, "/api/poll")).json();
  const again = await (await call(s, "/api/poll")).json();
  assert.deepEqual(again.map((i) => i.id), first.map((i) => i.id));
  assert.equal((await post(s, "/api/ack", {ids: again.map((i) => i.id)})).status, 200);
  assert.equal((await (await call(s, "/api/thread")).json()).items[0].delivered, true);
});

test("a plan.json that is not a plan answers 409 instead of stopping the server", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  for (const body of ["null", "{", "[]"]) {
    fs.writeFileSync(path.join(dir, "plan.json"), body);
    for (const route of ["/api/export", "/api/source?node=a"]) assert.equal((await call(s, route)).status, 409, `${body} ${route}`);
  }
  assert.equal((await call(s, "/api/status")).status, 200);
});

test("a deleted .walkboard folder is put back so no second server starts", async (t) => {
  const dir = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  fs.rmSync(path.join(dir, ".walkboard"), {recursive: true, force: true});
  await new Promise((r) => setTimeout(r, 1300));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, ".walkboard", "server.json"), "utf8")).port, s.port);
});

test("dragged tables are saved in the view, and cleared again", async (t) => {
  const dir = planDir();
  const plan = {title: "t", views: [{id: "d", kind: "datamodel", tables: [{node: "a", columns: [{name: "id"}]}]}, {id: "f", kind: "flow", lanes: []}], nodes: {a: {name: "A"}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  const read = () => JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).views[0].layout;
  assert.equal((await post(s, "/api/layout", {view: "d", positions: {a: {x: 10.4, y: 20}, ghost: {x: 1, y: 1}}})).status, 200);
  assert.deepEqual(read(), {a: {x: 10, y: 20}});
  assert.equal((await post(s, "/api/layout", {view: "f", positions: {}})).status, 400);
  assert.equal((await post(s, "/api/layout", {view: "d", positions: {a: {x: -5, y: 0}}})).status, 400);
  assert.equal((await post(s, "/api/layout", {view: "d", positions: null})).status, 200);
  assert.equal(read(), undefined);
});

test("messages about a box carry its name, so it survives the box being taken out", async (t) => {
  const dir = planDir();
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", views: [], nodes: {a: {name: "Queue"}}}));
  const s = await startServer(dir);
  t.after(s.close);
  await post(s, "/api/feedback", {node: "a", text: "why?", nodeName: "spoofed"});
  await post(s, "/api/reply", {node: "a", from: "agent", text: "because"});
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", views: [], nodes: {}}));
  await post(s, "/api/reply", {node: "a", from: "agent", text: "taken out"});
  await post(s, "/api/feedback", {node: "constructor", text: "odd id"});
  const {items} = await (await call(s, "/api/thread")).json();
  const byText = Object.fromEntries(items.map((i) => [i.text, i.nodeName]));
  assert.deepEqual(byText, {"why?": "Queue", because: "Queue", "taken out": undefined, "odd id": undefined});
});

test("boxes and zones moved on a map are saved as offsets, only for what the map holds", async (t) => {
  const dir = planDir();
  const plan = {title: "t", views: [{id: "m", kind: "map", zones: [{label: "VPC", zones: [{label: "Sub", nodes: ["a"]}]}]}], nodes: {a: {name: "A"}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  const read = () => JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).views[0].layout;
  assert.equal((await post(s, "/api/layout", {view: "m", positions: {a: {x: -30, y: 12}, "z:Sub": {x: 5, y: 0}, ghost: {x: 1, y: 1}}})).status, 200);
  assert.deepEqual(read(), {a: {x: -30, y: 12}, "z:Sub": {x: 5, y: 0}});
  assert.equal((await post(s, "/api/layout", {view: "m", positions: null})).status, 200);
  assert.equal(read(), undefined);
});

test("a map offset keeps the zone it was dragged in; a table's does not", async (t) => {
  const dir = planDir();
  const plan = {title: "t", views: [{id: "m", kind: "map", zones: [{label: "Cloud", nodes: ["a"]}]}, {id: "d", kind: "datamodel", tables: [{node: "a"}]}], nodes: {a: {name: "A"}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  const read = (i) => JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).views[i].layout;
  assert.equal((await post(s, "/api/layout", {view: "m", positions: {a: {x: 5, y: 6, in: "Cloud"}, "z:Cloud": {x: 1, y: 1, in: 7}}})).status, 200);
  assert.deepEqual(read(0), {a: {x: 5, y: 6, in: "Cloud"}, "z:Cloud": {x: 1, y: 1}});
  assert.equal((await post(s, "/api/layout", {view: "d", positions: {a: {x: 5, y: 6, in: "Cloud"}}})).status, 200);
  assert.deepEqual(read(1), {a: {x: 5, y: 6}});
});

test("a map keeps zone sizes, placed-by-hand mode, and places for boxes and zones the draft adds", async (t) => {
  const dir = planDir();
  const plan = {title: "t", views: [{id: "m", kind: "map", zones: [{label: "Cloud", nodes: ["a"]}]}, {id: "d", kind: "datamodel", tables: [{node: "a"}]}], nodes: {a: {name: "A"}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  const read = (i) => JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).views[i].layout;
  const positions = {"@fixed": {x: 0, y: 0}, "z:Cloud": {x: 6, y: 10, w: 300.4, h: 0, in: ""}, a: {x: 10, y: 38, w: 50, in: "Cloud"}, "new:k3x9": {x: 20, y: 90, in: "Hub"}, "z:Hub": {x: 400, y: 10, in: ""}, ghost: {x: 1, y: 1}, "__proto__": {x: 1, y: 1}};
  assert.equal((await post(s, "/api/layout", {view: "m", positions})).status, 200);
  assert.deepEqual(read(0), {"@fixed": {x: 0, y: 0}, "z:Cloud": {x: 6, y: 10, in: "", w: 300}, a: {x: 10, y: 38, in: "Cloud", w: 50}, "new:k3x9": {x: 20, y: 90, in: "Hub"}, "z:Hub": {x: 400, y: 10, in: ""}});
  assert.equal((await post(s, "/api/layout", {view: "d", positions: {a: {x: 5, y: 6, w: 80}, "new:k3x9": {x: 1, y: 1}}})).status, 200);
  // A table the draft adds keeps its place too; a ghost does not.
  assert.deepEqual(read(1), {a: {x: 5, y: 6}, "new:k3x9": {x: 1, y: 1}});
  assert.equal((await post(s, "/api/layout", {view: "d", positions: {a: {x: 5, y: 6}, ghost: {x: 1, y: 1}}})).status, 200);
  assert.deepEqual(read(1), {a: {x: 5, y: 6}});
});

test("boxes on state, decision and impact pictures keep places; a picture with fixed columns has none", async (t) => {
  const dir = planDir();
  const plan = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}}, views: [
    {id: "s", kind: "state", states: ["a"], transitions: [{from: "a", to: "b"}]},
    {id: "q", kind: "decision", edges: [{from: "a", to: "b"}]},
    {id: "i", kind: "impact", nodes: ["a"], edges: [{from: "a", to: "b"}]},
    {id: "k", kind: "k8s", targets: ["a"]}]};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  const read = (i) => JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).views[i].layout;
  for (const [i, view] of ["s", "q", "i"].entries()) {
    assert.equal((await post(s, "/api/layout", {view, positions: {a: {x: 10.4, y: 20}, b: {x: 5, y: 6}, "new:k3x9": {x: 1, y: 1}, ghost: {x: 1, y: 1}}})).status, 200);
    assert.deepEqual(read(i), {a: {x: 10, y: 20}, b: {x: 5, y: 6}, "new:k3x9": {x: 1, y: 1}});
  }
  assert.equal((await post(s, "/api/layout", {view: "s", positions: {a: {x: -1, y: 0}}})).status, 400);
  assert.equal((await post(s, "/api/layout", {view: "k", positions: {a: {x: 1, y: 1}}})).status, 400);
  assert.equal((await post(s, "/api/layout", {view: "s", positions: null})).status, 200);
  assert.equal(read(0), undefined);
});

test("a draft is saved per picture, checked, announced, and never wakes the agent", async (t) => {
  const dir = planDir();
  const plan = {title: "t", views: [{id: "m", kind: "map", zones: [{label: "Cloud", nodes: ["a"]}]}, {id: "f", kind: "sequence"}], nodes: {a: {name: "A"}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const s = await startServer(dir);
  t.after(s.close);
  assert.deepEqual(await (await call(s, "/api/draft")).json(), {version: 1, views: {}});
  const ops = [{id: "op1", op: "addNode", node: "new:1", name: "Redis", zone: "Cloud"}];
  const ev = nextEvent(s, "draft", () => post(s, "/api/draft", {view: "m", ops}));
  assert.deepEqual(await ev, {view: "m"});
  assert.deepEqual((await (await call(s, "/api/draft")).json()).views.m.ops, ops);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).nodes["new:1"], undefined, "plan.json untouched");
  assert.equal((await (await call(s, "/api/status")).json()).pending, 0);
  assert.equal((await post(s, "/api/draft", {view: "f", ops})).status, 400, "a sequence takes no draft");
  assert.equal((await post(s, "/api/draft", {view: "m", ops: [{id: "x", op: "addNode", node: "redis", name: "R", zone: "Cloud"}]})).status, 400);
  assert.equal((await post(s, "/api/draft", {view: "m", ops: []})).status, 200);
  assert.equal(fs.existsSync(path.join(dir, ".walkboard", "draft.json")), false, "an empty draft leaves no file");
});

test("a draft saved from an older version is refused with what is there now; other hosts are refused", async (t) => {
  const dir = planDir();
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({title: "t", views: [{id: "m", kind: "map", zones: [{label: "C", nodes: ["a"]}]}], nodes: {a: {name: "A"}}}));
  const s = await startServer(dir);
  t.after(s.close);
  const one = [{id: "o1", op: "remove", node: "a"}];
  const {rev} = await (await post(s, "/api/draft", {view: "m", ops: one, rev: 0})).json();
  assert.ok(rev > 0);
  const late = await post(s, "/api/draft", {view: "m", ops: [], rev: 0});
  assert.equal(late.status, 412);
  assert.deepEqual(await late.json(), {ops: one, rev});
  assert.equal((await post(s, "/api/draft", {view: "m", ops: [], rev})).status, 200);
  // Cleared (no file left): a page that still holds the old version must not write over what comes next.
  const fresh = (await (await post(s, "/api/draft", {view: "m", ops: [{id: "o2", op: "remove", node: "a"}], rev: 0})).json()).rev;
  assert.ok(fresh > rev);
  assert.equal((await post(s, "/api/draft", {view: "m", ops: one, rev})).status, 412);
  const evil = await new Promise((done) => http.get({host: "127.0.0.1", port: s.port, path: `/api/plan?token=${s.token}`, headers: {host: "evil.example:80"}}, (r) => done(r.statusCode)));
  assert.equal(evil, 403);
});
