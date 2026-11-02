import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validate} from "../skills/planview/lib/schema.mjs";

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

test("wrong types are reported instead of crashing", () => {
  for (const bad of [{steps: "abc"}, {views: {}}, {nodes: {a: null}}, {views: [{id: "f", kind: "flow", lanes: {}}]}, {nodes: []}, {glossary: {x: 1}}]) {
    const out = validate({...base(), ...bad});
    assert.ok(out.length, JSON.stringify(bad));
  }
  assert.deepEqual(validate("x"), ["plan.json ไม่ใช่ object"]);
});

test("prototype names are not mistaken for nodes or statuses", () => {
  const p = base();
  p.steps[0].nodes.push("constructor");
  p.nodes.a.status = "toString";
  const out = validate(p).join("\n");
  assert.match(out, /node "constructor"/);
  assert.match(out, /status "toString"/);
});

test("explain mode needs no commit setting, and lint asks for evidence", async () => {
  const {lint} = await import("../skills/planview/lib/schema.mjs");
  const p = {...base(), mode: "explain", settings: {teachBack: true}};
  assert.deepEqual(validate(p), []);
  const warn = lint(p).join("\n");
  assert.match(warn, /node "a" ไม่มี file/);
  assert.match(warn, /step "s1" ไม่มี detail/);
  assert.doesNotMatch(warn, /node "b"/);
});

test("approval, teach-back records and the glossary are checked", () => {
  const p = {...base(), approved: "yes", glossary: {CronJob: "งานที่ตั้งเวลารันเอง"}};
  p.steps[0].confirmed = "ok";
  const out = validate(p).join("\n");
  assert.match(out, /approved/);
  assert.match(out, /confirmed/);
  assert.doesNotMatch(out, /glossary/);
});

test("file references parse with lines, ranges and named roots", async () => {
  const {parseFile} = await import("../skills/planview/lib/schema.mjs");
  const plan = {root: "/repo/app", roots: {deploy: "/repo/deploy/"}};
  assert.deepEqual(parseFile("src/a.go:12", plan), {rootName: null, root: "/repo/app", rel: "src/a.go", line: 12, end: 12, abs: "/repo/app/src/a.go"});
  assert.equal(parseFile("src/a.go:12-20", plan).end, 20);
  assert.equal(parseFile("deploy:k8s/job.yaml:7", plan).abs, "/repo/deploy/k8s/job.yaml");
  assert.equal(parseFile("README.md", plan).line, null);
  assert.equal(parseFile("x.go:3", {}).abs, null);
});

test("root, roots, start, editor and depth are checked", () => {
  const p = {...base(), root: "relative", roots: {d: 1}, start: "nope", settings: {teachBack: true, commit: "auto", editor: "notepad", depth: "deep"}};
  const out = validate(p).join("\n");
  for (const want of [/root ต้องเป็น/, /roots ต้องเป็น/, /start "nope"/, /settings.editor/, /settings.depth/]) assert.match(out, want);
  assert.deepEqual(validate({...base(), root: "/repo", start: "s1"}), []);
});
