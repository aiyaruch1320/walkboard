import {test} from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {VERSION, cmpVersion, newerInstalled} from "../skills/walkboard/lib/version.mjs";

const json = (f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));

test("the version comes from the plugin manifest, and package.json says the same", () => {
  assert.equal(VERSION, json("../.claude-plugin/plugin.json").version);
  assert.equal(VERSION, json("../package.json").version);
});

test("versions compare as numbers", () => {
  assert.ok(cmpVersion("0.10.0", "0.9.1") > 0);
  assert.ok(cmpVersion("0.9.1", "0.9.1") === 0);
  assert.ok(cmpVersion("0.7.0", "0.9.0") < 0);
});

// The plugin manager's cache: <marketplace>/<plugin>/<version>/skills/walkboard.
function cache(versions) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-cache-"));
  for (const v of versions) {
    fs.mkdirSync(path.join(root, v, "skills", "walkboard", "bin"), {recursive: true});
    fs.mkdirSync(path.join(root, v, ".claude-plugin"), {recursive: true});
    fs.writeFileSync(path.join(root, v, ".claude-plugin", "plugin.json"), JSON.stringify({version: v}));
    fs.writeFileSync(path.join(root, v, "skills", "walkboard", "bin", "walkboard.mjs"), "");
  }
  return (v) => path.join(root, v, "skills", "walkboard");
}

test("a newer copy installed beside this one is found; an older one or a repository is not", () => {
  const at = cache(["0.7.0", "0.9.1", "0.10.0"]);
  assert.equal(newerInstalled(at("0.9.1")), "0.10.0");
  assert.equal(newerInstalled(at("0.10.0")), null);
  assert.equal(newerInstalled(fileURLToPath(new URL("../skills/walkboard", import.meta.url))), null);
});
