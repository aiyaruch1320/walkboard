// Draft changes the user sketches on a picture before the agent puts them in the plan.
// They live in .walkboard/draft.json, never in plan.json: the page draws them over the plan, the agent reads them
// with a review message or `walkboard draft`, and clears them once it has changed the plan (or the user drops them).
// Runs in Node and in the browser: no Node imports.

export const DRAFT_MAX_OPS = 300;
export const DRAFT_MAX_TEXT = 80;
// A box's description ("what"): a note for whoever reads the plan, so longer than a name.
export const DRAFT_MAX_NOTE = 300;
const LINK_STATES = ["ok", "todo", "blocked", "standby"];

// What can be sketched on each kind of picture.
export const DRAFT_OPS = {
  map: ["addNode", "addZone", "addLink", "editLink", "removeLink", "editNode", "editZone", "remove", "removeZone", "move", "moveZone"],
  datamodel: ["addTable", "addColumn", "editColumn", "removeColumn", "moveTable", "addGroup", "editGroup", "removeGroup", "editNode", "remove"],
  flow: ["addBox", "moveBox", "addLane", "editLane", "moveLane", "editNode", "remove"],
  state: ["addBox", "addEdge", "editEdge", "removeEdge", "editNode", "remove"],
  decision: ["addBox", "addEdge", "editEdge", "removeEdge", "editNode", "remove"],
  impact: ["addBox", "addEdge", "removeEdge", "editNode", "remove"],
  k8s: ["addBox", "addLink", "editLink", "removeLink", "editNode", "remove"],
};
// A plan without views is drawn as one flow of its steps (as in lib/schema.mjs, kept here so this file imports nothing).
export function viewList(p) {
  if (Array.isArray(p?.views) && p.views.length) return p.views;
  const lanes = (Array.isArray(p?.steps) ? p.steps : []).filter((s) => Array.isArray(s?.nodes) && s.nodes.length).map((s) => ({title: s.title, nodes: s.nodes, step: s.id}));
  return lanes.length ? [{id: "flow", kind: "flow", title: p?.lang === "th" ? "ภาพรวม" : "Overview", lanes}] : [];
}
export const draftable = (view) => !!DRAFT_OPS[view?.kind];
export const emptyDraft = () => ({version: 1, views: {}});
export const isNewId = (id) => typeof id === "string" && /^new:[A-Za-z0-9_-]{1,32}$/.test(id);

const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
// Characters that turn text around or hide it: a name must read the same on the page and to the agent.
export const HIDDEN_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;
export const cleanText = (x) => String(x ?? "").replace(HIDDEN_CHARS, "").trim();
const plain = (x) => !new RegExp(HIDDEN_CHARS.source).test(x);
const text = (x, max = DRAFT_MAX_TEXT) => typeof x === "string" && x.trim() !== "" && x.length <= max && plain(x);
const optText = (x, max = DRAFT_MAX_TEXT) => x == null || (typeof x === "string" && x.length <= max && plain(x));
const id = (x) => typeof x === "string" && x !== "" && x.length <= 120 && !BAD_KEYS.has(x);
const label = (x) => text(x, 120) && !BAD_KEYS.has(x);
const at = (x) => x == null || (Number.isInteger(x) && x >= 0 && x < 10000);

