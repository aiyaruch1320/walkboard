// The pages a script records should show the status a Claude Code user sees: an agent listening, not "tell your
// agent". The server counts a poll as recent for a few minutes (lib/server.mjs, `listens`), so the mark that says one
// happened is written now and renewed while the script runs. listening(dir) marks a plan folder; stop() ends it.
import fs from "node:fs";
import path from "node:path";

const marks = new Set();
const write = () => marks.forEach((f) => fs.writeFileSync(f, new Date().toISOString()));
let timer = null;

export function listening(dir) {
  fs.mkdirSync(path.join(dir, ".walkboard"), {recursive: true});
  marks.add(path.join(dir, ".walkboard", "listens"));
  write();
  timer ||= setInterval(write, 30_000);
}

export function stopListening() {
  clearInterval(timer);
  timer = null;
}
