import test from "node:test";
import assert from "node:assert/strict";
import {validateDraft, applyDraft, describeDraft, draftLine} from "../skills/walkboard/lib/draft.mjs";

const plan = () => ({
  title: "t",
  nodes: {api: {name: "API"}, db: {name: "Aurora"}, erp: {name: "ERP"}, nat: {name: "NAT"}},
  views: [{id: "m", kind: "map", zones: [{label: "AWS", zones: [{label: "App", nodes: ["api", "nat"]}, {label: "Data", nodes: ["db"]}]}, {label: "On-prem", nodes: ["erp"]}],
    links: [{from: "api", to: "db"}, {from: "api", to: "nat", label: "egress"}]}, {id: "f", kind: "flow"}],
});
const draft = (...ops) => ({version: 1, views: {m: {ops: ops.map((o, i) => ({id: "op" + (i + 1), ...o}))}}});

test("a draft's shape is checked: change kinds, fields, ids, size", () => {
  assert.deepEqual(validateDraft(draft({op: "addNode", node: "new:1", name: "Redis", zone: "Data"}, {op: "move", node: "erp", to: "AWS"})), []);
  assert.match(validateDraft({views: {}}).join(), /version/);
  assert.match(validateDraft(draft({op: "paint", node: "api"})).join(), /unknown change/);
  assert.match(validateDraft(draft({op: "addNode", node: "redis", name: "Redis", zone: "Data"})).join(), /bad node/);
  assert.match(validateDraft(draft({op: "addNode", node: "new:1", name: "  ", zone: "Data"})).join(), /bad name/);
  assert.match(validateDraft(draft({op: "remove", node: "__proto__"})).join(), /bad node/);
  assert.match(validateDraft(draft({op: "addLink", from: "api", to: "api"})).join(), /two different/);
  assert.match(validateDraft(draft({op: "editZone", zone: "App"})).join(), /bad label/);
  assert.match(validateDraft(draft({op: "remove", node: "api", color: "red"})).join(), /unknown field/);
  assert.match(validateDraft({version: 1, views: {m: {ops: [{id: "a", op: "remove", node: "api"}, {id: "a", op: "remove", node: "db"}]}}}).join(), /unique id/);
  assert.match(validateDraft(draft(...Array.from({length: 301}, () => ({op: "remove", node: "api"})))).join(), /at most 300/);
});

test("added boxes, zones and lines are drawn in, marked, and the plan itself is untouched", () => {
  const p = plan(), before = JSON.stringify(p);
  const r = applyDraft(p, draft({op: "addNode", node: "new:1", name: "Redis", zone: "Data", at: 0}, {op: "addZone", zone: "DR", parent: ""}, {op: "addLink", from: "api", to: "new:1", label: ":6379"}), "m");
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(r.view.zones[0].zones[1].nodes, ["new:1", "db"]);
  assert.equal(r.plan.nodes["new:1"].name, "Redis");
  assert.equal(r.view.zones.at(-1).label, "DR");
  assert.deepEqual(r.marks.nodes["new:1"], {mark: "add"});
  assert.deepEqual(r.marks.links["api>new:1"], {mark: "add"});
  assert.deepEqual(r.pending, ["op1", "op2", "op3"]);
});

test("moves leave where they came from; edits keep what was there; removals stay drawn", () => {
  const r = applyDraft(plan(), draft({op: "move", node: "erp", to: "App", from: "On-prem"}, {op: "editNode", node: "db", name: "Aurora v2"}, {op: "remove", node: "nat"}, {op: "editLink", from: "api", to: "nat", state: "blocked"}), "m");
  assert.deepEqual(r.marks.nodes.erp, {mark: "move", from: "On-prem", fromAt: 0});
  assert.deepEqual(r.marks.nodes.db, {mark: "change", was: {name: "Aurora"}});
  assert.equal(r.marks.nodes.nat.mark, "remove");
  assert.equal(r.marks.links["api>nat"].mark, "change");
  assert.ok(r.view.zones[0].zones[0].nodes.includes("erp"));
});

test("what the agent already did counts as done; what no longer fits is stale with why", () => {
  const p = plan();
  p.nodes.redis = {name: "Redis"};
  p.views[0].zones[0].zones[1].nodes.push("redis");
  p.views[0].links.push({from: "api", to: "redis"});
  const r = applyDraft(p, draft({op: "addNode", node: "new:1", name: "redis", zone: "Data"}, {op: "addLink", from: "api", to: "new:1"}, {op: "move", node: "db", to: "Gone"}, {op: "move", node: "erp", to: "Data", from: "Somewhere"}, {op: "remove", node: "ghost"}), "m");
  assert.deepEqual(r.done, ["op1", "op2", "op5"]);
  assert.deepEqual(r.stale.map((s) => s.id), ["op3", "op4"]);
  assert.match(r.stale[1].why, /now puts it in "On-prem"/);
  assert.deepEqual(r.pending, []);
});

test("taking out a box the draft added takes its lines; a zone never goes inside itself", () => {
  const r = applyDraft(plan(), draft({op: "addNode", node: "new:1", name: "Redis", zone: "Data"}, {op: "addLink", from: "api", to: "new:1"}, {op: "remove", node: "new:1"}, {op: "moveZone", zone: "AWS", to: "App"}), "m");
  assert.equal(r.plan.nodes["new:1"], undefined);
  assert.equal(r.marks.links["api>new:1"], undefined);
  assert.ok(!r.view.links.some((l) => l.to === "new:1"));
  assert.match(r.stale.find((s) => s.id === "op4").why, /inside itself/);
});