// The fields each change needs (true) or may have (false).
// A column's name (no dot: "table.column" points at one) and a pointer to a column.
const colName = (x) => text(x, 60) && !x.includes(".");
const colRef = (x) => typeof x === "string" && /^[^.\s]+\.[^.\s]+$/.test(x) && x.length <= 120 && !x.split(".").some((k) => BAD_KEYS.has(k));
const SHAPES = {
  addNode: {node: isNewId, name: text, what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60), zone: label, at},
  addZone: {zone: label, parent: (x) => x === "" || label(x), at},
  addLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x)},
  editLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x)},
  removeLink: {from: id, to: id},
  editNode: {node: id, name: (x) => x == null || text(x), what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60)},
  editZone: {zone: label, label},
  remove: {node: id},
  removeZone: {zone: label},
  move: {node: id, to: label, from: (x) => x == null || label(x), at},
  moveZone: {zone: label, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x), at},
  addTable: {node: isNewId, name: text, group: (x) => x == null || label(x), at},
  addColumn: {table: id, column: colName, type: (x) => optText(x, 40), key: (x) => optText(x, 12), ref: (x) => x == null || x === "" || colRef(x), at},
  editColumn: {table: id, column: colName, name: (x) => x == null || colName(x), type: (x) => optText(x, 40), key: (x) => optText(x, 12), ref: (x) => x == null || x === "" || colRef(x)},
  removeColumn: {table: id, column: colName},
  moveTable: {node: id, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x)},
  addGroup: {group: label, tables: (x) => Array.isArray(x) && x.length > 0 && x.length <= 50 && x.every(id)},
  editGroup: {group: label, label},
  removeGroup: {group: label},
  // A lane is named by its title when it has one (laneTitle): its number shifts when another page adds or moves lanes.
  addBox: {node: isNewId, name: text, lane: (x) => x == null || (Number.isInteger(x) && x >= 0 && x < 200), laneTitle: optText, at},
  moveBox: {node: id, lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, at},
  addLane: {title: text, at},
  editLane: {lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, title: text},
  moveLane: {lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, to: (x) => Number.isInteger(x) && x >= 0 && x < 200},
  addEdge: {from: id, to: id, label: (x) => optText(x, 60)},
  editEdge: {from: id, to: id, label: (x) => typeof x === "string" && x.length <= 60 && plain(x)},
  removeEdge: {from: id, to: id},
};
const OPTIONAL = new Set(["what", "icon", "at", "label", "state", "name", "from", "group", "type", "key", "ref", "laneTitle"]);

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
    if (v.rev != null && !(Number.isInteger(v.rev) && v.rev >= 0)) out.push(`view "${view}": rev must be a whole number`);
    const seen = new Set();
    v.ops.forEach((op, i) => {
      count++;
      const at = `view "${view}" change ${i + 1}`;
      if (!isObj(op) || typeof op.op !== "string" || !Object.hasOwn(SHAPES, op.op)) return out.push(`${at}: unknown change ${JSON.stringify(op?.op ?? op)}`);
      if (!(typeof op.id === "string" && /^[A-Za-z0-9_-]{1,24}$/.test(op.id)) || seen.has(op.id)) out.push(`${at}: needs a unique id`);
      seen.add(op.id);
      const shape = SHAPES[op.op];
      for (const [k, ok] of Object.entries(shape)) {
        if (op[k] == null && OPTIONAL.has(k) && !((op.op === "editZone" || op.op === "editGroup") && k === "label")) continue;
        if (!ok(op[k])) out.push(`${at} (${op.op}): bad ${k}`);
      }
      for (const k of Object.keys(op)) if (k !== "id" && k !== "op" && !(k in shape)) out.push(`${at} (${op.op}): unknown field ${k}`);
      if ((op.op === "addLink" || op.op === "editLink" || op.op === "removeLink") && op.from === op.to) out.push(`${at}: a line needs two different boxes`);
    });
  }
  if (count > DRAFT_MAX_OPS) out.push(`a draft holds at most ${DRAFT_MAX_OPS} changes`);
  return out;
}

