import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {startServer} from "../lib/server.mjs";

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
  assert.deepEqual((await (await call(s, "/api/replies")).json()).map((r) => r.text), ["because"]);
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
