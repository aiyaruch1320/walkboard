// Writes, from lib/profiles.mjs:
// - skills/walkboard/references/profiles/<profile>.md, short, so an agent reads only the platform it draws;
// - docs/platforms/<profile>.md, for people: every kind with an anchor, which the page's ⚠ card links to, and the
//   same in Thai under docs/th/platforms/.
// docs/platforms/README.md is written by hand and left alone.
// `node scripts/profiles-doc.mjs --check` fails when they are out of date (npm test runs it).
import fs from "node:fs";
import {PROFILES} from "../skills/walkboard/lib/profiles.mjs";

// The words of a platform page, in English and in Thai (docs/th/ mirrors docs/). Kind names, keys and fields stay as
// the platform calls them.
const WORDS = {
  en: {
    anywhere: "anywhere",
    runs: (list) => `can run ${list} inside`,
    head: "| Kind | Usually in | Notes | Also called | Fields |",
    intro: (l) => `This page lists every ${l} kind that Walkboard knows: the boxes, zones and lines you can draw on a [map](../pictures/map.md), and where each one usually sits.`,
    warn: `When a box has one of these kinds, the map shows its icon and fields. If you put it somewhere other than the zones listed under "Usually in", a small amber ⚠ appears next to its name. It is only a hint, so if you mean it, that is fine. To learn how kinds work, see [Platforms](README.md).`,
    alt: (l) => `A small web app with a database and a job, drawn with ${l} kinds`,
    tryIt: "Open this map in the live example and click a box to see its kind ↗",
    zones: "## Zones", zonesIntro: "A zone is a frame that holds boxes and other zones.",
    see: "a box inside it is checked against the zone around it",
    boxes: "## Boxes", boxesIntro: "A box is one resource, such as a server, a database or a queue.",
    also: "a box, or a zone when something runs inside it",
    lines: "## Lines", linesIntro: "A line without a kind is plain traffic, one part calling another. These kinds are for lines that mean something else.",
    lineHead: "| Kind | Means |",
    note: "> **Good to know:** This page is generated from `skills/walkboard/lib/profiles.mjs`. To add a kind, change that file and run `node scripts/profiles-doc.mjs`.",
  },
  th: {
    anywhere: "ที่ไหนก็ได้",
    runs: (list) => `มี ${list} อยู่ข้างในได้`,
    head: "| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | Field |",
    intro: (l) => `หน้านี้รวม kind ทั้งหมดของ ${l} ที่ Walkboard รู้จัก คือ box, zone และ line ที่วาดบน [map](../pictures/map.md) ได้ และบอกว่าแต่ละอย่างมักอยู่ตรงไหน`,
    warn: `ถ้า box มี kind จากหน้านี้ map จะแสดง icon และ field ของมัน ถ้าวางไว้นอก zone ที่อยู่ในคอลัมน์ "มักอยู่ใน" จะมีป้าย ⚠ เล็กๆ ขึ้นข้างชื่อ เป็นแค่คำเตือน ถ้าตั้งใจวางแบบนั้นก็ไม่เป็นไร อ่านว่า kind ทำงานยังไงได้ที่หน้า[แพลตฟอร์ม](README.md)`,
    alt: (l) => `web app เล็กๆ ที่มี database และ job วาดด้วย kind ของ ${l}`,
    tryIt: "เปิด map นี้ใน live example แล้วคลิก box เพื่อดู kind ของมัน ↗",
    zones: "## Zone", zonesIntro: "zone คือกรอบที่มี box หรือ zone อื่นอยู่ข้างใน",
    see: "box ข้างในจะถูกเช็กกับ zone ที่ครอบมันอีกชั้น",
    boxes: "## Box", boxesIntro: "box คือ resource หนึ่งตัว เช่น server, database หรือ queue",
    also: "เป็น box หรือเป็น zone เมื่อมีอะไรรันอยู่ข้างใน",
    lines: "## Line", linesIntro: "line ที่ไม่มี kind คือ traffic ธรรมดา ส่วนหนึ่งเรียกอีกส่วน kind ด้านล่างใช้กับ line ที่หมายถึงอย่างอื่น",
    lineHead: "| Kind | หมายถึง |",
    note: "> **ควรรู้:** หน้านี้สร้างอัตโนมัติจาก `skills/walkboard/lib/profiles.mjs` ถ้าจะเพิ่ม kind ให้แก้ไฟล์นั้น แล้วรัน `node scripts/profiles-doc.mjs`",
  },
};


const outputs = [
  {dir: new URL("../skills/walkboard/references/profiles/", import.meta.url), name: "references/profiles", files: {}, keep: []},
  {dir: new URL("../docs/platforms/", import.meta.url), name: "docs/platforms", files: {}, keep: ["README.md"]},
  {dir: new URL("../docs/th/platforms/", import.meta.url), name: "docs/th/platforms", files: {}, keep: ["README.md"]},
];
const [agent, people, peopleTh] = outputs;

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
  peopleTh.files[`${p}.md`] = peoplePage(p, pr, "th");
}

// One table for zones, one for boxes, then the lines. Each kind's row starts with an anchor named after its key
// ("#rds"), so a link can land on it; "Usually in" links to the zones of the same page.
function peoplePage(p, pr, lang = "en") {
  const w = WORDS[lang];
  const cell = (s) => String(s).replace(/\|/g, "\\|");
  const where = (d) => (d.in || []).map((z) => (pr.kinds[z] ? `[${cell(pr.kinds[z].name)}](#${z})` : cell(z))).join(", ") || w.anywhere;
  const fields = (d) => Object.entries(d.props || {}).map(([n, v]) => (Array.isArray(v) ? `${n} (${v.join(", ")})` : n)).join("; ");
  // runs: the profiles whose parts can sit inside it (containers on a VM, Kubernetes on EKS).
  const runs = (d) => (d.runs?.length ? w.runs(d.runs.map((x) => `[${PROFILES[x]?.label || x}](${x}.md)`).join(", ")) : "");
  const row = (k, d, note = "") => `| <a id="${k}"></a>**${cell(d.name)}** \`${p}:${k}\` | ${where(d)} | ${[cell(note), runs(d)].filter(Boolean).join("; ")} | ${cell((d.also || []).join(", "))} | ${cell(fields(d))} |`;
  const head = w.head + "\n|---|---|---|---|---|";
  const kinds = Object.entries(pr.kinds);
  const zones = kinds.filter(([, d]) => d.zone === true), boxes = kinds.filter(([, d]) => d.zone !== true);
  const out = [
    `# ${pr.label}`,
    "",
    w.intro(pr.label),
    "",
    w.warn,
    "",
    // The same small system drawn on this platform: examples/platforms, shot by scripts/screenshots.mjs.
    `![${w.alt(pr.label)}](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/${p}.png)`,
    "",
    `[${w.tryIt}](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=${p}&step=all)`,
    "",
    w.zones,
    "",
    w.zonesIntro,
    "",
    head,
    ...zones.map(([k, d]) => row(k, d, d.see ? w.see : "")),
    "",
    w.boxes,
    "",
    w.boxesIntro,
    "",
    head,
    ...boxes.map(([k, d]) => row(k, d, d.zone === "also" ? w.also : "")),
  ];
  const ls = Object.entries(pr.lines || {});
  if (ls.length) out.push("", w.lines, "", w.linesIntro, "", w.lineHead, "|---|---|", ...ls.map(([k, d]) => `| <a id="line-${k}"></a>\`${p}:${k}\` | ${cell(d.name)} |`));
  out.push("", w.note);
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