// Changes made on this page since it last saw the server's list (base), put on top of what the server has now:
// added ones join, dropped ones go, edited ones win. Two pages sketching at once keep each other's changes.
export function rebaseOps(base, local, remote) {
  const ids = (list) => new Map((list || []).map((o) => [o.id, o]));
  const b = ids(base), l = ids(local), r = ids(remote);
  const dropped = new Set([...b.keys()].filter((id) => !l.has(id)));
  const edited = new Map([...l].filter(([id, o]) => b.has(id) && JSON.stringify(o) !== JSON.stringify(b.get(id))));
  const out = (remote || []).filter((o) => !dropped.has(o.id)).map((o) => edited.get(o.id) || o);
  for (const o of local || []) if (!b.has(o.id) && !r.has(o.id)) out.push(o);
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
  const views = viewList(plan);
  const real = views.find((x) => x?.id === viewId) || null;
  result.view = real;
  const ops = Array.isArray(draft?.views?.[viewId]?.ops) ? draft.views[viewId].ops : [];
  if (!real || !ops.length || !draftable(real)) return result;
  const v = structuredClone(real);
  const nodes = {...(isObj(plan.nodes) ? plan.nodes : {})};
  const others = {datamodel: applyTables, flow: applyFlow, state: applyGraph, decision: applyGraph, impact: applyGraph, k8s: applyK8s};
  if (others[v.kind]) {
    others[v.kind](v, nodes, ops, result);
    result.plan = {...plan, nodes, views: views.map((x) => (x === real ? v : x))};
    result.view = v;
    return result;
  }
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
  // A change can need a zone or box that a later change makes: a new box dropped into a zone sketched after it,
  // a line drawn to a box that waits for its zone. It waits for that change instead of not fitting.
  const finished = new Set(), waiting = {};
  let last = false;
  const makes = (o, k) => (k.startsWith("z:") ? o.op === "addZone" && o.zone === k.slice(2) : o.op === "addNode" && o.node === k.slice(2));
  const need = (op, keys) => {
    if (last) return false;
    const k = keys.find((x) => ops.some((o) => o !== op && isObj(o) && !finished.has(o.id) && makes(o, x)));
    if (!k) return false;
    (waiting[k] ||= []).push(op);
    return true;
  };
  const wake = (k) => {
    const q = waiting[k];
    delete waiting[k];
    q?.forEach(run);
  };
  const run = (op) => {
    const before = result.done.length + result.stale.length;
    switch (op.op) {
      case "addNode": {
        const w = zone(op.zone);
        if (!w && need(op, ["z:" + op.zone])) return;
        if (!w) stale(op, `no zone "${op.zone}"`);
        else if (Object.hasOwn(nodes, op.node)) stale(op, `id ${op.node} is taken`);
        else {
          // The agent added it under a real id: the zone now holds a box of that name.
          const same = (w.z.nodes || []).find((n) => !isNewId(n) && nameOf(n) === op.name.trim().toLowerCase());
          if (same) {
            alias.set(op.node, same);
            done(op);
          } else {
            nodes[op.node] = {name: op.name.trim(), ...(op.what ? {what: op.what} : {}), ...(op.icon ? {icon: op.icon} : {})};
            insert((w.z.nodes ||= []), op.node, op.at);
            marks.nodes[op.node] = {mark: "add"};
          }
          finished.add(op.id);
          wake("n:" + op.node);
        }
        break;
      }
      case "addZone": {
        const p = op.parent ? zone(op.parent) : null;
        const there = zone(op.zone);
        if (op.parent && !p && need(op, ["z:" + op.parent])) return;
        if (op.parent && !p) stale(op, `no zone "${op.parent}"`);
        else if (there) (there.parent?.label ?? "") === (op.parent || "") && !marks.zones[op.zone] ? done(op) : stale(op, `a zone is already called "${op.zone}"`);
        else {
          insert(p ? (p.z.zones ||= []) : v.zones, {label: op.zone, nodes: []}, op.at);
          marks.zones[op.zone] = {mark: "add"};
          finished.add(op.id);
          wake("z:" + op.zone);
        }
        break;
      }
      case "addLink": {
        const from = r(op.from), to = r(op.to);
        if (need(op, [from, to].filter((n) => !home(n)).map((n) => "n:" + n))) return;
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
        if (!l && need(op, [from, to].filter((n) => !home(n)).map((n) => "n:" + n))) return;
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
        if (!home(n) && need(op, ["n:" + n])) return;
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
        if (!w && need(op, ["z:" + op.zone])) return;
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
        if (!w && need(op, ["n:" + n])) return;
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
        if (!w && need(op, ["z:" + op.zone])) return;
        if (!w) done(op);
        else if (marks.zones[op.zone]?.mark === "add" && !(w.z.nodes || []).length && !(w.z.zones || []).length) {
          w.list.splice(w.list.indexOf(w.z), 1);
          delete marks.zones[op.zone];
        } else marks.zones[op.zone] = {...marks.zones[op.zone], mark: "remove"};
        break;
      }
      case "move": {
        const n = r(op.node), w = home(n), to = zone(op.to);
        if (need(op, [...(w ? [] : ["n:" + n]), ...(to ? [] : ["z:" + op.to])])) return;
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
        if (need(op, [...(w ? [] : ["z:" + op.zone]), ...(op.to && !to ? ["z:" + op.to] : [])])) return;
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
    finished.add(op.id);
    if (result.done.length + result.stale.length === before) result.pending.push(op.id);
  };
  for (const op of ops) if (isObj(op) && Object.hasOwn(SHAPES, op.op) && DRAFT_OPS[v.kind].includes(op.op)) run(op);
  // Whatever still waits never got what it needed (two changes waiting on each other): it does not fit.
  last = true;
  for (const q of Object.values(waiting)) q.forEach(run);
  // A line to a box the draft takes out is drawn as going too.
  for (const l of v.links) if (isObj(l) && (marks.nodes[l.from]?.mark === "remove" || marks.nodes[l.to]?.mark === "remove")) marks.links[key(l.from, l.to)] ||= {mark: "remove"};
  result.plan = {...plan, nodes, views: views.map((x) => (x === real ? v : x))};
  result.view = v;
  return result;
}

// A data model's draft: tables (marks.nodes), their columns (marks.columns, "table.column"), groups (marks.zones)
// and the lines of foreign keys (marks.links, "table.column>table.column").
function applyTables(v, nodes, ops, result) {
  const marks = result.marks;
  marks.columns = {};
  v.tables = Array.isArray(v.tables) ? v.tables.filter(isObj) : [];
  v.groups = Array.isArray(v.groups) ? v.groups.filter(isObj) : [];
  for (const tb of v.tables) tb.columns = Array.isArray(tb.columns) ? tb.columns.filter(isObj) : [];
  const alias = new Map();
  const r = (x) => alias.get(x) ?? x;
  const table = (n) => v.tables.find((tb) => tb.node === n);
  const col = (n, c) => table(n)?.columns.find((x) => x.name === c);
  const groupOf = (n) => v.groups.find((g) => Array.isArray(g.tables) && g.tables.includes(n));
  const group = (lbl) => v.groups.find((g) => g.label === lbl);
  const stale = (op, why) => result.stale.push({id: op.id, why});
  const done = (op) => result.done.push(op.id);
  const out = (n) => {
    for (const g of v.groups) if (Array.isArray(g.tables)) g.tables = g.tables.filter((x) => x !== n);
  };
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS.datamodel.includes(op.op)) continue;
    const before = result.done.length + result.stale.length;
    const n = r(op.node ?? op.table);
    switch (op.op) {
      case "addTable": {
        const same = v.tables.find((tb) => !isNewId(tb.node) && String(nodes[tb.node]?.name ?? tb.node).trim().toLowerCase() === op.name.trim().toLowerCase());
        if (Object.hasOwn(nodes, op.node)) stale(op, `id ${op.node} is taken`);
        else if (same) {
          alias.set(op.node, same.node);
          done(op);
        } else if (op.group && !group(op.group)) stale(op, `no group "${op.group}"`);
        else {
          nodes[op.node] = {name: op.name.trim()};
          insert(v.tables, {node: op.node, columns: []}, op.at);
          if (op.group) group(op.group).tables.push(op.node);
          marks.nodes[op.node] = {mark: "add"};
        }
        break;
      }
      case "addColumn": {
        const tb = table(n);
        if (!tb) stale(op, `no table ${op.table}`);
        else if (col(n, op.column)) done(op);
        else if (op.ref && !col(...op.ref.split("."))) stale(op, `points at ${op.ref}, which is not there`);
        else {
          insert(tb.columns, {name: op.column, ...(op.type ? {type: op.type} : {}), ...(op.key ? {key: op.key} : {}), ...(op.ref ? {ref: op.ref} : {})}, op.at);
          marks.columns[`${n}.${op.column}`] = {mark: "add"};
          if (op.ref) marks.links[`${n}.${op.column}>${op.ref}`] = {mark: "add"};
        }
        break;
      }
      case "editColumn": {
        const c = col(n, op.column);
        if (!c) {
          stale(op, `no column ${op.table}.${op.column}`);
          break;
        }
        const changed = ["name", "type", "key", "ref"].filter((k) => op[k] != null && op[k] !== (k === "name" ? c.name : c[k] ?? ""));
        if (!changed.length) {
          done(op);
          break;
        }
        if (op.ref && !col(...op.ref.split("."))) {
          stale(op, `points at ${op.ref}, which is not there`);
          break;
        }
        const k0 = `${n}.${c.name}`, m = marks.columns[k0];
        const was = Object.fromEntries(changed.map((k) => [k, (k === "name" ? c.name : c[k]) ?? ""]));
        if (changed.includes("ref")) {
          // A key taken out stays drawn, marked as going; a new one is drawn as added.
          if (op.ref === "") marks.links[`${k0}>${c.ref}`] = {mark: "remove"};
          else {
            if (c.ref) marks.links[`${k0}>${c.ref}`] = {mark: "remove"};
            c.ref = op.ref;
            marks.links[`${k0}>${op.ref}`] = {mark: "add"};
          }
        }
        for (const k of changed.filter((x) => x !== "ref" && x !== "name")) {
          if (op[k] === "") delete c[k];
          else c[k] = op[k];
        }
        if (changed.includes("name")) {
          // What pointed at the old name points at the new one.
          for (const tb of v.tables) for (const x of tb.columns) if (x.ref === k0) x.ref = `${n}.${op.name}`;
          c.name = op.name;
          delete marks.columns[k0];
        }
        marks.columns[`${n}.${c.name}`] = m?.mark === "add" ? m : {mark: "change", was: {...was, ...m?.was}};
        break;
      }
      case "removeColumn": {
        const tb = table(n), c = col(n, op.column);
        if (!c) done(op);
        else if (marks.columns[`${n}.${op.column}`]?.mark === "add") {
          tb.columns.splice(tb.columns.indexOf(c), 1);
          delete marks.columns[`${n}.${op.column}`];
        } else marks.columns[`${n}.${op.column}`] = {mark: "remove"};
        break;
      }
      case "moveTable": {
        const tb = table(n), from = groupOf(n)?.label ?? "";
        if (!tb) stale(op, `no table ${op.node}`);
        else if (op.to && !group(op.to)) stale(op, `no group "${op.to}"`);
        else if (from === op.to) done(op);
        else if (op.from != null && from !== op.from && marks.nodes[n]?.mark !== "move" && marks.nodes[n]?.mark !== "add") stale(op, `the plan now puts it in "${from || "no group"}"`);
        else {
          out(n);
          if (op.to) group(op.to).tables.push(n);
          const m = marks.nodes[n];
          if (m?.mark !== "add") marks.nodes[n] = m?.mark === "move" ? m : {mark: "move", from};
          if (marks.nodes[n]?.mark === "move" && marks.nodes[n].from === op.to) delete marks.nodes[n];
        }
        break;
      }
      case "addGroup": {
        if (group(op.group)) stale(op, `a group is already called "${op.group}"`);
        else {
          const ids = op.tables.map(r).filter((x) => table(x));
          if (!ids.length) {
            stale(op, "none of its tables is in the picture");
            break;
          }
          ids.forEach(out);
          v.groups.push({label: op.group, tables: ids});
          marks.zones[op.group] = {mark: "add"};
        }
        break;
      }
      case "editGroup": {
        const g = group(op.group);
        if (!g) stale(op, `no group "${op.group}"`);
        else if (op.label === op.group) done(op);
        else if (group(op.label)) stale(op, `a group is already called "${op.label}"`);
        else {
          g.label = op.label;
          const m = marks.zones[op.group];
          delete marks.zones[op.group];
          marks.zones[op.label] = m?.mark === "add" ? m : {mark: "change", was: op.group};
        }
        break;
      }
      case "removeGroup": {
        const g = group(op.group);
        if (!g) done(op);
        else if (marks.zones[op.group]?.mark === "add") {
          v.groups.splice(v.groups.indexOf(g), 1);
          delete marks.zones[op.group];
        } else marks.zones[op.group] = {mark: "remove"};
        break;
      }
      case "editNode": {
        if (!table(n)) {
          stale(op, `no table ${op.node}`);
          break;
        }
        const cur = nodes[n] || {};
        if (op.name == null || op.name === (cur.name ?? n)) {
          done(op);
          break;
        }
        nodes[n] = {...cur, name: op.name};
        if (!marks.nodes[n]) marks.nodes[n] = {mark: "change", was: {name: cur.name ?? n}};
        break;
      }
      case "remove": {
        const tb = table(n);
        if (!tb) done(op);
        else if (marks.nodes[n]?.mark === "add") {
          v.tables.splice(v.tables.indexOf(tb), 1);
          out(n);
          delete nodes[n];
          delete marks.nodes[n];
          for (const t2 of v.tables) for (const x of t2.columns) if (String(x.ref ?? "").split(".")[0] === n) delete x.ref;
        } else marks.nodes[n] = {...marks.nodes[n], mark: "remove"};
        break;
      }
    }
    if (result.done.length + result.stale.length === before) result.pending.push(op.id);
  }
  // Keys to or from a table the draft takes out are drawn as going too.
  for (const tb of v.tables) for (const c of tb.columns) {
    if (!c.ref) continue;
    const k = `${tb.node}.${c.name}>${c.ref}`;
    if (marks.nodes[tb.node]?.mark === "remove" || marks.nodes[String(c.ref).split(".")[0]]?.mark === "remove" || marks.columns[`${tb.node}.${c.name}`]?.mark === "remove") marks.links[k] ||= {mark: "remove"};
  }
}

