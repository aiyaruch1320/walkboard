import fs from "node:fs";

// Small updates without rewriting plan.json:
//   approved=true  step:build status=review confirmed=true  node:job status=done  constraint:cidr confirmed=true
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

// Write plan.json the way it was written (compact stays compact), through a temporary file of its own so a reader never sees half of it.
export function savePlan(file, plan, before = "") {
  const indent = before.includes("\n ") || before.includes("\n\t") ? before.match(/\n([ \t]+)"/)?.[1] ?? 1 : before.trim() ? 0 : 1;
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(plan, null, indent) + "\n");
  fs.renameSync(tmp, file);
}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

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
