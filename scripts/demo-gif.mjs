#!/usr/bin/env node
// Records docs/images/demo.gif: from typing /walkboard in Claude Code to a confirmed step.
// The terminal is a plain mock-up; the walkboard page is real (a copy of examples/nightly-import).
// Pages are captured at 2x and a camera crops and scales the captures, so zooming never touches the page layout.
// Needs Google Chrome and Node 22: node scripts/demo-gif.mjs   (DEMO_FRAMES=<dir> also writes every output frame as PNG)
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";
import {decodePng, encodeGif, encodePng, overlay, view} from "./lib/gif.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/walkboard/bin/walkboard.mjs");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();
const W = 960, H = 600, SCALE = 2;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-gif-"));
const plan = JSON.parse(fs.readFileSync(path.join(repo, "examples/nightly-import/plan.json"), "utf8"));
plan.approved = false;
for (const s of plan.steps) {
  s.status = "todo";
  delete s.confirmed;
}
fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
const url = pv("open", dir, "--no-browser");
const {origin, searchParams} = new URL(url);
const api = (route, body) => fetch(`${origin}${route}?token=${searchParams.get("token")}`, body && {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
// Like the agent's poll: take the batch and acknowledge it, so the page shows it as received.
const listen = () => api("/api/poll").then((r) => r.json()).then((items) => api("/api/ack", {ids: items.map((i) => i.id)})).catch(() => {});
const terminalUrl = pathToFileURL(path.join(repo, "scripts/demo/terminal.html")).href;
const endUrl = pathToFileURL(path.join(repo, "scripts/demo/end.html")).href;
const shortUrl = `127.0.0.1:${new URL(url).port}/?token=…`;
const PROMPT = "/walkboard plan deploying the nightly customer import CronJob to staging";

const page = await launch({width: W, height: H, scale: SCALE});
// The first-visit tour would cover the page in every scene.
await page.send("Page.enable");
await page.send("Page.addScriptToEvaluateOnNewDocument", {source: `try { localStorage.setItem("walkboard.tour", "done"); } catch {}`});
const frames = [];
const graphemes = (t) => [...new Intl.Segmenter("en", {granularity: "grapheme"}).segment(t)].map((s) => s.segment);
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

// Captions are drawn on the output frames, so they stay sharp and the same size while the camera zooms.
const captions = new Map();
async function renderCaptions(texts) {
  await page.send("Emulation.setDeviceMetricsOverride", {width: W, height: 120, deviceScaleFactor: 1, mobile: false});
  await page.send("Emulation.setDefaultBackgroundColorOverride", {color: {r: 0, g: 0, b: 0, a: 0}});
  await page.goto("about:blank", 200);
  for (const t of texts) {
    const box = await page.eval(`
      document.body.style.margin = "0";
      document.body.innerHTML = '<div id="c" style="display:inline-block;margin:12px;background:rgba(127,119,221,.96);color:#fff;padding:9px 20px;border-radius:999px;font:600 16px -apple-system,\\'Noto Sans Thai\\',system-ui;box-shadow:0 6px 18px rgba(0,0,0,.45);white-space:nowrap"></div>';
      const c = document.getElementById("c");
      c.textContent = ${JSON.stringify(t)};
      const r = c.getBoundingClientRect();
      return {x: r.left - 8, y: r.top - 6, width: r.width + 16, height: r.height + 16};`);
    captions.set(t, decodePng(await page.png(box)));
  }
  await page.send("Emulation.setDefaultBackgroundColorOverride", {});
  await page.send("Emulation.setDeviceMetricsOverride", {width: W, height: H, deviceScaleFactor: SCALE, mobile: false});
}

// Cursor, click ripple and (on the plan page) a small browser bar, drawn in the page.
const OVERLAY = `
  if (!window.__ov) {
    const css = document.createElement("style");
    css.textContent = \`
      #ovCursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:24px;height:24px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
      #ovRipple{position:fixed;z-index:2147483646;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:3px solid #afa9ec;background:rgba(175,169,236,.22);display:none}
      #ovChrome{position:fixed;left:0;right:0;top:0;height:40px;z-index:2147483644;background:#2b2a33;display:flex;align-items:center;gap:8px;padding:0 14px;font:13px -apple-system,system-ui;color:#c9c7d6;box-shadow:0 1px 0 #3d3c44}
      #ovChrome i{width:11px;height:11px;border-radius:50%;display:inline-block}
      #ovChrome span{margin-left:14px;background:#1c1b22;border-radius:7px;padding:3px 12px;min-width:320px}
    \`;
    document.documentElement.append(css);
    const c = document.createElement("div");
    c.id = "ovCursor";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.5 14 L17.5 14 Z" fill="#fff" stroke="#1f1e1c" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const r = document.createElement("div");
    r.id = "ovRipple";
    document.documentElement.append(c, r);
    window.__ov = {
      cursor(x, y, show = true) { c.style.display = show ? "block" : "none"; c.style.transform = "translate(" + (x - 4) + "px," + (y - 2) + "px)"; },
      ripple(x, y, on) { r.style.display = on ? "block" : "none"; r.style.left = x + "px"; r.style.top = y + "px"; },
      chrome(text) {
        const ch = document.createElement("div");
        ch.id = "ovChrome";
        ch.innerHTML = '<i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span></span>';
        ch.querySelector("span").textContent = text;
        document.documentElement.append(ch);
        const fix = document.createElement("style");
        fix.textContent = "body{padding-top:40px}.bar{top:40px!important}.side{top:40px!important;height:calc(100vh - 40px)!important}main{padding-bottom:320px}";
        document.documentElement.append(fix);
      },
    };
  }`;

let cur = {x: W / 2, y: H / 2, shown: false};
let cam = {s: 1, cx: W / 2, cy: H / 2};
let caption = null;

function shoot(src, delay) {
  const s = cam.s, w = (W * SCALE) / s, h = (H * SCALE) / s;
  const x = Math.min(Math.max(0, cam.cx * SCALE - w / 2), W * SCALE - w), y = Math.min(Math.max(0, cam.cy * SCALE - h / 2), H * SCALE - h);
  const out = view(src, {x, y, w, h}, W, H);
  const cap = caption && captions.get(caption);
  if (cap) overlay(out, cap, Math.round((W - cap.width) / 2), H - cap.height - 10);
  if (process.env.DEMO_FRAMES) fs.writeFileSync(path.join(process.env.DEMO_FRAMES, `${String(frames.length).padStart(3, "0")}.png`), encodePng(out));
  frames.push({...out, delay});
  return out;
}
let lastSrc = null;
async function snap(delay) {
  lastSrc = decodePng(await page.png());
  shoot(lastSrc, delay);
}
const ov = (js) => page.eval(`${OVERLAY}; ${js}`);
// One selector or several (their union). text: measure the text itself, not the full-width block around it.
const rect = (sel, text = false) => page.eval(`
  const rs = [].concat(${JSON.stringify(sel)}).map((q) => document.querySelector(q)).filter(Boolean).map((el) => {
    if (!${text}) return el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  });
  if (!rs.length) return null;
  const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top));
  return {x, y, w: Math.max(...rs.map((r) => r.right)) - x, h: Math.max(...rs.map((r) => r.bottom)) - y};`);

async function goto(u, wait = 1800) {
  await page.goto(u, wait);
  await ov(`__ov.cursor(${cur.x}, ${cur.y}, ${cur.shown})`);
}

async function moveTo(sel, {steps = 7, dx = 0.5, dy = 0.5} = {}) {
  const r = await rect(sel);
  if (!r) throw new Error(`not found: ${sel}`);
  const to = {x: r.x + r.w * dx, y: r.y + r.h * dy}, from = {...cur};
  cur.shown = true;
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    cur.x = from.x + (to.x - from.x) * k;
    cur.y = from.y + (to.y - from.y) * k;
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
    await snap(40);
  }
}

async function click(sel, {hold = 600} = {}) {
  await ov(`__ov.ripple(${cur.x}, ${cur.y}, true)`);
  await snap(140);
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).click();`);
  await sleep(400);
  await ov(`__ov.ripple(0, 0, false)`);
  await snap(hold);
}

// The camera only changes how the capture is cropped; the page stays as it is.
async function camera(to, steps = 7) {
  const from = {...cam};
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    cam = {s: from.s + (to.s - from.s) * k, cx: from.cx + (to.cx - from.cx) * k, cy: from.cy + (to.cy - from.cy) * k};
    shoot(lastSrc, 40);
  }
}
async function zoomTo(sel, s, hold = 2200, text = false) {
  const r = await rect(sel, text);
  await snap(80);
  await camera({s, cx: r.x + r.w / 2, cy: r.y + r.h / 2});
  frames.at(-1).delay = hold;
}
const zoomOut = () => camera({s: 1, cx: W / 2, cy: H / 2}, 6);

async function scrollTo(sel, offset = 70, steps = 5) {
  const target = await page.eval(`return Math.max(0, document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY - ${offset});`);
  const from = await page.eval(`return scrollY;`);
  for (let i = 1; i <= steps; i++) {
    await page.eval(`scrollTo(0, ${from + (target - from) * ease(i / steps)});`);
    await snap(45);
  }
}

async function typeInto(sel, text, per = 5) {
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).focus();`);
  const g = graphemes(text);
  for (let i = 0; i < g.length; i += per) {
    await page.send("Input.insertText", {text: g.slice(i, i + per).join("")});
    await snap(90);
  }
}

