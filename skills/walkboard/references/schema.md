# plan.json

One JSON object, written compact. `WB check <dir>` validates it with the page's own rules; warnings are advice.

```json
{"title":"Nightly import to staging","goal":"One sentence: what is true when done.","mode":"build","lang":"en",
 "settings":{"commit":"suggest"},"approved":false,
 "steps":[{"id":"manifests","title":"CronJob + config","status":"doing","nodes":["cronjob","cm"],
   "detail":"Write the manifests ArgoCD creates in staging","done":"ArgoCD synced; CronJob exists, suspended"}],
 "nodes":{"cronjob":{"name":"CronJob import","what":"nightly 02:00","status":"new","file":"base/cronjob.yaml",
   "in":"image, config, secret","out":"one Job per night","why":"Stays suspended until secrets exist"}}}
```

## Top level

| Field | Meaning |
|---|---|
| `title` | Required. Page heading |
| `goal` | One sentence under it |
| `mode` | `"build"` (default; "plan mode" on the page), `"explain"`, `"design"` (fields in [design.md](design.md)) |
| `lang` | `"en"` or `"th"` page labels (others get English). Default: Thai if the title or goal is Thai |
| `settings` | build: required. `commit` `"auto"`/`"suggest"`; `teachBack` (default on; the user switches it); explain: `depth` `"overview"`/`"detail"`; `editor` `"vscode"` (default) / `"cursor"` / `"idea"` / `"none"`. Defaults: `~/.walkboard/config.json` |
| `approved` | build: `true` once the user approved; build nothing before |
| `root` / `roots` | explain: repository of the `file` paths (absolute or relative to the plan folder); more as `{"deploy": "/path"}`, used as `deploy:path:line` |
| `start` | Step id to open on (default: first in `review`, else `doing`) |
| `constraints` | `[{"id","text","confirmed":false}]`: assumptions the user should confirm; shown dashed until confirmed |
| `links` | Plans started from this page: `[{"title","url"}]` |
| `glossary` | `{"term": "one-line explanation"}`, only project terms; ~95 common ones ship with Walkboard |
| `steps` | Ordered steps (build) or stages (explain) |
| `views` | Pictures as tabs ([views.md](views.md)); leave out for a plain flow built from the steps |
| `nodes` | Required. Every box, keyed by a short id |

## steps[]

`id`, `title` (≤ 8 words), `detail` (what it does), `done` (how we know; explain: what the reader understands), `nodes` (boxes it touches; the rest fade), `status` (`todo` `doing` `review` `done`; omit in explain), `confirmed` (restatement matched). Suggested commits: `commitMessage`, or `commits: [{"message","files":[…]}]` ([messages.md](messages.md)).

### Telling a story with a step

Animate only what needs it: a path that is easy to get wrong, something carried from box to box, or what gets blocked. A step whose point is a fact, not a movement, has no `moves`; most steps have none, and moving everything makes the moves that matter stand out less. Optional on any step:

```json
{"id":"wake","title":"poll wakes the agent","nodes":["server","poll","agent"],
 "moves":[{"from":"server","to":"poll","label":"question","keep":true},
          {"from":"poll","to":"agent","label":"question","keep":true}],
 "show":{"poll":"$ walkboard poll\n{\"text\":\"why?\"}"}}
```

| Field | Meaning |
|---|---|
| `moves` | Played in order each time the step opens: `label` travels from box `from` to box `to`, on the picture's line when there is one. 1-3 per step; `label` ≤ 3 words |
| `blocked` | The label stops partway and turns red (automatic on a link with `"state":"blocked"`): what was tried and did not get through |
| `keep` | The label stays on `to` in later steps; the same label moving again moves it. For what is carried on (a stolen key, a token), not for every move |
| `show` | `{box: "text"}`: a few short lines inside the box from this step on, for what really changes there (a log, a prompt). Only where it adds something: boxes grow |

Both boxes of a move must be in one picture (`map`, `k8s`, `flow`…); the page opens that picture. No code to paste here either: `show` is a line or two, the rest stays in `file`.

## nodes{}

| Field | Meaning |
|---|---|
| `name` | Required, ≤ 4 words |
| `what` | Subtitle, ≤ 6 words |
| `status` | `done`, `new` (being built; explain: the focus), `todo` (explain: missing), `ext` (outside). Default: `todo`; explain `done`; design neutral |
| `file` | `path`, `path:line`, `path:from-to` or `root:path:line`. Explain mode: required and checked; the page shows the code |
| `anchor` | A short piece of the cited code, e.g. `"function send("`; `check` fails when it is no longer in those lines and says where it went |
| `highlight` | Lines that make the point: `"146-152"`, or with notes `{"152": "returns: this wakes the agent"}`. Without it a single line is highlighted, a range is context |
| `icon` | Guessed from `name`; set when wrong: `aws:s3`, `gcp:bigquery`, `k8s:cronjob`, `database`, … (`WB icons` lists all), `"none"` |
| `in` / `out` / `why` | One line each; a concrete example beats a description |
| `basis` / `source` / `checked` | Where its facts come from: `iac`, `cli`, `doc`, `assumed` (dashed, confirmable), a `sources` id, the date seen |
| `proposal` | `{"type":"add"\|"change"\|"remove","note"}`: drawn on the picture until planned or withdrawn |

Explain mode with a `root`: every `file` must exist and its lines too.

What the user sketches in draft mode is kept in `.walkboard/draft.json`, never in plan.json; it reaches you with `review` (references/messages.md) and `WB draft <dir>`.
