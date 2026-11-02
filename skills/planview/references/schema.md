# plan.json

One JSON object. `PV check <dir>` validates it with the same rules the page uses.

```json
{
  "title": "Nightly import to staging",
  "goal": "One sentence: what is done when the plan is done.",
  "settings": {"teachBack": true, "commit": "suggest"},
  "steps": [
    {"id": "manifests", "title": "CronJob + config + policy", "status": "doing", "nodes": ["cronjob", "cm", "netpol"]}
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

## Top level

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Shown as the page heading |
| `goal` | no | One sentence under the heading |
| `settings` | yes | The answers to the two up-front questions |
| `steps` | no (expected) | Ordered steps; the step bar on top |
| `views` | yes, ≥ 1 | Pictures, shown as tabs when there is more than one |
| `nodes` | yes | Every box, keyed by a short id that views and steps refer to |

## settings

| Field | Values |
|---|---|
| `teachBack` | `true` = the user restates each step before the next; `false` = skip |
| `commit` | `"auto"` = you commit after each step; `"suggest"` = only suggest messages |

## steps[]

| Field | Meaning |
|---|---|
| `id` | Unique, short (used by `reply --step` and sequence messages) |
| `title` | ≤ 8 words |
| `status` | `todo`, `doing`, `review` (waiting for the user), `done` |
| `nodes` | Boxes this step touches; other boxes fade when the step is selected |

The page opens on the first step that is `doing` or `review`.

## nodes{}

| Field | Meaning |
|---|---|
| `name` | Required, ≤ 4 words |
| `what` | Subtitle, ≤ 6 words |
| `status` | `done` (exists already), `new` (being built now), `todo`, `ext` (a system outside this work) |
| `file` | Main file or path, shown above the details |
| `in` / `out` | What goes in and what comes out; a real example beats a description. Newlines allowed |
| `why` | One or two lines: the reason, not a restatement of `name` |

## Rules the checker enforces

- `settings` present with valid values
- every id used by a step or view exists in `nodes`
- step and view ids are unique; statuses and view kinds are known
- view-specific rules, listed in [views.md](views.md)
