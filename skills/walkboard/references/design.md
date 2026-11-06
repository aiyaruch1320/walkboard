# Design mode

For something that does not exist yet: research options, draw each, compare, recommend one, let the user choose. The choice becomes a build plan.

## Research

- Ask at most three questions that change the answer (scale, constraints, one-way or two-way…). Assumptions go into `constraints` with `"confirmed": false`.
- Official documentation first. Every claim in `scores` cites `sources` (`id`, `title`, `url`, `checked` = date read). Prices change: link the page, never a bare figure. A score that is the author's judgment (operating effort, speed of delivery) has no document to cite: mark it `"basis": "judgment"` with a `note` saying why, instead of inventing a source.
- The user's infrastructure code (Terraform, CloudFormation, manifests) is evidence: `file:line` as in explain mode, `"basis": "iac"`.
- Live cloud state: read-only commands only (`describe`, `list`, `get`), asking before each; otherwise give the user the command and ask for the output. `"basis": "cli"`, `"checked"`.
- No secrets. Shorten account ids, ARNs and IPs (`1234…7890`).

## plan.json

Plan fields are in schema.md, each option's picture in views.md. Design mode has no `settings` to ask about.

```json
{"mode":"design",
 "constraints":[{"id":"cidr","text":"The two VPCs' CIDRs do not overlap","confirmed":false}],
 "options":[{"id":"peering","title":"VPC Peering","summary":"…","view":"v-peering","recommended":true,"why":"…"}],
 "criteria":[{"id":"cost","label":"Cost","weight":3},{"id":"twoway","label":"Both sides can call","weight":2,"must":true}],
 "scores":{"peering":{"cost":{"rating":5,"note":"…","sources":["peer-price"]}}},
 "sources":[{"id":"peer-price","title":"…","url":"https://…","checked":"2026-11-03"}],
 "views":[{"id":"v-peering","kind":"map","zones":[…]}],
 "nodes":{"pcx":{"name":"VPC Peering","basis":"doc","source":"peer-price"}}}
```

- 2-4 options, each with its own view; node ids may repeat across views.
- More pictures for one option: `"option": "<id>"` on the view; they show as tabs under that option.
- Revised a design after talking: point the option's `view` at the new picture and update its scores, or add it as a new option. Never leave the result as a loose view: the user chooses options. Say which option changed in your reply.
- `rating` 0-5 (5 = best for the user: cheapest, easiest), `"yes"` / `"no"`, or `"na"`. `weight` 0-3; the page totals by weight and the user can change weights.
- `"must": true` on a criterion the answer cannot do without (usually a constraint): an option rated `"no"` or 0 there is out of the running whatever its total.
- Put what a product owner asks first into criteria or notes: money per month (with the pricing page), effort, risk and how to back out, and who has to act (e.g. "account B admin accepts within 7 days").
- Anything you could not confirm is `"basis": "assumed"`. A constraint can name the criteria it decides: `"affects": ["twoway"]`; while unconfirmed, those rows show ❓.
- A cell can carry the figure behind its rating: `"value": "$73/month"` (from the cited page), shown under the dots.
- Exactly one option `recommended`, with `why`, consistent with the totals (or `why` says what they miss).

## Messages

- `question` / `propose` may carry `option` and `criterion`: answer with `WB reply <dir> --option <id> [--criterion <id>] "…"` so it lands in that cell's thread, or change that cell, option or constraint (a new option needs a view and scores).
- `settings` may carry `weights`: re-read them before recommending again. When the weights put another option ahead, the page offers the user a "re-check" question: keep or change the recommendation, saying why.
- Small changes: `WB set <dir> constraint:<id> confirmed=true`, `criterion:<id> weight=2`, `option:<id> recommended=true`.
- `decide` (`option`, `text` = the user's reason, `weights` used): set `"decision": {"option","why","not":{"other":"why not"},"by":"who decided, if known","at":"<ISO time>","weights":{…}}`; write a build plan in a new folder carrying the constraints, the option's view, nodes and sources; `WB open` it, add it to `links`, reply with the URL. Unconfirmed assumptions become its first step. A `decide` with `view` and no `option` means the user chose a picture no option owns: make it an option first, then the same.
