# Reference

This page lists the commands behind Walkboard, how to link into a page, where the plan format is described, and what Walkboard costs in tokens. You do not need any of this to use Walkboard, because the agent runs the commands for you. It is here for when you want to look under the hood.

## Commands

All commands are run with `node skills/walkboard/bin/walkboard.mjs`, shortened to `…` below. If you are working from a clone, run them from the repository root. Each command takes `--help` to show its options.

| Command | What it does |
|---|---|
| `… check <dir>` | Checks `plan.json`. In explain mode, it also checks that every `file:line` still exists and still holds the code it pointed at |
| `… set <dir> [plan \| step: \| node: \| constraint: \| option: \| criterion: \| source:<id>] key=value …` | Changes fields in place. `key=` removes a field, `settings.commit=auto` reaches inside an object, and `what='"0042"'` keeps digits as text |
| `… open <dir> [--no-browser]` | Starts the server, or reuses a running one, and prints the link |
| `… poll <dir> [--full] [--timeout s]` | Waits for messages from the page and prints one short JSON line for each. `--full` adds ids, times and where every box is |
| `… reply <dir> [--node id \| --step id \| --option id [--criterion id]] <text>` | Answers on the page, in the conversation of that box, step or design cell. `[[node:id]]`, `[[step:id]]`, `[[option:id]]` and `[[plan]]` become links |
| `… status <dir>` | Shows the link and the messages waiting |
| `… stop <dir>` | Stops the server |
| `… draft <dir> [clear [view] [change …]]` | Prints what was sketched in draft mode, or clears it once it is in the plan |
| `… export <dir> [--html file] [--no-code] [--no-draft] [--with-chat]` | Writes a read-only copy of the plan as one HTML file |
| `… icons` | Lists the icon names you can use for `icon` |

## Linking into a page

You can add these to a page's link to open it at a particular place:

- `&step=<id>` opens a step, and `&step=all` shows every step.
- `&view=<id>` opens a picture.
- `&node=<id>` opens a box.
- `&theme=light` or `&theme=dark` chooses the theme.

## The plan format

A plan is a single file, `plan.json`. These files describe it. They are written for agents, so they are short on purpose:

- [schema.md](../skills/walkboard/references/schema.md) describes `plan.json`.
- [views.md](../skills/walkboard/references/views.md) and the [views/](../skills/walkboard/references/views/) folder describe each kind of picture.
- [profiles/](../skills/walkboard/references/profiles/) describes each platform's kinds.

The repository has example plans you can open and read. All their data is made up.

| Example | Shows |
|---|---|
| `examples/nightly-import` | a plan |
| `examples/explain-login` | an explanation, with sample code |
| `examples/connect-vpcs` | a design |
| `examples/big-map` | a large map |
| `examples/walkboard` | the plan that built Walkboard, in Thai |

## Tokens

Walkboard is designed to be light on tokens. The page does the drawing and explaining, so the agent writes the content once and spends very little after that.

| What it costs | An explainer page written by hand | Walkboard |
|---|---|---|
| A rich plan with four pictures | 26–43 KB of HTML and SVG, rewritten on every change | about 7 KB of `plan.json`, written once. A simple plan is about 0.5 KB |
| Moving a step forward | rewriting or editing the page | one `walkboard set … step:x status=review`, about 90 bytes |
| Showing code in explain mode | pasting the code | `file:line` and the lines to mark. The server reads the code |
| Explaining common terms | explaining them every time | about 95 terms ship with Walkboard, in English and Thai |
| Each message from the page | — | one short line, about 100–150 bytes |
| Switching who commits | — | nothing. The agent reads the setting with its next message or step |
| Instructions loaded with the skill | — | SKILL.md is about 8.5 KB. The rest is in small files the agent reads only when it needs them. An AWS map and a review read 27 KB in all |

Every message from the page wakes the agent once, and it re-reads the conversation, mostly from cache. Settings never wake it. Only messages that need an answer cost a turn.

## Updating and uninstalling

```
/plugin marketplace update walkboard
/plugin uninstall walkboard@walkboard
```

If you installed Walkboard by hand, pull again to update, or delete `~/.claude/skills/walkboard` to uninstall. Your plans stay in `~/.walkboard/` until you delete them.
