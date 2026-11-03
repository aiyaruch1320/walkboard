import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validate} from "../skills/walkboard/lib/schema.mjs";

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

test("build mode asks about commits up front; restating defaults to on", async () => {
  const {teachBackOn} = await import("../skills/walkboard/lib/schema.mjs");
  const p = base();
  delete p.settings;
  assert.match(validate(p)[0], /settings/);
  assert.deepEqual(validate({...p, mode: "explain"}), []);
  assert.deepEqual(validate({...p, settings: {commit: "auto"}}), []);
  assert.equal(teachBackOn(p), true);
  assert.equal(teachBackOn({settings: {teachBack: false}}), false);
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
  for (const want of [/node "ghost"/, /node "cfg"/, /state "maybe"/, /actor "b"/, /step "nope"/, /length differs/, /stage 2 needs/]) assert.match(out, want);
});

test("unknown kinds, statuses and duplicate ids are reported", () => {
  const p = base();
  p.views.push({id: "f", kind: "pie"});
  p.steps.push({id: "s1", title: "again", status: "later"});
  p.nodes.a.status = "wip";
  const out = validate(p).join("\n");
  for (const want of [/kind "pie"/, /view id "f" is used twice/, /step id "s1" is used twice/, /status "later"/, /status "wip"/]) assert.match(out, want);
});

test("wrong types are reported instead of crashing", () => {
  for (const bad of [{steps: "abc"}, {views: {}}, {nodes: {a: null}}, {views: [{id: "f", kind: "flow", lanes: {}}]}, {nodes: []}, {glossary: {x: 1}}]) {
    const out = validate({...base(), ...bad});
    assert.ok(out.length, JSON.stringify(bad));
  }
  assert.deepEqual(validate("x"), ["plan.json is not an object"]);
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
  const {lint} = await import("../skills/walkboard/lib/schema.mjs");
  const p = {...base(), mode: "explain", settings: {teachBack: true}};
  assert.deepEqual(validate(p), []);
  const warn = lint(p).join("\n");
  assert.match(warn, /node "a" has no file/);
  assert.match(warn, /step "s1" has no detail/);
  assert.doesNotMatch(warn, /node "b"/);
});

test("a step's suggested commits are checked", () => {
  const p = base();
  p.steps[0].commits = [{message: "feat: a", files: ["a.go"]}, {message: "test: a"}];
  assert.deepEqual(validate(p), []);
  p.steps[0].commits = [{files: ["a.go"]}];
  assert.match(validate(p).join("\n"), /commits must be/);
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
  const {parseFile} = await import("../skills/walkboard/lib/schema.mjs");
  const plan = {root: "/repo/app", roots: {deploy: "/repo/deploy/"}};
  assert.deepEqual(parseFile("src/a.go:12", plan), {rootName: null, root: "/repo/app", rel: "src/a.go", line: 12, end: 12, abs: "/repo/app/src/a.go"});
  assert.equal(parseFile("src/a.go:12-20", plan).end, 20);
  assert.equal(parseFile("deploy:k8s/job.yaml:7", plan).abs, "/repo/deploy/k8s/job.yaml");
  assert.equal(parseFile("README.md", plan).line, null);
  assert.equal(parseFile("x.go:3", {}).abs, null);
});

test("root, roots, start, editor and depth are checked", () => {
  const p = {...base(), root: 7, roots: {d: 1}, start: "nope", settings: {teachBack: true, commit: "auto", editor: "notepad", depth: "deep"}};
  const out = validate(p).join("\n");
  for (const want of [/root must be/, /roots must be/, /start "nope"/, /settings.editor/, /settings.depth/]) assert.match(out, want);
  assert.deepEqual(validate({...base(), root: "/repo", start: "s1"}), []);
});

test("a plan without views gets a flow from its steps", async () => {
  const {viewsOf} = await import("../skills/walkboard/lib/schema.mjs");
  const p = base();
  delete p.views;
  assert.deepEqual(validate(p), []);
  assert.deepEqual(viewsOf(p)[0].lanes, [{title: "one", nodes: ["a"]}]);
  p.steps[0].nodes = [];
  assert.match(validate(p).join("\n"), /no views/);
});

