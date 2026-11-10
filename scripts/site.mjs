#!/usr/bin/env node
// Builds the docs website from docs/ into site/ (or the folder given): node scripts/site.mjs [out]
// GitHub Pages serves it at https://aiyaruch1320.github.io/walkboard/ (.github/workflows/pages.yml).
// No dependencies: a small Markdown reader for what the docs use (headings, paragraphs, lists, tables, code, images,
// links, a few inline tags), and one layout.
// - Images live on the `media` branch, so installing Walkboard never downloads them. The docs point at them on
//   raw.githubusercontent.com (which also works on github.com); here they are copied from media/ ($WALKBOARD_MEDIA) and
//   linked to that copy.
// - The live examples are `walkboard export`s of examples/pictures and examples/platforms, at examples/<name>.html.
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(repo, "docs");
export const SITE = "https://aiyaruch1320.github.io/walkboard/";
export const MEDIA = "https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/";
const GITHUB = "https://github.com/aiyaruch1320/walkboard";

// The menu: sections and their pages, in reading order, as the Next.js docs do it: getting started in order, guides
// for one task each, then what to look up. Titles come from each page's first heading. The pages keep their paths,
// because the page and SKILL.md link to them.
const NAV = [
  ["Getting started", ["README.md", "getting-started.md", "page.md", "modes/plan.md", "modes/explain.md", "modes/design.md"]],
  ["Guides", ["draft.md", "existing.md", "share.md", "other-agents.md"]],
  ["Pictures", ["pictures/README.md", "pictures/flow.md", "pictures/map.md", "pictures/sequence.md", "pictures/transform.md", "pictures/journey.md", "pictures/state.md", "pictures/decision.md", "pictures/timeline.md", "pictures/datamodel.md", "pictures/impact.md", "pictures/diff.md"]],
  ["Platforms", ["platforms/README.md", "platforms/aws.md", "platforms/gcp.md", "platforms/azure.md", "platforms/huawei.md", "platforms/k8s.md", "platforms/container.md", "platforms/onprem.md"]],
  ["Reference", ["reference.md", "faq.md"]],
];
// docs/th/ mirrors docs/ page for page: the same menu in Thai, and a switch in the header to the same page in the
// other language.
const SECTIONS_TH = {"Getting started": "เริ่มต้นใช้งาน", Guides: "วิธีใช้", Pictures: "ภาพ", Platforms: "แพลตฟอร์ม", Reference: "อ้างอิง"};
const NAV_TH = NAV.map(([head, list]) => [SECTIONS_TH[head], list.map((p) => "th/" + p)]);
const WORDS = {
  en: {search: "Search", searchHint: "Search the docs", noResults: "Nothing found", overview: "Overview", prev: "← Previous", next: "Next →", other: "ภาษาไทย", edit: "Edit this page on GitHub", report: "Report a problem", suffix: " · Walkboard docs", home: "Walkboard docs", menu: "Menu", brand: "docs"},
  th: {search: "ค้นหา", searchHint: "ค้นหาในคู่มือ", noResults: "ไม่พบ", overview: "ภาพรวม", prev: "← ก่อนหน้า", next: "ถัดไป →", other: "English", edit: "แก้หน้านี้บน GitHub", report: "แจ้งปัญหา", suffix: " · คู่มือ Walkboard", home: "คู่มือ Walkboard", menu: "เมนู", brand: "คู่มือ"},
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// GitHub's anchor for a heading: lower case, punctuation dropped, spaces to hyphens.
export const slug = (s) => s.trim().toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "").replace(/\s/g, "-");
const htmlName = (md) => md.replace(/(^|\/)README\.md$/, "$1index.html").replace(/\.md$/, ".html");