async function crossfade(load, steps = 4) {
  const last = frames.at(-1);
  await load();
  lastSrc = decodePng(await page.png());
  const saved = cam;
  cam = {s: 1, cx: W / 2, cy: H / 2};
  const next = view(lastSrc, {x: 0, y: 0, w: W * SCALE, h: H * SCALE}, W, H);
  const cap = caption && captions.get(caption);
  if (cap) overlay(next, cap, Math.round((W - cap.width) / 2), H - cap.height - 10);
  for (let i = 1; i < steps; i++) {
    const t = ease(i / steps), rgb = new Uint32Array(W * H);
    for (let j = 0; j < rgb.length; j++) {
      const a = last.rgb[j], b = next.rgb[j];
      rgb[j] = (Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t) << 16) | (Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t) << 8) | Math.round((a & 255) * (1 - t) + (b & 255) * t);
    }
    frames.push({width: W, height: H, rgb, delay: 60});
  }
  void saved;
}

const TERMINAL_LINES = [
  ['● walkboard <span class="muted">· build mode</span>', ""],
  ['? Commit for you?  <span class="ok">› Suggest messages only</span>', "ask"],
  ['● Read 14 files · wrote a plan: 5 steps, 4 pictures · <span class="ok">walkboard check ok</span>', ""],
  [`● Plan page  <span class="link" id="planlink">http://${shortUrl}</span>`, ""],
  ['<span class="muted">  Listening to the plan page…</span>', ""],
];
const CAPTIONS = [
  "Type /walkboard and describe the task",
  "The agent asks one question, writes the plan and opens it as a page",
  "Review the plan first: steps on top, the picture of the work below",
  "When it looks right, approve the plan. Only then does the agent start",
  "Pick any step: the page shows the picture it belongs to",
  "Click a box: what goes in, what comes out, and why",
  "Ask about a box right where it is",
  "Your message wakes the agent in Claude Code",
  "The answer appears where you asked",
  "Step finished: your turn to restate it in your own words",
  "Restated correctly: the agent confirms ✓ and moves on",
  "Restating and commits are switches on the page",
  "Dots show the agent is working on your message",
  "Share it: one HTML file that opens anywhere, or a PDF",
];
// Clears the fake browser bar and the sticky status bar when scrolling to something.
const TOP = 100;

