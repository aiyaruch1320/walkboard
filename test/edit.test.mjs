import {test} from "node:test";
import assert from "node:assert/strict";
import {parseSet, applySet} from "../skills/planview/lib/edit.mjs";

const plan = () => ({title: "t", steps: [{id: "a", title: "A", status: "doing"}], nodes: {x: {name: "X", status: "new", why: "w"}}});

test("one call updates the plan, a step and a node", () => {
  const p = applySet(plan(), parseSet(["approved=true", "step:a", "status=review", "confirmed=true", "node:x", "status=done", "why=", "plan", "goal=ship it"]));
  assert.equal(p.approved, true);
  assert.deepEqual(p.steps[0], {id: "a", title: "A", status: "review", confirmed: true});
  assert.deepEqual(p.nodes.x, {name: "X", status: "done"});
  assert.equal(p.goal, "ship it");
});

test("unknown targets and prototype keys are refused", () => {
  assert.throws(() => applySet(plan(), parseSet(["step:nope", "status=done"])), /no step:nope/);
  assert.throws(() => applySet(plan(), parseSet(["node:constructor", "status=done"])), /no node:constructor/);
  assert.throws(() => applySet(plan(), parseSet(["__proto__=1"])), /bad key/);
  assert.throws(() => applySet(plan(), parseSet(["thing:x", "a=1"])), /unknown target/);
});
