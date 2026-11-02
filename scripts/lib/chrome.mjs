// Drives headless Chrome through the DevTools protocol (Node 22 has WebSocket built in).
import {spawn} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({width = 1200, height = 900, port = 9333, scale = 1} = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "planview-chrome-"));
  const proc = spawn(chromePath, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, `--window-size=${width},${height}`, "about:blank"], {stdio: "ignore"});
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const t = targets.find((x) => x.type === "page");
      if (t) {
        const page = await new Page(t.webSocketDebuggerUrl, proc).ready();
        await page.send("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: scale, mobile: false});
        return page;
      }
    } catch {}
    await sleep(100);
  }
  proc.kill();
  throw new Error("chrome did not start");
}

class Page {
  constructor(ws, proc) {
    this.proc = proc;
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
    const r = await this.send("Runtime.evaluate", {expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true});
    return r.result?.value;
  }
  async goto(url, wait = 1800) {
    await this.send("Page.navigate", {url});
    await sleep(wait);
  }
  async png(clip) {
    const r = await this.send("Page.captureScreenshot", {format: "png", ...(clip ? {captureBeyondViewport: true, clip: {...clip, scale: 1}} : {})});
    return Buffer.from(r.data, "base64");
  }
  close() {
    this.ws.close();
    this.proc.kill();
  }
}
