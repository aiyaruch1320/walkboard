#!/usr/bin/env node
// Regenerates docs/images from the examples: node scripts/screenshots.mjs
// Needs Google Chrome and Node 22 (built-in WebSocket). Starts and stops the example servers itself.
import {spawn, execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/planview/bin/planview.mjs");
const out = path.join(repo, "docs/images");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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

class Page {
  static async open(port) {
    for (let i = 0; i < 50; i++) {
      try {
        const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
        const page = targets.find((t) => t.type === "page");
        if (page) return new Page(page.webSocketDebuggerUrl).ready();
      } catch {}
      await sleep(100);
    }
    throw new Error("chrome did not start");
  }
  constructor(ws) {
    this.id = 0;
    this.waiting = new Map();
    this.ws = new WebSocket(ws);
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (this.waiting.has(m.id)) {
        this.waiting.get(m.id)(m);
        this.waiting.delete(m.id);
      }
    };
  }
  ready() {
    return new Promise((r) => (this.ws.onopen = () => r(this)));
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({id, method, params}));
    return new Promise((r) => this.waiting.set(id, (m) => r(m.result)));
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", {expression: expr, awaitPromise: true, returnByValue: true});
    return r.result.value;
  }
  async shot(url, file, {select, pad = 12, prepare = ""}) {
    await this.send("Page.navigate", {url});
    await sleep(1800);
    if (prepare) {
      await this.eval(`(async () => { ${prepare} })()`);
      await sleep(600);
    }
    const box = await this.eval(`(() => {
      const els = ${JSON.stringify(select)}.map((s) => document.querySelector(s)).filter(Boolean);
      const r = els.map((e) => e.getBoundingClientRect());
      const top = Math.min(...r.map((x) => x.top)) + scrollY, bottom = Math.max(...r.map((x) => x.bottom)) + scrollY;
      return {x: 0, y: Math.max(0, top - ${pad}), width: document.documentElement.clientWidth, height: bottom - top + ${pad * 2}};
    })()`);
    const r = await this.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, clip: {...box, scale: 1}});
    fs.writeFileSync(path.join(out, file), Buffer.from(r.data, "base64"));
    console.log(`${file} ${box.width}x${Math.round(box.height)}`);
  }
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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "planview-chrome-"));
const port = 9333;
const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, "--window-size=1200,900", "about:blank"], {stdio: "ignore"});
try {
  const page = await Page.open(port);
  await page.send("Emulation.setDeviceMetricsOverride", {width: 1200, height: 900, deviceScaleFactor: 1, mobile: false});
  const at = (u, q) => `${u}&theme=light&${q}`;
  await page.shot(at(urls.build, "step=manifests"), "build-overview.png", {select: ["#bar", "main > .top", "#stepcard", "#view"]});
  await page.shot(at(urls.build, "view=k8s&step=all"), "k8s.png", {select: ["#view"]});
  await page.shot(at(urls.explain, "view=seq&step=all"), "sequence.png", {select: ["#view"]});
  await page.shot(at(urls.build, "view=data&step=all"), "transform.png", {select: ["#view"]});
  await page.shot(at(urls.explain, "node=service"), "explain-code.png", {
    select: ["#panel"],
    prepare: `document.querySelector('#panel .talk')?.remove();`,
  });
  await page.shot(at(urls.explain, "step=verify"), "explain-overview.png", {select: ["#bar", "main > .top", "#badges", "#stepcard", "#view .lane"]});
  await page.shot(at(urls.demo, "step=manifests&node=cronjob"), "chat.png", {
    select: ["#panel"],
    prepare: `const t = document.querySelector('#panel .term'); t?.click();`,
  });
  await page.shot(at(urls.demo, "step=manifests"), "teachback.png", {
    select: ["#stepbar", "#stepcard"],
    prepare: `document.querySelector('#stepcard textarea').value = '';`,
  });
} finally {
  browser.kill();
  for (const u of Object.values(urls)) {
    const dir = u === urls.demo ? demo : u === urls.build ? path.join(repo, "examples/nightly-import") : path.join(repo, "examples/explain-login");
    pv("stop", dir);
  }
}
