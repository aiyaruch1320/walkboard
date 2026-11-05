// Writes skills/walkboard/references/profiles.md from lib/profiles.mjs, so the agent reads the kinds it may use.
// `node scripts/profiles-doc.mjs --check` fails when the file is out of date (npm test runs it).
import fs from "node:fs";
import {PROFILES} from "../skills/walkboard/lib/profiles.mjs";

const out = new URL("../skills/walkboard/references/profiles.md", import.meta.url);
const lines = ["# Profiles", "",
  "Generated from `lib/profiles.mjs` by `node scripts/profiles-doc.mjs`; do not edit by hand.", "",
  "On a `map`, a box (`nodes.<id>.kind`), a zone (`kind` on the zone) or a line (`kind` on the link) can say what it is on a platform: `\"kind\": \"aws:rds\"`, with that kind's fields in `props` (`{\"engine\": \"postgres\"}`, strings). Its icon follows the kind unless `icon` says otherwise. Leave `kind` out for anything the profiles do not cover: it is drawn as you write it. \"Sits in\" is where a kind usually goes: the page warns (never blocks) when the nearest zone with a kind is another one, and a zone without a kind says nothing. Kinds marked \"box, also a zone\" can be either: make it a zone when something runs inside it (an EC2 with its containers).", ""];
for (const [p, pr] of Object.entries(PROFILES)) {
  lines.push(`## ${p} (${pr.label})`, "", "| Kind | Is | Sits in | props |", "|---|---|---|---|");
  for (const [k, d] of Object.entries(pr.kinds)) {
    const is = d.zone === true ? (d.see ? "zone (rules look through it)" : "zone") : d.zone === "also" ? "box, also a zone" : "box";
    const props = Object.entries(d.props || {}).map(([n, w]) => (Array.isArray(w) ? `${n}: ${w.join(" / ")}` : n)).join("; ");
    lines.push(`| \`${p}:${k}\` ${d.name} | ${is} | ${(d.in || []).map((z) => pr.kinds[z]?.name || z).join(", ") || "anywhere"} | ${props} |`);
  }
  const ls = Object.entries(pr.lines || {});
  if (ls.length) lines.push("", `Lines: ${ls.map(([k, d]) => `\`${p}:${k}\` ${d.name}`).join(", ")}; without a kind a line is traffic.`);
  lines.push("");
}
const text = lines.join("\n");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== text) {
    console.error("references/profiles.md is out of date: run node scripts/profiles-doc.mjs");
    process.exit(1);
  }
} else fs.writeFileSync(out, text);
