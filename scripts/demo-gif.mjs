#!/usr/bin/env node
// Records docs/images/demo.gif: from typing in Claude Code to a confirmed step, with a cursor, clicks and zooms.
// The terminal is a plain mock-up; the planview page is real (a copy of examples/nightly-import).
// Needs Google Chrome and Node 22: node scripts/demo-gif.mjs   (DEMO_FRAMES=<dir> also keeps every frame as PNG)
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";
import {decodePng, encodeGif} from "./lib/gif.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/planview/bin/planview.mjs");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();
const W = 960, H = 600;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planview-gif-"));
const plan = JSON.parse(fs.readFileSync(path.join(repo, "examples/nightly-import/plan.json"), "utf8"));
plan.approved = true;
for (const s of plan.steps) if (s.id === "manifests") delete s.confirmed;
fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
const url = pv("open", dir, "--no-browser");
const {origin, searchParams} = new URL(url);
const api = (route, body) => fetch(`${origin}${route}?token=${searchParams.get("token")}`, body && {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
const listen = () => api("/api/poll").catch(() => {});
const terminalUrl = pathToFileURL(path.join(repo, "scripts/demo/terminal.html")).href;
const endUrl = pathToFileURL(path.join(repo, "scripts/demo/end.html")).href;
const shortUrl = `127.0.0.1:${new URL(url).port}/?token=…`;

const page = await launch({width: W, height: H});
const frames = [];
const graphemes = (t) => [...new Intl.Segmenter("th", {granularity: "grapheme"}).segment(t)].map((s) => s.segment);
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

// Cursor, click ripple, caption, camera and (on the plan page) a small browser bar, drawn above the page.
const OVERLAY = `
  if (!window.__ov) {
    const css = document.createElement("style");
    css.textContent = \`
      #ovCursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:24px;height:24px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
      #ovRipple{position:fixed;z-index:2147483646;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:3px solid #7f77dd;background:rgba(127,119,221,.2);display:none}
      #ovCap{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483645;background:#26215c;color:#fff;padding:8px 18px;border-radius:999px;font:500 15px -apple-system,"Noto Sans Thai",system-ui;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap;display:none}
      #ovChrome{position:fixed;left:0;right:0;top:0;height:40px;z-index:2147483644;background:#e8e6e0;display:flex;align-items:center;gap:8px;padding:0 14px;font:13px -apple-system,system-ui;color:#55534d;box-shadow:0 1px 0 #d4d2ca}
      #ovChrome i{width:11px;height:11px;border-radius:50%;display:inline-block}
      #ovChrome span{margin-left:14px;background:#fff;border-radius:7px;padding:3px 12px;min-width:320px}
    \`;
    document.documentElement.append(css);
    const c = document.createElement("div");
    c.id = "ovCursor";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.5 14 L17.5 14 Z" fill="#fff" stroke="#1f1e1c" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const r = document.createElement("div");
    r.id = "ovRipple";
    const cap = document.createElement("div");
    cap.id = "ovCap";
    document.documentElement.append(c, r, cap);
    window.__ov = {
      cursor(x, y, show = true) { c.style.display = show ? "block" : "none"; c.style.transform = "translate(" + (x - 4) + "px," + (y - 2) + "px)"; },
      ripple(x, y, on) { r.style.display = on ? "block" : "none"; r.style.left = x + "px"; r.style.top = y + "px"; },
      caption(t) { cap.style.display = t ? "block" : "none"; cap.textContent = t || ""; },
      camera(s, tx, ty) { const b = document.body; b.style.transformOrigin = "0 0"; b.style.transform = s === 1 && !tx && !ty ? "" : "translate(" + tx + "px," + ty + "px) scale(" + s + ")"; },
      chrome(text) {
        const ch = document.createElement("div");
        ch.id = "ovChrome";
        ch.innerHTML = '<i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span></span>';
        ch.querySelector("span").textContent = text;
        document.documentElement.append(ch);
        const fix = document.createElement("style");
        fix.textContent = "body{padding-top:40px}.bar{top:40px!important}";
        document.documentElement.append(fix);
      },
    };
  }`;

let cur = {x: W / 2, y: H / 2, shown: false};
let cam = {s: 1, tx: 0, ty: 0};

async function snap(delay) {
  const png = await page.png();
  if (process.env.DEMO_FRAMES) fs.writeFileSync(path.join(process.env.DEMO_FRAMES, `${String(frames.length).padStart(3, "0")}.png`), png);
  frames.push({...decodePng(png), delay});
}
const ov = (js) => page.eval(`${OVERLAY}; ${js}`);
const caption = (t) => ov(`__ov.caption(${JSON.stringify(t)})`);
const rect = (sel) => page.eval(`const r = document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r && {x: r.left, y: r.top, w: r.width, h: r.height};`);

async function goto(u, wait = 1800) {
  await page.goto(u, wait);
  cam = {s: 1, tx: 0, ty: 0};
  await ov(`__ov.cursor(${cur.x}, ${cur.y}, ${cur.shown})`);
}

async function moveTo(sel, {steps = 9, dx = 0.5, dy = 0.5} = {}) {
  const r = await rect(sel);
  if (!r) throw new Error(`not found: ${sel}`);
  const to = {x: r.x + r.w * dx, y: r.y + r.h * dy};
  const from = {...cur};
  cur.shown = true;
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    cur.x = from.x + (to.x - from.x) * k;
    cur.y = from.y + (to.y - from.y) * k;
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
    await snap(45);
  }
}

async function click(sel, {hold = 300} = {}) {
  await ov(`__ov.ripple(${cur.x}, ${cur.y}, true)`);
  await snap(110);
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).click();`);
  await sleep(350);
  await ov(`__ov.ripple(0, 0, false)`);
  await snap(hold);
}

// Pans and zooms so the element's centre lands in the middle of the screen at scale s.
// The camera transforms <body>, so work in document coordinates: screen = s * doc + t - scroll.
async function zoomTo(sel, s, {steps = 8, hold = 1200} = {}) {
  const r = await rect(sel);
  const {sx, sy} = await page.eval(`return {sx: scrollX, sy: scrollY};`);
  const cx = (r.x + r.w / 2 + sx - cam.tx) / cam.s, cy = (r.y + r.h / 2 + sy - cam.ty) / cam.s;
  await camera({...cam}, {s, tx: W / 2 + sx - s * cx, ty: H / 2 + sy - s * cy}, steps);
  await snap(hold);
}
async function zoomOut(steps = 7) {
  await camera({...cam}, {s: 1, tx: 0, ty: 0}, steps);
}
async function camera(from, to, steps) {
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    cam = {s: from.s + (to.s - from.s) * k, tx: from.tx + (to.tx - from.tx) * k, ty: from.ty + (to.ty - from.ty) * k};
    await ov(`__ov.camera(${cam.s}, ${cam.tx}, ${cam.ty})`);
    await snap(55);
  }
}

async function scrollTo(sel, offset = 70, steps = 7) {
  const target = await page.eval(`return Math.max(0, document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY - ${offset});`);
  const from = await page.eval(`return scrollY;`);
  for (let i = 1; i <= steps; i++) {
    await page.eval(`scrollTo(0, ${from + (target - from) * ease(i / steps)});`);
    await snap(50);
  }
}

async function typeInto(sel, text, per = 3) {
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).focus();`);
  const g = graphemes(text);
  for (let i = 0; i < g.length; i += per) {
    await page.send("Input.insertText", {text: g.slice(i, i + per).join("")});
    await snap(70);
  }
}