test("pictures that take no draft, or an empty one, come back as they are", () => {
  const p = plan();
  assert.equal(applyDraft(p, draft(), "m").view, p.views[0]);
  assert.equal(applyDraft(p, {version: 1, views: {f: {ops: [{id: "a", op: "remove", node: "api"}]}}}, "f").view, p.views[1]);
});

test("the agent reads names next to ids, and one line per change", () => {
  const d = describeDraft(plan(), draft({op: "addNode", node: "new:1", name: "Redis", zone: "Data"}, {op: "addLink", from: "api", to: "new:1", label: ":6379"}, {op: "move", node: "erp", to: "App"}, {op: "move", node: "db", to: "Nowhere"}), "m");
  assert.equal(d.changes[1].from, "API (api)");
  assert.equal(d.changes[1].to, "Redis (new:1)");
  assert.equal(d.changes[2].to, "App");
  assert.equal(d.stale[0].why, 'no zone "Nowhere"');
  assert.equal(draftLine(d.changes[1]), "+ line API (api) → Redis (new:1) :6379");
});

test("two pages' changes are kept together: added join, dropped go, edited win", async () => {
  const {rebaseOps} = await import("../skills/walkboard/lib/draft.mjs");
  const a = {id: "a", op: "remove", node: "x"}, b = {id: "b", op: "remove", node: "y"}, c = {id: "c", op: "remove", node: "z"};
  const base = [a, b], local = [{...a, node: "x2"}, c], remote = [a, b, {id: "d", op: "remove", node: "w"}];
  assert.deepEqual(rebaseOps(base, local, remote).map((o) => o.id + (o.node || "")), ["ax2", "dw", "cz"]);
});

test("text that reads one way on screen and another to the agent is refused; built-in names are no change kind", () => {
  assert.match(validateDraft(draft({op: "addNode", node: "new:1", name: "‮evil", zone: "Data"})).join(), /bad name/);
  assert.match(validateDraft(draft({op: "constructor"}, {op: "toString"})).join(), /unknown change "constructor".*unknown change "toString"/);
});

test("taking out a box tells which lines go with it", () => {
  const d = describeDraft(plan(), draft({op: "remove", node: "nat"}), "m");
  assert.deepEqual(d.changes[0].lines, ["API (api) → NAT (nat) egress"]);
  assert.match(draftLine(d.changes[0]), /and its lines: API \(api\) → NAT \(nat\) egress/);
});

const model = () => ({
  title: "t", nodes: {users: {name: "users"}, orders: {name: "orders"}},
  views: [{id: "d", kind: "datamodel", groups: [{label: "Shop", tables: ["orders"]}], tables: [
    {node: "users", columns: [{name: "id", type: "bigint", key: "pk"}, {name: "email", type: "text"}]},
    {node: "orders", columns: [{name: "id", type: "uuid", key: "pk"}, {name: "user_id", type: "bigint", ref: "users.id"}]}]}],
});
const dm = (...ops) => ({version: 1, views: {d: {ops: ops.map((o, i) => ({id: "op" + (i + 1), ...o}))}}});

test("data models: tables, columns, keys and groups are drafted, marked, and the plan untouched", () => {
  const p = model(), before = JSON.stringify(p);
  const r = applyDraft(p, dm(
    {op: "addTable", node: "new:p", name: "payments", group: "Shop"},
    {op: "addColumn", table: "new:p", column: "order_id", type: "uuid"},
    {op: "editColumn", table: "new:p", column: "order_id", ref: "orders.id"},
    {op: "editColumn", table: "users", column: "email", name: "email_address"},
    {op: "removeColumn", table: "orders", column: "user_id"},
    {op: "addGroup", group: "Accounts", tables: ["users"]}), "d");
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(r.validate ?? validateDraft(dm({op: "addTable", node: "new:p", name: "payments"})), []);
  assert.deepEqual(r.marks.nodes["new:p"], {mark: "add"});
  assert.equal(r.view.tables.at(-1).columns[0].ref, "orders.id");
  assert.equal(r.marks.links["new:p.order_id>orders.id"].mark, "add");
  assert.deepEqual(r.marks.columns["users.email_address"], {mark: "change", was: {name: "email"}});
  assert.equal(r.marks.columns["orders.user_id"].mark, "remove");
  assert.equal(r.marks.links["orders.user_id>users.id"].mark, "remove");
  assert.deepEqual(r.view.groups.map((g) => [g.label, g.tables]), [["Shop", ["orders", "new:p"]], ["Accounts", ["users"]]]);
  assert.deepEqual(r.pending.length, 6);
});

test("data models: moving a table between groups, stale and done changes, words for the agent", () => {
  const r = applyDraft(model(), dm({op: "moveTable", node: "orders", to: "", from: "Shop"}, {op: "addColumn", table: "ghost", column: "x"}, {op: "addColumn", table: "users", column: "id"}), "d");
  assert.deepEqual(r.marks.nodes.orders, {mark: "move", from: "Shop"});
  assert.deepEqual(r.stale.map((s) => s.id), ["op2"]);
  assert.deepEqual(r.done, ["op3"]);
  const d = describeDraft(model(), dm({op: "editColumn", table: "orders", column: "user_id", ref: ""}), "d");
  assert.equal(draftLine(d.changes[0]), "~ column orders: user_id foreign key taken out");
  assert.match(validateDraft(dm({op: "addColumn", table: "users", column: "a.b"})).join(), /bad column/);
});
