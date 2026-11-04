// Draft changes the user sketches on a picture before the agent puts them in the plan.
// They live in .walkboard/draft.json, never in plan.json: the page draws them over the plan, the agent reads them
// with a review message or `walkboard draft`, and clears them once it has changed the plan (or the user drops them).
// Runs in Node and in the browser: no Node imports.

export const DRAFT_MAX_OPS = 300;
export const DRAFT_MAX_TEXT = 80;
const LINK_STATES = ["ok", "todo", "blocked", "standby"];

// What can be sketched on each kind of picture.
export const DRAFT_OPS = {
  map: ["addNode", "addZone", "addLink", "editLink", "removeLink", "editNode", "editZone", "remove", "removeZone", "move", "moveZone"],
};
export const draftable = (view) => !!DRAFT_OPS[view?.kind];
export const emptyDraft = () => ({version: 1, views: {}});
export const isNewId = (id) => typeof id === "string" && /^new:[A-Za-z0-9_-]{1,32}$/.test(id);

const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const text = (x, max = DRAFT_MAX_TEXT) => typeof x === "string" && x.trim() !== "" && x.length <= max;
const optText = (x, max = DRAFT_MAX_TEXT) => x == null || (typeof x === "string" && x.length <= max);
const id = (x) => typeof x === "string" && x !== "" && x.length <= 120 && !BAD_KEYS.has(x);
const label = (x) => text(x, 120) && !BAD_KEYS.has(x);
const at = (x) => x == null || (Number.isInteger(x) && x >= 0 && x < 10000);

// The fields each change needs (true) or may have (false).
const SHAPES = {
  addNode: {node: isNewId, name: text, what: optText, icon: (x) => optText(x, 60), zone: label, at},
  addZone: {zone: label, parent: (x) => x === "" || label(x), at},
  addLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x)},
  editLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x)},
  removeLink: {from: id, to: id},
  editNode: {node: id, name: (x) => x == null || text(x), what: optText, icon: (x) => optText(x, 60)},
  editZone: {zone: label, label},
  remove: {node: id},
  removeZone: {zone: label},
  move: {node: id, to: label, from: (x) => x == null || label(x), at},
  moveZone: {zone: label, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x), at},
};
const OPTIONAL = new Set(["what", "icon", "at", "label", "state", "name", "from"]);

// Problems with a draft (an empty list: fine). Shapes only; whether a change still fits the plan is applyDraft's job.
export function validateDraft(d) {
  if (!isObj(d) || d.version !== 1 || !isObj(d.views)) return ['a draft is {"version": 1, "views": {view id: {"ops": [...]}}}'];
  const out = [];
  let count = 0;
  for (const [view, v] of Object.entries(d.views)) {
    if (BAD_KEYS.has(view)) out.push(`bad view id "${view}"`);
    if (!isObj(v) || !Array.isArray(v.ops)) {
      out.push(`view "${view}": needs {"ops": [...]}`);
      continue;
    }
    const seen = new Set();
    v.ops.forEach((op, i) => {
      count++;
      const at = `view "${view}" change ${i + 1}`;
      if (!isObj(op) || !SHAPES[op.op]) return out.push(`${at}: unknown change ${JSON.stringify(op?.op ?? op)}`);
      if (!(typeof op.id === "string" && /^[A-Za-z0-9_-]{1,24}$/.test(op.id)) || seen.has(op.id)) out.push(`${at}: needs a unique id`);
      seen.add(op.id);
      const shape = SHAPES[op.op];
      for (const [k, ok] of Object.entries(shape)) {
        if (op[k] == null && OPTIONAL.has(k) && !(op.op === "editZone" && k === "label")) continue;
        if (!ok(op[k])) out.push(`${at} (${op.op}): bad ${k}`);
      }
      for (const k of Object.keys(op)) if (k !== "id" && k !== "op" && !(k in shape)) out.push(`${at} (${op.op}): unknown field ${k}`);
      if ((op.op === "addLink" || op.op === "editLink" || op.op === "removeLink") && op.from === op.to) out.push(`${at}: a line needs two different boxes`);
    });
  }
  if (count > DRAFT_MAX_OPS) out.push(`a draft holds at most ${DRAFT_MAX_OPS} changes`);
  return out;
}

