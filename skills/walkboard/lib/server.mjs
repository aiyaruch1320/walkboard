import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {excerpt} from "./source.mjs";
import {updatePlan} from "./edit.mjs";
import {pageHtml, snapshot} from "./export.mjs";
import {validateDraft, emptyDraft, draftable} from "./draft.mjs";

export const paths = (dir) => {
  const state = path.join(dir, ".walkboard");
  return {
    plan: path.join(dir, "plan.json"),
    state,
    server: path.join(state, "server.json"),
    session: path.join(state, "session.json"),
    feedback: path.join(state, "feedback.jsonl"),
    delivered: path.join(state, "delivered"),
    replies: path.join(state, "replies.jsonl"),
    draft: path.join(state, "draft.json"),
    lock: path.join(state, "server.lock"),
  };
};

const schemaFile = new URL("./schema.mjs", import.meta.url);
const iconsFile = new URL("./icons.mjs", import.meta.url);
const draftFile = new URL("./draft.mjs", import.meta.url);
const glossaryFile = new URL("../assets/glossary.json", import.meta.url);

const MAX_BODY = 64 * 1024;

// The exported file is named after the plan's title (letters of any script, digits, dashes), else its folder.
export const exportName = (plan, dir) => (String(plan?.title || "").normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || path.basename(dir)) + ".html";
const sameKey = (v) => JSON.stringify(["kind", "text", "node", "step", "option", "criterion", "constraint"].map((k) => v[k] ?? null));

// A torn or hand-edited line must not keep the server from starting.
function readLines(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      console.error(`walkboard: skipped an unreadable line in ${file}`);
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

// The plan as an object, or why it cannot be used (missing, unreadable, not JSON, not an object).
function readPlan(file) {
  try {
    const plan = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) return {error: "plan.json is not a JSON object"};
    return {plan};
  } catch (e) {
    return {error: `plan.json cannot be read: ${e.message}`};
  }
}

// The draft sketched on the pictures (lib/draft.mjs); a missing or broken file is an empty draft.
export function readDraft(dir) {
  try {
    const d = JSON.parse(fs.readFileSync(paths(dir).draft, "utf8"));
    return validateDraft(d).length ? emptyDraft() : d;
  } catch {
    return emptyDraft();
  }
}

