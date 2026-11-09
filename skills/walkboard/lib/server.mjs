import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {excerpt} from "./source.mjs";
import {updatePlan, replaceFile} from "./edit.mjs";
import {pageHtml, snapshot, moduleText} from "./export.mjs";
import {validateDraft, emptyDraft, draftable, viewList, isNewId} from "./draft.mjs";
import {VERSION, SKILL_DIR} from "./version.mjs";

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
    images: path.join(state, "images"),
    lock: path.join(state, "server.lock"),
    // Present once an agent has waited on the page (a long poll): it is woken by clicks. Without it, messages wait
    // until the user tells the agent in its own chat, and the page says so.
    listens: path.join(state, "listens"),
  };
};

const glossaryFile = new URL("../assets/glossary.json", import.meta.url);

const MAX_BODY = 64 * 1024;

// Images attached to a message. An image is what its first bytes say, whatever the request claims; never SVG, which can
// hold scripts. Names come from the server and are checked on every use, so none reaches outside the folder.
const MAX_IMAGE = 10 * 1024 * 1024, MAX_IMAGES = 5;
const IMAGE_TYPES = {png: "image/png", jpg: "image/jpeg", gif: "image/gif", webp: "image/webp"};
const IMAGE_NAME = /^[0-9a-f-]{36}\.(png|jpg|gif|webp)$/;
function imageExt(b) {
  const head = b.toString("latin1", 0, 12);
  if (head.startsWith("\x89PNG\r\n\x1a\n")) return "png";
  if (head.startsWith("\xff\xd8\xff")) return "jpg";
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) return "gif";
  if (head.startsWith("RIFF") && head.slice(8) === "WEBP") return "webp";
  return null;
}