// Shared by the pictures below: a change the plan already has is done, one that no longer fits is stale.
function tally(result) {
  return {
    stale: (op, why) => result.stale.push({id: op.id, why}),
    done: (op) => result.done.push(op.id),
    track(op, fn) {
      const before = result.done.length + result.stale.length;
      fn();
      if (result.done.length + result.stale.length === before) result.pending.push(op.id);
    },
  };
}
const editNodeIn = (has, nodes, op, marks, {stale, done}) => {
  if (!has(op.node)) return stale(op, `no box ${op.node}`);
  const cur = nodes[op.node] || {};
  const changed = ["name", "what", "icon"].filter((k) => op[k] != null && op[k] !== (cur[k] ?? ""));
  if (!changed.length) return done(op);
  nodes[op.node] = {...cur, ...Object.fromEntries(changed.map((k) => [k, op[k]]))};
  marks.nodes[op.node] ||= {mark: "change", was: Object.fromEntries(changed.map((k) => [k, cur[k] ?? ""]))};
};

// A flow: lanes of boxes in order. Lanes are counted from 0 as they are when the change is made.
// For a plan drawn from its steps, a lane is a step.
function applyFlow(v, nodes, ops, result) {
  const marks = result.marks, t = tally(result);
  marks.lanes = {};
  v.lanes = (Array.isArray(v.lanes) ? v.lanes : []).filter(isObj).map((l) => ({...l, nodes: Array.isArray(l.nodes) ? [...l.nodes] : []}));
  const laneOf = (n) => v.lanes.findIndex((l) => l.nodes.includes(n));
  const has = (n) => laneOf(n) >= 0;
  // The lane meant: by its title when the change names one and a lane still has it, else by its number.
  const laneIx = (op) => {
    if (op.laneTitle) {
      const i = v.lanes.findIndex((l) => (l.title ?? "") === op.laneTitle);
      if (i >= 0) return i;
    }
    return op.lane ?? 0;
  };
  result.lanes = {};
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS.flow.includes(op.op)) continue;
    // Which lane (and step) each change is about, in words: numbers alone shift as lanes come and go.
    if (["addBox", "moveBox", "editLane", "moveLane"].includes(op.op)) {
      const lane = v.lanes[laneIx(op)];
      if (lane) result.lanes[op.id] = {laneTitle: lane.title ?? "", ...(lane.step ? {step: lane.step} : {})};
      if (op.op === "moveLane" && v.lanes[op.to] && v.lanes[op.to] !== lane) result.lanes[op.id].before = v.lanes[op.to].title ?? "";
    }
    t.track(op, () => {
      switch (op.op) {
        case "addBox": {
          const lane = v.lanes[laneIx(op)];
          if (Object.hasOwn(nodes, op.node)) return t.stale(op, `id ${op.node} is taken`);
          if (!lane) return t.stale(op, `no lane ${op.lane + 1}`);
          nodes[op.node] = {name: op.name.trim()};
          insert(lane.nodes, op.node, op.at);
          marks.nodes[op.node] = {mark: "add"};
          return;
        }
        case "moveBox": {
          const li = laneIx(op), from = laneOf(op.node), lane = v.lanes[li];
          if (from < 0) return t.stale(op, `no box ${op.node}`);
          if (!lane) return t.stale(op, `no lane ${op.lane + 1}`);
          const at0 = v.lanes[from].nodes.indexOf(op.node);
          if (from === li && (op.at == null || op.at === at0)) return t.done(op);
          v.lanes[from].nodes.splice(at0, 1);
          insert(lane.nodes, op.node, op.at);
          if (marks.nodes[op.node]?.mark !== "add") marks.nodes[op.node] ||= {mark: "move", from: v.lanes[from].title ?? String(from + 1)};
          return;
        }
        case "addLane":
          insert(v.lanes, {title: op.title, nodes: [], draft: true}, op.at);
          return;
        case "editLane": {
          const lane = v.lanes[laneIx(op)];
          if (!lane) return t.stale(op, `no lane ${op.lane + 1}`);
          if (lane.title === op.title) return t.done(op);
          if (!lane.draft) lane.was ??= lane.title ?? "";
          lane.title = op.title;
          return;
        }
        case "moveLane": {
          const li = laneIx(op);
          if (!v.lanes[li] || op.to >= v.lanes.length) return t.stale(op, `no lane ${op.lane + 1}`);
          if (li === op.to) return t.done(op);
          const [lane] = v.lanes.splice(li, 1);
          v.lanes.splice(op.to, 0, lane);
          lane.moved = true;
          return;
        }
        case "editNode":
          return editNodeIn(has, nodes, op, marks, t);
        case "remove": {
          const i = laneOf(op.node);
          if (i < 0) return t.done(op);
          if (marks.nodes[op.node]?.mark === "add") {
            v.lanes[i].nodes.splice(v.lanes[i].nodes.indexOf(op.node), 1);
            delete nodes[op.node];
            delete marks.nodes[op.node];
          } else marks.nodes[op.node] = {...marks.nodes[op.node], mark: "remove"};
        }
      }
    });
  }
  result.order = v.lanes.map((l) => (l.step ? `${l.step}: ${l.title ?? ""}` : l.title ?? ""));
  // Lanes in the order drawn: added, renamed or moved.
  v.lanes.forEach((l, i) => {
    if (l.draft) marks.lanes[i] = {mark: "add"};
    else if (l.was != null) marks.lanes[i] = {mark: "change", was: l.was};
    else if (l.moved) marks.lanes[i] = {mark: "move"};
    delete l.draft;
    delete l.was;
    delete l.moved;
  });
}

