import test from "node:test";
import assert from "node:assert/strict";
import {validateDraft, applyDraft, describeDraft, draftLine} from "../skills/walkboard/lib/draft.mjs";

const plan = () => ({
  title: "t",
  nodes: {api: {name: "API"}, db: {name: "Aurora"}, erp: {name: "ERP"}, nat: {name: "NAT"}},
  views: [{id: "m", kind: "map", zones: [{label: "AWS", zones: [{label: "App", nodes: ["api", "nat"]}, {label: "Data", nodes: ["db"]}]}, {label: "On-prem", nodes: ["erp"]}],
    links: [{from: "api", to: "db"}, {from: "api", to: "nat", label: "egress"}]}, {id: "f", kind: "sequence"}],
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
  assert.match(validateDraft(draft({op: "editZone", zone: "App"})).join(), /needs a label, an icon or a note/);
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

test("a new box dropped into a zone sketched after it waits for the zone, and so does a line to it", () => {
  const r = applyDraft(plan(), draft(
    {op: "addZone", zone: "Hub", parent: ""},
    {op: "addNode", node: "new:1", name: "Gateway", zone: "Edge", at: 0},
    {op: "addLink", from: "erp", to: "new:1"},
    {op: "addZone", zone: "Edge", parent: "Hub", at: 0},
    {op: "addNode", node: "new:2", name: "Loop", zone: "Nowhere"},
  ), "m");
  assert.deepEqual(r.view.zones.find((z) => z.label === "Hub").zones[0], {label: "Edge", nodes: ["new:1"]});
  assert.deepEqual(r.marks.links["erp>new:1"], {mark: "add"});
  assert.deepEqual(r.stale, [{id: "op5", why: 'no zone "Nowhere"'}]);
  assert.deepEqual(r.pending.sort(), ["op1", "op2", "op3", "op4"]);
  assert.deepEqual(validateDraft(draft({op: "addNode", node: "new:1", name: "Gateway", zone: "App", what: "x".repeat(300)})), []);
  assert.match(validateDraft(draft({op: "addNode", node: "new:1", name: "Gateway", zone: "App", what: "x".repeat(301)})).join(), /bad what/);
});

test("a zone's icon and note are drafted with it or on their own", () => {
  const r = applyDraft(plan(), draft({op: "addZone", zone: "Edge", parent: "", icon: "cloudfront", note: "CDN"}, {op: "editZone", zone: "App", icon: "kubernetes", note: "EKS"}, {op: "editZone", zone: "Data", label: "Storage", note: ""}), "m");
  assert.deepEqual(r.view.zones.at(-1), {label: "Edge", icon: "cloudfront", note: "CDN", nodes: []});
  const aws = r.view.zones[0].zones;
  assert.equal(aws[0].icon, "kubernetes");
  assert.equal(aws[0].note, "EKS");
  assert.equal(aws[1].label, "Storage");
  assert.equal(r.marks.zones.App.mark, "change");
  assert.equal(r.marks.zones.Storage.was, "Data");
  assert.deepEqual(applyDraft(plan(), draft({op: "editZone", zone: "App", note: ""}), "m").done, ["op1"]);
  assert.match(draftLine({op: "editZone", zone: "App", icon: "kubernetes"}), /zone "App", icon "kubernetes"/);
});

test("a line turned round keeps its label and kind, and later edits still find it", () => {
  const r = applyDraft(plan(), draft({op: "reverseLink", from: "api", to: "nat"}, {op: "editLink", from: "api", to: "nat", state: "blocked"}), "m");
  const l = r.view.links.find((x) => x.from === "nat" && x.to === "api");
  assert.deepEqual(l, {from: "nat", to: "api", label: "egress", state: "blocked"});
  assert.equal(r.marks.links["nat>api"].reversed, true);
  assert.equal(r.marks.links["api>nat"], undefined);
  assert.deepEqual(r.pending, ["op1", "op2"]);
  // Done once the plan has it the other way; stale when both ways exist or the line is gone.
  const p2 = plan();
  p2.views[0].links[1] = {from: "nat", to: "api"};
  assert.deepEqual(applyDraft(p2, draft({op: "reverseLink", from: "api", to: "nat"}), "m").done, ["op1"]);
  const p3 = plan();
  p3.views[0].links.push({from: "db", to: "api"});
  assert.match(applyDraft(p3, draft({op: "reverseLink", from: "api", to: "db"}), "m").stale[0].why, /other way/);
  assert.match(validateDraft(draft({op: "reverseLink", from: "api", to: "api"})).join(), /two different/);
  assert.match(draftLine({op: "reverseLink", from: "api", to: "nat"}), /now nat → api/);
});

test("graphs and maps turn lines round too; new boxes there keep a note and an icon", () => {
  const p = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}}, views: [
    {id: "s", kind: "state", states: ["a", "b"], transitions: [{from: "a", to: "b", label: "pay"}]},
    {id: "k", kind: "map", zones: [{label: "Z", nodes: ["a", "b"]}], links: [{from: "a", to: "b", label: ":443", state: "todo"}]},
  ]};
  const d = (view, ...ops) => ({version: 1, views: {[view]: {ops: ops.map((o, i) => ({id: "op" + (i + 1), ...o}))}}});
  const s = applyDraft(p, d("s", {op: "reverseEdge", from: "a", to: "b"}, {op: "editEdge", from: "a", to: "b", label: "refund"}, {op: "addBox", node: "new:c", name: "C", what: "waits", icon: "clock"}), "s");
  assert.deepEqual(s.view.transitions, [{from: "b", to: "a", label: "refund"}]);
  assert.equal(s.marks.links["b>a"].reversed, true);
  assert.deepEqual(s.plan.nodes["new:c"], {name: "C", what: "waits", icon: "clock"});
  const k = applyDraft(p, d("k", {op: "reverseLink", from: "a", to: "b"}), "k");
  assert.deepEqual(k.view.links, [{from: "b", to: "a", label: ":443", state: "todo"}]);
  assert.deepEqual(applyDraft(p, d("s", {op: "reverseEdge", from: "b", to: "a"}), "s").done, ["op1"]);
  assert.deepEqual(applyDraft(p, d("s", {op: "reverseEdge", from: "a", to: "zz"}), "s").stale[0].why, "no such line");
  assert.match(draftLine({op: "reverseEdge", from: "a", to: "b"}), /now b → a/);
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

test("a state picture's start and ends change in a draft; a decision has only a start", () => {
  const p = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}}, views: [
    {id: "s", kind: "state", states: ["a", "b"], start: "a", end: ["b"], transitions: [{from: "a", to: "b"}]},
    {id: "q", kind: "decision", nodes: ["a", "b"], edges: [{from: "a", to: "b"}]}]};
  const on = (v, ...ops) => ({version: 1, views: {[v]: {ops: ops.map((o, i) => ({id: "op" + (i + 1), ...o}))}}});
  assert.deepEqual(validateDraft(on("s", {op: "setStart", node: "b"}, {op: "setEnd", node: "a", end: true}, {op: "setStart", node: ""})), []);
  assert.match(validateDraft(on("s", {op: "setEnd", node: "a", end: "yes"})).join(), /bad end/);
  const r = applyDraft(p, on("s", {op: "setStart", node: "b"}, {op: "setEnd", node: "a", end: true}, {op: "setEnd", node: "b", end: false}), "s");
  assert.equal(r.view.start, "b");
  assert.deepEqual(r.view.end, ["a"]);
  assert.equal(r.marks.nodes.a.mark, "change");
  assert.equal(r.marks.nodes.b.mark, "change");
  assert.equal(p.views[0].start, "a");
  assert.deepEqual(applyDraft(p, on("s", {op: "setStart", node: "a"}), "s").done, ["op1"]);
  assert.deepEqual(applyDraft(p, on("s", {op: "setEnd", node: "b", end: true}), "s").done, ["op1"]);
  assert.equal(applyDraft(p, on("s", {op: "setStart", node: ""}), "s").view.start, undefined);
  assert.match(applyDraft(p, on("s", {op: "setStart", node: "ghost"}), "s").stale[0].why, /no box/);
  assert.equal(applyDraft(p, on("q", {op: "setStart", node: "b"}), "q").view.start, "b");
  assert.equal(applyDraft(p, on("q", {op: "setEnd", node: "b", end: true}), "q").view.end, undefined);
  assert.match(draftLine({op: "setStart", node: "b"}), /starts at b/);
  assert.match(draftLine({op: "setEnd", node: "b", end: false}), /no longer an end/);
  // A decision box's kind: chosen, back to its lines, on a new box too; never on a state picture.
  assert.deepEqual(validateDraft(on("q", {op: "setShape", node: "a", shape: "question"}, {op: "setShape", node: "b", shape: ""})), []);
  assert.match(validateDraft(on("q", {op: "setShape", node: "a", shape: "diamond"})).join(), /bad shape/);
  const q = applyDraft(p, on("q", {op: "setShape", node: "a", shape: "question"}, {op: "addBox", node: "new:c", name: "C"}, {op: "setShape", node: "new:c", shape: "end"}), "q");
  assert.deepEqual(q.view.shapes, {a: "question", "new:c": "end"});
  assert.equal(q.marks.nodes.a.mark, "change");
  const back = applyDraft({...p, views: [p.views[0], {...p.views[1], shapes: {a: "end"}}]}, on("q", {op: "setShape", node: "a", shape: ""}), "q");
  assert.equal(back.view.shapes, undefined);
  assert.deepEqual(applyDraft(p, on("q", {op: "setShape", node: "a", shape: ""}), "q").done, ["op1"]);
  assert.equal(applyDraft(p, on("s", {op: "setShape", node: "a", shape: "end"}), "s").view.shapes, undefined);
  assert.match(draftLine({op: "setShape", node: "a", shape: "question"}), /a question/);
  assert.match(draftLine({op: "setShape", node: "a", shape: ""}), /shape from its lines/);
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
  const hopped = applyDraft(model(), dm({op: "addGroup", group: "Ops", tables: ["users"]}, {op: "moveTable", node: "users", to: "Shop", from: ""}), "d");
  assert.deepEqual(hopped.stale, []);
  assert.ok(hopped.view.groups.find((g) => g.label === "Shop").tables.includes("users"));
  assert.deepEqual(hopped.view.groups.find((g) => g.label === "Ops").tables, []);
  const backOut = applyDraft(model(), dm({op: "addGroup", group: "Ops", tables: ["users", "orders"]}, {op: "moveTable", node: "users", to: "", from: ""}), "d");
  assert.deepEqual(backOut.stale, []);
  assert.deepEqual(backOut.view.groups.find((g) => g.label === "Ops").tables, ["orders"]);
  assert.match(validateDraft(dm({op: "editRelation", to: "users.id", kind: "1:1"})).join(), /needs from/);
  assert.match(validateDraft(dm({op: "editRelation", from: "orders.user_id", to: "users.id", kind: "many"})).join(), /bad kind/);
  const oneToOne = applyDraft(model(), dm({op: "editRelation", from: "orders.user_id", to: "users.id", kind: "1:1"}), "d");
  assert.deepEqual(oneToOne.stale, []);
  assert.equal(oneToOne.view.tables.find((tb) => tb.node === "orders").columns.find((c) => c.name === "user_id").ref, undefined);
  assert.deepEqual(oneToOne.view.relations, [{from: "orders.user_id", to: "users.id", kind: "1:1"}]);
  assert.equal(oneToOne.marks.links["orders.user_id>users.id"].mark, "change");
  assert.deepEqual(applyDraft(model(), dm({op: "editRelation", from: "orders.user_id", to: "users.id", kind: "N:1"}), "d").done, ["op1"]);
  assert.match(applyDraft(model(), dm({op: "editRelation", from: "users.id", to: "orders.id", kind: "1:1"}), "d").stale[0].why, /no line/);
  const related = {...model()};
  related.views = related.views.map((x) => ({...x, relations: [{from: "users.email", to: "orders.id", kind: "1:1"}]}));
  const off = applyDraft(related, dm({op: "removeRelation", from: "users.email", to: "orders.id"}), "d");
  assert.equal(off.marks.links["users.email>orders.id"].mark, "remove");
  assert.equal(off.view.relations.length, 1);
  assert.deepEqual(applyDraft(model(), dm({op: "removeRelation", from: "users.email", to: "orders.id"}), "d").done, ["op1"]);
  const moved = applyDraft(related, dm({op: "editColumn", table: "users", column: "email", name: "mail"}), "d");
  assert.equal(moved.view.relations[0].from, "users.mail");
  assert.match(draftLine({op: "editRelation", from: "a.x", to: "b.y", kind: "1:1"}), /line a\.x → b\.y: 1:1/);
  assert.match(validateDraft(dm({op: "editGroup", group: "Shop"})).join(), /needs a label, an icon or a note/);
  assert.deepEqual(validateDraft(dm({op: "addGroup", group: "Ops", tables: ["users"], icon: "user", note: "team"}, {op: "editGroup", group: "Shop", note: "one db"})), []);
  const framed = applyDraft(model(), dm({op: "addGroup", group: "Ops", tables: ["users"], icon: "user", note: "team"}, {op: "editGroup", group: "Shop", note: "one db"}), "d");
  assert.equal(framed.view.groups.find((g) => g.label === "Ops").note, "team");
  assert.equal(framed.view.groups.find((g) => g.label === "Shop").note, "one db");
  assert.equal(framed.marks.zones.Shop.mark, "change");
  assert.deepEqual(applyDraft(model(), dm({op: "editGroup", group: "Shop", note: ""}), "d").done, ["op1"]);
  assert.match(draftLine({op: "editGroup", group: "Shop", note: "one db"}), /group "Shop", note "one db"/);
  assert.deepEqual(validateDraft(dm({op: "addTable", node: "new:n", name: "notes", what: "free text", icon: "database"})), []);
  const noted = applyDraft(model(), dm({op: "addTable", node: "new:n", name: "notes", what: "free text", icon: "database"}, {op: "editNode", node: "users", what: "who signs in", icon: "user"}), "d");
  assert.deepEqual(noted.plan.nodes["new:n"], {name: "notes", what: "free text", icon: "database"});
  assert.equal(noted.plan.nodes.users.what, "who signs in");
  assert.equal(noted.marks.nodes.users.mark, "change");
  assert.match(draftLine({op: "addTable", node: "new:n", name: "notes", what: "free text", icon: "database"}), /notes \(new:n\): "free text" icon "database"/);
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