// A link or image address in docs/<from>, as the site serves it from the page at docs/<from>.
function href(url, from) {
  const up = "../".repeat(from.split("/").length - 1);
  if (url.startsWith(MEDIA)) return up + "media/" + url.slice(MEDIA.length);
  if (url.startsWith(SITE)) return up + url.slice(SITE.length);
  if (/^[a-z]+:|^#/.test(url)) return url;
  const [file, hash] = url.split("#");
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), file));
  if (target.startsWith("../")) {
    const inRepo = target.slice(3);
    const isDir = fs.existsSync(path.join(repo, inRepo)) && fs.statSync(path.join(repo, inRepo)).isDirectory();
    return `${GITHUB}/${isDir ? "tree" : "blob"}/main/${inRepo.replace(/\/$/, "")}${hash ? "#" + hash : ""}`;
  }
  return (file.endsWith(".md") ? htmlName(file) : file) + (hash ? "#" + hash : "");
}

// Inline Markdown: code, images, links, bold, and a few HTML tags written in the docs on purpose.
const INLINE = /(`[^`]+`)|(!\[[^\]]*\]\([^)\s]+\))|(\[(?:[^[\]]|\[[^\]]*\])*\]\([^)\s]+\))|(\*\*.+?\*\*)|(<\/?(?:a|br|sub|sup|kbd)\b[^>]*>)/g;
function inline(text, from) {
  let out = "", at = 0;
  for (const m of text.matchAll(INLINE)) {
    out += esc(text.slice(at, m.index).replace(/\\\|/g, "|"));
    const [t] = m;
    if (m[1]) out += `<code>${esc(t.slice(1, -1).replace(/\\\|/g, "|"))}</code>`;
    else if (m[2]) {
      const [, alt, src] = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      out += `<img src="${esc(href(src, from))}" alt="${esc(alt)}" loading="lazy">`;
    } else if (m[3]) {
      const [, label, url] = t.match(/^\[([\s\S]*)\]\(([^)]+)\)$/);
      const to = href(url, from);
      out += `<a href="${esc(to)}"${/^https?:/.test(to) && !to.startsWith(SITE) ? ' target="_blank" rel="noopener"' : ""}>${inline(label, from)}</a>`;
    } else if (m[4]) out += `<strong>${inline(t.slice(2, -2), from)}</strong>`;
    else out += t;
    at = m.index + t.length;
  }
  return out + esc(text.slice(at).replace(/\\\|/g, "|"));
}

const LIST = /^( *)([-*]|\d+\.) (.*)$/;
const startsBlock = (l) => /^(#{1,6} |```|\| |> )/.test(l) || LIST.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());

// Block Markdown, for the lines of a page or of one list item.
export function render(lines, from) {
  const out = [];
  for (let i = 0; i < lines.length; ) {
    const l = lines[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    // An HTML comment is left out; "<!-- github only -->" also leaves out the paragraph after it (a note that only
    // makes sense on github.com, such as "these pages are also a website").
    if (l.startsWith("<!--")) {
      const only = /github only/.test(l);
      for (i++; only && i < lines.length && !lines[i].trim(); i++);
      for (; only && i < lines.length && lines[i].trim(); i++);
      continue;
    }
    if (l.startsWith("```")) {
      const lang = l.slice(3).trim(), code = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) code.push(lines[i]);
      i++;
      out.push(`<pre><code${lang ? ` class="lang-${esc(lang)}"` : ""}>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{1,6}) (.+)$/);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n} id="${esc(slug(h[2]))}">${inline(h[2], from)}</h${n}>`);
      i++;
      continue;
    }
    if (l.startsWith("|") && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() || "")) {
      const head = cells(l), rows = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(cells(lines[i]));
      out.push(`<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c, from)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, from)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (l.startsWith("> ")) {
      const q = [];
      for (; i < lines.length && lines[i].startsWith(">"); i++) q.push(lines[i].replace(/^> ?/, ""));
      out.push(`<blockquote>${render(q, from)}</blockquote>`);
      continue;
    }
    const li = l.match(LIST);
    if (li) {
      const indent = li[1].length, ordered = /\d/.test(li[2]), items = [];
      while (i < lines.length) {
        const m = lines[i].match(LIST);
        if (!m || m[1].length !== indent || /\d/.test(m[2]) !== ordered) break;
        const width = indent + m[2].length + 1, body = [m[3]];
        for (i++; i < lines.length; i++) {
          const x = lines[i];
          if (x.trim() && x.search(/\S/) < width) break;
          if (!x.trim() && !(lines[i + 1] || "").startsWith(" ".repeat(width))) break;
          body.push(x.slice(Math.min(width, x.search(/\S|$/))));
        }
        items.push(render(body, from).replace(/^<p>([\s\S]*?)<\/p>/, "$1"));
        while (i < lines.length && !lines[i].trim() && (lines[i + 1] || "").match(LIST)?.[1].length === indent) i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((x) => `<li>${x}</li>`).join("")}</${tag}>`);
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !(para.length && startsBlock(lines[i])); i++) para.push(lines[i].trim());
    // A paragraph that is only a link to a live example is drawn as a button.
    const tryIt = para.length === 1 && /^\[[^\]]+\]\([^)\s]*examples\/[^)\s]*\)$/.test(para[0]);
    out.push(`<p${tryIt ? ' class="try"' : ""}>${inline(para.join("\n"), from)}</p>`);
  }
  return out.join("\n");
}

