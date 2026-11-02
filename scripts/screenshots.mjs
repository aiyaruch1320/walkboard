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
const cli = path.join(repo, "skills/planview/bin/planview.mjs");
const out = path.join(repo, "docs/images");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();

// A copy of the build example with a short conversation, so the chat can be shown.
function demoPlan() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planview-demo-"));
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

async function shot(page, url, file, {select, pad = 12, prepare = ""}) {
  await page.goto(url);
  if (prepare) {
    await page.eval(prepare);
    await sleep(600);
  }
  const box = await page.eval(`
    const els = ${JSON.stringify(select)}.map((s) => document.querySelector(s)).filter(Boolean);
    const r = els.map((e) => e.getBoundingClientRect());
    const top = Math.min(...r.map((x) => x.top)) + scrollY, bottom = Math.max(...r.map((x) => x.bottom)) + scrollY;
    return {x: 0, y: Math.max(0, top - ${pad}), width: document.documentElement.clientWidth, height: bottom - top + ${pad * 2}};`);
  fs.writeFileSync(path.join(out, file), await page.png(box));
  console.log(`${file} ${box.width}x${Math.round(box.height)}`);
}

fs.mkdirSync(out, {recursive: true});
const demo = demoPlan();
const urls = {
  build: pv("open", path.join(repo, "examples/nightly-import"), "--no-browser"),
  explain: pv("open", path.join(repo, "examples/explain-login"), "--no-browser"),
  demo: pv("open", demo, "--no-browser"),
};
await post(urls.demo, "/api/feedback", {node: "cronjob", kind: "confused", text: "ทำไมต้อง suspend ไว้ก่อน"});
await post(urls.demo, "/api/reply", {node: "cronjob", from: "agent", text: "เพราะ Secret กับทางออกไป warehouse ยังไม่พร้อม ถ้าเปิดตอนนี้ Job จะล้มทุกคืน พอขั้น 4 เสร็จค่อยเลิก suspend ในขั้น 5"});
await post(urls.demo, "/api/feedback", {step: "manifests", kind: "teachback", text: "ขั้นนี้เขียน manifest ให้ ArgoCD สร้าง CronJob แบบพักไว้ก่อน พร้อม ConfigMap และ NetworkPolicy"});
await post(urls.demo, "/api/reply", {step: "manifests", from: "agent", text: "ถูกครับ ✓ เพิ่มอีกข้อ: NetworkPolicy ยังไม่เปิดทางไป warehouse ซึ่งจะทำในขั้น 4"});

const page = await launch();
try {
  const at = (u, q) => `${u}&theme=light&${q}`;
  await shot(page, at(urls.build, "step=manifests"), "build-overview.png", {select: ["#bar", "main > .top", "#stepcard", "#view"]});
  await shot(page, at(urls.build, "view=k8s&step=all"), "k8s.png", {select: ["#view"]});
  await shot(page, at(urls.explain, "view=seq&step=all"), "sequence.png", {select: ["#view"]});
  await shot(page, at(urls.build, "view=data&step=all"), "transform.png", {select: ["#view"]});
  await shot(page, at(urls.explain, "node=service"), "explain-code.png", {
    select: ["#panel"],
    prepare: `document.querySelector('#panel .talk')?.remove();`,
  });
  await shot(page, at(urls.explain, "step=verify"), "explain-overview.png", {select: ["#bar", "main > .top", "#badges", "#stepcard", "#view .lane"]});
  await shot(page, at(urls.demo, "step=manifests&node=cronjob"), "chat.png", {
    select: ["#panel"],
    prepare: `const t = document.querySelector('#panel .term'); t?.click();`,
  });
  await shot(page, at(urls.demo, "step=manifests"), "teachback.png", {
    select: ["#stepbar", "#stepcard"],
    prepare: `document.querySelector('#stepcard textarea').value = '';`,
  });
} finally {
  page.close();
  for (const u of Object.values(urls)) {
    const dir = u === urls.demo ? demo : u === urls.build ? path.join(repo, "examples/nightly-import") : path.join(repo, "examples/explain-login");
    pv("stop", dir);
  }
}