test("flows: boxes added and moved between lanes, lanes added, renamed and moved; a plan of steps is a flow", () => {
  const p = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}, c: {name: "C"}}, steps: [{id: "s1", title: "One", nodes: ["a", "b"]}, {id: "s2", title: "Two", nodes: ["c"]}]};
  const d = {version: 1, views: {flow: {ops: [
    {id: "o1", op: "addBox", node: "new:x", name: "X", lane: 1, at: 0},
    {id: "o2", op: "moveBox", node: "b", lane: 1},
    {id: "o3", op: "addLane", title: "Three"},
    {id: "o4", op: "editLane", lane: 0, title: "First"},
    {id: "o5", op: "moveLane", lane: 2, to: 0},
    {id: "o6", op: "remove", node: "a"}]}}};
  assert.deepEqual(validateDraft(d), []);
  const r = applyDraft(p, d, "flow");
  assert.deepEqual(r.view.lanes.map((l) => [l.title, l.nodes]), [["Three", []], ["First", ["a"]], ["Two", ["new:x", "c", "b"]]]);
  assert.deepEqual(r.marks.lanes, {0: {mark: "add"}, 1: {mark: "change", was: "One"}});
  assert.deepEqual(r.marks.nodes.b, {mark: "move", from: "One"});
  assert.equal(r.marks.nodes.a.mark, "remove");
  assert.equal(r.pending.length, 6);
  const words = describeDraft(p, d, "flow");
  assert.equal(draftLine(words.changes[1]), '↦ box B (b) → lane 2 "Two" (step s2), out of "One" (step s1)');
  assert.deepEqual(words.lanesAfter, ["Three", "s1: First", "s2: Two"]);
  // Named by title, a lane is found even after another page moved it.
  const moved = applyDraft(p, {version: 1, views: {flow: {ops: [{id: "m", op: "moveLane", lane: 1, to: 0}, {id: "b", op: "addBox", node: "new:y", name: "Y", lane: 1, laneTitle: "Two"}]}}}, "flow");
  assert.deepEqual(moved.view.lanes.map((l) => l.nodes), [["c", "new:y"], ["a", "b"]]);
});