test("page language comes from lang, else from the title and goal", async () => {
  const {langOf, viewsOf} = await import("../skills/walkboard/lib/schema.mjs");
  assert.equal(langOf({title: "Nightly import"}), "en");
  assert.equal(langOf({title: "นำเข้าลูกค้า"}), "th");
  assert.equal(langOf({title: "นำเข้า", lang: "en"}), "en");
  assert.equal(langOf({title: "x", lang: "th-TH"}), "th");
  assert.equal(langOf({title: "x", lang: "ja"}), "en");
  const p = base();
  delete p.views;
  assert.equal(viewsOf({...p, lang: "th"})[0].title, "ภาพรวม");
  assert.equal(viewsOf(p)[0].title, "Overview");
  assert.match(validate({...base(), lang: 3}).join("\n"), /lang must be/);
});

test("highlighted lines are parsed and checked", async () => {
  const {parseLines} = await import("../skills/walkboard/lib/schema.mjs");
  assert.deepEqual([...parseLines("12, 15-16")], [12, 15, 16]);
  assert.deepEqual([...parseLines("9-7")], [7, 8, 9]);
  assert.equal(parseLines("twelve"), null);
  const p = base();
  p.nodes.a.highlight = "3-4";
  assert.deepEqual(validate(p), []);
  p.nodes.a.highlight = {"3": "starts here", "5-6": ""};
  assert.deepEqual(validate(p), []);
  p.nodes.a.highlight = {"x": "no"};
  assert.match(validate(p).join("\n"), /highlight must be/);
  p.nodes.a.highlight = "x";
  assert.match(validate(p).join("\n"), /highlight must be/);
});

test("proposals and links from a page are checked", async () => {
  const {lint} = await import("../skills/walkboard/lib/schema.mjs");
  const p = {...base(), mode: "explain", settings: {}, links: [{title: "plan", url: "http://127.0.0.1:5000/?token=x"}]};
  p.nodes.a.proposal = {type: "add", note: "a cache in front"};
  assert.deepEqual(validate(p), []);
  assert.doesNotMatch(lint(p).join("\n"), /node "a" has no file/);
  p.nodes.a.proposal = {type: "maybe"};
  p.links = [{url: "javascript:alert(1)"}];
  const out = validate(p).join("\n");
  assert.match(out, /proposal must be/);
  assert.match(out, /links must be/);
});

test("design plans check options, criteria, scores and sources", () => {
  const p = {title: "t", mode: "design", nodes: {a: {name: "A", basis: "doc", source: "s1"}},
    views: [{id: "v", kind: "flow", lanes: [{nodes: ["a"]}]}],
    options: [{id: "x", title: "X", view: "v", recommended: true}],
    criteria: [{id: "cost", label: "Cost", weight: 3}],
    scores: {x: {cost: {rating: 4, sources: ["s1"]}}},
    sources: [{id: "s1", title: "Docs", url: "https://example.com"}]};
  assert.deepEqual(validate(p), []);
  p.options[0].view = "nope";
  p.scores.x.cost = {rating: 9, sources: ["s2"]};
  p.nodes.a.basis = "rumour";
  p.decision = {option: "y"};
  const out = validate(p).join("\n");
  for (const want of [/no view "nope"/, /rating must be/, /no source "s2"/, /basis must be/, /decision must name/]) assert.match(out, want);
  assert.match(validate({title: "t", mode: "design", nodes: {}, views: []}).join("\n"), /needs options/);
});

test("map and journey views check their boxes", () => {
  const p = {title: "t", settings: {commit: "auto"}, nodes: {a: {name: "A"}, b: {name: "B"}},
    views: [{id: "m", kind: "map", zones: [{label: "VPC", zones: [{label: "subnet", nodes: ["a"]}], nodes: ["b"]}], links: [{from: "a", to: "b"}]},
      {id: "j", kind: "journey", stops: [{node: "a", data: "{}"}, {node: "b"}]}]};
  assert.deepEqual(validate(p), []);
  p.views[0].zones[0].zones[0].nodes.push("ghost");
  p.views[1].stops = [{node: "a"}];
  const out = validate(p).join("\n");
  assert.match(out, /no node "ghost"/);
  assert.match(out, /at least two stops/);
});

