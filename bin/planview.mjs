#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [cmd, dirArg = "."] = process.argv.slice(2);
const dir = path.resolve(dirArg);
const stateDir = path.join(dir, ".planview");
const serverFile = path.join(stateDir, "server.json");
const queueFile = path.join(stateDir, "feedback.jsonl");

const page = `<!doctype html><meta charset="utf-8"><title>planview spike</title>
<body style="font-family:system-ui;padding:24px">
<h1>planview spike</h1>
<button id="b" style="font-size:18px;padding:12px 20px">ยังงง (node: demo)</button>
<p id="s"></p>
<script>
const token = new URLSearchParams(location.search).get("token");
document.getElementById("b").onclick = async () => {
  const r = await fetch("/api/feedback?token=" + token, {method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({node: "demo", kind: "confused", text: "ยังงงตรงนี้"})});
  document.getElementById("s").textContent = r.ok ? "ส่งแล้ว" : "ส่งไม่สำเร็จ " + r.status;
};
</script>`;

function serve() {
  const token = crypto.randomBytes(16).toString("hex");
  const queue = [];
  const waiters = [];
  const flush = () => {
    while (queue.length && waiters.length) waiters.shift()(queue.splice(0));
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.searchParams.get("token") !== token) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, {"content-type": "text/html; charset=utf-8"}).end(page);
    } else if (req.method === "POST" && url.pathname === "/api/feedback") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const item = {...JSON.parse(body), at: new Date().toISOString()};
        fs.appendFileSync(queueFile, JSON.stringify(item) + "\n");
        queue.push(item);
        flush();
        res.writeHead(204).end();
      });
    } else if (req.method === "GET" && url.pathname === "/api/poll") {
      const send = (items) => {
        clearTimeout(timer);
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify(items));
      };
      const drop = () => {
        const i = waiters.indexOf(send);
        if (i >= 0) waiters.splice(i, 1);
      };
      // Answer before Node's 300 s fetch headers timeout; the client polls again.
      const timer = setTimeout(() => {
        drop();
        send([]);
      }, Number(process.env.PLANVIEW_POLL_MS) || 240_000);
      res.on("close", drop);
      waiters.push(send);
      flush();
    } else {
      res.writeHead(404).end();
    }
  });
  server.listen(0, "127.0.0.1", () => {
    const {port} = server.address();
    fs.mkdirSync(stateDir, {recursive: true});
    fs.writeFileSync(serverFile, JSON.stringify({port, token}));
    console.log(`http://127.0.0.1:${port}/?token=${token}`);
  });
}

async function poll() {
  const {port, token} = JSON.parse(fs.readFileSync(serverFile, "utf8"));
  for (;;) {
    const r = await fetch(`http://127.0.0.1:${port}/api/poll?token=${token}`);
    const items = await r.json();
    if (items.length) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }
  }
}

if (cmd === "serve") serve();
else if (cmd === "poll") await poll();
else {
  console.error("usage: planview serve|poll [dir]");
  process.exit(2);
}