// Fades from the last frame into the next scene.
async function crossfade(load, steps = 3) {
  const last = frames.at(-1);
  await load();
  const next = decodePng(await page.png());
  for (let i = 1; i < steps; i++) {
    const t = i / steps, rgb = new Uint32Array(next.rgb.length);
    for (let j = 0; j < rgb.length; j++) {
      const a = last.rgb[j], b = next.rgb[j];
      const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t, g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t, bl = (a & 255) * (1 - t) + (b & 255) * t;
      rgb[j] = (r << 16) | (g << 8) | bl;
    }
    frames.push({width: W, height: H, rgb, delay: 70});
  }
}

const TERMINAL_LINES = [
  ['● planview <span class="muted">· โหมดวางแผน</span>', ""],
  ['? ทวนความเข้าใจทีละขั้นไหม  <span class="ok">› ใช่</span>', "ask"],
  ['? ให้ช่วย commit ไหม  <span class="ok">› แนะนำข้อความพอ</span>', "ask"],
  ['● อ่านโค้ด 14 ไฟล์ · เขียนแผน 5 ขั้น 4 ภาพ · <span class="ok">planview check ok</span>', ""],
  [`● เปิดหน้าแผน  <span class="link" id="planlink">http://${shortUrl}</span>`, ""],
  ['<span class="muted">  รอฟังจากหน้าแผน…</span>', ""],
];
const PROMPT = "/planview:planview วางแผน deploy CronJob นำเข้าลูกค้าขึ้น staging";

