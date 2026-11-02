import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validate} from "../lib/schema.mjs";

const base = () => ({
  title: "t",
  settings: {teachBack: false, commit: "suggest"},
  steps: [{id: "s1", title: "one", status: "doing", nodes: ["a"]}],
  views: [{id: "f", kind: "flow", lanes: [{nodes: ["a", "b"]}]}],
  nodes: {a: {name: "A", status: "new"}, b: {name: "B", status: "ext"}},
});

test("the examples are valid", () => {
  for (const dir of fs.readdirSync(new URL("../examples", import.meta.url))) {
    const plan = JSON.parse(fs.readFileSync(new URL(`../examples/${dir}/plan.json`, import.meta.url), "utf8"));
    assert.deepEqual(validate(plan), [], dir);
  }
});

test("a minimal plan is valid", () => {
  assert.deepEqual(validate(base()), []);
});

test("settings must be asked for up front", () => {
  const p = base();
  delete p.settings;
  assert.match(validate(p)[0], /settings/);
  p.settings = {teachBack: "yes", commit: "always"};
  assert.equal(validate(p).length, 2);
});

test("references to missing nodes, steps and actors are reported", () => {
  const p = base();
  p.steps[0].nodes.push("ghost");
  p.views.push(
    {id: "k", kind: "k8s", workloads: [{node: "a", uses: ["cfg"]}], links: [{from: "a", to: "b", state: "maybe"}]},
    {id: "q", kind: "sequence", actors: ["a"], messages: [{from: "a", to: "b", step: "nope"}]},
    {id: "t", kind: "transform", stages: [{node: "a", columns: ["x", "y"], rows: [["1"]]}, {node: "b"}]},
  );
  const out = validate(p).join("\n");
  for (const want of [/node "ghost"/, /node "cfg"/, /state "maybe"/, /actor "b"/, /step "nope"/, /จำนวนช่อง/, /stage ที่ 2/]) assert.match(out, want);
});

test("unknown kinds, statuses and duplicate ids are reported", () => {
  const p = base();
  p.views.push({id: "f", kind: "pie"});
  p.steps.push({id: "s1", title: "again", status: "later"});
  p.nodes.a.status = "wip";
  const out = validate(p).join("\n");
  for (const want of [/kind "pie"/, /view id "f" ซ้ำ/, /step id "s1" ซ้ำ/, /status "later"/, /status "wip"/]) assert.match(out, want);
});
