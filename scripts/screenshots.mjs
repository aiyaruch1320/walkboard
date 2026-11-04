#!/usr/bin/env node
// Regenerates docs/images from the examples: node scripts/screenshots.mjs
// Needs Google Chrome and Node 22 (built-in WebSocket). Starts and stops the example servers itself.
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/walkboard/bin/walkboard.mjs");
const out = path.join(repo, "docs/images");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();

// A copy of the build example with a short conversation, so the chat can be shown.
function demoPlan() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-demo-"));
  const plan = JSON.parse(fs.readFileSync(path.join(repo, "examples/nightly-import/plan.json"), "utf8"));
  const st = plan.steps.find((s) => s.id === "manifests");
  st.status = "review";
  delete st.confirmed;
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
async function shot(page, url, file, {select, pad = 12, prepare = "", side = false, height = 0}) {
  // A side panel fills the window's height: a shorter window keeps its shot compact.
  await page.send("Emulation.setDeviceMetricsOverride", {width: 1200, height: side ? 640 : 900, deviceScaleFactor: 1, mobile: false});
  if (height) await page.send("Emulation.setDeviceMetricsOverride", {width: 1200, height, deviceScaleFactor: 1, mobile: false});
  await page.goto(url);
  await sleep(500);
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
const urls = {
  build: pv("open", path.join(repo, "examples/nightly-import"), "--no-browser"),
  explain: pv("open", path.join(repo, "examples/explain-login"), "--no-browser"),
  demo: pv("open", demo, "--no-browser"),
  draft: pv("open", drafted, "--no-browser"),
};
await post(urls.demo, "/api/feedback", {node: "cronjob", kind: "confused", text: "Why keep it suspended for now?"});
await post(urls.demo, "/api/reply", {node: "cronjob", from: "agent", text: "The Secret and the route to BigQuery are not ready yet. If it ran now, the Job would fail every night, so it stays suspended until step 4 is done."});
await post(urls.demo, "/api/feedback", {step: "manifests", kind: "teachback", text: "This step writes manifests so ArgoCD creates the CronJob suspended, with its ConfigMap and NetworkPolicy."});
await post(urls.demo, "/api/reply", {step: "manifests", from: "agent", text: "Correct ✓ One more thing: the NetworkPolicy does not open the route to BigQuery yet; that comes in step 4."});

// The agent has read them: messages show as received, not waiting.
const u = new URL(urls.demo), q = `?token=${u.searchParams.get("token")}`;
const got = await (await fetch(`${u.origin}/api/poll${q}`)).json();
await post(urls.demo, "/api/ack", {ids: got.map((i) => i.id)});

const page = await launch();
// No first-visit tour over the shots.
await page.send("Page.enable");
await page.send("Page.addScriptToEvaluateOnNewDocument", {source: `try { localStorage.setItem("walkboard.tour", "done"); } catch {}`});
try {
  const at = (u, q) => `${u}&theme=dark&${q}`;
  await shot(page, at(urls.build, "step=manifests"), "build-overview.png", {select: ["#bar", "main > .top", "#stepcard", "#view"]});
  await shot(page, at(urls.build, "view=k8s&step=all"), "k8s.png", {select: ["#view"]});
  await shot(page, at(urls.explain, "view=seq&step=all"), "sequence.png", {select: ["#view"]});
  await shot(page, at(urls.build, "view=data&step=all"), "transform.png", {select: ["#view"]});
  await shot(page, at(urls.explain, "node=service"), "explain-code.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.querySelector('#panel .pb')?.remove(); document.querySelector('#panel .pa .fold')?.remove(); document.querySelector('#panel .pa').style.maxHeight = 'none';`,
  });
  await shot(page, at(urls.explain, "step=verify"), "explain-overview.png", {select: ["#bar", "main > .top", "#badges", "#stepcard", "#view .lane"]});
  await shot(page, at(urls.demo, "step=manifests&node=cronjob"), "chat.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.querySelector('#panel .fold[data-fold="info"]').click(); setTimeout(() => (document.querySelector('#panel .thread').scrollTop = 0), 400);`,
  });
  await shot(page, at(urls.demo, "step=manifests"), "teachback.png", {
    select: ["#side .side-head", "#panel"],
    side: true,
    pad: 0,
    prepare: `document.querySelector('#stepcard .turnbtn').click();`,
  });
  // Draft mode: the toolbar at the bottom, the changes drawn on the map and listed beside it.
  await shot(page, at(urls.draft, "view=v-peering&step=all"), "draft.png", {
    select: ["#view", ".dtools", "#side .side-head", "#panel"],
    pad: 8,
    height: 1240,
    prepare: `document.querySelector('.lsketch').click(); await new Promise((r) => setTimeout(r, 300)); document.querySelector('.dtools .dcount').click();`,
  });
} finally {
  page.close();
  for (const u of Object.values(urls)) {
    const dir = u === urls.demo ? demo : u === urls.draft ? drafted : u === urls.build ? path.join(repo, "examples/nightly-import") : path.join(repo, "examples/explain-login");
    pv("stop", dir);
  }
}