// State, decision and impact pictures: boxes and the lines between them, laid out by the page.
function applyGraph(v, nodes, ops, result) {
  const marks = result.marks, t = tally(result);
  const listKey = v.kind === "state" ? "states" : "nodes", edgeKey = v.kind === "state" ? "transitions" : "edges";
  v[listKey] = Array.isArray(v[listKey]) ? [...v[listKey]] : [];
  v[edgeKey] = (Array.isArray(v[edgeKey]) ? v[edgeKey] : []).filter(isObj).map((e) => ({...e}));
  const has = (n) => v[listKey].includes(n) || v[edgeKey].some((e) => e.from === n || e.to === n);
  const edge = (f, to) => v[edgeKey].find((e) => e.from === f && e.to === to);
  const key = (f, to) => `${f}>${to}`;
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS[v.kind].includes(op.op)) continue;
    t.track(op, () => {
      switch (op.op) {
        case "addBox":
          if (Object.hasOwn(nodes, op.node)) return t.stale(op, `id ${op.node} is taken`);
          nodes[op.node] = {name: op.name.trim()};
          v[listKey].push(op.node);
          marks.nodes[op.node] = {mark: "add"};
          return;
        case "addEdge":
          if (!has(op.from) || !has(op.to)) return t.stale(op, "a box on this line is not in the picture");
          if (edge(op.from, op.to)) return t.done(op);
          v[edgeKey].push({from: op.from, to: op.to, ...(op.label ? {label: op.label} : {})});
          marks.links[key(op.from, op.to)] = {mark: "add"};
          return;
        case "editEdge": {
          const e = edge(op.from, op.to);
          if (!e) return t.stale(op, "no such line");
          if ((e.label ?? "") === op.label) return t.done(op);
          const was = e.label ?? "";
          if (op.label) e.label = op.label;
          else delete e.label;
          marks.links[key(op.from, op.to)] ||= {mark: "change", was};
          return;
        }
        case "removeEdge": {
          const e = edge(op.from, op.to);
          if (!e) return t.done(op);
          if (marks.links[key(op.from, op.to)]?.mark === "add") {
            v[edgeKey].splice(v[edgeKey].indexOf(e), 1);
            delete marks.links[key(op.from, op.to)];
          } else marks.links[key(op.from, op.to)] = {mark: "remove"};
          return;
        }
        case "editNode":
          return editNodeIn(has, nodes, op, marks, t);
        case "remove":
          if (!has(op.node)) return t.done(op);
          if (marks.nodes[op.node]?.mark === "add") {
            v[listKey] = v[listKey].filter((x) => x !== op.node);
            v[edgeKey] = v[edgeKey].filter((e) => e.from !== op.node && e.to !== op.node);
            delete nodes[op.node];
            delete marks.nodes[op.node];
          } else marks.nodes[op.node] = {...marks.nodes[op.node], mark: "remove"};
      }
    });
  }
  for (const e of v[edgeKey]) if (marks.nodes[e.from]?.mark === "remove" || marks.nodes[e.to]?.mark === "remove") marks.links[key(e.from, e.to)] ||= {mark: "remove"};
}

