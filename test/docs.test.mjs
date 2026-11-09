// The docs link to each other, to the README and to the skill's references: every link must lead somewhere.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pages = (dir) => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));

// GitHub's anchor for a heading: lower case, punctuation dropped, spaces to hyphens. Plus <a id="…"> anchors.
function anchors(text) {
  const out = new Set();
  for (const m of text.matchAll(/^#{1,6} (.+)$/gm)) out.add(m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-"));
  for (const m of text.matchAll(/<a id="([^"]+)"/g)) out.add(m[1]);
  return out;
}

test("every link in the docs and the README leads to a file and, when it names one, a place in it", () => {
  const files = [...pages("docs"), "README.md", "AGENTS.md", "SECURITY.md"];
  const broken = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), "utf8").replace(/```[\s\S]*?```/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
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
});
