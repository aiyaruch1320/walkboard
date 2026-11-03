import fs from "node:fs";
import path from "node:path";
import {parseFile, highlightOf} from "./schema.mjs";

// Resolve a node's file inside its declared root; never outside it.
// A relative root is relative to the plan folder (base).
export function locate(plan, file, base = process.cwd()) {
  const ref = parseFile(file, plan);
  if (!ref?.abs) return {ref, error: "no root"};
  const rootPath = path.resolve(base, ref.root);
  const root = fs.existsSync(rootPath) ? fs.realpathSync(rootPath) : null;
  if (!root) return {ref, error: `root not found: ${ref.root}`};
  const abs = path.resolve(root, ref.rel);
  // Walkboard's own state (the server token, the conversation) is never shown as code.
  if (path.relative(root, abs).split(path.sep).includes(".walkboard")) return {ref, error: "inside .walkboard"};
  if (!fs.existsSync(abs)) return {ref, error: `file not found: ${ref.rel}`};
  const real = fs.realpathSync(abs);
  if (real !== root && !real.startsWith(root + path.sep)) return {ref, error: "outside root"};
  if (!fs.statSync(real).isFile()) return {ref, error: `not a file: ${ref.rel}`};
  return {ref, abs: real};
}

export function excerpt(plan, file, {around = 6, max = 60, base, anchor} = {}) {
  const {ref, abs, error} = locate(plan, file, base);
  if (error) return {error};
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  if (ref.line === 0) return {error: "lines start at 1"};
  if (ref.line && ref.line > lines.length) return {error: `line ${ref.line} is past the end (${lines.length} lines)`};
  if (ref.end && ref.end < ref.line) return {error: `range ${ref.line}-${ref.end} ends before it starts`};
  if (ref.end && ref.end > lines.length) return {error: `line ${ref.end} is past the end (${lines.length} lines)`};
  const from = ref.line ? Math.max(1, ref.line - (ref.end > ref.line ? 0 : 2)) : 1;
  const last = !ref.line ? max : ref.end > ref.line ? ref.end : ref.line + around;
  const to = Math.min(lines.length, last, from + max - 1);
  const out = {path: abs, from, focus: ref.line, end: ref.end, lines: lines.slice(from - 1, to)};
  // The anchor is a bit of the code the box is about; when it is no longer in the cited lines, the code has moved since it was explained.
  if (typeof anchor === "string" && anchor && ref.line) {
    // The anchor starts what is cited: in the first lines of a range, or a couple of lines around a single line (the line under a comment).
    // Anywhere further down a range means the range has slid off the code it was about.
    const range = ref.end > ref.line;
    const a = range ? ref.line : Math.max(1, ref.line - 2), b = range ? Math.min(ref.end, ref.line + 2) : Math.min(lines.length, ref.line + 2);
    if (!lines.slice(a - 1, b).some((l) => l.includes(anchor))) {
      const at = lines.findIndex((l) => l.includes(anchor));
      out.moved = at >= 0 ? at + 1 : 0;
    }
  }
  return out;
}

// Problems with code references, checked only in explain mode where every box must point at real code.
export function checkEvidence(plan, base) {
  if (plan?.mode !== "explain" || (!plan.root && !plan.roots)) return [];
  const out = [];
  for (const [id, n] of Object.entries(plan.nodes || {})) {
    if (!n?.file) continue;
    const r = excerpt(plan, n.file, {around: 0, max: 1, base, anchor: n.anchor});
    if (r.error) out.push(`node "${id}" file "${n.file}": ${r.error}`);
    else if (r.moved != null) out.push(`node "${id}" file "${n.file}": anchor ${JSON.stringify(n.anchor)} is not at the start of those lines${r.moved ? `; it is at line ${r.moved}` : "; it is not in the file"} (the code moved: fix file and highlight)`);
    const h = n.highlight != null && highlightOf(n.highlight);
    // The lines the page shows: the range, or a single line with a little around it.
    const range = r.end > r.focus, lo = range ? r.focus : r.focus - 2, hi = range ? r.end : r.focus + 6;
    const off = h && r.focus ? [...h.lines].filter((l) => l < lo || l > hi) : [];
    if (off.length) out.push(`node "${id}" highlight ${off.join(", ")} is outside the lines ${n.file} shows`);
  }
  return out;
}
