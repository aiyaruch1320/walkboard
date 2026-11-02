# Design mode

For something that does not exist yet: research options, draw each, compare, recommend one, let the user choose. The choice becomes a build plan.

## Research

- Ask at most three questions that change the answer (scale, constraints, one-way or two-way…). Assumptions go into `constraints` with `"confirmed": false`.
- Official documentation first. Every claim in `scores` cites `sources` (`id`, `title`, `url`, `checked` = date read). Prices change: link the page, never a bare figure.
- The user's infrastructure code (Terraform, CloudFormation, manifests) is evidence: `file:line` as in explain mode, `"basis": "iac"`.
- Live cloud state: read-only commands only (`describe`, `list`, `get`), asking before each; otherwise give the user the command and ask for the output. `"basis": "cli"`, `"checked"`.
- No secrets. Shorten account ids, ARNs and IPs (`1234…7890`).

## plan.json

```json
{"mode":"design",
 "constraints":[{"id":"cidr","text":"The two VPCs' CIDRs do not overlap","confirmed":false}],
 "options":[{"id":"peering","title":"VPC Peering","summary":"…","view":"v-peering","recommended":true,"why":"…"}],
 "criteria":[{"id":"cost","label":"Cost","weight":3}],
 "scores":{"peering":{"cost":{"rating":5,"note":"…","sources":["peer-price"]}}},
 "sources":[{"id":"peer-price","title":"…","url":"https://…","checked":"2026-11-03"}],
 "views":[{"id":"v-peering","kind":"map","zones":[…]}],
 "nodes":{"pcx":{"name":"VPC Peering","basis":"doc","source":"peer-price"}}}
```

- 2-4 options, each with its own view; node ids may repeat across views.
- `rating` 0-5, `"yes"` / `"no"`, or `"na"`. `weight` 0-3; the page totals by weight and the user can change weights.
- Anything you could not confirm is `"basis": "assumed"`.
- Exactly one option `recommended`, with `why`, consistent with the totals (or `why` says what they miss).

## Messages

- `question` / `propose` may carry `option` and `criterion`: answer or change that cell, option or constraint (a new option needs a view and scores).
- `settings` may carry `weights`: re-read them before recommending again.
- `decide` (`option`, `text` = the user's reason): set `"decision": {"option","why","not":{"other":"why not"}}`; write a build plan in a new folder carrying the constraints, the option's view, nodes and sources; `PV open` it, add it to `links`, reply with the URL. Unconfirmed assumptions become its first step.
