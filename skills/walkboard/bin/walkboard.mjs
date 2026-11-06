#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {startServer, paths, exportName, readDraft, writeDraft} from "../lib/server.mjs";
import {describeDraft, draftLine} from "../lib/draft.mjs";
import * as profiles from "../lib/profiles.mjs";
import {validate, lint, viewsOf} from "../lib/schema.mjs";
import {checkEvidence} from "../lib/source.mjs";
import {knownIcon, iconNames} from "../lib/icons.mjs";
import {parseSet, applySet, updatePlan} from "../lib/edit.mjs";
import {snapshot} from "../lib/export.mjs";

const USAGE = `walkboard <command> [options]

  check  [dir]                  validate dir/plan.json, print problems, exit 1 if any
  set    [dir] [target] key=value ...   change plan.json in place, e.g.
                                step:build status=review confirmed=true node:job status=done approved=true
                                (targets: plan, step:, node:, constraint:, option:, criterion:, source:<id>)
  open   [dir] [--no-browser]   start (or reuse) the server for dir/plan.json and print its URL
  poll   [dir] [--full] [--timeout s]   wait for feedback from the page, print one short JSON line per item, exit ([] after s seconds)
  reply  [dir] [--node n] [--step s] [--option o [--criterion c]] <text>   show an agent reply on the page (or --dir d);
                                [[node:id]], [[step:id]], [[option:id]], [[plan]] in the text link to that place
  status [dir]                  print the URL and queue state
  stop   [dir]                  stop the server
  serve  [dir]                  run the server in the foreground
  export [dir] [--html file] [--no-code] [--no-draft] [--with-chat]   write a read-only copy of the plan as one HTML file, with what was sketched on it
  draft  [dir] [clear [view] [change …]]   print what the user sketched on the pictures, or clear it once it is in the plan
  icons                         list the icon names for "icon"

dir defaults to the current directory and must contain plan.json.`;

function parse(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-browser") flags.noBrowser = true;
    else if (a === "--full") flags.full = true;
    else if (a === "--no-code") flags.noCode = true;
    else if (a === "--with-chat") flags.withChat = true;
    else if (a === "--no-draft") flags.noDraft = true;
    else if (a === "--html") flags.html = argv[++i] ?? "";
    else if (a === "--timeout") flags.timeout = argv[++i];
    else if (["--dir", "--node", "--step", "--option", "--criterion"].includes(a)) flags[a.slice(2)] = argv[++i];
    else rest.push(a);
  }
  return {flags, rest};
}