test("state, decision, timeline, datamodel, impact and diff views are checked", () => {
  const nodes = Object.fromEntries(["a", "b", "c", "t1", "t2"].map((k) => [k, {name: k}]));
  const p = {title: "t", settings: {commit: "auto"}, nodes, views: [
    {id: "s", kind: "state", start: "a", states: ["a", "b"], transitions: [{from: "a", to: "b"}, {from: "b", to: "b"}]},
    {id: "d", kind: "decision", start: "a", edges: [{from: "a", to: "b", label: "yes"}, {from: "a", to: "c", label: "no"}]},
    {id: "tl", kind: "timeline", lanes: [{node: "a", events: [{at: 0, to: 3}, {at: 5}]}]},
    {id: "dm", kind: "datamodel", tables: [{node: "t1", columns: [{name: "id"}]}, {node: "t2", columns: [{name: "id"}, {name: "t1_id", ref: "t1.id"}]}]},
    {id: "i", kind: "impact", edges: [{from: "a", to: "b"}]},
    {id: "x", kind: "diff", before: "s", after: "d"}]};
  assert.deepEqual(validate(p), []);
  p.views[0].start = "z";
  p.views[2].lanes[0].events.push({at: 4, to: 1});
  p.views[3].tables[1].columns[1].ref = "t1.nope";
  p.views[5].after = "ghost";
  const out = validate(p).join("\n");
  for (const want of [/start "z" is not in states/, /every event needs/, /no column "t1.nope"/, /no view "ghost"/]) assert.match(out, want);
});

test("shapes the page iterates must be lists", () => {
  const base = {title: "t", settings: {commit: "auto"}, nodes: {a: {name: "A"}}};
  const bad = (v) => validate({...base, views: [{id: "v", ...v}]});
  assert.match(bad({kind: "flow", lanes: [{title: "L", nodes: "a"}]}).join("\n"), /lanes\[0\]\.nodes must be a list/);
  assert.match(bad({kind: "transform", stages: [{node: "a", columns: "abc", rows: []}]}).join("\n"), /columns must be a list/);
  assert.match(bad({kind: "timeline", lanes: [{node: "a", events: "x"}]}).join("\n"), /events must be a list/);
  assert.match(validate({...base, nodes: {a: {name: {x: 1}}}, views: [{id: "v", kind: "flow", lanes: [{nodes: ["a"]}]}]}).join("\n"), /name must be text/);
  assert.match(validate({...base, steps: [{id: "s", title: "S", nodes: "a"}]}).join("\n"), /nodes must be a list/);
});

test("design ids are unique and one option is recommended", () => {
  const p = {title: "t", mode: "design", nodes: {a: {name: "A"}}, views: [{id: "v", kind: "flow", lanes: [{nodes: ["a"]}]}],
    options: [{id: "x", title: "X", recommended: true}, {id: "x", title: "Y", recommended: true}], criteria: [{id: "c", label: "C"}]};
  const out = validate(p).join("\n");
  assert.match(out, /option id "x" is used twice/);
  assert.match(out, /only one option can be recommended/);
});

test("a copied column must name a real column", () => {
  const p = {title: "t", settings: {commit: "auto"}, nodes: {a: {name: "A"}, b: {name: "B"}},
    views: [{id: "d", kind: "datamodel", tables: [{node: "a", columns: [{name: "email"}]}, {node: "b", columns: [{name: "email", copy: "a.mail"}]}]}]};
  assert.match(validate(p).join("\n"), /no column "a.mail"/);
  p.views[0].tables[1].columns[0].copy = "a.email";
  assert.deepEqual(validate(p), []);
});

test("blank titles, empty list items and non-text column keys are reported, not crashed on", () => {
  assert.ok(validate({...base(), title: "  "}).includes("no title"));
  const p = {...base(), views: [{id: "j", kind: "journey", stops: [null, null]}, {id: "d", kind: "datamodel", tables: [{node: "a", columns: [{name: "id", key: 5}, null]}], relations: [null]}]};
  const out = validate(p).join("\n");
  assert.match(out, /view "j": stops has an empty item/);
  assert.match(out, /column a\.id: key must be text/);
  assert.doesNotMatch(out, /undefined/);
});