try {
  // Scene 1: the request, typed in Claude Code.
  await goto(terminalUrl, 600);
  await snap(700);
  await zoomTo(".win", 1.1, {steps: 6, hold: 150});
  const g = graphemes(PROMPT);
  for (let i = 0; i < g.length; i += 4) {
    await page.eval(`typeTo(${JSON.stringify(g.slice(0, i + 4).join(""))});`);
    await snap(60);
  }
  await snap(500);
  await zoomOut(6);
  for (const [html, cls] of TERMINAL_LINES) {
    await page.eval(`addLine(${JSON.stringify(html)}, ${JSON.stringify(cls)});`);
    await snap(380);
  }
  await caption("1 · สั่งใน Claude Code แล้ว agent วาดแผนให้เป็นหน้าเว็บ");
  await snap(1000);
  await moveTo("#planlink", {steps: 10, dx: 0.3});
  await ov(`__ov.ripple(${cur.x}, ${cur.y}, true)`);
  await snap(160);

  // Scene 2: the plan page.
  listen();
  await crossfade(async () => {
    await goto(`${url}&theme=light&step=manifests`, 2000);
    await ov(`__ov.chrome(${JSON.stringify(shortUrl)})`);
    await caption("2 · ขั้นตอนอยู่ข้างบน ภาพอยู่ข้างล่าง");
    cur = {x: 520, y: 300, shown: true};
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
  });
  await snap(1100);

  await caption("3 · เลือกขั้น ภาพพาไปส่วนที่เกี่ยวข้องเอง");
  await moveTo('.chip[data-step="secrets"]');
  await click('.chip[data-step="secrets"]', {hold: 200});
  await scrollTo("#tabs", 50);
  await snap(500);
  await zoomTo('#view [data-id="warehouse"]', 1.6, {hold: 1300});
  await zoomOut();

  await caption("4 · คลิกกล่อง: รับอะไร ได้อะไร ทำไม");
  await moveTo('#view [data-id="cronjob"]');
  await click('#view [data-id="cronjob"]', {hold: 200});
  await scrollTo("#panel", 50);
  await snap(900);

  await caption("5 · ถามได้บนกล่องนั้นเลย");
  await moveTo("#panel textarea", {dx: 0.2});
  await click("#panel textarea", {hold: 120});
  await typeInto("#panel textarea", "ทำไมต้อง suspend ไว้ก่อน");
  await moveTo("#panel .send button");
  await click("#panel .send button", {hold: 500});

  // Scene 3: the agent wakes in Claude Code and answers.
  await crossfade(async () => {
    await goto(terminalUrl, 500);
    cur.shown = false;
    await ov(`__ov.cursor(0, 0, false)`);
    await page.eval(`typeTo(${JSON.stringify(PROMPT)});`);
    for (const [html, cls] of TERMINAL_LINES.slice(0, 5)) await page.eval(`addLine(${JSON.stringify(html)}, ${JSON.stringify(cls)});`);
    await page.eval(`addLine('<span class="ask">◆ คำถามจากหน้าแผน · CronJob import</span>'); addLine('  “ทำไมต้อง suspend ไว้ก่อน”'); addLine('<span class="ok">● ตอบบนหน้าแผนแล้ว</span>');`);
    await caption("6 · คลิกของคุณปลุก agent แล้ว agent ตอบกลับ");
  });
  await snap(1700);
  await api("/api/reply", {node: "cronjob", from: "agent", text: "เพราะ Secret กับทางออกไป warehouse ยังไม่พร้อม เปิดตอนนี้ Job จะล้มทุกคืน จะเลิก suspend ในขั้นสุดท้าย"});
  listen();

  await crossfade(async () => {
    await goto(`${url}&theme=light&step=secrets&view=k8s&node=cronjob`, 2000);
    await ov(`__ov.chrome(${JSON.stringify(shortUrl)})`);
    await page.eval(`document.querySelector("#panel .msg.agent").scrollIntoView({block: "center"});`);
    cur = {x: 700, y: 420, shown: true};
    await ov(`__ov.cursor(${cur.x}, ${cur.y})`);
    await caption("7 · คำตอบขึ้นตรงที่ถาม");
  });
  await zoomTo("#panel .msg.agent", 1.4, {hold: 1700});
  await zoomOut();

  // Scene 4: the agent moves the plan on; the user restates the step.
  pv("set", dir, "step:manifests", "status=review", "node:cronjob", "status=done", "node:netpol", "status=done", "node:cm", "status=done");
  await sleep(1300);
  await scrollTo("main", 0, 6);
  await caption("8 · agent อัปเดตแผน: ขั้นนี้ถึงตาคุณทวน");
  await snap(700);
  await moveTo('.chip[data-step="manifests"]');
  await click('.chip[data-step="manifests"]', {hold: 600});
  await moveTo("#stepcard textarea", {dx: 0.2});
  await click("#stepcard textarea", {hold: 100});
  await typeInto("#stepcard textarea", "เขียน manifest ให้ CronJob พักไว้ก่อน รอ key", 4);
  await moveTo("#stepcard .send button");
  await click("#stepcard .send button", {hold: 300});
  await api("/api/reply", {step: "manifests", from: "agent", text: "ถูกครับ ✓"});
  listen();
  pv("set", dir, "step:manifests", "confirmed=true", "status=done");
  await sleep(1300);
  await caption("9 · agent ยืนยัน ✓ แล้วไปขั้นถัดไป");
  await zoomTo("#stepcard h3", 1.5, {hold: 1700});
  await zoomOut();

  await crossfade(async () => {
    await goto(endUrl, 700);
    await ov(`__ov.cursor(0, 0, false)`);
  }, 5);
  await snap(2600);
} finally {
  page.close();
  pv("stop", dir);
}

const gif = encodeGif(frames);
fs.writeFileSync(path.join(repo, "docs/images/demo.gif"), gif);
const seconds = frames.reduce((n, f) => n + f.delay, 0) / 1000;
console.log(`demo.gif ${W}x${H}, ${frames.length} frames, ${seconds.toFixed(1)} s, ${(gif.length / 1024).toFixed(0)} KB`);
