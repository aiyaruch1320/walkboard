export const NODE_STATUS = {done: "done", new: "new", todo: "todo", ext: "ext"};
export const STEP_STATUS = {done: "done", doing: "doing", review: "review", todo: "todo"};
export const LINK_STATE = {ok: "ok", todo: "todo", blocked: "blocked"};
export const LANGS = ["en", "th"];
export const teachBackOn = (p) => p?.settings?.teachBack !== false;
export const MODES = ["build", "explain"];
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

const has = (o, k) => o != null && typeof o === "object" && Object.hasOwn(o, k);
const list = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);

export const KINDS = {
  flow: {
    refs: (v) => list(v.lanes).flatMap((l) => list(l?.nodes)),
    check: (v) => (Array.isArray(v.lanes) ? [] : ["lanes must be an array"]),
  },
  k8s: {
    refs: (v) => [...list(v.outside), ...list(v.configs), ...list(v.targets), ...(v.policy ? [v.policy] : []),
      ...list(v.workloads).flatMap((w) => [w?.node, ...list(w?.uses)]), ...list(v.links).flatMap((l) => [l?.from, l?.to])],
    check: (v) => list(v.links).filter((l) => l?.state && !has(LINK_STATE, l.state)).map((l) => `link ${l.from}→${l.to}: unknown state "${l.state}" (ok, todo, blocked)`),
  },
  sequence: {
    refs: (v) => [...list(v.actors), ...list(v.messages).flatMap((m) => (m?.node ? [m.node] : []))],
    check: (v, p) => list(v.messages).flatMap((m, i) => [
      ...[m?.from, m?.to].filter((a) => !list(v.actors).includes(a)).map((a) => `message ${i + 1}: actor "${a}" is not in actors`),
      ...(m?.step && !list(p.steps).some((s) => s?.id === m.step) ? [`message ${i + 1}: no step "${m.step}"`] : []),
      ...(m?.group != null && typeof m.group !== "string" ? [`message ${i + 1}: group must be a string`] : []),
    ]),
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

const dupes = (ids) => ids.filter((id, i) => id && ids.indexOf(id) !== i);

// A plan may leave out views: each step becomes a lane of the boxes it touches.
export function viewsOf(p) {
  if (list(p?.views).length) return p.views;
  const lanes = list(p?.steps).filter((s) => list(s?.nodes).length).map((s) => ({title: s.title, nodes: s.nodes}));
  return lanes.length ? [{id: "flow", kind: "flow", title: langOf(p) === "th" ? "ภาพรวม" : "Overview", lanes}] : [];
}

export function validate(p) {
  const out = [];
  if (!isObj(p)) return ["plan.json is not an object"];
  if (!p.title) out.push("no title");
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
  if (p.glossary != null && (!isObj(p.glossary) || Object.values(p.glossary).some((x) => typeof x !== "string"))) out.push('glossary must be {"term": "explanation"}');

  if (p.nodes != null && !isObj(p.nodes)) out.push("nodes must be an object");
  const nodes = isObj(p.nodes) ? p.nodes : {};
  for (const [id, n] of Object.entries(nodes)) {
    if (!isObj(n)) {
      out.push(`node "${id}" must be an object`);
      continue;
    }
    if (!n.name) out.push(`node "${id}" has no name`);
    if (n.icon != null && typeof n.icon !== "string") out.push(`node "${id}" icon must be a string`);
    if (n.highlight != null && !parseLines(n.highlight)) out.push(`node "${id}" highlight must be lines like "12", "12-14" or "12, 15-16"`);
    if (n.status && !has(NODE_STATUS, n.status)) out.push(`node "${id}": unknown status "${n.status}" (${Object.keys(NODE_STATUS).join(", ")})`);
  }
  const known = (k) => has(nodes, k) && isObj(nodes[k]);

  if (p.steps != null && !Array.isArray(p.steps)) out.push("steps must be an array");
  const steps = list(p.steps);
  for (const id of dupes(steps.map((x) => x?.id))) out.push(`step id "${id}" is used twice`);
  for (const st of steps) {
    if (!isObj(st) || !st.id || !st.title) {
      out.push("every step needs an id and a title");
      continue;
    }
    if (st.status && !has(STEP_STATUS, st.status)) out.push(`step "${st.id}": unknown status "${st.status}" (${Object.keys(STEP_STATUS).join(", ")})`);
    if (st.confirmed != null && typeof st.confirmed !== "boolean") out.push(`step "${st.id}" confirmed must be true or false`);
    if (st.commitMessage != null && typeof st.commitMessage !== "string") out.push(`step "${st.id}" commitMessage must be a string`);
    if (st.commits != null && (!Array.isArray(st.commits) || st.commits.some((c) => !isObj(c) || typeof c.message !== "string" || (c.files != null && !(Array.isArray(c.files) && c.files.every((f) => typeof f === "string"))))))
      out.push(`step "${st.id}" commits must be [{"message": "…", "files": ["…"]}]`);
    for (const k of list(st.nodes)) if (!known(k)) out.push(`step "${st.id}": no node "${k}"`);
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
    for (const k of new Set(kind.refs(v))) if (!known(k)) out.push(`view "${v.id}": no node "${k}"`);
    for (const t of kind.check?.(v, p) || []) out.push(`view "${v.id}": ${t}`);
  }
  return out;
}

// Advice that does not stop the page from drawing.
export function lint(p) {
  if (!isObj(p) || !isObj(p.nodes)) return [];
  const out = [];
  const shown = new Set(viewsOf(p).flatMap((v) => (isObj(v) && has(KINDS, v.kind) ? KINDS[v.kind].refs(v) : [])));
  for (const [id, n] of Object.entries(p.nodes)) {
    if (!isObj(n)) continue;
    if (!shown.has(id)) out.push(`node "${id}" is in no picture`);
    if (String(n.name || "").length > 40) out.push(`node "${id}": name over 40 characters, shorten it`);
    if (p.mode === "explain" && n.status !== "ext" && !n.file) out.push(`node "${id}" has no file (explain mode points at real code)`);
    if (p.mode === "explain" && n.file && !parseFile(n.file, p)?.line && !/\.(ya?ml|json|toml|md)$/i.test(n.file)) out.push(`node "${id}" file "${n.file}" has no line (path:line)`);
    if (String(n.what || "").length > 60) out.push(`node "${id}": what over 60 characters`);
  }
  for (const st of list(p.steps)) if (isObj(st) && !st.detail) out.push(`step "${st.id}" has no detail (what the step does)`);
  if (list(p.steps).length > 10) out.push(`${list(p.steps).length} steps, more than 10: merge some or split the plan`);
  if (p.mode === "explain" && !p.root && !p.roots) out.push("explain mode should have root (the repository path) so file:line can be checked and opened");
  return out;
}
