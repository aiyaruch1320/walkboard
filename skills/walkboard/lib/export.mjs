import fs from "node:fs";
import path from "node:path";
import {excerpt} from "./source.mjs";

const assets = new URL("../assets/", import.meta.url);
const lib = new URL("./", import.meta.url);
const read = (base, name) => fs.readFileSync(new URL(name, base), "utf8");

// The page links its stylesheet and labels so it also opens as a file; served or exported, they are inlined into one document.
export function pageHtml() {
  return read(assets, "viewer.html")
    .replace('<link rel="stylesheet" href="viewer.css">', () => `<style>\n${read(assets, "viewer.css")}</style>`)
    .replace('<script src="strings.js"></script>', () => `<script>\n${read(assets, "strings.js")}</script>`);
}

function lines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split("\n").flatMap((l) => {
    try {
      return l.trim() ? [JSON.parse(l)] : [];
    } catch {
      return [];
    }
  });
}

// A read-only copy of a plan in one file: the page, the plan, the glossary and the code it points at, opened anywhere without a server.
// No token, no address of this machine, no way to send anything; the chat only when asked for.
export function snapshot(dir, plan, {code = true, chat = false} = {}) {
  const sources = {};
  if (code) {
    for (const [id, n] of Object.entries(plan.nodes || {})) {
      if (!n?.file) continue;
      const r = excerpt(plan, n.file, {base: dir, anchor: n.anchor});
      // The absolute path on this machine stays here.
      if (!r.error) sources[id] = {from: r.from, focus: r.focus, end: r.end, lines: r.lines, ...(r.moved != null ? {moved: r.moved} : {})};
    }
  }
  const state = path.join(dir, ".walkboard");
  const thread = chat
    ? [...lines(path.join(state, "feedback.jsonl")).map((m) => ({...m, from: "user", delivered: true})), ...lines(path.join(state, "replies.jsonl"))]
        .filter((m) => m?.kind !== "settings" && typeof m?.text === "string")
        .map(({id, from, kind, text, node, step, option, criterion, at, delivered}) => ({id, from, kind, text, node, step, option, criterion, at, delivered}))
        .sort((a, b) => String(a.at).localeCompare(String(b.at)))
    : [];
  // Nothing about this machine leaves in the file: not the repository's path, not links to local pages (they carry a token).
  const local = (u) => /^https?:\/\/(127\.|localhost|\[::1\]|0\.0\.0\.0)/i.test(String(u)) || /[?&]token=/.test(String(u));
  const shared = {...plan};
  delete shared.root;
  delete shared.roots;
  if (Array.isArray(plan.links)) shared.links = plan.links.filter((l) => l && !local(l.url));
  const data = {plan: shared, glossary: JSON.parse(read(assets, "glossary.json")), sources, thread, exportedAt: new Date().toISOString()};
  const module = (name) => "data:text/javascript;base64," + Buffer.from(read(lib, name)).toString("base64");
  // "<" escaped so nothing in the plan can close the script tag.
  const json = (x) => JSON.stringify(x).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  // The file may only run what it carries: no requests anywhere, whatever a plan says.
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">\n`;
  const head = `<script>window.__walkboardModules = ${json({schema: module("schema.mjs"), icons: module("icons.mjs")})};</script>\n<script id="wb-snapshot" type="application/json">${json(data)}</script>\n`;
  const html = pageHtml()
    .replace('<meta name="referrer" content="no-referrer">', (m) => csp + m)
    .replace("<title>Walkboard</title>", () => `<title>${String(plan.title || "Walkboard").replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"))} · Walkboard</title>`)
    .replace('<script type="module">', () => head + '<script type="module">');
  const files = [...new Set(Object.keys(sources).map((id) => String(plan.nodes[id].file).replace(/:\d+(-\d+)?$/, "")))];
  return {html, summary: {steps: (plan.steps || []).length, nodes: Object.keys(plan.nodes || {}).length, files, chat: thread.length}};
}
