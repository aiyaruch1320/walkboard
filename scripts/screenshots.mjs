#!/usr/bin/env node
// Regenerates the docs images from the examples: node scripts/screenshots.mjs
// They go to media/ (a worktree of the `media` branch, see docs/README.md), or to $WALKBOARD_MEDIA; never to main.
// Needs Google Chrome and Node 22 (built-in WebSocket). Starts and stops the example servers itself.
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/walkboard/bin/walkboard.mjs");
const out = process.env.WALKBOARD_MEDIA || path.join(repo, "media");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();

// A copy of the build example with a short conversation, so the chat can be shown.
function demoPlan() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-demo-"));
  const plan = JSON.parse(fs.readFileSync(path.join(repo, "examples/nightly-import/plan.json"), "utf8"));
  const st = plan.steps.find((s) => s.id === "manifests");
  st.status = "review";
  plan.approved = true;
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  return dir;
}

async function post(url, route, body) {
  const u = new URL(url);
  await fetch(`${u.origin}${route}?token=${u.searchParams.get("token")}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
}

// side: the shot is the side panel only (its own left and right edges), not the page's full width.
// height: a taller window, for a shot whose toolbar floats at the window's bottom.
async function shot(page, url, file, {select, pad = 8, prepare = "", side = false, height = 0}) {
  // A side panel fills the window's height: a shorter window keeps its shot compact.
  await page.send("Emulation.setDeviceMetricsOverride", {width: 1200, height: side ? 640 : 900, deviceScaleFactor: 1, mobile: false});
  if (height) await page.send("Emulation.setDeviceMetricsOverride", {width: 1200, height, deviceScaleFactor: 1, mobile: false});
  await page.goto(url);
  await sleep(500);
  // The chat bar floats over whatever the window ends on; a shot is about the picture.
  await page.eval(`document.getElementById("askbar").style.visibility = "hidden";`);
  if (prepare) {
    await page.eval(prepare);
    await sleep(600);
  }
  const box = await page.eval(`
    const els = ${JSON.stringify(select)}.map((s) => document.querySelector(s)).filter(Boolean);
    const r = els.map((e) => e.getBoundingClientRect());
    const top = Math.min(...r.map((x) => x.top)) + scrollY, bottom = Math.max(...r.map((x) => x.bottom)) + scrollY;
    const left = ${side} ? Math.min(...r.map((x) => x.left)) : 0, right = ${side} ? Math.max(...r.map((x) => x.right)) : document.documentElement.clientWidth;
    return {x: left, y: Math.max(0, top - ${pad}), width: right - left, height: bottom - top + ${pad * 2}};`);
  fs.mkdirSync(path.dirname(path.join(out, file)), {recursive: true});
  fs.writeFileSync(path.join(out, file), await page.png(box));
  console.log(`${file} ${box.width}x${Math.round(box.height)}`);
}

// A copy of the design example with a few changes sketched on its map, for the draft mode shot.
function draftPlan() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-draft-"));
  fs.copyFileSync(path.join(repo, "examples/connect-vpcs/plan.json"), path.join(dir, "plan.json"));
  fs.mkdirSync(path.join(dir, ".walkboard"), {recursive: true});
  fs.writeFileSync(path.join(dir, ".walkboard", "draft.json"), JSON.stringify({version: 1, views: {"v-peering": {rev: 1, ops: [
    {id: "o1", op: "addNode", node: "new:db", name: "RDS replica", icon: "aws:rds", zone: "VPC B"},
    {id: "o2", op: "addLink", from: "appa", to: "new:db", label: ":5432", state: "todo"},
    {id: "o3", op: "editLink", from: "pcx", to: "appb", label: "SG allows A on :443"},
  ]}}}));
  return dir;
}

fs.mkdirSync(out, {recursive: true});
const demo = demoPlan();
const drafted = draftPlan();
// As if an agent had waited on each page before: the status shows it listening, not "tell your agent".
const open = (d) => {
  fs.mkdirSync(path.join(d, ".walkboard"), {recursive: true});
  fs.writeFileSync(path.join(d, ".walkboard", "listens"), "screenshots");
  return pv("open", d, "--no-browser");
};
const urls = {
  build: open(path.join(repo, "examples/nightly-import")),
  explain: open(path.join(repo, "examples/explain-login")),
  demo: open(demo),
  draft: open(drafted),
  pictures: open(path.join(repo, "examples/pictures")),
  platforms: open(path.join(repo, "examples/platforms")),
};
await post(urls.demo, "/api/feedback", {node: "cronjob", kind: "confused", text: "Why keep it suspended for now?"});
await post(urls.demo, "/api/reply", {node: "cronjob", from: "agent", text: "The Secret and the route to BigQuery are not ready yet. If it ran now, the Job would fail every night, so it stays suspended until step 4 is done."});

await post(urls.draft, "/api/feedback", {kind: "review", view: "v-peering", text: "I sketched changes on this picture. Please review what they mean for the plan."});
await post(urls.draft, "/api/reply", {from: "agent", text: "You added a read replica in VPC B and opened a path to it.\n- **RDS replica**: [[node:appa]] reaches it over the peering, so VPC B's route table needs VPC A's range, and the security group must allow 5432 from it. Neither is in the plan yet.\n- **SG allows A on :443**: this narrows the rule to one port, so App A must only call App B on 443.\nPut these in the plan?"});

// The agent has read them: messages show as received, not waiting.
const u = new URL(urls.demo), q = `?token=${u.searchParams.get("token")}`;
const got = await (await fetch(`${u.origin}/api/poll${q}`)).json();
await post(urls.demo, "/api/ack", {ids: got.map((i) => i.id)});
const ud = new URL(urls.draft), qd = `?token=${ud.searchParams.get("token")}`;
const gotDraft = await (await fetch(`${ud.origin}/api/poll${qd}`)).json();
await post(urls.draft, "/api/ack", {ids: gotDraft.map((i) => i.id)});

const page = await launch();
// No first look over the shots.
await page.send("Page.enable");
await page.send("Page.addScriptToEvaluateOnNewDocument", {source: `try { localStorage.setItem("walkboard.seen", "1"); } catch {}`});
try {
  const at = (u, q) => `${u}&theme=dark&${q}`;
  await shot(page, at(urls.build, "step=manifests"), "build-overview.png", {select: ["#bar", "main > .top", "#stepcard", "#view"]});
  // One picture of each kind for docs/pictures, and one map per platform for docs/platforms.
  for (const v of JSON.parse(fs.readFileSync(path.join(repo, "examples/pictures/plan.json"), "utf8")).views) {
    if (v.id !== "before") await shot(page, at(urls.pictures, `view=${v.id}&step=all`), `pictures/${v.kind}.png`, {select: ["#view"]});
  }
  for (const v of JSON.parse(fs.readFileSync(path.join(repo, "examples/platforms/plan.json"), "utf8")).views) {
    await shot(page, at(urls.platforms, `view=${v.id}&step=all`), `platforms/${v.id}.png`, {select: ["#view"]});
  }
  await shot(page, at(urls.explain, "node=service"), "explain-code.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.querySelector('#panel .pb')?.remove(); document.querySelector('#panel .pa .fold')?.remove(); document.querySelector('#panel .pa').style.maxHeight = 'none';`,
  });
  await shot(page, at(urls.explain, "step=verify"), "explain-overview.png", {select: ["#bar", "main > .top", "#stepcard", "#view .lane"]});
  await shot(page, at(urls.demo, "step=manifests&node=cronjob"), "chat.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.querySelector('#panel .fold[data-fold="info"]').click(); setTimeout(() => (document.querySelector('#panel .thread').scrollTop = 0), 400);`,
  });
  // Draft mode: the toolbar at the bottom, the changes drawn on the map and listed beside it.
  await shot(page, at(urls.draft, "view=v-peering&step=all"), "draft.png", {
    select: ["#view", ".dtools", "#side .side-head", "#panel"],
    pad: 8,
    height: 1240,
    prepare: `document.querySelector('.lsketch').click(); await new Promise((r) => setTimeout(r, 300)); document.querySelector('.dtools .dcount').click();`,
  });
  await shot(page, at(urls.draft, "view=v-peering&step=all"), "review.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.getElementById('talks').click(); await new Promise((r) => setTimeout(r, 300)); document.querySelector('.rtalk').click(); await new Promise((r) => setTimeout(r, 300)); document.querySelector('.fresh')?.remove();`,
  });
} finally {
  page.close();
  for (const u of Object.values(urls)) {
    const dir = {[urls.demo]: demo, [urls.draft]: drafted, [urls.build]: "examples/nightly-import", [urls.explain]: "examples/explain-login", [urls.pictures]: "examples/pictures", [urls.platforms]: "examples/platforms"}[u];
    pv("stop", path.resolve(repo, dir));
  }
}
