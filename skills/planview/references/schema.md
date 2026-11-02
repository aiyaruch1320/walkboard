# plan.json

One JSON object. `PV check <dir>` validates it with the same rules the page uses and prints advice as warnings.

```json
{
  "title": "Nightly import to staging",
  "goal": "One sentence: what is true when this is done.",
  "mode": "build",
  "settings": {"teachBack": true, "commit": "suggest"},
  "approved": false,
  "glossary": {"CronJob": "A Kubernetes job that starts by itself on a schedule"},
  "steps": [
    {"id": "manifests", "title": "CronJob + config + policy", "status": "doing", "nodes": ["cronjob", "cm", "netpol"],
      "detail": "Write the manifests ArgoCD will create in staging", "done": "ArgoCD synced; the CronJob exists, suspended", "confirmed": false}
  ],
  "views": [
    {"id": "flow", "kind": "flow", "title": "Overview", "lanes": [{"title": "GitOps", "nodes": ["git", "argo", "cronjob"]}]}
  ],
  "nodes": {
    "cronjob": {
      "name": "CronJob import",
      "what": "nightly 02:00 · suspended",
      "status": "new",
      "file": "base/cronjob.yaml",
      "in": "image, config, secret",
      "out": "one Job per night",
      "why": "Forbid overlap; stays suspended until secrets exist"
    }
  }
}
```

Complete examples: `examples/nightly-import` (build, all four views) and `examples/explain-login` (explain mode) in the planview repository.

## Top level

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Page heading |
| `goal` | no | One sentence under the heading |
| `mode` | no | `"build"` (default) or `"explain"` |
| `settings` | yes | The answers to the up-front questions |
| `approved` | no | build: `true` once the user approved the plan; do not build before |
| `glossary` | no (expected) | `{"term": "plain one-line explanation"}`; terms are underlined wherever they appear and explain themselves on click |
| `steps` | no (expected) | Ordered steps (build) or stages of the flow (explain) |
| `views` | yes, ≥ 1 | Pictures, shown as tabs when there is more than one |
| `nodes` | yes | Every box, keyed by a short id that views and steps refer to |

## settings

| Field | Mode | Values |
|---|---|---|
| `teachBack` | both | `true` = the user restates each step; `false` = skip |
| `commit` | build | `"auto"` = you commit after each step; `"suggest"` = only suggest messages |
| `depth` | explain | `"overview"` or `"detail"` (down to functions and files) |

## steps[]

| Field | Meaning |
|---|---|
| `id` | Unique, short; used by `reply --step` and sequence messages |
| `title` | ≤ 8 words |
| `detail` | One sentence: what this step does (shown when the step is selected) |
| `done` | How we know it is finished, or in explain mode "you understand this when…" |
| `status` | `todo`, `doing`, `review` (waiting for the user; shown as "ถึงตาคุณ"), `done`; omit in explain mode |
| `confirmed` | `true` once the user's restatement matched; shown as ✓ |
| `nodes` | Boxes this step touches; others fade when it is selected, and the page switches to a picture that shows them |

The page opens on the first step in `review`, else `doing`.

## nodes{}

| Field | Meaning |
|---|---|
| `name` | Required, ≤ 4 words |
| `what` | Subtitle, ≤ 6 words |
| `status` | `done` (exists; "โค้ด" in explain mode), `new` (being built; "จุดสำคัญ" in explain mode), `todo`, `ext` (outside this work) |
| `file` | Main file; in explain mode `path:line` of the code you read (required, the checker warns) |
| `in` / `out` | What goes in and comes out; a concrete example beats a description. Newlines allowed |
| `why` | One or two lines: the reason, not a restatement of `name` |

## What the checker enforces

Problems (exit 1): `settings` present and valid for the mode; ids used by steps and views exist in `nodes`; unique step and view ids; known statuses and view kinds; correct types; view-specific rules in [views.md](views.md).

Warnings: boxes that appear in no picture, very long names, steps without `detail`, explain-mode code boxes without `file`.
