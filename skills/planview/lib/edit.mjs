// Small updates without rewriting plan.json:
//   approved=true  step:build status=review confirmed=true  node:job status=done
// A word with ":" and no "=" picks the target; "plan" goes back to the top level; "key=" removes a key.
export function parseSet(words) {
  const ops = [];
  let target = "plan";
  for (const w of words) {
    if (!w.includes("=")) {
      target = w;
      continue;
    }
    const i = w.indexOf("=");
    ops.push({target, key: w.slice(0, i), value: w.slice(i + 1)});
  }
  return ops;
}

// A value starting with [ or { is JSON, e.g. commits=[{"message":"feat: x","files":["a.go"]}].
function coerce(v) {
  if (/^[[{]/.test(v)) {
    try {
      return JSON.parse(v);
    } catch {
      throw new Error(`not valid JSON: ${v.slice(0, 60)}`);
    }
  }
  return v === "true" ? true : v === "false" ? false : v === "null" ? null : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
}

export function applySet(plan, ops) {
  for (const {target, key, value} of ops) {
    if (!key || key === "__proto__" || key === "constructor" || key === "prototype") throw new Error(`bad key "${key}"`);
    let obj;
    if (target === "plan") obj = plan;
    else if (target.startsWith("step:")) obj = (plan.steps || []).find((s) => s.id === target.slice(5));
    else if (target.startsWith("node:")) obj = plan.nodes && Object.hasOwn(plan.nodes, target.slice(5)) ? plan.nodes[target.slice(5)] : null;
    else throw new Error(`unknown target "${target}" (use plan, step:<id> or node:<id>)`);
    if (!obj) throw new Error(`no ${target}`);
    if (value === "") delete obj[key];
    else obj[key] = coerce(value);
  }
  return plan;
}
