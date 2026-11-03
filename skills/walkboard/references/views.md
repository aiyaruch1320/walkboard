# Views

Every box is a node id, so a click opens the same details and chat. Wide pictures scroll sideways.

## Which picture

| The reader asks | Picture |
|---|---|
| What are the steps, in order? | `flow` (default, built from the steps) |
| What runs in the cluster, with what config, talking to what? | `k8s` |
| What sits inside what (account › VPC › subnet, cluster › namespace)? | `map` |
| Who calls whom, in what order, and what if it fails? | `sequence` |
| What does the data look like before and after? | `transform` |
| What happens to one piece of data along the way? | `journey` |
| Which states can it be in, and what moves it? | `state` |
| If this, then what? (rules, routing, validation) | `decision` |
| When and how long? (retries, timeouts, cron) | `timeline` |
| What are the tables, keys and relations? | `datamodel` |
| If this goes down, what breaks? | `impact` |
| What changes between now and after? | `diff` |

One or two pictures that answer the question; more is noise. Use made-up values, never real customer data.

## flow

```json
{"id":"flow","kind":"flow","lanes":[{"title":"CI","nodes":["commit","build","tagjob"]},
 {"title":"Before enabling","nodes":["secret","egress"],"arrows":false}]}
```

Lanes of boxes, left to right. `"arrows": false` makes a lane a checklist.

## k8s

```json
{"id":"k8s","kind":"k8s","cluster":"staging","namespace":"imports","outside":["git","argo"],
 "configs":["cm","secret"],"policy":"netpol",
 "workloads":[{"node":"cronjob","containers":["migrate (init)","import"],"uses":["cm","secret"]}],
 "targets":["db","warehouse","internet"],
 "links":[{"from":"cronjob","to":"db","state":"ok","label":":5432"},
  {"from":"cronjob","to":"warehouse","state":"todo","label":":443 waiting for infra"},
  {"from":"cronjob","to":"internet","state":"blocked"}]}
```

`outside`: left column (Git → ArgoCD). `configs`: lines to the workloads that `uses` them. `policy`: dashed frame around the workloads. `targets`: right column. `links[].state`: `ok` solid green, `todo` dashed orange, `blocked` dotted red; `label` (usually the port) sits on the box it reaches. Always show blocked and not-yet-open paths.

## sequence

```json
{"id":"run","kind":"sequence","actors":["cronjob","db","warehouse"],"messages":[
 {"from":"cronjob","to":"db","text":"read the checkpoint","step":"run"},
 {"from":"cronjob","to":"warehouse","text":"query new customers"},
 {"from":"warehouse","to":"cronjob","text":"rows","reply":true},
 {"from":"cronjob","to":"cronjob","text":"split into batches of 200"},
 {"from":"cronjob","to":"db","text":"retry once","group":"If the write fails"}]}
```

`reply` draws a dashed return; `from == to` a note. Consecutive messages with the same `group` are framed: one group per alternative path. `step` fades the message on other steps; `node` is what a click opens (default: the receiver). `text` under ~8 words. In explain mode, give every message a `step`.

## transform

```json
{"id":"data","kind":"transform","stages":[
 {"node":"warehouse","label":"query result","columns":["CUSTOMER_NO","JOINED"],"rows":[["0001042  ","202305"],["0001043",null]],"notes":["all values are text"]},
 {"node":"cronjob","label":"after mapping","columns":["id","joined_at"],"rows":[["0001042","2023-05-01"],["0001043",null]]},
 {"node":"api","label":"request body","text":"{\"items\":[{\"id\":\"0001042\"}]}"}]}
```

Each stage has `columns` + `rows` (rows as long as `columns`) or `text`. Empty and `null` show as `∅`, edge spaces as `␠`.

## map