const zonesOf = (zs) => (Array.isArray(zs) ? zs.filter(isObj) : []);
// Every zone with the list that holds it and its parent zone (null at the top).
function walk(v) {
  const out = [];
  const go = (list, parent) => {
    for (const z of list) {
      if (!isObj(z)) continue;
      out.push({z, list, parent});
      if (Array.isArray(z.zones)) go(z.zones, z);
    }
  };
  if (Array.isArray(v.zones)) go(v.zones, null);
  return out;
}
const insert = (list, item, i) => list.splice(i == null ? list.length : Math.min(Math.max(0, i), list.length), 0, item);
const key = (from, to) => `${from}>${to}`;

// The plan with one view's draft drawn in: what the page renders, and what each change came to.
// marks: nodes / zones / links → {mark: "add" | "change" | "remove" | "move", was?, from?, fromAt?}
// done: changes the plan already has (the agent made them); stale: changes that no longer fit, with why.
export function applyDraft(plan, draft, viewId) {
  const marks = {nodes: {}, zones: {}, links: {}};
  const result = {plan, view: null, marks, done: [], stale: [], pending: []};
  const real = Array.isArray(plan?.views) ? plan.views.find((x) => x?.id === viewId) : null;
  result.view = real;
  const ops = Array.isArray(draft?.views?.[viewId]?.ops) ? draft.views[viewId].ops : [];
  if (!real || !ops.length || !draftable(real)) return result;
  const v = structuredClone(real);
  const nodes = {...(isObj(plan.nodes) ? plan.nodes : {})};
  if (!Array.isArray(v.zones)) v.zones = [];
  if (!Array.isArray(v.links)) v.links = [];
  const alias = new Map();
  const r = (x) => alias.get(x) ?? x;
  const zone = (lbl) => walk(v).find((w) => w.z.label === lbl);
  const home = (nid) => walk(v).find((w) => Array.isArray(w.z.nodes) && w.z.nodes.includes(nid));
  const link = (from, to) => v.links.find((l) => isObj(l) && l.from === from && l.to === to);
  const stale = (op, why) => result.stale.push({id: op.id, why});
  const done = (op) => result.done.push(op.id);
  const nameOf = (n) => String(nodes[n]?.name ?? "").trim().toLowerCase();
  for (const op of ops) {
    if (!isObj(op) || !SHAPES[op.op] || !DRAFT_OPS[v.kind].includes(op.op)) continue;
    const before = result.done.length + result.stale.length;
    switch (op.op) {
      case "addNode": {
        const w = zone(op.zone);
        if (!w) stale(op, `no zone "${op.zone}"`);
        else if (Object.hasOwn(nodes, op.node)) stale(op, `id ${op.node} is taken`);
        else {
          // The agent added it under a real id: the zone now holds a box of that name.
          const same = (w.z.nodes || []).find((n) => !isNewId(n) && nameOf(n) === op.name.trim().toLowerCase());
          if (same) {
            alias.set(op.node, same);
            done(op);
            break;
          }
          nodes[op.node] = {name: op.name.trim(), ...(op.what ? {what: op.what} : {}), ...(op.icon ? {icon: op.icon} : {})};
          insert((w.z.nodes ||= []), op.node, op.at);
          marks.nodes[op.node] = {mark: "add"};
        }
        break;
      }
      case "addZone": {
        const p = op.parent ? zone(op.parent) : null;
        const there = zone(op.zone);
        if (op.parent && !p) stale(op, `no zone "${op.parent}"`);
        else if (there) (there.parent?.label ?? "") === (op.parent || "") && !marks.zones[op.zone] ? done(op) : stale(op, `a zone is already called "${op.zone}"`);
        else {
          insert(p ? (p.z.zones ||= []) : v.zones, {label: op.zone, nodes: []}, op.at);
          marks.zones[op.zone] = {mark: "add"};
        }
        break;
      }
      case "addLink": {
        const from = r(op.from), to = r(op.to);
        if (!home(from) || !home(to)) stale(op, "a box on this line is not in the picture");
        else if (link(from, to)) done(op);
        else {
          v.links.push({from, to, ...(op.label ? {label: op.label} : {}), ...(op.state ? {state: op.state} : {})});
          marks.links[key(from, to)] = {mark: "add"};
        }
        break;
      }
      case "editLink": {
        const from = r(op.from), to = r(op.to), l = link(from, to);
        if (!l) {
          stale(op, "no such line");
          break;
        }
        const was = {label: l.label ?? "", state: l.state ?? "ok"};
        const changed = ["label", "state"].filter((k) => op[k] != null && (op[k] || (k === "state" ? "ok" : "")) !== was[k]);
        if (!changed.length) {
          done(op);
          break;
        }
        for (const k of changed) {
          if (op[k] === "" || (k === "state" && op[k] === "ok")) delete l[k];
          else l[k] = op[k];
        }
        marks.links[key(from, to)] ||= {mark: "change", was};
        break;
      }
      case "removeLink": {
        const from = r(op.from), to = r(op.to), l = link(from, to);
        if (!l) done(op);
        else if (marks.links[key(from, to)]?.mark === "add") {
          v.links.splice(v.links.indexOf(l), 1);
          delete marks.links[key(from, to)];
        } else marks.links[key(from, to)] = {mark: "remove"};
        break;
      }
      case "editNode": {
        const n = r(op.node);
        if (!Object.hasOwn(nodes, n) || !home(n)) {
          stale(op, `no box ${op.node}`);
          break;
        }
        const cur = nodes[n] || {};
        const changed = ["name", "what", "icon"].filter((k) => op[k] != null && op[k] !== (cur[k] ?? ""));
        if (!changed.length) {
          done(op);
          break;
        }
        const was = Object.fromEntries(changed.map((k) => [k, cur[k] ?? ""]));
        nodes[n] = {...cur, ...Object.fromEntries(changed.map((k) => [k, op[k]]))};
        for (const k of changed) if (nodes[n][k] === "") delete nodes[n][k];
        if (!marks.nodes[n]) marks.nodes[n] = {mark: "change", was};
        else if (marks.nodes[n].mark === "change" || marks.nodes[n].mark === "move") marks.nodes[n].was = {...was, ...marks.nodes[n].was};
        break;
      }
      case "editZone": {
        const w = zone(op.zone);
        if (!w) stale(op, `no zone "${op.zone}"`);
        else if (op.label === op.zone) done(op);
        else if (zone(op.label)) stale(op, `a zone is already called "${op.label}"`);
        else {
          w.z.label = op.label;
          const m = marks.zones[op.zone];
          delete marks.zones[op.zone];
          marks.zones[op.label] = m?.mark === "add" ? m : {...(m || {mark: "change"}), was: m?.was ?? op.zone};
          if (marks.zones[op.label].mark === "move") marks.zones[op.label].renamedFrom = op.zone;
        }
        break;
      }
      case "remove": {
        const n = r(op.node), w = home(n);
        if (!w) done(op);
        else if (marks.nodes[n]?.mark === "add") {
          // Taking out a box this draft added takes it and its lines out of the picture.
          w.z.nodes.splice(w.z.nodes.indexOf(n), 1);
          delete nodes[n];
          delete marks.nodes[n];
          v.links = v.links.filter((l) => {
            const gone = l?.from === n || l?.to === n;
            if (gone) delete marks.links[key(l.from, l.to)];
            return !gone;
          });
        } else marks.nodes[n] = {...marks.nodes[n], mark: "remove"};
        break;
      }
      case "removeZone": {
        const w = zone(op.zone);
        if (!w) done(op);
        else if (marks.zones[op.zone]?.mark === "add" && !(w.z.nodes || []).length && !(w.z.zones || []).length) {
          w.list.splice(w.list.indexOf(w.z), 1);
          delete marks.zones[op.zone];
        } else marks.zones[op.zone] = {...marks.zones[op.zone], mark: "remove"};
        break;
      }
      case "move": {
        const n = r(op.node), w = home(n), to = zone(op.to);
        if (!w) stale(op, `no box ${op.node}`);
        else if (!to) stale(op, `no zone "${op.to}"`);
        else if (w.z.label === op.to) done(op);
        else if (op.from != null && w.z.label !== op.from && marks.nodes[n]?.mark !== "move" && marks.nodes[n]?.mark !== "add") stale(op, `the plan now puts it in "${w.z.label}"`);
        else {
          const fromAt = w.z.nodes.indexOf(n);
          w.z.nodes.splice(fromAt, 1);
          insert((to.z.nodes ||= []), n, op.at);
          const m = marks.nodes[n];
          if (m?.mark === "add") break;
          // Moved twice: it still came from where it was first.
          marks.nodes[n] = m?.mark === "move" ? m : {...(m?.was ? {was: m.was} : {}), mark: "move", from: w.z.label, fromAt};
          if (marks.nodes[n].from === op.to) delete marks.nodes[n];
        }
        break;
      }
      case "moveZone": {
        const w = zone(op.zone), to = op.to ? zone(op.to) : null;
        if (!w) stale(op, `no zone "${op.zone}"`);
        else if (op.to && !to) stale(op, `no zone "${op.to}"`);
        else if (to && (to.z === w.z || walk({zones: [w.z]}).some((x) => x.z === to.z))) stale(op, "a zone cannot go inside itself");
        else if ((w.parent?.label ?? "") === (op.to || "")) done(op);
        else if (op.from != null && (w.parent?.label ?? "") !== op.from && marks.zones[op.zone]?.mark !== "move" && marks.zones[op.zone]?.mark !== "add") stale(op, `the plan now puts it in "${w.parent?.label ?? "the top"}"`);
        else {
          const fromAt = w.list.indexOf(w.z), from = w.parent?.label ?? "";
          w.list.splice(fromAt, 1);
          insert(to ? (to.z.zones ||= []) : v.zones, w.z, op.at);
          const m = marks.zones[op.zone];
          if (m?.mark === "add") break;
          marks.zones[op.zone] = m?.mark === "move" ? m : {mark: "move", from, fromAt};
          if (marks.zones[op.zone].from === (op.to || "")) delete marks.zones[op.zone];
        }
        break;
      }
    }
    if (result.done.length + result.stale.length === before) result.pending.push(op.id);
  }
  // A line to a box the draft takes out is drawn as going too.
  for (const l of v.links) if (isObj(l) && (marks.nodes[l.from]?.mark === "remove" || marks.nodes[l.to]?.mark === "remove")) marks.links[key(l.from, l.to)] ||= {mark: "remove"};
  result.plan = {...plan, nodes, views: plan.views.map((x) => (x === real ? v : x))};
  result.view = v;
  return result;
}

