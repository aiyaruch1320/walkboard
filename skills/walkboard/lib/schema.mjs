export const NODE_STATUS = {done: "done", new: "new", todo: "todo", ext: "ext"};
export const STEP_STATUS = {done: "done", doing: "doing", review: "review", todo: "todo"};
export const LINK_STATE = {ok: "ok", todo: "todo", blocked: "blocked", standby: "standby"};
export const LANGS = ["en", "th"];
export const teachBackOn = (p) => p?.settings?.teachBack !== false;
export const MODES = ["build", "explain", "design"];
export const BASIS = ["iac", "cli", "doc", "assumed"];
// A design score: 0-5, or "yes" / "no" / "na" for things that either work or do not.
export const ratingValue = (r) => (r === "yes" ? 5 : r === "no" ? 0 : typeof r === "number" && r >= 0 && r <= 5 ? r : null);
export const EDITORS = ["vscode", "cursor", "idea", "none"];

// "src/a.go:12", "src/a.go:12-20", or "deploy:k8s/job.yaml:7" when "deploy" is a key of plan.roots.
export function parseFile(file, plan = {}) {
  if (typeof file !== "string" || !file) return null;
  const roots = isObj(plan.roots) ? plan.roots : {};
  let rest = file, rootName = null;
  const head = file.split(":")[0];
  if (Object.hasOwn(roots, head) && file.length > head.length + 1) {
    rootName = head;
    rest = file.slice(head.length + 1);
  }
  const m = rest.match(/^(.*?):(\d+)(?:-(\d+))?$/);
  const rel = m ? m[1] : rest;
  const line = m ? Number(m[2]) : null;
  const end = m && m[3] ? Number(m[3]) : line;
  const root = rootName ? roots[rootName] : typeof plan.root === "string" ? plan.root : null;
  return {rootName, root, rel, line, end, abs: root ? root.replace(/\/+$/, "") + "/" + rel.replace(/^\.?\//, "") : null};
}

// "12", "12-14" or "12, 15-16" → the line numbers, or null when the text is not like that.
export function parseLines(spec) {
  if (typeof spec === "number" && Number.isInteger(spec) && spec > 0) return new Set([spec]);
  if (typeof spec !== "string" || !/^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/.test(spec)) return null;
  const out = new Set();
  for (const part of spec.split(",")) {
    const [a, b = a] = part.split("-").map(Number);
    for (let n = Math.min(a, b); n <= Math.max(a, b) && out.size < 500; n++) out.add(n);
  }
  return out;
}

// "highlight" is lines ("146, 152") or lines with a short note each ({"146": "waits here", "152": "prints, then exits"}).
export function highlightOf(h) {
  if (isObj(h)) {
    const lines = new Set(), notes = new Map();
    for (const [spec, note] of Object.entries(h)) {
      const set = parseLines(spec);
      if (!set || typeof note !== "string") return null;
      set.forEach((n) => lines.add(n));
      if (note) notes.set(Math.max(...set), note);
    }
    return {lines, notes};
  }
  const lines = parseLines(h);
  return lines && {lines, notes: new Map()};
}

const has = (o, k) => o != null && typeof o === "object" && Object.hasOwn(o, k);
const list = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);

// Fields each picture iterates: a string or object where a list belongs would stop the page drawing, so check refuses it.
const SHAPES = {
  flow: ["lanes", "lanes.*.nodes"],
  k8s: ["outside", "configs", "targets", "workloads", "workloads.*.containers", "workloads.*.uses", "links"],
  sequence: ["actors", "messages"],
  map: ["zones", "links"],
  journey: ["stops"],
  state: ["states", "transitions", "end"],
  decision: ["nodes", "edges"],
  impact: ["nodes", "edges"],
  timeline: ["lanes", "lanes.*.events", "marks"],
  datamodel: ["tables", "tables.*.columns", "relations", "groups", "groups.*.tables"],
  transform: ["stages", "stages.*.columns", "stages.*.rows", "stages.*.rows.*", "stages.*.notes"],
  diff: [],
};

// Groups frame tables that belong together; layout is where the user dragged them (written by the page, not by the agent).
function groupProblems(v) {
  const tables = new Set(list(v.tables).map((tb) => tb?.node));
  const seen = new Map(), out = [];
  list(v.groups).forEach((g, i) => {
    if (!isObj(g) || !TEXT(g.label) || !g.label) return out.push(`groups[${i}] needs a label and tables: {"label": "…", "tables": ["…"]}`);
    for (const id of list(g.tables)) {
      if (!tables.has(id)) out.push(`groups[${i}] "${g.label}": no table "${id}" in this view`);
      else if (seen.has(id)) out.push(`table "${id}" is in two groups ("${seen.get(id)}" and "${g.label}")`);
      else seen.set(id, g.label);
    }
  });
  if (v.layout != null && (!isObj(v.layout) || !Object.values(v.layout).every((q) => isObj(q) && Number.isFinite(q.x) && Number.isFinite(q.y))))
    out.push('layout is written by the page: {table: {"x": n, "y": n}}');
  return out;
}

function shapeProblems(v) {
  const out = [];
  const walk = (x, parts, at) => {
    if (x == null) return;
    if (!parts.length) {
      if (!Array.isArray(x)) out.push(`${at} must be a list [...]`);
      return;
    }
    const [head, ...rest] = parts;
    if (head === "*") list(x).forEach((y, i) => walk(y, rest, `${at}[${i}]`));
    else if (isObj(x) || Array.isArray(x)) walk(x[head], rest, at ? `${at}.${head}` : head);
  };
  for (const path of SHAPES[v.kind] || []) walk(v, path.split("."), "");
  // Zones nest; each level's zones and nodes are lists too.
  const zones = (zs, at, depth) => list(zs).forEach((z, i) => {
    for (const k of ["zones", "nodes"]) if (z?.[k] != null && !Array.isArray(z[k])) out.push(`${at}[${i}].${k} must be a list [...]`);
    if (depth > 8) out.push(`${at}[${i}]: zones nested deeper than 8 levels`);
    else zones(z?.zones, `${at}[${i}].zones`, depth + 1);
  });
  if (v.kind === "map") zones(v.zones, "zones", 1);
  return out;
}

const TEXT = (x) => x == null || typeof x === "string" || typeof x === "number";

export const KINDS = {
  flow: {
    refs: (v) => list(v.lanes).flatMap((l) => list(l?.nodes)),
    check: (v) => (Array.isArray(v.lanes) ? [] : ["lanes must be an array"]),
  },
  k8s: {
    refs: (v) => [...list(v.outside), ...list(v.configs), ...list(v.targets), ...(v.policy ? [v.policy] : []),
      ...list(v.workloads).flatMap((w) => [w?.node, ...list(w?.uses)]), ...list(v.links).flatMap((l) => [l?.from, l?.to])],
    check: (v) => list(v.links).filter((l) => l?.state && !has(LINK_STATE, l.state)).map((l) => `link ${l.from}→${l.to}: unknown state "${l.state}" (ok, todo, blocked, standby)`),
  },
  sequence: {
    refs: (v) => [...list(v.actors), ...list(v.messages).flatMap((m) => (m?.node ? [m.node] : []))],
    check: (v, p) => list(v.messages).flatMap((m, i) => [
      ...[m?.from, m?.to].filter((a) => !list(v.actors).includes(a)).map((a) => `message ${i + 1}: actor "${a}" is not in actors`),
      ...(m?.step && !list(p.steps).some((s) => s?.id === m.step) ? [`message ${i + 1}: no step "${m.step}"`] : []),
      ...(m?.group != null && typeof m.group !== "string" ? [`message ${i + 1}: group must be a string`] : []),
    ]),
  },
  // Zones inside zones (account › VPC › subnet), boxes inside them, links across.
  map: {
    refs: (v) => [...zoneNodes(list(v.zones)), ...list(v.links).flatMap((l) => [l?.from, l?.to])],
    check: (v) => [
      ...(!list(v.zones).length ? ["map needs zones: [{\"label\", \"zones\", \"nodes\"}]"] : []),
      ...list(v.links).filter((l) => l?.state && !has(LINK_STATE, l.state)).map((l) => `link ${l.from}→${l.to}: unknown state "${l.state}" (ok, todo, blocked, standby)`),
    ],
  },
  // One piece of data travelling stop by stop, with what it looks like at each stop.
  journey: {
    refs: (v) => list(v.stops).map((st) => st?.node),
    check: (v) => (list(v.stops).length < 2 ? ["journey needs at least two stops: [{\"node\", \"data\", \"note\"}]"] : []),
  },
  state: {
    refs: (v) => [...list(v.states), ...list(v.transitions).flatMap((x) => [x?.from, x?.to])],
    check: (v) => (v.start != null && !list(v.states).includes(v.start) ? [`start "${v.start}" is not in states`] : []),
  },
  decision: {
    refs: (v) => [...list(v.nodes), ...list(v.edges).flatMap((x) => [x?.from, x?.to])],
    check: (v) => (!list(v.edges).length ? ["decision needs edges: [{\"from\", \"to\", \"label\"}]"] : []),
  },
  impact: {
    refs: (v) => [...list(v.nodes), ...list(v.edges).flatMap((x) => [x?.from, x?.to])],
    check: () => [],
  },
  timeline: {
    refs: (v) => list(v.lanes).map((l) => l?.node),
    check: (v) => list(v.lanes).flatMap((l, i) => list(l?.events).filter((e) => typeof e?.at !== "number" || (e.to != null && !(typeof e.to === "number" && e.to >= e.at))).map(() => `lane ${i + 1}: every event needs a number "at" (and "to" ≥ "at" for a span)`)),
  },
  datamodel: {
    refs: (v) => list(v.tables).map((tb) => tb?.node),
    check: (v) => {
      const cols = new Set(list(v.tables).flatMap((tb) => list(tb?.columns).map((c) => `${tb?.node}.${c?.name}`)));
      const columns = list(v.tables).flatMap((tb) => list(tb?.columns).filter(isObj).map((c) => [tb.node, c]));
      return [...columns.filter(([, c]) => c.ref || c.copy).flatMap(([t, c]) => [...(c.ref ? [[`${t}.${c.name}`, c.ref]] : []), ...(c.copy ? [[`${t}.${c.name}`, c.copy]] : [])]), ...list(v.relations).filter(isObj).map((r) => [r.from, r.to])]
        .flatMap(([a, b]) => [a, b]).filter((k) => !cols.has(k)).map((k) => `no column "${k}" (use table.column)`)
        .concat(columns.filter(([, c]) => c.key != null && typeof c.key !== "string").map(([t, c]) => `column ${t}.${c.name}: key must be text such as "pk" or "fk"`))
        .concat(groupProblems(v));
    },
  },
  diff: {
    refs: () => [],
    check: (v, p) => [
      ...[v.before, v.after].filter((id) => !list(p.views).some((x) => x?.id === id && x.kind !== "diff")).map((id) => `no view "${id}" to compare (a diff compares two other, non-diff views)`),
      ...(v.changed != null && !Array.isArray(v.changed) && !(isObj(v.changed) && Object.values(v.changed).every((x) => typeof x === "string")) ? ['changed must be ["id", …] or {"id": "what changed"}'] : []),
    ],
  },
  transform: {
    refs: (v) => list(v.stages).map((st) => st?.node),
    check: (v) => list(v.stages).flatMap((st, i) => [
      ...(!st?.columns && !st?.text ? [`stage ${i + 1} needs columns + rows, or text`] : []),
      ...list(st?.rows).filter((r) => st.columns && (!Array.isArray(r) || r.length !== st.columns.length)).map(() => `stage ${i + 1} has a row whose length differs from columns`),
    ]),
  },
};

// Page labels follow the plan: "lang" when set, otherwise Thai if the title or goal is Thai, otherwise English.
export function langOf(p) {
  const code = typeof p?.lang === "string" ? p.lang.toLowerCase().split(/[-_]/)[0] : "";
  if (LANGS.includes(code)) return code;
  if (code) return "en";
  return /[\u0E00-\u0E7F]/.test(`${p?.title ?? ""} ${p?.goal ?? ""}`) ? "th" : "en";
}

function zoneNodes(zones, depth = 0) {
  if (depth > 8) return [];
  return zones.filter(isObj).flatMap((z) => [...list(z.nodes), ...zoneNodes(list(z.zones), depth + 1)]);
}

const dupes = (ids) => ids.filter((id, i) => id && ids.indexOf(id) !== i);

// A plan may leave out views: each step becomes a lane of the boxes it touches.
export function viewsOf(p) {
  if (list(p?.views).length) return p.views;
  // Each lane is a step (its id goes with it, so the page can number it and a draft can name it).
  const lanes = list(p?.steps).filter((s) => list(s?.nodes).length).map((s) => ({title: s.title, nodes: s.nodes, step: s.id}));
  return lanes.length ? [{id: "flow", kind: "flow", title: langOf(p) === "th" ? "ภาพรวม" : "Overview", lanes}] : [];
}

export function validate(p) {
  const out = [];
  if (!isObj(p)) return ["plan.json is not an object"];
  if (!p.title || (typeof p.title === "string" && !p.title.trim())) out.push("no title");
  for (const k of ["title", "goal"]) if (!TEXT(p[k])) out.push(`${k} must be text`);
  if (p.lang != null && typeof p.lang !== "string") out.push('lang must be a language code such as "en" or "th"');
  const mode = p.mode ?? "build";
  if (!MODES.includes(mode)) out.push(`unknown mode "${p.mode}" (${MODES.join(", ")})`);
  // Restating defaults to on and is switched on the page; build mode asks about commits up front.
  const s = p.settings;
  if (s != null && !isObj(s)) out.push("settings must be an object");
  else if (!isObj(s) && mode === "build") out.push('no settings (ask the user first: {"commit": "auto"|"suggest"})');
  else if (isObj(s)) {
    if (s.teachBack != null && typeof s.teachBack !== "boolean") out.push("settings.teachBack must be true or false");
    if (mode === "build" && !["auto", "suggest"].includes(s.commit)) out.push('settings.commit must be "auto" or "suggest"');
  }
  if (p.approved != null && typeof p.approved !== "boolean") out.push("approved must be true or false");
  if (p.root != null && (typeof p.root !== "string" || !p.root)) out.push("root must be a path (absolute, or relative to the plan folder)");
  if (p.roots != null && (!isObj(p.roots) || Object.values(p.roots).some((r) => typeof r !== "string" || !r))) out.push('roots must be {"name": "path"}');
  if (isObj(s) && s.editor != null && !EDITORS.includes(s.editor)) out.push(`settings.editor must be one of ${EDITORS.join(", ")}`);
  if (isObj(s) && s.depth != null && !["overview", "detail"].includes(s.depth)) out.push('settings.depth must be "overview" or "detail"');
  if (p.start != null && !list(p.steps).some((x) => x?.id === p.start)) out.push(`start "${p.start}" matches no step`);
  if (mode === "design") out.push(...checkDesign(p));
  if (p.constraints != null && (!Array.isArray(p.constraints) || p.constraints.some((c) => !isObj(c) || !c.id || typeof c.text !== "string")))
    out.push('constraints must be [{"id": "…", "text": "…", "confirmed": false}]');
  if (p.links != null && (!Array.isArray(p.links) || p.links.some((l) => !isObj(l) || typeof l.url !== "string" || !/^https?:\/\//.test(l.url))))
    out.push('links must be [{"title": "…", "url": "http://…"}]');
  if (p.glossary != null && (!isObj(p.glossary) || Object.values(p.glossary).some((x) => typeof x !== "string"))) out.push('glossary must be {"term": "explanation"}');

  if (p.nodes != null && !isObj(p.nodes)) out.push("nodes must be an object");
  const nodes = isObj(p.nodes) ? p.nodes : {};
  for (const [id, n] of Object.entries(nodes)) {
    if (!isObj(n)) {
      out.push(`node "${id}" must be an object`);
      continue;
    }
    if (!n.name) out.push(`node "${id}" has no name`);
    for (const k of ["name", "what", "in", "out", "why", "file", "anchor"]) if (!TEXT(n[k])) out.push(`node "${id}" ${k} must be text`);
    if (n.icon != null && typeof n.icon !== "string") out.push(`node "${id}" icon must be a string`);
    if (n.highlight != null && !highlightOf(n.highlight)) out.push(`node "${id}" highlight must be lines like "12, 15-16", or {"12": "note"}`);
    if (n.basis != null && !BASIS.includes(n.basis)) out.push(`node "${id}" basis must be one of ${BASIS.join(", ")}`);
    if (n.proposal != null && (!isObj(n.proposal) || !["add", "change", "remove"].includes(n.proposal.type) || (n.proposal.note != null && typeof n.proposal.note !== "string")))
      out.push(`node "${id}" proposal must be {"type": "add"|"change"|"remove", "note": "…"}`);
    if (n.status && !has(NODE_STATUS, n.status)) out.push(`node "${id}": unknown status "${n.status}" (${Object.keys(NODE_STATUS).join(", ")})`);
  }
  const known = (k) => has(nodes, k) && isObj(nodes[k]);

  if (p.steps != null && !Array.isArray(p.steps)) out.push("steps must be an array");
  const steps = list(p.steps);
  for (const id of dupes(steps.map((x) => x?.id))) out.push(`step id "${id}" is used twice`);
  for (const st of steps) {
    if (!isObj(st) || typeof st.id !== "string" || !st.id || !st.title) {
      out.push("every step needs an id (text) and a title");
      continue;
    }
    for (const k of ["title", "detail", "done"]) if (!TEXT(st[k])) out.push(`step "${st.id}" ${k} must be text`);
    if (st.nodes != null && !Array.isArray(st.nodes)) out.push(`step "${st.id}" nodes must be a list of node ids`);
    if (st.status && !has(STEP_STATUS, st.status)) out.push(`step "${st.id}": unknown status "${st.status}" (${Object.keys(STEP_STATUS).join(", ")})`);
    if (st.confirmed != null && typeof st.confirmed !== "boolean") out.push(`step "${st.id}" confirmed must be true or false`);
    if (st.commitMessage != null && typeof st.commitMessage !== "string") out.push(`step "${st.id}" commitMessage must be a string`);
    if (st.commits != null && (!Array.isArray(st.commits) || st.commits.some((c) => !isObj(c) || typeof c.message !== "string" || (c.files != null && !(Array.isArray(c.files) && c.files.every((f) => typeof f === "string"))))))
      out.push(`step "${st.id}" commits must be [{"message": "…", "files": ["…"]}]`);
    if (st.moves != null && !Array.isArray(st.moves)) out.push(`step "${st.id}": moves must be a list [{"from", "to", "label", "keep"}]`);
    for (const m of list(st.moves)) if (!isObj(m) || !known(m.from) || !known(m.to) || !TEXT(m.label)) out.push(`step "${st.id}": every move needs "from" and "to" boxes that exist, and a text "label"`);
    if (st.show != null && !isObj(st.show)) out.push(`step "${st.id}": show must be {box: "text"}`);
    for (const [id, text] of Object.entries(isObj(st.show) ? st.show : {})) if (!known(id) || typeof text !== "string") out.push(`step "${st.id}": show needs a box that exists and text ("${id}")`);
    for (const k of list(st.nodes)) if (!known(k)) out.push(k == null ? `step "${st.id}": nodes has an empty item (null)` : `step "${st.id}": no node "${k}"`);
  }

  if (p.views != null && !Array.isArray(p.views)) out.push("views must be an array");
  const views = viewsOf(p);
  if (!views.length) out.push("no views, and no step lists nodes to draw a picture from");
  for (const id of dupes(views.map((v) => v?.id))) out.push(`view id "${id}" is used twice`);
  for (const v of views) {
    if (!isObj(v)) {
      out.push("every view must be an object");
      continue;
    }
    const kind = has(KINDS, v.kind) ? KINDS[v.kind] : null;
    if (!kind) {
      out.push(`view "${v.id}": unknown kind "${v.kind}" (${Object.keys(KINDS).join(", ")})`);
      continue;
    }
    const shape = shapeProblems(v);
    for (const t of shape) out.push(`view "${v.id}": ${t}`);
    if (shape.length) continue;
    for (const [field, xs] of Object.entries(v)) if (Array.isArray(xs) && xs.some((x) => x == null)) out.push(`view "${v.id}": ${field} has an empty item (null)`);
    for (const k of new Set(kind.refs(v))) if (k != null && !known(k)) out.push(`view "${v.id}": no node "${k}"`);
    for (const t of kind.check?.(v, p) || []) out.push(`view "${v.id}": ${t}`);
  }
  return out;
}

// design: options to choose from, criteria to compare them by, a score per pair, and where each claim comes from.
function checkDesign(p) {
  const out = [];
  const ids = (x) => list(x).filter(isObj).map((o) => o.id);
  const views = new Set(ids(viewsOf(p)));
  const sources = new Set(ids(p.sources));
  if (!list(p.options).length) out.push("design mode needs options: [{\"id\", \"title\", \"summary\", \"view\"}]");
  for (const [name, xs] of [["option", p.options], ["criterion", p.criteria], ["source", p.sources], ["constraint", p.constraints]]) for (const id of dupes(ids(xs))) out.push(`${name} id "${id}" is used twice`);
  if (list(p.options).filter((o) => o?.recommended).length > 1) out.push("only one option can be recommended");
  for (const o of list(p.options)) {
    if (!isObj(o) || !o.id || !o.title) out.push("every option needs an id and a title");
    else if (o.view != null && !views.has(o.view)) out.push(`option "${o.id}": no view "${o.view}"`);
  }
  for (const v of list(p.views)) if (isObj(v) && v.option != null && !ids(p.options).includes(v.option)) out.push(`view "${v.id}": no option "${v.option}"`);
  for (const c of list(p.criteria)) if (!isObj(c) || !c.id || !c.label || (c.weight != null && !(Number.isInteger(c.weight) && c.weight >= 0 && c.weight <= 3))) out.push("every criterion needs an id, a label and a weight from 0 to 3");
  for (const c of list(p.criteria)) if (isObj(c) && c.must != null && typeof c.must !== "boolean") out.push(`criterion "${c.id}": must is true or false`);
  for (const s of list(p.sources)) if (!isObj(s) || !s.id || typeof s.url !== "string" || !/^https?:\/\//.test(s.url)) out.push("every source needs an id and an http(s) url");
  if (p.scores != null && !isObj(p.scores)) out.push("scores must be {option: {criterion: {rating, note, sources}}}");
  for (const [o, row] of Object.entries(isObj(p.scores) ? p.scores : {})) {
    if (!ids(p.options).includes(o)) out.push(`scores: no option "${o}"`);
    for (const [c, cell] of Object.entries(isObj(row) ? row : {})) {
      if (!ids(p.criteria).includes(c)) out.push(`scores.${o}: no criterion "${c}"`);
      if (!isObj(cell) || (cell.rating !== "na" && ratingValue(cell.rating) == null)) out.push(`scores.${o}.${c}: rating must be 0-5, "yes", "no" or "na"`);
      for (const s of list(cell?.sources)) if (!sources.has(s)) out.push(`scores.${o}.${c}: no source "${s}"`);
      if (isObj(cell) && cell.value != null && !TEXT(cell.value)) out.push(`scores.${o}.${c}: value must be text, e.g. "$73/month"`);
    }
  }
  for (const c of list(p.constraints)) for (const k of isObj(c) ? list(c.affects) : []) if (!ids(p.criteria).includes(k)) out.push(`constraint "${c.id}": affects no criterion "${k}"`);
  if (p.decision != null && (!isObj(p.decision) || !ids(p.options).includes(p.decision.option))) out.push("decision must name one of the options");
  for (const [id, n] of Object.entries(isObj(p.nodes) ? p.nodes : {})) if (n?.source != null && !sources.has(n.source)) out.push(`node "${id}": no source "${n.source}"`);
  return out;
}

// The must-have criteria an option fails (rated "no" or 0); such an option is out of the running whatever its total.
export function failsMust(p, option) {
  return list(p?.criteria).filter((c) => isObj(c) && c.must && ratingValue(p.scores?.[option]?.[c.id]?.rating) === 0).map((c) => c.id);
}

// Advice that does not stop the page from drawing.
export function lint(p) {
  if (!isObj(p) || !isObj(p.nodes)) return [];
  const out = [];
  const shown = new Set(viewsOf(p).flatMap((v) => (isObj(v) && has(KINDS, v.kind) ? KINDS[v.kind].refs(v) : [])));
  // With several pictures, the tab shows the title, or else the bare id.
  if (Array.isArray(p.views) && p.views.length > 1) for (const v of p.views) if (isObj(v) && v.id && !v.title) out.push(`view "${v.id}" has no title (its tab shows the id)`);
  for (const [id, n] of Object.entries(p.nodes)) {
    if (!isObj(n)) continue;
    if (!shown.has(id)) out.push(`node "${id}" is in no picture`);
    if (String(n.name || "").length > 40) out.push(`node "${id}": name over 40 characters, shorten it`);
    if (p.mode === "explain" && n.status !== "ext" && !n.file && !n.proposal) out.push(`node "${id}" has no file (explain mode points at real code)`);
    if (p.mode === "explain" && n.file && !parseFile(n.file, p)?.line && !/\.(ya?ml|json|toml|md)$/i.test(n.file)) out.push(`node "${id}" file "${n.file}" has no line (path:line)`);
    if (p.mode === "explain" && parseFile(n.file, p)?.line && !n.anchor) out.push(`node "${id}" has no anchor (a short piece of the cited code, so check notices when it moves)`);
    if (String(n.what || "").length > 60) out.push(`node "${id}": what over 60 characters`);
  }
  for (const st of list(p.steps)) if (isObj(st) && !st.detail) out.push(`step "${st.id}" has no detail (what the step does)`);
  if (list(p.steps).length > 10) out.push(`${list(p.steps).length} steps, more than 10: merge some or split the plan`);
  if (p.mode === "design") {
    for (const v of list(p.views)) if (isObj(v) && v.id && !list(p.options).some((o) => o?.view === v.id || o?.id === v.option)) out.push(`view "${v.id}" belongs to no option: only options can be chosen. A revised design is the option's "view" or a new option; a supporting picture takes "option": "<id>"`);
    for (const [o, row] of Object.entries(isObj(p.scores) ? p.scores : {})) for (const [c, cell] of Object.entries(isObj(row) ? row : {})) if (cell?.rating !== "na" && cell?.basis !== "judgment" && !list(cell?.sources).length) out.push(`scores.${o}.${c} cites no source`);
    if (!list(p.options).some((o) => o?.recommended)) out.push("no option is marked recommended");
    for (const o of list(p.options)) for (const c of list(p.criteria)) if (o?.id && c?.id && !isObj(p.scores?.[o.id]?.[c.id])) out.push(`scores.${o.id}.${c.id} is missing (counts as 0; use "na" if it does not apply)`);
    for (const o of list(p.options)) if (o?.recommended && failsMust(p, o.id).length) out.push(`recommended option "${o.id}" fails a must: ${failsMust(p, o.id).join(", ")}`);
  }
  if (p.mode === "explain" && !p.root && !p.roots) out.push("explain mode should have root (the repository path) so file:line can be checked and opened");
  return out;
}
