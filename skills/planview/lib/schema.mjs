export const NODE_STATUS = {done: "ทำแล้ว", new: "เพิ่งทำ", todo: "ยังไม่ทำ", ext: "ภายนอก"};
export const STEP_STATUS = {done: "done", doing: "doing", review: "review", todo: "todo"};
export const LINK_STATE = {ok: "อนุญาต / ใช้ได้", todo: "รอเปิด / ยังไม่ทำ", blocked: "ถูกบล็อก"};
export const MODES = ["build", "explain"];

const has = (o, k) => o != null && typeof o === "object" && Object.hasOwn(o, k);
const list = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);

export const KINDS = {
  flow: {
    refs: (v) => list(v.lanes).flatMap((l) => list(l?.nodes)),
    check: (v) => (Array.isArray(v.lanes) ? [] : ["lanes ต้องเป็น array"]),
  },
  k8s: {
    refs: (v) => [...list(v.outside), ...list(v.configs), ...list(v.targets), ...(v.policy ? [v.policy] : []),
      ...list(v.workloads).flatMap((w) => [w?.node, ...list(w?.uses)]), ...list(v.links).flatMap((l) => [l?.from, l?.to])],
    check: (v) => list(v.links).filter((l) => l?.state && !has(LINK_STATE, l.state)).map((l) => `link ${l.from}→${l.to} state "${l.state}" ไม่รู้จัก (ok, todo, blocked)`),
  },
  sequence: {
    refs: (v) => [...list(v.actors), ...list(v.messages).flatMap((m) => (m?.node ? [m.node] : []))],
    check: (v, p) => list(v.messages).flatMap((m, i) => [
      ...[m?.from, m?.to].filter((a) => !list(v.actors).includes(a)).map((a) => `ข้อความที่ ${i + 1} อ้าง actor "${a}" ที่ไม่อยู่ใน actors`),
      ...(m?.step && !list(p.steps).some((s) => s?.id === m.step) ? [`ข้อความที่ ${i + 1} อ้าง step "${m.step}" ที่ไม่มี`] : []),
    ]),
  },
  transform: {
    refs: (v) => list(v.stages).map((st) => st?.node),
    check: (v) => list(v.stages).flatMap((st, i) => [
      ...(!st?.columns && !st?.text ? [`stage ที่ ${i + 1} ต้องมี columns+rows หรือ text`] : []),
      ...list(st?.rows).filter((r) => st.columns && (!Array.isArray(r) || r.length !== st.columns.length)).map(() => `stage ที่ ${i + 1} มีแถวที่จำนวนช่องไม่เท่า columns`),
    ]),
  },
};

const dupes = (ids) => ids.filter((id, i) => id && ids.indexOf(id) !== i);

export function validate(p) {
  const out = [];
  if (!isObj(p)) return ["plan.json ไม่ใช่ object"];
  if (!p.title) out.push("ไม่มี title");
  const mode = p.mode ?? "build";
  if (!MODES.includes(mode)) out.push(`mode "${p.mode}" ไม่รู้จัก (${MODES.join(", ")})`);
  const s = p.settings;
  if (!isObj(s)) out.push(mode === "explain"
    ? 'ไม่มี settings (ถามผู้ใช้ก่อนเริ่ม: {"teachBack": true|false})'
    : 'ไม่มี settings (ถามผู้ใช้ก่อนเริ่ม: {"teachBack": true|false, "commit": "auto"|"suggest"})');
  else {
    if (typeof s.teachBack !== "boolean") out.push("settings.teachBack ต้องเป็น true หรือ false");
    if (mode === "build" && !["auto", "suggest"].includes(s.commit)) out.push('settings.commit ต้องเป็น "auto" หรือ "suggest"');
  }
  if (p.approved != null && typeof p.approved !== "boolean") out.push("approved ต้องเป็น true หรือ false");
  if (p.glossary != null && (!isObj(p.glossary) || Object.values(p.glossary).some((x) => typeof x !== "string"))) out.push('glossary ต้องเป็น {"คำ": "คำอธิบาย"}');

  if (p.nodes != null && !isObj(p.nodes)) out.push("nodes ต้องเป็น object");
  const nodes = isObj(p.nodes) ? p.nodes : {};
  for (const [id, n] of Object.entries(nodes)) {
    if (!isObj(n)) {
      out.push(`node "${id}" ต้องเป็น object`);
      continue;
    }
    if (!n.name) out.push(`node "${id}" ไม่มี name`);
    if (n.status && !has(NODE_STATUS, n.status)) out.push(`node "${id}" status "${n.status}" ไม่รู้จัก (${Object.keys(NODE_STATUS).join(", ")})`);
  }
  const known = (k) => has(nodes, k) && isObj(nodes[k]);

  if (p.steps != null && !Array.isArray(p.steps)) out.push("steps ต้องเป็น array");
  const steps = list(p.steps);
  for (const id of dupes(steps.map((x) => x?.id))) out.push(`step id "${id}" ซ้ำ`);
  for (const st of steps) {
    if (!isObj(st) || !st.id || !st.title) {
      out.push("step ต้องมี id และ title");
      continue;
    }
    if (st.status && !has(STEP_STATUS, st.status)) out.push(`step "${st.id}" status "${st.status}" ไม่รู้จัก (${Object.keys(STEP_STATUS).join(", ")})`);
    if (st.confirmed != null && typeof st.confirmed !== "boolean") out.push(`step "${st.id}" confirmed ต้องเป็น true หรือ false`);
    for (const k of list(st.nodes)) if (!known(k)) out.push(`step "${st.id}" อ้าง node "${k}" ที่ไม่มี`);
  }

  if (p.views != null && !Array.isArray(p.views)) out.push("views ต้องเป็น array");
  const views = list(p.views);
  if (!views.length) out.push("ไม่มี views");
  for (const id of dupes(views.map((v) => v?.id))) out.push(`view id "${id}" ซ้ำ`);
  for (const v of views) {
    if (!isObj(v)) {
      out.push("view ต้องเป็น object");
      continue;
    }
    const kind = has(KINDS, v.kind) ? KINDS[v.kind] : null;
    if (!kind) {
      out.push(`view "${v.id}" kind "${v.kind}" ไม่รู้จัก (มี: ${Object.keys(KINDS).join(", ")})`);
      continue;
    }
    for (const k of new Set(kind.refs(v))) if (!known(k)) out.push(`view "${v.id}" อ้าง node "${k}" ที่ไม่มี`);
    for (const t of kind.check?.(v, p) || []) out.push(`view "${v.id}": ${t}`);
  }
  return out;
}

// Advice that does not stop the page from drawing.
export function lint(p) {
  if (!isObj(p) || !isObj(p.nodes)) return [];
  const out = [];
  const shown = new Set(list(p.views).flatMap((v) => (isObj(v) && has(KINDS, v.kind) ? KINDS[v.kind].refs(v) : [])));
  for (const [id, n] of Object.entries(p.nodes)) {
    if (!isObj(n)) continue;
    if (!shown.has(id)) out.push(`node "${id}" ไม่อยู่ในภาพไหนเลย`);
    if (String(n.name || "").length > 40) out.push(`node "${id}" ชื่อยาวเกิน 40 ตัวอักษร ย่อให้สั้นลง`);
    if (p.mode === "explain" && n.status !== "ext" && !n.file) out.push(`node "${id}" ไม่มี file (โหมดอธิบายต้องชี้ไปที่โค้ดจริง)`);
  }
  for (const st of list(p.steps)) if (isObj(st) && !st.detail) out.push(`step "${st.id}" ไม่มี detail (ขั้นนี้ทำอะไร)`);
  return out;
}