// The exported file is named after the plan's title (letters of any script, digits, dashes), else its folder.
export const exportName = (plan, dir) => (String(plan?.title || "").normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || path.basename(dir)) + ".html";
const sameKey = (v) => JSON.stringify(["kind", "text", "node", "step", "option", "criterion", "constraint", "images"].map((k) => v[k] ?? null));

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
  replaceFile(tmp, p.draft);
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
      // Closed at once: an open lock file cannot be taken out or made again on Windows until it is.
      const fd = fs.openSync(file, "wx", 0o600);
      try {
        fs.writeSync(fd, String(process.pid));
      } finally {
        fs.closeSync(fd);
      }
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
  let listens = fs.existsSync(p.listens);
  const agentState = () => broadcast("agent", {waiting: waiters.length, listens});
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
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(moduleText("schema.mjs"));
    } else if (route === "GET /icons.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(moduleText("icons.mjs"));
    } else if (route === "GET /profiles.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(moduleText("profiles.mjs"));
    } else if (route === "GET /draft.mjs") {
      res.writeHead(200, {"content-type": "text/javascript; charset=utf-8", "cache-control": "no-store"}).end(moduleText("draft.mjs"));
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
      const {html} = snapshot(dir, plan, {code: url.searchParams.get("code") !== "0", chat: url.searchParams.get("chat") === "1", draft: url.searchParams.get("draft") === "0" ? null : readDraft(dir)});
      const name = exportName(plan, dir);
      res.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-disposition": `attachment; filename="${name.replace(/[^\w.-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`}).end(html);
    } else if (route === "GET /api/thread") {
      const feedback = readLines(p.feedback).map((f, i) => ({...f, from: "user", delivered: i < delivered}));
      const replies = readLines(p.replies);
      res.writeHead(200, {"content-type": "application/json; charset=utf-8"}).end(JSON.stringify({items: [...feedback, ...replies], waiting: waiters.length, listens}));
    } else if (route === "POST /api/image") {
      const chunks = [];
      let size = 0;
      req.on("data", (c) => {
        size += c.length;
        if (size <= MAX_IMAGE) chunks.push(c);
      });
      req.on("end", safe(res, () => {
        if (size > MAX_IMAGE) return res.writeHead(413).end(`image over ${MAX_IMAGE} bytes`);
        const body = Buffer.concat(chunks), ext = imageExt(body);
        if (!ext) return res.writeHead(415).end("need a PNG, JPEG, GIF or WebP image");
        const name = `${crypto.randomUUID()}.${ext}`;
        fs.mkdirSync(p.images, {recursive: true, mode: 0o700});
        fs.writeFileSync(path.join(p.images, name), body, {mode: 0o600});
        res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({name}));
      }));
    } else if (route === "GET /api/image") {
      const name = url.searchParams.get("name") || "";
      if (!IMAGE_NAME.test(name) || !fs.existsSync(path.join(p.images, name))) return res.writeHead(404).end();
      // A name never changes its bytes: the page need not fetch it twice.
      res.writeHead(200, {"content-type": IMAGE_TYPES[name.split(".").pop()], "x-content-type-options": "nosniff", "cache-control": "private, max-age=86400, immutable"});
      fs.createReadStream(path.join(p.images, name)).pipe(res);
    } else if (route === "GET /api/first" || route === "POST /api/first") {
      // Whether anyone has opened Walkboard on this computer yet. Not the browser's storage: every plan has its own port.
      const seen = path.join(os.homedir(), ".walkboard", ".first-look-seen");
      if (route === "POST /api/first") {
        fs.mkdirSync(path.dirname(seen), {recursive: true});
        fs.writeFileSync(seen, "");
      }
      res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({first: !fs.existsSync(seen)}));
    } else if (route === "GET /api/events") {
      res.writeHead(200, {"content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive"});
      // Which copy of Walkboard serves the page: a page served by an earlier server reloads when it changes.
      res.write(`retry: 2000\n\nevent: hello\ndata: ${JSON.stringify({build: `${VERSION}|${SKILL_DIR}`})}\n\n`);
      streams.add(res);
      res.on("close", () => streams.delete(res));
    } else if (route === "POST /api/feedback" || route === "POST /api/reply") {
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        if (err || typeof v.text !== "string" || blank(v.text)) return res.writeHead(400).end("need a JSON object with text");
        // "settings" is how the server itself reports switched settings; the page cannot send one.
        if (route === "POST /api/feedback" && v.kind === "settings") return res.writeHead(400).end("kind settings is reserved");
        if (v.images != null && (route !== "POST /api/feedback" || !Array.isArray(v.images) || v.images.length > MAX_IMAGES || v.images.some((n) => typeof n !== "string" || !IMAGE_NAME.test(n) || !fs.existsSync(path.join(p.images, n))))) return res.writeHead(400).end("images must name images sent to /api/image");
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
        if (v?.commit === "auto" || v?.commit === "suggest") s.commit = v.commit;
        // Design criteria weights: {criterion id: 0-3}.
        const w = v?.weights && typeof v.weights === "object" && !Array.isArray(v.weights) ? Object.entries(v.weights) : [];
        if (err || (!Object.keys(s).length && !w.length)) return res.writeHead(400).end('need commit ("auto"|"suggest") or weights ({criterion: 0-3})');
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
      // Data model, state, decision, impact: where each table or box sits. Map: how far a box or a zone ("z:label") moved from its place,
      // and "in", the zone it was in then: the page drops an offset once the plan moves the box to another zone.
      // Moving a box into another zone is a change of plan, not arrangement: that goes in the draft (POST /api/draft).
      // A state, decision or impact box can carry the sides lines meet it on: sides {"from>to": "left" | "top" | "right" | "bottom"}.
      // A map zone can also carry its size from its corner (w, h). "@fixed" ({x: 0, y: 0}) means placed by hand:
      // then x, y are where each box and zone sits from the corner of what holds it, not how far it moved.
      // Boxes, tables and zones the draft adds count too (new:… ids, any zone label), so a new one keeps the place it was given:
      // the page saves the layout and the draft at once, so the draft may not be here yet. The page drops what no
      // longer matches anything.
      // Saved in plan.json so exports and other browsers keep it; the agent is not told, it is only arrangement.
      readBody(req, safe(res, (err, v) => {
        if (err?.status === 413) return res.writeHead(413).end(`body over ${MAX_BODY} bytes`);
        const pos = v?.positions;
        const ok = (q) => q && typeof q === "object" && [q.x, q.y].every((n) => Number.isFinite(n) && Math.abs(n) <= 20000);
        // A map's "@sides": the sides chosen for its lines, {"from>to": {from, to}} (null: none left).
        const SIDES = ["left", "top", "right", "bottom"];
        const sidesOk = (q) => q === null || (q && typeof q === "object" && !Array.isArray(q) && Object.keys(q).length <= 400 && Object.entries(q).every(([k, w]) => k.length <= 410 && k.split(">").length === 2 && w && typeof w === "object" && Object.entries(w).every(([e, x]) => ["from", "to"].includes(e) && SIDES.includes(x))));
        if (err || typeof v?.view !== "string" || !(pos === null || (pos && typeof pos === "object" && !Array.isArray(pos) && Object.entries(pos).every(([k, q]) => (k === "@sides" ? sidesOk(q) : ok(q))))))
          return res.writeHead(400).end('need {"view": id, "positions": {table: {"x", "y"}} or null}');
        try {
          updatePlan(p.plan, (plan) => {
            const view = Array.isArray(plan?.views) ? plan.views.find((x) => x?.id === v.view) : null;
            const boxed = ["state", "decision", "impact"].includes(view?.kind);
            const mapped = view?.kind === "map" ? view : null;
            if (view?.kind !== "datamodel" && !mapped && !boxed) throw Object.assign(new Error(`no picture that can be arranged called "${v.view}"`), {status: 400});
            if ((view.kind === "datamodel" || boxed) && pos && Object.values(pos).some((q) => q.x < 0 || q.y < 0)) throw Object.assign(new Error("a position cannot be negative"), {status: 400});
            const zoneLabels = (zs) => (Array.isArray(zs) ? zs : []).flatMap((z) => [`z:${z?.label}`, ...(z?.nodes || []), ...zoneLabels(z?.zones)]);
            const lineEnds = (l) => (Array.isArray(l) ? l : []).flatMap((e) => [e?.from, e?.to]);
            const known = new Set(mapped ? ["@fixed", ...zoneLabels(mapped.zones)] : boxed ? [...(Array.isArray(view.states) ? view.states : []), ...(Array.isArray(view.nodes) ? view.nodes : []), ...lineEnds(view.transitions), ...lineEnds(view.edges)] : (Array.isArray(view.tables) ? view.tables : []).map((t) => t?.node));
            if (!mapped) known.add("@held");
            const keep = (id) => known.has(id) || isNewId(id) || (mapped && id.startsWith("z:") && id.length <= 201);
            const size = (n) => Number.isFinite(n) && n > 0 && n <= 20000;
            // Only lines that touch the box, a known side each, a few dozen at most.
            const sidesOf = (id, q) => {
              if (!boxed || !q.sides || typeof q.sides !== "object" || Array.isArray(q.sides)) return {};
              const ok = Object.entries(q.sides).filter(([k, side]) => k.length <= 410 && k.split(">").length === 2 && k.split(">").includes(id) && ["left", "top", "right", "bottom"].includes(side)).slice(0, 40);
              return ok.length ? {sides: Object.fromEntries(ok)} : {};
            };
            if (pos === null) delete view.layout;
            else view.layout = Object.fromEntries(Object.entries(pos).filter(([id, q]) => (id === "@sides" ? mapped && q : keep(id))).map(([id, q]) => id === "@sides" ? [id, q] : [id, {x: Math.round(q.x), y: Math.round(q.y),
              ...(mapped && typeof q.in === "string" ? {in: q.in.slice(0, 200)} : {}),
              ...(mapped && size(q.w) ? {w: Math.round(q.w)} : {}), ...(mapped && size(q.h) ? {h: Math.round(q.h)} : {}), ...sidesOf(id, q)}]));
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
        // A plan without views has one picture made of its steps ("flow"): that takes a draft too.
        const view = viewList(plan).find((x) => x?.id === v.view);
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
    } else if (route === "GET /api/poll" && url.searchParams.get("now") === "1") {
      // `poll --now`: what is waiting, at once, without waiting for more. For an agent that is not woken by the page:
      // the user says "check the page" in its chat. Handed out and acknowledged like any other batch.
      requeue();
      if (!pending.length) return res.writeHead(200, {"content-type": "application/json"}).end("[]");
      waiters.unshift((items) => res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify(items)));
      flush();
    } else if (route === "GET /api/poll") {
      if (!listens) {
        listens = true;
        fs.mkdirSync(p.state, {recursive: true, mode: 0o700});
        fs.writeFileSync(p.listens, new Date().toISOString());
      }
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
      res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({pid: process.pid, pending: pending.length, waiting: waiters.length, listens, viewers: streams.size, version: VERSION, skill: SKILL_DIR}));
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
      info = {port: server.address().port, token, pid: process.pid, dir, version: VERSION, skill: SKILL_DIR};
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
