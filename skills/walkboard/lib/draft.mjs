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
  datamodel: ["addTable", "addColumn", "editColumn", "removeColumn", "moveTable", "addGroup", "editGroup", "removeGroup", "editNode", "remove"],
};
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
  addTable: {node: isNewId, name: text, group: (x) => x == null || label(x), at},
  addColumn: {table: id, column: colName, type: (x) => optText(x, 40), key: (x) => optText(x, 12), at},
  editColumn: {table: id, column: colName, name: (x) => x == null || colName(x), type: (x) => optText(x, 40), key: (x) => optText(x, 12), ref: (x) => x == null || x === "" || colRef(x)},
  removeColumn: {table: id, column: colName},
  moveTable: {node: id, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x)},
  addGroup: {group: label, tables: (x) => Array.isArray(x) && x.length > 0 && x.length <= 50 && x.every(id)},
  editGroup: {group: label, label},
  removeGroup: {group: label},
};
const OPTIONAL = new Set(["what", "icon", "at", "label", "state", "name", "from", "group", "type", "key", "ref"]);

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
  const real = Array.isArray(plan?.views) ? plan.views.find((x) => x?.id === viewId) : null;
  result.view = real;
  const ops = Array.isArray(draft?.views?.[viewId]?.ops) ? draft.views[viewId].ops : [];
  if (!real || !ops.length || !draftable(real)) return result;
  const v = structuredClone(real);
  const nodes = {...(isObj(plan.nodes) ? plan.nodes : {})};
  if (v.kind === "datamodel") {
    applyTables(v, nodes, ops, result);
    result.plan = {...plan, nodes, views: plan.views.map((x) => (x === real ? v : x))};
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
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS[v.kind].includes(op.op)) continue;
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
        else {
          insert(tb.columns, {name: op.column, ...(op.type ? {type: op.type} : {}), ...(op.key ? {key: op.key} : {})}, op.at);
          marks.columns[`${n}.${op.column}`] = {mark: "add"};
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
    for (const k of ["node", "from", "to", "table"]) if (out[k] != null && !((o.op === "move" || o.op === "moveTable") && k !== "node") && o.op !== "moveZone" && o.op !== "addNode" && o.op !== "addTable") out[k] = named(out[k]);
    return out;
  };
  // Taking out a box takes its lines too: say which, so the agent need not look them up.
  const real = plan?.views?.find((x) => x?.id === viewId);
  const linesOf = (n) => (Array.isArray(real?.links) ? real.links : []).filter((l) => l?.from === n || l?.to === n).map((l) => `${named(l.from)} → ${named(l.to)}${l.label ? ` ${l.label}` : ""}`);
  const changes = ops.filter((o) => pending.includes(o.id)).map(words).map((c, i, all) => {
    const o = ops.find((x) => x.id === c.id);
    return o.op === "remove" && linesOf(o.node).length ? {...c, lines: linesOf(o.node)} : c;
  });
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
    case "remove": return `− box ${c.node}${c.lines?.length ? ` (and its lines: ${c.lines.join("; ")})` : ""}`;
    case "removeZone": return `− zone ${z(c.zone)}`;
    case "move": return `↦ box ${c.node} → ${z(c.to)}`;
    case "moveZone": return `↦ zone ${z(c.zone)} → ${z(c.to)}`;
    case "addTable": return `+ table ${c.name} (${c.node})${c.group ? ` in group "${c.group}"` : ""}`;
    case "addColumn": return `+ column ${c.table}: ${c.column}${c.type ? ` ${c.type}` : ""}${c.key ? ` [${c.key}]` : ""}`;
    case "editColumn": return `~ column ${c.table}: ${c.column} ${["name", "type", "key", "ref"].filter((k) => c[k] != null).map((k) => (k === "ref" ? (c.ref ? `→ ${c.ref} (foreign key)` : "foreign key taken out") : `${k} ${JSON.stringify(c[k])}`)).join(", ")}`;
    case "removeColumn": return `− column ${c.table}: ${c.column}`;
    case "moveTable": return `↦ table ${c.node} → ${c.to ? `group "${c.to}"` : "no group"}`;
    case "addGroup": return `+ group "${c.group}" with ${c.tables.join(", ")}`;
    case "editGroup": return `~ group "${c.group}" → "${c.label}"`;
    case "removeGroup": return `− group "${c.group}"`;
    default: return JSON.stringify(c);
  }
}