// The draft in words the agent can act on without opening plan.json: names next to ids, zones by label.
export function describeDraft(plan, draft, viewId) {
  const {stale, pending, plan: drawn} = applyDraft(plan, draft, viewId);
  const ops = draft?.views?.[viewId]?.ops || [];
  const nodes = isObj(drawn?.nodes) ? drawn.nodes : {};
  const added = Object.fromEntries(ops.filter((o) => o?.op === "addNode").map((o) => [o.node, o.name]));
  const named = (n) => {
    // The name the plan knows it by (a renamed box is still the one the agent knows).
    const name = plan?.nodes?.[n]?.name ?? nodes[n]?.name ?? added[n];
    return name && name !== n ? `${name} (${n})` : n;
  };
  // Box ids get their names; zones are already words, and a new box's own id stays bare (its name is beside it).
  const words = (o) => {
    const out = {...o};
    for (const k of ["node", "from", "to"]) if (out[k] != null && !(o.op === "move" && k !== "node") && o.op !== "moveZone" && o.op !== "addNode") out[k] = named(out[k]);
    return out;
  };
  const changes = ops.filter((o) => pending.includes(o.id)).map(words);
  const staleOut = stale.map((s) => ({...words(ops.find((o) => o.id === s.id)), why: s.why}));
  return {view: viewId, changes, ...(staleOut.length ? {stale: staleOut} : {})};
}