test("flows: a box in several lanes (steps touching it) moves out of the lane it was dragged from, never into one that has it", () => {
  const p = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}, c: {name: "C"}}, steps: [{id: "s1", title: "One", nodes: ["a", "b"]}, {id: "s2", title: "Two", nodes: ["c", "a"]}]};
  const flow = (...ops) => ({version: 1, views: {flow: {ops: ops.map((o, i) => ({id: `o${i + 1}`, ...o}))}}});
  // Reordered in its own lane: no copy appears, the other step keeps it, and only that lane marks it moved.
  const d = flow({op: "moveBox", node: "a", lane: 1, laneTitle: "Two", fromLane: 1, fromLaneTitle: "Two", at: 0});
  assert.deepEqual(validateDraft(d), []);
  const r = applyDraft(p, d, "flow");
  assert.deepEqual(r.view.lanes.map((l) => l.nodes), [["a", "b"], ["a", "c"]]);
  assert.deepEqual(r.view.lanes.map((l) => l.movedIn ?? []), [[], ["a"]]);
  assert.equal(draftLine(describeDraft(p, d, "flow").changes[0]), '↦ box A (a) → lane 2 "Two" (step s2), place 1');
  // Into a lane that already has it: left as it is.
  const twice = applyDraft(p, flow({op: "moveBox", node: "a", lane: 1, fromLane: 0, at: 0}), "flow");
  assert.deepEqual(twice.view.lanes.map((l) => l.nodes), [["a", "b"], ["c", "a"]]);
  assert.match(twice.stale[0].why, /already in lane 2/);
  // Between lanes, the agent is told which lane (step) it left.
  const across = flow({op: "moveBox", node: "b", lane: 1, fromLane: 0, fromLaneTitle: "One"});
  assert.equal(draftLine(describeDraft(p, across, "flow").changes[0]), '↦ box B (b) → lane 2 "Two" (step s2), out of "One" (step s1)');
  // Without fromLane (older drafts) the first lane that has it is meant, as before.
  assert.deepEqual(applyDraft(p, flow({op: "moveBox", node: "b", lane: 0, at: 0}), "flow").view.lanes[0].nodes, ["b", "a"]);
});