const [cmd, ...args] = process.argv.slice(2);
const {flags, rest} = parse(args);
// reply takes free text, so its first word is a dir only when that dir holds a plan.
// set and reply take words after the folder, so the first word is the folder only when it holds a plan or looks like a path.
const dirFirst = rest[0] && (!["reply", "set", "draft"].includes(cmd) || fs.existsSync(path.join(rest[0], "plan.json")) || (/^[./~]|\//.test(rest[0]) && !/[=\s]/.test(rest[0])));
const dir = path.resolve(flags.dir ?? (dirFirst ? rest[0] : "."));
const words = !flags.dir && dirFirst ? rest.slice(1) : rest;
const p = paths(dir);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readServer() {
  try {
    return JSON.parse(fs.readFileSync(p.server, "utf8"));
  } catch {
    return null;
  }
}

async function api(s, route, init) {
  const r = await fetch(`http://127.0.0.1:${s.port}${route}${route.includes("?") ? "&" : "?"}token=${s.token}`, init);
  if (!r.ok) throw new Error(`${route}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

async function running() {
  const s = readServer();
  if (!s) return null;
  try {
    const status = await api(s, "/api/status");
    return status.pid === s.pid ? {...s, status} : null;
  } catch {
    return null;
  }
}

const urlOf = (s) => `http://127.0.0.1:${s.port}/?token=${s.token}`;

// The link carries the token, so it never goes through a shell that could read "&" or "^" as commands.
function openBrowser(url) {
  const opener = {darwin: ["open", [url]], win32: ["rundll32", ["url.dll,FileProtocolHandler", url]]}[process.platform] ?? ["xdg-open", [url]];
  spawn(opener[0], opener[1], {stdio: "ignore", detached: true}).on("error", () => {}).unref();
}

async function check() {
  let plan;
  try {
    plan = JSON.parse(fs.readFileSync(p.plan, "utf8"));
  } catch (e) {
    fail(`cannot read ${p.plan}: ${e.message}`);
  }
  const problems = validate(plan);
  if (!problems.length) problems.push(...checkEvidence(plan, dir));
  if (problems.length) {
    console.error(problems.map((t) => `- ${t}`).join("\n"));
    process.exit(1);
  }
  const warnings = lint(plan);
  for (const [id, n] of Object.entries(plan.nodes || {})) if (typeof n?.icon === "string" && !knownIcon(n.icon)) warnings.push(`node "${id}": unknown icon "${n.icon}" (walkboard icons lists them)`);
  for (const w of warnings.slice(0, 8)) console.log(`warning: ${w}`);
  if (warnings.length > 8) console.log(`warning: … ${warnings.length - 8} more`);
  console.log(`ok: ${plan.steps?.length || 0} steps, ${viewsOf(plan).length} views, ${Object.keys(plan.nodes || {}).length} nodes`);
}

async function set() {
  if (!fs.existsSync(p.plan)) fail(`no plan.json in ${dir}`);
  const ops = (() => {
    try {
      return parseSet(words);
    } catch (e) {
      fail(e.message);
    }
  })();
  try {
    updatePlan(p.plan, (plan) => {
      applySet(plan, ops);
      const problems = validate(plan);
      if (problems.length) throw new Error("not saved:\n" + problems.map((t) => `- ${t}`).join("\n"));
      return plan;
    });
  } catch (e) {
    fail(e.message);
  }
  console.log("ok");
}

async function open() {
  if (!fs.existsSync(p.plan)) fail(`no plan.json in ${dir}`);
  let s = await running();
  if (!s) {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "serve", dir], {stdio: "ignore", detached: true});
    child.unref();
    // Another open may win the lock; any live server for this folder will do.
    for (let i = 0; i < 50 && !s; i++) {
      await sleep(100);
      s = await running();
    }
    if (!s) {
      // A lock left by a crashed server whose pid now belongs to another program keeps every start waiting.
      const lock = fs.existsSync(p.lock) ? fs.readFileSync(p.lock, "utf8").trim() : "";
      fail(lock ? `server did not start: ${p.lock} names pid ${lock}, which is not a walkboard server; if none is running for this folder, delete that file and open again` : "server did not start");
    }
  }
  console.log(urlOf(s));
  if (!flags.noBrowser) openBrowser(urlOf(s));
}

// One short line per item keeps what the agent reads small; --full has everything: ids, times, the view, every box's place.
// A review keeps its view (clearing the draft names it) and, of where things are on screen, only what is off.
function brief({id, at, view, nodeName, ...rest}) {
  if (rest.kind !== "review") return rest;
  const out = {view, ...rest};
  if (rest.geometry) {
    const off = Object.entries(rest.geometry).filter(([k, x]) => ["moved", "outOfZone", "overlaps", "linesOverBoxes"].includes(k) && x?.length);
    if (off.length) out.geometry = Object.fromEntries(off);
    else delete out.geometry;
  }
  return out;
}

async function poll() {
  let gone = 0;
  // --timeout N: give up after N seconds with [] (for agents whose commands are killed after a while).
  const deadline = flags.timeout ? AbortSignal.timeout(Number(flags.timeout) * 1000) : null;
  deadline?.addEventListener("abort", () => {
    console.log("[]");
    process.exit(0);
  });
  const stopped = () => {
    console.error(`walkboard: the server for ${dir} was stopped`);
    console.log("[]");
    process.exit(0);
  };
  for (;;) {
    const s = readServer();
    try {
      if (!s) {
        if (!fs.existsSync(p.lock)) stopped();
        throw new Error("not running");
      }
      const r = await fetch(`http://127.0.0.1:${s.port}/api/poll?token=${s.token}`, {signal: deadline?.signal});
      if (r.status === 410) stopped();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const items = await r.json();
      gone = 0;
      if (items.length) {
        await new Promise((done) => process.stdout.write(items.map((i) => JSON.stringify(flags.full ? i : brief(i))).join("\n") + "\n", done));
        // Only now are they delivered: if this process is killed before here, the server hands them out again.
        await fetch(`http://127.0.0.1:${s.port}/api/ack?token=${s.token}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({ids: items.map((i) => i.id)})}).catch(() => {});
        return;
      }
    } catch (e) {
      // Ride out a restart; give up if the server stays away.
      if (++gone > 15) fail(`server not reachable for ${dir} (${e.message}); run: walkboard open ${dir}`);
      await sleep(2000);
    }
  }
}

async function reply() {
  const text = words.join(" ").trim();
  if (!text) fail("reply needs text");
  const s = (await running()) ?? fail(`server not running for ${dir}`);
  const plan = JSON.parse(fs.readFileSync(p.plan, "utf8"));
  // A person reads this: a draft's ids mean nothing to them, and a link has to lead somewhere.
  const opIds = new Set(Object.values(readDraft(dir).views).flatMap((v) => v.ops.map((o) => o.id)));
  const codes = [...new Set((text.match(/[\w:-]+/g) || []).filter((w) => opIds.has(w) || /(^|\[)new:/.test(w)))];
  if (codes.length) fail(`the reader does not know ${codes.join(", ")}: write the name shown on the picture instead; nothing was sent`);
  for (const [, kind, id] of text.matchAll(/\[\[(node|step|option):([^\]\s]+)\]\]/g)) {
    const known = kind === "node" ? Object.hasOwn(plan.nodes || {}, id) : (plan[kind === "step" ? "steps" : "options"] || []).some((x) => x?.id === id);
    if (!known) fail(`no ${kind} "${id}" for the link [[${kind}:${id}]]; nothing was sent`);
  }
  if (flags.node && !Object.hasOwn(plan.nodes || {}, flags.node)) fail(`no node "${flags.node}" in the plan; ids: ${Object.keys(plan.nodes || {}).join(", ")}`);
  if (flags.step && !(plan.steps || []).some((x) => x.id === flags.step)) fail(`no step "${flags.step}" in the plan; ids: ${(plan.steps || []).map((x) => x.id).join(", ")}`);
  for (const [flag, list] of [["option", "options"], ["criterion", "criteria"]]) {
    if (flags[flag] && !(plan[list] || []).some((x) => x?.id === flags[flag])) fail(`no ${flag} "${flags[flag]}" in the plan; ids: ${(plan[list] || []).map((x) => x?.id).join(", ")}`);
  }
  const body = {text, from: "agent"};
  for (const k of ["node", "step", "option", "criterion"]) if (flags[k]) body[k] = flags[k];
  await api(s, "/api/reply", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  console.log("sent");
}

async function status() {
  const s = await running();
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(p.plan, "utf8")).settings;
  } catch {}
  if (!s) return console.log(JSON.stringify({running: false, settings}));
  console.log(JSON.stringify({url: urlOf(s), pid: s.pid, ...s.status, settings}));
}

async function stop() {
  const s = await running();
  if (!s) {
    // Never signal a pid we cannot confirm: it may belong to another program by now.
    if (readServer()) fs.rmSync(p.server, {force: true});
    return console.log("not running");
  }
  process.kill(s.pid, "SIGTERM");
  for (let i = 0; i < 30 && fs.existsSync(p.server); i++) await sleep(100);
  console.log("stopped");
}

async function serve() {
  let s;
  try {
    s = await startServer(dir, {pollMs: Number(process.env.WALKBOARD_POLL_MS) || undefined});
  } catch (e) {
    fail(e.code === "WALKBOARD_RUNNING" ? `${e.message} for ${dir}` : e.message);
  }
  console.log(s.url);
  const quit = async () => {
    await s.close();
    process.exit(0);
  };
  process.on("SIGTERM", quit);
  process.on("SIGINT", quit);
}

function fail(msg) {
  console.error(`walkboard: ${msg}`);
  process.exit(1);
}

function icons() {
  console.log(iconNames().join(" "));
}

// One self-contained file anyone can open: no server, no token, no way to reach the agent.
function exportPlan() {
  if (!fs.existsSync(p.plan)) fail(`no plan.json in ${dir}`);
  const plan = JSON.parse(fs.readFileSync(p.plan, "utf8"));
  const problems = validate(plan);
  if (problems.length) fail("fix the plan first:\n" + problems.map((t) => `- ${t}`).join("\n"));
  if (flags.html === "") fail("--html needs a file name, e.g. --html plan.html");
  const out = path.resolve(flags.html || path.join(dir, exportName(plan, dir)));
  // Never write over the plan, Walkboard's state or anything that is not an .html file.
  if (!/\.html?$/i.test(out)) fail(`${out}: the file name must end in .html`);
  if (out === path.resolve(p.plan) || out.split(path.sep).includes(".walkboard")) fail(`${out}: choose a file outside .walkboard and other than plan.json`);
  const {html, summary} = snapshot(dir, plan, {code: !flags.noCode, chat: !!flags.withChat, draft: flags.noDraft ? null : readDraft(dir)});
  const missing = flags.noCode ? [] : checkEvidence(plan, dir);
  fs.writeFileSync(out, html);
  console.log(out);
  console.log(`${summary.steps} steps, ${summary.nodes} boxes;${summary.draft ? ` ${summary.draft} draft changes;` : ""} code from ${summary.files.length} files${summary.files.length ? ` (${summary.files.join(", ")})` : ""}; ${summary.chat ? `${summary.chat} chat messages` : "no chat"}`);
  for (const m of missing) console.log(`left out: ${m}`);
}

// What the user sketched, in words, or clear it: all of it, one picture's, or some changes by id.
function draft() {
  if (!fs.existsSync(p.plan)) fail(`no plan.json in ${dir}`);
  const plan = JSON.parse(fs.readFileSync(p.plan, "utf8"));
  const d = readDraft(dir);
  if (words[0] === "clear") {
    const [, view, ...ids] = words;
    if (view && !d.views[view]) fail(`no draft on picture "${view}"; pictures with one: ${Object.keys(d.views).join(", ") || "none"}`);
    for (const [k, v] of Object.entries(d.views)) {
      if (view && k !== view) continue;
      const unknown = ids.filter((id) => !v.ops.some((o) => o.id === id));
      if (unknown.length) fail(`no change ${unknown.join(", ")} on "${k}"; ids: ${v.ops.map((o) => o.id).join(", ")}`);
      v.ops = ids.length ? v.ops.filter((o) => !ids.includes(o.id)) : [];
      v.rev = Math.max((v.rev ?? 0) + 1, Date.now());
    }
    writeDraft(dir, d);
    console.log("cleared");
    // What is left, so there is no need to ask again.
    const left = Object.keys(d.views).filter((k) => d.views[k].ops.length);
    for (const view of left) {
      const {changes, stale = []} = describeDraft(plan, d, view, profiles);
      console.log(`${view}:`);
      for (const c of changes) console.log(`  ${c.id}  ${draftLine(c)}`);
      for (const c of stale) console.log(`  ${c.id}  ${draftLine(c)}  (no longer fits: ${c.why})`);
    }
    return;
  }
  if (words.length) fail(`draft takes "clear [view] [change …]", not "${words.join(" ")}"`);
  const views = Object.keys(d.views);
  if (!views.length) return console.log("no draft");
  for (const view of views) {
    const {changes, stale = [], warnings = []} = describeDraft(plan, d, view, profiles);
    console.log(`${view}:`);
    for (const c of changes) console.log(`  ${c.id}  ${draftLine(c)}`);
    for (const c of stale) console.log(`  ${c.id}  ${draftLine(c)}  (no longer fits: ${c.why})`);
    for (const w of warnings) console.log(`  ! ${w.node ? `box ${w.node}` : `zone "${w.zone}"`}: ${w.kind} in ${w.in}, usually in ${w.usuallyIn.join(", ")}`);
    if (!changes.length && !stale.length) console.log("  (all in the plan already: clear it)");
  }
}

const commands = {check, set, open, poll, reply, status, stop, serve, icons, draft, export: exportPlan};
const help = (x) => x === "--help" || x === "-h" || x === "help";
if (!commands[cmd]) {
  console[help(cmd) || !cmd ? "log" : "error"](USAGE);
  process.exit(cmd && !help(cmd) ? 2 : 0);
}
// "walkboard draft --help": that command's lines of the usage.
if (help(args[0])) {
  const lines = USAGE.split("\n"), at = lines.findIndex((l) => l.trimStart().startsWith(cmd + " ") || l.trim() === cmd);
  const own = [lines[at], ...lines.slice(at + 1).filter((l, i, all) => all.slice(0, i + 1).every((x) => /^\s{20,}/.test(x)))];
  console.log(["walkboard " + own[0].trim(), ...own.slice(1), "", lines.at(-1)].join("\n"));
  process.exit(0);
}
try {
  await commands[cmd]();
} catch (e) {
  fail(e.message);
}
