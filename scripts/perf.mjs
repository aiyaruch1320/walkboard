#!/usr/bin/env node
// How smoothly a big map redraws while a box and a zone are dragged: node scripts/perf.mjs [example] [--json]
// Needs Google Chrome and Node 22. Works on a copy of the example, so the repository is never changed.
// Budget (see CHANGELOG): a redraw p95 ≤ 16 ms; no frame longer than 33 ms.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {launch, sleep} from "./lib/chrome.mjs";
import {startServer} from "../skills/walkboard/lib/server.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv.slice(2).find((a) => !a.startsWith("--")) || "big-map";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-perf-"));
fs.copyFileSync(path.join(repo, "examples", name, "plan.json"), path.join(dir, "plan.json"));
const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
const view = plan.views.find((v) => v.kind === "map");

const server = await startServer(dir);
const page = await launch({width: 1440, height: 1000, port: 9334});
const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b), at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
  return {n: s.length, p50: +at(0.5).toFixed(1), p95: +at(0.95).toFixed(1), max: +(s.at(-1) ?? 0).toFixed(1)};
};
const mouse = (type, x, y) => page.send("Input.dispatchMouseEvent", {type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1});

// Press on the element, move in small steps the way a hand does (one event per frame), release.
async function drag(selector, dx, dy, steps = 90) {
  const r = await page.eval(`const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block: "center"}); await new Promise((r) => setTimeout(r, 300)); const b = e.getBoundingClientRect(); return {x: b.left + Math.min(30, b.width / 2), y: b.top + Math.min(12, b.height / 2)};`);
  await page.eval(`window.__wbPerf = []; window.__frames = []; window.__long = []; (function f(t) { window.__frames.push(t); if (window.__frames.length < 2000) requestAnimationFrame(f); })(performance.now()); new PerformanceObserver((l) => window.__long.push(...l.getEntries().map((e) => e.duration))).observe({type: "longtask"});`);
  await mouse("mousePressed", r.x, r.y);
  for (let i = 1; i <= steps; i++) {
    await mouse("mouseMoved", r.x + (dx * i) / steps, r.y + (dy * i) / steps);
    await sleep(16);
  }
  await mouse("mouseReleased", r.x + dx, r.y + dy);
  await sleep(400);
  const out = await page.eval(`const f = window.__frames, gaps = f.slice(1).map((t, i) => t - f[i]); window.__frames = null; return {draw: window.__wbPerf, gaps, long: window.__long};`);
  return {redraw: stats(out.draw), frame: stats(out.gaps), longTasks: out.long.length};
}

try {
  await page.goto(`${server.url}&view=${encodeURIComponent(view.id)}`, 2500);
  await page.eval(`document.querySelector(".tour button")?.click();`);
  const sizes = await page.eval(`return {boxes: document.querySelectorAll(".map [data-anchor]").length, lines: document.querySelectorAll(".map svg path").length};`);
  const box = await drag(`.map [data-anchor="${view.zones.flatMap(function all(z) { return [...(z.nodes || []), ...(z.zones || []).flatMap(all)]; })[6]}"]`, 260, 140);
  const zoneLabel = view.zones.find((z) => (z.zones || []).length)?.label;
  const zone = await drag(`.map .zone[data-zone="${zoneLabel}"] > .zhead`, 120, 60);
  const result = {example: name, ...sizes, box, zone};
  if (process.argv.includes("--json")) console.log(JSON.stringify(result));
  else {
    console.log(`${name}: ${sizes.boxes} boxes, ${sizes.lines} line paths`);
    for (const [k, r] of Object.entries({"drag a box": box, "drag a zone": zone}))
      console.log(`${k.padEnd(12)} redraw p50 ${r.redraw.p50} p95 ${r.redraw.p95} max ${r.redraw.max} ms (${r.redraw.n})   frame p95 ${r.frame.p95} max ${r.frame.max} ms   long tasks ${r.longTasks}`);
  }
} finally {
  page.close();
  await server.close();
  fs.rmSync(dir, {recursive: true, force: true});
}
