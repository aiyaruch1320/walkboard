import test from "node:test";
import assert from "node:assert/strict";
import {PROFILES, kindOf, kindNames, lineKindNames, kindWarning, kindProblems} from "../skills/walkboard/lib/profiles.mjs";
import {knownIcon} from "../skills/walkboard/lib/icons.mjs";

test("every profile is whole: names, icons that exist, rules that name kinds of the same profile", () => {
  for (const [p, pr] of Object.entries(PROFILES)) {
    assert.ok(pr.label && pr.family, `${p} needs a label and a family`);
    for (const [k, d] of Object.entries(pr.kinds)) {
      assert.ok(/^[a-z0-9]+$/.test(k), `${p}:${k}: keys are lower case letters and digits`);
      assert.ok(d.name, `${p}:${k} needs a name`);
      assert.ok(!d.icon || knownIcon(d.icon), `${p}:${k}: no icon "${d.icon}"`);
      assert.ok([undefined, true, "also"].includes(d.zone), `${p}:${k}: zone is true or "also"`);
      for (const z of d.in || []) assert.ok(pr.kinds[z]?.zone, `${p}:${k} sits in "${z}", which is no zone of ${p}`);
      for (const [name, want] of Object.entries(d.props || {})) assert.ok(want === "" || (Array.isArray(want) && want.length), `${p}:${k}.${name}: "" or a list`);
    }
    for (const [k, d] of Object.entries(pr.lines || {})) assert.ok(d.name && d.style, `${p}:${k} line needs a name and a style`);
  }
  assert.ok(kindNames().includes("aws:rds") && !kindNames().includes("aws:vpc"));
  assert.ok(kindNames(true).includes("aws:vpc") && kindNames(true).includes("aws:ec2"));
  assert.ok(lineKindNames().includes("aws:event"));
});

test("a kind warns where it does not usually sit, looking past zones without a kind and security groups", () => {
  assert.equal(kindWarning("aws:rds", ["aws:subnet", "aws:vpc"]), null);
  assert.equal(kindWarning("aws:rds", ["aws:sg", "aws:subnet"]), null);
  assert.deepEqual(kindWarning("aws:rds", ["aws:region"]), {kind: "RDS", there: "Region", usual: ["Subnet", "VPC"]});
  // Drawn freely: a zone without a kind, or nothing around, says nothing.
  assert.deepEqual(kindWarning("aws:rds", [null, "aws:region"]), kindWarning("aws:rds", ["aws:region"]));
  assert.equal(kindWarning("aws:rds", [null]), null);
  assert.equal(kindWarning("aws:rds", []), null);
  assert.equal(kindWarning("aws:s3", ["aws:subnet"]).there, "Subnet");
  assert.equal(kindOf("aws:rds").def.name, "RDS");
  assert.equal(kindOf("nope"), null);
  assert.deepEqual(kindProblems("x", undefined, undefined, false), []);
});

test("map draft changes carry a kind and its fields; edits change or clear them", async () => {
  const {validateDraft, applyDraft, describeDraft, draftLine} = await import("../skills/walkboard/lib/draft.mjs");
  const plan = {title: "t", nodes: {db: {name: "DB", kind: "aws:rds", props: {engine: "mysql"}}}, views: [{id: "m", kind: "map", zones: [{label: "VPC", kind: "aws:vpc", nodes: ["db"]}], links: []}]};
  const ops = [
    {id: "o1", op: "addZone", zone: "Private", parent: "VPC", kind: "aws:subnet", props: {access: "private"}},
    {id: "o2", op: "addNode", node: "new:c", name: "Cache", zone: "Private", kind: "aws:elasticache", props: {engine: "redis"}},
    {id: "o3", op: "editNode", node: "db", props: {engine: "postgres"}},
    {id: "o4", op: "addLink", from: "new:c", to: "db", kind: "aws:replication"},
    {id: "o5", op: "editZone", zone: "VPC", kind: ""}];
  const d = {version: 1, views: {m: {ops}}};
  assert.deepEqual(validateDraft(d), []);
  assert.match(validateDraft({version: 1, views: {m: {ops: [{id: "x", op: "addNode", node: "new:z", name: "Z", zone: "VPC", kind: "AWS RDS"}]}}}).join(), /bad kind/);
  assert.match(validateDraft({version: 1, views: {m: {ops: [{id: "x", op: "editNode", node: "db", props: {engine: 5}}]}}}).join(), /bad props/);
  const r = applyDraft(plan, d, "m");
  const sub = r.view.zones[0].zones[0];
  assert.deepEqual([sub.kind, sub.props], ["aws:subnet", {access: "private"}]);
  assert.deepEqual([r.plan.nodes["new:c"].kind, r.plan.nodes["new:c"].props], ["aws:elasticache", {engine: "redis"}]);
  assert.deepEqual(r.plan.nodes.db.props, {engine: "postgres"});
  assert.deepEqual(r.marks.nodes.db.was, {props: {engine: "mysql"}});
  assert.equal(r.view.links[0].kind, "aws:replication");
  assert.equal(r.view.zones[0].kind, undefined);
  const words = describeDraft(plan, d, "m").changes.map(draftLine);
  assert.match(words[1], /\+ box Cache \(new:c\) in "Private" \(aws:elasticache, engine redis\)/);
  assert.match(words[2], /props \{"engine":"postgres"\}/);
});

test("references/profiles.md is written from lib/profiles.mjs", async () => {
  const {execFileSync} = await import("node:child_process");
  execFileSync(process.execPath, [new URL("../scripts/profiles-doc.mjs", import.meta.url).pathname, "--check"]);
});