// Views with no changes left are dropped; nothing left, no file.
export function writeDraft(dir, d) {
  const p = paths(dir);
  for (const [k, v] of Object.entries(d.views)) if (!v.ops.length && !v.rev) delete d.views[k];
  fs.mkdirSync(p.state, {recursive: true, mode: 0o700});
  if (!Object.values(d.views).some((v) => v.ops.length)) return fs.rmSync(p.draft, {force: true});
  const tmp = `${p.draft}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d), {mode: 0o600});
  fs.renameSync(tmp, p.draft);
}

// Text that is only spaces or invisible characters is no message.
const blank = (t) => !String(t).replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();

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
      if (holder && alive(holder)) throw Object.assign(new Error(`already running (pid ${holder})`), {code: "WALKBOARD_RUNNING"});
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
  let recent = [];
  const waiters = [];
  const polls = new Set();
  const streams = new Set();

  const broadcast = (event, data) => {
    for (const s of streams) s.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const agentState = () => broadcast("agent", {waiting: waiters.length});
  // Settings switched on the page never wake the agent; they ride along with the next real message.
  let changedSettings = null;
  // Messages count as delivered only when the poll that took them says so (POST /api/ack). If it never does
  // (killed by a timeout right after the server answered), they go back to the front of the queue for the next poll.
  let inflight = null;
  const requeue = () => {
    if (!inflight) return;
    clearTimeout(inflight.timer);
    pending.unshift(...inflight.items);
    changedSettings ||= inflight.settings;
    inflight = null;
  };
  const ack = (ids) => {
    if (!inflight || !inflight.items.every((i) => ids.includes(i.id))) return false;
    clearTimeout(inflight.timer);
    delivered += inflight.items.length;
    fs.mkdirSync(p.state, {recursive: true, mode: 0o700});
    fs.writeFileSync(p.delivered, String(delivered));
    broadcast("delivered", {ids: inflight.items.map((i) => i.id)});
    inflight = null;
    flush();
    return true;
  };
  const flush = () => {
    if (inflight || !pending.length || !waiters.length) return;
    const items = pending.splice(0);
    const settings = changedSettings;
    changedSettings = null;
    inflight = {items, settings, timer: setTimeout(requeue, 20_000)};
    const out = settings ? [{kind: "settings", ...settings, id: crypto.randomUUID(), at: new Date().toISOString()}, ...items] : items;
    waiters.shift()(out);
    agentState();
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
      let v;
      try {
        v = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object");
      } catch (e) {
        return cb(e);
      }
      cb(null, v);
    });
  };

  // One bad request (a broken plan, an unreadable file) gets an error answer; it never takes the server down.
  const safe = (res, fn) => (...args) => {
    try {
      fn(...args);
    } catch (e) {
      console.error(`walkboard: ${e.message}`);
      if (!res.headersSent) res.writeHead(500, {"content-type": "text/plain; charset=utf-8"}).end(`walkboard: ${e.message}`);
    }
  };
  const server = http.createServer((req, res) => safe(res, handle)(req, res));
  function handle(req, res) {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.searchParams.get("token") !== token) return res.writeHead(403).end();
    // Only this machine's own names: a page on another site that renames itself to 127.0.0.1 (DNS rebinding) is refused.
    if (req.headers.host && !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(req.headers.host)) return res.writeHead(403).end();
    const route = `${req.method} ${url.pathname}`;

    if (route === "GET /") {
      res.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store"}).end(pageHtml());
    } else if (route === "GET /schema.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(schemaFile));
    } else if (route === "GET /icons.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(iconsFile));
    } else if (route === "GET /draft.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(fs.readFileSync(draftFile));
    } else if (route === "GET /glossary.json") {
      res.writeHead(200, {"content-type": "application/json; charset=utf-8"}).end(fs.readFileSync(glossaryFile));
    } else if (route === "GET /api/plan") {
      if (!fs.existsSync(p.plan)) return res.writeHead(404, {"content-type": "text/plain; charset=utf-8"}).end(`no plan.json in ${dir}`);
      let body;
      try {
        body = fs.readFileSync(p.plan);
      } catch (e) {
        return res.writeHead(409, {"content-type": "text/plain; charset=utf-8"}).end(`plan.json cannot be read: ${e.code || e.message}`);
      }
      res.writeHead(200, {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}).end(body);
    } else if (route === "GET /api/source") {
      const {plan, error} = readPlan(p.plan);
      if (error) return res.writeHead(409, {"content-type": "application/json; charset=utf-8"}).end(JSON.stringify({error}));
      const node = plan.nodes && Object.hasOwn(plan.nodes, url.searchParams.get("node") || "") ? plan.nodes[url.searchParams.get("node")] : null;
      const r = node?.file ? excerpt(plan, node.file, {base: dir, anchor: node.anchor}) : {error: "no file"};
      res.writeHead(r.error ? 404 : 200, {"content-type": "application/json; charset=utf-8"}).end(JSON.stringify(r));
    } else if (route === "GET /api/export") {
      // The page's Export button: the same read-only file as `walkboard export`.
      const {plan, error} = readPlan(p.plan);
      if (error) return res.writeHead(409, {"content-type": "text/plain; charset=utf-8"}).end(error);
      const {html} = snapshot(dir, plan, {code: url.searchParams.get("code") !== "0", chat: url.searchParams.get("chat") === "1"});
      const name = exportName(plan, dir);
      res.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-disposition": `attachment; filename="${name.replace(/[^\w.-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`}).end(html);
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
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        if (err || typeof v.text !== "string" || blank(v.text)) return res.writeHead(400).end("need a JSON object with text");
        // "settings" is how the server itself reports switched settings; the page cannot send one.
        if (route === "POST /api/feedback" && v.kind === "settings") return res.writeHead(400).end("kind settings is reserved");
        ensureState();
        // A double click sends the same message twice; keep the first.
        const same = route === "POST /api/feedback" && recent.find((r) => Date.now() - r.t < 5000 && r.key === sameKey(v));
        if (same) return res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify(same.item));
        // The box's name goes with the message: a box taken out of the plan later still has a name in its conversation.
        const {nodeName: _, ...sent} = v;
        const nodes = typeof v.node === "string" ? readPlan(p.plan).plan?.nodes : null;
        const name = nodes && Object.hasOwn(nodes, v.node) ? nodes[v.node]?.name : null;
        const item = {...sent, ...(typeof name === "string" ? {nodeName: name} : {}), id: crypto.randomUUID(), at: new Date().toISOString()};
        if (route === "POST /api/feedback") recent = [...recent.filter((r) => Date.now() - r.t < 5000), {t: Date.now(), key: sameKey(v), item}];
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
      }));
    } else if (route === "POST /api/ack") {
      readBody(req, safe(res, (err, v) => {
        if (err || !Array.isArray(v.ids)) return res.writeHead(400).end("need {ids: [...]}");
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({ok: ack(v.ids)}));
      }));
    } else if (route === "POST /api/settings") {
      // Switches on the page change plan.json directly; the agent reads them there or with its next message.
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        const s = {};
        if (typeof v?.teachBack === "boolean") s.teachBack = v.teachBack;
        if (v?.commit === "auto" || v?.commit === "suggest") s.commit = v.commit;
        // Design criteria weights: {criterion id: 0-3}.
        const w = v?.weights && typeof v.weights === "object" && !Array.isArray(v.weights) ? Object.entries(v.weights) : [];
        if (err || (!Object.keys(s).length && !w.length)) return res.writeHead(400).end('need teachBack (true|false), commit ("auto"|"suggest") or weights ({criterion: 0-3})');
        let plan;
        try {
          plan = updatePlan(p.plan, (plan) => {
            if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw Object.assign(new Error("plan.json is not a JSON object"), {status: 409});
            const known = new Set((Array.isArray(plan.criteria) ? plan.criteria : []).map((c) => c?.id));
            if (w.some(([id, n]) => !known.has(id) || !(Number.isInteger(n) && n >= 0 && n <= 3))) throw Object.assign(new Error("weights must be {criterion id: 0-3} for criteria in the plan"), {status: 400});
            plan.settings = {...(plan.settings && typeof plan.settings === "object" && !Array.isArray(plan.settings) ? plan.settings : {}), ...s};
            for (const [id, n] of w) for (const c of Array.isArray(plan.criteria) ? plan.criteria : []) if (c?.id === id) c.weight = n;
            return plan;
          });
        } catch (e) {
          return res.writeHead(e.status || 409, {"content-type": "text/plain; charset=utf-8"}).end(e.status ? e.message : `plan.json cannot be read: ${e.message}`);
        }
        changedSettings = {settings: plan.settings};
        if (Array.isArray(plan.criteria)) changedSettings.weights = Object.fromEntries(plan.criteria.filter((c) => c?.id).map((c) => [c.id, c.weight ?? 1]));
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({settings: plan.settings}));
      }));
    } else if (route === "POST /api/layout") {
      // What was dragged on a picture: {view, positions: {id: {x, y}}}, or positions null to lay it out again.
      // Data model: where each table sits. Map: how far a box or a zone ("z:label") moved from its place,
      // and "in", the zone it was in then: the page drops an offset once the plan moves the box to another zone.
      // Moving a box into another zone is a change of plan, not arrangement: that goes in the draft (POST /api/draft).
      // Saved in plan.json so exports and other browsers keep it; the agent is not told, it is only arrangement.
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        const pos = v?.positions;
        const ok = (q) => q && typeof q === "object" && [q.x, q.y].every((n) => Number.isFinite(n) && Math.abs(n) <= 20000);
        if (err || typeof v?.view !== "string" || !(pos === null || (pos && typeof pos === "object" && !Array.isArray(pos) && Object.values(pos).every(ok))))
          return res.writeHead(400).end('need {"view": id, "positions": {table: {"x", "y"}} or null}');
        try {
          updatePlan(p.plan, (plan) => {
            const view = Array.isArray(plan?.views) ? plan.views.find((x) => x?.id === v.view) : null;
            if (view?.kind !== "datamodel" && view?.kind !== "map") throw Object.assign(new Error(`no data model or map view "${v.view}"`), {status: 400});
            if (view.kind === "datamodel" && pos && Object.values(pos).some((q) => q.x < 0 || q.y < 0)) throw Object.assign(new Error("a table's position cannot be negative"), {status: 400});
            const zoneLabels = (zs) => (Array.isArray(zs) ? zs : []).flatMap((z) => [`z:${z?.label}`, ...(z?.nodes || []), ...zoneLabels(z?.zones)]);
            const known = new Set(view.kind === "map" ? zoneLabels(view.zones) : (Array.isArray(view.tables) ? view.tables : []).map((t) => t?.node));
            if (pos === null) delete view.layout;
            else view.layout = Object.fromEntries(Object.entries(pos).filter(([id]) => known.has(id)).map(([id, q]) => [id, {x: Math.round(q.x), y: Math.round(q.y), ...(view.kind === "map" && typeof q.in === "string" ? {in: q.in.slice(0, 200)} : {})}]));
            return plan;
          });
        } catch (e) {
          return res.writeHead(e.status || 409, {"content-type": "text/plain; charset=utf-8"}).end(e.status ? e.message : `plan.json cannot be read: ${e.message}`);
        }
        res.writeHead(200, {"content-type": "application/json"}).end("{}");
      }));
    } else if (route === "GET /api/draft") {
      res.writeHead(200, {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}).end(JSON.stringify(readDraft(dir)));
    } else if (route === "POST /api/draft") {
      // One picture's changes, all of them: {view, ops}. Sketching never wakes the agent; the review button does.
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        if (err || typeof v?.view !== "string" || !Array.isArray(v.ops)) return res.writeHead(400).end('need {"view": id, "ops": [...], "rev": n}');
        const {plan, error} = readPlan(p.plan);
        if (error) return res.writeHead(409, {"content-type": "text/plain; charset=utf-8"}).end(error);
        const view = Array.isArray(plan.views) ? plan.views.find((x) => x?.id === v.view) : null;
        if (!draftable(view)) return res.writeHead(400).end(`no picture "${v.view}" that takes a draft`);
        const d = readDraft(dir);
        // rev: the version the page started from. Another page (or `walkboard draft clear`) saved since: send back what
        // is there now, so the page can put its own changes on top instead of overwriting them.
        const rev = Object.hasOwn(d.views, v.view) ? d.views[v.view].rev ?? 0 : 0;
        if (v.rev != null && v.rev !== rev) return res.writeHead(412, {"content-type": "application/json"}).end(JSON.stringify({ops: Object.hasOwn(d.views, v.view) ? d.views[v.view].ops : [], rev}));
        // Versions only grow, even after the file is gone (cleared): a page that missed that still conflicts.
        const next = Math.max(rev + 1, Date.now());
        d.views[v.view] = {ops: v.ops, rev: next};
        const problems = validateDraft(d);
        if (problems.length) return res.writeHead(400, {"content-type": "text/plain; charset=utf-8"}).end(problems.slice(0, 5).join("\n"));
        writeDraft(dir, d);
        draftSeen = fs.existsSync(p.draft) ? fs.statSync(p.draft).mtimeMs : 0;
        broadcast("draft", {view: v.view});
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({rev: next}));
      }));
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
      // A new poll while the last batch was never acknowledged: that poll died, so the batch goes out again.
      requeue();
      waiters.push(send);
      agentState();
      flush();
    } else if (route === "GET /api/status") {
      res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({pid: process.pid, pending: pending.length, waiting: waiters.length, viewers: streams.size}));
    } else {
      res.writeHead(404).end();
    }
  }

  const heartbeat = setInterval(() => {
    for (const s of streams) s.write(": keep-alive\n\n");
  }, 25_000);

  // If .walkboard/ is deleted under a running server (git clean, rm -rf), put it back, so `open` and `poll`
  // keep finding this server instead of starting a second one that the open page would never talk to.
  let info = null;
  function ensureState() {
    if (!info || fs.existsSync(p.server)) return;
    fs.mkdirSync(p.state, {recursive: true, mode: 0o700});
    fs.writeFileSync(p.server, JSON.stringify(info), {mode: 0o600});
    fs.writeFileSync(p.session, JSON.stringify({port: info.port, token}), {mode: 0o600});
    if (!fs.existsSync(p.lock)) fs.writeFileSync(p.lock, String(process.pid), {mode: 0o600});
  }
  const stateCheck = setInterval(() => {
    try {
      ensureState();
    } catch {}
  }, 1000);

  // `walkboard draft … clear` writes the file itself: open pages hear about it here.
  let draftSeen = fs.existsSync(p.draft) ? fs.statSync(p.draft).mtimeMs : 0;
  fs.watchFile(p.draft, {interval: 300}, (cur) => {
    if (cur.mtimeMs !== draftSeen) {
      draftSeen = cur.mtimeMs;
      broadcast("draft", {});
    }
  });
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
        clearInterval(stateCheck);
        fs.unwatchFile(p.plan);
        fs.unwatchFile(p.draft);
        fs.rmSync(p.lock, {force: true});
        return reject(e);
      }
      server.listen(0, "127.0.0.1");
    });
    server.listen(preferred, "127.0.0.1");
    server.once("listening", () => {
      info = {port: server.address().port, token, pid: process.pid, dir};
      fs.writeFileSync(p.server, JSON.stringify(info), {mode: 0o600});
      fs.writeFileSync(p.session, JSON.stringify({port: info.port, token}), {mode: 0o600});
      for (const f of [p.server, p.session]) fs.chmodSync(f, 0o600);
      resolve({
        ...info,
        url: `http://127.0.0.1:${info.port}/?token=${token}`,
        close: () =>
          new Promise((done) => {
            clearInterval(heartbeat);
            clearInterval(stateCheck);
            if (inflight) clearTimeout(inflight.timer);
            info = null;
            fs.unwatchFile(p.plan);
            fs.unwatchFile(p.draft);
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