try {
  await renderCaptions(CAPTIONS);

  // Scene 1: the request, typed in Claude Code.
  await goto(terminalUrl, 700);
  caption = CAPTIONS[0];
  await snap(900);
  await camera({s: 1.1, cx: W / 2, cy: 210});
  const g = graphemes(PROMPT);
  for (let i = 0; i < g.length; i += 6) {
    await page.eval(`typeTo(${JSON.stringify(g.slice(0, i + 6).join(""))});`);
    await snap(70);
  }
  await snap(700);
  await zoomOut();
  caption = CAPTIONS[1];
  for (const [html, cls] of TERMINAL_LINES) {
    await page.eval(`addLine(${JSON.stringify(html)}, ${JSON.stringify(cls)});`);
    await snap(560);
  }
  await snap(1800);
  await moveTo("#planlink", {dx: 0.3});
  await ov(`__ov.ripple(${cur.x}, ${cur.y}, true)`);
  await snap(300);

  // Scene 2: review the plan, then approve it.
  listen();
  caption = CAPTIONS[2];
  await crossfade(async () => {
    await goto(`${url}&theme=dark&step=all`, 2000);
    await ov(`__ov.chrome(${JSON.stringify(shortUrl)})`);
    cur = {x: 520, y: 330, shown: true};
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
  });
  await snap(2300);
  caption = CAPTIONS[11];
  await moveTo(".settings .switch");
  await zoomTo(".settings", 1.5, 2600);
  await zoomOut();
  caption = CAPTIONS[3];
  await snap(600);
  await moveTo("#barExtra button.primary");
  await zoomTo("#barExtra button.primary", 1.6, 1200);
  await zoomOut();
  await click("#barExtra button.primary", {hold: 500});
  listen();
  pv("set", dir, "approved=true", "step:image", "status=done", "step:trigger", "status=done", "step:manifests", "status=doing");
  await sleep(1300);
  await snap(2100);

  // Scene 3: look ahead at another step, open a box and ask about it in the side panel.
  caption = CAPTIONS[4];
  await moveTo('.chip[data-step="secrets"]');
  await click('.chip[data-step="secrets"]', {hold: 400});
  await scrollTo("#tabs", TOP - 40);
  await snap(900);
  await zoomTo(['#view [data-id="secret"]', '#view [data-id="wkey"]', '#view [data-id="cronjob"]'], 1.45, 2000);
  await zoomOut();

  caption = CAPTIONS[5];
  await moveTo('#view [data-id="cronjob"]');
  await click('#view [data-id="cronjob"]', {hold: 700});
  await snap(2500);

  caption = CAPTIONS[6];
  await moveTo("#panel textarea", {dx: 0.2});
  await click("#panel textarea", {hold: 200});
  await typeInto("#panel textarea", "Why keep it suspended for now?");
  await snap(500);
  await moveTo("#panel .send button.primary");
  await click("#panel .send button.primary", {hold: 200});
  caption = CAPTIONS[12];
  await sleep(500);
  await snap(2400);

  // Scene 4: the agent wakes in Claude Code and answers on the page.
  caption = CAPTIONS[7];
  await crossfade(async () => {
    await goto(terminalUrl, 500);
    cur.shown = false;
    await ov(`__ov.cursor(0, 0, false)`);
    await page.eval(`typeTo(${JSON.stringify(PROMPT)});`);
    for (const [html, cls] of TERMINAL_LINES.slice(0, 5)) await page.eval(`addLine(${JSON.stringify(html)}, ${JSON.stringify(cls)});`);
    await page.eval(`addLine('<span class="ask">◆ Question from the plan page · CronJob import</span>'); addLine('  “Why keep it suspended for now?”'); addLine('<span class="ok">● Answered on the plan page</span>');`);
  });
  await snap(2500);
  await api("/api/reply", {node: "cronjob", from: "agent", text: "The Secret and the route to BigQuery are not ready yet. If it ran now, the Job would fail every night."});
  listen();

  caption = CAPTIONS[8];
  await crossfade(async () => {
    await goto(`${url}&theme=dark&step=secrets&view=k8s&node=cronjob`, 2000);
    await ov(`__ov.chrome(${JSON.stringify(shortUrl)})`);
    await scrollTo("#tabs", TOP - 40, 1);
    cur = {x: 760, y: 470, shown: true};
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
  });
  await moveTo('#panel .fold[data-fold="info"]', {dx: 0.2});
  await click('#panel .fold[data-fold="info"]', {hold: 500});
  await moveTo("#panel .msg.agent", {dx: 0.15, dy: 0.7});
  await zoomTo("#panel .msg.agent", 1.5, 2600);
  await zoomOut();

  // Scene 5: the step is ready; the user restates it and the agent confirms.
  pv("set", dir, "step:manifests", "status=review", "node:cronjob", "status=done", "node:netpol", "status=done", "node:cm", "status=done");
  await sleep(1300);
  caption = CAPTIONS[9];
  await scrollTo("main", 40);
  await snap(900);
  await moveTo('.chip[data-step="manifests"]');
  await click('.chip[data-step="manifests"]', {hold: 400});
  await moveTo("#stepcard .turnbtn");
  await click("#stepcard .turnbtn", {hold: 900});
  await moveTo("#panel textarea", {dx: 0.2});
  await click("#panel textarea", {hold: 200});
  await typeInto("#panel textarea", "Manifests create the CronJob suspended until the keys exist", 7);
  await snap(400);
  await moveTo("#panel .send button.primary");
  await click("#panel .send button.primary", {hold: 300});
  await sleep(500);
  await snap(1500);
  await api("/api/reply", {step: "manifests", from: "agent", text: "Correct ✓ Next step: add the BigQuery and API keys"});
  listen();
  pv("set", dir, "step:manifests", "confirmed=true", "status=done", "step:secrets", "status=doing");
  await sleep(1300);
  caption = CAPTIONS[10];
  await snap(2600);

  // Scene 6: the ⋮ menu exports the plan to send to someone else.
  caption = CAPTIONS[13];
  await page.eval(`document.getElementById("sideClose").click();`);
  await sleep(400);
  await scrollTo("main", 40, 4);
  await moveTo("#more");
  await click("#more", {hold: 500});
  await moveTo(".menucard .mitem");
  await click(".menucard .mitem", {hold: 400});
  await zoomTo(".toast", 1.5, 2800);
  await zoomOut();

  caption = null;
  await crossfade(async () => {
    await goto(endUrl, 800);
    await ov(`__ov.cursor(0, 0, false)`);
  }, 5);
  await snap(3300);
} finally {
  page.close();
  pv("stop", dir);
}

const gif = encodeGif(frames);
fs.writeFileSync(path.join(repo, "docs/images/demo.gif"), gif);
const seconds = frames.reduce((n, f) => n + f.delay, 0) / 1000;
console.log(`demo.gif ${W}x${H}, ${frames.length} frames, ${seconds.toFixed(1)} s, ${(gif.length / 1024).toFixed(0)} KB`);