// A Kubernetes picture: its lines are like a map's; a new box joins the targets on the right.
function applyK8s(v, nodes, ops, result) {
  const marks = result.marks, t = tally(result);
  v.targets = Array.isArray(v.targets) ? [...v.targets] : [];
  v.links = (Array.isArray(v.links) ? v.links : []).filter(isObj).map((l) => ({...l}));
  const ids = () => new Set([...(v.outside || []), ...(v.configs || []), ...v.targets, ...(v.policy ? [v.policy] : []), ...(v.workloads || []).map((w) => w?.node)]);
  const has = (n) => ids().has(n);
  const link = (f, to) => v.links.find((l) => l.from === f && l.to === to);
  const key = (f, to) => `${f}>${to}`;
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS.k8s.includes(op.op)) continue;
    t.track(op, () => {
      switch (op.op) {
        case "addBox":
          if (Object.hasOwn(nodes, op.node)) return t.stale(op, `id ${op.node} is taken`);
          nodes[op.node] = {name: op.name.trim()};
          v.targets.push(op.node);
          marks.nodes[op.node] = {mark: "add"};
          return;
        case "addLink":
          if (!has(op.from) || !has(op.to)) return t.stale(op, "a box on this line is not in the picture");
          if (link(op.from, op.to)) return t.done(op);
          v.links.push({from: op.from, to: op.to, ...(op.label ? {label: op.label} : {}), ...(op.state ? {state: op.state} : {})});
          marks.links[key(op.from, op.to)] = {mark: "add"};
          return;
        case "editLink": {
          const l = link(op.from, op.to);
          if (!l) return t.stale(op, "no such line");
          const was = {label: l.label ?? "", state: l.state ?? "ok"};
          const changed = ["label", "state"].filter((k) => op[k] != null && (op[k] || (k === "state" ? "ok" : "")) !== was[k]);
          if (!changed.length) return t.done(op);
          for (const k of changed) {
            if (op[k] === "" || (k === "state" && op[k] === "ok")) delete l[k];
            else l[k] = op[k];
          }
          marks.links[key(op.from, op.to)] ||= {mark: "change", was};
          return;
        }
        case "removeLink": {
          const l = link(op.from, op.to);
          if (!l) return t.done(op);
          if (marks.links[key(op.from, op.to)]?.mark === "add") {
            v.links.splice(v.links.indexOf(l), 1);
            delete marks.links[key(op.from, op.to)];
          } else marks.links[key(op.from, op.to)] = {mark: "remove"};
          return;
        }
        case "editNode":
          return editNodeIn(has, nodes, op, marks, t);
        case "remove":
          if (!has(op.node)) return t.done(op);
          if (marks.nodes[op.node]?.mark === "add") {
            v.targets = v.targets.filter((x) => x !== op.node);
            v.links = v.links.filter((l) => l.from !== op.node && l.to !== op.node);
            delete nodes[op.node];
            delete marks.nodes[op.node];
          } else marks.nodes[op.node] = {...marks.nodes[op.node], mark: "remove"};
      }
    });
  }
  for (const l of v.links) if (marks.nodes[l.from]?.mark === "remove" || marks.nodes[l.to]?.mark === "remove") marks.links[key(l.from, l.to)] ||= {mark: "remove"};
}

