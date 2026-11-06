import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {snapshot} from "../skills/walkboard/lib/export.mjs";
import {startServer} from "../skills/walkboard/lib/server.mjs";

function planDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-export-"));
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "src", "a.js"), "const secretFreeLine = 1;\nfunction send() {}\n");
  const plan = {title: "Export </script><script>alert(1)</script>", mode: "explain", root: ".",
    steps: [{id: "s", title: "S", nodes: ["a"]}],
    nodes: {a: {name: "A", file: "src/a.js:2", anchor: "function send("}}};
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  return {dir, plan};
}

const embedded = (html) => JSON.parse(html.match(/<script id="wb-snapshot" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test("a snapshot is one file with the plan and its code, and nothing of the server", async (t) => {
  const {dir, plan} = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  await fetch(`http://127.0.0.1:${s.port}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({node: "a", kind: "question", text: "why?"})});
  const {html, summary} = snapshot(dir, plan);
  assert.ok(!html.includes(s.token), "no token");
  assert.ok(!html.includes(`127.0.0.1:${s.port}`), "no address of the server");
  assert.ok(!html.includes(dir), "no path on this machine");
  assert.ok(!html.includes("</script><script>alert(1)"), "plan text cannot close a script tag");
  assert.doesNotMatch(html, /<link rel="stylesheet"|<script src=/);
  assert.match(html, /Content-Security-Policy[^>]*connect-src 'none'/);
  const data = embedded(html);
  assert.equal(data.plan.title, plan.title);
  assert.equal(data.sources.a.lines[data.sources.a.focus - data.sources.a.from], "function send() {}");
  assert.equal(data.thread.length, 0, "no chat unless asked");
  assert.deepEqual(summary.files, ["src/a.js"]);
});

test("code can be left out and the chat put in", async (t) => {
  const {dir, plan} = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  await fetch(`http://127.0.0.1:${s.port}/api/feedback?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({node: "a", kind: "question", text: "why?"})});
  const data = embedded(snapshot(dir, plan, {code: false, chat: true}).html);
  assert.deepEqual(data.sources, {});
  assert.equal(data.thread.length, 1);
  assert.equal(data.thread[0].text, "why?");
});

test("what was sketched goes along when asked for", () => {
  const {dir, plan} = planDir();
  const draft = {version: 1, views: {m: {rev: 5, ops: [{id: "o1", op: "addNode", node: "new:c", name: "Cache", zone: "Data"}]}, empty: {ops: []}}};
  const withIt = snapshot(dir, plan, {draft});
  assert.equal(withIt.summary.draft, 1);
  assert.deepEqual(embedded(withIt.html).draft, {version: 1, views: {m: {ops: draft.views.m.ops}}});
  const without = snapshot(dir, plan, {draft: null});
  assert.equal(without.summary.draft, 0);
  assert.equal(embedded(without.html).draft, undefined);
});

test("the page's Export button downloads the same file", async (t) => {
  const {dir} = planDir();
  const s = await startServer(dir);
  t.after(s.close);
  const r = await fetch(`http://127.0.0.1:${s.port}/api/export?code=0&token=${s.token}`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-disposition"), /^attachment; filename=/);
  const html = await r.text();
  assert.ok(!html.includes(s.token));
  assert.deepEqual(embedded(html).sources, {});
  assert.equal((await fetch(`http://127.0.0.1:${s.port}/api/export?token=nope`)).status, 403);
});

test("the file carries no path of this machine and no link to a local page", () => {
  const {dir, plan} = planDir();
  const shared = {...plan, roots: {api: "/Users/me/api"}, links: [{title: "page", url: "http://127.0.0.1:4100/?token=abc"}, {title: "pr", url: "https://github.com/o/r/pull/1"}, {title: "dev", url: "http://localhost:3000"}]};
  const data = embedded(snapshot(dir, shared).html);
  assert.equal(data.plan.root, undefined);
  assert.equal(data.plan.roots, undefined);
  assert.deepEqual(data.plan.links.map((l) => l.title), ["pr"]);
});