```json
{"id":"net","kind":"map","zones":[{"label":"ap-southeast-1","icon":"aws:region","zones":[
  {"label":"Account A","zones":[{"label":"VPC A","icon":"aws:vpc","note":"10.0.0.0/16","nodes":["ec2a"]}]},
  {"label":"Link","nodes":["pcx"]},
  {"label":"Account B","zones":[{"label":"VPC B","icon":"aws:vpc","note":"10.1.0.0/16","nodes":["ec2b"]}]}]}],
 "links":[{"from":"ec2a","to":"pcx","state":"ok","label":"route 10.1.0.0/16"},{"from":"pcx","to":"ec2b"}]}
```

Zones nest (`label`, `icon`, `note`, `zones`, `nodes`), up to eight levels; three or four read best. `links` as in `k8s`.

## journey

```json
{"id":"trip","kind":"journey","item":"question #42","stops":[
 {"node":"send","note":"The page adds where you asked","data":"{\"kind\":\"question\",\"node\":\"cronjob\"}"},
 {"node":"route","note":"The server adds an id","data":"{\"kind\":\"question\",\"node\":\"cronjob\",\"id\":\"7f3c…\"}"}]}
```

An envelope travels stop by stop; lines that changed are highlighted. 3-9 stops; a node may repeat. `data` short; `note` says what the stop did.

## state

```json
{"id":"life","kind":"state","start":"created","end":["delivered","cancelled"],
 "states":["created","paid","delivered","cancelled"],
 "transitions":[{"from":"created","to":"paid","label":"paid"},{"from":"created","to":"cancelled","label":"30 min unpaid"},
  {"from":"paid","to":"delivered","label":"received"},{"from":"paid","to":"paid","label":"retry"}]}
```

States are node ids; loops are fine.

## decision

```json
{"id":"rule","kind":"decision","start":"hasEmail","edges":[{"from":"hasEmail","to":"consent","label":"yes"},
 {"from":"hasEmail","to":"admin","label":"no"},{"from":"consent","to":"send","label":"yes"}]}
```

Boxes with two or more ways out are diamonds; name them as questions.

## timeline

```json
{"id":"retry","kind":"timeline","unit":"s","marks":[{"at":20,"label":"give up"}],
 "lanes":[{"node":"worker","events":[{"at":0,"to":3,"label":"wait (timeout 3 s)","state":"todo"},
  {"at":3,"label":"fail #1","state":"blocked"},{"at":5,"label":"retry #1"}]}]}
```

A lane per box; `to` makes a span; `marks` cross all lanes.

## datamodel

```json
{"id":"schema","kind":"datamodel","tables":[
 {"node":"users","columns":[{"name":"id","type":"bigint","key":"pk"},{"name":"email","type":"text"}]},
 {"node":"orders","columns":[{"name":"id","type":"uuid","key":"pk"},{"name":"user_id","type":"bigint","key":"fk","ref":"users.id"}]}]}
```

`ref` draws N:1; `relations: [{"from":"a.x","to":"b.y","kind":"1:1"}]` for others. A column with `ref` or that is a relation's `from` shows FK, also beside PK when a table shares another's key (1:1); a composite key needs one relation per column. `copy: "users.email"` marks a column that stores the same data again (⧉): the page counts the copies and shows where each one comes from on hover; add `"keep": true` for a copy kept on purpose (price at the time of sale). Only the columns that matter.

`groups: [{"label":"Push side","tables":["push_state","push_log"]}]` frames tables that belong together (a table in one group at most); add them when the user asks to group tables. The user can drag tables and groups; the page saves where they put them in `layout`. Never write or change `layout`.

## impact

```json
{"id":"deps","kind":"impact","edges":[{"from":"web","to":"api"},{"from":"api","to":"db"},{"from":"worker","to":"db"}]}
```

`from` depends on `to`. A click turns what depends on it red, what it needs blue.

## diff

```json
{"id":"change","kind":"diff","before":"old","after":"new","changed":{"api":"publishes to the queue instead of sending"}}
```

Two existing views side by side; added, removed and changed boxes are marked, and links only on one side are listed. `changed` is a list of ids, or ids with what changed.
