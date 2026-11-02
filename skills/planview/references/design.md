# Design mode

For something that does not exist yet: research the options, draw each one, compare them, recommend one, and let the user choose. The choice becomes a build plan.

## Research

- Ask at most three questions that change the answer (scale, constraints, one-way or two-way…). Whatever you assume instead goes into `constraints` with `"confirmed": false`.
- Use official documentation first (web search when available). Every claim in `scores` cites `sources`; each source has `id`, `title`, `url` and `checked` (the date you read it). Prices change: say where to check, do not quote a figure without its page.
- The user's own infrastructure code (Terraform, CloudFormation, Kubernetes manifests) is evidence too: point at it with `file:line` as in explain mode and set `"basis": "iac"`.
- Live cloud state: only read-only commands (`describe`, `list`, `get`), and ask before running any. If not allowed, give the user the command and ask for its output. Set `"basis": "cli"` and `"checked"` on what you saw.
- Never put secrets in the plan. Shorten account ids, ARNs and IPs (`1234…7890`).

## plan.json

```json
{
  "mode": "design",
  "constraints": [{"id": "cidr", "text": "The two VPCs' CIDRs do not overlap", "confirmed": false}],
  "options": [{"id": "peering", "title": "VPC Peering", "summary": "…", "view": "v-peering", "recommended": true, "why": "…"}],
  "criteria": [{"id": "cost", "label": "Cost", "weight": 3}],
  "scores": {"peering": {"cost": {"rating": 5, "note": "…", "sources": ["peer-price"]}}},
  "sources": [{"id": "peer-price", "title": "…", "url": "https://…", "checked": "2026-11-03"}],
  "views": [{"id": "v-peering", "kind": "flow", "lanes": [{"title": "…", "nodes": ["ec2a", "pcx", "ec2b"]}]}],
  "nodes": {"pcx": {"name": "VPC Peering", "basis": "doc", "source": "peer-basics"}}
}
```

- 2-4 options, each with its own view; the same node ids may appear in several views.
- `rating`: 0-5, or `"yes"` / `"no"` for things that either work or do not, `"na"` when it does not apply. `weight` 0-3; the page totals the scores by weight and the user changes weights there.
- `basis` on a node: `iac`, `cli`, `doc` or `assumed`. Anything you could not confirm is `assumed`.
- Exactly one option is `recommended`, with `why`. Keep it consistent with the totals, or say in `why` what the totals miss.

## Messages

- `question` / `propose` may carry `option` and `criterion`: answer or change that cell, option or constraint (a new option needs a view and a row of scores).
- `settings` may carry `weights`: the user's new weights; re-read them before recommending again.
- `confirm` (`constraint` or `node`): mark it confirmed (`confirmed: true`, or `basis` → what it really is). If the user corrects it instead, update it and anything that depended on it, then say whether the recommendation changes.
- `decide` (`option`, `text` = the user's reason): set `"decision": {"option": "…", "why": "…", "not": {"other": "why not"}}`, write a build plan for that option in a new folder carrying the constraints, the option's view and nodes, and its sources, `PV open` it, add it to `links`, and reply with the URL. Unconfirmed assumptions become the plan's first step.
