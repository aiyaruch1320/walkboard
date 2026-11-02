# Views

Every box in a view is a node id, so clicking it opens the same details and chat. Complete examples: `examples/nightly-import/plan.json` (all four kinds) and `examples/explain-login/plan.json` (explaining existing code) in the planview repository.

Pictures wider than the screen scroll sideways and say so. Glossary terms are underlined in `what`, `in`, `out`, `why`, step text, lane titles, sequence messages and transform notes.


## Which picture

| The reader asks | Picture |
|---|---|
| What are the steps, in order? | `flow` (default, built from the steps) |
| What runs in the cluster, with what config, talking to what? | `k8s` |
| What sits inside what (account › VPC › subnet, cluster › namespace)? | `map` |
| Who calls whom, in what order, and what if it fails? | `sequence` |
| What does the data look like before and after? | `transform` |
| What happens to one piece of data along the way? | `journey` |
| Which states can it be in, and what moves it between them? | `state` |
| If this, then what? (rules, routing, validation) | `decision` |
| When does it happen and how long does it take? (retries, timeouts, cron) | `timeline` |
| What are the tables, keys and relations? | `datamodel` |
| If this goes down, what breaks? | `impact` |
| What changes between now and after? | `diff` |

Use one or two pictures that answer the question; more is noise.

## flow: what feeds what

Use always. Rows ("lanes") of boxes joined by arrows, left to right.

```json
{"id": "flow", "kind": "flow", "title": "Deploy path", "lanes": [
  {"title": "CI", "nodes": ["commit", "build", "tagjob"]},
  {"title": "Before enabling", "nodes": ["secret", "egress"], "arrows": false}
]}
```

`"arrows": false` makes a lane a plain group (a checklist rather than a pipeline).

## k8s: what runs in the cluster and what it may reach

Use whenever something is deployed to Kubernetes.

```json
{"id": "k8s", "kind": "k8s", "title": "Kubernetes", "cluster": "staging", "namespace": "imports",
  "outside": ["git", "argo"],
  "configs": ["cm", "secret", "wkey"],
  "policy": "netpol",
  "workloads": [{"node": "cronjob", "containers": ["migrate (init)", "import"], "uses": ["cm", "secret", "wkey"]}],
  "targets": ["dns", "db", "api", "warehouse", "internet"],
  "links": [
    {"from": "cronjob", "to": "db", "state": "ok", "label": ":5432"},
    {"from": "cronjob", "to": "warehouse", "state": "todo", "label": ":443 waiting for infra"},
    {"from": "cronjob", "to": "internet", "state": "blocked"}
  ]}
```

| Field | Drawn as |
|---|---|
| `outside` | Left column outside the namespace, top to bottom (usually Git → ArgoCD) |
| `configs` | ConfigMaps, Secrets, mounted keys; thin lines to the workloads that `uses` them |
| `policy` | Optional node: a dashed frame around the workloads, labelled with its name |
| `workloads[]` | Deployments, CronJobs, Jobs; `containers` are small chips (init containers included) |
| `targets` | Right column: what the workloads talk to, plus "everything else" when a policy blocks it |
| `links[]` | `state`: `ok` (solid green), `todo` (dashed orange), `blocked` (dotted red); `label` is usually the port; it is shown on the box the link reaches and listed under the picture |

Show blocked and not-yet-open paths explicitly; they are what the user most needs to see.

## sequence: who calls whom, in order

Use when the order of calls or a round trip matters.

```json
{"id": "run", "kind": "sequence", "title": "One run", "actors": ["cronjob", "db", "warehouse", "api"], "messages": [
  {"from": "cronjob", "to": "db", "text": "read the checkpoint", "step": "run"},
  {"from": "cronjob", "to": "warehouse", "text": "query new customers"},
  {"from": "warehouse", "to": "cronjob", "text": "rows", "reply": true},
  {"from": "cronjob", "to": "cronjob", "text": "split into batches of 200"},
  {"from": "cronjob", "to": "db", "text": "save the checkpoint", "node": "db"}
]}
```

- `actors` are node ids, left to right.
- `reply: true` draws a dashed return arrow; `from == to` draws a note on that lifeline.
- `group`: consecutive messages with the same text are framed and labelled, e.g. `"group": "If the token has expired"`. Use one group per alternative path so error branches are not read as the next step.
- `step` fades the message when another step is selected; `node` is what a click opens (default: the receiver).
- Messages are numbered automatically. Keep `text` under ~8 words.
- In explain mode a sequence of the real calls (route → service → store) is usually the clearest picture; give every message a `step` so each stage lights up its own calls.

## transform: how data changes shape

Use when rows, files or payloads are mapped, cleaned or split.

```json
{"id": "data", "kind": "transform", "title": "Row to request", "stages": [
  {"node": "warehouse", "label": "query result", "columns": ["CUSTOMER_NO", "JOINED"], "rows": [["0001042  ", "202305"], ["0001043", null]],
    "notes": ["all values are text"]},
  {"node": "cronjob", "label": "after mapping", "columns": ["id", "joined_at", "result"], "rows": [["0001042", "2023-05-01", "send"], ["0001043", null, "held: missing_joined"]]},
  {"node": "api", "label": "request body", "text": "{\"items\": [{\"id\": \"0001042\"}]}"}
]}
```