test("state, decision and impact pictures: boxes and lines", () => {
  const p = {title: "t", nodes: {a: {name: "A"}, b: {name: "B"}}, views: [
    {id: "st", kind: "state", states: ["a", "b"], transitions: [{from: "a", to: "b", label: "go"}]},
    {id: "im", kind: "impact", edges: [{from: "a", to: "b"}]}]};
  const st = applyDraft(p, {version: 1, views: {st: {ops: [{id: "o1", op: "addBox", node: "new:c", name: "C"}, {id: "o2", op: "addEdge", from: "b", to: "new:c", label: "done"}, {id: "o3", op: "editEdge", from: "a", to: "b", label: "start"}]}}}, "st");
  assert.deepEqual(st.view.states, ["a", "b", "new:c"]);
  assert.deepEqual(st.marks.links, {"b>new:c": {mark: "add"}, "a>b": {mark: "change", was: "go"}});
  const im = applyDraft(p, {version: 1, views: {im: {ops: [{id: "o1", op: "removeEdge", from: "a", to: "b"}]}}}, "im");
  assert.equal(im.marks.links["a>b"].mark, "remove");
});


test("a review says what an edit changes from, the names of kinds, which line a moved end replaces, and new warnings", async () => {
  const profiles = await import("../skills/walkboard/lib/profiles.mjs");
  const p = plan();
  p.nodes.db.kind = "aws:aurora";
  p.views[0].zones[0].kind = "aws:vpc";
  p.views[0].zones[0].zones[1].kind = "aws:subnet";
  const d = describeDraft(p, draft(
    {op: "editNode", node: "api", name: "Gateway", kind: "aws:lambda"},
    {op: "editLink", from: "api", to: "nat", label: "out", kind: "aws:event"},
    {op: "removeLink", from: "api", to: "db"},
    {op: "addLink", from: "nat", to: "db", replaces: {from: "api", to: "db"}},
    {op: "addNode", node: "new:b", name: "Bucket", zone: "Data", kind: "aws:s3"},
  ), "m", profiles);
  const [edit, line, , moved, added] = d.changes;
  assert.deepEqual(edit.was, {name: "API", kind: null});
  assert.equal(edit.kindName, "Lambda (AWS)");
  assert.match(draftLine(edit), /name "Gateway" \(was "API"\)/);
  assert.deepEqual(line.was, {label: "egress", kind: null});
  assert.match(line.kindName, /Event/);
  assert.equal(moved.replaces, "API (api) → Aurora (db)");
  assert.match(draftLine(moved), /instead of API \(api\) → Aurora \(db\)/);
  assert.match(draftLine(added), /S3 bucket \(AWS\), aws:s3/);
  // The bucket in a subnet is new; nothing the plan already had is said again.
  assert.deepEqual(d.warnings.map((w) => w.node), ["Bucket (new:b)"]);
  assert.match(d.warnings[0].in, /Subnet/);
  // Without profiles: the same changes, no names or warnings.
  const bare = describeDraft(p, draft({op: "addNode", node: "new:b", name: "Bucket", zone: "Data", kind: "aws:s3"}), "m");
  assert.equal(bare.changes[0].kindName, undefined);
  assert.equal(bare.warnings, undefined);
  assert.match(validateDraft(draft({op: "addLink", from: "nat", to: "db", replaces: "api>db"})).join(), /bad replaces/);
});

