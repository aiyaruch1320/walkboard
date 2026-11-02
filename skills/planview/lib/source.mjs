import fs from "node:fs";
import path from "node:path";
import {parseFile} from "./schema.mjs";

// Resolve a node's file inside its declared root; never outside it.
// A relative root is relative to the plan folder (base).
export function locate(plan, file, base = process.cwd()) {
  const ref = parseFile(file, plan);
  if (!ref?.abs) return {ref, error: "no root"};
  const rootPath = path.resolve(base, ref.root);
  const root = fs.existsSync(rootPath) ? fs.realpathSync(rootPath) : null;
  if (!root) return {ref, error: `root not found: ${ref.root}`};
  const abs = path.resolve(root, ref.rel);
  if (!fs.existsSync(abs)) return {ref, error: `file not found: ${ref.rel}`};
  const real = fs.realpathSync(abs);
  if (real !== root && !real.startsWith(root + path.sep)) return {ref, error: "outside root"};
  if (!fs.statSync(real).isFile()) return {ref, error: `not a file: ${ref.rel}`};
  return {ref, abs: real};
}

export function excerpt(plan, file, {around = 6, max = 60, base} = {}) {
  const {ref, abs, error} = locate(plan, file, base);
  if (error) return {error};
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  if (ref.line && ref.line > lines.length) return {error: `line ${ref.line} is past the end (${lines.length} lines)`};
  const from = ref.line ? Math.max(1, ref.line - (ref.end > ref.line ? 0 : 2)) : 1;
  const last = !ref.line ? max : ref.end > ref.line ? ref.end : ref.line + around;
  const to = Math.min(lines.length, last, from + max - 1);
  return {path: abs, from, focus: ref.line, end: ref.end, lines: lines.slice(from - 1, to)};
}

// Problems with code references, checked only in explain mode where every box must point at real code.
export function checkEvidence(plan, base) {
  if (plan?.mode !== "explain" || (!plan.root && !plan.roots)) return [];
  const out = [];
  for (const [id, n] of Object.entries(plan.nodes || {})) {
    if (!n?.file) continue;
    const r = excerpt(plan, n.file, {around: 0, max: 1, base});
    if (r.error) out.push(`node "${id}" file "${n.file}": ${r.error}`);
  }
  return out;
}
