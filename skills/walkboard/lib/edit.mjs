import fs from "node:fs";

// Small updates without rewriting plan.json:
//   approved=true  step:build status=review  node:job status=done  constraint:cidr confirmed=true
// A word with ":" and no "=" picks the target; "plan" goes back to the top level; "key=" removes a key.
export function parseSet(words) {
  const ops = [];
  let target = "plan";
  for (const w of words) {
    if (!w.includes("=")) {
      if (w !== "plan" && !/^[a-z]+:./.test(w)) throw new Error(`"${w}" is neither a target (plan, step:<id>, node:<id>, …) nor key=value; is the plan folder right?`);
      target = w;
      continue;
    }
    const i = w.indexOf("=");
    ops.push({target, key: w.slice(0, i), value: w.slice(i + 1)});
  }
  return ops;
}

// A value starting with [, { or " is JSON, e.g. commits=[{"message":"feat: x","files":["a.go"]}], or what='"0001042"' to keep digits as text.
function coerce(v) {
  if (/^[[{"]/.test(v)) {
    try {
      return JSON.parse(v);
    } catch {
      // "[skip ci] bump" or '"fast" path' is text that starts with a bracket or a quote, not broken JSON.
      if (/^(\[[^\]]*\]|"[^"]*")\s*\S/.test(v)) return v;
      throw new Error(`not valid JSON: ${v.slice(0, 60)}`);
    }
  }
  return v === "true" ? true : v === "false" ? false : v === "null" ? null : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
}

const LISTS = {constraint: "constraints", option: "options", criterion: "criteria", source: "sources"};

export function applySet(plan, ops) {
  for (const {target, key, value} of ops) {
    const keys = key.split(".");
    if (keys.some((k) => !k || k === "__proto__" || k === "constructor" || k === "prototype")) throw new Error(`bad key "${key}"`);
    let obj;
    if (target === "plan") obj = plan;
    else if (target.startsWith("step:")) obj = (plan.steps || []).find((s) => s.id === target.slice(5));
    else if (target.startsWith("node:")) obj = plan.nodes && Object.hasOwn(plan.nodes, target.slice(5)) ? plan.nodes[target.slice(5)] : null;
    else if (LISTS[target.split(":")[0]] && target.includes(":")) obj = (plan[LISTS[target.split(":")[0]]] || []).find((x) => x?.id === target.slice(target.indexOf(":") + 1));
    else throw new Error(`unknown target "${target}" (use plan, step:, node:, constraint:, option:, criterion: or source:<id>)`);
    if (!obj) throw new Error(`no ${target}`);
    // settings.commit=auto reaches inside an object.
    for (const k of keys.slice(0, -1)) {
      if (obj[k] == null) obj[k] = {};
      if (typeof obj[k] !== "object" || Array.isArray(obj[k])) throw new Error(`${k} is not an object`);
      obj = obj[k];
    }
    const last = keys.at(-1);
    if (value === "") delete obj[last];
    else obj[last] = coerce(value);
  }
  return plan;
}

// A plan written one entry per line: each top-level field on its line, and each step, box, view or other entry of a
// list or map on its own line, compact. Agents often write it so; keeping it keeps their next Edit's old text valid.
export function planLines(plan, ind = " ") {
  const field = ([k, v]) => {
    if (!v || typeof v !== "object" || !Object.keys(v).length) return JSON.stringify(k) + ":" + JSON.stringify(v);
    const arr = Array.isArray(v), items = arr ? v.map((x) => ind + JSON.stringify(x)) : Object.entries(v).map(([kk, vv]) => ind + JSON.stringify(kk) + ":" + JSON.stringify(vv));
    return JSON.stringify(k) + ":" + (arr ? "[" : "{") + "\n" + items.join(",\n") + (arr ? "]" : "}");
  };
  return "{" + Object.entries(plan).map(field).join(",\n") + "}";
}

// Write plan.json the way it was written, through a temporary file of its own so a reader never sees half of it:
// compact stays compact, pretty-printed keeps its indent, and one entry per line stays so (a line that starts with a
// closing bracket is what tells pretty-printing from it).
export function savePlan(file, plan, before = "") {
  const text = before.trim();
  const pretty = /\n[ \t]*[}\]]/.test(text), indent = before.match(/\n([ \t]+)"/)?.[1] ?? 1;
  const out = !text ? JSON.stringify(plan, null, 1) : !text.includes("\n") ? JSON.stringify(plan) : pretty ? JSON.stringify(plan, null, indent) : planLines(plan, indent);
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmp, out + "\n");
  replaceFile(tmp, file);
}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Put tmp in file's place. Windows refuses while another process has file open for a moment (a page reading the plan,
// another command reading it before its lock): try again for up to about a second, as other tools do there.
export function replaceFile(tmp, file) {
  for (let i = 0; ; i++) {
    try {
      return fs.renameSync(tmp, file);
    } catch (e) {
      if (i >= 40 || !["EPERM", "EACCES", "EBUSY"].includes(e.code)) {
        fs.rmSync(tmp, {force: true});
        throw e;
      }
      pause(25);
    }
  }
}

// Read, change and write plan.json while holding a lock, so the page's switches and `walkboard set` never overwrite each other.
// change(plan, before) returns the plan to save, or throws to leave the file as it was.
export function updatePlan(file, change) {
  const lock = file + ".lock";
  for (let i = 0; ; i++) {
    try {
      fs.closeSync(fs.openSync(lock, "wx"));
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      // A lock left by a writer that died is stale after a few seconds.
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 5000) fs.rmSync(lock, {force: true});
      } catch {}
      if (i > 300) throw new Error(`plan.json is locked by another writer (${lock})`);
      pause(10);
    }
  }
  try {
    const before = fs.readFileSync(file, "utf8");
    const plan = change(JSON.parse(before), before);
    savePlan(file, plan, before);
    return plan;
  } finally {
    fs.rmSync(lock, {force: true});
  }
}
