# plan.json

One JSON object. `PV check <dir>` validates it with the same rules the page uses and prints advice as warnings.

```json
{
  "title": "Nightly import to staging",
  "goal": "One sentence: what is true when this is done.",
  "mode": "build",
  "lang": "en",
  "settings": {"commit": "suggest"},
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
| `lang` | no | Language of the plan and of the page's labels: `"en"` or `"th"` (others get English labels). Default: Thai if the title or goal is Thai, else English |
| `settings` | yes | The answers to the up-front questions |
| `approved` | no | build: `true` once the user approved the plan; do not build before |
| `root` | explain: expected | Repository the `file` paths are relative to; absolute, or relative to the plan folder |
| `roots` | no | More repositories by name, e.g. `{"deploy": "/path/to/deploy-repo"}`; refer to them as `deploy:path:line` |
| `start` | no | Step id the page opens on (default: first step in `review`, else `doing`) |
| `glossary` | no | `{"term": "plain one-line explanation"}` for terms specific to this project; about 70 common terms (Kubernetes, CI, HTTP, JWT, …) ship with planview in English and Thai (`assets/glossary.json`). Terms are underlined wherever they appear and explain themselves on click |
| `steps` | no (expected) | Ordered steps (build) or stages of the flow (explain) |
| `views` | no | Pictures, shown as tabs. Leave out for a plain flow: each step becomes a lane of its boxes |
| `nodes` | yes | Every box, keyed by a short id that views and steps refer to |

## settings

| Field | Mode | Values |
|---|---|---|
| `teachBack` | both | Default `true`: the user restates each step. The user switches it on the page; do not ask |
| `commit` | build | `"auto"` = you commit after each step; `"suggest"` = only suggest messages |
| `depth` | explain | `"overview"` or `"detail"` (down to functions and files) |
| `editor` | both | Where file links open: `"vscode"` (default), `"cursor"`, `"idea"`, `"none"` |

## steps[]

| Field | Meaning |
|---|---|
| `id` | Unique, short; used by `reply --step` and sequence messages |
| `title` | ≤ 8 words |
| `detail` | One sentence: what this step does (shown when the step is selected) |
| `done` | How we know it is finished; in explain mode, what the reader understands at that point (shown as "Understood when:") |
| `status` | `todo`, `doing`, `review` (waiting for the user; shown as "Your turn"), `done`; omit in explain mode |
| `confirmed` | `true` once the user's restatement matched; shown as ✓ |
| `nodes` | Boxes this step touches; others fade when it is selected, and the page switches to a picture that shows them |

The page opens on the first step in `review`, else `doing`.

## nodes{}

| Field | Meaning |
|---|---|
| `name` | Required, ≤ 4 words |
| `what` | Subtitle, ≤ 6 words |
| `status` | `done` (exists; "code" in explain mode), `new` (being built; "focus" in explain mode), `todo`, `ext` (outside this work). Default: `todo`, or `done` in explain mode |
| `file` | Main file: `path`, `path:line`, `path:from-to`, or `name:path:line` with a named root. In explain mode it is required, must exist (checked), and the page shows the excerpt with an editor link |
| `icon` | Optional; guessed from `name` when left out. `"provider:service"` for cloud parts, drawn in the provider's colours: `aws:` s3, lambda, ec2, rds, dynamodb, sqs, sns, eventbridge, kinesis, apigateway, cloudfront, route53, elb, iam, cognito, cloudwatch, eks, ecs, ecr, secretsmanager, kms, ses, stepfunctions, redshift, athena, bedrock, elasticache · `gcp:` gcs, bigquery, pubsub, cloudrun, functions, gke, cloudsql, firestore, spanner, secretmanager, dataflow, vertexai · `azure:` blob, functions, aks, sql, cosmosdb, servicebus, eventhubs, eventgrid, keyvault, entra, appservice · `k8s:` pod, deployment, statefulset, cronjob, job, service, ingress, configmap, secret, namespace, networkpolicy, pvc. Plain: user, users, browser, mobile, server, vm, api, database, cache, queue, topic, stream, bucket, file, folder, function, container, clock, job, secret, key, identity, login, config, network, gateway, loadbalancer, dns, cdn, email, chat, cloud, monitor, log, git, ci, registry, terminal, code, shield, search, payment, warehouse, table, plug, workflow, ai. `"none"` for no icon |
| `in` / `out` | What goes in and comes out; a concrete example beats a description. Newlines allowed |
| `why` | One or two lines: the reason, not a restatement of `name` |

## What the checker enforces

Problems (exit 1): `settings` present and valid for the mode; ids used by steps and views exist in `nodes`; unique step and view ids; known statuses and view kinds; correct types; view-specific rules in [views.md](views.md).

Explain mode with a `root`: every `file` must exist inside its root and its lines must exist.

Warnings: unknown `icon` names, boxes that appear in no picture, names over 40 or `what` over 60 characters, steps without `detail`, more than 10 steps, explain-mode code boxes without `file` or without a line, explain mode without `root`.
