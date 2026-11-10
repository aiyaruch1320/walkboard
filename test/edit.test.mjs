import {test} from "node:test";
import assert from "node:assert/strict";
import {parseSet, applySet} from "../skills/walkboard/lib/edit.mjs";

const plan = () => ({title: "t", steps: [{id: "a", title: "A", status: "doing"}], nodes: {x: {name: "X", status: "new", why: "w"}}});

test("one call updates the plan, a step and a node", () => {
  const p = applySet(plan(), parseSet(["approved=true", "step:a", "status=review", "confirmed=true", "node:x", "status=done", "why=", "plan", "goal=ship it"]));
  assert.equal(p.approved, true);
  assert.deepEqual(p.steps[0], {id: "a", title: "A", status: "review", confirmed: true});
  assert.deepEqual(p.nodes.x, {name: "X", status: "done"});
  assert.equal(p.goal, "ship it");
});

test("JSON values set lists such as a step's commits", () => {
  const p = applySet(plan(), parseSet(["step:a", 'commits=[{"message":"refactor: x","files":["a.go"]},{"message":"feat: y"}]']));
  assert.deepEqual(p.steps[0].commits, [{message: "refactor: x", files: ["a.go"]}, {message: "feat: y"}]);
  assert.throws(() => applySet(plan(), parseSet(["step:a", "commits=[oops"])), /not valid JSON/);
});

test("design lists are targets by id", () => {
  const p = {constraints: [{id: "cidr", text: "x", confirmed: false}], criteria: [{id: "cost", weight: 1}]};
  applySet(p, parseSet(["constraint:cidr", "confirmed=true", "criterion:cost", "weight=3"]));
  assert.equal(p.constraints[0].confirmed, true);
  assert.equal(p.criteria[0].weight, 3);
  assert.throws(() => applySet(p, parseSet(["constraint:nope", "confirmed=true"])), /no constraint:nope/);
});

test("unknown targets and prototype keys are refused", () => {
  assert.throws(() => applySet(plan(), parseSet(["step:nope", "status=done"])), /no step:nope/);
  assert.throws(() => applySet(plan(), parseSet(["node:constructor", "status=done"])), /no node:constructor/);
  assert.throws(() => applySet(plan(), parseSet(["__proto__=1"])), /bad key/);
  assert.throws(() => applySet(plan(), parseSet(["thing:x", "a=1"])), /unknown target/);
});

test("dotted keys, quoted text and a mistyped folder", () => {
  const p = {settings: {commit: "auto"}, nodes: {a: {name: "A"}}};
  applySet(p, parseSet(["settings.commit=suggest", "node:a", 'what="0001042"']));
  assert.equal(p.settings.commit, "suggest");
  assert.equal(p.nodes.a.what, "0001042");
  assert.throws(() => parseSet(["~/typo/dir", "step:a", "status=done"]), /neither a target/);
  assert.throws(() => applySet(p, parseSet(["settings.__proto__.x=1"])), /bad key/);
});

test("text that only starts like JSON stays text", () => {
  const p = applySet(plan(), parseSet(["step:a", "commitMessage=[skip ci] bump", "detail=\"quoted\" word"]));
  assert.equal(p.steps[0].commitMessage, "[skip ci] bump");
  assert.equal(p.steps[0].detail, '"quoted" word');
  assert.throws(() => applySet(plan(), parseSet(["plan", "settings={commit: auto}"])), /not valid JSON/);
});

test("set keeps a plan written one entry per line, so the agent's next Edit still finds its text", async () => {
  const fs = await import("node:fs"), os = await import("node:os"), path = await import("node:path");
  const {savePlan} = await import("../skills/walkboard/lib/edit.mjs");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "walkboard-lines-")), "plan.json");
  const text = '{"title":"t",\n"steps":[\n {"id":"a","title":"A","status":"doing"}],\n"nodes":{\n "x":{"name":"X","status":"new"},\n "y":{"name":"Y","why":"because"}}}\n';
  fs.writeFileSync(file, text);
  savePlan(file, applySet(JSON.parse(text), parseSet(["step:a", "status=review"])), text);
  const after = fs.readFileSync(file, "utf8");
  assert.ok(after.includes('\n "y":{"name":"Y","why":"because"}'), after);
  assert.ok(after.includes('{"id":"a","title":"A","status":"review"}'), after);
  assert.deepEqual(JSON.parse(after).steps[0].status, "review");
  // Pretty-printed stays pretty-printed, compact stays compact.
  const pretty = JSON.stringify(JSON.parse(text), null, 2) + "\n";
  fs.writeFileSync(file, pretty);
  savePlan(file, JSON.parse(pretty), pretty);
  assert.equal(fs.readFileSync(file, "utf8"), pretty);
  const compact = JSON.stringify(JSON.parse(text)) + "\n";
  fs.writeFileSync(file, compact);
  savePlan(file, JSON.parse(compact), compact);
  assert.equal(fs.readFileSync(file, "utf8"), compact);
});
