// Writes skills/walkboard/references/profiles/<profile>.md from lib/profiles.mjs, so an agent reads only the platform it draws.
// `node scripts/profiles-doc.mjs --check` fails when they are out of date (npm test runs it).
import fs from "node:fs";
import {PROFILES} from "../skills/walkboard/lib/profiles.mjs";

const dir = new URL("../skills/walkboard/references/profiles/", import.meta.url);
const files = {};
for (const [p, pr] of Object.entries(PROFILES)) {
  const lines = [`# ${p} (${pr.label})`, "", "Each line: kind and name; `zone` or `also zone` (else a box); in = where it usually sits; props. How to use them: views/map.md.", ""];
  for (const [k, d] of Object.entries(pr.kinds)) {
    const is = d.zone === true ? (d.see ? "zone (rules look through it)" : "zone") : d.zone === "also" ? "also zone" : "";
    const props = Object.entries(d.props || {}).map(([n, w]) => (Array.isArray(w) ? `${n}: ${w.join(" / ")}` : n)).join("; ");
    const where = (d.in || []).map((z) => pr.kinds[z]?.name || z).join(", ");
    lines.push("- " + [`\`${p}:${k}\` ${d.name}`, is, where && `in ${where}`, props].filter(Boolean).join(" · "));
  }
  const ls = Object.entries(pr.lines || {});
  if (ls.length) lines.push("", `Lines: ${ls.map(([k, d]) => `\`${p}:${k}\` ${d.name}`).join(", ")}; without a kind a line is traffic.`);
  files[`${p}.md`] = lines.join("\n") + "\n";
}
const had = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
if (process.argv.includes("--check")) {
  const stale = [...had.filter((f) => !files[f]), ...Object.keys(files).filter((f) => !had.includes(f) || fs.readFileSync(new URL(f, dir), "utf8") !== files[f])];
  if (stale.length) {
    console.error(`references/profiles is out of date (${stale.join(", ")}): run node scripts/profiles-doc.mjs`);
    process.exit(1);
  }
} else {
  fs.mkdirSync(dir, {recursive: true});
  for (const f of had) if (!files[f]) fs.rmSync(new URL(f, dir));
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(new URL(f, dir), text);
}