test("two zones can share a name: a zone is known by its id, or its label when it has none", async () => {
  const {validate} = await import("../skills/walkboard/lib/schema.mjs");
  const p = plan();
  p.views[0].zones.push({label: "Region 2", zones: [{label: "App", id: "app-2", nodes: []}]});
  // The draft names zones by key: "App" is the first, "app-2" the second.
  const r = applyDraft(p, draft(
    {op: "addNode", node: "new:1", name: "Worker", zone: "app-2"},
    {op: "addZone", zone: "Data (Region 2)", label: "Data", parent: "Region 2"},
    {op: "move", node: "erp", to: "Data (Region 2)"},
    {op: "editZone", zone: "On-prem", label: "App"},
  ), "m");
  assert.deepEqual(r.stale, []);
  const region2 = r.view.zones.find((z) => z.label === "Region 2");
  assert.deepEqual(region2.zones[0].nodes, ["new:1"]);
  assert.deepEqual([region2.zones[1].id, region2.zones[1].label], ["Data (Region 2)", "Data"]);
  // Renamed to a name another zone is known by: it keeps its key as its id, and moves nothing.
  const onprem = r.view.zones.find((z) => z.id === "On-prem");
  assert.equal(onprem.label, "App");
  assert.equal(r.marks.zones["On-prem"].was, "On-prem");
  // A name nobody uses becomes the key, as before.
  const r2 = applyDraft(plan(), draft({op: "editZone", zone: "On-prem", label: "Office"}), "m");
  assert.equal(r2.view.zones.find((z) => z.label === "Office").id, undefined);
  assert.ok(r2.marks.zones.Office);
  // The words name the new zone and its id.
  const d = describeDraft(p, draft({op: "addZone", zone: "Data (Region 2)", label: "Data", parent: "Region 2"}), "m");
  assert.match(draftLine(d.changes[0]), /\+ zone "Data" \(id "Data \(Region 2\)"\) in "Region 2"/);
  // In the plan, labels may repeat when ids tell them apart.
  assert.deepEqual(validate(p).filter((x) => /known as/.test(x)), []);
  p.views[0].zones.push({label: "App", nodes: []});
  assert.match(validate(p).join(), /two zones are known as "App"/);
});
