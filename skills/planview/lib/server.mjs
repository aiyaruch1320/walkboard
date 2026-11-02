import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {excerpt} from "./source.mjs";

export const paths = (dir) => {
  const state = path.join(dir, ".planview");
  return {
    plan: path.join(dir, "plan.json"),
    state,
    server: path.join(state, "server.json"),
    session: path.join(state, "session.json"),
    feedback: path.join(state, "feedback.jsonl"),
    delivered: path.join(state, "delivered"),
    replies: path.join(state, "replies.jsonl"),
    lock: path.join(state, "server.lock"),
  };
};

const viewerFile = new URL("../assets/viewer.html", import.meta.url);
const schemaFile = new URL("./schema.mjs", import.meta.url);
const MAX_BODY = 64 * 1024;

// A torn or hand-edited line must not keep the server from starting.
function readLines(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      console.error(`planview: skipped an unreadable line in ${file}`);
    }
  }
  return out;
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};

function takeLock(file) {
  for (let i = 0; i < 2; i++) {
    try {
      fs.writeSync(fs.openSync(file, "wx", 0o600), String(process.pid));
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const holder = Number(fs.readFileSync(file, "utf8"));
      if (holder && alive(holder)) throw Object.assign(new Error(`already running (pid ${holder})`), {code: "PLANVIEW_RUNNING"});
      fs.rmSync(file, {force: true});
    }
  }
  throw new Error(`cannot lock ${file}`);
}

