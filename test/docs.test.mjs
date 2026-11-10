// The docs link to each other, to the README and to the skill's references: every link must lead somewhere,
// on github.com (the Markdown) and on the docs site (scripts/site.mjs).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {build, slug, MEDIA, SITE} from "../scripts/site.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const media = path.join(root, "media");
const pages = (dir) => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));

// A page's anchors: its headings, as GitHub and the site name them, and its <a id="…">.
function anchors(text) {
  const out = new Set();
  for (const m of text.matchAll(/^#{1,6} (.+)$/gm)) out.add(slug(m[1]));
  for (const m of text.matchAll(/<a id="([^"]+)"/g)) out.add(m[1]);
  return out;
}

test("every link in the docs and the README leads to a file and, when it names one, a place in it", () => {
  const files = [...pages("docs"), "README.md", "AGENTS.md", "SECURITY.md"];
  const broken = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), "utf8").replace(/```[\s\S]*?```/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      // Images on the media branch: checked when it is checked out here (media/).
      if (target.startsWith(MEDIA)) {
        if (fs.existsSync(media) && !fs.existsSync(path.join(media, target.slice(MEDIA.length)))) broken.push(`${f}: ${target} (not in media/)`);
        continue;
      }
      // The site: a live example, or a docs page by its site name (README is index; a folder means its README).
      if (target.startsWith(SITE)) {
        const [file, hash] = target.slice(SITE.length).split(/[?#]/);
        if (/^examples\/(pictures|platforms)\.html$/.test(file)) continue;
        const md = path.join(root, "docs", file === "" || file.endsWith("/") ? file + "README.md" : file.replace(/index\.html$/, "README.md").replace(/\.html$/, ".md"));
        if (!fs.existsSync(md)) broken.push(`${f}: ${target} (not a page the site builds)`);
        else if (hash && target.includes("#") && !anchors(fs.readFileSync(md, "utf8")).has(hash)) broken.push(`${f}: ${target} (no such place)`);
        continue;
      }
      if (/^(https?:|mailto:)/.test(target)) continue;
      const [file, hash] = target.split("#");
      const to = file ? path.join(path.dirname(path.join(root, f)), decodeURI(file)) : path.join(root, f);
      if (!fs.existsSync(to)) broken.push(`${f}: ${target}`);
      else if (hash && to.endsWith(".md") && !anchors(fs.readFileSync(to, "utf8")).has(hash)) broken.push(`${f}: ${target} (no such place)`);
    }
  }
  assert.deepEqual(broken, []);
});

test("every picture kind and every platform has its own page", async () => {
  const {PROFILES} = await import("../skills/walkboard/lib/profiles.mjs");
  const kinds = fs.readdirSync(path.join(root, "skills/walkboard/references/views")).map((f) => f.replace(/\.md$/, ""));
  for (const k of kinds) assert.ok(fs.existsSync(path.join(root, "docs/pictures", k + ".md")), `docs/pictures/${k}.md`);
  for (const p of Object.keys(PROFILES)) assert.ok(fs.existsSync(path.join(root, "docs/platforms", p + ".md")), `docs/platforms/${p}.md`);
  // The live examples have one picture of each kind, and one map per platform, named after it.
  const pictures = JSON.parse(fs.readFileSync(path.join(root, "examples/pictures/plan.json"), "utf8")).views.map((v) => v.kind);
  for (const k of kinds) assert.ok(pictures.includes(k), `examples/pictures has a ${k}`);
  const platforms = JSON.parse(fs.readFileSync(path.join(root, "examples/platforms/plan.json"), "utf8")).views.map((v) => v.id);
  for (const p of Object.keys(PROFILES)) assert.ok(platforms.includes(p), `examples/platforms has a view "${p}"`);
});

test("the docs site builds, and every link and image in it leads to a file of the site", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-site-"));
  const built = build(out, {media: path.join(out, "no-media")});
  assert.ok(built.includes("index.html") && built.includes("th/index.html") && built.includes("examples/pictures.html"));
  const broken = [];
  for (const page of built.filter((p) => p.endsWith(".html") && !p.startsWith("examples/"))) {
    const html = fs.readFileSync(path.join(out, page), "utf8");
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(url) || url.includes("media/")) continue;
      const [file, hash] = url.split(/[?#]/);
      const to = path.join(path.dirname(path.join(out, page)), file);
      if (!fs.existsSync(to)) broken.push(`${page}: ${url}`);
      else if (hash && url.includes("#") && to.endsWith(".html") && !fs.readFileSync(to, "utf8").includes(`id="${hash}"`)) broken.push(`${page}: ${url} (no such place)`);
    }
  }
  fs.rmSync(out, {recursive: true, force: true});
  assert.deepEqual(broken, []);
});

test("each picture with draft mode has the #sketch anchor its draft help links to, in English and Thai", async () => {
  const {draftable} = await import("../skills/walkboard/lib/draft.mjs");
  const kinds = fs.readdirSync(path.join(root, "docs/pictures")).map((f) => f.replace(/\.md$/, "")).filter((k) => draftable({kind: k}));
  assert.ok(kinds.length >= 6, kinds.join());
  for (const k of kinds) for (const dir of ["docs/pictures", "docs/th/pictures"]) {
    const f = path.join(root, dir, k + ".md");
    if (dir.includes("/th/") && !fs.existsSync(f)) continue;
    assert.match(fs.readFileSync(f, "utf8"), /<a id="sketch"><\/a>/, `${dir}/${k}.md`);
  }
});

test("every docs page has its Thai twin at the same path under docs/th/, with the same anchors", () => {
  const pages = (dir) => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? (e.name === "th" ? [] : pages(path.join(dir, e.name))) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));
  const ids = (f) => [...fs.readFileSync(f, "utf8").matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]).sort();
  for (const en of pages("docs").map((f) => path.relative(path.join(root, "docs"), path.join(root, f)))) {
    if (en === "GUIDE.md") continue; // a stub that only points at the new pages
    const th = path.join(root, "docs/th", en);
    assert.ok(fs.existsSync(th), `docs/th/${en}`);
    assert.deepEqual(ids(th), ids(path.join(root, "docs", en)), `anchors of docs/th/${en}`);
  }
});