const pages = (dir = "") => fs.readdirSync(path.join(docs, dir), {withFileTypes: true}).flatMap((e) => {
  const rel = dir ? `${dir}/${e.name}` : e.name;
  return e.isDirectory() ? pages(rel) : e.name.endsWith(".md") ? [rel] : [];
});
const titleOf = (md) => fs.readFileSync(path.join(docs, md), "utf8").match(/^# (.+)$/m)?.[1] || md;

const isOverview = (p) => /(^|\/)[^/]+\/README\.md$/.test(p) && p !== "th/README.md";

function layout(md, body) {
  const up = "../".repeat(md.split("/").length - 1);
  const th = md.startsWith("th/"), w = WORDS[th ? "th" : "en"], menu = th ? NAV_TH : NAV;
  const title = titleOf(md);
  const navTitle = (p) => (isOverview(p) ? w.overview : titleOf(p));
  const nav = menu.map(([head, list]) => `<div class="navsec"><div class="navhead">${esc(head)}</div>${list.map((p) => `<a href="${up}${htmlName(p)}"${p === md ? ' class="on" aria-current="page"' : ""}>${esc(navTitle(p))}</a>`).join("")}</div>`).join("");
  // Previous and next page in the menu's order.
  const order = menu.flatMap(([, list]) => list);
  const at = order.indexOf(md);
  const pageLink = (p, cls, label) => `<a class="${cls}" href="${up}${htmlName(p)}"><span>${label}</span>${esc(titleOf(p))}</a>`;
  const pager = at < 0 ? "" : `<nav class="pager">${at > 0 ? pageLink(order[at - 1], "prev", w.prev) : ""}${at < order.length - 1 ? pageLink(order[at + 1], "next", w.next) : ""}</nav>`;
  // The same page in the other language, or that language's start page when there is none.
  const twin = th ? md.slice(3) : "th/" + md, other = fs.existsSync(path.join(docs, twin)) ? twin : th ? "README.md" : "th/README.md";
  return `<!doctype html>
<html lang="${th ? "th" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(md === "README.md" || md === "th/README.md" ? w.home : title + w.suffix)}</title>
<link rel="icon" href="${up}logo/mark.svg">
<link rel="stylesheet" href="${up}assets/site.css">
</head>
<body>
<header class="top"><a class="brand" href="${up}${th ? "th/" : ""}index.html"><img src="${up}logo/mark.svg" alt="" width="22" height="22">Walkboard <span>${w.brand}</span></a><nav><button class="searchbtn" type="button" aria-label="${w.searchHint}"><span>${w.search}</span><kbd>⌘K</kbd></button><a href="${up}${htmlName(other)}" hreflang="${th ? "en" : "th"}" lang="${th ? "en" : "th"}">${w.other}</a><a href="${GITHUB}" target="_blank" rel="noopener">GitHub</a></nav></header>
<div class="wrap">
<details class="menu"><summary>${w.menu}</summary><nav>${nav}</nav></details>
<aside class="side"><nav>${nav}</nav></aside>
<main class="doc">
${body}
${pager}
<footer class="foot"><a href="${GITHUB}/blob/main/docs/${md}" target="_blank" rel="noopener">${w.edit}</a> · <a href="${GITHUB}/issues/new/choose" target="_blank" rel="noopener">${w.report}</a></footer>
</main>
</div>
<script src="${up}assets/site.js" defer data-index="${up}search-${th ? "th" : "en"}.json" data-base="${up}" data-hint="${w.searchHint}" data-none="${w.noResults}"></script>
</body>
</html>
`;
}

// Text a reader searches, from Markdown: no markup, no images, no anchors, link words kept.
const plain = (t) => t.replace(/<[^>]+>/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*>|]/g, " ").replace(/\s+/g, " ").trim();