// One line per change, for `walkboard draft` and the page's list.
export function draftLine(c) {
  const z = (x) => (x ? `"${x}"` : "the top");
  switch (c.op) {
    case "addNode": return `+ box ${c.name} (${c.node}) in ${z(c.zone)}`;
    case "addZone": return `+ zone ${z(c.zone)} in ${z(c.parent)}`;
    case "addLink": return `+ line ${c.from} → ${c.to}${c.label ? ` ${c.label}` : ""}${c.state ? ` [${c.state}]` : ""}`;
    case "editLink": return `~ line ${c.from} → ${c.to}${c.label != null ? ` label ${JSON.stringify(c.label)}` : ""}${c.state ? ` [${c.state}]` : ""}`;
    case "removeLink": return `− line ${c.from} → ${c.to}`;
    case "editNode": return `~ box ${c.node}: ${["name", "what", "icon"].filter((k) => c[k] != null).map((k) => `${k} ${JSON.stringify(c[k])}`).join(", ")}`;
    case "editZone": return `~ zone ${z(c.zone)} → ${z(c.label)}`;
    case "remove": return `− box ${c.node}`;
    case "removeZone": return `− zone ${z(c.zone)}`;
    case "move": return `↦ box ${c.node} → ${z(c.to)}`;
    case "moveZone": return `↦ zone ${z(c.zone)} → ${z(c.to)}`;
    default: return JSON.stringify(c);
  }
}