// The draft in words the agent can act on without opening plan.json: names next to ids, zones by label.
export function describeDraft(plan, draft, viewId) {
  const applied = applyDraft(plan, draft, viewId), {stale, pending, plan: drawn} = applied;
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
    for (const k of ["node", "from", "to", "table"]) if (out[k] != null && !((o.op === "move" || o.op === "moveTable") && k !== "node") && !["moveZone", "addNode", "addTable", "addBox"].includes(o.op)) out[k] = named(out[k]);
    return out;
  };
  // Taking out a box takes its lines too: say which, so the agent need not look them up.
  const real = viewList(plan).find((x) => x?.id === viewId);
  const linesOf = (n) => (Array.isArray(real?.links) ? real.links : []).filter((l) => l?.from === n || l?.to === n).map((l) => `${named(l.from)} → ${named(l.to)}${l.label ? ` ${l.label}` : ""}`);
  // Columns elsewhere that keep a copy of a column taken out.
  const copiesOf = (k) => (Array.isArray(real?.tables) ? real.tables : []).flatMap((tb) => (tb?.columns || []).filter((c) => c?.copy === k).map((c) => `${tb.node}.${c.name}`));
  const changes = ops.filter((o) => pending.includes(o.id)).map(words).map((c) => {
    const o = ops.find((x) => x.id === c.id);
    if (o.op === "remove" && linesOf(o.node).length) return {...c, lines: linesOf(o.node)};
    if (o.op === "removeColumn" && copiesOf(`${o.table}.${o.column}`).length) return {...c, copies: copiesOf(`${o.table}.${o.column}`)};
    return applied.lanes?.[o.id] ? {...c, ...applied.lanes[o.id], laneTitle: applied.lanes[o.id].laneTitle} : c;
  });
  const staleOut = stale.map((s) => ({...words(ops.find((o) => o.id === s.id)), why: s.why}));
  // A flow's lanes in their order after the draft (for a plan of steps: "step id: title"), so numbers need no counting.
  const order = applied.order && changes.some((c) => ["addBox", "moveBox", "addLane", "editLane", "moveLane"].includes(c.op)) ? {lanesAfter: applied.order} : {};
  return {view: viewId, changes, ...order, ...(staleOut.length ? {stale: staleOut} : {})};
}

