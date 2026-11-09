// Which copy of Walkboard this is: its version (from the plugin manifest beside it, when there is one) and where it lives.
// A server records both, so `open` from another copy notices, and an open page notices when its server was replaced.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The plugin keeps its manifest two levels up (<plugin>/skills/walkboard); a skill copied on its own has none.
export function versionOf(skillDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(skillDir, "..", "..", ".claude-plugin", "plugin.json"), "utf8")).version || null;
  } catch {
    return null;
  }
}
export const VERSION = versionOf(SKILL_DIR);

// 0.10.0 is newer than 0.9.1: numbers, not text.
export function cmpVersion(a, b) {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}

// A newer copy the plugin manager installed beside this one (<cache>/<marketplace>/<plugin>/<version>/skills/walkboard).
// A session keeps the copy it started with, so after an update it still runs this one until a new session starts.
export function newerInstalled(skillDir = SKILL_DIR, version = versionOf(skillDir)) {
  const root = path.resolve(skillDir, "..", ".."), parent = path.dirname(root);
  if (!version || path.basename(root) !== version) return null;
  let best = null;
  try {
    for (const v of fs.readdirSync(parent)) {
      if (/^\d+\.\d+\.\d+$/.test(v) && cmpVersion(v, best ?? version) > 0 && fs.existsSync(path.join(parent, v, "skills", "walkboard", "bin", "walkboard.mjs"))) best = v;
    }
  } catch {}
  return best;
}
