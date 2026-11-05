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
  map: ["addNode", "addZone", "addLink", "editLink", "removeLink", "reverseLink", "editNode", "editZone", "remove", "removeZone", "move", "moveZone"],
  datamodel: ["addTable", "addColumn", "editColumn", "removeColumn", "moveTable", "addGroup", "editGroup", "removeGroup", "editNode", "remove", "editRelation", "removeRelation"],
  flow: ["addBox", "moveBox", "addLane", "editLane", "moveLane", "editNode", "remove"],
  state: ["addBox", "addEdge", "editEdge", "removeEdge", "reverseEdge", "editNode", "remove", "setStart", "setEnd"],
  decision: ["addBox", "addEdge", "editEdge", "removeEdge", "reverseEdge", "editNode", "remove", "setStart", "setShape"],
  impact: ["addBox", "addEdge", "removeEdge", "reverseEdge", "editNode", "remove"],
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
// A kind as "profile:key" (which ones exist is lib/profiles.mjs's business), or "" for none.
const kindName = (x) => x == null || x === "" || (typeof x === "string" && /^[a-z0-9]{1,20}:[a-z0-9]{1,30}$/.test(x));
// A kind's fields: a few short words each.
const propsOk = (x) => x == null || (isObj(x) && Object.keys(x).length <= 12 && Object.entries(x).every(([k, w]) => /^[A-Za-z][\w-]{0,30}$/.test(k) && !BAD_KEYS.has(k) && typeof w === "string" && w.length <= 80 && plain(w)));
const kindOfOp = (op) => ({...(op.kind ? {kind: op.kind} : {}), ...(op.kind && op.props && Object.keys(op.props).length ? {props: {...op.props}} : {})});
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
  // kind: what it is on a platform ("aws:rds", lib/profiles.mjs; "" = none, drawn freely), props: that kind's fields.
  addNode: {node: isNewId, name: text, what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60), zone: label, at, kind: kindName, props: propsOk},
  addZone: {zone: label, parent: (x) => x === "" || label(x), at, icon: (x) => optText(x, 60), note: (x) => optText(x, 120), kind: kindName, props: propsOk},
  // replaces: the line it was before an end was dragged to another box (a removeLink of that line goes with it).
  addLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x), kind: kindName, replaces: (x) => isObj(x) && id(x.from) && id(x.to) && Object.keys(x).length === 2},
  editLink: {from: id, to: id, label: (x) => optText(x, 40), state: (x) => x == null || LINK_STATES.includes(x), kind: kindName},
  removeLink: {from: id, to: id},
  // The line from → to points the other way (to → from), keeping its label and kind.
  reverseLink: {from: id, to: id},
  editNode: {node: id, name: (x) => x == null || text(x), what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60), kind: kindName, props: propsOk},
  // A zone's new name (label), icon or note ("" takes an icon or a note away); at least one of them.
  editZone: {zone: label, label: (x) => x == null || label(x), icon: (x) => optText(x, 60), note: (x) => optText(x, 120), kind: kindName, props: propsOk},
  remove: {node: id},
  removeZone: {zone: label},
  move: {node: id, to: label, from: (x) => x == null || label(x), at},
  moveZone: {zone: label, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x), at},
  addTable: {node: isNewId, name: text, what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60), group: (x) => x == null || label(x), at},
  addColumn: {table: id, column: colName, type: (x) => optText(x, 40), key: (x) => optText(x, 12), ref: (x) => x == null || x === "" || colRef(x), at},
  editColumn: {table: id, column: colName, name: (x) => x == null || colName(x), type: (x) => optText(x, 40), key: (x) => optText(x, 12), ref: (x) => x == null || x === "" || colRef(x)},
  removeColumn: {table: id, column: colName},
  moveTable: {node: id, to: (x) => x === "" || label(x), from: (x) => x == null || x === "" || label(x)},
  addGroup: {group: label, tables: (x) => Array.isArray(x) && x.length > 0 && x.length <= 50 && x.every(id), icon: (x) => optText(x, 60), note: (x) => optText(x, 120)},
  // As a zone: its new name (label), icon or note ("" takes an icon or a note away); at least one of them.
  editGroup: {group: label, label: (x) => x == null || label(x), icon: (x) => optText(x, 60), note: (x) => optText(x, 120)},
  removeGroup: {group: label},
  // A line between two columns: how many rows on each end (from:to), or taken out when it is a relation (a ref goes with editColumn).
  editRelation: {from: colRef, to: colRef, kind: (x) => typeof x === "string" && /^[1NM]:[1NM]$/.test(x)},
  removeRelation: {from: colRef, to: colRef},
  // Where a state or decision picture starts ("" = nowhere in particular), and whether a state is an end.
  setStart: {node: (x) => x === "" || id(x)},
  setEnd: {node: id, end: (x) => typeof x === "boolean"},
  // What a decision box is: a question, a step or an end ("" = drawn from its lines again).
  setShape: {node: id, shape: (x) => ["question", "step", "end", ""].includes(x)},
  // A lane is named by its title when it has one (laneTitle): its number shifts when another page adds or moves lanes.
  addBox: {node: isNewId, name: text, what: (x) => optText(x, DRAFT_MAX_NOTE), icon: (x) => optText(x, 60), lane: (x) => x == null || (Number.isInteger(x) && x >= 0 && x < 200), laneTitle: optText, at},
  // fromLane / fromLaneTitle: the lane it is taken from, since a box may sit in several (a plan of steps: several steps touch it).
  moveBox: {node: id, lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, fromLane: (x) => Number.isInteger(x) && x >= 0 && x < 200, fromLaneTitle: optText, at},
  addLane: {title: text, at},
  editLane: {lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, title: text},
  moveLane: {lane: (x) => Number.isInteger(x) && x >= 0 && x < 200, laneTitle: optText, to: (x) => Number.isInteger(x) && x >= 0 && x < 200},
  addEdge: {from: id, to: id, label: (x) => optText(x, 60)},
  editEdge: {from: id, to: id, label: (x) => typeof x === "string" && x.length <= 60 && plain(x)},
  removeEdge: {from: id, to: id},
  reverseEdge: {from: id, to: id},
};
const OPTIONAL = new Set(["what", "icon", "at", "label", "state", "name", "from", "group", "type", "key", "ref", "laneTitle", "fromLane", "fromLaneTitle", "note", "kind", "props", "replaces"]);

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
        if (op[k] == null && OPTIONAL.has(k)) continue;
        if (!ok(op[k])) out.push(`${at} (${op.op}): bad ${k}`);
      }
      for (const k of Object.keys(op)) if (k !== "id" && k !== "op" && !(k in shape)) out.push(`${at} (${op.op}): unknown field ${k}`);
      if (["addLink", "editLink", "removeLink", "reverseLink", "reverseEdge"].includes(op.op) && op.from === op.to) out.push(`${at}: a line needs two different boxes`);
      if ((op.op === "editRelation" || op.op === "removeRelation") && op.from == null) out.push(`${at} (${op.op}): needs from`);
      if ((op.op === "editZone" || op.op === "editGroup") && op.label == null && op.icon == null && op.note == null && op.kind == null && op.props == null) out.push(`${at} (${op.op}): needs a label, an icon or a note`);
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
  const found = views.find((x) => x?.id === viewId) || null, real = found;
  result.view = real;
  const ops = Array.isArray(draft?.views?.[viewId]?.ops) ? draft.views[viewId].ops : [];
  if (!real || !ops.length || !draftable(found)) return result;
  const v = structuredClone(real);
  const nodes = {...(isObj(plan.nodes) ? plan.nodes : {})};
  const others = {datamodel: applyTables, flow: applyFlow, state: applyGraph, decision: applyGraph, impact: applyGraph};
  if (others[v.kind]) {
    others[v.kind](v, nodes, ops, result);
    result.plan = {...plan, nodes, views: views.map((x) => (x === found ? v : x))};
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
  // A line the draft turned round is still found by the ends it had in the plan.
  const flipped = new Set();
  const lineOf = (from, to) => link(from, to) || (flipped.has(key(from, to)) ? link(to, from) : undefined);
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
            nodes[op.node] = {name: op.name.trim(), ...(op.what ? {what: op.what} : {}), ...(op.icon ? {icon: op.icon} : {}), ...kindOfOp(op)};
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
          insert(p ? (p.z.zones ||= []) : v.zones, {label: op.zone, ...(op.icon ? {icon: op.icon} : {}), ...(op.note ? {note: op.note} : {}), ...kindOfOp(op), nodes: []}, op.at);
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
          v.links.push({from, to, ...(op.label ? {label: op.label} : {}), ...(op.state ? {state: op.state} : {}), ...(op.kind ? {kind: op.kind} : {})});
          marks.links[key(from, to)] = {mark: "add"};
        }
        break;
      }
      case "editLink": {
        const from = r(op.from), to = r(op.to), l = lineOf(from, to);
        if (!l && need(op, [from, to].filter((n) => !home(n)).map((n) => "n:" + n))) return;
        if (!l) {
          stale(op, "no such line");
          break;
        }
        const was = {label: l.label ?? "", state: l.state ?? "ok", kind: l.kind ?? ""};
        const changed = ["label", "state", "kind"].filter((k) => op[k] != null && (op[k] || (k === "state" ? "ok" : "")) !== was[k]);
        if (!changed.length) {
          done(op);
          break;
        }
        for (const k of changed) {
          if (op[k] === "" || (k === "state" && op[k] === "ok")) delete l[k];
          else l[k] = op[k];
        }
        if (!was.kind) delete was.kind;
        marks.links[key(l.from, l.to)] ||= {mark: "change", was};
        break;
      }
      case "removeLink": {
        const from = r(op.from), to = r(op.to), l = lineOf(from, to), k = l && key(l.from, l.to);
        if (!l) done(op);
        else if (marks.links[k]?.mark === "add") {
          v.links.splice(v.links.indexOf(l), 1);
          delete marks.links[k];
        } else marks.links[k] = {mark: "remove"};
        break;
      }
      case "reverseLink": {
        const from = r(op.from), to = r(op.to), l = link(from, to);
        if (!l && need(op, [from, to].filter((n) => !home(n)).map((n) => "n:" + n))) return;
        // The agent turned it round already.
        if (!l && link(to, from)) done(op);
        else if (!l) stale(op, "no such line");
        else if (link(to, from)) stale(op, "a line already goes the other way");
        else {
          l.from = to;
          l.to = from;
          flipped.add(key(from, to));
          const m = marks.links[key(from, to)];
          delete marks.links[key(from, to)];
          marks.links[key(to, from)] = m?.mark === "add" ? m : {...(m || {mark: "change"}), reversed: true};
        }
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
        const changed = ["name", "what", "icon", "kind"].filter((k) => op[k] != null && op[k] !== (cur[k] ?? ""));
        if (op.props != null && JSON.stringify(op.props) !== JSON.stringify(cur.props || {})) changed.push("props");
        if (!changed.length) {
          done(op);
          break;
        }
        const was = Object.fromEntries(changed.map((k) => [k, k === "props" ? cur.props || {} : cur[k] ?? ""]));
        nodes[n] = {...cur, ...Object.fromEntries(changed.map((k) => [k, op[k]]))};
        for (const k of changed) if (nodes[n][k] === "" || (k === "props" && !Object.keys(nodes[n].props).length)) delete nodes[n][k];
        if (!marks.nodes[n]) marks.nodes[n] = {mark: "change", was};
        else if (marks.nodes[n].mark === "change" || marks.nodes[n].mark === "move") marks.nodes[n].was = {...was, ...marks.nodes[n].was};
        break;
      }
      case "editZone": {
        const w = zone(op.zone), renaming = op.label != null && op.label !== op.zone;
        if (!w && need(op, ["z:" + op.zone])) return;
        // The agent renamed it already.
        if (!w && renaming && zone(op.label)) done(op);
        else if (!w) stale(op, `no zone "${op.zone}"`);
        else if (renaming && zone(op.label)) stale(op, `a zone is already called "${op.label}"`);
        else {
          const changed = ["icon", "note", "kind"].filter((k) => op[k] != null && op[k] !== (w.z[k] ?? ""));
          if (op.props != null && JSON.stringify(op.props) !== JSON.stringify(w.z.props || {})) changed.push("props");
          if (!renaming && !changed.length) {
            done(op);
            break;
          }
          for (const k of changed) {
            if (op[k] === "" || (k === "props" && !Object.keys(op.props).length)) delete w.z[k];
            else w.z[k] = op[k];
          }
          const now = renaming ? op.label : op.zone, m = marks.zones[op.zone];
          if (renaming) {
            w.z.label = op.label;
            delete marks.zones[op.zone];
          }
          marks.zones[now] = m?.mark === "add" ? m : {...(m || {mark: "change"}), was: m?.was ?? op.zone};
          if (renaming && marks.zones[now].mark === "move") marks.zones[now].renamedFrom = op.zone;
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
  result.plan = {...plan, nodes, views: views.map((x) => (x === found ? v : x))};
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
  v.relations = Array.isArray(v.relations) ? v.relations.filter(isObj) : [];
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
          nodes[op.node] = {name: op.name.trim(), ...(op.what ? {what: op.what} : {}), ...(op.icon ? {icon: op.icon} : {})};
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
          for (const rel of v.relations) {
            if (rel.from === k0) rel.from = `${n}.${op.name}`;
            if (rel.to === k0) rel.to = `${n}.${op.name}`;
          }
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
        // A group the draft itself added is not the plan moving it elsewhere.
        else if (op.from != null && from !== op.from && marks.nodes[n]?.mark !== "move" && marks.nodes[n]?.mark !== "add" && marks.zones[from]?.mark !== "add") stale(op, `the plan now puts it in "${from || "no group"}"`);
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
          v.groups.push({label: op.group, ...(op.icon ? {icon: op.icon} : {}), ...(op.note ? {note: op.note} : {}), tables: ids});
          marks.zones[op.group] = {mark: "add"};
        }
        break;
      }
      case "editGroup": {
        const g = group(op.group), renaming = op.label != null && op.label !== op.group;
        if (!g) stale(op, `no group "${op.group}"`);
        else if (renaming && group(op.label)) stale(op, `a group is already called "${op.label}"`);
        else {
          const changed = ["icon", "note"].filter((k) => op[k] != null && op[k] !== (g[k] ?? ""));
          if (!renaming && !changed.length) {
            done(op);
            break;
          }
          for (const k of changed) {
            if (op[k] === "") delete g[k];
            else g[k] = op[k];
          }
          const now = renaming ? op.label : op.group, m = marks.zones[op.group];
          if (renaming) {
            g.label = op.label;
            delete marks.zones[op.group];
          }
          marks.zones[now] = m?.mark === "add" ? m : {mark: "change", was: m?.was ?? op.group};
        }
        break;
      }
      case "editRelation": {
        const k = `${op.from}>${op.to}`, i = op.from.indexOf("."), c = col(r(op.from.slice(0, i)), op.from.slice(i + 1));
        const rel = v.relations.find((x) => x.from === op.from && x.to === op.to), m = marks.links[k];
        if (!rel && c?.ref !== op.to) stale(op, `no line from ${op.from} to ${op.to}`);
        else if ((rel ? rel.kind ?? "N:1" : "N:1") === op.kind) done(op);
        else {
          const was = rel ? rel.kind ?? "N:1" : "N:1";
          // A ref is always N:1: any other kind is a relation.
          if (rel) rel.kind = op.kind;
          else {
            delete c.ref;
            v.relations.push({from: op.from, to: op.to, kind: op.kind});
          }
          marks.links[k] = m?.mark === "add" ? m : {mark: "change", was};
        }
        break;
      }
      case "removeRelation": {
        const k = `${op.from}>${op.to}`;
        if (!v.relations.some((x) => x.from === op.from && x.to === op.to)) done(op);
        else marks.links[k] = {mark: "remove"};
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
        editNodeIn(() => true, nodes, {...op, node: n}, marks, {stale, done});
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
// A new box as the plan would hold it: its name, and the note and icon it was given.
const boxOf = (op) => ({name: op.name.trim(), ...(op.what ? {what: op.what} : {}), ...(op.icon ? {icon: op.icon} : {})});

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
  const laneIx = (op, title = op.laneTitle, n = op.lane) => {
    if (title) {
      const i = v.lanes.findIndex((l) => (l.title ?? "") === title);
      if (i >= 0) return i;
    }
    return n ?? 0;
  };
  // The lane a box is moved out of: the one the change names while the box is still there, else the first that has it.
  const fromIx = (op) => {
    const i = op.fromLane != null || op.fromLaneTitle ? laneIx(op, op.fromLaneTitle, op.fromLane) : -1;
    return v.lanes[i]?.nodes.includes(op.node) ? i : laneOf(op.node);
  };
  result.lanes = {};
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS.flow.includes(op.op)) continue;
    // Which lane (and step) each change is about, in words: numbers alone shift as lanes come and go.
    if (["addBox", "moveBox", "editLane", "moveLane"].includes(op.op)) {
      const lane = v.lanes[laneIx(op)];
      if (lane) result.lanes[op.id] = {laneTitle: lane.title ?? "", ...(lane.step ? {step: lane.step} : {})};
      // Out of which lane, when it changes lanes: the agent then knows which step no longer touches the box.
      const from = op.op === "moveBox" ? v.lanes[fromIx(op)] : null;
      if (lane && from && from !== lane) Object.assign(result.lanes[op.id], {fromLaneTitle: from.title ?? "", ...(from.step ? {fromStep: from.step} : {})});
      if (op.op === "moveLane" && v.lanes[op.to] && v.lanes[op.to] !== lane) result.lanes[op.id].before = v.lanes[op.to].title ?? "";
    }
    t.track(op, () => {
      switch (op.op) {
        case "addBox": {
          const lane = v.lanes[laneIx(op)];
          if (Object.hasOwn(nodes, op.node)) return t.stale(op, `id ${op.node} is taken`);
          if (!lane) return t.stale(op, `no lane ${op.lane + 1}`);
          nodes[op.node] = boxOf(op);
          insert(lane.nodes, op.node, op.at);
          marks.nodes[op.node] = {mark: "add"};
          return;
        }
        case "moveBox": {
          const li = laneIx(op), from = fromIx(op), lane = v.lanes[li];
          if (from < 0) return t.stale(op, `no box ${op.node}`);
          if (!lane) return t.stale(op, `no lane ${op.lane + 1}`);
          // A box is in a lane once: a step already touching it is not touched twice.
          if (from !== li && lane.nodes.includes(op.node)) return t.stale(op, `box ${op.node} is already in lane ${li + 1}`);
          const at0 = v.lanes[from].nodes.indexOf(op.node);
          if (from === li && (op.at == null || op.at === at0)) return t.done(op);
          v.lanes[from].nodes.splice(at0, 1);
          insert(lane.nodes, op.node, op.at);
          // Which lane it went to: a box in several lanes is marked moved only there.
          (lane.movedIn ||= []).push(op.node);
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

// Turn a line round (graphs and k8s): find(from, to) gives a line as it stands; flip(line) records it.
function turn(find, op, t, flip, marks) {
  const l = find(op.from, op.to);
  if (!l && find(op.to, op.from)) return t.done(op);
  if (!l) return t.stale(op, "no such line");
  if (find(op.to, op.from)) return t.stale(op, "a line already goes the other way");
  l.from = op.to;
  l.to = op.from;
  flip(l);
  const was = `${op.from}>${op.to}`, now = `${op.to}>${op.from}`, m = marks.links[was];
  delete marks.links[was];
  marks.links[now] = m?.mark === "add" ? m : {...(m || {mark: "change"}), reversed: true};
}

// State, decision and impact pictures: boxes and the lines between them, laid out by the page.
function applyGraph(v, nodes, ops, result) {
  const marks = result.marks, t = tally(result);
  const listKey = v.kind === "state" ? "states" : "nodes", edgeKey = v.kind === "state" ? "transitions" : "edges";
  v[listKey] = Array.isArray(v[listKey]) ? [...v[listKey]] : [];
  v[edgeKey] = (Array.isArray(v[edgeKey]) ? v[edgeKey] : []).filter(isObj).map((e) => ({...e}));
  const has = (n) => v[listKey].includes(n) || v[edgeKey].some((e) => e.from === n || e.to === n);
  const edge0 = (f, to) => v[edgeKey].find((e) => e.from === f && e.to === to);
  const key = (f, to) => `${f}>${to}`;
  // A line the draft turned round is still found by the ends it had in the plan.
  const flipped = new Set();
  const edge = (f, to) => edge0(f, to) || (flipped.has(key(f, to)) ? edge0(to, f) : undefined);
  for (const op of ops) {
    if (!isObj(op) || !Object.hasOwn(SHAPES, op.op) || !DRAFT_OPS[v.kind].includes(op.op)) continue;
    t.track(op, () => {
      switch (op.op) {
        case "addBox":
          if (Object.hasOwn(nodes, op.node)) return t.stale(op, `id ${op.node} is taken`);
          nodes[op.node] = boxOf(op);
          v[listKey].push(op.node);
          marks.nodes[op.node] = {mark: "add"};
          return;
        case "addEdge":
          if (!has(op.from) || !has(op.to)) return t.stale(op, "a box on this line is not in the picture");
          if (edge0(op.from, op.to)) return t.done(op);
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
          marks.links[key(e.from, e.to)] ||= {mark: "change", was};
          return;
        }
        case "removeEdge": {
          const e = edge(op.from, op.to), k = e && key(e.from, e.to);
          if (!e) return t.done(op);
          if (marks.links[k]?.mark === "add") {
            v[edgeKey].splice(v[edgeKey].indexOf(e), 1);
            delete marks.links[k];
          } else marks.links[k] = {mark: "remove"};
          return;
        }
        case "reverseEdge":
          return turn(edge0, op, t, () => flipped.add(key(op.from, op.to)), marks);
        case "editNode":
          return editNodeIn(has, nodes, op, marks, t);
        case "setStart": {
          if (op.node && !has(op.node)) return t.stale(op, `no box ${op.node}`);
          const was = v.start ?? "";
          if (was === op.node) return t.done(op);
          if (op.node) v.start = op.node;
          else delete v.start;
          // Both boxes change: the one it leaves and the one it reaches.
          for (const n of [was, op.node]) if (n && has(n)) marks.nodes[n] ||= {mark: "change"};
          return;
        }
        case "setShape": {
          if (!has(op.node)) return t.stale(op, `no box ${op.node}`);
          const shapes = isObj(v.shapes) ? {...v.shapes} : {};
          if ((shapes[op.node] ?? "") === op.shape) return t.done(op);
          if (op.shape) shapes[op.node] = op.shape;
          else delete shapes[op.node];
          if (Object.keys(shapes).length) v.shapes = shapes;
          else delete v.shapes;
          marks.nodes[op.node] ||= {mark: "change"};
          return;
        }
        case "setEnd": {
          if (!has(op.node)) return t.stale(op, `no box ${op.node}`);
          const ends = Array.isArray(v.end) ? v.end : [];
          if (ends.includes(op.node) === op.end) return t.done(op);
          v.end = op.end ? [...ends, op.node] : ends.filter((x) => x !== op.node);
          marks.nodes[op.node] ||= {mark: "change"};
          return;
        }
        case "remove":
          if (!has(op.node)) return t.done(op);
          if (marks.nodes[op.node]?.mark === "add") {
            v[listKey] = v[listKey].filter((x) => x !== op.node);
            if (v.start === op.node) delete v.start;
            if (Array.isArray(v.end)) v.end = v.end.filter((x) => x !== op.node);
            v[edgeKey] = v[edgeKey].filter((e) => e.from !== op.node && e.to !== op.node);
            delete nodes[op.node];
            delete marks.nodes[op.node];
          } else marks.nodes[op.node] = {...marks.nodes[op.node], mark: "remove"};
      }
    });
  }
  for (const e of v[edgeKey]) if (marks.nodes[e.from]?.mark === "remove" || marks.nodes[e.to]?.mark === "remove") marks.links[key(e.from, e.to)] ||= {mark: "remove"};
}


// The draft in words the agent can act on without opening plan.json: names next to ids, zones by label, what an
// edit changes from (`was`), and with profiles (lib/profiles.mjs, passed in: this module imports nothing) the name of
// each kind and the places the draft puts something where its kind does not usually go (`warnings`).
export function describeDraft(plan, draft, viewId, profiles = null) {
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
  // A zone of the plan by its label, anywhere in the tree.
  const zoneOf = (label, zs, depth = 0) => {
    for (const z of Array.isArray(zs) && depth < 9 ? zs : []) {
      if (!isObj(z)) continue;
      if (z.label === label) return z;
      const inner = zoneOf(label, z.zones, depth + 1);
      if (inner) return inner;
    }
    return null;
  };
  // What an edit changes, as the plan has it now (null: not set).
  const wasOf = (o) => {
    const keys = {editNode: ["name", "what", "icon", "kind", "props"], editLink: ["label", "state", "kind"], editZone: ["label", "note", "icon", "kind", "props"]}[o.op];
    const before = o.op === "editNode" ? plan?.nodes?.[o.node] : o.op === "editLink" ? (Array.isArray(real?.links) ? real.links : []).find((l) => l?.from === o.from && l?.to === o.to) : zoneOf(o.zone, real?.zones);
    if (!keys || !isObj(before)) return null;
    const out = Object.fromEntries(keys.filter((k) => o[k] != null && !(o.op === "editZone" && k === "label")).map((k) => [k, before[k] ?? null]));
    return Object.keys(out).length ? out : null;
  };
  // "Lambda function (AWS)": the kind's name, for a box, zone or line.
  const kindLabel = (o) => {
    if (!profiles || !o.kind) return null;
    const k = (o.op === "addLink" || o.op === "editLink" ? profiles.lineKindOf : profiles.kindOf)(o.kind);
    return k ? `${k.def.name} (${profiles.PROFILES[k.profile].label})` : null;
  };
  const changes = ops.filter((o) => pending.includes(o.id)).map(words).map((c) => {
    const o = ops.find((x) => x.id === c.id);
    const was = wasOf(o), kindName = kindLabel(o);
    if (was) c.was = was;
    if (kindName) c.kindName = kindName;
    if (o.replaces) c.replaces = `${named(o.replaces.from)} → ${named(o.replaces.to)}`;
    if (o.op === "remove" && linesOf(o.node).length) return {...c, lines: linesOf(o.node)};
    if (o.op === "removeColumn" && copiesOf(`${o.table}.${o.column}`).length) return {...c, copies: copiesOf(`${o.table}.${o.column}`)};
    // The lane a box left is said only when it changed lanes, as the draft stands now.
    const {fromLane, fromLaneTitle, ...rest} = c;
    return applied.lanes?.[o.id] ? {...rest, ...applied.lanes[o.id], laneTitle: applied.lanes[o.id].laneTitle} : rest;
  });
  const staleOut = stale.map((s) => ({...words(ops.find((o) => o.id === s.id)), why: s.why}));
  // A flow's lanes in their order after the draft (for a plan of steps: "step id: title"), so numbers need no counting.
  const order = applied.order && changes.some((c) => ["addBox", "moveBox", "addLane", "editLane", "moveLane"].includes(c.op)) ? {lanesAfter: applied.order} : {};
  // Places the draft puts a box or zone where its kind does not usually sit (those the plan already has are left out).
  let warnings = [];
  if (profiles?.mapWarnings && real?.kind === "map" && changes.length) {
    const said = (w) => JSON.stringify([w.node ?? null, w.zone ?? null, w.kind, w.there]);
    const before = new Set(profiles.mapWarnings(real, plan?.nodes).map(said));
    warnings = profiles.mapWarnings(applied.view, nodes).filter((w) => !before.has(said(w)))
      .map((w) => ({...(w.node ? {node: named(w.node)} : {zone: w.zone}), kind: w.kind, in: w.there, usuallyIn: w.usual}));
  }
  return {view: viewId, changes, ...order, ...(staleOut.length ? {stale: staleOut} : {}), ...(warnings.length ? {warnings} : {})};
}

// " (aws:rds, engine postgres)": a kind and its fields in a change's words.
const kindWords = (c) => (c.kind ? ` (${[c.kindName ? `${c.kindName}, ${c.kind}` : c.kind, ...Object.entries(c.props || {}).map(([k, w]) => `${k} ${w}`)].join(", ")})` : "");
// " (was "Old name")": what an edit changes from.
const wasWords = (c, k) => (c.was && k in c.was ? ` (was ${JSON.stringify(c.was[k])})` : "");
// "lane 2 "Build"" (step build): numbers count from 1 here, from 0 in the JSON.
const laneWords = (c) => `lane ${(c.lane ?? 0) + 1}${c.laneTitle ? ` "${c.laneTitle}"` : ""}${c.step ? ` (step ${c.step})` : ""}`;

// One line per change, for `walkboard draft` and the page's list.
export function draftLine(c) {
  const z = (x) => (x ? `"${x}"` : "the top");
  switch (c.op) {
    case "addNode": return `+ box ${c.name} (${c.node}) in ${z(c.zone)}${kindWords(c)}${c.what ? `: ${JSON.stringify(c.what)}` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "addZone": return `+ zone ${z(c.zone)} in ${z(c.parent)}${kindWords(c)}${c.note ? ` (${JSON.stringify(c.note)})` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "addLink": return `+ line ${c.from} → ${c.to}${c.label ? ` ${c.label}` : ""}${c.state ? ` [${c.state}]` : ""}${c.kind ? ` kind ${c.kindName ? `${c.kindName}, ${c.kind}` : c.kind}` : ""}${c.replaces ? ` (instead of ${c.replaces})` : ""}`;
    case "reverseLink": return `⇄ line ${c.from} → ${c.to} turned round: now ${c.to} → ${c.from}`;
    case "editLink": return `~ line ${c.from} → ${c.to}${c.label != null ? ` label ${JSON.stringify(c.label)}${wasWords(c, "label")}` : ""}${c.state ? ` [${c.state}]${wasWords(c, "state")}` : ""}${c.kind != null ? ` kind ${JSON.stringify(c.kind)}${c.kindName ? ` ${c.kindName}` : ""}${wasWords(c, "kind")}` : ""}`;
    case "removeLink": return `− line ${c.from} → ${c.to}`;
    case "editNode": return `~ box ${c.node}: ${["name", "what", "icon", "kind", "props"].filter((k) => c[k] != null).map((k) => `${k} ${JSON.stringify(c[k])}${k === "kind" && c.kindName ? ` ${c.kindName}` : ""}${wasWords(c, k)}`).join(", ")}`;
    case "editZone": return `~ zone ${z(c.zone)}${c.label != null ? ` → ${z(c.label)}` : ""}${c.note != null ? `, note ${JSON.stringify(c.note)}` : ""}${c.icon != null ? `, icon ${JSON.stringify(c.icon)}` : ""}${c.kind != null ? `, kind ${JSON.stringify(c.kind)}` : ""}${c.props != null ? `, props ${JSON.stringify(c.props)}` : ""}`;
    case "remove": return `− box ${c.node}${c.lines?.length ? ` (and its lines: ${c.lines.join("; ")})` : ""}`;
    case "removeZone": return `− zone ${z(c.zone)}`;
    case "move": return `↦ box ${c.node} → ${z(c.to)}`;
    case "moveZone": return `↦ zone ${z(c.zone)} → ${z(c.to)}`;
    case "addTable": return `+ table ${c.name} (${c.node})${c.group ? ` in group "${c.group}"` : ""}${c.what ? `: ${JSON.stringify(c.what)}` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "addColumn": return `+ column ${c.table}: ${c.column}${c.type ? ` ${c.type}` : ""}${c.key ? ` [${c.key}]` : ""}`;
    case "editColumn": return `~ column ${c.table}: ${c.column} ${["name", "type", "key", "ref"].filter((k) => c[k] != null).map((k) => (k === "ref" ? (c.ref ? `→ ${c.ref} (foreign key)` : "foreign key taken out") : `${k} ${JSON.stringify(c[k])}`)).join(", ")}`;
    case "removeColumn": return `− column ${c.table}: ${c.column}${c.copies?.length ? ` (copies kept in ${c.copies.join(", ")})` : ""}`;
    case "moveTable": return `↦ table ${c.node} → ${c.to ? `group "${c.to}"` : "no group"}`;
    case "addGroup": return `+ group "${c.group}" with ${c.tables.join(", ")}${c.note ? ` (${JSON.stringify(c.note)})` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "editGroup": return `~ group "${c.group}"${c.label != null ? ` → "${c.label}"` : ""}${c.note != null ? `, note ${JSON.stringify(c.note)}` : ""}${c.icon != null ? `, icon ${JSON.stringify(c.icon)}` : ""}`;
    case "removeGroup": return `− group "${c.group}"`;
    case "setStart": return c.node ? `~ starts at ${c.node}` : "~ no start";
    case "setEnd": return `~ ${c.node}: ${c.end ? "an end state" : "no longer an end state"}`;
    case "setShape": return `~ ${c.node}: ${c.shape ? `a ${c.shape === "end" ? "way it ends" : c.shape}` : "shape from its lines"}`;
    case "editRelation": return `~ line ${c.from} → ${c.to}: ${c.kind}`;
    case "removeRelation": return `− line ${c.from} → ${c.to}`;
    case "addBox": return `+ box ${c.name} (${c.node})${c.lane != null ? ` in ${laneWords(c)}` : ""}${c.at != null ? `, place ${c.at + 1}` : ""}${c.what ? `: ${JSON.stringify(c.what)}` : ""}${c.icon ? ` icon "${c.icon}"` : ""}`;
    case "moveBox": return `↦ box ${c.node} → ${laneWords(c)}${c.at != null ? `, place ${c.at + 1}` : ""}${c.fromLaneTitle != null ? `, out of "${c.fromLaneTitle}"${c.fromStep ? ` (step ${c.fromStep})` : ""}` : ""}`;
    case "addLane": return `+ lane "${c.title}"${c.at != null ? ` at place ${c.at + 1}` : ""}`;
    case "editLane": return `~ ${laneWords(c)} → "${c.title}"`;
    case "moveLane": return `↦ ${laneWords(c)} → place ${c.to + 1}${c.before != null ? ` (before "${c.before}")` : ""}`;
    case "addEdge": return `+ line ${c.from} → ${c.to}${c.label ? ` "${c.label}"` : ""}`;
    case "editEdge": return `~ line ${c.from} → ${c.to}: label ${JSON.stringify(c.label)}`;
    case "removeEdge": return `− line ${c.from} → ${c.to}`;
    case "reverseEdge": return `⇄ line ${c.from} → ${c.to} turned round: now ${c.to} → ${c.from}`;
    default: return JSON.stringify(c);
  }
}
