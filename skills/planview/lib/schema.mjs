export const NODE_STATUS = {done: "ทำแล้ว", new: "เพิ่งทำ", todo: "ยังไม่ทำ", ext: "ภายนอก"};
export const STEP_STATUS = {done: "done", doing: "doing", review: "doing", todo: "todo"};
export const LINK_STATE = {ok: "อนุญาต / ใช้ได้", todo: "รอเปิด / ยังไม่ทำ", blocked: "ถูกบล็อก"};

export const KINDS = {
  flow: {refs: (v) => (v.lanes || []).flatMap((l) => l.nodes || [])},
  k8s: {
    refs: (v) => [...(v.outside || []), ...(v.configs || []), ...(v.targets || []), ...(v.policy ? [v.policy] : []),
      ...(v.workloads || []).flatMap((w) => [w.node, ...(w.uses || [])]), ...(v.links || []).flatMap((l) => [l.from, l.to])],
    check: (v) => (v.links || []).filter((l) => l.state && !LINK_STATE[l.state]).map((l) => `link ${l.from}→${l.to} state "${l.state}" ไม่รู้จัก (ok, todo, blocked)`),
  },
  sequence: {
    refs: (v) => [...(v.actors || []), ...(v.messages || []).flatMap((m) => (m.node ? [m.node] : []))],
    check: (v, p) => (v.messages || []).flatMap((m, i) => [
      ...[m.from, m.to].filter((a) => !(v.actors || []).includes(a)).map((a) => `ข้อความที่ ${i + 1} อ้าง actor "${a}" ที่ไม่อยู่ใน actors`),
      ...(m.step && !(p.steps || []).some((s) => s.id === m.step) ? [`ข้อความที่ ${i + 1} อ้าง step "${m.step}" ที่ไม่มี`] : []),
    ]),
  },
  transform: {
    refs: (v) => (v.stages || []).map((st) => st.node),
    check: (v) => (v.stages || []).flatMap((st, i) => [
      ...(!st.columns && !st.text ? [`stage ที่ ${i + 1} ต้องมี columns+rows หรือ text`] : []),
      ...(st.rows || []).filter((r) => st.columns && r.length !== st.columns.length).map(() => `stage ที่ ${i + 1} มีแถวที่จำนวนช่องไม่เท่า columns`),
    ]),
  },
};

const dupes = (ids) => ids.filter((id, i) => id && ids.indexOf(id) !== i);

export function validate(p) {
  const out = [];
  if (!p || typeof p !== "object" || Array.isArray(p)) return ["plan.json ไม่ใช่ object"];
  if (!p.title) out.push("ไม่มี title");
  const s = p.settings;
  if (!s) out.push('ไม่มี settings (ถามผู้ใช้ก่อนเริ่ม: {"teachBack": true|false, "commit": "auto"|"suggest"})');
  else {
    if (typeof s.teachBack !== "boolean") out.push("settings.teachBack ต้องเป็น true หรือ false");
    if (!["auto", "suggest"].includes(s.commit)) out.push('settings.commit ต้องเป็น "auto" หรือ "suggest"');
  }
  const nodes = p.nodes || {};
  for (const [id, n] of Object.entries(nodes)) {
    if (!n.name) out.push(`node "${id}" ไม่มี name`);
    if (n.status && !NODE_STATUS[n.status]) out.push(`node "${id}" status "${n.status}" ไม่รู้จัก (${Object.keys(NODE_STATUS).join(", ")})`);
  }
  const steps = p.steps || [];
  for (const id of dupes(steps.map((x) => x.id))) out.push(`step id "${id}" ซ้ำ`);
  for (const st of steps) {
    if (!st.id || !st.title) out.push("step ต้องมี id และ title");
    if (st.status && !STEP_STATUS[st.status]) out.push(`step "${st.id}" status "${st.status}" ไม่รู้จัก (${Object.keys(STEP_STATUS).join(", ")})`);
    for (const k of st.nodes || []) if (!nodes[k]) out.push(`step "${st.id}" อ้าง node "${k}" ที่ไม่มี`);
  }
  const views = p.views || [];
  if (!views.length) out.push("ไม่มี views");
  for (const id of dupes(views.map((v) => v.id))) out.push(`view id "${id}" ซ้ำ`);
  for (const v of views) {
    const kind = KINDS[v.kind];
    if (!kind) {
      out.push(`view "${v.id}" kind "${v.kind}" ไม่รู้จัก (มี: ${Object.keys(KINDS).join(", ")})`);
      continue;
    }
    for (const k of new Set(kind.refs(v))) if (!nodes[k]) out.push(`view "${v.id}" อ้าง node "${k}" ที่ไม่มี`);
    for (const t of kind.check?.(v, p) || []) out.push(`view "${v.id}": ${t}`);
  }
  return out;
}
