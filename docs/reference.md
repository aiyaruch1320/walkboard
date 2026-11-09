# Reference

[Docs](README.md) › Reference

## Commands

The skill runs these for you. From a clone, run them from the repository root.

| Command | Does |
|---|---|
| `node skills/walkboard/bin/walkboard.mjs check <dir>` | Validate `plan.json`; in explain mode, also that every `file:line` exists and still holds its `anchor` |
| `… set <dir> [plan \| step: \| node: \| constraint: \| option: \| criterion: \| source:<id>] key=value …` | Change fields in place; `key=` removes one, `settings.commit=auto` reaches inside, `what='"0042"'` keeps digits as text |
| `… open <dir> [--no-browser]` | Start or reuse the server and print the link |
| `… poll <dir> [--full] [--timeout s]` | Wait for the page; one short JSON line per message (`--full`: ids, times, every box's place) |
| `… reply <dir> [--node id \| --step id \| --option id [--criterion id]] <text>` | Answer on the page, in that box's, step's or design cell's thread. `[[node:id]]`, `[[step:id]]`, `[[option:id]]`, `[[plan]]` link to a place |
| `… status <dir>` / `… stop <dir>` | Show the link and queue / stop the server |
| `… draft <dir> [clear [view] [change …]]` | Print what was sketched, or clear it once it is in the plan |
| `… export <dir> [--html file] [--no-code] [--no-draft] [--with-chat]` | Write a read-only copy of the plan as one HTML file |
| `… icons` | List the icon names for `icon` |

Every command takes `--help`.

## Links into a page

Add `&step=<id>`, `&view=<id>`, `&node=<id>` (or `&step=all`) and `&theme=light|dark` to a page's link.

## Plan format

[schema.md](../skills/walkboard/references/schema.md) describes `plan.json`; [views.md](../skills/walkboard/references/views.md) and [views/](../skills/walkboard/references/views/) each kind of picture; [profiles/](../skills/walkboard/references/profiles/) each platform's kinds. These are written for agents, short on purpose.

Examples (all data made up): `examples/nightly-import` (plan), `examples/explain-login` (explain, with sample code), `examples/connect-vpcs` (design), `examples/big-map` (a large map), `examples/walkboard` (the plan that built Walkboard, in Thai).

## Tokens

The page does the explaining, so the agent spends tokens on content once and very little afterwards.

| Where tokens go | Hand-written explainer | Walkboard |
|---|---|---|
| A rich plan with four pictures | 26–43 KB of HTML and SVG, rewritten on every change | ~7 KB `plan.json` (compact JSON) written once; a simple plan is ~0.5 KB |
| Moving a step forward | rewrite or edit the page | `walkboard set … step:x status=review` ≈ 90 bytes |
| Code in explain mode | paste it | `file:line` + `highlight`; the server reads the excerpt |
| Common terms | explain each time | ~95 ship with Walkboard, in English and Thai |
| Each message from the page | — | one compact line, ~100–150 bytes |
| Switching who commits on the page | — | nothing: the agent is not woken; it reads the setting with its next message or step |
| Instructions loaded with the skill | — | SKILL.md ~8.5 KB; the plan format, each picture, each platform, the review guide and rarer messages in small files read only when needed. An AWS map and a review read 27 KB in all |

Every message from the page wakes the agent once, which re-reads the conversation (mostly from cache). Settings never wake it: only clicks that need an answer cost a turn.

## Update or uninstall

```
/plugin marketplace update walkboard
/plugin uninstall walkboard@walkboard
```

Installed by hand: pull again, or delete `~/.claude/skills/walkboard`. Plans stay in `~/.walkboard/` until you delete them.
