#!/usr/bin/env node
// Records docs/images/demo.gif: a short scripted session on a copy of examples/nightly-import.
// Needs Google Chrome and Node 22: node scripts/demo-gif.mjs
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";
import {decodePng, encodeGif} from "./lib/gif.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "skills/planview/bin/planview.mjs");
const pv = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: "utf8"}).trim();

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planview-gif-"));
const plan = JSON.parse(fs.readFileSync(path.join(repo, "examples/nightly-import/plan.json"), "utf8"));
plan.approved = true;
for (const s of plan.steps) if (s.id === "manifests") delete s.confirmed;
fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
const url = pv("open", dir, "--no-browser");
const {origin, searchParams} = new URL(url);
const api = (route, body) => fetch(`${origin}${route}?token=${searchParams.get("token")}`, body && {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
// Stands in for the agent's background poll, so the page shows "agent กำลังฟังอยู่".
const listen = () => api("/api/poll").catch(() => {});

const W = 1000, H = 620;
const page = await launch({width: W, height: H});
const frames = [];
async function frame(caption, delay) {
  await page.eval(`
    let c = document.getElementById("democap");
    if (!c) {
      c = document.createElement("div");
      c.id = "democap";
      c.style.cssText = "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99;background:#26215c;color:#fff;padding:8px 18px;border-radius:999px;font:500 15px -apple-system,'Noto Sans Thai',system-ui;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap";
      document.body.append(c);
    }
    c.textContent = ${JSON.stringify(caption)};`);
  await sleep(250);
  const png = await page.png();
  // DEMO_FRAMES=<dir> keeps each frame as a PNG for checking.
  if (process.env.DEMO_FRAMES) fs.writeFileSync(path.join(process.env.DEMO_FRAMES, `${String(frames.length).padStart(2, "0")}.png`), png);
  frames.push({...decodePng(png), delay});
}
const scrollTo = (sel, block = "start") => page.eval(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block: "${block}"}); scrollBy(0, ${block === "start" ? -56 : 0});`);
const type = async (sel, text, caption) => {
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).focus();`);
  const parts = [text.slice(0, Math.ceil(text.length / 2)), text.slice(Math.ceil(text.length / 2))];
  for (const part of parts) {
    await page.send("Input.insertText", {text: part});
    await frame(caption, 450);
  }
};

try {
  listen();
  await page.goto(`${url}&theme=light&step=manifests`, 2000);
  await frame("1 · แผนเป็นภาพ: เลือกขั้นแล้วเห็นว่าแตะกล่องไหนบ้าง", 2600);

  await page.eval(`document.querySelector('.chip[data-step="secrets"]').click();`);
  await scrollTo("#tabs");
  await frame("2 · เลือกขั้นอื่น ภาพเปลี่ยนไปที่ภาพที่มีกล่องของขั้นนั้นเอง", 2600);

  await page.eval(`document.querySelector('#view [data-id="cronjob"]').click();`);
  await sleep(400);
  await scrollTo("#panel");
  await frame("3 · คลิกกล่อง: รับอะไร ได้อะไร ทำไม", 2200);

  await page.eval(`document.querySelector('#panel .term')?.click();`);
  await frame("4 · คำที่มีเส้นประ แตะแล้วมีคำอธิบาย", 2000);
  await page.eval(`document.body.click();`);

  await scrollTo("#panel textarea", "center");
  await type("#panel textarea", "ทำไมต้อง suspend ไว้ก่อน", "5 · ถามได้บนกล่องนั้นเลย");
  await page.eval(`document.querySelector('#panel .send button').click();`);
  await sleep(500);
  await frame("5 · ถามได้บนกล่องนั้นเลย", 1200);

  await api("/api/reply", {node: "cronjob", from: "agent", text: "เพราะ Secret กับทางออกไป warehouse ยังไม่พร้อม เปิดตอนนี้ Job จะล้มทุกคืน จะเลิก suspend ในขั้นสุดท้าย"});
  listen();
  await sleep(700);
  await page.eval(`document.querySelector('#panel .msg.agent')?.scrollIntoView({block: "center"});`);
  await frame("6 · คลิกของคุณปลุก agent แล้ว agent ตอบบนหน้า", 2800);

  pv("set", dir, "step:manifests", "status=review", "node:cronjob", "status=done", "node:netpol", "status=done");
  await sleep(1200);
  await page.eval(`document.querySelector('.chip[data-step="manifests"]').click(); scrollTo(0, 0);`);
  await sleep(400);
  await frame("7 · agent อัปเดตแผน: หน้าเปลี่ยนเอง และขึ้นว่าถึงตาคุณ", 2600);

  await type("#stepcard textarea", "ขั้นนี้เขียน manifest ให้ ArgoCD สร้าง CronJob แบบพักไว้ก่อน", "8 · ทวนความเข้าใจด้วยคำพูดของคุณ");
  await page.eval(`document.querySelector('#stepcard .send button').click();`);
  await sleep(400);
  await api("/api/reply", {step: "manifests", from: "agent", text: "ถูกครับ ✓"});
  listen();
  pv("set", dir, "step:manifests", "confirmed=true", "status=done");
  await sleep(1300);
  await page.eval(`scrollTo(0, 0);`);
  await frame("8 · agent ยืนยัน ขั้นนี้ได้ ✓ แล้วไปขั้นถัดไป", 3400);
} finally {
  page.close();
  pv("stop", dir);
}

const gif = encodeGif(frames);
fs.writeFileSync(path.join(repo, "docs/images/demo.gif"), gif);
console.log(`demo.gif ${W}x${H}, ${frames.length} frames, ${(gif.length / 1024).toFixed(0)} KB`);
