// Writes, from lib/profiles.mjs:
// - skills/walkboard/references/profiles/<profile>.md, short, so an agent reads only the platform it draws;
// - docs/platforms/<profile>.md, for people: every kind with an anchor, which the page's ⚠ card links to.
// docs/platforms/README.md is written by hand and left alone.
// `node scripts/profiles-doc.mjs --check` fails when they are out of date (npm test runs it).
import fs from "node:fs";
import {PROFILES} from "../skills/walkboard/lib/profiles.mjs";

const outputs = [
  {dir: new URL("../skills/walkboard/references/profiles/", import.meta.url), name: "references/profiles", files: {}, keep: []},
  {dir: new URL("../docs/platforms/", import.meta.url), name: "docs/platforms", files: {}, keep: ["README.md"]},
];
const [agent, people] = outputs;

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
  agent.files[`${p}.md`] = lines.join("\n") + "\n";
  people.files[`${p}.md`] = peoplePage(p, pr);
}

// One table for zones, one for boxes, then the lines. Each kind's row starts with an anchor named after its key
// ("#rds"), so a link can land on it; "Usually in" links to the zones of the same page.
function peoplePage(p, pr) {
  const cell = (s) => String(s).replace(/\|/g, "\\|");
  const where = (d) => (d.in || []).map((z) => (pr.kinds[z] ? `[${cell(pr.kinds[z].name)}](#${z})` : cell(z))).join(", ") || "anywhere";
  const fields = (d) => Object.entries(d.props || {}).map(([n, w]) => (Array.isArray(w) ? `${n} (${w.join(", ")})` : n)).join("; ");
  // runs: the profiles whose parts can sit inside it (containers on a VM, Kubernetes on EKS).
  const runs = (d) => (d.runs?.length ? `can run ${d.runs.map((x) => `[${PROFILES[x]?.label || x}](${x}.md)`).join(", ")} inside` : "");
  const row = (k, d, note = "") => `| <a id="${k}"></a>**${cell(d.name)}** \`${p}:${k}\` | ${where(d)} | ${[cell(note), runs(d)].filter(Boolean).join("; ")} | ${cell((d.also || []).join(", "))} | ${cell(fields(d))} |`;
  const head = "| Kind | Usually in | Notes | Also called | Fields |\n|---|---|---|---|---|";
  const kinds = Object.entries(pr.kinds);
  const zones = kinds.filter(([, d]) => d.zone === true), boxes = kinds.filter(([, d]) => d.zone !== true);
  const out = [
    `# ${pr.label}`,
    "",
    `[Docs](../README.md) › [Platforms](README.md) › ${pr.label}`,
    "",
    `What boxes, zones and lines can be on ${pr.label}, and where each usually sits. On a map the page draws a kind's icon and fields, and shows a small amber ⚠ when something sits outside the zones listed here. That is a hint, never a block: if you mean it, it is fine. How profiles work: [Platforms](README.md).`,
    "",
    // The same small system drawn on this platform: examples/platforms, shot by scripts/screenshots.mjs.
    `![A small web app with a database and a job, drawn with ${pr.label} kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/${p}.png)`,
    "",
    `[Try it: click a box, see its kind and fields ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=${p}&step=all)`,
    "",
    "This page is generated from `skills/walkboard/lib/profiles.mjs`.",
    "",
    "## Zones",
    "",
    "Frames that hold other things.",
    "",
    head,
    ...zones.map(([k, d]) => row(k, d, d.see ? "rules look through it to the zone around" : "")),
    "",
    "## Boxes",
    "",
    head,
    ...boxes.map(([k, d]) => row(k, d, d.zone === "also" ? "a box, or a zone when something runs inside it" : "")),
  ];
  const ls = Object.entries(pr.lines || {});
  if (ls.length) out.push("", "## Lines", "", "A line without a kind is traffic: one part calling another.", "", "| Kind | Means |", "|---|---|", ...ls.map(([k, d]) => `| <a id="line-${k}"></a>\`${p}:${k}\` | ${cell(d.name)} |`));
  return out.join("\n") + "\n";
}

for (const o of outputs) {
  const had = fs.existsSync(o.dir) ? fs.readdirSync(o.dir).filter((f) => !o.keep.includes(f)) : [];
  if (process.argv.includes("--check")) {
    const stale = [...had.filter((f) => !o.files[f]), ...Object.keys(o.files).filter((f) => !had.includes(f) || fs.readFileSync(new URL(f, o.dir), "utf8") !== o.files[f])];
    if (stale.length) {
      console.error(`${o.name} is out of date (${stale.join(", ")}): run node scripts/profiles-doc.mjs`);
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(o.dir, {recursive: true});
    for (const f of had) if (!o.files[f]) fs.rmSync(new URL(f, o.dir));
    for (const [f, text] of Object.entries(o.files)) fs.writeFileSync(new URL(f, o.dir), text);
  }
}
