import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {startServer} from "../skills/planview/lib/server.mjs";

function planDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planview-"));
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
  assert.equal((await (await call(first, "/api/poll")).json()).length, 1);
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
  const ev = await nextEvent(s, "delivered", () => call(s, "/api/poll"));
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
  fs.mkdirSync(path.join(dir, ".planview"));
  fs.writeFileSync(path.join(dir, ".planview", "feedback.jsonl"), '{"id":"1","text":"kept"}\n{"kind":"question","te\n');
  fs.writeFileSync(path.join(dir, ".planview", "session.json"), "{oops");
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
  assert.equal(fs.statSync(path.join(dir, ".planview", "session.json")).mode & 0o777, 0o600);
});

test("a lock left by a dead process is taken over", async (t) => {
  const dir = planDir();
  fs.mkdirSync(path.join(dir, ".planview"));
  fs.writeFileSync(path.join(dir, ".planview", "server.lock"), "999999");
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "planview-root-"));
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
  assert.equal((await post(s, "/api/settings", {weights: {cost: 3, nope: 2, bad: 9}})).status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")).criteria[0].weight, 3);
  const polled = call(s, "/api/poll").then((r) => r.json());
  await post(s, "/api/feedback", {kind: "question", text: "?"});
  const [first] = await polled;
  assert.deepEqual(first.weights, {cost: 3});
});
