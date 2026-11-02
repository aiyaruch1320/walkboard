#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {startServer, paths} from "../lib/server.mjs";
import {validate, lint} from "../lib/schema.mjs";

const USAGE = `planview <command> [options]

  check  [dir]                  validate dir/plan.json, print problems, exit 1 if any
  open   [dir] [--no-browser]   start (or reuse) the server for dir/plan.json and print its URL
  poll   [dir]                  wait for feedback from the page, print it as JSON, exit
  reply  [dir] [--node n] [--step s] <text>   show an agent reply on the page (or --dir d)
  status [dir]                  print the URL and queue state
  stop   [dir]                  stop the server
  serve  [dir]                  run the server in the foreground

dir defaults to the current directory and must contain plan.json.`;

function parse(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-browser") flags.noBrowser = true;
    else if (["--dir", "--node", "--step"].includes(a)) flags[a.slice(2)] = argv[++i];
    else rest.push(a);
  }
  return {flags, rest};
}

const [cmd, ...args] = process.argv.slice(2);
const {flags, rest} = parse(args);
// reply takes free text, so its first word is a dir only when that dir holds a plan.
const dirFirst = rest[0] && (cmd !== "reply" || fs.existsSync(path.join(rest[0], "plan.json")));
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

function openBrowser(url) {
  const opener = {darwin: ["open", [url]], win32: ["cmd", ["/c", "start", "", url]]}[process.platform] ?? ["xdg-open", [url]];
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
  if (problems.length) {
    console.error(problems.map((t) => `- ${t}`).join("\n"));
    process.exit(1);
  }
  for (const w of lint(plan)) console.log(`warning: ${w}`);
  console.log(`ok: ${plan.steps?.length || 0} steps, ${plan.views.length} views, ${Object.keys(plan.nodes || {}).length} nodes`);
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
    if (!s) fail("server did not start");
  }
  console.log(urlOf(s));
  if (!flags.noBrowser) openBrowser(urlOf(s));
}

async function poll() {
  let gone = 0;
  for (;;) {
    const s = readServer();
    try {
      if (!s) throw new Error("not running");
      const items = await api(s, "/api/poll");
      gone = 0;
      if (items.length) return console.log(JSON.stringify(items, null, 2));
    } catch (e) {
      // Ride out a restart; give up if the server stays away.
      if (++gone > 15) fail(`server not reachable for ${dir} (${e.message}); run: planview open ${dir}`);
      await sleep(2000);
    }
  }
}

async function reply() {
  const text = words.join(" ").trim();
  if (!text) fail("reply needs text");
  const s = (await running()) ?? fail(`server not running for ${dir}`);
  const plan = JSON.parse(fs.readFileSync(p.plan, "utf8"));
  if (flags.node && !Object.hasOwn(plan.nodes || {}, flags.node)) fail(`no node "${flags.node}" in the plan; ids: ${Object.keys(plan.nodes || {}).join(", ")}`);
  if (flags.step && !(plan.steps || []).some((x) => x.id === flags.step)) fail(`no step "${flags.step}" in the plan; ids: ${(plan.steps || []).map((x) => x.id).join(", ")}`);
  const body = {text, from: "agent"};
  if (flags.node) body.node = flags.node;
  if (flags.step) body.step = flags.step;
  await api(s, "/api/reply", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  console.log("sent");
}

async function status() {
  const s = await running();
  if (!s) return console.log(`not running for ${dir}`);
  console.log(JSON.stringify({url: urlOf(s), pid: s.pid, ...s.status}, null, 2));
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
    s = await startServer(dir, {pollMs: Number(process.env.PLANVIEW_POLL_MS) || undefined});
  } catch (e) {
    fail(e.code === "PLANVIEW_RUNNING" ? `${e.message} for ${dir}` : e.message);
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
  console.error(`planview: ${msg}`);
  process.exit(1);
}

const commands = {check, open, poll, reply, status, stop, serve};
if (!commands[cmd]) {
  console.error(USAGE);
  process.exit(cmd ? 2 : 0);
}
await commands[cmd]();