- Each stage needs `columns` + `rows` (every row as long as `columns`) or `text`.
- Empty and `null` cells show as `∅`; leading and trailing spaces show as `␠`, so data problems are visible.
- Use made-up sample values, never real customer data.

## map: zones inside zones

For cloud and network pictures that are hard to draw by hand: accounts, regions, VPCs, subnets, clusters, namespaces. The page nests the zones and routes the links between boxes on whichever sides face each other.

```json
{"id": "net", "kind": "map", "title": "VPC Peering",
 "zones": [{"label": "ap-southeast-1", "icon": "aws:region", "zones": [
   {"label": "Account A", "zones": [{"label": "VPC A", "icon": "aws:vpc", "note": "10.0.0.0/16", "nodes": ["ec2a"]}]},
   {"label": "Link", "nodes": ["pcx"]},
   {"label": "Account B", "zones": [{"label": "VPC B", "icon": "aws:vpc", "note": "10.1.0.0/16", "nodes": ["ec2b"]}]}]}],
 "links": [{"from": "ec2a", "to": "pcx", "state": "ok", "label": "route 10.1.0.0/16"}, {"from": "pcx", "to": "ec2b"}]}
```

- A zone has `label`, optional `icon` and `note`, and `zones` and/or `nodes`. Keep it to four levels.
- `links` as in `k8s`: `state` `ok` / `todo` / `blocked`; `label` is shown on the box the link reaches.

## journey: one piece of data, stop by stop

The fastest way to explain a data flow: an envelope travels through the boxes and each stop shows what the data looks like there; lines that changed since the previous stop are highlighted. The user plays it or steps through.

```json
{"id": "trip", "kind": "journey", "title": "One message", "item": "question #42",
 "stops": [
   {"node": "send", "note": "The page adds where you asked", "data": "{\"kind\": \"question\", \"node\": \"cronjob\"}"},
   {"node": "route", "note": "The server adds an id and a time", "data": "{\"kind\": \"question\", \"node\": \"cronjob\", \"id\": \"7f3c…\"}"}]}
```

- 3-9 stops; a node may appear more than once (there and back).
- `data` is what the data looks like at that stop, short and made up (never real customer data); `note` says what this stop did to it.

## state: states and what moves between them

```json
{"id": "life", "kind": "state", "start": "created", "end": ["delivered", "cancelled"],
 "states": ["created", "paid", "delivered", "cancelled"],
 "transitions": [{"from": "created", "to": "paid", "label": "paid"}, {"from": "created", "to": "cancelled", "label": "30 min unpaid"},
   {"from": "paid", "to": "delivered", "label": "received"}, {"from": "paid", "to": "paid", "label": "retry"}]}
```

States are node ids. Loops and retries are fine: the page arcs them over the boxes.

## decision: if this, then that

```json
{"id": "rule", "kind": "decision", "start": "hasEmail",
 "edges": [{"from": "hasEmail", "to": "consent", "label": "yes"}, {"from": "hasEmail", "to": "admin", "label": "no"},
   {"from": "consent", "to": "send", "label": "yes"}, {"from": "consent", "to": "sms", "label": "no"}]}
```

Questions (two or more ways out) are drawn as diamonds, outcomes as rounded boxes. Name questions as questions.

## timeline: when and how long

```json
{"id": "retry", "kind": "timeline", "unit": "s", "marks": [{"at": 20, "label": "give up"}],
 "lanes": [{"node": "worker", "events": [{"at": 0, "to": 3, "label": "wait (timeout 3 s)", "state": "todo"}, {"at": 3, "label": "fail #1", "state": "blocked"}, {"at": 5, "label": "retry #1"}]}]}
```

A lane per box. An event with `to` is a span, without it a point; `state` colours it (`ok`, `todo`, `blocked`). `marks` are lines across all lanes (a timeout, a deadline).

## datamodel: tables and relations

```json
{"id": "schema", "kind": "datamodel", "tables": [
  {"node": "users", "columns": [{"name": "id", "type": "bigint", "key": "pk"}, {"name": "email", "type": "text"}]},
  {"node": "orders", "columns": [{"name": "id", "type": "uuid", "key": "pk"}, {"name": "user_id", "type": "bigint", "key": "fk", "ref": "users.id"}]}]}
```

`ref` (`table.column`) draws an N:1 relation; `relations: [{"from": "a.x", "to": "b.y", "kind": "1:1"}]` for anything else. Only the columns that matter.

## impact: what breaks if it goes down

```json
{"id": "deps", "kind": "impact", "edges": [{"from": "web", "to": "api"}, {"from": "api", "to": "db"}, {"from": "worker", "to": "db"}]}
```

`from` depends on `to`. The reader clicks a box: what depends on it turns red, what it needs turns blue.

## diff: before and after

```json
{"id": "change", "kind": "diff", "before": "old", "after": "new", "changed": ["api"]}
```

Two existing views side by side. Boxes only in `after` are marked added, only in `before` removed, and `changed` ones changed.
