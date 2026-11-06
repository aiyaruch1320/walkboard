# Telling a story with a step

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

Both boxes of a move must be in one picture (`map`, `flow`…); the page opens that picture. No code to paste here either: `show` is a line or two, the rest stays in `file`.
