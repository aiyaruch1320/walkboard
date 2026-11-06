#!/usr/bin/env node
// Drives a Walkboard page in headless Chrome with real mouse and keyboard events, for testing by hand or by an agent.
//   node scripts/drive.mjs <url> <actions.json | -> [--width 1440] [--height 1000] [--dark] [--port 9340]
// actions: a JSON list run in order; each is one of
//   {"wait": ms}                                  {"eval": "js returning a value"}      (printed)
//   {"click": "css selector" | [x, y]}            {"dblclick": "selector" | [x, y]}
//   {"drag": {"from": "selector" | [x, y], "to": "selector" | [x, y] | {"by": [dx, dy]}, "steps": 20, "hold": ms}}
//   {"type": "text"}                              {"key": "Enter" | "Escape" | "Delete" | "Tab" | "z", "mods": ["Meta", "Shift"]}
//   {"shot": "/path/file.png"}                    {"scroll": "selector"}
// A target can also be {"sel": "css selector", "at": [fx, fy]}: that point of the element, as fractions of its size.
// Prints one JSON line per eval and at the end {"errors": [...]} with the page's console errors and exceptions.
// Needs Google Chrome (CHROME=… for another Chromium) and Node 22.
import fs from "node:fs";
import {launch, sleep} from "./lib/chrome.mjs";

const args = process.argv.slice(2);
const opt = (name, d) => {
  const i = args.indexOf(name);
  return i < 0 ? d : args[i + 1];
};
const takes = new Set(["--width", "--height", "--port"]);
const [url, file] = args.filter((a, i) => !a.startsWith("--") && !takes.has(args[i - 1]));
if (!url || !file) {
  console.error("usage: node scripts/drive.mjs <url> <actions.json | -> [--width w] [--height h] [--dark] [--port p]");
  process.exit(2);
}
const actions = JSON.parse(file === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(file, "utf8"));
const width = +opt("--width", 1440), height = +opt("--height", 1000);
const page = await launch({width, height, port: +opt("--port", 9340)});
// No first look over this run, and no mark left in the home folder that it was seen.
await page.send("Page.enable");
await page.send("Page.addScriptToEvaluateOnNewDocument", {source: `try { localStorage.setItem("walkboard.seen", "1"); } catch {}`});
const errors = [];
await page.send("Runtime.enable");
await page.send("Log.enable");
page.ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
});
if (args.includes("--dark")) await page.send("Emulation.setEmulatedMedia", {features: [{name: "prefers-color-scheme", value: "dark"}]});

const point = async (target) => {
  if (Array.isArray(target)) return {x: target[0], y: target[1]};
  if (target?.sel) {
    const [fx, fy] = target.at || [0.5, 0.5];
    const r = await page.eval(`const e = document.querySelector(${JSON.stringify(target.sel)}); if (!e) return null; e.scrollIntoView({block: "nearest", inline: "nearest"}); await new Promise((r) => setTimeout(r, 150)); const b = e.getBoundingClientRect(); return {x: b.left + b.width * ${+fx}, y: b.top + b.height * ${+fy}};`);
    if (!r) throw new Error(`nothing matches ${target.sel}`);
    return r;
  }
  const r = await page.eval(`const e = document.querySelector(${JSON.stringify(target)}); if (!e) return null; e.scrollIntoView({block: "nearest", inline: "nearest"}); await new Promise((r) => setTimeout(r, 120)); const b = e.getBoundingClientRect(); return {x: b.left + Math.min(24, b.width / 2), y: b.top + Math.min(12, b.height / 2)};`);
  if (!r) throw new Error(`nothing matches ${target}`);
  return r;
};
const mouse = (type, {x, y}, extra = {}) => page.send("Input.dispatchMouseEvent", {type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1, ...extra});
const MOD = {Alt: 1, Control: 2, Meta: 4, Shift: 8};
const KEYS = {Enter: 13, Escape: 27, Delete: 46, Backspace: 8, Tab: 9, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40};

try {
  await page.goto(url, 2500);
  await page.eval(`document.querySelector(".tour button")?.click();`);
  for (const a of actions) {
    if (a.wait != null) await sleep(a.wait);
    else if (a.eval) console.log(JSON.stringify(await page.eval(a.eval.includes("return") ? a.eval : `return (${a.eval});`) ?? null));
    else if (a.click || a.dblclick) {
      const p = await point(a.click || a.dblclick);
      await page.send("Input.dispatchMouseEvent", {type: "mouseMoved", ...p});
      for (const n of a.dblclick ? [1, 2] : [1]) {
        await mouse("mousePressed", p, {clickCount: n});
        await mouse("mouseReleased", p, {clickCount: n});
      }
      await sleep(150);
    } else if (a.drag) {
      // The far end first: finding an element may scroll the page, and the start must be measured after that.
      const end = a.drag.to?.by ? null : await point(a.drag.to);
      const from = await point(a.drag.from);
      const to = end || {x: from.x + a.drag.to.by[0], y: from.y + a.drag.to.by[1]};
      const steps = a.drag.steps || 20;
      await page.send("Input.dispatchMouseEvent", {type: "mouseMoved", ...from});
      await mouse("mousePressed", from);
      for (let i = 1; i <= steps; i++) {
        await mouse("mouseMoved", {x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps});
        await sleep(16);
      }
      if (a.drag.hold) await sleep(a.drag.hold);
      if (a.drag.shotBeforeDrop) fs.writeFileSync(a.drag.shotBeforeDrop, await page.png());
      await mouse("mouseReleased", to);
      await sleep(300);
    } else if (a.type != null) await page.send("Input.insertText", {text: a.type});
    else if (a.key) {
      const modifiers = (a.mods || []).reduce((m, k) => m | (MOD[k] || 0), 0);
      const code = KEYS[a.key] ?? a.key.toUpperCase().charCodeAt(0);
      const base = {key: a.key, code: a.key.length === 1 ? "Key" + a.key.toUpperCase() : a.key, windowsVirtualKeyCode: code, modifiers};
      await page.send("Input.dispatchKeyEvent", {type: "keyDown", ...base, ...(a.key === "Enter" ? {text: "\r"} : {})});
      await page.send("Input.dispatchKeyEvent", {type: "keyUp", ...base});
      await sleep(120);
    } else if (a.scroll) await page.eval(`document.querySelector(${JSON.stringify(a.scroll)})?.scrollIntoView({block: "start"});`);
    else if (a.shot) fs.writeFileSync(a.shot, await page.png());
  }
} catch (e) {
  errors.push("drive: " + e.message);
} finally {
  console.log(JSON.stringify({errors}));
  page.close();
}