export function startServer(dir, {pollMs = 240_000, port = 0} = {}) {
  const p = paths(dir);
  fs.mkdirSync(p.state, {recursive: true, mode: 0o700});
  takeLock(p.lock);
  // Same port and token after a restart, so an open page reconnects by itself.
  const session = readJSON(p.session);
  const token = session.token ?? crypto.randomBytes(16).toString("hex");

  // Feedback survives restarts: everything after the delivered count is still pending.
  const all = readLines(p.feedback);
  let delivered = Math.min(Number(fs.existsSync(p.delivered) ? fs.readFileSync(p.delivered, "utf8") : 0) || 0, all.length);
  const pending = all.slice(delivered);
  const waiters = [];
  const polls = new Set();
  const streams = new Set();

  const broadcast = (event, data) => {
    for (const s of streams) s.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const agentState = () => broadcast("agent", {waiting: waiters.length});
  const flush = () => {
    while (pending.length && waiters.length) {
      const items = pending.splice(0);
      delivered += items.length;
      fs.writeFileSync(p.delivered, String(delivered));
      waiters.shift()(items);
      broadcast("delivered", {ids: items.map((i) => i.id)});
      agentState();
    }
  };

  const readBody = (req, cb) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size <= MAX_BODY) chunks.push(c);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return cb(Object.assign(new Error("too large"), {status: 413}));
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object");
        cb(null, v);
      } catch (e) {
        cb(e);
      }
    });
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.searchParams.get("token") !== token) return res.writeHead(403).end();
    const route = `${req.method} ${url.pathname}`;

    if (route === "GET /") {
      res.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(viewerFile));
    } else if (route === "GET /schema.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(schemaFile));
    } else if (route === "GET /api/plan") {
      if (!fs.existsSync(p.plan)) return res.writeHead(404, {"content-type": "text/plain; charset=utf-8"}).end(`no plan.json in ${dir}`);
      res.writeHead(200, {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(p.plan));
    } else if (route === "GET /api/source") {
      const plan = readJSON(p.plan);
      const node = plan.nodes && Object.hasOwn(plan.nodes, url.searchParams.get("node") || "") ? plan.nodes[url.searchParams.get("node")] : null;
      const r = node?.file ? excerpt(plan, node.file) : {error: "no file"};
      res.writeHead(r.error ? 404 : 200, {"content-type": "application/json; charset=utf-8"}).end(JSON.stringify(r));
    } else if (route === "GET /api/thread") {
      const feedback = readLines(p.feedback).map((f, i) => ({...f, from: "user", delivered: i < delivered}));
      const replies = readLines(p.replies);
      res.writeHead(200, {"content-type": "application/json; charset=utf-8"}).end(JSON.stringify({items: [...feedback, ...replies], waiting: waiters.length}));
    } else if (route === "GET /api/events") {
      res.writeHead(200, {"content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive"});
      res.write("retry: 2000\n\n");
      streams.add(res);
      res.on("close", () => streams.delete(res));
    } else if (route === "POST /api/feedback" || route === "POST /api/reply") {
      readBody(req, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        if (err || typeof v.text !== "string" || !v.text.trim()) return res.writeHead(400).end("need a JSON object with text");
        const item = {...v, id: crypto.randomUUID(), at: new Date().toISOString()};
        if (route === "POST /api/reply") {
          fs.appendFileSync(p.replies, JSON.stringify(item) + "\n");
          broadcast("reply", item);
        } else {
          fs.appendFileSync(p.feedback, JSON.stringify(item) + "\n");
          pending.push(item);
          broadcast("feedback", item);
          flush();
        }
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify(item));
      });
    } else if (route === "GET /api/poll") {
      let timer;
      const send = (items) => {
        clearTimeout(timer);
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify(items));
      };
      const drop = () => {
        clearTimeout(timer);
        const i = waiters.indexOf(send);
        if (i >= 0) {
          waiters.splice(i, 1);
          agentState();
        }
      };
      // Answer before Node's 300 s fetch headers timeout; the client polls again.
      timer = setTimeout(() => {
        drop();
        send([]);
      }, pollMs);
      res.on("close", drop);
      polls.add(res);
      res.on("close", () => polls.delete(res));
      waiters.push(send);
      agentState();
      flush();
    } else if (route === "GET /api/status") {
      res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({pid: process.pid, pending: pending.length, waiting: waiters.length, viewers: streams.size}));
    } else {
      res.writeHead(404).end();
    }
  });

  const heartbeat = setInterval(() => {
    for (const s of streams) s.write(": keep-alive\n\n");
  }, 25_000);

  let last = fs.existsSync(p.plan) ? fs.statSync(p.plan).mtimeMs : 0;
  fs.watchFile(p.plan, {interval: 300}, (cur) => {
    if (cur.mtimeMs !== last) {
      last = cur.mtimeMs;
      broadcast("plan", {at: new Date().toISOString()});
    }
  });

  return new Promise((resolve, reject) => {
    const preferred = port || session.port || 0;
    server.once("error", (e) => {
      if (e.code !== "EADDRINUSE" || !preferred) {
        clearInterval(heartbeat);
        fs.unwatchFile(p.plan);
        fs.rmSync(p.lock, {force: true});
        return reject(e);
      }
      server.listen(0, "127.0.0.1");
    });
    server.listen(preferred, "127.0.0.1");
    server.once("listening", () => {
      const info = {port: server.address().port, token, pid: process.pid, dir};
      fs.writeFileSync(p.server, JSON.stringify(info), {mode: 0o600});
      fs.writeFileSync(p.session, JSON.stringify({port: info.port, token}), {mode: 0o600});
      for (const f of [p.server, p.session]) fs.chmodSync(f, 0o600);
      resolve({
        ...info,
        url: `http://127.0.0.1:${info.port}/?token=${token}`,
        close: () =>
          new Promise((done) => {
            clearInterval(heartbeat);
            fs.unwatchFile(p.plan);
            // Tell waiting polls the server is going away on purpose, so they exit instead of retrying.
            for (const r of polls) if (!r.headersSent) r.writeHead(410, {"content-type": "text/plain"}).end("stopped");
            for (const s of streams) s.end();
            server.closeAllConnections();
            server.close(done);
            fs.rmSync(p.server, {force: true});
            fs.rmSync(p.lock, {force: true});
          }),
      });
    });
  });
}