// The search index of one language: a page's opening, each of its sections, and on a platform page each kind's row,
// so "RDS" lands on the RDS row. Read by assets/site.js the first time search opens.
function searchIndex(list) {
  const out = [];
  for (const md of list) {
    const lines = fs.readFileSync(path.join(docs, md), "utf8").split("\n").filter((l) => !l.startsWith("<!--"));
    const url = htmlName(md), title = titleOf(md);
    let head = "", anchor = "", buf = [];
    const flush = () => {
      const x = plain(buf.join(" "));
      if (x || head) out.push({u: url + (anchor ? "#" + anchor : ""), t: title, h: head, x: x.slice(0, 1200)});
      buf = [];
    };
    for (const l of lines) {
      const h = l.match(/^#{2,3} (.+)$/);
      const row = l.match(/^\| <a id="([^"]+)"><\/a>\*\*([^*]+)\*\*(.*)$/);
      if (h) {
        flush();
        head = plain(h[1]);
        anchor = slug(h[1]);
      } else if (row) out.push({u: url + "#" + row[1], t: title, h: row[2], x: plain(row[3])});
      else if (!/^# /.test(l)) buf.push(l);
    }
    flush();
  }
  return out;
}

export function build(out, {media = process.env.WALKBOARD_MEDIA || path.join(repo, "media"), examples = true} = {}) {
  fs.rmSync(out, {recursive: true, force: true});
  fs.mkdirSync(out, {recursive: true});
  const built = [];
  for (const md of pages()) {
    const html = path.join(out, htmlName(md));
    fs.mkdirSync(path.dirname(html), {recursive: true});
    fs.writeFileSync(html, layout(md, render(fs.readFileSync(path.join(docs, md), "utf8").split("\n"), md)));
    built.push(htmlName(md));
  }
  // Everything else under docs/ (logo, the site's stylesheet) goes as it is.
  fs.cpSync(docs, out, {recursive: true, filter: (f) => !f.endsWith(".md")});
  if (fs.existsSync(media)) fs.cpSync(media, path.join(out, "media"), {recursive: true, filter: (f) => path.basename(f) !== ".git"});
  if (examples) {
    fs.mkdirSync(path.join(out, "examples"), {recursive: true});
    for (const name of ["pictures", "platforms"]) {
      execFileSync(process.execPath, [path.join(repo, "skills/walkboard/bin/walkboard.mjs"), "export", path.join(repo, "examples", name), "--html", path.join(out, "examples", name + ".html")], {stdio: "ignore"});
      built.push(`examples/${name}.html`);
    }
  }
  const all = pages().filter((p) => p !== "GUIDE.md");
  fs.writeFileSync(path.join(out, "search-en.json"), JSON.stringify(searchIndex(all.filter((p) => !p.startsWith("th/")))));
  fs.writeFileSync(path.join(out, "search-th.json"), JSON.stringify(searchIndex(all.filter((p) => p.startsWith("th/")))));
  fs.writeFileSync(path.join(out, ".nojekyll"), "");
  return built;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(repo, "site"));
  const built = build(out);
  console.log(`${built.length} pages in ${path.relative(process.cwd(), out) || "."}`);
}