// "lane 2 "Build"" (step build): numbers count from 1 here, from 0 in the JSON.
const laneWords = (c) => `lane ${(c.lane ?? 0) + 1}${c.laneTitle ? ` "${c.laneTitle}"` : ""}${c.step ? ` (step ${c.step})` : ""}`;

// One line per change, for `walkboard draft` and the page's list.
export function draftLine(c) {
  const z = (x) => (x ? `"${x}"` : "the top");
  switch (c.op) {
    case "addNode": return `+ box ${c.name} (${c.node}) in ${z(c.zone)}${c.what ? `: ${JSON.stringify(c.what)}` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "addZone": return `+ zone ${z(c.zone)} in ${z(c.parent)}`;
    case "addLink": return `+ line ${c.from} → ${c.to}${c.label ? ` ${c.label}` : ""}${c.state ? ` [${c.state}]` : ""}`;
    case "editLink": return `~ line ${c.from} → ${c.to}${c.label != null ? ` label ${JSON.stringify(c.label)}` : ""}${c.state ? ` [${c.state}]` : ""}`;
    case "removeLink": return `− line ${c.from} → ${c.to}`;
    case "editNode": return `~ box ${c.node}: ${["name", "what", "icon"].filter((k) => c[k] != null).map((k) => `${k} ${JSON.stringify(c[k])}`).join(", ")}`;
    case "editZone": return `~ zone ${z(c.zone)} → ${z(c.label)}`;
    case "remove": return `− box ${c.node}${c.lines?.length ? ` (and its lines: ${c.lines.join("; ")})` : ""}`;
    case "removeZone": return `− zone ${z(c.zone)}`;
    case "move": return `↦ box ${c.node} → ${z(c.to)}`;
    case "moveZone": return `↦ zone ${z(c.zone)} → ${z(c.to)}`;
    case "addTable": return `+ table ${c.name} (${c.node})${c.group ? ` in group "${c.group}"` : ""}`;
    case "addColumn": return `+ column ${c.table}: ${c.column}${c.type ? ` ${c.type}` : ""}${c.key ? ` [${c.key}]` : ""}`;
    case "editColumn": return `~ column ${c.table}: ${c.column} ${["name", "type", "key", "ref"].filter((k) => c[k] != null).map((k) => (k === "ref" ? (c.ref ? `→ ${c.ref} (foreign key)` : "foreign key taken out") : `${k} ${JSON.stringify(c[k])}`)).join(", ")}`;
    case "removeColumn": return `− column ${c.table}: ${c.column}${c.copies?.length ? ` (copies kept in ${c.copies.join(", ")})` : ""}`;
    case "moveTable": return `↦ table ${c.node} → ${c.to ? `group "${c.to}"` : "no group"}`;
    case "addGroup": return `+ group "${c.group}" with ${c.tables.join(", ")}`;
    case "editGroup": return `~ group "${c.group}" → "${c.label}"`;
    case "removeGroup": return `− group "${c.group}"`;
    case "addBox": return `+ box ${c.name} (${c.node})${c.lane != null ? ` in ${laneWords(c)}` : ""}${c.at != null ? `, place ${c.at + 1}` : ""}`;
    case "moveBox": return `↦ box ${c.node} → ${laneWords(c)}${c.at != null ? `, place ${c.at + 1}` : ""}`;
    case "addLane": return `+ lane "${c.title}"${c.at != null ? ` at place ${c.at + 1}` : ""}`;
    case "editLane": return `~ ${laneWords(c)} → "${c.title}"`;
    case "moveLane": return `↦ ${laneWords(c)} → place ${c.to + 1}${c.before != null ? ` (before "${c.before}")` : ""}`;
    case "addEdge": return `+ line ${c.from} → ${c.to}${c.label ? ` "${c.label}"` : ""}`;
    case "editEdge": return `~ line ${c.from} → ${c.to}: label ${JSON.stringify(c.label)}`;
    case "removeEdge": return `− line ${c.from} → ${c.to}`;
    default: return JSON.stringify(c);
  }
}
